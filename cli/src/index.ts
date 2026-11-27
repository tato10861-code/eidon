import { Command } from "commander";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const VERSION = "0.2.0";
const CONFIG_PATH = join(homedir(), ".eidon", "config.json");

interface Config {
  apiKey?: string;
  baseUrl?: string;
  defaultEmployee?: string;
}

function loadConfig(): Config {
  try {
    if (existsSync(CONFIG_PATH)) {
      return JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) as Config;
    }
  } catch {
    // ignore
  }
  return {};
}

function getApiKey(opts: { key?: string }): string {
  const key = opts.key ?? process.env.EIDON_API_KEY ?? loadConfig().apiKey;
  if (!key) {
    console.error("Error: API key required. Set EIDON_API_KEY or run: eidon login");
    process.exit(1);
  }
  return key;
}

function validateUrl(raw: string, label: string): string {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") {
      console.error(`Error: ${label} must use http or https`);
      process.exit(1);
    }
    return u.origin;
  } catch {
    console.error(`Error: ${label} is not a valid URL`);
    process.exit(1);
  }
}

function getBaseUrl(opts: { url?: string }): string {
  const raw = opts.url ?? process.env.EIDON_BASE_URL ?? loadConfig().baseUrl ?? "https://eidon.ai";
  return validateUrl(raw, "Base URL");
}

const program = new Command();

program
  .name("eidon")
  .description("Eidon AI employee platform CLI")
  .version(VERSION)
  .option("-k, --key <key>", "API key (overrides EIDON_API_KEY env)")
  .option("-u, --url <url>", "Base URL (overrides EIDON_BASE_URL env)");

program
  .command("health")
  .description("Check service health")
  .action(async () => {
    const opts = program.opts<{ url?: string; key?: string }>();
    const baseUrl = getBaseUrl(opts);
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  });

program
  .command("employees")
  .description("List available AI employees")
  .action(async () => {
    const opts = program.opts<{ url?: string; key?: string }>();
    const key = getApiKey(opts);
    const baseUrl = getBaseUrl(opts);
    const res = await fetch(`${baseUrl}/api/employees`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      console.error(`Error: HTTP ${res.status}`);
      process.exit(1);
    }
    const { employees } = (await res.json()) as {
      employees: { id: string; name: string; role: string }[];
    };
    console.log("\nEmployees:");
    for (const e of employees) {
      console.log(`  ${e.id.padEnd(20)} ${e.name.padEnd(20)} ${e.role}`);
    }
  });

program
  .command("chat <message>")
  .description("Send a chat message to an employee")
  .option("-e, --employee <id>", "Employee ID")
  .option("-c, --conversation <id>", "Conversation ID for context")
  .option("--no-stream", "Collect full response before printing")
  .action(
    async (
      message: string,
      cmdOpts: { employee?: string; conversation?: string; stream: boolean },
    ) => {
      const opts = program.opts<{ url?: string; key?: string }>();
      const key = getApiKey(opts);
      const baseUrl = getBaseUrl(opts);
      const config = loadConfig();

      const body = {
        messages: [{ role: "user", content: message }],
        employeeId: cmdOpts.employee ?? config.defaultEmployee,
        conversationId: cmdOpts.conversation,
      };

      const res = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "User-Agent": `eidon-cli/${VERSION}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok || !res.body) {
        console.error(`Error: HTTP ${res.status}`);
        process.exit(1);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const event = JSON.parse(raw) as { type: string; text?: string };
            if (event.type === "delta" && event.text && cmdOpts.stream !== false) {
              process.stdout.write(event.text);
            }
            if (event.type === "done") process.stdout.write("\n");
          } catch {
            // skip
          }
        }
      }
    },
  );

program
  .command("usage")
  .description("Show usage analytics")
  .option("-w, --workspace <id>", "Workspace ID")
  .action(async (cmdOpts: { workspace?: string }) => {
    const opts = program.opts<{ url?: string; key?: string }>();
    const key = getApiKey(opts);
    const baseUrl = getBaseUrl(opts);
    const qs = cmdOpts.workspace ? `?workspaceId=${cmdOpts.workspace}` : "";
    const res = await fetch(`${baseUrl}/api/usage${qs}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      console.error(`Error: HTTP ${res.status}`);
      process.exit(1);
    }
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  });

program
  .command("webhooks")
  .description("Manage webhooks")
  .addCommand(
    new Command("list").description("List webhooks").action(async () => {
      const opts = program.opts<{ url?: string; key?: string }>();
      const key = getApiKey(opts);
      const baseUrl = getBaseUrl(opts);
      const res = await fetch(`${baseUrl}/api/webhooks`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));
    }),
  )
  .addCommand(
    new Command("create")
      .description("Create a webhook")
      .requiredOption("--url <url>", "Target URL")
      .option("--events <events>", "Comma-separated event types", "chat.completed")
      .action(async (cmdOpts: { url: string; events: string }) => {
        const opts = program.opts<{ url?: string; key?: string }>();
        const key = getApiKey(opts);
        const baseUrl = getBaseUrl(opts);
        const webhookUrl = validateUrl(cmdOpts.url, "Webhook URL");
        const res = await fetch(`${baseUrl}/api/webhooks`, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url: webhookUrl, events: cmdOpts.events.split(",") }),
        });
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
      }),
  );

program.parse();

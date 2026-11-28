import { Command } from "commander";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const VERSION = "0.3.0";
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

// ─── Members ────────────────────────────────────────────────────────────────

program
  .command("members")
  .description("Manage workspace members (RBAC)")
  .addCommand(
    new Command("list")
      .description("List workspace members")
      .requiredOption("-w, --workspace <id>", "Workspace ID")
      .option("--admin-key <key>", "Admin API key (overrides EIDON_ADMIN_KEY env)")
      .action(async (cmdOpts: { workspace: string; adminKey?: string }) => {
        const opts = program.opts<{ url?: string }>();
        const baseUrl = getBaseUrl(opts);
        const adminKey = cmdOpts.adminKey ?? process.env.EIDON_ADMIN_KEY;
        if (!adminKey) {
          console.error("Error: admin key required. Set EIDON_ADMIN_KEY or use --admin-key");
          process.exit(1);
        }
        const res = await fetch(
          `${baseUrl}/api/workspaces/members?workspaceId=${encodeURIComponent(cmdOpts.workspace)}`,
          { headers: { "x-admin-key": adminKey } },
        );
        const data = (await res.json()) as {
          members: { email: string; role: string; joined_at: string | null }[];
        };
        if (!res.ok) {
          console.error(JSON.stringify(data));
          process.exit(1);
        }
        console.log("\nMembers:");
        for (const m of data.members ?? []) {
          console.log(`  ${m.email.padEnd(32)} ${m.role.padEnd(10)} ${m.joined_at ?? "pending"}`);
        }
      }),
  )
  .addCommand(
    new Command("invite")
      .description("Invite a member to a workspace")
      .requiredOption("-w, --workspace <id>", "Workspace ID")
      .requiredOption("-e, --email <email>", "Email address")
      .option("-r, --role <role>", "Role (admin|member|viewer)", "member")
      .option("--admin-key <key>", "Admin API key")
      .action(
        async (cmdOpts: { workspace: string; email: string; role: string; adminKey?: string }) => {
          const opts = program.opts<{ url?: string }>();
          const baseUrl = getBaseUrl(opts);
          const adminKey = cmdOpts.adminKey ?? process.env.EIDON_ADMIN_KEY;
          if (!adminKey) {
            console.error("Error: admin key required");
            process.exit(1);
          }
          const res = await fetch(`${baseUrl}/api/workspaces/members`, {
            method: "POST",
            headers: { "x-admin-key": adminKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              workspaceId: cmdOpts.workspace,
              email: cmdOpts.email,
              role: cmdOpts.role,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            console.error(JSON.stringify(data));
            process.exit(1);
          }
          console.log(`✓ Invited ${cmdOpts.email} as ${cmdOpts.role}`);
        },
      ),
  );

// ─── Audit log ───────────────────────────────────────────────────────────────

program
  .command("audit")
  .description("View workspace audit log")
  .requiredOption("-w, --workspace <id>", "Workspace ID")
  .option("--limit <n>", "Number of events (max 100)", "25")
  .option("--action <filter>", "Filter by action type")
  .option("--admin-key <key>", "Admin API key")
  .action(
    async (cmdOpts: { workspace: string; limit: string; action?: string; adminKey?: string }) => {
      const opts = program.opts<{ url?: string }>();
      const baseUrl = getBaseUrl(opts);
      const adminKey = cmdOpts.adminKey ?? process.env.EIDON_ADMIN_KEY;
      if (!adminKey) {
        console.error("Error: admin key required");
        process.exit(1);
      }
      const params = new URLSearchParams({
        workspaceId: cmdOpts.workspace,
        limit: cmdOpts.limit,
        ...(cmdOpts.action ? { action: cmdOpts.action } : {}),
      });
      const res = await fetch(`${baseUrl}/api/audit?${params}`, {
        headers: { "x-admin-key": adminKey },
      });
      const data = (await res.json()) as {
        events: { action: string; actor: string; target: string | null; created_at: string }[];
      };
      if (!res.ok) {
        console.error(JSON.stringify(data));
        process.exit(1);
      }
      console.log("\nAudit log:");
      for (const e of data.events ?? []) {
        const ts = new Date(e.created_at).toISOString().replace("T", " ").slice(0, 19);
        console.log(`  ${ts}  ${e.action.padEnd(28)} ${e.actor.padEnd(20)} ${e.target ?? ""}`);
      }
    },
  );

// ─── API keys ────────────────────────────────────────────────────────────────

program
  .command("keys")
  .description("Manage API keys")
  .addCommand(
    new Command("list")
      .description("List API keys for a workspace")
      .requiredOption("-w, --workspace <id>", "Workspace ID")
      .option("--admin-key <key>", "Admin API key")
      .action(async (cmdOpts: { workspace: string; adminKey?: string }) => {
        const opts = program.opts<{ url?: string }>();
        const baseUrl = getBaseUrl(opts);
        const adminKey = cmdOpts.adminKey ?? process.env.EIDON_ADMIN_KEY;
        if (!adminKey) {
          console.error("Error: admin key required");
          process.exit(1);
        }
        const res = await fetch(
          `${baseUrl}/api/keys?workspaceId=${encodeURIComponent(cmdOpts.workspace)}`,
          { headers: { "x-admin-key": adminKey } },
        );
        const data = await res.json();
        if (!res.ok) {
          console.error(JSON.stringify(data));
          process.exit(1);
        }
        console.log(JSON.stringify(data, null, 2));
      }),
  )
  .addCommand(
    new Command("create")
      .description("Create an API key")
      .requiredOption("-w, --workspace <id>", "Workspace ID")
      .requiredOption("--name <name>", "Key name / label")
      .option("--scopes <scopes>", "Comma-separated scopes", "chat:read,chat:write")
      .option("--admin-key <key>", "Admin API key")
      .action(
        async (cmdOpts: { workspace: string; name: string; scopes: string; adminKey?: string }) => {
          const opts = program.opts<{ url?: string }>();
          const baseUrl = getBaseUrl(opts);
          const adminKey = cmdOpts.adminKey ?? process.env.EIDON_ADMIN_KEY;
          if (!adminKey) {
            console.error("Error: admin key required");
            process.exit(1);
          }
          const res = await fetch(`${baseUrl}/api/keys`, {
            method: "POST",
            headers: { "x-admin-key": adminKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              workspaceId: cmdOpts.workspace,
              name: cmdOpts.name,
              scopes: cmdOpts.scopes.split(","),
            }),
          });
          const data = (await res.json()) as { key?: string; id?: string };
          if (!res.ok) {
            console.error(JSON.stringify(data));
            process.exit(1);
          }
          if (data.key) {
            console.log(
              `✓ API key created. Store this — it won't be shown again:\n\n  ${data.key}\n`,
            );
          } else {
            console.log(JSON.stringify(data, null, 2));
          }
        },
      ),
  );

// ─── Compliance export ───────────────────────────────────────────────────────

program
  .command("export")
  .description("Run a GDPR/CCPA data export (DSAR)")
  .requiredOption("-w, --workspace <id>", "Workspace ID")
  .requiredOption("--requested-by <actor>", "Who is requesting (email/id)")
  .option(
    "--scope <scope>",
    "Comma-separated: conversations,employees,audit,members,api_keys,usage",
    "conversations,employees,audit,members,api_keys,usage",
  )
  .option("--out <file>", "Output file path (default: stdout)")
  .option("--admin-key <key>", "Admin API key")
  .action(
    async (cmdOpts: {
      workspace: string;
      requestedBy: string;
      scope: string;
      out?: string;
      adminKey?: string;
    }) => {
      const opts = program.opts<{ url?: string }>();
      const baseUrl = getBaseUrl(opts);
      const adminKey = cmdOpts.adminKey ?? process.env.EIDON_ADMIN_KEY;
      if (!adminKey) {
        console.error("Error: admin key required");
        process.exit(1);
      }
      const res = await fetch(`${baseUrl}/api/compliance/export`, {
        method: "POST",
        headers: { "x-admin-key": adminKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: cmdOpts.workspace,
          requestedBy: cmdOpts.requestedBy,
          scope: cmdOpts.scope.split(","),
        }),
      });
      if (!res.ok) {
        console.error(`Error: HTTP ${res.status}`);
        process.exit(1);
      }
      const json = JSON.stringify(await res.json(), null, 2);
      if (cmdOpts.out) {
        const { writeFileSync } = await import("node:fs");
        writeFileSync(cmdOpts.out, json);
        console.log(`✓ Export written to ${cmdOpts.out}`);
      } else {
        console.log(json);
      }
    },
  );

// ─── Security ────────────────────────────────────────────────────────────────

program
  .command("security")
  .description("Manage workspace security settings")
  .addCommand(
    new Command("allowlist")
      .description("Get IP allowlist for a workspace")
      .requiredOption("-w, --workspace <id>", "Workspace ID")
      .option("--admin-key <key>", "Admin API key")
      .action(async (cmdOpts: { workspace: string; adminKey?: string }) => {
        const opts = program.opts<{ url?: string }>();
        const baseUrl = getBaseUrl(opts);
        const adminKey = cmdOpts.adminKey ?? process.env.EIDON_ADMIN_KEY;
        if (!adminKey) {
          console.error("Error: admin key required");
          process.exit(1);
        }
        const res = await fetch(
          `${baseUrl}/api/security/allowlist?workspaceId=${encodeURIComponent(cmdOpts.workspace)}`,
          { headers: { "x-admin-key": adminKey } },
        );
        const data = (await res.json()) as { allowlist: string[]; unrestricted: boolean };
        if (!res.ok) {
          console.error(JSON.stringify(data));
          process.exit(1);
        }
        if (data.unrestricted) {
          console.log("IP allowlist: unrestricted (all IPs allowed)");
        } else {
          console.log("Allowed IPs/CIDRs:");
          for (const ip of data.allowlist) console.log(`  ${ip}`);
        }
      }),
  )
  .addCommand(
    new Command("sessions")
      .description("List or revoke active sessions")
      .requiredOption("-w, --workspace <id>", "Workspace ID")
      .option("--revoke-all", "Revoke all sessions in the workspace")
      .option("--revoke <id>", "Revoke a specific session by ID")
      .option("--admin-key <key>", "Admin API key")
      .action(
        async (cmdOpts: {
          workspace: string;
          revokeAll?: boolean;
          revoke?: string;
          adminKey?: string;
        }) => {
          const opts = program.opts<{ url?: string }>();
          const baseUrl = getBaseUrl(opts);
          const adminKey = cmdOpts.adminKey ?? process.env.EIDON_ADMIN_KEY;
          if (!adminKey) {
            console.error("Error: admin key required");
            process.exit(1);
          }

          if (cmdOpts.revoke) {
            const res = await fetch(
              `${baseUrl}/api/security/sessions?sessionId=${encodeURIComponent(cmdOpts.revoke)}`,
              { method: "DELETE", headers: { "x-admin-key": adminKey } },
            );
            const data = await res.json();
            if (!res.ok) {
              console.error(JSON.stringify(data));
              process.exit(1);
            }
            console.log(`✓ Session ${cmdOpts.revoke} revoked`);
            return;
          }

          if (cmdOpts.revokeAll) {
            const res = await fetch(
              `${baseUrl}/api/security/sessions?workspaceId=${encodeURIComponent(cmdOpts.workspace)}&all=1`,
              { method: "DELETE", headers: { "x-admin-key": adminKey } },
            );
            const data = (await res.json()) as { revoked?: number };
            if (!res.ok) {
              console.error(JSON.stringify(data));
              process.exit(1);
            }
            console.log(`✓ Revoked ${data.revoked ?? 0} sessions`);
            return;
          }

          const res = await fetch(
            `${baseUrl}/api/security/sessions?workspaceId=${encodeURIComponent(cmdOpts.workspace)}`,
            { headers: { "x-admin-key": adminKey } },
          );
          const data = (await res.json()) as {
            sessions: {
              id: string;
              user_id: string;
              ip_address: string | null;
              last_active_at: string;
            }[];
          };
          if (!res.ok) {
            console.error(JSON.stringify(data));
            process.exit(1);
          }
          console.log("\nActive sessions:");
          for (const s of data.sessions ?? []) {
            const ts = new Date(s.last_active_at).toISOString().slice(0, 19).replace("T", " ");
            console.log(
              `  ${s.id.slice(0, 8)}…  ${s.user_id.slice(0, 8)}…  ${(s.ip_address ?? "unknown").padEnd(16)} last-active: ${ts}`,
            );
          }
        },
      ),
  );

program.parse();

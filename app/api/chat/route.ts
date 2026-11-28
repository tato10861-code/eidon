import type { NextRequest } from "next/server";
import { resolveEmployee, runEmployee } from "@/lib/ai/engine";
import { rateLimit } from "@/lib/rate-limit";
import { getNeon } from "@/lib/neon";
import { recordChat } from "@/lib/usage";
import type { EmployeeConfig } from "@/lib/types";
import { accessError, authorizeWorkspace } from "@/lib/auth/authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ChatBody {
  employeeId?: string;
  workspaceId?: string;
  conversationId?: string;
  messages?: { role?: string; content?: string }[];
  config?: Partial<EmployeeConfig>;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local";

  const limit = rateLimit(`chat:${ip}`, 40, 60_000);
  if (!limit.ok) {
    return Response.json(
      { error: "Too many requests. Try again in a moment." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfter) },
      },
    );
  }

  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string",
    )
    .slice(-24)
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: (message.content as string).slice(0, 8_000),
    }));

  if (!messages.length) {
    return Response.json({ error: "At least one message is required." }, { status: 400 });
  }

  const employee = resolveEmployee(body.employeeId ?? "ava", body.config);
  const workspaceId = body.workspaceId ?? "demo";
  try {
    await authorizeWorkspace(request, workspaceId, "chat:write");
  } catch (error) {
    return accessError(error);
  }
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      let fullReply = "";
      let totalTokens = 0;

      try {
        for await (const event of runEmployee({
          employee,
          messages,
          config: body.config,
        })) {
          send(event);
          if (event.type === "delta") fullReply += event.text;
          if (event.type === "done") totalTokens = event.usage.tokens;
        }

        // Persist to Neon when conversation ID is provided
        const sql = getNeon();
        if (sql && body.conversationId && fullReply) {
          const lastUser = messages.at(-1);
          try {
            if (lastUser) {
              await sql`
                insert into messages (conversation_id, role, content)
                values (${body.conversationId}, ${lastUser.role}, ${lastUser.content})
              `;
            }
            await sql`
              insert into messages (conversation_id, role, content)
              values (${body.conversationId}, 'assistant', ${fullReply})
            `;
          } catch {
            // Non-fatal: persistence failure should not break the stream
          }
        }

        recordChat(workspaceId, totalTokens, employee.id);
      } catch {
        send({
          type: "error",
          message: "The employee hit an error. Please try again.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

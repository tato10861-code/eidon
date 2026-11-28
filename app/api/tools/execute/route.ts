import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { accessError, authorizeWorkspace } from "@/lib/auth/authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ToolRequest {
  workspaceId?: string;
  tool: string;
  action: string;
  params?: Record<string, unknown>;
  approved?: boolean;
}

// Actions that require human approval before execution.
const APPROVAL_REQUIRED = new Set(["refund", "delete", "send", "write", "update"]);

export async function POST(request: NextRequest) {
  let body: ToolRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.tool || !body.action || !body.workspaceId) {
    return NextResponse.json({ error: "tool and action are required." }, { status: 400 });
  }

  let principal;
  try {
    principal = await authorizeWorkspace(request, body.workspaceId, "chat:write");
  } catch (error) {
    return accessError(error);
  }

  const needsApproval = APPROVAL_REQUIRED.has(body.action.toLowerCase());

  if (
    needsApproval &&
    !(
      body.approved &&
      principal.kind === "demo" &&
      process.env.EIDON_ALLOW_DEMO_TOOL_APPROVAL === "true"
    )
  ) {
    return NextResponse.json(
      {
        status: "approval_required",
        tool: body.tool,
        action: body.action,
        message: "This action requires human approval before execution.",
      },
      { status: 202 },
    );
  }

  // Demo execution: returns a structured result. Real execution would call the
  // provider API with the stored OAuth token.
  return NextResponse.json({
    status: "executed",
    tool: body.tool,
    action: body.action,
    result: {
      ok: true,
      mode: "demo",
      summary: `Executed ${body.action} on ${body.tool} (demo).`,
    },
    executedAt: new Date().toISOString(),
  });
}

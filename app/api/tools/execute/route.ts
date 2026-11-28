import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { accessError, authorizeWorkspace } from "@/lib/auth/authorization";
import { consumeApprovalToken, issueApprovalToken, ApprovalDenied } from "@/lib/approvals";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ToolRequest {
  workspaceId?: string;
  tool: string;
  action: string;
  params?: Record<string, unknown>;
  approvalToken?: string;
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

  if (needsApproval && !body.approvalToken) {
    const approval = await issueApprovalToken({
      workspaceId: body.workspaceId,
      actor: principal.subject,
      tool: body.tool,
      action: body.action,
      params: body.params,
    });
    await writeAudit({
      workspaceId: body.workspaceId,
      actor: principal.subject,
      action: "tool.approval_requested",
      target: `${body.tool}:${body.action}`,
      outcome: "requested",
      payload: { params: body.params },
    });
    return NextResponse.json(
      {
        status: "approval_required",
        tool: body.tool,
        action: body.action,
        approvalToken: approval.token,
        approvalExpiresAt: new Date(approval.expiresAt).toISOString(),
        message: "This action requires human approval before execution.",
      },
      { status: 202 },
    );
  }

  if (needsApproval) {
    try {
      await consumeApprovalToken({
        token: body.approvalToken!,
        workspaceId: body.workspaceId,
        actor: principal.subject,
        tool: body.tool,
        action: body.action,
        params: body.params,
      });
    } catch (error) {
      if (error instanceof ApprovalDenied) {
        await writeAudit({
          workspaceId: body.workspaceId,
          actor: principal.subject,
          action: "tool.approval_rejected",
          target: `${body.tool}:${body.action}`,
          outcome: "rejected",
          payload: { code: error.code },
        });
        return NextResponse.json({ error: error.message, code: error.code }, { status: 403 });
      }
      return NextResponse.json({ error: "Approval store unavailable." }, { status: 503 });
    }
  }

  await writeAudit({
    workspaceId: body.workspaceId,
    actor: principal.subject,
    action: "tool.executed",
    target: `${body.tool}:${body.action}`,
    outcome: "executed",
    payload: { params: body.params },
  });

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

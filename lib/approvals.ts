import crypto from "node:crypto";
import { getNeon } from "@/lib/neon";
import { getSupabase } from "@/lib/supabase";

interface ApprovalClaims {
  id: string;
  workspaceId: string;
  actor: string;
  tool: string;
  action: string;
  payloadHash: string;
  exp: number;
}

const fallback = new Map<string, ApprovalClaims>();

function secret() {
  return (
    process.env.EIDON_APPROVAL_SECRET ?? process.env.EIDON_AUTH_SECRET ?? "demo-approval-secret"
  );
}

function digest(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

function constantTimeEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

export class ApprovalDenied extends Error {
  constructor(readonly code: "invalid" | "expired" | "used" | "mismatch") {
    super("Approval token is invalid or no longer usable.");
  }
}

export async function issueApprovalToken(input: {
  workspaceId: string;
  actor: string;
  tool: string;
  action: string;
  params?: Record<string, unknown>;
  ttlMs?: number;
}) {
  const claims: ApprovalClaims = {
    id: crypto.randomUUID(),
    workspaceId: input.workspaceId,
    actor: input.actor,
    tool: input.tool,
    action: input.action,
    payloadHash: digest(JSON.stringify(input.params ?? {})),
    exp: Date.now() + Math.min(Math.max(input.ttlMs ?? 5 * 60_000, 30_000), 15 * 60_000),
  };
  const encoded = encode(JSON.stringify(claims));
  const token = `${encoded}.${sign(encoded)}`;
  fallback.set(claims.id, claims);

  const supabase = await getSupabase();
  if (supabase) {
    await supabase.from("approval_tokens").insert({
      id: claims.id,
      workspace_id: claims.workspaceId,
      actor: claims.actor,
      tool: claims.tool,
      action: claims.action,
      payload_hash: claims.payloadHash,
      token_hash: digest(token),
      expires_at: new Date(claims.exp).toISOString(),
    });
  } else {
    const sql = getNeon();
    if (sql) {
      await sql`
        insert into approval_tokens (id, workspace_id, actor, tool, action, payload_hash, token_hash, expires_at)
        values (${claims.id}, ${claims.workspaceId}, ${claims.actor}, ${claims.tool}, ${claims.action}, ${claims.payloadHash}, ${digest(token)}, ${new Date(claims.exp).toISOString()})
      `;
    }
  }
  return { token, expiresAt: claims.exp };
}

export async function consumeApprovalToken(input: {
  token: string;
  workspaceId: string;
  actor: string;
  tool: string;
  action: string;
  params?: Record<string, unknown>;
}) {
  const [encoded, signature] = input.token.split(".");
  if (!encoded || !signature || !constantTimeEqual(signature, sign(encoded)))
    throw new ApprovalDenied("invalid");
  let claims: ApprovalClaims;
  try {
    claims = JSON.parse(decode(encoded)) as ApprovalClaims;
  } catch {
    throw new ApprovalDenied("invalid");
  }
  if (claims.exp <= Date.now()) throw new ApprovalDenied("expired");
  if (
    claims.workspaceId !== input.workspaceId ||
    claims.actor !== input.actor ||
    claims.tool !== input.tool ||
    claims.action !== input.action ||
    claims.payloadHash !== digest(JSON.stringify(input.params ?? {}))
  )
    throw new ApprovalDenied("mismatch");

  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("approval_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", claims.id)
      .eq("workspace_id", input.workspaceId)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .select("id");
    if (error) throw error;
    if (!data?.length) throw new ApprovalDenied("used");
  } else {
    const sql = getNeon();
    if (sql) {
      const rows = await sql`
        update approval_tokens set used_at = now()
        where id = ${claims.id} and workspace_id = ${input.workspaceId} and used_at is null and expires_at > now()
        returning id
      `;
      if (!(rows as { id: string }[]).length) throw new ApprovalDenied("used");
    } else {
      if (!fallback.delete(claims.id)) throw new ApprovalDenied("used");
    }
  }
  fallback.delete(claims.id);
  return claims;
}

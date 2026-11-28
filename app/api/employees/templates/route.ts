/**
 * AI Employee Templates — reusable base configurations.
 *
 * Enterprise buyers build libraries of tested, branded employee personas
 * that can be cloned across workspaces. Templates are workspace-scoped
 * or public (workspace_id IS NULL).
 *
 * GET    /api/employees/templates                     — list templates
 * GET    /api/employees/templates?templateId=         — get one template
 * POST   /api/employees/templates                     — create template
 * POST   /api/employees/templates  {action:"clone"}   — clone to workspace
 * DELETE /api/employees/templates?templateId=         — delete template
 */

import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdminKey(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;
  return key === expected;
}

/** Canonical template fields for validation. */
interface EmployeeTemplate {
  id: string;
  workspaceId: string | null;
  name: string;
  description: string | null;
  role: string;
  systemPrompt: string;
  model: string | null;
  temperature: number | null;
  tools: string[];
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const templateId = url.searchParams.get("templateId");

  const neon = getNeon();
  if (!neon) {
    return Response.json({ templates: [] });
  }

  if (templateId) {
    type Row = {
      id: string;
      workspace_id: string | null;
      name: string;
      description: string | null;
      role: string;
      system_prompt: string;
      model: string | null;
      temperature: number | null;
      tools: unknown;
      tags: unknown;
      is_public: boolean;
      created_at: string;
      updated_at: string;
    };
    const rows = (await neon`
      SELECT id, workspace_id, name, description, role, system_prompt, model, temperature,
             tools, tags, is_public, created_at, updated_at
      FROM employee_templates WHERE id = ${templateId} LIMIT 1
    `) as unknown as Row[];

    if (!rows.length) return Response.json({ error: "Template not found" }, { status: 404 });
    const r = rows[0];
    return Response.json(toTemplate(r));
  }

  type ListRow = {
    id: string;
    workspace_id: string | null;
    name: string;
    description: string | null;
    role: string;
    model: string | null;
    tags: unknown;
    is_public: boolean;
    created_at: string;
  };

  const rows = (await neon`
    SELECT id, workspace_id, name, description, role, model, tags, is_public, created_at
    FROM employee_templates
    WHERE (workspace_id = ${workspaceId ?? null} OR is_public = true)
    ORDER BY is_public DESC, created_at DESC
    LIMIT 100
  `) as unknown as ListRow[];

  return Response.json({
    templates: rows.map((r) => ({
      id: r.id,
      workspaceId: r.workspace_id,
      name: r.name,
      description: r.description,
      role: r.role,
      model: r.model,
      tags: Array.isArray(r.tags) ? r.tags : [],
      isPublic: r.is_public,
      createdAt: r.created_at,
    })),
  });
}

function toTemplate(r: {
  id: string;
  workspace_id: string | null;
  name: string;
  description: string | null;
  role: string;
  system_prompt: string;
  model: string | null;
  temperature: number | null;
  tools: unknown;
  tags: unknown;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}): EmployeeTemplate {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    name: r.name,
    description: r.description,
    role: r.role,
    systemPrompt: r.system_prompt,
    model: r.model,
    temperature: r.temperature,
    tools: Array.isArray(r.tools) ? (r.tools as string[]) : [],
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    isPublic: r.is_public,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function POST(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  // --- Clone action ---
  if (body.action === "clone") {
    const { templateId, targetWorkspaceId, name } = body as {
      templateId?: string;
      targetWorkspaceId?: string;
      name?: string;
    };

    if (!templateId || !targetWorkspaceId) {
      return Response.json(
        { error: "templateId and targetWorkspaceId are required" },
        { status: 400 },
      );
    }

    type Row = {
      workspace_id: string | null;
      name: string;
      description: string | null;
      role: string;
      system_prompt: string;
      model: string | null;
      temperature: number | null;
      tools: unknown;
      tags: unknown;
    };
    const tRows = (await neon`
      SELECT workspace_id, name, description, role, system_prompt, model, temperature, tools, tags
      FROM employee_templates WHERE id = ${templateId} LIMIT 1
    `) as unknown as Row[];

    if (!tRows.length) return Response.json({ error: "Template not found" }, { status: 404 });

    const t = tRows[0];
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await neon`
      INSERT INTO employees (id, workspace_id, name, description, role, system_prompt, model,
                             temperature, tools, created_at, updated_at)
      VALUES (${id}, ${targetWorkspaceId}, ${name ?? t.name}, ${t.description ?? null},
              ${t.role}, ${t.system_prompt}, ${t.model ?? null}, ${t.temperature ?? null},
              ${JSON.stringify(t.tools ?? [])}::jsonb, ${now}, ${now})
    `;

    try {
      await neon`
        INSERT INTO audit_log (workspace_id, actor, action, target, payload)
        VALUES (${targetWorkspaceId}, 'api', 'employee.created', ${name ?? t.name},
                ${JSON.stringify({ fromTemplate: templateId })}::jsonb)
      `;
    } catch {
      /* non-fatal */
    }

    return Response.json({ ok: true, employeeId: id, name: name ?? t.name }, { status: 201 });
  }

  // --- Create new template ---
  const {
    workspaceId,
    name,
    description,
    role,
    systemPrompt,
    model,
    temperature,
    tools,
    tags,
    isPublic,
  } = body as {
    workspaceId?: string;
    name?: string;
    description?: string;
    role?: string;
    systemPrompt?: string;
    model?: string;
    temperature?: number;
    tools?: string[];
    tags?: string[];
    isPublic?: boolean;
  };

  if (!name || !role || !systemPrompt) {
    return Response.json({ error: "name, role, and systemPrompt are required" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await neon`
    INSERT INTO employee_templates (id, workspace_id, name, description, role, system_prompt,
                                    model, temperature, tools, tags, is_public, created_at, updated_at)
    VALUES (${id}, ${workspaceId ?? null}, ${name}, ${description ?? null}, ${role},
            ${systemPrompt}, ${model ?? null}, ${temperature ?? null},
            ${JSON.stringify(tools ?? [])}::jsonb, ${JSON.stringify(tags ?? [])}::jsonb,
            ${isPublic ?? false}, ${now}, ${now})
  `;

  return Response.json(
    {
      id,
      workspaceId: workspaceId ?? null,
      name,
      description: description ?? null,
      role,
      systemPrompt,
      model: model ?? null,
      temperature: temperature ?? null,
      tools: tools ?? [],
      tags: tags ?? [],
      isPublic: isPublic ?? false,
      createdAt: now,
      updatedAt: now,
    } satisfies EmployeeTemplate,
    { status: 201 },
  );
}

export async function DELETE(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const templateId = url.searchParams.get("templateId");
  if (!templateId) return Response.json({ error: "templateId is required" }, { status: 400 });

  const neon = getNeon();
  if (!neon) return Response.json({ error: "Database not configured" }, { status: 503 });

  await neon`DELETE FROM employee_templates WHERE id = ${templateId}`;
  return Response.json({ ok: true });
}

/**
 * Fine-tuning job management API.
 *
 * Enterprise buyers use this to continuously improve AI employees on their
 * own conversational data — higher accuracy, domain-specific vocabulary,
 * brand-aligned tone.
 *
 * POST /api/fine-tuning  — submit a job
 * GET  /api/fine-tuning  — list jobs for a workspace
 * GET  /api/fine-tuning?jobId=  — get a single job
 * DELETE /api/fine-tuning?jobId= — cancel a pending/running job
 *
 * Job lifecycle: pending → queued → running → completed | failed | cancelled
 *
 * Data sources accepted:
 *   - conversation_export: JSON export from /api/export (auto-converted)
 *   - jsonl: JSONL file with {messages:[{role,content}]} objects
 *   - raw: list of training examples inline in the request body
 */

import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdminKey(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;
  return key === expected;
}

type JobStatus = "pending" | "queued" | "running" | "completed" | "failed" | "cancelled";

interface FineTuningJob {
  id: string;
  workspaceId: string;
  employeeId?: string;
  baseModel: string;
  dataSource: "conversation_export" | "jsonl" | "raw";
  trainingExamplesCount?: number;
  validationExamplesCount?: number;
  status: JobStatus;
  statusMessage?: string;
  hyperparameters: {
    nEpochs?: number;
    batchSize?: number;
    learningRateMultiplier?: number;
  };
  resultModel?: string;
  errorCode?: string;
  startedAt?: string;
  finishedAt?: string;
  estimatedFinishAt?: string;
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const jobId = url.searchParams.get("jobId");
  const status = url.searchParams.get("status") as JobStatus | null;
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  if (jobId) {
    type Row = {
      id: string;
      workspace_id: string;
      employee_id: string | null;
      base_model: string;
      data_source: string;
      training_examples_count: number | null;
      validation_examples_count: number | null;
      status: string;
      status_message: string | null;
      hyperparameters: unknown;
      result_model: string | null;
      error_code: string | null;
      started_at: string | null;
      finished_at: string | null;
      estimated_finish_at: string | null;
      created_at: string;
      updated_at: string;
    };
    const rows = (await neon`
      SELECT * FROM fine_tuning_jobs WHERE id = ${jobId} LIMIT 1
    `) as unknown as Row[];

    if (!rows.length) {
      return Response.json({ error: "Job not found" }, { status: 404 });
    }
    return Response.json({ job: formatJob(rows[0]) });
  }

  if (!workspaceId) {
    return Response.json({ error: "workspaceId or jobId is required" }, { status: 400 });
  }

  type Row = {
    id: string;
    workspace_id: string;
    employee_id: string | null;
    base_model: string;
    data_source: string;
    training_examples_count: number | null;
    validation_examples_count: number | null;
    status: string;
    status_message: string | null;
    hyperparameters: unknown;
    result_model: string | null;
    error_code: string | null;
    started_at: string | null;
    finished_at: string | null;
    estimated_finish_at: string | null;
    created_at: string;
    updated_at: string;
    total_count: string;
  };

  const rows = status
    ? ((await neon`
        SELECT *, COUNT(*) OVER() AS total_count FROM fine_tuning_jobs
        WHERE workspace_id = ${workspaceId} AND status = ${status}
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `) as unknown as Row[])
    : ((await neon`
        SELECT *, COUNT(*) OVER() AS total_count FROM fine_tuning_jobs
        WHERE workspace_id = ${workspaceId}
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `) as unknown as Row[]);

  const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;

  return Response.json({
    jobs: rows.map(formatJob),
    pagination: { total, limit, offset, hasMore: offset + limit < total },
  });
}

export async function POST(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    workspaceId?: string;
    employeeId?: string;
    baseModel?: string;
    dataSource?: "conversation_export" | "jsonl" | "raw";
    trainingData?: unknown[];
    validationData?: unknown[];
    hyperparameters?: {
      nEpochs?: number;
      batchSize?: number;
      learningRateMultiplier?: number;
    };
    suffix?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { workspaceId, employeeId, baseModel, dataSource, trainingData, hyperparameters } = body;

  if (!workspaceId || !baseModel || !dataSource) {
    return Response.json(
      { error: "workspaceId, baseModel, and dataSource are required" },
      { status: 400 },
    );
  }

  const validSources = ["conversation_export", "jsonl", "raw"];
  if (!validSources.includes(dataSource)) {
    return Response.json(
      { error: `dataSource must be one of: ${validSources.join(", ")}` },
      { status: 422 },
    );
  }

  if (dataSource === "raw" && (!Array.isArray(trainingData) || trainingData.length === 0)) {
    return Response.json(
      { error: "trainingData is required when dataSource=raw" },
      { status: 400 },
    );
  }

  const trainingCount = Array.isArray(trainingData) ? trainingData.length : null;
  const validationCount = Array.isArray(body.validationData) ? body.validationData.length : null;

  const jobId = `ftjob_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const hp: FineTuningJob["hyperparameters"] = {
    nEpochs: hyperparameters?.nEpochs ?? 3,
    batchSize: hyperparameters?.batchSize ?? undefined,
    learningRateMultiplier: hyperparameters?.learningRateMultiplier ?? undefined,
  };
  const now = new Date().toISOString();

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  await neon`
    INSERT INTO fine_tuning_jobs (
      id, workspace_id, employee_id, base_model, data_source,
      training_examples_count, validation_examples_count,
      status, hyperparameters, created_at, updated_at
    ) VALUES (
      ${jobId}, ${workspaceId}, ${employeeId ?? null}, ${baseModel}, ${dataSource},
      ${trainingCount}, ${validationCount},
      'pending', ${JSON.stringify(hp)}::jsonb, ${now}, ${now}
    )
  `;

  await neon`
    INSERT INTO audit_log (workspace_id, actor, action, target, payload)
    VALUES (${workspaceId}, 'api', 'fine_tuning.job_created', ${jobId},
            ${JSON.stringify({ baseModel, dataSource, employeeId })}::jsonb)
  `.catch(() => {});

  return Response.json(
    {
      job: {
        id: jobId,
        workspaceId,
        employeeId: employeeId ?? undefined,
        baseModel,
        dataSource,
        trainingExamplesCount: trainingCount ?? undefined,
        validationExamplesCount: validationCount ?? undefined,
        status: "pending" as JobStatus,
        hyperparameters: hp,
        createdAt: now,
        updatedAt: now,
      } satisfies Partial<FineTuningJob>,
    },
    { status: 202 },
  );
}

export async function DELETE(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");
  if (!jobId) {
    return Response.json({ error: "jobId is required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  type Row = { id: string; status: string; workspace_id: string };
  const rows = (await neon`
    SELECT id, status, workspace_id FROM fine_tuning_jobs WHERE id = ${jobId} LIMIT 1
  `) as unknown as Row[];

  if (!rows.length) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  const job = rows[0];
  if (job.status === "completed" || job.status === "cancelled") {
    return Response.json(
      { error: `Cannot cancel a job with status '${job.status}'` },
      { status: 422 },
    );
  }

  const now = new Date().toISOString();
  await neon`
    UPDATE fine_tuning_jobs
    SET status = 'cancelled', status_message = 'Cancelled via API', updated_at = ${now}
    WHERE id = ${jobId}
  `;

  await neon`
    INSERT INTO audit_log (workspace_id, actor, action, target, payload)
    VALUES (${job.workspace_id}, 'api', 'fine_tuning.job_cancelled', ${jobId}, '{}'::jsonb)
  `.catch(() => {});

  return Response.json({ id: jobId, status: "cancelled", cancelledAt: now });
}

type RawRow = {
  id: string;
  workspace_id: string;
  employee_id: string | null;
  base_model: string;
  data_source: string;
  training_examples_count: number | null;
  validation_examples_count: number | null;
  status: string;
  status_message: string | null;
  hyperparameters: unknown;
  result_model: string | null;
  error_code: string | null;
  started_at: string | null;
  finished_at: string | null;
  estimated_finish_at: string | null;
  created_at: string;
  updated_at: string;
};

function formatJob(row: RawRow): FineTuningJob {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    employeeId: row.employee_id ?? undefined,
    baseModel: row.base_model,
    dataSource: row.data_source as FineTuningJob["dataSource"],
    trainingExamplesCount: row.training_examples_count ?? undefined,
    validationExamplesCount: row.validation_examples_count ?? undefined,
    status: row.status as JobStatus,
    statusMessage: row.status_message ?? undefined,
    hyperparameters: (row.hyperparameters as FineTuningJob["hyperparameters"]) ?? {},
    resultModel: row.result_model ?? undefined,
    errorCode: row.error_code ?? undefined,
    startedAt: row.started_at ?? undefined,
    finishedAt: row.finished_at ?? undefined,
    estimatedFinishAt: row.estimated_finish_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * AI Evals API — run structured evaluations on AI employee responses.
 *
 * GET    /api/evals?workspaceId=&suiteId=  — list eval suites / get one suite
 * POST   /api/evals                        — create eval suite or trigger a run
 * DELETE /api/evals?suiteId=              — delete a suite
 *
 * POST body variants:
 *   { action: "create_suite", ...suite }     — save a new eval suite
 *   { action: "run_suite", suiteId, model? } — execute a suite, return results
 *   { action: "score_response", response, evalCase } — score a single response
 */

import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";
import {
  scoreCase,
  buildJudgePrompt,
  aggregateScores,
  type EvalCase,
  type EvalResult,
  type CaseResult,
  type EvalSuite,
} from "@/lib/evals/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdminKey(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;
  return key === expected;
}

/** Call the AI engine to generate a response for an eval case. */
async function generateResponse(
  messages: EvalCase["messages"],
  employeeId: string | undefined,
  model: string | undefined,
  workspaceId: string | undefined,
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": process.env.ADMIN_API_KEY ?? "",
    },
    body: JSON.stringify({
      messages,
      employeeId,
      model,
      workspaceId,
      stream: false,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    throw new Error(`AI engine returned ${response.status}`);
  }

  const data = await response.json();
  return data.content ?? data.message ?? data.response ?? "";
}

/** Call LLM judge to score a response. */
async function runLlmJudge(
  userMessage: string,
  response: string,
  rubric: string,
): Promise<{ score: number; reason: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const prompt = buildJudgePrompt(userMessage, response, rubric);

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": process.env.ADMIN_API_KEY ?? "",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        stream: false,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) return { score: 0, reason: "judge failed" };

    const data = await res.json();
    const text: string = data.content ?? data.message ?? data.response ?? "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { score: 0, reason: "unparseable judge response" };

    const parsed = JSON.parse(jsonMatch[0]) as { score?: number; reason?: string };
    return {
      score: Math.max(0, Math.min(1, Number(parsed.score ?? 0))),
      reason: parsed.reason ?? "",
    };
  } catch {
    return { score: 0, reason: "judge error" };
  }
}

export async function GET(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const suiteId = url.searchParams.get("suiteId");

  const neon = getNeon();
  if (!neon) {
    return Response.json({ suites: [] });
  }

  if (suiteId) {
    type Row = {
      id: string;
      name: string;
      description: string | null;
      employee_id: string | null;
      cases: unknown;
      created_at: string;
      updated_at: string;
    };
    const rows = (await neon`
      SELECT id, name, description, employee_id, cases, created_at, updated_at
      FROM eval_suites
      WHERE id = ${suiteId}
      ${workspaceId ? neon`AND workspace_id = ${workspaceId}` : neon``}
      LIMIT 1
    `) as unknown as Row[];

    if (!rows.length) {
      return Response.json({ error: "Suite not found" }, { status: 404 });
    }

    const r = rows[0];
    return Response.json({
      id: r.id,
      name: r.name,
      description: r.description,
      employeeId: r.employee_id,
      cases: r.cases,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    });
  }

  type ListRow = {
    id: string;
    name: string;
    description: string | null;
    employee_id: string | null;
    created_at: string;
  };
  const rows = (await neon`
    SELECT id, name, description, employee_id, created_at
    FROM eval_suites
    ${workspaceId ? neon`WHERE workspace_id = ${workspaceId}` : neon``}
    ORDER BY created_at DESC
    LIMIT 100
  `) as unknown as ListRow[];

  return Response.json({
    suites: rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      employeeId: r.employee_id,
      createdAt: r.created_at,
    })),
  });
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

  const action = body.action as string;

  // --- Create a suite ---
  if (action === "create_suite") {
    const { workspaceId, name, description, employeeId, cases } = body as {
      workspaceId?: string;
      name?: string;
      description?: string;
      employeeId?: string;
      cases?: EvalCase[];
    };

    if (!name || !cases || !Array.isArray(cases)) {
      return Response.json({ error: "name and cases[] are required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const neon = getNeon();
    if (neon) {
      await neon`
        INSERT INTO eval_suites (id, workspace_id, name, description, employee_id, cases, created_at, updated_at)
        VALUES (${id}, ${workspaceId ?? null}, ${name}, ${description ?? null},
                ${employeeId ?? null}, ${JSON.stringify(cases)}::jsonb, ${now}, ${now})
      `;
    }

    return Response.json(
      {
        id,
        workspaceId: workspaceId ?? null,
        name,
        description: description ?? null,
        employeeId: employeeId ?? null,
        cases,
        createdAt: now,
        updatedAt: now,
      },
      { status: 201 },
    );
  }

  // --- Score a single response (no DB) ---
  if (action === "score_response") {
    const { response, evalCase } = body as { response?: string; evalCase?: EvalCase };
    if (!response || !evalCase) {
      return Response.json({ error: "response and evalCase are required" }, { status: 400 });
    }

    const result = scoreCase(response, evalCase);
    const judgeScorers = evalCase.scorers.filter((s) => s.type === "llm_judge");

    let judgeScores: { type: "llm_judge"; score: number; reason?: string; weight?: number }[] = [];
    if (judgeScorers.length > 0) {
      const userMsg = evalCase.messages.find((m) => m.role === "user")?.content ?? "";
      judgeScores = await Promise.all(
        judgeScorers.map(async (s) => {
          const j = await runLlmJudge(userMsg, response, s.rubric ?? "Rate this response.");
          return { type: "llm_judge" as const, score: j.score, reason: j.reason, weight: s.weight };
        }),
      );
    }

    const allScores = [...result.scores, ...judgeScores];
    const finalScore = aggregateScores(allScores);

    return Response.json({
      score: finalScore,
      passed: finalScore >= 0.7,
      scores: allScores,
    });
  }

  // --- Run a suite ---
  if (action === "run_suite") {
    const { suiteId, workspaceId, employeeId, model } = body as {
      suiteId?: string;
      workspaceId?: string;
      employeeId?: string;
      model?: string;
    };

    if (!suiteId) {
      return Response.json({ error: "suiteId is required" }, { status: 400 });
    }

    const neon = getNeon();
    if (!neon) {
      return Response.json({ error: "Database not configured" }, { status: 503 });
    }

    type SuiteRow = { id: string; name: string; employee_id: string | null; cases: EvalCase[] };
    const rows = (await neon`
      SELECT id, name, employee_id, cases FROM eval_suites WHERE id = ${suiteId} LIMIT 1
    `) as unknown as SuiteRow[];

    if (!rows.length) {
      return Response.json({ error: "Suite not found" }, { status: 404 });
    }

    const suite = rows[0];
    const cases: EvalCase[] = Array.isArray(suite.cases) ? suite.cases : [];
    const resolvedEmployeeId = employeeId ?? suite.employee_id ?? undefined;

    const runId = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    const caseResults: CaseResult[] = [];

    for (const evalCase of cases) {
      const caseStart = Date.now();
      let responseText = "";
      let caseError: string | undefined;

      try {
        responseText = await generateResponse(
          evalCase.messages,
          resolvedEmployeeId,
          model,
          workspaceId,
        );
      } catch (err) {
        caseError = String(err);
      }

      const deterministicResult = scoreCase(responseText, evalCase);
      const judgeScorers = evalCase.scorers.filter((s) => s.type === "llm_judge");
      let judgeScores: { type: "llm_judge"; score: number; reason?: string; weight?: number }[] =
        [];

      if (!caseError && judgeScorers.length > 0) {
        const userMsg = evalCase.messages.find((m) => m.role === "user")?.content ?? "";
        judgeScores = await Promise.all(
          judgeScorers.map(async (s) => {
            const j = await runLlmJudge(userMsg, responseText, s.rubric ?? "Rate this response.");
            return {
              type: "llm_judge" as const,
              score: j.score,
              reason: j.reason,
              weight: s.weight,
            };
          }),
        );
      }

      const allScores = [...deterministicResult.scores, ...judgeScores];
      const finalScore = caseError ? 0 : aggregateScores(allScores);

      caseResults.push({
        caseId: evalCase.id,
        passed: finalScore >= 0.7,
        score: finalScore,
        response: responseText,
        durationMs: Date.now() - caseStart,
        scores: allScores,
        error: caseError,
      });
    }

    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - new Date(startedAt).getTime();
    const passedCases = caseResults.filter((c) => c.passed).length;
    const totalScore =
      caseResults.length > 0
        ? caseResults.reduce((s, c) => s + c.score, 0) / caseResults.length
        : 0;

    const result: EvalResult = {
      suiteId,
      runId,
      employeeId: resolvedEmployeeId ?? undefined,
      model: model ?? undefined,
      startedAt,
      finishedAt,
      durationMs,
      passedCases,
      failedCases: caseResults.length - passedCases,
      totalCases: caseResults.length,
      score: totalScore,
      cases: caseResults,
    };

    // Persist run
    try {
      await neon`
        INSERT INTO eval_runs (id, suite_id, workspace_id, employee_id, model, started_at, finished_at,
                               duration_ms, passed_cases, failed_cases, total_cases, score, results)
        VALUES (${runId}, ${suiteId}, ${workspaceId ?? null}, ${resolvedEmployeeId ?? null},
                ${model ?? null}, ${startedAt}, ${finishedAt}, ${durationMs},
                ${passedCases}, ${caseResults.length - passedCases}, ${caseResults.length},
                ${totalScore}, ${JSON.stringify(caseResults)}::jsonb)
      `;
    } catch {
      /* non-fatal */
    }

    return Response.json(result);
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const suiteId = url.searchParams.get("suiteId");
  if (!suiteId) {
    return Response.json({ error: "suiteId is required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  await neon`DELETE FROM eval_suites WHERE id = ${suiteId}`;
  return Response.json({ ok: true });
}

/**
 * Eidon Evals — structured evaluation framework for AI employee responses.
 *
 * Supports four scorer types:
 *   - exact_match:   case-insensitive exact string comparison
 *   - contains:      response includes expected substring
 *   - regex:         response matches a regular expression
 *   - llm_judge:     a secondary LLM grades response quality 0–1
 *
 * Eval suites are stored as JSON and can be run on any employee/model combination.
 */

export type ScorerType = "exact_match" | "contains" | "regex" | "llm_judge";

export interface EvalCase {
  id: string;
  description?: string;
  messages: { role: "user" | "assistant"; content: string }[];
  expected?: string;
  scorers: EvalScorer[];
  tags?: string[];
}

export interface EvalScorer {
  type: ScorerType;
  /** exact_match / contains / regex: the string or pattern to match */
  value?: string;
  /** llm_judge: the rubric prompt */
  rubric?: string;
  /** Weight for this scorer (default: 1) */
  weight?: number;
}

export interface EvalSuite {
  id: string;
  name: string;
  description?: string;
  employeeId?: string;
  cases: EvalCase[];
  createdAt: string;
  updatedAt: string;
}

export interface EvalResult {
  suiteId: string;
  runId: string;
  employeeId?: string;
  model?: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  passedCases: number;
  failedCases: number;
  totalCases: number;
  score: number;
  cases: CaseResult[];
}

export interface CaseResult {
  caseId: string;
  passed: boolean;
  score: number;
  response: string;
  durationMs: number;
  scores: { type: ScorerType; score: number; reason?: string }[];
  error?: string;
}

/** Score a response against a single scorer. Returns 0–1. */
export function scoreResponse(
  response: string,
  expected: string | undefined,
  scorer: EvalScorer,
): { score: number; reason?: string } {
  const text = response.trim();

  switch (scorer.type) {
    case "exact_match": {
      const match = text.toLowerCase() === (scorer.value ?? expected ?? "").toLowerCase();
      return { score: match ? 1 : 0 };
    }
    case "contains": {
      const needle = (scorer.value ?? expected ?? "").toLowerCase();
      return { score: text.toLowerCase().includes(needle) ? 1 : 0 };
    }
    case "regex": {
      const pattern = scorer.value ?? expected ?? "";
      try {
        const match = new RegExp(pattern, "i").test(text);
        return { score: match ? 1 : 0 };
      } catch {
        return { score: 0, reason: "invalid regex pattern" };
      }
    }
    case "llm_judge":
      // LLM judge scores are set externally (see runLlmJudge); return 0 as sentinel
      return { score: 0, reason: "pending llm judge" };
  }
}

/** Aggregate weighted scores from multiple scorers into a single 0–1 score. */
export function aggregateScores(scores: { score: number; weight?: number }[]): number {
  if (!scores.length) return 0;
  const totalWeight = scores.reduce((s, r) => s + (r.weight ?? 1), 0);
  const weightedSum = scores.reduce((s, r) => s + r.score * (r.weight ?? 1), 0);
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/** Run deterministic scorers for a case (non-LLM scorers only). */
export function scoreCase(
  response: string,
  evalCase: EvalCase,
): { score: number; scores: { type: ScorerType; score: number; reason?: string }[] } {
  const scores = evalCase.scorers
    .filter((s) => s.type !== "llm_judge")
    .map((scorer) => {
      const { score, reason } = scoreResponse(response, evalCase.expected, scorer);
      return { type: scorer.type, score, reason, weight: scorer.weight };
    });

  const score = aggregateScores(scores);
  return { score, scores };
}

/** Build a prompt for the LLM judge given a response and rubric. */
export function buildJudgePrompt(userMessage: string, response: string, rubric: string): string {
  return [
    "You are an objective evaluator. Score the following AI response from 0 to 1 based on the rubric.",
    "",
    "Rubric:",
    rubric,
    "",
    `User message: ${userMessage}`,
    "",
    `AI response: ${response}`,
    "",
    'Respond with ONLY a JSON object: {"score": <0.0-1.0>, "reason": "<one sentence>"}',
  ].join("\n");
}

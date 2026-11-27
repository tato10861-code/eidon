import { describe, expect, it } from "vitest";
import { buildSystemPrompt, runEmployee } from "@/lib/ai/engine";
import { getEmployee } from "@/lib/employees";

describe("ai engine", () => {
  it("builds a system prompt including persona and guardrails", () => {
    const employee = getEmployee("ava-sales-development")!;
    const prompt = buildSystemPrompt(employee, {
      name: "Ava",
      company: "Acme",
      mission: "Book meetings",
      guardrails: ["Never invent pricing."],
      knowledge: ["ICP is mid-market SaaS."],
    });
    expect(prompt).toContain("Your name is Ava");
    expect(prompt).toContain("You work for Acme");
    expect(prompt).toContain("Current mission: Book meetings");
    expect(prompt).toContain("Never invent pricing.");
    expect(prompt).toContain("ICP is mid-market SaaS.");
  });

  it("streams a demo reply with meta, traces, deltas and done", async () => {
    const employee = getEmployee("ava-sales-development")!;
    const events: { type: string }[] = [];
    let text = "";
    for await (const event of runEmployee({
      employee,
      messages: [{ role: "user", content: "Write a cold email sequence." }],
    })) {
      events.push({ type: event.type });
      if (event.type === "delta") text += event.text;
    }
    const types = events.map((e) => e.type);
    expect(types[0]).toBe("meta");
    expect(types).toContain("trace");
    expect(types).toContain("delta");
    expect(types[types.length - 1]).toBe("done");
    expect(text.length).toBeGreaterThan(0);
  });

  it("runs for every employee without throwing", async () => {
    const { employees } = await import("@/lib/employees");
    for (const employee of employees) {
      let done = false;
      for await (const event of runEmployee({
        employee,
        messages: [{ role: "user", content: "Hello." }],
      })) {
        if (event.type === "done") done = true;
      }
      expect(done).toBe(true);
    }
  }, 60000);
});

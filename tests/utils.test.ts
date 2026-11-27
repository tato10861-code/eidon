import { describe, expect, it } from "vitest";
import { cn, clamp, initials, estimateTokens, formatCompact } from "@/lib/utils";

describe("utils", () => {
  it("merges class names with tailwind", () => {
    expect(cn("px-2", "px-4", "text-sm")).toBe("px-4 text-sm");
  });

  it("initials takes first letters", () => {
    expect(initials("Ava Sales")).toBe("AS");
    expect(initials("Kai")).toBe("K");
    expect(initials("")).toBe("");
  });

  it("clamp bounds values", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("estimateTokens is at least 1", () => {
    expect(estimateTokens("")).toBe(1);
    expect(estimateTokens("hello world")).toBeGreaterThan(1);
  });

  it("formatCompact formats numbers", () => {
    expect(formatCompact(1200)).toBe("1.2K");
  });
});

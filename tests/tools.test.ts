import { describe, expect, it } from "vitest";
import { toolCatalog, toolCategories, getToolMeta } from "@/lib/tools";

describe("tool catalog", () => {
  it("contains 50 integrations", () => {
    expect(toolCatalog).toHaveLength(50);
  });

  it("has unique names", () => {
    const names = toolCatalog.map((tool) => tool.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every tool has scopes and a valid status", () => {
    for (const tool of toolCatalog) {
      expect(tool.scopes.length).toBeGreaterThan(0);
      expect(["ga", "beta"]).toContain(tool.status);
      expect(tool.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("derives categories from the catalog", () => {
    expect(toolCategories.length).toBeGreaterThan(5);
    expect(toolCategories).toContain("CRM");
  });

  it("looks up tools by name", () => {
    expect(getToolMeta("HubSpot")?.category).toBe("CRM");
    expect(getToolMeta("does-not-exist")).toBeUndefined();
  });
});

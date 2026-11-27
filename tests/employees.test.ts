import { describe, expect, it } from "vitest";
import { employees, departments, getEmployee, getEmployeeById } from "@/lib/employees";

describe("workforce", () => {
  it("ships 12 employees", () => {
    expect(employees).toHaveLength(12);
  });

  it("has unique ids and slugs", () => {
    expect(new Set(employees.map((e) => e.id)).size).toBe(employees.length);
    expect(new Set(employees.map((e) => e.slug)).size).toBe(employees.length);
  });

  it("every employee has the required profile", () => {
    for (const employee of employees) {
      expect(employee.name).toBeTruthy();
      expect(employee.title).toBeTruthy();
      expect(employee.tagline).toBeTruthy();
      expect(employee.description).toBeTruthy();
      expect(employee.skills.length).toBeGreaterThan(0);
      expect(employee.tools.length).toBeGreaterThan(0);
      expect(employee.playbook.approach.length).toBeGreaterThan(0);
      expect(employee.playbook.checks.length).toBeGreaterThan(0);
      expect(employee.starters.length).toBeGreaterThan(0);
      expect(employee.channels.length).toBeGreaterThan(0);
      expect(employee.languages.length).toBeGreaterThan(0);
      expect(employee.ar.title).toBeTruthy();
    }
  });

  it("looks up by slug and id", () => {
    const ava = getEmployee("ava-sales-development");
    expect(ava?.id).toBe("ava");
    expect(getEmployeeById("ava")?.slug).toBe("ava-sales-development");
    expect(getEmployee("nope")).toBeUndefined();
  });

  it("exposes departments", () => {
    expect(departments.length).toBeGreaterThan(3);
  });
});

import { employees } from "@/lib/employees";

export const dynamic = "force-static";

export function GET() {
  return Response.json({
    object: "list",
    data: employees.map((employee) => ({
      id: employee.id,
      slug: employee.slug,
      name: employee.name,
      role: employee.role,
      department: employee.department,
      title: employee.title,
      tagline: employee.tagline,
      skills: employee.skills,
      tools: employee.tools.map((tool) => tool.name),
      channels: employee.channels,
      languages: employee.languages,
      status: employee.status,
      url: `/employees/${employee.slug}`,
    })),
    meta: { count: employees.length, runtime: "eidon-core" },
  });
}

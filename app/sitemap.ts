import type { MetadataRoute } from "next";
import { employees } from "@/lib/employees";
import { siteUrl } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    "",
    "/employees",
    "/evals",
    "/integrations",
    "/login",
    "/marketplace",
    "/voice",
    "/pricing",
    "/docs",
    "/security",
    "/studio",
    "/playground",
    "/dashboard",
    "/about",
    "/status",
    "/legal/privacy",
    "/legal/terms",
    "/legal/dpa",
    "/legal/subprocessors",
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
    priority: route === "" ? 1 : route === "/employees" ? 0.9 : 0.6,
  }));

  const employeeRoutes = employees.map((employee) => ({
    url: `${siteUrl}/employees/${employee.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...employeeRoutes];
}

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [
  [
    "supabase/schema.sql",
    [
      "create table if not exists public.workspaces",
      "create or replace function public.reserve_usage",
      "enable row level security",
    ],
  ],
  [
    "neon/schema.sql",
    ["create table if not exists workspaces", "create or replace function reserve_usage"],
  ],
  [
    "supabase/migrations/20261128_enterprise_operations.sql",
    ["workspace_deletion_requests", "operational_alerts", "Non-destructive"],
  ],
  [
    "neon/migrations/20261128_enterprise_operations.sql",
    ["workspace_deletion_requests", "operational_alerts", "Non-destructive"],
  ],
];

let failed = false;
for (const [relative, markers] of checks) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) {
    console.error(`MISSING ${relative}`);
    failed = true;
    continue;
  }
  const text = fs.readFileSync(file, "utf8");
  const missing = markers.filter((marker) => !text.includes(marker));
  if (missing.length) {
    console.error(`FAIL ${relative}: missing ${missing.join(", ")}`);
    failed = true;
  } else {
    console.log(`PASS ${relative}`);
  }
}

if (process.env.EIDON_STAGING_DATABASE_URL || process.env.DATABASE_URL) {
  console.log(
    "INFO database URL detected; this command intentionally performs no database writes.",
  );
  console.log("Run the documented staging SQL and concurrency checks with an approved operator.");
} else {
  console.log("INFO no staging database configured; static schema verification completed.");
}

if (failed) process.exitCode = 1;

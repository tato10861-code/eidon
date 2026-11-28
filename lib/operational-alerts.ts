import { getNeon } from "@/lib/neon";
import { getSupabase } from "@/lib/supabase";

export type OperationalAlert = {
  severity: "info" | "warning" | "critical";
  source: string;
  code: string;
  message: string;
  context?: Record<string, unknown>;
};

export async function recordOperationalAlert(alert: OperationalAlert) {
  const context = Object.fromEntries(
    Object.entries(alert.context ?? {}).filter(
      ([key]) => !/token|secret|password|authorization|key/i.test(key),
    ),
  );
  try {
    const supabase = await getSupabase();
    if (supabase) {
      await supabase.from("operational_alerts").insert({
        severity: alert.severity,
        source: alert.source,
        code: alert.code,
        message: alert.message,
        context,
      });
      return true;
    }
    const sql = getNeon();
    if (sql) {
      await sql`
        insert into operational_alerts (severity, source, code, message, context)
        values (${alert.severity}, ${alert.source}, ${alert.code}, ${alert.message}, ${JSON.stringify(context)}::jsonb)
      `;
      return true;
    }
  } catch {
    // Alerting must never replace the original customer-facing error.
  }
  return false;
}

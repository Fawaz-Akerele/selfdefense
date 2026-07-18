#!/usr/bin/env node
/** Sydef production readiness checks */
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let ok = 0;
let fail = 0;

function check(name, cond) {
  if (cond) { console.log("OK  ", name); ok++; }
  else { console.log("FAIL", name); fail++; }
}

const files = [
  "supabase/migrations/20250619000005_preference_clustering_production.sql",
  "src/lib/services/scheduling.ts",
  "src/lib/services/plans.ts",
  "src/app/api/scheduling/preferences/route.ts",
  "src/app/api/admin/clusters/route.ts",
  "src/app/api/admin/security-alerts/route.ts",
  "src/app/api/cron/scheduling/route.ts",
  "src/app/portal/preferences/page.tsx",
  "src/app/portal/plans/page.tsx",
  "src/app/admin/clusters/page.tsx",
  "src/app/admin/plans/page.tsx",
  "src/app/admin/security-alerts/page.tsx",
  "src/components/scheduling/preference-form.tsx",
  "src/components/booking/session-book-button.tsx",
];

for (const f of files) check(f, existsSync(join(root, f)));

const migration = readFileSync(join(root, "supabase/migrations/20250619000005_preference_clustering_production.sql"), "utf8");
check("scheduling_preferences table", migration.includes("scheduling_preferences"));
check("demand_clusters table", migration.includes("demand_clusters"));
check("pricing_plans table", migration.includes("pricing_plans"));
check("security_alert_drafts table", migration.includes("security_alert_drafts"));
check("upsert_scheduling_preference RPC", migration.includes("upsert_scheduling_preference"));
check("refresh_demand_clusters RPC", migration.includes("refresh_demand_clusters"));
check("confirm_demand_cluster RPC", migration.includes("confirm_demand_cluster"));
check("approve_security_alert RPC", migration.includes("approve_security_alert"));

const adminAccess = readFileSync(join(root, "src/lib/auth/admin-access.ts"), "utf8");
check("scheduling admin capability", adminAccess.includes('"scheduling"'));
check("security admin capability", adminAccess.includes('"security"'));

const fulfillment = readFileSync(join(root, "src/lib/services/payment-fulfillment.ts"), "utf8");
check("subscription_plan fulfillment", fulfillment.includes("subscription_plan"));

console.log(`\n${ok} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Creates super admin user in Supabase Auth for staging.
 * Usage: node scripts/create-superadmin.js
 * Requires: SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL in env
 */
const { createClient } = require("@supabase/supabase-js");

const EMAIL = "oadeagbo@gmail.com";
const PASSWORD = "superadmin1@#";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === EMAIL);

  if (found) {
    await supabase.auth.admin.updateUserById(found.id, {
      password: PASSWORD,
      email_confirm: true,
    });
    await supabase.from("profiles").upsert({
      id: found.id,
      full_name: "Super Admin",
      role: "super_admin",
    });
    console.log("Updated existing super admin:", EMAIL);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Super Admin" },
    });
    if (error) throw error;
    await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: "Super Admin",
      role: "super_admin",
    });
    console.log("Created super admin:", EMAIL);
  }

  await supabase
    .from("platform_settings")
    .update({ super_admin_email: EMAIL })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("Done. Login at /admin/login");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

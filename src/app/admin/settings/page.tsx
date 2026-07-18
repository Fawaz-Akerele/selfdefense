import Link from "next/link";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { getMockPlatformSettings, shouldUseMockData } from "@/lib/mock";

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdminAccess("settings");

  const row = shouldUseMockData()
    ? getMockPlatformSettings()
    : ((
        await supabase
          .from("platform_settings")
          .select(
            "mode, site_name, site_tagline, primary_payment_provider, secondary_payment_provider, tertiary_payment_provider, paystack_configured, flutterwave_configured, stripe_configured, whatsapp_configured"
          )
          .limit(1)
          .single()
      ).data as ReturnType<typeof getMockPlatformSettings> | null);

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm text-neutral-500">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Platform Settings</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Current platform configuration from `platform_settings`.
        </p>

        {row && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-white p-4 text-sm">
              <p className="text-xs text-neutral-500">Mode</p>
              <p className="mt-1 font-medium capitalize">{row.mode}</p>
            </div>
            <div className="rounded-xl border bg-white p-4 text-sm">
              <p className="text-xs text-neutral-500">Site</p>
              <p className="mt-1 font-medium">{row.site_name}</p>
              <p className="text-neutral-500">{row.site_tagline}</p>
            </div>
            <div className="rounded-xl border bg-white p-4 text-sm">
              <p className="text-xs text-neutral-500">Payment priority</p>
              <p className="mt-1">
                {row.primary_payment_provider} → {row.secondary_payment_provider} →{" "}
                {row.tertiary_payment_provider}
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4 text-sm">
              <p className="text-xs text-neutral-500">Integrations</p>
              <ul className="mt-2 space-y-1 text-neutral-600">
                <li>Paystack: {row.paystack_configured ? "configured" : "not configured"}</li>
                <li>Flutterwave: {row.flutterwave_configured ? "configured" : "not configured"}</li>
                <li>Stripe: {row.stripe_configured ? "configured" : "not configured"}</li>
                <li>WhatsApp: {row.whatsapp_configured ? "configured" : "not configured"}</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

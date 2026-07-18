"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(
    searchParams.get("verify") === "1" ? "oadeagbo@gmail.com" : ""
  );
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"login" | "verify">(
    searchParams.get("verify") === "1" ? "verify" : "login"
  );
  const [error, setError] = useState<string | null>(null);
  const [mockCode, setMockCode] = useState<string | undefined>();

  useEffect(() => {
    if (searchParams.get("verify") === "1") return;
    async function loadSuperAdminEmail() {
      const supabase = createClient();
      const { data } = await supabase
        .from("platform_settings")
        .select("super_admin_email")
        .limit(1)
        .single();
      const row = data as { super_admin_email?: string } | null;
      if (row?.super_admin_email) setEmail(row.super_admin_email);
    }
    loadSuperAdminEmail();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      return;
    }

    const res = await fetch("/api/admin/superadmin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "superadmin_login" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not send verification code");
      return;
    }
    setMockCode(data.mockCode);
    setStep("verify");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/superadmin", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, purpose: "superadmin_login" }),
    });
    const data = await res.json();
    if (data.valid) {
      window.location.href = "/admin";
    } else {
      setError(data.error ?? "Invalid code");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6">
        <h1 className="text-lg font-semibold">Sydef Admin</h1>
        <p className="mt-1 text-xs text-neutral-500">Super admin sign in</p>

        {step === "login" ? (
          <form onSubmit={handleLogin} className="mt-6 space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              required
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white"
            >
              Sign in
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="mt-6 space-y-3">
            <p className="text-sm text-neutral-600">
              Enter the 6-digit code sent to {email}
            </p>
            {mockCode && (
              <p className="rounded bg-amber-50 p-2 text-xs text-amber-800">
                Staging mock code: <strong>{mockCode}</strong>
              </p>
            )}
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="w-full rounded-lg border px-3 py-2 text-center text-lg tracking-widest"
              required
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white"
            >
              Verify
            </button>
          </form>
        )}

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
          Loading admin sign in…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}

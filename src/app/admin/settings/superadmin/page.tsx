"use client";

import { useState } from "react";
import Link from "next/link";

export default function SuperAdminSettingsPage() {
  const [changeSuperAdmin, setChangeSuperAdmin] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [mockCode, setMockCode] = useState<string | undefined>();

  async function requestTransferCode() {
    const res = await fetch("/api/admin/superadmin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "oadeagbo@gmail.com",
        purpose: "superadmin_transfer",
      }),
    });
    const data = await res.json();
    setMockCode(data.mockCode);
    setMessage("Transfer code sent to current super admin email.");
  }

  async function confirmTransfer(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/superadmin", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "oadeagbo@gmail.com",
        code,
        purpose: "superadmin_transfer",
        newSuperAdminEmail: newEmail,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage(`Super admin transferred to ${data.newSuperAdmin}`);
    } else {
      setMessage(data.error ?? "Transfer failed");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="mx-auto max-w-lg">
        <Link href="/admin" className="text-sm text-neutral-500">
          ← Admin
        </Link>
        <h1 className="mt-4 text-xl font-semibold">Super Admin Settings</h1>

        <div className="mt-6 space-y-4 rounded-xl border bg-white p-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={changeSuperAdmin}
              onChange={(e) => setChangeSuperAdmin(e.target.checked)}
            />
            Change super admin
          </label>

          {changeSuperAdmin && (
            <form onSubmit={confirmTransfer} className="space-y-3">
              <button
                type="button"
                onClick={requestTransferCode}
                className="text-sm text-neutral-600 underline"
              >
                Send verification code to current super admin
              </button>
              {mockCode && (
                <p className="rounded bg-amber-50 p-2 text-xs">
                  Staging code: <strong>{mockCode}</strong>
                </p>
              )}
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="New super admin email"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Verification code"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
              <button
                type="submit"
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white"
              >
                Transfer super admin
              </button>
            </form>
          )}

          {message && <p className="text-sm text-neutral-600">{message}</p>}
        </div>
      </div>
    </div>
  );
}

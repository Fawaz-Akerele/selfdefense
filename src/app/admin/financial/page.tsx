"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatNgn } from "@/lib/utils";

type Summary = {
  totalRevenue: number;
  totalRefunds: number;
  netRevenue: number;
  transactionCount: number;
  byProvider: Record<string, number>;
  byPurpose: Record<string, number>;
};

export default function FinancialPortalPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<unknown[]>([]);

  useEffect(() => {
    fetch(`/api/admin/financial?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => {
        setSummary(data.summary);
        setRows(data.rows ?? []);
      });
  }, [from, to]);

  function downloadCsv() {
    window.open(`/api/admin/financial?from=${from}&to=${to}&format=csv`, "_blank");
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm text-neutral-500">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Financial Portal</h1>
        <p className="text-sm text-neutral-500">Profit & loss view — filter by date</p>

        <div className="mt-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs text-neutral-500">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="block rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="block rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={downloadCsv}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white"
          >
            Download CSV
          </button>
        </div>

        {summary && (
          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs text-neutral-500">Revenue</p>
              <p className="text-lg font-semibold">{formatNgn(summary.totalRevenue)}</p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs text-neutral-500">Refunds</p>
              <p className="text-lg font-semibold">{formatNgn(summary.totalRefunds)}</p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs text-neutral-500">Net</p>
              <p className="text-lg font-semibold">{formatNgn(summary.netRevenue)}</p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs text-neutral-500">Transactions</p>
              <p className="text-lg font-semibold">{summary.transactionCount}</p>
            </div>
          </div>
        )}

        <div className="mt-8 overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-neutral-50 text-xs text-neutral-500">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Provider</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(rows as { transaction_date: string; amount: number; provider: string; purpose: string; status: string }[]).map(
                (r, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-3">{new Date(r.transaction_date).toLocaleDateString()}</td>
                    <td className="p-3">{formatNgn(r.amount)}</td>
                    <td className="p-3 capitalize">{r.provider}</td>
                    <td className="p-3">{r.purpose ?? "—"}</td>
                    <td className="p-3 capitalize">{r.status}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

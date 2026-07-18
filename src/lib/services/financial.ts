import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData, getMockFinancialLedger } from "@/lib/mock";

export type FinancialSummary = {
  totalRevenue: number;
  totalRefunds: number;
  netRevenue: number;
  transactionCount: number;
  byProvider: Record<string, number>;
  byPurpose: Record<string, number>;
};

export type LedgerRow = {
  id: string;
  transaction_date: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  purpose: string | null;
  customer_name: string | null;
  customer_email: string | null;
};

export async function getFinancialLedger(
  fromDate: string,
  toDate: string
): Promise<{ rows: LedgerRow[]; summary: FinancialSummary }> {
  if (shouldUseMockData()) return getMockFinancialLedger(fromDate, toDate);

  const admin = tryCreateAdminClient();
  if (!admin) return { rows: [], summary: emptySummary() };

  const { data: payments } = await admin
    .from("payments")
    .select("id, created_at, amount_ngn, currency, provider, status, metadata, user_id")
    .gte("created_at", fromDate)
    .lte("created_at", `${toDate}T23:59:59.999Z`)
    .in("status", ["succeeded", "refunded"])
    .order("created_at", { ascending: false });

  if (!payments?.length) return { rows: [], summary: emptySummary() };

  const userIds = [...new Set(payments.map((p) => p.user_id).filter(Boolean))] as string[];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const rows: LedgerRow[] = payments.map((p) => ({
    id: p.id,
    transaction_date: p.created_at,
    amount: p.amount_ngn,
    currency: p.currency,
    provider: p.provider,
    status: p.status,
    purpose: (p.metadata as Record<string, string>)?.purpose ?? null,
    customer_name: p.user_id ? profileMap.get(p.user_id) ?? null : null,
    customer_email: null,
  }));

  const succeeded = payments.filter((p) => p.status === "succeeded");
  const refunded = payments.filter((p) => p.status === "refunded");

  const byProvider: Record<string, number> = {};
  const byPurpose: Record<string, number> = {};

  for (const p of succeeded) {
    byProvider[p.provider] = (byProvider[p.provider] ?? 0) + p.amount_ngn;
    const purpose = (p.metadata as Record<string, string>)?.purpose ?? "other";
    byPurpose[purpose] = (byPurpose[purpose] ?? 0) + p.amount_ngn;
  }

  const totalRevenue = succeeded.reduce((s, p) => s + p.amount_ngn, 0);
  const totalRefunds = refunded.reduce((s, p) => s + p.amount_ngn, 0);

  return {
    rows,
    summary: {
      totalRevenue,
      totalRefunds,
      netRevenue: totalRevenue - totalRefunds,
      transactionCount: payments.length,
      byProvider,
      byPurpose,
    },
  };
}

export function ledgerToCsv(rows: LedgerRow[]): string {
  const header = "Date,Amount (NGN),Provider,Status,Purpose,Customer\n";
  const lines = rows.map((r) =>
    [
      r.transaction_date,
      r.amount,
      r.provider,
      r.status,
      r.purpose ?? "",
      r.customer_name ?? "",
    ].join(",")
  );
  return header + lines.join("\n");
}

function emptySummary(): FinancialSummary {
  return {
    totalRevenue: 0,
    totalRefunds: 0,
    netRevenue: 0,
    transactionCount: 0,
    byProvider: {},
    byPurpose: {},
  };
}

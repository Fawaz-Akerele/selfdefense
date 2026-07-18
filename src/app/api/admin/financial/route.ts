import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFinancialLedger, ledgerToCsv } from "@/lib/services/financial";
import { getSuperAdminEmail } from "@/lib/services/superadmin";
import { shouldUseMockData, getMockFinancialLedger } from "@/lib/mock";

async function authorizeFinancial(userEmail: string | undefined) {
  if (shouldUseMockData()) return true;
  if (!userEmail) return false;
  const superEmail = await getSuperAdminEmail();
  if (userEmail.toLowerCase() === superEmail.toLowerCase()) return true;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: grant } = await supabase
    .from("admin_capability_grants")
    .select("id")
    .eq("user_id", user.id)
    .eq("capability", "financial")
    .single();

  return Boolean(grant);
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!(await authorizeFinancial(user?.email ?? undefined))) {
    return NextResponse.json({ error: "Financial access required" }, { status: 403 });
  }

  const from = request.nextUrl.searchParams.get("from") ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const to = request.nextUrl.searchParams.get("to") ?? new Date().toISOString().slice(0, 10);
  const format = request.nextUrl.searchParams.get("format");

  if (shouldUseMockData()) {
    const { rows, summary } = getMockFinancialLedger(from, to);

    if (format === "csv") {
      const csv = ledgerToCsv(rows);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="sydef-financial-${from}-${to}.csv"`,
        },
      });
    }

    return NextResponse.json({ rows, summary, from, to });
  }

  const { rows, summary } = await getFinancialLedger(from, to);

  if (format === "csv") {
    const csv = ledgerToCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="sydef-financial-${from}-${to}.csv"`,
      },
    });
  }

  return NextResponse.json({ rows, summary, from, to });
}

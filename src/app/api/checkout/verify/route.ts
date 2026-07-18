import { NextRequest, NextResponse } from "next/server";
import { verifyAndFulfill } from "@/lib/services/payment-fulfillment";
import type { PaymentProviderName } from "@/lib/integrations/payments";

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  const provider = request.nextUrl.searchParams.get("provider") as PaymentProviderName | null;
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!reference || !provider) {
    return NextResponse.json(
      { error: "reference and provider required" },
      { status: 400 }
    );
  }

  try {
    const result = await verifyAndFulfill(provider, reference, sessionId ?? undefined);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification failed" },
      { status: 500 }
    );
  }
}

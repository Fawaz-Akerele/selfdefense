import { NextRequest, NextResponse } from "next/server";
import { paystackProvider } from "@/lib/integrations/payments/paystack";
import { verifyAndFulfill } from "@/lib/services/payment-fulfillment";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!paystackProvider.verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body) as {
    event: string;
    data: { reference: string; status: string };
  };

  if (event.event === "charge.success" && event.data.status === "success") {
    await verifyAndFulfill("paystack", event.data.reference);
  }

  return NextResponse.json({ received: true });
}

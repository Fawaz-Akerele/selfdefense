import { NextRequest, NextResponse } from "next/server";
import { flutterwaveProvider } from "@/lib/integrations/payments/flutterwave";
import { verifyAndFulfill } from "@/lib/services/payment-fulfillment";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("verif-hash");

  if (!flutterwaveProvider.verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body) as {
    event: string;
    data: { tx_ref: string; status: string };
  };

  if (
    event.event === "charge.completed" &&
    event.data.status === "successful"
  ) {
    await verifyAndFulfill("flutterwave", event.data.tx_ref);
  }

  return NextResponse.json({ received: true });
}

import { NextRequest, NextResponse } from "next/server";
import { stripeProvider } from "@/lib/integrations/payments/stripe";
import { verifyAndFulfill } from "@/lib/services/payment-fulfillment";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const event = stripeProvider.constructWebhookEvent(body, signature);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const reference = session.metadata?.reference;
      if (reference) {
        await verifyAndFulfill("stripe", reference, session.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook error" },
      { status: 400 }
    );
  }
}

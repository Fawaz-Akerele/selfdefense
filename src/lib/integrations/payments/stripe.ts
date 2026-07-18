import Stripe from "stripe";
import { randomBytes } from "crypto";
import type { CheckoutInput, PaymentProvider, VerifyResult } from "./types";

export class StripeProvider implements PaymentProvider {
  name = "stripe" as const;

  private get client() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    return new Stripe(key);
  }

  isConfigured() {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  }

  async initializeCheckout(input: CheckoutInput) {
    const stripe = this.client;
    if (!stripe) throw new Error("Stripe not configured");

    const reference = `st_${randomBytes(12).toString("hex")}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.email,
      line_items: [
        {
          price_data: {
            currency: "ngn",
            unit_amount: input.amountNgn * 100,
            product_data: {
              name: "Sydef",
              description: input.purpose.replace(/_/g, " "),
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/checkout/callback?provider=stripe&reference=${reference}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
      metadata: {
        reference,
        user_id: input.userId,
        purpose: input.purpose,
        ...input.metadata,
      },
    });

    if (!session.url) throw new Error("Stripe session URL missing");

    return {
      provider: this.name,
      authorizationUrl: session.url,
      reference,
      accessCode: session.id,
    };
  }

  async verifyPayment(reference: string, sessionId?: string): Promise<VerifyResult> {
    const stripe = this.client;
    if (!stripe) throw new Error("Stripe not configured");

    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return {
        success: session.payment_status === "paid",
        provider: "stripe",
        reference,
        amountNgn: Math.round((session.amount_total ?? 0) / 100),
        metadata: (session.metadata ?? {}) as Record<string, string>,
      };
    }

    return {
      success: false,
      provider: "stripe",
      reference,
      amountNgn: 0,
      metadata: {},
    };
  }

  constructWebhookEvent(body: string, signature: string) {
    const stripe = this.client;
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !secret) throw new Error("Stripe webhook not configured");
    return stripe.webhooks.constructEvent(body, signature, secret);
  }
}

export const stripeProvider = new StripeProvider();

import { randomBytes } from "crypto";
import type { CheckoutInput, PaymentProvider, VerifyResult } from "./types";

const FLW_BASE = "https://api.flutterwave.com/v3";

export class FlutterwaveProvider implements PaymentProvider {
  name = "flutterwave" as const;

  private get secretKey() {
    return process.env.FLUTTERWAVE_SECRET_KEY;
  }

  isConfigured() {
    return Boolean(this.secretKey);
  }

  async initializeCheckout(input: CheckoutInput) {
    const secret = this.secretKey;
    if (!secret) throw new Error("Flutterwave not configured");

    const txRef = `flw_${randomBytes(12).toString("hex")}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const res = await fetch(`${FLW_BASE}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: input.amountNgn,
        currency: "NGN",
        redirect_url: `${appUrl}/checkout/callback?provider=flutterwave&reference=${txRef}`,
        customer: { email: input.email },
        meta: {
          user_id: input.userId,
          purpose: input.purpose,
          ...input.metadata,
        },
        customizations: {
          title: "Sydef",
          description: input.purpose.replace(/_/g, " "),
        },
      }),
    });

    const data = await res.json();
    if (data.status !== "success") {
      throw new Error(data.message ?? "Flutterwave initialization failed");
    }

    return {
      provider: this.name,
      authorizationUrl: data.data.link as string,
      reference: txRef,
    };
  }

  async verifyPayment(reference: string): Promise<VerifyResult> {
    const secret = this.secretKey;
    if (!secret) throw new Error("Flutterwave not configured");

    const res = await fetch(
      `${FLW_BASE}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } }
    );

    const data = await res.json();
    const tx = data.data;

    return {
      success: data.status === "success" && tx?.status === "successful",
      provider: "flutterwave",
      reference,
      amountNgn: Math.round(tx?.amount ?? 0),
      metadata: (tx?.meta ?? {}) as Record<string, string>,
    };
  }

  verifyWebhookSignature(_body: string, signature: string | null): boolean {
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    if (!secretHash || !signature) return false;
    return signature === secretHash;
  }
}

export const flutterwaveProvider = new FlutterwaveProvider();

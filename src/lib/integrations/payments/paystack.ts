import { randomBytes, createHmac } from "crypto";
import type { CheckoutInput, PaymentProvider, VerifyResult } from "./types";

const PAYSTACK_BASE = "https://api.paystack.co";

export class PaystackProvider implements PaymentProvider {
  name = "paystack" as const;

  private get secretKey() {
    return process.env.PAYSTACK_SECRET_KEY;
  }

  isConfigured() {
    return Boolean(this.secretKey);
  }

  async initializeCheckout(input: CheckoutInput) {
    const secret = this.secretKey;
    if (!secret) throw new Error("Paystack not configured");

    const reference = `ps_${randomBytes(12).toString("hex")}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        amount: input.amountNgn * 100,
        currency: "NGN",
        reference,
        callback_url: `${appUrl}/checkout/callback?provider=paystack&reference=${reference}`,
        metadata: {
          user_id: input.userId,
          purpose: input.purpose,
          ...input.metadata,
        },
      }),
    });

    const data = await res.json();
    if (!data.status) {
      throw new Error(data.message ?? "Paystack initialization failed");
    }

    return {
      provider: this.name,
      authorizationUrl: data.data.authorization_url as string,
      reference: data.data.reference as string,
      accessCode: data.data.access_code as string,
    };
  }

  async verifyPayment(reference: string): Promise<VerifyResult> {
    const secret = this.secretKey;
    if (!secret) throw new Error("Paystack not configured");

    const res = await fetch(
      `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } }
    );

    const data = await res.json();
    const tx = data.data;

    return {
      success: data.status === true && tx?.status === "success",
      provider: "paystack",
      reference,
      amountNgn: Math.round((tx?.amount ?? 0) / 100),
      metadata: (tx?.metadata ?? {}) as Record<string, string>,
    };
  }

  verifyWebhookSignature(body: string, signature: string | null): boolean {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret || !signature) return false;

    const hash = createHmac("sha512", secret).update(body).digest("hex");
    return hash === signature;
  }
}

export const paystackProvider = new PaystackProvider();

import { randomBytes } from "crypto";
import type { CheckoutInput, PaymentProvider, VerifyResult } from "./types";

class MockPaymentProvider implements PaymentProvider {
  name = "mock" as const;

  isConfigured() {
    return true;
  }

  async initializeCheckout(input: CheckoutInput) {
    const reference = `mock_${randomBytes(12).toString("hex")}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const params = new URLSearchParams({
      reference,
      amount: String(input.amountNgn),
      purpose: input.purpose,
    });

    return {
      provider: this.name,
      authorizationUrl: `${appUrl}/checkout/mock?${params}`,
      reference,
    };
  }

  async verifyPayment(reference: string): Promise<VerifyResult> {
    return {
      success: reference.startsWith("mock_"),
      provider: "mock",
      reference,
      amountNgn: 0,
      metadata: {},
    };
  }
}

export const mockPaymentProvider = new MockPaymentProvider();

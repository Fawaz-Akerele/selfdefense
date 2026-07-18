import { getPlatformSettings } from "@/lib/services/database";
import { mockPaymentProvider } from "./mock";
import { paystackProvider } from "./paystack";
import { flutterwaveProvider } from "./flutterwave";
import { stripeProvider } from "./stripe";
import type { PaymentProvider, PaymentProviderName } from "./types";

const providers: Record<PaymentProviderName, PaymentProvider> = {
  paystack: paystackProvider,
  flutterwave: flutterwaveProvider,
  stripe: stripeProvider,
  mock: mockPaymentProvider,
};

export function getProvider(name: PaymentProviderName): PaymentProvider {
  return providers[name];
}

export async function resolvePaymentProvider(
  preferred?: PaymentProviderName
): Promise<{ provider: PaymentProvider; mode: "mock" | "live" }> {
  const settings = await getPlatformSettings();
  const mode = settings?.mode ?? "mock";

  if (mode === "mock") {
    return { provider: providers.mock, mode: "mock" };
  }

  if (preferred && providers[preferred]?.isConfigured()) {
    return { provider: providers[preferred], mode: "live" };
  }

  const order: PaymentProviderName[] = [
    (settings?.primary_payment_provider as PaymentProviderName) ?? "paystack",
    (settings?.secondary_payment_provider as PaymentProviderName) ?? "flutterwave",
    (settings?.tertiary_payment_provider as PaymentProviderName) ?? "stripe",
  ];

  for (const name of order) {
    const p = providers[name];
    if (p?.isConfigured()) {
      return { provider: p, mode: "live" };
    }
  }

  throw new Error(
    "No payment provider configured. Add Paystack, Flutterwave, or Stripe keys — or enable mock mode."
  );
}

export function getConfiguredProviders(): PaymentProviderName[] {
  return (["paystack", "flutterwave", "stripe"] as PaymentProviderName[]).filter(
    (name) => providers[name].isConfigured()
  );
}

export { providers };

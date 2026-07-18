export type PaymentProviderName = "paystack" | "flutterwave" | "stripe" | "mock";

export type CheckoutPurpose =
  | "class_booking"
  | "corporate_package"
  | "online_enrollment"
  | "subscription_plan";

export type CheckoutInput = {
  userId: string;
  email: string;
  amountNgn: number;
  purpose: CheckoutPurpose;
  metadata: Record<string, string>;
  preferredProvider?: PaymentProviderName;
};

export type CheckoutResult = {
  paymentId: string;
  provider: PaymentProviderName;
  authorizationUrl: string;
  reference: string;
  accessCode?: string;
};

export type VerifyResult = {
  success: boolean;
  provider: PaymentProviderName;
  reference: string;
  amountNgn: number;
  metadata: Record<string, string>;
};

export interface PaymentProvider {
  name: PaymentProviderName;
  isConfigured(): boolean;
  initializeCheckout(input: CheckoutInput): Promise<Omit<CheckoutResult, "paymentId">>;
  verifyPayment(reference: string): Promise<VerifyResult>;
}

export const PROVIDER_PRIORITY: PaymentProviderName[] = [
  "paystack",
  "flutterwave",
  "stripe",
];

export const PROVIDER_LABELS: Record<PaymentProviderName, string> = {
  paystack: "Paystack",
  flutterwave: "Flutterwave",
  stripe: "Stripe",
  mock: "Mock (dev)",
};

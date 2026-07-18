import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  resolvePaymentProvider,
  type CheckoutInput,
  type PaymentProviderName,
} from "@/lib/integrations/payments";
import type { InsertTables, Json, UpdateTables } from "@/types/database";

export async function initializeCheckout(
  input: CheckoutInput & { preferredProvider?: PaymentProviderName }
) {
  const { provider, mode } = await resolvePaymentProvider(input.preferredProvider);
  const admin = tryCreateAdminClient() ?? (await createClient());

  const paymentInsert: InsertTables<"payments"> = {
    user_id: input.userId,
    amount_ngn: input.amountNgn,
    currency: "NGN",
    status: "pending",
    provider: provider.name,
    metadata: {
      purpose: input.purpose,
      mode,
      ...input.metadata,
    } as Json,
  };

  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .insert(paymentInsert)
    .select()
    .single();

  if (paymentError || !payment) {
    throw new Error(paymentError?.message ?? "Failed to create payment record");
  }

  const checkout = await provider.initializeCheckout(input);

  const updates: UpdateTables<"payments"> = {
    provider_ref: checkout.reference,
  };

  if (provider.name === "paystack") {
    updates.paystack_reference = checkout.reference;
    updates.paystack_access_code = checkout.accessCode ?? null;
  } else if (provider.name === "flutterwave") {
    updates.flutterwave_tx_ref = checkout.reference;
  } else if (provider.name === "stripe") {
    updates.stripe_session_id = checkout.accessCode ?? null;
  }

  await admin.from("payments").update(updates).eq("id", payment.id);

  return {
    paymentId: payment.id,
    provider: provider.name,
    mode,
    authorizationUrl: checkout.authorizationUrl,
    reference: checkout.reference,
  };
}

export async function findPaymentByReference(reference: string) {
  const admin = tryCreateAdminClient() ?? (await createClient());

  const { data } = await admin
    .from("payments")
    .select("*")
    .or(
      `provider_ref.eq.${reference},paystack_reference.eq.${reference},flutterwave_tx_ref.eq.${reference}`
    )
    .single();

  return data;
}

import { tryCreateAdminClient } from "@/lib/supabase/admin";
import {
  getProvider,
  type PaymentProviderName,
  type VerifyResult,
} from "@/lib/integrations/payments";
import { stripeProvider } from "@/lib/integrations/payments/stripe";
import type { InsertTables, Json } from "@/types/database";

export async function fulfillPayment(
  paymentId: string,
  verify: VerifyResult,
  stripeSessionId?: string
) {
  const admin = tryCreateAdminClient();
  if (!admin) throw new Error("Service role required for fulfillment");

  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (!payment || payment.status === "succeeded") {
    return { alreadyFulfilled: true };
  }

  if (!verify.success) {
    await admin
      .from("payments")
      .update({ status: "failed" })
      .eq("id", paymentId);
    return { success: false };
  }

  const metadata = {
    ...(payment.metadata as Record<string, string>),
    ...verify.metadata,
  };

  await admin
    .from("payments")
    .update({
      status: "succeeded",
      provider_ref: verify.reference,
      stripe_payment_intent_id: stripeSessionId ?? null,
      metadata: metadata as Json,
    })
    .eq("id", paymentId);

  const purpose = metadata.purpose;
  const userId = payment.user_id ?? metadata.user_id;

  if (!userId) return { success: true, paymentId };

  if (purpose === "class_booking" && metadata.class_id) {
    if (metadata.session_id) {
      await admin.rpc("book_session_seat", {
        p_session_id: metadata.session_id,
        p_user_id: userId,
        p_class_id: metadata.class_id,
        p_payment_id: paymentId,
      });
    } else {
      const enrollment: InsertTables<"enrollments"> = {
        user_id: userId,
        class_id: metadata.class_id,
      };
      await admin.from("enrollments").upsert(enrollment, {
        onConflict: "user_id,class_id",
      });
    }
  }

  if (purpose === "corporate_package" && metadata.package_id) {
    const order: InsertTables<"corporate_orders"> = {
      buyer_id: userId,
      package_id: metadata.package_id,
      payment_id: paymentId,
      company_name: metadata.company_name ?? null,
      status: "paid",
      staff_count: Number(metadata.staff_count ?? 0),
    };
    await admin.from("corporate_orders").insert(order);
  }

  if (purpose === "subscription_plan" && metadata.plan_id) {
    const periodEnd = new Date();
    const slug = metadata.plan_slug ?? "";
    if (slug.includes("annual")) periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else periodEnd.setMonth(periodEnd.getMonth() + 1);

    await admin.from("member_subscriptions").insert({
      user_id: userId,
      plan_id: metadata.plan_id,
      payment_id: paymentId,
      status: "active",
      current_period_end: periodEnd.toISOString(),
      metadata: { plan_slug: slug } as Json,
    });
  }

  const amount = verify.amountNgn || payment.amount_ngn;

  const notif: InsertTables<"notifications"> = {
    user_id: userId,
    title: "Payment confirmed",
    body: `Your payment of ₦${amount.toLocaleString()} was successful via ${verify.provider}.`,
    channel: "in_app",
    metadata: { paymentId, provider: verify.provider } as Json,
  };
  await admin.from("notifications").insert(notif);

  return { success: true, paymentId };
}

export async function verifyAndFulfill(
  providerName: PaymentProviderName,
  reference: string,
  stripeSessionId?: string
) {
  const provider = getProvider(providerName);

  let verify: VerifyResult;
  if (providerName === "stripe" && stripeSessionId) {
    verify = await stripeProvider.verifyPayment(reference, stripeSessionId);
  } else {
    verify = await provider.verifyPayment(reference);
  }

  const admin = tryCreateAdminClient();
  if (!admin) throw new Error("Service role required");

  const { data: payment } = await admin
    .from("payments")
    .select("id")
    .or(
      `provider_ref.eq.${reference},paystack_reference.eq.${reference},flutterwave_tx_ref.eq.${reference}`
    )
    .single();

  if (!payment) throw new Error("Payment record not found");

  return fulfillPayment(payment.id, verify, stripeSessionId);
}

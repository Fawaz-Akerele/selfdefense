import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { initializeCheckout } from "@/lib/services/checkout";
import { getConfiguredProviders } from "@/lib/integrations/payments";

const schema = z.object({
  amountNgn: z.number().int().positive(),
  purpose: z.enum(["class_booking", "corporate_package", "online_enrollment", "subscription_plan"]),
  metadata: z.record(z.string(), z.string()).default({}),
  preferredProvider: z.enum(["paystack", "flutterwave", "stripe"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = schema.parse(await request.json());

    const result = await initializeCheckout({
      userId: user.id,
      email: user.email,
      amountNgn: body.amountNgn,
      purpose: body.purpose,
      metadata: body.metadata,
      preferredProvider: body.preferredProvider,
    });

    return NextResponse.json({
      ...result,
      availableProviders: getConfiguredProviders(),
      priority: ["paystack", "flutterwave", "stripe"],
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    priority: {
      primary: "paystack",
      secondary: "flutterwave",
      tertiary: "stripe",
    },
    configured: getConfiguredProviders(),
  });
}

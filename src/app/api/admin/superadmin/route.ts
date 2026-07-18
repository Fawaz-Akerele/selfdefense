import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  sendVerificationCode,
  verifyCode,
  getSuperAdminEmail,
  transferSuperAdmin,
  grantAdminCapability,
} from "@/lib/services/superadmin";
import {
  isSuperAdminEmail,
  SUPERADMIN_VERIFIED_COOKIE,
} from "@/lib/auth/admin-access";
import { shouldUseMockData } from "@/lib/mock";

const sendSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(["superadmin_login", "password_change", "superadmin_transfer"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = sendSchema.parse(await request.json());

    if (shouldUseMockData()) {
      const result = await sendVerificationCode(body.email, body.purpose);
      return NextResponse.json(result);
    }

    const superEmail = await getSuperAdminEmail();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (body.purpose === "superadmin_login") {
      if (!user?.email || !isSuperAdminEmail(user.email, superEmail)) {
        return NextResponse.json({ error: "Super admin only" }, { status: 403 });
      }
      if (body.email.toLowerCase() !== superEmail.toLowerCase()) {
        return NextResponse.json({ error: "Invalid super admin email" }, { status: 403 });
      }
    }

    if (
      body.purpose === "superadmin_transfer" ||
      body.purpose === "password_change"
    ) {
      if (!user?.email || !isSuperAdminEmail(user.email, superEmail)) {
        return NextResponse.json({ error: "Super admin only" }, { status: 403 });
      }
    }

    const result = await sendVerificationCode(body.email, body.purpose);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 }
    );
  }
}

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  purpose: z.enum(["superadmin_login", "password_change", "superadmin_transfer"]),
  newSuperAdminEmail: z.string().email().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const body = verifySchema.parse(await request.json());

    if (shouldUseMockData()) {
      if (body.purpose === "superadmin_transfer" && body.newSuperAdminEmail) {
        const result = await transferSuperAdmin(
          body.email,
          body.newSuperAdminEmail,
          body.code
        );
        return NextResponse.json(result);
      }

      const valid = await verifyCode(body.email, body.code, body.purpose);
      const response = NextResponse.json({ valid });

      if (valid && body.purpose === "superadmin_login") {
        response.cookies.set(SUPERADMIN_VERIFIED_COOKIE, "1", {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 12,
          path: "/",
        });
      }

      return response;
    }

    if (body.purpose === "superadmin_transfer" && body.newSuperAdminEmail) {
      const result = await transferSuperAdmin(
        body.email,
        body.newSuperAdminEmail,
        body.code
      );
      return NextResponse.json(result);
    }

    const valid = await verifyCode(body.email, body.code, body.purpose);
    const response = NextResponse.json({ valid });

    if (valid && body.purpose === "superadmin_login") {
      response.cookies.set(SUPERADMIN_VERIFIED_COOKIE, "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 12,
        path: "/",
      });
    }

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification failed" },
      { status: 400 }
    );
  }
}

const grantSchema = z.object({
  userId: z.string().uuid(),
  capability: z.enum([
    "content",
    "analytics",
    "financial",
    "bookings",
    "corporate",
    "settings",
  ]),
});

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const superEmail = await getSuperAdminEmail();
    if (!isSuperAdminEmail(user.email, superEmail)) {
      return NextResponse.json({ error: "Super admin only" }, { status: 403 });
    }

    const body = grantSchema.parse(await request.json());
    await grantAdminCapability(user.id, body.userId, body.capability);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Grant failed" },
      { status: 400 }
    );
  }
}

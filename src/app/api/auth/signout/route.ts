import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SUPERADMIN_VERIFIED_COOKIE } from "@/lib/auth/admin-access";

export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const response = NextResponse.redirect(new URL("/auth", request.url));
  response.cookies.set(SUPERADMIN_VERIFIED_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });

  return response;
}

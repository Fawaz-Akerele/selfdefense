import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import {
  getAdminLoginPath,
  getRequiredCapability,
  getSuperAdminEmailFromDb,
  getUserAdminContext,
  isAdminLoginPath,
  SUPERADMIN_VERIFIED_COOKIE,
  userHasCapability,
} from "@/lib/auth/admin-access";
import { isScreenshotMode } from "@/lib/auth/screenshot-mode";

export async function updateSession(request: NextRequest) {
  if (isScreenshotMode()) {
    return NextResponse.next({ request });
  }
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(url, key, {
    db: { schema: "sydef" },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const loginPath = getAdminLoginPath();

  if (isAdminLoginPath(pathname)) {
    return supabaseResponse;
  }

  if (!user && (pathname.startsWith("/portal") || pathname.startsWith("/admin"))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth";
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname.startsWith("/admin")) {
    const superAdminEmail = await getSuperAdminEmailFromDb(supabase);
    const ctx = await getUserAdminContext(
      supabase,
      user.id,
      user.email,
      superAdminEmail
    );

    if (!ctx.hasAdminAccess) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/portal";
      return NextResponse.redirect(redirectUrl);
    }

    if (ctx.isSuperAdmin) {
      const verified =
        request.cookies.get(SUPERADMIN_VERIFIED_COOKIE)?.value === "1";
      if (!verified) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = loginPath;
        redirectUrl.searchParams.set("verify", "1");
        return NextResponse.redirect(redirectUrl);
      }
    }

    const required = getRequiredCapability(pathname);
    if (
      required &&
      !userHasCapability(ctx.capabilities, ctx.isSuperAdmin, required)
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin";
      return NextResponse.redirect(redirectUrl);
    }

    if (pathname.startsWith("/admin/settings/superadmin") && !ctx.isSuperAdmin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}

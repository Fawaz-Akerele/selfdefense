import Link from "next/link";
import { redirect } from "next/navigation";
import { SydefLogo } from "@/components/brand/sydef-logo";
import { createClient } from "@/lib/supabase/server";
import { getSuperAdminEmailFromDb, getUserAdminContext } from "@/lib/auth/admin-access";
import {
  shouldUseMockData,
  MOCK_PROFILE,
  getMockBookingsForPortal,
  getMockEnrollmentsForPortal,
  getMockNotificationsForPortal,
} from "@/lib/mock";

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const params = await searchParams;

  if (shouldUseMockData()) {
    const enrollments = getMockEnrollmentsForPortal();
    const bookings = getMockBookingsForPortal();
    const notifications = getMockNotificationsForPortal();

    return (
      <div className="min-h-screen bg-neutral-50">
        <header className="border-b bg-white px-6 py-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <div>
              <Link href="/" className="inline-block hover:opacity-90">
                <SydefLogo size="sm" />
              </Link>
              <p className="mt-1 text-xs text-neutral-500">{MOCK_PROFILE.full_name}</p>
            </div>
            <div className="flex gap-3 text-sm">
              <Link href="/" className="text-neutral-600 hover:text-neutral-900">
                Home
              </Link>
              <Link href="/api/auth/signout" className="text-neutral-600 hover:text-neutral-900">
                Sign out
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
          {params.payment === "success" && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              Payment confirmed. Your enrollment will appear below shortly.
            </div>
          )}
          <section>
            <h1 className="text-2xl font-semibold">Your courses</h1>
            <div className="mt-4 space-y-2">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="rounded-xl border bg-white p-4 text-sm">
                  <p className="font-medium">{enrollment.title}</p>
                  <p className="mt-1 text-neutral-500">Progress: {enrollment.progress_percent}%</p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-lg font-semibold">Bookings</h2>
            <div className="mt-4 space-y-2">
              {bookings.map((booking) => (
                <div key={booking.id} className="rounded-xl border bg-white p-4 text-sm">
                  <p className="font-medium">{booking.classTitle}</p>
                  <p className="mt-1 capitalize text-neutral-500">{booking.status}</p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-lg font-semibold">Notifications</h2>
            <div className="mt-4 space-y-2">
              {notifications.map((notification) => (
                <div key={notification.id} className="rounded-xl border bg-white p-4 text-sm">
                  <p className="font-medium">{notification.title}</p>
                  <p className="mt-1 text-neutral-600">{notification.body}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?redirect=/portal");
  const superAdminEmail = await getSuperAdminEmailFromDb(supabase);
  const adminCtx = await getUserAdminContext(
    supabase,
    user.id,
    user.email,
    superAdminEmail
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, role")
    .eq("id", user.id)
    .single();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, progress_percent, class_id")
    .eq("user_id", user.id)
    .limit(10);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, status, created_at, class_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const classIds = [
    ...new Set([
      ...((enrollments ?? []).map((e) => e.class_id)),
      ...((bookings ?? []).map((b) => b.class_id)),
    ]),
  ];

  const { data: classes } = classIds.length
    ? await supabase.from("classes").select("id, title").in("id", classIds)
    : { data: [] };

  const classMap = new Map(
    ((classes ?? []) as { id: string; title: string }[]).map((c) => [c.id, c.title])
  );

  const profileRow = profile as {
    full_name: string | null;
    phone: string | null;
    role: string;
  } | null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <Link href="/" className="inline-block hover:opacity-90">
              <SydefLogo size="sm" />
            </Link>
            <p className="mt-1 text-xs text-neutral-500">
              {profileRow?.full_name ?? profileRow?.phone ?? user.email ?? user.id}
            </p>
          </div>
          <div className="flex gap-3 text-sm">
            <Link href="/portal/preferences" className="text-neutral-600 hover:text-neutral-900">
              Scheduling
            </Link>
            <Link href="/portal/plans" className="text-neutral-600 hover:text-neutral-900">
              Plans
            </Link>
            <Link href="/" className="text-neutral-600 hover:text-neutral-900">
              Home
            </Link>
            {adminCtx.hasAdminAccess && (
              <Link href="/admin" className="text-neutral-600 hover:text-neutral-900">
                Admin
              </Link>
            )}
            <Link href="/api/auth/signout" className="text-neutral-600 hover:text-neutral-900">
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        {params.payment === "success" && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            Payment confirmed. Your enrollment will appear below shortly.
          </div>
        )}

        <section>
          <h1 className="text-2xl font-semibold">Your courses</h1>
          <div className="mt-4 space-y-2">
            {(enrollments ?? []).length === 0 ? (
              <p className="text-sm text-neutral-500">No enrollments yet.</p>
            ) : (
              (enrollments ?? []).map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="rounded-xl border bg-white p-4 text-sm"
                >
                  <p className="font-medium">
                    {classMap.get(enrollment.class_id) ?? "Course"}
                  </p>
                  <p className="mt-1 text-neutral-500">
                    Progress: {enrollment.progress_percent}%
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Bookings</h2>
          <div className="mt-4 space-y-2">
            {(bookings ?? []).length === 0 ? (
              <p className="text-sm text-neutral-500">No bookings yet.</p>
            ) : (
              (bookings ?? []).map((booking) => (
                <div key={booking.id} className="rounded-xl border bg-white p-4 text-sm">
                  <p className="font-medium">{classMap.get(booking.class_id) ?? "Class"}</p>
                  <p className="mt-1 capitalize text-neutral-500">{booking.status}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Notifications</h2>
          <div className="mt-4 space-y-2">
            {(notifications ?? []).length === 0 ? (
              <p className="text-sm text-neutral-500">No notifications yet.</p>
            ) : (
              (notifications ?? []).map((notification) => (
                <div key={notification.id} className="rounded-xl border bg-white p-4 text-sm">
                  <p className="font-medium">{notification.title}</p>
                  <p className="mt-1 text-neutral-600">{notification.body}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

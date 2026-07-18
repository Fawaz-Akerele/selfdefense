import Link from "next/link";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import {
  shouldUseMockData,
  getMockClassesForAdmin,
  getMockArticlesForAdmin,
} from "@/lib/mock";

export default async function AdminContentPage() {
  const { supabase } = await requireAdminAccess("content");

  let classRows = getMockClassesForAdmin();
  let articleRows = getMockArticlesForAdmin();

  if (!shouldUseMockData()) {
    const [{ data: classes }, { data: articles }] = await Promise.all([
      supabase
        .from("classes")
        .select("id, title, type, price_ngn, is_published")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("articles")
        .select("id, title, status, published_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    classRows = (classes ?? []) as typeof classRows;
    articleRows = (articles ?? []) as typeof articleRows;
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm text-neutral-500">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Content CMS</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Published classes and articles from the database.
        </p>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Classes</h2>
          <div className="mt-4 space-y-2">
            {classRows.length === 0 ? (
              <p className="text-sm text-neutral-500">No classes yet.</p>
            ) : (
              classRows.map((item) => (
                <div key={item.id} className="rounded-xl border bg-white p-4 text-sm">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-neutral-500">
                    {item.type} · ₦{item.price_ngn.toLocaleString()} ·{" "}
                    {item.is_published ? "Published" : "Draft"}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Articles</h2>
          <div className="mt-4 space-y-2">
            {articleRows.length === 0 ? (
              <p className="text-sm text-neutral-500">No articles yet.</p>
            ) : (
              articleRows.map((item) => (
                <div key={item.id} className="rounded-xl border bg-white p-4 text-sm">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 capitalize text-neutral-500">{item.status}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

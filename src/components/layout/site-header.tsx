import Link from "next/link";
import { SydefLogo } from "@/components/brand/sydef-logo";

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="hover:opacity-90">
          <SydefLogo size="sm" />
        </Link>
        <a
          href="/auth"
          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
        >
          Sign in
        </a>
      </div>
    </header>
  );
}

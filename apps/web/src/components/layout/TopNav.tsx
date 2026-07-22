"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/layout/SidebarContext";

const navLinkClass = (active: boolean) =>
  `text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
    active
      ? "text-accent bg-accent-muted"
      : "text-muted hover:text-foreground hover:bg-background"
  }`;

export function TopNav() {
  const pathname = usePathname();
  const { toggle, open } = useSidebar();
  const isHome = pathname === "/";
  const isBuild =
    pathname === "/app" ||
    (pathname.startsWith("/projects/") && !pathname.includes("/migration"));
  const isMigration =
    pathname === "/migration" || pathname.includes("/migration");

  return (
    <header className="h-12 flex-shrink-0 border-b border-border bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        <button
          type="button"
          onClick={toggle}
          className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-background transition-colors flex-shrink-0"
          aria-label={open ? "Collapse navigation" : "Expand navigation"}
          aria-expanded={open}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="font-semibold text-foreground text-sm hidden sm:inline truncate">
            CloudArch
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/" className={navLinkClass(isHome)}>
            Home
          </Link>
          <Link href="/app" className={navLinkClass(isBuild && !isMigration)}>
            Build
          </Link>
          <Link href="/migration" className={navLinkClass(isMigration)}>
            Migration
          </Link>
        </nav>
      </div>
      <p className="text-[10px] text-muted hidden md:block flex-shrink-0">
        GovCloud · us-gov-west-1
      </p>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppHeaderProps {
  projectId?: string;
}

export function AppHeader({ projectId }: AppHeaderProps) {
  const pathname = usePathname();
  const base = projectId ? `/projects/${projectId}` : "";

  const links = projectId
    ? [
        { href: `${base}/blueprint`, label: "Blueprint" },
        { href: `${base}/compare`, label: "Compare" },
        { href: `${base}/cost`, label: "Cost" },
        { href: `${base}/deploy`, label: "Deploy" },
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/learn", label: "Learn" },
      ];

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-surface/80 backdrop-blur-md border-b border-outline-variant z-50 flex justify-between items-center px-margin-edge">
      <div className="flex items-center gap-10">
        <Link href="/" className="font-display text-2xl font-bold text-primary tracking-tight">
          CloudArch Architect
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-body-md transition-colors pb-1 ${
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "text-primary border-b-2 border-primary font-bold"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-gutter">
        <Link
          href="/learn"
          className="hidden md:inline text-body-sm text-on-surface-variant hover:text-primary"
        >
          Learning Hub
        </Link>
        {projectId && (
          <Link
            href={`/projects/${projectId}/deploy`}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            Export IaC
          </Link>
        )}
      </div>
    </header>
  );
}

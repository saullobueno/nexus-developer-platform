"use client";

import { cn } from "@nexus/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { label: "Metrics", href: "/observability/metrics" },
  { label: "Logs", href: "/observability/logs" },
  { label: "Traces", href: "/observability/traces" },
  { label: "Errors", href: "/observability/errors" },
];

export function ObservabilityNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b">
      {SECTIONS.map((section) => {
        const isActive = pathname.startsWith(section.href);
        return (
          <Link
            key={section.href}
            href={section.href}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import { cn } from "@nexus/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DocsNav() {
  const pathname = usePathname();
  const isAdrs = pathname.startsWith("/docs/adrs");
  const isDocuments = !isAdrs;

  return (
    <nav className="flex gap-1 border-b">
      <Link
        href="/docs"
        className={cn(
          "border-b-2 px-3 py-2 text-sm font-medium",
          isDocuments
            ? "border-primary text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground",
        )}
      >
        Documents
      </Link>
      <Link
        href="/docs/adrs"
        className={cn(
          "border-b-2 px-3 py-2 text-sm font-medium",
          isAdrs
            ? "border-primary text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground",
        )}
      >
        ADRs
      </Link>
    </nav>
  );
}

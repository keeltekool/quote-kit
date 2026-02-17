"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";

const navItems = [
  { key: "dashboard", href: "/dashboard" as const },
  { key: "quotes", href: "/quotes" as const },
  { key: "invoices", href: "/invoices" as const },
  { key: "clients", href: "/clients" as const },
  { key: "services", href: "/services" as const },
  { key: "settings", href: "/settings" as const },
] as const;

export function MobileNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-white">
        <h1 className="text-lg font-bold">QuoteKit</h1>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-md hover:bg-surface"
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-b border-border bg-white px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

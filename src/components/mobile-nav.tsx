"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { QuoteKitLogo } from "@/components/quotekit-logo";

// Same color-coding as desktop sidebar
const sectionStyles: Record<string, string> = {
  dashboard: "bg-[#EDF2F5] text-fjord-700 font-semibold",
  quotes:    "bg-cyan-50 text-cyan-600 font-semibold",
  invoices:  "bg-[#F5F3F7] text-[#6B5B73] font-semibold",
  clients:   "bg-emerald-50 text-emerald-600 font-semibold",
  services:  "bg-[#FBF8F1] text-[#92702D] font-semibold",
  settings:  "bg-[#F0F3F5] text-fjord-600 font-semibold",
};

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
        <QuoteKitLogo variant="compact" />
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-md hover:bg-fjord-50 text-fjord-600"
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
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
        <nav className="border-b border-border bg-white px-3 py-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? sectionStyles[item.key] || "bg-fjord-50 text-fjord-700 font-semibold"
                    : "text-fjord-600 hover:bg-gray-50"
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

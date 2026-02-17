import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["et", "en"],
  defaultLocale: "et",
  localePrefix: "as-needed", // ET (default) has no prefix, EN uses /en/...
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

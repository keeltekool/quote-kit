import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { OfflineIndicator } from "@/components/offline-indicator";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "QuoteKit — Professionaalsed pakkumised ja arved",
  description:
    "AI-põhine pakkumiste ja arvete koostamine Eesti käsitöölistele. Seaduslik, kiire, professionaalne.",
  manifest: "/manifest.json",
  themeColor: "#2563EB",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QuoteKit",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html suppressHydrationWarning>
        <head>
          <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        </head>
        <body className={`${inter.variable} font-sans antialiased`}>
          <OfflineIndicator />
          <ServiceWorkerRegister />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

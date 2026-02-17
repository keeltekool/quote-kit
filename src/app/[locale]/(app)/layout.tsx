import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <MobileNav />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

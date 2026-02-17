import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { getBusinessProfile } from "@/lib/db/queries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Redirect to onboarding if no profile
  const profile = await getBusinessProfile(userId);
  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MobileNav />
      <div className="flex flex-1">
        <AppSidebar />
        <main className="flex-1 p-6 lg:p-8 bg-white">{children}</main>
      </div>
    </div>
  );
}

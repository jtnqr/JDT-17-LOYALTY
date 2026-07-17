"use client";

import React, { Suspense } from "react";
import { MemberSidebar } from "@/components/organisms/MemberSidebar";
import { DesktopNavbar } from "@/components/organisms/DesktopNavbar";
import { BottomNavigation } from "@/components/organisms/BottomNavigation";
import { useMember } from "@/lib/hooks/useMember";
import { usePathname } from "next/navigation";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const { member, isLoaded, logout } = useMember();
  const pathname = usePathname();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Get active tab from pathname
  const rawTab = pathname.split("/")[1] || "dashboard";
  const activeTab = (
    ["home", "rewards", "exchange", "history", "profile"].includes(rawTab)
      ? rawTab
      : rawTab === "dashboard"
      ? "home"
      : "home"
  ) as "home" | "rewards" | "exchange" | "history" | "profile";

  // Get dynamic title/breadcrumbs based on path
  let title = "Dashboard";
  let breadcrumbs = [{ label: "Home" }];

  if (pathname.startsWith("/rewards")) {
    title = "Rewards Catalog";
    breadcrumbs = [{ label: "Marketplace" }, { label: "Rewards" }];
  } else if (pathname.startsWith("/exchange")) {
    title = "Exchange Center";
    breadcrumbs = [{ label: "Marketplace" }, { label: "Exchange" }];
  } else if (pathname.startsWith("/history")) {
    title = "Transaction History";
    breadcrumbs = [{ label: "Account" }, { label: "History" }];
  } else if (pathname.startsWith("/profile")) {
    title = "My Profile";
    breadcrumbs = [{ label: "Profile" }];
  }

  if (!mounted || !isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#8B3D06] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#FDFDFD] md:bg-neutral-50 font-sans flex overflow-hidden">
      {/* PERSISTENT SIDEBAR */}
      <MemberSidebar
        className="hidden md:flex"
        activeTab={activeTab}
        userName={member?.name || "Budi Santoso"}
      />

      <div className="flex-grow flex flex-col min-w-0 h-full overflow-hidden">
        {/* PERSISTENT NAVBAR */}
        <DesktopNavbar
          userName={member?.name || "Budi Santoso"}
          onLogout={logout}
          breadcrumbs={breadcrumbs}
          title={title}
        />

        <div className="flex-grow overflow-hidden relative">
          {children}
        </div>
      </div>

      {/* PERSISTENT MOBILE NAV */}
      <BottomNavigation />
    </div>
  );
}

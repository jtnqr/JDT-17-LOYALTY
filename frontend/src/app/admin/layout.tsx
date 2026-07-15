"use client";

import React from "react";
import { AdminSidebar } from "@/components/organisms/AdminSidebar";
import { useAdmin } from "@/lib/hooks/useAdmin";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useAdmin();
  const pathname = usePathname();

  // Get active tab from pathname
  const rawTab = pathname.split("/")[2] || "dashboard";
  const activeTab = (
    ["dashboard", "exchange", "transactions", "members", "rewards", "partners"].includes(rawTab)
      ? rawTab
      : "dashboard"
  ) as "dashboard" | "exchange" | "transactions" | "members" | "rewards" | "partners";

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex font-sans">
      <AdminSidebar activeTab={activeTab} />
      <main className="flex-grow flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}

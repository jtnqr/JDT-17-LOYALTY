"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileSpreadsheet,
  Settings,
  ArrowLeftRight,
} from "lucide-react";

interface SidebarItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}

function SidebarItem({ href, label, icon, active }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-3.5 px-6 py-3.5 text-sm font-semibold transition-all select-none border-l-4",
        active
          ? "bg-[#FCF5F1] text-[#8B3D06] border-l-[#8B3D06]"
          : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50/50 border-l-transparent"
      )}
    >
      <div
        className={cn(
          "w-5 h-5 flex items-center justify-center shrink-0",
          active ? "text-[#8B3D06]" : "text-neutral-400"
        )}
      >
        {icon}
      </div>
      <span>{label}</span>
    </Link>
  );
}

interface AdminSidebarProps {
  className?: string;
  activeTab?:
    | "dashboard"
    | "members"
    | "partners"
    | "transactions"
    | "exchange";
}

export function AdminSidebar({ className, activeTab }: AdminSidebarProps) {
  const pathname = usePathname();

  // Helper to check active state based on route pathname or explicit activeTab override
  const isTabActive = (tabName: string, path: string) => {
    if (activeTab) return activeTab === tabName;
    return pathname === path || pathname.startsWith(path + "/");
  };

  const menuItems = [
    {
      tab: "dashboard",
      href: "/admin",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      tab: "members",
      href: "/admin/members",
      label: "Members",
      icon: <Users className="w-5 h-5" />,
    },
    {
      tab: "partners",
      href: "/admin/partners",
      label: "Partners",
      icon: <Building2 className="w-5 h-5" />,
    },
    {
      tab: "transactions",
      href: "/admin/transactions",
      label: "Transactions",
      icon: <FileSpreadsheet className="w-5 h-5" />,
    },
    {
      tab: "exchange",
      href: "/admin/exchange",
      label: "Exchange",
      icon: <ArrowLeftRight className="w-5 h-5" />,
    },
  ];

  return (
    <aside
      className={cn(
        "w-60 h-screen bg-white border-r border-neutral-200 flex flex-col justify-between shrink-0 sticky top-0 z-40",
        className
      )}
    >
      <div className="flex flex-col flex-1">
        {/* Brand Logo Header */}
        <div className="px-6 pt-8 pb-10">
          <Link href="/admin/members" className="inline-block group">
            <h1 className="text-2xl font-black text-[#8B3D06] leading-none tracking-tight">
              LoyaltyHub
            </h1>
            <h2 className="text-2xl font-black text-[#8B3D06] leading-none tracking-tight mt-1">
              CMS
            </h2>
          </Link>
        </div>

        {/* Menu Navigation items */}
        <nav className="flex flex-col">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isTabActive(item.tab, item.href)}
            />
          ))}
        </nav>
      </div>

      {/* Admin User Profile Bottom section */}
      <div className="p-6 border-t border-neutral-200/80 bg-white">
        <div className="flex items-center gap-3">
          {/* AD Solid Badge */}
          <div className="w-10 h-10 rounded-full bg-[#8B3D06] flex items-center justify-center font-extrabold text-white text-sm select-none shadow-sm shadow-[#8B3D06]/15 shrink-0">
            AD
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-neutral-900 leading-none truncate">
              Admin User
            </p>
            <p className="text-[10px] text-neutral-400 font-semibold mt-1 truncate">
              Super Administrator
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default AdminSidebar;

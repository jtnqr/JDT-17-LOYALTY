"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar } from "../atoms/Avatar";
import {
  Home,
  Gift,
  RefreshCw,
  Clock,
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
      <div className={cn("w-5 h-5 flex items-center justify-center shrink-0", active ? "text-[#8B3D06]" : "text-neutral-400")}>
        {icon}
      </div>
      <span>{label}</span>
    </Link>
  );
}

interface MemberSidebarProps {
  className?: string;
  activeTab?: "home" | "rewards" | "exchange" | "history";
  userName?: string;
  userTier?: string;
}

export function MemberSidebar({
  className,
  activeTab,
  userName = "Budi Santoso",
  userTier = "Gold Member",
}: MemberSidebarProps) {
  const pathname = usePathname();

  const isTabActive = (tabName: string, path: string) => {
    if (activeTab) return activeTab === tabName;
    return pathname === path || pathname.startsWith(path + "/");
  };

  const menuItems = [
    {
      tab: "home",
      href: "/dashboard",
      label: "Home",
      icon: <Home className="w-5 h-5" />,
    },
    {
      tab: "rewards",
      href: "/rewards",
      label: "Rewards",
      icon: <Gift className="w-5 h-5" />,
    },
    {
      tab: "exchange",
      href: "/exchange",
      label: "Exchange",
      icon: <RefreshCw className="w-5 h-5" />,
    },
    {
      tab: "history",
      href: "/history",
      label: "History",
      icon: <Clock className="w-5 h-5" />,
    },
  ];

  return (
    <aside
      className={cn(
        "w-60 h-screen bg-white border-r border-neutral-200 flex flex-col justify-between shrink-0 sticky top-0 z-40 transition-all duration-300 ease-in-out",
        className
      )}
    >
      <div className="w-60 h-full flex flex-col justify-between shrink-0">
        <div className="flex flex-col flex-1">
          {/* Brand Logo Header */}
          <div className="px-6 pt-8 pb-10">
            <Link href="/dashboard" className="inline-block">
              <h1 className="text-2xl font-black text-[#8B3D06] leading-none tracking-tight">
                LoyaltyHub
              </h1>
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

        {/* Member Profile Bottom section */}
        <div className="p-6 border-t border-neutral-200/80 bg-white">
          <div className="flex items-center gap-3">
            <Avatar name={userName} className="w-10 h-10 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-neutral-900 leading-none truncate">
                {userName}
              </p>
              <p className="text-[10px] text-neutral-400 font-semibold mt-1 truncate">
                {userTier}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default MemberSidebar;

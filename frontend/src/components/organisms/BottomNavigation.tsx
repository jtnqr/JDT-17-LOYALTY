"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Gift, RefreshCw, Clock } from "lucide-react";
import { useMember } from "@/lib/hooks/useMember";
import Avatar from "../atoms/Avatar";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}

function NavItem({ href, label, icon, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center py-1.5 flex-1 transition-all select-none",
        active
          ? "text-[#8B3D06] font-semibold"
          : "text-neutral-400 hover:text-neutral-500"
      )}
    >
      <div
        className={cn(
          "transition-transform duration-200",
          active && "scale-110"
        )}
      >
        {icon}
      </div>
      <span className="text-[11px] mt-1 tracking-tight">{label}</span>
    </Link>
  );
}

export function BottomNavigation() {
  const { member } = useMember();
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: "Home",
      icon: <Home className="w-5.5 h-5.5" />,
    },
    {
      href: "/rewards",
      label: "Rewards",
      icon: <Gift className="w-5.5 h-5.5" />,
    },
    {
      href: "/exchange",
      label: "Exchange",
      icon: <RefreshCw className="w-5.5 h-5.5" />,
    },
    {
      href: "/history",
      label: "History",
      icon: <Clock className="w-5.5 h-5.5" />,
    },
    {
      href: "/profile",
      label: "Profile",
      icon: <Avatar name={member?.name} className="w-6 h-6" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-neutral-100 flex items-center justify-around z-40 px-2 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] md:hidden">
      {navItems.map((item) => (
        <NavItem
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={pathname === item.href}
        />
      ))}
    </nav>
  );
}

export default BottomNavigation;

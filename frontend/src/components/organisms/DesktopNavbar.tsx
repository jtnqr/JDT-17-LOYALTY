"use client";

import React from "react";
import { Avatar } from "../atoms/Avatar";
import { Bell, Search, Menu } from "lucide-react";

interface DesktopNavbarProps {
  userName?: string;
  userTier?: string;
  onLogout?: () => void;
  onToggleMenu?: () => void;
  showBrand?: boolean;
}

export function DesktopNavbar({
  userName = "Alex Thompson",
  userTier = "Gold Member",
  onLogout,
  onToggleMenu,
  showBrand = true,
}: DesktopNavbarProps) {
  return (
    <header className="hidden md:flex h-16 border-b border-neutral-200/50 bg-white px-8 items-center justify-between sticky top-0 z-50 shadow-sm">
      {/* Left: Brand Logo & Hamburger Menu */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMenu}
          className="text-neutral-500 hover:text-neutral-700 focus:outline-none cursor-pointer p-1 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        {showBrand && (
          <div className="flex items-center gap-2 text-brand-primary animate-in fade-in duration-300">
            <span className="font-extrabold text-xl tracking-tight">LoyaltyHub</span>
          </div>
        )}
      </div>

      {/* Middle: Search Bar */}
      <div className="flex-1 max-w-lg mx-8 relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Search rewards, brands, or history..."
          className="w-full bg-[#F1F3F4] text-neutral-700 pl-10 pr-4 py-2 rounded-full text-xs outline-none border border-transparent focus:bg-white focus:border-neutral-200 focus:ring-1 focus:ring-neutral-200 transition-all font-medium placeholder:text-neutral-400"
        />
      </div>

      {/* Right: Notification & User Info */}
      <div className="flex items-center gap-5">
        <button className="relative text-neutral-600 hover:text-neutral-800 transition-colors cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-brand-primary" />
        </button>

        <div className="w-[1.5px] h-6 bg-neutral-200" />

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold text-neutral-900 leading-none">{userName}</p>
            <span className="text-[10px] text-neutral-400 font-semibold mt-1 block">
              {userTier}
            </span>
          </div>
          <Avatar name={userName} className="w-9 h-9" />
        </div>
        
        {onLogout && (
          <button
            onClick={onLogout}
            className="text-xs font-bold text-neutral-400 hover:text-brand-primary transition-colors cursor-pointer ml-1"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
}

export default DesktopNavbar;

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
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
}

export function DesktopNavbar({
  userName = "Alex Thompson",
  userTier = "Gold Member",
  onLogout,
  onToggleMenu,
  showBrand = true,
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  showSearch = false,
}: DesktopNavbarProps) {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsPopoverOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
            <span className="font-extrabold text-xl tracking-tight">
              Pistos APP
            </span>
          </div>
        )}
      </div>

      {/* Middle: Search Bar */}
      {showSearch ? (
        <div className="flex-1 max-w-lg mx-8 relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full bg-[#F1F3F4] text-neutral-700 pl-10 pr-4 py-2 rounded-full text-xs outline-none border border-transparent focus:bg-white focus:border-neutral-200 focus:ring-1 focus:ring-neutral-200 transition-all font-medium placeholder:text-neutral-400"
          />
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Right: Notification & User Info */}
      <div className="flex items-center gap-5">
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setIsPopoverOpen((prev) => !prev)}
            className="group flex items-center gap-3 hover:ring-2 cursor-pointer hover:ring-neutral-200 hover:rounded-xl p-1 transition-all focus:outline-none"
            aria-expanded={isPopoverOpen}
            aria-haspopup="true"
          >
            <div className="text-right">
              <p className="text-xs font-bold text-neutral-900 leading-none">
                {userName}
              </p>
            </div>
            <Avatar name={userName} className="w-9 h-9" />
          </button>

          {/* User Actions Popover */}
          {isPopoverOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200/60 rounded-2xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {onLogout && (
                <button
                  onClick={() => {
                    setIsPopoverOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign Out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default DesktopNavbar;

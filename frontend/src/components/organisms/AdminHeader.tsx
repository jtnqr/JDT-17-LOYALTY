"use client";

import React from "react";
import { ChevronRight, Search } from "lucide-react";
import Avatar from "../atoms/Avatar";
import { useAdmin } from "@/lib/hooks/useAdmin";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
}

export interface AdminHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
}

export function AdminHeader({
  breadcrumbs,
  title,
  searchQuery,
  setSearchQuery,
  searchPlaceholder = "Search...",
  showSearch = false,
}: AdminHeaderProps) {
  const { admin, isLoaded, logout } = useAdmin();
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
    <header className="h-16 border-b border-neutral-200/50 shadow-sm bg-white px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
          <span>Admin</span>
          {breadcrumbs.map((item, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3 h-3 text-neutral-300" />
              <span
                className={
                  idx === breadcrumbs.length - 1
                    ? "text-neutral-600 font-bold"
                    : "text-neutral-500"
                }
              >
                {item.label}
              </span>
            </React.Fragment>
          ))}
        </div>
        <h2 className="text-lg font-black text-neutral-900 mt-0.5 leading-none">
          {title}
        </h2>
      </div>

      {showSearch && setSearchQuery && (
        <div className="relative w-80 max-w-sm hidden md:block">
          <Search className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", searchQuery ? "text-[#8B3D06]" : "text-neutral-400")} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              "w-full text-xs pl-10 pr-4 py-2 border rounded-xl outline-none focus:bg-white focus:border-[#8B3D06] transition-all font-semibold placeholder:text-neutral-400",
              searchQuery
                ? "bg-[#FCF5F1] border-[#8B3D06] text-[#8B3D06]"
                : "bg-neutral-50 border-neutral-200 text-neutral-800"
            )}
          />
        </div>
      )}

      <div className="flex items-center gap-6">
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setIsPopoverOpen((prev) => !prev)}
            className="group flex items-center gap-3 cursor-pointer hover:ring-2 hover:ring-neutral-200 hover:rounded-xl p-1 transition-all focus:outline-none"
            aria-expanded={isPopoverOpen}
            aria-haspopup="true"
          >
            <div>
              <p className="text-xs font-bold text-neutral-700">
                {admin?.name || "Admin"}
              </p>
            </div>
            <Avatar name={admin?.name || "Admin"} className="w-9 h-9" />
          </button>

          {/* User Actions Popover */}
          {isPopoverOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200/60 rounded-2xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={() => {
                  setIsPopoverOpen(false);
                  logout();
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
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;

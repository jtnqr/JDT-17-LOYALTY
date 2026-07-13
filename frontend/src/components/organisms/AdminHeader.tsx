"use client";

import React from "react";
import { ChevronRight, Search, Bell } from "lucide-react";

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
  return (
    <header className="h-16 border-b border-neutral-200/50 bg-white px-8 flex items-center justify-between sticky top-0 z-30">
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

      <div className="flex items-center gap-6">
        {/* Search Bar in Header */}
        {showSearch && setSearchQuery && (
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F1F3F4] text-neutral-700 pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none border border-transparent focus:bg-white focus:border-neutral-200 transition-colors font-medium placeholder:text-neutral-400"
            />
          </div>
        )}
      </div>
    </header>
  );
}

export default AdminHeader;

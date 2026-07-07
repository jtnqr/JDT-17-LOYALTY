"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Info, ArrowRight } from "lucide-react";
import Link from "next/link";

interface BalanceCardDesktopProps {
  partnerName: string;
  balance: number;
  badgeText: string;
  isKfc?: boolean;
}

export function BalanceCardDesktop({
  partnerName,
  balance,
  badgeText,
  isKfc = false,
}: BalanceCardDesktopProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl p-5 border border-neutral-200/50 shadow-sm flex flex-col justify-between h-44 transition-all hover:shadow-md border-t-4",
        isKfc ? "border-t-[#C8102E]" : "border-t-[#FFC72C]"
      )}
    >
      {/* Top row: Icon and Badge */}
      <div className="flex items-center justify-between">
        {/* Brand Icon Container */}
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner",
            isKfc
              ? "bg-[#FFEBEE] text-[#C8102E]"
              : "bg-yellow-50 text-[#D89F0E]"
          )}
        >
          {isKfc ? (
            // Custom KFC Burger/Bucket icon SVG representation
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"
                className="hidden"
              />
              {/* Box or bucket shape */}
              <path d="M4 8h16l-2 12H6L4 8zm8 2a3 3 0 0 0-3 3h6a3 3 0 0 0-3-3z" />
            </svg>
          ) : (
            // McDonald's Fries representation
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              {/* Fries shape */}
              <path d="M5 10h14v10H5V10zm2 2v6h2v-6H7zm4 0v6h2v-6h-2zm4 0v6h2v-6h-2zM6 4h2v5H6V4zm4 1h2v4h-2V5zm4-2h2v7h-2V3z" />
            </svg>
          )}
        </div>

        {/* Status Pill Badge */}
        <span
          className={cn(
            "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide",
            isKfc
              ? "bg-neutral-100 text-neutral-600 border border-neutral-200/20"
              : "bg-orange-50 text-brand-primary border border-orange-100/30"
          )}
        >
          {badgeText}
        </span>
      </div>

      {/* Middle: Brand Title & Balance */}
      <div className="mt-3">
        <p className="text-xs font-semibold text-neutral-500">{partnerName}</p>
        <p className="text-2xl font-black text-neutral-900 mt-0.5 tracking-tight">
          {balance.toLocaleString()}{" "}
          <span className="text-xs font-bold text-neutral-400">pts</span>
        </p>
      </div>

      {/* Bottom row: Conditional details */}
      <div className="border-t border-neutral-100 pt-3 flex items-center justify-between">
        {isKfc ? (
          // KFC Progress Bar Details
          <>
            <div className="flex-1 max-w-[130px] bg-neutral-100 h-2 rounded-full overflow-hidden">
              <div className="bg-[#B84C06] h-full rounded-full w-[60%]" />
            </div>
            <span className="text-[10px] text-neutral-500 font-bold ml-2">
              60% to 10pc Bucket
            </span>
          </>
        ) : (
          // McD Info & View Details link
          <>
            <button className="text-neutral-400 hover:text-neutral-600 transition-colors">
              <Info className="w-4 h-4" />
            </button>
            <Link
              href="/rewards"
              className="text-xs font-extrabold text-[#B84C06] hover:text-brand-primary flex items-center gap-1 group"
            >
              View Details
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default BalanceCardDesktop;

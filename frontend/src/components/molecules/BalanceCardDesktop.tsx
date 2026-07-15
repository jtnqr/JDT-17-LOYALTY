"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Info, ArrowRight, Coins } from "lucide-react";
import Link from "next/link";

interface BalanceCardDesktopProps {
  partnerName: string;
  balance: number;
  badgeText: string;
  partnerCode?: string;
  partnerId?: string;
  activeRewardsCount?: number;
}

export function BalanceCardDesktop({
  partnerName,
  balance,
  badgeText,
  partnerCode,
  partnerId,
  activeRewardsCount,
}: BalanceCardDesktopProps) {
  // Normalize partner code
  const code =
    (partnerCode || "").toUpperCase() ||
    (partnerName.toLowerCase().includes("kfc") ? "KFC" : "") ||
    (partnerName.toLowerCase().includes("mcd") ? "MCD" : "") ||
    "GENERIC";

  // Styles map
  const theme = {
    KFC: {
      borderTop: "border-t-[#C8102E]",
      iconBg: "bg-[#FFEBEE] text-[#C8102E]",
      badge: "bg-neutral-100 text-neutral-600 border border-neutral-200/20",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 8h16l-2 12H6L4 8zm8 2a3 3 0 0 0-3 3h6a3 3 0 0 0-3-3z" />
        </svg>
      ),
      bottom: (
        <>
          <div></div>
          <Link
            href="/rewards"
            className="text-xs font-extrabold text-[#B84C06] hover:text-brand-primary flex items-center gap-1 group"
          >
            View Details
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </>
      ),
    },
    MCD: {
      borderTop: "border-t-[#FFC72C]",
      iconBg: "bg-yellow-50 text-[#D89F0E]",
      badge: "bg-orange-50 text-brand-primary border border-orange-100/30",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 10h14v10H5V10zm2 2v6h2v-6H7zm4 0v6h2v-6h-2zm4 0v6h2v-6h-2zM6 4h2v5H6V4zm4 1h2v4h-2V5zm4-2h2v7h-2V3z" />
        </svg>
      ),
      bottom: (
        <>
          <div></div>
          <Link
            href="/rewards"
            className="text-xs font-extrabold text-[#B84C06] hover:text-brand-primary flex items-center gap-1 group"
          >
            View Details
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </>
      ),
    },
    GENERIC: {
      borderTop: "border-t-[#8B3D06]", // Brand-primary color
      iconBg: "bg-[#FCF5F1] text-[#8B3D06]",
      badge: "bg-neutral-50 text-neutral-600 border border-neutral-200/40",
      icon: <Coins className="w-5 h-5" />,
      bottom: (
        <>
          <button className="text-neutral-400 hover:text-neutral-600 transition-colors">
            <Info className="w-4 h-4" />
          </button>
          <Link
            href="/rewards"
            className="text-xs font-extrabold text-[#8B3D06] hover:text-brand-primary flex items-center gap-1 group"
          >
            View Rewards
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </>
      ),
    },
  };

  const activeTheme = theme[code as keyof typeof theme] || theme.GENERIC;

  return (
    <Link
      href="/rewards"
      onClick={() => {
        if (partnerId) {
          sessionStorage.setItem("selected_partner_filter", partnerId);
        }
      }}
      className="block group"
    >
      <div
        className={cn(
          "bg-white rounded-2xl p-5 border border-neutral-200/50 shadow-sm flex flex-col justify-between h-44 transition-all hover:shadow-md hover:-translate-y-0.5 border-t-4 cursor-pointer",
          activeTheme.borderTop
        )}
      >
        {/* Top row */}
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner",
              activeTheme.iconBg
            )}
          >
            {activeTheme.icon}
          </div>

          {activeRewardsCount !== undefined && (
            <span
              className={cn(
                "text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide shadow-sm",
                code === "KFC"
                  ? "bg-red-50 text-[#C8102E] border border-red-200/30"
                  : code === "MCD"
                  ? "bg-yellow-50 text-[#D89F0E] border border-yellow-200/30"
                  : "bg-neutral-50 text-neutral-600 border border-neutral-200/40"
              )}
            >
              {activeRewardsCount} Reward{activeRewardsCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Middle */}
        <div className="mt-3">
          <p className="text-xs font-semibold text-neutral-500">
            {partnerName}
          </p>

          <p className="text-2xl font-black text-neutral-900 mt-0.5 tracking-tight">
            {balance.toLocaleString()}{" "}
            <span className="text-xs font-bold text-neutral-400">pts</span>
          </p>
        </div>

        {/* Bottom */}
        <div className="border-t border-neutral-100 pt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-neutral-400">
            {/* <Info className="w-4 h-4" /> */}
          </div>

          <div className="group-hover:underline underline-offset-2 text-xs font-extrabold text-[#8B3D06] flex items-center gap-1 group">
            REDEEM NOW
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default BalanceCardDesktop;

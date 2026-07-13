"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMember } from "@/lib/hooks/useMember";
import { DesktopNavbar } from "@/components/organisms/DesktopNavbar";
import { MemberSidebar } from "@/components/organisms/MemberSidebar";
import { BalanceCardDesktop } from "@/components/molecules/BalanceCardDesktop";
import { BottomNavigation } from "@/components/organisms/BottomNavigation";
import Link from "next/link";
import axios from "axios";
import {
  Gift,
  RefreshCw,
  Clock,
  Coins,
  ChevronRight,
  LogOut,
  AlertTriangle,
  QrCode,
  Plus,
  ArrowRight,
  Award,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ArrowLeftRight,
  History,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Avatar from "@/components/atoms/Avatar";

// Mock Fallback Data (per docs/seed-data.sql & design brief)
const MOCK_BALANCES = [
  {
    partnerId: "660e8400-e29b-41d4-a716-446655440001",
    partnerName: "KFC Colonel's Club",
    balance: 1200,
  },
  {
    partnerId: "660e8400-e29b-41d4-a716-446655440002",
    partnerName: "McDonald's MyRewards",
    balance: 4850,
  },
];

const MOCK_TRANSACTIONS = [
  {
    id: "tx-uuid-001",
    type: "EXCHANGE_OUT",
    partnerName: "McDonald's Purchase",
    points: 450,
    timeText: "2 hours ago",
    createdAt: "2026-07-07T08:00:00Z",
  },
  {
    id: "tx-uuid-002",
    type: "REDEEM",
    partnerName: "Free Coffee Reward",
    points: -200,
    timeText: "Yesterday",
    createdAt: "2026-07-06T10:00:00Z",
  },
];

interface PointBalance {
  partnerId: string;
  partnerName: string;
  balance: number;
}

interface Transaction {
  id: string;
  type: string;
  partnerName: string;
  points: number;
  timeText?: string;
  trxAmountIDR?: number;
  createdAt: string;
}

export default function DashboardPage() {
  const { member, memberId, isLoaded, logout } = useMember();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  React.useEffect(() => {
    const saved = localStorage.getItem("member_sidebar_open");
    if (saved !== null) {
      setIsSidebarOpen(saved === "true");
    }
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem("member_sidebar_open", String(next));
      return next;
    });
  };

  // 1. Fetch Balances via React Query
  const { data: balanceData, isLoading: isBalancesLoading } = useQuery({
    queryKey: ["balances", memberId],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/v1/members/${memberId}/points`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.balances as PointBalance[];
    },
    enabled: !!memberId,
    retry: 1,
  });

  // 2. Fetch Recent Transactions via React Query
  const { data: transactionData, isLoading: isTrxsLoading } = useQuery({
    queryKey: ["recent-transactions", memberId],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `/api/v1/members/${memberId}/transactions?page=0&size=4`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.transactions as Transaction[];
    },
    enabled: !!memberId,
    retry: 1,
  });

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Bind values
  const apiBalances = balanceData || [];
  const kfcPoints =
    apiBalances.find((b) => b.partnerName.toLowerCase().includes("kfc"))
      ?.balance ?? 0;
  const mcdPoints =
    apiBalances.find((b) => b.partnerName.toLowerCase().includes("mcd"))
      ?.balance ?? 0;

  const combinedBalance = kfcPoints + mcdPoints;
  const estimatedValue = combinedBalance * 0.01; // $60.50 style

  const transactions = transactionData || [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="h-screen bg-[#FDFDFD] md:bg-neutral-50 font-sans flex overflow-hidden">
      {/* 1. DESKTOP SIDEBAR NAVIGATION (Hidden on Mobile) */}
      <MemberSidebar
        className={cn(
          "hidden md:flex transition-all duration-300 ease-in-out",
          isSidebarOpen
            ? "w-60 border-r border-neutral-200"
            : "w-0 overflow-hidden border-r-0"
        )}
        activeTab="home"
        userName={member?.name || "Budi Santoso"}
        userTier="Gold Member"
      />

      {/* 2. MAIN LAYOUT WRAPPER */}
      <div className="flex-grow flex flex-col min-w-0 h-full overflow-hidden">
        <DesktopNavbar
          userName={member?.name || "Budi Santoso"}
          userTier="Gold Member"
          onLogout={logout}
          onToggleMenu={handleToggleSidebar}
          showBrand={!isSidebarOpen}
        />

        {/* ========================================================
            MOBILE VIEW (Visible on Mobile inspect, hidden on Desktop)
            ======================================================== */}
        <div className="md:hidden flex-grow flex flex-col pb-20 overflow-y-auto">
          {/* Top Banner (Gradient Hero) */}
          <section className="pt-6 pb-4 px-5 text-white relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="font-bold text-2xl text-brand-primary tracking-wider">
                  LoyaltyHub
                </span>
              </div>
            </div>

            <div className="space-y-1 bg-linear-to-br from-brand-primary to-[#F4A261] p-6 rounded-lg">
              <h2 className="text-xl font-bold tracking-tight">
                {getGreeting()}, {member?.name?.split(" ")[0]} 👋
              </h2>
              <p className="text-xs text-white/80 font-medium">
                Ready to maximize your rewards today?
              </p>
            </div>
          </section>

          {/* Overlapping Balances List */}
          <section className="mt-6 px-5 z-10">
            <div className="flex justify-between items-center pb-2">
              <p className="font-semibold text-base">Your wallets</p>
              <p className="flex items-center text-brand-primary text-xs">
                View All <ArrowRight height={16} width={16} />
              </p>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none snap-x snap-mandatory">
              {isBalancesLoading ? (
                Array.from({ length: 2 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex-shrink-0 w-[170px] bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm animate-pulse space-y-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-neutral-200" />
                    <div className="h-3 bg-neutral-200 rounded w-1/2" />
                  </div>
                ))
              ) : apiBalances.length === 0 ? (
                <p className="text-xs text-neutral-400 italic py-4 px-2">No active wallets.</p>
              ) : (
                apiBalances.map((b) => {
                  const firstChar = b.partnerName ? b.partnerName.trim().charAt(0).toUpperCase() : "P";
                  const isKfc = b.partnerName.toLowerCase().includes("kfc");
                  const isMcd = b.partnerName.toLowerCase().includes("mcd");
                  
                  let borderTop = "border-t-[#8B3D06]";
                  let iconBg = "bg-[#FCF5F1] text-[#8B3D06]";
                  if (isKfc) {
                    borderTop = "border-t-[#C8102E]";
                    iconBg = "bg-red-50 text-[#C8102E]";
                  } else if (isMcd) {
                    borderTop = "border-t-[#FFC72C]";
                    iconBg = "bg-yellow-50 text-[#D89F0E]";
                  }

                  return (
                    <div
                      key={b.partnerId}
                      className={cn(
                        "flex-shrink-0 w-[170px] bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm border-t-4 snap-start",
                        borderTop
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-black text-xs mb-2 shadow-inner", iconBg)}>
                        {firstChar}
                      </div>
                      <p className="text-[11px] font-semibold text-neutral-500 truncate">
                        {b.partnerName}
                      </p>
                      <p className="text-2xl font-black text-neutral-900 mt-1 tracking-tight truncate">
                        {b.balance.toLocaleString()}{" "}
                        <span className="text-xs font-bold text-neutral-500">
                          pts
                        </span>
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Actions grid */}
          <section className="px-5 mt-6">
            <div className="rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.02)] border border-neutral-100/50">
              <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-3">
                Quick Actions
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <Link
                  href="/rewards"
                  className="flex flex-col items-center p-3 rounded-xl bg-gray-100/60 hover:bg-neutral-50 active:scale-95 transition-all text-center select-none"
                >
                  <div className="w-11 h-11 rounded-full bg-brand-primary text-brand-primary-light flex items-center justify-center shadow-sm border border-orange-100/50 mb-2">
                    <Gift className="w-5 h-5" />
                  </div>
                  <span className="text-[13px] font-bold text-neutral-700">
                    Redeem
                  </span>
                </Link>

                <Link
                  href="/exchange"
                  className="flex flex-col items-center p-3 rounded-xl bg-gray-100/60 hover:bg-neutral-50 active:scale-95 transition-all text-center select-none"
                >
                  <div className="w-11 h-11 rounded-full bg-brand-primary text-brand-primary-light flex items-center justify-center shadow-sm border border-blue-100/50 mb-2">
                    <ArrowLeftRight className="w-5 h-5" />
                  </div>
                  <span className="text-[13px] font-bold text-neutral-700">
                    Exchange
                  </span>
                </Link>

                <Link
                  href="/history"
                  className="flex flex-col items-center p-3 rounded-xl bg-gray-100/60 hover:bg-neutral-50 active:scale-95 transition-all text-center select-none"
                >
                  <div className="w-11 h-11 rounded-full bg-gray-600 text-white flex items-center justify-center shadow-sm border border-purple-100/50 mb-2">
                    <History className="w-5 h-5" />
                  </div>
                  <span className="text-[13px] font-bold text-neutral-700">
                    History
                  </span>
                </Link>
              </div>
            </div>
          </section>

          {/* Activity List */}
          <section className="px-5 mt-6 flex-grow">
            <div className="rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-black uppercase tracking-wider">
                  Recent Activity
                </h3>
                <Link
                  href="/history"
                  className="text-xs font-semibold text-brand-primary flex items-center gap-0.5 hover:underline"
                >
                  See All
                </Link>
              </div>

              <div className="space-y-4 bg-gray-100/70 rounded-xl p-2">
                {isTrxsLoading
                  ? Array.from({ length: 3 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 animate-pulse py-1"
                      />
                    ))
                  : transactions.map((tx) => {
                      const isEarn = tx.type === "EARN";
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between gap-3 border-b border-neutral-50 pb-3 last:border-0 last:pb-0"
                        >
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-neutral-900 leading-none">
                              {tx.partnerName}
                            </span>
                            <span className="text-[10px] text-neutral-400 mt-1">
                              {tx.timeText || "Transaction"}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "text-sm font-black",
                              isEarn ? "text-emerald-600" : "text-red-500"
                            )}
                          >
                            {isEarn ? "+" : ""}
                            {tx.points} pts
                          </span>
                        </div>
                      );
                    })}
              </div>
            </div>
          </section>

          {/* Tab Navigation */}
          <BottomNavigation />
        </div>

        {/* ========================================================
            DESKTOP VIEW (Visible on Desktop, hidden on Mobile)
            ======================================================== */}
        <div className="hidden md:flex flex-col flex-1 px-8 py-8 space-y-6 overflow-y-auto">
          {/* Welcome Hero Banner (Full Width) */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#8B3D06] via-[#A65B28] to-[#C17A4A] text-white p-6 shadow-md shadow-[#8B3D06]/10 shrink-0">
            <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none">
              <svg
                className="w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,100 C30,40 70,60 100,0 L100,100 Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="relative z-10 space-y-2">
              <h1 className="text-3xl font-black tracking-tight mt-2">
                Good afternoon, {member?.name || "Budi Santoso"}!
              </h1>
              <p className="text-sm text-neutral-100 max-w-xl font-medium leading-relaxed">
                Track, exchange, and redeem your reward points across all
                partner loyalty programs instantly.
              </p>
            </div>
          </section>

          {/* Main Layout Grid (3 Columns: QA, Points, Recent Activity) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Column 1: Quick Actions (QA) */}
            <div className="space-y-6">
              <section className="bg-white rounded-2xl p-5 border border-neutral-200/50 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-neutral-900">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-2 gap-3.5">
                  <Link
                    href="/rewards"
                    className="flex flex-col items-center justify-center p-4 border border-neutral-100 rounded-2xl hover:bg-neutral-50 active:scale-98 transition-all group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#FDF2E9] text-[#8B3D06] flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <Gift className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-neutral-700 mt-2.5 text-center">
                      Rewards Catalog
                    </span>
                  </Link>

                  <Link
                    href="/exchange"
                    className="flex flex-col items-center justify-center p-4 border border-neutral-100 rounded-2xl hover:bg-neutral-50 active:scale-98 transition-all group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#FDF2E9] text-[#8B3D06] flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-neutral-700 mt-2.5 text-center">
                      Exchange Points
                    </span>
                  </Link>

                  <Link
                    href="/history"
                    className="flex flex-col items-center justify-center p-4 border border-neutral-100 rounded-2xl hover:bg-neutral-50 active:scale-98 transition-all group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#FDF2E9] text-[#8B3D06] flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-neutral-700 mt-2.5 text-center">
                      Point History
                    </span>
                  </Link>

                  <Link
                    href="/profile"
                    className="flex flex-col items-center justify-center p-4 border border-neutral-100 rounded-2xl hover:bg-neutral-50 active:scale-98 transition-all group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#FDF2E9] text-[#8B3D06] flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-neutral-700 mt-2.5 text-center">
                      My Profile
                    </span>
                  </Link>
                </div>
              </section>
            </div>

            {/* Column 2: Points (P) */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-neutral-900 px-1">
                Your Point Balances
              </h2>
              {apiBalances.length === 0 ? (
                <p className="text-xs text-neutral-400 italic px-1">No active partner balances found.</p>
              ) : (
                apiBalances.map((b) => (
                  <BalanceCardDesktop
                    key={b.partnerId}
                    partnerName={b.partnerName}
                    balance={b.balance}
                    badgeText={b.partnerName.toLowerCase().includes("kfc") ? "EARNING" : "REDEEM NOW"}
                    partnerCode={b.partnerName.toLowerCase().includes("kfc") ? "KFC" : b.partnerName.toLowerCase().includes("mcd") ? "MCD" : "GENERIC"}
                  />
                ))
              )}
            </div>

            {/* Column 3: Recent Activity (R) */}
            <div className="space-y-6">
              <section className="bg-white rounded-2xl p-5 border border-neutral-200/50 shadow-sm flex flex-col justify-between h-[360px]">
                <div>
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-3.5">
                    <h3 className="text-sm font-bold text-neutral-900">
                      Recent Activity
                    </h3>
                    <Link
                      href="/history"
                      className="text-xs font-bold text-brand-primary hover:underline"
                    >
                      See all
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {transactions.slice(0, 4).map((tx) => {
                      const isEarn = tx.type === "EARN";
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center shrink-0">
                              {isEarn ? (
                                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-bold text-neutral-800 leading-tight truncate">
                                {tx.partnerName}
                              </p>
                              <span className="text-[10px] text-neutral-400 font-semibold mt-0.5 block truncate">
                                {tx.timeText || "Transaction"}
                              </span>
                            </div>
                          </div>
                          <span
                            className={cn(
                              "text-xs font-extrabold shrink-0",
                              isEarn ? "text-emerald-600" : "text-red-500"
                            )}
                          >
                            {isEarn ? "+" : ""}
                            {tx.points.toLocaleString()} pts
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

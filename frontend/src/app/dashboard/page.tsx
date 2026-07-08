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
} from "lucide-react";
import { cn } from "@/lib/utils";
import Avatar from "@/components/atoms/Avatar";

// Mock Fallback Data (per docs/seed-data.sql & design brief)
const MOCK_BALANCES = [
  { partnerId: "kfc-uuid", partnerName: "KFC Colonel's Club", balance: 1200 },
  { partnerId: "mcd-uuid", partnerName: "McDonald's MyRewards", balance: 4850 },
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
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

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
      ?.balance ??
    MOCK_BALANCES.find((b) => b.partnerName.toLowerCase().includes("kfc"))
      ?.balance ??
    0;
  const mcdPoints =
    apiBalances.find((b) => b.partnerName.toLowerCase().includes("mcd"))
      ?.balance ??
    MOCK_BALANCES.find((b) => b.partnerName.toLowerCase().includes("mcd"))
      ?.balance ??
    0;

  const combinedBalance = kfcPoints + mcdPoints;
  const estimatedValue = combinedBalance * 0.01; // $60.50 style

  const transactions = transactionData || MOCK_TRANSACTIONS;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] md:bg-neutral-50 font-sans flex overflow-hidden">
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
      <div className="flex-grow flex flex-col min-w-0">
        <DesktopNavbar
          userName={member?.name || "Budi Santoso"}
          userTier="Gold Member"
          onLogout={logout}
          onToggleMenu={() => setIsSidebarOpen((prev) => !prev)}
          showBrand={!isSidebarOpen}
        />

        {/* ========================================================
            MOBILE VIEW (Visible on Mobile inspect, hidden on Desktop)
            ======================================================== */}
        <div className="md:hidden flex-grow flex flex-col pb-20">
          {/* Top Banner (Gradient Hero) */}
          <section className="pt-6 pb-4 px-5 text-white relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="font-bold text-2xl text-brand-primary tracking-wider">
                  LoyaltyHub
                </span>
              </div>
              <div className="flex items-center gap-3 text-primary">
                <Bell className="w-5 h-5 text-brand-primary" />
                {/* <button
                  onClick={logout}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button> */}
                <Avatar name={member?.name} />
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
              ) : (
                <>
                  {/* McDonald's Card */}
                  <div className="flex-shrink-0 w-[170px] bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm border-t-4 border-t-[#FFC72C] snap-start">
                    <div className="w-8 h-8 rounded-full bg-yellow-50 text-[#D89F0E] flex items-center justify-center font-bold text-xs mb-2">
                      M
                    </div>
                    <p className="text-[11px] font-semibold text-neutral-500">
                      McDonald's Points
                    </p>
                    <p className="text-2xl font-black text-neutral-900 mt-1 tracking-tight">
                      {mcdPoints}{" "}
                      <span className="text-xs font-bold text-neutral-500">
                        pts
                      </span>
                    </p>
                  </div>
                  {/* KFC Card */}
                  <div className="flex-shrink-0 w-[170px] bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm border-t-4 border-t-[#C8102E] snap-start">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-[#C8102E] flex items-center justify-center font-bold text-xs mb-2">
                      K
                    </div>
                    <p className="text-[11px] font-semibold text-neutral-500">
                      KFC Points
                    </p>
                    <p className="text-2xl font-black text-neutral-900 mt-1 tracking-tight">
                      {kfcPoints}{" "}
                      <span className="text-xs font-bold text-neutral-500">
                        pts
                      </span>
                    </p>
                  </div>
                </>
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
          {/* Greeting Header */}
          <section className="space-y-1">
            <h1 className="text-3xl font-extrabold text-neutral-950 tracking-tight">
              Good afternoon, {member?.name?.split(" ")[0] || "Budi"}!
            </h1>
          </section>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Area (Columns 1 & 2) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Partner Balance Cards row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <BalanceCardDesktop
                  partnerName="McDonald's MyRewards"
                  balance={mcdPoints}
                  badgeText="REDEEM NOW"
                  isKfc={false}
                />
                <BalanceCardDesktop
                  partnerName="KFC Colonel's Club"
                  balance={kfcPoints}
                  badgeText="EARNING"
                  isKfc={true}
                />
              </div>

              {/* Quick Actions */}
              <section className="bg-white rounded-2xl p-5 border border-neutral-200/50 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-neutral-900">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-4 gap-4">
                  <button className="flex flex-col items-center justify-center p-4 border border-neutral-100 rounded-2xl hover:bg-neutral-50 active:scale-98 transition-all group cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-[#FDF2E9] text-brand-primary flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-neutral-700 mt-2.5">
                      Scan to Earn
                    </span>
                  </button>

                  <Link
                    href="/exchange"
                    className="flex flex-col items-center justify-center p-4 border border-neutral-100 rounded-2xl hover:bg-neutral-50 active:scale-98 transition-all group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#FDF2E9] text-brand-primary flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-neutral-700 mt-2.5">
                      Exchange Points
                    </span>
                  </Link>

                  <button className="flex flex-col items-center justify-center p-4 border border-neutral-100 rounded-2xl hover:bg-neutral-50 active:scale-98 transition-all group cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-[#FDF2E9] text-brand-primary flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <Gift className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-neutral-700 mt-2.5">
                      Send Gift
                    </span>
                  </button>

                  <button className="flex flex-col items-center justify-center p-4 border border-neutral-100 rounded-2xl hover:bg-neutral-50 active:scale-98 transition-all group cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-[#FDF2E9] text-brand-primary flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-neutral-700 mt-2.5">
                      Link Account
                    </span>
                  </button>
                </div>
              </section>

              {/* Bottom split: Recent Activity & Exclusive Offers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Exclusive Offers Card */}
                <section className="bg-white rounded-2xl p-5 border border-neutral-200/50 shadow-sm flex flex-col justify-between h-[360px]">
                  <div>
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-3.5">
                      <h3 className="text-sm font-bold text-neutral-900">
                        Exclusive Offers
                      </h3>
                      <Link
                        href="/rewards"
                        className="text-xs font-bold text-brand-primary hover:underline"
                      >
                        Explore
                      </Link>
                    </div>

                    <div className="space-y-3">
                      {/* Offer Item 1: Burger Card */}
                      <div className="relative h-24 rounded-xl overflow-hidden bg-neutral-950 group cursor-pointer">
                        <img
                          src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80"
                          alt="Burger"
                          className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 p-3 flex flex-col justify-end text-white">
                          <p className="text-xs font-bold leading-tight">
                            Double Points Tuesday
                          </p>
                          <p className="text-[9px] text-neutral-200 mt-0.5 leading-none">
                            Earn 2x at McDonald's tomorrow
                          </p>
                        </div>
                      </div>

                      {/* Offer Item 2: Chicken Card */}
                      <div className="relative h-24 rounded-xl overflow-hidden bg-neutral-950 group cursor-pointer">
                        <img
                          src="https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400&auto=format&fit=crop&q=80"
                          alt="Fried Chicken"
                          className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 p-3 flex flex-col justify-end text-white">
                          <p className="text-xs font-bold leading-tight">
                            Colonel's Surprise
                          </p>
                          <p className="text-[9px] text-neutral-200 mt-0.5 leading-none">
                            Redeem wings for 50% less
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Right Sidebar Area */}
            <div className="space-y-6">
              {/* Gold Tier Status Card */}
              {/* <section className="bg-[#8B3D06] rounded-2xl p-5 text-white shadow-sm relative overflow-hidden h-44 flex flex-col justify-between">
                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-1">
                    <h3 className="text-base font-black tracking-tight">
                      Gold Tier
                    </h3>
                    <p className="text-[11px] text-orange-100 font-medium">
                      You've saved $124.50 this month through redemptions!
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                    <Award className="w-4.5 h-4.5 text-white" />
                  </div>
                </div>

                <div className="space-y-2 mt-4 relative z-10">
                  <div className="flex items-center justify-between text-[10px] font-bold text-orange-100">
                    <span>Level Progress</span>
                    <span>85%</span>
                  </div>
                  <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-white h-full rounded-full w-[85%]" />
                  </div>
                  <p className="text-[9px] text-center text-orange-200 font-semibold mt-1">
                    Only 1,200 pts to Platinum Status
                  </p>
                </div>
              </section> */}

              {/* Points Value Calculator */}
              {/* <section className="bg-white rounded-2xl p-5 border border-neutral-200/50 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                  Points Value
                </h3>

                <div className="bg-neutral-50/80 p-4 rounded-xl space-y-3.5 border border-neutral-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-neutral-500">
                      Combined Balance
                    </span>
                    <span className="font-extrabold text-brand-primary text-sm">
                      {combinedBalance.toLocaleString()} pts
                    </span>
                  </div>

                  <div className="h-[1px] bg-neutral-200/60" />

                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-neutral-500">
                      Estimated Value
                    </span>
                    <span className="font-extrabold text-neutral-900 text-sm">
                      ${estimatedValue.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button className="w-full bg-[#8B3D06] hover:bg-[#723204] text-white rounded-xl py-3.5 font-bold transition-all shadow-sm active:translate-y-px text-xs flex items-center justify-center gap-2 cursor-pointer">
                  <Wallet className="w-4 h-4" />
                  Cash Out to Wallet
                </button>
              </section> */}

              {/* Sponsored Card */}
              <section className="bg-white rounded-2xl border border-neutral-200/50 shadow-sm overflow-hidden flex flex-col justify-between group cursor-pointer">
                <div className="h-44 relative bg-neutral-900">
                  <img
                    src="https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=80"
                    alt="Coffee Machine"
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-102 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 text-[8px] font-black uppercase text-neutral-800 bg-white/90 border border-neutral-200 px-2 py-0.5 rounded-sm tracking-wider">
                    SPONSORED
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <h4 className="text-sm font-bold text-neutral-900">
                    Coffee Morning Boost
                  </h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Link your Starbucks card today and get a 500 point welcome
                    bonus instantly.
                  </p>
                  <Link
                    href="/exchange"
                    className="text-xs font-extrabold text-brand-primary flex items-center gap-0.5 hover:underline mt-2"
                  >
                    Link Account
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </section>

              {/* Recent Activity Card */}
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
                    {transactions.map((tx) => {
                      const isEarn = tx.type === "EARN";
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center">
                              {isEarn ? (
                                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-neutral-800 leading-tight">
                                {tx.partnerName}
                              </p>
                              <span className="text-[10px] text-neutral-400 font-semibold mt-0.5 block">
                                {tx.timeText || "Transaction"}
                              </span>
                            </div>
                          </div>
                          <span
                            className={cn(
                              "text-xs font-extrabold",
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

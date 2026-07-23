"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMember } from "@/lib/hooks/useMember";
import { DesktopNavbar } from "@/components/organisms/DesktopNavbar";
import { MemberSidebar } from "@/components/organisms/MemberSidebar";
import { BalanceCardDesktop } from "@/components/molecules/BalanceCardDesktop";
import { BottomNavigation } from "@/components/organisms/BottomNavigation";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import {
  Gift,
  RefreshCw,
  Clock,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  History,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PointBalance, Transaction } from "@/types";
import { PartnerLogo } from "@/components/atoms/PartnerLogo";

export default function DashboardPage() {
  const { member, memberId, isLoaded, logout } = useMember();

  const POLLING_INTERVAL =
    Number(process.env.NEXT_PUBLIC_REFETCH_INTERVAL) || 5000;

  // 1. Fetch Balances via React Query
  const { data: balanceData, isLoading: isBalancesLoading } = useQuery({
    queryKey: ["balances", memberId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/members/${memberId}/points`);
      return response.data.balances as PointBalance[];
    },
    enabled: !!memberId,
    retry: 1,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });

  // 2. Fetch Recent Transactions via React Query (Requesting 8 items for recent list)
  const { data: transactionData, isLoading: isTrxsLoading } = useQuery({
    queryKey: ["recent-transactions", memberId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/api/v1/members/${memberId}/transactions?page=0&size=8`
      );
      return response.data.transactions as Transaction[];
    },
    enabled: !!memberId,
    retry: 1,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });

  // Fetch rewards catalog for transaction detail mapping
  const { data: rewardsData } = useQuery({
    queryKey: ["rewards-catalog-list"],
    queryFn: async () => {
      const response = await apiClient.get("/api/v1/rewards");
      return (response.data.data || []) as any[];
    },
    enabled: !!memberId,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });

  // Fetch partners list for logo matching
  const { data: partnersData } = useQuery({
    queryKey: ["partners-list"],
    queryFn: async () => {
      const response = await apiClient.get("/api/v1/partners");
      return (b => b.data || [])(response.data) as any[];
    },
    enabled: !!memberId,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
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
  const estimatedValue = combinedBalance * 1000; // Rp 1,000 per point style

  const transactions = transactionData || [];
  const rewardsList = rewardsData || [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getTransactionDetails = (tx: any, allTxs: any[]) => {
    const isEarn = tx.type === "EARN";
    const isRedeem = tx.type === "REDEEM";
    const isExchangeIn = tx.type === "EXCHANGE_IN";
    const isExchangeOut = tx.type === "EXCHANGE_OUT";
    const isExpired = tx.type === "EXPIRED";

    let label = "Transaction";
    let color = "text-neutral-900";
    let sign = "";

    if (isEarn) {
      label = tx.trxAmountIDR
        ? `Earned points Spend: Rp ${tx.trxAmountIDR.toLocaleString()}`
        : "Earned points";
      color = "text-emerald-600";
      sign = "+";
    } else if (isRedeem) {
      const rewardPointsCost = Math.abs(tx.points);
      const matchedReward = rewardsList.find(
        (r) =>
          r.pointCost === rewardPointsCost &&
          r.partnerName?.toLowerCase() === tx.partnerName?.toLowerCase()
      );
      const rewardName = matchedReward ? matchedReward.name : "reward";
      const displayReward = rewardName.length > 25 ? rewardName.slice(0, 25) + "..." : rewardName;
      label = matchedReward ? `Redeemed ${displayReward}` : "Redeemed reward";
      color = "text-red-500";
      sign = "-";
    } else if (isExchangeIn) {
      // Find corresponding EXCHANGE_OUT sibling to see where it came from
      const related = allTxs.find(
        (t) =>
          t.type === "EXCHANGE_OUT" &&
          t.id !== tx.id &&
          Math.abs(
            new Date(t.createdAt).getTime() - new Date(tx.createdAt).getTime()
          ) < 5000
      );
      label = related ? `from ${related.partnerName}` : "Exchanged points in";
      color = "text-emerald-600";
      sign = "+";
    } else if (isExchangeOut) {
      // Find corresponding EXCHANGE_IN sibling to see where it went
      const related = allTxs.find(
        (t) =>
          t.type === "EXCHANGE_IN" &&
          t.id !== tx.id &&
          Math.abs(
            new Date(t.createdAt).getTime() - new Date(tx.createdAt).getTime()
          ) < 5000
      );
      label = related ? `to ${related.partnerName}` : "Exchanged points out";
      color = "text-red-500";
      sign = "-";
    } else if (isExpired) {
      label = "Points expired";
      color = "text-red-400";
      sign = "-";
    }

    const dateText = tx.createdAt
      ? new Date(tx.createdAt)
          .toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
          })
          .toUpperCase()
      : "";

    return { label, color, sign, dateText };
  };

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden">

        {/* ========================================================
            MOBILE VIEW (Visible on Mobile inspect, hidden on Desktop)
            ======================================================== */}
        <div className="md:hidden flex-grow flex flex-col pb-20 overflow-y-auto">
          {/* Top Banner (Gradient Hero) */}
          <section className="pt-3 pb-1 px-5 text-white relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <img
                  src="/logo_pistos_landscape.webp"
                  alt="Pistos Logo"
                  className="w-24 h-auto object-contain cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-0.5 bg-gradient-to-br from-[#8B3D06] via-[#A65B28] to-[#C17A4A] p-4 rounded-lg">
              <h2 className="text-lg font-bold tracking-tight">
                {getGreeting()}, {member?.name?.split(" ")[0]} 👋
              </h2>
              <p className="text-[11px] text-white/80 font-medium">
                Ready to maximize your rewards today?
              </p>
            </div>
          </section>

          {/* Overlapping Balances List */}
          <section className="mt-6 px-5 z-10">
            <div className="flex justify-between items-center pb-2">
              <p className="font-semibold text-base">Your wallets</p>
              <Link href="/profile" className="flex items-center text-brand-primary text-xs">
                View all <ArrowRight height={16} width={16} className="ml-1" />
              </Link>
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
                <p className="text-xs text-neutral-400 italic py-4 px-2">
                  No active wallets.
                </p>
              ) : (
                apiBalances.map((b) => {
                  const partnerInfo = (partnersData || []).find(
                    (p: any) =>
                      p.id === b.partnerId ||
                      p.name?.toLowerCase() === b.partnerName?.toLowerCase()
                  );
                  const logoUrl = partnerInfo?.logoUrl;
                  const borderTop = "border-t-[#8B3D06]";

                  return (
                    <Link
                      key={b.partnerId}
                      href="/rewards"
                      onClick={() => {
                        sessionStorage.setItem(
                          "selected_partner_filter",
                          b.partnerId
                        );
                      }}
                      className={cn(
                        "flex-shrink-0 w-[170px] bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm border-t-4 snap-start active:scale-98 transition-all hover:shadow-md cursor-pointer relative",
                        borderTop
                      )}
                    >
                      <PartnerLogo
                        logoUrl={logoUrl}
                        name={b.partnerName}
                        className="w-8 h-8 rounded-full border border-neutral-100 shadow-inner mb-2"
                      />
                      <p className="text-[11px] font-semibold text-neutral-500 truncate pr-4">
                        {b.partnerName}
                      </p>
                      <p className="text-2xl font-black text-neutral-900 mt-1 tracking-tight truncate pr-4">
                        {b.balance.toLocaleString()}{" "}
                        <span className="text-xs font-bold text-neutral-500">
                          pts
                        </span>
                      </p>
                      <ArrowRight className="absolute bottom-4 right-4 w-4 h-4 text-neutral-300" />
                    </Link>
                  );
                })
              )}
            </div>
          </section>

          {/* Actions grid */}
          <section className="px-5 mt-6">
            <div className="bg-white rounded-2xl p-5 border border-neutral-200/50 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-3">
                Quick Actions
              </h3>
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
            </div>
          </section>

          {/* Activity List */}
          <section className="px-5 mt-6 pb-4">
            <div className="rounded-2xl p-5 border border-neutral-200/50 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-3.5">
                <h3 className="text-xs font-bold text-black uppercase tracking-wider">
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
                {isTrxsLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 animate-pulse py-1"
                    />
                  ))
                ) : transactions.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic py-4 text-center">
                    No recent activity.
                  </p>
                ) : (
                  transactions.slice(0, 5).map((tx) => {
                    const details = getTransactionDetails(tx, transactions);
                    const isEarn =
                      tx.type === "EARN" || tx.type === "EXCHANGE_IN";
                    const partnerInfo = (partnersData || []).find(
                      (p: any) =>
                        p.name?.toLowerCase() === tx.partnerName?.toLowerCase()
                    );
                    const logoUrl = partnerInfo?.logoUrl;
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <PartnerLogo
                            logoUrl={logoUrl}
                            name={tx.partnerName || "Pistos"}
                            className="w-8 h-8 rounded-full border border-neutral-100 shadow-inner"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-bold text-neutral-800 leading-tight truncate">
                              {tx.type
                                .toLowerCase()
                                .split("_")
                                .map(
                                  (word) =>
                                    word.charAt(0).toUpperCase() +
                                    word.slice(1)
                                )
                                .join(" ")}
                            </p>
                            <span className="text-[10px] text-neutral-500 font-semibold mt-0.5 block truncate">
                              {details.label}
                            </span>
                            <span className="text-[9px] text-neutral-400 font-bold block mt-0.5">
                              {details.dateText}
                            </span>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "text-xs font-black shrink-0",
                            details.color
                          )}
                        >
                          {details.sign}
                          {Math.abs(tx.points).toLocaleString()} pts
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          {/* Tab Navigation */}
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
                {getGreeting()}, {member?.name || "Budi Santoso"}!
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
                <p className="text-xs text-neutral-400 italic px-1">
                  No active partner balances found.
                </p>
              ) : (
                apiBalances.map((b) => {
                  const cardPartnerCode = b.partnerName.toLowerCase().includes("kfc")
                    ? "KFC"
                    : b.partnerName.toLowerCase().includes("mcd")
                    ? "MCD"
                    : "GENERIC";
                  const count = rewardsList.filter(
                    (r) =>
                      r.status === "ACTIVE" &&
                      (r.partnerId === b.partnerId ||
                        r.partnerName?.toLowerCase() === b.partnerName?.toLowerCase() ||
                        r.partnerCode?.toUpperCase() === cardPartnerCode)
                  ).length;
                  const partnerInfo = (partnersData || []).find(
                    (p: any) =>
                      p.id === b.partnerId ||
                      p.name?.toLowerCase() === b.partnerName?.toLowerCase()
                  );
                  const logoUrl = partnerInfo?.logoUrl;
                  return (
                    <BalanceCardDesktop
                      key={b.partnerId}
                      partnerId={b.partnerId}
                      partnerName={b.partnerName}
                      balance={b.balance}
                      badgeText="REDEEM NOW"
                      partnerCode={cardPartnerCode}
                      activeRewardsCount={count}
                      logoUrl={logoUrl}
                    />
                  );
                })
              )}
            </div>

            {/* Column 3: Recent Activity (R) */}
            <div className="space-y-6">
              <section className="bg-white rounded-2xl p-5 border border-neutral-200/50 shadow-sm flex flex-col justify-between">
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
                    {transactions.slice(0, 8).map((tx) => {
                      const details = getTransactionDetails(tx, transactions);
                      const isEarn =
                        tx.type === "EARN" || tx.type === "EXCHANGE_IN";
                      const partnerInfo = (partnersData || []).find(
                        (p: any) =>
                          p.name?.toLowerCase() === tx.partnerName?.toLowerCase()
                      );
                      const logoUrl = partnerInfo?.logoUrl;
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <PartnerLogo
                              logoUrl={logoUrl}
                              name={tx.partnerName || "Pistos"}
                              className="w-8 h-8 rounded-full border border-neutral-100 shadow-inner"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-bold text-neutral-800 leading-tight truncate">
                                {tx.type
                                  .toLowerCase()
                                  .split("_")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1)
                                  )
                                  .join(" ")}
                              </p>
                              <span className="text-[10px] text-neutral-500 font-semibold mt-0.5 block truncate">
                                {details.label}
                              </span>
                              <span className="text-[9px] text-neutral-400 font-bold block mt-0.5">
                                {details.dateText}
                              </span>
                            </div>
                          </div>
                          <span
                            className={cn(
                              "text-xs font-black shrink-0",
                              details.color
                            )}
                          >
                            {details.sign}
                            {Math.abs(tx.points).toLocaleString()} pts
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
  );
}

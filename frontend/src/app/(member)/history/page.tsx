"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useMember } from "@/lib/hooks/useMember";
import { DesktopNavbar } from "@/components/organisms/DesktopNavbar";
import { MemberSidebar } from "@/components/organisms/MemberSidebar";
import { BottomNavigation } from "@/components/organisms/BottomNavigation";
import Avatar from "@/components/atoms/Avatar";
import apiClient from "@/lib/apiClient";
import {
  Bell,
  Search,
  PlusCircle,
  ArrowUpDown,
  Gift,
  Coins,
  ChevronRight,
  ChevronLeft,
  Calendar,
  DollarSign,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Transaction } from "@/types";

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-[#FDFDFD] md:bg-neutral-50 min-h-[300px]">
          <div className="w-10 h-10 border-4 border-[#8B3D06] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <HistoryPageContent />
    </Suspense>
  );
}

function HistoryPageContent() {
  const { member, memberId, isLoaded, logout } = useMember();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const searchQuery = searchParams.get("q") || "";
  const selectedPartner = searchParams.get("partner") || "ALL";
  const startDateStr = searchParams.get("startDate") || "";
  const endDateStr = searchParams.get("endDate") || "";

  // Fetch partners list to populate dropdown
  const { data: apiPartners } = useQuery({
    queryKey: ["partners-list"],
    queryFn: async () => {
      const response = await apiClient.get("/api/v1/partners");
      return (response.data.partners || response.data.data || []) as any[];
    },
    enabled: isLoaded,
  });

  // Fetch rewards catalog for transaction detail mapping
  const { data: rewardsData } = useQuery({
    queryKey: ["rewards-catalog-list"],
    queryFn: async () => {
      const response = await apiClient.get("/api/v1/rewards");
      return (response.data.data || []) as any[];
    },
    enabled: isLoaded,
  });

  const setFilter = (filter: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filter", filter);
    params.delete("page");
    params.delete("q");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const setPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.replace(`${pathname}?${params.toString()}`);
  };

  const setSearch = (q: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const setPartnerSelect = (partner: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (partner === "ALL") params.delete("partner");
    else params.set("partner", partner);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const setDateRange = (start: string, end: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (start) params.set("startDate", start);
    else params.delete("startDate");
    if (end) params.set("endDate", end);
    else params.delete("endDate");
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const activeFilter = searchParams.get("filter") || "ALL";
  const currentPage = Number(searchParams.get("page")) || 0;

  const POLLING_INTERVAL =
    Number(process.env.NEXT_PUBLIC_REFETCH_INTERVAL) || 5000;

  // Fetch paginated transactions from API
  const { data: transactionData, isLoading } = useQuery({
    queryKey: ["transactions-history", memberId, activeFilter, currentPage],
    queryFn: async () => {
      // Determine type filter for API
      let typeParam = "";
      if (activeFilter === "EARN") typeParam = "&type=EARN";
      if (activeFilter === "REDEEM") typeParam = "&type=REDEEM";
      if (activeFilter === "EXCHANGE_IN") typeParam = "&type=EXCHANGE_IN";
      if (activeFilter === "EXCHANGE_OUT") typeParam = "&type=EXCHANGE_OUT";
      if (activeFilter === "EXPIRED") typeParam = "&type=EXPIRED";

      const response = await apiClient.get(
        `/api/v1/members/${memberId}/transactions?page=${currentPage}&size=20${typeParam}`
      );
      return response.data.transactions as Transaction[];
    },
    enabled: !!memberId,
    retry: 1,

    // polling tiap 5 detik (konfigurasi di env)
    refetchInterval: POLLING_INTERVAL,

    // berhenti kalau tab/browser tidak aktif
    refetchIntervalInBackground: false,

    // jangan refetch saat user balik ke tab
    refetchOnWindowFocus: false,
  });

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const rawTransactions = transactionData || [];

  // Client-side filtering (handles fallback lists and searches)
  const filteredTransactions = rawTransactions.filter((tx) => {
    // 1. Search Query Filter
    const matchesSearch =
      tx.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.detailText &&
        tx.detailText.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tx.type.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Partner Filter
    const matchesPartner =
      selectedPartner === "ALL" ||
      tx.partnerName.toLowerCase().includes(selectedPartner.toLowerCase());

    // 3. Date Range Filter
    let matchesDate = true;
    if (startDateStr || endDateStr) {
      const txDate = new Date(tx.createdAt);
      txDate.setHours(0, 0, 0, 0);

      if (startDateStr) {
        const start = new Date(startDateStr);
        start.setHours(0, 0, 0, 0);
        if (txDate < start) matchesDate = false;
      }
      if (endDateStr) {
        const end = new Date(endDateStr);
        end.setHours(0, 0, 0, 0);
        if (txDate > end) matchesDate = false;
      }
    }

    return matchesSearch && matchesPartner && matchesDate;
  });

  // Helper to format date groups
  const getDateGroupLabel = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "TODAY";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "YESTERDAY";
    } else {
      // e.g. "28 JUN"
      return date
        .toLocaleDateString("en-US", { day: "numeric", month: "short" })
        .toUpperCase();
    }
  };

  // Group transactions by date
  const groupedTransactions: { [key: string]: Transaction[] } = {};
  filteredTransactions.forEach((tx) => {
    const group = getDateGroupLabel(tx.createdAt);
    if (!groupedTransactions[group]) {
      groupedTransactions[group] = [];
    }
    groupedTransactions[group].push(tx);
  });

  // Helper for Transaction Row Icon
  const getTxIcon = (type: string) => {
    switch (type) {
      case "EARN":
        return (
          <div className="w-10 h-10 rounded-full bg-[#FCF5F1] text-[#8B3D06] flex items-center justify-center shrink-0">
            <PlusCircle className="w-5 h-5 text-[#8B3D06]" />
          </div>
        );
      case "REDEEM":
        return (
          <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
        );
      case "EXCHANGE_OUT":
      case "EXCHANGE_IN":
        return (
          <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center shrink-0">
            <ArrowUpDown className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
          </div>
        );
    }
  };

  // Helper for transaction point color and sign
  const getTransactionPointsInfo = (tx: Transaction) => {
    const isAddition = tx.type === "EARN" || tx.type === "EXCHANGE_IN";
    return {
      sign: isAddition ? "+" : "-",
      color: isAddition ? "text-emerald-600" : "text-red-500",
    };
  };

  const getTransactionDetailText = (tx: Transaction) => {
    if (tx.detailText) return tx.detailText;
    if (tx.type === "EARN") {
      return tx.trxAmountIDR
        ? `Spend: Rp ${tx.trxAmountIDR.toLocaleString()}`
        : "Earned points";
    }
    if (tx.type === "REDEEM") {
      const rewardPointsCost = Math.abs(tx.points);
      const matchedReward = (rewardsData || []).find(
        (r) =>
          r.pointCost === rewardPointsCost &&
          r.partnerName?.toLowerCase() === tx.partnerName?.toLowerCase()
      );
      const rewardName = matchedReward ? matchedReward.name : "reward";
      const displayReward = rewardName.length > 25 ? rewardName.slice(0, 25) + "..." : rewardName;
      return matchedReward ? `Redeemed ${displayReward}` : "Redeemed reward";
    }
    if (tx.type === "EXCHANGE_OUT") {
      return "Exchanged points out";
    }
    if (tx.type === "EXCHANGE_IN") {
      return "Exchanged points in";
    }
    if (tx.type === "EXPIRED") {
      return "Points expired";
    }
    return "Processed transaction";
  };

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden">

        {/* ========================================================
            MOBILE VIEW (Visible on Mobile inspect, hidden on Desktop)
            ======================================================== */}
        <div className="md:hidden flex-grow flex flex-col pb-20 animate-in fade-in duration-200 overflow-y-auto">
          {/* Top Header */}
          <div className="px-5 pt-6 space-y-5">
            <h1 className="text-xl font-bold text-neutral-950 tracking-tight">
              History
            </h1>

            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
              {[
                { filter: "ALL", label: "All active" },
                { filter: "EARN", label: "EARN" },
                { filter: "REDEEM", label: "REDEEM" },
                { filter: "EXCHANGE_IN", label: "EXCHANGE IN" },
                { filter: "EXCHANGE_OUT", label: "EXCHANGE OUT" },
                { filter: "EXPIRED", label: "EXPIRED" },
              ].map((chip) => (
                <button
                  key={chip.filter}
                  onClick={() => setFilter(chip.filter)}
                  className={cn(
                    "px-5 py-2.5 rounded-full text-xs font-bold transition-colors border border-transparent whitespace-nowrap cursor-pointer",
                    activeFilter === chip.filter
                      ? "bg-[#8B3D06] text-white"
                      : "bg-[#F5F5F5] text-neutral-600 hover:bg-neutral-100"
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Mobile History View - Using Desktop layout structure but in mobile form */}
            <div className="bg-white border border-neutral-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50/50">
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                        Date / Type
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                        Details
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-700 text-right">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {isLoading && filteredTransactions.length === 0 ? (
                      Array.from({ length: 4 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="px-4 py-4">
                            <div className="h-3 bg-neutral-200 rounded w-16 mb-1" />
                            <div className="h-4 bg-neutral-200 rounded w-12" />
                          </td>
                          <td className="px-4 py-4">
                            <div className="h-3 bg-neutral-200 rounded w-20" />
                          </td>
                          <td className="px-4 py-4">
                            <div className="h-3 bg-neutral-200 rounded w-8 ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-8 text-center text-neutral-400 text-xs"
                        >
                          No transactions found.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => {
                        const isEarn = tx.type === "EARN";
                        const date = new Date(tx.createdAt);
                        return (
                          <tr key={tx.id} className="hover:bg-neutral-50/20 transition-colors">
                            <td className="px-4 py-3.5">
                              <span className="text-[10px] text-neutral-500 font-semibold block leading-tight">
                                {date.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <span
                                className={cn(
                                  "inline-flex items-center justify-center px-1.5 py-0.5 text-[8px] font-black uppercase rounded-full border text-center leading-none mt-1",
                                  isEarn
                                    ? "bg-emerald-50 border-emerald-200/50 text-emerald-700"
                                    : tx.type === "REDEEM"
                                    ? "bg-red-100 border-neutral-300 text-red-800"
                                    : tx.type === "EXCHANGE_IN"
                                    ? "bg-blue-50 border-blue-200/50 text-blue-700"
                                    : tx.type === "EXCHANGE_OUT"
                                    ? "bg-orange-50 border-orange-200/50 text-orange-700"
                                    : "bg-red-50 border-red-200/50 text-red-700"
                                )}
                              >
                                {tx.type.replaceAll("_", " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="text-xs font-bold text-neutral-800 block">
                                {tx.partnerName}
                              </span>
                              <span className="text-[10px] text-neutral-500 font-semibold block mt-0.5 line-clamp-2 leading-tight">
                                {getTransactionDetailText(tx)}
                              </span>
                            </td>
                            <td
                              className={cn(
                                "px-4 py-3.5 text-xs font-black text-right whitespace-nowrap",
                                getTransactionPointsInfo(tx).color
                              )}
                            >
                              {getTransactionPointsInfo(tx).sign}
                              {tx.points.toLocaleString()} pts
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Table Pagination */}
              <div className="border-t border-neutral-200/50 px-4 py-3 bg-neutral-50/20 flex items-center justify-between text-[11px] font-bold text-neutral-500">
                <span>
                  {filteredTransactions.length} entries
                </span>
                <div className="flex items-center gap-1 select-none">
                  <button
                    disabled={currentPage === 0}
                    onClick={() => setPage(Math.max(0, currentPage - 1))}
                    className="p-1.5 border border-neutral-200 rounded-lg bg-white disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2.5 py-1 border border-neutral-200 rounded-lg bg-white text-[#8B3D06]">
                    {currentPage + 1}
                  </span>
                  <button
                    disabled={filteredTransactions.length < 20}
                    onClick={() => setPage(currentPage + 1)}
                    className="p-1.5 border border-neutral-200 rounded-lg bg-white disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <BottomNavigation />
        </div>

        {/* ========================================================
            DESKTOP VIEW (Visible on Desktop, hidden on Mobile)
            ======================================================== */}
        <div className="hidden md:flex flex-col flex-1 px-8 py-8 space-y-6 overflow-y-auto">
          {/* Desktop filter row */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-500">Type:</span>
              <div className="relative">
                <select
                  value={activeFilter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-white text-neutral-700 border border-neutral-200 pl-3 pr-8 py-2 rounded-xl text-xs font-semibold outline-none focus:border-[#8B3D06] transition-colors cursor-pointer appearance-none"
                >
                  <option value="ALL">All Transactions</option>
                  <option value="EARN">Earnings</option>
                  <option value="REDEEM">Redemptions</option>
                  <option value="EXCHANGE_IN">Exchange In</option>
                  <option value="EXCHANGE_OUT">Exchange Out</option>
                  <option value="EXPIRED">Expired</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <span className="text-xs font-bold text-neutral-500 ml-2">Partner:</span>
              <div className="relative">
                <select
                  value={selectedPartner}
                  onChange={(e) => setPartnerSelect(e.target.value)}
                  className="bg-white text-neutral-700 border border-neutral-200 pl-3 pr-8 py-2 rounded-xl text-xs font-semibold outline-none focus:border-[#8B3D06] transition-colors cursor-pointer appearance-none min-w-[120px]"
                >
                  <option value="ALL">All Merchants</option>
                  {apiPartners?.map((p: any) => (
                    <option key={p.id} value={p.code}>{p.name}</option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <span className="text-xs font-bold text-neutral-500 ml-2">Date:</span>
              <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-xl px-2 py-1">
                <input
                  type="date"
                  value={startDateStr}
                  onChange={(e) => setDateRange(e.target.value, endDateStr)}
                  className="text-xs font-semibold text-neutral-700 bg-transparent outline-none cursor-pointer w-[110px]"
                />
                <span className="text-neutral-300 text-xs">-</span>
                <input
                  type="date"
                  value={endDateStr}
                  onChange={(e) => setDateRange(startDateStr, e.target.value)}
                  className="text-xs font-semibold text-neutral-700 bg-transparent outline-none cursor-pointer w-[110px]"
                />
              </div>
            </div>

            {/* Desktop Quick Search */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white text-neutral-700 border border-neutral-200 pl-9 pr-4 py-2 rounded-xl text-xs outline-none focus:border-[#8B3D06] transition-colors font-semibold placeholder:text-neutral-400"
              />
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="bg-white border border-neutral-200/60 rounded-2xl shadow-sm overflow-hidden flex-grow flex flex-col justify-between">
            <div className="overflow-x-auto flex-grow">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-44">
                      Date
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-32">
                      Type
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-44">
                      Partner Program
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700">
                      Details
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-32 text-right">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {isLoading && filteredTransactions.length === 0 ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-6 py-5">
                          <div className="h-4 bg-neutral-200 rounded w-24" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-5 bg-neutral-200 rounded w-16" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-neutral-200 rounded w-28" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-neutral-200 rounded w-48" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-neutral-200 rounded w-12 ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-neutral-400"
                      >
                        <p className="text-sm font-semibold">
                          No transactions found.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const isEarn = tx.type === "EARN";
                      const date = new Date(tx.createdAt);

                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-neutral-50/20 transition-colors"
                        >
                          <td className="px-6 py-4.5 text-xs text-neutral-600 font-semibold">
                            {date.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            {date.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-6 py-4.5">
                            <span
                              className={cn(
                                "flex items-center justify-center w-24 h-6 text-[8px] font-black uppercase rounded-full border text-center leading-none",
                                isEarn
                                  ? "bg-emerald-50 border-emerald-200/50 text-emerald-700"
                                  : tx.type === "REDEEM"
                                  ? "bg-red-100 border-neutral-300 text-red-800"
                                  : tx.type === "EXCHANGE_IN"
                                  ? "bg-blue-50 border-blue-200/50 text-blue-700"
                                  : tx.type === "EXCHANGE_OUT"
                                  ? "bg-orange-50 border-orange-200/50 text-orange-700"
                                  : "bg-red-50 border-red-200/50 text-red-700"
                              )}
                            >
                              {tx.type.replaceAll("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-neutral-800">
                                {tx.partnerName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4.5 text-xs text-neutral-500 font-semibold max-w-xs break-words">
                            {getTransactionDetailText(tx)}
                          </td>
                          <td
                            className={cn(
                              "px-6 py-4.5 text-xs font-black text-right",
                              getTransactionPointsInfo(tx).color
                            )}
                          >
                            {getTransactionPointsInfo(tx).sign}
                            {tx.points.toLocaleString()} pts
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="border-t border-neutral-200/50 px-6 py-4 bg-neutral-50/20 flex items-center justify-between text-xs font-bold text-neutral-500 shrink-0">
              <span>
                Showing {filteredTransactions.length} transaction entries
              </span>

              <div className="flex items-center gap-1 select-none">
                <button
                  disabled={currentPage === 0}
                  onClick={() => setPage(Math.max(0, currentPage - 1))}
                  className="p-2 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="px-3.5 py-2 border border-neutral-200 rounded-lg bg-white font-black text-[#8B3D06] shadow-sm">
                  {currentPage + 1}
                </button>
                <button
                  disabled={filteredTransactions.length < 20}
                  onClick={() => setPage(currentPage + 1)}
                  className="p-2 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

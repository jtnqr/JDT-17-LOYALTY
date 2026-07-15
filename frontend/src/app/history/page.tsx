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
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
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

  const activeFilter = searchParams.get("filter") || "ALL";
  const currentPage = Number(searchParams.get("page")) || 0;
  const searchQuery = searchParams.get("q") || "";

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
    const matchesSearch =
      tx.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.detailText &&
        tx.detailText.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tx.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === "ALL" ||
      (activeFilter === "EARN" && tx.type === "EARN") ||
      (activeFilter === "REDEEM" && tx.type === "REDEEM") ||
      (activeFilter === "EXCHANGE_IN" && tx.type === "EXCHANGE_IN") ||
      (activeFilter === "EXCHANGE_OUT" && tx.type === "EXCHANGE_OUT") ||
      (activeFilter === "EXPIRED" && tx.type === "EXPIRED");

    return matchesSearch && matchesFilter;
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

  // Helper for transaction point coloring
  const getPointsClass = (points: number, type: string) => {
    if (points > 0) return "text-[#8B3D06]"; // Earnings show brown
    if (type === "REDEEM") return "text-neutral-700"; // Redemptions show dark brown/grey
    return "text-[#C8102E]"; // Exchanges show red
  };

  return (
    <div className="h-screen bg-[#FDFDFD] md:bg-neutral-50 font-sans flex overflow-hidden">
      {/* DESKTOP SIDEBAR (Hidden on Mobile) */}
      <MemberSidebar
        className="hidden md:flex"
        activeTab="history"
        userName={member?.name || "Budi Santoso"}
      />

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* DESKTOP TOP BAR HEADER (Hidden on Mobile) */}
        <DesktopNavbar
          userName={member?.name || "Budi Santoso"}
          onLogout={logout}
          showBrand={false}
          searchQuery={searchQuery}
          onSearchChange={setSearch}
          searchPlaceholder="Search transactions..."
          showSearch={true}
          breadcrumbs={[{ label: "Account" }, { label: "History" }]}
          title="Transaction History"
        />

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

            {/* Grouped History List */}
            <div className="space-y-6">
              {Object.keys(groupedTransactions).length === 0 ? (
                <div className="text-center py-12 text-neutral-400 space-y-2">
                  <Calendar className="w-8 h-8 mx-auto text-neutral-300" />
                  <p className="text-xs font-semibold">
                    No transactions found.
                  </p>
                </div>
              ) : (
                Object.keys(groupedTransactions).map((dateGroup) => (
                  <div key={dateGroup} className="space-y-3.5">
                    <h3 className="text-[10px] font-black text-neutral-400 tracking-wider">
                      {dateGroup}
                    </h3>

                    <div className="space-y-3">
                      {groupedTransactions[dateGroup].map((tx) => {
                        const isMcD =
                          tx.partnerName.toLowerCase().includes("mcd") ||
                          tx.partnerName.toLowerCase() === "mcd";

                        return (
                          <div
                            key={tx.id}
                            className={cn(
                              "bg-white border border-neutral-200/50 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between border-t-2"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {getTxIcon(tx.type)}
                              <div>
                                <p className="text-xs font-black text-neutral-800 leading-none">
                                  {isMcD ? "McD" : tx.partnerName}
                                </p>
                                <p className="text-[10px] text-neutral-500 font-semibold mt-1">
                                  {tx.type === "EARN" && tx.trxAmountIDR
                                    ? `Purchase of Rp ${(
                                        tx.trxAmountIDR / 1000
                                      ).toFixed(3)}`
                                    : tx.type === "REDEEM"
                                    ? `Redeemed points`
                                    : tx.type === "EXCHANGE_OUT"
                                    ? `Exchanged points out`
                                    : tx.type === "EXCHANGE_IN"
                                    ? `Exchanged points in`
                                    : `Processed transaction`}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span
                                    className={cn(
                                      "flex items-center justify-center w-24 h-6 text-[8px] font-black uppercase rounded-full leading-none text-center",
                                      tx.type === "EARN"
                                        ? "bg-[#E8F5E9] text-[#2E7D32]"
                                        : tx.type === "REDEEM"
                                        ? "bg-[#FFEBEE] text-red-800"
                                        : tx.type === "EXCHANGE_IN"
                                        ? "bg-[#E3F2FD] text-[#1565C0]"
                                        : tx.type === "EXCHANGE_OUT"
                                        ? "bg-[#FFE0B2] text-[#E65100]"
                                        : "bg-[#F5F5F5] text-[#9E9E9E]"
                                    )}
                                  >
                                    {tx.type.replace("_", " ")}
                                  </span>
                                  {/* {tx.type === "EARN" && tx.trxAmountIDR && (
                                    <span className="text-[9px] font-semibold text-neutral-400">
                                      Rp {(tx.trxAmountIDR / 1000).toFixed(3)}
                                    </span>
                                  )} */}
                                </div>
                              </div>
                            </div>

                            <span
                              className={cn(
                                "text-xs font-black shrink-0",
                                getPointsClass(tx.points, tx.type)
                              )}
                            >
                              {tx.points > 0 ? "+" : ""}
                              {tx.points} pts
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <BottomNavigation />
        </div>

        {/* ========================================================
            DESKTOP VIEW (Visible on Desktop, hidden on Mobile)
            ======================================================== */}
        <div className="hidden md:flex flex-col flex-1 px-8 py-8 space-y-6 overflow-y-auto">
          {/* Desktop filter row */}
          <div className="flex gap-2 justify-between">
            <div className="flex flex-row gap-4">
              {[
                { filter: "ALL", label: "All Transactions" },
                { filter: "EARN", label: "Earnings" },
                { filter: "REDEEM", label: "Redemptions" },
                { filter: "EXCHANGE_IN", label: "Exchange In" },
                { filter: "EXCHANGE_OUT", label: "Exchange Out" },
                { filter: "EXPIRED", label: "Expired" },
              ].map((chip) => (
                <button
                  key={chip.filter}
                  onClick={() => setFilter(chip.filter)}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-xs font-bold transition-all border border-neutral-200/50 cursor-pointer",
                    activeFilter === chip.filter
                      ? "bg-[#8B3D06] border-[#8B3D06] text-white shadow-sm"
                      : "bg-white text-neutral-600 hover:bg-neutral-50"
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            {/* Desktop Quick Search */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white text-neutral-700 border border-neutral-200 pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#8B3D06] transition-colors font-semibold placeholder:text-neutral-400"
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
                              {tx.type.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-neutral-800">
                                {tx.partnerName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4.5 text-xs text-neutral-500 font-semibold">
                            {tx.detailText ||
                              (tx.type === "EARN" && tx.trxAmountIDR
                                ? `Completed store purchase of Rp ${tx.trxAmountIDR.toLocaleString()}`
                                : tx.type === "REDEEM"
                                ? `Redeemed points at ${tx.partnerName}`
                                : tx.type === "EXCHANGE_OUT"
                                ? `Exchanged points out from ${tx.partnerName}`
                                : tx.type === "EXCHANGE_IN"
                                ? `Exchanged points in to ${tx.partnerName}`
                                : `Processed transaction at ${tx.partnerName}`)}
                          </td>
                          <td
                            className={cn(
                              "px-6 py-4.5 text-xs font-black text-right",
                              getPointsClass(tx.points, tx.type)
                            )}
                          >
                            {tx.points > 0 ? "+" : ""}
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
    </div>
  );
}

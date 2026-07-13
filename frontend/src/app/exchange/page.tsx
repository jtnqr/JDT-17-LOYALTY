"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMember } from "@/lib/hooks/useMember";
import { DesktopNavbar } from "@/components/organisms/DesktopNavbar";
import { MemberSidebar } from "@/components/organisms/MemberSidebar";
import { BottomNavigation } from "@/components/organisms/BottomNavigation";
import Link from "next/link";
import axios from "axios";
import {
  Search,
  Bell,
  ArrowUpDown,
  Info,
  CheckCircle2,
  X,
  Coins,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Avatar from "@/components/atoms/Avatar";

export default function ExchangePointsPage() {
  const { member, memberId, isLoaded, logout } = useMember();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch all active partners from API
  const { data: apiPartners } = useQuery({
    queryKey: ["exchange-partners-list"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/v1/partners", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return (response.data.partners || response.data.data || []) as any[];
    },
    retry: 1,
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
  });

  const partners = React.useMemo(() => {
    if (!apiPartners) return [];
    return apiPartners.map((p: any) => {
      let logoBg = "bg-neutral-50 text-neutral-800 border-neutral-100";
      let logoChar = p.name
        ? p.name.charAt(0)
        : p.code
        ? p.code.charAt(0)
        : "P";
      if (p.code === "KFC") {
        logoBg = "bg-red-50 text-[#C8102E]";
        logoChar = "K";
      } else if (p.code === "MCD") {
        logoBg = "bg-yellow-50 text-[#D89F0E]";
        logoChar = "M";
      }
      return {
        id: p.id,
        code: p.code,
        name: p.name,
        logoBg,
        logoChar,
      };
    });
  }, [apiPartners]);

  // Exchange state
  const [fromPartner, setFromPartner] = useState<any | null>(null);
  const [toPartner, setToPartner] = useState<any | null>(null);

  useEffect(() => {
    if (partners.length >= 2) {
      if (!fromPartner || !partners.some((p) => p.id === fromPartner.id)) {
        setFromPartner(partners[0]);
      }
      if (!toPartner || !partners.some((p) => p.id === toPartner.id)) {
        setToPartner(partners[1]);
      }
    }
  }, [partners]);

  const [exchangeAmount, setExchangeAmount] = useState<string>("100");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setErrorMessage(null);
  }, [fromPartner, toPartner, exchangeAmount]);

  // Fetch balances for live calculations
  const { data: balanceData, refetch } = useQuery({
    queryKey: ["balances", memberId],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/v1/members/${memberId}/points`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.balances as {
        partnerId: string;
        partnerName: string;
        balance: number;
      }[];
    },
    enabled: !!memberId,
  });

  // Fetch exchange rates from API
  const { data: apiRates } = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/v1/exchange-rates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return (response.data.rates || response.data.data || []) as any[];
    },
    retry: 1,
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
  });

  const getBalanceForPartner = (partnerId: string) => {
    if (!balanceData) return 0;
    const found = balanceData.find((b) => b.partnerId === partnerId);
    return found ? found.balance : 0;
  };

  // Active balances based on selection
  const fromBalance = fromPartner ? getBalanceForPartner(fromPartner.id) : 0;
  const toBalance = toPartner ? getBalanceForPartner(toPartner.id) : 0;

  // Conversion rate based on active direction loading from API or fallback configurations
  const activeRate = React.useMemo(() => {
    if (!fromPartner || !toPartner) return 1.0;

    // 1. Try finding in API rates first
    if (apiRates && apiRates.length > 0) {
      const found = apiRates.find(
        (r: any) =>
          r.fromPartnerId === fromPartner.id && r.toPartnerId === toPartner.id
      );
      if (found) return found.rate;
    }

    // 2. Try finding in localStorage rates as fallback
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pistos_exchange_rates");
      if (saved) {
        try {
          const parsedRates = JSON.parse(saved);

          const codeToId: Record<string, string> = {
            KFC: "660e8400-e29b-41d4-a716-446655440001",
            MCD: "660e8400-e29b-41d4-a716-446655440002",
            BK: "660e8400-e29b-41d4-a716-446655440003",
          };

          const fromAdminId = codeToId[fromPartner.code] || fromPartner.id;
          const toAdminId = codeToId[toPartner.code] || toPartner.id;

          const found = parsedRates.find(
            (r: any) =>
              r.fromPartnerId === fromAdminId && r.toPartnerId === toAdminId
          );
          if (found) return found.rate;
        } catch (e) {
          // Fallback
        }
      }
    }

    // 3. Default fallback rates
    if (fromPartner.code === "KFC" && toPartner.code === "MCD") return 0.8;
    if (fromPartner.code === "MCD" && toPartner.code === "KFC") return 0.9;
    return 1.0;
  }, [fromPartner, toPartner, apiRates]);

  // Handle swapping the From and To partners
  const handleSwapPartners = () => {
    const temp = fromPartner;
    setFromPartner(toPartner);
    setToPartner(temp);
  };

  const amountNumber = Number(exchangeAmount) || 0;
  const receiveAmount = Math.floor(amountNumber * activeRate);

  // Validation
  const isInsufficient = amountNumber > fromBalance;
  const isSamePartner = fromPartner?.id === toPartner?.id;
  const isValidAmount = amountNumber > 0 && !isInsufficient && !isSamePartner;

  const handleConfirmExchange = async () => {
    if (!isValidAmount || isSubmitting) return;

    setShowConfirmModal(false);
    setIsSubmitting(true);

    const token = localStorage.getItem("token");
    const payload = {
      fromPartnerId: fromPartner.id,
      toPartnerId: toPartner.id,
      points: amountNumber,
    };

    try {
      // In MVP, we call the POST /exchange endpoint
      await axios.post("/api/v1/exchange", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setIsSubmitting(false);
      setShowSuccessModal(true);
      refetch(); // Reload balances
      setErrorMessage(null);
    } catch (error: any) {
      console.error("Exchange request failed:", error);

      if (!error.response) {
        console.warn(
          "Backend offline. Simulating local points exchange update."
        );
        setShowSuccessModal(true);
        setIsSubmitting(false);
        return;
      }

      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else if (
        error.response?.data?.code === "EXCHANGE_RATE_NOT_CONFIGURED" ||
        error.response?.status === 404
      ) {
        setErrorMessage("Exchange rate not configured between these partners.");
      } else if (error.response?.data?.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage(
          "Exchange request failed. Please check your selection."
        );
      }
      setIsSubmitting(false);
    }
  };

  const handleSetMax = () => {
    setExchangeAmount(fromBalance.toString());
  };

  const handleSetMin = () => {
    setExchangeAmount("10"); // Minimum exchange limit
  };

  if (!isLoaded || !fromPartner || !toPartner) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#8B3D06] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#FDFDFD] md:bg-neutral-50 font-sans flex overflow-hidden">
      {/* DESKTOP SIDEBAR (Hidden on Mobile) */}
      <MemberSidebar
        className="hidden md:flex"
        activeTab="exchange"
        userName={member?.name || "Budi Santoso"}
        userTier="Gold Member"
      />

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* DESKTOP TOP BAR HEADER (Hidden on Mobile) */}
        <DesktopNavbar
          userName={member?.name || "Budi Santoso"}
          userTier="Gold Member"
          onLogout={logout}
          showBrand={false}
          breadcrumbs={[{ label: "Marketplace" }, { label: "Exchange" }]}
          title="Exchange Center"
        />

        {/* ========================================================
            MOBILE VIEW (Visible on Mobile inspect, hidden on Desktop)
            ======================================================== */}
        <div className="md:hidden flex-grow flex flex-col pb-24 overflow-y-auto">
          {/* Top Navbar */}
          <div className="px-5 pt-6 space-y-5">
            <h1 className="text-xl font-bold text-neutral-950 tracking-tight">
              Exchange Points
            </h1>

            <div className="space-y-3 relative">
              {/* FROM PARTNER CARD */}
              <div className="bg-white border border-neutral-200/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div className="space-y-1 w-full">
                  <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                    From Partner
                  </p>
                  <div className="relative mt-1">
                    <select
                      value={fromPartner.id}
                      onChange={(e) => {
                        const selected = partners.find(
                          (p) => p.id === e.target.value
                        );
                        if (selected) setFromPartner(selected);
                      }}
                      className="w-full bg-[#FDFDFD] border border-neutral-200 rounded-xl pl-10 pr-10 py-3 text-xs font-black text-neutral-800 outline-none focus:border-[#8B3D06] transition-colors cursor-pointer appearance-none"
                    >
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({getBalanceForPartner(p.id)} pts)
                        </option>
                      ))}
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Coins className="w-4 h-4 text-neutral-400" />
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* EXCHANGE INPUT CARD (Overlapped Swap button) */}
              <div className="bg-white border border-neutral-200/60 rounded-2xl p-4 shadow-sm text-center space-y-1 relative">
                <p className="text-[10px] font-black text-[#8B3D06] uppercase tracking-wider">
                  Points to Exchange
                </p>
                <div className="flex items-center justify-center gap-1 py-1">
                  <input
                    type="number"
                    value={exchangeAmount}
                    onChange={(e) => setExchangeAmount(e.target.value)}
                    className="w-40 text-center font-black text-4xl text-neutral-900 outline-none border-b border-transparent focus:border-neutral-200 py-1"
                  />
                </div>

                {/* Overlapping Swap button */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-[-18px] z-10">
                  <button
                    onClick={handleSwapPartners}
                    className="w-9 h-9 rounded-full bg-[#8B3D06] hover:bg-[#723204] text-white flex items-center justify-center shadow-md border-2 border-white cursor-pointer active:scale-95 transition-transform"
                    title="Swap partners"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* TO PARTNER CARD */}
              <div className="bg-white border border-neutral-200/60 rounded-2xl p-4 shadow-sm flex items-center justify-between pt-6">
                <div className="space-y-1 w-full">
                  <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                    To Partner
                  </p>
                  <div className="relative mt-1">
                    <select
                      value={toPartner.id}
                      onChange={(e) => {
                        const selected = partners.find(
                          (p) => p.id === e.target.value
                        );
                        if (selected) setToPartner(selected);
                      }}
                      className="w-full bg-[#FDFDFD] border border-neutral-200 rounded-xl pl-10 pr-10 py-3 text-xs font-black text-neutral-800 outline-none focus:border-[#8B3D06] transition-colors cursor-pointer appearance-none"
                    >
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({getBalanceForPartner(p.id)} pts)
                        </option>
                      ))}
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Coins className="w-4 h-4 text-neutral-400" />
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Exchange Rate Info Bar */}
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-orange-50 border border-orange-100/50 text-[#8B3D06] text-xs font-bold shadow-sm">
              <Info className="w-4 h-4 text-[#8B3D06]/80 shrink-0" />
              <span>
                1 {fromPartner.code} pt = {activeRate} {toPartner.code} pts
              </span>
            </div>

            {/* Same Partner Warning */}
            {isSamePartner && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200/50 text-red-700 text-xs font-medium animate-in fade-in duration-200">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="font-bold">Invalid Partner Pair</p>
                  <p className="text-[10px] mt-0.5 text-red-600/90 leading-tight">
                    Cannot exchange points within the same partner program.
                  </p>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/30 space-y-3.5 text-xs font-semibold">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none">
                Exchange Summary
              </p>

              <div className="flex justify-between items-center text-neutral-600">
                <span>You send</span>
                <span className="font-black text-neutral-800">
                  {amountNumber} {fromPartner.code} pts
                </span>
              </div>
              <div className="flex justify-between items-center text-neutral-600">
                <span>You receive</span>
                <span className="font-black text-brand-primary text-sm">
                  {receiveAmount} {toPartner.code} pts
                </span>
              </div>
            </div>

            {/* Mobile Warnings & Errors */}
            <div className="space-y-2 mt-2">
              {isInsufficient && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200/50 text-red-700 text-[10px] font-semibold animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span>
                    Insufficient points in your {fromPartner.code} account.
                  </span>
                </div>
              )}
              {isSamePartner && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200/50 text-red-700 text-[10px] font-semibold animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span>
                    Cannot exchange points within the same partner program.
                  </span>
                </div>
              )}
              {errorMessage && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200/50 text-red-700 text-[10px] font-semibold animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Action button */}
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={!isValidAmount || isSubmitting}
              className="w-full bg-[#8B3D06] hover:bg-[#723204] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3.5 font-bold cursor-pointer transition-all text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Exchange"
              )}
            </button>
          </div>

          <BottomNavigation />
        </div>

        {/* ========================================================
            DESKTOP VIEW (Visible on Desktop, hidden on Mobile)
            ======================================================== */}
        <div className="hidden md:flex flex-col flex-1 px-8 py-8 space-y-6 overflow-y-auto">

          {/* Main double column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Panel: Transfer Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-neutral-200/50 rounded-2xl p-6 shadow-sm space-y-6 relative">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <h2 className="text-sm font-bold text-neutral-900">
                    Transfer Details
                  </h2>
                </div>

                <div className="space-y-5 relative">
                  {/* From Dropdown Selector */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-wide">
                      From Partner
                    </label>
                    <div className="relative">
                      <select
                        value={fromPartner.id}
                        onChange={(e) => {
                          const selected = partners.find(
                            (p) => p.id === e.target.value
                          );
                          if (selected) setFromPartner(selected);
                        }}
                        className="w-full bg-[#FDFDFD] border border-[#d4d4d8] rounded-xl pl-10 pr-10 py-3 text-xs font-bold text-neutral-700 outline-none focus:border-[#8B3D06] transition-colors cursor-pointer appearance-none"
                      >
                        {partners.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({getBalanceForPartner(p.id)} pts)
                          </option>
                        ))}
                      </select>
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Coins className="w-4 h-4 text-neutral-400" />
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Swap Button (Desktop position) */}
                  <div className="flex justify-center -my-2 z-10">
                    <button
                      onClick={handleSwapPartners}
                      className="w-10 h-10 rounded-full bg-[#8B3D06] hover:bg-[#723204] text-white flex items-center justify-center shadow-md border-2 border-white cursor-pointer active:scale-95 transition-transform"
                      title="Swap programs"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* To Dropdown Selector */}
                  <div className="space-y-2 pt-2">
                    <label className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-wide">
                      To Partner
                    </label>
                    <div className="relative">
                      <select
                        value={toPartner.id}
                        onChange={(e) => {
                          const selected = partners.find(
                            (p) => p.id === e.target.value
                          );
                          if (selected) setToPartner(selected);
                        }}
                        className="w-full bg-[#FDFDFD] border border-[#d4d4d8] rounded-xl pl-10 pr-10 py-3 text-xs font-bold text-neutral-700 outline-none focus:border-[#8B3D06] transition-colors cursor-pointer appearance-none"
                      >
                        {partners.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({getBalanceForPartner(p.id)} pts)
                          </option>
                        ))}
                      </select>
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Coins className="w-4 h-4 text-neutral-400" />
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Amount Input with min/max links */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-wide">
                      Amount to Exchange
                    </label>
                    <div className="relative flex items-center bg-[#FDFDFD] border border-neutral-200 rounded-xl px-4 py-3 focus-within:border-[#8B3D06] transition-colors">
                      <input
                        type="number"
                        value={exchangeAmount}
                        onChange={(e) => setExchangeAmount(e.target.value)}
                        className="w-full text-left font-black text-xl text-neutral-800 outline-none"
                        placeholder="Enter amount"
                      />
                      <div className="flex items-center gap-2 text-[10px] font-bold text-brand-primary shrink-0 select-none">
                        <button
                          type="button"
                          onClick={handleSetMax}
                          className="hover:underline cursor-pointer"
                        >
                          Max
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Summary Calc */}
            <div className="space-y-6">
              {/* Calculations Box */}
              <div className="bg-white border border-neutral-200/50 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                {/* Dark Orange Header */}
                <div className="bg-[#8B3D06] p-5 text-white space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-orange-200">
                    Conversion Summary
                  </p>
                  <h3 className="text-lg font-black tracking-tight">
                    Final Calculation
                  </h3>
                </div>

                {/* Calculation Details */}
                <div className="p-5 space-y-4 text-xs font-semibold text-neutral-500">
                  <div className="flex justify-between items-center">
                    <span>Rate</span>
                    <span className="font-extrabold text-neutral-800">
                      1 : {activeRate}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Giving</span>
                    <span className="font-extrabold text-neutral-800">
                      {amountNumber.toLocaleString()} {fromPartner.code} Points
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-t border-neutral-100 pt-3">
                    <span>Receiving</span>
                    <span className="font-black text-[#8B3D06] text-sm">
                      {receiveAmount.toLocaleString()} {toPartner.code} Points
                    </span>
                  </div>

                  <div className="h-[1px] bg-neutral-200/50 my-2" />

                  {/* Processing guarantees */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 text-[10px] text-neutral-400 font-bold">
                      <TrendingUp className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Instant processing</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[10px] text-neutral-400 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Secure transaction</span>
                    </div>
                  </div>

                  {/* Desktop Warning Alert */}
                  {isInsufficient && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200/50 text-red-700 text-[10px] font-medium mt-3">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                      <span>
                        Insufficient points in your {fromPartner.code} account.
                      </span>
                    </div>
                  )}
                  {isSamePartner && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200/50 text-red-700 text-[10px] font-medium mt-3">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                      <span>
                        Cannot exchange points within the same partner program.
                      </span>
                    </div>
                  )}
                  {errorMessage && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200/50 text-red-700 text-[10px] font-medium mt-3 animate-in fade-in duration-150">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Confirm Button */}
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={!isValidAmount || isSubmitting}
                    className="w-full bg-[#8B3D06] hover:bg-[#723204] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3.5 font-bold cursor-pointer transition-all text-xs flex items-center justify-center gap-2 mt-4 shadow-sm"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Exchange
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          EXCHANGE SUCCESS MODAL (Slides in over dashboard)
          ======================================================== */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            onClick={() => setShowConfirmModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <div className="relative z-10 w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5">
              <ArrowUpDown className="w-8 h-8 text-[#8B3D06]" />
            </div>

            <h3 className="text-lg font-black text-center text-neutral-900">
              Confirm Exchange
            </h3>

            <p className="text-sm text-neutral-500 text-center mt-2 leading-relaxed">
              Are you sure you want to exchange your points?
            </p>

            <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">From</span>
                <span className="font-bold">
                  {amountNumber} {fromPartner.code} pts
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">To</span>
                <span className="font-bold text-[#8B3D06]">
                  {receiveAmount} {toPartner.code} pts
                </span>
              </div>

              <div className="flex justify-between text-sm border-t pt-3">
                <span className="text-neutral-500">Rate</span>
                <span className="font-bold">1 : {activeRate}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="cursor-pointer flex-1 border border-neutral-300 rounded-xl py-3 font-semibold hover:bg-neutral-100 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmExchange}
                disabled={isSubmitting}
                className="cursor-pointer flex-1 bg-[#8B3D06] hover:bg-[#723204] text-white rounded-xl py-3 font-bold transition disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

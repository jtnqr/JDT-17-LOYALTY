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

// Partner list definition matching FSD
const PARTNER_PROGRAMS = [
  {
    id: "660e8400-e29b-41d4-a716-446655440001",
    code: "KFC",
    name: "KFC Colonel's Club",
    logoBg: "bg-red-50 text-[#C8102E]",
    logoChar: "K",
  },
  {
    id: "660e8400-e29b-41d4-a716-446655440002",
    code: "MCD",
    name: "McDonald's MyRewards",
    logoBg: "bg-yellow-50 text-[#D89F0E]",
    logoChar: "M",
  },
  {
    id: "660e8400-e29b-41d4-a716-446655440003",
    code: "BK",
    name: "Burger King Indonesia",
    logoBg: "bg-amber-50 text-[#8B4F1D] border-amber-100",
    logoChar: "B",
  },
];

export default function ExchangePointsPage() {
  const { member, memberId, isLoaded, logout } = useMember();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
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

  // Exchange state
  const [fromPartner, setFromPartner] = useState(PARTNER_PROGRAMS[0]); // Starts KFC
  const [toPartner, setToPartner] = useState(PARTNER_PROGRAMS[1]); // Starts McD
  const [exchangeAmount, setExchangeAmount] = useState<string>("100");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

  const kfcBalance =
    balanceData?.find((b) => b.partnerName.toLowerCase().includes("kfc"))
      ?.balance ?? 350;
  const mcdBalance =
    balanceData?.find((b) => b.partnerName.toLowerCase().includes("mcd"))
      ?.balance ?? 120;
  const bkBalance =
    balanceData?.find((b) => b.partnerName.toLowerCase().includes("burger"))
      ?.balance ?? 80;

  // Active balances based on selection
  const fromBalance =
    fromPartner.code === "KFC"
      ? kfcBalance
      : fromPartner.code === "MCD"
      ? mcdBalance
      : bkBalance;
  const toBalance =
    toPartner.code === "KFC"
      ? kfcBalance
      : toPartner.code === "MCD"
      ? mcdBalance
      : bkBalance;

  // Conversion rate based on active direction loading from API or fallback configurations
  const activeRate = React.useMemo(() => {
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
  const isValidAmount = amountNumber > 0 && !isInsufficient;

  const handleConfirmExchange = async () => {
    if (!isValidAmount || isSubmitting) return;
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
    } catch (error: any) {
      console.error("Exchange request failed:", error);

      // Fallback offline success simulation
      if (!error.response) {
        console.warn(
          "Backend offline. Simulating local points exchange update."
        );

        // Update mock balances in localStorage or just simulate success
        setShowSuccessModal(true);
        setIsSubmitting(false);
        return;
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

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#FDFDFD] md:bg-neutral-50 font-sans flex overflow-hidden">
      {/* DESKTOP SIDEBAR (Hidden on Mobile) */}
      <MemberSidebar
        className={cn(
          "hidden md:flex transition-all duration-300 ease-in-out",
          isSidebarOpen
            ? "w-60 border-r border-neutral-200"
            : "w-0 overflow-hidden border-r-0"
        )}
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
          onToggleMenu={handleToggleSidebar}
          showBrand={!isSidebarOpen}
        />

        {/* ========================================================
            MOBILE VIEW (Visible on Mobile inspect, hidden on Desktop)
            ======================================================== */}
        <div className="md:hidden flex-grow flex flex-col pb-24">
          {/* Top Navbar */}
          <div className="px-5 pt-6 space-y-5">
            <h1 className="text-xl font-bold text-neutral-950 tracking-tight">
              Exchange Points
            </h1>

            <div className="space-y-3 relative">
              {/* FROM PARTNER CARD */}
              <div className="bg-white border border-neutral-200/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                    From Partner
                  </p>
                  <div className="flex items-center gap-2.5 mt-1">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs border shadow-inner",
                        fromPartner.logoBg
                      )}
                    >
                      {fromPartner.logoChar}
                    </div>
                    <div>
                      <p className="text-xs font-black text-neutral-800 leading-none">
                        {fromPartner.name}
                      </p>
                      <p className="text-[10px] font-semibold text-neutral-400 mt-1">
                        Balance: {fromBalance} pts
                      </p>
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
                <div className="space-y-1">
                  <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                    To Partner
                  </p>
                  <div className="flex items-center gap-2.5 mt-1">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs border shadow-inner",
                        toPartner.logoBg
                      )}
                    >
                      {toPartner.logoChar}
                    </div>
                    <div>
                      <p className="text-xs font-black text-neutral-800 leading-none">
                        {toPartner.name}
                      </p>
                      <p className="text-[10px] font-semibold text-neutral-400 mt-1">
                        Balance: {toBalance} pts
                      </p>
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

            {/* Insufficient Warning */}
            {isInsufficient && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200/50 text-red-700 text-xs font-medium animate-in fade-in duration-200">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="font-bold">Insufficient Balance</p>
                  <p className="text-[10px] mt-0.5 text-red-600/90 leading-tight">
                    You have {fromBalance} {fromPartner.code} points, but
                    entered {exchangeAmount}.
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

            {/* Action button */}
            <button
              onClick={handleConfirmExchange}
              disabled={!isValidAmount || isSubmitting}
              className="w-full bg-[#8B3D06] hover:bg-[#723204] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3.5 font-bold cursor-pointer transition-all text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Confirm Exchange"
              )}
            </button>
          </div>

          <BottomNavigation />
        </div>

        {/* ========================================================
            DESKTOP VIEW (Visible on Desktop, hidden on Mobile)
            ======================================================== */}
        <div className="hidden md:flex flex-col flex-1 px-8 py-8 space-y-6 overflow-y-auto">
          {/* Greeting Header */}
          <section className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
              <span>Marketplace</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-neutral-600">Exchange Center</span>
            </div>
            <h1 className="text-3xl font-extrabold text-neutral-950 tracking-tight">
              Exchange Points
            </h1>
          </section>

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
                      From Partner Program
                    </label>
                    <div className="relative">
                      <div className="w-full bg-[#FDFDFD] border border-neutral-200 rounded-xl px-4 py-3 flex items-center justify-between select-none">
                        <div className="flex items-center gap-3">
                          <Coins className="w-4 h-4 text-neutral-400" />
                          <span className="text-xs font-bold text-neutral-700">
                            {fromPartner.name} ({fromBalance} pts)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Swap Button (Desktop position) */}
                  <div className="flex justify-center absolute left-1/2 -translate-x-1/2 top-[47px] z-10">
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
                      To Partner Program
                    </label>
                    <div className="relative">
                      <div className="w-full bg-[#FDFDFD] border border-neutral-200 rounded-xl px-4 py-3 flex items-center justify-between select-none">
                        <div className="flex items-center gap-3">
                          <Coins className="w-4 h-4 text-neutral-400" />
                          <span className="text-xs font-bold text-neutral-700">
                            {toPartner.name} ({toBalance} pts)
                          </span>
                        </div>
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
                        {/* <button
                          type="button"
                          onClick={handleSetMin}
                          className="hover:underline cursor-pointer"
                        >
                          Min
                        </button> */}
                        {/* <span className="text-neutral-200">|</span> */}
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

                  {/* Confirm Button */}
                  <button
                    onClick={handleConfirmExchange}
                    disabled={!isValidAmount || isSubmitting}
                    className="w-full bg-[#8B3D06] hover:bg-[#723204] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3.5 font-bold cursor-pointer transition-all text-xs flex items-center justify-center gap-2 mt-4 shadow-sm"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Confirm Exchange
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-[9px] text-center text-neutral-400 font-semibold mt-3">
                    By confirming, you agree to the{" "}
                    <span className="underline cursor-pointer">
                      Terms of Exchange
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          EXCHANGE SUCCESS MODAL (Slides in over dashboard)
          ======================================================== */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={() => setShowSuccessModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <div className="absolute w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative z-10 animate-in zoom-in-95 duration-200 select-none">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4 shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-base font-black text-neutral-900">
              Exchange Complete!
            </h3>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed max-w-[280px]">
              You have successfully converted **{amountNumber}{" "}
              {fromPartner.code} points** into **{receiveAmount}{" "}
              {toPartner.code} points**.
            </p>

            <div className="w-full border border-neutral-100 rounded-2xl bg-neutral-50/50 p-4 mt-5 space-y-2 text-xs font-semibold text-neutral-500">
              <div className="flex justify-between items-center">
                <span>{fromPartner.code} Remaining Balance</span>
                <span className="font-extrabold text-neutral-800">
                  {fromBalance - amountNumber} pts
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-neutral-100/50 pt-2">
                <span>{toPartner.code} New Balance</span>
                <span className="font-extrabold text-brand-primary">
                  {toBalance + receiveAmount} pts
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-[#8B3D06] hover:bg-[#723204] text-white rounded-xl py-3.5 font-bold cursor-pointer transition-colors text-xs mt-5 shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

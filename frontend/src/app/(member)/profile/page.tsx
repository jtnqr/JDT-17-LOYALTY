"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMember } from "@/lib/hooks/useMember";
import { useRouter } from "next/navigation";
import { DesktopNavbar } from "@/components/organisms/DesktopNavbar";
import { MemberSidebar } from "@/components/organisms/MemberSidebar";
import { BottomNavigation } from "@/components/organisms/BottomNavigation";
import apiClient from "@/lib/apiClient";
import {
  LogOut,
  ChevronRight,
  User,
  Building2,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { PointBalance } from "@/types";
import Avatar from "@/components/atoms/Avatar";

export default function ProfilePage() {
  const { member, memberId, isLoaded, logout } = useMember();
  const router = useRouter();

  const POLLING_INTERVAL =
    Number(process.env.NEXT_PUBLIC_REFETCH_INTERVAL) || 5000;


  // Fetch Member Details via React Query
  const { data: memberDetail } = useQuery({
    queryKey: ["memberDetail", memberId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/members/${memberId}`);
      return response.data;
    },
    enabled: !!memberId,
    retry: 1,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });

  // Fetch Member Balances via React Query
  const { data: balanceData } = useQuery({
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

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#8B3D06] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const balances = balanceData || [];

  // Available Points = sum of all balances or fallback mockup value
  const totalPoints = balanceData
    ? balanceData.reduce((sum, item) => sum + item.balance, 0)
    : 0;

  const displayMember = memberDetail || member;

  const handleViewRewards = (partnerId: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("selected_partner_filter", partnerId);
    }
    router.push("/rewards");
  };

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden">
        {/* Outer Scroll Container */}
        <div className="flex-grow overflow-y-auto">
          {/* ========================================================
              MOBILE VIEW (Visible on Mobile, Hidden on Desktop)
              ======================================================== */}
          <div className="md:hidden max-w-md mx-auto px-5 py-6 pb-24">
            {/* Profile Content Container */}
            <div className="bg-white rounded-3xl p-1 space-y-6">
              {/* Large Centered Avatar Area */}
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg shadow-neutral-200">
                  <Avatar
                    name={displayMember?.name}
                    className="w-24 h-24 text-3xl"
                  />
                </div>
                <h3 className="text-lg font-black text-neutral-900 mt-4 leading-none">
                  {displayMember?.name || "Budi Santoso"}
                </h3>

                {/* Mobile Info Badges */}
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
                    {displayMember?.email || "budi.santoso@example.com"}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
                    {displayMember?.phone || "081234567890"}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full",
                      displayMember?.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    )}
                  >
                    {displayMember?.status || "ACTIVE"}
                  </span>
                </div>
              </div>

              {/* Available Points Card */}
              <div className="bg-white rounded-2xl flex items-center justify-between p-5 shadow-xs border border-neutral-200/50 border-t-4 border-t-[#8B3D06]">
                <div>
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Aggregate Available Points
                  </p>
                  <p className="text-3xl font-black text-[#8B3D06] mt-1.5 tracking-tight">
                    {totalPoints.toLocaleString()}{" "}
                    <span className="text-xs font-bold text-neutral-400">
                      pts
                    </span>
                  </p>
                </div>
                <div className="bg-[#FCF5F1] p-3 rounded-2xl border border-[#8B3D06]/5 text-right">
                  <p className="text-[10px] font-bold text-[#8B3D06] uppercase tracking-wider">
                    Estimated Value
                  </p>
                  <p className="text-sm font-black text-[#8B3D06] mt-0.5">
                    Rp {(totalPoints * 1000).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* From Partner Section */}
              <div className="max-h-60 overflow-y-auto overflow-x-hidden space-y-3 pr-1">
                {balances.map((bal) => {
                  const firstChar = bal.partnerName
                    ? bal.partnerName.trim().charAt(0).toUpperCase()
                    : "P";
                  return (
                    <div
                      key={bal.partnerId}
                      className="bg-[#FCF5F1] border border-[#8B3D06]/5 rounded-2xl p-4 flex items-center gap-4 hover:bg-[#FBECE3]"
                    >
                      <div
                        onClick={() => handleViewRewards(bal.partnerId)}
                        className="flex flex-1 min-w-0 items-center gap-4 cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-[#8B3D06] text-white flex items-center justify-center shrink-0">
                          {firstChar}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-black text-neutral-800">
                            {bal.partnerName}
                          </p>

                          <p className="text-xs text-neutral-500 font-semibold mt-1.5">
                            Balance:
                            <span className="font-extrabold text-[#8B3D06] ml-1">
                              {bal.balance.toLocaleString()}
                            </span>{" "}
                            pts
                          </p>
                        </div>
                      </div>

                      <Link
                        href="/exchange"
                        className="shrink-0 p-2 hover:bg-[#8B3D06]/10 rounded-full"
                      >
                        <ArrowRight className="w-4 h-4 text-[#8B3D06]/80" />
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* Log Out Button */}
              <div className="pt-4">
                <button
                  onClick={logout}
                  className="w-full bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 font-bold py-2 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:translate-y-px shadow-xs"
                >
                  <LogOut className="w-4.5 h-4.5 text-red-600" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================
              DESKTOP VIEW (Visible on Desktop, Hidden on Mobile)
              ======================================================== */}
          <div className="hidden md:block max-w-5xl mx-auto px-8 py-8 space-y-6">
            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              {/* Column 1: Profile Summary Card */}
              <div className="bg-white rounded-3xl border border-neutral-200/50 p-6 flex flex-col items-center text-center shadow-xs">
                <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg shadow-neutral-200">
                  <Avatar
                    name={displayMember?.name}
                    className="w-28 h-28 text-4xl"
                  />
                </div>
                <h3 className="text-lg font-black text-neutral-900 mt-4 leading-none">
                  {displayMember?.name || "Budi Santoso"}
                </h3>

                {/* Account Details */}
                <div className="w-full border-t border-neutral-100 mt-6 pt-5 space-y-3.5 text-left text-xs">
                  <div>
                    <span className="font-bold text-neutral-400 uppercase tracking-wider block text-[10px]">
                      Email Address
                    </span>
                    <span className="font-semibold text-neutral-700 mt-1 block">
                      {displayMember?.email || "budi.santoso@example.com"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-neutral-400 uppercase tracking-wider block text-[10px]">
                      Phone Number
                    </span>
                    <span className="font-semibold text-neutral-700 mt-1 block">
                      {displayMember?.phone || "081234567890"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-neutral-400 uppercase tracking-wider block text-[10px]">
                      Status
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold mt-1",
                        displayMember?.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      )}
                    >
                      {displayMember?.status || "ACTIVE"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-neutral-400 uppercase tracking-wider block text-[10px]">
                      Member Since
                    </span>
                    <span className="font-semibold text-neutral-700 mt-1 block">
                      {displayMember?.createdAt
                        ? new Date(displayMember.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "July 3, 2026"}
                    </span>
                  </div>
                </div>

                {/* Log Out Button */}
                <button
                  onClick={logout}
                  className="w-full mt-8 bg-neutral-50 hover:bg-red-50 text-neutral-600 hover:text-red-700 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-neutral-200 active:translate-y-px"
                >
                  <LogOut className="w-4.5 h-4.5 text-red-600" />
                  <span>Log Out</span>
                </button>
              </div>

              {/* Column 2 & 3: Point Wallets & Partner Breakdown */}
              <div className="md:col-span-2 space-y-6">
                {/* Total Points Header Card */}
                <div className="bg-white rounded-3xl p-6 border border-neutral-200/50 shadow-xs border-t-4 border-t-[#8B3D06] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Aggregate Available Points
                    </p>
                    <p className="text-4xl font-black text-[#8B3D06] mt-2 tracking-tight">
                      {totalPoints.toLocaleString()}{" "}
                      <span className="text-xs font-bold text-neutral-400">
                        pts
                      </span>
                    </p>
                  </div>
                  <div className="bg-[#FCF5F1] p-4 rounded-2xl border border-[#8B3D06]/5">
                    <p className="text-[10px] font-bold text-[#8B3D06] uppercase tracking-wider">
                      Estimated Value
                    </p>
                    <p className="text-lg font-black text-[#8B3D06] mt-0.5">
                      Rp {(totalPoints * 1000).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Partner Wallets Grid */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-neutral-900 px-1 flex items-center gap-2">
                    <Building2 className="w-4.5 h-4.5 text-[#8B3D06]" />
                    Partner Wallets Breakdown
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {balances.map((bal) => {
                      const firstChar = bal.partnerName
                        ? bal.partnerName.trim().charAt(0).toUpperCase()
                        : "P";
                      return (
                        <div
                          key={bal.partnerId}
                          className="group bg-white rounded-2xl p-5 border border-neutral-200/50 shadow-xs flex flex-col justify-between h-40 transition-all hover:shadow-md border-t-4 border-t-[#8B3D06]"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#FCF5F1] text-[#8B3D06] flex items-center justify-center shadow-inner font-black text-base select-none">
                                {firstChar}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-neutral-800 leading-none">
                                  {bal.partnerName}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4">
                            <p className="text-xl font-black text-neutral-900 tracking-tight">
                              {bal.balance.toLocaleString()}{" "}
                              <span className="text-xs font-bold text-neutral-400">
                                pts
                              </span>
                            </p>
                          </div>

                          <div className="border-t border-neutral-100 pt-3 flex items-center justify-between text-[10px] text-neutral-500 font-bold">
                            <button
                              onClick={() => handleViewRewards(bal.partnerId)}
                              className="group-hover:underline underline-offset-2 text-[#8B3D06] hover:underline cursor-pointer bg-transparent border-none p-0 text-left font-bold"
                            >
                              View Rewards
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

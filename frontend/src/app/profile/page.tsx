"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMember } from "@/lib/hooks/useMember";
import { DesktopNavbar } from "@/components/organisms/DesktopNavbar";
import { MemberSidebar } from "@/components/organisms/MemberSidebar";
import { BottomNavigation } from "@/components/organisms/BottomNavigation";
import axios from "axios";
import { LogOut, ChevronRight, User, Building2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { PointBalance } from "@/types";

export default function ProfilePage() {
  const { member, memberId, isLoaded, logout } = useMember();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  // Fetch Member Balances via React Query
  const { data: balanceData } = useQuery({
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

  return (
    <div className="h-screen bg-[#FDFDFD] md:bg-neutral-50 font-sans flex overflow-hidden">
      {/* 1. DESKTOP SIDEBAR NAVIGATION */}
      <MemberSidebar
        className={cn(
          "hidden md:flex transition-all duration-300 ease-in-out",
          isSidebarOpen
            ? "w-60 border-r border-neutral-200"
            : "w-0 overflow-hidden border-r-0"
        )}
        activeTab="profile"
        userName={member?.name || "Budi Santoso"}
        userTier="Gold Member"
      />

      {/* 2. MAIN LAYOUT WRAPPER */}
      <div className="flex-grow flex flex-col min-w-0">
        <DesktopNavbar
          userName={member?.name || "Budi Santoso"}
          userTier="Gold Member"
          onLogout={logout}
          onToggleMenu={handleToggleSidebar}
          showBrand={!isSidebarOpen}
        />

        {/* Outer Scroll Container */}
        <div className="flex-grow overflow-y-auto">
          {/* ========================================================
              MOBILE VIEW (Visible on Mobile, Hidden on Desktop)
              ======================================================== */}
          <div className="md:hidden max-w-md mx-auto px-5 py-6 pb-24">
            {/* Top Bar Header */}
            {/* <div className="flex items-center justify-center gap-3.5 mb-6 px-1">
              <h2 className="text-xl font-black text-[#8B3D06]">Profile</h2>
            </div> */}

            {/* Profile Content Container */}
            <div className="bg-white rounded-3xl p-1 space-y-6">
              {/* Large Centered Avatar Area */}
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg shadow-neutral-200">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250&h=250"
                    alt="Budi Santoso Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-lg font-black text-neutral-900 mt-4 leading-none">
                  {member?.name || "Budi Santoso"}
                </h3>
                <p className="text-xs font-semibold text-neutral-400 mt-2">
                  Member since July 2026
                </p>
              </div>

              {/* Available Points Card */}
              <div className="bg-white rounded-2xl flex items-center flex-col p-5 shadow-xs border border-neutral-200/50 border-t-4 border-t-amber-400">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Available Points
                </p>
                <p className="text-3xl font-black text-[#8B3D06] mt-1.5 tracking-tight">
                  {totalPoints.toLocaleString()}
                </p>
              </div>

              {/* From Partner Section */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block px-1">
                  From Partner
                </span>
                {balances.map((bal) => {
                  const isKfc = bal.partnerName.toLowerCase().includes("kfc");
                  return (
                    <div
                      key={bal.partnerId}
                      className="bg-[#FCF5F1] border border-[#8B3D06]/5 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all hover:bg-[#FBECE3]"
                    >
                      {isKfc ? (
                        <div className="w-12 h-12 rounded-2xl bg-[#C8102E] flex items-center justify-center text-white shrink-0 shadow-sm shadow-[#C8102E]/20">
                          <svg
                            className="w-7 h-7"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M4 8h16l-2 12H6L4 8zm8 2a3 3 0 0 0-3 3h6a3 3 0 0 0-3-3z" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-[#FFC72C] flex items-center justify-center text-[#C8102E] shrink-0 shadow-sm shadow-yellow-500/10">
                          <svg
                            className="w-7 h-7"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M5 10h14v10H5V10zm2 2v6h2v-6H7zm4 0v6h2v-6h-2zm4 0v6h2v-6h-2zM6 4h2v5H6V4zm4 1h2v4h-2V5zm4-2h2v7h-2V3z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-black text-neutral-800 leading-none">
                          {isKfc ? "KFC" : "McDonald's"}
                        </p>
                        <p className="text-xs text-neutral-500 font-semibold mt-1.5">
                          Balance:{" "}
                          <span className="font-extrabold text-[#8B3D06]">
                            {bal.balance.toLocaleString()}
                          </span>{" "}
                          pts
                        </p>
                      </div>
                      <Link href="/exchange">
                        <RefreshCw className="w-4 h-4 text-neutral-400/80" />
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
            {/* Title / Breadcrumbs */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
                <span>Member</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-neutral-600">Profile</span>
              </div>
              <h2 className="text-2xl font-black text-neutral-900 mt-1 leading-none">
                My Profile
              </h2>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              {/* Column 1: Profile Summary Card */}
              <div className="bg-white rounded-3xl border border-neutral-200/50 p-6 flex flex-col items-center text-center shadow-xs">
                <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg shadow-neutral-200">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250&h=250"
                    alt="Budi Santoso Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-lg font-black text-neutral-900 mt-4 leading-none">
                  {member?.name || "Budi Santoso"}
                </h3>

                {/* Account Details */}
                <div className="w-full border-t border-neutral-100 mt-6 pt-5 space-y-3.5 text-left text-xs">
                  <div>
                    <span className="font-bold text-neutral-400 uppercase tracking-wider block text-[10px]">
                      Email Address
                    </span>
                    <span className="font-semibold text-neutral-700 mt-1 block">
                      {member?.email || "budi.santoso@example.com"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-neutral-400 uppercase tracking-wider block text-[10px]">
                      Phone Number
                    </span>
                    <span className="font-semibold text-neutral-700 mt-1 block">
                      {member?.phone || "081234567890"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-neutral-400 uppercase tracking-wider block text-[10px]">
                      Registered Since
                    </span>
                    <span className="font-semibold text-neutral-500 mt-1 block">
                      July 2026
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
                <div className="bg-white rounded-3xl p-6 border border-neutral-200/50 shadow-xs border-t-4 border-t-amber-400 flex items-center justify-between">
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
                      const isKfc = bal.partnerName
                        .toLowerCase()
                        .includes("kfc");
                      return (
                        <div
                          key={bal.partnerId}
                          className={cn(
                            "bg-white rounded-2xl p-5 border border-neutral-200/50 shadow-xs flex flex-col justify-between h-40 transition-all hover:shadow-md border-t-4",
                            isKfc ? "border-t-[#C8102E]" : "border-t-[#FFC72C]"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isKfc ? (
                                <div className="w-10 h-10 rounded-xl bg-[#FFEBEE] text-[#C8102E] flex items-center justify-center shadow-inner">
                                  <svg
                                    className="w-6 h-6"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M4 8h16l-2 12H6L4 8zm8 2a3 3 0 0 0-3 3h6a3 3 0 0 0-3-3z" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-yellow-50 text-[#D89F0E] flex items-center justify-center shadow-inner">
                                  <svg
                                    className="w-6 h-6"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M5 10h14v10H5V10zm2 2v6h2v-6H7zm4 0v6h2v-6h-2zm4 0v6h2v-6h-2zM6 4h2v5H6V4zm4 1h2v4h-2V5zm4-2h2v7h-2V3z" />
                                  </svg>
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-bold text-neutral-800 leading-none">
                                  {isKfc
                                    ? "KFC Colonel's Club"
                                    : "McDonald's MyRewards"}
                                </p>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full border border-neutral-200/30">
                              ACTIVE
                            </span>
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
                            {isKfc ? (
                              <></>
                            ) : (
                              <>
                                <Link
                                  href="/rewards"
                                  className="text-[#8B3D06] hover:underline"
                                ></Link>
                              </>
                            )}
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

        {/* 3. MOBILE BOTTOM NAVIGATION */}
        <BottomNavigation />
      </div>
    </div>
  );
}

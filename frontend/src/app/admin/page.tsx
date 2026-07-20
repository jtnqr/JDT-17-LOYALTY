"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminHeader } from "@/components/organisms/AdminHeader";
import { useAdmin } from "@/lib/hooks/useAdmin";
import apiClient from "@/lib/apiClient";
import {
  Users,
  Building2,
  Gift,
  Coins,
  ArrowUpRight,
  TrendingUp,
  Award,
  Download,
} from "lucide-react";

interface PopularRewardDetail {
  name: string;
  count: number;
}

interface ExchangeTrafficDetail {
  kfcToMcdCount: number;
  mcdToKfcCount: number;
}

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  enrolledToday: number;
  pointsIssued: number;
  pointsRedeemed: number;
  pointsExpired: number;
  totalPartners: number;
  totalRewards: number;
  redeemedPointsPerMonth: Record<string, number>;
  popularRewards: PopularRewardDetail[];
  exchangeTraffic: ExchangeTrafficDetail;
}

export default function AdminDashboardPage() {
  const { isLoaded } = useAdmin();

  // Fetch real-time dashboard statistics from backend API
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const response = await apiClient.get("/api/v1/admin/dashboard-stats");
      return response.data;
    },
    enabled: isLoaded,
  });

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalMembers = stats?.totalMembers ?? 0;
  const activeMembers = stats?.activeMembers ?? 0;
  const inactiveMembers = stats?.inactiveMembers ?? 0;
  const enrolledToday = stats?.enrolledToday ?? 0;
  const totalPartners = stats?.totalPartners ?? 0;
  const totalRewards = stats?.totalRewards ?? 0;
  const pointsIssued = stats?.pointsIssued ?? 0;
  const pointsRedeemed = stats?.pointsRedeemed ?? 0;
  const pointsExpired = stats?.pointsExpired ?? 0;

  // Active vs Inactive percentages for Pie Chart
  const totalPie = activeMembers + inactiveMembers;
  const activePercent = totalPie > 0 ? Math.round((activeMembers / totalPie) * 100) : 0;
  const inactivePercent = totalPie > 0 ? 100 - activePercent : 0;

  // Monthly Redemptions Data for Bar Chart
  const monthlyMap = stats?.redeemedPointsPerMonth ?? {};
  const monthlyData = Object.entries(monthlyMap).map(([month, val]) => ({
    month,
    value: val,
  }));
  const maxMonthValue = monthlyData.length > 0 ? Math.max(...monthlyData.map((d) => d.value)) : 0;

  // Exchange traffic details
  const kfcToMcd = stats?.exchangeTraffic?.kfcToMcdCount ?? 0;
  const mcdToKfc = stats?.exchangeTraffic?.mcdToKfcCount ?? 0;
  const totalExchanges = kfcToMcd + mcdToKfc;
  const kfcToMcdPercent = totalExchanges > 0 ? Math.round((kfcToMcd / totalExchanges) * 100) : 0;
  const mcdToKfcPercent = totalExchanges > 0 ? 100 - kfcToMcdPercent : 0;

  // Popular rewards
  const popularRewards = stats?.popularRewards ?? [];

  const handleDownloadStats = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <>
      <AdminHeader
        breadcrumbs={[{ label: "Dashboard" }]}
        title="Overview Dashboard"
      />
      <div className="p-8 space-y-8 overflow-y-auto flex-1 bg-neutral-50/50">
        {/* Top actions/download row */}
        <div className="flex justify-end items-center print:hidden">
          <button
            onClick={handleDownloadStats}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-neutral-600 bg-white border border-neutral-200 hover:border-brand-primary hover:text-brand-primary rounded-xl shadow-sm transition-all focus:outline-none cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>

        {/* Key Metrics Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Members Summary */}
          <div className="bg-white border border-neutral-200/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">
                Members Overview
              </span>
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-brand-primary flex items-center justify-center border border-orange-100/30">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-black text-neutral-900 tracking-tight">
                {totalMembers}
              </p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500">
                <span className="flex items-center text-emerald-600 font-bold">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                  +{enrolledToday}
                </span>
                <span>registered today</span>
              </div>
            </div>
          </div>

          {/* Card 2: Partners & Catalog */}
          <div className="bg-white border border-neutral-200/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">
                Partners & Catalog
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/30">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-neutral-600">Active Partners:</span>
                <span className="text-xl font-black text-neutral-900">{totalPartners}</span>
              </div>
              <div className="flex justify-between items-baseline border-t border-neutral-100 pt-2">
                <span className="text-sm font-bold text-neutral-600">Catalog Rewards:</span>
                <span className="text-xl font-black text-neutral-900">{totalRewards}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Points Issued & Redeemed */}
          <div className="bg-white border border-neutral-200/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">
                Points Transactions
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100/30">
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-neutral-600">Points Issued:</span>
                <span className="text-sm font-black text-neutral-900">
                  {pointsIssued.toLocaleString()} pts
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-neutral-100 pt-2">
                <span className="text-sm font-bold text-neutral-600">Points Redeemed:</span>
                <span className="text-sm font-black text-neutral-900">
                  {pointsRedeemed.toLocaleString()} pts
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-neutral-100 pt-2">
                <span className="text-xs font-semibold text-neutral-500">Expired Points:</span>
                <span className="text-xs font-extrabold text-red-600">
                  {pointsExpired.toLocaleString()} pts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Chart 1: Member Status Breakdown (Pie Chart) */}
          <div className="bg-white border border-neutral-200/60 rounded-2xl p-6 shadow-sm lg:col-span-5 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-3 flex justify-between items-center">
                <span>Member Status Distribution</span>
              </h3>

              <div className="flex flex-col items-center justify-center py-6">
                {totalPie > 0 ? (
                  <div className="relative flex items-center justify-center">
                    <svg viewBox="0 0 42 42" className="w-44 h-44 transform -rotate-90">
                      {/* Base circle (Inactive) */}
                      <circle
                        cx="21"
                        cy="21"
                        r="15.91549430918954"
                        fill="transparent"
                        stroke="#EF4444"
                        strokeWidth="5"
                      />
                      {/* Segment circle (Active) */}
                      <circle
                        cx="21"
                        cy="21"
                        r="15.91549430918954"
                        fill="transparent"
                        stroke="#10B981"
                        strokeWidth="5"
                        strokeDasharray={`${activePercent} ${inactivePercent}`}
                        strokeDashoffset="0"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <p className="text-2xl font-black text-neutral-900 leading-none">
                        {activePercent}%
                      </p>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-1">
                        Active
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-44 h-44 rounded-full border border-dashed border-neutral-200 flex items-center justify-center text-xs font-semibold text-neutral-400">
                    No member data
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-around items-center border-t border-neutral-100 pt-4 text-xs font-bold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-neutral-500">Active ({activeMembers})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-neutral-500">Inactive ({inactiveMembers})</span>
              </div>
            </div>
          </div>

          {/* Chart 2: Redeemed Points per Month (Bar Chart) */}
          <div className="bg-white border border-neutral-200/60 rounded-2xl p-6 shadow-sm lg:col-span-7 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-3 flex justify-between items-center">
                <span>Redeemed Points History</span>
                <span className="text-[9px] text-purple-600 font-bold uppercase tracking-wider bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100/30">
                  Monthly Trend
                </span>
              </h3>

              {/* Bar Chart Graphics */}
              {monthlyData.length > 0 ? (
                <div className="h-48 flex items-end justify-between px-2 pt-6 pb-2">
                  {monthlyData.map((d, i) => {
                    const heightPercent = maxMonthValue > 0 ? (d.value / maxMonthValue) * 80 : 0;
                    return (
                      <div key={i} className="flex flex-col items-center flex-1 group h-full justify-end">
                        <span className="text-[10px] font-black text-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-1">
                          {d.value.toLocaleString()}
                        </span>
                        {/* Fixed Height Wrapper to Anchor Bottom */}
                        <div className="h-32 w-full flex items-end justify-center">
                          <div
                            style={{ height: `${Math.max(heightPercent, 4)}%` }}
                            className="w-8 bg-[#8B3D06] rounded-t-lg transition-all duration-500 hover:brightness-110 shadow-sm"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-400 mt-2">
                          {d.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center border border-dashed border-neutral-200 rounded-xl mt-6 text-xs font-semibold text-neutral-400">
                  No redemption data available
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-neutral-100 pt-4 text-[10px] font-semibold text-neutral-400">
              <span className="flex items-center">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                Real-time transaction statistics
              </span>
              <span>Values in points (pts)</span>
            </div>
          </div>
        </div>

        {/* Bottom Operational Analytics Row */}
        <div className="grid grid-cols-1 gap-8 items-start">
          {/* Popular Rewards List */}
          <div className="bg-white border border-neutral-200/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-3 flex justify-between items-center">
              <span>Most Popular Catalog Rewards</span>
              <Award className="w-4 h-4 text-brand-primary" />
            </h3>

            {popularRewards.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                {popularRewards.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-semibold text-neutral-800">{item.name}</span>
                    </div>
                    <span className="text-xs font-extrabold text-neutral-500 bg-neutral-50 px-2.5 py-1 rounded-full border border-neutral-100">
                      {item.count} redemptions
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 flex items-center justify-center text-xs font-semibold text-neutral-400 border border-dashed border-neutral-200 rounded-xl">
                No items redeemed yet
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

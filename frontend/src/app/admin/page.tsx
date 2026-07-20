"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/organisms/AdminSidebar";
import { AdminHeader } from "@/components/organisms/AdminHeader";
import { useAdmin } from "@/lib/hooks/useAdmin";
import apiClient from "@/lib/apiClient";
import {
  Users,
  Building2,
  RefreshCw,
  Gift,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { isLoaded } = useAdmin();

  // Fetch Member count from API
  const { data: memberData } = useQuery({
    queryKey: ["admin-total-members"],
    queryFn: async () => {
      const response = await apiClient.get("/api/v1/members?page=0&size=1");
      return response.data.total as number;
    },
    enabled: isLoaded,
  });

  // Fetch Partner count from API
  const { data: partnerData } = useQuery({
    queryKey: ["admin-total-partners"],
    queryFn: async () => {
      const response = await apiClient.get("/api/v1/partners");
      return (response.data.data as any[]).length;
    },
    enabled: isLoaded,
  });

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <AdminHeader
        breadcrumbs={[{ label: "Dashboard" }]}
        title="Overview Dashboard"
      />
      <div className="p-8 space-y-6 overflow-y-auto flex-1">
          <section className="space-y-1">
            <h1 className="text-xl font-bold text-neutral-950 tracking-tight">
              System Performance & Operations
            </h1>
            <p className="text-xs font-semibold text-neutral-400">
              Real-time monitoring of registered members, merchant
              configurations, and platform exchange frequency.
            </p>
          </section>

          {/* Key Metrics Cards Row (Privacy Compliant) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Metric 1: Members */}
            <div className="bg-white border border-neutral-200/50 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">
                  Total Members
                </span>
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-brand-primary flex items-center justify-center border border-orange-100/30">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-neutral-900 tracking-tight">
                  {memberData ?? 0}
                </p>
              </div>
            </div>
            {/* Metric 2: Active Pilot Merchants */}
            <div className="bg-white border border-neutral-200/50 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">
                  Active Partners
                </span>
                <div className="w-9 h-9 rounded-xl bg-yellow-50 text-[#D89F0E] flex items-center justify-center border border-yellow-100/30">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-neutral-900 tracking-tight">
                  {partnerData ?? 0}{" "}
                  <span className="text-xs text-neutral-400 font-bold">
                    merchants
                  </span>
                </p>
              </div>
            </div>
            {/* Metric 3: Point Exchange Operations */}
            <div className="bg-white border border-neutral-200/50 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">
                  Point Exchanges
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100/30">
                  <RefreshCw className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-neutral-900 tracking-tight">
                  350{" "}
                  <span className="text-xs text-neutral-400 font-bold">
                    exchanges
                  </span>
                </p>
                <span className="text-[10px] text-neutral-400 font-semibold block mt-1">
                  (Demo data)
                </span>
              </div>
            </div>
            {/* Metric 4: Redemptions Count */}
            <div className="bg-white border border-neutral-200/50 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">
                  Redemptions
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/30">
                  <Gift className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-neutral-900 tracking-tight">
                  1,240{" "}
                  <span className="text-xs text-neutral-400 font-bold">
                    claims
                  </span>
                </p>
                <span className="text-[10px] text-neutral-400 font-semibold block mt-1">
                  (Demo data)
                </span>
              </div>
            </div>
          </div>

          {/* Double Column Operational Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Area (2 columns): Partner Merchant Overview */}
            <div className="lg:col-span-2 space-y-6">
              {/* Conversion Statistics Flow Indicator */}
              <div className="bg-white border border-neutral-200/60 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2 flex justify-between items-center">
                  <span>Exchange Transaction Flows Breakdown</span>
                  <span className="text-[9px] text-neutral-400 font-bold lowercase tracking-normal bg-neutral-100 px-1.5 py-0.5 rounded">
                    (demo data)
                  </span>
                </h3>

                <div className="space-y-3.5 text-xs font-semibold text-neutral-600">
                  {/* KFC -> McD */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span>KFC to MCD Point Conversions</span>
                      <span className="font-extrabold text-neutral-800">
                        235 transactions (67%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#C8102E] h-full rounded-full w-[67%]" />
                    </div>
                  </div>

                  {/* McD -> KFC */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span>MCD to KFC Point Conversions</span>
                      <span className="font-extrabold text-neutral-800">
                        115 transactions (33%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#FFC72C] h-full rounded-full w-[33%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
  );
}


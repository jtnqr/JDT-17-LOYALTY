"use client";

import React from "react";
import { AdminSidebar } from "@/components/organisms/AdminSidebar";
import Link from "next/link";
import {
  Users,
  Building2,
  RefreshCw,
  Gift,
  Bell,
  ArrowRight,
  TrendingUp,
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Settings,
} from "lucide-react";

// Privacy-compliant mock audit logs (anonymized system-level logs)
const AUDIT_LOGS = [
  {
    id: "audit-001",
    timestamp: "2026-07-07T14:10:00Z",
    eventType: "MEMBER_REGISTERED",
    payload: "New member account registered (ID: 550e8400...)",
    actor: "System",
  },
  {
    id: "audit-002",
    timestamp: "2026-07-07T13:42:00Z",
    eventType: "POINTS_EXCHANGED",
    payload: "Cross-partner point exchange processed (KFC &rarr; MCD)",
    actor: "System",
  },
  {
    id: "audit-003",
    timestamp: "2026-07-06T18:15:00Z",
    eventType: "REWARD_REDEMPTION",
    payload: "Voucher reward redemption completed (McDonald's program)",
    actor: "System",
  },
  {
    id: "audit-004",
    timestamp: "2026-07-06T10:05:00Z",
    eventType: "PARTNER_CONFIG_UPDATED",
    payload: "Admin modified KFC point expiry days from 180 to 365 days",
    actor: "Admin (Daniel)",
  },
  {
    id: "audit-005",
    timestamp: "2026-07-05T14:20:00Z",
    eventType: "POINTS_EARNED",
    payload: "Transaction points credit processed (McDonald's program)",
    actor: "System",
  },
];

export default function AdminDashboardPage() {
  const getEventBadge = (type: string) => {
    switch (type) {
      case "MEMBER_REGISTERED":
        return "bg-blue-50 text-blue-700 border-blue-200/50";
      case "POINTS_EXCHANGED":
        return "bg-purple-50 text-purple-700 border-purple-200/50";
      case "REWARD_REDEMPTION":
        return "bg-orange-50 text-[#8B3D06] border-orange-200/50";
      case "PARTNER_CONFIG_UPDATED":
        return "bg-neutral-100 text-neutral-700 border-neutral-200/50";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex font-sans">
      {/* Sidebar Navigation */}
      <AdminSidebar activeTab="dashboard" />

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-neutral-200/50 bg-white px-8 flex items-center justify-between sticky top-0 z-30">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
              <span>Admin</span>
              <ChevronRight className="w-3 h-3 text-neutral-300" />
              <span className="text-neutral-600">Dashboard</span>
            </div>
            <h2 className="text-lg font-black text-neutral-900 mt-0.5 leading-none">
              Overview Dashboard
            </h2>
          </div>
        </header>

        {/* Content Body */}
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
                  243
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-600 font-bold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+12% vs last week</span>
                </div>
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
                  2{" "}
                  <span className="text-xs text-neutral-400 font-bold">
                    merchants
                  </span>
                </p>
                <p className="text-[9px] text-neutral-400 mt-1 font-semibold">
                  KFC Colonel's Club & McDonald's
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
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-neutral-400 font-bold">
                  <span>Cross-brand point conversions</span>
                </div>
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
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-600 font-bold">
                  <span>Total merchant voucher claims</span>
                </div>
              </div>
            </div>
          </div>

          {/* Double Column Operational Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Area (2 columns): Partner Merchant Overview */}
            <div className="lg:col-span-2 space-y-6">
              {/* Conversion Statistics Flow Indicator */}
              <div className="bg-white border border-neutral-200/60 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2">
                  Exchange Transaction Flows Breakdown
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
      </main>

      {/* Lucide breadcrumb helper */}
      <div className="hidden">
        <Settings />
        <ArrowDownRight />
        <ArrowUpRight />
      </div>
    </div>
  );
}

// Chevron Right stub
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={3}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 4.5l7.5 7.5-7.5 7.5"
      />
    </svg>
  );
}

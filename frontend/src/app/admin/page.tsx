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

          <div className="flex items-center gap-4">
            <button className="relative text-neutral-600 hover:text-neutral-800 transition-colors p-1.5 hover:bg-neutral-50 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            </button>
            <span className="text-xs font-bold bg-[#FCF5F1] text-[#8B3D06] px-3 py-1 rounded-full border border-[#8B3D06]/10">
              CMS Portal
            </span>
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
              <div className="bg-white border border-neutral-200/60 rounded-2xl p-5 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <h3 className="text-sm font-bold text-neutral-950">
                    Active Pilots Configurations
                  </h3>
                  <Link
                    href="/admin/partners"
                    className="text-xs font-bold text-brand-primary flex items-center gap-0.5 hover:underline"
                  >
                    Manage Partners
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* KFC Config Overview */}
                  <div className="border border-neutral-100 rounded-xl p-4 bg-neutral-50/30 flex flex-col justify-between h-36">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-neutral-800">
                          KFC Colonel's Club
                        </span>
                        <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                          ACTIVE
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-1 font-semibold">
                        Points Rate: 1 pt / Rp 1.000
                      </p>
                      <p className="text-[10px] text-neutral-400 font-semibold">
                        Expiry: 365 Days
                      </p>
                    </div>
                    <div className="border-t border-neutral-100 pt-2.5 flex items-center gap-1.5 text-xs text-neutral-500 font-bold">
                      <RefreshCw className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Exchange: 1 KFC pt &rarr; 0.8 MCD pt</span>
                    </div>
                  </div>

                  {/* McDonald's Config Overview */}
                  <div className="border border-neutral-100 rounded-xl p-4 bg-neutral-50/30 flex flex-col justify-between h-36">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-neutral-800">
                          McDonald's MyRewards
                        </span>
                        <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                          ACTIVE
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-1 font-semibold">
                        Points Rate: 1 pt / Rp 1.000
                      </p>
                      <p className="text-[10px] text-neutral-400 font-semibold">
                        Expiry: 365 Days
                      </p>
                    </div>
                    <div className="border-t border-neutral-100 pt-2.5 flex items-center gap-1.5 text-xs text-neutral-500 font-bold">
                      <RefreshCw className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Exchange: 1 MCD pt &rarr; 0.8 KFC pt</span>
                    </div>
                  </div>
                </div>
              </div>

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

            {/* Right Area (1 column): Recent System Activity log (Audit Trail) */}
            {/* <div className="bg-white border border-neutral-200/60 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col h-[400px]">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#8B3D06]" />
                  <h3 className="text-sm font-bold text-neutral-950">System Audit Trail</h3>
                </div>
                <span className="text-[9px] font-black uppercase text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded">
                  TRX_LOG
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {AUDIT_LOGS.map((log) => {
                  const time = new Date(log.timestamp).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div key={log.id} className="space-y-1 border-b border-neutral-50 pb-3 last:border-0 last:pb-0 text-left">
                      <div className="flex items-center justify-between">
                        <span className="inline-block text-[8px] font-black uppercase px-2 py-0.5 rounded-md border bg-neutral-50 text-neutral-700 border-neutral-200/50">
                          {log.eventType.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-semibold">{time}</span>
                      </div>
                      <p className="text-[11px] text-neutral-600 leading-snug font-medium">
                        {log.payload}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div> */}
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

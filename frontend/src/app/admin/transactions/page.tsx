"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/organisms/AdminSidebar";
import axios from "axios";
import { ChevronRight, ShieldAlert, Search, Clock, Bell } from "lucide-react";
import Link from "next/link";

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

const MOCK_MEMBERS: Member[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "Budi Santoso",
    email: "budi.santoso@example.com",
    phone: "081234567890",
    createdAt: "2026-07-02T10:00:00Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    name: "Jane Doe",
    email: "jane.doe@example.com",
    phone: "081298765432",
    createdAt: "2026-07-03T11:15:00Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "085612345678",
    createdAt: "2026-07-04T09:30:00Z",
  },
];

export default function AdminTransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Member List
  const { data: memberData } = useQuery({
    queryKey: ["admin-tx-members-only"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/v1/members?page=0&size=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data?.data as Member[];
    },
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
    retry: 1,
  });

  const membersList = memberData || MOCK_MEMBERS;

  const filteredMembers = membersList.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-neutral-50 flex font-sans">
      <AdminSidebar activeTab="transactions" />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-neutral-200/50 bg-white px-8 flex items-center justify-between sticky top-0 z-30">
          <div>
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
              <span>Admin</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-neutral-600">Transactions</span>
            </div>
            <h2 className="text-lg font-black text-neutral-900 mt-0.5 leading-none">
              Transaction Directory
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Search Bar in Header */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F1F3F4] text-neutral-700 pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none border border-transparent focus:bg-white focus:border-neutral-200 transition-colors font-medium placeholder:text-neutral-400"
              />
            </div>
            <button className="relative text-neutral-600 hover:text-neutral-800 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-brand-primary" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-8 flex-grow flex flex-col space-y-6">
          {/* Header Description */}
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-neutral-950 tracking-tight">
              Member Directory & Records
            </h1>
            <p className="text-xs font-semibold text-neutral-400 max-w-2xl">
              Verify registered member accounts. Point balances and histories
              are restricted for security.
            </p>
          </div>

          {/* Privacy Alert */}
          <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3.5 text-amber-800 shadow-sm shadow-amber-500/5">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider">
                Privacy Restriction Active
              </p>
              <p className="text-[11px] font-semibold text-amber-700/90 leading-relaxed">
                As an Admin, point balances and transactional ledgers are
                restricted under system security rules (403 Forbidden).
              </p>
            </div>
          </section>

          {/* Table Container */}
          <section className="bg-white border border-neutral-200/60 rounded-2xl shadow-sm overflow-hidden flex-grow flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-neutral-400 w-16">
                      #
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700">
                      Member Name
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700">
                      Email Address
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700">
                      Phone Number
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700">
                      Registered Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member, idx) => (
                    <tr
                      key={member.id}
                      className="border-b border-neutral-100/60 hover:bg-neutral-50/30 transition-colors"
                    >
                      <td className="px-6 py-4.5 text-xs text-neutral-400 font-bold">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4.5 text-xs font-black text-neutral-900">
                        {member.name}
                      </td>
                      <td className="px-6 py-4.5 text-xs font-semibold text-neutral-600">
                        {member.email}
                      </td>
                      <td className="px-6 py-4.5 text-xs font-semibold text-neutral-600">
                        {member.phone}
                      </td>
                      <td className="px-6 py-4.5 text-xs font-semibold text-neutral-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span>
                            {new Date(member.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-12 text-xs font-semibold text-neutral-400"
                      >
                        No members found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

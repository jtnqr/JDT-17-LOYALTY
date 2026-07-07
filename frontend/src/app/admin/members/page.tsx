"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/organisms/AdminSidebar";
import axios from "axios";
import {
  Search,
  Plus,
  Download,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Mock Fallback Data matching docs/seed-data.sql and spec requirements
const MOCK_MEMBERS = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "Budi Santoso",
    email: "budi.santoso@example.com",
    phone: "081234567890",
    status: "ACTIVE",
    createdAt: "2026-07-02T10:00:00Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    name: "Jane Doe",
    email: "jane.doe@example.com",
    phone: "081298765432",
    status: "ACTIVE",
    createdAt: "2026-07-03T11:15:00Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "085612345678",
    status: "INACTIVE",
    createdAt: "2026-07-04T09:30:00Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    name: "Alice Cooper",
    email: "alice.c@example.com",
    phone: "081388882222",
    status: "ACTIVE",
    createdAt: "2026-07-05T16:45:00Z",
  },
];

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: string;
}

export default function AdminMembersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(0);

  // Fetch Member List via React Query
  const {
    data: memberData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-members", statusFilter, currentPage],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const statusParam =
        statusFilter !== "ALL" ? `&status=${statusFilter}` : "";
      const response = await axios.get(
        `/api/v1/members?page=${currentPage}&size=10${statusParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    enabled: !!localStorage.getItem("token"),
    retry: 1,
  });

  const rawMembers = (memberData?.data as Member[]) || MOCK_MEMBERS;

  // Client-side search filtering (useful when API is offline / mock fallback)
  const filteredMembers = rawMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery);

    const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
      case "INACTIVE":
        return "bg-neutral-100 text-neutral-500 border-neutral-200/30";
      case "SUSPENDED":
        return "bg-red-50 text-red-700 border-red-200/50";
      default:
        return "bg-neutral-100 text-neutral-500";
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex font-sans">
      {/* Reusable Sidebar matching public/sidebar-desktop.png */}
      <AdminSidebar activeTab="members" />

      {/* Main CMS Content Container */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-neutral-200/50 bg-white px-8 flex items-center justify-between sticky top-0 z-30">
          <div>
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
              <span>Admin</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-neutral-600">Members</span>
            </div>
            <h2 className="text-lg font-black text-neutral-900 mt-0.5 leading-none">
              Members Directory
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-bold bg-[#FCF5F1] text-[#8B3D06] px-3 py-1 rounded-full border border-[#8B3D06]/10">
              CMS Portal
            </span>
            <Link
              href="/login"
              className="text-xs font-semibold text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              Sign Out
            </Link>
          </div>
        </header>

        {/* Inner Content Area */}
        <div className="p-8 flex-grow flex flex-col space-y-6">
          {/* Toolbar Control Row */}
          <section className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            {/* Left: Search & Filter Inputs */}
            <div className="flex flex-1 max-w-xl gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white text-sm text-neutral-800 pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 outline-none focus:border-[#8B3D06] transition-colors placeholder:text-neutral-400 font-medium"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white text-sm text-neutral-800 pl-10 pr-8 py-2.5 rounded-xl border border-neutral-200 outline-none focus:border-[#8B3D06] transition-colors appearance-none font-bold cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-neutral-400" />
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-3">
              {/* <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer shadow-sm active:translate-y-px transition-all">
                <Download className="w-4 h-4" />
                Export CSV
              </button> */}
              <button className="flex items-center gap-2 px-4 py-2.5 bg-[#8B3D06] hover:bg-[#723204] text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-[#8B3D06]/10 active:translate-y-px transition-all">
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            </div>
          </section>

          {/* Members Table */}
          <section className="bg-white border border-neutral-200/60 rounded-2xl shadow-sm overflow-hidden flex-grow flex flex-col justify-between">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-400 w-16">
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
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-32">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-28 text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {isLoading && filteredMembers.length === 0 ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-6 py-4.5">
                          <div className="h-4 bg-neutral-200 rounded w-8" />
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="h-4 bg-neutral-200 rounded w-32" />
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="h-4 bg-neutral-200 rounded w-48" />
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="h-4 bg-neutral-200 rounded w-24" />
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="h-4 bg-neutral-200 rounded w-20" />
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="h-6 bg-neutral-200 rounded w-20" />
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="h-6 bg-neutral-200 rounded w-16 mx-auto" />
                        </td>
                      </tr>
                    ))
                  ) : filteredMembers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-neutral-400"
                      >
                        <p className="text-sm font-semibold">
                          No members found matching your search.
                        </p>
                        <p className="text-xs mt-1">
                          Try refining your keyword or filter options.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member, index) => {
                      const registeredDate = new Date(
                        member.createdAt
                      ).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                      return (
                        <tr
                          key={member.id}
                          className="hover:bg-neutral-50/30 transition-colors"
                        >
                          <td className="px-6 py-4.5 text-xs text-neutral-400 font-bold">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4.5">
                            <span className="text-sm font-extrabold text-[#8B3D06] hover:underline cursor-pointer">
                              {member.name}
                            </span>
                          </td>
                          <td className="px-6 py-4.5 text-sm font-medium text-neutral-600">
                            {member.email}
                          </td>
                          <td className="px-6 py-4.5 text-sm font-medium text-neutral-600">
                            {member.phone}
                          </td>
                          <td className="px-6 py-4.5 text-xs font-semibold text-neutral-400">
                            {registeredDate}
                          </td>
                          <td className="px-6 py-4.5">
                            <span
                              className={cn(
                                "inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full border",
                                getStatusBadgeClass(member.status)
                              )}
                            >
                              {member.status}
                            </span>
                          </td>
                          <td className="px-6 py-4.5">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
                                title="View details"
                              >
                                <Eye className="w-4.5 h-4.5" />
                              </button>
                              <button
                                className="p-1.5 text-neutral-400 hover:text-[#8B3D06] hover:bg-[#FCF5F1] rounded-lg cursor-pointer transition-colors"
                                title="Edit member"
                              >
                                <Pencil className="w-4.5 h-4.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="border-t border-neutral-100 px-6 py-4 flex items-center justify-between bg-neutral-50/20 text-xs font-bold text-neutral-500">
              <span>
                Showing 1–{filteredMembers.length} of {filteredMembers.length}{" "}
                members
              </span>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-2 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="px-3.5 py-2 border border-neutral-200 rounded-lg bg-white font-black text-[#8B3D06]">
                  1
                </button>
                <button
                  disabled
                  className="p-2 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

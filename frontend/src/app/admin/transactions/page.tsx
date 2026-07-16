"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/organisms/AdminSidebar";
import { AdminHeader } from "@/components/organisms/AdminHeader";
import { useAdmin } from "@/lib/hooks/useAdmin";
import apiClient from "@/lib/apiClient";
import { ChevronRight, ChevronLeft, ShieldAlert, Clock, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

import { Member } from "@/types";

export default function AdminTransactionsPage() {
  const { isLoaded } = useAdmin();
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Fetch Member List
  const { data: memberData } = useQuery({
    queryKey: ["admin-tx-members-only", currentPage, searchQuery],
    queryFn: async () => {
      const execPage = searchQuery ? 0 : currentPage;
      const execSize = searchQuery ? 100 : 10;
      const response = await apiClient.get(
        `/api/v1/members?page=${execPage}&size=${execSize}`
      );
      return response.data;
    },
    enabled: isLoaded,
    retry: 1,
  });

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const rawMembers = (memberData?.data as Member[]) || [];
  const totalElements = (memberData?.total as number) || 0;
  const pageSize = searchQuery ? 100 : ((memberData?.size as number) || 10);
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));

  const filteredMembers = rawMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery)
  ).sort((a, b) => {
    let aVal: any = a[sortField as keyof Member] || "";
    let bVal: any = b[sortField as keyof Member] || "";

    if (sortField === "createdAt") {
      aVal = new Date(a.createdAt).getTime();
      bVal = new Date(b.createdAt).getTime();
    } else {
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <>
      {/* Top Header Bar */}
      <AdminHeader
        breadcrumbs={[{ label: "Transactions" }]}
        title="Transaction Directory"
        showSearch={true}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchPlaceholder="Search members..."
      />

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

          {/* Active Filter Chips */}
          {(searchQuery || sortField) && (
            <div className="flex flex-wrap items-center gap-2 select-none">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Active Filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FCF5F1] border border-[#8B3D06]/20 text-[#8B3D06] rounded-full text-xs font-bold animate-in fade-in duration-200">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery("")} className="hover:text-red-600 font-extrabold cursor-pointer ml-0.5">×</button>
                </span>
              )}
              {sortField && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FCF5F1] border border-[#8B3D06]/20 text-[#8B3D06] rounded-full text-xs font-bold animate-in fade-in duration-200">
                  Sort: {sortField === "name" ? "Member Name" : sortField === "email" ? "Email Address" : sortField === "phone" ? "Phone Number" : "Registered Date"} ({sortOrder === "asc" ? "Asc" : "Desc"})
                  <button onClick={() => { setSortField("name"); setSortOrder("asc"); }} className="hover:text-red-600 font-extrabold cursor-pointer ml-0.5">×</button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSortField("name");
                  setSortOrder("asc");
                }}
                className="text-xs font-bold text-[#8B3D06] hover:underline cursor-pointer ml-2"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Table Container */}
          <section className="bg-white border border-neutral-200/60 rounded-2xl shadow-sm overflow-hidden flex-grow flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50 select-none">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-neutral-400 w-16">
                      #
                    </th>
                    <th
                      onClick={() => {
                        if (sortField === "name") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortField("name");
                          setSortOrder("asc");
                        }
                      }}
                      className={cn(
                        "px-6 py-4 text-xs uppercase tracking-wider text-neutral-700 cursor-pointer hover:bg-neutral-100/50 transition-colors",
                        sortField === "name" ? "font-black text-[#8B3D06]" : "font-bold text-neutral-700"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        Member Name
                        <ArrowUpDown className={cn("w-3.5 h-3.5", sortField === "name" ? "text-[#8B3D06]" : "text-neutral-400")} />
                      </div>
                    </th>
                    <th
                      onClick={() => {
                        if (sortField === "email") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortField("email");
                          setSortOrder("asc");
                        }
                      }}
                      className={cn(
                        "px-6 py-4 text-xs uppercase tracking-wider text-neutral-700 cursor-pointer hover:bg-neutral-100/50 transition-colors",
                        sortField === "email" ? "font-black text-[#8B3D06]" : "font-bold text-neutral-700"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        Email Address
                        <ArrowUpDown className={cn("w-3.5 h-3.5", sortField === "email" ? "text-[#8B3D06]" : "text-neutral-400")} />
                      </div>
                    </th>
                    <th
                      onClick={() => {
                        if (sortField === "phone") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortField("phone");
                          setSortOrder("asc");
                        }
                      }}
                      className={cn(
                        "px-6 py-4 text-xs uppercase tracking-wider text-neutral-700 cursor-pointer hover:bg-neutral-100/50 transition-colors",
                        sortField === "phone" ? "font-black text-[#8B3D06]" : "font-bold text-neutral-700"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        Phone Number
                        <ArrowUpDown className={cn("w-3.5 h-3.5", sortField === "phone" ? "text-[#8B3D06]" : "text-neutral-400")} />
                      </div>
                    </th>
                    <th
                      onClick={() => {
                        if (sortField === "createdAt") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortField("createdAt");
                          setSortOrder("asc");
                        }
                      }}
                      className={cn(
                        "px-6 py-4 text-xs uppercase tracking-wider text-neutral-700 cursor-pointer hover:bg-neutral-100/50 transition-colors",
                        sortField === "createdAt" ? "font-black text-[#8B3D06]" : "font-bold text-neutral-700"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        Registered Date
                        <ArrowUpDown className={cn("w-3.5 h-3.5", sortField === "createdAt" ? "text-[#8B3D06]" : "text-neutral-400")} />
                      </div>
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
                        {currentPage * pageSize + idx + 1}
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

            {/* Pagination Controls Footer */}
            <div className="border-t border-neutral-100 px-6 py-4 flex items-center justify-between bg-neutral-50/20 text-xs font-bold text-neutral-500 select-none">
              <span>
                {totalElements === 0
                  ? "No members found"
                  : searchQuery
                  ? `Showing ${filteredMembers.length} of ${totalElements} members (filtered)`
                  : `Showing ${currentPage * pageSize + 1}–${Math.min(
                      (currentPage + 1) * pageSize,
                      totalElements
                    )} of ${totalElements} members`}
              </span>

              {!searchQuery && (
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="p-2 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (currentPage < 3) {
                      pageNum = i;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "px-3.5 py-2 border border-neutral-200 rounded-lg transition-colors cursor-pointer",
                          currentPage === pageNum
                            ? "bg-[#8B3D06] text-white border-[#8B3D06]"
                            : "bg-white hover:bg-neutral-50 text-neutral-600"
                        )}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                  <button
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="p-2 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/organisms/AdminSidebar";
import { AdminHeader } from "@/components/organisms/AdminHeader";
import { useAdmin } from "@/lib/hooks/useAdmin";
import apiClient from "@/lib/apiClient";
import {
  Search,
  Plus,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormField } from "@/components/molecules/FormField";
import { Member } from "@/types";

const editMemberSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Invalid email address format"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[0-9]+$/, "Phone number must contain only numbers")
    .min(8, "Phone number must be at least 8 digits"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type EditMemberSchemaType = z.infer<typeof editMemberSchema>;

const addMemberSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Invalid email address format"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[0-9]+$/, "Phone number must contain only numbers")
    .min(8, "Phone number must be at least 8 digits"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

type AddMemberSchemaType = z.infer<typeof addMemberSchema>;

export default function AdminMembersPage() {
  const { isLoaded } = useAdmin();

  const POLLING_INTERVAL =
    Number(process.env.NEXT_PUBLIC_REFETCH_INTERVAL) || 5000;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Edit Form Hook
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setError: setErrorEdit,
    formState: { errors: errorsEdit, isSubmitting: isSubmittingEdit },
  } = useForm<EditMemberSchemaType>({
    resolver: zodResolver(editMemberSchema),
  });

  // Add Form Hook
  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    setError: setErrorAdd,
    formState: { errors: errorsAdd, isSubmitting: isSubmittingAdd },
  } = useForm<AddMemberSchemaType>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  useEffect(() => {
    if (selectedMember) {
      resetEdit({
        name: selectedMember.name,
        email: selectedMember.email,
        phone: selectedMember.phone,
        status: selectedMember.status || "ACTIVE",
      });
    }
  }, [selectedMember, resetEdit]);

  const onSubmitEdit = async (data: EditMemberSchemaType) => {
    if (!selectedMember) return;
    try {
      await apiClient.put(
        `/api/v1/members/${selectedMember.id}`,
        {
          name: data.name,
          email: data.email,
          phone: data.phone,
          status: data.status,
        }
      );

      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      setIsEditOpen(false);
    } catch (error: any) {
      console.error("Failed to update member config:", error);
      const responseData = error.response?.data;
      const errorCode = responseData?.code;
      const errorMessage = responseData?.message;

      if (errorCode === "DUPLICATE_EMAIL") {
        setErrorEdit("email", {
          type: "manual",
          message: "Email is already registered.",
        });
      } else if (errorCode === "DUPLICATE_PHONE") {
        setErrorEdit("phone", {
          type: "manual",
          message: "Phone number is already registered.",
        });
      } else if (errorMessage) {
        setErrorEdit("root", {
          type: "manual",
          message: errorMessage,
        });
      } else {
        setErrorEdit("root", {
          type: "manual",
          message: "Failed to update member. Please try again.",
        });
      }
    }
  };

  const onSubmitAdd = async (data: AddMemberSchemaType) => {
    // Normalize phone number to start with '0' as per API spec example (e.g. 081234567890)
    let formattedPhone = data.phone;
    if (!formattedPhone.startsWith("0")) {
      if (formattedPhone.startsWith("62")) {
        formattedPhone = "0" + formattedPhone.slice(2);
      } else {
        formattedPhone = "0" + formattedPhone;
      }
    }

    try {
      await apiClient.post("/api/v1/auth/register", {
        name: data.name,
        email: data.email,
        phone: formattedPhone,
        password: data.password,
      });

      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      resetAdd();
      setIsAddOpen(false);
    } catch (error: any) {
      console.error("Failed to add member:", error);
      const responseData = error.response?.data;
      const errorCode = responseData?.code;
      const errorMessage = responseData?.message;

      if (errorCode === "DUPLICATE_EMAIL") {
        setErrorAdd("email", {
          type: "manual",
          message: "Email is already registered.",
        });
      } else if (errorCode === "DUPLICATE_PHONE") {
        setErrorAdd("phone", {
          type: "manual",
          message: "Phone number is already registered.",
        });
      } else if (errorMessage) {
        setErrorAdd("root", {
          type: "manual",
          message: errorMessage,
        });
      } else {
        setErrorAdd("root", {
          type: "manual",
          message: "Failed to add member. Please try again.",
        });
      }
    }
  };

  // Fetch Member List via React Query
  const {
    data: memberData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-members", statusFilter, currentPage, searchQuery],
    queryFn: async () => {
      const execPage = searchQuery ? 0 : currentPage;
      const execSize = searchQuery ? 100 : 10;
      const statusParam =
        statusFilter !== "ALL" ? `&status=${statusFilter}` : "";
      const response = await apiClient.get(
        `/api/v1/members?page=${execPage}&size=${execSize}${statusParam}`
      );
      return response.data;
    },
    enabled: isLoaded,
    retry: 1,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
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

  // Client-side search filtering
  const filteredMembers = rawMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery);

    const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;

    let matchesDate = true;
    if (startDateFilter || endDateFilter) {
      const regDate = new Date(m.createdAt);
      regDate.setHours(0, 0, 0, 0);

      if (startDateFilter) {
        const start = new Date(startDateFilter);
        start.setHours(0, 0, 0, 0);
        if (regDate < start) matchesDate = false;
      }
      if (endDateFilter) {
        const end = new Date(endDateFilter);
        end.setHours(0, 0, 0, 0);
        if (regDate > end) matchesDate = false;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  }).sort((a, b) => {
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
      case "INACTIVE":
        return "bg-neutral-100 text-neutral-500 border-neutral-200/30";
      default:
        return "bg-neutral-100 text-neutral-500";
    }
  };

  return (
    <>
      {/* Top Header Bar */}
      <AdminHeader
        breadcrumbs={[{ label: "Members" }]}
        title="Members Directory"
      />

      {/* Inner Content Area */}
      <div className="p-8 flex-grow flex flex-col space-y-6">
            {/* Toolbar Control Row */}
            <section className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              {/* Left: Filter Inputs */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Status Filter */}
                <div className="relative">
                  <Filter className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors", statusFilter !== "ALL" ? "text-[#8B3D06]" : "text-neutral-400")} />
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(0);
                    }}
                    className={cn(
                      "text-sm pl-10 pr-8 py-2.5 rounded-xl border outline-none transition-colors appearance-none font-bold cursor-pointer",
                      statusFilter !== "ALL"
                        ? "bg-[#FCF5F1] text-[#8B3D06] border-[#8B3D06]"
                        : "bg-white text-neutral-800 border-neutral-200 focus:border-[#8B3D06]"
                    )}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                  <div className={cn("absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px]", statusFilter !== "ALL" ? "border-t-[#8B3D06]" : "border-t-neutral-400")} />
                </div>

                {/* Date Registration Range Filter */}
                <div className={cn("flex items-center gap-1.5 border rounded-xl px-3 py-2.5 transition-colors", startDateFilter || endDateFilter ? "bg-[#FCF5F1] border-[#8B3D06]" : "bg-white border-neutral-200")}>
                  <span className={cn("text-sm font-bold transition-colors", startDateFilter || endDateFilter ? "text-[#8B3D06]" : "text-neutral-800")}>Registered:</span>
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => {
                      setStartDateFilter(e.target.value);
                      setCurrentPage(0);
                    }}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    className={cn("text-xs font-bold bg-transparent outline-none cursor-pointer transition-colors", startDateFilter || endDateFilter ? "text-[#8B3D06]" : "text-neutral-700")}
                  />
                  <span className={cn("text-xs transition-colors", startDateFilter || endDateFilter ? "text-[#8B3D06]" : "text-neutral-300")}>-</span>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => {
                      setEndDateFilter(e.target.value);
                      setCurrentPage(0);
                    }}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    className={cn("text-xs font-bold bg-transparent outline-none cursor-pointer transition-colors", startDateFilter || endDateFilter ? "text-[#8B3D06]" : "text-neutral-700")}
                  />
                </div>

                {/* Search Input */}
                <div className="relative w-64">
                  <Search className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors", searchQuery ? "text-[#8B3D06]" : "text-neutral-400")} />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(0);
                    }}
                    className={cn(
                      "w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border outline-none focus:border-[#8B3D06] transition-colors font-bold placeholder:text-neutral-400",
                      searchQuery
                        ? "bg-[#FCF5F1] text-[#8B3D06] border-[#8B3D06]"
                        : "bg-white text-neutral-800 border-neutral-200"
                    )}
                  />
                </div>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#8B3D06] hover:bg-[#723204] text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-[#8B3D06]/10 active:translate-y-px transition-all"
                >
                  <Plus className="w-4.5 h-4.5" />
                  Add Member
                </button>
              </div>
            </section>

            {/* Active Filter Chips */}
            {(statusFilter !== "ALL" || startDateFilter || endDateFilter || searchQuery || sortField) && (
              <div className="flex flex-wrap items-center gap-2 select-none">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Active Filters:</span>
                {statusFilter !== "ALL" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FCF5F1] border border-[#8B3D06]/20 text-[#8B3D06] rounded-full text-xs font-bold animate-in fade-in duration-200">
                    Status: {statusFilter === "ACTIVE" ? "Active" : "Inactive"}
                    <button onClick={() => setStatusFilter("ALL")} className="hover:text-red-600 font-extrabold cursor-pointer ml-0.5">×</button>
                  </span>
                )}
                {(startDateFilter || endDateFilter) && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FCF5F1] border border-[#8B3D06]/20 text-[#8B3D06] rounded-full text-xs font-bold animate-in fade-in duration-200">
                    Registered: {startDateFilter || "Any"} to {endDateFilter || "Any"}
                    <button onClick={() => { setStartDateFilter(""); setEndDateFilter(""); }} className="hover:text-red-600 font-extrabold cursor-pointer ml-0.5">×</button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FCF5F1] border border-[#8B3D06]/20 text-[#8B3D06] rounded-full text-xs font-bold animate-in fade-in duration-200">
                    Search: "{searchQuery}"
                    <button onClick={() => setSearchQuery("")} className="hover:text-red-600 font-extrabold cursor-pointer ml-0.5">×</button>
                  </span>
                )}
                {sortField && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FCF5F1] border border-[#8B3D06]/20 text-[#8B3D06] rounded-full text-xs font-bold animate-in fade-in duration-200">
                    Sort: {sortField === "name" ? "Member Name" : sortField === "email" ? "Email Address" : sortField === "phone" ? "Phone Number" : sortField === "createdAt" ? "Registered Date" : "Status"} ({sortOrder === "asc" ? "Asc" : "Desc"})
                    <button onClick={() => { setSortField("name"); setSortOrder("asc"); }} className="hover:text-red-600 font-extrabold cursor-pointer ml-0.5">×</button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setStatusFilter("ALL");
                    setStartDateFilter("");
                    setEndDateFilter("");
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

            {/* Members Table */}
            <section className="bg-white border border-neutral-200/60 rounded-2xl shadow-sm overflow-hidden flex-grow flex flex-col justify-between">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50/50 select-none">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-400 w-16">
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
                          "px-6 py-4 text-xs uppercase tracking-wider cursor-pointer hover:bg-neutral-100/50 transition-colors",
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
                          "px-6 py-4 text-xs uppercase tracking-wider cursor-pointer hover:bg-neutral-100/50 transition-colors",
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
                          "px-6 py-4 text-xs uppercase tracking-wider cursor-pointer hover:bg-neutral-100/50 transition-colors",
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
                          "px-6 py-4 text-xs uppercase tracking-wider cursor-pointer hover:bg-neutral-100/50 transition-colors",
                          sortField === "createdAt" ? "font-black text-[#8B3D06]" : "font-bold text-neutral-700"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          Registered Date
                          <ArrowUpDown className={cn("w-3.5 h-3.5", sortField === "createdAt" ? "text-[#8B3D06]" : "text-neutral-400")} />
                        </div>
                      </th>
                      <th
                        onClick={() => {
                          if (sortField === "status") {
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          } else {
                            setSortField("status");
                            setSortOrder("asc");
                          }
                        }}
                        className={cn(
                          "px-6 py-4 text-xs uppercase tracking-wider w-32 cursor-pointer hover:bg-neutral-100/50 transition-colors",
                          sortField === "status" ? "font-black text-[#8B3D06]" : "font-bold text-neutral-700"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          Status
                          <ArrowUpDown className={cn("w-3.5 h-3.5", sortField === "status" ? "text-[#8B3D06]" : "text-neutral-400")} />
                        </div>
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
                              {currentPage * pageSize + index + 1}
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
                            <td className={cn(
                              "px-6 py-4.5 text-xs transition-colors",
                              (startDateFilter || endDateFilter) ? "font-extrabold text-[#8B3D06]" : "font-semibold text-neutral-400"
                            )}>
                              {registeredDate}
                            </td>
                            <td className="px-6 py-4.5">
                              <span
                                className={cn(
                                  "inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full border transition-all",
                                  getStatusBadgeClass(member.status || "ACTIVE"),
                                  statusFilter !== "ALL" ? "ring-2 ring-[#8B3D06] scale-105" : ""
                                )}
                              >
                                {member.status || "ACTIVE"}
                              </span>
                            </td>
                            <td className="px-6 py-4.5">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setIsEditOpen(true);
                                  }}
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
                  {totalElements === 0
                    ? "No members found"
                    : (searchQuery || statusFilter !== "ALL" || startDateFilter || endDateFilter)
                    ? `Showing ${filteredMembers.length} of ${totalElements} members (filtered)`
                    : `Showing ${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, totalElements)} of ${totalElements} members`}
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

      {/* Edit Member Modal */}
      {isEditOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsEditOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl border border-neutral-100 overflow-hidden z-50 flex flex-col transform scale-100 opacity-100 transition-all duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div>
                <h3 className="text-base font-black text-neutral-900 leading-none">
                  Edit Member
                </h3>
                <p className="text-xs text-neutral-400 font-medium mt-1">
                  Update member profile and system status
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1.5 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmitEdit(onSubmitEdit)}
              className="p-6 space-y-4"
            >
              {errorsEdit.root?.message && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorsEdit.root.message}</span>
                </div>
              )}

              <FormField
                label="Full Name"
                type="text"
                placeholder="Budi Santoso"
                disabled={isSubmittingEdit}
                error={errorsEdit.name?.message}
                {...registerEdit("name")}
              />

              <FormField
                label="Email Address"
                type="email"
                placeholder="budi.santoso@example.com"
                disabled={isSubmittingEdit}
                error={errorsEdit.email?.message}
                {...registerEdit("email")}
              />

              <FormField
                label="Phone Number"
                type="text"
                placeholder="081234567890"
                disabled={isSubmittingEdit}
                error={errorsEdit.phone?.message}
                {...registerEdit("phone")}
              />

              <div className="flex flex-col w-full">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Member Status
                </label>
                <div className="relative">
                  <select
                    className={cn(
                      "w-full px-4 py-3 text-[15px] font-medium text-neutral-900 bg-neutral-50/50 border border-neutral-200 outline-none rounded-[10px] appearance-none focus:border-[#8B3D06] focus:ring-1 focus:ring-[#8B3D06] cursor-pointer",
                      errorsEdit.status
                        ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        : ""
                    )}
                    disabled={isSubmittingEdit}
                    {...registerEdit("status")}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-neutral-400" />
                </div>
                {errorsEdit.status && (
                  <span className="text-xs text-red-500 mt-1.5 font-medium">
                    {errorsEdit.status.message}
                  </span>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 mt-5">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isSubmittingEdit}
                  className="px-4 py-2.5 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#8B3D06] hover:bg-[#723204] text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-[#8B3D06]/10 active:translate-y-px transition-all disabled:opacity-50"
                >
                  {isSubmittingEdit ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsAddOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl border border-neutral-100 overflow-hidden z-50 flex flex-col transform scale-100 opacity-100 transition-all duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div>
                <h3 className="text-base font-black text-neutral-900 leading-none">
                  Add Member
                </h3>
                <p className="text-xs text-neutral-400 font-medium mt-1">
                  Create a new member profile
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1.5 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmitAdd(onSubmitAdd)}
              className="p-6 space-y-4"
            >
              {errorsAdd.root?.message && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorsAdd.root.message}</span>
                </div>
              )}

              <FormField
                label="Full Name"
                type="text"
                placeholder="Budi Santoso"
                disabled={isSubmittingAdd}
                error={errorsAdd.name?.message}
                {...registerAdd("name")}
              />

              <FormField
                label="Email Address"
                type="email"
                placeholder="budi.santoso@example.com"
                disabled={isSubmittingAdd}
                error={errorsAdd.email?.message}
                {...registerAdd("email")}
              />

              <FormField
                label="Phone Number"
                type="text"
                placeholder="081234567890"
                disabled={isSubmittingAdd}
                error={errorsAdd.phone?.message}
                {...registerAdd("phone")}
              />

              <FormField
                label="Password"
                type="password"
                placeholder="••••••"
                disabled={isSubmittingAdd}
                error={errorsAdd.password?.message}
                {...registerAdd("password")}
              />

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 mt-5">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  disabled={isSubmittingAdd}
                  className="px-4 py-2.5 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#8B3D06] hover:bg-[#723204] text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-[#8B3D06]/10 active:translate-y-px transition-all disabled:opacity-50"
                >
                  {isSubmittingAdd ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Add Member"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/organisms/AdminSidebar";
import { AdminHeader } from "@/components/organisms/AdminHeader";
import { useAdmin } from "@/lib/hooks/useAdmin";
import apiClient from "@/lib/apiClient";
import {
  Search,
  Pencil,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Coins,
  Building2,
  Gift,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Reward {
  id: string;
  name: string;
  pointCost: number;
  status: string;
  imageUrl: string;
  partnerCode: string;
  partnerId: string;
}

export default function AdminRewardsPage() {
  const { isLoaded } = useAdmin();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  // Edit Form State
  const [formName, setFormName] = useState("");
  const [formPointCost, setFormPointCost] = useState<number>(0);
  const [formStatus, setFormStatus] = useState<string>("ACTIVE");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Create Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPointCost, setCreatePointCost] = useState<number>(0);
  const [createPartnerId, setCreatePartnerId] = useState("");
  const [createImageUrl, setCreateImageUrl] = useState("");
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createImageError, setCreateImageError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createApiError, setCreateApiError] = useState<string | null>(null);

  // Fetch partners for select field in creation
  const { data: partnersData } = useQuery({
    queryKey: ["admin-rewards-partners"],
    queryFn: async () => {
      const response = await apiClient.get("/api/v1/partners");
      return (response.data.data || response.data || []) as any[];
    },
    enabled: isLoaded,
  });

  const selectedPartnerText = partnerFilter === 'ALL'
  ? 'All Partners'
  : (partnersData?.find((p: any) => String(p.id) === String(partnerFilter))?.name || 'All Partners');

  // Fetch rewards list
  const {
    data: rewardsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-rewards"],
    queryFn: async () => {
      const response = await apiClient.get("/api/v1/rewards");
      return (response.data.data || response.data || []) as Reward[];
    },
    enabled: isLoaded,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingReward) return;

    setUploadingImage(true);
    setImageError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiClient.put(
        `/api/v1/rewards/${editingReward.id}/image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (editingReward) {
        setEditingReward({
          ...editingReward,
          imageUrl: response.data.imageUrl,
        });
      }
      refetch();
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    } catch (err: any) {
      console.error("Image upload failed:", err);
      setImageError(err.response?.data?.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateApiError(null);
    setCreateImageError(null);

    const payload = {
      name: createName,
      pointCost: createPointCost,
      partnerId: createPartnerId,
      imageUrl: createImageUrl,
    };

    try {
      const response = await apiClient.post("/api/v1/rewards", payload);

      const newRewardId = response.data.id;

      if (createImageFile && newRewardId) {
        const formData = new FormData();
        formData.append("image", createImageFile);
        await apiClient.put(`/api/v1/rewards/${newRewardId}/image`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      setCreateSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setCreateSuccess(false);
        setCreateName("");
        setCreatePointCost(0);
        setCreatePartnerId("");
        setCreateImageUrl("");
        setCreateImageFile(null);
        setCreateImageError(null);
        refetch();
      }, 1000);
    } catch (error: any) {
      console.error("Failed to create reward:", error);
      setCreateApiError(
        error.response?.data?.message || "Failed to create reward."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReward) return;
    setIsSaving(true);
    setApiError(null);

    const payload = {
      name: formName,
      pointCost: formPointCost,
      status: formStatus,
      imageUrl: formImageUrl,
    };

    try {
      await apiClient.put(`/api/v1/rewards/${editingReward.id}`, payload);
      setSaveSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      setTimeout(() => {
        setEditingReward(null);
        setSaveSuccess(false);
        refetch();
      }, 1000);
    } catch (error: any) {
      setApiError(error.response?.data?.message || "Failed to update reward.");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (reward: Reward) => {
    setEditingReward(reward);
    setFormName(reward.name);
    setFormPointCost(reward.pointCost);
    setFormStatus(reward.status);
    setFormImageUrl(reward.imageUrl || "");
    setSaveSuccess(false);
    setApiError(null);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const rewards = rewardsData || [];
  const filteredRewards = rewards.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.partnerCode?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPartner =
      partnerFilter === "ALL" || r.partnerId === partnerFilter;
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesPartner && matchesStatus;
  }).sort((a, b) => {
    let aVal: any = a[sortField as keyof Reward] || "";
    let bVal: any = b[sortField as keyof Reward] || "";

    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <>
      <AdminHeader
        breadcrumbs={[{ label: "Rewards" }]}
        title="Reward Catalog"
      />

      <div className="p-8 flex-grow flex flex-col space-y-6">
          <section className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Status Filter */}
              <div className="relative">
                <Filter className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors", statusFilter !== "ALL" ? "text-[#8B3D06]" : "text-neutral-400")} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
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

              {/* Partner Filter */}
              <div className={cn(
                "relative bg-white border rounded-xl focus-within:border-[#8B3D06] transition-colors",
                partnerFilter !== "ALL" ? "bg-[#FCF5F1] border-[#8B3D06]" : "bg-white border-neutral-200"
              )}>
                <Filter className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors", partnerFilter !== "ALL" ? "text-[#8B3D06]" : "text-neutral-400")} />
                
                {/* Invisible native select handling clicks and value */}
                <select
                  value={partnerFilter}
                  onChange={(e) => setPartnerFilter(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                >
                  <option value="ALL">All Partners</option>
                  {partnersData?.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                {/* Visible text layer driving the dynamic container width */}
                <div className={cn(
                  "text-sm pl-10 pr-8 py-2.5 font-bold whitespace-nowrap select-none",
                  partnerFilter !== "ALL" ? "text-[#8B3D06]" : "text-neutral-800"
                )}>
                  {selectedPartnerText}
                </div>

                <div className={cn("absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px]", partnerFilter !== "ALL" ? "border-t-[#8B3D06]" : "border-t-neutral-400")} />
              </div>

              {/* Search Input */}
              <div className="relative w-64">
                <Search className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors", searchQuery ? "text-[#8B3D06]" : "text-neutral-400")} />
                <input
                  type="text"
                  placeholder="Search rewards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border outline-none focus:border-[#8B3D06] transition-colors font-bold placeholder:text-neutral-400",
                    searchQuery
                      ? "bg-[#FCF5F1] text-[#8B3D06] border-[#8B3D06]"
                      : "bg-white text-neutral-800 border-neutral-200"
                  )}
                />
              </div>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#8B3D06] hover:bg-[#723204] text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-[#8B3D06]/10 active:translate-y-px transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              Create Reward
            </button>
          </section>

          {/* Active Filter Chips */}
          {(statusFilter !== "ALL" || partnerFilter !== "ALL" || searchQuery || sortField) && (
            <div className="flex flex-wrap items-center gap-2 select-none">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Active Filters:</span>
              {statusFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FCF5F1] border border-[#8B3D06]/20 text-[#8B3D06] rounded-full text-xs font-bold animate-in fade-in duration-200">
                  Status: {statusFilter === "ACTIVE" ? "Active" : "Inactive"}
                  <button onClick={() => setStatusFilter("ALL")} className="hover:text-red-600 font-extrabold cursor-pointer ml-0.5">×</button>
                </span>
              )}
              {partnerFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FCF5F1] border border-[#8B3D06]/20 text-[#8B3D06] rounded-full text-xs font-bold animate-in fade-in duration-200">
                  Partner: {selectedPartnerText}
                  <button onClick={() => setPartnerFilter("ALL")} className="hover:text-red-600 font-extrabold cursor-pointer ml-0.5">×</button>
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
                  Sort: {sortField === "name" ? "Reward Name" : sortField === "partnerCode" ? "Partner" : sortField === "pointCost" ? "Points Cost" : "Status"} ({sortOrder === "asc" ? "Asc" : "Desc"})
                  <button onClick={() => { setSortField("name"); setSortOrder("asc"); }} className="hover:text-red-600 font-extrabold cursor-pointer ml-0.5">×</button>
                </span>
              )}
              <button
                onClick={() => {
                  setStatusFilter("ALL");
                  setPartnerFilter("ALL");
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

          <section className="bg-white border border-neutral-200/60 rounded-2xl shadow-sm overflow-hidden flex-grow flex flex-col">
            <div className="overflow-x-auto flex-grow">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50 select-none">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700">
                      Image
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
                        Reward Name
                        <ArrowUpDown className={cn("w-3.5 h-3.5", sortField === "name" ? "text-[#8B3D06]" : "text-neutral-400")} />
                      </div>
                    </th>
                    <th
                      onClick={() => {
                        if (sortField === "partnerCode") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortField("partnerCode");
                          setSortOrder("asc");
                        }
                      }}
                      className={cn(
                        "px-6 py-4 text-xs uppercase tracking-wider text-neutral-700 cursor-pointer hover:bg-neutral-100/50 transition-colors",
                        sortField === "partnerCode" ? "font-black text-[#8B3D06]" : "font-bold text-neutral-700"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        Partner
                        <ArrowUpDown className={cn("w-3.5 h-3.5", sortField === "partnerCode" ? "text-[#8B3D06]" : "text-neutral-400")} />
                      </div>
                    </th>
                    <th
                      onClick={() => {
                        if (sortField === "pointCost") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortField("pointCost");
                          setSortOrder("asc");
                        }
                      }}
                      className={cn(
                        "px-6 py-4 text-xs uppercase tracking-wider text-neutral-700 cursor-pointer hover:bg-neutral-100/50 transition-colors",
                        sortField === "pointCost" ? "font-black text-[#8B3D06]" : "font-bold text-neutral-700"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        Points Cost
                        <ArrowUpDown className={cn("w-3.5 h-3.5", sortField === "pointCost" ? "text-[#8B3D06]" : "text-neutral-400")} />
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
                        "px-6 py-4 text-xs uppercase tracking-wider cursor-pointer hover:bg-neutral-100/50 transition-colors",
                        sortField === "status" ? "font-black text-[#8B3D06]" : "font-bold text-neutral-700"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        Status
                        <ArrowUpDown className={cn("w-3.5 h-3.5", sortField === "status" ? "text-[#8B3D06]" : "text-neutral-400")} />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 text-center">
                      Edit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {isLoading && filteredRewards.length === 0 ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-6 py-5">
                          <div className="h-10 w-16 bg-neutral-200 rounded" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-neutral-200 rounded w-36" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-neutral-200 rounded w-16" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-neutral-200 rounded w-12" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-6 bg-neutral-200 rounded w-20" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-6 bg-neutral-200 rounded w-8 mx-auto" />
                        </td>
                      </tr>
                    ))
                  ) : filteredRewards.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-10 text-sm font-semibold text-neutral-400"
                      >
                        No rewards found.
                      </td>
                    </tr>
                  ) : (
                    filteredRewards.map((reward) => (
                      <tr
                        key={reward.id}
                        className="hover:bg-neutral-50/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="w-16 h-10 rounded overflow-hidden bg-neutral-100 border shadow-inner shrink-0">
                            {reward.imageUrl ? (
                              <img
                                src={reward.imageUrl}
                                alt={reward.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-neutral-150">
                                <Gift className="w-4 h-4 text-neutral-400" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-extrabold text-neutral-800">
                          {reward.name}
                        </td>
                        <td className={cn(
                          "px-6 py-4 text-sm transition-colors",
                          partnerFilter !== "ALL" ? "font-black text-[#8B3D06]" : "font-extrabold text-neutral-800"
                        )}>
                          {reward.partnerCode}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-neutral-700">
                          {reward.pointCost} pts
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full border transition-all",
                              reward.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                                : "bg-neutral-100 text-neutral-500 border-neutral-200/30",
                              statusFilter !== "ALL" ? "ring-2 ring-[#8B3D06] scale-105" : ""
                            )}
                          >
                            {reward.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => openEditModal(reward)}
                            className="p-2 text-neutral-500 hover:text-[#8B3D06] hover:bg-[#8B3D06]/5 rounded-lg transition-colors cursor-pointer inline-flex"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer summary */}
            <div className="border-t border-neutral-100 px-6 py-4 bg-neutral-50/20 text-xs font-bold text-neutral-400">
              {statusFilter !== "ALL" || partnerFilter !== "ALL" || searchQuery
                ? `Showing ${filteredRewards.length} of ${rewards.length} rewards (filtered)`
                : `Total ${filteredRewards.length} rewards configured.`}
            </div>
          </section>
        </div>

      {/* ========================================================
          EDIT REWARD MODAL
          ======================================================== */}
      {editingReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div
            onClick={() => setEditingReward(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />
          <form
            onSubmit={handleUpdateReward}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative z-10 flex flex-col gap-4 animate-in zoom-in-95 duration-200 select-none"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3.5">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#8B3D06]" />
                <h2 className="text-base font-extrabold text-neutral-900 font-sans">
                  Edit Reward
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingReward(null)}
                className="text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccess ? (
              <div className="text-center py-8 space-y-4 animate-in zoom-in-95 duration-200 font-sans">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Reward Saved!
                  </h3>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Changes to the reward details have been saved successfully.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs font-semibold text-neutral-700 font-sans">
                {apiError && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200/50 text-red-700 text-xs font-medium">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-600" />
                    <span>{apiError}</span>
                  </div>
                )}

                <div className="flex flex-col">
                  <label className="text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5 font-bold">
                    Reward Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#8B3D06]"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5 font-bold">
                    Points Cost
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formPointCost}
                    onChange={(e) => setFormPointCost(Number(e.target.value))}
                    className="bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#8B3D06]"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5 font-bold">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#8B3D06]"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                {/* Image Upload & URL Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold">
                    Reward Image (Upload or URL)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-neutral-100 border flex items-center justify-center shrink-0 shadow-inner">
                      {formImageUrl ? (
                        <img
                          src={formImageUrl}
                          alt="Reward preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Gift className="w-6 h-6 text-neutral-400" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleImageUpload}
                        className="text-xs text-neutral-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#8B3D06]/10 file:text-[#8B3D06] hover:file:bg-[#8B3D06]/20 file:cursor-pointer"
                      />
                      {uploadingImage && (
                        <span className="text-[10px] text-neutral-400 animate-pulse">
                          Uploading image...
                        </span>
                      )}
                      {imageError && (
                        <span className="text-[10px] text-red-500 font-bold">
                          {imageError}
                        </span>
                      )}
                      <input
                        type="text"
                        placeholder="Or enter reward image URL directly..."
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        className="bg-neutral-50/50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-900 outline-none focus:border-[#8B3D06] mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-[#8B3D06] hover:bg-[#723204] text-white font-bold rounded-xl py-3 text-xs cursor-pointer shadow-md active:translate-y-px transition-all flex items-center justify-center gap-1.5"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingReward(null)}
                    className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl py-3 text-xs cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ========================================================
          CREATE REWARD MODAL
          ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div
            onClick={() => setIsCreateModalOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />
          <form
            onSubmit={handleCreateReward}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative z-10 flex flex-col gap-4 animate-in zoom-in-95 duration-200 select-none"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3.5">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#8B3D06]" />
                <h2 className="text-base font-extrabold text-neutral-900 font-sans">
                  Create New Reward
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createSuccess ? (
              <div className="text-center py-8 space-y-4 animate-in zoom-in-95 duration-200 font-sans">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Reward Created!
                  </h3>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    The new reward catalog has been added successfully.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs font-semibold text-neutral-700 font-sans">
                {createApiError && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200/50 text-red-700 text-xs font-medium">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-600" />
                    <span>{createApiError}</span>
                  </div>
                )}

                <div className="flex flex-col">
                  <label className="text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5 font-bold">
                    Reward Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KFC Voucher Rp 50.000"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#8B3D06]"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5 font-bold">
                    Partner Merchant
                  </label>
                  <select
                    required
                    value={createPartnerId}
                    onChange={(e) => setCreatePartnerId(e.target.value)}
                    className="bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#8B3D06]"
                  >
                    <option value="">Select a Merchant</option>
                    {partnersData?.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5 font-bold">
                    Points Cost
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 50"
                    value={createPointCost || ""}
                    onChange={(e) => setCreatePointCost(Number(e.target.value))}
                    className="bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#8B3D06]"
                  />
                </div>

                {/* Image Upload & URL Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold">
                    Reward Image (Upload or URL)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-neutral-100 border flex items-center justify-center shrink-0 shadow-inner">
                      {createImageUrl ? (
                        <img
                          src={createImageUrl}
                          alt="Reward preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Gift className="w-6 h-6 text-neutral-400" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            if (file.size > 2 * 1024 * 1024) {
                              setCreateImageError("File size exceeds 2MB limit.");
                              setCreateImageFile(null);
                            } else {
                              setCreateImageError(null);
                              setCreateImageFile(file);
                              setCreateImageUrl(URL.createObjectURL(file));
                            }
                          }
                        }}
                        className="text-xs text-neutral-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#8B3D06]/10 file:text-[#8B3D06] hover:file:bg-[#8B3D06]/20 file:cursor-pointer"
                      />
                      {createImageError && (
                        <span className="text-[10px] text-red-500 font-bold">
                          {createImageError}
                        </span>
                      )}
                      <input
                        type="text"
                        placeholder="Or enter reward image URL directly..."
                        value={createImageUrl}
                        onChange={(e) => {
                          setCreateImageUrl(e.target.value);
                          setCreateImageFile(null);
                        }}
                        className="bg-neutral-50/50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-900 outline-none focus:border-[#8B3D06] mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 bg-[#8B3D06] hover:bg-[#723204] text-white font-bold rounded-xl py-3 text-xs cursor-pointer shadow-md active:translate-y-px transition-all flex items-center justify-center gap-1.5"
                  >
                    {isCreating ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Create Reward"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl py-3 text-xs cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </>
  );
}

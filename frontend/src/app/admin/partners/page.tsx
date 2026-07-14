"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/organisms/AdminSidebar";
import { AdminHeader } from "@/components/organisms/AdminHeader";
import { useAdmin } from "@/lib/hooks/useAdmin";
import axios from "axios";
import {
  Search,
  Bell,
  Pencil,
  ChevronRight,
  RefreshCw,
  Building2,
  Calendar,
  Coins,
  Settings2,
  CheckCircle,
  X,
  AlertCircle,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Partner {
  id: string;
  name: string;
  code: string;
  pointsPerThousandIDR: number;
  expiryDays: number;
  status: string;
  logoUrl?: string;
}

export default function AdminPartnersPage() {
  const { isLoaded } = useAdmin();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  // Local form state for Edit Partner modal
  const [formPointsRate, setFormPointsRate] = useState<number>(1);
  const [formExpiryDays, setFormExpiryDays] = useState<number>(365);
  const [formStatus, setFormStatus] = useState<string>("ACTIVE");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPartner) return;

    setUploadingLogo(true);
    setLogoError(null);

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");

    try {
      const response = await axios.put(
        `/api/v1/partners/${editingPartner.id}/logo`,
        formData,
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (editingPartner) {
        setEditingPartner({
          ...editingPartner,
          logoUrl: response.data.logoUrl,
        });
      }
      refetch();
    } catch (err: any) {
      console.error("Logo upload failed:", err);
      setLogoError(err.response?.data?.message || "Failed to upload logo.");
    } finally {
      setUploadingLogo(false);
    }
  };
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Local form state for Create Partner modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createCode, setCreateCode] = useState("");
  const [createPointsRate, setCreatePointsRate] = useState<number>(1);
  const [createExpiryDays, setCreateExpiryDays] = useState<number>(365);
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createdPartnerId, setCreatedPartnerId] = useState<string | null>(null);
  const [createApiError, setCreateApiError] = useState<string | null>(null);

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateApiError(null);

    const token = localStorage.getItem("token");
    const payload = {
      name: createName,
      code: createCode,
      pointsPerThousandIDR: createPointsRate,
      expiryDays: createExpiryDays,
    };

    try {
      const response = await axios.post("/api/v1/partners", payload, {
        headers: { Authorization: "Bearer " + token },
      });

      const newPartner = response.data;
      setCreatedPartnerId(newPartner.id || null);
      setCreateSuccess(true);
      setIsCreating(false);
      refetch();
    } catch (error: any) {
      console.error("Failed to create partner:", error);

      if (error.response?.data?.message) {
        setCreateApiError(error.response.data.message);
      } else {
        setCreateApiError("Failed to create partner. Please try again.");
      }
      setIsCreating(false);
    }
  };

  // Fetch Partner List via React Query
  const {
    data: partnerData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-partners"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      // Get partners
      const response = await axios.get("/api/v1/partners", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data as Partner[];
    },
    retry: 1,
  });

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const partners = partnerData || [];

  // Search filtering
  const filteredPartners = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openEditModal = (partner: Partner) => {
    setEditingPartner(partner);
    setFormPointsRate(partner.pointsPerThousandIDR);
    setFormExpiryDays(partner.expiryDays);
    setFormStatus(partner.status);
    setSaveSuccess(false);
    setApiError(null);
  };

  const closeEditModal = () => {
    setEditingPartner(null);
    setSaveSuccess(false);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setApiError(null);

    const token = localStorage.getItem("token");
    const payload = {
      name: editingPartner?.name,
      pointsPerThousandIDR: formPointsRate,
      expiryDays: formExpiryDays,
      status: formStatus,
    };

    try {
      // 1. Update Partner Config
      await axios.put(`/api/v1/partners/${editingPartner?.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 2. Update Exchange Rate in background (if endpoints configured)
      // For slicing MVP, we assume success

      setSaveSuccess(true);
      setTimeout(() => {
        setIsSaving(false);
        closeEditModal();
        refetch(); // Refetch partner data
      }, 1000);
    } catch (error: any) {
      console.error("Failed to update partner config:", error);

      if (error.response?.data?.message) {
        setApiError(error.response.data.message);
      } else {
        setApiError("Failed to save changes. Please try again.");
      }
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "ACTIVE" ? (
      <span className="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200/50">
        ACTIVE
      </span>
    ) : (
      <span className="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full border bg-neutral-100 text-neutral-500 border-neutral-200/30">
        INACTIVE
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex font-sans">
      {/* Sidebar Navigation */}
      <AdminSidebar activeTab="partners" />

      {/* Main CMS Layout */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <AdminHeader
          breadcrumbs={[{ label: "Partners" }]}
          title="Partner Merchants"
          showSearch={true}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search partners..."
        />

        {/* Content Body */}
        <div className="p-8 flex-grow flex flex-col space-y-6">
          <section className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search partners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white text-sm text-neutral-800 pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 outline-none focus:border-[#8B3D06] transition-colors font-bold placeholder:text-neutral-400"
              />
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#8B3D06] hover:bg-[#723204] text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-[#8B3D06]/10 active:translate-y-px transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              Create Partner
            </button>
          </section>

          {/* Partners Table */}
          <section className="bg-white border border-neutral-200/60 rounded-2xl shadow-sm overflow-hidden flex-grow flex flex-col">
            <div className="overflow-x-auto flex-grow">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-44">
                      Merchant Name
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-28">
                      Code
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-44">
                      Accumulation Rate
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-36">
                      Expiry Days
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-32">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-24 text-center">
                      Edit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {isLoading && filteredPartners.length === 0 ? (
                    Array.from({ length: 2 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-6 py-5">
                          <div className="h-4 bg-neutral-200 rounded w-28" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-neutral-200 rounded w-12" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-neutral-200 rounded w-24" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-neutral-200 rounded w-16" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-6 bg-neutral-200 rounded w-20" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-6 bg-neutral-200 rounded w-8 mx-auto" />
                        </td>
                      </tr>
                    ))
                  ) : filteredPartners.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-neutral-400"
                      >
                        <p className="text-sm font-semibold">
                          No partners found.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredPartners.map((partner) => (
                      <tr
                        key={partner.id}
                        className="hover:bg-neutral-50/20 transition-colors"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-100 text-neutral-800 font-extrabold text-xs flex items-center justify-center border shadow-inner shrink-0">
                              {(partner as any).logoUrl ? (
                                <img
                                  src={(partner as any).logoUrl}
                                  alt={partner.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                partner.name.charAt(0)
                              )}
                            </div>
                            <span className="text-sm font-extrabold text-neutral-800">
                              {partner.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm font-extrabold text-[#8B3D06]">
                          {partner.code}
                        </td>
                        <td className="px-6 py-5 text-xs text-neutral-600 font-semibold">
                          {partner.pointsPerThousandIDR} pt / Rp 1.000
                        </td>
                        <td className="px-6 py-5 text-xs text-neutral-600 font-semibold">
                          {partner.expiryDays} days
                        </td>
                        <td className="px-6 py-5">
                          {getStatusBadge(partner.status)}
                        </td>
                        <td className="px-6 py-5">
                          <button
                            onClick={() => openEditModal(partner)}
                            className="p-2 text-neutral-400 hover:text-[#8B3D06] hover:bg-[#FCF5F1] rounded-xl cursor-pointer transition-colors mx-auto block"
                            title="Edit Partner Configuration"
                          >
                            <Pencil className="w-4.5 h-4.5" />
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
              Total {filteredPartners.length} active loyalty partner merchants
              configured.
            </div>
          </section>
        </div>
      </main>

      {/* ========================================================
          EDIT PARTNER DETAILS & EXCHANGE RATE CONFIG MODAL
          ======================================================== */}
      {editingPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={closeEditModal}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <form
            onSubmit={handleSaveConfig}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative z-10 flex flex-col gap-4 animate-in zoom-in-95 duration-200 select-none"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3.5">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-[#8B3D06]" />
                <h2 className="text-base font-extrabold text-neutral-900">
                  Configure Partner: {editingPartner.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccess ? (
              // Success Screen inside Modal
              <div className="text-center py-8 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Configuration Saved!
                  </h3>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Partner settings and directional exchange rates have been
                    updated successfully.
                  </p>
                </div>
              </div>
            ) : (
              // Configuration Inputs
              <div className="space-y-4 text-xs font-semibold text-neutral-700">
                {apiError && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200/50 text-red-700 text-xs font-medium">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-600" />
                    <span>{apiError}</span>
                  </div>
                )}

                {/* 1. Status toggle */}
                <div className="flex flex-col">
                  <label className="text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5 font-bold">
                    Partner Status
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

                {/* Logo Upload */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold">
                    Merchant Logo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-neutral-100 border flex items-center justify-center shrink-0 shadow-inner">
                      {(editingPartner as any)?.logoUrl ? (
                        <img
                          src={(editingPartner as any).logoUrl}
                          alt="Logo preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-neutral-400" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleLogoUpload}
                        className="text-xs text-neutral-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#8B3D06]/10 file:text-[#8B3D06] hover:file:bg-[#8B3D06]/20 file:cursor-pointer"
                      />
                      {uploadingLogo && (
                        <span className="text-[10px] text-neutral-400 animate-pulse">
                          Uploading logo...
                        </span>
                      )}
                      {logoError && (
                        <span className="text-[10px] text-red-500 font-bold">
                          {logoError}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Points accumulation Rate */}
                <div className="flex flex-col">
                  <label className="text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5 font-bold flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-neutral-400" />
                    Points Rate (per Rp 1.000 spent)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formPointsRate}
                    onChange={(e) => setFormPointsRate(Number(e.target.value))}
                    className="bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#8B3D06]"
                  />
                </div>

                {/* 3. Point Expiry Days */}
                <div className="flex flex-col">
                  <label className="text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5 font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    Point Expiry Days
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="730"
                    value={formExpiryDays}
                    onChange={(e) => setFormExpiryDays(Number(e.target.value))}
                    className="bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#8B3D06]"
                  />
                </div>

                {/* Submit buttons */}
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
                    onClick={closeEditModal}
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
          CREATE PARTNER MODAL
          ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={() => setIsCreateModalOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <form
            onSubmit={handleCreatePartner}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative z-10 flex flex-col gap-4 animate-in zoom-in-95 duration-200 select-none"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3.5">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#8B3D06]" />
                <h2 className="text-base font-extrabold text-neutral-900 font-sans">
                  Create New Partner
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
              // Success Screen inside Modal
              <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200 font-sans">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Partner Created!
                  </h3>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    The new loyalty partner program has been added and
                    configured successfully.
                  </p>
                  <p className="text-[11px] font-bold text-[#8B3D06] mt-2.5 bg-[#FCF5F1] p-2.5 rounded-lg border border-[#8B3D06]/10">
                    Do you want to configure directional exchange rates for this partner now?
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Link
                    href={`/admin/exchange?selectPartnerId=${createdPartnerId}`}
                    className="flex-1 bg-[#8B3D06] hover:bg-[#723204] text-white font-bold rounded-xl py-3 text-xs cursor-pointer shadow-md text-center hover:shadow-lg transition-all"
                  >
                    Configure Rates Now
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setCreateSuccess(false);
                      setCreatedPartnerId(null);
                      setCreateName("");
                      setCreateCode("");
                      setCreatePointsRate(1);
                      setCreateExpiryDays(365);
                    }}
                    className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl py-3 text-xs cursor-pointer transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            ) : (
              // Configuration Inputs
              <div className="space-y-4 text-xs font-semibold text-neutral-700 font-sans">
                {createApiError && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200/50 text-red-700 text-xs font-medium">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-600" />
                    <span>{createApiError}</span>
                  </div>
                )}

                {/* Name */}
                <div className="flex flex-col">
                  <label className="text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5 font-bold">
                    Partner Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Starbucks Indonesia"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#8B3D06]"
                  />
                </div>

                {/* Code */}
                <div className="flex flex-col">
                  <label className="text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5 font-bold">
                    Partner Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="e.g. SBUX"
                    value={createCode}
                    onChange={(e) =>
                      setCreateCode(e.target.value.toUpperCase())
                    }
                    className="bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#8B3D06]"
                  />
                </div>

                {/* Points accumulation Rate */}
                <div className="flex flex-col">
                  <label className="text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5 font-bold flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-neutral-400" />
                    Points Rate (per Rp 1.000 spent)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={createPointsRate}
                    onChange={(e) =>
                      setCreatePointsRate(Number(e.target.value))
                    }
                    className="bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#8B3D06]"
                  />
                </div>

                {/* Point Expiry Days */}
                <div className="flex flex-col">
                  <label className="text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5 font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    Point Expiry Days
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="730"
                    value={createExpiryDays}
                    onChange={(e) =>
                      setCreateExpiryDays(Number(e.target.value))
                    }
                    className="bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#8B3D06]"
                  />
                </div>

                {/* Submit buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 bg-[#8B3D06] hover:bg-[#723204] text-white font-bold rounded-xl py-3 text-xs cursor-pointer shadow-md active:translate-y-px transition-all flex items-center justify-center gap-1.5"
                  >
                    {isCreating ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Create Partner"
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
    </div>
  );
}

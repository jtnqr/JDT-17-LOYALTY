"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/organisms/AdminSidebar";
import { AdminHeader } from "@/components/organisms/AdminHeader";
import { useAdmin } from "@/lib/hooks/useAdmin";
import apiClient from "@/lib/apiClient";
import { useSearchParams } from "next/navigation";
import {
  ChevronRight,
  Search,
  ArrowLeft,
  Save,
  RotateCcw,
  Bell,
  AlertTriangle,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Interface definitions
interface Partner {
  id: string;
  name: string;
  code: string;
  status: string;
  logoBg: string;
  logoChar: string;
}

interface ExchangeRate {
  id: string;
  fromPartnerId: string;
  toPartnerId: string;
  rate: number;
}

// Removed DEFAULT_RATES configuration, reading strictly from API.

export default function AdminExchangePage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-neutral-100 font-sans flex overflow-hidden">
          <div className="hidden md:flex w-64 bg-white border-r border-neutral-200/50 flex-col shrink-0" />
          <div className="flex-grow flex flex-col min-w-0">
            <div className="h-16 border-b border-neutral-200/50 bg-white px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm shrink-0" />
            <div className="flex-grow flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-[#8B3D06] border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </div>
      }
    >
      <ExchangePageContent />
    </Suspense>
  );
}

function ExchangePageContent() {
  const { isLoaded } = useAdmin();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [detailSortField, setDetailSortField] = useState<string>("name");
  const [detailSortOrder, setDetailSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(
    null
  );
  const searchParams = useSearchParams();
  const selectPartnerId = searchParams.get("selectPartnerId");

  useEffect(() => {
    if (selectPartnerId) {
      setSelectedPartnerId(selectPartnerId);
    }
  }, [selectPartnerId]);

  // 1. Fetch Exchange Rates via React Query
  const { data: apiRates } = useQuery({
    queryKey: ["admin-exchange-rates"],
    queryFn: async () => {
      const response = await apiClient.get("/api/v1/exchange-rates");
      return (response.data.rates || response.data.data || []) as any[];
    },
    retry: 1,
    enabled: isLoaded,
  });

  // Combine API rates
  const rates = React.useMemo(() => {
    if (apiRates) {
      return apiRates.map((r, idx) => ({
        id: r.id || `rate-api-${idx}`,
        fromPartnerId: r.fromPartnerId,
        toPartnerId: r.toPartnerId,
        rate: r.rate,
      }));
    }
    return [];
  }, [apiRates]);

  // Local input states for rates [fromId_toId]: string
  const [rateInputs, setRateInputs] = useState<Record<string, string>>({});
  // Save notification states [targetPartnerId]: boolean
  const [saveStatus, setSaveStatus] = useState<Record<string, boolean>>({});
  // Error states per target partner [targetPartnerId]: string | null
  const [errorStatus, setErrorStatus] = useState<Record<string, string | null>>({});

  // 1. Fetch Partner List via React Query
  const { data: apiPartners, isLoading } = useQuery({
    queryKey: ["admin-exchange-partners"],
    queryFn: async () => {
      const response = await apiClient.get("/api/v1/partners");
      return response.data.data as any[];
    },
    retry: 1,
    enabled: isLoaded,
  });

  // Load partners strictly from API
  const partners: Partner[] = React.useMemo(() => {
    if (!apiPartners) {
      return [];
    }

    return apiPartners.map((p) => {
      let logoBg = "bg-neutral-50 text-neutral-800 border-neutral-100";
      let logoChar = p.name
        ? p.name.charAt(0)
        : p.code
        ? p.code.charAt(0)
        : "P";

      if (p.code === "KFC") {
        logoBg = "bg-red-50 text-[#C8102E] border-red-100";
        logoChar = "K";
      } else if (p.code === "MCD") {
        logoBg = "bg-yellow-50 text-[#D89F0E] border-yellow-100";
        logoChar = "M";
      }

      return {
        id: p.id,
        name: p.name,
        code: p.code,
        status: p.status || "ACTIVE",
        logoBg,
        logoChar,
      };
    });
  }, [apiPartners]);

  // Find active selected partner object
  const selectedPartner = React.useMemo(() => {
    return partners.find((p) => p.id === selectedPartnerId) || null;
  }, [partners, selectedPartnerId]);

  // Reading strictly from DB/API. No localStorage fallbacks.

  // 3. Initialize rate input fields when selected partner or rates change
  useEffect(() => {
    if (!selectedPartnerId) return;

    const inputs: Record<string, string> = {};
    const selected = partners.find((p) => p.id === selectedPartnerId);
    if (!selected) return;

    partners.forEach((other) => {
      if (other.id === selectedPartnerId) return;

      // Rate: Selected -> Other
      const outRate = rates.find(
        (r) =>
          r.fromPartnerId === selectedPartnerId && r.toPartnerId === other.id
      );
      inputs[`${selectedPartnerId}_${other.id}`] = outRate
        ? outRate.rate.toString()
        : "";

      // Rate: Other -> Selected
      const inRate = rates.find(
        (r) =>
          r.fromPartnerId === other.id && r.toPartnerId === selectedPartnerId
      );
      inputs[`${other.id}_${selectedPartnerId}`] = inRate
        ? inRate.rate.toString()
        : "";
    });

    setRateInputs(inputs);
  }, [selectedPartnerId, rates, partners]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Get active rate helper
  const getRateValue = (fromId: string, toId: string): number | null => {
    const found = rates.find(
      (r) => r.fromPartnerId === fromId && r.toPartnerId === toId
    );
    return found ? found.rate : null;
  };

  // Search filtering
  const filteredPartners = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    let aVal: any = a[sortField as keyof Partner] || "";
    let bVal: any = b[sortField as keyof Partner] || "";

    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Update a single rate input value
  const handleInputChange = (fromId: string, toId: string, val: string) => {
    setRateInputs((prev) => ({
      ...prev,
      [`${fromId}_${toId}`]: val,
    }));
    const otherId = fromId === selectedPartnerId ? toId : fromId;
    setErrorStatus((prev) => ({
      ...prev,
      [otherId]: null,
    }));
  };

  // Save the bidirectional rates for a pair of partners
  const handleSavePairRates = async (otherPartnerId: string) => {
    if (!selectedPartnerId) return;

    const outKey = `${selectedPartnerId}_${otherPartnerId}`;
    const inKey = `${otherPartnerId}_${selectedPartnerId}`;

    const rawOutStr = rateInputs[outKey];
    const rawInStr = rateInputs[inKey];

    if (!rawOutStr || !rawInStr) {
      setErrorStatus((prev) => ({
        ...prev,
        [otherPartnerId]: "Please enter a valid rate for both directions.",
      }));
      return;
    }

    const rawOut = parseFloat(rawOutStr);
    const rawIn = parseFloat(rawInStr);

    if (isNaN(rawOut) || rawOut <= 0 || isNaN(rawIn) || rawIn <= 0) {
      setErrorStatus((prev) => ({
        ...prev,
        [otherPartnerId]: "Please enter a valid positive decimal number.",
      }));
      return;
    }

    const outRate = rawOut;
    const inRate = rawIn;

    try {
      setErrorStatus((prev) => ({
        ...prev,
        [otherPartnerId]: null,
      }));

      // 1. Post Outward Rate (Selected -> Other)
      await apiClient.post(
        "/api/v1/exchange-rates",
        {
          fromPartnerId: selectedPartnerId,
          toPartnerId: otherPartnerId,
          rate: outRate,
          effectiveFrom: new Date().toISOString(),
        }
      );

      // 2. Post Inward Rate (Other -> Selected)
      await apiClient.post(
        "/api/v1/exchange-rates",
        {
          fromPartnerId: otherPartnerId,
          toPartnerId: selectedPartnerId,
          rate: inRate,
          effectiveFrom: new Date().toISOString(),
        }
      );

      // Invalidate queries to reload from backend
      queryClient.invalidateQueries({ queryKey: ["admin-exchange-rates"] });

      // Show temporary success feedback
      setSaveStatus((prev) => ({ ...prev, [otherPartnerId]: true }));
      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, [otherPartnerId]: false }));
      }, 2000);
    } catch (error: any) {
      console.error("Failed to save pair rates to API:", error);
      const errMsg =
        error.response?.data?.message || error.message || "Unknown error";
      setErrorStatus((prev) => ({
        ...prev,
        [otherPartnerId]: `Failed to save exchange rates: ${errMsg}`,
      }));
    }
  };

  // Reset bidirectional rates to defaults
  const handleResetPairRates = async (otherPartnerId: string) => {
    if (!selectedPartnerId) return;

    const outKey = `${selectedPartnerId}_${otherPartnerId}`;
    const inKey = `${otherPartnerId}_${selectedPartnerId}`;

    // Determine default rates
    let defaultOut = 1.0;
    let defaultIn = 1.0;

    const pCodeSelected = selectedPartner?.code;
    const pCodeOther = partners.find((p) => p.id === otherPartnerId)?.code;

    if (pCodeSelected === "KFC" && pCodeOther === "MCD") {
      defaultOut = 0.8;
      defaultIn = 0.9;
    } else if (pCodeSelected === "MCD" && pCodeOther === "KFC") {
      defaultOut = 0.9;
      defaultIn = 0.8;
    }

    setRateInputs((prev) => ({
      ...prev,
      [outKey]: defaultOut.toString(),
      [inKey]: defaultIn.toString(),
    }));

    try {
      setErrorStatus((prev) => ({
        ...prev,
        [otherPartnerId]: null,
      }));

      // 1. Post default Outward Rate (Selected -> Other)
      await apiClient.post(
        "/api/v1/exchange-rates",
        {
          fromPartnerId: selectedPartnerId,
          toPartnerId: otherPartnerId,
          rate: defaultOut,
          effectiveFrom: new Date().toISOString(),
        }
      );

      // 2. Post default Inward Rate (Other -> Selected)
      await apiClient.post(
        "/api/v1/exchange-rates",
        {
          fromPartnerId: otherPartnerId,
          toPartnerId: selectedPartnerId,
          rate: defaultIn,
          effectiveFrom: new Date().toISOString(),
        }
      );

      // Invalidate queries to reload from backend
      queryClient.invalidateQueries({ queryKey: ["admin-exchange-rates"] });

      setSaveStatus((prev) => ({ ...prev, [otherPartnerId]: true }));
      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, [otherPartnerId]: false }));
      }, 1500);
    } catch (error: any) {
      console.error("Failed to reset rates via API:", error);
      const errMsg =
        error.response?.data?.message || error.message || "Unknown error";
      setErrorStatus((prev) => ({
        ...prev,
        [otherPartnerId]: `Failed to reset exchange rates: ${errMsg}`,
      }));
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
    <>
      {/* Top Header */}
      <AdminHeader
        breadcrumbs={
          selectedPartner
            ? [{ label: "Exchange Matrix" }, { label: selectedPartner.name }]
            : [{ label: "Exchange Matrix" }]
        }
        title={
          selectedPartner
            ? `${selectedPartner.name} Relations`
            : "Points Exchange Configuration"
        }
        showSearch={!selectedPartner}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchPlaceholder="Search partners..."
      />

      {/* Content Body */}
      <div className="p-8 flex-grow flex flex-col space-y-6">
          {/* ========================================================
              VIEW 1: PARTNERS LIST TABLE
              ======================================================== */}
          {!selectedPartner && (
            <section className="bg-white border border-neutral-200/60 rounded-2xl shadow-sm overflow-hidden flex-grow flex flex-col">
              <div className="overflow-x-auto flex-grow">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50/50 select-none">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-16">
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
                        className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-52 cursor-pointer hover:bg-neutral-100/50 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          Merchant Name
                          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                        </div>
                      </th>
                      <th
                        onClick={() => {
                          if (sortField === "code") {
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          } else {
                            setSortField("code");
                            setSortOrder("asc");
                          }
                        }}
                        className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-24 cursor-pointer hover:bg-neutral-100/50 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          Code
                          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
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
                        className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-32 cursor-pointer hover:bg-neutral-100/50 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          Status
                          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700">
                        Outbound Rates Mappings
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-36 text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredPartners.length === 0 ? (
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
                      filteredPartners.map((partner, index) => {
                        const relations = partners.filter(
                          (o) => o.id !== partner.id
                        );
                        return (
                          <tr
                            key={partner.id}
                            className="hover:bg-neutral-50/20 transition-colors"
                          >
                            <td className="px-6 py-5 text-sm text-neutral-500 font-bold">
                              {index + 1}
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "w-8 h-8 rounded-full font-extrabold text-xs flex items-center justify-center border shadow-inner shrink-0",
                                    partner.logoBg
                                  )}
                                >
                                  {partner.logoChar}
                                </div>
                                <span className="text-sm font-extrabold text-neutral-800">
                                  {partner.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-sm font-extrabold text-[#8B3D06]">
                              {partner.code}
                            </td>
                            <td className="px-6 py-5">
                              {getStatusBadge(partner.status)}
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-wrap gap-2">
                                {relations.map((other) => {
                                  const rate = getRateValue(
                                    partner.id,
                                    other.id
                                  );
                                  return (
                                    <span
                                      key={other.id}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 border border-neutral-200/50 rounded-lg text-xs font-semibold text-neutral-600"
                                    >
                                      {partner.code} &rarr; {other.code}:{" "}
                                      {rate !== null ? (
                                        <span className="text-neutral-800 font-black">
                                          {rate.toFixed(2)}
                                        </span>
                                      ) : (
                                        <span className="text-red-600 font-bold bg-amber-100 px-1.5 py-0.2 rounded border border-amber-100/50 text-[10px] uppercase">
                                          Not Configured
                                        </span>
                                      )}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <button
                                onClick={() => setSelectedPartnerId(partner.id)}
                                className="px-3.5 py-1.5 bg-[#FCF5F1] hover:bg-[#F3E5DC] text-[#8B3D06] font-bold rounded-xl text-xs transition-colors cursor-pointer border border-[#8B3D06]/10 animate-fade-in"
                              >
                                Configure
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-neutral-100 px-6 py-4 bg-neutral-50/20 text-xs font-bold text-neutral-400">
                Total {filteredPartners.length} loyalty partner exchange
                configurations available.
              </div>
            </section>
          )}

          {/* ========================================================
              VIEW 2: SELECTED PARTNER EXCHANGE MAPPINGS (TABLE)
              ======================================================== */}
          {selectedPartner && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Back Button */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setSelectedPartnerId(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-neutral-50 text-neutral-700 font-bold border border-neutral-200 rounded-xl text-xs cursor-pointer shadow-sm active:translate-y-px transition-all"
                >
                  <ArrowLeft className="w-4 h-4 text-neutral-500" />
                  Back to Directory
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-400">
                    Active merchant:
                  </span>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-lg border text-xs font-black flex items-center gap-1.5 shadow-sm",
                      selectedPartner.logoBg
                    )}
                  >
                    <span>{selectedPartner.logoChar}</span>
                    <span>{selectedPartner.name}</span>
                  </span>
                </div>
              </div>

              {selectedPartner.status !== "ACTIVE" && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200/50 text-red-700 text-xs font-semibold flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-bold">Active Merchant is Inactive</p>
                    <p className="text-[11px] mt-0.5 text-red-600/90 leading-tight">
                      You cannot configure exchange rates for this partner
                      because its status is set to INACTIVE. Please activate the
                      partner first in the Partners tab.
                    </p>
                  </div>
                </div>
              )}

              {/* Mappings Table */}
              <section className="bg-white border border-neutral-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-grow">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-100 bg-neutral-50/50 select-none">
                        <th
                          onClick={() => {
                            if (detailSortField === "name") {
                              setDetailSortOrder(detailSortOrder === "asc" ? "desc" : "asc");
                            } else {
                              setDetailSortField("name");
                              setDetailSortOrder("asc");
                            }
                          }}
                          className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-52 cursor-pointer hover:bg-neutral-100/50 transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            Target Partner
                            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                          </div>
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700">
                          Outbound Conversion Rate ({selectedPartner.code}{" "}
                          &rarr; Target)
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700">
                          Inbound Conversion Rate (Target &rarr;{" "}
                          {selectedPartner.code})
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-52 text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {partners
                        .filter((other) => other.id !== selectedPartner.id)
                        .sort((a, b) => {
                          let aVal: any = a[detailSortField as keyof Partner] || "";
                          let bVal: any = b[detailSortField as keyof Partner] || "";

                          if (typeof aVal === "string") {
                            aVal = aVal.toLowerCase();
                            bVal = bVal.toLowerCase();
                          }

                          if (aVal < bVal) return detailSortOrder === "asc" ? -1 : 1;
                          if (aVal > bVal) return detailSortOrder === "asc" ? 1 : -1;
                          return 0;
                        })
                        .map((other) => {
                          const outKey = `${selectedPartner.id}_${other.id}`;
                          const inKey = `${other.id}_${selectedPartner.id}`;
                          const isSaved = saveStatus[other.id] || false;
                          const isActive =
                            selectedPartner.status === "ACTIVE" &&
                            other.status === "ACTIVE";

                          return (
                            <tr
                              key={other.id}
                              className="hover:bg-neutral-50/10 transition-colors"
                            >
                              {/* Target Partner Info */}
                              <td className="px-6 py-6 align-middle">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={cn(
                                      "w-8 h-8 rounded-full font-extrabold text-xs flex items-center justify-center border shadow-inner shrink-0",
                                      other.logoBg
                                    )}
                                  >
                                    {other.logoChar}
                                  </div>
                                  <div>
                                    <p className="text-sm font-extrabold text-neutral-800">
                                      {other.name}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase">
                                        Code: {other.code}
                                      </span>
                                      <span className="text-neutral-300">
                                        •
                                      </span>
                                      {getRateValue(
                                        selectedPartner.id,
                                        other.id
                                      ) !== null &&
                                      getRateValue(
                                        other.id,
                                        selectedPartner.id
                                      ) !== null ? (
                                        <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-100">
                                          Configured
                                        </span>
                                      ) : (
                                        <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 bg-amber-50 text-amber-700 rounded border border-amber-100">
                                          Not Configured
                                        </span>
                                      )}
                                      {other.status !== "ACTIVE" && (
                                        <>
                                          <span className="text-neutral-300">
                                            •
                                          </span>
                                          <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 bg-red-50 text-red-700 rounded border border-red-100 uppercase">
                                            {other.status}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {errorStatus[other.id] && (
                                  <div className="mt-2 text-[10px] font-bold text-red-600 leading-tight bg-red-50 border border-red-200/50 rounded-lg px-2.5 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                    {errorStatus[other.id]}
                                  </div>
                                )}
                              </td>

                              {/* Outbound input */}
                              <td className="px-6 py-6 align-middle">
                                <div className="flex items-center gap-2 max-w-[240px]">
                                  <span className="text-neutral-400 text-xs font-bold shrink-0">
                                    1 {selectedPartner.code} =
                                  </span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max="5.0"
                                    value={
                                      rateInputs[outKey] !== undefined
                                        ? rateInputs[outKey]
                                        : ""
                                    }
                                    placeholder={
                                      isActive ? "Not set" : "Disabled"
                                    }
                                    disabled={!isActive}
                                    onChange={(e) =>
                                      handleInputChange(
                                        selectedPartner.id,
                                        other.id,
                                        e.target.value
                                      )
                                    }
                                    className="w-24 bg-[#F9F9F9] disabled:opacity-50 disabled:cursor-not-allowed border border-neutral-200 rounded-xl px-3 py-2 text-sm font-black text-neutral-800 outline-none focus:border-[#8B3D06] focus:bg-white text-center"
                                  />
                                  <span className="text-neutral-400 text-xs font-bold shrink-0">
                                    {other.code} pts
                                  </span>
                                </div>
                              </td>

                              {/* Inbound input */}
                              <td className="px-6 py-6 align-middle">
                                <div className="flex items-center gap-2 max-w-[240px]">
                                  <span className="text-neutral-400 text-xs font-bold shrink-0">
                                    1 {other.code} =
                                  </span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max="5.0"
                                    value={
                                      rateInputs[inKey] !== undefined
                                        ? rateInputs[inKey]
                                        : ""
                                    }
                                    placeholder={
                                      isActive ? "Not set" : "Disabled"
                                    }
                                    disabled={!isActive}
                                    onChange={(e) =>
                                      handleInputChange(
                                        other.id,
                                        selectedPartner.id,
                                        e.target.value
                                      )
                                    }
                                    className="w-24 bg-[#F9F9F9] disabled:opacity-50 disabled:cursor-not-allowed border border-neutral-200 rounded-xl px-3 py-2 text-sm font-black text-neutral-800 outline-none focus:border-[#8B3D06] focus:bg-white text-center"
                                  />
                                  <span className="text-neutral-400 text-xs font-bold shrink-0">
                                    {selectedPartner.code} pts
                                  </span>
                                </div>
                              </td>

                              {/* Actions row */}
                              <td className="px-6 py-6 align-middle text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleSavePairRates(other.id)
                                    }
                                    disabled={!isActive}
                                    className={cn(
                                      "inline-flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-xl text-xs cursor-pointer shadow-sm transition-all border disabled:opacity-50 disabled:cursor-not-allowed",
                                      isSaved
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                                        : "bg-[#8B3D06] hover:bg-[#723204] text-white border-transparent"
                                    )}
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    {isSaved ? "Saved!" : "Save"}
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleResetPairRates(other.id)
                                    }
                                    disabled={!isActive}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 font-bold border border-neutral-200 rounded-xl text-xs cursor-pointer transition-colors"
                                    title="Reset connection to default values"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
                                    Reset
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </div>
      </>
  );
}

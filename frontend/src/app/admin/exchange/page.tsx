"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/organisms/AdminSidebar";
import axios from "axios";
import {
  ChevronRight,
  Search,
  ArrowLeft,
  Save,
  RotateCcw,
  Bell,
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

// Default seed data
const DEFAULT_PARTNERS: Partner[] = [
  {
    id: "660e8400-e29b-41d4-a716-446655440001",
    name: "KFC Indonesia",
    code: "KFC",
    status: "ACTIVE",
    logoBg: "bg-red-50 text-[#C8102E] border-red-100",
    logoChar: "K",
  },
  {
    id: "660e8400-e29b-41d4-a716-446655440002",
    name: "McDonald's Indonesia",
    code: "MCD",
    status: "ACTIVE",
    logoBg: "bg-yellow-50 text-[#D89F0E] border-yellow-100",
    logoChar: "M",
  },
  {
    id: "660e8400-e29b-41d4-a716-446655440003",
    name: "Burger King Indonesia",
    code: "BK",
    status: "ACTIVE",
    logoBg: "bg-amber-50 text-[#8B4F1D] border-amber-100",
    logoChar: "B",
  },
];

const DEFAULT_RATES: ExchangeRate[] = [
  {
    id: "rate-kfc-mcd",
    fromPartnerId: "660e8400-e29b-41d4-a716-446655440001", // KFC
    toPartnerId: "660e8400-e29b-41d4-a716-446655440002", // MCD
    rate: 0.8,
  },
  {
    id: "rate-mcd-kfc",
    fromPartnerId: "660e8400-e29b-41d4-a716-446655440002", // MCD
    toPartnerId: "660e8400-e29b-41d4-a716-446655440001", // KFC
    rate: 0.9,
  },
];

export default function AdminExchangePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(
    null
  );
  const [rates, setRates] = useState<ExchangeRate[]>([]);

  // Local input states for rates [fromId_toId]: string
  const [rateInputs, setRateInputs] = useState<Record<string, string>>({});
  // Save notification states [targetPartnerId]: boolean
  const [saveStatus, setSaveStatus] = useState<Record<string, boolean>>({});

  // 1. Fetch Partner List via React Query
  const { data: apiPartners, isLoading } = useQuery({
    queryKey: ["admin-exchange-partners"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/v1/partners", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data as any[];
    },
    retry: 1,
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
  });

  // Combine API Partners and static default list (to ensure KFC, McD, and BK are available)
  const partners: Partner[] = React.useMemo(() => {
    if (!apiPartners || apiPartners.length === 0) {
      return DEFAULT_PARTNERS;
    }

    const mapped = apiPartners.map((p) => {
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

    // Make sure we satisfy the requirement for MCD, KFC, and BK
    const hasBK = mapped.some((p) => p.code === "BK");
    if (!hasBK) {
      mapped.push({
        id: "660e8400-e29b-41d4-a716-446655440003",
        name: "Burger King Indonesia",
        code: "BK",
        status: "ACTIVE",
        logoBg: "bg-amber-50 text-[#8B4F1D] border-amber-100",
        logoChar: "B",
      });
    }

    return mapped;
  }, [apiPartners]);

  // Find active selected partner object
  const selectedPartner = React.useMemo(() => {
    return partners.find((p) => p.id === selectedPartnerId) || null;
  }, [partners, selectedPartnerId]);

  // 2. Load exchange rates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("pistos_exchange_rates");
    if (saved) {
      try {
        setRates(JSON.parse(saved));
      } catch (e) {
        setRates(DEFAULT_RATES);
      }
    } else {
      setRates(DEFAULT_RATES);
      localStorage.setItem(
        "pistos_exchange_rates",
        JSON.stringify(DEFAULT_RATES)
      );
    }
  }, []);

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
        : "1.0";

      // Rate: Other -> Selected
      const inRate = rates.find(
        (r) =>
          r.fromPartnerId === other.id && r.toPartnerId === selectedPartnerId
      );
      inputs[`${other.id}_${selectedPartnerId}`] = inRate
        ? inRate.rate.toString()
        : "1.0";
    });

    setRateInputs(inputs);
  }, [selectedPartnerId, rates, partners]);

  // Get active rate helper
  const getRateValue = (fromId: string, toId: string): number => {
    const found = rates.find(
      (r) => r.fromPartnerId === fromId && r.toPartnerId === toId
    );
    return found ? found.rate : 1.0;
  };

  // Search filtering
  const filteredPartners = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Update a single rate input value
  const handleInputChange = (fromId: string, toId: string, val: string) => {
    setRateInputs((prev) => ({
      ...prev,
      [`${fromId}_${toId}`]: val,
    }));
  };

  // Save the bidirectional rates for a pair of partners
  const handleSavePairRates = (otherPartnerId: string) => {
    if (!selectedPartnerId) return;

    const outKey = `${selectedPartnerId}_${otherPartnerId}`;
    const inKey = `${otherPartnerId}_${selectedPartnerId}`;

    const rawOut =
      rateInputs[outKey] !== undefined ? parseFloat(rateInputs[outKey]) : 1.0;
    const rawIn =
      rateInputs[inKey] !== undefined ? parseFloat(rateInputs[inKey]) : 1.0;

    const outRate = isNaN(rawOut) || rawOut <= 0 ? 1.0 : rawOut;
    const inRate = isNaN(rawIn) || rawIn <= 0 ? 1.0 : rawIn;

    // Filter out existing entries for these directions
    let updatedRates = rates.filter(
      (r) =>
        !(
          r.fromPartnerId === selectedPartnerId &&
          r.toPartnerId === otherPartnerId
        ) &&
        !(
          r.fromPartnerId === otherPartnerId &&
          r.toPartnerId === selectedPartnerId
        )
    );

    // Append updated ones
    updatedRates.push(
      {
        id: `rate-${selectedPartnerId}-${otherPartnerId}`,
        fromPartnerId: selectedPartnerId,
        toPartnerId: otherPartnerId,
        rate: outRate,
      },
      {
        id: `rate-${otherPartnerId}-${selectedPartnerId}`,
        fromPartnerId: otherPartnerId,
        toPartnerId: selectedPartnerId,
        rate: inRate,
      }
    );

    setRates(updatedRates);
    localStorage.setItem("pistos_exchange_rates", JSON.stringify(updatedRates));

    // Show temporary success feedback
    setSaveStatus((prev) => ({ ...prev, [otherPartnerId]: true }));
    setTimeout(() => {
      setSaveStatus((prev) => ({ ...prev, [otherPartnerId]: false }));
    }, 2000);
  };

  // Reset bidirectional rates to defaults
  const handleResetPairRates = (otherPartnerId: string) => {
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

    // Filter and update
    let updatedRates = rates.filter(
      (r) =>
        !(
          r.fromPartnerId === selectedPartnerId &&
          r.toPartnerId === otherPartnerId
        ) &&
        !(
          r.fromPartnerId === otherPartnerId &&
          r.toPartnerId === selectedPartnerId
        )
    );

    updatedRates.push(
      {
        id: `rate-${selectedPartnerId}-${otherPartnerId}`,
        fromPartnerId: selectedPartnerId,
        toPartnerId: otherPartnerId,
        rate: defaultOut,
      },
      {
        id: `rate-${otherPartnerId}-${selectedPartnerId}`,
        fromPartnerId: otherPartnerId,
        toPartnerId: selectedPartnerId,
        rate: defaultIn,
      }
    );

    setRates(updatedRates);
    localStorage.setItem("pistos_exchange_rates", JSON.stringify(updatedRates));

    setSaveStatus((prev) => ({ ...prev, [otherPartnerId]: true }));
    setTimeout(() => {
      setSaveStatus((prev) => ({ ...prev, [otherPartnerId]: false }));
    }, 1500);
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
      <AdminSidebar activeTab="exchange" />

      {/* Main Content */}
      <main className="flex-grow flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-neutral-200/50 bg-white px-8 flex items-center justify-between sticky top-0 z-30">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
              <span>Admin</span>
              <ChevronRight className="w-3 h-3 text-neutral-300" />
              <span className="text-neutral-500">Exchange Matrix</span>
              {selectedPartner && (
                <>
                  <ChevronRight className="w-3 h-3 text-neutral-300" />
                  <span className="text-neutral-700 font-bold">
                    {selectedPartner.name}
                  </span>
                </>
              )}
            </div>
            <h2 className="text-lg font-black text-neutral-900 mt-0.5 leading-none">
              {selectedPartner
                ? `${selectedPartner.name} Relations`
                : "Points Exchange Configuration"}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {!selectedPartner && (
              <div className="relative w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search partners..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F1F3F4] text-neutral-700 pl-9 pr-4 py-2 rounded-xl text-xs outline-none border border-transparent focus:bg-white focus:border-neutral-200 transition-colors font-medium placeholder:text-neutral-400"
                />
              </div>
            )}
            <button className="relative text-neutral-600 hover:text-neutral-800 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-brand-primary" />
            </button>
          </div>
        </header>

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
                    <tr className="border-b border-neutral-100 bg-neutral-50/50">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-16">
                        #
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-52">
                        Merchant Name
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-24">
                        Code
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-32">
                        Status
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
                                      <span className="text-neutral-800 font-black">
                                        {rate.toFixed(2)}
                                      </span>
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

              {/* Mappings Table */}
              <section className="bg-white border border-neutral-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-grow">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-100 bg-neutral-50/50">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-700 w-52">
                          Target Partner
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
                        .map((other) => {
                          const outKey = `${selectedPartner.id}_${other.id}`;
                          const inKey = `${other.id}_${selectedPartner.id}`;
                          const isSaved = saveStatus[other.id] || false;

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
                                    <p className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase mt-0.5">
                                      Code: {other.code}
                                    </p>
                                  </div>
                                </div>
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
                                    value={rateInputs[outKey] || "1.0"}
                                    onChange={(e) =>
                                      handleInputChange(
                                        selectedPartner.id,
                                        other.id,
                                        e.target.value
                                      )
                                    }
                                    className="w-24 bg-[#F9F9F9] border border-neutral-200 rounded-xl px-3 py-2 text-sm font-black text-neutral-800 outline-none focus:border-[#8B3D06] focus:bg-white text-center"
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
                                    value={rateInputs[inKey] || "1.0"}
                                    onChange={(e) =>
                                      handleInputChange(
                                        other.id,
                                        selectedPartner.id,
                                        e.target.value
                                      )
                                    }
                                    className="w-24 bg-[#F9F9F9] border border-neutral-200 rounded-xl px-3 py-2 text-sm font-black text-neutral-800 outline-none focus:border-[#8B3D06] focus:bg-white text-center"
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
                                    className={cn(
                                      "inline-flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-xl text-xs cursor-pointer shadow-sm transition-all border",
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
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold border border-neutral-200 rounded-xl text-xs cursor-pointer transition-colors"
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
      </main>
    </div>
  );
}

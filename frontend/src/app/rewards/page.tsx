"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMember } from "@/lib/hooks/useMember";
import { DesktopNavbar } from "@/components/organisms/DesktopNavbar";
import { MemberSidebar } from "@/components/organisms/MemberSidebar";
import { BottomNavigation } from "@/components/organisms/BottomNavigation";
import apiClient from "@/lib/apiClient";
import { Search, ArrowRight, Coins, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import Avatar from "@/components/atoms/Avatar";
import Link from "next/link";
import { RewardRedeemModal } from "@/components/organisms/RewardRedeemModal";

export default function MemberRewardsPage() {
  const { member, memberId, isLoaded, logout } = useMember();

  const [searchQuery, setSearchQuery] = useState("");
  const [activePartnerFilter, setActivePartnerFilter] = useState("ALL");
  const [showPointsBanner, setShowPointsBanner] = useState(true);

  // Selected reward state for Screen 4 bottom sheet confirmation modal
  const [selectedReward, setSelectedReward] = useState<any | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const POLLING_INTERVAL =
    Number(process.env.NEXT_PUBLIC_REFETCH_INTERVAL) || 5000;

  // Fetch real reward catalog from backend
  const { data: rewardsData, refetch: refetchRewards } = useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      const response = await apiClient.get("/api/v1/rewards");
      const data = (response.data.data || response.data || []) as any[];
      return data.map((r: any) => {
        const code = r.partnerCode?.toUpperCase();
        let badgeBg = "bg-brand-primary text-white";
        if (code === "KFC") badgeBg = "bg-red-500 text-white";
        else if (code === "MCD") badgeBg = "bg-yellow-500 text-black";
        return {
          ...r,
          badgeBg,
        };
      });
    },
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });

  // Fetch balances for calculating points availability (Budi has KFC: 350 pts, McD: 120 pts)
  const { data: balanceData, refetch: refetchBalances } = useQuery({
    queryKey: ["balances", memberId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/members/${memberId}/points`);
      return response.data.balances as {
        partnerId: string;
        partnerName: string;
        balance: number;
      }[];
    },
    enabled: !!memberId,
    retry: 1,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });

  // Fetch active partner list from API
  const { data: apiPartners } = useQuery({
    queryKey: ["rewards-partners"],
    queryFn: async () => {
      const response = await apiClient.get("/api/v1/partners");
      return (response.data.partners || response.data.data || []) as any[];
    },
    retry: 1,
    enabled: isLoaded,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPartnerId = sessionStorage.getItem("selected_partner_filter");
      if (storedPartnerId && apiPartners) {
        const foundPartner = apiPartners.find(
          (p: any) => p.id === storedPartnerId
        );
        if (foundPartner) {
          setActivePartnerFilter(foundPartner.code);
        } else {
          setActivePartnerFilter(storedPartnerId);
        }
        sessionStorage.removeItem("selected_partner_filter");
      }
    }
  }, [apiPartners]);

  const selectedPartnerBalance = React.useMemo(() => {
    if (!balanceData || !apiPartners || activePartnerFilter === "ALL")
      return null;
    const partnerObj = apiPartners.find((p) => p.code === activePartnerFilter);
    if (!partnerObj) return 0;
    const found = balanceData.find((b) => b.partnerId === partnerObj.id);
    return found ? found.balance : 0;
  }, [balanceData, apiPartners, activePartnerFilter]);

  const selectedPartnerName = React.useMemo(() => {
    if (!apiPartners || activePartnerFilter === "ALL") return "";
    const partnerObj = apiPartners.find((p) => p.code === activePartnerFilter);
    return partnerObj ? partnerObj.name : "";
  }, [apiPartners, activePartnerFilter]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#8B3D06] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const rewardsList = rewardsData || [];

  // Filter rewards dynamically based on active filter
  const filteredRewards = rewardsList.filter((reward) => {
    // Only show ACTIVE rewards
    if (reward.status !== "ACTIVE") return false;

    // Only show rewards belonging to ACTIVE partners
    if (apiPartners) {
      const partnerObj = apiPartners.find(
        (p: any) =>
          p.id === reward.partnerId ||
          p.code === reward.partnerCode ||
          (reward.partnerName &&
            p.name.toLowerCase() === reward.partnerName.toLowerCase())
      );
      if (partnerObj && partnerObj.status !== "ACTIVE") {
        return false;
      }
    }

    const matchesSearch = reward.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesPartner =
      activePartnerFilter === "ALL" ||
      (reward.partnerName &&
        reward.partnerName
          .toLowerCase()
          .includes(activePartnerFilter.toLowerCase())) ||
      (reward.partnerCode &&
        reward.partnerCode
          .toLowerCase()
          .includes(activePartnerFilter.toLowerCase()));
    return matchesSearch && matchesPartner;
  });

  // Calculate variables for the selected redemption details dynamically
  const currentBalance = (() => {
    if (!selectedReward || !balanceData) return 0;
    const found = balanceData.find(
      (b) =>
        b.partnerId === selectedReward.partnerId ||
        (selectedReward.partnerName &&
          b.partnerName
            .toLowerCase()
            .includes(selectedReward.partnerName.toLowerCase()))
    );
    return found ? found.balance : 0;
  })();

  const neededPoints = selectedReward
    ? selectedReward.pointCost - currentBalance
    : 0;
  const isInsufficient = neededPoints > 0;
  const remainingPoints = selectedReward
    ? currentBalance - selectedReward.pointCost
    : 0;

  const combinedBalance =
    balanceData?.reduce((sum, item) => sum + item.balance, 0) ?? 0;

  const handleRedeemConfirm = async () => {
    if (isInsufficient || !selectedReward) return;
    setIsRedeeming(true);
    setRedeemError(null);
    try {
      await apiClient.post(
        "/api/v1/redeem",
        { rewardId: selectedReward.id }
      );
      setRedeemSuccess(true);
      refetchBalances();
    } catch (err: any) {
      setRedeemError(err.response?.data?.message || "Redemption failed");
    } finally {
      setIsRedeeming(false);
    }
  };

  const closeRedeemModal = () => {
    setSelectedReward(null);
    setRedeemSuccess(false);
    setRedeemError(null);
  };

  return (
    <div className="h-screen bg-[#FDFDFD] md:bg-neutral-50 font-sans flex overflow-hidden">
      {/* DESKTOP SIDEBAR (Hidden on Mobile) */}
      <MemberSidebar
        className="hidden md:flex"
        activeTab="rewards"
        userName={member?.name || "Budi Santoso"}
      />

      {/* MAIN LAYOUT WRAPPER */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* DESKTOP TOP BAR HEADER (Hidden on Mobile) */}
        <DesktopNavbar
          userName={member?.name || "Budi Santoso"}
          onLogout={logout}
          showBrand={false}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search rewards..."
          showSearch={true}
          breadcrumbs={[{ label: "Marketplace" }, { label: "Rewards" }]}
          title="Rewards Catalog"
        />

        {/* ========================================================
            MOBILE VIEW (Visible on Mobile inspect, hidden on Desktop)
            ======================================================== */}
        <div className="md:hidden flex-grow flex flex-col pb-32 overflow-y-auto">
          {/* Top Navbar */}
          <div className="px-5 pt-6 space-y-5">
            <div className="flex justify-between">
              <h1 className="text-2xl font-black text-neutral-950 tracking-tight">
                Rewards
              </h1>

              {activePartnerFilter === "ALL" ? (
                <div className="text-right">
                  <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wide">
                    Points
                  </span>
                  <span className="text-xs font-semibold text-neutral-500 italic">
                    Select partner
                  </span>
                </div>
              ) : (
                <div className="text-right">
                  <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wide">
                    {activePartnerFilter} Points
                  </span>
                  <span className="text-base font-black text-[#8B3D06]">
                    {(selectedPartnerBalance ?? 0).toLocaleString()}{" "}
                    <span className="text-[10px] font-bold text-neutral-500">
                      pts
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Mobile Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search rewards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F5F5F5] text-xs text-neutral-800 pl-10 pr-4 py-3 rounded-2xl border border-transparent outline-none focus:bg-white focus:border-neutral-200 focus:ring-1 focus:ring-neutral-200 transition-all font-semibold placeholder:text-neutral-400"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setActivePartnerFilter("ALL")}
                className={cn(
                  "px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border border-transparent shrink-0",
                  activePartnerFilter === "ALL"
                    ? "bg-[#8B3D06] text-white"
                    : "bg-[#F5F5F5] text-neutral-700 hover:bg-neutral-100"
                )}
              >
                All
              </button>
              {apiPartners
                ?.filter((p: any) => p.status === "ACTIVE")
                .map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePartnerFilter(p.code)}
                    className={cn(
                      "px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border border-transparent shrink-0",
                      activePartnerFilter === p.code
                        ? "bg-[#8B3D06] text-white"
                        : "bg-[#F5F5F5] text-neutral-700 hover:bg-neutral-100"
                    )}
                  >
                    {p.name.split(" ")[0]}
                  </button>
                ))}
            </div>

            {/* Mobile Grid */}
            <div className="grid grid-cols-2 gap-4">
              {filteredRewards.map((reward) => (
                <div
                  key={reward.id}
                  onClick={() => setSelectedReward(reward)}
                  className="bg-white rounded-2xl overflow-hidden border border-neutral-200/50 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between cursor-pointer border-t-4 border-t-neutral-100 hover:border-t-brand-primary active:scale-98 transition-all"
                >
                  <div className="p-3">
                    {/* Food Image */}
                    <div className="h-28 w-full rounded-xl overflow-hidden bg-neutral-50 relative mb-3">
                      <img
                        src={reward.imageUrl}
                        alt={reward.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <span
                      className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-md",
                        reward.badgeBg
                      )}
                    >
                      {reward.partnerName}
                    </span>
                    <h3 className="text-xs font-black text-neutral-900 mt-2 leading-snug line-clamp-2">
                      {reward.name}
                    </h3>
                  </div>

                  <div className="px-3 pb-3 pt-1 flex items-center gap-1.5 text-brand-primary font-bold text-xs">
                    <Coins className="w-3.5 h-3.5" />
                    <span>{reward.pointCost} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Tabs */}
          <BottomNavigation />
        </div>

        {/* ========================================================
            DESKTOP VIEW (Visible on Desktop, hidden on Mobile)
            ======================================================== */}
        <div className="hidden md:flex flex-col flex-1 px-8 py-8 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-4 gap-6 items-stretch">
            {/* Left Main Grid */}
            <div className="col-span-3 space-y-6">
              {/* Desktop Catalog Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRewards.map((reward) => (
                  <div
                    key={reward.id}
                    onClick={() => setSelectedReward(reward)}
                    className="bg-white rounded-2xl overflow-hidden border border-neutral-200/50 shadow-sm flex flex-col justify-between cursor-pointer border-t-4 border-t-neutral-100 hover:shadow-md transition-all group"
                  >
                    <div className="p-4">
                      {/* Image */}
                      <div className="h-36 w-full rounded-xl overflow-hidden bg-neutral-50 relative mb-4">
                        <img
                          src={reward.imageUrl}
                          alt={reward.name}
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        />
                      </div>

                      <span
                        className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded-md",
                          reward.badgeBg
                        )}
                      >
                        {reward.partnerName}
                      </span>
                      <h3 className="text-sm font-black text-neutral-900 mt-2.5 leading-snug">
                        {reward.name}
                      </h3>
                    </div>

                    <div className="px-4 pb-4 pt-1 flex items-center justify-between border-t border-neutral-50 mt-2 pt-3">
                      <div className="flex items-center gap-1.5 text-brand-primary font-bold text-sm">
                        <Coins className="w-4 h-4" />
                        <span>{reward.pointCost} pts</span>
                      </div>
                      <span className="text-xs font-bold text-[#8B3D06] hover:underline flex items-center gap-0.5">
                        Redeem Now
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Right Sidebar Category filters */}
            <div className="space-y-2">
              {activePartnerFilter === "ALL" ? (
                <div className="bg-white border border-neutral-200/60 rounded-2xl p-5 shadow-sm h-[135px] flex flex-col justify-between text-center select-none">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2 leading-none shrink-0">
                    My Balance
                  </h3>
                  <div className="flex items-center gap-3 py-1 flex-grow justify-center">
                    <div className="w-10 h-10 bg-neutral-50 rounded-full border border-neutral-100 flex items-center justify-center shrink-0 text-neutral-400">
                      <Coins className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-semibold text-neutral-500 leading-snug text-left max-w-[130px]">
                      Select a partner filter to see your points.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="items-center bg-white border border-neutral-200/60 rounded-2xl p-5 shadow-sm h-[135px] flex flex-col justify-between select-none">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2 leading-none shrink-0">
                    My Balance
                  </h3>
                  <div className="flex flex-1 flex-col items-center justify-center">
                    <p className="w-full text-center text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      {selectedPartnerName}
                    </p>

                    <p className="flex items-baseline justify-center gap-1.5 text-center text-3xl font-black text-neutral-900 mt-1">
                      {(selectedPartnerBalance ?? 0).toLocaleString()}
                      <span className="text-xs font-bold text-neutral-500">
                        pts
                      </span>
                    </p>
                  </div>
                </div>
              )}
              <div className="relative bg-white border border-neutral-200/60 rounded-2xl shadow-sm justify-between text-center select-none">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search rewards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white text-xs text-neutral-800 pl-10 pr-4 py-3 rounded-2xl border border-transparent outline-none focus:bg-white focus:border-neutral-200 focus:ring-1 focus:ring-neutral-200 transition-all font-semibold placeholder:text-neutral-400"
                />
              </div>
              <div className="bg-white border border-neutral-200/60 rounded-2xl p-5 shadow-sm space-y-5 h-fit">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2">
                    Filter Partner
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 text-xs font-bold text-neutral-700 cursor-pointer">
                      <input
                        type="radio"
                        name="partner"
                        checked={activePartnerFilter === "ALL"}
                        onChange={() => setActivePartnerFilter("ALL")}
                        className="w-4 h-4 text-brand-primary accent-[#8B3D06] cursor-pointer"
                      />
                      <span>All Merchants</span>
                    </label>
                    {apiPartners
                      ?.filter((p: any) => p.status === "ACTIVE")
                      .map((p: any) => (
                        <label
                          key={p.id}
                          className="flex items-center gap-3 text-xs font-bold text-neutral-700 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="partner"
                            checked={activePartnerFilter === p.code}
                            onChange={() => setActivePartnerFilter(p.code)}
                            className="w-4 h-4 text-brand-primary accent-[#8B3D06] cursor-pointer"
                          />
                          <span>{p.name}</span>
                        </label>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RewardRedeemModal
        isOpen={!!selectedReward}
        onClose={closeRedeemModal}
        onConfirm={handleRedeemConfirm}
        reward={selectedReward}
        currentBalance={currentBalance}
        remainingPoints={remainingPoints}
        isInsufficient={isInsufficient}
        neededPoints={neededPoints}
        isRedeeming={isRedeeming}
        redeemSuccess={redeemSuccess}
        redeemError={redeemError}
      />
    </div>
  );
}

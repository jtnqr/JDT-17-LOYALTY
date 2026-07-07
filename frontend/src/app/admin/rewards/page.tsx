"use client";

import React, { useState } from "react";
import { AdminSidebar } from "@/components/organisms/AdminSidebar";
import {
  Search,
  Bell,
  Plus,
  Lock,
  ChevronRight,
  ChevronLeft,
  Utensils,
  Coffee,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock CMS Catalog matching public/Reward Catalog (Desktop).png
const ADMIN_REWARDS = [
  {
    id: "cms-reward-1",
    name: "Zinger Burger Combo",
    partnerName: "KFC",
    pointCost: 500,
    description: "Classic Zinger burger with medium fries and soda.",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80",
    accentColor: "border-t-[#C8102E]",
    badgeBg: "bg-red-50 text-[#C8102E]",
    category: "Food",
    isLocked: false,
    tierRequired: "Bronze",
  },
  {
    id: "cms-reward-2",
    name: "Big Mac Meal",
    partnerName: "McDonald's",
    pointCost: 750,
    description: "Two beef patties with signature sauce and large fries.",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80",
    accentColor: "border-t-[#FFC72C]",
    badgeBg: "bg-yellow-50 text-[#D89F0E]",
    category: "Food",
    isLocked: false,
    tierRequired: "Bronze",
  },
  {
    id: "cms-reward-3",
    name: "Family Feast Bucket",
    partnerName: "KFC",
    pointCost: 1200,
    description: "8-10 Pieces of chicken with 3 large sides.",
    imageUrl: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400&auto=format&fit=crop&q=80",
    accentColor: "border-t-[#C8102E]",
    badgeBg: "bg-red-50 text-[#C8102E]",
    category: "Food",
    isLocked: true,
    tierRequired: "Silver",
  },
  {
    id: "cms-reward-4",
    name: "Deluxe Breakfast Platter",
    partnerName: "McDonald's",
    pointCost: 900,
    description: "Pancakes, eggs, sausage, and large coffee.",
    imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&auto=format&fit=crop&q=80",
    accentColor: "border-t-[#FFC72C]",
    badgeBg: "bg-yellow-50 text-[#D89F0E]",
    category: "Food",
    isLocked: true,
    tierRequired: "Silver",
  },
  {
    id: "cms-reward-5",
    name: "Large Oreo McFlurry",
    partnerName: "McDonald's",
    pointCost: 300,
    description: "Creamy vanilla soft serve with crushed Oreo cookies.",
    imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&auto=format&fit=crop&q=80",
    accentColor: "border-t-[#FFC72C]",
    badgeBg: "bg-yellow-50 text-[#D89F0E]",
    category: "Beverage",
    isLocked: false,
    tierRequired: "Bronze",
  },
  {
    id: "cms-reward-6",
    name: "Extra Large Soft Drink",
    partnerName: "KFC",
    pointCost: 150,
    description: "Choose from Pepsi, 7-Up, or Mirinda.",
    imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80",
    accentColor: "border-t-[#C8102E]",
    badgeBg: "bg-red-50 text-[#C8102E]",
    category: "Beverage",
    isLocked: false,
    tierRequired: "Bronze",
  },
];

export default function AdminRewardsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  
  // Tier Filter Checkboxes
  const [selectedTiers, setSelectedTiers] = useState<string[]>(["Bronze", "Silver"]);

  const toggleTier = (tier: string) => {
    setSelectedTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  const handleCategorySelect = (categoryName: string) => {
    setActiveCategory(categoryName);
  };

  // Filter rewards list
  const filteredRewards = ADMIN_REWARDS.filter((reward) => {
    const matchesSearch =
      reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reward.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reward.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory =
      activeCategory === "All" ||
      (activeCategory === "KFC" && reward.partnerName === "KFC") ||
      (activeCategory === "McDonald's" && reward.partnerName === "McDonald's") ||
      (activeCategory === "Food" && reward.category === "Food") ||
      (activeCategory === "Beverage" && reward.category === "Beverage");

    const matchesTier = selectedTiers.includes(reward.tierRequired);

    return matchesSearch && matchesCategory && matchesTier;
  });

  return (
    <div className="min-h-screen bg-neutral-50 flex font-sans">
      {/* Reusable Admin Sidebar */}
      <AdminSidebar activeTab="rewards" />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Header Bar */}
        <header className="h-16 border-b border-neutral-200/50 bg-white px-8 flex items-center justify-between sticky top-0 z-30">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
              <span>Admin</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-neutral-600">Rewards</span>
            </div>
            <h2 className="text-lg font-black text-[#8B3D06] mt-0.5 leading-none">
              Reward Catalog
            </h2>
          </div>

          {/* Search bar and Notification */}
          <div className="flex items-center gap-6">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search rewards, partners, or points..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F1F3F4] text-neutral-700 pl-9 pr-4 py-2 rounded-full text-xs outline-none border border-transparent focus:bg-white focus:border-neutral-200 focus:ring-1 focus:ring-neutral-200 transition-all font-medium placeholder:text-neutral-400"
              />
            </div>
            <button className="relative text-neutral-600 hover:text-neutral-800 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-brand-primary" />
            </button>
          </div>
        </header>

        {/* Content Body Grid */}
        <div className="p-8 flex-grow flex gap-8 items-start">
          
          {/* Left panel: Filters (Categories & Tiers) */}
          <div className="w-60 bg-white border border-neutral-200/60 rounded-2xl p-5 shadow-sm space-y-6 shrink-0">
            {/* Categories list */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2.5">
                Categories
              </h3>
              <div className="space-y-1">
                {[
                  { name: "All", label: "All Rewards", count: 42 },
                  { name: "KFC", label: "KFC", count: 12 },
                  { name: "McDonald's", label: "McDonald's", count: 15 },
                  { name: "Food", label: "Food", count: 24 },
                  { name: "Beverage", label: "Beverage", count: 8 },
                ].map((cat) => {
                  const isActive = activeCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => handleCategorySelect(cat.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold select-none transition-colors cursor-pointer",
                        isActive
                          ? "bg-[#FCF5F1] text-[#8B3D06] font-bold"
                          : "text-neutral-600 hover:bg-neutral-50"
                      )}
                    >
                      <span>{cat.label}</span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", isActive ? "bg-[#8B3D06] text-white" : "bg-neutral-100 text-neutral-500")}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tiers Checkboxes */}
            <div className="space-y-3.5 pt-2">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2.5">
                Tiers
              </h3>
              <div className="space-y-3">
                {["Bronze", "Silver", "Gold"].map((tier) => {
                  const isChecked = selectedTiers.includes(tier);
                  return (
                    <label key={tier} className="flex items-center gap-3 text-xs font-bold text-neutral-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTier(tier)}
                        className="w-4 h-4 rounded text-brand-primary border-neutral-300 accent-[#8B3D06] focus:ring-[#8B3D06] cursor-pointer"
                      />
                      <span>{tier}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right panel: Catalog Grid */}
          <div className="flex-1 flex flex-col justify-between self-stretch space-y-6">
            
            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRewards.map((reward) => {
                if (reward.isLocked) {
                  return (
                    // Locked Card style (Grayscale, padlocked in the center)
                    <div
                      key={reward.id}
                      className="bg-white rounded-2xl border border-neutral-200/50 shadow-sm overflow-hidden flex flex-col justify-between h-80 relative select-none opacity-80 group cursor-not-allowed"
                    >
                      {/* Image header with Lock overlay */}
                      <div className="h-36 relative bg-neutral-900 overflow-hidden shrink-0">
                        <img
                          src={reward.imageUrl}
                          alt={reward.name}
                          className="absolute inset-0 w-full h-full object-cover grayscale opacity-30"
                        />
                        {/* Lock Circle in Center */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-neutral-600 shadow-md">
                            <Lock className="w-4.5 h-4.5" />
                          </div>
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1 text-[10px] font-black text-neutral-400 uppercase">
                            <Utensils className="w-3 h-3 text-neutral-300" />
                            <span>{reward.tierRequired} Tier Only</span>
                          </div>
                          <h3 className="text-sm font-black text-neutral-400 tracking-tight leading-snug line-clamp-1">
                            {reward.name}
                          </h3>
                          <p className="text-[11px] text-neutral-400 leading-snug line-clamp-2">
                            Reach 2,500 pts to unlock. {reward.description}
                          </p>
                        </div>
                      </div>

                      {/* Grayed Price Row */}
                      <div className="px-4 pb-4 pt-3 flex items-center justify-between border-t border-neutral-100/50 mt-auto shrink-0 bg-neutral-50/20 text-xs font-bold text-neutral-400">
                        <span>{reward.pointCost} pts</span>
                        <Lock className="w-3.5 h-3.5 text-neutral-300" />
                      </div>
                    </div>
                  );
                }

                // Active Card style
                return (
                  <div
                    key={reward.id}
                    className={cn(
                      "bg-white rounded-2xl border border-neutral-200/50 shadow-sm overflow-hidden flex flex-col justify-between h-80 transition-all hover:shadow-md border-t-4 group cursor-pointer",
                      reward.accentColor
                    )}
                  >
                    {/* Image with REDEEM Badge overlay */}
                    <div className="h-36 relative bg-neutral-50 overflow-hidden shrink-0">
                      <img
                        src={reward.imageUrl}
                        alt={reward.name}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      />
                      <span className="absolute top-3 right-3 text-[9px] font-black uppercase text-white bg-[#8B3D06] px-2 py-0.5 rounded shadow-sm tracking-wider">
                        REDEEM
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          {reward.category === "Food" ? (
                            <Utensils className="w-3.5 h-3.5 text-neutral-400" />
                          ) : (
                            <Coffee className="w-3.5 h-3.5 text-neutral-400" />
                          )}
                          <span className="text-[10px] font-extrabold text-neutral-400 uppercase leading-none">
                            {reward.partnerName}
                          </span>
                        </div>
                        
                        <h3 className="text-sm font-black text-neutral-900 tracking-tight leading-snug line-clamp-1">
                          {reward.name}
                        </h3>
                        
                        <p className="text-[11px] text-neutral-500 leading-snug line-clamp-2">
                          {reward.description}
                        </p>
                      </div>
                    </div>

                    {/* Price Row */}
                    <div className="px-4 pb-4 pt-3 flex items-center justify-between border-t border-neutral-100 mt-auto shrink-0 bg-white group-hover:bg-neutral-50/10 text-xs font-bold text-neutral-700">
                      <span className="text-brand-primary text-sm font-black">{reward.pointCost} pts</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="border-t border-neutral-200/50 pt-4 flex items-center justify-between bg-neutral-50/10 text-xs font-bold text-neutral-500 mt-auto">
              <span>Showing 1-12 of 42 rewards</span>
              
              <div className="flex items-center gap-1">
                <button className="p-2 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="px-3.5 py-2 border border-neutral-200 rounded-lg bg-white font-black text-[#8B3D06] shadow-sm">
                  1
                </button>
                <button className="px-3.5 py-2 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 transition-colors cursor-pointer">
                  2
                </button>
                <button className="px-3.5 py-2 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 transition-colors cursor-pointer">
                  3
                </button>
                <span className="px-1 text-neutral-400 select-none">...</span>
                <button className="px-3.5 py-2 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 transition-colors cursor-pointer">
                  8
                </button>
                <button className="p-2 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 transition-colors cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}

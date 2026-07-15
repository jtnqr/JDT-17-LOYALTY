"use client";

import React from "react";
import { Coins, X, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RewardRedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reward: {
    id: string;
    name: string;
    pointCost: number;
    partnerName: string;
    imageUrl: string;
    badgeBg: string;
  };
  currentBalance: number;
  remainingPoints: number;
  isInsufficient: boolean;
  neededPoints: number;
  isRedeeming: boolean;
  redeemSuccess: boolean;
  redeemError: string | null;
}

export function RewardRedeemModal({
  isOpen,
  onClose,
  onConfirm,
  reward,
  currentBalance,
  remainingPoints,
  isInsufficient,
  neededPoints,
  isRedeeming,
  redeemSuccess,
  redeemError,
}: RewardRedeemModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center animate-in fade-in duration-200">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs"
      />

      <div className="absolute w-full max-w-md bg-white rounded-t-[32px] md:rounded-3xl p-6 shadow-2xl flex flex-col relative z-10 animate-in slide-in-from-bottom duration-300 md:duration-200 select-none">
        <div className="md:hidden rounded-full mx-auto mb-5 mt-[-8px]" />

        <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
          <h2 className="text-base font-extrabold text-neutral-900">
            {redeemSuccess ? "Redemption Successful" : "Confirm Redemption"}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 cursor-pointer" aria-hidden="true" />
          </button>
        </div>

        {redeemSuccess ? (
          <div className="text-center py-6 space-y-4 animate-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-base font-black text-neutral-900">
                Reward Redeemed!
              </h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
                You have successfully claimed the {reward.name} for{" "}
                {reward.pointCost} pts.
              </p>
            </div>

            <div className="border border-neutral-100 rounded-2xl bg-neutral-50/50 p-4 text-xs font-semibold text-neutral-600">
              Remaining {reward.partnerName} balance:{" "}
              <span className="font-extrabold text-neutral-900">
                {remainingPoints} pts
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-[#8B3D06] hover:bg-[#723204] text-white rounded-xl py-3.5 font-bold cursor-pointer transition-colors text-xs"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-28 h-28 rounded-xl overflow-hidden bg-neutral-50 shrink-0 border border-neutral-100">
                <img
                  src={reward.imageUrl}
                  alt={reward.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-grow flex flex-col justify-between py-1">
                <div>
                  <span
                    className={cn(
                      "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                      reward.badgeBg
                    )}
                  >
                    {reward.partnerName}
                  </span>
                  <h3 className="text-sm font-black text-neutral-900 mt-1 leading-snug">
                    {reward.name}
                  </h3>
                </div>
                <div className="flex items-center gap-1 text-brand-primary font-bold text-xs">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{reward.pointCost} pts</span>
                </div>
              </div>
            </div>

            {redeemError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200/50 text-red-700 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="font-bold">Redemption Failed</p>
                  <p className="text-[10px] mt-0.5 text-red-600/90 leading-tight">
                    {redeemError}
                  </p>
                </div>
              </div>
            )}

            {isInsufficient && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200/50 text-red-700 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="font-bold">Insufficient Balance</p>
                  <p className="text-[10px] mt-0.5 text-red-600/90 leading-tight">
                    You need {neededPoints} more {reward.partnerName} points to
                    redeem this reward.
                  </p>
                </div>
              </div>
            )}

            <div className="border border-neutral-100 rounded-2xl bg-neutral-50 p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-neutral-500 font-semibold">
                <span>Your {reward.partnerName} Points</span>
                <span className="font-bold text-neutral-800">
                  {currentBalance} pts
                </span>
              </div>

              <div className="flex justify-between items-center text-red-500 font-semibold">
                <span>Redemption Cost</span>
                <span>-{reward.pointCost} pts</span>
              </div>

              <div className="h-[1px] bg-neutral-200/50" />

              <div className="flex justify-between items-center font-bold text-neutral-700">
                <span>After Redemption</span>
                <span
                  className={cn(
                    isInsufficient
                      ? "text-red-500 font-black"
                      : "text-emerald-600 font-black"
                  )}
                >
                  {isInsufficient
                    ? `${currentBalance - reward.pointCost}`
                    : remainingPoints}{" "}
                  pts
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={onConfirm}
                disabled={isInsufficient || isRedeeming}
                className="w-full bg-[#8B3D06] hover:bg-[#723204] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3.5 font-bold cursor-pointer transition-all text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                {isRedeeming ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Confirm Redemption"
                )}
              </button>

              <button
                onClick={onClose}
                className="w-full text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-xl py-3.5 font-bold transition-colors text-xs text-center cursor-pointer border border-neutral-200/30"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

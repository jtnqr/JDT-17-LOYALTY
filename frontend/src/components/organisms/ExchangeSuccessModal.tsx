"use client";

import React from "react";
import { CheckCircle2, Coins } from "lucide-react";

interface ExchangeSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  amountNumber: number;
  receiveAmount: number;
  fromPartnerName: string;
  toPartnerName: string;
  activeRate: number;
}

export function ExchangeSuccessModal({
  isOpen,
  onClose,
  amountNumber,
  receiveAmount,
  fromPartnerName,
  toPartnerName,
  activeRate,
}: ExchangeSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center select-none">
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h3 className="text-xl font-black text-neutral-900">
          Exchange Successful!
        </h3>

        <p className="text-xs text-neutral-500 mt-2 leading-relaxed px-4">
          Your points have been successfully converted and transferred instantly.
        </p>

        <div className="mt-6 rounded-2xl border border-neutral-100 bg-neutral-50/50 p-5 space-y-3.5 text-left text-xs font-semibold">
          <div className="flex justify-between items-center pb-2.5 border-b border-neutral-100">
            <span className="text-neutral-400">Converted From</span>
            <span className="font-extrabold text-neutral-800">
              {amountNumber.toLocaleString()} {fromPartnerName} pts
            </span>
          </div>

          <div className="flex justify-between items-center pb-2.5 border-b border-neutral-100">
            <span className="text-neutral-400">Received To</span>
            <span className="font-extrabold text-[#8B3D06] flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" />
              {receiveAmount.toLocaleString()} {toPartnerName} pts
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-neutral-400">Conversion Rate</span>
            <span className="font-extrabold text-neutral-800">
              1 : {activeRate}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#8B3D06] hover:bg-[#723204] text-white rounded-xl py-3.5 font-bold cursor-pointer transition-colors text-xs mt-6"
        >
          Done
        </button>
      </div>
    </div>
  );
}

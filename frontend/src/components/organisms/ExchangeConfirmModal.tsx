"use client";

import React from "react";
import { ArrowUpDown } from "lucide-react";

interface ExchangeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amountNumber: number;
  receiveAmount: number;
  fromPartnerCode: string;
  toPartnerCode: string;
  activeRate: number;
  isSubmitting: boolean;
}

export function ExchangeConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  amountNumber,
  receiveAmount,
  fromPartnerCode,
  toPartnerCode,
  activeRate,
  isSubmitting,
}: ExchangeConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5">
          <ArrowUpDown className="w-8 h-8 text-[#8B3D06]" />
        </div>

        <h3 className="text-lg font-black text-center text-neutral-900">
          Confirm Exchange
        </h3>

        <p className="text-sm text-neutral-500 text-center mt-2 leading-relaxed">
          Are you sure you want to exchange your points?
        </p>

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">From</span>
            <span className="font-bold">
              {amountNumber} {fromPartnerCode} pts
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">To</span>
            <span className="font-bold text-[#8B3D06]">
              {receiveAmount} {toPartnerCode} pts
            </span>
          </div>

          <div className="flex justify-between text-sm border-t pt-3">
            <span className="text-neutral-500">Rate</span>
            <span className="font-bold">1 : {activeRate}</span>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="cursor-pointer flex-1 border border-neutral-300 rounded-xl py-3 font-semibold hover:bg-neutral-100 transition"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="cursor-pointer flex-1 bg-[#8B3D06] hover:bg-[#723204] text-white rounded-xl py-3 font-bold transition disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

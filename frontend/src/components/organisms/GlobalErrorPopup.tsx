"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function GlobalErrorPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleError = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: string; message: string }>;
      const { type, message } = customEvent.detail;

      // Map standard codes to user-friendly titles
      let errorTitle = "Error Occurred";
      if (type === "CONNECTION_ERROR") errorTitle = "Connection Error";
      else if (type === "SERVER_ERROR") errorTitle = "Server Error";
      else if (type === "INSUFFICIENT_BALANCE") errorTitle = "Insufficient Balance";
      else if (type === "EXCHANGE_RATE_NOT_CONFIGURED") errorTitle = "Exchange Rate Error";
      else if (type === "MEMBER_INACTIVE") errorTitle = "Account Inactive";
      else if (type === "REWARD_NOT_FOUND" || type === "REWARD_INACTIVE") errorTitle = "Reward Error";

      setTitle(errorTitle);
      setMessage(message);
      setIsOpen(true);
    };

    window.addEventListener("api:error" as any, handleError);
    return () => {
      window.removeEventListener("api:error" as any, handleError);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal Content */}
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-neutral-100 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 p-2 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 shadow-inner">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-black text-neutral-900">
              {title}
            </h3>
            <p className="text-xs font-semibold text-neutral-500 leading-relaxed">
              {message}
            </p>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full bg-[#8B3D06] hover:bg-[#723205] text-white font-bold py-3 px-4 rounded-2xl transition-all cursor-pointer active:translate-y-px shadow-sm text-xs mt-2"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}

export default GlobalErrorPopup;

"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", startAdornment, endAdornment, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const currentType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="relative flex items-stretch w-full">
        {startAdornment && (
          <div className="flex items-center justify-center px-3 border-y border-l border-neutral-200 bg-neutral-100/80 rounded-l-[10px] text-sm text-neutral-700 font-medium select-none">
            {startAdornment}
          </div>
        )}
        <div className="relative flex-1">
          <input
            type={currentType}
            className={cn(
              "w-full px-4 py-3 text-[15px] font-medium text-neutral-900 bg-neutral-50/50 border border-neutral-200 outline-none transition-all placeholder:text-neutral-400",
              startAdornment ? "rounded-r-[10px]" : "rounded-[10px]",
              (endAdornment || isPassword) ? "pr-11" : "",
              error
                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : "focus:border-brand-primary focus:ring-1 focus:ring-brand-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              className
            )}
            ref={ref}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          ) : (
            endAdornment && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                {endAdornment}
              </div>
            )
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = "Input";

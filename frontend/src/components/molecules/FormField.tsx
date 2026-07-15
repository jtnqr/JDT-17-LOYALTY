"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export interface FormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "error"> {
  label?: string;
  error?: string;
  containerClassName?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, containerClassName, id, type = "text", startAdornment, endAdornment, className, ...props }, ref) => {
    const fieldId = id || React.useId();
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const currentType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className={cn("flex flex-col w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={fieldId}
            className="text-[13px] font-semibold text-neutral-700 select-none cursor-pointer mb-1.5 block"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-stretch w-full">
          {startAdornment && (
            <div className="flex items-center justify-center px-3 border-y border-l border-neutral-200 bg-neutral-100/80 rounded-l-[10px] text-sm text-neutral-700 font-medium select-none">
              {startAdornment}
            </div>
          )}
          <div className="relative flex-1">
            <input
              id={fieldId}
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
        {error && (
          <span className="text-xs text-red-500 mt-1.5 font-medium animate-in fade-in slide-in-from-top-1 duration-200">
            {error}
          </span>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

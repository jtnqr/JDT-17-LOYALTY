"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          "w-5 h-5 rounded border border-neutral-300 bg-white text-brand-primary focus:ring-brand-primary accent-brand-primary cursor-pointer select-none transition-all",
          className
        )}
        {...props}
      />
    );
  }
);

Checkbox.displayName = "Checkbox";

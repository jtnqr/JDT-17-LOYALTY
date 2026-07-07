"use client";

import React from "react";
import { Checkbox, type CheckboxProps } from "../atoms/Checkbox";
import { cn } from "@/lib/utils";

interface CheckboxFieldProps extends CheckboxProps {
  label: React.ReactNode;
  error?: string;
  containerClassName?: string;
}

export const CheckboxField = React.forwardRef<
  HTMLInputElement,
  CheckboxFieldProps
>(({ label, error, containerClassName, id, ...props }, ref) => {
  const fieldId = id || React.useId();

  return (
    <div className={cn("flex flex-col w-full", containerClassName)}>
      <div className="flex items-center gap-3">
        <Checkbox id={fieldId} ref={ref} {...props} className="mt-0.5" />
        <label
          htmlFor={fieldId}
          className="text-xs text-neutral-600 font-medium leading-tight select-none cursor-pointer"
        >
          {label}
        </label>
      </div>
      {error && (
        <span className="text-xs text-red-500 mt-1.5 font-medium animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </span>
      )}
    </div>
  );
});

CheckboxField.displayName = "CheckboxField";

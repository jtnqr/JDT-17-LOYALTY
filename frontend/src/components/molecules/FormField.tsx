"use client";

import React from "react";
import { Label } from "../atoms/Label";
import { Input, type InputProps } from "../atoms/Input";
import { cn } from "@/lib/utils";

interface FormFieldProps extends Omit<InputProps, "error"> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, containerClassName, id, ...props }, ref) => {
    const fieldId = id || React.useId();

    return (
      <div className={cn("flex flex-col w-full", containerClassName)}>
        {label && <Label htmlFor={fieldId}>{label}</Label>}
        <Input id={fieldId} ref={ref} error={!!error} {...props} />
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

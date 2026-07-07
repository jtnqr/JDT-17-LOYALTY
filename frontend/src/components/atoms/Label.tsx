import React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "text-[13px] font-semibold text-neutral-700 select-none cursor-pointer mb-1.5 block",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}

"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface PartnerLogoProps {
  logoUrl?: string;
  name: string;
  className?: string;
}

export function PartnerLogo({ logoUrl, name, className }: PartnerLogoProps) {
  const [hasError, setHasError] = useState(false);
  const fallbackChar = name ? name.trim().charAt(0).toUpperCase() : "P";

  return (
    <div className={cn("relative shrink-0 select-none overflow-hidden rounded-full", className)}>
      {logoUrl && !hasError ? (
        <img
          src={logoUrl}
          alt={name}
          className="w-full h-full object-cover border border-neutral-100 rounded-full"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="w-full h-full bg-[#FCF5F1] text-[#8B3D06] flex items-center justify-center text-xs font-black border border-[#8B3D06]/10 rounded-full">
          {fallbackChar}
        </div>
      )}
    </div>
  );
}

export default PartnerLogo;

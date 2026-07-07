import React from "react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  variant?: "light" | "dark";
  showTagline?: boolean;
}

export function BrandLogoIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-white/10 rounded-2xl w-16 h-16 shadow-md border border-white/20",
        className
      )}
    >
      {/* Tilted tag with a heart inside */}
      <svg
        className="w-10 h-10 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Outline of a tilted tag */}
        <path d="M12 2v4M5 8.5l4-4a1.5 1.5 0 0 1 2.1 0l7.4 7.4a1.5 1.5 0 0 1 0 2.1l-4 4a1.5 1.5 0 0 1-2.1 0L5 10.6a1.5 1.5 0 0 1 0-2.1z" />
        {/* Small hole/circle in the tag */}
        <circle cx="9" cy="9" r="1" fill="currentColor" />
        {/* Heart shape inside the tag */}
        <path
          d="M14.5 15.5c-.3-.3-.8-.3-1.1 0l-.4.4-.4-.4c-.3-.3-.8-.3-1.1 0a0.8 0.8 0 0 0 0 1.1l1.5 1.5 1.5-1.5a0.8 0.8 0 0 0 0-1.1z"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    </div>
  );
}

export function BrandLogo({
  className,
  variant = "light",
  showTagline = true,
}: BrandLogoProps) {
  const isLight = variant === "light";

  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <BrandLogoIcon
        className={cn(
          isLight
            ? "bg-white/10 border-white/20"
            : "bg-brand-primary/10 border-brand-primary/20"
        )}
      />
      <h2
        className={cn(
          "text-2xl font-bold mt-4 tracking-tight",
          isLight ? "text-white" : "text-neutral-900"
        )}
      >
        LoyaltyHub
      </h2>
      {showTagline && (
        <p
          className={cn(
            "text-sm mt-1 max-w-[240px]",
            isLight ? "text-white/80" : "text-neutral-500"
          )}
        >
          Your gateway to exclusive rewards and smart point management.
        </p>
      )}
    </div>
  );
}

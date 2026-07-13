import React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  name?: string;
  className?: string;
}

export function Avatar({ name = "", className }: AvatarProps) {
  const getInitials = (fullName: string) => {
    if (!fullName) return "M";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-brand-primary-light text-brand-primary font-bold text-sm border-2 border-white select-none w-10 h-10 shadow-sm",
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
export default Avatar;

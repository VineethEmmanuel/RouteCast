import React from "react";
import { RiskLevel, RISK_COLORS } from "@/types/routing";
import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  risk: RiskLevel;
  className?: string;
  size?: "sm" | "md";
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  risk,
  className,
  size = "md",
}) => {
  const meta = RISK_COLORS[risk] || RISK_COLORS["Low"];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] leading-tight",
    md: "px-2.5 py-1 text-xs leading-tight font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[4px] border font-medium select-none tracking-tight",
        meta.bg,
        meta.text,
        meta.border,
        sizeClasses[size],
        className
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: meta.hex }}
      />
      <span>{risk}</span>
    </span>
  );
};

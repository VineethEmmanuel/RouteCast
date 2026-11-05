import React from "react";
import { RiskLevel, RISK_COLORS } from "@/types/routing";
import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  risk: RiskLevel;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  risk,
  className,
  size = "md",
}) => {
  const meta = RISK_COLORS[risk] || RISK_COLORS["Low"];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
    lg: "px-3 py-1.5 text-sm font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border shadow-sm transition-colors",
        meta.bg,
        meta.text,
        meta.border,
        sizeClasses[size],
        className
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full animate-pulse"
        style={{ backgroundColor: meta.hex }}
      />
      {risk}
    </span>
  );
};

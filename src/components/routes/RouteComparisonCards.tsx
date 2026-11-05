"use client";

import React from "react";
import {
  Clock,
  Navigation,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Award,
} from "lucide-react";
import { EvaluatedRoute, RISK_COLORS, RiskLevel } from "@/types/routing";
import { formatDuration, formatDistanceMiles, cn } from "@/lib/utils";
import { RiskBadge } from "../ui/Badge";

interface RouteComparisonCardsProps {
  routes: EvaluatedRoute[];
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
}

const ROUTE_ACCENTS = {
  1: { text: "text-[#087E8B]", bg: "bg-[#E6F3F5]", dot: "bg-[#087E8B]" },
  2: { text: "text-[#4F46E5]", bg: "bg-[#EEF2FF]", dot: "bg-[#4F46E5]" },
  3: { text: "text-[#475569]", bg: "bg-[#F1F5F9]", dot: "bg-[#475569]" },
};

export const RouteComparisonCards: React.FC<RouteComparisonCardsProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
}) => {
  if (!routes || routes.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#687582]">
          Corridor Comparison ({routes.length} Available Routes)
        </h2>
        <span className="text-xs text-[#9DA7B2]">
          Select route to inspect checkpoints & heatmap
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {routes.map((route) => {
          const isSelected = selectedRouteId === route.id;
          const isRec = route.isRecommended;
          const p = route.riskProfile;
          const accent = ROUTE_ACCENTS[route.index as 1 | 2 | 3] || ROUTE_ACCENTS[1];

          // Safety Status Label
          let safetyLabel = "Safe for Transit";
          let safetyText = "text-[#16865D]";
          let safetyBg = "bg-[#EBF6F1] border-[#CBE9DC]";
          let SafetyIcon = ShieldCheck;

          if (p.isUnsafe || p.noTravelMiles > 0) {
            safetyLabel = "No Travel Advisory";
            safetyText = "text-[#861F2D]";
            safetyBg = "bg-[#F8E9EB] border-[#E5B5BC]";
            SafetyIcon = ShieldAlert;
          } else if (p.severeRiskMiles > 0 || p.highRiskMiles > 0) {
            safetyLabel = "Adverse Weather";
            safetyText = "text-[#E47B35]";
            safetyBg = "bg-[#FDF1E9] border-[#F8D2BA]";
            SafetyIcon = AlertTriangle;
          }

          return (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              className={cn(
                "cursor-pointer rounded-lg border bg-white p-4 transition-all duration-150 flex flex-col justify-between select-none relative",
                isSelected
                  ? "border-[#087E8B] ring-1 ring-[#087E8B] shadow-card"
                  : "border-[#E7EBEF] hover:border-[#D4D9DE] hover:shadow-subtle",
                isRec && !isSelected && "border-[#BCE1E5]"
              )}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("h-2 w-2 rounded-full", accent.dot)} />
                    <span className="text-xs font-semibold text-[#17212B]">
                      {route.name}
                    </span>
                  </div>

                  {isRec && (
                    <span className="inline-flex items-center gap-1 rounded bg-[#E6F3F5] border border-[#BCE1E5] px-1.5 py-0.5 text-[10px] font-semibold text-[#087E8B]">
                      <Award className="h-3 w-3" />
                      Recommended
                    </span>
                  )}
                </div>

                {/* Primary Metrics: Distance & Duration */}
                <div className="grid grid-cols-2 gap-2 py-2.5 my-1 border-y border-[#F4F5F7]">
                  <div>
                    <div className="text-[11px] text-[#687582]">Total Distance</div>
                    <div className="text-base font-semibold font-mono tabular-nums text-[#17212B]">
                      {formatDistanceMiles(route.totalDistanceMiles)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#687582]">Duration</div>
                    <div className="text-base font-semibold font-mono tabular-nums text-[#17212B]">
                      {formatDuration(route.totalDurationMinutes)}
                    </div>
                  </div>
                </div>

                {/* Weather Exposure Statistics */}
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#687582] flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#D94B4B]" />
                      Severe Exposure:
                    </span>
                    <span
                      className={cn(
                        "font-mono tabular-nums font-medium",
                        p.severeRiskMiles > 0 ? "text-[#D94B4B] font-semibold" : "text-[#17212B]"
                      )}
                    >
                      {p.severeRiskMiles.toFixed(1)} mi
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#687582] flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#E47B35]" />
                      High Risk Exposure:
                    </span>
                    <span
                      className={cn(
                        "font-mono tabular-nums font-medium",
                        p.highRiskMiles > 0 ? "text-[#E47B35] font-semibold" : "text-[#17212B]"
                      )}
                    >
                      {p.highRiskMiles.toFixed(1)} mi
                    </span>
                  </div>

                  {p.noTravelMiles > 0 && (
                    <div className="flex items-center justify-between bg-[#F8E9EB] px-2 py-0.5 rounded border border-[#E5B5BC]">
                      <span className="text-[#861F2D] font-medium text-[11px]">No Travel Exposure:</span>
                      <span className="font-mono tabular-nums font-bold text-[#861F2D]">
                        {p.noTravelMiles.toFixed(1)} mi
                      </span>
                    </div>
                  )}

                  {/* Average Risk Meter */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-[11px] text-[#687582] mb-1">
                      <span>Average Risk Score</span>
                      <span className="font-mono tabular-nums font-medium text-[#17212B]">
                        {p.averageRiskScore.toFixed(2)} / 4.00
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#E7EBEF] rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-200",
                          p.averageRiskScore < 1
                            ? "bg-[#16865D]"
                            : p.averageRiskScore < 2
                            ? "bg-[#D69B24]"
                            : p.averageRiskScore < 3
                            ? "bg-[#E47B35]"
                            : "bg-[#D94B4B]"
                        )}
                        style={{ width: `${Math.min((p.averageRiskScore / 4) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer: Status & Max Level */}
              <div className="mt-3 pt-2.5 border-t border-[#F4F5F7] flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border",
                    safetyBg,
                    safetyText
                  )}
                >
                  <SafetyIcon className="h-3 w-3" />
                  <span>{safetyLabel}</span>
                </span>

                <RiskBadge risk={p.maxRiskLevel} size="sm" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

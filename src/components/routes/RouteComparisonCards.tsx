"use client";

import React from "react";
import {
  Award,
  Clock,
  Navigation,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Flame,
  CheckCircle2,
  TrendingDown,
} from "lucide-react";
import { EvaluatedRoute, RISK_COLORS, RiskLevel } from "@/types/routing";
import { formatDuration, formatDistanceMiles, cn } from "@/lib/utils";
import { RiskBadge } from "../ui/Badge";

interface RouteComparisonCardsProps {
  routes: EvaluatedRoute[];
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
}

export const RouteComparisonCards: React.FC<RouteComparisonCardsProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
}) => {
  if (!routes || routes.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <span>Alternative Route Evaluations</span>
          <span className="text-xs font-mono font-normal text-slate-500">
            ({routes.length} Available)
          </span>
        </h2>
        <span className="text-xs text-slate-400">
          Click any route card to inspect corridor on map
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {routes.map((route) => {
          const isSelected = selectedRouteId === route.id;
          const isRec = route.isRecommended;
          const p = route.riskProfile;

          // Route color accents
          const routeColorClasses =
            route.index === 1
              ? "border-cyan-500/40 text-cyan-400"
              : route.index === 2
              ? "border-indigo-500/40 text-indigo-400"
              : "border-amber-500/40 text-amber-400";

          // Safety Status Label
          let safetyLabel = "SAFE FOR TRANSIT";
          let safetyBg = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
          let SafetyIcon = ShieldCheck;

          if (p.isUnsafe || p.noTravelMiles > 0) {
            safetyLabel = "NO TRAVEL ADVISORY";
            safetyBg = "bg-rose-950/60 text-rose-400 border-rose-600/50";
            SafetyIcon = ShieldAlert;
          } else if (p.severeRiskMiles > 0 || p.highRiskMiles > 0) {
            safetyLabel = "ADVERSE WEATHER (CAUTION)";
            safetyBg = "bg-amber-500/15 text-amber-400 border-amber-500/30";
            SafetyIcon = AlertTriangle;
          }

          return (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              className={cn(
                "relative cursor-pointer rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between",
                isSelected
                  ? "bg-slate-900 border-cyan-400/90 shadow-xl shadow-cyan-500/10 ring-2 ring-cyan-500/30"
                  : "bg-slate-900/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/80 shadow-md",
                isRec && !isSelected && "border-teal-500/40 bg-teal-950/10"
              )}
            >
              {/* Header Badges */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-lg text-xs font-bold border tracking-wide uppercase",
                      routeColorClasses
                    )}
                  >
                    {route.name}
                  </span>

                  {isRec && (
                    <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/50 px-2.5 py-0.5 text-[11px] font-bold text-teal-300 shadow-sm">
                      <Award className="h-3.5 w-3.5 text-teal-400" />
                      RECOMMENDED
                    </span>
                  )}
                </div>

                {/* Route Summary */}
                <h4 className="text-sm font-semibold text-slate-100 line-clamp-1">
                  {route.summary || "Main Freight Corridor"}
                </h4>

                {/* Distance & Travel Time */}
                <div className="mt-3 grid grid-cols-2 gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Navigation className="h-4 w-4 text-cyan-400" />
                    <div>
                      <div className="text-[10px] text-slate-400">Total Distance</div>
                      <div className="text-sm font-bold font-mono">
                        {formatDistanceMiles(route.totalDistanceMiles)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="h-4 w-4 text-cyan-400" />
                    <div>
                      <div className="text-[10px] text-slate-400">Estimated Duration</div>
                      <div className="text-sm font-bold font-mono">
                        {formatDuration(route.totalDurationMinutes)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Metrics Breakdown */}
                <div className="mt-3.5 space-y-2">
                  {/* Severe & No Travel Miles */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Severe Exposure:
                    </span>
                    <span
                      className={cn(
                        "font-mono font-bold",
                        p.severeRiskMiles > 0 ? "text-red-400" : "text-slate-300"
                      )}
                    >
                      {p.severeRiskMiles.toFixed(1)} mi
                    </span>
                  </div>

                  {/* High Risk Miles */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      High Risk Exposure:
                    </span>
                    <span
                      className={cn(
                        "font-mono font-bold",
                        p.highRiskMiles > 0 ? "text-orange-400" : "text-slate-300"
                      )}
                    >
                      {p.highRiskMiles.toFixed(1)} mi
                    </span>
                  </div>

                  {/* No Travel Miles if any */}
                  {p.noTravelMiles > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                        No Travel Miles:
                      </span>
                      <span className="font-mono font-black text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-600/50">
                        {p.noTravelMiles.toFixed(1)} mi
                      </span>
                    </div>
                  )}

                  {/* Average Risk Score Meter */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">Average Risk Score:</span>
                      <span className="font-mono font-bold text-slate-200">
                        {p.averageRiskScore.toFixed(2)} / 4.00
                      </span>
                    </div>
                    {/* Visual meter bar */}
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
                      <div
                        className={cn(
                          "h-full transition-all duration-300",
                          p.averageRiskScore < 1
                            ? "bg-emerald-400"
                            : p.averageRiskScore < 2
                            ? "bg-amber-400"
                            : p.averageRiskScore < 3
                            ? "bg-orange-400"
                            : "bg-red-500"
                        )}
                        style={{ width: `${Math.min((p.averageRiskScore / 4) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Safety Status */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold tracking-tight",
                    safetyBg
                  )}
                >
                  <SafetyIcon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{safetyLabel}</span>
                </div>

                <RiskBadge risk={p.maxRiskLevel} size="sm" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

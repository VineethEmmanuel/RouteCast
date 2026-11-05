"use client";

import React from "react";
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Clock,
  Compass,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { EvaluatedRoute, RISK_COLORS, RouteAnalysisResult } from "@/types/routing";
import { formatDuration, formatDistanceMiles, cn } from "@/lib/utils";

interface RouteExplainabilityCardProps {
  analysis: RouteAnalysisResult;
}

export const RouteExplainabilityCard: React.FC<RouteExplainabilityCardProps> = ({
  analysis,
}) => {
  const { routes, recommendedRouteId, recommendationExplanation, hasSafeRoute } = analysis;
  const recommendedRoute = routes.find((r) => r.id === recommendedRouteId);

  return (
    <Card className="border-teal-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-teal-950/20 shadow-2xl">
      <CardHeader className="pb-3 border-teal-500/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>Intelligent Dispatch Recommendation & Explainability</span>
          </CardTitle>

          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold border",
              hasSafeRoute
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                : "bg-rose-950/60 text-rose-300 border-rose-600/50"
            )}
          >
            {hasSafeRoute ? "Safe Route Identified" : "Critical Advisory"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-3">
        {/* Dynamic Natural Language Justification */}
        <div className="rounded-xl border border-slate-700/80 bg-slate-950/70 p-4 shadow-inner">
          <div className="flex items-start gap-3">
            {hasSafeRoute ? (
              <ShieldCheck className="h-5 w-5 text-teal-400 mt-0.5 flex-shrink-0" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-rose-400 mt-0.5 flex-shrink-0" />
            )}
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-100">
                {hasSafeRoute && recommendedRoute
                  ? `Recommended: ${recommendedRoute.name}`
                  : "Dispatch Warning: Hazardous Conditions Detected"}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {recommendationExplanation}
              </p>
            </div>
          </div>
        </div>

        {/* Route Risk Mileage Distribution Bar Chart */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
              Route Hazard Exposure Distribution (Miles by Category)
            </span>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Low
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Mod
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-orange-500" /> High
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500" /> Severe
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-700" /> No Travel
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {routes.map((route) => {
              const p = route.riskProfile;
              const total = Math.max(p.totalMiles, 1);

              const lowPct = (p.lowRiskMiles / total) * 100;
              const modPct = (p.moderateRiskMiles / total) * 100;
              const highPct = (p.highRiskMiles / total) * 100;
              const sevPct = (p.severeRiskMiles / total) * 100;
              const noTrvPct = (p.noTravelMiles / total) * 100;

              return (
                <div key={route.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 flex items-center gap-2">
                      <span>{route.name}</span>
                      {route.isRecommended && (
                        <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded border border-teal-500/40">
                          Best
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-slate-400">
                      {formatDistanceMiles(route.totalDistanceMiles)} • {formatDuration(route.totalDurationMinutes)}
                    </span>
                  </div>

                  {/* Stacked bar */}
                  <div className="h-4 w-full rounded-md bg-slate-950 overflow-hidden flex border border-slate-800">
                    {lowPct > 0 && (
                      <div
                        style={{ width: `${lowPct}%` }}
                        title={`Low Risk: ${p.lowRiskMiles} mi (${lowPct.toFixed(0)}%)`}
                        className="h-full bg-emerald-500 hover:opacity-90 transition-opacity"
                      />
                    )}
                    {modPct > 0 && (
                      <div
                        style={{ width: `${modPct}%` }}
                        title={`Moderate Risk: ${p.moderateRiskMiles} mi (${modPct.toFixed(0)}%)`}
                        className="h-full bg-amber-500 hover:opacity-90 transition-opacity"
                      />
                    )}
                    {highPct > 0 && (
                      <div
                        style={{ width: `${highPct}%` }}
                        title={`High Risk: ${p.highRiskMiles} mi (${highPct.toFixed(0)}%)`}
                        className="h-full bg-orange-500 hover:opacity-90 transition-opacity"
                      />
                    )}
                    {sevPct > 0 && (
                      <div
                        style={{ width: `${sevPct}%` }}
                        title={`Severe Risk: ${p.severeRiskMiles} mi (${sevPct.toFixed(0)}%)`}
                        className="h-full bg-red-600 hover:opacity-90 transition-opacity"
                      />
                    )}
                    {noTrvPct > 0 && (
                      <div
                        style={{ width: `${noTrvPct}%` }}
                        title={`No Travel Risk: ${p.noTravelMiles} mi (${noTrvPct.toFixed(0)}%)`}
                        className="h-full bg-rose-900 hover:opacity-90 transition-opacity animate-pulse"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Hierarchy Decision Guide */}
        <div className="rounded-xl border border-slate-800/90 bg-slate-950/40 p-3 text-xs text-slate-400">
          <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-cyan-400" />
            Decision Engine Priority Hierarchy (Lexicographical Assessment)
          </div>
          <p className="leading-relaxed">
            1. <strong>No-Travel Exclusion</strong> (Immediate hazard disqualification) → 2. <strong>Fewest Severe Miles</strong> → 3. <strong>Fewest High-Risk Miles</strong> → 4. <strong>Lowest Average Risk</strong> → 5. <strong>Shortest Travel Time</strong>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

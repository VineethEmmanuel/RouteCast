"use client";

import React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  Compass,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { RouteAnalysisResult } from "@/types/routing";
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
    <Card className="border-[#E7EBEF] bg-white shadow-subtle">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[#17212B]">
            <Compass className="h-4 w-4 text-[#087E8B]" />
            <span>Dispatch Recommendation & Exposure Analysis</span>
          </CardTitle>

          <span
            className={cn(
              "px-2.5 py-0.5 rounded-[4px] text-xs font-medium border",
              hasSafeRoute
                ? "bg-[#EBF6F1] text-[#16865D] border-[#CBE9DC]"
                : "bg-[#F8E9EB] text-[#861F2D] border-[#E5B5BC]"
            )}
          >
            {hasSafeRoute ? "Safe Route Identified" : "Critical Weather Advisory"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-3">
        {/* Recommendation Callout */}
        <div
          className={cn(
            "rounded-md border p-3.5",
            hasSafeRoute
              ? "bg-[#E6F3F5] border-[#BCE1E5]"
              : "bg-[#F8E9EB] border-[#E5B5BC]"
          )}
        >
          <div className="flex items-start gap-2.5">
            {hasSafeRoute ? (
              <ShieldCheck className="h-4 w-4 text-[#087E8B] mt-0.5 flex-shrink-0" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-[#861F2D] mt-0.5 flex-shrink-0" />
            )}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-[#17212B]">
                {hasSafeRoute && recommendedRoute
                  ? `Recommended Choice: ${recommendedRoute.name}`
                  : "Dispatch Warning: Extreme Weather Hazards Detected"}
              </h4>
              <p className="text-xs text-[#687582] leading-relaxed">
                {recommendationExplanation}
              </p>
            </div>
          </div>
        </div>

        {/* Hazard Exposure Stacked Bars */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#687582] flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-[#9DA7B2]" />
              Corridor Hazard Mileage Breakdown
            </span>
            <div className="flex items-center gap-2.5 text-[11px] text-[#687582]">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#16865D]" /> Low
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#D69B24]" /> Mod
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#E47B35]" /> High
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#D94B4B]" /> Severe
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#861F2D]" /> No Travel
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
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
                    <span className="font-medium text-[#17212B] flex items-center gap-2">
                      <span>{route.name}</span>
                      {route.isRecommended && (
                        <span className="text-[10px] bg-[#E6F3F5] text-[#087E8B] px-1.5 py-0.2 rounded border border-[#BCE1E5] font-semibold">
                          Optimal
                        </span>
                      )}
                    </span>
                    <span className="font-mono tabular-nums text-xs text-[#687582]">
                      {formatDistanceMiles(route.totalDistanceMiles)} • {formatDuration(route.totalDurationMinutes)}
                    </span>
                  </div>

                  {/* Stacked bar */}
                  <div className="h-3 w-full rounded-[4px] bg-[#F4F5F7] overflow-hidden flex border border-[#E7EBEF]">
                    {lowPct > 0 && (
                      <div
                        style={{ width: `${lowPct}%` }}
                        title={`Low Risk: ${p.lowRiskMiles} mi (${lowPct.toFixed(0)}%)`}
                        className="h-full bg-[#16865D] hover:opacity-90 transition-opacity"
                      />
                    )}
                    {modPct > 0 && (
                      <div
                        style={{ width: `${modPct}%` }}
                        title={`Moderate Risk: ${p.moderateRiskMiles} mi (${modPct.toFixed(0)}%)`}
                        className="h-full bg-[#D69B24] hover:opacity-90 transition-opacity"
                      />
                    )}
                    {highPct > 0 && (
                      <div
                        style={{ width: `${highPct}%` }}
                        title={`High Risk: ${p.highRiskMiles} mi (${highPct.toFixed(0)}%)`}
                        className="h-full bg-[#E47B35] hover:opacity-90 transition-opacity"
                      />
                    )}
                    {sevPct > 0 && (
                      <div
                        style={{ width: `${sevPct}%` }}
                        title={`Severe Risk: ${p.severeRiskMiles} mi (${sevPct.toFixed(0)}%)`}
                        className="h-full bg-[#D94B4B] hover:opacity-90 transition-opacity"
                      />
                    )}
                    {noTrvPct > 0 && (
                      <div
                        style={{ width: `${noTrvPct}%` }}
                        title={`No Travel Risk: ${p.noTravelMiles} mi (${noTrvPct.toFixed(0)}%)`}
                        className="h-full bg-[#861F2D] hover:opacity-90 transition-opacity"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Order Footnote */}
        <div className="rounded-md bg-[#F7F8FA] border border-[#E7EBEF] p-2.5 text-[11px] text-[#687582] leading-relaxed">
          <strong className="text-[#17212B]">Decision Hierarchy:</strong> 1. No-Travel Exclusion → 2. Fewest Severe Miles → 3. Fewest High Miles → 4. Lowest Average Risk Score → 5. Shortest Travel Duration.
        </div>
      </CardContent>
    </Card>
  );
};

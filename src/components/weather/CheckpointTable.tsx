"use client";

import React, { useState } from "react";
import { Checkpoint } from "@/types/routing";
import { RiskBadge } from "../ui/Badge";
import { formatDateTime, cn } from "@/lib/utils";
import { ChevronRight, Search, AlertTriangle } from "lucide-react";

interface CheckpointTableProps {
  checkpoints: Checkpoint[];
  onSelectCheckpoint: (cp: Checkpoint) => void;
  selectedCheckpointId?: string | null;
}

export const CheckpointTable: React.FC<CheckpointTableProps> = ({
  checkpoints,
  onSelectCheckpoint,
  selectedCheckpointId,
}) => {
  const [filter, setFilter] = useState<"all" | "severe-plus" | "high-plus" | "affected">("all");
  const [searchTerm, setSearchTerm] = useState("");

  if (!checkpoints || checkpoints.length === 0) return null;

  const filteredCheckpoints = checkpoints.filter((cp) => {
    if (filter === "severe-plus") {
      if (cp.risk.finalRisk !== "Severe" && cp.risk.finalRisk !== "No Travel") return false;
    } else if (filter === "high-plus") {
      if (
        cp.risk.finalRisk !== "High" &&
        cp.risk.finalRisk !== "Severe" &&
        cp.risk.finalRisk !== "No Travel"
      )
        return false;
    } else if (filter === "affected") {
      if (cp.risk.finalRisk === "Low") return false;
    }

    if (searchTerm.trim().length > 0) {
      const term = searchTerm.toLowerCase();
      const matchIndex = cp.index.toString().includes(term);
      const matchDist = cp.distanceFromOriginMiles.toString().includes(term);
      const matchDesc = cp.weather.weatherDescription.toLowerCase().includes(term);
      const matchRisk = cp.risk.finalRisk.toLowerCase().includes(term);
      return matchIndex || matchDist || matchDesc || matchRisk;
    }

    return true;
  });

  return (
    <div className="rounded-lg border border-[#E7EBEF] bg-white p-4 shadow-subtle space-y-3">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h3 className="text-xs font-semibold text-[#17212B]">
            Corridor Milepost & Weather Checkpoint Log
          </h3>
          <p className="text-[11px] text-[#687582]">
            Showing {filteredCheckpoints.length} of {checkpoints.length} sampled points. Click row to zoom on map.
          </p>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter checkpoints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-7 w-36 rounded-md border border-[#E7EBEF] bg-white pl-2 pr-6 text-xs text-[#17212B] placeholder:text-[#9DA7B2] focus:border-[#087E8B] focus:ring-1 focus:ring-[#087E8B] focus:outline-none"
            />
            <Search className="absolute right-2 top-2 h-3 w-3 text-[#9DA7B2]" />
          </div>

          {/* Segmented Filter */}
          <div className="flex items-center rounded-md bg-[#F4F5F7] p-0.5 border border-[#E7EBEF] text-xs">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-2 py-0.5 rounded text-[11px] font-medium transition-colors",
                filter === "all"
                  ? "bg-white text-[#17212B] font-semibold shadow-subtle"
                  : "text-[#687582] hover:text-[#17212B]"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter("affected")}
              className={cn(
                "px-2 py-0.5 rounded text-[11px] font-medium transition-colors",
                filter === "affected"
                  ? "bg-white text-[#A07010] font-semibold shadow-subtle"
                  : "text-[#687582] hover:text-[#17212B]"
              )}
            >
              Mod+
            </button>
            <button
              onClick={() => setFilter("high-plus")}
              className={cn(
                "px-2 py-0.5 rounded text-[11px] font-medium transition-colors",
                filter === "high-plus"
                  ? "bg-white text-[#C25814] font-semibold shadow-subtle"
                  : "text-[#687582] hover:text-[#17212B]"
              )}
            >
              High+
            </button>
            <button
              onClick={() => setFilter("severe-plus")}
              className={cn(
                "px-2 py-0.5 rounded text-[11px] font-medium transition-colors",
                filter === "severe-plus"
                  ? "bg-white text-[#B82E2E] font-semibold shadow-subtle"
                  : "text-[#687582] hover:text-[#17212B]"
              )}
            >
              Severe+
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-md border border-[#E7EBEF]">
        <table className="w-full text-left text-xs text-[#17212B]">
          <thead className="bg-[#F7F8FA] uppercase text-[10px] font-semibold text-[#687582] border-b border-[#E7EBEF] tracking-wider">
            <tr>
              <th className="px-3 py-2">CP #</th>
              <th className="px-3 py-2">Distance</th>
              <th className="px-3 py-2">Estimated ETA</th>
              <th className="px-3 py-2">Wind Speed</th>
              <th className="px-3 py-2">Precipitation</th>
              <th className="px-3 py-2">Snowfall</th>
              <th className="px-3 py-2">Temp</th>
              <th className="px-3 py-2">Load Rule</th>
              <th className="px-3 py-2">Final Risk</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F5F7] font-mono tabular-nums text-xs">
            {filteredCheckpoints.map((cp) => {
              const isSelected = selectedCheckpointId === cp.id;

              return (
                <tr
                  key={cp.id}
                  onClick={() => onSelectCheckpoint(cp)}
                  className={cn(
                    "cursor-pointer transition-colors duration-100 hover:bg-[#F7F8FA]",
                    isSelected && "bg-[#E6F3F5] hover:bg-[#DBEEF1] font-semibold"
                  )}
                >
                  <td className="px-3 py-2 font-semibold text-[#17212B]">
                    #{cp.index}
                  </td>
                  <td className="px-3 py-2 text-[#087E8B] font-semibold">
                    {cp.distanceFromOriginMiles.toFixed(1)} mi
                  </td>
                  <td className="px-3 py-2 text-[#687582]">
                    {formatDateTime(cp.estimatedArrivalTime)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        cp.weather.windSpeed >= 35 ? "text-[#C25814] font-semibold" : "text-[#17212B]"
                      )}
                    >
                      {cp.weather.windSpeed.toFixed(1)} mph
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        cp.weather.precipitation >= 0.25 ? "text-blue-600 font-semibold" : "text-[#687582]"
                      )}
                    >
                      {cp.weather.precipitation.toFixed(2)} in/h
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        cp.weather.snowfall >= 0.5 ? "text-sky-600 font-semibold" : "text-[#687582]"
                      )}
                    >
                      {cp.weather.snowfall.toFixed(2)} in/h
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[#17212B]">
                    {cp.weather.temperature.toFixed(0)}°F
                  </td>
                  <td className="px-3 py-2 font-sans text-[11px]">
                    {cp.risk.loadAdjustmentApplied ? (
                      <span className="inline-flex items-center gap-1 rounded bg-[#FCEEEE] border border-[#F5C2C2] px-1.5 py-0.5 text-[#B82E2E] text-[10px] font-medium">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Adjusted
                      </span>
                    ) : (
                      <span className="text-[#D4D9DE]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-sans">
                    <RiskBadge risk={cp.risk.finalRisk} size="sm" />
                  </td>
                  <td className="px-2 py-2 text-[#9DA7B2]">
                    <ChevronRight className="h-3 w-3" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

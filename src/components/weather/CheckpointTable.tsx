"use client";

import React, { useState } from "react";
import {
  Checkpoint,
  RiskLevel,
  RISK_SCORE_MAP,
} from "@/types/routing";
import { RiskBadge } from "../ui/Badge";
import { formatDateTime, cn } from "@/lib/utils";
import {
  Wind,
  Droplets,
  CloudSnow,
  Filter,
  AlertTriangle,
  ChevronRight,
  Search,
} from "lucide-react";

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
    // Risk filter
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

    // Search filter
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>Corridor Weather Checkpoints & Milepost Log</span>
            <span className="text-xs font-mono font-normal text-slate-400">
              ({filteredCheckpoints.length} of {checkpoints.length} Checkpoints)
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any checkpoint to pan and view meteorological breakdown.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors",
                filter === "all"
                  ? "bg-cyan-500/20 text-cyan-300 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              All ({checkpoints.length})
            </button>
            <button
              onClick={() => setFilter("affected")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors",
                filter === "affected"
                  ? "bg-amber-500/20 text-amber-300 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              Mod+
            </button>
            <button
              onClick={() => setFilter("high-plus")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors",
                filter === "high-plus"
                  ? "bg-orange-500/20 text-orange-300 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              High+
            </button>
            <button
              onClick={() => setFilter("severe-plus")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors",
                filter === "severe-plus"
                  ? "bg-red-500/20 text-red-300 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              Severe+
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 uppercase text-[10px] font-bold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-3.5 py-2.5">CP #</th>
              <th className="px-3.5 py-2.5">Distance</th>
              <th className="px-3.5 py-2.5">Estimated ETA</th>
              <th className="px-3.5 py-2.5">Wind</th>
              <th className="px-3.5 py-2.5">Rain</th>
              <th className="px-3.5 py-2.5">Snow</th>
              <th className="px-3.5 py-2.5">Temp</th>
              <th className="px-3.5 py-2.5">Load Escalation</th>
              <th className="px-3.5 py-2.5">Final Risk</th>
              <th className="px-2 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredCheckpoints.map((cp) => {
              const isSelected = selectedCheckpointId === cp.id;

              return (
                <tr
                  key={cp.id}
                  onClick={() => onSelectCheckpoint(cp)}
                  className={cn(
                    "cursor-pointer transition-colors duration-150 hover:bg-slate-800/60",
                    isSelected
                      ? "bg-cyan-950/30 font-semibold"
                      : "bg-slate-900/30"
                  )}
                >
                  <td className="px-3.5 py-2.5 font-bold text-slate-200">
                    #{cp.index}
                  </td>
                  <td className="px-3.5 py-2.5 font-bold text-cyan-300">
                    {cp.distanceFromOriginMiles.toFixed(1)} mi
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-300">
                    {formatDateTime(cp.estimatedArrivalTime)}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span
                      className={cn(
                        cp.weather.windSpeed >= 35 ? "text-orange-400 font-bold" : "text-slate-300"
                      )}
                    >
                      {cp.weather.windSpeed.toFixed(1)} mph
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span
                      className={cn(
                        cp.weather.precipitation >= 0.25 ? "text-blue-400 font-bold" : "text-slate-400"
                      )}
                    >
                      {cp.weather.precipitation.toFixed(2)} in/h
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span
                      className={cn(
                        cp.weather.snowfall >= 0.5 ? "text-sky-300 font-bold" : "text-slate-400"
                      )}
                    >
                      {cp.weather.snowfall.toFixed(2)} in/h
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-300">
                    {cp.weather.temperature.toFixed(0)}°F
                  </td>
                  <td className="px-3.5 py-2.5 text-[11px] font-sans">
                    {cp.risk.loadAdjustmentApplied ? (
                      <span className="inline-flex items-center gap-1 rounded bg-red-500/20 px-1.5 py-0.5 text-red-300 text-[10px] border border-red-500/40">
                        <AlertTriangle className="h-3 w-3" />
                        Rule Triggered
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <RiskBadge risk={cp.risk.finalRisk} size="sm" />
                  </td>
                  <td className="px-2 py-2.5 text-slate-500">
                    <ChevronRight className="h-3.5 w-3.5" />
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

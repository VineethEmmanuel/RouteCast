"use client";

import React from "react";
import {
  X,
  MapPin,
  Clock,
  Navigation,
  Wind,
  Droplets,
  CloudSnow,
  Thermometer,
  Truck,
  AlertTriangle,
  Info,
  ShieldCheck,
} from "lucide-react";
import { Checkpoint, RISK_COLORS, RiskLevel } from "@/types/routing";
import { RiskBadge } from "../ui/Badge";
import { formatDateTime, cn } from "@/lib/utils";

interface CheckpointDetailsDrawerProps {
  checkpoint: Checkpoint | null;
  onClose: () => void;
  truckLoadWeightLb: number;
}

export const CheckpointDetailsDrawer: React.FC<CheckpointDetailsDrawerProps> = ({
  checkpoint,
  onClose,
  truckLoadWeightLb,
}) => {
  if (!checkpoint) return null;

  const { index, coordinates, distanceFromOriginMiles, estimatedArrivalTime, weather, risk } =
    checkpoint;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-900/95 border-l border-slate-800 shadow-2xl backdrop-blur-md p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold font-mono text-sm">
              #{index}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {index === 0 ? "Route Origin Checkpoint" : `Weather Checkpoint #${index}`}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {coordinates[1].toFixed(4)}°N, {coordinates[0].toFixed(4)}°W
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ETA & Distance Summary */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Navigation className="h-3 w-3 text-cyan-400" /> Cumulative Dist
            </span>
            <span className="text-sm font-bold font-mono text-slate-100 mt-1 block">
              {distanceFromOriginMiles.toFixed(1)} miles
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Clock className="h-3 w-3 text-cyan-400" /> Estimated Arrival
            </span>
            <span className="text-xs font-bold font-mono text-slate-100 mt-1 block">
              {formatDateTime(estimatedArrivalTime)}
            </span>
          </div>
        </div>

        {/* Final Classification Banner */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/90 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">
              Final Risk Classification:
            </span>
            <RiskBadge risk={risk.finalRisk} size="lg" />
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {risk.explanation}
          </p>

          {/* Load-based adjustment indicator */}
          {risk.loadAdjustmentApplied && (
            <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-[11px] text-red-300 leading-normal">
                <strong>Load Weight Escalation Applied:</strong>
                <p className="mt-0.5 text-red-200/90">{risk.loadAdjustmentReason}</p>
              </div>
            </div>
          )}
        </div>

        {/* Meteorological Variables Breakdown */}
        <div className="mt-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Observed & Forecasted Variables
          </h4>

          {/* Wind Speed */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <Wind className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Sustained Wind Speed</span>
                <span className="text-sm font-bold font-mono text-slate-100">
                  {weather.windSpeed.toFixed(1)} mph
                </span>
              </div>
            </div>
            <RiskBadge risk={risk.windRisk} size="sm" />
          </div>

          {/* Rainfall Intensity */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Droplets className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Rainfall Rate</span>
                <span className="text-sm font-bold font-mono text-slate-100">
                  {weather.precipitation.toFixed(2)} in/hr
                </span>
              </div>
            </div>
            <RiskBadge risk={risk.rainRisk} size="sm" />
          </div>

          {/* Snowfall Intensity */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                <CloudSnow className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Snowfall Rate</span>
                <span className="text-sm font-bold font-mono text-slate-100">
                  {weather.snowfall.toFixed(2)} in/hr
                </span>
              </div>
            </div>
            <RiskBadge risk={risk.snowRisk} size="sm" />
          </div>

          {/* Temperature & Condition */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <Thermometer className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Temperature & Sky</span>
                <span className="text-sm font-bold font-mono text-slate-100">
                  {weather.temperature.toFixed(1)}°F • {weather.weatherDescription}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cargo Load Status */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Truck className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-300">Gross Cargo Weight:</span>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-400">
            {truckLoadWeightLb.toLocaleString()} lb
          </span>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-800">
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-slate-200 transition-colors"
        >
          Close Checkpoint View
        </button>
      </div>
    </div>
  );
};

"use client";

import React from "react";
import {
  X,
  Clock,
  Navigation,
  Wind,
  Droplets,
  CloudSnow,
  Thermometer,
  Truck,
  AlertTriangle,
} from "lucide-react";
import { Checkpoint } from "@/types/routing";
import { RiskBadge } from "../ui/Badge";
import { formatDateTime } from "@/lib/utils";

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
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white border-l border-[#E7EBEF] shadow-modal p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-150">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E7EBEF]">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-[#F4F5F7] border border-[#E7EBEF] flex items-center justify-center font-mono tabular-nums text-xs font-semibold text-[#17212B]">
              #{index}
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#17212B]">
                {index === 0 ? "Route Origin" : `Checkpoint #${index}`}
              </h3>
              <p className="text-[11px] text-[#687582] font-mono tabular-nums">
                {coordinates[1].toFixed(4)}°N, {coordinates[0].toFixed(4)}°W
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded p-1 text-[#687582] hover:bg-[#F4F5F7] hover:text-[#17212B] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ETA & Distance Summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-[#E7EBEF] bg-[#F7F8FA] p-2.5">
            <span className="text-[10px] text-[#687582] uppercase font-semibold flex items-center gap-1">
              <Navigation className="h-3 w-3 text-[#087E8B]" /> Distance
            </span>
            <span className="text-sm font-semibold font-mono tabular-nums text-[#17212B] mt-0.5 block">
              {distanceFromOriginMiles.toFixed(1)} mi
            </span>
          </div>

          <div className="rounded-md border border-[#E7EBEF] bg-[#F7F8FA] p-2.5">
            <span className="text-[10px] text-[#687582] uppercase font-semibold flex items-center gap-1">
              <Clock className="h-3 w-3 text-[#087E8B]" /> Arrival ETA
            </span>
            <span className="text-xs font-semibold font-mono tabular-nums text-[#17212B] mt-0.5 block">
              {formatDateTime(estimatedArrivalTime)}
            </span>
          </div>
        </div>

        {/* Final Classification Banner */}
        <div className="rounded-md border border-[#E7EBEF] bg-[#F7F8FA] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#17212B]">
              Classification:
            </span>
            <RiskBadge risk={risk.finalRisk} size="md" />
          </div>

          <p className="text-xs text-[#687582] leading-relaxed">
            {risk.explanation}
          </p>

          {/* Load-based adjustment indicator */}
          {risk.loadAdjustmentApplied && (
            <div className="rounded bg-[#FCEEEE] border border-[#F5C2C2] p-2 flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-[#D94B4B] mt-0.5 flex-shrink-0" />
              <div className="text-[11px] text-[#B82E2E] leading-tight">
                <strong>Load Weight Rule Applied:</strong>
                <p className="mt-0.5">{risk.loadAdjustmentReason}</p>
              </div>
            </div>
          )}
        </div>

        {/* Meteorological Breakdown */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#9DA7B2]">
            Atmospheric Variables at ETA
          </h4>

          {/* Wind Speed */}
          <div className="rounded-md border border-[#E7EBEF] bg-white p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded bg-[#F4F5F7] flex items-center justify-center text-[#087E8B]">
                <Wind className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="text-[11px] text-[#687582] block">Sustained Wind</span>
                <span className="text-xs font-semibold font-mono tabular-nums text-[#17212B]">
                  {weather.windSpeed.toFixed(1)} mph
                </span>
              </div>
            </div>
            <RiskBadge risk={risk.windRisk} size="sm" />
          </div>

          {/* Rainfall Intensity */}
          <div className="rounded-md border border-[#E7EBEF] bg-white p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded bg-[#F4F5F7] flex items-center justify-center text-blue-500">
                <Droplets className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="text-[11px] text-[#687582] block">Rainfall Rate</span>
                <span className="text-xs font-semibold font-mono tabular-nums text-[#17212B]">
                  {weather.precipitation.toFixed(2)} in/hr
                </span>
              </div>
            </div>
            <RiskBadge risk={risk.rainRisk} size="sm" />
          </div>

          {/* Snowfall Intensity */}
          <div className="rounded-md border border-[#E7EBEF] bg-white p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded bg-[#F4F5F7] flex items-center justify-center text-sky-500">
                <CloudSnow className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="text-[11px] text-[#687582] block">Snowfall Rate</span>
                <span className="text-xs font-semibold font-mono tabular-nums text-[#17212B]">
                  {weather.snowfall.toFixed(2)} in/hr
                </span>
              </div>
            </div>
            <RiskBadge risk={risk.snowRisk} size="sm" />
          </div>

          {/* Temperature & Condition */}
          <div className="rounded-md border border-[#E7EBEF] bg-white p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded bg-[#F4F5F7] flex items-center justify-center text-[#D69B24]">
                <Thermometer className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="text-[11px] text-[#687582] block">Ambient Temperature</span>
                <span className="text-xs font-semibold font-mono tabular-nums text-[#17212B]">
                  {weather.temperature.toFixed(1)}°F • {weather.weatherDescription}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cargo Status */}
        <div className="rounded-md border border-[#E7EBEF] bg-[#F7F8FA] p-2.5 flex items-center justify-between text-xs">
          <span className="text-[#687582] flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-[#9DA7B2]" />
            Gross Cargo Weight:
          </span>
          <span className="font-mono tabular-nums font-semibold text-[#17212B]">
            {truckLoadWeightLb.toLocaleString()} lb
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-[#E7EBEF]">
        <button
          onClick={onClose}
          className="w-full rounded-md border border-[#E7EBEF] bg-white hover:bg-[#F4F5F7] py-2 text-xs font-medium text-[#17212B] transition-colors"
        >
          Close Panel
        </button>
      </div>
    </div>
  );
};

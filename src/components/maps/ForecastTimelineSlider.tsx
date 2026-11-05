"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Wind,
  Droplets,
  CloudSnow,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { WeatherVariable } from "@/types/routing";
import { formatDateTime, cn } from "@/lib/utils";

interface ForecastTimelineSliderProps {
  departureTimeIso: string;
  selectedHourOffset: number;
  onHourOffsetChange: (offset: number) => void;
  activeLayer: WeatherVariable;
  onLayerChange: (layer: WeatherVariable) => void;
}

export const ForecastTimelineSlider: React.FC<ForecastTimelineSliderProps> = ({
  departureTimeIso,
  selectedHourOffset,
  onHourOffsetChange,
  activeLayer,
  onLayerChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      onHourOffsetChange((selectedHourOffset + 1) % 49);
    }, 850);

    return () => clearInterval(interval);
  }, [isPlaying, selectedHourOffset, onHourOffsetChange]);

  const departureDate = new Date(departureTimeIso);
  const simulatedTime = new Date(
    departureDate.getTime() + selectedHourOffset * 3600 * 1000
  ).toISOString();

  return (
    <div className="rounded-lg border border-[#E7EBEF] bg-white p-3 shadow-subtle space-y-3">
      {/* Top Header: Layer Segmented Control & Timestamp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Layer Tabs */}
        <div className="flex items-center gap-1 bg-[#F4F5F7] p-0.5 rounded-md border border-[#E7EBEF]">
          <button
            type="button"
            onClick={() => onLayerChange("composite")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors",
              activeLayer === "composite"
                ? "bg-white text-[#17212B] font-semibold shadow-subtle"
                : "text-[#687582] hover:text-[#17212B]"
            )}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-[#087E8B]" />
            <span>Hazard Risk</span>
          </button>

          <button
            type="button"
            onClick={() => onLayerChange("wind")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors",
              activeLayer === "wind"
                ? "bg-white text-[#17212B] font-semibold shadow-subtle"
                : "text-[#687582] hover:text-[#17212B]"
            )}
          >
            <Wind className="h-3.5 w-3.5 text-[#087E8B]" />
            <span>Wind (mph)</span>
          </button>

          <button
            type="button"
            onClick={() => onLayerChange("rain")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors",
              activeLayer === "rain"
                ? "bg-white text-[#17212B] font-semibold shadow-subtle"
                : "text-[#687582] hover:text-[#17212B]"
            )}
          >
            <Droplets className="h-3.5 w-3.5 text-blue-500" />
            <span>Rain (in/hr)</span>
          </button>

          <button
            type="button"
            onClick={() => onLayerChange("snow")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors",
              activeLayer === "snow"
                ? "bg-white text-[#17212B] font-semibold shadow-subtle"
                : "text-[#687582] hover:text-[#17212B]"
            )}
          >
            <CloudSnow className="h-3.5 w-3.5 text-sky-500" />
            <span>Snow (in/hr)</span>
          </button>
        </div>

        {/* Forecast Timestamp Display */}
        <div className="flex items-center gap-2 text-xs text-[#17212B] font-mono tabular-nums bg-[#F7F8FA] border border-[#E7EBEF] px-2.5 py-1 rounded-md">
          <Clock className="h-3.5 w-3.5 text-[#9DA7B2]" />
          <span className="font-semibold text-[#087E8B]">
            {selectedHourOffset === 0 ? "Departure Time" : `+${selectedHourOffset}h Forecast`}:
          </span>
          <span className="text-[#687582]">{formatDateTime(simulatedTime)}</span>
        </div>
      </div>

      {/* Slider Controls Bar */}
      <div className="flex items-center gap-3">
        {/* Playback Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onHourOffsetChange(Math.max(0, selectedHourOffset - 1))}
            title="Step Back 1 Hour"
            className="h-8 w-8 flex items-center justify-center rounded-md border border-[#E7EBEF] bg-white hover:bg-[#F4F5F7] text-[#687582] hover:text-[#17212B] transition-colors"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause Forecast" : "Play 48h Weather Sequence"}
            className={cn(
              "h-8 px-2.5 flex items-center justify-center rounded-md text-xs font-semibold gap-1.5 transition-colors shadow-subtle",
              isPlaying
                ? "bg-[#D69B24] text-white"
                : "bg-[#087E8B] hover:bg-[#075B65] text-white"
            )}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onHourOffsetChange(Math.min(48, selectedHourOffset + 1))}
            title="Step Forward 1 Hour"
            className="h-8 w-8 flex items-center justify-center rounded-md border border-[#E7EBEF] bg-white hover:bg-[#F4F5F7] text-[#687582] hover:text-[#17212B] transition-colors"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              onHourOffsetChange(0);
            }}
            title="Reset to Departure Time"
            className="h-8 w-8 flex items-center justify-center rounded-md border border-[#E7EBEF] bg-white hover:bg-[#F4F5F7] text-[#687582] hover:text-[#17212B] transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>

        {/* Time Slider */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-[#687582]">
            <span>0h (Dep)</span>
            <span className="font-semibold text-[#087E8B]">+{selectedHourOffset} hrs</span>
            <span>+48h Window</span>
          </div>
          <input
            type="range"
            min={0}
            max={48}
            step={1}
            value={selectedHourOffset}
            onChange={(e) => {
              setIsPlaying(false);
              onHourOffsetChange(Number(e.target.value));
            }}
            className="w-full h-1.5 bg-[#E7EBEF] rounded-lg appearance-none cursor-pointer accent-[#087E8B] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};

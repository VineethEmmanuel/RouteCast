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
  Sparkles,
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

  // Play animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      onHourOffsetChange((selectedHourOffset + 1) % 49);
    }, 900);

    return () => clearInterval(interval);
  }, [isPlaying, selectedHourOffset, onHourOffsetChange]);

  // Compute current simulated time
  const departureDate = new Date(departureTimeIso);
  const simulatedTime = new Date(
    departureDate.getTime() + selectedHourOffset * 3600 * 1000
  ).toISOString();

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-md space-y-3">
      {/* Top Header: Layer switcher and Simulated Timestamp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Layer Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => onLayerChange("composite")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all",
              activeLayer === "composite"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-cyan-400" />
            <span>Hazard Risk</span>
          </button>

          <button
            type="button"
            onClick={() => onLayerChange("wind")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all",
              activeLayer === "wind"
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Wind className="h-3.5 w-3.5 text-teal-400" />
            <span>Wind (mph)</span>
          </button>

          <button
            type="button"
            onClick={() => onLayerChange("rain")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all",
              activeLayer === "rain"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Droplets className="h-3.5 w-3.5 text-blue-400" />
            <span>Rain (in/hr)</span>
          </button>

          <button
            type="button"
            onClick={() => onLayerChange("snow")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all",
              activeLayer === "snow"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <CloudSnow className="h-3.5 w-3.5 text-sky-300" />
            <span>Snow (in/hr)</span>
          </button>
        </div>

        {/* Current Forecast Timestamp */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 font-mono shadow-sm">
          <Clock className="h-3.5 w-3.5 text-cyan-400" />
          <span className="font-bold text-cyan-300">
            {selectedHourOffset === 0 ? "Departure Time" : `+${selectedHourOffset}h Forecast`}:
          </span>
          <span>{formatDateTime(simulatedTime)}</span>
        </div>
      </div>

      {/* Slider Controls Bar */}
      <div className="flex items-center gap-4">
        {/* Play / Step Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onHourOffsetChange(Math.max(0, selectedHourOffset - 1))}
            title="Step Back 1 Hour"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-800"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause Forecast Loop" : "Play 48h Weather Animation"}
            className={cn(
              "p-2 rounded-xl text-slate-950 font-bold transition-all shadow-md",
              isPlaying
                ? "bg-amber-400 hover:bg-amber-300 text-slate-950"
                : "bg-cyan-400 hover:bg-cyan-300 text-slate-950"
            )}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => onHourOffsetChange(Math.min(48, selectedHourOffset + 1))}
            title="Step Forward 1 Hour"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-800"
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
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Range Slider */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Departure (0h)</span>
            <span className="font-bold text-cyan-400">+{selectedHourOffset} hrs</span>
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
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};

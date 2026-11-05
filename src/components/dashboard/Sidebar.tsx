"use client";

import React, { useState } from "react";
import {
  Truck,
  Compass,
  History,
  Settings,
  ShieldAlert,
  Info,
  MapPin,
  ChevronRight,
  Wind,
  Droplets,
  CloudSnow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LocationPoint } from "@/types/routing";

interface SidebarProps {
  onSelectPreset: (origin: LocationPoint, destination: LocationPoint, label: string) => void;
  onOpenSettings: () => void;
  activeTab: "planner" | "history" | "guidelines";
  setActiveTab: (tab: "planner" | "history" | "guidelines") => void;
}

const PRESET_CORRIDORS: Array<{
  name: string;
  desc: string;
  origin: LocationPoint;
  destination: LocationPoint;
}> = [
  {
    name: "Chicago, IL → Denver, CO",
    desc: "I-80 Great Plains High Wind Corridor (Crosswind Test)",
    origin: { name: "Chicago, Illinois, United States", coordinates: [-87.6298, 41.8781] },
    destination: { name: "Denver, Colorado, United States", coordinates: [-104.9903, 39.7392] },
  },
  {
    name: "Seattle, WA → Salt Lake City, UT",
    desc: "Pacific Northwest Cascades (Winter Snow / Mountain Pass)",
    origin: { name: "Seattle, Washington, United States", coordinates: [-122.3321, 47.6062] },
    destination: { name: "Salt Lake City, Utah, United States", coordinates: [-111.891, 40.7608] },
  },
  {
    name: "Dallas, TX → Atlanta, GA",
    desc: "I-20 Southeast Corridor (Heavy Precipitation Test)",
    origin: { name: "Dallas, Texas, United States", coordinates: [-96.797, 32.7767] },
    destination: { name: "Atlanta, Georgia, United States", coordinates: [-84.388, 33.749] },
  },
  {
    name: "New York, NY → Chicago, IL",
    desc: "I-80 / I-90 East-West Freight Belt",
    origin: { name: "New York, New York, United States", coordinates: [-74.006, 40.7128] },
    destination: { name: "Chicago, Illinois, United States", coordinates: [-87.6298, 41.8781] },
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  onSelectPreset,
  onOpenSettings,
  activeTab,
  setActiveTab,
}) => {
  return (
    <aside className="w-full lg:w-72 flex-shrink-0 border-r border-slate-800/80 bg-slate-950 flex flex-col justify-between">
      <div>
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/80">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-slate-950 font-bold shadow-lg shadow-cyan-500/25">
            <Truck className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-wider text-white">Route</span>
              <span className="text-lg font-black tracking-wider text-cyan-400">Cast</span>
            </div>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
              Weather Logistics AI
            </p>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="p-3 space-y-1">
          <button
            onClick={() => setActiveTab("planner")}
            className={cn(
              "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150",
              activeTab === "planner"
                ? "bg-gradient-to-r from-cyan-500/15 to-teal-500/10 border border-cyan-500/30 text-cyan-300 shadow-sm"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
            )}
          >
            <Compass className="h-4 w-4 text-cyan-400" />
            <span>Route Planner</span>
          </button>

          <button
            onClick={() => setActiveTab("guidelines")}
            className={cn(
              "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150",
              activeTab === "guidelines"
                ? "bg-gradient-to-r from-cyan-500/15 to-teal-500/10 border border-cyan-500/30 text-cyan-300 shadow-sm"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
            )}
          >
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            <span>Risk Rules & Thresholds</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 transition-colors"
          >
            <Settings className="h-4 w-4 text-slate-400" />
            <span>Mapbox & API Config</span>
          </button>
        </nav>

        {/* Quick Corridor Presets */}
        <div className="px-4 py-3 border-t border-slate-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Quick Corridor Presets
            </span>
            <span className="text-[10px] text-cyan-400">1-Click</span>
          </div>

          <div className="space-y-1.5">
            {PRESET_CORRIDORS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPreset(preset.origin, preset.destination, preset.name)}
                className="w-full text-left p-2.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/80 hover:border-cyan-500/30 transition-all duration-150 group"
              >
                <div className="flex items-center justify-between text-xs font-medium text-slate-200 group-hover:text-cyan-300">
                  <span className="truncate">{preset.name}</span>
                  <ChevronRight className="h-3 w-3 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                  {preset.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Safety Legend Footnote */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/80">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-2">
          <Info className="h-3.5 w-3.5 text-cyan-400" />
          <span>Active Risk Severity Scale</span>
        </div>
        <div className="grid grid-cols-5 gap-1 text-[9px] font-mono text-center">
          <div className="rounded bg-emerald-500/20 text-emerald-400 py-1 border border-emerald-500/30">
            Low
          </div>
          <div className="rounded bg-amber-500/20 text-amber-400 py-1 border border-amber-500/30">
            Mod
          </div>
          <div className="rounded bg-orange-500/20 text-orange-400 py-1 border border-orange-500/30">
            High
          </div>
          <div className="rounded bg-red-500/20 text-red-400 py-1 border border-red-500/30">
            Severe
          </div>
          <div className="rounded bg-rose-950/50 text-rose-400 py-1 border border-rose-600/40 font-bold">
            Stop
          </div>
        </div>
      </div>
    </aside>
  );
};

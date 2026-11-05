"use client";

import React from "react";
import {
  Compass,
  ShieldAlert,
  Settings,
  ChevronRight,
  Info,
  MapPin,
  ExternalLink,
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
  tag: string;
  origin: LocationPoint;
  destination: LocationPoint;
}> = [
  {
    name: "Chicago, IL → Denver, CO",
    tag: "I-80 Crosswinds",
    origin: { name: "Chicago, Illinois, United States", coordinates: [-87.6298, 41.8781] },
    destination: { name: "Denver, Colorado, United States", coordinates: [-104.9903, 39.7392] },
  },
  {
    name: "Seattle, WA → Salt Lake City, UT",
    tag: "Cascades Snow",
    origin: { name: "Seattle, Washington, United States", coordinates: [-122.3321, 47.6062] },
    destination: { name: "Salt Lake City, Utah, United States", coordinates: [-111.891, 40.7608] },
  },
  {
    name: "Dallas, TX → Atlanta, GA",
    tag: "I-20 Rain Belt",
    origin: { name: "Dallas, Texas, United States", coordinates: [-96.797, 32.7767] },
    destination: { name: "Atlanta, Georgia, United States", coordinates: [-84.388, 33.749] },
  },
  {
    name: "New York, NY → Chicago, IL",
    tag: "I-90 Freight",
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
    <aside className="w-full lg:w-64 flex-shrink-0 border-r border-[#E7EBEF] bg-white flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-[#E7EBEF]">
          <div className="h-7 w-7 rounded-md bg-[#087E8B] flex items-center justify-center text-white font-bold text-xs shadow-subtle">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="6" cy="19" r="2" />
              <circle cx="18" cy="5" r="2" />
              <path d="M12 19h4.5a2.5 2.5 0 0 0 2.5-2.5V7" />
              <path d="M6 17V7a2 2 0 0 1 2-2h4" />
            </svg>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold text-sm tracking-tight text-[#17212B]">RouteCast</span>
            <span className="text-[10px] uppercase font-mono font-medium text-[#687582] bg-[#F4F5F7] px-1.5 py-0.5 rounded border border-[#E7EBEF]">
              Fleet
            </span>
          </div>
        </div>

        {/* Linear-style Navigation */}
        <div className="p-2 space-y-0.5">
          <button
            onClick={() => setActiveTab("planner")}
            className={cn(
              "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
              activeTab === "planner"
                ? "bg-[#E6F3F5] text-[#087E8B] font-semibold"
                : "text-[#687582] hover:text-[#17212B] hover:bg-[#F7F8FA]"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Compass className="h-4 w-4 flex-shrink-0" />
              <span>Route Planner</span>
            </div>
            {activeTab === "planner" && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#087E8B]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("guidelines")}
            className={cn(
              "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
              activeTab === "guidelines"
                ? "bg-[#E6F3F5] text-[#087E8B] font-semibold"
                : "text-[#687582] hover:text-[#17212B] hover:bg-[#F7F8FA]"
            )}
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-4 w-4 flex-shrink-0" />
              <span>Risk Threshold Matrix</span>
            </div>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-[#687582] hover:text-[#17212B] hover:bg-[#F7F8FA] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span>Mapbox Configuration</span>
            </div>
          </button>
        </div>

        {/* Quick Corridor Presets Section */}
        <div className="mt-4 px-3 py-2">
          <div className="px-1 mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9DA7B2]">
              Corridor Presets
            </span>
          </div>

          <div className="space-y-0.5">
            {PRESET_CORRIDORS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPreset(preset.origin, preset.destination, preset.name)}
                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-[#F7F8FA] transition-colors group flex items-center justify-between"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-medium text-[#17212B] group-hover:text-[#087E8B] truncate transition-colors">
                    {preset.name}
                  </div>
                  <div className="text-[11px] text-[#9DA7B2] truncate">
                    {preset.tag}
                  </div>
                </div>
                <ChevronRight className="h-3 w-3 text-[#D4D9DE] group-hover:text-[#687582] flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / System Status */}
      <div className="p-3 border-t border-[#E7EBEF] bg-[#F7F8FA]">
        <div className="flex items-center justify-between text-[11px] text-[#687582]">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16865D]" />
            <span>Open-Meteo Active</span>
          </span>
          <span className="font-mono text-[10px] text-[#9DA7B2]">v2.4.0</span>
        </div>
      </div>
    </aside>
  );
};

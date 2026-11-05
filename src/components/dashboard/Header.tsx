"use client";

import React, { useState, useEffect } from "react";
import { CloudRain, Compass, Clock, Key, ShieldCheck, Activity } from "lucide-react";
import { Button } from "../ui/Button";

interface HeaderProps {
  onOpenSettings: () => void;
  hasMapboxToken: boolean;
  routingEngine?: "mapbox" | "osrm";
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  hasMapboxToken,
  routingEngine,
}) => {
  const [currentDateTime, setCurrentDateTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZoneName: "short",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 bg-slate-950/60 px-6 py-4 backdrop-blur-md">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Compass className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Weather-Aware Route Planner
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
              Fleet Grade
            </span>
          </h1>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Evaluates real-time wind speeds, rainfall, snowfall & cargo weight thresholds across alternative corridors.
        </p>
      </div>

      <div className="flex items-center flex-wrap gap-3">
        {/* Live system clock */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 font-mono shadow-sm">
          <Clock className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
          <span>{currentDateTime || "Loading live clock..."}</span>
        </div>

        {/* Engine status indicator */}
        <div className="hidden lg:flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Weather: Open-Meteo Live</span>
        </div>

        {/* Mapbox Token config button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenSettings}
          className="text-xs h-8 gap-1.5 border-slate-800 bg-slate-900 hover:border-slate-700"
        >
          <Key className="h-3.5 w-3.5 text-cyan-400" />
          <span>Mapbox Token</span>
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              hasMapboxToken ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
        </Button>
      </div>
    </header>
  );
};

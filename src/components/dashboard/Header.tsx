"use client";

import React, { useState, useEffect } from "react";
import { Key, Clock, ShieldCheck, Activity } from "lucide-react";
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
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 border-b border-[#E7EBEF] bg-white select-none">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold tracking-tight text-[#17212B]">
          Route Planner
        </h1>
        <span className="hidden sm:inline-block h-3.5 w-px bg-[#E7EBEF]" />
        <span className="hidden sm:inline-block text-xs text-[#687582]">
          Multi-corridor weather & load risk optimization
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Tabular live clock */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-[#687582] font-mono tabular-nums bg-[#F7F8FA] border border-[#E7EBEF] px-2.5 py-1 rounded-md">
          <Clock className="h-3.5 w-3.5 text-[#9DA7B2]" />
          <span>{currentDateTime || "Loading..."}</span>
        </div>

        {/* Routing Engine Badge */}
        {routingEngine && (
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#687582] bg-[#F7F8FA] border border-[#E7EBEF] px-2.5 py-1 rounded-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16865D]" />
            <span className="uppercase text-[10px] font-semibold text-[#687582]">
              {routingEngine === "mapbox" ? "Mapbox Engine" : "OSRM Routing"}
            </span>
          </div>
        )}

        {/* Mapbox Token config button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenSettings}
          className="h-8 gap-1.5 font-normal text-xs"
        >
          <Key className="h-3.5 w-3.5 text-[#687582]" />
          <span>Mapbox Token</span>
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              hasMapboxToken ? "bg-[#16865D]" : "bg-[#D69B24]"
            }`}
          />
        </Button>
      </div>
    </header>
  );
};

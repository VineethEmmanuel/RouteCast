"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Clock,
  Weight,
  Layers,
  Search,
  ArrowUpDown,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/Button";
import { LocationPoint, SamplingIntervalMiles } from "@/types/routing";
import { cn } from "@/lib/utils";

interface RouteInputFormProps {
  onAnalyze: (params: {
    origin: LocationPoint;
    destination: LocationPoint;
    departureTime: string;
    loadWeightLb: number;
    samplingIntervalMiles: SamplingIntervalMiles;
  }) => void;
  isLoading: boolean;
  presetOrigin?: LocationPoint | null;
  presetDestination?: LocationPoint | null;
}

export const RouteInputForm: React.FC<RouteInputFormProps> = ({
  onAnalyze,
  isLoading,
  presetOrigin,
  presetDestination,
}) => {
  // Origin state
  const [originQuery, setOriginQuery] = useState("Chicago, IL, USA");
  const [originPoint, setOriginPoint] = useState<LocationPoint>({
    name: "Chicago, Illinois, United States",
    coordinates: [-87.6298, 41.8781],
  });
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);

  // Destination state
  const [destinationQuery, setDestinationQuery] = useState("Denver, CO, USA");
  const [destinationPoint, setDestinationPoint] = useState<LocationPoint>({
    name: "Denver, Colorado, United States",
    coordinates: [-104.9903, 39.7392],
  });
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  // Departure date/time
  const getInitialDeparture = () => {
    const d = new Date(Date.now() + 30 * 60 * 1000);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  };

  const [departureDateTime, setDepartureDateTime] = useState<string>(getInitialDeparture());
  const [loadWeightLb, setLoadWeightLb] = useState<number>(35000);
  const [samplingInterval, setSamplingInterval] = useState<SamplingIntervalMiles>(25);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Watch for presets
  useEffect(() => {
    if (presetOrigin) {
      setOriginQuery(presetOrigin.name);
      setOriginPoint(presetOrigin);
    }
    if (presetDestination) {
      setDestinationQuery(presetDestination.name);
      setDestinationPoint(presetDestination);
    }
  }, [presetOrigin, presetDestination]);

  // Debounced geocoding for Origin
  useEffect(() => {
    if (!originQuery || originQuery.length < 2 || originQuery === originPoint.name) {
      setOriginSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(originQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setOriginSuggestions(data.results || []);
          setShowOriginSuggestions(true);
        }
      } catch (err) {
        console.error("Geocode error:", err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [originQuery, originPoint.name]);

  // Debounced geocoding for Destination
  useEffect(() => {
    if (!destinationQuery || destinationQuery.length < 2 || destinationQuery === destinationPoint.name) {
      setDestSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(destinationQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setDestSuggestions(data.results || []);
          setShowDestSuggestions(true);
        }
      } catch (err) {
        console.error("Geocode error:", err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [destinationQuery, destinationPoint.name]);

  const handleSwapLocations = () => {
    const tempPoint = originPoint;
    const tempQuery = originQuery;
    setOriginPoint(destinationPoint);
    setOriginQuery(destinationQuery);
    setDestinationPoint(tempPoint);
    setDestinationQuery(tempQuery);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!originPoint) {
      setValidationError("Please select a valid origin location.");
      return;
    }
    if (!destinationPoint) {
      setValidationError("Please select a valid destination location.");
      return;
    }
    if (!departureDateTime) {
      setValidationError("Please specify a departure date and time.");
      return;
    }

    const depDate = new Date(departureDateTime);
    if (isNaN(depDate.getTime())) {
      setValidationError("Invalid departure date and time.");
      return;
    }

    if (depDate.getTime() < Date.now() - 10 * 60 * 1000) {
      setValidationError("Departure time cannot be in the past.");
      return;
    }

    if (!loadWeightLb || loadWeightLb <= 0) {
      setValidationError("Load weight must be a positive number.");
      return;
    }

    onAnalyze({
      origin: originPoint,
      destination: destinationPoint,
      departureTime: depDate.toISOString(),
      loadWeightLb: Number(loadWeightLb),
      samplingIntervalMiles: samplingInterval,
    });
  };

  const nowMinStr = new Date().toISOString().slice(0, 16);

  return (
    <div className="rounded-lg border border-[#E7EBEF] bg-white p-4 shadow-subtle">
      <form onSubmit={handleSubmit} className="space-y-4">
        {validationError && (
          <div className="flex items-center gap-2 rounded-md bg-[#FCEEEE] border border-[#F5C2C2] p-2.5 text-xs text-[#B82E2E]">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Row 1: Connected Origin & Destination Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
          {/* Origin */}
          <div className="relative">
            <label className="block text-xs font-medium text-[#687582] mb-1 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#16865D] ring-2 ring-emerald-100" />
              Origin Point
            </label>
            <div className="relative">
              <input
                type="text"
                value={originQuery}
                onChange={(e) => setOriginQuery(e.target.value)}
                onFocus={() => setShowOriginSuggestions(true)}
                placeholder="Search origin city or address..."
                className="w-full h-9 rounded-md border border-[#E7EBEF] bg-white pl-3 pr-8 text-xs text-[#17212B] placeholder:text-[#9DA7B2] focus:border-[#087E8B] focus:ring-1 focus:ring-[#087E8B] focus:outline-none transition-colors"
              />
              <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-[#9DA7B2]" />
            </div>

            {/* Suggestions Dropdown */}
            {showOriginSuggestions && originSuggestions.length > 0 && (
              <div className="absolute z-30 mt-1 w-full rounded-md border border-[#E7EBEF] bg-white shadow-dropdown max-h-52 overflow-y-auto">
                {originSuggestions.map((sug, i) => (
                  <button
                    key={sug.id || i}
                    type="button"
                    onClick={() => {
                      setOriginPoint({ name: sug.name, coordinates: sug.coordinates });
                      setOriginQuery(sug.name);
                      setShowOriginSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[#17212B] hover:bg-[#F4F5F7] border-b border-[#F4F5F7] last:border-b-0 flex items-center gap-2 transition-colors"
                  >
                    <MapPin className="h-3 w-3 text-[#16865D] flex-shrink-0" />
                    <span className="truncate">{sug.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Destination */}
          <div className="relative">
            <label className="block text-xs font-medium text-[#687582] mb-1 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-[2px] bg-[#D94B4B] ring-2 ring-red-100" />
              Destination Point
            </label>
            <div className="relative">
              <input
                type="text"
                value={destinationQuery}
                onChange={(e) => setDestinationQuery(e.target.value)}
                onFocus={() => setShowDestSuggestions(true)}
                placeholder="Search destination city or address..."
                className="w-full h-9 rounded-md border border-[#E7EBEF] bg-white pl-3 pr-8 text-xs text-[#17212B] placeholder:text-[#9DA7B2] focus:border-[#087E8B] focus:ring-1 focus:ring-[#087E8B] focus:outline-none transition-colors"
              />
              <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-[#9DA7B2]" />
            </div>

            {/* Suggestions Dropdown */}
            {showDestSuggestions && destSuggestions.length > 0 && (
              <div className="absolute z-30 mt-1 w-full rounded-md border border-[#E7EBEF] bg-white shadow-dropdown max-h-52 overflow-y-auto">
                {destSuggestions.map((sug, i) => (
                  <button
                    key={sug.id || i}
                    type="button"
                    onClick={() => {
                      setDestinationPoint({ name: sug.name, coordinates: sug.coordinates });
                      setDestinationQuery(sug.name);
                      setShowDestSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[#17212B] hover:bg-[#F4F5F7] border-b border-[#F4F5F7] last:border-b-0 flex items-center gap-2 transition-colors"
                  >
                    <MapPin className="h-3 w-3 text-[#D94B4B] flex-shrink-0" />
                    <span className="truncate">{sug.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <button
            type="button"
            onClick={handleSwapLocations}
            title="Swap locations"
            className="hidden md:flex absolute left-1/2 top-[26px] -translate-x-1/2 z-10 h-6 w-6 items-center justify-center rounded border border-[#E7EBEF] bg-white text-[#687582] hover:text-[#17212B] hover:border-[#D4D9DE] shadow-subtle transition-colors"
          >
            <ArrowUpDown className="h-3 w-3" />
          </button>
        </div>

        {/* Row 2: Parameters (Date/Time, Cargo Weight, Interval) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-[#F4F5F7]">
          {/* Departure Date/Time */}
          <div>
            <label className="block text-xs font-medium text-[#687582] mb-1 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#9DA7B2]" />
              Scheduled Departure
            </label>
            <input
              type="datetime-local"
              min={nowMinStr}
              value={departureDateTime}
              onChange={(e) => setDepartureDateTime(e.target.value)}
              className="w-full h-9 rounded-md border border-[#E7EBEF] bg-white px-2.5 text-xs text-[#17212B] font-mono tabular-nums focus:border-[#087E8B] focus:ring-1 focus:ring-[#087E8B] focus:outline-none transition-colors"
            />
          </div>

          {/* Cargo Weight */}
          <div>
            <label className="block text-xs font-medium text-[#687582] mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Weight className="h-3.5 w-3.5 text-[#9DA7B2]" />
                Cargo Weight
              </span>
              <span className="text-[11px] font-mono text-[#9DA7B2]">
                {loadWeightLb > 40000 ? "Severe Active" : loadWeightLb > 30000 ? "No-Travel Active" : "Standard"}
              </span>
            </label>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="1"
                  max="120000"
                  step="500"
                  value={loadWeightLb}
                  onChange={(e) => setLoadWeightLb(Number(e.target.value))}
                  className="w-full h-9 rounded-md border border-[#E7EBEF] bg-white pl-2.5 pr-7 text-xs text-[#17212B] font-mono tabular-nums focus:border-[#087E8B] focus:ring-1 focus:ring-[#087E8B] focus:outline-none transition-colors"
                />
                <span className="absolute right-2 top-2 text-[11px] text-[#9DA7B2] font-mono">lb</span>
              </div>
              {/* Quick Weight Presets */}
              <div className="flex gap-1">
                {[
                  { label: "15k", val: 15000, title: "15,000 lb (Empty)" },
                  { label: "32k", val: 32000, title: "32,000 lb (Medium)" },
                  { label: "45k", val: 45000, title: "45,000 lb (Heavy)" },
                ].map((chip) => (
                  <button
                    key={chip.val}
                    type="button"
                    title={chip.title}
                    onClick={() => setLoadWeightLb(chip.val)}
                    className={cn(
                      "h-9 px-2 rounded-md text-[11px] font-mono border transition-colors",
                      loadWeightLb === chip.val
                        ? "bg-[#E6F3F5] text-[#087E8B] border-[#087E8B] font-semibold"
                        : "bg-white text-[#687582] border-[#E7EBEF] hover:bg-[#F4F5F7] hover:text-[#17212B]"
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sampling Interval */}
          <div>
            <label className="block text-xs font-medium text-[#687582] mb-1 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-[#9DA7B2]" />
              Weather Sampling Granularity
            </label>
            <div className="grid grid-cols-3 gap-1 h-9 bg-[#F4F5F7] p-0.5 rounded-md border border-[#E7EBEF]">
              {([10, 25, 50] as SamplingIntervalMiles[]).map((interval) => (
                <button
                  key={interval}
                  type="button"
                  onClick={() => setSamplingInterval(interval)}
                  className={cn(
                    "rounded text-xs font-medium transition-colors flex items-center justify-center font-mono tabular-nums",
                    samplingInterval === interval
                      ? "bg-white text-[#17212B] shadow-subtle font-semibold"
                      : "text-[#687582] hover:text-[#17212B]"
                  )}
                >
                  {interval} mi
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer & Submit Button */}
        <div className="flex items-center justify-between pt-1 border-t border-[#F4F5F7]">
          <div className="text-xs text-[#687582] hidden sm:block">
            Samples corridor at <span className="font-semibold text-[#17212B] font-mono">{samplingInterval} mi</span> increments based on travel progress.
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full sm:w-auto px-5 font-semibold text-xs h-9"
          >
            {isLoading ? "Evaluating Corridor Weather..." : "Analyze Routes"}
          </Button>
        </div>
      </form>
    </div>
  );
};

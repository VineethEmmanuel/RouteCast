"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Calendar,
  Clock,
  Weight,
  Layers,
  Search,
  ArrowUpDown,
  AlertCircle,
  Truck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
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

  // Departure date/time (default to now + 30 mins)
  const getInitialDeparture = () => {
    const d = new Date(Date.now() + 30 * 60 * 1000);
    // Format to YYYY-MM-DDTHH:mm for datetime-local
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  };

  const [departureDateTime, setDepartureDateTime] = useState<string>(getInitialDeparture());

  // Load Weight (lb)
  const [loadWeightLb, setLoadWeightLb] = useState<number>(35000);

  // Sampling Interval (10, 25, 50 miles)
  const [samplingInterval, setSamplingInterval] = useState<SamplingIntervalMiles>(25);

  // Validation errors
  const [validationError, setValidationError] = useState<string | null>(null);

  // Watch for presets from sidebar
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
    }, 300);

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
    }, 300);

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

    // Past date check (allow 10 min grace)
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

  // Min datetime for picker
  const nowMinStr = new Date().toISOString().slice(0, 16);

  return (
    <Card className="border-slate-800 bg-slate-900/70 shadow-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-400">
              <Truck className="h-3.5 w-3.5" />
            </span>
            Dispatch Parameters & Corridor Setup
          </CardTitle>
          <span className="text-[11px] font-mono text-cyan-400/90 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded-full">
            3 Alternatives Evaluation
          </span>
        </div>
        <CardDescription>
          Enter journey locations, scheduled departure, and cargo weight to calculate dynamic risk profiles.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {validationError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Locations: Origin & Destination */}
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Origin */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                Origin Point
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={originQuery}
                  onChange={(e) => setOriginQuery(e.target.value)}
                  onFocus={() => setShowOriginSuggestions(true)}
                  placeholder="City, state, or address..."
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
              </div>

              {/* Suggestions Dropdown */}
              {showOriginSuggestions && originSuggestions.length > 0 && (
                <div className="absolute z-30 mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 shadow-2xl max-h-56 overflow-y-auto">
                  {originSuggestions.map((sug, i) => (
                    <button
                      key={sug.id || i}
                      type="button"
                      onClick={() => {
                        setOriginPoint({ name: sug.name, coordinates: sug.coordinates });
                        setOriginQuery(sug.name);
                        setShowOriginSuggestions(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-cyan-300 border-b border-slate-800/60 last:border-b-0 flex items-center gap-2"
                    >
                      <MapPin className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                      <span className="truncate">{sug.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Destination */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-rose-400" />
                Destination Point
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={destinationQuery}
                  onChange={(e) => setDestinationQuery(e.target.value)}
                  onFocus={() => setShowDestSuggestions(true)}
                  placeholder="City, state, or address..."
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
              </div>

              {/* Suggestions Dropdown */}
              {showDestSuggestions && destSuggestions.length > 0 && (
                <div className="absolute z-30 mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 shadow-2xl max-h-56 overflow-y-auto">
                  {destSuggestions.map((sug, i) => (
                    <button
                      key={sug.id || i}
                      type="button"
                      onClick={() => {
                        setDestinationPoint({ name: sug.name, coordinates: sug.coordinates });
                        setDestinationQuery(sug.name);
                        setShowDestSuggestions(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-cyan-300 border-b border-slate-800/60 last:border-b-0 flex items-center gap-2"
                    >
                      <MapPin className="h-3 w-3 text-rose-400 flex-shrink-0" />
                      <span className="truncate">{sug.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Center Swap Button */}
            <button
              type="button"
              onClick={handleSwapLocations}
              title="Swap Origin and Destination"
              className="hidden md:flex absolute left-1/2 top-[29px] -translate-x-1/2 z-10 h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 shadow-md transition-all"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Departure Date/Time & Truck Load Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Departure Date/Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                Departure Date & Time
              </label>
              <input
                type="datetime-local"
                min={nowMinStr}
                value={departureDateTime}
                onChange={(e) => setDepartureDateTime(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
              />
            </div>

            {/* Truck Load Weight */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Weight className="h-3.5 w-3.5 text-cyan-400" />
                  Cargo Load Weight (lb)
                </span>
                <span className="text-[10px] text-slate-400">
                  {loadWeightLb > 40000
                    ? "Severe Crosswind Rule Active"
                    : loadWeightLb > 30000
                    ? "No-Travel Rule Active"
                    : "Standard"}
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="120000"
                  step="500"
                  value={loadWeightLb}
                  onChange={(e) => setLoadWeightLb(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3.5 py-2 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
                />
                <span className="absolute right-3 top-2 text-xs font-semibold text-slate-500">
                  lb
                </span>
              </div>
              {/* Load preset chips */}
              <div className="flex items-center gap-1.5 mt-1.5">
                {[
                  { label: "15k (Empty)", val: 15000 },
                  { label: "32k (Mid)", val: 32000 },
                  { label: "45k (Heavy)", val: 45000 },
                ].map((chip) => (
                  <button
                    key={chip.val}
                    type="button"
                    onClick={() => setLoadWeightLb(chip.val)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-medium transition-colors border",
                      loadWeightLb === chip.val
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Weather Sampling Interval */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
                Weather Sampling Interval
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {([10, 25, 50] as SamplingIntervalMiles[]).map((interval) => (
                  <button
                    key={interval}
                    type="button"
                    onClick={() => setSamplingInterval(interval)}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 rounded-xl text-xs font-semibold border transition-all",
                      samplingInterval === interval
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm"
                        : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850"
                    )}
                  >
                    <span>{interval} mi</span>
                    <span className="text-[9px] font-normal text-slate-400">
                      {interval === 25 ? "Standard" : interval === 10 ? "Granular" : "High-speed"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex items-center justify-between">
            <div className="text-xs text-slate-400 hidden sm:block">
              Sampling checkpoints at <strong className="text-slate-200">{samplingInterval} mi</strong> intervals with proportional ETAs.
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full sm:w-auto px-8 py-3 text-sm font-bold tracking-wide"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isLoading ? "Sampling Weather & Evaluating Risk..." : "Analyze Alternative Routes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

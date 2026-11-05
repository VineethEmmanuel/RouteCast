"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { RouteInputForm } from "@/components/routes/RouteInputForm";
import { RouteComparisonCards } from "@/components/routes/RouteComparisonCards";
import { RouteExplainabilityCard } from "@/components/routes/RouteExplainabilityCard";
import { RouteMap } from "@/components/maps/RouteMap";
import { ForecastTimelineSlider } from "@/components/maps/ForecastTimelineSlider";
import { CheckpointDetailsDrawer } from "@/components/weather/CheckpointDetailsDrawer";
import { CheckpointTable } from "@/components/weather/CheckpointTable";
import { TokenModal } from "@/components/settings/TokenModal";
import { GuidelinesModal } from "@/components/dashboard/GuidelinesModal";
import {
  Checkpoint,
  LocationPoint,
  RouteAnalysisResult,
  SamplingIntervalMiles,
  WeatherVariable,
} from "@/types/routing";
import { AlertCircle, Compass, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const [analysisResult, setAnalysisResult] = useState<RouteAnalysisResult | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Map & Timeline state
  const [activeLayer, setActiveLayer] = useState<WeatherVariable>("composite");
  const [selectedHourOffset, setSelectedHourOffset] = useState<number>(0);

  // Modals & Navigation
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isGuidelinesModalOpen, setIsGuidelinesModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"planner" | "history" | "guidelines">("planner");
  const [mapboxToken, setMapboxToken] = useState<string>("");

  // Presets from sidebar
  const [presetOrigin, setPresetOrigin] = useState<LocationPoint | null>(null);
  const [presetDestination, setPresetDestination] = useState<LocationPoint | null>(null);

  // Load client Mapbox token on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("routecast_mapbox_token") || "";
      setMapboxToken(stored);
    }
  }, []);

  // Run analysis handler
  const handleAnalyze = async (params: {
    origin: LocationPoint;
    destination: LocationPoint;
    departureTime: string;
    loadWeightLb: number;
    samplingIntervalMiles: SamplingIntervalMiles;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSelectedCheckpoint(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...params,
          clientMapboxToken: mapboxToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze routes");
      }

      setAnalysisResult(data);
      // Auto-select recommended route, or first route if none
      setSelectedRouteId(data.recommendedRouteId || (data.routes[0]?.id ?? null));
      setSelectedHourOffset(0);
    } catch (err: any) {
      console.error("Analysis execution error:", err);
      setErrorMessage(err.message || "An error occurred while evaluating route alternatives.");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger initial analysis on mount (Chicago to Denver corridor)
  useEffect(() => {
    const initialDep = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    handleAnalyze({
      origin: {
        name: "Chicago, Illinois, United States",
        coordinates: [-87.6298, 41.8781],
      },
      destination: {
        name: "Denver, Colorado, United States",
        coordinates: [-104.9903, 39.7392],
      },
      departureTime: initialDep,
      loadWeightLb: 35000,
      samplingIntervalMiles: 25,
    });
  }, []);

  const handleSelectPreset = (origin: LocationPoint, dest: LocationPoint, label: string) => {
    setPresetOrigin(origin);
    setPresetDestination(dest);
    const depTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    handleAnalyze({
      origin,
      destination: dest,
      departureTime: depTime,
      loadWeightLb: 35000,
      samplingIntervalMiles: 25,
    });
  };

  // Find currently selected route
  const currentRoute =
    analysisResult?.routes.find((r) => r.id === selectedRouteId) ||
    analysisResult?.routes[0] ||
    null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080d1a]">
      {/* Sidebar */}
      <Sidebar
        onSelectPreset={handleSelectPreset}
        onOpenSettings={() => setIsTokenModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === "guidelines") setIsGuidelinesModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* Header */}
        <Header
          onOpenSettings={() => setIsTokenModalOpen(true)}
          hasMapboxToken={Boolean(mapboxToken)}
          routingEngine={analysisResult?.routingEngine}
        />

        {/* Dashboard Workspace */}
        <main className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-xs text-red-300 shadow-xl">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
              <div className="flex-1">
                <strong>Analysis Error:</strong> {errorMessage}
              </div>
            </div>
          )}

          {/* Section 1: Route Input Form */}
          <RouteInputForm
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            presetOrigin={presetOrigin}
            presetDestination={presetDestination}
          />

          {/* Section 2: Interactive Map & 48h Forecast Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>Interactive Corridor Map & Weather Heatmap</span>
                {analysisResult && (
                  <span className="text-xs font-mono font-normal text-cyan-400">
                    ({analysisResult.samplingIntervalMiles} mi checkpoints)
                  </span>
                )}
              </h2>
            </div>

            <RouteMap
              routes={analysisResult?.routes || []}
              selectedRouteId={selectedRouteId}
              onSelectRoute={setSelectedRouteId}
              onSelectCheckpoint={setSelectedCheckpoint}
              selectedCheckpointId={selectedCheckpoint?.id}
              activeLayer={activeLayer}
              selectedHourOffset={selectedHourOffset}
              mapboxToken={mapboxToken}
              onOpenTokenModal={() => setIsTokenModalOpen(true)}
            />

            {/* 48h Forecast Timeline Slider */}
            {analysisResult && (
              <ForecastTimelineSlider
                departureTimeIso={analysisResult.departureTime}
                selectedHourOffset={selectedHourOffset}
                onHourOffsetChange={setSelectedHourOffset}
                activeLayer={activeLayer}
                onLayerChange={setActiveLayer}
              />
            )}
          </div>

          {/* Section 3: Route Comparison Cards */}
          {analysisResult && (
            <RouteComparisonCards
              routes={analysisResult.routes}
              selectedRouteId={selectedRouteId}
              onSelectRoute={setSelectedRouteId}
            />
          )}

          {/* Section 4: Explainability & Decision Breakdown */}
          {analysisResult && (
            <RouteExplainabilityCard analysis={analysisResult} />
          )}

          {/* Section 5: Checkpoint Milepost Log Table */}
          {currentRoute && (
            <CheckpointTable
              checkpoints={currentRoute.checkpoints}
              onSelectCheckpoint={setSelectedCheckpoint}
              selectedCheckpointId={selectedCheckpoint?.id}
            />
          )}
        </main>
      </div>

      {/* Checkpoint Details Drawer */}
      <CheckpointDetailsDrawer
        checkpoint={selectedCheckpoint}
        onClose={() => setSelectedCheckpoint(null)}
        truckLoadWeightLb={analysisResult?.truckLoadWeightLb || 35000}
      />

      {/* Settings / Token Modal */}
      <TokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onTokenSaved={(newToken) => {
          setMapboxToken(newToken);
          if (analysisResult) {
            // Re-run analysis with the new token
            handleAnalyze({
              origin: analysisResult.origin,
              destination: analysisResult.destination,
              departureTime: analysisResult.departureTime,
              loadWeightLb: analysisResult.truckLoadWeightLb,
              samplingIntervalMiles: analysisResult.samplingIntervalMiles,
            });
          }
        }}
      />

      {/* Safety Guidelines Modal */}
      <GuidelinesModal
        isOpen={isGuidelinesModalOpen}
        onClose={() => {
          setIsGuidelinesModalOpen(false);
          setActiveTab("planner");
        }}
      />
    </div>
  );
}

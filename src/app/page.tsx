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
import { AlertCircle } from "lucide-react";

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

  useEffect(() => {
    const initToken = async () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("routecast_mapbox_token");
        if (stored && stored.trim().length > 0) {
          setMapboxToken(stored.trim());
          return;
        }
      }
      try {
        const res = await fetch("/api/config");
        if (res.ok) {
          const data = await res.json();
          if (data.mapboxToken) {
            setMapboxToken(data.mapboxToken);
          }
        }
      } catch (err) {
        console.warn("Server config fetch error:", err);
      }
    };

    initToken();
  }, []);

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
      setSelectedRouteId(data.recommendedRouteId || (data.routes[0]?.id ?? null));
      setSelectedHourOffset(0);
    } catch (err: any) {
      console.error("Analysis execution error:", err);
      setErrorMessage(err.message || "An error occurred while evaluating route alternatives.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial analysis on mount (Chicago to Denver corridor)
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

  const currentRoute =
    analysisResult?.routes.find((r) => r.id === selectedRouteId) ||
    analysisResult?.routes[0] ||
    null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F8FA]">
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
        <main className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto w-full">
          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2.5 rounded-md bg-[#FCEEEE] border border-[#F5C2C2] p-3 text-xs text-[#B82E2E] shadow-subtle">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-[#D94B4B]" />
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
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#687582]">
                Corridor Map & Weather Visualization
              </h2>
              {analysisResult && (
                <span className="text-xs font-mono tabular-nums text-[#687582]">
                  {analysisResult.samplingIntervalMiles} mi checkpoints
                </span>
              )}
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

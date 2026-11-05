"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  EvaluatedRoute,
  Checkpoint,
  WeatherVariable,
  RISK_COLORS,
  RiskLevel,
} from "@/types/routing";
import { Key, Maximize2, Minimize2, ZoomIn, ZoomOut, AlertCircle, RefreshCw } from "lucide-react";
import { classifyWindRisk, classifyRainRisk, classifySnowRisk } from "@/lib/risk/classifier";

interface RouteMapProps {
  routes: EvaluatedRoute[];
  selectedRouteId: string | null;
  onSelectRoute: (id: string) => void;
  onSelectCheckpoint: (cp: Checkpoint) => void;
  selectedCheckpointId?: string | null;
  activeLayer: WeatherVariable;
  selectedHourOffset: number;
  mapboxToken?: string;
  onOpenTokenModal: () => void;
}

const ROUTE_COLORS = {
  1: "#06b6d4", // Cyan
  2: "#a855f7", // Purple
  3: "#f59e0b", // Amber
};

export const RouteMap: React.FC<RouteMapProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  onSelectCheckpoint,
  selectedCheckpointId,
  activeLayer,
  selectedHourOffset,
  mapboxToken,
  onOpenTokenModal,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [tokenMissing, setTokenMissing] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const activeToken =
    mapboxToken ||
    (typeof window !== "undefined"
      ? localStorage.getItem("routecast_mapbox_token")
      : null) ||
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    "";

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!activeToken || activeToken.trim().length === 0) {
      setTokenMissing(true);
      return;
    }

    setTokenMissing(false);
    setMapError(null);

    try {
      mapboxgl.accessToken = activeToken;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [-98.5795, 39.8283], // Geographic center of US
        zoom: 3.8,
        attributionControl: false,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");

      map.on("load", () => {
        mapRef.current = map;
        setMapLoaded(true);
      });

      map.on("error", (e) => {
        const errObj = e?.error as any;
        if (errObj?.message?.includes("Forbidden") || errObj?.status === 401) {
          setMapError("Invalid Mapbox Access Token. Please verify in token settings.");
        }
      });

      return () => {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
        map.remove();
        mapRef.current = null;
        setMapLoaded(false);
      };
    } catch (err: any) {
      console.error("Mapbox init failed:", err);
      setMapError(err.message || "Failed to initialize Mapbox GL");
    }
  }, [activeToken]);

  // Update Route Layers and Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !routes || routes.length === 0) return;

    // Clear existing HTML markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add or update route GeoJSON sources & layers for all 3 routes
    const bounds = new mapboxgl.LngLatBounds();

    routes.forEach((route) => {
      const isSelected = route.id === selectedRouteId;
      const routeIdx = route.index;
      const baseColor = ROUTE_COLORS[routeIdx as 1 | 2 | 3] || "#06b6d4";

      const sourceId = `route-source-${route.id}`;
      const casingLayerId = `route-casing-${route.id}`;
      const lineLayerId = `route-line-${route.id}`;

      const geojsonData: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        properties: {
          routeId: route.id,
          name: route.name,
          isSelected,
        },
        geometry: route.geometry,
      };

      // Extend bounds
      route.geometry.coordinates.forEach((coord) => {
        bounds.extend(coord as [number, number]);
      });

      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(geojsonData);
      } else {
        map.addSource(sourceId, {
          type: "geojson",
          data: geojsonData,
        });

        // Background casing glow
        map.addLayer({
          id: casingLayerId,
          type: "line",
          source: sourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": isSelected ? baseColor : "#000000",
            "line-width": isSelected ? 9 : 4,
            "line-opacity": isSelected ? 0.4 : 0.2,
          },
        });

        // Main route line
        map.addLayer({
          id: lineLayerId,
          type: "line",
          source: sourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": baseColor,
            "line-width": isSelected ? 5 : 3,
            "line-opacity": isSelected ? 1.0 : 0.45,
          },
        });

        // Click on route line selects it
        map.on("click", lineLayerId, () => {
          onSelectRoute(route.id);
        });

        map.on("mouseenter", lineLayerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", lineLayerId, () => {
          map.getCanvas().style.cursor = "";
        });
      }

      // Update styling based on selected state
      if (map.getLayer(lineLayerId)) {
        map.setPaintProperty(lineLayerId, "line-width", isSelected ? 5 : 3);
        map.setPaintProperty(lineLayerId, "line-opacity", isSelected ? 1.0 : 0.4);
      }
      if (map.getLayer(casingLayerId)) {
        map.setPaintProperty(casingLayerId, "line-width", isSelected ? 9 : 4);
        map.setPaintProperty(casingLayerId, "line-opacity", isSelected ? 0.35 : 0.15);
      }
    });

    // Add Checkpoints for the selected route
    const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

    if (selectedRoute && selectedRoute.checkpoints) {
      selectedRoute.checkpoints.forEach((cp, idx) => {
        // Evaluate dynamic conditions at selected hour offset
        let displayColor = RISK_COLORS[cp.risk.finalRisk].hex;
        let tooltipText = `${cp.risk.finalRisk} (${cp.weather.windSpeed} mph)`;

        if (cp.timeline48h && cp.timeline48h[selectedHourOffset]) {
          const entry = cp.timeline48h[selectedHourOffset];
          if (activeLayer === "wind") {
            const wRisk = classifyWindRisk(entry.windSpeed);
            displayColor = RISK_COLORS[wRisk].hex;
            tooltipText = `Wind: ${entry.windSpeed} mph (${wRisk})`;
          } else if (activeLayer === "rain") {
            const rRisk = classifyRainRisk(entry.precipitation);
            displayColor = RISK_COLORS[rRisk].hex;
            tooltipText = `Rain: ${entry.precipitation} in/hr (${rRisk})`;
          } else if (activeLayer === "snow") {
            const sRisk = classifySnowRisk(entry.snowfall);
            displayColor = RISK_COLORS[sRisk].hex;
            tooltipText = `Snow: ${entry.snowfall} in/hr (${sRisk})`;
          } else {
            // Composite hazard
            displayColor = RISK_COLORS[entry.risk].hex;
            tooltipText = `Hazard Risk: ${entry.risk}`;
          }
        }

        // Custom HTML Marker element
        const el = document.createElement("div");
        const isSelectedCp = selectedCheckpointId === cp.id;

        el.className = `checkpoint-marker flex items-center justify-center font-mono font-bold text-[10px] text-slate-950 transition-transform cursor-pointer shadow-lg select-none`;
        el.style.width = isSelectedCp ? "26px" : "20px";
        el.style.height = isSelectedCp ? "26px" : "20px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = displayColor;
        el.style.border = isSelectedCp ? "3px solid #ffffff" : "2px solid #0f172a";
        el.style.zIndex = isSelectedCp ? "20" : "10";
        el.innerText = `${cp.index}`;

        // Popup on click
        const popup = new mapboxgl.Popup({ offset: 12, closeButton: false }).setHTML(`
          <div class="p-3 text-xs font-sans text-slate-200 min-w-[170px]">
            <div class="font-bold text-white text-xs flex items-center justify-between gap-2 border-b border-slate-700 pb-1.5 mb-1.5">
              <span>Checkpoint #${cp.index}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded font-mono" style="background-color: ${displayColor}33; color: ${displayColor}">
                ${cp.distanceFromOriginMiles.toFixed(0)} mi
              </span>
            </div>
            <div class="text-[11px] text-slate-300 space-y-1">
              <div>${tooltipText}</div>
              <div class="text-[10px] text-slate-400">Temp: ${cp.weather.temperature}°F</div>
            </div>
          </div>
        `);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectCheckpoint(cp);
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(cp.coordinates)
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });

      // Add Origin Marker (Green Truck)
      const originCoord = selectedRoute.geometry.coordinates[0];
      const originEl = document.createElement("div");
      originEl.className =
        "flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold border-2 border-white shadow-xl";
      originEl.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
      `;
      const originMarker = new mapboxgl.Marker({ element: originEl })
        .setLngLat(originCoord as [number, number])
        .addTo(map);
      markersRef.current.push(originMarker);

      // Add Destination Marker (Red Flag)
      const lastIdx = selectedRoute.geometry.coordinates.length - 1;
      const destCoord = selectedRoute.geometry.coordinates[lastIdx];
      const destEl = document.createElement("div");
      destEl.className =
        "flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500 text-white font-bold border-2 border-white shadow-xl";
      destEl.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
      `;
      const destMarker = new mapboxgl.Marker({ element: destEl })
        .setLngLat(destCoord as [number, number])
        .addTo(map);
      markersRef.current.push(destMarker);
    }

    // Fit map bounds with padding
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: { top: 60, bottom: 60, left: 60, right: 60 },
        maxZoom: 12,
        duration: 1200,
      });
    }
  }, [
    routes,
    selectedRouteId,
    selectedCheckpointId,
    mapLoaded,
    activeLayer,
    selectedHourOffset,
  ]);

  const handleResetBounds = () => {
    if (!mapRef.current || !routes || routes.length === 0) return;
    const bounds = new mapboxgl.LngLatBounds();
    routes.forEach((r) => {
      r.geometry.coordinates.forEach((c) => bounds.extend(c as [number, number]));
    });
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, {
        padding: 50,
        duration: 800,
      });
    }
  };

  return (
    <div className="relative h-[540px] w-full rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
      {/* Map Container */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Missing Token Setup Overlay */}
      {tokenMissing && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-6">
          <div className="max-w-md text-center space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Mapbox Token Required</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                To render live vector maps and weather corridors, configure your free Mapbox public token.
              </p>
            </div>
            <button
              onClick={onOpenTokenModal}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-teal-400 transition-all"
            >
              <Key className="h-4 w-4" />
              Configure Token Now
            </button>
          </div>
        </div>
      )}

      {/* Map Error Banner */}
      {mapError && (
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-950/90 px-4 py-2.5 text-xs text-red-200 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <span>{mapError}</span>
          </div>
          <button
            onClick={onOpenTokenModal}
            className="rounded bg-red-900/60 hover:bg-red-800 px-2.5 py-1 text-[11px] font-semibold text-white underline"
          >
            Update Token
          </button>
        </div>
      )}

      {/* Floating Map Legend & Route Selector */}
      {routes && routes.length > 0 && (
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          {/* Active Route Selector Pills */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800/90 bg-slate-950/85 p-1.5 backdrop-blur-md shadow-xl text-xs font-bold">
            {routes.map((route) => {
              const isSelected = selectedRouteId === route.id;
              const color = ROUTE_COLORS[route.index as 1 | 2 | 3] || "#06b6d4";

              return (
                <button
                  key={route.id}
                  onClick={() => onSelectRoute(route.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    isSelected
                      ? "bg-slate-800 text-white shadow-md border border-slate-700"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span>Route {route.index}</span>
                  {route.isRecommended && (
                    <span className="text-[10px] text-teal-400 font-extrabold">★</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Map Controls (Reset Bounds) */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={handleResetBounds}
          title="Fit Corridor Bounds"
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/90 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 shadow-xl backdrop-blur-md transition-colors"
        >
          <Maximize2 className="h-3.5 w-3.5 text-cyan-400" />
          <span>Fit Corridor</span>
        </button>
      </div>

      {/* Severity Color Legend Pill */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/85 px-3 py-1.5 text-[10px] font-mono backdrop-blur-md shadow-xl">
        <span className="text-slate-400 font-sans font-semibold">Corridor Hazards:</span>
        <span className="flex items-center gap-1 text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Low
        </span>
        <span className="flex items-center gap-1 text-amber-400">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> Mod
        </span>
        <span className="flex items-center gap-1 text-orange-400">
          <span className="h-2 w-2 rounded-full bg-orange-500" /> High
        </span>
        <span className="flex items-center gap-1 text-red-400">
          <span className="h-2 w-2 rounded-full bg-red-500" /> Severe
        </span>
        <span className="flex items-center gap-1 text-rose-400">
          <span className="h-2 w-2 rounded-full bg-rose-800" /> No Travel
        </span>
      </div>
    </div>
  );
};

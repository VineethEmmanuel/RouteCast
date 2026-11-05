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
import { Key, Maximize2, AlertCircle } from "lucide-react";
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
  1: "#087E8B", // Primary Deep Teal
  2: "#4F46E5", // Indigo
  3: "#64748B", // Slate
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

  // Initialize Mapbox map with Light theme
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
        style: "mapbox://styles/mapbox/light-v11",
        center: [-98.5795, 39.8283], // Center of US
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

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();

    routes.forEach((route) => {
      const isSelected = route.id === selectedRouteId;
      const routeIdx = route.index;
      const baseColor = ROUTE_COLORS[routeIdx as 1 | 2 | 3] || "#087E8B";

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

        // Casing layer for contrast
        map.addLayer({
          id: casingLayerId,
          type: "line",
          source: sourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": isSelected ? baseColor : "#94A3B8",
            "line-width": isSelected ? 8 : 4,
            "line-opacity": isSelected ? 0.25 : 0.1,
          },
        });

        // Main line layer
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
            "line-width": isSelected ? 4.5 : 2.5,
            "line-opacity": isSelected ? 1.0 : 0.35,
          },
        });

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

      // Update line style for selected state
      if (map.getLayer(lineLayerId)) {
        map.setPaintProperty(lineLayerId, "line-width", isSelected ? 4.5 : 2.5);
        map.setPaintProperty(lineLayerId, "line-opacity", isSelected ? 1.0 : 0.35);
      }
      if (map.getLayer(casingLayerId)) {
        map.setPaintProperty(casingLayerId, "line-width", isSelected ? 8 : 4);
        map.setPaintProperty(casingLayerId, "line-opacity", isSelected ? 0.25 : 0.08);
      }
    });

    // Add Checkpoints for the active route
    const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

    if (activeRoute && activeRoute.checkpoints) {
      activeRoute.checkpoints.forEach((cp) => {
        let displayColor = RISK_COLORS[cp.risk.finalRisk].hex;
        let metricInfo = `${cp.risk.finalRisk} (${cp.weather.windSpeed} mph)`;

        if (cp.timeline48h && cp.timeline48h[selectedHourOffset]) {
          const entry = cp.timeline48h[selectedHourOffset];
          if (activeLayer === "wind") {
            const wRisk = classifyWindRisk(entry.windSpeed);
            displayColor = RISK_COLORS[wRisk].hex;
            metricInfo = `Wind: ${entry.windSpeed} mph (${wRisk})`;
          } else if (activeLayer === "rain") {
            const rRisk = classifyRainRisk(entry.precipitation);
            displayColor = RISK_COLORS[rRisk].hex;
            metricInfo = `Rain: ${entry.precipitation} in/hr (${rRisk})`;
          } else if (activeLayer === "snow") {
            const sRisk = classifySnowRisk(entry.snowfall);
            displayColor = RISK_COLORS[sRisk].hex;
            metricInfo = `Snow: ${entry.snowfall} in/hr (${sRisk})`;
          } else {
            displayColor = RISK_COLORS[entry.risk].hex;
            metricInfo = `Risk: ${entry.risk}`;
          }
        }

        const isSelectedCp = selectedCheckpointId === cp.id;
        const el = document.createElement("div");

        el.className = `checkpoint-marker flex items-center justify-center font-mono tabular-nums text-[10px] font-semibold transition-all cursor-pointer select-none`;
        el.style.width = isSelectedCp ? "24px" : "18px";
        el.style.height = isSelectedCp ? "24px" : "18px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = displayColor;
        el.style.color = "#FFFFFF";
        el.style.border = isSelectedCp ? "2.5px solid #17212B" : "1.5px solid #FFFFFF";
        el.style.boxShadow = isSelectedCp
          ? "0 4px 10px rgba(0,0,0,0.3)"
          : "0 1px 3px rgba(0,0,0,0.2)";
        el.style.zIndex = isSelectedCp ? "30" : "15";
        el.innerText = `${cp.index}`;

        const popup = new mapboxgl.Popup({ offset: 10, closeButton: false }).setHTML(`
          <div style="padding: 10px 12px; font-family: var(--font-sans), sans-serif; font-size: 12px; color: #17212B; min-width: 160px;">
            <div style="font-weight: 600; font-size: 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E7EBEF; padding-bottom: 6px; margin-bottom: 6px;">
              <span>Checkpoint #${cp.index}</span>
              <span style="font-family: var(--font-mono), monospace; font-size: 11px; color: #687582;">${cp.distanceFromOriginMiles.toFixed(0)} mi</span>
            </div>
            <div style="font-size: 11px; color: #687582; line-height: 1.5;">
              <div style="font-weight: 500; color: #17212B;">${metricInfo}</div>
              <div>Temp: ${cp.weather.temperature}°F • ${cp.weather.weatherDescription}</div>
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

      // Origin Marker (Clean Green Pin)
      const originCoord = activeRoute.geometry.coordinates[0];
      const originEl = document.createElement("div");
      originEl.className = "flex h-6 w-6 items-center justify-center rounded-full bg-[#16865D] text-white shadow-subtle border-2 border-white";
      originEl.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/></svg>`;
      const originMarker = new mapboxgl.Marker({ element: originEl })
        .setLngLat(originCoord as [number, number])
        .addTo(map);
      markersRef.current.push(originMarker);

      // Destination Marker (Clean Red Square Pin)
      const lastIdx = activeRoute.geometry.coordinates.length - 1;
      const destCoord = activeRoute.geometry.coordinates[lastIdx];
      const destEl = document.createElement("div");
      destEl.className = "flex h-6 w-6 items-center justify-center rounded bg-[#D94B4B] text-white shadow-subtle border-2 border-white";
      destEl.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12"/></svg>`;
      const destMarker = new mapboxgl.Marker({ element: destEl })
        .setLngLat(destCoord as [number, number])
        .addTo(map);
      markersRef.current.push(destMarker);
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: { top: 40, bottom: 40, left: 40, right: 40 },
        maxZoom: 11,
        duration: 900,
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

  const handleFitBounds = () => {
    if (!mapRef.current || !routes || routes.length === 0) return;
    const bounds = new mapboxgl.LngLatBounds();
    routes.forEach((r) => {
      r.geometry.coordinates.forEach((c) => bounds.extend(c as [number, number]));
    });
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: 40, duration: 600 });
    }
  };

  return (
    <div className="relative h-[480px] w-full rounded-lg border border-[#E7EBEF] bg-[#F7F8FA] overflow-hidden shadow-subtle">
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Token Missing State */}
      {tokenMissing && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/90 backdrop-blur-xs p-6">
          <div className="max-w-sm text-center space-y-3 rounded-lg border border-[#E7EBEF] bg-white p-5 shadow-dropdown">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-md bg-[#E6F3F5] text-[#087E8B]">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#17212B]">Mapbox Access Token Setup</h3>
              <p className="mt-1 text-xs text-[#687582] leading-normal">
                To render live vector maps and weather corridors, configure your free Mapbox public token.
              </p>
            </div>
            <button
              onClick={onOpenTokenModal}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#087E8B] px-3.5 py-1.5 text-xs font-medium text-white shadow-subtle hover:bg-[#075B65] transition-colors"
            >
              <Key className="h-3.5 w-3.5" />
              Configure Token
            </button>
          </div>
        </div>
      )}

      {/* Map Error Banner */}
      {mapError && (
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between rounded-md border border-[#F5C2C2] bg-[#FCEEEE] px-3 py-2 text-xs text-[#B82E2E] shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[#D94B4B] flex-shrink-0" />
            <span>{mapError}</span>
          </div>
          <button
            onClick={onOpenTokenModal}
            className="text-xs font-semibold underline hover:text-[#861F2D]"
          >
            Update Token
          </button>
        </div>
      )}

      {/* Floating Route Switcher (Top Left) */}
      {routes && routes.length > 0 && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-white border border-[#E7EBEF] p-1 rounded-md shadow-subtle">
          {routes.map((route) => {
            const isSelected = selectedRouteId === route.id;
            const color = ROUTE_COLORS[route.index as 1 | 2 | 3] || "#087E8B";

            return (
              <button
                key={route.id}
                onClick={() => onSelectRoute(route.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-[#F4F5F7] text-[#17212B] font-semibold"
                    : "text-[#687582] hover:text-[#17212B] hover:bg-[#F7F8FA]"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span>Route {route.index}</span>
                {route.isRecommended && (
                  <span className="text-[10px] text-[#087E8B] font-bold">★</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Reset Bounds Control (Bottom Right) */}
      <div className="absolute bottom-3 right-3 z-10">
        <button
          onClick={handleFitBounds}
          title="Fit Corridor View"
          className="flex items-center gap-1.5 rounded-md border border-[#E7EBEF] bg-white px-2.5 py-1.5 text-xs font-medium text-[#687582] hover:text-[#17212B] hover:bg-[#F4F5F7] shadow-subtle transition-colors"
        >
          <Maximize2 className="h-3.5 w-3.5 text-[#087E8B]" />
          <span>Fit Corridor</span>
        </button>
      </div>

      {/* Minimal Severity Indicator (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-3 bg-white/95 border border-[#E7EBEF] px-2.5 py-1 rounded-md text-[11px] text-[#687582] shadow-subtle">
        <span className="font-medium text-[#17212B]">Risk:</span>
        <span className="flex items-center gap-1 text-[#16865D]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#16865D]" /> Low
        </span>
        <span className="flex items-center gap-1 text-[#D69B24]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#D69B24]" /> Mod
        </span>
        <span className="flex items-center gap-1 text-[#E47B35]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E47B35]" /> High
        </span>
        <span className="flex items-center gap-1 text-[#D94B4B]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#D94B4B]" /> Severe
        </span>
        <span className="flex items-center gap-1 text-[#861F2D]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#861F2D]" /> No Travel
        </span>
      </div>
    </div>
  );
};

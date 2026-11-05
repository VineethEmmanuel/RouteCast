import { RawRouteGeometry } from "@/types/routing";
import { DEFAULT_MAPBOX_TOKEN } from "@/lib/constants";

export interface FetchedRawRoute {
  index: number;
  name: string;
  summary: string;
  distanceMeters: number;
  durationSeconds: number;
  geometry: RawRouteGeometry;
}

export interface RoutingEngineResponse {
  engine: "mapbox" | "osrm";
  routes: FetchedRawRoute[];
  warning?: string;
}

/**
 * Fetches up to three alternative driving routes using Mapbox Directions API.
 * If Mapbox token is not configured or fails, uses OSRM driving engine as a graceful fallback.
 * Never fabricates routes if fewer alternatives exist.
 */
export async function fetchRouteAlternatives(params: {
  origin: [number, number]; // [lng, lat]
  destination: [number, number]; // [lng, lat]
  mapboxToken?: string;
}): Promise<RoutingEngineResponse> {
  const { origin, destination, mapboxToken } = params;

  const token =
    mapboxToken ||
    process.env.MAPBOX_ACCESS_TOKEN ||
    process.env.MAPBOX_SECRET_TOKEN ||
    DEFAULT_MAPBOX_TOKEN;

  // Try Mapbox Directions API if token is available
  if (token && token.trim().length > 0) {
    try {
      const coords = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?alternatives=true&geometries=geojson&overview=full&steps=false&access_token=${token}`;

      const res = await fetch(url, { headers: { Accept: "application/json" } });

      if (res.ok) {
        const data = await res.json();
        if (data.routes && Array.isArray(data.routes) && data.routes.length > 0) {
          // Mapbox returns up to 3 routes when alternatives=true
          const routes: FetchedRawRoute[] = data.routes.slice(0, 3).map((r: any, idx: number) => {
            const summaryName = r.legs?.[0]?.summary
              ? `Route ${idx + 1} (via ${r.legs[0].summary})`
              : `Route ${idx + 1}`;

            return {
              index: idx,
              name: summaryName,
              summary: r.legs?.[0]?.summary || `Alternative ${idx + 1}`,
              distanceMeters: r.distance,
              durationSeconds: r.duration,
              geometry: r.geometry,
            };
          });

          return {
            engine: "mapbox",
            routes,
          };
        }
      }
    } catch (err) {
      console.warn("Mapbox directions request failed, attempting OSRM fallback:", err);
    }
  }

  // Fallback to OSRM driving router
  try {
    const coords = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&alternatives=true`;

    const res = await fetch(url, { headers: { Accept: "application/json" } });

    if (!res.ok) {
      throw new Error(`OSRM routing failed with status ${res.status}`);
    }

    const data = await res.json();
    if (data.code === "Ok" && Array.isArray(data.routes) && data.routes.length > 0) {
      const routes: FetchedRawRoute[] = data.routes.slice(0, 3).map((r: any, idx: number) => {
        const summary = r.legs?.[0]?.summary
          ? `Route ${idx + 1} (via ${r.legs[0].summary})`
          : `Route ${idx + 1}`;

        return {
          index: idx,
          name: summary,
          summary: r.legs?.[0]?.summary || `Corridor ${idx + 1}`,
          distanceMeters: r.distance,
          durationSeconds: r.duration,
          geometry: r.geometry,
        };
      });

      return {
        engine: "osrm",
        routes,
        warning: !token
          ? "Mapbox API token not set in environment. Running with OpenStreetMap / OSRM routing engine."
          : undefined,
      };
    }
  } catch (err: any) {
    throw new Error(`Routing services failed: ${err.message}`);
  }

  throw new Error("Unable to locate driving paths between the specified origin and destination.");
}


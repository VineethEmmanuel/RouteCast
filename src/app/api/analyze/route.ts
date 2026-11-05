import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchRouteAlternatives } from "@/lib/routing/mapbox";
import { processRouteGeometry } from "@/lib/routing/geometry";
import {
  fetchWeatherForCoordinates,
  extractCheckpointWeather,
} from "@/lib/weather/open-meteo";
import { evaluateCheckpointRisk } from "@/lib/risk/classifier";
import { aggregateRouteRisk } from "@/lib/risk/aggregator";
import { rankAndRecommendRoutes } from "@/lib/recommendation/engine";
import {
  Checkpoint,
  EvaluatedRoute,
  RouteAnalysisResult,
  SamplingIntervalMiles,
} from "@/types/routing";

const analyzeRequestSchema = z.object({
  origin: z.object({
    name: z.string().min(1, "Origin name required"),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  destination: z.object({
    name: z.string().min(1, "Destination name required"),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  departureTime: z.string().refine((val) => {
    const d = new Date(val);
    if (isNaN(d.getTime())) return false;
    // Allow up to 2 hours in past for minor time zone / client clock skew
    return d.getTime() >= Date.now() - 2 * 3600 * 1000;
  }, "Departure date/time cannot be in the past"),
  loadWeightLb: z.number().positive("Load weight must be a positive number"),
  samplingIntervalMiles: z.union([
    z.literal(10),
    z.literal(25),
    z.literal(50),
  ]),
  clientMapboxToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = analyzeRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input parameters",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const {
      origin,
      destination,
      departureTime,
      loadWeightLb,
      samplingIntervalMiles,
      clientMapboxToken,
    } = validation.data;

    // Step 1: Request up to 3 driving routes from routing engine
    const routingResult = await fetchRouteAlternatives({
      origin: origin.coordinates,
      destination: destination.coordinates,
      mapboxToken: clientMapboxToken,
    });

    if (!routingResult.routes || routingResult.routes.length === 0) {
      return NextResponse.json(
        { error: "No drivable routes found between specified locations." },
        { status: 404 }
      );
    }

    // Step 2: Process geometry and sample checkpoints along each route
    const processedRoutesMeta = routingResult.routes.map((rawRoute) => {
      const meta = processRouteGeometry({
        geometry: rawRoute.geometry,
        totalDistanceMeters: rawRoute.distanceMeters,
        totalDurationSeconds: rawRoute.durationSeconds,
        departureTimeIso: departureTime,
        samplingIntervalMiles: samplingIntervalMiles as SamplingIntervalMiles,
      });

      return {
        ...rawRoute,
        meta,
      };
    });

    // Step 3: Collect all checkpoint coordinates to batch query Open-Meteo
    // Determine how many days into the future the longest route ETA is
    const depTimeMs = new Date(departureTime).getTime();
    const maxDurationMs = Math.max(
      ...processedRoutesMeta.map((r) => r.meta.totalDurationMinutes * 60 * 1000)
    );
    const tripEndMs = depTimeMs + maxDurationMs;
    const daysAhead = Math.ceil((tripEndMs - Date.now()) / (24 * 3600 * 1000)) + 2;
    const forecastDays = Math.min(Math.max(daysAhead, 3), 16);

    // Flatten all coordinates for batch fetching
    const allCoords: [number, number][] = [];
    const routeCoordOffsets: { routeIndex: number; startIndex: number; count: number }[] = [];

    for (let rIdx = 0; rIdx < processedRoutesMeta.length; rIdx++) {
      const cps = processedRoutesMeta[rIdx].meta.checkpoints;
      const startIndex = allCoords.length;
      for (const cp of cps) {
        allCoords.push(cp.coordinates);
      }
      routeCoordOffsets.push({
        routeIndex: rIdx,
        startIndex,
        count: cps.length,
      });
    }

    // Batch fetch from Open-Meteo
    const rawWeatherResponses = await fetchWeatherForCoordinates(
      allCoords,
      forecastDays
    );

    // Step 4 & 5: Evaluate each route's checkpoints and aggregate risks
    const evaluatedRoutes: EvaluatedRoute[] = [];

    for (let rIdx = 0; rIdx < processedRoutesMeta.length; rIdx++) {
      const rMeta = processedRoutesMeta[rIdx];
      const offset = routeCoordOffsets[rIdx];
      const cpsMeta = rMeta.meta.checkpoints;

      const checkpoints: Checkpoint[] = [];

      for (let cIdx = 0; cIdx < cpsMeta.length; cIdx++) {
        const cpStub = cpsMeta[cIdx];
        const locationWeather = rawWeatherResponses[offset.startIndex + cIdx];

        // Extract weather at target ETA
        const extracted = extractCheckpointWeather(
          locationWeather,
          cpStub.estimatedArrivalTime,
          departureTime
        );

        // Evaluate risk against exact thresholds and load rules
        const riskEval = evaluateCheckpointRisk({
          windMph: extracted.weather.windSpeed,
          rainInchesPerHour: extracted.weather.precipitation,
          snowInchesPerHour: extracted.weather.snowfall,
          loadWeightLb,
          forecastAvailable: extracted.weather.forecastAvailable,
        });

        checkpoints.push({
          id: `${rMeta.index}-${cpStub.id}`,
          index: cpStub.index,
          coordinates: cpStub.coordinates,
          distanceFromOriginMiles: cpStub.distanceFromOriginMiles,
          travelTimeMinutes: cpStub.travelTimeMinutes,
          estimatedArrivalTime: cpStub.estimatedArrivalTime,
          weather: extracted.weather,
          risk: riskEval,
          timeline48h: extracted.timeline48h,
        });
      }

      // Aggregate route risk using segment distance allocation
      const { riskProfile, segments } = aggregateRouteRisk({
        checkpoints,
        totalDistanceMiles: rMeta.meta.totalDistanceMiles,
      });

      evaluatedRoutes.push({
        id: `route-${rIdx + 1}`,
        index: rIdx + 1,
        name: rMeta.name,
        summary: rMeta.summary,
        totalDistanceMiles: rMeta.meta.totalDistanceMiles,
        totalDurationMinutes: rMeta.meta.totalDurationMinutes,
        geometry: rMeta.meta.geometry,
        checkpoints,
        segments,
        riskProfile,
        isRecommended: false,
        recommendationRank: 0,
        recommendationNotes: [],
      });
    }

    // Step 6: Route Recommendation Engine
    const recommendationOutcome = rankAndRecommendRoutes(evaluatedRoutes);

    const result: RouteAnalysisResult = {
      routes: recommendationOutcome.rankedRoutes,
      recommendedRouteId: recommendationOutcome.recommendedRouteId,
      recommendationExplanation: recommendationOutcome.explanation,
      hasSafeRoute: recommendationOutcome.hasSafeRoute,
      samplingIntervalMiles: samplingIntervalMiles as SamplingIntervalMiles,
      truckLoadWeightLb: loadWeightLb,
      departureTime,
      origin,
      destination,
      generatedAt: new Date().toISOString(),
      routingEngine: routingResult.engine,
      message: routingResult.warning,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Route analysis pipeline failure:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during route analysis." },
      { status: 500 }
    );
  }
}


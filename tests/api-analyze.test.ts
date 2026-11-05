import { describe, it, expect } from "vitest";
import { evaluateCheckpointRisk } from "@/lib/risk/classifier";
import { rankAndRecommendRoutes } from "@/lib/recommendation/engine";
import { aggregateRouteRisk } from "@/lib/risk/aggregator";
import { processRouteGeometry } from "@/lib/routing/geometry";
import { RawRouteGeometry, Checkpoint } from "@/types/routing";

describe("End-to-End Pipeline Logic Integration", () => {
  it("processes route geometry, evaluates checkpoints, aggregates risks, and produces recommendations", () => {
    // 1. Mock geometry: Chicago to Milwaukee (~90 miles)
    const testGeometry: RawRouteGeometry = {
      type: "LineString",
      coordinates: [
        [-87.6298, 41.8781], // Chicago
        [-87.8, 42.4],
        [-87.9065, 43.0389], // Milwaukee
      ],
    };

    const departureIso = new Date(Date.now() + 3600 * 1000).toISOString();
    const processed = processRouteGeometry({
      geometry: testGeometry,
      totalDistanceMeters: 145000, // ~90 miles
      totalDurationSeconds: 5400, // 90 min
      departureTimeIso: departureIso,
      samplingIntervalMiles: 25,
    });

    expect(processed.checkpoints.length).toBeGreaterThanOrEqual(4);

    // 2. Evaluate checkpoints with varying weather
    const checkpoints: Checkpoint[] = processed.checkpoints.map((cp, idx) => {
      // Simulate adverse weather around checkpoint 2
      const windSpeed = idx === 2 ? 38 : 15;
      const precipitation = idx === 1 ? 0.35 : 0;
      const loadWeight = 42000;

      const riskEval = evaluateCheckpointRisk({
        windMph: windSpeed,
        rainInchesPerHour: precipitation,
        snowInchesPerHour: 0,
        loadWeightLb: loadWeight,
      });

      return {
        id: `cp-${idx}`,
        index: cp.index,
        coordinates: cp.coordinates,
        distanceFromOriginMiles: cp.distanceFromOriginMiles,
        travelTimeMinutes: cp.travelTimeMinutes,
        estimatedArrivalTime: cp.estimatedArrivalTime,
        weather: {
          temperature: 48,
          windSpeed,
          precipitation,
          snowfall: 0,
          weatherCode: precipitation > 0 ? 61 : 0,
          weatherDescription: precipitation > 0 ? "Rain" : "Clear",
          forecastAvailable: true,
          forecastTimestamp: cp.estimatedArrivalTime,
        },
        risk: riskEval,
      };
    });

    // Checkpoint 2: Wind 38 mph + load 42,000 lb -> Load rule 3 upgrades to Severe!
    expect(checkpoints[2].risk.finalRisk).toBe("Severe");
    expect(checkpoints[2].risk.loadAdjustmentApplied).toBe(true);

    // 3. Aggregate route risk
    const { riskProfile } = aggregateRouteRisk({
      checkpoints,
      totalDistanceMiles: processed.totalDistanceMiles,
    });

    expect(riskProfile.severeRiskMiles).toBeGreaterThan(0);
    expect(riskProfile.highRiskMiles).toBeGreaterThan(0);
    expect(riskProfile.averageRiskScore).toBeGreaterThan(0);

    // 4. Test recommendation with an alternative clear route
    const clearCheckpoints: Checkpoint[] = checkpoints.map((cp) => ({
      ...cp,
      weather: { ...cp.weather, windSpeed: 10, precipitation: 0 },
      risk: evaluateCheckpointRisk({
        windMph: 10,
        rainInchesPerHour: 0,
        snowInchesPerHour: 0,
        loadWeightLb: 42000,
      }),
    }));

    const clearAgg = aggregateRouteRisk({
      checkpoints: clearCheckpoints,
      totalDistanceMiles: processed.totalDistanceMiles + 5, // slightly longer
    });

    const route1 = {
      id: "route-1",
      index: 1,
      name: "Route 1 (via I-94)",
      summary: "I-94",
      totalDistanceMiles: processed.totalDistanceMiles,
      totalDurationMinutes: 90,
      geometry: testGeometry,
      checkpoints,
      segments: [],
      riskProfile,
      isRecommended: false,
      recommendationRank: 0,
      recommendationNotes: [],
    };

    const route2 = {
      id: "route-2",
      index: 2,
      name: "Route 2 (via US-41)",
      summary: "US-41",
      totalDistanceMiles: processed.totalDistanceMiles + 5,
      totalDurationMinutes: 98, // 8 minutes longer
      geometry: testGeometry,
      checkpoints: clearCheckpoints,
      segments: [],
      riskProfile: clearAgg.riskProfile,
      isRecommended: false,
      recommendationRank: 0,
      recommendationNotes: [],
    };

    const recommendation = rankAndRecommendRoutes([route1, route2]);

    // Route 2 must be recommended despite being 8 min longer because it has 0 severe miles vs Route 1!
    expect(recommendation.recommendedRouteId).toBe("route-2");
    expect(recommendation.explanation).toContain("Route 2 (via US-41) is recommended because it has 0.0 severe-risk miles");
  });
});


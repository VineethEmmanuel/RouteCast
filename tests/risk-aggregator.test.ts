import { describe, it, expect } from "vitest";
import { aggregateRouteRisk } from "@/lib/risk/aggregator";
import { Checkpoint } from "@/types/routing";

function mockCheckpoint(params: {
  index: number;
  distance: number;
  finalRisk: "Low" | "Moderate" | "High" | "Severe" | "No Travel";
  forecastAvailable?: boolean;
}): Checkpoint {
  const { index, distance, finalRisk, forecastAvailable = true } = params;
  return {
    id: `cp-${index}`,
    index,
    coordinates: [-87.0 + index * 0.1, 41.0 + index * 0.1],
    distanceFromOriginMiles: distance,
    travelTimeMinutes: distance * 1.2,
    estimatedArrivalTime: "2026-11-06T10:00:00Z",
    weather: {
      temperature: 55,
      windSpeed: 10,
      precipitation: 0,
      snowfall: 0,
      weatherCode: 0,
      weatherDescription: "Clear",
      forecastAvailable,
      forecastTimestamp: "2026-11-06T10:00:00Z",
    },
    risk: {
      windRisk: finalRisk,
      rainRisk: "Low",
      snowRisk: "Low",
      initialWeatherRisk: finalRisk,
      loadAdjustmentApplied: false,
      finalRisk,
      explanation: "Test",
    },
  };
}

describe("Route Risk Aggregation & Distance Allocation", () => {
  it("allocates segments between checkpoints so category miles sum to total distance", () => {
    // 100 mile route with 5 checkpoints at 0, 25, 50, 75, 100
    // Checkpoints:
    // CP0 (0 mi): Low
    // CP1 (25 mi): Low
    // CP2 (50 mi): Moderate
    // CP3 (75 mi): High
    // CP4 (100 mi): Severe
    const cps: Checkpoint[] = [
      mockCheckpoint({ index: 0, distance: 0, finalRisk: "Low" }),
      mockCheckpoint({ index: 1, distance: 25, finalRisk: "Low" }),
      mockCheckpoint({ index: 2, distance: 50, finalRisk: "Moderate" }),
      mockCheckpoint({ index: 3, distance: 75, finalRisk: "High" }),
      mockCheckpoint({ index: 4, distance: 100, finalRisk: "Severe" }),
    ];

    const result = aggregateRouteRisk({
      checkpoints: cps,
      totalDistanceMiles: 100,
    });

    const p = result.riskProfile;
    const sumMiles =
      p.lowRiskMiles + p.moderateRiskMiles + p.highRiskMiles + p.severeRiskMiles + p.noTravelMiles;

    expect(sumMiles).toBeCloseTo(100, 1);
    expect(p.maxRiskLevel).toBe("Severe");
    expect(p.affectedCheckpointsCount).toBe(3); // CP2, CP3, CP4
    expect(p.hasIncompleteWeatherData).toBe(false);
  });

  it("calculates weighted average risk score correctly according to scoring model", () => {
    // CP0 (0 mi): Low (0)
    // CP1 (100 mi): High (2)
    // Span = 100 miles: half low (50 mi * 0 = 0), half high (50 mi * 2 = 100)
    // Total weighted sum = 100 / 100 = 1.00
    const cps: Checkpoint[] = [
      mockCheckpoint({ index: 0, distance: 0, finalRisk: "Low" }),
      mockCheckpoint({ index: 1, distance: 100, finalRisk: "High" }),
    ];

    const result = aggregateRouteRisk({
      checkpoints: cps,
      totalDistanceMiles: 100,
    });

    expect(result.riskProfile.lowRiskMiles).toBe(50);
    expect(result.riskProfile.highRiskMiles).toBe(50);
    expect(result.riskProfile.averageRiskScore).toBe(1.0);
  });

  it("flags route as unsafe if No-Travel exposure exists", () => {
    const cps: Checkpoint[] = [
      mockCheckpoint({ index: 0, distance: 0, finalRisk: "Low" }),
      mockCheckpoint({ index: 1, distance: 50, finalRisk: "No Travel" }),
      mockCheckpoint({ index: 2, distance: 100, finalRisk: "Low" }),
    ];

    const result = aggregateRouteRisk({
      checkpoints: cps,
      totalDistanceMiles: 100,
    });

    expect(result.riskProfile.noTravelMiles).toBeGreaterThan(0);
    expect(result.riskProfile.isUnsafe).toBe(true);
    expect(result.riskProfile.maxRiskLevel).toBe("No Travel");
  });

  it("marks route assessment as incomplete when weather forecast is unavailable", () => {
    const cps: Checkpoint[] = [
      mockCheckpoint({ index: 0, distance: 0, finalRisk: "Low", forecastAvailable: true }),
      mockCheckpoint({ index: 1, distance: 50, finalRisk: "Low", forecastAvailable: false }),
      mockCheckpoint({ index: 2, distance: 100, finalRisk: "Low", forecastAvailable: true }),
    ];

    const result = aggregateRouteRisk({
      checkpoints: cps,
      totalDistanceMiles: 100,
    });

    expect(result.riskProfile.hasIncompleteWeatherData).toBe(true);
    expect(result.riskProfile.incompleteDistanceMiles).toBeGreaterThan(0);
  });
});

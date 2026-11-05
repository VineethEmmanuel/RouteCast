import { describe, it, expect } from "vitest";
import { rankAndRecommendRoutes } from "@/lib/recommendation/engine";
import { EvaluatedRoute } from "@/types/routing";

function mockRoute(params: {
  id: string;
  name: string;
  severeMiles: number;
  highMiles: number;
  averageRisk: number;
  durationMinutes: number;
  noTravelMiles?: number;
}): EvaluatedRoute {
  const {
    id,
    name,
    severeMiles,
    highMiles,
    averageRisk,
    durationMinutes,
    noTravelMiles = 0,
  } = params;

  return {
    id,
    index: parseInt(id.replace(/\D/g, "") || "0", 10),
    name,
    summary: name,
    totalDistanceMiles: 300,
    totalDurationMinutes: durationMinutes,
    geometry: { type: "LineString", coordinates: [] },
    checkpoints: [],
    segments: [],
    riskProfile: {
      lowRiskMiles: 300 - severeMiles - highMiles - noTravelMiles,
      moderateRiskMiles: 0,
      highRiskMiles: highMiles,
      severeRiskMiles: severeMiles,
      noTravelMiles,
      totalMiles: 300,
      averageRiskScore: averageRisk,
      maxRiskLevel: noTravelMiles > 0 ? "No Travel" : severeMiles > 0 ? "Severe" : highMiles > 0 ? "High" : "Low",
      affectedCheckpointsCount: severeMiles > 0 ? 2 : 0,
      totalCheckpointsCount: 12,
      hasIncompleteWeatherData: false,
      incompleteDistanceMiles: 0,
      isUnsafe: noTravelMiles > 0,
    },
    isRecommended: false,
    recommendationRank: 0,
    recommendationNotes: [],
  };
}

describe("Route Recommendation Engine — Lexicographical Priority", () => {
  it("Priority 1: Ranks route with fewer Severe miles higher even if it takes longer", () => {
    // Route 1: 18 severe miles, 286 minutes
    // Route 2: 0 severe miles, 300 minutes (14 min longer)
    // Route 3: 12 severe miles, 295 minutes
    const r1 = mockRoute({ id: "route-1", name: "Route 1", severeMiles: 18, highMiles: 10, averageRisk: 1.8, durationMinutes: 286 });
    const r2 = mockRoute({ id: "route-2", name: "Route 2", severeMiles: 0, highMiles: 20, averageRisk: 1.2, durationMinutes: 300 });
    const r3 = mockRoute({ id: "route-3", name: "Route 3", severeMiles: 12, highMiles: 15, averageRisk: 1.5, durationMinutes: 295 });

    const outcome = rankAndRecommendRoutes([r1, r2, r3]);

    expect(outcome.recommendedRouteId).toBe("route-2");
    expect(outcome.rankedRoutes[0].id).toBe("route-2");
    expect(outcome.rankedRoutes[1].id).toBe("route-3");
    expect(outcome.rankedRoutes[2].id).toBe("route-1");
    expect(outcome.explanation).toContain("Route 2 is recommended because it has 0.0 severe-risk miles");
  });

  it("Priority 2: Ranks route with fewer High-risk miles higher when Severe miles are equal", () => {
    // Both Route 1 and Route 2 have 0 severe miles.
    // Route 1: 5 high miles, 310 min.
    // Route 2: 25 high miles, 290 min (faster).
    const r1 = mockRoute({ id: "route-1", name: "Route 1", severeMiles: 0, highMiles: 5, averageRisk: 0.8, durationMinutes: 310 });
    const r2 = mockRoute({ id: "route-2", name: "Route 2", severeMiles: 0, highMiles: 25, averageRisk: 1.1, durationMinutes: 290 });

    const outcome = rankAndRecommendRoutes([r1, r2]);

    expect(outcome.recommendedRouteId).toBe("route-1");
    expect(outcome.explanation).toContain("only 5.0 high-risk miles");
  });

  it("Priority 3: Ranks route with lower average risk when Severe and High miles are tied", () => {
    const r1 = mockRoute({ id: "route-1", name: "Route 1", severeMiles: 0, highMiles: 0, averageRisk: 0.3, durationMinutes: 300 });
    const r2 = mockRoute({ id: "route-2", name: "Route 2", severeMiles: 0, highMiles: 0, averageRisk: 0.7, durationMinutes: 290 });

    const outcome = rankAndRecommendRoutes([r1, r2]);

    expect(outcome.recommendedRouteId).toBe("route-1");
    expect(outcome.explanation).toContain("lowest average risk score");
  });

  it("Priority 4: Ranks shortest travel time when all risk metrics are tied", () => {
    const r1 = mockRoute({ id: "route-1", name: "Route 1", severeMiles: 0, highMiles: 0, averageRisk: 0.2, durationMinutes: 280 });
    const r2 = mockRoute({ id: "route-2", name: "Route 2", severeMiles: 0, highMiles: 0, averageRisk: 0.2, durationMinutes: 310 });

    const outcome = rankAndRecommendRoutes([r1, r2]);

    expect(outcome.recommendedRouteId).toBe("route-1");
    expect(outcome.explanation).toContain("fastest safe journey");
  });

  it("No-Travel handling: Never recommends a route containing No-Travel when a safe alternative exists", () => {
    // Route 1 has 5 miles of No-Travel (even though 0 severe miles and fast)
    // Route 2 has 20 miles of Severe, but 0 No-Travel
    const r1 = mockRoute({ id: "route-1", name: "Route 1", severeMiles: 0, highMiles: 0, averageRisk: 0.8, durationMinutes: 250, noTravelMiles: 5 });
    const r2 = mockRoute({ id: "route-2", name: "Route 2", severeMiles: 20, highMiles: 10, averageRisk: 1.5, durationMinutes: 300, noTravelMiles: 0 });

    const outcome = rankAndRecommendRoutes([r1, r2]);

    expect(outcome.recommendedRouteId).toBe("route-2");
    expect(outcome.explanation).toContain("completely bypasses the No-Travel hazard zones");
  });

  it("Communicates that no fully safe route is available when all routes have No-Travel exposure", () => {
    const r1 = mockRoute({ id: "route-1", name: "Route 1", severeMiles: 10, highMiles: 10, averageRisk: 2.5, durationMinutes: 250, noTravelMiles: 15 });
    const r2 = mockRoute({ id: "route-2", name: "Route 2", severeMiles: 10, highMiles: 10, averageRisk: 2.4, durationMinutes: 260, noTravelMiles: 8 });

    const outcome = rankAndRecommendRoutes([r1, r2]);

    expect(outcome.hasSafeRoute).toBe(false);
    expect(outcome.recommendedRouteId).toBeNull();
    expect(outcome.explanation).toContain("No fully safe route is available");
  });
});

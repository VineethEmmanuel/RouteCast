import { EvaluatedRoute } from "@/types/routing";

export interface RecommendationOutcome {
  recommendedRouteId: string | null;
  recommendedRouteIndex: number;
  explanation: string;
  hasSafeRoute: boolean;
  rankedRoutes: EvaluatedRoute[];
}

/**
 * Compares two routes using the exact lexicographical priority rules:
 * 1. Safe vs No-Travel (routes with 0 No-Travel miles rank higher than routes with >0 No-Travel miles)
 * 2. Priority 1: Fewest Severe miles
 * 3. Priority 2: Fewest High-risk miles
 * 4. Priority 3: Lowest average risk
 * 5. Priority 4: Shortest travel time
 */
export function compareRoutesLexicographically(
  a: EvaluatedRoute,
  b: EvaluatedRoute
): number {
  const aNoTravel = a.riskProfile.noTravelMiles;
  const bNoTravel = b.riskProfile.noTravelMiles;

  // No-Travel check: a route with NO No-Travel miles ranks ahead of one with No-Travel miles
  if (aNoTravel === 0 && bNoTravel > 0) return -1;
  if (aNoTravel > 0 && bNoTravel === 0) return 1;

  // Priority 1: Fewest Severe miles
  const severeDiff = a.riskProfile.severeRiskMiles - b.riskProfile.severeRiskMiles;
  if (Math.abs(severeDiff) > 0.05) {
    return severeDiff;
  }

  // Priority 2: Fewest High-risk miles
  const highDiff = a.riskProfile.highRiskMiles - b.riskProfile.highRiskMiles;
  if (Math.abs(highDiff) > 0.05) {
    return highDiff;
  }

  // Priority 3: Lowest average risk score
  const avgDiff = a.riskProfile.averageRiskScore - b.riskProfile.averageRiskScore;
  if (Math.abs(avgDiff) > 0.02) {
    return avgDiff;
  }

  // Priority 4: Shortest travel time
  const timeDiff = a.totalDurationMinutes - b.totalDurationMinutes;
  return timeDiff;
}

/**
 * Evaluates route alternatives, ranks them according to priority criteria,
 * and generates dynamic, data-driven explainability summaries.
 */
export function rankAndRecommendRoutes(routes: EvaluatedRoute[]): RecommendationOutcome {
  if (routes.length === 0) {
    return {
      recommendedRouteId: null,
      recommendedRouteIndex: -1,
      explanation: "No route alternatives were available to analyze.",
      hasSafeRoute: false,
      rankedRoutes: [],
    };
  }

  // Clone and sort routes using the lexicographical comparator
  const sorted = [...routes].sort(compareRoutesLexicographically);

  // Check No-Travel status across all routes
  const safeRoutes = sorted.filter((r) => r.riskProfile.noTravelMiles === 0);
  const allUnsafe = safeRoutes.length === 0;

  // Update ranks and flags
  const rankedRoutes = sorted.map((route, idx) => ({
    ...route,
    recommendationRank: idx + 1,
    isRecommended: idx === 0 && !allUnsafe,
  }));

  const topRoute = rankedRoutes[0];

  let explanation = "";

  if (allUnsafe) {
    const minNoTravel = Math.min(...routes.map((r) => r.riskProfile.noTravelMiles));
    explanation = `CRITICAL ADVISORY: No fully safe route is available. All ${routes.length} route alternatives encounter severe weather conditions exceeding safe operational limits (No-Travel hazard of at least ${minNoTravel.toFixed(1)} miles). High crosswinds or intense precipitation create severe truck rollover and jackknife hazards. We strongly recommend holding or delaying departure until conditions improve.`;
  } else if (routes.length === 1) {
    if (topRoute.riskProfile.severeRiskMiles > 0) {
      explanation = `${topRoute.name} is the sole available route, with ${topRoute.riskProfile.severeRiskMiles.toFixed(1)} miles of severe weather exposure. Exercise heightened vigilance.`;
    } else {
      explanation = `${topRoute.name} is the sole available route and maintains acceptable weather safety (${topRoute.riskProfile.lowRiskMiles.toFixed(1)} low-risk miles).`;
    }
  } else {
    // We have 2 or 3 routes to compare
    const others = routes.filter((r) => r.id !== topRoute.id);
    const topSevere = topRoute.riskProfile.severeRiskMiles;
    const topHigh = topRoute.riskProfile.highRiskMiles;
    const topAvg = topRoute.riskProfile.averageRiskScore;
    const topTime = topRoute.totalDurationMinutes;

    // Check if alternatives have No-Travel while topRoute avoided it
    const othersWithNoTravel = others.filter((r) => r.riskProfile.noTravelMiles > 0);
    if (othersWithNoTravel.length > 0 && topRoute.riskProfile.noTravelMiles === 0) {
      const otherNames = othersWithNoTravel.map((r) => `${r.name} (${r.riskProfile.noTravelMiles.toFixed(1)} mi No-Travel)`).join(", ");
      explanation = `${topRoute.name} is recommended because it completely bypasses the No-Travel hazard zones present on ${otherNames}. Although alternatives may appear faster, ${topRoute.name} is the only route that avoids critical rollover conditions.`;
    }
    // Check if severe miles differed
    else if (others.some((r) => Math.abs(r.riskProfile.severeRiskMiles - topSevere) > 0.05)) {
      const comparisons = others
        .map((r) => `${r.riskProfile.severeRiskMiles.toFixed(1)} miles on ${r.name}`)
        .join(" and ");

      const timeDeltas = others.map((r) => {
        const diff = topTime - r.totalDurationMinutes;
        if (diff > 0) return `${diff} min longer than ${r.name}`;
        if (diff < 0) return `${Math.abs(diff)} min faster than ${r.name}`;
        return `equal duration to ${r.name}`;
      });

      explanation = `${topRoute.name} is recommended because it has ${topSevere.toFixed(1)} severe-risk miles compared with ${comparisons}. Although ${topRoute.name} is ${timeDeltas.join(" and ")}, it provides significantly lower severe weather exposure and superior cargo safety.`;
    }
    // Check if high miles differed
    else if (others.some((r) => Math.abs(r.riskProfile.highRiskMiles - topHigh) > 0.05)) {
      const comparisons = others
        .map((r) => `${r.riskProfile.highRiskMiles.toFixed(1)} miles on ${r.name}`)
        .join(" and ");

      explanation = `All routes avoid severe weather, but ${topRoute.name} is recommended because it has only ${topHigh.toFixed(1)} high-risk miles compared with ${comparisons}, minimizing adverse driving stress.`;
    }
    // Check if average risk differed
    else if (others.some((r) => Math.abs(r.riskProfile.averageRiskScore - topAvg) > 0.02)) {
      explanation = `${topRoute.name} is recommended because it achieves the lowest average risk score (${topAvg.toFixed(2)}) across the journey corridor.`;
    }
    // Fallback to travel time
    else {
      explanation = `Weather risk profiles are equivalent across all routes. ${topRoute.name} is recommended as the fastest safe journey, completing in ${Math.floor(topTime / 60)}h ${topTime % 60}m.`;
    }
  }

  return {
    recommendedRouteId: allUnsafe ? null : topRoute.id,
    recommendedRouteIndex: allUnsafe ? -1 : topRoute.index,
    explanation,
    hasSafeRoute: !allUnsafe,
    rankedRoutes,
  };
}

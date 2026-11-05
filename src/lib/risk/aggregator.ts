import {
  Checkpoint,
  RiskLevel,
  RISK_SCORE_MAP,
  RouteRiskProfile,
  RouteSegment,
} from "@/types/routing";
import { getMaxRisk } from "./classifier";

export interface AggregationResult {
  riskProfile: RouteRiskProfile;
  segments: RouteSegment[];
}

/**
 * Aggregates weather risk along a route using segment-based distance allocation.
 *
 * Scoring model:
 * - Low = 0
 * - Moderate = 1
 * - High = 2
 * - Severe = 3
 * - No Travel = 4
 *
 * Distance allocation:
 * Route is segmented between adjacent checkpoints.
 * Each inter-checkpoint span [C_{i-1}, C_i] is partitioned at its midpoint:
 * the first half is allocated to C_{i-1}'s risk zone, and the second half to C_i's risk zone.
 * This guarantees the exact sum of category miles equals total route distance without
 * artificially over- or under-inflating hazards.
 */
export function aggregateRouteRisk(params: {
  checkpoints: Checkpoint[];
  totalDistanceMiles: number;
}): AggregationResult {
  const { checkpoints, totalDistanceMiles } = params;

  if (checkpoints.length === 0) {
    return {
      riskProfile: {
        lowRiskMiles: 0,
        moderateRiskMiles: 0,
        highRiskMiles: 0,
        severeRiskMiles: 0,
        noTravelMiles: 0,
        totalMiles: totalDistanceMiles,
        averageRiskScore: 0,
        maxRiskLevel: "Low",
        affectedCheckpointsCount: 0,
        totalCheckpointsCount: 0,
        hasIncompleteWeatherData: true,
        incompleteDistanceMiles: totalDistanceMiles,
        isUnsafe: true,
      },
      segments: [],
    };
  }

  if (checkpoints.length === 1) {
    const cp = checkpoints[0];
    const risk = cp.risk.finalRisk;
    const isAvail = cp.weather.forecastAvailable;

    return {
      riskProfile: {
        lowRiskMiles: risk === "Low" && isAvail ? totalDistanceMiles : 0,
        moderateRiskMiles: risk === "Moderate" && isAvail ? totalDistanceMiles : 0,
        highRiskMiles: risk === "High" && isAvail ? totalDistanceMiles : 0,
        severeRiskMiles: risk === "Severe" && isAvail ? totalDistanceMiles : 0,
        noTravelMiles: risk === "No Travel" && isAvail ? totalDistanceMiles : 0,
        totalMiles: totalDistanceMiles,
        averageRiskScore: isAvail ? RISK_SCORE_MAP[risk] : 0,
        maxRiskLevel: risk,
        affectedCheckpointsCount: risk !== "Low" ? 1 : 0,
        totalCheckpointsCount: 1,
        hasIncompleteWeatherData: !isAvail,
        incompleteDistanceMiles: !isAvail ? totalDistanceMiles : 0,
        isUnsafe: risk === "No Travel" || !isAvail,
      },
      segments: [
        {
          segmentIndex: 0,
          startPoint: cp.coordinates,
          endPoint: cp.coordinates,
          distanceMiles: totalDistanceMiles,
          risk,
          governingCheckpointIndex: 0,
        },
      ],
    };
  }

  // Mileage bucket counters
  const categoryMiles: Record<RiskLevel, number> = {
    "Low": 0,
    "Moderate": 0,
    "High": 0,
    "Severe": 0,
    "No Travel": 0,
  };

  let maxRisk: RiskLevel = "Low";
  let affectedCheckpoints = 0;
  let incompleteMiles = 0;
  const segments: RouteSegment[] = [];

  // Iterate over adjacent checkpoint pairs
  for (let i = 0; i < checkpoints.length - 1; i++) {
    const cpStart = checkpoints[i];
    const cpEnd = checkpoints[i + 1];

    const spanDistance = Math.max(
      0,
      cpEnd.distanceFromOriginMiles - cpStart.distanceFromOriginMiles
    );

    // Midpoint split: first half belongs to cpStart, second half to cpEnd
    const halfSpan = spanDistance / 2;

    // First half span (cpStart influence)
    if (!cpStart.weather.forecastAvailable) {
      incompleteMiles += halfSpan;
    } else {
      categoryMiles[cpStart.risk.finalRisk] += halfSpan;
    }

    // Second half span (cpEnd influence)
    if (!cpEnd.weather.forecastAvailable) {
      incompleteMiles += halfSpan;
    } else {
      categoryMiles[cpEnd.risk.finalRisk] += halfSpan;
    }

    // Record route segment for map coloring (governed by the higher risk in this span)
    const governingRisk = getMaxRisk(cpStart.risk.finalRisk, cpEnd.risk.finalRisk);
    segments.push({
      segmentIndex: i,
      startPoint: cpStart.coordinates,
      endPoint: cpEnd.coordinates,
      distanceMiles: Number(spanDistance.toFixed(1)),
      risk: governingRisk,
      governingCheckpointIndex:
        RISK_SCORE_MAP[cpEnd.risk.finalRisk] > RISK_SCORE_MAP[cpStart.risk.finalRisk]
          ? i + 1
          : i,
    });
  }

  // Count affected checkpoints and determine max risk
  for (const cp of checkpoints) {
    if (RIS_SCORE(cp.risk.finalRisk) > RIS_SCORE(maxRisk)) {
      maxRisk = cp.risk.finalRisk;
    }
    if (cp.risk.finalRisk !== "Low") {
      affectedCheckpoints++;
    }
  }

  const lowRiskMiles = Number(categoryMiles["Low"].toFixed(1));
  const moderateRiskMiles = Number(categoryMiles["Moderate"].toFixed(1));
  const highRiskMiles = Number(categoryMiles["High"].toFixed(1));
  const severeRiskMiles = Number(categoryMiles["Severe"].toFixed(1));
  const noTravelMiles = Number(categoryMiles["No Travel"].toFixed(1));
  const incompleteDistanceMiles = Number(incompleteMiles.toFixed(1));

  // Evaluated mileage (miles with valid forecast)
  const evaluatedMiles =
    lowRiskMiles + moderateRiskMiles + highRiskMiles + severeRiskMiles + noTravelMiles;

  let averageRiskScore = 0;
  if (evaluatedMiles > 0) {
    const weightedSum =
      lowRiskMiles * RISK_SCORE_MAP["Low"] +
      moderateRiskMiles * RISK_SCORE_MAP["Moderate"] +
      highRiskMiles * RISK_SCORE_MAP["High"] +
      severeRiskMiles * RISK_SCORE_MAP["Severe"] +
      noTravelMiles * RISK_SCORE_MAP["No Travel"];

    averageRiskScore = Number((weightedSum / evaluatedMiles).toFixed(2));
  }

  const hasIncomplete = incompleteDistanceMiles > 0;
  const isUnsafe = noTravelMiles > 0 || (hasIncomplete && evaluatedMiles < totalDistanceMiles * 0.5);

  return {
    riskProfile: {
      lowRiskMiles,
      moderateRiskMiles,
      highRiskMiles,
      severeRiskMiles,
      noTravelMiles,
      totalMiles: totalDistanceMiles,
      averageRiskScore,
      maxRiskLevel: maxRisk,
      affectedCheckpointsCount: affectedCheckpoints,
      totalCheckpointsCount: checkpoints.length,
      hasIncompleteWeatherData: hasIncomplete,
      incompleteDistanceMiles,
      isUnsafe,
    },
    segments,
  };
}

function RIS_SCORE(r: RiskLevel): number {
  return RISK_SCORE_MAP[r];
}


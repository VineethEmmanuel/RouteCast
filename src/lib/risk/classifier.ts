import { RiskLevel, RISK_SCORE_MAP } from "@/types/routing";

/**
 * Classifies wind speed risk according to assessment thresholds:
 * - Less than 25 mph: Low
 * - 25–34 mph: Moderate [25, 35)
 * - 35–44 mph: High [35, 45)
 * - 45–54 mph: Severe [45, 55)
 * - 55 mph or above: No Travel [55, +inf)
 */
export function classifyWindRisk(windMph: number): RiskLevel {
  if (windMph < 25) return "Low";
  if (windMph < 35) return "Moderate";
  if (windMph < 45) return "High";
  if (windMph < 55) return "Severe";
  return "No Travel";
}

/**
 * Classifies rainfall intensity risk according to exact assessment thresholds:
 * - Less than 0.10 in/hr: Low
 * - 0.10–0.25 in/hr: Moderate
 * - Greater than 0.25–0.50 in/hr: High
 * - Greater than 0.50–1.00 in/hr: Severe
 * - Greater than 1.00 in/hr: No Travel
 */
export function classifyRainRisk(rainInchesPerHour: number): RiskLevel {
  if (rainInchesPerHour < 0.10) return "Low";
  if (rainInchesPerHour <= 0.25) return "Moderate";
  if (rainInchesPerHour <= 0.50) return "High";
  if (rainInchesPerHour <= 1.00) return "Severe";
  return "No Travel";
}

/**
 * Classifies snowfall intensity risk according to exact assessment thresholds:
 * - Less than 0.5 in/hr: Low
 * - 0.5–1.0 in/hr: Moderate
 * - Greater than 1.0–2.0 in/hr: High
 * - Greater than 2.0–3.0 in/hr: Severe
 * - Greater than 3.0 in/hr: No Travel
 */
export function classifySnowRisk(snowInchesPerHour: number): RiskLevel {
  if (snowInchesPerHour < 0.5) return "Low";
  if (snowInchesPerHour <= 1.0) return "Moderate";
  if (snowInchesPerHour <= 2.0) return "High";
  if (snowInchesPerHour <= 3.0) return "Severe";
  return "No Travel";
}

/**
 * Returns the higher of two risk levels based on risk hierarchy:
 * Low (0) < Moderate (1) < High (2) < Severe (3) < No Travel (4)
 */
export function getMaxRisk(riskA: RiskLevel, riskB: RiskLevel): RiskLevel {
  return RISK_SCORE_MAP[riskA] >= RISK_SCORE_MAP[riskB] ? riskA : riskB;
}

export interface CheckpointRiskEvaluation {
  windRisk: RiskLevel;
  rainRisk: RiskLevel;
  snowRisk: RiskLevel;
  initialWeatherRisk: RiskLevel;
  loadAdjustmentApplied: boolean;
  loadAdjustmentReason?: string;
  finalRisk: RiskLevel;
  explanation: string;
}

/**
 * Evaluates risk for a checkpoint including weather variables and truck load rules:
 * 1. Wind speed >= 55 mph: No Travel for every load weight.
 * 2. Wind speed between 45 and 54 mph AND load weight > 30,000 lb: No Travel.
 * 3. Wind speed between 35 and 44 mph AND load weight > 40,000 lb: Upgrade to Severe.
 * Highest severity prevails.
 */
export function evaluateCheckpointRisk(params: {
  windMph: number;
  rainInchesPerHour: number;
  snowInchesPerHour: number;
  loadWeightLb: number;
  forecastAvailable?: boolean;
}): CheckpointRiskEvaluation {
  const {
    windMph,
    rainInchesPerHour,
    snowInchesPerHour,
    loadWeightLb,
    forecastAvailable = true,
  } = params;

  if (!forecastAvailable) {
    return {
      windRisk: "Low",
      rainRisk: "Low",
      snowRisk: "Low",
      initialWeatherRisk: "Low",
      loadAdjustmentApplied: false,
      finalRisk: "Low",
      explanation: "Weather forecast unavailable for this timestamp. Route safety cannot be guaranteed.",
    };
  }

  const windRisk = classifyWindRisk(windMph);
  const rainRisk = classifyRainRisk(rainInchesPerHour);
  const snowRisk = classifySnowRisk(snowInchesPerHour);

  // Determine highest initial weather risk
  let initialWeatherRisk = getMaxRisk(windRisk, rainRisk);
  initialWeatherRisk = getMaxRisk(initialWeatherRisk, snowRisk);

  let finalRisk = initialWeatherRisk;
  let loadAdjustmentApplied = false;
  let loadAdjustmentReason: string | undefined = undefined;

  // Rule 1: Wind speed >= 55 mph: No Travel for every load weight
  if (windMph >= 55) {
    finalRisk = "No Travel";
    // Rule 1 is inherent to wind speed >= 55 mph
  }
  // Rule 2: Wind speed between 45 and 54 mph AND load weight > 30,000 lb: No Travel
  else if (windMph >= 45 && windMph < 55 && loadWeightLb > 30000) {
    finalRisk = "No Travel";
    loadAdjustmentApplied = true;
    loadAdjustmentReason = `High crosswind risk (${windMph.toFixed(1)} mph) on heavy load (${loadWeightLb.toLocaleString()} lb > 30,000 lb threshold) escalates risk to No Travel (high rollover hazard).`;
  }
  // Rule 3: Wind speed between 35 and 44 mph AND load weight > 40,000 lb: Upgrade risk to Severe
  else if (windMph >= 35 && windMph < 45 && loadWeightLb > 40000) {
    if (RIS_SCORE(finalRisk) < RIS_SCORE("Severe")) {
      finalRisk = "Severe";
      loadAdjustmentApplied = true;
      loadAdjustmentReason = `Moderate-to-high wind (${windMph.toFixed(1)} mph) on very heavy load (${loadWeightLb.toLocaleString()} lb > 40,000 lb threshold) upgrades risk to Severe.`;
    }
  }

  // Ensure highest severity prevails across all conditions
  finalRisk = getMaxRisk(initialWeatherRisk, finalRisk);

  // Construct explanatory rationale
  const reasons: string[] = [];
  if (windRisk !== "Low") {
    reasons.push(`Wind: ${windMph.toFixed(1)} mph (${windRisk})`);
  }
  if (rainRisk !== "Low") {
    reasons.push(`Rain: ${rainInchesPerHour.toFixed(2)} in/hr (${rainRisk})`);
  }
  if (snowRisk !== "Low") {
    reasons.push(`Snow: ${snowInchesPerHour.toFixed(2)} in/hr (${snowRisk})`);
  }

  let explanation = "";
  if (reasons.length === 0 && !loadAdjustmentApplied) {
    explanation = "Favorable driving conditions with minimal weather hazards.";
  } else {
    explanation = reasons.join(" • ");
    if (loadAdjustmentReason) {
      explanation += (explanation ? " | " : "") + loadAdjustmentReason;
    }
  }

  return {
    windRisk,
    rainRisk,
    snowRisk,
    initialWeatherRisk,
    loadAdjustmentApplied,
    loadAdjustmentReason,
    finalRisk,
    explanation,
  };
}

function RIS_SCORE(r: RiskLevel): number {
  return RISK_SCORE_MAP[r];
}


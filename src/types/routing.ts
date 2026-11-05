export type RiskLevel = "Low" | "Moderate" | "High" | "Severe" | "No Travel";

export type WeatherVariable = "wind" | "rain" | "snow" | "composite";

export const RISK_SCORE_MAP: Record<RiskLevel, number> = {
  "Low": 0,
  "Moderate": 1,
  "High": 2,
  "Severe": 3,
  "No Travel": 4,
};

export const RISK_LEVEL_ORDER: RiskLevel[] = ["Low", "Moderate", "High", "Severe", "No Travel"];

export const RISK_COLORS: Record<
  RiskLevel,
  { hex: string; bg: string; text: string; border: string; label: string }
> = {
  "Low": {
    hex: "#16865D",
    bg: "bg-[#EBF6F1]",
    text: "text-[#16865D]",
    border: "border-[#CBE9DC]",
    label: "Low Risk",
  },
  "Moderate": {
    hex: "#D69B24",
    bg: "bg-[#FDF6E7]",
    text: "text-[#A07010]",
    border: "border-[#F7DFAC]",
    label: "Moderate Risk",
  },
  "High": {
    hex: "#E47B35",
    bg: "bg-[#FDF1E9]",
    text: "text-[#C25814]",
    border: "border-[#F8D2BA]",
    label: "High Risk",
  },
  "Severe": {
    hex: "#D94B4B",
    bg: "bg-[#FCEEEE]",
    text: "text-[#B82E2E]",
    border: "border-[#F5C2C2]",
    label: "Severe Risk",
  },
  "No Travel": {
    hex: "#861F2D",
    bg: "bg-[#F8E9EB]",
    text: "text-[#861F2D]",
    border: "border-[#E5B5BC]",
    label: "No Travel Advisory",
  },
};

export type SamplingIntervalMiles = 10 | 25 | 50;

export interface CheckpointWeather {
  temperature: number; // °F
  windSpeed: number; // mph
  precipitation: number; // in/hr
  snowfall: number; // in/hr
  weatherCode: number;
  weatherDescription: string;
  forecastAvailable: boolean;
  forecastTimestamp: string;
}

export interface CheckpointRisk {
  windRisk: RiskLevel;
  rainRisk: RiskLevel;
  snowRisk: RiskLevel;
  initialWeatherRisk: RiskLevel;
  loadAdjustmentApplied: boolean;
  loadAdjustmentReason?: string;
  finalRisk: RiskLevel;
  explanation: string;
}

export interface Checkpoint {
  id: string;
  index: number;
  coordinates: [number, number]; // [longitude, latitude]
  distanceFromOriginMiles: number;
  estimatedArrivalTime: string; // ISO string
  travelTimeMinutes: number;
  weather: CheckpointWeather;
  risk: CheckpointRisk;
  timeline48h?: Array<{
    offsetHours: number;
    timestamp: string;
    temperature: number;
    windSpeed: number;
    precipitation: number;
    snowfall: number;
    weatherCode: number;
    risk: RiskLevel;
  }>;
}

export interface RouteSegment {
  segmentIndex: number;
  startPoint: [number, number];
  endPoint: [number, number];
  distanceMiles: number;
  risk: RiskLevel;
  governingCheckpointIndex: number;
}

export interface RouteRiskProfile {
  lowRiskMiles: number;
  moderateRiskMiles: number;
  highRiskMiles: number;
  severeRiskMiles: number;
  noTravelMiles: number;
  totalMiles: number;
  averageRiskScore: number; // 0.00 to 4.00
  maxRiskLevel: RiskLevel;
  affectedCheckpointsCount: number; // checkpoints with risk > Low
  totalCheckpointsCount: number;
  hasIncompleteWeatherData: boolean;
  incompleteDistanceMiles: number;
  isUnsafe: boolean; // contains No-Travel
}

export interface RawRouteGeometry {
  type: "LineString";
  coordinates: [number, number][]; // [lng, lat][]
}

export interface EvaluatedRoute {
  id: string;
  index: number;
  name: string; // e.g. "Route 1"
  summary: string;
  totalDistanceMiles: number;
  totalDurationMinutes: number;
  geometry: RawRouteGeometry;
  checkpoints: Checkpoint[];
  segments: RouteSegment[];
  riskProfile: RouteRiskProfile;
  isRecommended: boolean;
  recommendationRank: number; // 1, 2, 3
  recommendationNotes: string[];
}

export interface LocationPoint {
  name: string;
  coordinates: [number, number]; // [lng, lat]
}

export interface RouteAnalysisRequest {
  origin: LocationPoint;
  destination: LocationPoint;
  departureTime: string; // ISO string
  loadWeightLb: number;
  samplingIntervalMiles: SamplingIntervalMiles;
}

export interface RouteAnalysisResult {
  routes: EvaluatedRoute[];
  recommendedRouteId: string | null;
  recommendationExplanation: string;
  hasSafeRoute: boolean;
  samplingIntervalMiles: SamplingIntervalMiles;
  truckLoadWeightLb: number;
  departureTime: string;
  origin: LocationPoint;
  destination: LocationPoint;
  generatedAt: string;
  routingEngine: "mapbox" | "osrm";
  message?: string;
}

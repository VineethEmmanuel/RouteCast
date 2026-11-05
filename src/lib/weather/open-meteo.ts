import { CheckpointWeather, RiskLevel } from "@/types/routing";
import { classifyWindRisk, classifyRainRisk, classifySnowRisk, getMaxRisk } from "@/lib/risk/classifier";

export interface OpenMeteoHourlyResponse {
  time: string[];
  temperature_2m: number[];
  precipitation: number[];
  snowfall: number[];
  wind_speed_10m: number[];
  weather_code: number[];
}

export interface OpenMeteoLocationResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  utc_offset_seconds: number;
  timezone: string;
  hourly?: OpenMeteoHourlyResponse;
}

export const WMO_WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  62: "Moderate rain",
  63: "Heavy rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

export function getWeatherDescription(code: number): string {
  return WMO_WEATHER_CODES[code] || "Variable conditions";
}

export interface SampledCheckpointWeather {
  weather: CheckpointWeather;
  timeline48h: Array<{
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

/**
 * Parses and samples hourly weather data for a specific checkpoint coordinate and target ETA.
 * Detects whether the ETA is within the forecast horizon.
 * If outside the horizon, marks as forecast unavailable without substituting current weather.
 */
export function extractCheckpointWeather(
  locationData: OpenMeteoLocationResponse | null | undefined,
  targetEtaIso: string,
  departureTimeIso: string
): SampledCheckpointWeather {
  if (!locationData || !locationData.hourly || !locationData.hourly.time.length) {
    return createUnavailableWeather(targetEtaIso);
  }

  const { time, temperature_2m, precipitation, snowfall, wind_speed_10m, weather_code } =
    locationData.hourly;

  const targetDate = new Date(targetEtaIso);
  const targetMs = targetDate.getTime();

  const firstForecastDate = new Date(time[0]);
  const lastForecastDate = new Date(time[time.length - 1]);

  // Check if ETA falls before first forecast or after the forecast horizon (+1 hour tolerance)
  if (
    targetMs < firstForecastDate.getTime() - 3600 * 1000 ||
    targetMs > lastForecastDate.getTime() + 3600 * 1000
  ) {
    return createUnavailableWeather(targetEtaIso);
  }

  // Find nearest forecast hour
  let closestIndex = 0;
  let minDiff = Infinity;

  for (let i = 0; i < time.length; i++) {
    const entryDate = new Date(time[i]);
    const diff = Math.abs(entryDate.getTime() - targetMs);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }

  // If closest forecast is more than 3 hours away, forecast is considered unavailable
  if (minDiff > 3 * 3600 * 1000) {
    return createUnavailableWeather(targetEtaIso);
  }

  const tempF = Number((temperature_2m[closestIndex] ?? 0).toFixed(1));
  const windMph = Number((wind_speed_10m[closestIndex] ?? 0).toFixed(1));
  const rainIn = Number((precipitation[closestIndex] ?? 0).toFixed(2));
  const snowIn = Number((snowfall[closestIndex] ?? 0).toFixed(2));
  const code = weather_code[closestIndex] ?? 0;

  // Build 48-hour timeline from departure time for the interactive slider
  const departureDate = new Date(departureTimeIso);
  const timeline48h: SampledCheckpointWeather["timeline48h"] = [];

  for (let offset = 0; offset <= 48; offset++) {
    const offsetMs = departureDate.getTime() + offset * 3600 * 1000;
    let nearestIdx = -1;
    let nDiff = Infinity;

    for (let i = 0; i < time.length; i++) {
      const d = new Date(time[i]).getTime();
      const diff = Math.abs(d - offsetMs);
      if (diff < nDiff) {
        nDiff = diff;
        nearestIdx = i;
      }
    }

    if (nearestIdx !== -1 && nDiff <= 3 * 3600 * 1000) {
      const wSpeed = Number((wind_speed_10m[nearestIdx] ?? 0).toFixed(1));
      const rIn = Number((precipitation[nearestIdx] ?? 0).toFixed(2));
      const sIn = Number((snowfall[nearestIdx] ?? 0).toFixed(2));
      const tF = Number((temperature_2m[nearestIdx] ?? 0).toFixed(1));
      const wCode = weather_code[nearestIdx] ?? 0;

      const wRisk = classifyWindRisk(wSpeed);
      const rRisk = classifyRainRisk(rIn);
      const sRisk = classifySnowRisk(sIn);
      const compRisk = getMaxRisk(getMaxRisk(wRisk, rRisk), sRisk);

      timeline48h.push({
        offsetHours: offset,
        timestamp: new Date(offsetMs).toISOString(),
        temperature: tF,
        windSpeed: wSpeed,
        precipitation: rIn,
        snowfall: sIn,
        weatherCode: wCode,
        risk: compRisk,
      });
    }
  }

  return {
    weather: {
      temperature: tempF,
      windSpeed: windMph,
      precipitation: rainIn,
      snowfall: snowIn,
      weatherCode: code,
      weatherDescription: getWeatherDescription(code),
      forecastAvailable: true,
      forecastTimestamp: time[closestIndex],
    },
    timeline48h,
  };
}

function createUnavailableWeather(targetEtaIso: string): SampledCheckpointWeather {
  return {
    weather: {
      temperature: 0,
      windSpeed: 0,
      precipitation: 0,
      snowfall: 0,
      weatherCode: -1,
      weatherDescription: "Forecast Unavailable (Beyond 14-day Horizon)",
      forecastAvailable: false,
      forecastTimestamp: targetEtaIso,
    },
    timeline48h: [],
  };
}

/**
 * Fetches Open-Meteo forecasts for a list of coordinates in batches.
 * Open-Meteo supports comma-separated lat/lng for multi-location queries.
 */
export async function fetchWeatherForCoordinates(
  coordinates: [number, number][], // [lng, lat][]
  forecastDays: number = 7
): Promise<OpenMeteoLocationResponse[]> {
  if (coordinates.length === 0) return [];

  // Open-Meteo handles up to ~50 locations per request reliably.
  // We chunk in batches of 30 to stay safely within URL and server limits.
  const CHUNK_SIZE = 30;
  const results: OpenMeteoLocationResponse[] = [];

  for (let i = 0; i < coordinates.length; i += CHUNK_SIZE) {
    const chunk = coordinates.slice(i, i + CHUNK_SIZE);
    const lats = chunk.map((c) => c[1].toFixed(4)).join(",");
    const lons = chunk.map((c) => c[0].toFixed(4)).join(",");

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&hourly=temperature_2m,precipitation,snowfall,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&forecast_days=${Math.min(
      Math.max(forecastDays, 1),
      16
    )}`;

    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 900 }, // Cache on server for 15 minutes
      });

      if (!res.ok) {
        throw new Error(`Open-Meteo request failed with status ${res.status}`);
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        results.push(...data);
      } else if (data && typeof data === "object") {
        // Single location response
        results.push(data as OpenMeteoLocationResponse);
      }
    } catch (err) {
      console.error("Open-Meteo fetch batch failed:", err);
      // Fill null responses for this chunk so caller knows forecast is unavailable
      for (let k = 0; k < chunk.length; k++) {
        results.push({
          latitude: chunk[k][1],
          longitude: chunk[k][0],
          elevation: 0,
          utc_offset_seconds: 0,
          timezone: "UTC",
        });
      }
    }
  }

  return results;
}


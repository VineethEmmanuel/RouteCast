import * as turf from "@turf/turf";
import { RawRouteGeometry, SamplingIntervalMiles } from "@/types/routing";

export interface GeneratedCheckpointStub {
  id: string;
  index: number;
  coordinates: [number, number]; // [lng, lat]
  distanceFromOriginMiles: number;
  travelTimeMinutes: number;
  estimatedArrivalTime: string; // ISO string
}

export interface RouteGeometryMetadata {
  totalDistanceMiles: number;
  totalDurationMinutes: number;
  checkpoints: GeneratedCheckpointStub[];
  geometry: RawRouteGeometry;
}

/**
 * Normalizes and processes route coordinates.
 * Computes exact cumulative distance, samples checkpoints at the specified interval,
 * guarantees Origin and Destination are always included,
 * and calculates proportional arrival times based on departure time and total duration.
 */
export function processRouteGeometry(params: {
  geometry: RawRouteGeometry;
  totalDistanceMeters?: number;
  totalDurationSeconds?: number;
  departureTimeIso: string;
  samplingIntervalMiles: SamplingIntervalMiles;
}): RouteGeometryMetadata {
  const {
    geometry,
    totalDistanceMeters,
    totalDurationSeconds,
    departureTimeIso,
    samplingIntervalMiles,
  } = params;

  const departureTime = new Date(departureTimeIso);
  if (isNaN(departureTime.getTime())) {
    throw new Error(`Invalid departure time: ${departureTimeIso}`);
  }

  // Build a turf LineString
  const line = turf.lineString(geometry.coordinates);

  // Compute total distance in miles using turf or provided meters
  const turfDistanceMiles = turf.length(line, { units: "miles" });
  const totalDistanceMiles = totalDistanceMeters
    ? totalDistanceMeters / 1609.344
    : turfDistanceMiles;

  // Total duration in minutes
  const totalDurationMinutes = totalDurationSeconds
    ? Math.round(totalDurationSeconds / 60)
    : Math.round((totalDistanceMiles / 55) * 60); // fallback ~55mph if duration missing

  const checkpoints: GeneratedCheckpointStub[] = [];

  // Checkpoint 0: Origin (distance = 0)
  const originCoord: [number, number] = [
    geometry.coordinates[0][0],
    geometry.coordinates[0][1],
  ];

  checkpoints.push({
    id: "checkpoint-0",
    index: 0,
    coordinates: originCoord,
    distanceFromOriginMiles: 0,
    travelTimeMinutes: 0,
    estimatedArrivalTime: departureTime.toISOString(),
  });

  // Calculate intermediate checkpoints at selected interval
  const interval = samplingIntervalMiles;
  let targetDistance = interval;
  let cpIndex = 1;

  // Threshold to avoid redundant checkpoint too close to destination
  const minFinalGapMiles = Math.min(2.0, interval * 0.2);

  while (targetDistance < totalDistanceMiles - minFinalGapMiles) {
    // Interpolate geographic coordinates along line
    const pointAlong = turf.along(line, (targetDistance / totalDistanceMiles) * turfDistanceMiles, {
      units: "miles",
    });

    const coords: [number, number] = [
      pointAlong.geometry.coordinates[0],
      pointAlong.geometry.coordinates[1],
    ];

    // Proportional travel progress
    const progressFraction = targetDistance / totalDistanceMiles;
    const travelTimeMinutes = Math.round(progressFraction * totalDurationMinutes);
    const estimatedArrivalMs = departureTime.getTime() + travelTimeMinutes * 60 * 1000;

    checkpoints.push({
      id: `checkpoint-${cpIndex}`,
      index: cpIndex,
      coordinates: coords,
      distanceFromOriginMiles: Number(targetDistance.toFixed(1)),
      travelTimeMinutes,
      estimatedArrivalTime: new Date(estimatedArrivalMs).toISOString(),
    });

    targetDistance += interval;
    cpIndex++;
  }

  // Final Checkpoint: Destination (always included)
  const lastIndex = geometry.coordinates.length - 1;
  const destinationCoord: [number, number] = [
    geometry.coordinates[lastIndex][0],
    geometry.coordinates[lastIndex][1],
  ];

  checkpoints.push({
    id: `checkpoint-${cpIndex}`,
    index: cpIndex,
    coordinates: destinationCoord,
    distanceFromOriginMiles: Number(totalDistanceMiles.toFixed(1)),
    travelTimeMinutes: totalDurationMinutes,
    estimatedArrivalTime: new Date(
      departureTime.getTime() + totalDurationMinutes * 60 * 1000
    ).toISOString(),
  });

  return {
    totalDistanceMiles: Number(totalDistanceMiles.toFixed(1)),
    totalDurationMinutes,
    checkpoints,
    geometry,
  };
}


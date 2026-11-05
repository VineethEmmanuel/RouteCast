import { describe, it, expect } from "vitest";
import { processRouteGeometry } from "@/lib/routing/geometry";
import { RawRouteGeometry } from "@/types/routing";

describe("Route Geometry & Checkpoint Processing", () => {
  // A simple ~100 mile straight line segment from [lng1, lat1] to [lng2, lat2]
  // Roughly: [-87.6298, 41.8781] (Chicago) to [-86.2520, 41.6764] (South Bend, IN) ~ 75-80 miles
  const testGeometry: RawRouteGeometry = {
    type: "LineString",
    coordinates: [
      [-87.6298, 41.8781], // Chicago
      [-87.0, 41.7],
      [-86.252, 41.6764], // South Bend
    ],
  };

  const departureIso = "2026-11-06T08:00:00.000Z";
  const durationSeconds = 5400; // 90 minutes
  const distanceMeters = 120700; // ~75 miles

  it("always includes origin and destination as checkpoints", () => {
    const result = processRouteGeometry({
      geometry: testGeometry,
      totalDistanceMeters: distanceMeters,
      totalDurationSeconds: durationSeconds,
      departureTimeIso: departureIso,
      samplingIntervalMiles: 25,
    });

    const cps = result.checkpoints;
    expect(cps.length).toBeGreaterThanOrEqual(2);

    // Origin Checkpoint
    expect(cps[0].index).toBe(0);
    expect(cps[0].distanceFromOriginMiles).toBe(0);
    expect(cps[0].travelTimeMinutes).toBe(0);
    expect(cps[0].estimatedArrivalTime).toBe(departureIso);
    expect(cps[0].coordinates).toEqual(testGeometry.coordinates[0]);

    // Destination Checkpoint
    const lastCp = cps[cps.length - 1];
    expect(lastCp.distanceFromOriginMiles).toBeCloseTo(75, 0);
    expect(lastCp.travelTimeMinutes).toBe(90);
    expect(lastCp.coordinates).toEqual(testGeometry.coordinates[testGeometry.coordinates.length - 1]);

    const expectedDestArrival = new Date(
      new Date(departureIso).getTime() + 90 * 60 * 1000
    ).toISOString();
    expect(lastCp.estimatedArrivalTime).toBe(expectedDestArrival);
  });

  it("samples checkpoints at approximately the requested 25-mile intervals", () => {
    const result = processRouteGeometry({
      geometry: testGeometry,
      totalDistanceMeters: distanceMeters,
      totalDurationSeconds: durationSeconds,
      departureTimeIso: departureIso,
      samplingIntervalMiles: 25,
    });

    const cps = result.checkpoints;
    // Checkpoints should be at 0, ~25, ~50, and ~75
    expect(cps[0].distanceFromOriginMiles).toBe(0);
    expect(cps[1].distanceFromOriginMiles).toBe(25);
    expect(cps[2].distanceFromOriginMiles).toBe(50);
    expect(cps[3].distanceFromOriginMiles).toBeCloseTo(75, 0);
  });

  it("calculates strictly monotonically increasing arrival times", () => {
    const result = processRouteGeometry({
      geometry: testGeometry,
      totalDistanceMeters: distanceMeters,
      totalDurationSeconds: durationSeconds,
      departureTimeIso: departureIso,
      samplingIntervalMiles: 10,
    });

    const cps = result.checkpoints;
    for (let i = 1; i < cps.length; i++) {
      const prevTime = new Date(cps[i - 1].estimatedArrivalTime).getTime();
      const currTime = new Date(cps[i].estimatedArrivalTime).getTime();
      expect(currTime).toBeGreaterThanOrEqual(prevTime);
      expect(cps[i].distanceFromOriginMiles).toBeGreaterThan(cps[i - 1].distanceFromOriginMiles);
    }
  });

  it("generates more checkpoints when interval is 10 miles than 50 miles", () => {
    const res10 = processRouteGeometry({
      geometry: testGeometry,
      totalDistanceMeters: distanceMeters,
      totalDurationSeconds: durationSeconds,
      departureTimeIso: departureIso,
      samplingIntervalMiles: 10,
    });

    const res50 = processRouteGeometry({
      geometry: testGeometry,
      totalDistanceMeters: distanceMeters,
      totalDurationSeconds: durationSeconds,
      departureTimeIso: departureIso,
      samplingIntervalMiles: 50,
    });

    expect(res10.checkpoints.length).toBeGreaterThan(res50.checkpoints.length);
  });
});

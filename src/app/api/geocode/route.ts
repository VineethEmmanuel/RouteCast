import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_MAPBOX_TOKEN } from "@/lib/constants";

const querySchema = z.object({
  q: z.string().min(2, "Query must be at least 2 characters"),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    const parsed = querySchema.safeParse({ q: query });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const q = parsed.data.q.trim();
    const mapboxToken =
      process.env.MAPBOX_SECRET_TOKEN ||
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
      DEFAULT_MAPBOX_TOKEN;

    // 1. Try Mapbox Geocoding if token is available
    if (mapboxToken && mapboxToken.trim().length > 0) {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          q
        )}.json?types=place,address,poi,region,postcode&limit=6&access_token=${mapboxToken}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.features && Array.isArray(data.features)) {
            const results = data.features.map((feat: any) => ({
              id: feat.id,
              name: feat.place_name,
              coordinates: feat.center as [number, number], // [lng, lat]
            }));
            return NextResponse.json({ results, provider: "mapbox" });
          }
        }
      } catch (err) {
        console.warn("Mapbox geocoding failed, falling back to Open-Meteo geocoder:", err);
      }
    }

    // 2. Fallback to Open-Meteo Geocoding (no API key required)
    const openMeteoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      q
    )}&count=6&language=en&format=json`;

    const omRes = await fetch(openMeteoUrl);
    if (omRes.ok) {
      const omData = await omRes.json();
      if (omData.results && Array.isArray(omData.results)) {
        const results = omData.results.map((item: any) => {
          const parts = [item.name, item.admin1, item.country].filter(Boolean);
          return {
            id: `om-${item.id}`,
            name: parts.join(", "),
            coordinates: [item.longitude, item.latitude] as [number, number],
          };
        });
        return NextResponse.json({ results, provider: "open-meteo" });
      }
    }

    return NextResponse.json({ results: [], provider: "none" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to geocode location" },
      { status: 500 }
    );
  }
}


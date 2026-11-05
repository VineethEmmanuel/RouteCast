import { NextResponse } from "next/server";

export async function GET() {
  const token =
    process.env.MAPBOX_ACCESS_TOKEN ||
    process.env.MAPBOX_SECRET_TOKEN ||
    "";

  return NextResponse.json({
    mapboxToken: token,
  });
}

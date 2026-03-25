import { NextResponse } from "next/server";
import { getAssets } from "@/lib/data/loader";
import { fetchAllPrices } from "@/lib/data/prices";

export async function GET() {
  try {
    const assets = getAssets();
    const prices = await fetchAllPrices(assets);
    return NextResponse.json({ prices, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error("Prices API error:", err);
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}

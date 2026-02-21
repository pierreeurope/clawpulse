import { NextResponse } from "next/server";
import { getCommunitySummary, isDatabaseAvailable } from "@/lib/db";

export async function GET() {
  try {
    if (!(await isDatabaseAvailable())) {
      return NextResponse.json({
        avgCacheHitRate: 0,
        avgThinkingPct: 0,
        topModel: "unknown",
        bestStreak: 0,
      });
    }

    const summary = await getCommunitySummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Community summary error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";

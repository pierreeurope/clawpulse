import { NextResponse } from "next/server";
import { getCommunityStats, isDatabaseAvailable } from "@/lib/db";

export async function GET() {
  try {
    if (!(await isDatabaseAvailable())) {
      return NextResponse.json({
        totalUsers: 0,
        totalMessages: 0,
        totalTokens: 0,
        totalCost: 0,
        days: {},
        models: {},
        tools: {},
      });
    }

    const stats = await getCommunityStats();
    return NextResponse.json(stats);

  } catch (error) {
    console.error("Community stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const revalidate = 60; // Cache for 60 seconds

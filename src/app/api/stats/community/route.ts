import { NextResponse } from "next/server";
import { getEnhancedCommunityStats, isDatabaseAvailable } from "@/lib/db";

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
        activeAgents: 0,
        lastSync: null,
        tokenBurnRate: 0,
        tokenGrowth: 0,
        messageGrowth: 0,
        toolGrowth: {},
        thisWeekTokens: 0,
        lastWeekTokens: 0,
        thisWeekMessages: 0,
        lastWeekMessages: 0,
        recordHolders: { busiestDay: null, mostDiverse: null },
      });
    }

    const stats = await getEnhancedCommunityStats();
    return NextResponse.json(stats);

  } catch (error) {
    console.error("Community stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic"; // Always fresh data

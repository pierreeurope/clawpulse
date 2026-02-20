import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { upsertUser, upsertDailyStats, updateAgentName } from "@/lib/db";
import { ClawPulseStats } from "@/types/stats";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const githubId = (session.user as any).githubId;
    const username = (session.user as any).username || session.user.name || "unknown";
    const avatar = (session.user as any).avatar || session.user.image;

    if (!githubId) {
      return NextResponse.json({ error: "GitHub ID not found" }, { status: 400 });
    }

    const stats: ClawPulseStats = await request.json();

    if (!stats || !stats.days) {
      return NextResponse.json({ error: "Invalid stats payload" }, { status: 400 });
    }

    // Upsert user
    const user = await upsertUser(githubId, username, avatar);

    // Update agent name if provided
    if (stats.agentName) {
      await updateAgentName(user.id, stats.agentName);
    }

    // Upsert daily stats
    for (const [date, dayStats] of Object.entries(stats.days)) {
      await upsertDailyStats(user.id, date, dayStats);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Submitted ${Object.keys(stats.days).length} days of stats` 
    });

  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { upsertUser, upsertDailyStats, updateAgentName } from "@/lib/db";
import { ClawPulseStats } from "@/types/stats";

async function getGitHubUser(authHeader: string | null): Promise<{ id: string; username: string; avatar: string } | null> {
  // Try NextAuth session first (web dashboard)
  const session = await auth();
  if (session?.user) {
    const githubId = (session.user as any).githubId;
    const username = (session.user as any).username || session.user.name || "unknown";
    const avatar = (session.user as any).avatar || session.user.image || "";
    if (githubId) return { id: String(githubId), username, avatar };
  }

  // Try Bearer token (CLI)
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${token}`, "User-Agent": "ClawPulse" },
      });
      if (res.ok) {
        const user = await res.json();
        return { id: String(user.id), username: user.login, avatar: user.avatar_url || "" };
      }
    } catch {}
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const ghUser = await getGitHubUser(request.headers.get("authorization"));

    if (!ghUser) {
      return NextResponse.json({ error: "Unauthorized. Sign in with GitHub first." }, { status: 401 });
    }

    const stats: ClawPulseStats = await request.json();

    if (!stats || !stats.days) {
      return NextResponse.json({ error: "Invalid stats payload" }, { status: 400 });
    }

    // Upsert user
    const user = await upsertUser(ghUser.id, ghUser.username, ghUser.avatar);

    // Update agent name if provided
    if (stats.agentName) {
      await updateAgentName(user.id, stats.agentName);
    }

    // Upsert daily stats
    let count = 0;
    for (const [date, dayStats] of Object.entries(stats.days)) {
      await upsertDailyStats(user.id, date, dayStats);
      count++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Submitted ${count} days of stats for ${ghUser.username}` 
    });

  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

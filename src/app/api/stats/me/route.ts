import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserStats, upsertUser } from "@/lib/db";

export async function GET() {
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

    // Ensure user exists
    const user = await upsertUser(githubId, username, avatar);

    // Get stats
    const stats = await getUserStats(user.id);

    if (!stats) {
      return NextResponse.json({ 
        error: "No stats found. Use `clawpulse push` to submit your stats." 
      }, { status: 404 });
    }

    return NextResponse.json(stats);

  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

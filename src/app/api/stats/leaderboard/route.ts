import { NextResponse } from "next/server";
import { getLeaderboard, isDatabaseAvailable } from "@/lib/db";

export async function GET() {
  try {
    if (!(await isDatabaseAvailable())) {
      return NextResponse.json([]);
    }

    const leaderboard = await getLeaderboard();
    return NextResponse.json(leaderboard);

  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const revalidate = 60; // Cache for 60 seconds

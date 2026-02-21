import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getTimezoneCoords } from "@/lib/timezone-coords";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Get all users with timezone set
    const result = await sql`
      SELECT 
        u.github_username,
        u.agent_name,
        u.timezone,
        u.last_pushed_at,
        COALESCE(SUM(ds.total_tokens), 0)::BIGINT as total_tokens
      FROM users u
      LEFT JOIN daily_stats ds ON u.id = ds.user_id
      WHERE u.timezone IS NOT NULL
      GROUP BY u.id, u.github_username, u.agent_name, u.timezone, u.last_pushed_at
      ORDER BY u.last_pushed_at DESC NULLS LAST
    `;

    const agents = result.rows.map((row) => {
      const [lat, lng] = getTimezoneCoords(row.timezone);
      const lastPushedAt =
        row.last_pushed_at instanceof Date
          ? row.last_pushed_at.toISOString()
          : typeof row.last_pushed_at === "string"
            ? row.last_pushed_at
            : new Date(0).toISOString();

      return {
        username: row.github_username,
        agentName: row.agent_name || row.github_username,
        timezone: row.timezone,
        lat,
        lng,
        lastPushedAt,
        totalTokens: Number(row.total_tokens),
      };
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Globe API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch globe data" },
      { status: 500 }
    );
  }
}

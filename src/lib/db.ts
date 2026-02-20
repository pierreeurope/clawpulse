import { sql } from "@vercel/postgres";
import { ClawPulseStats, DayStats } from "@/types/stats";

export interface User {
  id: number;
  github_id: string;
  github_username: string;
  github_avatar: string | null;
  agent_name: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DailyStatsRow {
  id: number;
  user_id: number;
  date: string;
  messages: number;
  tokens_in: number;
  tokens_out: number;
  total_tokens: number;
  cost: number;
  sessions: number;
  cache_read: number;
  cache_write: number;
  thinking_messages: number;
  models: any;
  tools: any;
  hourly: any;
}

// Check if DB is available
export async function isDatabaseAvailable(): Promise<boolean> {
  if (!process.env.POSTGRES_URL) {
    return false;
  }
  try {
    await sql`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// Get or create user from GitHub profile
export async function upsertUser(githubId: string, username: string, avatar: string | null): Promise<User> {
  const result = await sql`
    INSERT INTO users (github_id, github_username, github_avatar)
    VALUES (${githubId}, ${username}, ${avatar})
    ON CONFLICT (github_id) 
    DO UPDATE SET 
      github_username = ${username},
      github_avatar = ${avatar},
      updated_at = NOW()
    RETURNING *
  `;
  return result.rows[0] as User;
}

// Update user's agent name
export async function updateAgentName(userId: number, agentName: string): Promise<void> {
  await sql`
    UPDATE users
    SET agent_name = ${agentName}, updated_at = NOW()
    WHERE id = ${userId}
  `;
}

// Upsert daily stats
export async function upsertDailyStats(userId: number, date: string, stats: DayStats): Promise<void> {
  await sql`
    INSERT INTO daily_stats (
      user_id, date, messages, tokens_in, tokens_out, total_tokens, cost, sessions,
      cache_read, cache_write, thinking_messages, models, tools, hourly
    )
    VALUES (
      ${userId}, ${date}, ${stats.messages}, ${stats.tokensIn}, ${stats.tokensOut},
      ${stats.totalTokens}, ${stats.cost}, ${stats.sessions}, ${stats.cacheRead},
      ${stats.cacheWrite}, ${stats.thinkingMessages}, ${JSON.stringify(stats.models)},
      ${JSON.stringify(stats.tools)}, ${JSON.stringify(stats.hourly)}
    )
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      messages = ${stats.messages},
      tokens_in = ${stats.tokensIn},
      tokens_out = ${stats.tokensOut},
      total_tokens = ${stats.totalTokens},
      cost = ${stats.cost},
      sessions = ${stats.sessions},
      cache_read = ${stats.cacheRead},
      cache_write = ${stats.cacheWrite},
      thinking_messages = ${stats.thinkingMessages},
      models = ${JSON.stringify(stats.models)},
      tools = ${JSON.stringify(stats.tools)},
      hourly = ${JSON.stringify(stats.hourly)},
      updated_at = NOW()
  `;
}

// Get user's stats
export async function getUserStats(userId: number): Promise<ClawPulseStats | null> {
  const user = await sql`SELECT * FROM users WHERE id = ${userId}`;
  if (user.rows.length === 0) return null;

  const dailyStats = await sql`
    SELECT * FROM daily_stats
    WHERE user_id = ${userId}
    ORDER BY date ASC
  `;

  if (dailyStats.rows.length === 0) return null;

  const days: { [date: string]: DayStats } = {};
  let totalMessages = 0;
  let totalTokens = 0;
  let totalCost = 0;

  for (const row of dailyStats.rows as DailyStatsRow[]) {
    days[row.date] = {
      messages: row.messages,
      userMessages: 0, // Not stored separately in DB
      assistantMessages: 0,
      tokensIn: row.tokens_in,
      tokensOut: row.tokens_out,
      totalTokens: row.total_tokens,
      cost: Number(row.cost),
      sessions: row.sessions,
      models: row.models,
      tools: row.tools,
      hourly: row.hourly,
      cacheRead: row.cache_read,
      cacheWrite: row.cache_write,
      thinkingMessages: row.thinking_messages,
    };

    totalMessages += row.messages;
    totalTokens += row.total_tokens;
    totalCost += Number(row.cost);
  }

  const sortedDates = Object.keys(days).sort();
  const { streak, longestStreak } = computeStreaks(sortedDates);

  return {
    version: 1,
    agentName: user.rows[0].agent_name || "Agent",
    generatedAt: new Date().toISOString(),
    days,
    totals: {
      messages: totalMessages,
      tokens: totalTokens,
      cost: Math.round(totalCost * 100) / 100,
      days: sortedDates.length,
      streak,
      longestStreak,
      firstDay: sortedDates[0] || "",
      lastDay: sortedDates[sortedDates.length - 1] || "",
    },
  };
}

// Get community aggregate stats
export async function getCommunityStats() {
  const users = await sql`SELECT COUNT(*) as count FROM users`;
  const totalUsers = Number(users.rows[0].count);

  const totals = await sql`
    SELECT 
      SUM(messages)::INTEGER as total_messages,
      SUM(total_tokens)::BIGINT as total_tokens,
      SUM(cost)::DECIMAL as total_cost
    FROM daily_stats
  `;

  const dailyAgg = await sql`
    SELECT 
      date,
      SUM(total_tokens)::BIGINT as tokens
    FROM daily_stats
    GROUP BY date
    ORDER BY date ASC
  `;

  const days: { [date: string]: { tokens: number } } = {};
  for (const row of dailyAgg.rows) {
    days[row.date] = { tokens: Number(row.tokens) };
  }

  // Aggregate models across all users
  const allModels = await sql`SELECT models FROM daily_stats`;
  const modelStats: { [model: string]: { messages: number; tokens: number; cost: number } } = {};
  
  for (const row of allModels.rows) {
    const models = row.models || {};
    for (const [model, stats] of Object.entries(models)) {
      const s = stats as any;
      if (!modelStats[model]) {
        modelStats[model] = { messages: 0, tokens: 0, cost: 0 };
      }
      modelStats[model].messages += s.messages || 0;
      modelStats[model].tokens += (s.tokensIn || 0) + (s.tokensOut || 0);
      modelStats[model].cost += s.cost || 0;
    }
  }

  // Aggregate tools
  const allTools = await sql`SELECT tools FROM daily_stats`;
  const toolStats: { [tool: string]: number } = {};
  
  for (const row of allTools.rows) {
    const tools = row.tools || {};
    for (const [tool, count] of Object.entries(tools)) {
      toolStats[tool] = (toolStats[tool] || 0) + (count as number);
    }
  }

  return {
    totalUsers,
    totalMessages: Number(totals.rows[0]?.total_messages || 0),
    totalTokens: Number(totals.rows[0]?.total_tokens || 0),
    totalCost: Number(totals.rows[0]?.total_cost || 0),
    days,
    models: modelStats,
    tools: toolStats,
  };
}

// Get leaderboard
export async function getLeaderboard() {
  const result = await sql`
    SELECT 
      u.id,
      u.github_username,
      u.github_avatar,
      u.agent_name,
      SUM(ds.total_tokens)::BIGINT as total_tokens,
      COUNT(DISTINCT ds.date)::INTEGER as active_days,
      MAX(ds.date) as last_active
    FROM users u
    INNER JOIN daily_stats ds ON u.id = ds.user_id
    GROUP BY u.id, u.github_username, u.github_avatar, u.agent_name
    ORDER BY total_tokens DESC
    LIMIT 100
  `;

  return result.rows.map(row => ({
    id: row.id,
    username: row.github_username,
    avatar: row.github_avatar,
    agentName: row.agent_name || "Agent",
    totalTokens: Number(row.total_tokens),
    activeDays: row.active_days,
    lastActive: row.last_active,
  }));
}

function computeStreaks(sortedDates: string[]): { streak: number; longestStreak: number } {
  if (sortedDates.length === 0) return { streak: 0, longestStreak: 0 };

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  
  const lastDate = sortedDates[sortedDates.length - 1];
  if (lastDate !== today && lastDate !== yesterday) {
    return { streak: 0, longestStreak };
  }

  let streak = 1;
  for (let i = sortedDates.length - 2; i >= 0; i--) {
    const curr = new Date(sortedDates[i + 1]);
    const prev = new Date(sortedDates[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return { streak, longestStreak: Math.max(longestStreak, streak) };
}

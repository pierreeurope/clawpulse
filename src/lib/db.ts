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
  last_pushed_at: Date | null;
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
  
  // Update user's last_pushed_at timestamp
  await sql`
    UPDATE users
    SET last_pushed_at = NOW()
    WHERE id = ${userId}
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
    days[formatDate(row.date)] = {
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
function formatDate(d: any): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  if (typeof d === 'string' && d.length > 10) return new Date(d).toISOString().slice(0, 10);
  return String(d);
}

export async function getCommunityStats() {
  const users = await sql`SELECT COUNT(*) as count FROM users`;
  const totalUsers = Number(users.rows[0].count);

  const totals = await sql`
    SELECT 
      SUM(messages)::INTEGER as total_messages,
      SUM(total_tokens)::BIGINT as total_tokens,
      SUM(tokens_in)::BIGINT as total_tokens_in,
      SUM(tokens_out)::BIGINT as total_tokens_out,
      SUM(cache_read)::BIGINT as total_cache_read,
      SUM(cache_write)::BIGINT as total_cache_write,
      SUM(cost)::DECIMAL as total_cost
    FROM daily_stats
  `;

  const dailyAgg = await sql`
    SELECT 
      TO_CHAR(date, 'YYYY-MM-DD') as date,
      SUM(messages)::INTEGER as messages,
      SUM(tokens_in)::BIGINT as tokens_in,
      SUM(tokens_out)::BIGINT as tokens_out,
      SUM(total_tokens)::BIGINT as tokens,
      SUM(cost)::DECIMAL as cost,
      SUM(sessions)::INTEGER as sessions,
      SUM(cache_read)::BIGINT as cache_read,
      SUM(cache_write)::BIGINT as cache_write
    FROM daily_stats
    GROUP BY date
    ORDER BY date ASC
  `;

  const days: { [date: string]: any } = {};
  for (const row of dailyAgg.rows) {
    days[formatDate(row.date)] = {
      tokens: Number(row.tokens),
      messages: Number(row.messages),
      tokensIn: Number(row.tokens_in),
      tokensOut: Number(row.tokens_out),
      cost: Number(row.cost),
      sessions: Number(row.sessions),
      cacheRead: Number(row.cache_read),
      cacheWrite: Number(row.cache_write),
    };
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
    totalTokensIn: Number(totals.rows[0]?.total_tokens_in || 0),
    totalTokensOut: Number(totals.rows[0]?.total_tokens_out || 0),
    totalCacheRead: Number(totals.rows[0]?.total_cache_read || 0),
    totalCacheWrite: Number(totals.rows[0]?.total_cache_write || 0),
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

// Get agent profile by username
export async function getAgentProfile(username: string) {
  const user = await sql`
    SELECT * FROM users WHERE github_username = ${username}
  `;
  
  if (user.rows.length === 0) return null;
  
  const userData = user.rows[0];
  const userId = userData.id;
  
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
  let totalThinkingMessages = 0;
  const allModels: { [model: string]: { messages: number; tokens: number } } = {};
  const allTools: { [tool: string]: number } = {};

  for (const row of dailyStats.rows as DailyStatsRow[]) {
    days[formatDate(row.date)] = {
      messages: row.messages,
      userMessages: 0,
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
    totalThinkingMessages += row.thinking_messages;
    
    // Aggregate models
    const models = row.models || {};
    for (const [model, stats] of Object.entries(models)) {
      const s = stats as any;
      if (!allModels[model]) {
        allModels[model] = { messages: 0, tokens: 0 };
      }
      allModels[model].messages += s.messages || 0;
      allModels[model].tokens += (s.tokensIn || 0) + (s.tokensOut || 0);
    }
    
    // Aggregate tools
    const tools = row.tools || {};
    for (const [tool, count] of Object.entries(tools)) {
      allTools[tool] = (allTools[tool] || 0) + (count as number);
    }
  }

  const sortedDates = Object.keys(days).sort();
  const { streak, longestStreak } = computeStreaks(sortedDates);
  
  // Top model
  const topModel = Object.entries(allModels)
    .sort(([, a], [, b]) => b.tokens - a.tokens)[0]?.[0] || "unknown";
  
  // Top tools
  const topTools = Object.entries(allTools)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tool, count]) => ({ tool, count }));
  
  // Compute badges
  const badges = [];
  if (streak >= 7) badges.push({ id: "streak-master", name: "🔥 Streak Master", desc: "7+ day streak" });
  if (totalTokens >= 1_000_000) badges.push({ id: "million-club", name: "💎 Million Club", desc: "1M+ tokens" });
  if (Object.keys(allTools).length >= 10) badges.push({ id: "tool-explorer", name: "🛠 Tool Explorer", desc: "10+ different tools" });
  if (totalMessages > 0 && (totalThinkingMessages / totalMessages) > 0.2) badges.push({ id: "deep-thinker", name: "🧠 Deep Thinker", desc: ">20% thinking messages" });
  if (sortedDates.length >= 30) badges.push({ id: "data-veteran", name: "📊 Data Veteran", desc: "30+ active days" });
  if (totalTokens >= 50_000_000) badges.push({ id: "power-user", name: "⚡ Power User", desc: ">50M tokens" });
  
  return {
    username: userData.github_username,
    avatar: userData.github_avatar,
    agentName: userData.agent_name || "Agent",
    createdAt: userData.created_at,
    days,
    totals: {
      messages: totalMessages,
      tokens: totalTokens,
      cost: Math.round(totalCost * 100) / 100,
      activeDays: sortedDates.length,
      streak,
      longestStreak,
      firstDay: sortedDates[0] || "",
      lastDay: sortedDates[sortedDates.length - 1] || "",
    },
    topModel,
    topTools,
    badges,
  };
}

// Get community summary/averages for personal insights
export async function getCommunitySummary() {
  const totals = await sql`
    SELECT 
      COUNT(DISTINCT user_id) as total_users,
      SUM(total_tokens)::BIGINT as total_tokens,
      SUM(messages)::INTEGER as total_messages,
      SUM(cache_read)::BIGINT as total_cache_read,
      SUM(cache_write)::BIGINT as total_cache_write,
      SUM(thinking_messages)::INTEGER as total_thinking_messages
    FROM daily_stats
  `;
  
  const row = totals.rows[0];
  const totalUsers = Number(row.total_users);
  const totalTokens = Number(row.total_tokens);
  const totalMessages = Number(row.total_messages);
  const totalCacheRead = Number(row.total_cache_read);
  const totalCacheWrite = Number(row.total_cache_write);
  const totalThinkingMessages = Number(row.total_thinking_messages);
  
  const cacheTotal = totalCacheRead + totalCacheWrite;
  const avgCacheHitRate = cacheTotal > 0 ? (totalCacheRead / cacheTotal) * 100 : 0;
  const avgThinkingPct = totalMessages > 0 ? (totalThinkingMessages / totalMessages) * 100 : 0;
  
  // Top model
  const allModels = await sql`SELECT models FROM daily_stats`;
  const modelStats: { [model: string]: number } = {};
  
  for (const row of allModels.rows) {
    const models = row.models || {};
    for (const [model, stats] of Object.entries(models)) {
      const s = stats as any;
      const tokens = (s.tokensIn || 0) + (s.tokensOut || 0);
      modelStats[model] = (modelStats[model] || 0) + tokens;
    }
  }
  
  const topModel = Object.entries(modelStats)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || "unknown";
  
  // Best streak
  const users = await sql`SELECT id FROM users`;
  let bestStreak = 0;
  
  for (const user of users.rows) {
    const userDays = await sql`
      SELECT TO_CHAR(date, 'YYYY-MM-DD') as date
      FROM daily_stats
      WHERE user_id = ${user.id}
      ORDER BY date ASC
    `;
    const sortedDates = userDays.rows.map(r => String(r.date));
    const { longestStreak } = computeStreaks(sortedDates);
    bestStreak = Math.max(bestStreak, longestStreak);
  }
  
  return {
    avgCacheHitRate,
    avgThinkingPct,
    topModel,
    bestStreak,
  };
}

// Get enhanced community stats for "Right Now" section
export async function getEnhancedCommunityStats() {
  const baseStats = await getCommunityStats();
  
  // Active in last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const activeRecent = await sql`
    SELECT COUNT(DISTINCT id) as count
    FROM users
    WHERE last_pushed_at >= ${oneDayAgo}
  `;
  const activeAgents = Number(activeRecent.rows[0].count);
  
  // Last sync
  const lastSync = await sql`
    SELECT u.github_username, u.agent_name, u.last_pushed_at, ds.total_tokens
    FROM users u
    LEFT JOIN LATERAL (
      SELECT total_tokens FROM daily_stats
      WHERE user_id = u.id
      ORDER BY date DESC
      LIMIT 1
    ) ds ON true
    WHERE u.last_pushed_at IS NOT NULL
    ORDER BY u.last_pushed_at DESC
    LIMIT 1
  `;
  
  let lastSyncData = null;
  if (lastSync.rows.length > 0) {
    const row = lastSync.rows[0];
    lastSyncData = {
      agentName: row.agent_name || row.github_username,
      tokenCount: Number(row.total_tokens || 0),
      timestamp: row.last_pushed_at,
    };
  }
  
  // Token burn rate (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const recentTokens = await sql`
    SELECT SUM(total_tokens)::BIGINT as tokens
    FROM daily_stats
    WHERE date >= ${sevenDaysAgo}
  `;
  const tokensLast7Days = Number(recentTokens.rows[0]?.tokens || 0);
  const tokenBurnRate = Math.round(tokensLast7Days / 7);
  
  // Week-over-week growth
  const now = new Date();
  const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  
  const thisWeek = await sql`
    SELECT SUM(total_tokens)::BIGINT as tokens, SUM(messages)::INTEGER as messages
    FROM daily_stats
    WHERE date >= ${thisWeekStart}
  `;
  
  const lastWeek = await sql`
    SELECT SUM(total_tokens)::BIGINT as tokens, SUM(messages)::INTEGER as messages
    FROM daily_stats
    WHERE date >= ${lastWeekStart} AND date < ${thisWeekStart}
  `;
  
  const thisWeekTokens = Number(thisWeek.rows[0]?.tokens || 0);
  const lastWeekTokens = Number(lastWeek.rows[0]?.tokens || 1);
  const thisWeekMessages = Number(thisWeek.rows[0]?.messages || 0);
  const lastWeekMessages = Number(lastWeek.rows[0]?.messages || 1);
  
  const tokenGrowth = ((thisWeekTokens - lastWeekTokens) / lastWeekTokens) * 100;
  const messageGrowth = ((thisWeekMessages - lastWeekMessages) / lastWeekMessages) * 100;
  
  // Tool growth (for trending badges)
  const thisWeekTools: { [tool: string]: number } = {};
  const lastWeekTools: { [tool: string]: number } = {};
  
  const thisWeekToolsData = await sql`
    SELECT tools FROM daily_stats
    WHERE date >= ${thisWeekStart}
  `;
  
  const lastWeekToolsData = await sql`
    SELECT tools FROM daily_stats
    WHERE date >= ${lastWeekStart} AND date < ${thisWeekStart}
  `;
  
  for (const row of thisWeekToolsData.rows) {
    const tools = row.tools || {};
    for (const [tool, count] of Object.entries(tools)) {
      thisWeekTools[tool] = (thisWeekTools[tool] || 0) + (count as number);
    }
  }
  
  for (const row of lastWeekToolsData.rows) {
    const tools = row.tools || {};
    for (const [tool, count] of Object.entries(tools)) {
      lastWeekTools[tool] = (lastWeekTools[tool] || 0) + (count as number);
    }
  }
  
  const toolGrowth: { [tool: string]: number } = {};
  for (const tool in thisWeekTools) {
    const thisCount = thisWeekTools[tool];
    const lastCount = lastWeekTools[tool] || 1;
    toolGrowth[tool] = ((thisCount - lastCount) / lastCount) * 100;
  }
  
  // Record holders
  const busiestDay = await sql`
    SELECT u.github_username, u.agent_name, ds.date, ds.total_tokens
    FROM daily_stats ds
    JOIN users u ON u.id = ds.user_id
    ORDER BY ds.total_tokens DESC
    LIMIT 1
  `;
  
  let busiestDayData = null;
  if (busiestDay.rows.length > 0) {
    const row = busiestDay.rows[0];
    busiestDayData = {
      agentName: row.agent_name || row.github_username,
      date: row.date,
      tokens: Number(row.total_tokens),
    };
  }
  
  // Most diverse tool usage
  const mostDiverseUser = await sql`
    SELECT u.github_username, u.agent_name,
      COUNT(DISTINCT jsonb_object_keys(ds.tools)) as tool_count
    FROM daily_stats ds
    JOIN users u ON u.id = ds.user_id
    WHERE ds.tools IS NOT NULL AND ds.tools != '{}'::jsonb
    GROUP BY u.id, u.github_username, u.agent_name
    ORDER BY tool_count DESC
    LIMIT 1
  `;
  
  let mostDiverseData = null;
  if (mostDiverseUser.rows.length > 0) {
    const row = mostDiverseUser.rows[0];
    mostDiverseData = {
      agentName: row.agent_name || row.github_username,
      toolCount: Number(row.tool_count),
    };
  }
  
  return {
    ...baseStats,
    activeAgents,
    lastSync: lastSyncData,
    tokenBurnRate,
    tokenGrowth,
    messageGrowth,
    toolGrowth,
    thisWeekTokens,
    lastWeekTokens,
    thisWeekMessages,
    lastWeekMessages,
    recordHolders: {
      busiestDay: busiestDayData,
      mostDiverse: mostDiverseData,
    },
  };
}

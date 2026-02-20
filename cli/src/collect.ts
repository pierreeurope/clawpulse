import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as readline from "readline";

interface DayStats {
  messages: number;
  userMessages: number;
  assistantMessages: number;
  tokensIn: number;
  tokensOut: number;
  totalTokens: number;
  cost: number;
  sessions: number;
  models: {
    [model: string]: {
      messages: number;
      tokensIn: number;
      tokensOut: number;
      cost: number;
    };
  };
  tools: { [tool: string]: number };
  hourly: number[];
  cacheRead: number;
  cacheWrite: number;
  thinkingMessages: number;
}

interface ClawPulseStats {
  version: 1;
  agentName: string;
  generatedAt: string;
  days: { [date: string]: DayStats };
  totals: {
    messages: number;
    tokens: number;
    cost: number;
    days: number;
    streak: number;
    longestStreak: number;
    firstDay: string;
    lastDay: string;
  };
}

function emptyDay(): DayStats {
  return {
    messages: 0,
    userMessages: 0,
    assistantMessages: 0,
    tokensIn: 0,
    tokensOut: 0,
    totalTokens: 0,
    cost: 0,
    sessions: 0,
    models: {},
    tools: {},
    hourly: new Array(24).fill(0),
    cacheRead: 0,
    cacheWrite: 0,
    thinkingMessages: 0,
  };
}

function getDateStr(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toISOString().slice(0, 10);
}

function getHour(timestamp: string): number {
  return new Date(timestamp).getUTCHours();
}

async function processFile(
  filePath: string,
  days: { [date: string]: DayStats },
  sessionDates: Set<string>
): Promise<void> {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;

    let entry: any;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    const timestamp = entry.timestamp;
    if (!timestamp) continue;

    const dateStr = getDateStr(timestamp);
    const hour = getHour(timestamp);

    if (!days[dateStr]) {
      days[dateStr] = emptyDay();
    }

    const day = days[dateStr];

    if (entry.type === "session") {
      const sessionKey = `${dateStr}:${entry.id || filePath}`;
      if (!sessionDates.has(sessionKey)) {
        sessionDates.add(sessionKey);
        day.sessions++;
      }
      continue;
    }

    if (entry.type === "message" && entry.message) {
      const msg = entry.message;
      const role = msg.role;

      if (role !== "user" && role !== "assistant") continue;

      day.messages++;
      day.hourly[hour]++;

      if (role === "user") {
        day.userMessages++;
      } else {
        day.assistantMessages++;
      }

      if (msg.usage) {
        const u = msg.usage;
        const tokensIn = u.input || 0;
        const tokensOut = u.output || 0;
        const totalTokens = u.totalTokens || tokensIn + tokensOut;
        const cost = u.cost?.total || 0;
        const cacheRead = u.cacheRead || 0;
        const cacheWrite = u.cacheWrite || 0;

        day.tokensIn += tokensIn;
        day.tokensOut += tokensOut;
        day.totalTokens += totalTokens;
        day.cost += cost;
        day.cacheRead += cacheRead;
        day.cacheWrite += cacheWrite;

        const model = msg.model || "unknown";
        if (!day.models[model]) {
          day.models[model] = { messages: 0, tokensIn: 0, tokensOut: 0, cost: 0 };
        }
        day.models[model].messages++;
        day.models[model].tokensIn += tokensIn;
        day.models[model].tokensOut += tokensOut;
        day.models[model].cost += cost;
      }

      if (Array.isArray(msg.content)) {
        let hasThinking = false;
        for (const item of msg.content) {
          if (item.type === "toolCall" && item.name) {
            day.tools[item.name] = (day.tools[item.name] || 0) + 1;
          }
          if (item.type === "thinking") {
            hasThinking = true;
          }
        }
        if (hasThinking) {
          day.thinkingMessages++;
        }
      }
    }
  }
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

function detectAgentName(): string {
  // Try OpenClaw config.yaml
  try {
    const configPath = path.join(os.homedir(), ".openclaw", "config.yaml");
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, "utf-8");
      const match = content.match(/agentName:\s*["']?([^"'\n]+)["']?/);
      if (match) return match[1].trim();
    }
  } catch {}

  // Try IDENTITY.md
  try {
    const identityPath = path.join(os.homedir(), ".openclaw", "workspace", "IDENTITY.md");
    if (fs.existsSync(identityPath)) {
      const content = fs.readFileSync(identityPath, "utf-8");
      const match = content.match(/\*\*Name:\*\*\s*(.+)/);
      if (match) return match[1].trim();
    }
  } catch {}

  // Try SOUL.md
  try {
    const soulPath = path.join(os.homedir(), ".openclaw", "workspace", "SOUL.md");
    if (fs.existsSync(soulPath)) {
      const content = fs.readFileSync(soulPath, "utf-8");
      const match = content.match(/I'm\s+(\w+)/);
      if (match) return match[1].trim();
    }
  } catch {}

  return "Agent";
}

export async function collect(options: any): Promise<ClawPulseStats | null> {
  const silent = options?.silent || false;
  const log = (...args: any[]) => { if (!silent) console.log(...args); };
  const logErr = (...args: any[]) => { if (!silent) console.error(...args); };

  const sessionsDir =
    options.sessionsDir ||
    path.join(os.homedir(), ".openclaw", "agents", "main", "sessions");

  const agentName = options.name || detectAgentName();

  log(`📊 ClawPulse Collector`);
  log(`📂 Scanning: ${sessionsDir}`);

  if (!fs.existsSync(sessionsDir)) {
    logErr("❌ Sessions directory not found!");
    logErr(`   Expected: ${sessionsDir}`);
    logErr(`   Use --sessions-dir to specify a different location`);
    return null;
  }

  const files = fs
    .readdirSync(sessionsDir)
    .filter((f) => f.endsWith(".jsonl") && !f.includes(".deleted"))
    .map((f) => path.join(sessionsDir, f));

  log(`📁 Found ${files.length} session files`);

  if (files.length === 0) {
    log("⚠️  No session files found");
    return null;
  }

  const days: { [date: string]: DayStats } = {};
  const sessionDates = new Set<string>();

  let processed = 0;
  for (const file of files) {
    try {
      await processFile(file, days, sessionDates);
      processed++;
      if (processed % 20 === 0) {
        log(`   Processed ${processed}/${files.length} files...`);
      }
    } catch {}
  }

  log(`✅ Processed ${processed} files`);

  const sortedDates = Object.keys(days).sort();
  let totalMessages = 0;
  let totalTokens = 0;
  let totalCost = 0;

  for (const date of sortedDates) {
    const d = days[date];
    totalMessages += d.messages;
    totalTokens += d.totalTokens;
    totalCost += d.cost;
  }

  const { streak, longestStreak } = computeStreaks(sortedDates);

  const stats: ClawPulseStats = {
    version: 1,
    agentName,
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

  if (options.output) {
    fs.writeFileSync(options.output, JSON.stringify(stats, null, 2));
    log(`\n💾 Saved to: ${options.output}`);
  }

  log(`\n📊 Stats Summary:`);
  log(`   Agent: ${agentName}`);
  log(`   Days: ${sortedDates.length}`);
  log(`   Messages: ${totalMessages.toLocaleString()}`);
  log(`   Tokens: ${totalTokens.toLocaleString()}`);
  log(`   Cost: $${totalCost.toFixed(2)}`);
  log(`   Streak: ${streak} days (longest: ${longestStreak})`);

  return stats;
}

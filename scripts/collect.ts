#!/usr/bin/env tsx
/**
 * ClawPulse Collector
 * Parses OpenClaw session JSONL files and aggregates into stats.json
 * NO message content or file paths extracted - only numerical aggregates
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// --- Types ---

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

// --- Helpers ---

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

// --- Main ---

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

  let currentSessionDate: string | null = null;

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
      // Session start marker
      const sessionKey = `${dateStr}:${entry.id || filePath}`;
      if (!sessionDates.has(sessionKey)) {
        sessionDates.add(sessionKey);
        day.sessions++;
      }
      currentSessionDate = dateStr;
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

      // Usage stats (usually on assistant messages)
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

        // Model breakdown
        const model = msg.model || "unknown";
        if (!day.models[model]) {
          day.models[model] = { messages: 0, tokensIn: 0, tokensOut: 0, cost: 0 };
        }
        day.models[model].messages++;
        day.models[model].tokensIn += tokensIn;
        day.models[model].tokensOut += tokensOut;
        day.models[model].cost += cost;
      }

      // Tool calls and thinking from content array
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

  // Compute longest streak
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

  // Compute current streak (from today going backwards)
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  
  // Find starting point: today or yesterday must be in the data
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

async function main() {
  const sessionsDir = path.join(
    process.env.HOME || "~",
    ".openclaw/agents/main/sessions"
  );

  console.log(`📊 ClawPulse Collector`);
  console.log(`📂 Scanning: ${sessionsDir}`);

  if (!fs.existsSync(sessionsDir)) {
    console.error("❌ Sessions directory not found!");
    process.exit(1);
  }

  const files = fs
    .readdirSync(sessionsDir)
    .filter((f) => f.endsWith(".jsonl") && !f.includes(".deleted"))
    .map((f) => path.join(sessionsDir, f));

  console.log(`📁 Found ${files.length} session files`);

  const days: { [date: string]: DayStats } = {};
  const sessionDates = new Set<string>();

  let processed = 0;
  for (const file of files) {
    try {
      await processFile(file, days, sessionDates);
      processed++;
      if (processed % 20 === 0) {
        console.log(`   Processed ${processed}/${files.length} files...`);
      }
    } catch (err) {
      // Skip problematic files silently
    }
  }

  console.log(`✅ Processed ${processed} files`);

  // Compute totals
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
    agentName: "Jarvis",
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

  const outputPath = path.join(__dirname, "..", "public", "stats.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(stats, null, 2));

  console.log(`\n📊 Stats Summary:`);
  console.log(`   Days: ${sortedDates.length}`);
  console.log(`   Messages: ${totalMessages.toLocaleString()}`);
  console.log(`   Tokens: ${totalTokens.toLocaleString()}`);
  console.log(`   Cost: $${totalCost.toFixed(2)}`);
  console.log(`   Streak: ${streak} days`);
  console.log(`   Longest streak: ${longestStreak} days`);
  console.log(`\n💾 Saved to: ${outputPath}`);
}

main().catch(console.error);

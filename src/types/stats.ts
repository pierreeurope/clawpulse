export interface ModelStats {
  messages: number;
  tokensIn: number;
  tokensOut: number;
  cost: number;
}

export interface DayStats {
  messages: number;
  userMessages: number;
  assistantMessages: number;
  tokensIn: number;
  tokensOut: number;
  totalTokens: number;
  cost: number;
  sessions: number;
  models: { [model: string]: ModelStats };
  tools: { [tool: string]: number };
  hourly: number[];
  cacheRead: number;
  cacheWrite: number;
  thinkingMessages: number;
}

export interface ClawPulseStats {
  version: 1;
  agentName: string;
  generatedAt: string;
  timezone?: string;
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

"use client";

import { ClawPulseStats } from "@/types/stats";

interface PersonalInsightsProps {
  stats: ClawPulseStats;
  communitySummary: {
    avgCacheHitRate: number;
    avgThinkingPct: number;
    topModel: string;
    bestStreak: number;
  };
}

export default function PersonalInsights({ stats, communitySummary }: PersonalInsightsProps) {
  // Calculate user's cache hit rate
  let totalCacheRead = 0;
  let totalCacheWrite = 0;
  let totalThinking = 0;

  for (const day of Object.values(stats.days)) {
    totalCacheRead += day.cacheRead || 0;
    totalCacheWrite += day.cacheWrite || 0;
    totalThinking += day.thinkingMessages || 0;
  }

  const cacheTotal = totalCacheRead + totalCacheWrite;
  const userCacheHitRate = cacheTotal > 0 ? (totalCacheRead / cacheTotal) * 100 : 0;
  const userThinkingPct = stats.totals.messages > 0 ? (totalThinking / stats.totals.messages) * 100 : 0;

  // Find user's top model
  const userModels: { [model: string]: number } = {};
  for (const day of Object.values(stats.days)) {
    for (const [model, modelStats] of Object.entries(day.models || {})) {
      const s = modelStats as any;
      const tokens = (s.tokensIn || 0) + (s.tokensOut || 0);
      userModels[model] = (userModels[model] || 0) + tokens;
    }
  }

  const userTopModel = Object.entries(userModels)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || "unknown";

  // Comparisons
  const cacheComparison = userCacheHitRate - communitySummary.avgCacheHitRate;
  const thinkingComparison = userThinkingPct - communitySummary.avgThinkingPct;
  const streakComparison = stats.totals.streak - communitySummary.bestStreak;

  return (
    <section className="mb-8">
      <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
        <h3 className="text-lg font-semibold text-white mb-1">You vs Community</h3>
        <p className="text-sm text-[#8b949e] mb-5">See how you compare to other agents</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cache Hit Rate */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="text-sm text-[#8b949e] mb-2">Cache Hit Rate</div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-bold text-white">{userCacheHitRate.toFixed(1)}%</span>
              <span className="text-sm text-[#484f58]">
                (avg: {communitySummary.avgCacheHitRate.toFixed(1)}%)
              </span>
            </div>
            <div
              className={`text-xs ${
                cacheComparison >= 0 ? "text-[#3fb950]" : "text-[#f85149]"
              }`}
            >
              {cacheComparison >= 0 ? "↗" : "↘"}{" "}
              {Math.abs(cacheComparison).toFixed(1)}% {cacheComparison >= 0 ? "above" : "below"} average
            </div>
          </div>

          {/* Thinking Tokens */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="text-sm text-[#8b949e] mb-2">Thinking Messages</div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-bold text-white">{userThinkingPct.toFixed(1)}%</span>
              <span className="text-sm text-[#484f58]">
                (avg: {communitySummary.avgThinkingPct.toFixed(1)}%)
              </span>
            </div>
            <div
              className={`text-xs ${
                thinkingComparison >= 0 ? "text-[#3fb950]" : "text-[#8b949e]"
              }`}
            >
              {thinkingComparison >= 0 ? "↗" : "↘"}{" "}
              {Math.abs(thinkingComparison).toFixed(1)}% {thinkingComparison >= 0 ? "more" : "less"} than average
            </div>
          </div>

          {/* Top Model */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="text-sm text-[#8b949e] mb-2">Your Top Model</div>
            <div className="text-lg font-bold text-[#58a6ff] mb-1">
              {userTopModel.replace("claude-", "")}
            </div>
            <div className="text-xs text-[#484f58]">
              Community favorite: {communitySummary.topModel.replace("claude-", "")}
            </div>
          </div>

          {/* Streak */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="text-sm text-[#8b949e] mb-2">Current Streak</div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-bold text-white">{stats.totals.streak}</span>
              <span className="text-sm text-[#484f58]">days</span>
            </div>
            <div className="text-xs text-[#484f58]">
              Community best: {communitySummary.bestStreak} days
              {stats.totals.streak >= communitySummary.bestStreak && (
                <span className="ml-2 text-[#3fb950]">🏆 You&apos;re the best!</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import ContributionHeatmap from "./ContributionHeatmap";
import { ClawPulseStats } from "@/types/stats";

interface CommunityStats {
  totalUsers: number;
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  days: { [date: string]: { tokens: number } };
  models: { [model: string]: { messages: number; tokens: number; cost: number } };
  tools: { [tool: string]: number };
}

export default function CommunityLanding() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCommunityStats() {
      try {
        const res = await fetch("/api/stats/community");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to load community stats:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCommunityStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#010409] flex items-center justify-center">
        <div className="text-[#8b949e] text-lg">Loading...</div>
      </div>
    );
  }

  // Convert community stats to heatmap format
  const heatmapStats: ClawPulseStats = {
    version: 1,
    agentName: "Community",
    generatedAt: new Date().toISOString(),
    days: Object.entries(stats?.days || {}).reduce((acc, [date, data]) => {
      acc[date] = {
        messages: 0,
        userMessages: 0,
        assistantMessages: 0,
        tokensIn: 0,
        tokensOut: 0,
        totalTokens: data.tokens,
        cost: 0,
        sessions: 0,
        models: {},
        tools: {},
        hourly: [],
        cacheRead: 0,
        cacheWrite: 0,
        thinkingMessages: 0,
      };
      return acc;
    }, {} as any),
    totals: {
      messages: stats?.totalMessages || 0,
      tokens: stats?.totalTokens || 0,
      cost: stats?.totalCost || 0,
      days: Object.keys(stats?.days || {}).length,
      streak: 0,
      longestStreak: 0,
      firstDay: "",
      lastDay: "",
    },
  };

  const topModels = Object.entries(stats?.models || {})
    .sort(([, a], [, b]) => b.tokens - a.tokens)
    .slice(0, 5);

  const topTools = Object.entries(stats?.tools || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-white mb-4">
          The Pulse of <span className="text-[#58a6ff]">OpenClaw</span>
        </h1>
        <p className="text-xl text-[#8b949e] mb-8">
          Community-powered agent analytics. Track, compare, and celebrate AI collaboration.
        </p>
        
        {/* Big Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-6">
            <div className="text-4xl font-bold text-[#58a6ff] mb-2">
              {stats?.totalUsers.toLocaleString() || 0}
            </div>
            <div className="text-[#8b949e]">Active Agents</div>
          </div>
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-6">
            <div className="text-4xl font-bold text-[#58a6ff] mb-2">
              {((stats?.totalTokens || 0) / 1_000_000).toFixed(1)}M
            </div>
            <div className="text-[#8b949e]">Total Tokens</div>
          </div>
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-6">
            <div className="text-4xl font-bold text-[#58a6ff] mb-2">
              {stats?.totalMessages.toLocaleString() || 0}
            </div>
            <div className="text-[#8b949e]">Messages</div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="bg-[#238636] hover:bg-[#2ea043] text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Sign in with GitHub
          </button>
          <a
            href="/community"
            className="bg-[#21262d] hover:bg-[#30363d] text-white font-semibold px-8 py-3 rounded-lg transition-colors inline-block"
          >
            View Leaderboard
          </a>
        </div>
      </div>

        {/* Community Heatmap */}
        <section className="mb-12">
          <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Community Activity</h3>
            <p className="text-sm text-[#8b949e] mb-6">
              Aggregate token usage across all agents
            </p>
            <ContributionHeatmap stats={heatmapStats} />
          </div>
        </section>

        {/* Model Distribution */}
        <section className="mb-12">
          <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Models</h3>
            <div className="space-y-3">
              {topModels.map(([model, data]) => {
                const percentage = ((data.tokens / (stats?.totalTokens || 1)) * 100).toFixed(1);
                return (
                  <div key={model}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white font-medium">{model}</span>
                      <span className="text-[#8b949e]">
                        {data.tokens.toLocaleString()} tokens ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#21262d] rounded-full h-2">
                      <div
                        className="bg-[#58a6ff] h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Tool Usage */}
        <section className="mb-12">
          <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Most Used Tools</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {topTools.map(([tool, count]) => (
                <div
                  key={tool}
                  className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
                >
                  <div className="text-2xl font-bold text-[#58a6ff] mb-1">
                    {count.toLocaleString()}
                  </div>
                  <div className="text-sm text-[#8b949e] truncate" title={tool}>
                    {tool}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Getting Started */}
        <section className="mb-12">
          <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-8">
            <h3 className="text-2xl font-semibold text-white mb-4">Connect Your Agent</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-[#58a6ff] text-white font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div>
                  <div className="text-white font-medium mb-1">Sign in with GitHub</div>
                  <div className="text-[#8b949e] text-sm">
                    Authenticate to link your OpenClaw agent
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-[#58a6ff] text-white font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <div>
                  <div className="text-white font-medium mb-1">Install the CLI</div>
                  <code className="block bg-[#010409] text-[#58a6ff] px-3 py-2 rounded text-sm mt-2">
                    npm install -g clawpulse
                  </code>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-[#58a6ff] text-white font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  3
                </div>
                <div>
                  <div className="text-white font-medium mb-1">Push your stats</div>
                  <code className="block bg-[#010409] text-[#58a6ff] px-3 py-2 rounded text-sm mt-2">
                    clawpulse push
                  </code>
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-[#21262d]">
        <div className="flex items-center justify-center gap-2 text-sm text-[#8b949e]">
          <span>⚡</span>
          <span>
            ClawPulse — Powered by{" "}
            <a
              href="https://openclaw.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#58a6ff] hover:underline"
            >
              OpenClaw
            </a>
          </span>
        </div>
        <p className="text-xs text-[#484f58] mt-2">
          No message content is collected. Only aggregate statistics.
        </p>
      </footer>
    </main>
  );
}

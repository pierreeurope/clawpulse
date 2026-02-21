"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import dynamic from "next/dynamic";
import ContributionHeatmap from "./ContributionHeatmap";
import RightNowSection from "./RightNowSection";
import TrendsSection from "./TrendsSection";
import EnhancedToolInsights from "./EnhancedToolInsights";
import MilestonesSection from "./MilestonesSection";
import { ClawPulseStats } from "@/types/stats";

const PulseGlobe = dynamic(() => import("./PulseGlobe"), { ssr: false });

interface CommunityStats {
  totalUsers: number;
  totalMessages: number;
  totalTokens: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCacheRead: number;
  totalCacheWrite: number;
  totalCost: number;
  days: { [date: string]: { tokens: number; messages: number; tokensIn: number; tokensOut: number; cost: number; sessions: number; cacheRead: number; cacheWrite: number } };
  models: { [model: string]: { messages: number; tokens: number; cost: number } };
  tools: { [tool: string]: number };
  activeAgents: number;
  lastSync: {
    agentName: string;
    tokenCount: number;
    timestamp: string;
  } | null;
  tokenBurnRate: number;
  tokenGrowth: number;
  messageGrowth: number;
  toolGrowth: { [tool: string]: number };
  thisWeekTokens: number;
  lastWeekTokens: number;
  thisWeekMessages: number;
  lastWeekMessages: number;
  recordHolders: {
    busiestDay: {
      agentName: string;
      date: string;
      tokens: number;
    } | null;
    mostDiverse: {
      agentName: string;
      toolCount: number;
    } | null;
  };
}

interface GlobeAgent {
  username: string;
  agentName: string;
  lat: number;
  lng: number;
  lastPushedAt: string;
  totalTokens: number;
}

export default function CommunityLanding() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [globeAgents, setGlobeAgents] = useState<GlobeAgent[]>([]);
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
    
    async function loadGlobeData() {
      try {
        const res = await fetch("/api/stats/globe");
        if (res.ok) {
          const data = await res.json();
          setGlobeAgents(data.agents || []);
        }
      } catch (error) {
        console.error("Failed to load globe data:", error);
      }
    }
    
    loadCommunityStats();
    loadGlobeData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#010409] flex items-center justify-center">
        <div className="animate-pulse text-[#58a6ff] text-lg">Loading the pulse...</div>
      </div>
    );
  }

  const formatNum = (n: number) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  // Derived data
  const totalModelTokens = Object.values(stats?.models || {}).reduce((sum, m) => sum + m.tokens, 0);
  const topModels = Object.entries(stats?.models || {})
    .filter(([, d]) => d.tokens > 0)
    .sort(([, a], [, b]) => b.tokens - a.tokens)
    .slice(0, 5);

  const topTools = Object.entries(stats?.tools || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12);

  const maxToolCount = topTools.length > 0 ? topTools[0][1] : 1;

  const totalDays = Object.keys(stats?.days || {}).length;
  const sortedDays = Object.entries(stats?.days || {}).sort(([a], [b]) => a.localeCompare(b));
  const busiestDay = sortedDays.reduce((best, [date, data]) =>
    data.tokens > (best?.tokens || 0) ? { date, tokens: data.tokens, messages: data.messages } : best,
    { date: "", tokens: 0, messages: 0 }
  );
  const avgTokensPerDay = totalDays > 0 ? (stats?.totalTokens || 0) / totalDays : 0;
  const avgMessagesPerDay = totalDays > 0 ? (stats?.totalMessages || 0) / totalDays : 0;

  // Cache efficiency
  const cacheTotal = (stats?.totalCacheRead || 0) + (stats?.totalCacheWrite || 0);
  const cacheHitRate = cacheTotal > 0 ? ((stats?.totalCacheRead || 0) / cacheTotal * 100) : 0;

  // Fun comparisons
  const tokensAsBooks = ((stats?.totalTokens || 0) / 75000).toFixed(0); // ~75k tokens per book
  const tokensAsMovieScripts = ((stats?.totalTokens || 0) / 25000).toFixed(0);

  // Heatmap adapter
  const heatmapStats: ClawPulseStats = {
    version: 1,
    agentName: "Community",
    generatedAt: new Date().toISOString(),
    days: Object.entries(stats?.days || {}).reduce((acc, [date, data]) => {
      acc[date] = {
        messages: data.messages || 0, userMessages: 0, assistantMessages: 0,
        tokensIn: data.tokensIn || 0, tokensOut: data.tokensOut || 0,
        totalTokens: data.tokens, cost: data.cost || 0, sessions: data.sessions || 0,
        models: {}, tools: {}, hourly: [],
        cacheRead: data.cacheRead || 0, cacheWrite: data.cacheWrite || 0, thinkingMessages: 0,
      };
      return acc;
    }, {} as any),
    totals: {
      messages: stats?.totalMessages || 0, tokens: stats?.totalTokens || 0,
      cost: stats?.totalCost || 0, days: totalDays, streak: 0, longestStreak: 0, firstDay: "", lastDay: "",
    },
  };

  // Model colors
  const modelColors = ["#58a6ff", "#3fb950", "#d2a8ff", "#f0883e", "#f85149"];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Quick Start Banner ── */}
      <section className="mb-10 rounded-xl border border-[#238636]/40 bg-gradient-to-r from-[#0d1117] to-[#0d1117] overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⚡</span>
              <h2 className="text-xl font-bold text-white">Connect your OpenClaw agent in 30 seconds</h2>
            </div>
            <p className="text-[#8b949e] text-sm mb-3">Just ask your agent:</p>
            <code className="block bg-[#010409] border border-[#30363d] text-[#e6edf3] px-4 py-3 rounded-lg text-sm font-mono mb-3">
              &quot;Install ClawPulse and connect to the community dashboard&quot;
            </code>
            <p className="text-[#484f58] text-xs">Or manually: <code className="text-[#58a6ff]">npm i -g openclaw-pulse && clawpulse setup</code>. Stats auto-sync via OpenClaw cron. No message content is ever collected.</p>
          </div>
          <button
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="bg-[#238636] hover:bg-[#2ea043] text-white font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            Sign in with GitHub
          </button>
        </div>
      </section>

      {/* ── Hero Stats ── */}
      <section className="mb-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            The Pulse of <span className="text-[#58a6ff]">OpenClaw</span>
          </h1>
          <p className="text-lg text-[#8b949e]">
            Real-time community analytics from {stats?.totalUsers || 0} connected agent{(stats?.totalUsers || 0) !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-5 text-center">
            <div className="text-3xl font-bold text-[#58a6ff]">{stats?.totalUsers || 0}</div>
            <div className="text-[#8b949e] text-xs mt-1">Agents Connected</div>
          </div>
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-5 text-center">
            <div className="text-3xl font-bold text-[#58a6ff]">{formatNum(stats?.totalTokens || 0)}</div>
            <div className="text-[#8b949e] text-xs mt-1">Total Tokens</div>
          </div>
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-5 text-center">
            <div className="text-3xl font-bold text-[#58a6ff]">{(stats?.totalMessages || 0).toLocaleString()}</div>
            <div className="text-[#8b949e] text-xs mt-1">Messages</div>
          </div>
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-5 text-center">
            <div className="text-3xl font-bold text-[#3fb950]">${(stats?.totalCost || 0).toFixed(0)}</div>
            <div className="text-[#8b949e] text-xs mt-1">Token Value</div>
            <div className="text-[#484f58] text-[10px]">at API rates</div>
          </div>
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-5 text-center">
            <div className="text-3xl font-bold text-[#d2a8ff]">{totalDays}</div>
            <div className="text-[#8b949e] text-xs mt-1">Active Days</div>
          </div>
        </div>
      </section>

      {/* ── The Global Pulse ── */}
      <section className="mb-10">
        <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-semibold text-white mb-2">Agents Around the World</h3>
            <p className="text-sm text-[#8b949e]">
              Each dot represents an OpenClaw agent. Brighter dots = recently active.
            </p>
          </div>
          
          {globeAgents.length > 0 ? (
            <div className="flex justify-center">
              <PulseGlobe agents={globeAgents} />
            </div>
          ) : (
            <div className="text-center py-12 text-[#8b949e]">
              <span className="text-4xl mb-2 block">🌍</span>
              <p>Waiting for agents to share their location...</p>
              <p className="text-xs text-[#484f58] mt-2">Push stats to see your agent on the globe!</p>
            </div>
          )}
          
          <div className="mt-6 flex flex-wrap gap-3 justify-center text-xs">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#161b22] rounded-lg border border-[#30363d]">
              <div className="w-2 h-2 rounded-full bg-[#58a6ff] animate-pulse" />
              <span className="text-[#8b949e]">Active in last hour</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#161b22] rounded-lg border border-[#30363d]">
              <div className="w-2 h-2 rounded-full bg-[#3fb950]" />
              <span className="text-[#8b949e]">Active today</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#161b22] rounded-lg border border-[#30363d]">
              <div className="w-2 h-2 rounded-full bg-[#484f58]" />
              <span className="text-[#8b949e]">Active this week</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Right Now ── */}
      <RightNowSection
        activeAgents={stats?.activeAgents || 0}
        lastSync={stats?.lastSync || null}
        tokenBurnRate={stats?.tokenBurnRate || 0}
      />

      {/* ── Trends ── */}
      <TrendsSection
        tokenGrowth={stats?.tokenGrowth || 0}
        messageGrowth={stats?.messageGrowth || 0}
        thisWeekTokens={stats?.thisWeekTokens || 0}
        lastWeekTokens={stats?.lastWeekTokens || 0}
        thisWeekMessages={stats?.thisWeekMessages || 0}
        lastWeekMessages={stats?.lastWeekMessages || 0}
        days={stats?.days || {}}
        models={stats?.models || {}}
      />

      {/* ── Milestones ── */}
      <MilestonesSection
        totalTokens={stats?.totalTokens || 0}
        recordHolders={stats?.recordHolders || { busiestDay: null, mostDiverse: null }}
      />

      {/* ── Activity Heatmap ── */}
      <section className="mb-10">
        <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Community Activity</h3>
              <p className="text-sm text-[#8b949e]">
                {formatNum(stats?.totalTokens || 0)} tokens processed across all agents
              </p>
            </div>
            <a href="/community" className="text-sm text-[#58a6ff] hover:underline">View leaderboard →</a>
          </div>
          <ContributionHeatmap stats={heatmapStats} />
        </div>
      </section>

      {/* ── Token Economy ── */}
      <section className="mb-10">
        <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Token Economy</h3>
          <p className="text-sm text-[#8b949e] mb-5">Where the tokens go</p>

          {/* Visual bar */}
          <div className="h-8 rounded-full overflow-hidden flex mb-4">
            {[
              { label: "Cache Read", value: stats?.totalCacheRead || 0, color: "#d2a8ff" },
              { label: "Cache Write", value: stats?.totalCacheWrite || 0, color: "#f0883e" },
              { label: "Output", value: stats?.totalTokensOut || 0, color: "#3fb950" },
              { label: "Input", value: stats?.totalTokensIn || 0, color: "#58a6ff" },
            ].filter(t => t.value > 0).map(({ label, value, color }) => {
              const pct = (value / (stats?.totalTokens || 1)) * 100;
              return (
                <div
                  key={label}
                  className="h-full transition-all relative group"
                  style={{ width: `${Math.max(pct, 0.5)}%`, backgroundColor: color }}
                  title={`${label}: ${formatNum(value)} (${pct.toFixed(1)}%)`}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                    {pct >= 8 ? label : ""}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Cache Read", value: stats?.totalCacheRead || 0, color: "#d2a8ff", desc: "Reused context" },
              { label: "Cache Write", value: stats?.totalCacheWrite || 0, color: "#f0883e", desc: "New context stored" },
              { label: "Output", value: stats?.totalTokensOut || 0, color: "#3fb950", desc: "Generated text" },
              { label: "Input", value: stats?.totalTokensIn || 0, color: "#58a6ff", desc: "Prompt tokens" },
            ].map(({ label, value, color, desc }) => (
              <div key={label} className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm text-[#8b949e]">{label}</span>
                </div>
                <div className="text-xl font-bold text-white">{formatNum(value)}</div>
                <div className="text-xs text-[#484f58]">
                  {((value / (stats?.totalTokens || 1)) * 100).toFixed(1)}% · {desc}
                </div>
              </div>
            ))}
          </div>

          {/* Cache efficiency callout */}
          {cacheHitRate > 0 && (
            <div className="mt-4 bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex items-center gap-3">
              <div className="text-2xl">🎯</div>
              <div>
                <span className="text-white font-semibold">{cacheHitRate.toFixed(0)}% cache hit rate</span>
                <span className="text-[#8b949e] text-sm ml-2">
                  — {formatNum(stats?.totalCacheRead || 0)} tokens served from cache
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Fun Facts Row ── */}
      <section className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-5">
          <div className="text-[#f0883e] text-sm font-medium mb-1">📚 That&apos;s equivalent to</div>
          <div className="text-2xl font-bold text-white">{Number(tokensAsBooks).toLocaleString()} books</div>
          <div className="text-xs text-[#484f58]">At ~75K tokens per book</div>
        </div>
        <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-5">
          <div className="text-[#3fb950] text-sm font-medium mb-1">📊 Daily average</div>
          <div className="text-2xl font-bold text-white">{formatNum(avgTokensPerDay)} tokens</div>
          <div className="text-xs text-[#484f58]">{Math.round(avgMessagesPerDay)} messages per active day</div>
        </div>
        <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-5">
          <div className="text-[#f85149] text-sm font-medium mb-1">🔥 Busiest day</div>
          <div className="text-2xl font-bold text-white">{formatNum(busiestDay.tokens)}</div>
          <div className="text-xs text-[#484f58]">
            {busiestDay.date ? `${busiestDay.date} · ${busiestDay.messages} messages` : "No data yet"}
          </div>
        </div>
      </section>

      {/* ── Enhanced Tool Insights ── */}
      <EnhancedToolInsights
        tools={stats?.tools || {}}
        toolGrowth={stats?.toolGrowth || {}}
      />

      {/* ── How It Works ── */}
      <section className="mb-10">
        <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-8">
          <h3 className="text-2xl font-semibold text-white mb-6 text-center">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#238636]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">💬</span>
              </div>
              <div className="text-white font-medium mb-1">1. Ask your agent</div>
              <div className="text-[#8b949e] text-sm">&quot;Set up ClawPulse&quot; - your agent installs the CLI, authenticates via GitHub, and pushes your first stats</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#58a6ff]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🔄</span>
              </div>
              <div className="text-white font-medium mb-1">2. Auto-sync</div>
              <div className="text-[#8b949e] text-sm">
                Your agent sets up OpenClaw cron jobs to push stats at midnight and noon. Only aggregate numbers, never message content.
              </div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#d2a8ff]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🌍</span>
              </div>
              <div className="text-white font-medium mb-1">3. Join the pulse</div>
              <div className="text-[#8b949e] text-sm">See your dashboard, compare with the community, and watch OpenClaw grow together</div>
            </div>
          </div>
          <div className="text-center mt-6">
            <button
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              className="bg-[#238636] hover:bg-[#2ea043] text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* ── Privacy Notice ── */}
      <section className="mb-10">
        <div className="rounded-xl border border-[#21262d] bg-[#0d1117]/50 p-6">
          <div className="flex items-start gap-3">
            <span className="text-xl">🔒</span>
            <div>
              <h4 className="text-white font-medium mb-1">Privacy First</h4>
              <p className="text-sm text-[#8b949e]">
                ClawPulse only collects aggregate numbers: token counts, model names, tool usage frequency, and cost estimates.
                No message content, file paths, tool arguments, or personal data is ever transmitted.
                All data processing happens locally on your machine.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-[#21262d]">
        <div className="flex items-center justify-center gap-4 text-sm text-[#8b949e]">
          <span>⚡ ClawPulse</span>
          <span>·</span>
          <a href="https://openclaw.ai" target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:underline">OpenClaw</a>
          <span>·</span>
          <a href="https://github.com/pierreeurope/clawpulse" target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:underline">GitHub</a>
          <span>·</span>
          <a href="/community" className="text-[#58a6ff] hover:underline">Leaderboard</a>
        </div>
      </footer>
    </main>
  );
}

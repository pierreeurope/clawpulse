"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ContributionHeatmap from "@/components/ContributionHeatmap";
import { ClawPulseStats } from "@/types/stats";

interface AgentProfile {
  username: string;
  avatar: string | null;
  agentName: string;
  createdAt: string;
  days: any;
  totals: {
    messages: number;
    tokens: number;
    cost: number;
    activeDays: number;
    streak: number;
    longestStreak: number;
    firstDay: string;
    lastDay: string;
  };
  topModel: string;
  topTools: { tool: string; count: number }[];
  badges: { id: string; name: string; desc: string }[];
}

export default function AgentProfilePage() {
  const params = useParams();
  const username = params?.username as string;
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(`/api/stats/agent/${username}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else if (res.status === 404) {
          setError("Agent not found");
        } else {
          setError("Failed to load profile");
        }
      } catch (err) {
        console.error("Failed to load agent profile:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    if (username) {
      loadProfile();
    }
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#010409] flex items-center justify-center">
        <div className="animate-pulse text-[#58a6ff] text-lg">Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#010409]">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/community" className="text-[#58a6ff] hover:underline mb-4 inline-block">
            ← Back to Leaderboard
          </Link>
          <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-12 text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold text-white mb-2">{error || "Agent not found"}</h2>
            <p className="text-[#8b949e]">This agent hasn&apos;t connected to ClawPulse yet.</p>
          </div>
        </main>
      </div>
    );
  }

  const formatNum = (n: number) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Convert to ClawPulseStats format for heatmap
  const heatmapStats: ClawPulseStats = {
    version: 1,
    agentName: profile.agentName,
    generatedAt: new Date().toISOString(),
    days: profile.days,
    totals: {
      messages: profile.totals.messages,
      tokens: profile.totals.tokens,
      cost: profile.totals.cost,
      days: profile.totals.activeDays,
      streak: profile.totals.streak,
      longestStreak: profile.totals.longestStreak,
      firstDay: profile.totals.firstDay,
      lastDay: profile.totals.lastDay,
    },
  };

  return (
    <div className="min-h-screen bg-[#010409]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/community" className="text-[#58a6ff] hover:underline mb-4 inline-block">
            ← Back to Leaderboard
          </Link>
        </div>

        {/* Profile Header */}
        <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-8 mb-6">
          <div className="flex items-start gap-6">
            {profile.avatar && (
              <img
                src={profile.avatar}
                alt={profile.username}
                className="w-24 h-24 rounded-full border-2 border-[#30363d]"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{profile.agentName}</h1>
              <div className="flex items-center gap-2 text-[#8b949e] mb-3">
                <a
                  href={`https://github.com/${profile.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#58a6ff] hover:underline"
                >
                  @{profile.username}
                </a>
                <span>·</span>
                <span>Member since {memberSince}</span>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold text-[#58a6ff]">{formatNum(profile.totals.tokens)}</div>
                  <div className="text-xs text-[#8b949e]">Total Tokens</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#3fb950]">{profile.totals.messages.toLocaleString()}</div>
                  <div className="text-xs text-[#8b949e]">Messages</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#f0883e]">{profile.totals.streak}</div>
                  <div className="text-xs text-[#8b949e]">Day Streak</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#d2a8ff]">${profile.totals.cost.toFixed(0)}</div>
                  <div className="text-xs text-[#8b949e]">Token Value</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        {profile.badges.length > 0 && (
          <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">🏆 Achievements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {profile.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex items-center gap-3"
                >
                  <div className="text-2xl">{badge.name.split(" ")[0]}</div>
                  <div>
                    <div className="text-white font-medium">{badge.name.slice(2)}</div>
                    <div className="text-xs text-[#8b949e]">{badge.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Heatmap */}
        <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Activity Overview</h3>
              <p className="text-sm text-[#8b949e]">
                {profile.totals.activeDays} active days · {formatNum(profile.totals.tokens)} tokens
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-[#8b949e]">Longest streak</div>
              <div className="text-2xl font-bold text-[#f0883e]">{profile.totals.longestStreak} days</div>
            </div>
          </div>
          <ContributionHeatmap stats={heatmapStats} />
        </div>

        {/* Two-column: Model + Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Favorite Model */}
          <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Favorite Model</h3>
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="text-xl font-bold text-[#58a6ff]">{profile.topModel.replace("claude-", "")}</div>
              <div className="text-sm text-[#8b949e] mt-1">Most used across all activity</div>
            </div>
          </div>

          {/* Top Tools */}
          <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Top Tools</h3>
            <div className="space-y-2">
              {profile.topTools.slice(0, 5).map((item, idx) => (
                <div key={item.tool} className="flex items-center gap-3">
                  <span className="text-xs text-[#8b949e] w-4">#{idx + 1}</span>
                  <span className="text-sm text-[#e6edf3] flex-1 font-mono">{item.tool}</span>
                  <span className="text-xs text-[#8b949e]">{formatNum(item.count)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

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
        </footer>
      </main>
    </div>
  );
}

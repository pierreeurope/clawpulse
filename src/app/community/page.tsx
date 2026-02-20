"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface LeaderboardEntry {
  id: number;
  username: string;
  avatar: string | null;
  agentName: string;
  totalTokens: number;
  activeDays: number;
  lastActive: string;
}

export default function CommunityPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const res = await fetch("/api/stats/leaderboard");
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data);
        }
      } catch (error) {
        console.error("Failed to load leaderboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-[#010409]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-[#58a6ff] hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Community Leaderboard</h1>
          <p className="text-[#8b949e]">
            Top OpenClaw agents by total tokens processed
          </p>
        </div>

        {/* Leaderboard */}
        <div className="rounded-xl border border-[#30363d] bg-[#0d1117] overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[#8b949e]">
              Loading leaderboard...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-12 text-center text-[#8b949e]">
              No data yet. Be the first to join!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#161b22] border-b border-[#30363d]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#8b949e]">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#8b949e]">Agent</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-[#8b949e]">Total Tokens</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-[#8b949e]">Active Days</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-[#8b949e]">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr 
                      key={entry.id} 
                      className="border-b border-[#21262d] hover:bg-[#161b22] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className={`font-bold ${
                          index === 0 ? "text-yellow-500" :
                          index === 1 ? "text-gray-400" :
                          index === 2 ? "text-orange-600" :
                          "text-[#8b949e]"
                        }`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {entry.avatar && (
                            <img 
                              src={entry.avatar} 
                              alt={entry.username}
                              className="w-10 h-10 rounded-full"
                            />
                          )}
                          <div>
                            <div className="text-white font-medium">{entry.username}</div>
                            <div className="text-sm text-[#8b949e]">{entry.agentName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-white font-mono">
                        {entry.totalTokens.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-[#8b949e]">
                        {entry.activeDays}
                      </td>
                      <td className="px-6 py-4 text-right text-[#8b949e] text-sm">
                        {new Date(entry.lastActive).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center py-8 mt-8 border-t border-[#21262d]">
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

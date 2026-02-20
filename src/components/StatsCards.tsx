"use client";

import React, { useMemo } from "react";
import { ClawPulseStats } from "@/types/stats";
import { formatTokens, formatCost, formatNumber } from "@/lib/format";

interface Props {
  stats: ClawPulseStats;
}

interface StatCard {
  label: string;
  value: string;
  detail: string;
  icon: string;
  color: string;
}

export default function StatsCards({ stats }: Props) {
  const cards: StatCard[] = useMemo(() => {
    // Find most used model
    const modelTotals: { [m: string]: number } = {};
    for (const day of Object.values(stats.days)) {
      for (const [model, data] of Object.entries(day.models)) {
        modelTotals[model] = (modelTotals[model] || 0) + data.messages;
      }
    }
    const topModel = Object.entries(modelTotals).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const totalSessions = Object.values(stats.days).reduce(
      (sum, d) => sum + d.sessions,
      0
    );

    return [
      {
        label: "Total Tokens",
        value: formatTokens(stats.totals.tokens),
        detail: "tokens processed",
        icon: "⚡",
        color: "from-green-500/20 to-emerald-500/10",
      },
      {
        label: "Token Value",
        value: formatCost(stats.totals.cost),
        detail: "Est. at API rates",
        icon: "💰",
        color: "from-yellow-500/20 to-amber-500/10",
      },
      {
        label: "Messages",
        value: formatNumber(stats.totals.messages),
        detail: `across ${totalSessions} sessions`,
        icon: "💬",
        color: "from-blue-500/20 to-cyan-500/10",
      },
      {
        label: "Active Days",
        value: stats.totals.days.toString(),
        detail: `since ${stats.totals.firstDay}`,
        icon: "📅",
        color: "from-purple-500/20 to-violet-500/10",
      },
      {
        label: "Current Streak",
        value: `${stats.totals.streak} days`,
        detail: `longest: ${stats.totals.longestStreak} days`,
        icon: "🔥",
        color: "from-orange-500/20 to-red-500/10",
      },
      {
        label: "Top Model",
        value: topModel
          ? topModel[0].replace("claude-", "").replace("-", " ")
          : "N/A",
        detail: topModel
          ? `${formatNumber(topModel[1])} messages`
          : "",
        icon: "🧠",
        color: "from-pink-500/20 to-rose-500/10",
      },
    ];
  }, [stats]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`
            relative overflow-hidden rounded-xl border border-[#30363d]
            bg-gradient-to-br ${card.color}
            bg-[#0d1117] p-4
            hover:border-[#58a6ff]/50 transition-all duration-300
            group
          `}
        >
          <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
            {card.icon}
          </div>
          <div className="text-xs text-[#8b949e] uppercase tracking-wider mb-1">
            {card.label}
          </div>
          <div className="text-xl font-bold text-white truncate">
            {card.value}
          </div>
          <div className="text-xs text-[#8b949e] mt-1 truncate">
            {card.detail}
          </div>
        </div>
      ))}
    </div>
  );
}

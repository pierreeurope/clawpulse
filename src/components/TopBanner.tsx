"use client";

import React from "react";
import { ClawPulseStats } from "@/types/stats";
import { formatDate } from "@/lib/format";

interface Props {
  stats: ClawPulseStats;
}

export default function TopBanner({ stats }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#30363d] bg-gradient-to-r from-[#0d1117] via-[#161b22] to-[#0d1117] p-8 mb-8">
      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#39d353]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#58a6ff]/5 rounded-full blur-3xl" />

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
            <div className="text-4xl">⚡</div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-[#c9d1d9] to-[#8b949e] bg-clip-text text-transparent">
              {stats.agentName}
            </h1>
          </div>
          <p className="text-[#8b949e] text-sm md:text-base mt-1">
            AI Agent Activity Dashboard
          </p>
          <div className="flex items-center gap-2 mt-3 justify-center md:justify-start">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#21262d] border border-[#30363d] text-xs text-[#8b949e]">
              <div className="w-2 h-2 rounded-full bg-[#39d353] animate-pulse" />
              Powered by OpenClaw
            </div>
          </div>
        </div>

        <div className="text-center md:text-right">
          <div className="text-xs text-[#8b949e] uppercase tracking-wider mb-1">
            Activity Period
          </div>
          <div className="text-sm text-[#c9d1d9]">
            {stats.totals.firstDay
              ? `${formatDate(stats.totals.firstDay)} — ${formatDate(stats.totals.lastDay)}`
              : "No data yet"}
          </div>
          <div className="text-xs text-[#8b949e] mt-2">
            Last updated:{" "}
            {new Date(stats.generatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

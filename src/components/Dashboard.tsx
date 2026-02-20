"use client";

import React from "react";
import { ClawPulseStats } from "@/types/stats";
import TopBanner from "./TopBanner";
import StatsCards from "./StatsCards";
import ContributionHeatmap from "./ContributionHeatmap";
import TokenFlowChart from "./TokenFlowChart";
import ModelUsageChart from "./ModelUsageChart";
import ToolUsageChart from "./ToolUsageChart";
import ActivityClock from "./ActivityClock";

interface Props {
  stats: ClawPulseStats;
}

export default function Dashboard({ stats }: Props) {
  return (
    <div className="min-h-screen bg-[#010409]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Banner */}
        <TopBanner stats={stats} />

        {/* Stats Cards */}
        <section className="mb-8">
          <StatsCards stats={stats} />
        </section>

        {/* Contribution Heatmap */}
        <section className="mb-8">
          <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Activity Overview
                </h3>
                <p className="text-sm text-[#8b949e]">
                  {stats.totals.tokens.toLocaleString()} tokens in the last year
                </p>
              </div>
            </div>
            <ContributionHeatmap stats={stats} />
          </div>
        </section>

        {/* Token Flow Chart */}
        <section className="mb-8">
          <TokenFlowChart stats={stats} />
        </section>

        {/* Two-column: Model Usage + Tool Usage */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ModelUsageChart stats={stats} />
          <ToolUsageChart stats={stats} />
        </section>

        {/* Activity Clock */}
        <section className="mb-8 max-w-2xl mx-auto">
          <ActivityClock stats={stats} />
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
    </div>
  );
}

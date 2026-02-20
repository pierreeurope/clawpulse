"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ClawPulseStats } from "@/types/stats";
import { formatTokens } from "@/lib/format";

interface Props {
  stats: ClawPulseStats;
}

export default function TokenFlowChart({ stats }: Props) {
  const data = useMemo(() => {
    return Object.entries(stats.days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, day]) => ({
        date,
        shortDate: new Date(date + "T00:00:00").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        input: day.tokensIn,
        output: day.tokensOut,
        cache: day.cacheRead,
        total: day.totalTokens,
      }));
  }, [stats]);

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Token Flow</h3>
          <p className="text-sm text-[#8b949e]">Daily token usage over time</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#58a6ff]" />
            <span className="text-[#8b949e]">Input</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#39d353]" />
            <span className="text-[#8b949e]">Output</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#a371f7]" />
            <span className="text-[#8b949e]">Cache</span>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorInput" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#58a6ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#39d353" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#39d353" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCache" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a371f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a371f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
            <XAxis
              dataKey="shortDate"
              stroke="#8b949e"
              fontSize={11}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={60}
            />
            <YAxis
              stroke="#8b949e"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatTokens(v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1b1f23",
                border: "1px solid #30363d",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value: number | undefined, name: string | undefined) => [
                formatTokens(value ?? 0),
                (name ?? "").charAt(0).toUpperCase() + (name ?? "").slice(1),
              ]}
              labelFormatter={(label) => label}
            />
            <Area
              type="monotone"
              dataKey="cache"
              stackId="1"
              stroke="#a371f7"
              fill="url(#colorCache)"
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="input"
              stackId="1"
              stroke="#58a6ff"
              fill="url(#colorInput)"
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="output"
              stackId="1"
              stroke="#39d353"
              fill="url(#colorOutput)"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

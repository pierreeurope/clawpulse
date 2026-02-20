"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ClawPulseStats } from "@/types/stats";
import { formatNumber } from "@/lib/format";

interface Props {
  stats: ClawPulseStats;
}

const TOOL_EMOJIS: { [key: string]: string } = {
  exec: "⚙️",
  Read: "📖",
  Write: "✏️",
  Edit: "🔧",
  web_search: "🔍",
  web_fetch: "🌐",
  browser: "🖥️",
  message: "💬",
  process: "📊",
  image: "🖼️",
  tts: "🔊",
  nodes: "📡",
  canvas: "🎨",
};

export default function ToolUsageChart({ stats }: Props) {
  const data = useMemo(() => {
    const toolTotals: { [t: string]: number } = {};

    for (const day of Object.values(stats.days)) {
      for (const [tool, count] of Object.entries(day.tools)) {
        toolTotals[tool] = (toolTotals[tool] || 0) + count;
      }
    }

    return Object.entries(toolTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, count]) => ({
        name,
        displayName: `${TOOL_EMOJIS[name] || "🔧"} ${name}`,
        count,
      }));
  }, [stats]);

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
      <h3 className="text-lg font-semibold text-white mb-1">Tool Usage</h3>
      <p className="text-sm text-[#8b949e] mb-6">Most frequently used tools</p>

      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#21262d"
              horizontal={false}
            />
            <XAxis
              type="number"
              stroke="#8b949e"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatNumber(v)}
            />
            <YAxis
              type="category"
              dataKey="displayName"
              stroke="#8b949e"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1b1f23",
                border: "1px solid #30363d",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value: number | undefined) => [
                formatNumber(value ?? 0) + " calls",
                "Usage",
              ]}
              labelFormatter={(label) => label}
            />
            <Bar
              dataKey="count"
              fill="#58a6ff"
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
            >
              {data.map((_, i) => {
                const colors = [
                  "#58a6ff",
                  "#a371f7",
                  "#39d353",
                  "#f0883e",
                  "#f778ba",
                  "#79c0ff",
                  "#d2a8ff",
                  "#7ee787",
                  "#ffa657",
                  "#ff7b72",
                  "#56d4dd",
                  "#ffc680",
                ];
                return (
                  <rect key={i} fill={colors[i % colors.length]} />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

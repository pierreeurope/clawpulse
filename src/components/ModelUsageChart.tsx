"use client";

import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ClawPulseStats } from "@/types/stats";
import { formatTokens, formatCost } from "@/lib/format";

interface Props {
  stats: ClawPulseStats;
}

const MODEL_COLORS = [
  "#58a6ff", // blue
  "#a371f7", // purple
  "#39d353", // green
  "#f0883e", // orange
  "#f778ba", // pink
  "#79c0ff", // light blue
  "#d2a8ff", // light purple
  "#7ee787", // light green
  "#ffa657", // light orange
  "#ff7b72", // red
];

function cleanModelName(model: string): string {
  return model
    .replace("claude-", "")
    .replace("anthropic/", "")
    .replace(/-\d{8}$/, "");
}

export default function ModelUsageChart({ stats }: Props) {
  const data = useMemo(() => {
    const modelTotals: {
      [m: string]: { tokens: number; cost: number; messages: number };
    } = {};

    for (const day of Object.values(stats.days)) {
      for (const [model, d] of Object.entries(day.models)) {
        if (!modelTotals[model]) {
          modelTotals[model] = { tokens: 0, cost: 0, messages: 0 };
        }
        modelTotals[model].tokens += d.tokensIn + d.tokensOut;
        modelTotals[model].cost += d.cost;
        modelTotals[model].messages += d.messages;
      }
    }

    return Object.entries(modelTotals)
      .sort((a, b) => b[1].tokens - a[1].tokens)
      .map(([name, data]) => ({
        name: cleanModelName(name),
        fullName: name,
        ...data,
      }));
  }, [stats]);

  const totalTokens = data.reduce((sum, d) => sum + d.tokens, 0);

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
      <h3 className="text-lg font-semibold text-white mb-1">Model Usage</h3>
      <p className="text-sm text-[#8b949e] mb-6">Token distribution by model</p>

      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-[200px] h-[200px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                dataKey="tokens"
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={MODEL_COLORS[i % MODEL_COLORS.length]}
                    className="hover:opacity-80 transition-opacity duration-200"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1b1f23",
                  border: "1px solid #30363d",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "13px",
                }}
                formatter={(value: number | undefined) => [
                  formatTokens(value ?? 0) + " tokens",
                  "Usage",
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 w-full space-y-2">
          {data.map((model, i) => {
            const pct = ((model.tokens / totalTokens) * 100).toFixed(1);
            return (
              <div key={model.fullName} className="group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          MODEL_COLORS[i % MODEL_COLORS.length],
                      }}
                    />
                    <span className="text-sm text-[#c9d1d9] truncate">
                      {model.name}
                    </span>
                  </div>
                  <div className="text-xs text-[#8b949e] flex items-center gap-3">
                    <span>{formatTokens(model.tokens)}</span>
                    <span className="text-[#58a6ff]">{pct}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                    style={{
                      width: `${pct}%`,
                      backgroundColor:
                        MODEL_COLORS[i % MODEL_COLORS.length],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

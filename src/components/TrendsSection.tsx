"use client";

import { LineChart, Line, AreaChart, Area, ResponsiveContainer } from "recharts";

interface TrendsSectionProps {
  tokenGrowth: number;
  messageGrowth: number;
  thisWeekTokens: number;
  lastWeekTokens: number;
  thisWeekMessages: number;
  lastWeekMessages: number;
  days: { [date: string]: { tokens: number; messages: number } };
  models: { [model: string]: { tokens: number } };
}

export default function TrendsSection({
  tokenGrowth,
  messageGrowth,
  thisWeekTokens,
  lastWeekTokens,
  thisWeekMessages,
  lastWeekMessages,
  days,
  models,
}: TrendsSectionProps) {
  const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  // Last 30 days for sparklines
  const sortedDays = Object.entries(days).sort(([a], [b]) => a.localeCompare(b));
  const last30Days = sortedDays.slice(-30).map(([date, data]) => ({
    date,
    tokens: data.tokens,
  }));

  // Model data for stacked area (last 30 days)
  const modelColors: { [model: string]: string } = {
    "claude-sonnet-4": "#58a6ff",
    "claude-opus-4": "#3fb950",
    "claude-haiku-4": "#d2a8ff",
    "gpt-4o": "#f0883e",
    "gpt-4": "#f85149",
  };

  const topModels = Object.entries(models)
    .sort(([, a], [, b]) => b.tokens - a.tokens)
    .slice(0, 5)
    .map(([model]) => model);

  const modelData = sortedDays.slice(-30).map(([date]) => {
    const dayData: any = { date };
    topModels.forEach((model) => {
      dayData[model] = 0;
    });
    return dayData;
  });

  // Fill in actual model data (simplified - we don't have daily model breakdown in current schema)
  // For now, show a simplified version
  const simplifiedModelData = topModels.map((model, idx) => ({
    model: model.replace("claude-", ""),
    value: models[model]?.tokens || 0,
    color: Object.values(modelColors)[idx] || "#8b949e",
  }));

  return (
    <section className="mb-10">
      <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
        <h3 className="text-xl font-bold text-white mb-1">📈 Trends</h3>
        <p className="text-sm text-[#8b949e] mb-6">Week-over-week growth and activity patterns</p>

        {/* This Week vs Last Week */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#8b949e]">Tokens</span>
              <span
                className={`text-sm font-bold ${
                  tokenGrowth >= 0 ? "text-[#3fb950]" : "text-[#f85149]"
                }`}
              >
                {tokenGrowth >= 0 ? "↗" : "↘"} {Math.abs(tokenGrowth).toFixed(1)}%
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{formatNum(thisWeekTokens)}</div>
            <div className="text-xs text-[#484f58]">
              This week · Last week: {formatNum(lastWeekTokens)}
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#8b949e]">Messages</span>
              <span
                className={`text-sm font-bold ${
                  messageGrowth >= 0 ? "text-[#3fb950]" : "text-[#f85149]"
                }`}
              >
                {messageGrowth >= 0 ? "↗" : "↘"} {Math.abs(messageGrowth).toFixed(1)}%
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{formatNum(thisWeekMessages)}</div>
            <div className="text-xs text-[#484f58]">
              This week · Last week: {formatNum(lastWeekMessages)}
            </div>
          </div>
        </div>

        {/* Sparkline - Last 30 Days */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 mb-6">
          <div className="text-sm text-[#8b949e] mb-3">Token activity (last 30 days)</div>
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={last30Days}>
              <Line
                type="monotone"
                dataKey="tokens"
                stroke="#58a6ff"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Model Distribution */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
          <div className="text-sm text-[#8b949e] mb-4">Model Migration</div>
          <div className="space-y-3">
            {simplifiedModelData.map((item) => {
              const total = simplifiedModelData.reduce((sum, m) => sum + m.value, 0);
              const pct = ((item.value / total) * 100).toFixed(1);
              return (
                <div key={item.model}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-white font-mono">{item.model}</span>
                    <span className="text-[#8b949e]">{pct}%</span>
                  </div>
                  <div className="h-2 bg-[#0d1117] rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

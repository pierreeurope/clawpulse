"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface MilestonesSectionProps {
  totalTokens: number;
  days: { [date: string]: { tokens: number } };
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
  bestStreak?: number;
}

const MILESTONES = [
  { value: 1_000_000_000, label: "1B" },
  { value: 10_000_000_000, label: "10B" },
  { value: 100_000_000_000, label: "100B" },
  { value: 1_000_000_000_000, label: "1T" },
  { value: 10_000_000_000_000, label: "10T" },
  { value: 100_000_000_000_000, label: "100T" },
];

const formatNum = (n: number) => {
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(1)}T`;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
};

function formatDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function MilestonesSection({ totalTokens, days, recordHolders, bestStreak }: MilestonesSectionProps) {
  // Build cumulative token data sorted by date
  const sortedDays = Object.entries(days)
    .sort(([a], [b]) => a.localeCompare(b));

  let cumulative = 0;
  const chartData = sortedDays.map(([date, data]) => {
    cumulative += data.tokens;
    return { date, cumulative, label: formatDate(date) };
  });

  // Find when each milestone was achieved
  const milestoneAchievements: { label: string; date: string; value: number }[] = [];
  cumulative = 0;
  const milestonesToFind = [...MILESTONES];
  for (const [date, data] of sortedDays) {
    cumulative += data.tokens;
    while (milestonesToFind.length > 0 && cumulative >= milestonesToFind[0].value) {
      const m = milestonesToFind.shift()!;
      milestoneAchievements.push({ label: m.label, date, value: m.value });
    }
  }

  // Current & next milestone
  const currentMilestone = MILESTONES.filter((m) => totalTokens >= m.value).pop();
  const nextMilestone = MILESTONES.find((m) => totalTokens < m.value);
  const progress = nextMilestone
    ? ((totalTokens / nextMilestone.value) * 100).toFixed(1)
    : 100;

  return (
    <section className="mb-10">
      <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
        <h3 className="text-xl font-bold text-white mb-1">🎯 Milestones & Records</h3>
        <p className="text-sm text-[#8b949e] mb-6">Community achievements and record holders</p>

        {/* Progress bar */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-[#8b949e]">Community Progress</div>
              {currentMilestone && (
                <div className="text-lg font-bold text-[#3fb950]">
                  🎉 Reached {currentMilestone.label} tokens!
                </div>
              )}
            </div>
            {nextMilestone && (
              <div className="text-right">
                <div className="text-xs text-[#8b949e]">Next: {nextMilestone.label}</div>
                <div className="text-xl font-bold text-[#58a6ff]">{progress}%</div>
              </div>
            )}
          </div>

          {nextMilestone && (
            <>
              <div className="h-3 bg-[#0d1117] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-[#58a6ff] to-[#3fb950] transition-all"
                  style={{ width: `${Math.min(Number(progress), 100)}%` }}
                />
              </div>
              <div className="text-xs text-[#484f58]">
                {formatNum(totalTokens)} / {formatNum(nextMilestone.value)} tokens
              </div>
            </>
          )}

          {/* Milestone markers */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#30363d]">
            {MILESTONES.map((m) => {
              const achieved = totalTokens >= m.value;
              const achievement = milestoneAchievements.find((a) => a.value === m.value);
              return (
                <div
                  key={m.value}
                  className="flex flex-col items-center"
                  title={achieved && achievement ? `Achieved ${m.label} on ${achievement.date}` : `Target: ${m.label}`}
                >
                  <div
                    className={`w-3 h-3 rounded-full mb-1 ${
                      achieved ? "bg-[#3fb950]" : "bg-[#30363d]"
                    }`}
                  />
                  <div
                    className={`text-[10px] ${
                      achieved ? "text-[#3fb950]" : "text-[#484f58]"
                    }`}
                  >
                    {m.label}
                  </div>
                  {achieved && achievement && (
                    <div className="text-[9px] text-[#3fb950]/60">
                      {formatDate(achievement.date)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cumulative token growth chart */}
        {chartData.length > 1 && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 mb-6">
            <div className="mb-3">
              <div className="text-sm font-medium text-white">Cumulative Token Growth</div>
              <div className="text-xs text-[#8b949e]">Total tokens processed over time</div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#484f58", fontSize: 11 }}
                    axisLine={{ stroke: "#30363d" }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => formatNum(v)}
                    tick={{ fill: "#484f58", fontSize: 11 }}
                    axisLine={{ stroke: "#30363d" }}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#161b22",
                      border: "1px solid #30363d",
                      borderRadius: "8px",
                      color: "#e6edf3",
                      fontSize: 12,
                    }}
                    formatter={(value: any) => [formatNum(Number(value)), "Total Tokens"]}
                    labelStyle={{ color: "#8b949e" }}
                  />
                  {/* Reference lines for achieved milestones */}
                  {milestoneAchievements.map((m) => (
                    <ReferenceLine
                      key={m.value}
                      y={m.value}
                      stroke="#3fb950"
                      strokeDasharray="4 4"
                      strokeOpacity={0.4}
                      label={{
                        value: m.label,
                        position: "right",
                        fill: "#3fb950",
                        fontSize: 10,
                      }}
                    />
                  ))}
                  {/* Reference line for next milestone */}
                  {nextMilestone && (
                    <ReferenceLine
                      y={nextMilestone.value}
                      stroke="#58a6ff"
                      strokeDasharray="4 4"
                      strokeOpacity={0.3}
                      label={{
                        value: nextMilestone.label,
                        position: "right",
                        fill: "#58a6ff",
                        fontSize: 10,
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#58a6ff"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: "#58a6ff", stroke: "#0d1117", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Record Holders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recordHolders.busiestDay && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="text-xs text-[#8b949e] mb-1">🔥 Busiest Day</div>
              <div className="text-lg font-bold text-white truncate">
                {recordHolders.busiestDay.agentName}
              </div>
              <div className="text-sm text-[#58a6ff]">
                {formatNum(recordHolders.busiestDay.tokens)} tokens
              </div>
              <div className="text-xs text-[#484f58] mt-1">
                {formatDate(recordHolders.busiestDay.date)}
              </div>
            </div>
          )}

          {bestStreak != null && bestStreak > 0 && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="text-xs text-[#8b949e] mb-1">⚡ Longest Streak</div>
              <div className="text-2xl font-bold text-[#f0883e]">{bestStreak} days</div>
              <div className="text-xs text-[#484f58] mt-1">Community best</div>
            </div>
          )}

          {recordHolders.mostDiverse && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="text-xs text-[#8b949e] mb-1">🛠 Tool Explorer</div>
              <div className="text-lg font-bold text-white truncate">
                {recordHolders.mostDiverse.agentName}
              </div>
              <div className="text-sm text-[#d2a8ff]">
                {recordHolders.mostDiverse.toolCount} different tools
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

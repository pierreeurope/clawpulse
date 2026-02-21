"use client";

interface MilestonesSectionProps {
  totalTokens: number;
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

export default function MilestonesSection({ totalTokens, recordHolders, bestStreak }: MilestonesSectionProps) {
  const milestones = [
    { value: 1_000_000, label: "1M" },
    { value: 10_000_000, label: "10M" },
    { value: 100_000_000, label: "100M" },
    { value: 1_000_000_000, label: "1B" },
    { value: 10_000_000_000, label: "10B" },
    { value: 100_000_000_000, label: "100B" },
    { value: 1_000_000_000_000, label: "1T" },
  ];

  const formatNum = (n: number) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  // Find current milestone and next
  const currentMilestone = milestones.filter((m) => totalTokens >= m.value).pop();
  const nextMilestone = milestones.find((m) => totalTokens < m.value);

  const progress = nextMilestone
    ? ((totalTokens / nextMilestone.value) * 100).toFixed(1)
    : 100;

  return (
    <section className="mb-10">
      <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
        <h3 className="text-xl font-bold text-white mb-1">🎯 Milestones & Records</h3>
        <p className="text-sm text-[#8b949e] mb-6">Community achievements and record holders</p>

        {/* Current Milestone */}
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
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-[#484f58]">
                {formatNum(totalTokens)} / {formatNum(nextMilestone.value)} tokens
              </div>
            </>
          )}

          {/* Milestone markers */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#30363d]">
            {milestones.map((m) => {
              const achieved = totalTokens >= m.value;
              return (
                <div
                  key={m.value}
                  className="flex flex-col items-center"
                  title={achieved ? `Achieved ${m.label}` : `Target: ${m.label}`}
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
                </div>
              );
            })}
          </div>
        </div>

        {/* Record Holders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Busiest Day */}
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
                {new Date(recordHolders.busiestDay.date).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Longest Streak */}
          {bestStreak && bestStreak > 0 && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="text-xs text-[#8b949e] mb-1">⚡ Longest Streak</div>
              <div className="text-2xl font-bold text-[#f0883e]">{bestStreak} days</div>
              <div className="text-xs text-[#484f58] mt-1">Community best</div>
            </div>
          )}

          {/* Most Diverse */}
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

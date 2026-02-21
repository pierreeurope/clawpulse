"use client";

interface EnhancedToolInsightsProps {
  tools: { [tool: string]: number };
  toolGrowth: { [tool: string]: number };
}

export default function EnhancedToolInsights({ tools, toolGrowth }: EnhancedToolInsightsProps) {
  const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  // Group tools by skill
  const skillGroups: { [skill: string]: string[] } = {
    Core: ["exec", "read", "write", "edit"],
    Web: ["web_search", "web_fetch"],
    Browser: ["browser"],
    Memory: ["memory_search", "memory_get", "memory_put"],
    Messaging: ["message"],
    Nodes: ["nodes"],
    Process: ["process"],
  };

  const groupedTools: { [skill: string]: { tool: string; count: number; growth: number }[] } = {};

  // Categorize tools
  for (const [tool, count] of Object.entries(tools)) {
    let assigned = false;
    for (const [skill, toolList] of Object.entries(skillGroups)) {
      if (toolList.includes(tool)) {
        if (!groupedTools[skill]) groupedTools[skill] = [];
        groupedTools[skill].push({
          tool,
          count,
          growth: toolGrowth[tool] || 0,
        });
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      if (!groupedTools["Other"]) groupedTools["Other"] = [];
      groupedTools["Other"].push({
        tool,
        count,
        growth: toolGrowth[tool] || 0,
      });
    }
  }

  // Sort within each group
  for (const skill in groupedTools) {
    groupedTools[skill].sort((a, b) => b.count - a.count);
  }

  // Find tool of the week (highest growth)
  const toolOfTheWeek = Object.entries(toolGrowth)
    .filter(([tool]) => tools[tool])
    .sort(([, a], [, b]) => b - a)[0];

  return (
    <section className="mb-10">
      <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
        <h3 className="text-xl font-bold text-white mb-1">🛠 Tool Insights</h3>
        <p className="text-sm text-[#8b949e] mb-6">Grouped by skill category with growth trends</p>

        {/* Tool of the Week */}
        {toolOfTheWeek && toolOfTheWeek[1] > 50 && (
          <div className="bg-gradient-to-r from-[#f0883e]/20 to-[#f85149]/20 border border-[#f0883e]/40 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏆</div>
              <div>
                <div className="text-sm text-[#f0883e] font-bold">Tool of the Week</div>
                <div className="text-lg text-white font-mono">{toolOfTheWeek[0]}</div>
                <div className="text-xs text-[#8b949e]">
                  +{toolOfTheWeek[1].toFixed(0)}% growth this week
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grouped Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(groupedTools)
            .sort(([, a], [, b]) => {
              const sumA = a.reduce((s, t) => s + t.count, 0);
              const sumB = b.reduce((s, t) => s + t.count, 0);
              return sumB - sumA;
            })
            .map(([skill, items]) => {
              const totalCount = items.reduce((sum, t) => sum + t.count, 0);
              const maxCount = items.length > 0 ? items[0].count : 1;

              return (
                <div key={skill} className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-white">{skill}</h4>
                    <span className="text-xs text-[#8b949e]">{formatNum(totalCount)} uses</span>
                  </div>

                  <div className="space-y-2">
                    {items.slice(0, 5).map((item) => {
                      const pct = (item.count / maxCount) * 100;
                      const isTrending = item.growth > 50;

                      return (
                        <div key={item.tool}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-[#e6edf3] font-mono flex-1 truncate">
                              {item.tool}
                            </span>
                            {isTrending && (
                              <span className="text-[10px] bg-[#f0883e]/20 text-[#f0883e] px-2 py-0.5 rounded-full">
                                Trending
                              </span>
                            )}
                            <span className="text-xs text-[#8b949e]">{formatNum(item.count)}</span>
                          </div>
                          <div className="h-1.5 bg-[#0d1117] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#58a6ff] transition-all"
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}

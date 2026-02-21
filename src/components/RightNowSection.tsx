"use client";

interface RightNowProps {
  activeAgents: number;
  lastSync: {
    agentName: string;
    tokenCount: number;
    timestamp: string;
  } | null;
  tokenBurnRate: number;
}

export default function RightNowSection({ activeAgents, lastSync, tokenBurnRate }: RightNowProps) {
  const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  const getTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <section className="mb-10">
      <div className="rounded-xl border border-[#238636]/40 bg-gradient-to-r from-[#0d1117] to-[#161b22] p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-[#3fb950] rounded-full animate-pulse" />
          <h3 className="text-xl font-bold text-white">Right Now</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Active Agents */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4">
            <div className="text-sm text-[#8b949e] mb-1">Active in last 24h</div>
            <div className="text-3xl font-bold text-[#3fb950]">{activeAgents}</div>
            <div className="text-xs text-[#484f58] mt-1">
              {activeAgents === 1 ? "agent" : "agents"} pushing stats
            </div>
          </div>

          {/* Last Sync */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4">
            <div className="text-sm text-[#8b949e] mb-1">Last sync</div>
            {lastSync ? (
              <>
                <div className="text-lg font-bold text-white truncate">{lastSync.agentName}</div>
                <div className="text-xs text-[#484f58] mt-1">
                  {formatNum(lastSync.tokenCount)} tokens · {getTimeAgo(lastSync.timestamp)}
                </div>
              </>
            ) : (
              <div className="text-sm text-[#484f58]">No recent activity</div>
            )}
          </div>

          {/* Token Burn Rate */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4">
            <div className="text-sm text-[#8b949e] mb-1">Token burn rate</div>
            <div className="text-3xl font-bold text-[#f0883e]">~{formatNum(tokenBurnRate)}</div>
            <div className="text-xs text-[#484f58] mt-1">tokens per day (7d avg)</div>
          </div>
        </div>
      </div>
    </section>
  );
}

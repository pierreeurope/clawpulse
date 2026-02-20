"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ClawPulseStats } from "@/types/stats";
import Dashboard from "@/components/Dashboard";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<ClawPulseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      if (status === "loading") return;
      
      if (status === "unauthenticated") {
        router.push("/");
        return;
      }

      try {
        const res = await fetch("/api/stats/me");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          const errorData = await res.json();
          setError(errorData.error || "Failed to load stats");
        }
      } catch (err) {
        setError("Failed to load stats");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [status, router]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-[#010409] flex items-center justify-center">
        <div className="text-[#8b949e] text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#010409] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">No Stats Yet</h1>
          <p className="text-[#8b949e] mb-6">{error}</p>
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-6 max-w-md mx-auto">
            <p className="text-sm text-[#8b949e] mb-4">Run this command to submit your stats:</p>
            <code className="block bg-[#010409] text-[#58a6ff] p-3 rounded text-sm">
              npx clawpulse push
            </code>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#010409] flex items-center justify-center">
        <div className="text-[#8b949e] text-lg">No stats found</div>
      </div>
    );
  }

  return <Dashboard stats={stats} />;
}

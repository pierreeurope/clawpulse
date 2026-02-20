"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ClawPulseStats } from "@/types/stats";
import Dashboard from "@/components/Dashboard";
import CommunityLanding from "@/components/CommunityLanding";

export default function Home() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<ClawPulseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (status === "loading") return;
      
      if (status === "authenticated") {
        try {
          const res = await fetch("/api/stats/me");
          if (res.ok) {
            const data = await res.json();
            setStats(data);
          }
        } catch (error) {
          console.error("Failed to load stats:", error);
        }
      }
      
      setLoading(false);
    }

    loadStats();
  }, [status]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-[#010409] flex items-center justify-center">
        <div className="text-[#8b949e] text-lg">Loading...</div>
      </div>
    );
  }

  // Show personal dashboard if authenticated and has stats
  if (session && stats) {
    return <Dashboard stats={stats} />;
  }

  // Show community landing page
  return <CommunityLanding />;
}

import { collect } from "./collect.js";
import { loadConfig, isAuthenticated } from "./config.js";

export async function push(options: any) {
  console.log("🚀 ClawPulse Push\n");

  if (!isAuthenticated()) {
    console.error("❌ Not authenticated!");
    console.log("\nPlease sign in first:");
    console.log("1. Visit https://clawpulse.vercel.app");
    console.log("2. Sign in with GitHub");
    console.log("3. Use the web interface to view your stats");
    console.log("\n💡 For now, stats must be submitted via the web interface.");
    console.log("   Full CLI push coming soon!");
    return;
  }

  // Collect stats
  const stats = await collect({ ...options, output: null });

  if (!stats) {
    console.error("❌ Failed to collect stats");
    return;
  }

  const config = loadConfig();

  try {
    console.log(`\n📤 Pushing to ${config.apiUrl}...`);
    
    const response = await fetch(`${config.apiUrl}/api/stats/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.githubToken}`,
      },
      body: JSON.stringify(stats),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to push stats");
    }

    const result = await response.json();
    console.log(`✅ ${result.message}`);
    console.log(`\n🌐 View your dashboard: ${config.apiUrl}/dashboard`);
  } catch (error: any) {
    console.error(`❌ Failed to push: ${error.message}`);
    console.log("\n💡 Try using the web interface at https://clawpulse.vercel.app");
  }
}

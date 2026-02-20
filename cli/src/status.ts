import { loadConfig, isAuthenticated } from "./config.js";

export async function status() {
  console.log("📊 ClawPulse Status\n");

  if (!isAuthenticated()) {
    console.log("❌ Not authenticated");
    console.log("\n🔗 Visit https://clawpulse.vercel.app to sign in");
    return;
  }

  const config = loadConfig();

  try {
    const response = await fetch(`${config.apiUrl}/api/stats/me`, {
      headers: {
        Authorization: `Bearer ${config.githubToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch stats");
    }

    const stats = await response.json();

    console.log(`👤 Agent: ${stats.agentName}`);
    console.log(`\n📈 Totals:`);
    console.log(`   Days active: ${stats.totals.days}`);
    console.log(`   Messages: ${stats.totals.messages.toLocaleString()}`);
    console.log(`   Tokens: ${stats.totals.tokens.toLocaleString()}`);
    console.log(`   Cost: $${stats.totals.cost.toFixed(2)}`);
    console.log(`   Current streak: ${stats.totals.streak} days`);
    console.log(`   Longest streak: ${stats.totals.longestStreak} days`);
    console.log(`\n🌐 Dashboard: ${config.apiUrl}/dashboard`);
  } catch (error: any) {
    console.error(`❌ Failed to fetch stats: ${error.message}`);
    console.log("\n💡 Visit https://clawpulse.vercel.app to view your stats");
  }
}

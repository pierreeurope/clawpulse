import { collect } from "./collect.js";
import { loadConfig, isAuthenticated } from "./config.js";

export async function push(options: any) {
  const silent = options?.silent || false;
  if (!silent) console.log("🚀 ClawPulse Push\n");

  if (!isAuthenticated()) {
    if (silent) return;
    console.error("❌ Not authenticated! Run: clawpulse setup");
    return;
  }

  // Collect stats
  const stats = await collect({ ...options, output: null, silent });

  if (!stats) {
    if (!silent) console.error("❌ Failed to collect stats");
    return;
  }

  const config = loadConfig();

  try {
    if (!silent) console.log(`📤 Pushing to ${config.apiUrl}...`);

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
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    if (!silent) {
      console.log(`✅ ${result.message}`);
      console.log(`\n🌐 Dashboard: ${config.apiUrl}/dashboard`);
    }
  } catch (error: any) {
    if (!silent) console.error(`❌ Failed to push: ${error.message}`);
  }
}

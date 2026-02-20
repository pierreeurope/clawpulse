import { login } from "./auth.js";
import { push } from "./push.js";
import { loadConfig, saveConfig } from "./config.js";

export async function setup() {
  console.log("⚡ ClawPulse Setup\n");
  console.log("This will:");
  console.log("  1. Sign you in with GitHub");
  console.log("  2. Collect and push your first stats\n");

  // Step 1: Login
  const config = loadConfig();
  if (config.githubToken && config.user) {
    console.log(`Already logged in as ${config.user.username}\n`);
  } else {
    const ok = await login();
    if (!ok) {
      console.error("\nSetup cancelled - login failed.");
      return;
    }
    console.log("");
  }

  // Step 2: First push
  console.log("─".repeat(40));
  await push({ silent: false });

  // Save setup completion
  const updatedConfig = loadConfig();
  (updatedConfig as any).setupComplete = true;
  (updatedConfig as any).setupDate = new Date().toISOString();
  saveConfig(updatedConfig);

  console.log("\n" + "─".repeat(40));
  console.log("\n🎉 Setup complete!");
  console.log("\n📊 Dashboard: https://clawpulse.vercel.app/dashboard");
  console.log("🌍 Community: https://clawpulse.vercel.app");
  console.log("\n📅 Auto-push: Ask your OpenClaw agent to set up ClawPulse auto-push,");
  console.log("   or install the clawpulse skill: clawhub install clawpulse");
  console.log("\n   Manual push anytime: clawpulse push");
}

// Keep for backwards compat but no-op now
export function uninstallCron(): boolean {
  // Remove any previously installed system cron
  try {
    const { execSync } = require("child_process");
    let existing = "";
    try {
      existing = execSync("crontab -l 2>/dev/null", { encoding: "utf-8" });
    } catch {
      console.log("No cron jobs found.");
      return true;
    }

    const tag = "# clawpulse-auto-push";
    if (!existing.includes(tag)) {
      console.log("No ClawPulse cron job found.");
      return true;
    }

    const lines = existing.split("\n").filter((l: string) => !l.includes(tag));
    execSync("crontab -", { input: lines.join("\n") + "\n", encoding: "utf-8" });
    console.log("✅ System cron removed. Use OpenClaw cron instead for auto-push.");
    return true;
  } catch (error: any) {
    console.error(`Failed: ${error.message}`);
    return false;
  }
}

import { execSync } from "child_process";
import * as os from "os";
import { login } from "./auth.js";
import { push } from "./push.js";
import { loadConfig, saveConfig } from "./config.js";
const CRON_TAG = "# clawpulse-auto-push";
function getClawpulseBin() {
    try {
        return execSync("which clawpulse", { encoding: "utf-8" }).trim();
    }
    catch {
        // Fallback to npx
        return "npx openclaw-pulse";
    }
}
function installCron(bin) {
    const platform = os.platform();
    if (platform === "darwin" || platform === "linux") {
        return installUnixCron(bin);
    }
    console.log("⚠️  Auto-push cron not supported on this platform.");
    console.log(`   Run manually: ${bin} push`);
    return false;
}
function installUnixCron(bin) {
    try {
        // Get existing crontab
        let existing = "";
        try {
            existing = execSync("crontab -l 2>/dev/null", { encoding: "utf-8" });
        }
        catch {
            // No crontab yet
        }
        // Check if already installed
        if (existing.includes(CRON_TAG)) {
            console.log("✅ Auto-push cron already installed");
            return true;
        }
        // Add two daily pushes: 8am and 10pm (in user's local time)
        const cronLine1 = `0 8 * * * ${bin} push --silent ${CRON_TAG}`;
        const cronLine2 = `0 22 * * * ${bin} push --silent ${CRON_TAG}`;
        const newCrontab = existing.trimEnd() + "\n" + cronLine1 + "\n" + cronLine2 + "\n";
        execSync("crontab -", { input: newCrontab, encoding: "utf-8" });
        console.log("✅ Auto-push cron installed (8:00 AM + 10:00 PM daily)");
        return true;
    }
    catch (error) {
        console.error(`⚠️  Failed to install cron: ${error.message}`);
        return false;
    }
}
export function uninstallCron() {
    try {
        let existing = "";
        try {
            existing = execSync("crontab -l 2>/dev/null", { encoding: "utf-8" });
        }
        catch {
            console.log("No crontab found.");
            return true;
        }
        if (!existing.includes(CRON_TAG)) {
            console.log("No ClawPulse cron job found.");
            return true;
        }
        const lines = existing.split("\n").filter((l) => !l.includes(CRON_TAG));
        execSync("crontab -", { input: lines.join("\n") + "\n", encoding: "utf-8" });
        console.log("✅ Auto-push cron removed");
        return true;
    }
    catch (error) {
        console.error(`Failed to remove cron: ${error.message}`);
        return false;
    }
}
export async function setup() {
    console.log("⚡ ClawPulse Setup\n");
    console.log("This will:");
    console.log("  1. Sign you in with GitHub");
    console.log("  2. Collect and push your first stats");
    console.log("  3. Set up auto-push (twice daily)\n");
    // Step 1: Login
    const config = loadConfig();
    if (config.githubToken && config.user) {
        console.log(`Already logged in as ${config.user.username}\n`);
    }
    else {
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
    // Step 3: Auto-push cron
    console.log("\n" + "─".repeat(40));
    console.log("📅 Setting up auto-push...\n");
    const bin = getClawpulseBin();
    installCron(bin);
    // Save setup completion
    const updatedConfig = loadConfig();
    updatedConfig.setupComplete = true;
    updatedConfig.setupDate = new Date().toISOString();
    saveConfig(updatedConfig);
    console.log("\n" + "─".repeat(40));
    console.log("\n🎉 All done! Your stats will auto-push at 8am and 10pm daily.");
    console.log("   Dashboard: https://clawpulse.vercel.app/dashboard");
    console.log("   Community: https://clawpulse.vercel.app");
    console.log("\n   To stop auto-push: clawpulse uninstall");
}

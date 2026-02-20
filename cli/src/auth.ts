import { loadConfig, saveConfig } from "./config.js";

export async function login() {
  console.log("🔐 ClawPulse Login");
  console.log("\nGitHub Device Flow Authentication:");
  console.log("This feature requires a GitHub OAuth app setup.");
  console.log("\nFor now, please:");
  console.log("1. Visit https://clawpulse.vercel.app");
  console.log("2. Sign in with GitHub");
  console.log("3. Use the web dashboard");
  console.log("\n💡 Full CLI auth coming soon!");
  
  // TODO: Implement GitHub Device Flow
  // For MVP, users can use the web interface
}

export async function logout() {
  const config = loadConfig();
  delete config.githubToken;
  delete config.user;
  saveConfig(config);
  console.log("✅ Logged out successfully");
}

import { loadConfig, saveConfig } from "./config.js";

const GITHUB_CLIENT_ID = "Ov23likc86h7Y7EjUNZE";

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

export async function login(): Promise<boolean> {
  console.log("🔐 ClawPulse Login\n");

  // Step 1: Request device code
  const codeRes = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      scope: "read:user",
    }),
  });

  if (!codeRes.ok) {
    console.error("❌ Failed to start GitHub auth flow");
    return false;
  }

  const codeData: DeviceCodeResponse = await codeRes.json();

  console.log("Open this URL in your browser:\n");
  console.log(`  👉  ${codeData.verification_uri}\n`);
  console.log(`Enter this code:  ${codeData.user_code}\n`);
  console.log("Waiting for authorization...");

  // Step 2: Poll for token
  const deadline = Date.now() + codeData.expires_in * 1000;
  const interval = (codeData.interval || 5) * 1000;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval));

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        device_code: codeData.device_code,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });

    const tokenData: TokenResponse = await tokenRes.json();

    if (tokenData.access_token) {
      // Get user info
      const userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const user = await userRes.json();

      const config = loadConfig();
      config.githubToken = tokenData.access_token;
      config.user = {
        id: String(user.id),
        username: user.login,
        avatar: user.avatar_url,
      };
      saveConfig(config);

      console.log(`\n✅ Logged in as ${user.login}`);
      return true;
    }

    if (tokenData.error === "authorization_pending") {
      continue;
    }

    if (tokenData.error === "slow_down") {
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }

    if (tokenData.error === "expired_token") {
      console.error("\n❌ Code expired. Please try again.");
      return false;
    }

    if (tokenData.error === "access_denied") {
      console.error("\n❌ Authorization denied.");
      return false;
    }

    console.error(`\n❌ Unexpected error: ${tokenData.error_description || tokenData.error}`);
    return false;
  }

  console.error("\n❌ Timed out waiting for authorization.");
  return false;
}

export async function logout() {
  const config = loadConfig();
  delete config.githubToken;
  delete config.user;
  saveConfig(config);
  console.log("✅ Logged out successfully");
}

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
const CONFIG_DIR = path.join(os.homedir(), ".clawpulse");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const DEFAULT_CONFIG = {
    apiUrl: "https://clawpulse.vercel.app",
};
export function loadConfig() {
    try {
        if (!fs.existsSync(CONFIG_FILE)) {
            return DEFAULT_CONFIG;
        }
        const data = fs.readFileSync(CONFIG_FILE, "utf-8");
        return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
    catch {
        return DEFAULT_CONFIG;
    }
}
export function saveConfig(config) {
    try {
        if (!fs.existsSync(CONFIG_DIR)) {
            fs.mkdirSync(CONFIG_DIR, { recursive: true });
        }
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    }
    catch (error) {
        console.error("Failed to save config:", error);
    }
}
export function isAuthenticated() {
    const config = loadConfig();
    return !!config.githubToken;
}

#!/usr/bin/env node

import { Command } from "commander";
import { collect } from "../src/collect.js";
import { login } from "../src/auth.js";
import { push } from "../src/push.js";
import { status } from "../src/status.js";
import { setup } from "../src/setup.js";
import { uninstallCron } from "../src/setup.js";

const program = new Command();

program
  .name("clawpulse")
  .description("⚡ ClawPulse — Community analytics for OpenClaw agents")
  .version("0.2.0");

program
  .command("setup")
  .description("One-command setup: login + push + auto-push cron")
  .action(async () => {
    await setup();
  });

program
  .command("collect")
  .description("Parse local OpenClaw session files and generate stats.json")
  .option("--sessions-dir <path>", "Sessions directory path")
  .option("--name <name>", "Agent name")
  .option("--output <path>", "Output file path", "stats.json")
  .action(async (options) => {
    await collect(options);
  });

program
  .command("login")
  .description("Authenticate with GitHub")
  .action(async () => {
    await login();
  });

program
  .command("push")
  .description("Collect stats and push to ClawPulse")
  .option("--sessions-dir <path>", "Sessions directory path")
  .option("--name <name>", "Agent name")
  .option("--silent", "Minimal output (for cron)")
  .action(async (options) => {
    await push(options);
  });

program
  .command("status")
  .description("Show your stats summary")
  .action(async () => {
    await status();
  });

program
  .command("uninstall")
  .description("Remove auto-push cron job")
  .action(() => {
    uninstallCron();
  });

program.parse();

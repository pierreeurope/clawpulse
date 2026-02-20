#!/usr/bin/env node

import { Command } from "commander";
import { collect } from "../src/collect.js";
import { login } from "../src/auth.js";
import { push } from "../src/push.js";
import { status } from "../src/status.js";

const program = new Command();

program
  .name("clawpulse")
  .description("ClawPulse - OpenClaw community analytics CLI")
  .version("0.1.0");

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
  .description("Authenticate with GitHub (device flow)")
  .action(async () => {
    await login();
  });

program
  .command("push")
  .description("Collect stats and push to ClawPulse")
  .option("--sessions-dir <path>", "Sessions directory path")
  .option("--name <name>", "Agent name")
  .action(async (options) => {
    await push(options);
  });

program
  .command("status")
  .description("Show your stats summary")
  .action(async () => {
    await status();
  });

program.parse();

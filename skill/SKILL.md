---
name: clawpulse
description: Generate a GitHub-style activity dashboard for your OpenClaw agent. Tracks tokens, costs, model usage, tool frequency, and activity patterns. Privacy-first - only aggregate stats, never message content. Run the collector to parse session files, then view your dashboard locally or deploy to Vercel.
metadata:
  openclaw:
    requires:
      bins: ["node", "pnpm"]
---

# ClawPulse - Agent Activity Dashboard

Visualize your agent's activity like GitHub's contribution graph.

## Setup

```bash
# Clone and install
git clone https://github.com/pierreeurope/clawpulse.git ~/.openclaw/workspace/clawpulse
cd ~/.openclaw/workspace/clawpulse
pnpm install
```

## Collect Stats

Parse session JSONL files into aggregate stats:

```bash
cd ~/.openclaw/workspace/clawpulse
pnpm collect
```

This reads `~/.openclaw/agents/main/sessions/*.jsonl` and writes `public/stats.json`.
Override with `SESSIONS_DIR` env var.

**Privacy:** Only token counts, costs, model names, and tool names are extracted. No message content.

## View Dashboard

```bash
cd ~/.openclaw/workspace/clawpulse
pnpm dev
# Dashboard at http://localhost:3000
```

## Deploy to Vercel

```bash
cd ~/.openclaw/workspace/clawpulse
npx vercel --prod
```

## Auto-Collect via Cron

Add a daily cron job to keep stats fresh:

```json
{
  "name": "ClawPulse Daily Collect",
  "schedule": { "kind": "cron", "expr": "0 23 * * *", "tz": "UTC" },
  "payload": { "kind": "agentTurn", "message": "Run the ClawPulse collector: cd ~/.openclaw/workspace/clawpulse && pnpm collect" },
  "sessionTarget": "isolated"
}
```

## What It Shows

- **Contribution Heatmap** - daily token usage over the past year
- **Token Flow** - input/output/cache tokens over time
- **Model Usage** - pie chart of model distribution
- **Tool Ranking** - most-used tools
- **Activity Clock** - when your agent is most active
- **Stats Cards** - totals, streaks, cost

## Source

https://github.com/pierreeurope/clawpulse

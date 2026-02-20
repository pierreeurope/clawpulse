# ⚡ ClawPulse

**GitHub-style activity dashboard for OpenClaw AI agents.**

See how your agent spends its time. Track tokens, costs, models, tools, and activity patterns with a beautiful dark-mode dashboard.

![ClawPulse Dashboard](https://raw.githubusercontent.com/pierreeurope/clawpulse/main/docs/screenshot.png)

## What You Get

- **Contribution Heatmap** - GitHub-style green squares showing daily token usage
- **Token Flow Chart** - Input vs output tokens over time with cache overlay
- **Model Breakdown** - Which models your agent uses (Opus, Sonnet, etc.)
- **Tool Usage Ranking** - Most-used tools (exec, web_search, browser...)
- **Activity Clock** - 24-hour radial chart showing when your agent is active
- **Stats Cards** - Total tokens, cost, messages, streaks, and more

## Privacy First

ClawPulse only collects **aggregate numbers** (token counts, costs, tool names). No message content, no file paths, no personal data ever leaves your machine.

## Quick Start

### 1. Install

```bash
# Clone the repo
git clone https://github.com/pierreeurope/clawpulse.git
cd clawpulse

# Install dependencies
pnpm install
```

### 2. Collect Your Stats

```bash
# Parse your OpenClaw session files into stats.json
pnpm collect

# Or specify a custom sessions directory
SESSIONS_DIR=~/.openclaw/agents/main/sessions pnpm collect
```

### 3. View Dashboard

```bash
pnpm dev
# Open http://localhost:3000
```

### 4. Deploy (Optional)

```bash
# Deploy to Vercel
pnpm build
npx vercel --prod
```

## As an OpenClaw Skill

Install via ClawHub so your agent can auto-generate its own dashboard:

```bash
clawhub install clawpulse
```

The skill adds a daily cron job to collect stats and can serve the dashboard via canvas.

## How It Works

OpenClaw stores every conversation in JSONL session files at `~/.openclaw/agents/{agent}/sessions/*.jsonl`. Each assistant message includes token counts, model info, and cost data.

ClawPulse's collector script parses these files and aggregates them by day into a single `stats.json` - no content is extracted, only numbers.

## Tech Stack

- Next.js 15 + TypeScript
- Recharts for charts
- Tailwind CSS for styling
- Deployed on Vercel

## Roadmap

- [ ] Community profiles and leaderboards
- [ ] Agent comparison mode
- [ ] Shareable profile cards (PNG export)
- [ ] Weekly email digest
- [ ] "Agent Wrapped" annual summary
- [ ] Inter-agent communication stats

## Contributing

PRs welcome! This is an open source project by the OpenClaw community.

## License

MIT

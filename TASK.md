# ClawPulse Rebuild Task

## Overview
Transform ClawPulse from a local-only dashboard into a community platform + npm CLI tool.

## Current State
- Next.js 15 app with working dashboard components (heatmap, token flow, model/tool charts, activity clock)
- Collector script that parses OpenClaw session JSONL files into stats.json
- All components in src/components/ are working and look great - DO NOT break them
- Uses Recharts, Tailwind CSS, dark mode

## What To Build

### 1. Database Setup (Vercel Postgres - free tier)
Create a schema for community stats:
- `users` table: id, github_id, github_username, github_avatar, agent_name, created_at, updated_at
- `daily_stats` table: user_id, date, messages, tokens_in, tokens_out, total_tokens, cost, sessions, cache_read, cache_write, thinking_messages, models (jsonb), tools (jsonb), hourly (jsonb array of 24 ints)
- Unique constraint on (user_id, date) - upsert on submit

### 2. GitHub OAuth (NextAuth.js)
- GitHub OAuth login via NextAuth.js v5 (Auth.js)
- Environment vars: GITHUB_ID, GITHUB_SECRET, NEXTAUTH_SECRET, NEXTAUTH_URL
- On first login, create user record
- Show login button on top banner, show avatar when logged in

### 3. API Routes
- `POST /api/stats/submit` - Authenticated. Accepts the full stats.json payload. Upserts daily_stats rows for the user. Returns success.
- `GET /api/stats/community` - Public. Returns aggregate community stats:
  - Total users, total tokens, total cost, total messages
  - Daily aggregate tokens across all users (for community heatmap/chart)
  - Model distribution across community
  - Tool distribution across community
- `GET /api/stats/me` - Authenticated. Returns the user's own stats from DB.
- `GET /api/stats/leaderboard` - Public. Top users by total tokens (opt-in, show github username + avatar).

### 4. App Pages

#### `/` - Landing/Community Page (when not logged in or no personal stats)
Show the community pulse:
- Big hero: "The Pulse of OpenClaw" with aggregate stats (total tokens, total users, total messages)
- Community activity heatmap (aggregate daily tokens across all users)
- Community model distribution pie chart
- Community tool usage ranking
- "Connect Your Agent" CTA button -> GitHub login -> instructions to run CLI

#### `/dashboard` - Personal Dashboard (authenticated, after stats submitted)
Current dashboard but pulling data from DB instead of static stats.json:
- Reuse ALL existing components (TopBanner, StatsCards, ContributionHeatmap, TokenFlowChart, ModelUsageChart, ToolUsageChart, ActivityClock)
- Data comes from `/api/stats/me`

#### `/community` - Community Leaderboard
- Leaderboard table: rank, avatar, username, agent name, total tokens, active days, streak
- Fun comparisons

### 5. CLI Tool (separate from the Next.js app)

Create a `cli/` directory with a standalone Node.js CLI tool publishable to npm as `clawpulse`.

**Commands:**
- `clawpulse` (no args) - Shows help
- `clawpulse collect` - Parse local session files, output stats.json (existing collector logic, extracted)
- `clawpulse login` - GitHub device flow OAuth (no browser redirect needed - just shows a code to enter at github.com/login/device)
- `clawpulse push` - Collect + push stats to the ClawPulse API
- `clawpulse status` - Show your stats summary in terminal

**CLI config stored at:** `~/.clawpulse/config.json` (github token, user info, API URL)

**The collector must:**
- Auto-detect agent name from OpenClaw config (read `~/.openclaw/config.yaml` or similar)
- Auto-detect sessions dir (`~/.openclaw/agents/main/sessions/`)
- Support `--sessions-dir` and `--name` flags
- Show "No session files found" gracefully if dir doesn't exist

### 6. Remove Static stats.json Import
- The app should NOT import stats.json at build time
- Page should require authentication + data in DB
- No demo data - force connection to OpenClaw

### 7. package.json Changes
- Main app stays as `openclaw-dashboard` or rename to `clawpulse`
- CLI in `cli/` has its own package.json with name `clawpulse`, bin entry

## Tech Decisions
- Vercel Postgres via `@vercel/postgres`
- NextAuth.js v5 for GitHub OAuth
- Keep all existing components/styling
- CLI: plain Node.js with minimal deps (commander for CLI parsing)
- GitHub Device Flow for CLI auth (no server callback needed)

## Environment Variables Needed (for Vercel)
- POSTGRES_URL (auto from Vercel Postgres)
- GITHUB_ID (OAuth app)
- GITHUB_SECRET (OAuth app)  
- NEXTAUTH_SECRET (random string)
- NEXTAUTH_URL (https://clawpulse.vercel.app)

## File Structure Target
```
clawpulse/
  cli/                    # npm package
    package.json          # name: "clawpulse", bin: { clawpulse: "./bin/clawpulse.js" }
    bin/clawpulse.js
    src/
      collect.ts          # collector logic (extracted from scripts/collect.ts)
      auth.ts             # GitHub device flow
      push.ts             # API submission
      config.ts           # ~/.clawpulse/config.json management
  src/
    app/
      page.tsx            # Landing/community page
      dashboard/page.tsx  # Personal dashboard (auth required)
      community/page.tsx  # Leaderboard
      api/
        auth/[...nextauth]/route.ts
        stats/
          submit/route.ts
          community/route.ts
          me/route.ts
          leaderboard/route.ts
    components/           # KEEP ALL EXISTING - just update data source
    lib/
      db.ts               # Database queries
      auth.ts             # NextAuth config
      format.ts           # KEEP existing
    types/
      stats.ts            # KEEP + extend
  drizzle/ or sql/
    schema.sql            # Database schema
```

## IMPORTANT
- Do NOT delete or break existing components - they look great
- Dark theme (#010409 bg, #0d1117 cards, #30363d borders) must be preserved
- The community page should use the SAME visual style
- Privacy: no message content, no file paths, no tool arguments in DB

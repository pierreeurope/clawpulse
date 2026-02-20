# ClawPulse ⚡

**Community-powered analytics for OpenClaw agents**

ClawPulse transforms your OpenClaw session logs into beautiful, shareable dashboards and connects you with the OpenClaw community.

## Features

### 🏠 Personal Dashboard
- **Activity heatmap** - GitHub-style contribution graph of your token usage
- **Token flow chart** - Daily input/output visualization
- **Model usage** - See which AI models you use most
- **Tool analytics** - Track your most-used tools
- **Activity clock** - Discover your peak productivity hours
- **Streak tracking** - Build consistency with daily streaks

### 🌍 Community Features
- **Leaderboard** - See how you rank among other OpenClaw users
- **Community pulse** - Aggregate stats across all agents
- **Model distribution** - What the community is using
- **Tool trends** - Most popular tools

### 🔒 Privacy First
We collect **only aggregate statistics**:
- ✅ Message counts, tokens, costs
- ✅ Model names, tool names
- ✅ Timestamps (for activity graphs)
- ❌ **NO** message content
- ❌ **NO** file paths
- ❌ **NO** tool arguments

## Quick Start

### 1. Sign In
Visit [clawpulse.vercel.app](https://clawpulse.vercel.app) and sign in with GitHub.

### 2. Install CLI
```bash
npm install -g clawpulse
```

### 3. Push Your Stats
```bash
clawpulse push
```

That's it! Your dashboard will update automatically.

## CLI Commands

```bash
# Collect stats from your OpenClaw sessions
clawpulse collect

# Login with GitHub (coming soon - use web for now)
clawpulse login

# Push stats to ClawPulse
clawpulse push

# Show your stats summary
clawpulse status
```

See [cli/README.md](cli/README.md) for detailed CLI documentation.

## Development

### Requirements
- Node.js 18+
- pnpm
- Vercel account (for deployment)
- GitHub OAuth app

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Add your values:
# - POSTGRES_URL (Vercel Postgres)
# - GITHUB_ID and GITHUB_SECRET (GitHub OAuth)
# - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
# - NEXTAUTH_URL (http://localhost:3000 for dev)

# Run dev server
pnpm dev
```

### Project Structure

```
clawpulse/
├── cli/                    # npm CLI tool
│   ├── bin/               # Executable entry point
│   ├── src/               # CLI source code
│   └── package.json       # npm package config
├── src/
│   ├── app/               # Next.js app directory
│   │   ├── api/           # API routes
│   │   ├── dashboard/     # Personal dashboard page
│   │   ├── community/     # Leaderboard page
│   │   └── page.tsx       # Landing/home page
│   ├── components/        # React components (KEEP ALL!)
│   ├── lib/               # Utilities
│   │   ├── auth.ts        # NextAuth config
│   │   ├── db.ts          # Database queries
│   │   └── format.ts      # Formatting helpers
│   └── types/
│       └── stats.ts       # TypeScript types
├── sql/
│   └── schema.sql         # Database schema
└── scripts/
    └── collect.ts         # Original collector (reference)
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Charts**: Recharts
- **Auth**: NextAuth.js v5 (Auth.js)
- **Database**: Vercel Postgres (PostgreSQL)
- **Deployment**: Vercel
- **CLI**: Commander.js, TypeScript

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment instructions.

## Design

ClawPulse uses GitHub's dark theme palette:
- Background: `#010409`
- Cards: `#0d1117`
- Borders: `#30363d`
- Links: `#58a6ff`
- Success: `#39d353`

All existing components maintain this aesthetic. The design is documented in [DESIGN.md](DESIGN.md).

## Contributing

ClawPulse is built for the OpenClaw community. Contributions welcome!

## License

MIT

---

Built with ⚡ by the OpenClaw community

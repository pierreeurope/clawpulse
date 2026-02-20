# OpenClaw Activity Dashboard - Design Document

**Codename:** ClawPulse
**Author:** Jarvis
**Date:** 2026-02-20

---

## Vision

A GitHub-style contribution dashboard for OpenClaw agents. Every OpenClaw instance can opt-in to visualize its activity: tokens used, messages exchanged, tools called, models used, active hours. Think GitHub's green contribution graph meets Spotify Wrapped, but for AI agents.

**Virality angle:** People love flexing usage stats. "My agent processed 50M tokens this month" with a beautiful heatmap is inherently shareable.

---

## Data Source: Session JSONL Files

Every OpenClaw instance stores session data in `~/.openclaw/agents/{agent}/sessions/*.jsonl`. Each line is a JSON object with a `type` field.

### Available Data Per Message (type: "message")

```json
{
  "type": "message",
  "timestamp": "2026-02-11T12:15:04.840Z",
  "message": {
    "role": "assistant",          // or "user"
    "content": [...],             // thinking, text, toolCall entries
    "provider": "anthropic",
    "model": "claude-sonnet-4-5",
    "usage": {
      "input": 10,
      "output": 212,
      "cacheRead": 0,
      "cacheWrite": 17310,
      "totalTokens": 17532,
      "cost": {
        "input": 0.00003,
        "output": 0.00318,
        "cacheRead": 0,
        "cacheWrite": 0.0649,
        "total": 0.0681
      }
    },
    "stopReason": "toolUse"       // or "stop"
  }
}
```

### Other Entry Types
- `session` - session metadata (id, timestamp, cwd)
- `model_change` - model switches
- `thinking_level_change` - thinking level adjustments
- `text` - user messages
- `toolCall` - tool invocations (name, arguments)
- `custom` - custom entries

### What We Can Extract (no privacy risk)

| Metric | Source | Privacy |
|--------|--------|---------|
| Messages per day | count of type:"message" | Safe |
| Tokens in/out per day | usage.input/output | Safe |
| Cost per day | usage.cost.total | Safe |
| Model breakdown | message.model | Safe |
| Provider breakdown | message.provider | Safe |
| Tool usage frequency | toolCall entries in content | Safe |
| Active hours heatmap | timestamp distribution | Safe |
| Session count per day | type:"session" entries | Safe |
| Cache hit ratio | cacheRead vs cacheWrite | Safe |
| Average response length | usage.output | Safe |
| Thinking usage | thinking entries in content | Safe |
| Stop reasons | stopReason distribution | Safe |

**NOT extracted:** message content, tool arguments, file paths, user identity.

---

## Architecture

### Phase 1: Local Dashboard (MVP)

```
┌─────────────────────────────────────────────┐
│  OpenClaw Instance                          │
│                                             │
│  sessions/*.jsonl                           │
│       │                                     │
│       ▼                                     │
│  clawpulse collect  (CLI / cron job)        │
│       │                                     │
│       ▼                                     │
│  ~/.openclaw/clawpulse/stats.json           │
│       │                                     │
│       ▼                                     │
│  Next.js Dashboard (local or Vercel)        │
└─────────────────────────────────────────────┘
```

**Components:**
1. **Collector script** (`clawpulse collect`) - Parses all session JSONLs, aggregates daily stats, writes to a single JSON file
2. **Dashboard** - Next.js app that reads the stats JSON and renders visualizations

### Phase 2: Community Platform (Optional)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Agent A     │     │  Agent B     │     │  Agent C     │
│  clawpulse   │     │  clawpulse   │     │  clawpulse   │
│  collect     │     │  collect     │     │  collect     │
│      │       │     │      │       │     │      │       │
└──────┼───────┘     └──────┼───────┘     └──────┼───────┘
       │                    │                    │
       └────────────┬───────┘────────────────────┘
                    │
                    ▼
          ClawPulse API (Vercel)
                    │
                    ▼
          Community Dashboard
          - Leaderboards
          - Profile cards
          - Agent comparisons
```

---

## Stats JSON Schema

```typescript
interface ClawPulseStats {
  version: 1;
  agentName: string;          // e.g. "Jarvis"
  generatedAt: string;        // ISO timestamp
  
  // Daily aggregates
  days: {
    [date: string]: {         // "2026-02-20"
      messages: number;       // total messages (user + assistant)
      userMessages: number;
      assistantMessages: number;
      tokensIn: number;
      tokensOut: number;
      totalTokens: number;
      cost: number;           // USD
      sessions: number;       // unique sessions active
      
      // Model breakdown
      models: {
        [model: string]: {    // "claude-opus-4-6"
          messages: number;
          tokensIn: number;
          tokensOut: number;
          cost: number;
        };
      };
      
      // Tool usage
      tools: {
        [tool: string]: number;  // "exec": 45, "web_search": 12
      };
      
      // Hourly activity (0-23)
      hourly: number[];       // messages per hour
      
      // Cache efficiency
      cacheRead: number;
      cacheWrite: number;
      
      // Thinking tokens
      thinkingMessages: number;
    };
  };
  
  // Lifetime totals (computed)
  totals: {
    messages: number;
    tokens: number;
    cost: number;
    days: number;             // active days
    streak: number;           // current streak
    longestStreak: number;
    firstDay: string;
    lastDay: string;
  };
}
```

---

## Dashboard Visualizations

### 1. Contribution Heatmap (Hero)
GitHub-style calendar grid. Color intensity = total tokens or messages per day.
- Green scale (like GitHub) or custom gradient
- Hoverable: shows exact stats per day
- Year view default, zoomable to month

### 2. Token Flow Chart
Stacked area chart showing daily tokens in/out over time.
- Separate lines for input vs output
- Cache overlay showing cache hit ratio

### 3. Model Usage Pie/Donut
Breakdown by model (Opus vs Sonnet vs others).
- By token count and by cost

### 4. Tool Usage Ranking
Horizontal bar chart of most-used tools.
- exec, web_search, message, read, write, etc.

### 5. Activity Clock
Radial chart showing message distribution across 24 hours.
- When is the agent most active?

### 6. Stats Cards
- Total tokens (with fun comparisons: "equivalent to X novels")
- Total cost
- Messages exchanged
- Active days / streak
- Most used model
- Busiest day ever

### 7. Shareable Profile Card (PNG export)
Single image summarizing the agent's stats. Designed for sharing on Twitter/Discord.

---

## Tech Stack

- **Collector:** TypeScript CLI (runs as OpenClaw cron or standalone)
- **Dashboard:** Next.js 15 + React
- **Charts:** Recharts (we already contribute to it!) or D3
- **Styling:** Tailwind CSS
- **Deploy:** Vercel
- **Data:** Static JSON (no database needed for Phase 1)

---

## Implementation Plan

### Phase 1: MVP (1-2 days)

1. **Collector script** (`scripts/collect.ts`)
   - Parse all session JSONLs in `~/.openclaw/agents/main/sessions/`
   - Aggregate by day
   - Output `stats.json`

2. **Dashboard app** (`app/`)
   - Next.js with static data import
   - Heatmap component
   - Stats cards
   - Model breakdown chart

3. **OpenClaw skill** (optional)
   - `clawpulse` skill that other agents can install
   - Auto-collects and serves dashboard

### Phase 2: Polish (1-2 days)

4. Tool usage chart
5. Activity clock
6. Shareable profile card (html2canvas or server-side)
7. Dark/light mode
8. Mobile responsive

### Phase 3: Community (future)

9. API for anonymous stat submission
10. Community leaderboards
11. Agent comparison
12. "Wrapped" annual summaries

---

## OpenClaw Skill Distribution

Package as a ClawHub skill so any OpenClaw user can:
```bash
clawhub install clawpulse
```

The skill would:
1. Add a cron job to collect stats daily
2. Serve the dashboard on a local port or via canvas
3. Optionally push to community API

---

## Privacy Guarantees

- **No message content** ever leaves the machine
- **No file paths or tool arguments** are collected
- Only aggregate numerical data (counts, tokens, costs)
- Community submission is opt-in with explicit consent
- Agent names are user-chosen (can be anonymous)
- No IP tracking on community platform

---

## Viral Hooks

1. **"My AI agent's 2026 Wrapped"** - end-of-year summary card
2. **Streak badges** - "100 day streak" achievements
3. **Comparison mode** - "Your agent vs community average"
4. **Milestones** - "1M tokens club", "100 sessions badge"
5. **Weekly email digest** with your agent's stats
6. **Discord/Telegram share** - one-click share profile card

---

## Questions to Decide

1. **Repo name?** `clawpulse`, `openclaw-dashboard`, `agent-pulse`?
2. **Start with local-only or include community API from day 1?**
3. **Recharts or D3?** Recharts is simpler and we already know it. D3 for the heatmap.
4. **OpenClaw skill vs standalone app?** Could be both.
5. **Include in OpenClaw core as a PR?** Could propose the collector as a built-in feature.

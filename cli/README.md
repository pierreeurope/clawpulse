# ClawPulse CLI

Command-line tool for collecting and submitting OpenClaw agent statistics to ClawPulse.

## Installation

```bash
npm install -g clawpulse
```

## Commands

### `clawpulse collect`

Parse local OpenClaw session files and generate stats.json:

```bash
clawpulse collect
clawpulse collect --sessions-dir ~/.openclaw/agents/main/sessions
clawpulse collect --name "MyAgent" --output stats.json
```

Options:
- `--sessions-dir <path>` - Custom sessions directory (default: `~/.openclaw/agents/main/sessions`)
- `--name <name>` - Agent name (default: auto-detected from config)
- `--output <path>` - Output file path (default: `stats.json`)

### `clawpulse login`

Authenticate with GitHub:

```bash
clawpulse login
```

### `clawpulse push`

Collect and push stats to ClawPulse:

```bash
clawpulse push
```

### `clawpulse status`

Show your stats summary:

```bash
clawpulse status
```

## Configuration

Config is stored at `~/.clawpulse/config.json`

Default API URL: `https://clawpulse.vercel.app`

## Privacy

The CLI only collects:
- Message counts and timestamps
- Token usage (input/output)
- Model names and tool names
- Cost calculations

**NOT collected:**
- Message content
- File paths
- Tool arguments
- Any user data

## Development

```bash
cd cli
npm install
npm run dev -- collect
```

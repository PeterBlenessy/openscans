# Claude Code Subscription Integration

**Status**: ❌ Not Implemented
**Category**: AI & Intelligence
**Priority**: Tier 1 — Should Implement
**Platform**: Desktop (Tauri) only — browser keeps existing BYOK mode

## Description

Allow users to leverage their existing **Claude Pro or Max subscription** for OpenScans' AI features (vertebral detection, radiology analysis) by communicating with a locally running Claude Code instance. This is the same approach used by [Zed](https://zed.dev/docs/ai/external-agents) and [NoteSage](https://github.com/PeterBlenessy/notesage) — the app talks to Claude Code, which handles authentication with the user's subscription credentials. No API key required.

### Three AI Modes

| Mode | Auth | Platform | Cost to User | How It Works |
|------|------|----------|-------------|-------------|
| **Claude Code** (new) | User's Pro/Max subscription | Desktop only | Included in subscription | App → Claude Agent SDK → Claude Code (local) |
| **BYOK** (existing) | User-provided API key | Browser + Desktop | Pay-per-token to provider | App → Anthropic/OpenAI/Gemini API directly |
| **Mock** (existing) | None | Browser + Desktop | Free | Offline mock detector |

## Architecture

### How It Works

The [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk-typescript) (`@anthropic-ai/claude-agent-sdk`) spawns Claude Code as a local subprocess. Claude Code authenticates using the user's subscription OAuth credentials (stored in `~/.claude/` from `claude login`). OpenScans sends prompts through this SDK, and Claude Code processes them using the subscription — no API key needed, no per-token billing.

```
┌──────────────────────────────────────────────┐
│  OpenScans Desktop (Tauri + React)            │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │  Node.js sidecar (Tauri sidecar)        │  │
│  │                                         │  │
│  │  Claude Agent SDK                       │  │
│  │  query({ prompt: "Analyze image..." })  │  │
│  └──────────────┬──────────────────────────┘  │
│                 │ stdio (JSON-RPC)             │
│                 ▼                              │
│  ┌─────────────────────────────────────────┐  │
│  │  Claude Code (local subprocess)         │  │
│  │  • Authenticated with user's Pro/Max    │  │
│  │  • Uses subscription, not API key       │  │
│  │  • Reads image via built-in Read tool   │  │
│  └──────────────┬──────────────────────────┘  │
│                 │ HTTPS (subscription auth)    │
└─────────────────┼─────────────────────────────┘
                  ▼
           api.anthropic.com
           (billed to user's subscription)
```

### Why This Pattern Is Allowed

In January 2026, Anthropic [blocked third-party tools from directly using OAuth tokens](https://venturebeat.com/technology/anthropic-cracks-down-on-unauthorized-claude-usage-by-third-party-harnesses/) from Claude subscriptions. Client fingerprinting rejects unauthorized clients. However, the Zed/NoteSage pattern is permitted because **Claude Code itself** makes the API calls — OpenScans just communicates with Claude Code via the official Agent SDK over stdio. This is explicitly supported by Anthropic.

### Why Desktop Only

The Claude Agent SDK requires Node.js and spawns local processes — it cannot run in a browser. This feature is available only in the Tauri desktop build. The browser build continues to offer BYOK (user-provided API keys) and mock detector modes, which are unchanged.

### Image Analysis Flow

Claude Code's built-in `Read` tool supports reading image files. The flow for analyzing a DICOM image:

1. OpenScans renders the current viewport to a temporary PNG file (using existing export infrastructure)
2. The Agent SDK sends a prompt: `"Read and analyze the medical image at /tmp/openscans/current.png..."`
3. Claude Code uses its `Read` tool to view the image (multimodal)
4. Claude returns structured analysis text
5. OpenScans parses the response and displays results / creates annotations
6. Temp file is cleaned up

## Benefits

- **No API key needed** — Users with a Claude Pro ($20/mo) or Max ($100-200/mo) subscription can use AI features at no additional cost
- **Familiar pattern** — Same approach as Zed and NoteSage; users who already have Claude Code installed are ready immediately
- **No server infrastructure** — Everything runs locally; no proxy, no backend, no user accounts
- **Privacy preserved** — Images are processed through the user's own Claude Code instance; OpenScans has no server involvement
- **BYOK preserved** — Users without a subscription can still use API keys in both browser and desktop
- **Subscription cost savings** — Pro/Max subscriptions include generous usage; per-token API billing can be significantly more expensive for heavy users

## Prerequisites for Users

1. **Claude Pro or Max subscription** at [claude.ai](https://claude.ai)
2. **Claude Code installed** — `npm install -g @anthropic-ai/claude-code` (or via Homebrew/installer)
3. **Logged in** — `claude login` (one-time, credentials stored in `~/.claude/`)

OpenScans will detect whether Claude Code is available and guide users through setup if needed.

## How It Differs from NoteSage

[NoteSage](https://github.com/PeterBlenessy/notesage) implements the same pattern but with broader scope:
- NoteSage uses **ACP (Agent Client Protocol)** to support multiple agent types (Claude Code, OpenAI Codex, GitHub Copilot, Gemini CLI)
- NoteSage's ACP integration lives in its **Rust backend** (`src-tauri/src/commands/acp.rs`) and spawns agents as subprocesses
- NoteSage handles full chat conversations, inline completions, and agent tasks through ACP

OpenScans simplifies this:
- **Claude Code only** — no need for the full ACP abstraction
- Uses the **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`) directly from a Node.js sidecar
- Focused on **single-turn vision requests** (analyze one image), not multi-turn chat

## Browser Fallback

When running in the browser (no Tauri):
- The Claude Code option is hidden from the settings UI
- BYOK mode (user-provided API keys) and mock detector remain fully functional
- A note explains: "Claude Code subscription mode is available in the desktop app"

## Future Extensions

- Detect Claude Code installation automatically and prompt setup
- Show subscription usage/quota if Claude Code exposes this
- Support additional subscription-based agents via ACP (if demand exists)
- Explore community WebSocket bridges to Claude Code for browser support (unofficial, experimental)

# Task: Implement Claude Code Subscription Integration

**Feature**: [Claude Code Subscription Integration](../../features/07-ai-intelligence/subscription-ai-anthropic.md)
**Priority**: Tier 1 — Should Implement
**Estimated Effort**: High (6-8 days)
**Dependencies**: None (builds alongside existing BYOK infrastructure)
**Platform**: Desktop (Tauri) only

## Overview

Integrate with a locally running Claude Code instance via the Claude Agent SDK so users can leverage their Claude Pro/Max subscription for AI features without API keys. This is the same pattern used by Zed and NoteSage. No ACP abstraction needed — we talk to Claude Code directly through the SDK's `query()` function.

## Key Technical Decision: Agent SDK, Not ACP

- **ACP** (Agent Client Protocol) is Zed's open standard for connecting any editor to any agent. NoteSage uses it to support Claude Code, Codex, Copilot, and Gemini agents.
- **Agent SDK** (`@anthropic-ai/claude-agent-sdk`) is Anthropic's official SDK that spawns and communicates with Claude Code directly over stdio/JSON-RPC.
- Since OpenScans only needs Claude Code, we use the **Agent SDK directly** — simpler, fewer dependencies, officially supported.

## Implementation Steps

---

### Step 1: Add Agent SDK as a Tauri Sidecar

The Agent SDK requires Node.js. In the Tauri desktop app, it runs as a **sidecar process** — a bundled Node.js script that Tauri spawns and communicates with via IPC.

#### 1a: Create the Sidecar Script

**File**: `src-tauri/sidecars/claude-bridge.mjs`

```javascript
import { query } from '@anthropic-ai/claude-agent-sdk'

// Listen for requests from Tauri via stdin
process.stdin.setEncoding('utf-8')
let buffer = ''

process.stdin.on('data', (chunk) => {
  buffer += chunk
  // Messages are newline-delimited JSON
  const lines = buffer.split('\n')
  buffer = lines.pop() // keep incomplete line in buffer
  for (const line of lines) {
    if (line.trim()) handleRequest(JSON.parse(line))
  }
})

async function handleRequest(request) {
  const { id, type, prompt, allowedTools } = request

  try {
    let result = ''

    for await (const message of query({
      prompt,
      options: {
        allowedTools: allowedTools || ['Read'],
        maxTurns: 3,
        systemPrompt: request.systemPrompt || undefined,
      },
    })) {
      // Collect text responses
      if (message.type === 'assistant') {
        for (const block of message.message?.content || []) {
          if (block.type === 'text') {
            result += block.text
          }
        }
      }
    }

    send({ id, status: 'ok', result })
  } catch (error) {
    send({ id, status: 'error', error: error.message })
  }
}

function send(message) {
  process.stdout.write(JSON.stringify(message) + '\n')
}

// Signal readiness
send({ type: 'ready' })
```

#### 1b: Install Agent SDK for Sidecar

**File**: `src-tauri/sidecars/package.json`

```json
{
  "name": "openscans-claude-bridge",
  "private": true,
  "type": "module",
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.2.81"
  }
}
```

Run `cd src-tauri/sidecars && npm install` during build.

#### 1c: Configure Tauri Sidecar

**File**: `src-tauri/tauri.conf.json`

Add the sidecar to the Tauri configuration so it's bundled with the app:

```json
{
  "bundle": {
    "externalBin": ["sidecars/claude-bridge"]
  }
}
```

Note: The sidecar requires Node.js on the user's system (same requirement as Claude Code itself).

---

### Step 2: Create Tauri Commands for Claude Code Communication

**File**: `src-tauri/src/commands/claude_code.rs`

Create Rust Tauri commands that spawn and manage the sidecar:

```rust
use tauri::api::process::{Command, CommandEvent};

#[tauri::command]
async fn claude_code_available() -> Result<bool, String> {
    // Check if Claude Code CLI is installed
    let output = Command::new("claude")
        .args(["--version"])
        .output()
        .map_err(|e| e.to_string())?;
    Ok(output.status.success())
}

#[tauri::command]
async fn claude_code_auth_status() -> Result<String, String> {
    // Check if user is logged in
    let output = Command::new("claude")
        .args(["auth", "status"])
        .output()
        .map_err(|e| e.to_string())?;
    // Parse output for auth status
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
async fn claude_code_query(
    prompt: String,
    system_prompt: Option<String>,
    allowed_tools: Vec<String>,
) -> Result<String, String> {
    // Send request to the sidecar bridge
    // ... spawn sidecar, send JSON, read response
}
```

---

### Step 3: Create Frontend Claude Code Service

**File**: `src/lib/ai/claudeCodeService.ts`

This service handles communication with the Tauri sidecar. It is only loaded in the desktop build.

```typescript
import { invoke } from '@tauri-apps/api/core'

interface ClaudeCodeStatus {
  installed: boolean
  authenticated: boolean
  version: string | null
}

export async function getClaudeCodeStatus(): Promise<ClaudeCodeStatus> {
  try {
    const installed = await invoke<boolean>('claude_code_available')
    if (!installed) return { installed: false, authenticated: false, version: null }

    const authStatus = await invoke<string>('claude_code_auth_status')
    const authenticated = authStatus.includes('authenticated')

    return { installed, authenticated, version: authStatus }
  } catch {
    return { installed: false, authenticated: false, version: null }
  }
}

export async function queryClaudeCode(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const result = await invoke<string>('claude_code_query', {
    prompt,
    systemPrompt,
    allowedTools: ['Read'],  // Only need Read for image analysis
  })
  return result
}
```

---

### Step 4: Create Claude Code Detector

**File**: `src/lib/ai/claudeCodeDetector.ts`

Implements the same detector interface as other providers but routes through Claude Code.

```typescript
import { queryClaudeCode } from './claudeCodeService'
import { writeTemporaryImage, cleanupTemporaryImage } from './tempImageManager'

const DETECTION_SYSTEM_PROMPT = `You are a medical imaging AI assistant specializing in vertebral body detection. You will be shown a medical image. Identify and label all visible vertebral bodies with their positions.`

const ANALYSIS_SYSTEM_PROMPT = `You are a medical imaging AI assistant. Analyze the provided medical image and describe your findings in a structured radiology report format.`

export class ClaudeCodeDetector {
  async detectVertebrae(instance: DicomInstance): Promise<Detection[]> {
    // 1. Render the image to a temp file
    const tempPath = await writeTemporaryImage(instance)

    try {
      // 2. Send prompt through Claude Code
      const response = await queryClaudeCode(
        `Read the medical image at ${tempPath} and identify all visible vertebral bodies. ` +
        `For each vertebra, provide: label (e.g., L1, L2, T12), ` +
        `approximate x,y position as percentage of image dimensions (0-100), ` +
        `and confidence score (0-1). ` +
        `Return ONLY a JSON array: [{"label":"L1","x":50,"y":30,"confidence":0.95}, ...]`,
        DETECTION_SYSTEM_PROMPT
      )

      // 3. Parse the JSON response
      return parseDetectionResponse(response)
    } finally {
      // 4. Clean up temp file
      await cleanupTemporaryImage(tempPath)
    }
  }

  async analyzeImage(instance: DicomInstance): Promise<string> {
    const tempPath = await writeTemporaryImage(instance)

    try {
      const response = await queryClaudeCode(
        `Read and analyze the medical image at ${tempPath}. ` +
        `Provide a structured radiology analysis including: ` +
        `findings, impression, and any notable observations.`,
        ANALYSIS_SYSTEM_PROMPT
      )
      return response
    } finally {
      await cleanupTemporaryImage(tempPath)
    }
  }
}
```

---

### Step 5: Create Temporary Image Manager

**File**: `src/lib/ai/tempImageManager.ts`

Manages writing viewport images to temp files for Claude Code to read.

```typescript
import { writeFile, removeFile } from '@tauri-apps/plugin-fs'
import { tempDir, join } from '@tauri-apps/api/path'

export async function writeTemporaryImage(instance: DicomInstance): Promise<string> {
  // Reuse existing image export infrastructure to render viewport to PNG
  const imageData = await renderInstanceToPng(instance)

  const tmpDir = await tempDir()
  const filePath = await join(tmpDir, `openscans-ai-${Date.now()}.png`)

  await writeFile(filePath, imageData)
  return filePath
}

export async function cleanupTemporaryImage(path: string): Promise<void> {
  try {
    await removeFile(path)
  } catch {
    // Ignore cleanup errors
  }
}
```

---

### Step 6: Update Settings Store and UI

**File**: `src/stores/settingsStore.ts`

```typescript
// Add to existing AI provider options:
aiProvider: 'claude' | 'gemini' | 'openai' | 'claude-code' | 'none'
//                                           ^^^^^^^^^^^^^ new option
```

**File**: `src/components/settings/SettingsPanel.tsx`

Add Claude Code as a provider option in the AI settings section:

```
┌─ AI Detection ──────────────────────────────────────────┐
│                                                          │
│  Provider:  [Claude Code (Subscription) ▾]               │
│                                                          │
│  ┌── Claude Code Status ──────────────────────────────┐  │
│  │  ✅ Claude Code installed (v2.1.x)                 │  │
│  │  ✅ Authenticated (Pro subscription)               │  │
│  │                                                    │  │
│  │  Uses your Claude Pro/Max subscription.            │  │
│  │  No API key needed.                                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Other providers:                                        │
│  • Claude (API Key) — current BYOK                       │
│  • OpenAI (API Key) — current BYOK                       │
│  • Gemini (API Key) — current BYOK                       │
│  • None (Mock Only) — offline                            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

When Claude Code is not installed or not authenticated, show setup guidance:

```
┌── Claude Code Setup ───────────────────────────────────┐
│  ❌ Claude Code not found                              │
│                                                        │
│  To use your Claude subscription:                      │
│  1. Install: npm install -g @anthropic-ai/claude-code  │
│  2. Log in: claude login                               │
│  3. Restart OpenScans                                  │
│                                                        │
│  Requires Claude Pro ($20/mo) or Max subscription.     │
└────────────────────────────────────────────────────────┘
```

---

### Step 7: Detect Platform and Conditionally Load

**File**: `src/lib/platform.ts`

```typescript
export function isTauriDesktop(): boolean {
  return '__TAURI__' in window
}
```

**File**: `src/hooks/useAiOperations.ts`

Update detector initialization to include Claude Code:

```typescript
import { isTauriDesktop } from '../lib/platform'

function initDetector(settings: Settings): Detector {
  switch (settings.aiProvider) {
    case 'claude-code':
      if (!isTauriDesktop()) {
        // Fallback: Claude Code not available in browser
        console.warn('Claude Code only available in desktop app')
        return new MockVertebralDetector()
      }
      return new ClaudeCodeDetector()

    case 'claude':
      return new ClaudeVisionDetector(settings.aiApiKey)
    case 'openai':
      return new OpenAIVisionDetector(settings.openaiApiKey)
    case 'gemini':
      return new GeminiVisionDetector(settings.geminiApiKey)
    default:
      return new MockVertebralDetector()
  }
}
```

---

### Step 8: Update AI Consent Flow

**File**: `src/components/settings/SettingsPanel.tsx`

The consent dialog for Claude Code mode should differ from BYOK:

**Claude Code consent:**
> "AI features will process images through your local Claude Code installation,
> which uses your Claude Pro/Max subscription. Images are read locally by Claude Code
> and sent to Anthropic's API using your subscription credentials.
> No API key is stored in OpenScans."

Key difference from BYOK: emphasize that it's the user's own subscription and their own local Claude Code, not a third-party API key.

---

### Step 9: Handle Claude Code Errors Gracefully

**File**: `src/lib/ai/claudeCodeDetector.ts`

Handle common failure modes:

```typescript
try {
  const result = await queryClaudeCode(prompt, systemPrompt)
  return parseResult(result)
} catch (error) {
  if (error.message.includes('not found') || error.message.includes('ENOENT')) {
    throw new Error(
      'Claude Code is not installed. Install it with: npm install -g @anthropic-ai/claude-code'
    )
  }
  if (error.message.includes('not authenticated') || error.message.includes('login')) {
    throw new Error(
      'Claude Code is not logged in. Run "claude login" in your terminal.'
    )
  }
  if (error.message.includes('rate limit') || error.message.includes('quota')) {
    throw new Error(
      'Claude subscription rate limit reached. Try again later or switch to API key mode.'
    )
  }
  throw error
}
```

---

### Step 10: Hide Claude Code Option in Browser Build

**File**: `src/components/settings/SettingsPanel.tsx`

```typescript
const providerOptions = [
  // Only show Claude Code in desktop app
  ...(isTauriDesktop() ? [{ value: 'claude-code', label: 'Claude Code (Subscription)' }] : []),
  { value: 'claude', label: 'Claude (API Key)' },
  { value: 'openai', label: 'OpenAI (API Key)' },
  { value: 'gemini', label: 'Gemini (API Key)' },
  { value: 'none', label: 'None (Mock Only)' },
]
```

---

### Step 11: Add Tests

**File**: `src/lib/ai/__tests__/claudeCodeDetector.test.ts`

1. Test detection prompt formatting
2. Test response parsing (valid JSON, malformed JSON)
3. Test error handling (not installed, not authenticated, rate limited)
4. Test temp file creation and cleanup

**File**: `src/lib/ai/__tests__/claudeCodeService.test.ts`

1. Test `getClaudeCodeStatus()` — installed, not installed, authenticated, not authenticated
2. Test `queryClaudeCode()` with mock Tauri invoke
3. Test timeout handling

**File**: `src/lib/ai/__tests__/tempImageManager.test.ts`

1. Test temp file write
2. Test cleanup on success and failure
3. Test unique filename generation

---

## File Summary

### New Files

| File | Purpose |
|------|---------|
| `src-tauri/sidecars/claude-bridge.mjs` | Node.js sidecar running Agent SDK |
| `src-tauri/sidecars/package.json` | Sidecar dependencies |
| `src-tauri/src/commands/claude_code.rs` | Tauri commands for Claude Code IPC |
| `src/lib/ai/claudeCodeService.ts` | Frontend ↔ Tauri sidecar communication |
| `src/lib/ai/claudeCodeDetector.ts` | Detector implementation via Claude Code |
| `src/lib/ai/tempImageManager.ts` | Temp file management for image analysis |

### Modified Files

| File | Change |
|------|--------|
| `src/stores/settingsStore.ts` | Add `'claude-code'` provider option |
| `src/hooks/useAiOperations.ts` | Route to Claude Code detector when selected |
| `src/components/settings/SettingsPanel.tsx` | Claude Code provider UI, status display, setup guidance |
| `src-tauri/tauri.conf.json` | Register sidecar binary |
| `src-tauri/Cargo.toml` | Add sidecar process management (if not already present) |

### Unchanged Files

| File | Why |
|------|-----|
| `src/lib/ai/claudeVisionDetector.ts` | BYOK mode unchanged |
| `src/lib/ai/openaiVisionDetector.ts` | BYOK mode unchanged |
| `src/lib/ai/geminiVisionDetector.ts` | BYOK mode unchanged |
| `src/lib/ai/mockVertebralDetector.ts` | Offline fallback unchanged |

---

## Acceptance Criteria

- [ ] Users can select "Claude Code (Subscription)" as an AI provider in settings
- [ ] When selected, OpenScans detects Claude Code installation and auth status
- [ ] Setup guidance shown when Claude Code is not installed or not authenticated
- [ ] AI detection and analysis work through Claude Code using the user's subscription
- [ ] Temp images are created, read by Claude Code, and cleaned up
- [ ] Error messages are clear for: not installed, not logged in, rate limited
- [ ] Claude Code option is hidden in browser builds
- [ ] BYOK mode continues to work exactly as before (no regression)
- [ ] Mock detector works offline regardless of Claude Code status
- [ ] No API keys stored for Claude Code mode — subscription credentials managed by Claude Code itself

---

## Dependency Graph

```
Step 1: Sidecar (Agent SDK bridge)
    ↓
Step 2: Tauri commands (Rust IPC)
    ↓
Step 3: Frontend service (invoke wrapper)
    ↓
Step 4: Claude Code detector (implements existing interface)
Step 5: Temp image manager
    ↓
Step 6: Settings store + UI
Step 7: Platform detection + conditional loading
Step 8: Consent flow update
Step 9: Error handling
Step 10: Browser build exclusion
    ↓
Step 11: Tests
```

Steps 1-3 (backend) and steps 5-10 (frontend) can be developed in parallel.

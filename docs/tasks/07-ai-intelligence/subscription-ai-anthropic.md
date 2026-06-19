# Task: Implement Claude Code Subscription Integration

**Feature**: [Claude Code Subscription Integration](../../features/07-ai-intelligence/subscription-ai-anthropic.md)
**Priority**: Tier 1 — Should Implement
**Estimated Effort**: High (6-8 days)
**Dependencies**: None (builds alongside existing BYOK infrastructure)
**Platform**: Desktop (Tauri v2) only

> **Verify against current code first (post-2026-06 security work).** This task predates the security hardening and the original draft referenced APIs/files that no longer match the codebase. Before implementing, confirm against the *current* AI architecture:
> - **Cloud AI is desktop-only**, gated by `isTauri()` in `src/lib/utils/platform.ts` (NOT an invented `src/lib/platform.ts` `isTauriDesktop()`). The desktop gate already lives in `src/hooks/useAiOperations.ts`.
> - **Every image send goes through a per-send consent dialog**: `confirmAiSend(provider)` in `src/lib/ai/ai-send-confirm.ts` (backed by `src/components/viewer/AiSendConfirmDialog.tsx`). The hook awaits this before any pixel data leaves the device. Do NOT re-specify a new consent UI — reuse `confirmAiSend`.
> - **API keys live in the OS keychain** via Rust `store_credential` / `get_credential` / `delete_credential` (`src-tauri/src/lib.rs`) and the `src/lib/utils/credentials.ts` wrappers — never localStorage. Claude Code mode stores no key (the subscription is managed by Claude Code itself), so it does not touch this path, but BYOK still does.
> - The app is **Tauri v2** (`tauri = 2.x`) and already depends on **`tauri-plugin-shell`** (registered in `src-tauri/src/lib.rs`). Sidecars/external processes go through the v2 shell API, NOT the removed Tauri v1 `tauri::api::process` module.
> - Detectors are lazy-loaded through `src/lib/ai/aiDetectorManager.ts` and implement the `VisionDetector` interface in `src/lib/ai/types.ts` (`setApiKey`, `isConfigured`, `detectVertebrae`, `analyzeImage`). A Claude Code detector must implement the same interface to slot in.

## Overview

Integrate with a locally running Claude Code instance via the Claude Agent SDK so users can leverage their Claude Pro/Max subscription for AI features without API keys. This is the same pattern used by Zed and NoteSage. No ACP abstraction needed — we talk to Claude Code directly through the SDK's `query()` function.

## Key Technical Decision: Agent SDK, Not ACP

- **ACP** (Agent Client Protocol) is Zed's open standard for connecting any editor to any agent. NoteSage uses it to support Claude Code, Codex, Copilot, and Gemini agents.
- **Agent SDK** (`@anthropic-ai/claude-agent-sdk`) is Anthropic's official SDK that spawns and communicates with Claude Code directly over stdio/JSON-RPC.
- Since OpenScans only needs Claude Code, we use the **Agent SDK directly** — simpler, fewer dependencies, officially supported.

## PHI-at-rest concern (must resolve before shipping)

> ⚠️ **The temp-PNG hand-off conflicts with the project's "no PHI at rest" / privacy-first posture.** The original design rendered the patient image to a temp PNG on disk so Claude Code could `Read` it (Steps 4–5 below). Writing decoded DICOM pixel data — Protected Health Information — to a temp file, even briefly, means PHI lands on disk. This is exactly what the client-side-only / no-PHI-at-rest principle (see `CLAUDE.md` → "Privacy First") is meant to prevent.
>
> **Preferred:** an in-memory hand-off — pass the rendered image to the Agent SDK as inline base64 image content (the SDK / Claude Code multimodal content blocks) rather than a file the `Read` tool opens from disk. This keeps the image in process memory only, consistent with how the existing BYOK detectors (`claudeVisionDetector.ts`, etc.) already send base64 to the cloud APIs with no disk write.
>
> **If a file is genuinely unavoidable** (e.g. the installed Claude Code version can only ingest images via the `Read` tool on a path): scope writes to a single app-owned, restrictively-permissioned temp subdirectory, write with owner-only permissions, and **guarantee cleanup** via `try/finally` AND a best-effort sweep of the directory on app start/exit. Surface this disk write in the `confirmAiSend` consent copy so the user knows a temp file is created. Treat the in-memory path as the target and the temp file as a documented fallback, not the default.

## Implementation Steps

---

### Step 1: Add the Agent SDK as a Tauri v2 Sidecar

The Agent SDK requires Node.js. In the Tauri **v2** desktop app it runs as a **sidecar process** — a bundled script Tauri spawns and communicates with over stdio via `tauri-plugin-shell` (already a dependency).

#### 1a: Create the Sidecar Script

**File**: `src-tauri/sidecars/claude-bridge.mjs`

```javascript
import { query } from '@anthropic-ai/claude-agent-sdk'

// Newline-delimited JSON requests arrive on stdin.
process.stdin.setEncoding('utf-8')
let buffer = ''

process.stdin.on('data', (chunk) => {
  buffer += chunk
  const lines = buffer.split('\n')
  buffer = lines.pop() // keep incomplete line buffered
  for (const line of lines) {
    if (line.trim()) handleRequest(JSON.parse(line))
  }
})

async function handleRequest(request) {
  const { id, prompt, allowedTools, systemPrompt, imageBase64 } = request
  try {
    let result = ''
    // Prefer passing the image as inline multimodal content (in-memory, no
    // temp file) — see the PHI-at-rest note above. Fall back to a Read-tool
    // path only if the installed SDK/Claude Code cannot ingest inline images.
    for await (const message of query({
      prompt,
      options: {
        allowedTools: allowedTools || [],
        maxTurns: 3,
        systemPrompt: systemPrompt || undefined,
      },
    })) {
      if (message.type === 'assistant') {
        for (const block of message.message?.content || []) {
          if (block.type === 'text') result += block.text
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

send({ type: 'ready' })
```

> The exact shape of inline image content (and whether `allowedTools` needs `Read`) depends on the installed `@anthropic-ai/claude-agent-sdk` version — verify against the SDK's current multimodal content API at implementation time. If inline images are not supported, fall back to the scoped-temp-file approach described in the PHI note.

#### 1b: Install the Agent SDK for the sidecar

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

Run `cd src-tauri/sidecars && npm install` (or bundle a prebuilt copy) during the build.

#### 1c: Register the sidecar and grant the shell capability (Tauri v2)

**File**: `src-tauri/tauri.conf.json`

Register the binary under `bundle.externalBin`:

```json
{
  "bundle": {
    "externalBin": ["sidecars/claude-bridge"]
  }
}
```

**File**: `src-tauri/capabilities/default.json` (Tauri v2 capabilities/ACL)

Tauri v2 gates sidecar execution behind the shell plugin's permission set. Grant a scoped `shell:allow-execute` (or the sidecar-specific permission) for the `claude-bridge` sidecar only — do not grant blanket shell access:

```json
{
  "permissions": [
    {
      "identifier": "shell:allow-execute",
      "allow": [{ "name": "sidecars/claude-bridge", "sidecar": true }]
    }
  ]
}
```

> Verify the exact permission identifier against the installed `tauri-plugin-shell` version's ACL schema. The principle is: scope the capability to the single sidecar, mirroring how the CSP `connect-src` is already scoped to the three known AI endpoints.
>
> Note: the sidecar requires Node.js on the user's machine — the same requirement as Claude Code itself.

---

### Step 2: Spawn and Drive the Sidecar (Tauri v2)

The sidecar can be driven either from Rust (a `#[tauri::command]` that owns the child process) or directly from the frontend via the `@tauri-apps/plugin-shell` JS API. Both are valid in Tauri v2. Pick ONE and keep the process lifecycle in a single place.

**Tauri v2 — Rust side** (replaces the removed v1 `tauri::api::process`):

```rust
// Tauri v2: use the tauri-plugin-shell sidecar API, NOT tauri::api::process.
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;

#[tauri::command]
async fn claude_code_query(
    app: tauri::AppHandle,
    request_json: String, // newline-free JSON request for the bridge
) -> Result<String, String> {
    let sidecar = app
        .shell()
        .sidecar("claude-bridge")
        .map_err(|e| e.to_string())?;

    let (mut rx, mut child) = sidecar.spawn().map_err(|e| e.to_string())?;

    child
        .write(format!("{request_json}\n").as_bytes())
        .map_err(|e| e.to_string())?;

    let mut response = String::new();
    while let Some(event) = rx.recv().await {
        if let CommandEvent::Stdout(line) = event {
            response.push_str(&String::from_utf8_lossy(&line));
            if response.contains('\n') {
                break; // one newline-delimited JSON response
            }
        }
    }
    Ok(response)
}
```

> Detecting whether Claude Code is installed/authenticated can likewise go through the shell API (`app.shell().command("claude").args(["--version"])`) or be inferred from the SDK's own error on first `query()`. Avoid the v1 `Command::new(...).output()` pattern from the old draft — that API does not exist in Tauri v2.

---

### Step 3: Frontend Claude Code Service

**File**: `src/lib/ai/claudeCodeService.ts`

Communicates with the sidecar (via the Rust command from Step 2 or directly via `@tauri-apps/plugin-shell`). Desktop-only; never imported on the web path.

```typescript
import { invoke } from '@tauri-apps/api/core'
import { isTauri } from '@/lib/utils/platform'

interface ClaudeCodeStatus {
  installed: boolean
  authenticated: boolean
  version: string | null
}

export async function getClaudeCodeStatus(): Promise<ClaudeCodeStatus> {
  if (!isTauri()) return { installed: false, authenticated: false, version: null }
  try {
    return await invoke<ClaudeCodeStatus>('claude_code_status')
  } catch {
    return { installed: false, authenticated: false, version: null }
  }
}

export async function queryClaudeCode(payload: {
  prompt: string
  systemPrompt?: string
  imageBase64?: string
}): Promise<string> {
  return invoke<string>('claude_code_query', {
    requestJson: JSON.stringify({ id: crypto.randomUUID(), ...payload }),
  })
}
```

---

### Step 4: Claude Code Detector

**File**: `src/lib/ai/claudeCodeDetector.ts`

Implements the existing `VisionDetector` interface (`src/lib/ai/types.ts`) so it slots into `aiDetectorManager.ts` exactly like the BYOK detectors. For Claude Code mode `setApiKey` is a no-op and `isConfigured()` reflects Claude Code install + auth status.

```typescript
import { VisionDetector, DetectionResult, AnalysisResult } from './types'
import { DicomInstance } from '@/types'
import { queryClaudeCode, getClaudeCodeStatus } from './claudeCodeService'
import { dicomInstanceToPngBase64 } from './dicomImageUtils' // reuse existing render path

const DETECTION_SYSTEM_PROMPT = `You are a medical imaging AI assistant specializing in vertebral body detection...`
const ANALYSIS_SYSTEM_PROMPT = `You are a medical imaging AI assistant. Analyze the provided medical image...`

class ClaudeCodeDetector implements VisionDetector {
  private ready = false

  setApiKey(): void { /* no-op: Claude Code owns the subscription credential */ }

  isConfigured(): boolean { return this.ready }

  async refreshStatus(): Promise<void> {
    const s = await getClaudeCodeStatus()
    this.ready = s.installed && s.authenticated
  }

  async detectVertebrae(instance: DicomInstance): Promise<DetectionResult> {
    // In-memory base64 hand-off — no temp PNG on disk (see PHI note).
    const imageBase64 = await dicomInstanceToPngBase64(instance)
    const response = await queryClaudeCode({
      prompt: 'Identify all visible vertebral bodies. Return ONLY a JSON array: ' +
              '[{"label":"L1","x":50,"y":30,"confidence":0.95}, ...]',
      systemPrompt: DETECTION_SYSTEM_PROMPT,
      imageBase64,
    })
    return parseDetectionResponse(response, instance)
  }

  async analyzeImage(instance: DicomInstance): Promise<AnalysisResult> {
    const imageBase64 = await dicomInstanceToPngBase64(instance)
    const response = await queryClaudeCode({
      prompt: 'Analyze this medical image. Provide findings, impression, and notable observations.',
      systemPrompt: ANALYSIS_SYSTEM_PROMPT,
      imageBase64,
    })
    return parseAnalysisResponse(response)
  }
}

export const claudeCodeDetector = new ClaudeCodeDetector()
```

> Reuse the existing DICOM→image render utility (`src/lib/ai/dicomImageUtils.ts`) that the BYOK detectors already use — do NOT introduce a separate temp-file image manager unless the temp-file fallback is required (PHI note).

---

### Step 5: Wire the Detector into the Manager and Settings

**File**: `src/lib/ai/aiDetectorManager.ts`

Add a `'claude-code'` case to `getDetector()`, lazy-loading `claudeCodeDetector` the same way the other providers are loaded.

**File**: `src/stores/settingsStore.ts`

Extend the `AIProvider` union with `'claude-code'`. Claude Code mode carries no API key, so `getApiKeyForProvider` returns `''` for it (and `initDetector` skips `setApiKey`).

**File**: `src/hooks/useAiOperations.ts`

No new desktop gate or consent gate is needed — the hook ALREADY:
- short-circuits cloud AI on the web via `if (!isTauri())`, and
- awaits `confirmAiSend(providerDisplayName(provider))` before any cloud detector runs.

Just ensure `providerDisplayName` has a `'claude-code'` label and that the existing `usingCloudDetector` egress-consent branch treats Claude Code as a cloud send (because the image ultimately reaches `api.anthropic.com` through the user's subscription). Reuse the existing `confirmAiSend` flow verbatim — do not add a second consent dialog.

---

### Step 6: Settings UI — provider option + status/setup guidance

**File**: `src/components/settings/SettingsPanel.tsx`

- Add "Claude Code (Subscription)" to the provider list, shown ONLY on desktop (`isTauri()`), mirroring how the desktop-only nature of cloud AI is already handled.
- Show install/auth status from `getClaudeCodeStatus()` and setup guidance when Claude Code is missing or not logged in:

```
Claude Code not found — to use your Claude subscription:
  1. Install: npm install -g @anthropic-ai/claude-code
  2. Log in:  claude login
  3. Restart OpenScans
Requires Claude Pro or Max subscription.
```

The per-send egress acknowledgement is handled by the existing `AiSendConfirmDialog` / `confirmAiSend` — the settings panel does NOT need its own consent toggle for Claude Code.

---

### Step 7: Error Handling

**File**: `src/lib/ai/claudeCodeDetector.ts` (or shared `errorHandler.ts`)

Map common failures to clear messages: not installed (`ENOENT` / "not found"), not authenticated ("login"), and subscription rate limit / quota. Surface them through the existing AI error path (`handleError` in the hook) so the UX matches the other detectors.

---

### Step 8: Tests

**Files**: `src/lib/ai/__tests__/claudeCodeDetector.test.ts`, `claudeCodeService.test.ts`

1. Detection/analysis prompt formatting and response parsing (valid + malformed JSON).
2. Error mapping (not installed / not authenticated / rate limited).
3. `getClaudeCodeStatus()` across install/auth permutations (mock the Tauri `invoke`, as the existing AI tests already do — see `useAiOperations.test.ts`).
4. **PHI guard:** assert the in-memory base64 path performs NO disk write; if the temp-file fallback is implemented, assert the file is created in the scoped dir and removed in `finally` on both success and error.

---

## File Summary

### New Files

| File | Purpose |
|------|---------|
| `src-tauri/sidecars/claude-bridge.mjs` | Node.js sidecar running the Agent SDK |
| `src-tauri/sidecars/package.json` | Sidecar dependencies |
| `src/lib/ai/claudeCodeService.ts` | Frontend ↔ sidecar communication (via Rust command / plugin-shell) |
| `src/lib/ai/claudeCodeDetector.ts` | `VisionDetector` implementation via Claude Code |

### Modified Files

| File | Change |
|------|--------|
| `src/stores/settingsStore.ts` | Add `'claude-code'` to the `AIProvider` union |
| `src/lib/ai/aiDetectorManager.ts` | Lazy-load the Claude Code detector |
| `src/hooks/useAiOperations.ts` | Add `'claude-code'` to `providerDisplayName`; confirm it flows through the existing `isTauri()` gate + `confirmAiSend` egress consent |
| `src/components/settings/SettingsPanel.tsx` | Desktop-only Claude Code provider option, status display, setup guidance |
| `src-tauri/src/lib.rs` | Register `claude_code_query` / `claude_code_status` commands in `generate_handler!` |
| `src-tauri/tauri.conf.json` | Register the sidecar under `bundle.externalBin` |
| `src-tauri/capabilities/default.json` | Scoped shell permission for the `claude-bridge` sidecar |

### Unchanged Files

| File | Why |
|------|-----|
| `src/lib/ai/claudeVisionDetector.ts` | BYOK mode unchanged |
| `src/lib/ai/openaiVisionDetector.ts` | BYOK mode unchanged |
| `src/lib/ai/geminiVisionDetector.ts` | BYOK mode unchanged |
| `src/lib/ai/mockVertebralDetector.ts` | Offline fallback unchanged |
| `src/lib/ai/ai-send-confirm.ts` / `AiSendConfirmDialog.tsx` | Existing per-send consent reused as-is |
| `src/lib/utils/credentials.ts` | Keychain BYOK storage untouched (Claude Code stores no key) |

---

## Acceptance Criteria

- [ ] Users can select "Claude Code (Subscription)" as an AI provider in settings (desktop only).
- [ ] When selected, OpenScans reports Claude Code install + auth status and shows setup guidance when missing.
- [ ] AI detection and analysis work through Claude Code using the user's subscription.
- [ ] The image hand-off is **in-memory (base64)** with no PHI written to disk; if a temp file is unavoidable, it is in a scoped, owner-only dir and is always cleaned up (verified by test).
- [ ] Claude Code sends go through the EXISTING desktop gate (`isTauri()`) and the EXISTING per-send `confirmAiSend` egress consent — no new gate or consent dialog is added.
- [ ] Error messages are clear for: not installed, not logged in, rate limited.
- [ ] Claude Code option is hidden in browser builds; BYOK + mock continue to work unchanged.
- [ ] No API key is stored for Claude Code mode — credentials are managed by Claude Code itself; BYOK keychain storage is unaffected.
- [ ] Uses Tauri v2 APIs only (`tauri-plugin-shell` sidecar API + capabilities/ACL); no Tauri v1 `tauri::api::process` usage.

---

## Implementation Order

```
Step 1: Sidecar (Agent SDK bridge) + v2 externalBin + scoped shell capability
    ↓
Step 2: Spawn/drive sidecar (Rust command via plugin-shell, or plugin-shell JS)
    ↓
Step 3: Frontend service (invoke wrapper)
    ↓
Step 4: Claude Code detector (implements VisionDetector; in-memory image hand-off)
    ↓
Step 5: Wire into aiDetectorManager + settingsStore + useAiOperations (reuse existing gate/consent)
Step 6: Settings UI (status + setup guidance)
Step 7: Error handling
    ↓
Step 8: Tests (incl. PHI no-disk-write guard)
```

Steps 1–3 (backend/bridge) and Steps 4–7 (frontend) can be developed in parallel once the request/response JSON contract is fixed.

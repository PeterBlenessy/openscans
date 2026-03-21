# Task: Implement Subscription-Based AI (Anthropic)

**Feature**: [Subscription AI (Anthropic)](../../features/07-ai-intelligence/subscription-ai-anthropic.md)
**Priority**: Tier 1 — Should Implement
**Estimated Effort**: High (8-12 days)
**Dependencies**: None (builds alongside existing BYOK infrastructure)

## Overview

Add a subscription mode for Anthropic-powered AI features. Users sign up, get a session, and use AI without providing their own API key. A lightweight serverless proxy holds the app's Anthropic key and enforces usage quotas. The existing BYOK mode remains unchanged.

## Implementation Steps

---

### Step 1: Create the Serverless Proxy

**Location**: New repository or `proxy/` directory (deployed separately)
**Runtime**: Cloudflare Worker (recommended) or Vercel Edge Function

The proxy is a single serverless function with ~200 lines of code. It is the only component that touches the Anthropic API key.

#### 1a: Proxy Request Handler

```typescript
// proxy/src/index.ts (Cloudflare Worker example)

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 1. CORS headers for browser requests
    if (request.method === 'OPTIONS') return corsResponse()

    // 2. Authenticate user
    const session = await verifySession(request, env)
    if (!session) return unauthorized()

    // 3. Check quota
    const usage = await getUsage(session.userId, env)
    if (usage.remaining <= 0) return quotaExceeded(usage)

    // 4. Parse and validate the request body
    const body = await request.json()
    validateRequest(body) // ensure model, messages, max_tokens are within bounds

    // 5. Forward to Anthropic with app API key
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,       // server-side only
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        ...body,
        model: getAllowedModel(session.tier, body.model),
        max_tokens: Math.min(body.max_tokens || 4096, getMaxTokens(session.tier)),
      }),
    })

    // 6. Track usage
    const responseBody = await anthropicResponse.json()
    await recordUsage(session.userId, {
      inputTokens: responseBody.usage?.input_tokens || 0,
      outputTokens: responseBody.usage?.output_tokens || 0,
      model: responseBody.model,
      timestamp: Date.now(),
    }, env)

    // 7. Return response with remaining quota header
    return new Response(JSON.stringify(responseBody), {
      headers: {
        ...corsHeaders(),
        'X-Quota-Remaining': String(usage.remaining - 1),
        'X-Quota-Limit': String(usage.limit),
      },
    })
  },
}
```

#### 1b: Data Storage (Usage Tracking)

For Cloudflare Workers, use **KV** or **D1** (SQLite):

```typescript
// Usage record per user per month
interface UsageRecord {
  userId: string
  month: string        // "2026-03"
  requestCount: number
  inputTokens: number
  outputTokens: number
}
```

Minimal schema — no DICOM data, no images, no patient information.

#### 1c: Session Verification

```typescript
async function verifySession(request: Request, env: Env): Promise<Session | null> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null

  // Verify JWT or lookup session token in KV
  const session = await env.SESSIONS.get(token, 'json')
  if (!session || session.expiresAt < Date.now()) return null

  return session as Session
}
```

#### 1d: Model and Token Guardrails

```typescript
function getAllowedModel(tier: string, requestedModel: string): string {
  const TIER_MODELS: Record<string, string[]> = {
    free: ['claude-haiku-4-5-20251001'],
    pro: ['claude-sonnet-4-5-20241022', 'claude-haiku-4-5-20251001'],
    unlimited: ['claude-opus-4-5-20250514', 'claude-sonnet-4-5-20241022', 'claude-haiku-4-5-20251001'],
  }
  const allowed = TIER_MODELS[tier] || TIER_MODELS.free
  return allowed.includes(requestedModel) ? requestedModel : allowed[0]
}

function getMaxTokens(tier: string): number {
  return { free: 1024, pro: 4096, unlimited: 8192 }[tier] || 1024
}
```

---

### Step 2: Create Auth Store (Frontend)

**File**: `src/stores/authStore.ts`

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  // State
  isAuthenticated: boolean
  user: UserProfile | null
  sessionToken: string | null
  subscription: SubscriptionInfo | null

  // Actions
  login: (email: string) => Promise<void>
  verifyMagicLink: (token: string) => Promise<void>
  logout: () => void
  refreshSubscription: () => Promise<void>
}

interface UserProfile {
  id: string
  email: string
}

interface SubscriptionInfo {
  tier: 'free' | 'pro' | 'unlimited'
  requestsUsed: number
  requestsLimit: number
  periodEnd: string  // ISO date
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      sessionToken: null,
      subscription: null,

      login: async (email) => {
        const res = await fetch(`${PROXY_URL}/auth/magic-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        if (!res.ok) throw new Error('Failed to send magic link')
        // User checks email for the link
      },

      verifyMagicLink: async (token) => {
        const res = await fetch(`${PROXY_URL}/auth/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await res.json()
        set({
          isAuthenticated: true,
          user: data.user,
          sessionToken: data.sessionToken,
          subscription: data.subscription,
        })
      },

      logout: () => set({
        isAuthenticated: false,
        user: null,
        sessionToken: null,
        subscription: null,
      }),

      refreshSubscription: async () => {
        const { sessionToken } = get()
        if (!sessionToken) return
        const res = await fetch(`${PROXY_URL}/subscription`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
        })
        if (res.ok) {
          const subscription = await res.json()
          set({ subscription })
        }
      },
    }),
    {
      name: 'openscans-auth',
      partialize: (state) => ({
        // Persist session token but NOT user email to localStorage
        sessionToken: state.sessionToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
```

---

### Step 3: Create Subscription-Aware AI Client

**File**: `src/lib/ai/subscriptionClient.ts`

This is the browser-side client that routes AI requests through the proxy instead of calling Anthropic directly.

```typescript
const PROXY_URL = import.meta.env.VITE_AI_PROXY_URL || 'https://proxy.openscans.io'

interface ProxyRequestOptions {
  model: string
  maxTokens: number
  messages: Array<{ role: string; content: unknown }>
}

interface ProxyResponse {
  content: Array<{ type: string; text: string }>
  usage: { input_tokens: number; output_tokens: number }
  quotaRemaining: number
  quotaLimit: number
}

export async function callAnthropicViaProxy(
  sessionToken: string,
  options: ProxyRequestOptions
): Promise<ProxyResponse> {
  const response = await fetch(`${PROXY_URL}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({
      model: options.model,
      max_tokens: options.maxTokens,
      messages: options.messages,
    }),
  })

  if (response.status === 401) {
    throw new Error('Session expired. Please log in again.')
  }
  if (response.status === 429) {
    const data = await response.json()
    throw new QuotaExceededError(data.used, data.limit, data.resetDate)
  }
  if (!response.ok) {
    throw new Error(`Proxy error: ${response.status}`)
  }

  const data = await response.json()
  return {
    content: data.content,
    usage: data.usage,
    quotaRemaining: parseInt(response.headers.get('X-Quota-Remaining') || '0'),
    quotaLimit: parseInt(response.headers.get('X-Quota-Limit') || '0'),
  }
}

export class QuotaExceededError extends Error {
  constructor(
    public used: number,
    public limit: number,
    public resetDate: string
  ) {
    super(`AI quota exceeded: ${used}/${limit} requests used. Resets ${resetDate}.`)
  }
}
```

---

### Step 4: Create Subscription-Mode Detector

**File**: `src/lib/ai/subscriptionDetector.ts`

Implements the same detector interface as `claudeVisionDetector.ts` but routes through the proxy.

```typescript
import { callAnthropicViaProxy } from './subscriptionClient'
import { useAuthStore } from '../../stores/authStore'

export class SubscriptionDetector {
  async detectVertebrae(instance: DicomInstance): Promise<Detection[]> {
    const sessionToken = useAuthStore.getState().sessionToken
    if (!sessionToken) throw new Error('Not authenticated')

    const imageBase64 = await instanceToBase64(instance)

    const response = await callAnthropicViaProxy(sessionToken, {
      model: 'claude-sonnet-4-5-20241022',
      maxTokens: 2048,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: imageBase64 } },
          { type: 'text', text: VERTEBRAL_DETECTION_PROMPT },
        ],
      }],
    })

    // Update quota display
    useAuthStore.getState().refreshSubscription()

    return parseDetectionResponse(response.content[0].text)
  }

  async analyzeImage(instance: DicomInstance): Promise<string> {
    const sessionToken = useAuthStore.getState().sessionToken
    if (!sessionToken) throw new Error('Not authenticated')

    const imageBase64 = await instanceToBase64(instance)

    const response = await callAnthropicViaProxy(sessionToken, {
      model: 'claude-sonnet-4-5-20241022',
      maxTokens: 4096,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: imageBase64 } },
          { type: 'text', text: ANALYSIS_PROMPT },
        ],
      }],
    })

    useAuthStore.getState().refreshSubscription()

    return response.content[0].text
  }
}
```

---

### Step 5: Update Detector Initialization

**File**: `src/hooks/useAiOperations.ts`

Modify the existing `initDetector()` function to support the subscription mode:

```typescript
function initDetector(settings: Settings, authState: AuthState): Detector {
  // Subscription mode: user is authenticated, use proxy
  if (authState.isAuthenticated && authState.sessionToken) {
    if (settings.aiProvider === 'subscription' || settings.aiProvider === 'claude') {
      return new SubscriptionDetector()
    }
  }

  // BYOK mode: user provides their own key (existing behavior)
  switch (settings.aiProvider) {
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

### Step 6: Update Settings Store

**File**: `src/stores/settingsStore.ts`

Add subscription-related settings:

```typescript
// Add to existing SettingsState interface:
aiMode: 'subscription' | 'byok'  // new: which mode is active
// existing fields unchanged: aiProvider, aiApiKey, etc.

// Add action:
setAiMode: (mode: 'subscription' | 'byok') => void
```

Default `aiMode` to `'byok'` to preserve existing behavior.

---

### Step 7: Update Settings Panel UI

**File**: `src/components/settings/SettingsPanel.tsx`

Add a mode selector at the top of the AI section:

```
┌─ AI Detection ──────────────────────────────────┐
│                                                   │
│  AI Mode:  [● Subscription]  [○ Bring Your Key]  │
│                                                   │
│  ── Subscription Mode ──────────────────────────  │
│  Status: Pro Plan (142 / 200 requests remaining)  │
│  Resets: April 1, 2026                            │
│  [Manage Subscription]   [Log Out]                │
│                                                   │
│  ── OR ─────────────────────────────────────────  │
│                                                   │
│  ── Bring Your Own Key ─────────────────────────  │
│  Provider: [Claude ▾]                             │
│  API Key:  [sk-ant-••••••••••] 👁                 │
│  (existing UI, unchanged)                         │
│                                                   │
└───────────────────────────────────────────────────┘
```

When subscription mode is selected and user is not authenticated, show:
```
┌─ Sign In ──────────────────────────┐
│  Email: [________________]         │
│  [Send Magic Link]                 │
│                                    │
│  Or continue with:                 │
│  [GitHub]  [Google]                │
└────────────────────────────────────┘
```

---

### Step 8: Create Quota Display Component

**File**: `src/components/viewer/QuotaIndicator.tsx`

Show remaining requests in the toolbar when subscription mode is active:

```typescript
export function QuotaIndicator() {
  const subscription = useAuthStore((s) => s.subscription)
  if (!subscription) return null

  const pct = (subscription.requestsUsed / subscription.requestsLimit) * 100
  const color = pct > 90 ? 'text-red-400' : pct > 70 ? 'text-yellow-400' : 'text-green-400'

  return (
    <div className={`text-xs ${color}`} title="AI requests remaining this period">
      {subscription.requestsLimit - subscription.requestsUsed} / {subscription.requestsLimit}
    </div>
  )
}
```

Display this in the viewport toolbar near the AI detection buttons.

---

### Step 9: Handle Quota Exceeded Gracefully

**File**: `src/hooks/useAiOperations.ts`

When a `QuotaExceededError` is caught:

1. Show a user-friendly error: "You've used all 200 AI requests this month. Resets on April 1."
2. Offer upgrade path: "Upgrade to Unlimited for unrestricted access"
3. Offer BYOK fallback: "Or switch to Bring Your Own Key mode"
4. Disable AI buttons (but don't hide them) when quota is 0

---

### Step 10: Add Environment Configuration

**File**: `.env.example`

```env
# AI Proxy URL (subscription mode)
VITE_AI_PROXY_URL=https://proxy.openscans.io

# Leave empty for production; set for local proxy development
# VITE_AI_PROXY_URL=http://localhost:8787
```

**File**: `vite.config.ts`

Ensure the env variable is available to the app via `import.meta.env.VITE_AI_PROXY_URL`.

---

### Step 11: Update AI Consent Flow

**File**: `src/components/settings/SettingsPanel.tsx`

The consent dialog should differ by mode:

**Subscription mode consent:**
> "AI features send images to Anthropic's API via the OpenScans proxy.
> Images are sent without patient metadata. The proxy does not store images.
> Your subscription covers the AI processing cost."

**BYOK mode consent** (unchanged):
> "Images will be sent to external AI services using your API key..."

---

### Step 12: Add Tests

**File**: `src/stores/__tests__/authStore.test.ts`

1. Test login flow (email → magic link → verify → session)
2. Test logout clears session
3. Test subscription quota tracking
4. Test session token persistence in localStorage
5. Test expired session handling

**File**: `src/lib/ai/__tests__/subscriptionClient.test.ts`

1. Test proxy request formation (correct headers, body)
2. Test quota exceeded error handling
3. Test session expired handling (401)
4. Test quota header parsing from response

**File**: `src/lib/ai/__tests__/subscriptionDetector.test.ts`

1. Test detection via proxy (mock fetch)
2. Test analysis via proxy (mock fetch)
3. Test unauthenticated rejection

---

## File Summary

### New Files

| File | Purpose |
|------|---------|
| `proxy/src/index.ts` | Serverless proxy (Cloudflare Worker) |
| `proxy/wrangler.toml` | Cloudflare Worker configuration |
| `src/stores/authStore.ts` | Authentication and subscription state |
| `src/lib/ai/subscriptionClient.ts` | Browser-side proxy client |
| `src/lib/ai/subscriptionDetector.ts` | Detector routed through proxy |
| `src/components/viewer/QuotaIndicator.tsx` | Remaining requests display |
| `src/components/auth/LoginForm.tsx` | Email login / magic link UI |
| `src/components/auth/SubscriptionStatus.tsx` | Plan status and management |

### Modified Files

| File | Change |
|------|--------|
| `src/stores/settingsStore.ts` | Add `aiMode` setting |
| `src/hooks/useAiOperations.ts` | Route to subscription or BYOK detector |
| `src/components/settings/SettingsPanel.tsx` | Add mode selector, login UI, quota display |
| `src/components/viewer/ViewportToolbar.tsx` | Show quota indicator |
| `.env.example` | Add `VITE_AI_PROXY_URL` |

### Unchanged Files

| File | Why Unchanged |
|------|--------------|
| `src/lib/ai/claudeVisionDetector.ts` | BYOK mode preserved as-is |
| `src/lib/ai/openaiVisionDetector.ts` | BYOK mode preserved as-is |
| `src/lib/ai/geminiVisionDetector.ts` | BYOK mode preserved as-is |
| `src/lib/ai/mockVertebralDetector.ts` | Offline fallback preserved as-is |

---

## Acceptance Criteria

- [ ] Users can sign up with email and receive a magic link
- [ ] Authenticated users can use AI features without providing an API key
- [ ] The app-owned Anthropic API key is NEVER present in browser code or network requests from the browser
- [ ] Usage quota is tracked and displayed (e.g., "142 / 200 requests remaining")
- [ ] Quota exceeded shows a clear message with upgrade and BYOK fallback options
- [ ] BYOK mode continues to work exactly as before (no regression)
- [ ] Mock detector works offline regardless of auth state
- [ ] AI consent dialog is shown before first use in both modes
- [ ] Session persists across page reloads (localStorage)
- [ ] Subscription works identically in browser and Tauri desktop app
- [ ] Proxy is stateless and stores no image data

---

## Dependency Graph

```
Step 1: Proxy (can be developed independently)
    ↓
Step 2: Auth Store ──► Step 7: Settings UI
    ↓                      ↓
Step 3: Subscription Client    Step 8: Quota Indicator
    ↓
Step 4: Subscription Detector
    ↓
Step 5: Detector Init Update
    ↓
Step 9: Quota Exceeded Handling
    ↓
Step 12: Tests
```

Steps 1 and 2-7 can be developed in parallel. The proxy can be tested independently with curl before the frontend is connected.

---

## Architecture Note: Why Not the Agent SDK

The user's original request mentioned "Anthropic's Agent SDK." The [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk-typescript) (`@anthropic-ai/claude-agent-sdk`) is a server-side framework for building autonomous coding agents — it requires Node.js, file system access, and terminal execution. It is not applicable to browser-based medical image analysis.

The correct tool for OpenScans is the standard **Anthropic SDK** (`@anthropic-ai/sdk`) used via a backend proxy, which is what this task implements. The SDK's `messages.create()` API with vision capabilities is exactly what the existing BYOK detectors already use.

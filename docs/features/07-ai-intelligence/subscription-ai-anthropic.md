# Subscription-Based AI Provider Usage (Anthropic)

**Status**: ❌ Not Implemented
**Category**: AI & Intelligence
**Priority**: Tier 1 — Should Implement
**Initial Provider**: Anthropic (Claude)

## Description

Offer AI-powered features (vertebral detection, radiology analysis) as a managed subscription service where OpenScans provides the Anthropic API access — users do not need their own API key. The existing "bring your own key" (BYOK) model remains available as an alternative for users who prefer direct provider accounts or offline use.

### Two Operating Modes

| Mode | API Key | Backend Required | Offline | Cost to User |
|------|---------|-----------------|---------|-------------|
| **Subscription** (new) | App-provided via proxy | Yes (lightweight) | No | Subscription fee |
| **BYOK** (existing) | User-provided | No | Yes* | Direct to provider |

*BYOK with mock detector works fully offline.

## Architecture

### Why a Backend Proxy Is Required

The Anthropic SDK (`@anthropic-ai/sdk`) supports `dangerouslyAllowBrowser: true` for client-side use, but this flag exists as a warning: **any API key embedded in browser JavaScript is visible in DevTools** (Network tab, source maps, memory inspection). This is acceptable for user-supplied BYOK keys (the user's own key), but unacceptable for an app-owned key serving all subscribers.

A lightweight backend proxy solves this:

```
┌──────────────────────────────┐
│  Browser (OpenScans React)   │
│                              │
│  ┌─────────────────────┐     │
│  │ BYOK Mode           │     │  User's own API key
│  │ Direct to Anthropic ├─────┼──────► api.anthropic.com
│  └─────────────────────┘     │
│                              │
│  ┌─────────────────────┐     │
│  │ Subscription Mode   │     │  Session token only
│  │ Via proxy           ├─────┼──────► proxy.openscans.io
│  └─────────────────────┘     │         │
│                              │         │ App's API key
└──────────────────────────────┘         │ (server-side only)
                                         ▼
                                  api.anthropic.com
```

### Proxy Requirements (Minimal)

The proxy is intentionally lightweight — a single serverless function (Cloudflare Worker, Vercel Edge Function, or AWS Lambda). It does NOT process DICOM data or store patient information. Its responsibilities:

1. **Authenticate the user** — Verify session token / subscription status
2. **Inject the API key** — Add the Anthropic API key server-side
3. **Forward the request** — Pass the vision request body to Anthropic's API
4. **Track usage** — Record token counts per user for metering
5. **Enforce quotas** — Reject requests when subscription limits are exceeded
6. **Return the response** — Stream the Anthropic response back to the browser

### Privacy Preservation

- The proxy forwards the same request body the browser would send directly to Anthropic — including the base64-encoded image. **No DICOM metadata is sent** (the browser strips it before encoding, as it does today).
- The proxy does NOT store images, responses, or any patient data.
- The proxy logs only: user ID, timestamp, model, token counts, and request status.
- This is architecturally identical to the current BYOK flow — the only difference is where the API key is injected.

## Benefits

- **Zero-friction onboarding** — Users get AI features immediately without creating an Anthropic account, generating API keys, or understanding token pricing
- **Predictable cost** — Monthly subscription fee instead of pay-per-token uncertainty
- **Simplified UX** — No API key configuration; just sign up and use AI features
- **Revenue model** — Enables sustainable development of OpenScans through subscription income
- **BYOK preserved** — Power users and institutions with their own Anthropic accounts can continue using direct API access with no proxy dependency

## Subscription Model Design

### Tiers (Initial)

| Tier | AI Requests / Month | Models | Price |
|------|---------------------|--------|-------|
| **Free** | 10 | Claude Haiku | $0 |
| **Pro** | 200 | Claude Sonnet | TBD |
| **Unlimited** | Unlimited | Claude Sonnet + Opus | TBD |

- "AI request" = one detection or one analysis call
- Token limits per request enforced server-side
- Unused requests do not roll over

### What's Metered

Each AI operation counts as one request:
- Vertebral detection (one image → one request)
- Radiology analysis (one image → one request)
- Future AI features would also consume requests

### Authentication

Users authenticate via a simple email + magic link flow (or OAuth with GitHub/Google). Authentication is ONLY required for subscription-mode AI — all other OpenScans features continue to work without any account.

## How It Differs from NoteSage

[NoteSage](https://github.com/PeterBlenessy/notesage) uses a pure BYOK model: users provide their own API keys, and the Tauri/Rust backend proxies requests using those user-supplied keys. There is no subscription billing, usage tracking, or app-owned API key.

OpenScans takes this further by:
1. Offering an app-managed subscription option alongside BYOK
2. Using a serverless proxy (not a Tauri backend) so it works in browser-only mode
3. Adding usage metering and quota enforcement
4. Maintaining a path to local AI models (TensorFlow.js) for fully offline use

## Compatibility Requirements

- **Browser-only**: The subscription flow must work in a standard web browser with no Tauri or native dependencies
- **Desktop app**: The Tauri desktop app uses the same web-based subscription flow (the proxy is accessed via HTTPS, same as in the browser)
- **Offline fallback**: When the proxy is unreachable, BYOK mode and mock detector remain functional
- **No API key in browser**: The app-owned Anthropic API key never appears in client-side code, network requests, or localStorage

## Future Extensions

- Additional subscription providers (OpenAI, Google Gemini)
- Usage dashboard showing remaining requests and history
- Team/institutional subscriptions with shared quotas
- Stripe integration for payment processing
- Webhook-based subscription lifecycle management

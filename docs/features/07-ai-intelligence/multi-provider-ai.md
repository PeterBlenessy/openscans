# Multi-Provider AI Support

**Status**: ✅ Implemented
**Category**: AI & Intelligence
**Priority**: High

## Description

Support multiple AI vision API providers (Anthropic Claude, OpenAI GPT-4, Google Gemini) with a unified interface. Users can select their preferred provider in settings and provide their own API key. A mock detector is available for offline use.

## Benefits

- **No vendor lock-in** — Users choose the AI provider that best suits their needs, budget, or institutional requirements
- **Resilience** — If one provider is unavailable, users can switch to another
- **Cost flexibility** — Different providers have different pricing; users can choose based on budget
- **Offline capability** — Mock detector provides basic functionality without any API key or internet connection
- **Bring your own key** — Users provide their own API keys, eliminating subscription fees from OpenScans

## Current Implementation

- Claude Vision API (claude-3-5-sonnet)
- OpenAI Vision API (GPT-4 Vision)
- Google Gemini Vision API (Gemini Pro Vision)
- Mock Detector (offline, no API key needed)
- Provider selection in settings panel
- API key storage in localStorage
- AI response language selection

## Key Files

- `src/stores/settingsStore.ts`
- `src/components/settings/SettingsPanel.tsx`

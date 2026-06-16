# AI Vertebral Detection

**Status**: ✅ Implemented
**Category**: AI & Intelligence
**Priority**: High — Unique Differentiator

## Description

Automatically detect and label vertebral bodies in spine imaging using AI vision models. The system sends the current image to an AI provider (Claude, GPT-4, or Gemini) and receives back labeled vertebral positions (C1-C7, T1-T12, L1-L5, S1) with confidence scores. Results are displayed as color-coded markers on the image.

## Benefits

- **Automated labeling** — Vertebral body labeling is a repetitive task that AI handles quickly and accurately
- **Multi-provider flexibility** — Choose between Claude Vision, OpenAI GPT-4 Vision, or Google Gemini, or use the offline mock detector
- **Confidence scoring** — Each detection includes a confidence score, helping users assess reliability
- **Adjustable results** — AI-placed markers can be dragged to correct positions, with the system tracking which markers were manually adjusted
- **Unique feature** — No competitor offers built-in AI anatomical detection

## Current Implementation

- Claude Vision API (primary) — claude-3-5-sonnet with temperature=0.0
- OpenAI Vision API (fallback) — GPT-4 Vision
- Google Gemini Vision API — Gemini Pro Vision
- Mock Detector (offline fallback) — Anatomically plausible L1-L5 positioning
- Keyboard shortcut (M) for quick activation
- AI provider selection in settings

## Key Files

- `src/lib/ai/claudeVisionDetector.ts`
- `src/lib/ai/openaiVisionDetector.ts`
- `src/lib/ai/geminiVisionDetector.ts`
- `src/lib/ai/mockVertebralDetector.ts`

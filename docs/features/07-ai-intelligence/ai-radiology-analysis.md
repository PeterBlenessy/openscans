# AI Radiology Analysis

**Status**: ✅ Implemented
**Category**: AI & Intelligence
**Priority**: High — Unique Differentiator

## Description

Request a general radiology analysis of the current image from an AI vision model. The AI examines the image and produces structured findings text describing visible anatomy, pathology, and clinical observations. Results are displayed in a modal with markdown formatting.

## Benefits

- **Second opinion** — AI analysis provides an additional perspective on imaging findings
- **Educational tool** — Helps medical students and trainees learn to identify findings by comparing their own assessment with AI output
- **Structured output** — AI generates organized findings text, not just raw descriptions
- **Export and copy** — Analysis results can be exported to PDF or copied to clipboard for documentation
- **Unique feature** — No competitor offers built-in AI radiology analysis

## Current Implementation

- Multi-provider support (Claude, GPT-4, Gemini)
- Structured findings text with markdown rendering
- Modal display for analysis results
- Copy to clipboard functionality
- Export analysis to PDF
- Keyboard shortcut (N) for quick activation
- Per-instance analysis storage with localStorage persistence

## Key Files

- `src/components/viewer/AiAnalysisModal.tsx`
- `src/stores/aiAnalysisStore.ts`
- `src/hooks/useAiOperations.ts`

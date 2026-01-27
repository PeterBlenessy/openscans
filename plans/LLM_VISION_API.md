# LLM Vision API Integration Plan

**Date**: 2026-01-27
**Status**: Planning
**Approach**: Replace local ML models with cloud-based LLM vision APIs

## Problem Statement

The TotalSegmentator local ML integration (900MB models + Python sidecar) has proven:
- Too large for desktop distribution
- Unreliable for vertebrae detection (0 detections on test data)
- Complex to maintain (PyInstaller, hidden imports, model downloads)

**Alternative**: LLM vision models (Claude, GPT-4V) excel at medical image analysis and return structured annotations from natural language prompts.

## Architecture Decision

### Chosen: Claude API First (with OpenAI fallback)

**Rationale**:
1. Claude 3.5 Sonnet/Opus have excellent medical image understanding
2. Structured output support (JSON mode)
3. User likely has existing Claude subscription
4. Privacy policy allows medical image analysis (non-diagnostic)

**Fallback chain**:
1. Claude API (Anthropic) - Primary
2. OpenAI API (GPT-4 Vision) - Secondary
3. User-provided API keys - Both supported

## Privacy & Compliance

### Important Considerations:
- Medical images sent to external API (user consent required)
- HIPAA: External APIs not HIPAA-compliant by default
- Must inform users images leave their device
- Recommendation: De-identify images before upload (strip metadata)

### Implementation:
- Clear consent dialog on first use
- Settings toggle: "Enable AI Detection (sends images to API)"
- Strip DICOM metadata before sending (send pixel data only)
- User control: Can disable at any time

## Technical Design

### Phase 1: Claude Vision API Client

**Location**: `src/lib/ai/claudeVisionDetector.ts`

**Flow**:
1. User clicks AI detection button
2. Extract current DICOM slice pixel data
3. Convert to PNG/JPEG (strip metadata)
4. Encode as base64
5. Send to Claude API with structured prompt
6. Parse JSON response into annotations
7. Display on viewport

**API Request**:
```typescript
{
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: "image/png",
          data: "<base64-encoded-image>"
        }
      },
      {
        type: "text",
        text: "Analyze this medical scan image and identify all visible vertebrae..."
      }
    ]
  }]
}
```

**Expected Response**:
```json
{
  "vertebrae": [
    {
      "label": "T12",
      "position": { "x": 256, "y": 180 },
      "confidence": 0.95
    },
    {
      "label": "L1",
      "position": { "x": 256, "y": 220 },
      "confidence": 0.93
    }
  ]
}
```

### Phase 2: API Key Management

**Location**: `src/stores/settingsStore.ts`

**Storage**: Secure credential storage
- Tauri: Use `tauri-plugin-store` for encrypted storage
- Web: localStorage (with warning about local storage security)

**Settings UI**:
```typescript
interface AISettings {
  enabled: boolean
  provider: 'claude' | 'openai' | 'none'
  apiKey?: string // Optional, for custom API keys
  useSubscription: boolean // Use existing subscription if available
}
```

### Phase 3: Prompt Engineering

**System Prompt**:
```
You are a medical imaging assistant analyzing spinal scans.
Your task is to identify all visible vertebrae in the provided image.

For each vertebra:
1. Determine its anatomical label (C1-C7, T1-T12, L1-L5, S1)
2. Estimate its center position in pixel coordinates
3. Provide a confidence score (0.0-1.0)

Return ONLY valid JSON in this exact format:
{
  "vertebrae": [
    {"label": "T12", "position": {"x": 256, "y": 180}, "confidence": 0.95}
  ]
}

If no vertebrae are visible, return: {"vertebrae": []}
```

### Phase 4: Cost Optimization

**Strategies**:
1. **Image compression**: Resize to max 1024x1024 before sending
2. **Caching**: Cache results per slice (avoid re-processing)
3. **Batch mode**: Process multiple slices in one request
4. **User control**: Show estimated cost before processing

**Cost estimates** (Claude 3.5 Sonnet):
- Input: ~$3 per 1M tokens (~750 images at 1024x1024)
- Output: ~$15 per 1M tokens (~1M annotations)
- **Per image**: ~$0.004-0.01 (less than 1 cent per slice)

## Implementation Plan

### Task Breakdown:

**Week 1: Core Integration**
- [ ] Create `claudeVisionDetector.ts`
- [ ] Implement DICOM → PNG conversion
- [ ] Build API client with retry logic
- [ ] Add consent dialog
- [ ] Test with real spine scans

**Week 2: UX & Settings**
- [ ] Add API settings to Settings dialog
- [ ] Implement secure key storage
- [ ] Add cost estimator UI
- [ ] Show processing progress
- [ ] Error handling & fallbacks

**Week 3: Testing & Polish**
- [ ] Test with various scan types (CT, MRI)
- [ ] Validate annotation accuracy
- [ ] Performance optimization
- [ ] Documentation
- [ ] User guide for API setup

### Success Metrics:

1. **Accuracy**: >90% vertebrae correctly identified
2. **Speed**: <5 seconds per slice (including API latency)
3. **Cost**: <$0.01 per image
4. **UX**: One-click detection with clear feedback
5. **Privacy**: User fully informed and in control

## Migration from Python ML

### What to Keep:
- ✅ Tauri desktop app
- ✅ DICOM parsing and rendering
- ✅ Annotation system
- ✅ Export functionality
- ✅ Recent studies persistence

### What to Remove:
- ❌ Python backend (`python-backend/`)
- ❌ PyInstaller builds
- ❌ Tauri sidecar (`ai_server.rs`)
- ❌ TotalSegmentator dependencies
- ❌ `tauriVertebralDetector.ts`
- ❌ `detectorFactory.ts`

### What to Add:
- ✨ `claudeVisionDetector.ts`
- ✨ `openaiVisionDetector.ts` (fallback)
- ✨ API settings UI
- ✨ Consent dialog
- ✨ Cost estimator
- ✨ Image preprocessing utilities

## Risks & Mitigations

### Risk 1: API Rate Limits
**Mitigation**: Implement exponential backoff, queue management, show user clear rate limit messages

### Risk 2: API Costs for Users
**Mitigation**: Clear cost display, processing confirmations, batch processing options, caching

### Risk 3: Annotation Accuracy
**Mitigation**: Prompt engineering, allow manual corrections, feedback loop to improve prompts

### Risk 4: Privacy Concerns
**Mitigation**: Clear consent, data stripping, local-only mode option, transparency about what's sent

### Risk 5: Network Dependency
**Mitigation**: Offline mode with mock detector, clear error messages, retry logic

## Alternatives Considered

### 1. Local TotalSegmentator (Current)
- ❌ Too large (900MB+)
- ❌ Poor accuracy for vertebrae
- ❌ Complex maintenance
- ✅ No privacy concerns
- ✅ No API costs

### 2. LLM Vision APIs (Chosen)
- ✅ Excellent accuracy
- ✅ Small app size (~50MB)
- ✅ Simple maintenance
- ❌ Privacy implications
- ❌ Per-use costs (minimal)

### 3. Cloud-hosted TotalSegmentator
- ❌ Still inaccurate
- ❌ Need to host own server
- ❌ Higher ongoing costs
- ✅ More control
- ✅ HIPAA-compliant options

### 4. No AI (Manual annotation only)
- ✅ Full privacy
- ✅ No costs
- ❌ Manual work required
- ❌ Time-consuming
- ❌ Less impressive UX

## Next Steps

1. ✅ Create clean branch from Tauri-only commits
2. ✅ Tag Python ML work for future reference
3. ✅ Document migration plan
4. 🔄 Implement Claude Vision API client
5. 🔄 Test with real spine scans
6. 🔄 Add settings UI
7. 🔄 Production release

---

**Decision**: Proceed with Claude Vision API integration
**Approved By**: User feedback on 2026-01-27
**Implementation Start**: 2026-01-27

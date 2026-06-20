# Task: Implement Local AI Models (MONAI / TensorFlow.js)

**Feature**: [Local AI Models](../../features/07-ai-intelligence/local-ai-models.md)
**Priority**: Tier 3 — Long-term
**Estimated Effort**: Very High (3-4 weeks)
**Dependencies**: None (enhances existing AI infrastructure)

> **Verify against current code (post-2026-06 security work).** The AI settings/provider plumbing has changed since this doc was written: cloud AI is desktop-only (`isTauri()` in `src/lib/utils/platform.ts`), every cloud send goes through the per-send `confirmAiSend` consent dialog (`src/lib/ai/ai-send-confirm.ts`), BYOK keys live in the OS keychain (`src/lib/utils/credentials.ts`), and detectors implement the `VisionDetector` interface via `src/lib/ai/aiDetectorManager.ts`. Local models run with zero egress, so the cloud consent gate does not apply — but the provider option, settings UI ("No API key needed"), and detector wiring must match the *current* `AIProvider` / `settingsStore` / detector-manager shapes, not the ones implied below. Confirm before implementing.

## Overview

Run AI models directly in the browser using TensorFlow.js or ONNX Runtime Web, enabling AI-powered features without sending data to external APIs.

## Implementation Steps

### Step 1: Evaluate Model Options

**Research task — no code changes**

1. Research available pre-trained medical imaging models:
   - Vertebral detection models (aligns with existing AI feature)
   - General anatomy segmentation
   - Pathology detection
2. Evaluate model formats: TensorFlow.js, ONNX, TFLite
3. Assess model sizes (must be reasonable for browser download)
4. Select initial model for proof of concept

### Step 2: Add Model Runtime

**File**: `package.json`

1. Option A: `pnpm add @tensorflow/tfjs @tensorflow/tfjs-backend-webgl`
2. Option B: `pnpm add onnxruntime-web`
3. Choose based on available models and performance benchmarks

### Step 3: Create Model Loading Infrastructure

**File**: `src/lib/ai/modelLoader.ts`

1. Create model loading and caching:
   ```typescript
   interface ModelConfig {
     name: string
     url: string          // model file URL (CDN or bundled)
     inputSize: [number, number]  // expected input dimensions
     outputType: 'classification' | 'detection' | 'segmentation'
   }

   async function loadModel(config: ModelConfig): Promise<Model>
   ```
2. Cache loaded models in memory (don't re-download)
3. Show download progress for first-time loading
4. Support loading from local files or CDN

### Step 4: Create Image Preprocessing Pipeline

**File**: `src/lib/ai/imagePreprocessor.ts`

1. Convert DICOM pixel data to model input format:
   ```typescript
   function preprocessForModel(
     pixelData: Float32Array,
     width: number, height: number,
     targetSize: [number, number]
   ): Float32Array
   ```
2. Resize to model's expected input dimensions
3. Normalize pixel values (0-1 or -1 to 1 depending on model)
4. Apply windowing if needed

### Step 5: Create Inference Runner

**File**: `src/lib/ai/localInference.ts`

1. Run the loaded model on preprocessed image data:
   ```typescript
   async function runInference(
     model: Model,
     input: Float32Array
   ): Promise<InferenceResult>
   ```
2. Post-process model output (decode bounding boxes, labels, confidence scores)
3. Map model output to existing annotation types (markers, regions)

### Step 6: Integrate with Existing AI Infrastructure

**File**: `src/lib/ai/localDetector.ts`

1. Implement the same detector interface as cloud-based providers:
   ```typescript
   // Match the interface used by claudeVisionDetector, openaiVisionDetector, etc.
   async function detectWithLocalModel(
     imageData: ImageData,
     modality: string
   ): Promise<Detection[]>
   ```
2. Add "Local" as an AI provider option in settings
3. No API key required — show "No API key needed" in settings

### Step 7: Add Model Management UI

**File**: `src/components/settings/ModelManager.tsx`

1. List available models with download status
2. Download button for models not yet cached
3. Model size and description
4. Delete cached models to free space

### Step 8: Add Tests

1. Test model loading and caching
2. Test image preprocessing (resize, normalize)
3. Test inference output parsing
4. Test integration with existing annotation system

## Acceptance Criteria

- [ ] At least one model runs inference entirely in the browser
- [ ] No data sent to external APIs
- [ ] Model download with progress indicator
- [ ] Results displayed as markers/annotations (same as cloud AI)
- [ ] "Local" option in AI provider settings
- [ ] No API key required for local models
- [ ] Acceptable inference speed (< 5 seconds per image)

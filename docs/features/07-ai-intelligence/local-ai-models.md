# Local AI Models (MONAI / TensorFlow.js)

**Status**: ❌ Not Implemented
**Category**: AI & Intelligence
**Priority**: Tier 3 — Long-term

## Description

Run AI models directly in the browser using TensorFlow.js or integrate with NVIDIA MONAI for production-grade medical image analysis without sending data to external APIs. This enables AI-powered features while maintaining complete data privacy.

## Benefits

- **Complete privacy** — No image data leaves the user's device; all AI processing happens locally
- **No API costs** — No per-request charges from cloud AI providers
- **Offline AI** — AI features work without internet connectivity
- **Higher accuracy** — Purpose-built medical imaging models (MONAI achieves 95-98% accuracy) versus general-purpose vision models
- **Faster inference** — Local GPU inference can be faster than cloud API round-trips

## Why It Matters for OpenScans

This is the ultimate evolution of OpenScans' AI capabilities. Current cloud-based AI features require sending patient images to third-party APIs, which creates privacy concerns. Local models would align AI features with OpenScans' privacy-first philosophy while potentially improving accuracy.

## Implementation Considerations

- TensorFlow.js for in-browser model inference
- WebGL/WebGPU backend for GPU acceleration
- Pre-trained model packaging and distribution (model size vs. download time)
- MONAI integration for production-grade medical AI
- ONNX Runtime Web as an alternative runtime
- Model loading time and memory requirements
- Progressive enhancement — offer local models where available, fall back to cloud

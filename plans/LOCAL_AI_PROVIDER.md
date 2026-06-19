# Local AI Provider — Replacing Online AI with Local LLMs

**Status**: Research / Planning
**Branch**: `feat/local-ai`
**Created**: 2026-06-19
**Goal**: Replace the cloud vision providers (Claude / Gemini / OpenAI) with **local
LLMs** so that DICOM image data never leaves the device, while keeping the existing
`VisionDetector` seam and provider-selection UX unchanged.

---

## 1. Why

OpenScans currently sends a rendered PNG of the DICOM to a cloud vision API
(`claudeVisionDetector`, `geminiVisionDetector`, `openaiVisionDetector`), gated by
`AiSendConfirmDialog`. That is the only data-egress path in the app. Running the model
**locally** turns "we don't share data" into "the binary *cannot* share it" — the
auditable guarantee a hospital security review wants, and the natural endpoint of the
privacy-first principle in `CLAUDE.md` and `docs/features/07-ai-intelligence/local-ai-models.md`.

---

## 2. The integration seam already exists

All cloud detectors implement **one interface** — `VisionDetector` in
`src/lib/ai/types.ts`:

```ts
interface VisionDetector {
  setApiKey(apiKey: string): void
  isConfigured(): boolean
  detectVertebrae(instance: DicomInstance): Promise<DetectionResult>   // structured markers
  analyzeImage(instance: DicomInstance): Promise<AnalysisResult>       // free-text radiology analysis
}
```

…and are selected by a single switch in `src/lib/ai/aiDetectorManager.ts`
(`getDetector(provider)`). Adding a `'local'` provider is a localized change:

- new `localVisionDetector.ts` implementing `VisionDetector`
- one `case 'local'` in `getDetector()`
- a settings entry + provider option in the existing selection UI

Nothing else in the app needs to know the inference moved on-device.

---

## 3. Reuse from Notesage (`PeterBlenessy/notesage`)

Notesage already wires llama.cpp into a Tauri v2 app — the exact pattern we need.
**Reusable, proven building blocks:**

| Concern | Notesage implementation | Reuse for OpenScans |
|---|---|---|
| Local inference engine | Bundled **`llama-server`** (llama.cpp) as a Tauri **`externalBin` sidecar**, target-triple-suffixed (`llama-server-aarch64-apple-darwin`) | Same sidecar approach in `src-tauri` |
| Binary acquisition | `scripts/download-llama-server.sh` pulls prebuilt llama.cpp release binaries; `build.rs` writes a placeholder on non-mac hosts so builds don't fail | Adapt script; add win/linux triples |
| Routing | `local_bundled` / `local_ai` connection types call the OpenAI-compatible `/v1/chat/completions` (`src/lib/ai/connections.ts`) | Point our `openai` SDK at `http://localhost:<port>/v1` — reuse most of `openaiVisionDetector` |
| **Vision** | Image attachments via OpenAI-compatible base64 images; vision-capable models detected (`segment_builder.rs`: moondream / llama-vision / smolvlm); `--mmproj` projector | Send the DICOM PNG as a base64 image part — same path |
| Structured output | JSON-schema `response_format` forwarded verbatim to llama-server (`src/lib/ai/structured.ts`) | Use for `detectVertebrae`'s `VertebraResponse` schema |
| Server lifecycle | PID-file kill (not `pkill` — avoids killing other apps' llama-server), port discovery (`model_providers/binary_resolution.rs`, `local_inference.rs`) | Port directly |
| Model fit | `model_fit/` engine estimates RAM + tok/s, recommends model by system memory (`LocalAISetupCard.tsx`) | Port to gate which medical model we offer |
| **Network confinement** | "Verifiably empty network allowlist" — kernel network sandbox allows **only** the llama-server port (`useLocalAgentSetup.ts`, `docs/prds/2026-06-12-local-ai-agents.md`) | This is the privacy guarantee — lock `src-tauri/capabilities/default.json` to localhost-only for the AI path |

**Bottom line:** the chat/VLM layer is largely a port, not a build-from-scratch.

---

## 4. The architectural fork — two runtimes, not one

The user wants both (a) llama.cpp wiring *and* (b) NVIDIA / MR-trained medical models.
**These are different runtimes.** llama.cpp runs **GGUF LLMs/VLMs** (2D image → text).
It does **not** run the 3D segmentation CNNs that are NVIDIA/MONAI's medical strength.

### Path A — GGUF medical VLMs on llama.cpp (fits Notesage exactly)
2D image → text. Drop straight into the bundled `llama-server`. Best fit for
`analyzeImage` (radiology description), weak at precise pixel coordinates.

| Model | Notes | llama.cpp |
|---|---|---|
| **MedGemma 4B-IT** (Google) | Gemma-3 multimodal; SigLIP vision pre-trained on **de-identified medical data (radiology incl. MRI/CT, path, derm)**. Best medical fit. | ✅ GGUF available (`unsloth`, `kelkalot`); run with `--mmproj`. llama.cpp already supports Gemma 3 vision (Notesage bumped llama.cpp for Gemma arch) |
| **LLaVA-Med** (Microsoft) | Biomedical VLM (CXR/CT/MRI/histo from PMC-15M) | ⚠️ LLaVA-family; GGUF varies by checkpoint |
| **Qwen2.5-VL** | Strong general VLM fallback | ✅ GGUF available |

### Path B — NVIDIA / MONAI MR-trained models (separate runtime: MONAI/PyTorch sidecar or NIM)
3D segmentation, **not** llama.cpp. This is the `PYTHON_ML_INTEGRATION.md` sidecar
route (or NVIDIA NIM microservices for on-prem GPU).

| Model | Modality | What it does | Runtime |
|---|---|---|---|
| **TotalSegmentator MRI** | **MR** (sequence-independent) | 80 anatomical structures, Dice 0.839; open weights, fully local | nnU-Net / PyTorch sidecar |
| **MONAI Whole-Brain** | **MR** (T1) | 133 brain structures (Vanderbilt collab) | MONAI bundle |
| **VISTA-3D** (NVIDIA) | CT | Foundation seg, 120+ organs, zero-shot | MONAI / NIM |
| **MAISI** (NVIDIA) | CT | Generative synthetic 3D CT | NIM |

### Path C — VILA-M3 (NVIDIA): the bridge
**VILA-M3** (Project-MONAI `VLM-Radiology-Agent-Framework`) is a medical VLM that
*orchestrates MONAI expert segmentation models* — e.g. ask about a tumor in an MRI and
it triggers the relevant segmentation expert, fusing 2D/3D/4D results with VLM text.
Checkpoints: VILA-M3-3B/8B/13B (HuggingFace). **Deployment is Docker/GPU**, not
llama.cpp — heavier, but the most capable medical option and the clearest "NVIDIA is
strong here" answer. Best suited to an **on-prem GPU server**, not a clinician laptop.

---

## 5. Recommendation — phased

1. **Phase 1 — Local VLM via bundled llama-server (Path A, MedGemma 4B).**
   Port Notesage's sidecar + OpenAI-compatible routing. Add `'local'` provider behind
   the existing selector. Reuses the most code, ships the privacy win immediately, and
   covers `analyzeImage`. *Highest value / lowest effort.*

2. **Phase 2 — Network lockdown.** Drop `AiSendConfirmDialog` for `'local'` (nothing to
   confirm) and lock `capabilities/default.json` to localhost-only for the AI path —
   the auditable guarantee.

3. **Phase 3 — MR-trained segmentation (Path B, TotalSegmentator-MRI / MONAI).** For
   precise `detectVertebrae`-style structured output on MR, stand up the MONAI/PyTorch
   sidecar from `PYTHON_ML_INTEGRATION.md`. Different runtime; keep it optional.

4. **Phase 4 (optional, on-prem GPU) — VILA-M3 agentic radiology.** Self-hosted NIM/Docker
   for institutions with a GPU server; OpenScans points at an in-network endpoint.

**Key takeaway:** llama.cpp (from Notesage) gives us the *VLM/chat* layer cheaply, but
the MR-trained, NVIDIA-grade segmentation models need a *second* runtime (MONAI/PyTorch
or NIM). Don't conflate the two — sequence them.

---

## 6. Open decisions

- **Bundle vs. require**: ship `llama-server` + a default GGUF (bigger installer) vs.
  detect an existing Ollama/LM Studio endpoint (Notesage supports both `local` and
  `local_bundled`).
- **Default medical model**: MedGemma 4B (medical-tuned) vs. a general Qwen2.5-VL.
- **Windows/Linux sidecar binaries**: Notesage currently bundles macOS only; we'd add
  the other triples to the download script + CI.
- **Detection on MR**: accept VLM-approximate markers (Phase 1) or wait for the MONAI
  sidecar (Phase 3) for clinically precise coordinates.

---

## 7. Sources

- Notesage: bundled llama-server sidecar, OpenAI-compatible routing, vision, network
  confinement (`PeterBlenessy/notesage`: `scripts/download-llama-server.sh`,
  `src/lib/ai/connections.ts`, `src/lib/ai/structured.ts`, `src-tauri/build.rs`,
  `src-tauri/src/commands/local_inference.rs`, `docs/prds/2026-06-12-local-ai-agents.md`)
- MedGemma GGUF on llama.cpp: huggingface.co/unsloth/medgemma-4b-it-GGUF,
  github.com/ggml-org/llama.cpp/blob/master/docs/multimodal.md
- TotalSegmentator MRI: pubs.rsna.org/doi/10.1148/radiol.241613, github.com/wasserth/TotalSegmentator
- MONAI Whole-Brain (133 structures, T1 MRI): Project-MONAI Model Zoo
- NVIDIA VISTA-3D / MAISI: docs.nvidia.com/nim/medical/vista3d, developer.nvidia.com (MONAI multimodal)
- VILA-M3 / Radiology Agent Framework: github.com/Project-MONAI/VLM-Radiology-Agent-Framework

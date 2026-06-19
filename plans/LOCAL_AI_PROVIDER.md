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

## 5. Product decisions (locked 2026-06-19)

- **Bundle only the `llama-server` binary.** No model weights in the installer.
- **Download models on demand** — the first time the user invokes an AI feature, fetch
  the model (with progress), then run. Same philosophy applies to the MR segmentation
  weights (and its runtime — see §6).
- **Preconfigured model name, with manual override.** Ship a sensible default model id;
  expose a text field where the user can type any other model id. **No model search /
  browse UI.**
- **MR precision is in scope** — we want clinically precise structured output on MR, not
  just VLM-approximate markers. This requires the segmentation runtime (§6), not just
  llama.cpp.

## 6. Recommendation — phased

1. **Phase 1 — Local VLM via bundled llama-server (Path A, MedGemma 4B default).**
   Port Notesage's sidecar + OpenAI-compatible routing. Add `'local'` provider behind the
   existing selector. **On first use**, download the preconfigured GGUF + `mmproj`
   projector to `~/.openscans/models/` (model id editable, no search). Covers
   `analyzeImage` and approximate `detectVertebrae`. *Highest value / lowest effort.*

2. **Phase 2 — Network lockdown.** Drop `AiSendConfirmDialog` for `'local'` (nothing to
   confirm) and lock `capabilities/default.json` to localhost-only for the AI path —
   the auditable guarantee.

3. **Phase 3 — MR precision (Path B, TotalSegmentator-MRI / MONAI Whole-Brain).** Precise
   `detectVertebrae`-style structured output on MR. **Runtime decided: on-demand Python
   engine (§6.1 Option A)** — a PyInstaller'd MONAI/TotalSegmentator-MRI CPU engine plus
   weights, downloaded on first MR use. Reuses `PYTHON_ML_INTEGRATION.md`.

4. **Phase 4 (optional, on-prem GPU) — VILA-M3 agentic radiology.** Self-hosted NIM/Docker
   for institutions with a GPU server; OpenScans points at an in-network endpoint.

**Key takeaway:** llama.cpp (from Notesage) gives us the *VLM/chat* layer cheaply, but
the MR-trained, NVIDIA-grade segmentation models need a *second* runtime. Don't conflate
the two — sequence them.

### 6.1 The one open decision — MR segmentation runtime

"Bundle only llama-server" collides with how MR segmentation models normally run.
TotalSegmentator-MRI / MONAI are **PyTorch (nnU-Net)** models — llama.cpp cannot run them.
Two ways to deliver MR precision while keeping the installer to just `llama-server`:

| Option | How | Pros | Cons |
|---|---|---|---|
| **A. On-demand Python engine ✅ CHOSEN** | PyInstaller'd MONAI/TotalSegmentator-MRI CPU engine, **downloaded on first MR use** (not bundled) + weights | Proven accuracy (Dice 0.839), reuses `PYTHON_ML_INTEGRATION.md`, fastest to working | Pulls a Python runtime onto the machine (~300 MB), even if downloaded not bundled |
| B. ONNX-in-Rust | Export the seg model to ONNX, run via the `ort` crate in `src-tauri` — no Python at all | Pure Rust, matches the "no Python" ethos of choosing llama.cpp | nnU-Net pre/post-processing is hard to reimplement faithfully; higher risk/effort; accuracy parity not guaranteed |

**Decision (2026-06-19): Option A.** Both the engine and weights download on first MR
use, so the installer still bundles only `llama-server`.

### 6.2 Remaining minor decisions (have sensible defaults)

- **Default VLM model id**: MedGemma 4B-IT (medical-tuned) — recommended default.
- **Windows/Linux sidecar binaries**: Notesage bundles macOS only; add other triples to
  the download script + CI.

---

## 7. Implementation status

**Phase 1 — application layer (done, this branch):**
- `'local'` provider added to `AIProvider` + `settingsStore` (`localModel`
  preconfigured to `medgemma-4b-it`, editable; `localPort` default 8080).
- `localVisionDetector.ts` — extends `BaseVisionDetector`, points the OpenAI SDK at
  `http://localhost:<port>/v1`, no API key, re-reads model/port from settings per call.
- Wired into `aiDetectorManager.getDetector()` (`case 'local'`).
- `useAiOperations` skips the `AiSendConfirmDialog` egress gate for `'local'` (zero egress).
- `errorHandler` understands `'local'` (server-not-running / model-not-downloaded copy).
- Settings UI: provider option + editable model id field + on-device privacy notice.
- ✅ `tsc --noEmit`, eslint, and the AI/settings unit tests all pass.

**Phase 1b — Tauri/Rust sidecar + downloads (done in code, not compile-verified here):**
- `externalBin: ["binaries/llama-server"]` in `tauri.conf.json`; `build.rs` writes a
  per-triple placeholder so dev/CI builds resolve the sidecar.
- `src-tauri/src/local_ai.rs` — Tauri commands `local_ai_model_status`,
  `local_ai_download_model` (streaming download + progress events to
  `<app_data>/models/llm/`), `local_ai_start` (spawn sidecar via shell plugin,
  `--mmproj`, `--jinja`, `--host 127.0.0.1`, then poll `/health`), `local_ai_stop`,
  `local_ai_status`. Registered desktop-only in `lib.rs`; killed on `RunEvent::Exit`.
- Built-in model registry (MedGemma 4B GGUF + mmproj). Manual model ids that aren't in
  the registry are assumed to target a self-managed server.
- `src/lib/ai/localServer.ts` — frontend bridge + `ensureLocalServer()` (download →
  start → ready), wired into `useAiOperations` for the `'local'` provider.
- `scripts/download-llama-server.sh` — host-platform sidecar fetch (macOS/Linux).
- CSP `connect-src` allows `http://localhost:*` / `http://127.0.0.1:*` for loopback.
- ⚠️ The Rust could NOT be compiled in the dev container (missing GTK/WebKit system
  libs — a Linux Tauri prerequisite). Needs `cargo check` / `tauri build` on a real
  platform. TS typecheck/lint/tests pass.
- Remaining polish: download-progress UI (currently console), win/linux sidecar CI.

**Phase 2 — network lockdown:** restrict `capabilities/default.json` to localhost for the
AI path (port Notesage's empty-allowlist pattern).

**Phase 3 — MR precision:** on-demand PyInstaller MONAI/TotalSegmentator-MRI engine + weights.

## 8. Sources

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

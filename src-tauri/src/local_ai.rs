//! Local AI (llama-server) sidecar lifecycle + on-demand model downloads.
//!
//! Desktop-only. The bundled `llama-server` (llama.cpp) is shipped as a Tauri
//! `externalBin` sidecar and spawned here on demand. Models are NOT bundled —
//! they are downloaded on first use to the app data dir. Everything runs on
//! loopback (`127.0.0.1`), so no image or data ever leaves the device.
//!
//! Exposed commands (see `lib.rs` invoke_handler):
//! - `local_ai_model_status(model)` — is the model present on disk?
//! - `local_ai_download_model(model)` — download GGUF + mmproj (emits progress)
//! - `local_ai_start(model, port)` — ensure spawned + ready, returns status
//! - `local_ai_stop()` — kill the sidecar
//! - `local_ai_status()` — current running state

use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State};

/// Event channel for download progress updates.
const DOWNLOAD_PROGRESS_EVENT: &str = "local-ai://download-progress";

/// Managed Tauri state holding the running sidecar (if any).
#[derive(Default)]
pub struct LocalAiState {
    inner: Mutex<LocalAiInner>,
}

#[derive(Default)]
struct LocalAiInner {
    child: Option<Child>,
    model: Option<String>,
    port: u16,
}

/// Download sources for a preconfigured model. Manual (user-typed) model ids
/// that are not in this registry are assumed to already be served by a
/// user-managed endpoint — auto-download only covers preconfigured models.
struct ModelSpec {
    gguf_url: &'static str,
    gguf_file: &'static str,
    mmproj_url: &'static str,
    mmproj_file: &'static str,
}

/// Built-in model registry.
///
/// NOTE: verify these exact asset filenames against the upstream repo before a
/// release — the projector quant (`F16`/`BF16`) in particular has varied. The
/// download logic itself is independent of these string values.
fn model_spec(model_id: &str) -> Option<ModelSpec> {
    match model_id {
        "medgemma-4b-it" => Some(ModelSpec {
            gguf_url: "https://huggingface.co/unsloth/medgemma-4b-it-GGUF/resolve/main/medgemma-4b-it-Q4_K_M.gguf",
            gguf_file: "medgemma-4b-it-Q4_K_M.gguf",
            mmproj_url: "https://huggingface.co/unsloth/medgemma-4b-it-GGUF/resolve/main/mmproj-F16.gguf",
            mmproj_file: "medgemma-4b-it-mmproj-F16.gguf",
        }),
        _ => None,
    }
}

/// `<app_data_dir>/models/llm`, created if missing.
fn models_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("models")
        .join("llm");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

#[derive(Serialize)]
pub struct ModelStatus {
    pub model: String,
    /// True when both the GGUF and its mmproj projector are present on disk.
    pub downloaded: bool,
    /// True when the model is in the built-in registry (auto-downloadable).
    pub known: bool,
}

#[derive(Serialize, Clone)]
pub struct ServerStatus {
    pub running: bool,
    pub model: Option<String>,
    pub port: u16,
}

#[derive(Serialize, Clone)]
struct DownloadProgress {
    /// Human-readable label of the file currently downloading.
    file: String,
    downloaded: u64,
    /// 0 when the server doesn't report a content length.
    total: u64,
}

#[tauri::command]
pub async fn local_ai_model_status(app: AppHandle, model: String) -> Result<ModelStatus, String> {
    let spec = model_spec(&model);
    let downloaded = match &spec {
        Some(s) => {
            let dir = models_dir(&app)?;
            dir.join(s.gguf_file).exists() && dir.join(s.mmproj_file).exists()
        }
        None => false,
    };
    Ok(ModelStatus {
        model,
        downloaded,
        known: spec.is_some(),
    })
}

/// Stream a URL to `dest`, emitting progress. Downloads to a `.part` file and
/// atomically renames on success so an interrupted download is never mistaken
/// for a complete one.
async fn download_file(app: &AppHandle, url: &str, dest: &Path, label: &str) -> Result<(), String> {
    use futures_util::StreamExt;
    use tokio::io::AsyncWriteExt;

    let tmp = dest.with_extension("part");
    let resp = reqwest::get(url).await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("Download failed ({}): HTTP {}", label, resp.status()));
    }
    let total = resp.content_length().unwrap_or(0);

    let mut file = tokio::fs::File::create(&tmp).await.map_err(|e| e.to_string())?;
    let mut downloaded: u64 = 0;
    let mut stream = resp.bytes_stream();
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        file.write_all(&chunk).await.map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;
        let _ = app.emit(
            DOWNLOAD_PROGRESS_EVENT,
            DownloadProgress {
                file: label.to_string(),
                downloaded,
                total,
            },
        );
    }
    file.flush().await.map_err(|e| e.to_string())?;
    drop(file);
    tokio::fs::rename(&tmp, dest).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn local_ai_download_model(app: AppHandle, model: String) -> Result<(), String> {
    let spec = model_spec(&model).ok_or_else(|| {
        format!(
            "Unknown model '{}'. Auto-download is only available for preconfigured models; \
             enter a model you have already installed for a self-managed server.",
            model
        )
    })?;
    let dir = models_dir(&app)?;

    let gguf = dir.join(spec.gguf_file);
    if !gguf.exists() {
        download_file(&app, spec.gguf_url, &gguf, "model").await?;
    }
    let mmproj = dir.join(spec.mmproj_file);
    if !mmproj.exists() {
        download_file(&app, spec.mmproj_url, &mmproj, "vision projector").await?;
    }
    Ok(())
}

/// Kill the running sidecar (if any) and clear state. Best-effort.
fn shutdown_inner(state: &LocalAiState) {
    let mut inner = state.inner.lock().unwrap();
    if let Some(mut child) = inner.child.take() {
        let _ = child.kill();
        let _ = child.wait();
    }
    inner.model = None;
    inner.port = 0;
}

/// Public shutdown hook for app exit (called from the run-loop in `lib.rs`).
pub fn shutdown(state: &LocalAiState) {
    shutdown_inner(state);
}

/// Poll `/health` until the server is ready or `max_secs` elapses.
async fn wait_until_ready(port: u16, max_secs: u64) -> Result<(), String> {
    let url = format!("http://127.0.0.1:{}/health", port);
    for _ in 0..(max_secs * 2) {
        if let Ok(resp) = reqwest::get(&url).await {
            if resp.status().is_success() {
                return Ok(());
            }
        }
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
    }
    Err("Local AI server did not become ready in time.".to_string())
}

/// Target-triple-suffixed sidecar filename, matching the `externalBin` entry
/// (e.g. `llama-server-aarch64-apple-darwin`).
fn sidecar_binary_name() -> String {
    let os = match std::env::consts::OS {
        "macos" => "apple-darwin",
        "linux" => "unknown-linux-gnu",
        "windows" => "pc-windows-msvc",
        other => other,
    };
    let ext = if std::env::consts::OS == "windows" { ".exe" } else { "" };
    format!("llama-server-{}-{}{}", std::env::consts::ARCH, os, ext)
}

/// Resolve the `llama-server` binary, preferring a location whose dylibs
/// (`lib/`) are co-located so the binary's `@executable_path/lib` rpath resolves.
///
/// The recent llama.cpp macOS/Linux builds are dynamically linked (a thin
/// launcher plus a dozen sibling dylibs), so we cannot lean on Tauri's sidecar
/// copy in `target/<profile>/` — it ships only the binary, not `lib/`. Resolve
/// order:
///   1. Next to the app executable (bundled `.app` keeps `lib/` beside it; in
///      dev that copy has no `lib/`, so it's skipped).
///   2. Dev fallback — `src-tauri/binaries/`, where `build-llama-server.sh`
///      installs the (self-contained) binary; any sibling `lib/` is honored too.
///   3. System `PATH` (a user-supplied server).
fn resolve_llama_server_binary() -> Result<PathBuf, String> {
    let name = sidecar_binary_name();
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|e| e.parent().map(Path::to_path_buf));

    if let Some(dir) = &exe_dir {
        // 1. Bundled sidecar next to the executable.
        let bundled = dir.join(&name);
        if bundled.exists() {
            let is_dev = dir.to_string_lossy().contains("/target/");
            if !is_dev || dir.join("lib").exists() {
                return Ok(bundled);
            }
        }
        // 2. Dev fallback: src-tauri/binaries/ (binary + lib/ live together).
        if let Some(src_tauri) = dir.parent().and_then(Path::parent) {
            let dev = src_tauri.join("binaries").join(&name);
            if dev.exists() {
                return Ok(dev);
            }
        }
    }

    // 3. System PATH.
    if let Ok(out) = Command::new("which").arg("llama-server").output() {
        if out.status.success() {
            let p = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !p.is_empty() {
                return Ok(PathBuf::from(p));
            }
        }
    }

    Err("llama-server binary not found (expected a bundled sidecar or one on PATH).".to_string())
}

#[tauri::command]
pub async fn local_ai_start(
    app: AppHandle,
    state: State<'_, LocalAiState>,
    model: String,
    port: u16,
) -> Result<ServerStatus, String> {
    // Already running with the requested model? Reuse it.
    {
        let inner = state.inner.lock().unwrap();
        if inner.child.is_some() && inner.model.as_deref() == Some(model.as_str()) {
            return Ok(ServerStatus {
                running: true,
                model: inner.model.clone(),
                port: inner.port,
            });
        }
    }
    // Switching models (or starting fresh): stop any existing instance first.
    shutdown_inner(&state);

    let spec = model_spec(&model)
        .ok_or_else(|| format!("Unknown model '{}'. Download it or run your own server.", model))?;
    let dir = models_dir(&app)?;
    let gguf = dir.join(spec.gguf_file);
    let mmproj = dir.join(spec.mmproj_file);
    if !gguf.exists() || !mmproj.exists() {
        return Err("Model not downloaded yet.".to_string());
    }

    // Resolve and spawn the bundled sidecar ourselves (not via Tauri's
    // `externalBin` runner) so we run it from a directory that also has its
    // `lib/` dylibs — Tauri's copy in `target/<profile>/` does not. `--jinja`
    // enables native tool/chat templates.
    let binary = resolve_llama_server_binary()?;
    log::info!(target: "openscans::local_ai", "starting llama-server: {}", binary.display());

    let mut cmd = Command::new(&binary);
    cmd.args([
        "-m",
        gguf.to_string_lossy().as_ref(),
        "--mmproj",
        mmproj.to_string_lossy().as_ref(),
        "--host",
        "127.0.0.1",
        "--port",
        &port.to_string(),
        "--jinja",
    ])
    .stdout(Stdio::null())
    .stderr(Stdio::inherit());

    // Dynamically-linked builds keep their dylibs in `lib/` next to the binary.
    // The binary's `@executable_path/lib` rpath already covers that; set the
    // loader search path too as a belt-and-suspenders for servers whose rpath
    // is absent (e.g. a user-supplied build with sibling dylibs).
    if let Some(bin_dir) = binary.parent() {
        let lib_dir = bin_dir.join("lib");
        if lib_dir.exists() {
            #[cfg(target_os = "macos")]
            cmd.env("DYLD_LIBRARY_PATH", &lib_dir);
            #[cfg(target_os = "linux")]
            cmd.env("LD_LIBRARY_PATH", &lib_dir);
        }
    }

    let child = cmd
        .spawn()
        .map_err(|e| format!("Failed to start llama-server ({}): {e}", binary.display()))?;

    {
        let mut inner = state.inner.lock().unwrap();
        inner.child = Some(child);
        inner.model = Some(model.clone());
        inner.port = port;
    }

    if let Err(e) = wait_until_ready(port, 90).await {
        // Don't leave a half-started server around if it never became ready.
        shutdown_inner(&state);
        return Err(e);
    }

    Ok(ServerStatus {
        running: true,
        model: Some(model),
        port,
    })
}

#[tauri::command]
pub async fn local_ai_stop(state: State<'_, LocalAiState>) -> Result<(), String> {
    shutdown_inner(&state);
    Ok(())
}

#[tauri::command]
pub fn local_ai_status(state: State<'_, LocalAiState>) -> ServerStatus {
    let inner = state.inner.lock().unwrap();
    ServerStatus {
        running: inner.child.is_some(),
        model: inner.model.clone(),
        port: inner.port,
    }
}

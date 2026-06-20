//! MR-precision segmentation engine (Phase 3) — app-owned install + run.
//!
//! Desktop-only. The engine is the TotalSegmentator-MRI wrapper in
//! `python-engine/mr_segmentation/run.py`. The app OWNS THE INSTALLATION but
//! does NOT bundle the Python libs: on first use it downloads `uv` (a single
//! static binary), uses it to install a standalone Python + the engine's deps
//! into the app data dir, then runs `run.py` over a DICOM series. Everything
//! runs locally — no data leaves the device.

use std::path::{Path, PathBuf};

use serde::Serialize;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Emitter, Manager};

const MR_PROGRESS_EVENT: &str = "mr-seg://download-progress";

/// Pinned versions for reproducible provisioning.
const UV_VERSION: &str = "0.11.23";
const PYTHON_VERSION: &str = "3.13";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

fn engine_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("mr-engine");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn uv_binary(app: &AppHandle) -> Result<PathBuf, String> {
    let name = if cfg!(windows) { "uv.exe" } else { "uv" };
    Ok(engine_dir(app)?.join("bin").join(name))
}

fn venv_python(app: &AppHandle) -> Result<PathBuf, String> {
    let venv = engine_dir(app)?.join(".venv");
    Ok(if cfg!(windows) {
        venv.join("Scripts").join("python.exe")
    } else {
        venv.join("bin").join("python")
    })
}

fn weights_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(engine_dir(app)?.join("weights"))
}

/// (uv release target-triple, archive extension).
fn uv_asset() -> Option<(&'static str, &'static str)> {
    match (std::env::consts::OS, std::env::consts::ARCH) {
        ("macos", "aarch64") => Some(("aarch64-apple-darwin", "tar.gz")),
        ("macos", "x86_64") => Some(("x86_64-apple-darwin", "tar.gz")),
        ("linux", "x86_64") => Some(("x86_64-unknown-linux-gnu", "tar.gz")),
        ("linux", "aarch64") => Some(("aarch64-unknown-linux-gnu", "tar.gz")),
        ("windows", "x86_64") => Some(("x86_64-pc-windows-msvc", "zip")),
        _ => None,
    }
}

/// Resolve a bundled engine resource (`run.py`, `requirements.txt`): prefer the
/// app's resource dir, fall back to the dev source tree (survives cargo clean).
fn engine_resource(app: &AppHandle, name: &str) -> Result<PathBuf, String> {
    if let Ok(p) = app.path().resolve(
        format!("python-engine/mr_segmentation/{name}"),
        BaseDirectory::Resource,
    ) {
        if p.exists() {
            return Ok(p);
        }
    }
    // Dev: <repo>/src-tauri/target/<profile>/app -> <repo>/python-engine/...
    if let Ok(exe) = std::env::current_exe() {
        if let Some(src_tauri) = exe.parent().and_then(Path::parent).and_then(Path::parent) {
            if let Some(root) = src_tauri.parent() {
                let p = root
                    .join("python-engine")
                    .join("mr_segmentation")
                    .join(name);
                if p.exists() {
                    return Ok(p);
                }
            }
        }
    }
    Err(format!("MR engine resource not found: {name}"))
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MrEngineStatus {
    /// The managed Python env (with the engine deps) is provisioned.
    pub engine_ready: bool,
    /// The model weights are present (populated on the engine's first run).
    pub model_ready: bool,
}

#[derive(Serialize, Clone)]
struct Progress {
    file: String,
    downloaded: u64,
    total: u64,
}

fn emit_stage(app: &AppHandle, stage: &str) {
    let _ = app.emit(
        MR_PROGRESS_EVENT,
        Progress {
            file: stage.to_string(),
            downloaded: 0,
            total: 0,
        },
    );
}

#[tauri::command]
pub fn mr_seg_status(app: AppHandle) -> Result<MrEngineStatus, String> {
    let py = venv_python(&app)?;
    let weights = weights_dir(&app)?;
    let model_ready = weights.is_dir()
        && std::fs::read_dir(&weights)
            .map(|mut e| e.next().is_some())
            .unwrap_or(false);
    Ok(MrEngineStatus {
        engine_ready: py.exists(),
        model_ready,
    })
}

// ---------------------------------------------------------------------------
// Provisioning
// ---------------------------------------------------------------------------

/// Stream a URL to `dest` with progress, via a `.part` temp + atomic rename.
async fn download_file(app: &AppHandle, url: &str, dest: &Path, label: &str) -> Result<(), String> {
    use futures_util::StreamExt;
    use tokio::io::AsyncWriteExt;

    if let Some(parent) = dest.parent() {
        tokio::fs::create_dir_all(parent).await.map_err(|e| e.to_string())?;
    }
    let tmp = dest.with_extension("part");
    let resp = reqwest::get(url).await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("Download failed ({label}): HTTP {}", resp.status()));
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
            MR_PROGRESS_EVENT,
            Progress {
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

/// Ensure the `uv` binary is installed in the app data dir.
async fn ensure_uv(app: &AppHandle) -> Result<PathBuf, String> {
    let uv = uv_binary(app)?;
    if uv.exists() {
        return Ok(uv);
    }
    let (triple, ext) = uv_asset().ok_or_else(|| {
        format!(
            "No uv build for this platform ({} {}).",
            std::env::consts::OS,
            std::env::consts::ARCH
        )
    })?;
    emit_stage(app, "Installing uv");
    let url = format!(
        "https://github.com/astral-sh/uv/releases/download/{UV_VERSION}/uv-{triple}.{ext}"
    );
    let dir = engine_dir(app)?;
    let archive = dir.join(format!("uv.{ext}"));
    download_file(app, &url, &archive, "uv").await?;

    // Extract (uv-<triple>/uv[.exe] inside the archive).
    let extract = dir.join("uv-extract");
    let _ = tokio::fs::remove_dir_all(&extract).await;
    tokio::fs::create_dir_all(&extract).await.map_err(|e| e.to_string())?;
    let status = if ext == "zip" {
        tokio::process::Command::new("tar") // bsdtar handles zip on win/mac
            .arg("-xf")
            .arg(&archive)
            .arg("-C")
            .arg(&extract)
            .status()
            .await
    } else {
        tokio::process::Command::new("tar")
            .arg("-xzf")
            .arg(&archive)
            .arg("-C")
            .arg(&extract)
            .status()
            .await
    }
    .map_err(|e| e.to_string())?;
    if !status.success() {
        return Err("Failed to extract uv archive".to_string());
    }

    // Find the uv binary inside the extracted tree and move it into bin/.
    let bin_name = if cfg!(windows) { "uv.exe" } else { "uv" };
    let found = find_file(&extract, bin_name).ok_or("uv binary not found in archive")?;
    if let Some(parent) = uv.parent() {
        tokio::fs::create_dir_all(parent).await.map_err(|e| e.to_string())?;
    }
    tokio::fs::rename(&found, &uv).await.map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(&uv, std::fs::Permissions::from_mode(0o755));
    }
    let _ = tokio::fs::remove_dir_all(&extract).await;
    let _ = tokio::fs::remove_file(&archive).await;
    Ok(uv)
}

fn find_file(dir: &Path, name: &str) -> Option<PathBuf> {
    let entries = std::fs::read_dir(dir).ok()?;
    for e in entries.flatten() {
        let p = e.path();
        if p.is_dir() {
            if let Some(hit) = find_file(&p, name) {
                return Some(hit);
            }
        } else if p.file_name().and_then(|n| n.to_str()) == Some(name) {
            return Some(p);
        }
    }
    None
}

/// Ensure the managed Python env exists and the engine deps are installed.
async fn ensure_env(app: &AppHandle) -> Result<PathBuf, String> {
    let py = venv_python(app)?;
    if py.exists() {
        return Ok(py);
    }
    let uv = ensure_uv(app).await?;
    let dir = engine_dir(app)?;
    let venv = dir.join(".venv");

    // 1. Install a standalone Python (covers a host with none).
    emit_stage(app, "Installing Python");
    run_uv(&uv, &["python", "install", PYTHON_VERSION], &dir).await?;

    // 2. Create the venv with that Python.
    emit_stage(app, "Creating environment");
    run_uv(
        &uv,
        &[
            "venv",
            venv.to_string_lossy().as_ref(),
            "--python",
            PYTHON_VERSION,
        ],
        &dir,
    )
    .await?;

    // 3. Install the engine deps into the venv.
    emit_stage(app, "Installing engine (this can take a few minutes)");
    let requirements = engine_resource(app, "requirements.txt")?;
    run_uv(
        &uv,
        &[
            "pip",
            "install",
            "--python",
            py.to_string_lossy().as_ref(),
            "-r",
            requirements.to_string_lossy().as_ref(),
        ],
        &dir,
    )
    .await?;

    Ok(py)
}

/// Run a `uv` subcommand fully isolated to the app's engine dir: the standalone
/// Python (`uv-python`) and the package cache (`uv-cache`) both live under it,
/// so nothing is shared with other apps and Remove reclaims everything.
async fn run_uv(uv: &Path, args: &[&str], dir: &Path) -> Result<(), String> {
    let out = tokio::process::Command::new(uv)
        .args(args)
        .env("UV_PYTHON_INSTALL_DIR", dir.join("uv-python"))
        .env("UV_CACHE_DIR", dir.join("uv-cache"))
        .output()
        .await
        .map_err(|e| e.to_string())?;
    if !out.status.success() {
        let stderr = String::from_utf8_lossy(&out.stderr);
        return Err(format!(
            "uv {} failed: {}",
            args.first().copied().unwrap_or(""),
            stderr.lines().last().unwrap_or("").trim()
        ));
    }
    Ok(())
}

#[tauri::command]
pub async fn mr_seg_download(app: AppHandle) -> Result<(), String> {
    // "Download" now means: provision the app-owned Python env + engine deps.
    ensure_env(&app).await?;
    Ok(())
}

/// Remove the entire provisioned engine — uv, the standalone Python, the venv,
/// the package cache, and the weights all live under the app's engine dir, so
/// this reclaims everything (nothing is shared with other apps).
#[tauri::command]
pub async fn mr_seg_remove(app: AppHandle) -> Result<(), String> {
    let dir = engine_dir(&app)?;
    tokio::fs::remove_dir_all(&dir).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn mr_seg_run(
    app: AppHandle,
    series_dir: String,
    series_uid: Option<String>,
) -> Result<serde_json::Value, String> {
    let py = ensure_env(&app).await?;
    let script = engine_resource(&app, "run.py")?;
    let dir = engine_dir(&app)?;
    let out = dir.join("last-result.json");
    let weights = weights_dir(&app)?;

    emit_stage(&app, "Segmenting");
    let mut cmd = tokio::process::Command::new(&py);
    cmd.arg(&script)
        .arg("--series")
        .arg(&series_dir)
        .arg("--out")
        .arg(&out)
        // First run downloads the model weights here; later runs stay offline.
        .env("TOTALSEG_HOME_DIR", &weights);
    if let Some(uid) = series_uid {
        cmd.arg("--series-uid").arg(uid);
    }

    let result = cmd.output().await.map_err(|e| e.to_string())?;
    if !result.status.success() {
        let stderr = String::from_utf8_lossy(&result.stderr);
        return Err(format!(
            "MR engine failed: {}",
            stderr.lines().last().unwrap_or("unknown error").trim()
        ));
    }

    let text = tokio::fs::read_to_string(&out).await.map_err(|e| e.to_string())?;
    serde_json::from_str(&text).map_err(|e| e.to_string())
}

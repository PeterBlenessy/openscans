//! MR-precision segmentation engine (Phase 3) — on-demand download + run.
//!
//! Desktop-only. The engine is a PyInstaller'd TotalSegmentator-MRI runtime
//! (see `python-engine/mr_segmentation/`). It is NOT bundled: `mr_seg_download`
//! fetches the per-platform binary on first use into the app data dir, and
//! `mr_seg_run` executes it over a DICOM series directory, returning the
//! landmark JSON contract. Everything runs locally — no data leaves the device.

use std::path::{Path, PathBuf};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};

const MR_DOWNLOAD_PROGRESS_EVENT: &str = "mr-seg://download-progress";

/// Per-platform engine artifact. Built + published by the engine pipeline.
///
/// NOTE: placeholder release URLs — wire these to real artifacts when the
/// PyInstaller build/publish pipeline lands (see plans/LOCAL_AI_PROVIDER.md).
fn engine_url() -> Option<&'static str> {
    match (std::env::consts::OS, std::env::consts::ARCH) {
        ("macos", "aarch64") => Some("https://github.com/PeterBlenessy/openscans/releases/download/mr-engine/mr-segmentation-aarch64-apple-darwin"),
        ("macos", "x86_64") => Some("https://github.com/PeterBlenessy/openscans/releases/download/mr-engine/mr-segmentation-x86_64-apple-darwin"),
        ("linux", "x86_64") => Some("https://github.com/PeterBlenessy/openscans/releases/download/mr-engine/mr-segmentation-x86_64-unknown-linux-gnu"),
        ("windows", "x86_64") => Some("https://github.com/PeterBlenessy/openscans/releases/download/mr-engine/mr-segmentation-x86_64-pc-windows-msvc.exe"),
        _ => None,
    }
}

fn engine_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("engines")
        .join("mr-segmentation");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn engine_binary(app: &AppHandle) -> Result<PathBuf, String> {
    let name = if cfg!(windows) { "mr-segmentation.exe" } else { "mr-segmentation" };
    Ok(engine_dir(app)?.join(name))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MrEngineStatus {
    /// The engine binary is present on disk.
    pub engine_ready: bool,
    /// The model weights are present (populated on the engine's first run).
    pub model_ready: bool,
}

#[derive(Serialize, Clone)]
struct DownloadProgress {
    file: String,
    downloaded: u64,
    total: u64,
}

#[tauri::command]
pub fn mr_seg_status(app: AppHandle) -> Result<MrEngineStatus, String> {
    let bin = engine_binary(&app)?;
    let weights = engine_dir(&app)?.join("weights");
    let model_ready = weights.is_dir()
        && std::fs::read_dir(&weights)
            .map(|mut e| e.next().is_some())
            .unwrap_or(false);
    Ok(MrEngineStatus {
        engine_ready: bin.exists(),
        model_ready,
    })
}

/// Stream a URL to `dest` with progress, via a `.part` temp + atomic rename.
async fn download_file(app: &AppHandle, url: &str, dest: &Path, label: &str) -> Result<(), String> {
    use futures_util::StreamExt;
    use tokio::io::AsyncWriteExt;

    let tmp = dest.with_extension("part");
    let resp = reqwest::get(url).await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        // A 404 means the asset was never published — the MR-precision engine is
        // a separate (Phase 3) build that may not exist yet. Say so plainly
        // instead of surfacing a cryptic HTTP status to the user.
        if resp.status() == reqwest::StatusCode::NOT_FOUND {
            return Err(format!(
                "MR-precision segmentation isn't available yet — the {} hasn't been \
                 published for this platform. (Vertebra detection and radiology \
                 analysis work without it.)",
                label
            ));
        }
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
            MR_DOWNLOAD_PROGRESS_EVENT,
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
pub async fn mr_seg_download(app: AppHandle) -> Result<(), String> {
    let url = engine_url().ok_or_else(|| {
        format!(
            "No MR engine build for this platform ({} {}).",
            std::env::consts::OS,
            std::env::consts::ARCH
        )
    })?;
    let bin = engine_binary(&app)?;
    if !bin.exists() {
        download_file(&app, url, &bin, "MR engine").await?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let _ = std::fs::set_permissions(&bin, std::fs::Permissions::from_mode(0o755));
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn mr_seg_run(
    app: AppHandle,
    series_dir: String,
    series_uid: Option<String>,
) -> Result<serde_json::Value, String> {
    let bin = engine_binary(&app)?;
    if !bin.exists() {
        return Err("MR engine not downloaded yet.".to_string());
    }
    let dir = engine_dir(&app)?;
    let out = dir.join("last-result.json");
    let weights = dir.join("weights");

    // Point TotalSegmentator's weights cache into our engine dir so first-run
    // weights land in a known place and later runs stay offline.
    let mut cmd = tokio::process::Command::new(&bin);
    cmd.arg("--series")
        .arg(&series_dir)
        .arg("--out")
        .arg(&out)
        .env("TOTALSEG_HOME_DIR", &weights);
    if let Some(uid) = series_uid {
        cmd.arg("--series-uid").arg(uid);
    }

    let status = cmd.status().await.map_err(|e| e.to_string())?;
    if !status.success() {
        return Err(format!("MR engine exited with status {}", status));
    }

    let text = tokio::fs::read_to_string(&out).await.map_err(|e| e.to_string())?;
    serde_json::from_str(&text).map_err(|e| e.to_string())
}

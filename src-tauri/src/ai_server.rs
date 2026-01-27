use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use serde::{Deserialize, Serialize};
use std::process::{Child, Command, Stdio};

/// AI server state
pub struct AIServerState {
    pub process: Mutex<Option<Child>>,
    pub port: u16,
}

impl AIServerState {
    pub fn new() -> Self {
        Self {
            process: Mutex::new(None),
            port: 8000,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServerStatus {
    pub running: bool,
    pub port: u16,
    pub version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VertebraeResult {
    pub success: bool,
    pub vertebrae: Vec<Vertebra>,
    pub processing_time_ms: f64,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Vertebra {
    pub label: String,
    pub center: Point3D,
    pub confidence: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Point3D {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

/// Start the AI inference server sidecar
#[tauri::command]
pub async fn start_ai_server(app: AppHandle) -> Result<ServerStatus, String> {
    let state = app.state::<AIServerState>();

    // Check if already running
    {
        let process_lock = state.process.lock().unwrap();
        if process_lock.is_some() {
            return Ok(ServerStatus {
                running: true,
                port: state.port,
                version: "1.0.0".to_string(),
            });
        }
    }

    // Get the sidecar path
    let sidecar_path = app
        .path()
        .resolve("openscans-inference", tauri::path::BaseDirectory::Resource)
        .map_err(|e| format!("Failed to resolve sidecar path: {}", e))?;

    log::info!("[AI Server] Starting sidecar at: {:?}", sidecar_path);

    // Start the sidecar process
    let child = Command::new(sidecar_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn sidecar: {}", e))?;

    log::info!("[AI Server] Sidecar process started with PID: {}", child.id());

    // Store the child process
    {
        let mut process_lock = state.process.lock().unwrap();
        *process_lock = Some(child);
    }

    // Wait for server to start (Python+FastAPI takes ~10 seconds)
    tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;

    // Check if server is responding
    match check_server_health(state.port).await {
        Ok(_) => {
            log::info!("[AI Server] Health check passed");
            Ok(ServerStatus {
                running: true,
                port: state.port,
                version: "1.0.0".to_string(),
            })
        }
        Err(e) => {
            log::error!("[AI Server] Health check failed: {}", e);
            Err(format!("Server started but health check failed: {}", e))
        }
    }
}

/// Stop the AI inference server
#[tauri::command]
pub async fn stop_ai_server(app: AppHandle) -> Result<(), String> {
    let state = app.state::<AIServerState>();

    let mut process_lock = state.process.lock().unwrap();

    if let Some(mut child) = process_lock.take() {
        child.kill().map_err(|e| format!("Failed to kill process: {}", e))?;
        log::info!("[AI Server] Stopped");
    }

    Ok(())
}

/// Get AI server status
#[tauri::command]
pub async fn get_server_status(app: AppHandle) -> Result<ServerStatus, String> {
    let state = app.state::<AIServerState>();

    let running = {
        let process_lock = state.process.lock().unwrap();
        process_lock.is_some()
    }; // Lock is dropped here

    if running {
        // Verify server is actually responding
        match check_server_health(state.port).await {
            Ok(_) => Ok(ServerStatus {
                running: true,
                port: state.port,
                version: "1.0.0".to_string(),
            }),
            Err(_) => Ok(ServerStatus {
                running: false,
                port: state.port,
                version: "1.0.0".to_string(),
            }),
        }
    } else {
        Ok(ServerStatus {
            running: false,
            port: state.port,
            version: "1.0.0".to_string(),
        })
    }
}

/// Detect vertebrae in a DICOM file
#[tauri::command]
pub async fn detect_vertebrae(
    app: AppHandle,
    file_path: String,
) -> Result<VertebraeResult, String> {
    let state = app.state::<AIServerState>();

    // Ensure server is running
    {
        let process_lock = state.process.lock().unwrap();
        if process_lock.is_none() {
            return Err("AI server is not running".to_string());
        }
    }

    // Call the Python API
    let client = reqwest::Client::new();
    let url = format!("http://127.0.0.1:{}/api/detect-vertebrae", state.port);

    let payload = serde_json::json!({
        "file_path": file_path,
        "fast_mode": true,
    });

    let response = client
        .post(&url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("API error ({}): {}", status, error_text));
    }

    let result: VertebraeResult = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(result)
}

/// Check if the AI server is healthy
async fn check_server_health(port: u16) -> Result<(), String> {
    let client = reqwest::Client::new();
    let url = format!("http://127.0.0.1:{}/api/health", port);

    let response = client
        .get(&url)
        .timeout(std::time::Duration::from_secs(2))
        .send()
        .await
        .map_err(|e| format!("Health check failed: {}", e))?;

    if response.status().is_success() {
        Ok(())
    } else {
        Err(format!("Health check returned status: {}", response.status()))
    }
}

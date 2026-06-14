/// Update information returned to the frontend by `check_for_update`.
#[cfg(desktop)]
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
  version: String,
  current_version: String,
  notes: Option<String>,
  date: Option<String>,
}

/// Check the configured updater endpoint for a newer release.
///
/// Returns `Ok(Some(..))` when an update is available, `Ok(None)` when the app
/// is up to date, and `Err(..)` when the updater is not configured (e.g. no
/// signing pubkey yet) or the check fails. The frontend treats `Err` as "no
/// update" so the desktop app keeps working before update signing is set up.
#[cfg(desktop)]
#[tauri::command]
async fn check_for_update(app: tauri::AppHandle) -> Result<Option<UpdateInfo>, String> {
  use tauri_plugin_updater::UpdaterExt;

  let updater = app.updater().map_err(|e| e.to_string())?;
  let update = updater.check().await.map_err(|e| e.to_string())?;

  Ok(update.map(|u| UpdateInfo {
    version: u.version.clone(),
    current_version: u.current_version.clone(),
    notes: u.body.clone(),
    date: u.date.map(|d| d.to_string()),
  }))
}

/// Download and install the available update, then relaunch the app.
#[cfg(desktop)]
#[tauri::command]
async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
  use tauri_plugin_updater::UpdaterExt;

  let updater = app.updater().map_err(|e| e.to_string())?;
  let update = updater.check().await.map_err(|e| e.to_string())?;

  if let Some(update) = update {
    update
      .download_and_install(|_chunk, _total| {}, || {})
      .await
      .map_err(|e| e.to_string())?;
    app.restart();
  }

  Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let builder = tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_shell::init());

  // The updater is a desktop-only concern; the web build never reaches this
  // code, and mobile targets don't ship the updater plugin.
  #[cfg(desktop)]
  let builder = builder
    .plugin(tauri_plugin_updater::Builder::new().build())
    .invoke_handler(tauri::generate_handler![check_for_update, install_update]);

  builder
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

use keyring::Entry;

/// Fixed keyring service namespace for all OpenScans credentials.
const KEYRING_SERVICE: &str = "openscans";

/// Build a keyring entry for the given account/service name under the
/// OpenScans namespace.
fn credential_entry(service: &str) -> Result<Entry, String> {
  Entry::new(KEYRING_SERVICE, service).map_err(|e| e.to_string())
}

/// Store a credential in the OS keychain.
///
/// `service` is used as the entry account/username under the fixed
/// "openscans" keyring service.
#[tauri::command]
fn store_credential(service: String, key: String) -> Result<(), String> {
  let entry = credential_entry(&service)?;
  entry.set_password(&key).map_err(|e| e.to_string())
}

/// Retrieve a credential from the OS keychain.
///
/// Returns `Ok(None)` when no entry exists for `service`.
#[tauri::command]
fn get_credential(service: String) -> Result<Option<String>, String> {
  let entry = credential_entry(&service)?;
  match entry.get_password() {
    Ok(password) => Ok(Some(password)),
    Err(keyring::Error::NoEntry) => Ok(None),
    Err(e) => Err(e.to_string()),
  }
}

/// Delete a credential from the OS keychain.
///
/// Treats a missing entry as success (idempotent delete).
#[tauri::command]
fn delete_credential(service: String) -> Result<(), String> {
  let entry = credential_entry(&service)?;
  match entry.delete_credential() {
    Ok(()) => Ok(()),
    Err(keyring::Error::NoEntry) => Ok(()),
    Err(e) => Err(e.to_string()),
  }
}

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

  // Desktop also ships the updater plugin + its commands; the web build never
  // reaches this code, and mobile targets don't ship the updater plugin.
  #[cfg(desktop)]
  let builder = builder
    .plugin(tauri_plugin_updater::Builder::new().build())
    .invoke_handler(tauri::generate_handler![
      store_credential,
      get_credential,
      delete_credential,
      check_for_update,
      install_update
    ]);

  #[cfg(not(desktop))]
  let builder = builder.invoke_handler(tauri::generate_handler![
    store_credential,
    get_credential,
    delete_credential
  ]);

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

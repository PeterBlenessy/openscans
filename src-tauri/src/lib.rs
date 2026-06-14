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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![
      store_credential,
      get_credential,
      delete_credential
    ])
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

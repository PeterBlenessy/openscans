mod ai_server;

use ai_server::AIServerState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .manage(AIServerState::new())
    .invoke_handler(tauri::generate_handler![
      ai_server::start_ai_server,
      ai_server::stop_ai_server,
      ai_server::get_server_status,
      ai_server::detect_vertebrae,
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Start AI server on app startup
      let app_handle = app.handle().clone();
      tauri::async_runtime::spawn(async move {
        match ai_server::start_ai_server(app_handle).await {
          Ok(status) => {
            log::info!("AI server started successfully on port {}", status.port);
          }
          Err(e) => {
            log::error!("Failed to start AI server: {}", e);
          }
        }
      });

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

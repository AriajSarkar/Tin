mod archiver;
mod commands;
mod db;
mod errors;
mod models;

use commands::*;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");

            db::init_db(app_data_dir).expect("Failed to initialize database");

            tauri::async_runtime::spawn(archiver::start_archiver());

            // Debug-only: Enable logging plugin
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Debug-only: Open devtools on main window
            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_cards,
            list_archived_cards,
            get_card,
            create_card,
            update_card,
            delete_card,
            add_todo,
            update_todo,
            delete_todo,
            search,
            recent_changes,
            archive_card,
            unarchive_card,
            archive_old_cards,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

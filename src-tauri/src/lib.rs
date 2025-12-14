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
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");

            db::init_db(app_data_dir).expect("Failed to initialize database");

            tauri::async_runtime::spawn(archiver::start_archiver());

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_cards,
            get_card,
            create_card,
            update_card,
            delete_card,
            add_todo,
            update_todo,
            delete_todo,
            search,
            recent_changes,
            archive_old_cards,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

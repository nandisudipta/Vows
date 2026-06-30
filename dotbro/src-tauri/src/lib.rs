mod commands;
mod database;
mod error;

use std::sync::Mutex;
use std::process::Command;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let db = database::init_database(app.handle())?;
            
            // Resolve database file path for Python listener daemon
            let db_path = app
                .path()
                .app_data_dir()
                .map(|path| path.join("dotbro.db"))
                .unwrap_or_default();

            app.manage(Mutex::new(db));

            // Spawn local network emergency broadcast P2P listener daemon in background
            std::thread::spawn(move || {
                let mut python_script = std::path::PathBuf::from("src-python/emergency_comms.py");
                if !python_script.exists() {
                    python_script = std::path::PathBuf::from("../src-python/emergency_comms.py");
                }
                if python_script.exists() && db_path.exists() {
                    let _ = Command::new("python3")
                        .arg(python_script)
                        .arg(db_path)
                        .arg("listen")
                        .spawn();
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::conversations::list_conversations,
            commands::conversations::get_conversation,
            commands::conversations::create_conversation,
            commands::conversations::rename_conversation,
            commands::conversations::delete_conversation,
            commands::messages::list_messages,
            commands::messages::create_message,
            commands::messages::search_messages,
            commands::contacts::list_contacts,
            commands::contacts::get_contact,
            commands::contacts::create_contact,
            commands::contacts::update_contact,
            commands::contacts::delete_contact,
            commands::contacts::search_contacts,
            commands::memories::list_memories,
            commands::memories::get_memory,
            commands::memories::create_memory,
            commands::memories::update_memory,
            commands::memories::delete_memory,
            commands::memories::search_memories,
            commands::settings::get_setting,
            commands::settings::get_all_settings,
            commands::settings::set_setting,
            commands::ai::check_ollama_status,
            commands::ai::list_models,
            commands::emergency::send_emergency_message,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

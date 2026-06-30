pub mod migrations;
pub mod models;

use crate::error::AppError;
use rusqlite::Connection;
use std::fs;

pub fn init_database(app_handle: &tauri::AppHandle) -> Result<Connection, AppError> {
    use tauri::Manager;
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Io(e.to_string()))?;
    fs::create_dir_all(&app_dir)?;
    let db_path = app_dir.join("dotbro.db");
    let conn = Connection::open(db_path)?;
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
    migrations::run_migrations(&conn)?;
    Ok(conn)
}

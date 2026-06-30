use crate::database::models::Setting;
use crate::error::AppError;
use rusqlite::params;
use std::sync::Mutex;

#[tauri::command]
pub fn get_setting(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
    key: String,
) -> Result<Setting, AppError> {
    let conn = db.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT key, value, updated_at FROM settings WHERE key = ?1",
    )?;
    let setting = stmt
        .query_row(params![key], |row| {
            Ok(Setting {
                key: row.get(0)?,
                value: row.get(1)?,
                updated_at: row.get(2)?,
            })
        })
        .map_err(|_| AppError::NotFound(format!("Setting '{}' not found", key)))?;
    Ok(setting)
}

#[tauri::command]
pub fn get_all_settings(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
) -> Result<Vec<Setting>, AppError> {
    let conn = db.lock().unwrap();
    let mut stmt = conn.prepare("SELECT key, value, updated_at FROM settings")?;
    let rows = stmt.query_map([], |row| {
        Ok(Setting {
            key: row.get(0)?,
            value: row.get(1)?,
            updated_at: row.get(2)?,
        })
    })?;
    let mut settings = Vec::new();
    for row in rows {
        settings.push(row?);
    }
    Ok(settings)
}

#[tauri::command]
pub fn set_setting(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
    key: String,
    value: String,
) -> Result<Setting, AppError> {
    let conn = db.lock().unwrap();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3)",
        params![key, value, now],
    )?;
    Ok(Setting {
        key,
        value,
        updated_at: now,
    })
}

use crate::database::models::{Conversation, CreateConversation};
use crate::error::AppError;
use rusqlite::params;
use std::sync::Mutex;

#[tauri::command]
pub fn list_conversations(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
) -> Result<Vec<Conversation>, AppError> {
    let conn = db.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(Conversation {
            id: row.get(0)?,
            title: row.get(1)?,
            created_at: row.get(2)?,
            updated_at: row.get(3)?,
        })
    })?;
    let mut conversations = Vec::new();
    for row in rows {
        conversations.push(row?);
    }
    Ok(conversations)
}

#[tauri::command]
pub fn get_conversation(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
    id: String,
) -> Result<Conversation, AppError> {
    let conn = db.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, title, created_at, updated_at FROM conversations WHERE id = ?1",
    )?;
    let conversation = stmt
        .query_row(params![id], |row| {
            Ok(Conversation {
                id: row.get(0)?,
                title: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
            })
        })
        .map_err(|_| AppError::NotFound(format!("Conversation {} not found", id)))?;
    Ok(conversation)
}

#[tauri::command]
pub fn create_conversation(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
    input: CreateConversation,
) -> Result<Conversation, AppError> {
    let conn = db.lock().unwrap();
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
        params![id, input.title, now, now],
    )?;
    Ok(Conversation {
        id,
        title: input.title,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn rename_conversation(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
    id: String,
    title: String,
) -> Result<Conversation, AppError> {
    let conn = db.lock().unwrap();
    let now = chrono::Utc::now().to_rfc3339();
    let rows_affected = conn.execute(
        "UPDATE conversations SET title = ?1, updated_at = ?2 WHERE id = ?3",
        params![title, now, id],
    )?;
    if rows_affected == 0 {
        return Err(AppError::NotFound(format!(
            "Conversation {} not found",
            id
        )));
    }
    let mut stmt = conn.prepare(
        "SELECT id, title, created_at, updated_at FROM conversations WHERE id = ?1",
    )?;
    let conversation = stmt.query_row(params![id], |row| {
        Ok(Conversation {
            id: row.get(0)?,
            title: row.get(1)?,
            created_at: row.get(2)?,
            updated_at: row.get(3)?,
        })
    })?;
    Ok(conversation)
}

#[tauri::command]
pub fn delete_conversation(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
    id: String,
) -> Result<(), AppError> {
    let conn = db.lock().unwrap();
    conn.execute("DELETE FROM messages WHERE conversation_id = ?1", params![id])?;
    conn.execute("DELETE FROM conversations WHERE id = ?1", params![id])?;
    Ok(())
}

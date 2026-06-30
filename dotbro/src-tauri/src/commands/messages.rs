use crate::database::models::{CreateMessage, Message};
use crate::error::AppError;
use rusqlite::params;
use std::sync::Mutex;

#[tauri::command]
pub fn list_messages(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
    conversation_id: String,
) -> Result<Vec<Message>, AppError> {
    let conn = db.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, conversation_id, role, content, tool_calls, created_at FROM messages WHERE conversation_id = ?1 ORDER BY created_at ASC",
    )?;
    let rows = stmt.query_map(params![conversation_id], |row| {
        Ok(Message {
            id: row.get(0)?,
            conversation_id: row.get(1)?,
            role: row.get(2)?,
            content: row.get(3)?,
            tool_calls: row.get(4)?,
            created_at: row.get(5)?,
        })
    })?;
    let mut messages = Vec::new();
    for row in rows {
        messages.push(row?);
    }
    Ok(messages)
}

#[tauri::command]
pub fn create_message(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
    input: CreateMessage,
) -> Result<Message, AppError> {
    let conn = db.lock().unwrap();
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO messages (id, conversation_id, role, content, tool_calls, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, input.conversation_id, input.role, input.content, input.tool_calls, now],
    )?;
    // Update conversation's updated_at timestamp
    conn.execute(
        "UPDATE conversations SET updated_at = ?1 WHERE id = ?2",
        params![now, input.conversation_id],
    )?;
    Ok(Message {
        id,
        conversation_id: input.conversation_id,
        role: input.role,
        content: input.content,
        tool_calls: input.tool_calls,
        created_at: now,
    })
}

#[tauri::command]
pub fn search_messages(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
    query: String,
) -> Result<Vec<Message>, AppError> {
    let conn = db.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT m.id, m.conversation_id, m.role, m.content, m.tool_calls, m.created_at
         FROM messages m
         JOIN messages_fts fts ON m.id = fts.id
         WHERE messages_fts MATCH ?1
         ORDER BY rank",
    )?;
    let rows = stmt.query_map(params![query], |row| {
        Ok(Message {
            id: row.get(0)?,
            conversation_id: row.get(1)?,
            role: row.get(2)?,
            content: row.get(3)?,
            tool_calls: row.get(4)?,
            created_at: row.get(5)?,
        })
    })?;
    let mut messages = Vec::new();
    for row in rows {
        messages.push(row?);
    }
    Ok(messages)
}

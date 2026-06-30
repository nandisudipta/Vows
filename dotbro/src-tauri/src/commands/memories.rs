use crate::database::models::{CreateMemory, Memory, UpdateMemory};
use crate::error::AppError;
use rusqlite::params;
use std::sync::Mutex;

#[tauri::command]
pub fn list_memories(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
    category: Option<String>,
) -> Result<Vec<Memory>, AppError> {
    let conn = db.lock().unwrap();
    let mut memories = Vec::new();
    if let Some(ref cat) = category {
        let mut stmt = conn.prepare(
            "SELECT id, category, title, content, tags, source, created_at, updated_at FROM memories WHERE category = ?1 ORDER BY updated_at DESC",
        )?;
        let rows = stmt.query_map(params![cat], |row| {
            Ok(Memory {
                id: row.get(0)?,
                category: row.get(1)?,
                title: row.get(2)?,
                content: row.get(3)?,
                tags: row.get(4)?,
                source: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;
        for row in rows {
            memories.push(row?);
        }
    } else {
        let mut stmt = conn.prepare(
            "SELECT id, category, title, content, tags, source, created_at, updated_at FROM memories ORDER BY updated_at DESC",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Memory {
                id: row.get(0)?,
                category: row.get(1)?,
                title: row.get(2)?,
                content: row.get(3)?,
                tags: row.get(4)?,
                source: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;
        for row in rows {
            memories.push(row?);
        }
    }
    Ok(memories)
}

#[tauri::command]
pub fn get_memory(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
    id: String,
) -> Result<Memory, AppError> {
    let conn = db.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, category, title, content, tags, source, created_at, updated_at FROM memories WHERE id = ?1",
    )?;
    let memory = stmt
        .query_row(params![id], |row| {
            Ok(Memory {
                id: row.get(0)?,
                category: row.get(1)?,
                title: row.get(2)?,
                content: row.get(3)?,
                tags: row.get(4)?,
                source: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })
        .map_err(|_| AppError::NotFound(format!("Memory {} not found", id)))?;
    Ok(memory)
}

#[tauri::command]
pub fn create_memory(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
    input: CreateMemory,
) -> Result<Memory, AppError> {
    let conn = db.lock().unwrap();
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO memories (id, category, title, content, tags, source, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![id, input.category, input.title, input.content, input.tags, input.source, now, now],
    )?;
    Ok(Memory {
        id,
        category: input.category,
        title: input.title,
        content: input.content,
        tags: input.tags,
        source: input.source,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_memory(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
    id: String,
    input: UpdateMemory,
) -> Result<Memory, AppError> {
    let conn = db.lock().unwrap();
    let now = chrono::Utc::now().to_rfc3339();
    let rows_affected = conn.execute(
        "UPDATE memories SET category = ?1, title = ?2, content = ?3, tags = ?4, source = ?5, updated_at = ?6 WHERE id = ?7",
        params![input.category, input.title, input.content, input.tags, input.source, now, id],
    )?;
    if rows_affected == 0 {
        return Err(AppError::NotFound(format!("Memory {} not found", id)));
    }
    let mut stmt = conn.prepare(
        "SELECT id, category, title, content, tags, source, created_at, updated_at FROM memories WHERE id = ?1",
    )?;
    let memory = stmt.query_row(params![id], |row| {
        Ok(Memory {
            id: row.get(0)?,
            category: row.get(1)?,
            title: row.get(2)?,
            content: row.get(3)?,
            tags: row.get(4)?,
            source: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        })
    })?;
    Ok(memory)
}

#[tauri::command]
pub fn delete_memory(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
    id: String,
) -> Result<(), AppError> {
    let conn = db.lock().unwrap();
    conn.execute("DELETE FROM memories WHERE id = ?1", params![id])?;
    Ok(())
}

#[tauri::command]
pub fn search_memories(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
    query: String,
) -> Result<Vec<Memory>, AppError> {
    let conn = db.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT m.id, m.category, m.title, m.content, m.tags, m.source, m.created_at, m.updated_at
         FROM memories m
         JOIN memories_fts fts ON m.id = fts.id
         WHERE memories_fts MATCH ?1
         ORDER BY rank",
    )?;
    let rows = stmt.query_map(params![query], |row| {
        Ok(Memory {
            id: row.get(0)?,
            category: row.get(1)?,
            title: row.get(2)?,
            content: row.get(3)?,
            tags: row.get(4)?,
            source: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        })
    })?;
    let mut memories = Vec::new();
    for row in rows {
        memories.push(row?);
    }
    Ok(memories)
}

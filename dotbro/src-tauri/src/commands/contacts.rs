use crate::database::models::{Contact, CreateContact, UpdateContact};
use crate::error::AppError;
use rusqlite::params;
use std::sync::Mutex;

#[tauri::command]
pub fn list_contacts(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
) -> Result<Vec<Contact>, AppError> {
    let conn = db.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, first_name, last_name, email, phone, organization, notes, created_at, updated_at FROM contacts ORDER BY first_name ASC",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(Contact {
            id: row.get(0)?,
            first_name: row.get(1)?,
            last_name: row.get(2)?,
            email: row.get(3)?,
            phone: row.get(4)?,
            organization: row.get(5)?,
            notes: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })?;
    let mut contacts = Vec::new();
    for row in rows {
        contacts.push(row?);
    }
    Ok(contacts)
}

#[tauri::command]
pub fn get_contact(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
    id: String,
) -> Result<Contact, AppError> {
    let conn = db.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, first_name, last_name, email, phone, organization, notes, created_at, updated_at FROM contacts WHERE id = ?1",
    )?;
    let contact = stmt
        .query_row(params![id], |row| {
            Ok(Contact {
                id: row.get(0)?,
                first_name: row.get(1)?,
                last_name: row.get(2)?,
                email: row.get(3)?,
                phone: row.get(4)?,
                organization: row.get(5)?,
                notes: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })
        .map_err(|_| AppError::NotFound(format!("Contact {} not found", id)))?;
    Ok(contact)
}

#[tauri::command]
pub fn create_contact(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
    input: CreateContact,
) -> Result<Contact, AppError> {
    let conn = db.lock().unwrap();
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO contacts (id, first_name, last_name, email, phone, organization, notes, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![id, input.first_name, input.last_name, input.email, input.phone, input.organization, input.notes, now, now],
    )?;
    Ok(Contact {
        id,
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone: input.phone,
        organization: input.organization,
        notes: input.notes,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_contact(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
    id: String,
    input: UpdateContact,
) -> Result<Contact, AppError> {
    let conn = db.lock().unwrap();
    let now = chrono::Utc::now().to_rfc3339();
    let rows_affected = conn.execute(
        "UPDATE contacts SET first_name = ?1, last_name = ?2, email = ?3, phone = ?4, organization = ?5, notes = ?6, updated_at = ?7 WHERE id = ?8",
        params![input.first_name, input.last_name, input.email, input.phone, input.organization, input.notes, now, id],
    )?;
    if rows_affected == 0 {
        return Err(AppError::NotFound(format!("Contact {} not found", id)));
    }
    let mut stmt = conn.prepare(
        "SELECT id, first_name, last_name, email, phone, organization, notes, created_at, updated_at FROM contacts WHERE id = ?1",
    )?;
    let contact = stmt.query_row(params![id], |row| {
        Ok(Contact {
            id: row.get(0)?,
            first_name: row.get(1)?,
            last_name: row.get(2)?,
            email: row.get(3)?,
            phone: row.get(4)?,
            organization: row.get(5)?,
            notes: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })?;
    Ok(contact)
}

#[tauri::command]
pub fn delete_contact(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
    id: String,
) -> Result<(), AppError> {
    let conn = db.lock().unwrap();
    conn.execute("DELETE FROM contacts WHERE id = ?1", params![id])?;
    Ok(())
}

#[tauri::command]
pub fn search_contacts(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
    query: String,
) -> Result<Vec<Contact>, AppError> {
    let conn = db.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT c.id, c.first_name, c.last_name, c.email, c.phone, c.organization, c.notes, c.created_at, c.updated_at
         FROM contacts c
         JOIN contacts_fts fts ON c.id = fts.id
         WHERE contacts_fts MATCH ?1
         ORDER BY rank",
    )?;
    let rows = stmt.query_map(params![query], |row| {
        Ok(Contact {
            id: row.get(0)?,
            first_name: row.get(1)?,
            last_name: row.get(2)?,
            email: row.get(3)?,
            phone: row.get(4)?,
            organization: row.get(5)?,
            notes: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })?;
    let mut contacts = Vec::new();
    for row in rows {
        contacts.push(row?);
    }
    Ok(contacts)
}

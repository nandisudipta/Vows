use std::sync::Mutex;
use std::process::Command;
use rusqlite::params;
use tauri::State;
use crate::error::AppError;
use crate::database::models::Message;

#[tauri::command]
pub fn send_emergency_message(
    db: State<'_, Mutex<rusqlite::Connection>>,
    peer_ip: String,
    content: String,
    conversation_id: String,
) -> Result<Message, AppError> {
    // 1. Get database path and settings
    let (db_path, sender_name, _psk, _port) = {
        let conn = db.lock().unwrap();
        
        // We query the sqlite file path (we can get it from connection metadata or setting)
        // Since we are connected to the sqlite file, we can get its filename via connection
        let db_path = conn
            .query_row("PRAGMA database_list", [], |row| row.get::<_, String>(2))
            .unwrap_or_default();

        let sender_name = conn
            .query_row(
                "SELECT value FROM settings WHERE key = 'sender_name'",
                [],
                |row| row.get::<_, String>(0),
            )
            .unwrap_or_else(|_| "Ron".to_string());

        let psk = conn
            .query_row(
                "SELECT value FROM settings WHERE key = 'emergency_psk'",
                [],
                |row| row.get::<_, String>(0),
            )
            .unwrap_or_else(|_| "dotbro_default_secure_passphrase_2026".to_string());

        let port = conn
            .query_row(
                "SELECT value FROM settings WHERE key = 'emergency_port'",
                [],
                |row| row.get::<_, String>(0),
            )
            .unwrap_or_else(|_| "8765".to_string());

        (db_path, sender_name, psk, port)
    };

    // 2. Resolve python script path
    let mut python_script = std::path::PathBuf::from("src-python/emergency_comms.py");
    if !python_script.exists() {
        python_script = std::path::PathBuf::from("../src-python/emergency_comms.py");
    }

    if !python_script.exists() {
        return Err(AppError::Io("Emergency python script not found".to_string()));
    }

    // 3. Execute python sender script
    // Arguments: <db_path> send <target_ip> <sender_name> <content> <conversation_id>
    let output = Command::new("python3")
        .arg(&python_script)
        .arg(&db_path)
        .arg("send")
        .arg(&peer_ip)
        .arg(&sender_name)
        .arg(&content)
        .arg(&conversation_id)
        .output()?;

    if !output.status.success() {
        let error_msg = String::from_utf8_lossy(&output.stderr).to_string();
        return Err(AppError::Io(format!("Transmission failed: {}", error_msg)));
    }

    // 4. Save sent message to local DB
    let conn = db.lock().unwrap();
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    conn.execute(
        "INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, conversation_id, "user", content, now],
    )?;
    
    // Update conversation time
    conn.execute(
        "UPDATE conversations SET updated_at = ?1 WHERE id = ?2",
        params![now, conversation_id],
    )?;

    Ok(Message {
        id,
        conversation_id,
        role: "user".to_string(),
        content,
        tool_calls: None,
        created_at: now,
    })
}

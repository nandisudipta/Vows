use crate::database::models::{OllamaModel, OllamaStatus};
use crate::error::AppError;
use std::sync::Mutex;

#[derive(serde::Deserialize)]
struct OllamaTagsResponse {
    models: Vec<OllamaModelResponse>,
}

#[derive(serde::Deserialize)]
struct OllamaModelResponse {
    name: String,
    size: u64,
    modified_at: String,
}

#[tauri::command]
pub async fn check_ollama_status(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
) -> Result<OllamaStatus, AppError> {
    let url = {
        let conn = db.lock().unwrap();
        conn.query_row(
            "SELECT value FROM settings WHERE key = 'ollama_url'",
            [],
            |row| row.get::<_, String>(0),
        )
        .unwrap_or_else(|_| "http://localhost:11434".to_string())
    };

    let client = reqwest::Client::new();
    match client.get(&url).send().await {
        Ok(response) => {
            let body = response.text().await.unwrap_or_default();
            let version = if body.contains("Ollama") {
                Some(body.trim().to_string())
            } else {
                Some(body.trim().to_string())
            };
            Ok(OllamaStatus {
                available: true,
                url: url.clone(),
                version,
            })
        }
        Err(_) => Ok(OllamaStatus {
            available: false,
            url: url.clone(),
            version: None,
        }),
    }
}

#[tauri::command]
pub async fn list_models(
    db: tauri::State<'_, Mutex<rusqlite::Connection>>,
) -> Result<Vec<OllamaModel>, AppError> {
    let url = {
        let conn = db.lock().unwrap();
        conn.query_row(
            "SELECT value FROM settings WHERE key = 'ollama_url'",
            [],
            |row| row.get::<_, String>(0),
        )
        .unwrap_or_else(|_| "http://localhost:11434".to_string())
    };

    let client = reqwest::Client::new();
    let response = client
        .get(format!("{}/api/tags", url))
        .send()
        .await?;

    let tags_response: OllamaTagsResponse = response.json().await?;

    let models = tags_response
        .models
        .into_iter()
        .map(|m| OllamaModel {
            name: m.name,
            size: m.size,
            modified_at: m.modified_at,
        })
        .collect();

    Ok(models)
}

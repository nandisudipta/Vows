use crate::error::AppError;

pub fn run_migrations(conn: &rusqlite::Connection) -> Result<(), AppError> {
    conn.execute_batch(
        "
        -- Conversations table
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        -- Messages table
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            tool_calls TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id)
        );

        -- Contacts table
        CREATE TABLE IF NOT EXISTS contacts (
            id TEXT PRIMARY KEY,
            first_name TEXT NOT NULL DEFAULT '',
            last_name TEXT NOT NULL DEFAULT '',
            email TEXT NOT NULL DEFAULT '',
            phone TEXT NOT NULL DEFAULT '',
            organization TEXT NOT NULL DEFAULT '',
            notes TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        -- Memories table
        CREATE TABLE IF NOT EXISTS memories (
            id TEXT PRIMARY KEY,
            category TEXT NOT NULL DEFAULT '',
            title TEXT NOT NULL DEFAULT '',
            content TEXT NOT NULL DEFAULT '',
            tags TEXT NOT NULL DEFAULT '',
            source TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        -- Settings table
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        -- FTS virtual tables
        CREATE VIRTUAL TABLE IF NOT EXISTS contacts_fts USING fts5(
            id UNINDEXED,
            first_name,
            last_name,
            email,
            organization,
            notes,
            content=contacts,
            content_rowid=rowid
        );

        CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
            id UNINDEXED,
            title,
            content,
            tags,
            category,
            content=memories,
            content_rowid=rowid
        );

        CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
            id UNINDEXED,
            content,
            content=messages,
            content_rowid=rowid
        );

        -- Contacts FTS triggers
        CREATE TRIGGER IF NOT EXISTS contacts_ai AFTER INSERT ON contacts BEGIN
            INSERT INTO contacts_fts(rowid, id, first_name, last_name, email, organization, notes)
            VALUES (new.rowid, new.id, new.first_name, new.last_name, new.email, new.organization, new.notes);
        END;

        CREATE TRIGGER IF NOT EXISTS contacts_ad AFTER DELETE ON contacts BEGIN
            INSERT INTO contacts_fts(contacts_fts, rowid, id, first_name, last_name, email, organization, notes)
            VALUES ('delete', old.rowid, old.id, old.first_name, old.last_name, old.email, old.organization, old.notes);
        END;

        CREATE TRIGGER IF NOT EXISTS contacts_au AFTER UPDATE ON contacts BEGIN
            INSERT INTO contacts_fts(contacts_fts, rowid, id, first_name, last_name, email, organization, notes)
            VALUES ('delete', old.rowid, old.id, old.first_name, old.last_name, old.email, old.organization, old.notes);
            INSERT INTO contacts_fts(rowid, id, first_name, last_name, email, organization, notes)
            VALUES (new.rowid, new.id, new.first_name, new.last_name, new.email, new.organization, new.notes);
        END;

        -- Memories FTS triggers
        CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
            INSERT INTO memories_fts(rowid, id, title, content, tags, category)
            VALUES (new.rowid, new.id, new.title, new.content, new.tags, new.category);
        END;

        CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
            INSERT INTO memories_fts(memories_fts, rowid, id, title, content, tags, category)
            VALUES ('delete', old.rowid, old.id, old.title, old.content, old.tags, old.category);
        END;

        CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
            INSERT INTO memories_fts(memories_fts, rowid, id, title, content, tags, category)
            VALUES ('delete', old.rowid, old.id, old.title, old.content, old.tags, old.category);
            INSERT INTO memories_fts(rowid, id, title, content, tags, category)
            VALUES (new.rowid, new.id, new.title, new.content, new.tags, new.category);
        END;

        -- Messages FTS triggers
        CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
            INSERT INTO messages_fts(rowid, id, content)
            VALUES (new.rowid, new.id, new.content);
        END;

        CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
            INSERT INTO messages_fts(messages_fts, rowid, id, content)
            VALUES ('delete', old.rowid, old.id, old.content);
        END;

        CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
            INSERT INTO messages_fts(messages_fts, rowid, id, content)
            VALUES ('delete', old.rowid, old.id, old.content);
            INSERT INTO messages_fts(rowid, id, content)
            VALUES (new.rowid, new.id, new.content);
        END;

        -- Default settings
        INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('ollama_url', 'http://localhost:11434', datetime('now'));
        INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('ollama_model', 'llama3.2', datetime('now'));
        INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('theme', 'dark', datetime('now'));
        INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('system_prompt', 'You are a helpful AI assistant called DOTBRO.', datetime('now'));
        INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('sender_name', 'Ron', datetime('now'));
        INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('emergency_psk', 'dotbro_default_secure_passphrase_2026', datetime('now'));
        INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('emergency_port', '8765', datetime('now'));
        INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('emergency_peers', '127.0.0.1', datetime('now'));
        ",

    )?;
    Ok(())
}

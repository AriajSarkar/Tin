use crate::db::{with_db, with_db_mut};
use crate::errors::AppError;
use crate::models::*;
use chrono::Utc;
use rusqlite::params;

fn generate_id() -> String {
    uuid::Uuid::new_v4().to_string()
}

fn now_iso() -> String {
    Utc::now().format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string()
}

#[tauri::command]
pub fn list_cards() -> Result<Vec<CardDto>, AppError> {
    with_db(|conn| {
        let mut stmt = conn.prepare(
            "SELECT id, title, amount, archived, createdAt, updatedAt, archivedAt 
             FROM Card WHERE archived = 0 ORDER BY createdAt DESC",
        )?;

        let cards = stmt
            .query_map([], |row| {
                Ok(CardDto {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    amount: format!("{:.6}", row.get::<_, f64>(2)?),
                    archived: row.get::<_, i32>(3)? != 0,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                    archived_at: row.get(6)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(cards)
    })
}

#[tauri::command]
pub fn list_archived_cards() -> Result<Vec<CardDto>, AppError> {
    with_db(|conn| {
        let mut stmt = conn.prepare(
            "SELECT id, title, amount, archived, createdAt, updatedAt, archivedAt 
             FROM Card WHERE archived = 1 ORDER BY archivedAt DESC",
        )?;

        let cards = stmt
            .query_map([], |row| {
                Ok(CardDto {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    amount: format!("{:.6}", row.get::<_, f64>(2)?),
                    archived: row.get::<_, i32>(3)? != 0,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                    archived_at: row.get(6)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(cards)
    })
}

#[tauri::command]
pub fn get_card(card_id: String) -> Result<CardWithTodosDto, AppError> {
    with_db(|conn| {
        let card = conn
            .query_row(
                "SELECT id, title, amount, archived, createdAt, updatedAt, archivedAt 
             FROM Card WHERE id = ?1",
                params![card_id],
                |row| {
                    Ok(CardDto {
                        id: row.get(0)?,
                        title: row.get(1)?,
                        amount: format!("{:.6}", row.get::<_, f64>(2)?),
                        archived: row.get::<_, i32>(3)? != 0,
                        created_at: row.get(4)?,
                        updated_at: row.get(5)?,
                        archived_at: row.get(6)?,
                    })
                },
            )
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => AppError::CardNotFound(card_id.clone()),
                _ => AppError::Database(e),
            })?;

        let mut stmt = conn.prepare(
            "SELECT id, cardId, title, amount, done, scheduledAt, orderIndex, createdAt, updatedAt 
             FROM Todo WHERE cardId = ?1 ORDER BY orderIndex ASC, createdAt ASC",
        )?;

        let todos = stmt
            .query_map(params![card_id], |row| {
                Ok(TodoDto {
                    id: row.get(0)?,
                    card_id: row.get(1)?,
                    title: row.get(2)?,
                    amount: row.get::<_, Option<f64>>(3)?.map(|a| format!("{:.6}", a)),
                    done: row.get::<_, i32>(4)? != 0,
                    scheduled_at: row.get(5)?,
                    order_index: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(CardWithTodosDto {
            id: card.id,
            title: card.title,
            amount: card.amount,
            archived: card.archived,
            created_at: card.created_at,
            updated_at: card.updated_at,
            archived_at: card.archived_at,
            todos,
        })
    })
}

#[tauri::command]
pub fn create_card(title: Option<String>, amount: String) -> Result<CardDto, AppError> {
    let amount_f: f64 = amount
        .parse()
        .map_err(|_| AppError::InvalidAmount(amount.clone()))?;
    let id = generate_id();
    let now = now_iso();

    with_db_mut(|conn| {
        let tx = conn.transaction()?;

        tx.execute(
            "INSERT INTO Card (id, title, amount, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, title, amount_f, now, now],
        )?;

        let changelog_id = generate_id();
        let payload = serde_json::json!({ "title": title, "amount": amount });
        tx.execute(
            "INSERT INTO ChangeLog (id, cardId, kind, payload, createdAt) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![changelog_id, id, "created", payload.to_string(), now],
        )?;

        tx.commit()?;

        Ok(CardDto {
            id: id.clone(),
            title,
            amount: format!("{:.6}", amount_f),
            archived: false,
            created_at: now.clone(),
            updated_at: now,
            archived_at: None,
        })
    })
}

#[tauri::command]
pub fn update_card(
    card_id: String,
    title: Option<String>,
    amount: Option<String>,
) -> Result<CardDto, AppError> {
    let now = now_iso();

    with_db_mut(|conn| {
        let tx = conn.transaction()?;

        let existing: (Option<String>, f64) = tx
            .query_row(
                "SELECT title, amount FROM Card WHERE id = ?1",
                params![card_id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => AppError::CardNotFound(card_id.clone()),
                _ => AppError::Database(e),
            })?;

        let new_title = title.clone().or(existing.0);
        let new_amount = match &amount {
            Some(a) => a.parse().map_err(|_| AppError::InvalidAmount(a.clone()))?,
            None => existing.1,
        };

        tx.execute(
            "UPDATE Card SET title = ?1, amount = ?2, updatedAt = ?3 WHERE id = ?4",
            params![new_title, new_amount, now, card_id],
        )?;

        let changelog_id = generate_id();
        let payload =
            serde_json::json!({ "title": new_title, "amount": format!("{:.6}", new_amount) });
        tx.execute(
            "INSERT INTO ChangeLog (id, cardId, kind, payload, createdAt) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![changelog_id, card_id, "updated", payload.to_string(), now],
        )?;

        tx.commit()?;

        let card = conn.query_row(
            "SELECT id, title, amount, archived, createdAt, updatedAt, archivedAt FROM Card WHERE id = ?1",
            params![card_id],
            |row| {
                Ok(CardDto {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    amount: format!("{:.6}", row.get::<_, f64>(2)?),
                    archived: row.get::<_, i32>(3)? != 0,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                    archived_at: row.get(6)?,
                })
            },
        )?;

        Ok(card)
    })
}

#[tauri::command]
pub fn delete_card(card_id: String) -> Result<OkResponse, AppError> {
    with_db_mut(|conn| {
        conn.execute("DELETE FROM Card WHERE id = ?1", params![card_id])?;
        Ok(OkResponse { ok: true })
    })
}

#[tauri::command]
pub fn add_todo(
    card_id: String,
    title: String,
    amount: Option<String>,
    use_current_time: bool,
    scheduled_at: Option<String>,
) -> Result<AddTodoResult, AppError> {
    let todo_amount: Option<f64> = match &amount {
        Some(a) => Some(a.parse().map_err(|_| AppError::InvalidAmount(a.clone()))?),
        None => None,
    };

    let todo_id = generate_id();
    let now = now_iso();
    let actual_scheduled_at = if use_current_time {
        Some(now.clone())
    } else {
        scheduled_at.clone()
    };

    with_db_mut(|conn| {
        let tx = conn.transaction()?;

        let current_amount: f64 = tx
            .query_row(
                "SELECT amount FROM Card WHERE id = ?1",
                params![card_id],
                |row| row.get(0),
            )
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => AppError::CardNotFound(card_id.clone()),
                _ => AppError::Database(e),
            })?;

        let new_card_amount = current_amount - todo_amount.unwrap_or(0.0);

        tx.execute(
            "UPDATE Card SET amount = ?1, updatedAt = ?2 WHERE id = ?3",
            params![new_card_amount, now, card_id],
        )?;

        let max_order: i32 = tx
            .query_row(
                "SELECT COALESCE(MAX(orderIndex), 0) FROM Todo WHERE cardId = ?1",
                params![card_id],
                |row| row.get(0),
            )
            .unwrap_or(0);

        tx.execute(
            "INSERT INTO Todo (id, cardId, title, amount, done, createdAt, scheduledAt, orderIndex, updatedAt) 
             VALUES (?1, ?2, ?3, ?4, 0, ?5, ?6, ?7, ?8)",
            params![todo_id, card_id, title, todo_amount, now, actual_scheduled_at, max_order + 1, now],
        )?;

        let changelog_id = generate_id();
        let payload = serde_json::json!({
            "todo_id": todo_id,
            "title": title,
            "amount": amount,
            "card_amount_change": format!("{:.6} -> {:.6}", current_amount, new_card_amount)
        });
        tx.execute(
            "INSERT INTO ChangeLog (id, cardId, kind, payload, createdAt) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![changelog_id, card_id, "todo_added", payload.to_string(), now],
        )?;

        tx.commit()?;

        let todo = TodoDto {
            id: todo_id,
            card_id: card_id.clone(),
            title,
            amount: todo_amount.map(|a| format!("{:.6}", a)),
            done: false,
            scheduled_at: actual_scheduled_at,
            order_index: max_order + 1,
            created_at: now.clone(),
            updated_at: now.clone(),
        };

        let updated_card = conn.query_row(
            "SELECT id, title, amount, archived, createdAt, updatedAt, archivedAt FROM Card WHERE id = ?1",
            params![card_id],
            |row| {
                Ok(CardDto {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    amount: format!("{:.6}", row.get::<_, f64>(2)?),
                    archived: row.get::<_, i32>(3)? != 0,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                    archived_at: row.get(6)?,
                })
            },
        )?;

        Ok(AddTodoResult { todo, updated_card })
    })
}

#[tauri::command]
pub fn update_todo(
    todo_id: String,
    title: Option<String>,
    amount: Option<String>,
    done: Option<bool>,
    scheduled_at: Option<String>,
    order_index: Option<i32>,
) -> Result<TodoDto, AppError> {
    let now = now_iso();

    with_db_mut(|conn| {
        let tx = conn.transaction()?;

        let existing: (String, String, Option<f64>, bool, Option<String>, i32) = tx.query_row(
            "SELECT cardId, title, amount, done, scheduledAt, orderIndex FROM Todo WHERE id = ?1",
            params![todo_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get::<_, i32>(3)? != 0, row.get(4)?, row.get(5)?)),
        ).map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => AppError::TodoNotFound(todo_id.clone()),
            _ => AppError::Database(e),
        })?;

        let new_title = title.unwrap_or(existing.1);
        let new_amount = match amount {
            Some(a) => Some(a.parse::<f64>().map_err(|_| AppError::InvalidAmount(a))?),
            None => existing.2,
        };
        let new_done = done.unwrap_or(existing.3);
        let new_scheduled_at = scheduled_at.or(existing.4);
        let new_order_index = order_index.unwrap_or(existing.5);

        tx.execute(
            "UPDATE Todo SET title = ?1, amount = ?2, done = ?3, scheduledAt = ?4, orderIndex = ?5, updatedAt = ?6 WHERE id = ?7",
            params![new_title, new_amount, new_done as i32, new_scheduled_at, new_order_index, now, todo_id],
        )?;

        let changelog_id = generate_id();
        let payload =
            serde_json::json!({ "todo_id": todo_id, "title": new_title, "done": new_done });
        tx.execute(
            "INSERT INTO ChangeLog (id, cardId, kind, payload, createdAt) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![changelog_id, existing.0, "todo_updated", payload.to_string(), now],
        )?;

        tx.commit()?;

        Ok(TodoDto {
            id: todo_id,
            card_id: existing.0,
            title: new_title,
            amount: new_amount.map(|a| format!("{:.6}", a)),
            done: new_done,
            scheduled_at: new_scheduled_at,
            order_index: new_order_index,
            created_at: now.clone(),
            updated_at: now,
        })
    })
}

#[tauri::command]
pub fn delete_todo(todo_id: String) -> Result<OkResponse, AppError> {
    let now = now_iso();

    with_db_mut(|conn| {
        let tx = conn.transaction()?;

        let (card_id, title): (String, String) = tx
            .query_row(
                "SELECT cardId, title FROM Todo WHERE id = ?1",
                params![todo_id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => AppError::TodoNotFound(todo_id.clone()),
                _ => AppError::Database(e),
            })?;

        tx.execute("DELETE FROM Todo WHERE id = ?1", params![todo_id])?;

        let changelog_id = generate_id();
        let payload = serde_json::json!({ "todo_id": todo_id, "title": title });
        tx.execute(
            "INSERT INTO ChangeLog (id, cardId, kind, payload, createdAt) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![changelog_id, card_id, "todo_deleted", payload.to_string(), now],
        )?;

        tx.commit()?;
        Ok(OkResponse { ok: true })
    })
}

#[tauri::command]
pub fn search(query: String) -> Result<Vec<SearchResultDto>, AppError> {
    with_db(|conn| {
        let mut date_after: Option<String> = None;
        let mut date_before: Option<String> = None;
        let mut text_parts: Vec<String> = Vec::new();

        for part in query.split_whitespace() {
            if part.starts_with("after:") {
                date_after = Some(part.trim_start_matches("after:").to_string());
            } else if part.starts_with("before:") {
                date_before = Some(part.trim_start_matches("before:").to_string());
            } else {
                text_parts.push(part.to_string());
            }
        }

        let fts_query = text_parts.join(" ");

        if fts_query.is_empty() && date_after.is_none() && date_before.is_none() {
            return Ok(Vec::new());
        }

        let mut results = Vec::new();

        if !fts_query.is_empty() {
            let mut stmt = conn.prepare(
                "SELECT card_id, todo_id, card_title, todo_title, snippet(search_index, 4, '<b>', '</b>', '...', 32) as snippet
                 FROM search_index WHERE search_index MATCH ?1 ORDER BY rank LIMIT 50"
            )?;

            let rows = stmt.query_map(params![format!("{}*", fts_query)], |row| {
                Ok(SearchResultDto {
                    card_id: row.get(0)?,
                    todo_id: row.get(1)?,
                    card_title: row.get(2)?,
                    todo_title: row.get(3)?,
                    snippet: row.get(4)?,
                })
            })?;

            for row in rows {
                results.push(row?);
            }
        }

        if let (Some(after), Some(before)) = (&date_after, &date_before) {
            let mut stmt = conn.prepare(
                "SELECT id, NULL, title, NULL, title FROM Card WHERE createdAt >= ?1 AND createdAt <= ?2 LIMIT 50"
            )?;
            let rows = stmt.query_map(params![after, before], |row| {
                Ok(SearchResultDto {
                    card_id: row.get(0)?,
                    todo_id: row.get(1)?,
                    card_title: row.get(2)?,
                    todo_title: row.get(3)?,
                    snippet: row.get::<_, Option<String>>(4)?.unwrap_or_default(),
                })
            })?;
            for row in rows {
                results.push(row?);
            }
        }

        Ok(results)
    })
}

#[tauri::command]
pub fn recent_changes(limit: Option<i32>) -> Result<Vec<ChangeLogDto>, AppError> {
    let limit = limit.unwrap_or(50);

    with_db(|conn| {
        let mut stmt = conn.prepare(
            "SELECT id, cardId, kind, payload, createdAt FROM ChangeLog ORDER BY createdAt DESC LIMIT ?1"
        )?;

        let changes = stmt
            .query_map(params![limit], |row| {
                let payload_str: String = row.get(3)?;
                let payload: serde_json::Value =
                    serde_json::from_str(&payload_str).unwrap_or(serde_json::json!({}));
                Ok(ChangeLogDto {
                    id: row.get(0)?,
                    card_id: row.get(1)?,
                    kind: row.get(2)?,
                    payload,
                    created_at: row.get(4)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(changes)
    })
}

#[tauri::command]
pub fn archive_card(card_id: String) -> Result<CardDto, AppError> {
    let now = now_iso();

    with_db_mut(|conn| {
        let tx = conn.transaction()?;

        // Check card exists
        tx.query_row(
            "SELECT id FROM Card WHERE id = ?1",
            params![card_id],
            |_| Ok(()),
        )
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => AppError::CardNotFound(card_id.clone()),
            _ => AppError::Database(e),
        })?;

        // Archive the card
        tx.execute(
            "UPDATE Card SET archived = 1, archivedAt = ?1, updatedAt = ?2 WHERE id = ?3",
            params![now, now, card_id],
        )?;

        // Log the change
        let changelog_id = generate_id();
        let payload = serde_json::json!({ "reason": "user_archive" });
        tx.execute(
            "INSERT INTO ChangeLog (id, cardId, kind, payload, createdAt) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![changelog_id, card_id, "archived", payload.to_string(), now],
        )?;

        tx.commit()?;

        // Return the updated card
        let card = conn.query_row(
            "SELECT id, title, amount, archived, createdAt, updatedAt, archivedAt FROM Card WHERE id = ?1",
            params![card_id],
            |row| {
                Ok(CardDto {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    amount: format!("{:.6}", row.get::<_, f64>(2)?),
                    archived: row.get::<_, i32>(3)? != 0,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                    archived_at: row.get(6)?,
                })
            },
        )?;

        Ok(card)
    })
}

#[tauri::command]
pub fn unarchive_card(card_id: String) -> Result<CardDto, AppError> {
    let now = now_iso();

    with_db_mut(|conn| {
        let tx = conn.transaction()?;

        // Check card exists
        tx.query_row(
            "SELECT id FROM Card WHERE id = ?1",
            params![card_id],
            |_| Ok(()),
        )
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => AppError::CardNotFound(card_id.clone()),
            _ => AppError::Database(e),
        })?;

        // Unarchive the card
        tx.execute(
            "UPDATE Card SET archived = 0, archivedAt = NULL, updatedAt = ?1 WHERE id = ?2",
            params![now, card_id],
        )?;

        // Log the change
        let changelog_id = generate_id();
        let payload = serde_json::json!({ "reason": "user_unarchive" });
        tx.execute(
            "INSERT INTO ChangeLog (id, cardId, kind, payload, createdAt) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![changelog_id, card_id, "unarchived", payload.to_string(), now],
        )?;

        tx.commit()?;

        // Return the updated card
        let card = conn.query_row(
            "SELECT id, title, amount, archived, createdAt, updatedAt, archivedAt FROM Card WHERE id = ?1",
            params![card_id],
            |row| {
                Ok(CardDto {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    amount: format!("{:.6}", row.get::<_, f64>(2)?),
                    archived: row.get::<_, i32>(3)? != 0,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                    archived_at: row.get(6)?,
                })
            },
        )?;

        Ok(card)
    })
}

#[tauri::command]
pub fn archive_old_cards() -> Result<ArchiveResult, AppError> {
    let now = now_iso();
    let thirty_days_ago = (Utc::now() - chrono::Duration::days(30))
        .format("%Y-%m-%dT%H:%M:%S%.3fZ")
        .to_string();

    with_db_mut(|conn| {
        let tx = conn.transaction()?;

        let mut stmt = tx.prepare("SELECT id FROM Card WHERE archived = 0 AND createdAt <= ?1")?;

        let card_ids: Vec<String> = stmt
            .query_map(params![thirty_days_ago], |row| row.get(0))?
            .collect::<Result<Vec<_>, _>>()?;

        drop(stmt);

        for card_id in &card_ids {
            tx.execute(
                "UPDATE Card SET archived = 1, archivedAt = ?1, updatedAt = ?2 WHERE id = ?3",
                params![now, now, card_id],
            )?;

            let changelog_id = generate_id();
            let payload = serde_json::json!({ "reason": "auto_archive_30_days" });
            tx.execute(
                "INSERT INTO ChangeLog (id, cardId, kind, payload, createdAt) VALUES (?1, ?2, ?3, ?4, ?5)",
                params![changelog_id, card_id, "archived", payload.to_string(), now],
            )?;
        }

        tx.commit()?;

        Ok(ArchiveResult {
            archived_count: card_ids.len() as i32,
        })
    })
}

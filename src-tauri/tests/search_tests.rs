//! Tests for FTS5 full-text search functionality
mod common;

use common::create_test_db;
use rusqlite::params;

#[test]
fn test_fts5_indexes_card_on_insert() {
    let db = create_test_db();
    let conn = db.lock().unwrap();

    conn.execute(
        "INSERT INTO Card (id, title, amount, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            "card-search-1",
            "Groceries Budget",
            500.0,
            "2024-01-01T00:00:00.000Z",
            "2024-01-01T00:00:00.000Z"
        ],
    )
    .unwrap();

    let count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM search_index WHERE search_index MATCH ?1",
            params!["Groceries*"],
            |row| row.get(0),
        )
        .unwrap();

    assert_eq!(count, 1, "FTS5 should index card title on insert");
}

#[test]
fn test_fts5_indexes_todo_on_insert() {
    let db = create_test_db();
    let conn = db.lock().unwrap();

    conn.execute(
        "INSERT INTO Card (id, title, amount, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            "card-search-2",
            "Test Card",
            100.0,
            "2024-01-01T00:00:00.000Z",
            "2024-01-01T00:00:00.000Z"
        ],
    )
    .unwrap();

    conn.execute(
        "INSERT INTO Todo (id, cardId, title, createdAt, updatedAt, orderIndex) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params!["todo-search-1", "card-search-2", "Buy milk and eggs", "2024-01-01T00:00:00.000Z", "2024-01-01T00:00:00.000Z", 1],
    ).unwrap();

    let count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM search_index WHERE search_index MATCH ?1",
            params!["milk*"],
            |row| row.get(0),
        )
        .unwrap();

    assert!(count >= 1, "FTS5 should index todo title on insert");
}

#[test]
fn test_fts5_updates_on_card_update() {
    let db = create_test_db();
    let conn = db.lock().unwrap();

    conn.execute(
        "INSERT INTO Card (id, title, amount, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            "card-search-3",
            "Old Title",
            100.0,
            "2024-01-01T00:00:00.000Z",
            "2024-01-01T00:00:00.000Z"
        ],
    )
    .unwrap();

    conn.execute(
        "UPDATE Card SET title = ?1 WHERE id = ?2",
        params!["New Entertainment Budget", "card-search-3"],
    )
    .unwrap();

    let count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM search_index WHERE search_index MATCH ?1",
            params!["Entertainment*"],
            |row| row.get(0),
        )
        .unwrap();

    assert!(count >= 1, "FTS5 should update index on card update");
}

#[test]
fn test_fts5_removes_on_card_delete() {
    let db = create_test_db();
    let conn = db.lock().unwrap();

    conn.execute(
        "INSERT INTO Card (id, title, amount, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            "card-search-4",
            "Unique Delete Test",
            100.0,
            "2024-01-01T00:00:00.000Z",
            "2024-01-01T00:00:00.000Z"
        ],
    )
    .unwrap();

    conn.execute("DELETE FROM Card WHERE id = ?1", params!["card-search-4"])
        .unwrap();

    let count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM search_index WHERE card_id = ?1",
            params!["card-search-4"],
            |row| row.get(0),
        )
        .unwrap();

    assert_eq!(count, 0, "FTS5 should remove card from index on delete");
}

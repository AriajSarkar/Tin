//! Tests for database schema integrity
mod common;

use common::create_test_db;
use rusqlite::params;

#[test]
fn test_card_table_exists() {
    let db = create_test_db();
    let conn = db.lock().unwrap();

    let count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='Card'",
            [],
            |row| row.get(0),
        )
        .unwrap();

    assert_eq!(count, 1, "Card table should exist");
}

#[test]
fn test_todo_table_exists() {
    let db = create_test_db();
    let conn = db.lock().unwrap();

    let count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='Todo'",
            [],
            |row| row.get(0),
        )
        .unwrap();

    assert_eq!(count, 1, "Todo table should exist");
}

#[test]
fn test_changelog_table_exists() {
    let db = create_test_db();
    let conn = db.lock().unwrap();

    let count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='ChangeLog'",
            [],
            |row| row.get(0),
        )
        .unwrap();

    assert_eq!(count, 1, "ChangeLog table should exist");
}

#[test]
fn test_fts5_search_index_exists() {
    let db = create_test_db();
    let conn = db.lock().unwrap();

    let count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='search_index'",
            [],
            |row| row.get(0),
        )
        .unwrap();

    assert_eq!(count, 1, "FTS5 search_index should exist");
}

#[test]
fn test_card_insert_basic() {
    let db = create_test_db();
    let conn = db.lock().unwrap();

    let result = conn.execute(
        "INSERT INTO Card (id, title, amount, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            "test-id-1",
            "Test Card",
            100.0,
            "2024-01-01T00:00:00.000Z",
            "2024-01-01T00:00:00.000Z"
        ],
    );

    assert!(result.is_ok(), "Card insert should succeed");
    assert_eq!(result.unwrap(), 1, "Should insert 1 row");
}

#[test]
fn test_card_insert_with_null_title() {
    let db = create_test_db();
    let conn = db.lock().unwrap();

    let result = conn.execute(
        "INSERT INTO Card (id, title, amount, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            "test-id-2",
            Option::<String>::None,
            50.0,
            "2024-01-01T00:00:00.000Z",
            "2024-01-01T00:00:00.000Z"
        ],
    );

    assert!(result.is_ok(), "Card with null title should succeed");
}

#[test]
fn test_todo_foreign_key_constraint() {
    let db = create_test_db();
    let conn = db.lock().unwrap();

    let result = conn.execute(
        "INSERT INTO Todo (id, cardId, title, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            "todo-1",
            "non-existent-card",
            "Test Todo",
            "2024-01-01T00:00:00.000Z",
            "2024-01-01T00:00:00.000Z"
        ],
    );

    assert!(
        result.is_err(),
        "Todo insert without valid cardId should fail"
    );
}

#[test]
fn test_cascade_delete_removes_todos() {
    let db = create_test_db();
    let conn = db.lock().unwrap();

    conn.execute(
        "INSERT INTO Card (id, title, amount, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            "card-2",
            "To Delete",
            100.0,
            "2024-01-01T00:00:00.000Z",
            "2024-01-01T00:00:00.000Z"
        ],
    )
    .unwrap();

    conn.execute(
        "INSERT INTO Todo (id, cardId, title, createdAt, updatedAt, orderIndex) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params!["todo-2", "card-2", "Will be deleted", "2024-01-01T00:00:00.000Z", "2024-01-01T00:00:00.000Z", 1],
    ).unwrap();

    conn.execute("DELETE FROM Card WHERE id = ?1", params!["card-2"])
        .unwrap();

    let todo_count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM Todo WHERE cardId = ?1",
            params!["card-2"],
            |row| row.get(0),
        )
        .unwrap();

    assert_eq!(todo_count, 0, "Todos should be cascade deleted with card");
}

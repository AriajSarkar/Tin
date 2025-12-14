//! Tests for error handling and transaction safety
mod common;

use common::create_test_db;
use rusqlite::params;

#[test]
fn test_duplicate_primary_key_rejected() {
    let db = create_test_db();
    let conn = db.lock().unwrap();

    conn.execute(
        "INSERT INTO Card (id, title, amount, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            "duplicate-id",
            "First",
            100.0,
            "2024-01-01T00:00:00.000Z",
            "2024-01-01T00:00:00.000Z"
        ],
    )
    .unwrap();

    let result = conn.execute(
        "INSERT INTO Card (id, title, amount, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            "duplicate-id",
            "Second",
            200.0,
            "2024-01-01T00:00:00.000Z",
            "2024-01-01T00:00:00.000Z"
        ],
    );

    assert!(result.is_err(), "Duplicate primary key should be rejected");
}

#[test]
fn test_query_nonexistent_card_returns_no_rows() {
    let db = create_test_db();
    let conn = db.lock().unwrap();

    let result: Result<String, _> = conn.query_row(
        "SELECT id FROM Card WHERE id = ?1",
        params!["nonexistent-id"],
        |row| row.get(0),
    );

    assert!(matches!(result, Err(rusqlite::Error::QueryReturnedNoRows)));
}

#[test]
fn test_transaction_rollback_on_error() {
    let db = create_test_db();
    let mut conn = db.lock().unwrap();

    let tx = conn.transaction().unwrap();

    tx.execute(
        "INSERT INTO Card (id, title, amount, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            "tx-card-1",
            "Transaction Test",
            100.0,
            "2024-01-01T00:00:00.000Z",
            "2024-01-01T00:00:00.000Z"
        ],
    )
    .unwrap();

    // Rollback instead of commit
    drop(tx);

    let count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM Card WHERE id = ?1",
            params!["tx-card-1"],
            |row| row.get(0),
        )
        .unwrap();

    assert_eq!(count, 0, "Rolled back transaction should not persist");
}

#[test]
fn test_transaction_commit_persists() {
    let db = create_test_db();
    let mut conn = db.lock().unwrap();

    {
        let tx = conn.transaction().unwrap();

        tx.execute(
            "INSERT INTO Card (id, title, amount, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5)",
            params!["tx-card-2", "Committed Test", 100.0, "2024-01-01T00:00:00.000Z", "2024-01-01T00:00:00.000Z"],
        ).unwrap();

        tx.commit().unwrap();
    }

    let count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM Card WHERE id = ?1",
            params!["tx-card-2"],
            |row| row.get(0),
        )
        .unwrap();

    assert_eq!(count, 1, "Committed transaction should persist");
}

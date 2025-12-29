//! Tests for card archival logic
mod common;

use chrono::{Duration, Utc};
use common::create_test_db;
use rusqlite::params;

#[test]
fn test_archive_card_sets_archived_flag() {
    let db = create_test_db();
    let conn = db.lock().unwrap();

    conn.execute(
        "INSERT INTO Card (id, title, amount, archived, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params!["card-archive-1", "Test", 100.0, 0, "2024-01-01T00:00:00.000Z", "2024-01-01T00:00:00.000Z"],
    ).unwrap();

    let now = Utc::now().format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string();
    conn.execute(
        "UPDATE Card SET archived = 1, archivedAt = ?1 WHERE id = ?2",
        params![now, "card-archive-1"],
    )
    .unwrap();

    let (archived, archived_at): (bool, Option<String>) = conn
        .query_row(
            "SELECT archived, archivedAt FROM Card WHERE id = ?1",
            params!["card-archive-1"],
            |row| Ok((row.get::<_, i32>(0)? != 0, row.get(1)?)),
        )
        .unwrap();

    assert!(archived, "Card should be marked as archived");
    assert!(archived_at.is_some(), "archivedAt should be set");
}

#[test]
fn test_archived_cards_excluded_from_list() {
    let db = create_test_db();
    let conn = db.lock().unwrap();

    conn.execute(
        "INSERT INTO Card (id, title, amount, archived, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params!["card-active", "Active Card", 100.0, 0, "2024-01-01T00:00:00.000Z", "2024-01-01T00:00:00.000Z"],
    ).unwrap();

    conn.execute(
        "INSERT INTO Card (id, title, amount, archived, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params!["card-archived", "Archived Card", 100.0, 1, "2024-01-01T00:00:00.000Z", "2024-01-01T00:00:00.000Z"],
    ).unwrap();

    let count: i32 = conn
        .query_row("SELECT COUNT(*) FROM Card WHERE archived = 0", [], |row| {
            row.get(0)
        })
        .unwrap();

    assert_eq!(count, 1, "Only non-archived cards should be returned");
}

#[test]
fn test_auto_archive_threshold_30_days() {
    let db = create_test_db();
    let conn = db.lock().unwrap();

    let now = Utc::now();
    let old_date = (now - Duration::days(31))
        .format("%Y-%m-%dT%H:%M:%S%.3fZ")
        .to_string();
    let recent_date = (now - Duration::days(5))
        .format("%Y-%m-%dT%H:%M:%S%.3fZ")
        .to_string();
    let threshold = (now - Duration::days(30))
        .format("%Y-%m-%dT%H:%M:%S%.3fZ")
        .to_string();

    conn.execute(
        "INSERT INTO Card (id, title, amount, archived, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params!["card-old", "Old Card", 100.0, 0, old_date, old_date],
    ).unwrap();

    conn.execute(
        "INSERT INTO Card (id, title, amount, archived, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params!["card-recent", "Recent Card", 100.0, 0, recent_date, recent_date],
    ).unwrap();

    let old_count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM Card WHERE archived = 0 AND createdAt <= ?1",
            params![threshold],
            |row| row.get(0),
        )
        .unwrap();

    assert_eq!(
        old_count, 1,
        "Should find exactly 1 card older than 30 days"
    );
}

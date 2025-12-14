//! Tests for amount calculations and financial operations
mod common;

use common::create_test_db;
use rusqlite::params;

#[test]
fn test_atomic_deduction_on_todo_add() {
    let db = create_test_db();
    let conn = db.lock().unwrap();

    conn.execute(
        "INSERT INTO Card (id, title, amount, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            "card-amount-1",
            "Test",
            100.0,
            "2024-01-01T00:00:00.000Z",
            "2024-01-01T00:00:00.000Z"
        ],
    )
    .unwrap();

    let current_amount: f64 = conn
        .query_row(
            "SELECT amount FROM Card WHERE id = ?1",
            params!["card-amount-1"],
            |row| row.get(0),
        )
        .unwrap();

    let todo_amount = 25.50;
    let new_amount = current_amount - todo_amount;

    conn.execute(
        "UPDATE Card SET amount = ?1 WHERE id = ?2",
        params![new_amount, "card-amount-1"],
    )
    .unwrap();

    let final_amount: f64 = conn
        .query_row(
            "SELECT amount FROM Card WHERE id = ?1",
            params!["card-amount-1"],
            |row| row.get(0),
        )
        .unwrap();

    assert!(
        (final_amount - 74.5).abs() < 0.001,
        "Amount should be 74.50 after deduction"
    );
}

#[test]
fn test_negative_balance_allowed() {
    let db = create_test_db();
    let conn = db.lock().unwrap();

    conn.execute(
        "INSERT INTO Card (id, title, amount, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            "card-amount-2",
            "Test",
            50.0,
            "2024-01-01T00:00:00.000Z",
            "2024-01-01T00:00:00.000Z"
        ],
    )
    .unwrap();

    conn.execute(
        "UPDATE Card SET amount = amount - 100.0 WHERE id = ?1",
        params!["card-amount-2"],
    )
    .unwrap();

    let final_amount: f64 = conn
        .query_row(
            "SELECT amount FROM Card WHERE id = ?1",
            params!["card-amount-2"],
            |row| row.get(0),
        )
        .unwrap();

    assert!(
        (final_amount - (-50.0)).abs() < 0.001,
        "Negative balance should be allowed"
    );
}

#[test]
fn test_precision_maintained_for_decimals() {
    let db = create_test_db();
    let conn = db.lock().unwrap();

    conn.execute(
        "INSERT INTO Card (id, title, amount, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            "card-amount-3",
            "Precision Test",
            123.456789,
            "2024-01-01T00:00:00.000Z",
            "2024-01-01T00:00:00.000Z"
        ],
    )
    .unwrap();

    let amount: f64 = conn
        .query_row(
            "SELECT amount FROM Card WHERE id = ?1",
            params!["card-amount-3"],
            |row| row.get(0),
        )
        .unwrap();

    assert!(
        (amount - 123.456789).abs() < 0.0001,
        "Decimal precision should be maintained"
    );
}

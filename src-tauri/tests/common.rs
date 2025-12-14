//! Test shared utilities and imports
use rusqlite::Connection;
use std::sync::Mutex;

/// Create an in-memory test database with the full schema
pub fn create_test_db() -> Mutex<Connection> {
    let conn = Connection::open_in_memory().expect("Failed to create in-memory database");
    conn.execute_batch(include_str!("../migrations/init.sql"))
        .expect("Failed to initialize test database schema");
    Mutex::new(conn)
}

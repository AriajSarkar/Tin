#[cfg(test)]
mod tests {
    use super::*;
    use once_cell::sync::OnceCell;
    use rusqlite::Connection;
    use std::sync::Mutex;

    fn setup_test_db() -> &'static Mutex<Connection> {
        static TEST_DB: OnceCell<Mutex<Connection>> = OnceCell::new();
        TEST_DB.get_or_init(|| {
            let conn = Connection::open_in_memory().unwrap();
            conn.execute_batch(include_str!("../migrations/init.sql"))
                .unwrap();
            Mutex::new(conn)
        })
    }

    #[test]
    fn test_generate_id() {
        let id1 = generate_id();
        let id2 = generate_id();
        assert!(!id1.is_empty());
        assert!(!id2.is_empty());
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_now_iso() {
        let now = now_iso();
        assert!(now.contains("T"));
        assert!(now.ends_with("Z"));
    }
}

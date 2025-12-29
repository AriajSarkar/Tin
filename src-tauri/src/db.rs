use crate::errors::AppError;
use once_cell::sync::OnceCell;
use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::Mutex;

static DB: OnceCell<Mutex<Connection>> = OnceCell::new();

pub fn init_db(app_data_dir: PathBuf) -> Result<(), AppError> {
    let db_path = app_data_dir.join("tin.db");
    std::fs::create_dir_all(&app_data_dir).ok();

    let conn = Connection::open(&db_path)?;

    conn.execute_batch(include_str!("../migrations/init.sql"))?;

    // Migration: Add lockedAmount column if it doesn't exist
    let _ = conn.execute("ALTER TABLE Card ADD COLUMN lockedAmount REAL", []);

    DB.set(Mutex::new(conn))
        .map_err(|_| AppError::Internal("DB already initialized".into()))?;

    log::info!("Database initialized at {:?}", db_path);
    Ok(())
}

pub fn with_db<F, T>(f: F) -> Result<T, AppError>
where
    F: FnOnce(&Connection) -> Result<T, AppError>,
{
    let conn = DB
        .get()
        .ok_or_else(|| AppError::Internal("DB not initialized".into()))?
        .lock()
        .map_err(|_| AppError::Internal("DB lock poisoned".into()))?;
    f(&conn)
}

pub fn with_db_mut<F, T>(f: F) -> Result<T, AppError>
where
    F: FnOnce(&mut Connection) -> Result<T, AppError>,
{
    let mut conn = DB
        .get()
        .ok_or_else(|| AppError::Internal("DB not initialized".into()))?
        .lock()
        .map_err(|_| AppError::Internal("DB lock poisoned".into()))?;
    f(&mut conn)
}

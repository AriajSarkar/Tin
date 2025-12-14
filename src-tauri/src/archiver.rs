use crate::commands::archive_old_cards;
use std::time::Duration;
use tokio::time::interval;

pub async fn start_archiver() {
    let mut ticker = interval(Duration::from_secs(24 * 60 * 60));

    if let Err(e) = run_archive() {
        log::warn!("Initial archive run failed: {}", e);
    }

    loop {
        ticker.tick().await;
        if let Err(e) = run_archive() {
            log::warn!("Scheduled archive run failed: {}", e);
        }
    }
}

fn run_archive() -> Result<(), String> {
    match archive_old_cards() {
        Ok(result) => {
            if result.archived_count > 0 {
                log::info!("Archived {} old cards", result.archived_count);
            }
            Ok(())
        }
        Err(e) => Err(e.to_string()),
    }
}

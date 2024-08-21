use std::path::PathBuf;

use tokio::fs;

pub async fn set_up(database_path: &PathBuf) -> anyhow::Result<()> {
    trace!("setting up the database folder...");

    let folder = database_path
        .parent()
        .ok_or_else(|| anyhow::anyhow!("database path has no parent"))?;

    if !folder.exists() {
        std::fs::create_dir_all(folder)?;
    }

    if !database_path.exists() {
        fs::File::create(database_path).await?;
    }

    trace!("set up database folder");

    Ok(())
}

use std::path::Path;

use tokio::fs;

pub async fn set_up_database(database_path: impl AsRef<Path> + Send) -> eyre::Result<()> {
    let folder = database_path
        .as_ref()
        .parent()
        .ok_or_else(|| eyre::eyre!("database path has no parent"))?;

    if !folder.exists() {
        std::fs::create_dir_all(folder)?;
    }

    if !database_path.as_ref().exists() {
        fs::File::create(database_path).await?;
    }

    Ok(())
}

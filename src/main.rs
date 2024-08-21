use clap::Parser;
use figment::{
    providers::{Env, Format, Yaml},
    Figment,
};
use sqlx::SqlitePool;

mod bot;
mod cli;
mod config;
mod macros;
mod utils;

#[macro_use]
extern crate tracing;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    match cli::Cli::parse().subcommand {
        cli::SubCommands::Start { config } => {
            if !config.try_exists()? {
                anyhow::bail!("Configuration file doesn't exist on the specified path");
            }

            let config: config::Config = Figment::new()
                .merge(Yaml::file(config))
                .merge(Env::raw().split("__"))
                .extract()?;

            // Set-up `tracing` for logging
            utils::log::set_up(config.logs_folder)?;

            utils::database::set_up(&config.database).await?;

            let sqlite_pool =
                SqlitePool::connect(&format!("sqlite://{}", config.database.display())).await?;
            sqlx::migrate!().run(&sqlite_pool).await?;

            bot::BouncerBot::new(&config.discord.token, sqlite_pool)
                .start(config.discord)
                .await?;
        }
    }

    Ok(())
}

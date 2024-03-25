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
async fn main() -> eyre::Result<()> {
    // Set-up color_eyre for colourful error messages
    color_eyre::install()?;
    // Set-up tracing for logging
    utils::log::set_up(None)?;

    match cli::Cli::parse().subcommand {
        cli::SubCommands::Start { config } => {
            if !config.try_exists()? {
                error_exit!("specified configuration file does not exist");
            }

            match Figment::new()
                .merge(Yaml::file(config))
                .merge(Env::raw().split("__"))
                .extract::<config::Config>()
            {
                Ok(config) => {
                    // Set-up database folder if it doesn't exist
                    utils::database::set_up_database(&config.database).await?;

                    let sqlite_pool =
                        SqlitePool::connect(&format!("sqlite://{}", config.database.display()))
                            .await?;
                    sqlx::migrate!().run(&sqlite_pool).await?;

                    bot::BouncerBot::new(&config.discord.token, sqlite_pool)
                        .start(config.discord)
                        .await?;
                }
                Err(error) => {
                    error_exit!("error while parsing the configuration file: {error}");
                }
            }
        }
    }

    Ok(())
}

use clap::Parser;
use figment::{
    providers::{Env, Format, Yaml},
    Figment,
};

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
                    bot::BouncerBot::new(&config.discord.token)
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

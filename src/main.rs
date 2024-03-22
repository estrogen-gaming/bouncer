use clap::Parser;
use figment::{
    providers::{Env, Format, Yaml},
    Figment,
};

mod cli;
mod config;
mod utils;

#[macro_use]
extern crate tracing;

fn main() -> eyre::Result<()> {
    // Set-up color_eyre for colourful error messages
    color_eyre::install()?;
    // Set-up tracing for logging
    utils::log::set_up(None)?;

    match cli::Cli::parse().subcommand {
        cli::SubCommands::Start { config } => {
            if !config.try_exists()? {
                error!("Config file does not exist");
                std::process::exit(1);
            }

            let config = Figment::new()
                .merge(Yaml::file(config))
                .merge(Env::raw().split("__"))
                .extract::<config::Config>();

            if let Err(err) = config {
                error!("Error parsing config: {err}");
                std::process::exit(1);
            }

            println!("Hello, world!");
        }
    }

    Ok(())
}

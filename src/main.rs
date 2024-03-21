use clap::Parser;
use figment::{
    providers::{Env, Format, Yaml},
    Figment,
};
mod cli;
mod config;

fn main() -> eyre::Result<()> {
    color_eyre::install()?;

    match cli::Cli::parse().subcommand {
        cli::SubCommands::Start { config } => {
            if !config.try_exists()? {
                eprintln!("Config file does not exist");
                std::process::exit(1);
            }

            let config = Figment::new()
                .merge(Yaml::file(config))
                .merge(Env::raw().split("__"))
                .extract::<config::Config>();

            if let Err(err) = config {
                eprintln!("Error parsing config: {err}");
                std::process::exit(1);
            }

            println!("Hello, world!");
        }
    }

    Ok(())
}

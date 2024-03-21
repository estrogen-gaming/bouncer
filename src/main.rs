use clap::Parser;
use figment::{
    providers::{Env, Format, Yaml},
    Figment,
};
mod cli;
mod config;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    match cli::Cli::parse().subcommand {
        cli::SubCommands::Start { config } => {
            if !config.try_exists()? {
                return Err("Config file does not exist".into());
            }

            let _config = Figment::new()
                .merge(Yaml::file(config))
                .merge(Env::raw().split("__"))
                .extract::<config::Config>()?;

            println!("Hello, world!");
        }
    }

    Ok(())
}

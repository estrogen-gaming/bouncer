use clap::Parser;

mod cli;

fn main() {
    match cli::Cli::parse().subcommand {
        cli::SubCommands::Start { config } => {
            println!("Hello, world! Specified config path: {}", config.display());
        }
    }
}

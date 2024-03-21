use std::path::PathBuf;

use clap::{Parser, Subcommand};
use serde::{Deserialize, Serialize};

#[derive(Parser, Debug, Serialize, Deserialize)]
#[command(version)]
pub struct Cli {
    #[command(subcommand)]
    pub subcommand: SubCommands,
}

#[derive(Subcommand, Debug, Serialize, Deserialize)]
pub enum SubCommands {
    /// Start the bot
    Start {
        /// Path of configuration file
        #[arg(env, short, long, default_value = "config.yaml")]
        config: PathBuf,
    },
}

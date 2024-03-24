use std::path::PathBuf;

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    /// The path of the SQLite database file.
    #[serde(default = "default_database_path")]
    pub database: PathBuf,
    /// Discord specific configurations.
    pub discord: Discord,
}

/// Default path for the [`SQLite`](https://www.sqlite.org/) database.
fn default_database_path() -> PathBuf {
    PathBuf::from("data/db.sqlite")
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Discord {
    // TODO: Maybe a custom type for Discord bot token
    // that will have a `parse` function to validate
    // the token.
    /// Token for Discord bot.
    pub token: String,
    /// Guild ID where bot operates.
    pub guild_id: u64,

    /// IDs for Discord channels.
    pub channels: DiscordChannels,
    /// IDs for Discord roles.
    pub roles: DiscordRoles,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiscordChannels {
    //* Categories are technically channels in Discord.
    /// Category ID for interview channels.
    pub interviews_category_id: u64,

    /// Channel ID for user mark messages.
    pub interview_marks_id: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiscordRoles {
    /// Role IDs for interviewers.
    pub interviewer_ids: Vec<u64>,

    /// Role ID for users awaiting interview.
    pub pending_interview_id: u64,
    /// Role ID for users currently being interviewed.
    pub ongoing_interview_id: u64,

    /// Role ID for text-verified users.
    pub text_verified_id: u64,
    /// Role ID for ID-verified users.
    pub id_verified_id: u64,
}

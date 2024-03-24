use std::sync::Arc;

use serenity::{all::GatewayIntents, Client};
use tokio::sync::RwLock;

pub mod context;
pub mod event_handler;

pub struct BouncerBot {
    token: String,
    pub state: Arc<RwLock<BouncerState>>,
}

#[derive(Default)]
pub struct BouncerState {
    pub context: context::BouncerContext,
}

impl BouncerBot {
    pub fn new(token: impl AsRef<str>) -> Self {
        Self {
            token: token.as_ref().to_string(),
            state: Arc::new(RwLock::new(BouncerState::default())),
        }
    }

    pub async fn start(&self, discord_config: crate::config::Discord) -> eyre::Result<()> {
        let mut client = Client::builder(
            &self.token,
            GatewayIntents::GUILDS | GatewayIntents::GUILD_MESSAGES | GatewayIntents::GUILD_MEMBERS,
        )
        .event_handler(event_handler::BouncerEventHandler {
            discord_config,
            state: self.state.clone(),
        })
        .await?;

        trace!("starting the Discord bot...");
        client.start().await?;

        Ok(())
    }
}
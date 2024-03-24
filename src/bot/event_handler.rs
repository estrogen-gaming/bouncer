use std::sync::Arc;

use serenity::all::{Context, EventHandler, Ready};
use tokio::sync::RwLock;

use crate::bot::context::BouncerContext;

pub struct BouncerEventHandler {
    pub discord_config: crate::config::Discord,
    pub state: Arc<RwLock<super::BouncerState>>,
}

#[serenity::async_trait]
impl EventHandler for BouncerEventHandler {
    async fn ready(&self, _context: &Context, ready: &Ready) {
        info!(
            "bot is connected to Discord and ready to serve as `{}`",
            ready.user.name
        );
    }

    async fn cache_ready(&self, context: &Context, _guilds: &Vec<serenity::model::id::GuildId>) {
        if let Some(context) = BouncerContext::try_populate(context, &self.discord_config) {
            self.state.write().await.context = context;
        } else {
            error!("failed to populate context");
        }
    }
}

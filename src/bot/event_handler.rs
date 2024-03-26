use std::sync::Arc;

use serenity::all::{Context, EventHandler, Interaction, Ready};
use tokio::sync::RwLock;
use tokio::time::{self, Duration};

use crate::bot::commands::register_commands;
use crate::bot::context::BouncerContext;
use crate::macros;

use super::commands::run_command;

pub struct BouncerEventHandler {
    pub discord_config: crate::config::Discord,
    pub state: Arc<RwLock<super::BouncerState>>,
}

#[serenity::async_trait]
impl EventHandler for BouncerEventHandler {
    async fn ready(&self, context: &Context, ready: &Ready) {
        info!(
            "bot is connected to Discord and ready to serve as `{}`",
            ready.user.name
        );

        // TODO: Instead of doing this, we should use something like `Condvar`
        // or `tokio::sync::Notify`. The attempt was made, but it did not
        // work as expected. Should investigate further.
        let mut counter = 0;
        while !self.state.read().await.context._is_populated {
            if counter >= 100 {
                macros::error_exit!(
                    "context is not populated within 10 seconds. stopping bouncer..."
                );
            }

            time::sleep(Duration::from_millis(100)).await;
            counter += 1;
        }

        register_commands(&self.state.read().await.context.guild, context).await;
    }

    async fn cache_ready(&self, context: &Context, _guilds: &Vec<serenity::model::id::GuildId>) {
        trace!("running the `cache_ready` event handler...");

        if let Some(context) = BouncerContext::try_populate(context, &self.discord_config) {
            self.state.write().await.context = context;
        } else {
            macros::error_exit!("failed to populate context, stopping bouncer...");
        }

        trace!("ran the `cache_ready` event handler");
    }

    async fn interaction_create(&self, context: &Context, interaction: &Interaction) {
        if let Interaction::Command(command_interaction) = interaction {
            if let Err(error) = run_command(
                command_interaction,
                context,
                self.state.clone(),
                &command_interaction.data.options(),
            )
            .await
            {
                error!(
                    "an error occurred while running `{interaction_name}` command interaction: {error:#?}",
                    interaction_name = command_interaction.data.name
                );
            }
        }
    }
}

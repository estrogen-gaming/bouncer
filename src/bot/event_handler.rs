use std::sync::Arc;

use serenity::all::{Context, EventHandler, Interaction, Message, Ready};
use tokio::sync::RwLock;
use tokio::time::{self, Duration};

use crate::bot::commands::register_commands;
use crate::bot::context::BouncerContext;
use crate::macros;

use super::commands::run_command;
use super::helpers::interaction_context::CommandInteractionContext;

pub struct BouncerEventHandler {
    pub discord_config: crate::config::Discord,
    pub state: Arc<RwLock<super::BouncerState>>,
}

#[serenity::async_trait]
impl EventHandler for BouncerEventHandler {
    async fn ready(&self, context: Context, ready: Ready) {
        info!(
            "bot is connected to Discord and ready to serve as `{}`",
            ready.user.name
        );

        let mut counter = 0;
        while !self.state.read().await.context.is_populated() {
            trace!("waiting for context to be populated (try {counter})...");

            if counter >= 100 {
                macros::error_exit!(
                    "context is not populated within 10 seconds. stopping bouncer..."
                );
            }

            time::sleep(Duration::from_millis(100)).await;
            counter += 1;
        }

        register_commands(&self.state.read().await.context.guild, &context).await;
    }

    async fn interaction_create(&self, context: Context, interaction: Interaction) {
        if let Interaction::Command(command_interaction) = interaction {
            let interaction_context = CommandInteractionContext {
                context: &context,
                interaction: &command_interaction,
                options: &command_interaction.data.options(),
            };

            if let Err(error) = run_command(interaction_context, self.state.clone()).await {
                error!(
                    "an error occurred while running `{interaction_name}` command interaction: {error:#?}",
                    interaction_name = command_interaction.data.name
                );
            }
        }
    }

    async fn message(&self, context: Context, message: Message) {
        let state = self.state.read().await;

        if !state.context.is_populated() {
            warn!("context is not populated yet, ignoring messages until its populated...");
            return;
        }

        let (guild, channel, member) = {
            let guild_id = message.guild_id;
            let partial_member = message.member.as_ref();

            // If there's no guild or guild member (message in DMs)
            // ignore it.
            if guild_id.is_none() || partial_member.is_none() {
                debug!("message is not from a guild or a guild member (DMs), ignoring...");
                return;
            }

            let guild = if let Some(guild) = guild_id.unwrap().to_guild_cached(&context.cache) {
                guild.to_owned()
            } else {
                error!("failed to fetch guild from cache");
                return;
            };
            let channel = match message.channel(&context.http).await {
                Ok(channel) => channel.guild().unwrap(),
                Err(error) => {
                    error!("failed to fetch channel: {error:#?}");
                    return;
                }
            };
            let member = match message.member(&context.http).await {
                Ok(member) => member,
                Err(error) => {
                    error!("failed to fetch member: {error:#?}");
                    return;
                }
            };

            (guild, channel, member)
        };

        if guild.id != state.context.guild.id {
            debug!("message is not from the specified guild, ignoring...");
            return;
        }

        if !channel.nsfw {
            debug!("message is not in an NSFW channel, ignoring...");
            return;
        }

        if member.user.bot() {
            debug!("message is from a bot, ignoring...");
            return;
        }

        if member.roles.iter().any(|role_id| {
            state
                .context
                .roles
                .interviewers
                .iter()
                .any(|role| role.id == *role_id)
        }) {
            debug!("message is from an interviewer, ignoring...");
            return;
        } else if member.roles.iter().all(|role_id| {
            role_id == &state.context.roles.text_verified.id
                || role_id == &state.context.roles.id_verified.id
        }) {
            debug!("message is not from an already interviewed user, ignoring...");
            return;
        }

        //* To make clippy happy. Gives `clippy::significant-drop-tightening`
        //* warning otherwise.
        drop(state);
    }

    async fn cache_ready(&self, context: Context, _guilds: Vec<serenity::model::id::GuildId>) {
        trace!("running the `cache_ready` event handler...");

        match BouncerContext::try_populate(&context, &self.discord_config) {
            Ok(context) => self.state.write().await.context = context,
            Err(error) => {
                macros::error_exit!("failed to populate context, stopping bouncer... ({error})");
            }
        }

        trace!("ran the `cache_ready` event handler");
    }
}

use std::sync::Arc;

use serenity::all::{Context, EventHandler, Interaction, Member, Message, MessageType, Ready};
use tokio::sync::RwLock;
use tokio::time::{self, Duration};
use tracing::{debug, error, info, trace, warn};

use super::commands::run_command;
use super::helpers::interaction_context::CommandInteractionContext;

use crate::bot::{commands::register_commands, context::BouncerContext, database};
use crate::config;

macro_rules! error_exit {
    ($($arg:tt)*) => {
        error!($($arg)*);
        std::process::exit(1);
    };
}

pub struct BouncerEventHandler {
    pub discord_config: config::Discord,
    pub state: Arc<RwLock<super::BouncerState>>,
}

#[serenity::async_trait]
impl EventHandler for BouncerEventHandler {
    async fn cache_ready(&self, context: Context, _guilds: Vec<serenity::model::id::GuildId>) {
        trace!("running the `cache_ready` event handler...");

        match BouncerContext::try_populate(&context, &self.discord_config) {
            Ok(context) => self.state.write().await.context = context,
            Err(error) => {
                error_exit!("failed to populate context, stopping... ({error})");
            }
        }

        trace!("ran the `cache_ready` event handler");
    }

    async fn guild_member_addition(&self, context: Context, member: Member) {
        let state = self.state.read().await;

        let user_id =
            i64::try_from(member.user.id.get()).expect("failed to convert user ID from u64 to i64");
        match sqlx::query!(
            "SELECT user_id, type FROM interviews WHERE user_id = ?",
            user_id
        )
        .fetch_optional(&state.database)
        .await
        {
            Ok(Some(user)) => {
                if let Err(error) = member
                    .add_role(
                        &context.http,
                        if user.r#type == database::InterviewType::Text.to_string() {
                            state.context.roles.text_verified.id
                        } else {
                            state.context.roles.id_verified.id
                        },
                        Some("Was previously interviewed."),
                    )
                    .await
                {
                    error!("an unexpected error occurred while adding roles back to a member: {error:#?}");
                }
            }
            Ok(None) => {
                info!("joined member `{user_id}` is new, no roles to give back");
            }
            Err(error) => {
                error!("database query error: {error}");
            }
        }
    }

    async fn message(&self, context: Context, message: Message) {
        let state = self.state.read().await;
        if !state.context.is_populated() {
            warn!("context is not populated yet, ignoring messages until it's populated...");
            return;
        }

        if message.kind != MessageType::Regular {
            trace!("message is a system message, ignoring...");
            return;
        }

        let message_guild = match message.guild_id {
            Some(guild_id) => match guild_id.to_partial_guild(&context.http).await {
                Ok(guild) => guild,
                Err(error) => {
                    error!(
                        "could not fetch the guild data of `{}`, skipping... ({error})",
                        guild_id
                    );
                    return;
                }
            },
            None => {
                debug!("message is not from a guild, ignoring...");
                return;
            }
        };
        let Ok(message_channel) = message.guild_channel(&context.http).await else {
            error!("could not find the channel, skipping...");
            return;
        };
        let Ok(message_member) = message.member(&context.http).await else {
            error!("could not fetch the message member, skipping...");
            return;
        };

        // TODO: Sort these based on the priorities.
        if message_guild.owner_id == message_member.user.id {
            debug!("message is from the guild owner, ignoring...");
            return;
        }
        if !message_channel.nsfw {
            debug!("message is not from an NSFW channel, ignoring...");
            return;
        }
        if message_member.user.bot() {
            debug!("message is from a bot, ignoring...");
            return;
        }
        if message_member.roles.iter().any(|role_id| {
            state
                .context
                .roles
                .interviewers
                .iter()
                .any(|role| role.id == *role_id)
        }) {
            debug!("message is from an interviewer, ignoring...");
            return;
        }
        let Ok(user_status) = sqlx::query!("SELECT status FROM users")
            .fetch_optional(&state.database)
            .await
        else {
            error!(
                "could not read the user data of `{}`, skipping...",
                message_member.user.id
            );
            return;
        };
        if user_status.is_some() {
            debug!("this user is in the database records already, skipping...");
            return;
        }
        let user_id = i64::try_from(message_member.user.id.get())
            .expect("failed to convert user ID from u64 to i64");
        match sqlx::query_as!(
            User,
            "INSERT INTO users(user_id, status) VALUES(?, ?)",
            user_id,
            database::UserStatus::Pending
        )
        .execute(&state.database)
        .await
        {
            Ok(_) => {
                debug!(
                    "added a new user `{}` to the database with status `pending`",
                    message_member.user.id
                );
            }
            Err(error) => {
                error!(
                    "failed to insert a new user `{}` into the `users` table: {error}",
                    message_member.user.id
                );
                return;
            }
        }
    }

    async fn ready(&self, context: Context, ready: Ready) {
        info!(
            "bot is connected to Discord and ready to serve as `{}`",
            ready.user.name
        );

        let mut counter = 1;
        while !self.state.read().await.context.is_populated() {
            trace!("waiting for context to be populated (try {counter})...");

            if counter >= 10 {
                error_exit!("context is not populated within 10 seconds. stopping...");
            }

            time::sleep(Duration::from_millis(1000)).await;
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
}

use std::sync::Arc;

use serenity::all::{Context, CreateCommand, Guild};
use tokio::sync::RwLock;

use super::{helpers::interaction_context::CommandInteractionContext, BouncerState};

mod meow;

pub trait BouncerCommand {
    fn command() -> CreateCommand<'static>;

    async fn execute(
        interaction_context: CommandInteractionContext<'_>,
        state: &BouncerState,
    ) -> eyre::Result<()>;
}

pub async fn register_commands(guild: &Guild, context: &Context) {
    trace!("registering guild commands...");

    let commands = &[meow::Command::command()];

    match guild.set_commands(&context.http, commands).await {
        Ok(commands) => info!(
            "registered guild commands: `{}`",
            commands
                .iter()
                .map(|command| command.name.to_string())
                .collect::<Vec<String>>()
                .join(", ")
        ),
        Err(error) => error!("an error occurred while registering guild commands: {error:#?}"),
    };
}

pub async fn run_command(
    interaction_context: CommandInteractionContext<'_>,
    state: Arc<RwLock<BouncerState>>,
) -> eyre::Result<()> {
    let command_name = interaction_context.interaction.data.name.as_str();

    debug!("running the `{command_name}` command...");
    let command_result = match command_name {
        "ping" => meow::Command::execute(interaction_context, &*state.read().await).await,
        _ => Ok(()),
    };
    debug!("ran the `{command_name}` command");

    command_result
}

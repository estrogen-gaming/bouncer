use std::sync::Arc;

use serenity::all::{CommandInteraction, Context, CreateCommand, Guild, ResolvedOption};
use tokio::sync::RwLock;

use super::BouncerState;

mod ping;

pub trait BouncerCommand {
    fn command() -> CreateCommand<'static>;

    async fn execute(
        context: &Context,
        interaction: &CommandInteraction,
        state: &BouncerState,
        options: &[ResolvedOption],
    ) -> eyre::Result<()>;
}

pub async fn register_commands(guild: &Guild, context: &Context) {
    trace!("registering guild commands...");

    let commands = &[ping::Command::command()];

    match guild.set_commands(&context.http, commands).await {
        Ok(commands) => info!(
            "registered guild commands: {}",
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
    command_interaction: &CommandInteraction,
    context: &Context,
    state: Arc<RwLock<BouncerState>>,
    options: &[ResolvedOption<'_>],
) -> eyre::Result<()> {
    let command_name = command_interaction.data.name.as_str();

    debug!("running the `{command_name}` command...");

    match command_name {
        "ping" => {
            ping::Command::execute(context, command_interaction, &*state.read().await, options)
                .await
        }
        _ => Ok(()),
    }
}

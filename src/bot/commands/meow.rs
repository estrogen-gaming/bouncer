use serenity::builder::CreateCommand;

use crate::bot::{helpers::interaction_context::CommandInteractionContext, BouncerState};

use super::BouncerCommand;

pub struct Command;
impl BouncerCommand for Command {
    fn command() -> CreateCommand<'static> {
        CreateCommand::new("meow").description("meow :3")
    }

    async fn execute(
        interaction_context: CommandInteractionContext<'_>,
        _state: &BouncerState,
    ) -> eyre::Result<()> {
        interaction_context.reply_string("meow :3".into()).await?;

        Ok(())
    }
}

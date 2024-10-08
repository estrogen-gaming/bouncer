/// Just a command template for easily copy-pasting to a new command.
use crate::bot::{helpers::interaction_context::CommandInteractionContext, BouncerState};

use super::BouncerCommand;

pub struct Command;
impl<'a> BouncerCommand<'a> for Command {
    const COMMAND_NAME: &'a str = "meow";
    const COMMAND_DESCRIPTION: &'a str = "Meow.";

    async fn execute(
        interaction_context: CommandInteractionContext<'_>,
        _state: &BouncerState,
    ) -> anyhow::Result<()> {
        interaction_context
            .reply_string("meow :3", Some(true))
            .await?;

        Ok(())
    }
}

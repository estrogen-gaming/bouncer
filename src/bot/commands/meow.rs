use crate::bot::{helpers::interaction_context::CommandInteractionContext, BouncerState};

use super::BouncerCommand;

pub struct Command;
impl<'a> BouncerCommand<'a> for Command {
    const COMMAND_NAME: &'a str = "meow";
    const COMMAND_DESCRIPTION: &'a str = "meow :3";

    async fn execute(
        interaction_context: CommandInteractionContext<'_>,
        _state: &BouncerState,
    ) -> eyre::Result<()> {
        interaction_context
            .reply_string("meow :3".into(), Some(true))
            .await?;

        Ok(())
    }
}

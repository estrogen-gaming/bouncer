use serenity::{
    all::{CommandInteraction, ResolvedOption},
    builder::{CreateCommand, CreateInteractionResponse, CreateInteractionResponseMessage},
    client::Context,
};

use crate::bot::BouncerState;

use super::BouncerCommand;

pub struct Command;
impl BouncerCommand for Command {
    fn command() -> CreateCommand<'static> {
        CreateCommand::new("meow").description("meow :3")
    }

    async fn execute(
        context: &Context,
        interaction: &CommandInteraction,
        _state: &BouncerState,
        _options: &[ResolvedOption<'_>],
    ) -> eyre::Result<()> {
        interaction
            .create_response(
                &context.http,
                CreateInteractionResponse::Message(
                    CreateInteractionResponseMessage::new().content("meow :3"),
                ),
            )
            .await?;

        Ok(())
    }
}

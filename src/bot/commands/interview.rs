use serenity::{
    all::{CommandOptionType, CreateCommandOption, Mentionable},
    builder::CreateCommand,
};

use crate::bot::{
    extensions::resolved_options::ResolvedOptionExt,
    helpers::interaction_context::CommandInteractionContext, BouncerState,
};

use super::BouncerCommand;

pub struct Command;
impl<'a> BouncerCommand<'a> for Command {
    const COMMAND_NAME: &'static str = "interview";
    const COMMAND_DESCRIPTION: &'static str = "Interview an user.";

    fn command() -> CreateCommand<'a> {
        CreateCommand::new(Self::COMMAND_NAME)
            .description(Self::COMMAND_DESCRIPTION)
            .add_option(
                CreateCommandOption::new(CommandOptionType::User, "user", "The user to interview.")
                    .required(true),
            )
    }

    async fn execute(
        interaction_context: CommandInteractionContext<'_>,
        _state: &BouncerState,
    ) -> eyre::Result<()> {
        let Some((user, _member)) = interaction_context.options.get_user_and_member(0) else {
            interaction_context
                .reply_string("User not found.".into())
                .await?;
            return Ok(());
        };

        if user.bot() {
            interaction_context
                .reply_string("Bots can't be interviewed.".into())
                .await?;
            return Ok(());
        }

        interaction_context
            .reply_string(format!("user to meow: {}", user.id.mention()).into())
            .await?;

        Ok(())
    }
}

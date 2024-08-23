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
    const COMMAND_NAME: &'a str = "interview";
    const COMMAND_DESCRIPTION: &'a str = "Interview an user.";

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
        state: &BouncerState,
    ) -> anyhow::Result<()> {
        let Some((user, member)) = interaction_context.options.get_user_and_member(0) else {
            interaction_context
                .reply_string("User not found.", Some(true))
                .await?;
            return Ok(());
        };
        let Some(member) = member else {
            interaction_context
                .reply_string(
                    "This user does not seem to be a member of the server.",
                    Some(true),
                )
                .await?;
            return Ok(());
        };

        if user.bot() {
            interaction_context
                .reply_string("You cannot interview a bot.", Some(true))
                .await?;
            return Ok(());
        } else if user.id == interaction_context.interaction.user.id {
            interaction_context
                .reply_string("You cannot interview yourself.", Some(true))
                .await?;
            return Ok(());
        } else if state
            .context
            .roles
            .interviewers
            .iter()
            .any(|interviewer_role| member.roles.contains(&interviewer_role.id))
        {
            interaction_context
                .reply_string("You cannot interview an interviewer.", Some(true))
                .await?;
            return Ok(());
        }

        interaction_context
            .reply_string(format!("user to meow: {}", user.id.mention()), None)
            .await?;

        Ok(())
    }
}

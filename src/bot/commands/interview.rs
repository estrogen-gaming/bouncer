use serenity::{
    all::{CommandOptionType, CreateCommandOption, Mentionable, Permissions},
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
    const COMMAND_DESCRIPTION: &'a str = "Interview a user.";

    fn command() -> CreateCommand<'a> {
        CreateCommand::new(Self::COMMAND_NAME)
            .description(Self::COMMAND_DESCRIPTION)
            .add_option(
                CreateCommandOption::new(CommandOptionType::User, "user", "The user to interview.")
                    .required(true),
            )
            .add_option(
                CreateCommandOption::new(
                    CommandOptionType::String,
                    "type",
                    "The type of the interview.",
                )
                .add_string_choice("Text", "text")
                .add_string_choice("ID", "id")
                .required(true),
            )
            .default_member_permissions(Permissions::MANAGE_ROLES)
    }

    async fn execute(
        interaction_context: CommandInteractionContext<'_>,
        state: &BouncerState,
    ) -> anyhow::Result<()> {
        let (user, member) = match interaction_context.options.get_user_and_member(0) {
            Some((user, Some(member))) => (user, member),
            Some((_, None)) => {
                interaction_context
                    .reply_string("This user does not seem to be a member of the server.", Some(true))
                    .await?;
                return Ok(());
            }
            None => unreachable!("The user option is required."),
        };
        let interview_type = match interaction_context.options.get_string_option("type") {
            Some(interview_type) => interview_type,
            None => unreachable!("The type option is required."),
        };

        // TODO: Create a helper function for those.
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
            .any(|role| member.roles.contains(&role.id))
        {
            interaction_context
                .reply_string("You cannot interview an interviewer.", Some(true))
                .await?;
            return Ok(());
        }

        interaction_context
            .reply_string(
                format!(
                    "{} will be interviewed by `{interview_type}`",
                    user.id.mention()
                ),
                None,
            )
            .await?;

        Ok(())
    }
}

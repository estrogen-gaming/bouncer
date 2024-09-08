use chrono::{format::ParseErrorKind, Datelike, NaiveDate, Utc};
use serenity::all::{CommandOptionType, CreateCommand, CreateCommandOption};
use tracing::error;

use super::BouncerCommand;

use crate::bot::{
    extensions::resolved_options::ResolvedOptionExt,
    helpers::interaction_context::CommandInteractionContext, BouncerState,
};

pub struct Command;
impl<'a> BouncerCommand<'a> for Command {
    const COMMAND_NAME: &'a str = "dob";
    const COMMAND_DESCRIPTION: &'a str = "Calculate the age from given date of birth time.";

    fn command() -> CreateCommand<'a> {
        CreateCommand::new(Self::COMMAND_NAME)
            .description(Self::COMMAND_DESCRIPTION)
            .add_option(
                CreateCommandOption::new(
                    CommandOptionType::String,
                    "date",
                    "Date in `YYYY-MM-DD` format.",
                )
                .required(true),
            )
    }

    async fn execute(
        interaction_context: CommandInteractionContext<'_>,
        _state: &BouncerState,
    ) -> anyhow::Result<()> {
        let Some(date_input) = interaction_context.options.get_string_option("date") else {
            interaction_context
                .reply_string("Please enter a date.", Some(true))
                .await?;
            return Ok(());
        };

        let parsed_date = match NaiveDate::parse_from_str(date_input, "%Y-%m-%d") {
            Ok(date) => date,
            Err(error) => {
                let reply_string = match error.kind() {
                    ParseErrorKind::BadFormat => "The date should be entered in `YYYY-MM-DD` format.",
                    ParseErrorKind::OutOfRange => "Ensure the month is between 1 and 12, and the day is valid for the given month.",
                    ParseErrorKind::TooShort => "The date is incomplete. Please fill in the missing fields.",
                    _ => {
                        error!(
                            "an unexpected error occurred while parsing the date: {:?}",
                            error
                        );

                        "An unexpected error occurred while parsing the date."
                    }
                }.to_string();

                interaction_context
                    .reply_string(reply_string, Some(true))
                    .await?;

                return Ok(());
            }
        };

        let today = Utc::now();
        let mut age = today.year() - parsed_date.year();
        if today.month() < parsed_date.month()
            || today.month() == parsed_date.month() && today.day() < parsed_date.day()
        {
            age -= 1;
        }

        interaction_context
            .reply_string(format!("{age}"), Some(true))
            .await?;

        Ok(())
    }
}

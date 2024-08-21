use chrono::{format::ParseErrorKind, Datelike, NaiveDate, Utc};
use serenity::all::{
    CommandOptionType, CreateCommand, CreateCommandOption, FormattedTimestamp,
    FormattedTimestampStyle,
};

use crate::bot::{
    extensions::resolved_options::ResolvedOptionExt,
    helpers::interaction_context::CommandInteractionContext, BouncerState,
};

use super::BouncerCommand;

pub struct Command;
impl<'a> BouncerCommand<'a> for Command {
    const COMMAND_NAME: &'a str = "dob";
    const COMMAND_DESCRIPTION: &'a str = "Calculate the date of birth from given time.";

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
                // TODO: Improve this.
                let reply_string = match error.kind() {
                    ParseErrorKind::BadFormat => "The date should be in `YYYY-MM-DD` format.".to_string(),
                    ParseErrorKind::OutOfRange => "Ensure that your month value is within the range of 1 to 12, and your day value is correct depending on the month.".to_string(),
                    ParseErrorKind::TooShort => "The date is not entered completely. Add the missing fields.".to_string(),
                    _ => {
                        error!(
                            "an unexpected error occurred while parsing the date: {:?}",
                            error
                        );

                        "An unexpected error occurred while parsing the date.".to_string()
                    }
                };

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
            .reply_string(
                format!(
                    "The date of birth is {date_of_birth} and the age is {age}.",
                    date_of_birth = FormattedTimestamp::new(
                        parsed_date
                            .and_hms_opt(0, 0, 0)
                            .unwrap()
                            .and_local_timezone(Utc)
                            .unwrap()
                            .into(),
                        Some(FormattedTimestampStyle::LongDate)
                    ),
                ),
                Some(true),
            )
            .await?;

        Ok(())
    }
}

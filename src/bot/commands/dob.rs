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

    fn command() -> serenity::all::CreateCommand<'a> {
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
                .reply_string("Please enter a date.".into(), Some(true))
                .await?;
            return Ok(());
        };

        let parsed_date = match NaiveDate::parse_from_str(date_input, "%Y-%m-%d") {
            Ok(date) => date,
            Err(error) => {
                match error.kind() {
                    ParseErrorKind::BadFormat => {
                        interaction_context
                            .reply_string(
                                "The date should be in `YYYY-MM-DD` format.".into(),
                                Some(true),
                            )
                            .await?;
                    }
                    ParseErrorKind::OutOfRange => {
                        interaction_context
                            .reply_string(
                                "Ensure that your month value is within the range of 1 to 12, and your day value is correct depending on the month."
                                    .into(),
                                Some(true),
                            )
                            .await?;
                    }
                    ParseErrorKind::TooShort => {
                        interaction_context
                            .reply_string(
                                "The date is not entered completely. Add the missing fields."
                                    .into(),
                                Some(true),
                            )
                            .await?;
                    }
                    _ => {
                        error!(
                            "an unexpected error occurred while parsing the date: {:?}",
                            error
                        );
                        interaction_context
                            .reply_string(
                                "An unexpected error occurred while parsing the date.".into(),
                                Some(true),
                            )
                            .await?;
                    }
                }

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
                )
                .into(),
                Some(true),
            )
            .await?;

        Ok(())
    }
}

use std::borrow::Cow;

use serenity::all::{
    CommandInteraction, Context, CreateInteractionResponse, CreateInteractionResponseMessage,
    ResolvedOption,
};

pub struct CommandInteractionContext<'a> {
    pub context: &'a Context,
    pub interaction: &'a CommandInteraction,
    pub options: &'a [ResolvedOption<'a>],
}

impl<'a> CommandInteractionContext<'a> {
    pub async fn reply_string(
        &self,
        message: Cow<'a, str>,
        ephemeral: Option<bool>,
    ) -> eyre::Result<(), serenity::Error> {
        self.interaction
            .create_response(
                &self.context.http,
                CreateInteractionResponse::Message(
                    CreateInteractionResponseMessage::new()
                        .content(message)
                        .ephemeral(ephemeral.unwrap_or(false)),
                ),
            )
            .await
    }
}

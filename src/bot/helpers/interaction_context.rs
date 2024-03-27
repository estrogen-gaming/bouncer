use std::borrow::Cow;

use serenity::{
    all::{
        CommandInteraction, Context, CreateInteractionResponse, CreateInteractionResponseMessage,
        ResolvedOption,
    },
    Error as SerenityError,
};

pub struct CommandInteractionContext<'a> {
    pub context: &'a Context,
    pub interaction: &'a CommandInteraction,
    pub options: &'a [ResolvedOption<'a>],
}

impl CommandInteractionContext<'_> {
    pub async fn reply_string(&self, message: Cow<'_, str>) -> eyre::Result<(), SerenityError> {
        self.interaction
            .create_response(
                &self.context.http,
                CreateInteractionResponse::Message(
                    CreateInteractionResponseMessage::new().content(message),
                ),
            )
            .await
    }
}

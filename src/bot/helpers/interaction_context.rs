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
        message: impl ToString + Send,
        ephemeral: Option<bool>,
    ) -> anyhow::Result<(), serenity::Error> {
        self.interaction
            .create_response(
                &self.context.http,
                CreateInteractionResponse::Message(
                    CreateInteractionResponseMessage::new()
                        .content(message.to_string())
                        .ephemeral(ephemeral.unwrap_or(false)),
                ),
            )
            .await
    }
}

use serenity::{all::GatewayIntents, Client};

pub mod event_handler;

pub struct BouncerBot {
    token: String,
}

impl BouncerBot {
    pub fn new(token: String) -> Self {
        Self { token }
    }

    pub async fn start(&self) -> eyre::Result<()> {
        let mut client = Client::builder(
            &self.token,
            GatewayIntents::GUILDS | GatewayIntents::GUILD_MESSAGES | GatewayIntents::GUILD_MEMBERS,
        )
        .event_handler(event_handler::BouncerEventHandler)
        .await?;

        trace!("starting the Discord bot...");
        client.start().await?;

        Ok(())
    }
}

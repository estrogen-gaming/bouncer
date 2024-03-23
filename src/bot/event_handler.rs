use serenity::all::{Context, EventHandler, Ready};

pub struct BouncerEventHandler;
#[serenity::async_trait]
impl EventHandler for BouncerEventHandler {
    async fn ready(&self, _context: &Context, ready: &Ready) {
        info!(
            "bot is connected to Discord and ready to serve as `{}`!",
            ready.user.name
        );
    }
}

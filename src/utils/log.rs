use std::path::PathBuf;

use tracing_subscriber::{fmt, layer::SubscriberExt, EnvFilter};

/// Sets-up [`tracing`](https://docs.rs/tracing) for logging to both
/// [`std::io::stdout()`](https://doc.rust-lang.org/stable/std/io/fn.stdout.html)
/// and [`tracing_appender::rolling::hourly()`](https://docs.rs/tracing-appender/latest/tracing_appender/rolling/fn.hourly.html).
pub fn set_up(logs_folder: Option<PathBuf>) -> eyre::Result<()> {
    let collector = tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("bouncer=info")))
        .with(fmt::Layer::new().with_writer(std::io::stdout))
        .with(
            fmt::Layer::new()
                .with_ansi(false)
                .with_writer(tracing_appender::rolling::hourly(
                    logs_folder.unwrap_or_else(|| "logs/".into()),
                    "bouncer.log",
                )),
        );

    tracing::subscriber::set_global_default(collector)?;

    trace!("set up logger");

    Ok(())
}

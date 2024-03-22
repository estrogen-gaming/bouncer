use tracing_subscriber::{fmt, layer::SubscriberExt, EnvFilter};

/// Sets-up [`tracing`](https://docs.rs/tracing) for logging to both
/// [`std::io::stdout()`](https://doc.rust-lang.org/stable/std/io/fn.stdout.html)
/// and [`tracing_appender::rolling::hourly()`](https://docs.rs/tracing-appender/latest/tracing_appender/rolling/fn.hourly.html).
pub fn set_up(logs_folder: Option<&str>) -> eyre::Result<()> {
    let collector = tracing_subscriber::registry()
        .with(EnvFilter::from_default_env().add_directive(tracing::Level::INFO.into()))
        .with(fmt::Layer::new().with_writer(std::io::stdout))
        .with(
            fmt::Layer::new()
                .with_ansi(false)
                //* We can use `non_blocking` here, but if we early exit the app
                //* logs won't be written.
                .with_writer(tracing_appender::rolling::hourly(
                    logs_folder.unwrap_or("logs/"),
                    "bouncer.log",
                )),
        );

    tracing::subscriber::set_global_default(collector)?;

    Ok(())
}

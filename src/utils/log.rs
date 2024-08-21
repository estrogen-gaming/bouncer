use std::{io, path::PathBuf};

use tracing::{Level, Metadata};
use tracing_subscriber::{
    fmt::{self, MakeWriter},
    layer::SubscriberExt,
    EnvFilter,
};

struct BouncerStdWriter {
    stdout: io::Stdout,
    stderr: io::Stderr,
}

enum StdIOLock<'a> {
    Stdout(io::StdoutLock<'a>),
    Stderr(io::StderrLock<'a>),
}

impl BouncerStdWriter {
    fn new() -> Self {
        Self {
            stdout: io::stdout(),
            stderr: io::stderr(),
        }
    }
}

impl<'a> io::Write for StdIOLock<'a> {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        match self {
            Self::Stdout(stdout) => stdout.write(buf),
            Self::Stderr(stderr) => stderr.write(buf),
        }
    }

    fn flush(&mut self) -> io::Result<()> {
        match self {
            Self::Stdout(stdout) => stdout.flush(),
            Self::Stderr(stderr) => stderr.flush(),
        }
    }
}

impl<'a> MakeWriter<'a> for BouncerStdWriter {
    type Writer = StdIOLock<'a>;

    fn make_writer(&'a self) -> Self::Writer {
        StdIOLock::Stdout(self.stdout.lock())
    }

    fn make_writer_for(&'a self, meta: &Metadata<'_>) -> Self::Writer {
        if meta.level() <= &Level::WARN {
            return StdIOLock::Stderr(self.stderr.lock());
        }

        StdIOLock::Stdout(self.stdout.lock())
    }
}

/// Sets-up [`tracing`](https://docs.rs/tracing) for logging to both
/// [`std::io::stdout()`](https://doc.rust-lang.org/stable/std/io/fn.stdout.html)
/// and [`tracing_appender::rolling::hourly()`](https://docs.rs/tracing-appender/latest/tracing_appender/rolling/fn.hourly.html).
pub fn set_up(logs_folder: PathBuf) -> anyhow::Result<()> {
    let std_writer = BouncerStdWriter::new();

    let collector =
        tracing_subscriber::registry()
            .with(
                EnvFilter::try_from_default_env()
                    .unwrap_or_else(|_| EnvFilter::new("bouncer=info")),
            )
            .with(fmt::Layer::new().with_writer(std_writer))
            .with(fmt::Layer::new().with_ansi(false).with_writer(
                tracing_appender::rolling::hourly(logs_folder, "bouncer.log"),
            ));

    tracing::subscriber::set_global_default(collector)?;

    trace!("set up logger");

    Ok(())
}

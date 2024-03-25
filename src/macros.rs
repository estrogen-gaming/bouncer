macro_rules! error_exit {
    ($($arg:tt)*) => {
        error!($($arg)*);
        std::process::exit(1);
    };
}

pub(crate) use error_exit;

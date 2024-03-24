#![macro_use]
macro_rules! error_exit {
    ($($arg:tt)*) => {
        error!($($arg)*);
        std::process::exit(1);
    };
}

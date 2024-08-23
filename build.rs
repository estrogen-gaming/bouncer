fn main() {
    //* Re-compile if a migration file gets updates or added.
    println!("cargo:rerun-if-changed=migrations");
}

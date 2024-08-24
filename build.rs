fn main() {
    //* Re-compile if a migration file gets updated or added.
    println!("cargo:rerun-if-changed=migrations");
}

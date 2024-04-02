use serenity::all::{PartialMember, ResolvedOption, ResolvedValue, User};

pub trait ResolvedOptionExt {
    fn get_string_option(&self, name: &str) -> Option<&str>;

    fn get_user_and_member(&self, index: usize) -> Option<(&User, Option<&PartialMember>)>;
}

impl ResolvedOptionExt for &[ResolvedOption<'_>] {
    fn get_string_option(&self, name: &str) -> Option<&str> {
        self.iter()
            .find(|option| option.name == name)
            .and_then(|option| {
                if let ResolvedValue::String(value) = option.value {
                    Some(value)
                } else {
                    None
                }
            })
    }

    fn get_user_and_member(&self, index: usize) -> Option<(&User, Option<&PartialMember>)> {
        match self.get(index) {
            Some(ResolvedOption {
                value: ResolvedValue::User(user, member),
                ..
            }) => Some((user, *member)),
            _ => None,
        }
    }
}

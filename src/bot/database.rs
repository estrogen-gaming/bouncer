use chrono::NaiveDateTime;
use sqlx::{FromRow, Type};

#[derive(Type, Debug, Default)]
#[sqlx(rename_all = "lowercase")]
pub enum UserStatus {
    #[default]
    #[sqlx(default)]
    Pending,
    Ongoing,
    Approved,
    Rejected,
}

impl From<String> for UserStatus {
    fn from(value: String) -> Self {
        match value.as_str() {
            "pending" => Self::Pending,
            "ongoing" => Self::Ongoing,
            "approved" => Self::Approved,
            "rejected" => Self::Rejected,
            _ => unreachable!(),
        }
    }
}

#[derive(Type, Debug, Default)]
#[sqlx(rename_all = "lowercase")]
pub enum InterviewType {
    #[default]
    #[sqlx(default)]
    Text,
    ID,
}

impl std::fmt::Display for InterviewType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            &InterviewType::Text => write!(f, "text"),
            &InterviewType::ID => write!(f, "id"),
        }
    }
}

#[derive(FromRow, Debug)]
pub struct User {
    pub user_id: i64,

    pub status: UserStatus,

    #[sqlx(default)]
    pub mark_date: NaiveDateTime,
}

#[derive(FromRow, Debug)]
pub struct Interview {
    pub id: i32,

    pub user_id: i64,
    pub interviewer_id: i64,

    pub r#type: InterviewType,

    #[sqlx(default)]
    pub interview_date: NaiveDateTime,
}

use serenity::all::{Context, Guild, GuildChannel, Role};

use crate::config;

#[derive(Debug, Default)]
pub struct BouncerContext {
    is_populated: bool,

    pub guild: Guild,
    pub channels: Channels,
    pub roles: Roles,
}

#[derive(Debug, Default)]
pub struct Channels {
    pub interview_marks: GuildChannel,
}

#[derive(Debug, Default)]
pub struct Roles {
    pub interviewers: Vec<Role>,

    pub pending_interview: Role,
    pub ongoing_interview: Role,

    pub text_verified: Role,
    pub id_verified: Role,
}

impl BouncerContext {
    // TODO: Look into this for usin `Result` instead of `Option`.
    #[allow(clippy::cognitive_complexity)]
    pub fn try_populate(
        context: &Context,
        discord_config: &config::Discord,
    ) -> anyhow::Result<Self> {
        trace!("populating the context...");

        let guild = context
            .cache
            .guild(discord_config.guild_id.into())
            .map_or_else(
                || {
                    anyhow::bail!(
                        "guild for `guild_id` with the id `{}` could not be found",
                        discord_config.guild_id
                    );
                },
                Ok,
            )?;

        let interview_marks_channel = match guild
            .channels
            .get(&discord_config.channels.interview_marks_id.into())
        {
            Some(channel) => channel,
            None => {
                anyhow::bail!(
                    "channel for `interview_marks_id` with the id `{}` could not be found",
                    discord_config.channels.interview_marks_id
                );
            }
        };

        let interviewer_roles: Vec<&Role> = discord_config
            .roles
            .interviewer_ids
            .iter()
            .filter_map(|role_id| guild.roles.get(&(*role_id).into()))
            .collect();

        if interviewer_roles.is_empty() {
            anyhow::bail!(
                "roles for `interviewer_ids` with ids `{:?}` could not be found",
                discord_config.roles.interviewer_ids
            );
        }

        let pending_interview_role = match guild
            .roles
            .get(&discord_config.roles.pending_interview_id.into())
        {
            Some(role) => role,
            None => {
                anyhow::bail!(
                    "role for `pending_interview_id` with the id `{}` could not be found",
                    discord_config.roles.pending_interview_id
                );
            }
        };

        let ongoing_interview_role = match guild
            .roles
            .get(&discord_config.roles.ongoing_interview_id.into())
        {
            Some(role) => role,
            None => {
                anyhow::bail!(
                    "role for `ongoing_interview_id` with the id `{}` could not be found",
                    discord_config.roles.ongoing_interview_id
                );
            }
        };

        let text_verified_role = match guild
            .roles
            .get(&discord_config.roles.text_verified_id.into())
        {
            Some(role) => role,
            None => {
                anyhow::bail!(
                    "role for `text_verified_id` with the id `{}` could not be found",
                    discord_config.roles.text_verified_id
                );
            }
        };

        let id_verified_role = match guild.roles.get(&discord_config.roles.id_verified_id.into()) {
            Some(role) => role,
            None => {
                anyhow::bail!(
                    "role for `id_verified_id` with the id `{}` could not be found",
                    discord_config.roles.id_verified_id
                );
            }
        };

        trace!("populated the context");

        Ok(Self {
            is_populated: true,
            guild: guild.to_owned(),
            channels: Channels {
                interview_marks: interview_marks_channel.to_owned(),
            },
            roles: Roles {
                interviewers: interviewer_roles.into_iter().cloned().collect(),
                pending_interview: pending_interview_role.to_owned(),
                ongoing_interview: ongoing_interview_role.to_owned(),
                text_verified: text_verified_role.to_owned(),
                id_verified: id_verified_role.to_owned(),
            },
        })
    }

    pub const fn is_populated(&self) -> bool {
        self.is_populated
    }
}

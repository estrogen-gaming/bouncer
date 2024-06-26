use serenity::all::{Context, Guild, GuildChannel, Role};

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
    #[allow(clippy::cognitive_complexity)]
    pub fn try_populate(
        context: &Context,
        discord_config: &crate::config::Discord,
    ) -> Option<Self> {
        trace!("populating the context...");

        if let Some(guild) = context.cache.guild(discord_config.guild_id.into()) {
            let interview_marks_channel = guild
                .channels
                .get(&discord_config.channels.interview_marks_id.into());

            let interviewer_roles = discord_config
                .roles
                .interviewer_ids
                .iter()
                .filter_map(|role_id| guild.roles.get(&(*role_id).into()))
                .collect::<Vec<&Role>>();

            let pending_interview_role = guild
                .roles
                .get(&discord_config.roles.pending_interview_id.into());
            let ongoing_interview_role = guild
                .roles
                .get(&discord_config.roles.ongoing_interview_id.into());

            let text_verified_role = guild
                .roles
                .get(&discord_config.roles.text_verified_id.into());
            let id_verified_role = guild.roles.get(&discord_config.roles.id_verified_id.into());

            if interview_marks_channel.is_none() {
                error!(
                    "channel for `interview_marks_id` with the id `{}` could not be found",
                    discord_config.channels.interview_marks_id
                );
                return None;
            }

            if interviewer_roles.is_empty() {
                error!(
                    "role for `interviewer_ids` with ids `{:?}` could not be found",
                    discord_config.roles.interviewer_ids
                );
                return None;
            }

            if pending_interview_role.is_none() {
                error!(
                    "role for `pending_interview_id` with the id `{}` could not be found",
                    discord_config.roles.pending_interview_id
                );
                return None;
            }

            if ongoing_interview_role.is_none() {
                error!(
                    "role for `ongoing_interview_id` with the id `{}` could not be found",
                    discord_config.roles.ongoing_interview_id
                );
                return None;
            }

            if text_verified_role.is_none() {
                error!(
                    "text verified role with the id {} could not be found",
                    discord_config.roles.text_verified_id
                );
                return None;
            }

            if id_verified_role.is_none() {
                error!(
                    "id verified role with the id {} could not be found",
                    discord_config.roles.id_verified_id
                );
                return None;
            }

            trace!("populated the context");

            return Some(Self {
                is_populated: true,

                guild: guild.to_owned(),
                channels: Channels {
                    interview_marks: interview_marks_channel.unwrap().to_owned(),
                },
                roles: Roles {
                    interviewers: interviewer_roles
                        .into_iter()
                        .map(std::borrow::ToOwned::to_owned)
                        .collect(),

                    pending_interview: pending_interview_role.unwrap().to_owned(),
                    ongoing_interview: ongoing_interview_role.unwrap().to_owned(),

                    text_verified: text_verified_role.unwrap().to_owned(),
                    id_verified: id_verified_role.unwrap().to_owned(),
                },
            });
        }

        error!(
            "server with the id `{}` could not be found",
            discord_config.guild_id
        );

        None
    }

    pub const fn is_populated(&self) -> bool {
        self.is_populated
    }
}

import { DiscordAPIError, Guild, type GuildMember, PermissionFlagsBits } from '@npm/discord.js';

import { BouncerBot } from './bouncer.ts';
import { InterviewStatus, UserData } from '../database.ts';

/**
 * Check if user has been interviewed. If not, add them to the pending interview
 * role and send a message to the interview flags channel.
 *
 * @param bot Bot instance.
 * @param guild Current guild instance.
 * @param member Event invoker member instance.
 * @returns
 */
export const checkUserInterviewStatus = async (bot: BouncerBot, member: GuildMember) => {
  const existsUser = await bot.database?.get<UserData>(['users', member.user.id]);
  if (existsUser?.value && existsUser.value.interviewStatus) {
    bot.logger.warn(`User \`${member.user.id} (${member.user.globalName})\` has already been interviewed. Ignoring...`);
    return;
  }

  await member.roles.add(bot.context.roles.pendingInterview)
    .catch((error) => {
      if (error instanceof DiscordAPIError && error.code === 50013) {
        bot.logger.error(
          `Bot does not have permission to add roles to user \`${member.user.id} (${member.user.globalName})\`.\nAre you sure bot's role is higher than the role you want to add?`,
        );
      } else {
        bot.logger.error(`An unexpected error occurred in \`${checkUserInterviewStatus.name}\` function: ${error}`);
      }

      return;
    });

  //* We've already ensured that this channel is in fact a
  //* text channel in bots ready event.
  const interviewFlagsChannel = bot.context.channels.interviewFlagsChannel;

  await bot.database?.set(
    ['users', member.user.id],
    {
      interviewStatus: InterviewStatus.Unapproved,
    } satisfies UserData,
  );

  // TODO: Mention the command instead of sending it directly.
  interviewFlagsChannel?.send(`${member} marked as pending interview. To interview them, use /interview command.`);
};

export const endInterview = async (bot: BouncerBot, member: GuildMember) => {
  const existsUser = await bot.database?.get<UserData>(['users', member.user.id]);
  if (!existsUser?.value || !existsUser.value.interviewStatus) {
    bot.logger.warn(`User \`${member.user.id} (${member.user.globalName})\` has not been interviewed. Ignoring...`);
    return;
  }

  await member.roles.remove(bot.context.roles.pendingInterview)
    .catch((error) => {
      if (error instanceof DiscordAPIError && error.code === 50013) {
        bot.logger.error(
          `Bot does not have permission to remove roles from user \`${member.user.id} (${member.user.globalName})\`.\nAre you sure bot's role is higher than the role you want to remove?`,
        );
      } else {
        bot.logger.error(`An unexpected error occurred in \`${endInterview.name}\` function: ${error}`);
      }

      return;
    });

  await bot.database?.set(
    ['users', member.user.id],
    {
      interviewStatus: InterviewStatus.ApprovedByText,
    } satisfies UserData,
  );
};

// /**
//  * Removes users `ViewChannel `access to all categories
//  * in the server.
//  */
// export function removeUserAccess(
//   bot: BouncerBot,
//   member: GuildMember,
// ) {
//   return bot.channels.cache
//     .filter((channel) => channel.type === ChannelType.GuildCategory && channel.id !== bot.config.interviewsCategoryId)
//     .every((category) => {
//       //* We've ensured that `category` is a `CategoryChannel` with `filter()`
//       //* above, so its safe to cast it to that type. If there's a better way
//       //* of ensuring its type though, please use that instead.
//       category = category as CategoryChannel;

//       category.permissionOverwrites.create(member.user.id, {
//         ViewChannel: false,
//       });
//     });
// }

/**
 * Create an interview channel in the `config.interviewsCategory`
 * for the user.
 */
export async function createInterviewChannel(bot: BouncerBot, guild: Guild, member: GuildMember) {
  const createdChannel = await guild.channels.create({
    name: `verification-interview-${member.user.id}`,
    parent: bot.context.channels.interviewsCategory,
    permissionOverwrites: [
      {
        id: member.user.id,
        allow: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
    ],
  });

  return createdChannel;
}

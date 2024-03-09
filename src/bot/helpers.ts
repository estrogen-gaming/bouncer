import { ChannelType, DiscordAPIError, Guild, type GuildMember, PermissionFlagsBits } from '@npm/discord.js';

import { BouncerBot } from './bouncer.ts';
import { UserData } from '../database.ts';
import { InterviewStatus } from '../database.ts';
import { DiscordConfig } from '../config.ts';

/**
 * Check if user has been interviewed. If not, add them to the pending interview
 * role and send a message to the interview flags channel.
 *
 * @param bot Bot instance.
 * @param guild Current guild instance.
 * @param member Event invoker member instance.
 * @returns
 */
export const checkUserInterviewStatus = async (bot: BouncerBot, guild: Guild, member: GuildMember) => {
  const existsUser = await bot.database?.get<UserData>(['users', member.user.id]);
  if (existsUser?.value && existsUser.value.interviewStatus) {
    bot.logger.warn(`User \`${member.user.id} (${member.user.globalName})\` has already been interviewed. Ignoring...`);
    return;
  }

  await member.roles.add(bot.config.roles.pendingInterviewId)
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

  // TODO: Create a function for ensuring that every
  // configuration field exists and is the desired kind.
  const interviewFlagsChannel = guild.channels.cache.get(bot.config.channels.interviewFlagsId);
  if (!interviewFlagsChannel) {
    bot.logger.error(
      `Channel for \`interviewFlagsChannel\` with the id \`${bot.config.channels.interviewFlagsId}\` could not be found.`,
    );

    return;
  }

  if (interviewFlagsChannel.type !== ChannelType.GuildText) {
    bot.logger.error(
      `Channel for \`interviewFlagsChannel\` with the id \`${bot.config.channels.interviewFlagsId}\` is not a text channel.`,
    );

    return;
  }

  await bot.database?.set(
    ['users', member.user.id],
    {
      interviewStatus: InterviewStatus.Unapproved,
    } satisfies UserData,
  );

  // TODO: Mention the command instead of sending it directly.
  interviewFlagsChannel.send(`${member} marked as pending interview. To interview them, use /interview command.`);
};

export const endInterview = async (bot: BouncerBot, member: GuildMember) => {
  const existsUser = await bot.database?.get<UserData>(['users', member.user.id]);
  if (!existsUser?.value || !existsUser.value.interviewStatus) {
    bot.logger.warn(`User \`${member.user.id} (${member.user.globalName})\` has not been interviewed. Ignoring...`);
    return;
  }

  await member.roles.remove(bot.config.roles.pendingInterviewId)
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
    parent: bot.config.interviewsCategoryId,
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

/**
 * Ensure that specified configuration fields exist in guild and are the desired kind.
 *
 * @param bot Bot instance.
 * @param guild Guild instance.
 * @param config Bot configuration
 */
export function ensureConfig(bot: BouncerBot, config: Omit<DiscordConfig, 'token'>) {
  let success = true;

  const guild = bot.guilds.cache.get(config.serverId);

  const interviewsCategory = bot.channels.cache.get(bot.config.interviewsCategoryId);
  const interviewFlagsChannel = bot.channels.cache.get(config.channels.interviewFlagsId);

  if (!guild) {
    bot.logger.error(`Guild with the id \`${config.serverId}\` could not be found.`);
    return false;
  }

  const pendingInterviewRole = guild.roles.cache.get(config.roles.pendingInterviewId);
  const nsfwAccessRole = guild.roles.cache.get(config.roles.nsfwAccessId);
  const nsfwVerifiedRole = guild.roles.cache.get(config.roles.nsfwVerifiedId);

  // Check interviews category
  if (!interviewsCategory) {
    bot.logger.error(
      `Category for \`interviewsCategoryId\` with the id \`${bot.config.interviewsCategoryId}\` could not be found.`,
    );
    success = false;
  } else if (interviewsCategory?.type !== ChannelType.GuildCategory) {
    bot.logger.error(
      `Channel for \`interviewsCategoryId\` with the id \`${bot.config.interviewsCategoryId}\` is not a category.`,
    );
    success = false;
  }

  // Check channels
  if (!interviewFlagsChannel) {
    bot.logger.error(
      `Channel for \`interviewFlagsId\` with the id \`${config.channels.interviewFlagsId}\` could not be found.`,
    );
    success = false;
  } else if (interviewFlagsChannel?.type !== ChannelType.GuildText) {
    bot.logger.error(
      `Channel for \`interviewFlagsId\` with the id \`${config.channels.interviewFlagsId}\` is not a text channel.`,
    );
    success = false;
  }

  // Check roles
  if (!pendingInterviewRole) {
    bot.logger.error(
      `Role for \`pendingInterviewId\` with the id \`${config.roles.pendingInterviewId}\` could not be found.`,
    );
    success = false;
  }

  if (!nsfwAccessRole) {
    bot.logger.error(
      `Role for \`nsfwAccessId\` with the id \`${config.roles.nsfwAccessId}\` could not be found.`,
    );
    success = false;
  }

  if (!nsfwVerifiedRole) {
    bot.logger.error(
      `Role for \`nsfwVerifiedId\` with the id \`${config.roles.nsfwVerifiedId}\` could not be found.`,
    );
    success = false;
  }

  return success ? true : Deno.exit(1);
}

import { DiscordAPIError, Guild, type GuildMember, PermissionFlagsBits } from '@npm/discord.js';

import { BouncerBot } from './bouncer.ts';
import { InterviewStatus, UserData } from '../database.ts';
import { InterviewType } from '../database.ts';

/**
 * Check if user has been interviewed. If not, add them to the pending interview
 * role and send a message to the interview flags channel.
 *
 * @param bot Bot instance.
 * @param guild Current guild instance.
 * @param member Event invoker member instance.
 * @returns *void*
 */
export const checkUserInterviewStatus = async (bot: BouncerBot, member: GuildMember) => {
  const existsUser = await bot.database.get<UserData>(['users', member.user.id]);
  if (existsUser?.value?.interview.status === InterviewStatus.Approved) {
    bot.logger.warn(`User \`${member.user.globalName} (${member.user.id})\` has already been interviewed. Ignoring...`);
    return;
  } else if (existsUser?.value?.interview.status === InterviewStatus.Ongoing) {
    bot.logger.warn(`User \`${member.user.globalName} (${member.user.id})\` is on an ongoing interview. Ignoring...`);
    return;
  } else if (existsUser?.value?.interview.status === InterviewStatus.Disapproved) {
    bot.logger.warn(
      `User \`${member.user.globalName} (${member.user.id})\` has been disapproved in an interview. Ignoring...`,
    );
    return;
  }

  try {
    await member.roles.add(bot.context.roles.pendingInterview);
  } catch (error) {
    if (error instanceof DiscordAPIError && error.code === 50013) {
      bot.logger.error(
        `Bot does not have permission to add roles to user \`${member.user.globalName} (${member.user.id})\`.\nAre you sure bot's role is higher than the role you want to add?`,
      );
    } else {
      bot.logger.error(`An unexpected error occurred in \`${checkUserInterviewStatus.name}\` function: ${error}`);
    }

    return;
  } finally {
    const interviewFlagsChannel = bot.context.channels.interviewFlagsChannel;

    await bot.database.set(
      ['users', member.user.id],
      {
        interview: {
          status: InterviewStatus.Pending,
        },
      } satisfies UserData,
    );

    // TODO: Mention the command instead of sending it directly.
    interviewFlagsChannel.send(`${member} marked as pending interview. To interview them, use /interview command.`);
  }
};

export const endInterview = async (bot: BouncerBot, member: GuildMember, interviewType: InterviewType) => {
  const existsUser = await bot.database.get<UserData>(['users', member.user.id]);
  if (existsUser?.value?.interview.status !== InterviewStatus.Ongoing) {
    bot.logger.warn(`User \`${member.user.globalName} (${member.user.id})\` is not being interviewed. Ignoring...`);
    return;
  }

  try {
    await member.roles.add(bot.context.roles.nsfwVerified);
  } catch (error) {
    if (error instanceof DiscordAPIError && error.code === 50013) {
      bot.logger.error(
        `Bot does not have permission to add roles to user \`${member.user.globalName} (${member.user.id})\`.\nAre you sure bot's role is higher than the role you want to add?`,
      );
    } else {
      bot.logger.error(`An unexpected error occurred in \`${endInterview.name}\` function: ${error}`);
    }

    return;
  } finally {
    await bot.database.set(
      ['users', member.user.id],
      {
        interview: {
          type: interviewType,
          status: InterviewStatus.Approved,
        },
      } satisfies UserData,
    );
  }
};

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

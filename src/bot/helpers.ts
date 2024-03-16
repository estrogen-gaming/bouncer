import {
  ChannelType,
  CommandInteraction,
  DiscordAPIError,
  Guild,
  type GuildMember,
  PermissionFlagsBits,
} from '@npm/discord.js';

import { BouncerBot } from './bouncer.ts';
import { InterviewStatus, InterviewType, UserData } from '../database.ts';

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

export const endInterview = async (
  bot: BouncerBot,
  member: GuildMember,
  interview: {
    type: InterviewType;
    status: InterviewStatus.Approved | InterviewStatus.Disapproved;
  },
) => {
  const userData = await bot.database.get<UserData>(['users', member.user.id]);
  if (!userData?.value) {
    bot.logger.warn(`User \`${member.user.globalName} (${member.user.id})\` is not pending for approval. Ignoring...`);
    return false;
  } else if (userData?.value?.interview.status !== InterviewStatus.Ongoing) {
    bot.logger.warn(`User \`${member.user.globalName} (${member.user.id})\` is not being interviewed. Ignoring...`);
    return false;
  }

  try {
    if (interview.status === InterviewStatus.Approved) {
      await member.roles.add(bot.context.roles.nsfwVerified);
    }

    //* `channelId` is guaranteed to be present here, since it's an ongoing interview.
    const userInterviewChannel = member.guild.channels.cache.get(userData.value.interview.channelId!);
    if (!userInterviewChannel) {
      bot.logger.warn(
        `Interview channel for user \`${member.user.globalName} (${member.user.id})\` not found. Skipping removing user permissions from that channel...`,
      );
    } else if (userInterviewChannel.type !== ChannelType.GuildText) {
      bot.logger.warn(
        `Interview channel for user \`${member.user.globalName} (${member.user.id})\` is not a text channel. Skipping removing user permissions from that channel...`,
      );
    } else {
      await userInterviewChannel.permissionOverwrites.delete(member.user.id);
    }

    await member.roles.remove(bot.context.roles.pendingInterview);
  } catch (error) {
    if (error instanceof DiscordAPIError && error.code === 50013) {
      bot.logger.error(
        `Bot does not have permission to add/remove roles to user \`${member.user.globalName} (${member.user.id})\`.\nAre you sure bot's role is higher than the role you want to add?`,
      );
    } else {
      bot.logger.error(`An unexpected error occurred in \`${endInterview.name}\` function: ${error}`);
    }

    return false;
  } finally {
    await bot.database.set(
      ['users', member.user.id],
      {
        interview: {
          type: interview.type,
          status: interview.status,
        },
      } satisfies UserData,
    );
  }

  return true;
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

export async function checkInteractionMember(interaction: CommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const member = interaction.guild?.members.cache.get(user.id);

  if (user.bot) {
    await interaction.reply({
      content: 'Bots cannot be interviewed.',
      ephemeral: true,
    });
    return null;
  } else if (!member) {
    await interaction.reply({
      content: 'Guild member not found.',
      ephemeral: true,
    });
    return null;
  }

  if (!member) {
    interaction.reply({
      content: 'Member not found.',
      ephemeral: true,
    });
    return null;
  }

  return member;
}

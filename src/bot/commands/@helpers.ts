import {
  ChannelType,
  CommandInteraction,
  DiscordAPIError,
  Guild,
  type GuildMember,
  PermissionFlagsBits,
} from '@npm/discord.js';

import { BouncerBot } from '../bouncer.ts';
import { InterviewStatus, InterviewType, UserData } from '../../database.ts';

export const startInterview = async (
  bot: BouncerBot,
  member: GuildMember,
  interviewType: InterviewType = InterviewType.Text,
) => {
  const userData = await bot.database.get<UserData>(['users', member.user.id]);
  if (userData?.value?.interview.status !== InterviewStatus.Pending) {
    bot.logger.warn(`User \`${member.user.globalName} (${member.user.id})\` is not pending for interview. Ignoring...`);
    return null;
  }

  bot.logger.info(
    `Starting \`${interviewType}\` type interview for user \`${member.user.globalName} (${member.user.id})\`.`,
  );

  const interviewChannel = await createInterviewChannel(bot, member.guild, member, interviewType);

  // TODO: Create a helper for this.
  try {
    await member.roles.add(bot.context.roles.ongoingInterview);
    await member.roles.remove(bot.context.roles.pendingInterview);
  } catch (error) {
    if (error instanceof DiscordAPIError && error.code === 50013) {
      bot.logger.error(
        `Bot does not have permission to add roles to user \`${member.user.globalName} (${member.user.id})\`.\nAre you sure bot's role is higher than the role you want to add?`,
      );
    } else {
      bot.logger.error(`An unexpected error occurred in \`${startInterview.name}\` function: ${error}`);
    }

    return null;
  }

  await bot.database.set(
    ['users', member.user.id],
    {
      interview: {
        type: interviewType,
        status: InterviewStatus.Ongoing,
        channelId: interviewChannel.id,
      },
    } satisfies UserData,
  );

  bot.logger.info(
    `Started interview for \`${member.user.globalName} (${member.user.id})\` in \`${interviewChannel.name} (${interviewChannel.id})\`.`,
  );

  return interviewChannel;
};

export const startSelfIDInterview = async (interaction: CommandInteraction) => {
  const bot = interaction.client as BouncerBot;
  const member = interaction.member;

  if (!member) return null;

  const userData = await bot.database.get<UserData>(['users', member.user.id]);
  if (userData.value?.interview.status === InterviewStatus.Approved) {
    if (userData.value.interview.type === InterviewType.Id) {
      await interaction.reply({
        content: "You're already verified by ID.",
        ephemeral: true,
      });
      return;
    }
  } else {
    await interaction.reply({
      content: "You're not verified by text yet to be verified by ID. Please get verified by text first.",
      ephemeral: true,
    });
    return;
  }

  const interviewChannel = await createInterviewChannel(bot, member.guild, member, InterviewType.Id);

  await bot.database.set(
    ['users', member.user.id],
    {
      interview: {
        type: InterviewType.Id,
        status: InterviewStatus.Ongoing,
        channelId: interviewChannel.id,
      },
    } satisfies UserData,
  );

  bot.logger.info(
    `Started self ID interview for user \`${member.user.globalName} (${member.user.id})\`.`,
  );

  await interaction.reply({
    content: `Interview channel ${interviewChannel} has been created for you.`,
    ephemeral: true,
  });

  return interviewChannel;
};

export const endInterview = async (
  bot: BouncerBot,
  member: GuildMember,
  interview: {
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

  bot.logger.info(`Ending interview for user \`${member.user.globalName} (${member.user.id})\`.`);

  try {
    if (interview.status === InterviewStatus.Approved) {
      if (userData.value.interview.type === InterviewType.Text) {
        await member.roles.add(bot.context.roles.nsfwAccess);
      } else {
        // TODO: We're just assuming for now, /interview command will not have
        // the `interview_type` option soon.
        await member.roles.add(bot.context.roles.nsfwVerified);
        await member.roles.remove(bot.context.roles.nsfwAccess);
      }
    } else {
      await member.roles.add(bot.context.roles.disapprovedInterview);
    }

    await member.roles.remove(bot.context.roles.ongoingInterview);

    //* `channelId` is guaranteed to be present here, since it's an ongoing interview.
    const userInterviewChannel = member.guild.channels.cache.get(userData.value.interview.channelId!);
    // TODO: Properly guard database types.
    if (!userInterviewChannel) {
      bot.logger.warn(
        `Interview channel for user \`${member.user.globalName} (${member.user.id})\` not found. Skipping removing user permissions from that channel...`,
      );
    } else if (userInterviewChannel.type !== ChannelType.GuildText) {
      bot.logger.warn(
        `Interview channel for user \`${member.user.globalName} (${member.user.id})\` is not a text channel. Skipping deleting that channel...`,
      );
    } else {
      await userInterviewChannel.delete('Interview has ended.');
    }
  } catch (error) {
    if (error instanceof DiscordAPIError && error.code === 50013) {
      bot.logger.error(
        `Bot does not have permission to add/remove roles to user \`${member.user.globalName} (${member.user.id})\`.\nAre you sure bot's role is higher than the role you want to add?`,
      );
    } else {
      bot.logger.error(`An unexpected error occurred in \`${endInterview.name}\` function: ${error}`);
    }

    return false;
  }

  await bot.database.set(
    ['users', member.user.id],
    {
      interview: {
        status: interview.status,
      },
    } satisfies UserData,
  );

  bot.logger.info(`Interview for user \`${member.user.globalName} (${member.user.id})\` has ended.`);

  return true;
};

/**
 * Create an interview channel in the `config.interviewsCategory`
 * for the user.
 */
export async function createInterviewChannel(
  bot: BouncerBot,
  guild: Guild,
  member: GuildMember,
  interviewType: InterviewType = InterviewType.Text,
) {
  let channelName = `interview-`;
  if (interviewType === InterviewType.Text) {
    channelName += `text-`;
  } else {
    channelName += `id-`;
  }
  channelName += member.user.id;

  const createdChannel = await guild.channels.create({
    name: channelName,
    parent: bot.context.channels.interviewsCategory,
    permissionOverwrites: [
      {
        id: bot.context.roles.moderator.id,
        allow: [PermissionFlagsBits.ViewChannel],
      },
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

  return member;
}

import { type CategoryChannel, ChannelType, Guild, type GuildMember, PermissionFlagsBits } from '@npm/discord.js';

import { BouncerBot } from './bouncer.ts';
import { InterviewType } from '../database.ts';
import { Interview } from '../database.ts';

export const interviewUser = async (bot: BouncerBot, guild: Guild, member: GuildMember) => {
  const existsInterview = await bot.database?.get(['interviews', member.user.id]);
  if (existsInterview?.value) {
    // TODO: Log a `logger.warn` here..
    return;
  }

  removeUserAccess(bot, member);
  await createInterviewChannel(bot, guild, member);

  await bot.database?.set(
    ['interviews', member.user.id],
    {
      interviewType: InterviewType.Text,
    } satisfies Interview,
  );
};

/**
 * Removes users `ViewChannel `access to all categories
 * in the server.
 */
export function removeUserAccess(
  bot: BouncerBot,
  member: GuildMember,
) {
  return bot.channels.cache
    .filter((channel) => channel.type === ChannelType.GuildCategory && channel.id !== bot.interviewsCategory)
    .every((category) => {
      //* We've ensured that `category` is a `CategoryChannel` with `filter()`
      //* above, so its safe to cast it to that type. If there's a better way
      //* of ensuring its type though, please use that instead.
      category = category as CategoryChannel;

      category.permissionOverwrites.create(member.user.id, {
        ViewChannel: false,
      });
    });
}

/**
 * Create an interview channel in the `config.interviewsCategory`
 * for the user.
 */
export async function createInterviewChannel(bot: BouncerBot, guild: Guild, member: GuildMember) {
  const createdChannel = await guild.channels.create({
    name: `verification-interview-${member.user.id}`,
    parent: bot.interviewsCategory,
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

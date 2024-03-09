import { ChannelType, Events } from '@npm/discord.js';
import { Logger } from '@std/log';

import { DiscordConfig } from '../config.ts';
import { interviewUser } from './helpers.ts';
import { BouncerBot } from './bouncer.ts';

/**
 * Starts the Discord bot and handles events.
 *
 * @param database Database instance.
 * @param config Bot configuration.
 * @param logger Logger instance.
 */
export const startBot = async (database: Deno.Kv, config: DiscordConfig, logger: Logger) => {
  const bot = new BouncerBot(config, logger);

  await bot.login();
  bot.database = database;

  bot.once(Events.ClientReady, (ready) => {
    logger.info(`Connected to Discord as ${ready.user.username}`);
  });

  bot.on(Events.MessageCreate, async (message) => {
    const { guild, member } = message;

    if (
      !guild ||
      message.guildId !== bot.server ||
      !member ||
      message.channel.type !== ChannelType.GuildText ||
      message.author.bot || !message.channel.nsfw
    ) return;

    if (message.member?.roles.cache.hasAny(bot.roles.nsfwAccessId, bot.roles.nsfwVerifiedId)) {
      return;
    }

    await interviewUser(bot, guild, member);
  });
};

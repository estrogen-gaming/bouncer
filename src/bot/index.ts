import { ChannelType, Events } from '@npm/discord.js';
import { Logger } from '@std/log';

import { DiscordConfig } from '../config.ts';
import { checkUserInterviewStatus } from './helpers.ts';
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

  await bot.login().then(() => logger.info('Logged in to Discord!'));
  bot.database = database;

  bot.once(Events.ClientReady, (ready) => {
    logger.info(`Bot is ready as ${ready.user.username}!`);
  });

  bot.on(Events.MessageCreate, async (message) => {
    const { guild, member } = message;

    if (
      !guild ||
      message.guildId !== bot.config.server ||
      !member ||
      message.channel.type !== ChannelType.GuildText ||
      message.author.bot || !message.channel.nsfw
    ) return;

    if (message.member?.roles.cache.hasAny(bot.config.roles.nsfwAccessId, bot.config.roles.nsfwVerifiedId)) {
      return;
    }

    await checkUserInterviewStatus(bot, guild, member);
  });
};

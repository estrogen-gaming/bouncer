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

    initialiseContext(bot, config);
  });

  bot.on(Events.MessageCreate, async (message) => {
    const { guild, member } = message;

    if (
      !guild ||
      message.guildId !== bot.context.guild.id ||
      !member ||
      message.channel.type !== ChannelType.GuildText ||
      message.author.bot || !message.channel.nsfw
    ) return;

    if (message.member?.roles.cache.hasAny(bot.context.roles.nsfwAccess.id, bot.context.roles.nsfwVerified.id)) {
      return;
    }

    await checkUserInterviewStatus(bot, member);
  });
};

/**
 * Ensure that specified configuration fields exist in guild and are the desired kind.
 *
 * @param bot Bot instance.
 * @param guild Guild instance.
 * @param config Bot configuration
 */
export function initialiseContext(bot: BouncerBot, config: Omit<DiscordConfig, 'token'>) {
  const guild = bot.guilds.cache.get(config.serverId);

  if (!guild) {
    bot.logger.error(`Server with the id \`${config.serverId}\` could not be found.`);
    Deno.exit(1);
  }

  const interviewsCategory = guild.channels.cache.get(config.interviewsCategoryId);
  const interviewFlagsChannel = guild.channels.cache.get(config.channels.interviewFlagsId);

  const pendingInterviewRole = guild.roles.cache.get(config.roles.pendingInterviewId);
  const nsfwAccessRole = guild.roles.cache.get(config.roles.nsfwAccessId);
  const nsfwVerifiedRole = guild.roles.cache.get(config.roles.nsfwVerifiedId);

  // Check interviews category
  if (!interviewsCategory) {
    bot.logger.error(
      `Category for \`interviewsCategoryId\` with the id \`${config.interviewsCategoryId}\` could not be found.`,
    );
    Deno.exit(1);
  } else if (interviewsCategory.type !== ChannelType.GuildCategory) {
    bot.logger.error(
      `Channel for \`interviewsCategoryId\` with the id \`${config.interviewsCategoryId}\` is not a category.`,
    );
    Deno.exit(1);
  }

  // Check channels
  if (!interviewFlagsChannel) {
    bot.logger.error(
      `Channel for \`interviewFlagsId\` with the id \`${config.channels.interviewFlagsId}\` could not be found.`,
    );
    Deno.exit(1);
  } else if (interviewFlagsChannel.type !== ChannelType.GuildText) {
    bot.logger.error(
      `Channel for \`interviewFlagsId\` with the id \`${config.channels.interviewFlagsId}\` is not a text channel.`,
    );
    Deno.exit(1);
  }

  // Check roles
  if (!pendingInterviewRole) {
    bot.logger.error(
      `Role for \`pendingInterviewId\` with the id \`${config.roles.pendingInterviewId}\` could not be found.`,
    );
    Deno.exit(1);
  }

  if (!nsfwAccessRole) {
    bot.logger.error(
      `Role for \`nsfwAccessId\` with the id \`${config.roles.nsfwAccessId}\` could not be found.`,
    );
    Deno.exit(1);
  }

  if (!nsfwVerifiedRole) {
    bot.logger.error(
      `Role for \`nsfwVerifiedId\` with the id \`${config.roles.nsfwVerifiedId}\` could not be found.`,
    );
    Deno.exit(1);
  }

  bot.context = {
    guild,
    channels: {
      interviewsCategory,
      interviewFlagsChannel,
    },
    roles: {
      pendingInterview: pendingInterviewRole,
      nsfwAccess: nsfwAccessRole,
      nsfwVerified: nsfwVerifiedRole,
    },
  };

  return true;
}

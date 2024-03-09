import { ChannelType, Client, Events, GatewayIntentBits } from '@npm/discord.js';
import { Logger } from '@std/log';

import { DiscordConfig, DiscordConfigRoles } from '../config.ts';
import { createInterviewChannel, removeUserAccess } from './helpers.ts';

export class Bot extends Client {
  database: Deno.Kv | undefined;

  server: string;
  roles: DiscordConfigRoles;
  interviewsCategory: string;

  constructor(config: DiscordConfig) {
    super({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    });

    this.token = config.token;

    this.server = config.server;
    this.roles = config.roles;
    this.interviewsCategory = config.interviewsCategoryId;
  }
}

export const startBot = async (database: Deno.Kv, config: DiscordConfig, logger: Logger) => {
  const bot = new Bot(config);

  await bot.login();
  bot.database = database;

  bot.once(Events.ClientReady, (ready) => {
    logger.info(`Connected to Discord as ${ready.user.username}`);
  });

  bot.on(Events.MessageCreate, (message) => {
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

    // Restrict users access to every channel in the server
    removeUserAccess(bot, member);

    // Create a new channel for the user to be interviewed
    createInterviewChannel(bot, guild, member);
  });
};

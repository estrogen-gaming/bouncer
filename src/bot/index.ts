import { ChannelType, Client, Events, GatewayIntentBits } from '@npm/discord.js';
import { Logger } from '@std/log';

import { DiscordConfig, DiscordConfigRoles } from '../config.ts';
import { createInterviewChannel, removeUserAccess } from './helpers.ts';

export class Bot extends Client {
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
    this.interviewsCategory = config.interviewsCategory;
  }
}

export const startBot = async (config: DiscordConfig, logger: Logger) => {
  const bot = new Bot(config);
  await bot.login();

  bot.once(Events.ClientReady, (ready) => {
    logger.info(`Connected to Discord as ${ready.user.username}`);
  });

  bot.on(Events.MessageCreate, (message) => {
    if (
      !message.guild ||
      message.guildId !== bot.server ||
      !message.member ||
      message.channel.type !== ChannelType.GuildText ||
      message.author.bot || !message.channel.nsfw
    ) return;

    const guild = message.guild;

    if (message.member?.roles.cache.hasAny(bot.roles.nsfwAccess, bot.roles.nsfwVerified)) {
      return;
    } else {
      const { member } = message;

      // Restrict users access to every channel in the server
      removeUserAccess(bot, member);

      // Create a new channel for the user to be interviewed
      createInterviewChannel(bot, guild, member);
    }
  });
};

import { ChannelType, Client, Events, GatewayIntentBits } from '@npm/discord.js';
import { Logger } from '@std/log';

import { DiscordConfig, DiscordConfigRoles } from './config.ts';

export class Bot extends Client {
  server: string;
  roles: DiscordConfigRoles;

  constructor(config: DiscordConfig) {
    super({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    });

    this.token = config.token;
    this.server = config.server;
    this.roles = config.roles;
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
      message.guildId !== bot.server ||
      message.channel.type !== ChannelType.GuildText ||
      message.author.bot || !message.channel.nsfw
    ) return;

    if (message.member?.roles.cache.hasAny(bot.roles.nsfwAccess, bot.roles.nsfwVerified)) {
      return;
    } else {
      message.reply("You're not verified.");
    }
  });
};

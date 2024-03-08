import { ChannelType, Client, Events, GatewayIntentBits, Partials } from '@npm/discord.js';
import { Logger } from '@std/log';

import { DiscordConfig } from './config.ts';

export class Bot extends Client {
  server: number;

  constructor(config: DiscordConfig) {
    super({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    });

    this.token = config.token;
    this.server = config.server;
  }
}

export const startBot = async (config: DiscordConfig, logger: Logger) => {
  const bot = new Bot(config);

  await bot.login();

  bot.once(Events.ClientReady, (ready) => {
    logger.info(`Connected to Discord as ${ready.user.username}`);
  });

  bot.on(Events.MessageCreate, (message) => {
    if (message.channel.type !== ChannelType.GuildText || message.author.bot) return;
    if (!message.channel.nsfw) return;
  });
};

import { Client, Events, GatewayIntentBits } from '@npm/discord.js';
import { Logger } from '@std/log';

import { DiscordConfig } from './config.ts';

export class Bot extends Client {
  server: number;

  constructor(config: DiscordConfig) {
    super({
      intents: [GatewayIntentBits.Guilds],
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
};

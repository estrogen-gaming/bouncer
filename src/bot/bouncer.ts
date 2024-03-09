import { Client, GatewayIntentBits } from '@npm/discord.js';
import { DiscordConfig } from '../config.ts';
import { Logger } from '@std/log';

/**
 * Custom {@link Client} class with additional properties.
 */
export class BouncerBot extends Client {
  database: Deno.Kv | undefined;
  logger: Logger;

  config: Omit<DiscordConfig, 'token'>;

  constructor(config: DiscordConfig, logger: Logger) {
    const { token, ...rest } = config;

    super({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    });

    this.token = token;
    this.logger = logger;
    this.config = rest;
  }
}

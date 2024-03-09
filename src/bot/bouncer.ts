import { Client, GatewayIntentBits } from '@npm/discord.js';
import { DiscordConfig, DiscordConfigRoles } from '../config.ts';
import { Logger } from '@std/log';

/**
 * Custom {@link Client} class with additional properties.
 */
export class BouncerBot extends Client {
  database: Deno.Kv | undefined;
  logger: Logger;

  server: string;
  roles: DiscordConfigRoles;
  interviewsCategory: string;

  constructor(config: DiscordConfig, logger: Logger) {
    super({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    });

    this.token = config.token;

    this.logger = logger;

    this.server = config.server;
    this.roles = config.roles;
    this.interviewsCategory = config.interviewsCategoryId;
  }
}

import { Client, GatewayIntentBits } from '@npm/discord.js';
import { DiscordConfig, DiscordConfigRoles } from '../config.ts';

export class BouncerBot extends Client {
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

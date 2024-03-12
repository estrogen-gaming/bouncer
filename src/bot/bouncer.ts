import { CategoryChannel, Client, GatewayIntentBits, Guild, Role, TextChannel } from '@npm/discord.js';
import { DiscordConfig } from '../config.ts';
import { Logger } from '@std/log';

export interface Context {
  guild: Guild | undefined;
  channels: {
    interviewsCategory: CategoryChannel;
    interviewFlagsChannel: TextChannel;
  };
  roles: {
    pendingInterview: Role;
    nsfwAccess: Role;
    nsfwVerified: Role;
  };
}

/**
 * Custom {@link Client} class with additional properties.
 */
export class BouncerBot extends Client {
  database?: Deno.Kv;
  logger: Logger;

  private _context?: Context;

  constructor(config: DiscordConfig, logger: Logger) {
    super({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers],
    });

    this.token = config.token;
    this.logger = logger;
  }

  set context(context: Context) {
    this._context = context;
  }

  get context() {
    if (!this._context) {
      throw new Error('Context is not initialized yet.');
    }

    return this._context;
  }
}

import { CategoryChannel, Client, Collection, GatewayIntentBits, Guild, Role, TextChannel } from '@npm/discord.js';
import { Logger } from '@std/log';

import { BouncerSlashCommandBuilder, Command } from './commands/@index.ts';
import { DiscordConfig } from '../config.ts';

/**
 * Context instance of the bot that holds cached values to
 * make accessing them easier.
 */
export interface Context {
  /**
   * The guild where the bot operates.
   */
  guild: Guild;
  /**
   * The channels used by the bot.
   */
  channels: {
    /**
     * The category where the interviews will be created.
     */
    interviewsCategory: CategoryChannel;
    /**
     * The channel where the bot will send interview flags.
     */
    interviewFlagsChannel: TextChannel;
  };
  roles: {
    /**
     * The role for server moderators.
     */
    moderator: Role;
    /**
     * The role for pending interviews.
     */
    pendingInterview: Role;
    /**
     * The role for ongoing interviews.
     */
    ongoingInterview: Role;
    /**
     * The role for users approved with text interview.
     */
    nsfwAccess: Role;
    /**
     * The role for users approved with ID interview.
     */
    nsfwVerified: Role;
  };
}

/**
 * Custom {@link Client} class with additional properties.
 */
export class BouncerBot extends Client {
  logger: Logger;

  commands: Collection<BouncerSlashCommandBuilder, Command>;

  private _database?: Deno.Kv;
  private _context?: Context;

  constructor(config: DiscordConfig, logger: Logger) {
    super({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers],
    });

    this.token = config.token;
    this.logger = logger;
    this.commands = new Collection();
  }

  set database(database: Deno.Kv) {
    this._database = database;
  }

  get database() {
    if (!this._database) {
      throw new Error('Database is not initialized yet.');
    }

    return this._database;
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

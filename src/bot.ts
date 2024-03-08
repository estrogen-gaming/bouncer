import { type CategoryChannel, type Channel, ChannelType, Client, Events, GatewayIntentBits } from '@npm/discord.js';
import { Logger } from '@std/log';

import { DiscordConfig, DiscordConfigRoles } from './config.ts';
import { PermissionFlagsBits } from '@npm/discord.js';

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

      // TODO: Create helper functions for those.
      // Restrict users access to every channel in the server
      guild?.channels.cache
        .filter((channel) => channel.type === ChannelType.GuildCategory && channel.id !== bot.interviewsCategory)
        .every((category) => {
          //* We've ensured that `category` is a `CategoryChannel` with `filter()`
          //* above, so its safe to cast it to that type. If there's a better way
          //* of ensuring its type though, please use that instead.
          category = category as CategoryChannel;

          category.permissionOverwrites.create(member.id, {
            ViewChannel: false,
          });
        });

      // Create a new channel for the user to be interviewed
      guild?.channels.create({
        name: `verification-interview-${member.user.id}`,
        parent: bot.interviewsCategory,
        permissionOverwrites: [
          {
            id: member.user.id,
            allow: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
        ],
      });
    }
  });
};

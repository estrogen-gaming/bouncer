import { ChannelType, Events, GuildMemberRoleManager } from '@npm/discord.js';
import { Logger } from '@std/log';

import { DiscordConfig } from '../config.ts';
import { checkUserInterviewStatus } from './commands/@helpers.ts';
import { BouncerBot } from './bouncer.ts';
import { registerCommands, scanCommands } from './helpers.ts';

/**
 * Starts the Discord bot and handles events.
 *
 * @param database Database instance.
 * @param config Bot configuration.
 * @param logger Logger instance.
 */
export const startBot = async (database: Deno.Kv, config: DiscordConfig, logger: Logger) => {
  const bot = new BouncerBot(config, logger);

  await bot.login().then(() => logger.info('Logged in to Discord!'));

  bot.database = database;

  bot.once(Events.ClientReady, async (ready) => {
    logger.info(`Bot is ready as ${ready.user.username}!`);

    // Initialise the context after the bot is started
    initialiseContext(bot, config);
    // Scan all the commands and put them to `BouncerBot.commands` collection
    await scanCommands(bot);
    // Register all the commands to the guild
    await registerCommands(bot);
  });

  bot.on(Events.MessageCreate, async (message) => {
    const { guild, member } = message;

    if (
      !guild ||
      message.guildId !== bot.context.guild.id ||
      !member ||
      message.channel.type !== ChannelType.GuildText ||
      message.author.bot || !message.channel.nsfw
    ) return;

    if (
      message.member?.roles.cache.hasAny(
        bot.context.roles.moderator.id,
        bot.context.roles.nsfwAccess.id,
        bot.context.roles.nsfwVerified.id,
      )
    ) {
      return;
    }

    await checkUserInterviewStatus(bot, member);
  });

  bot.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // TODO: Don't use `as` here.
    const interactionClient = interaction.client as BouncerBot;

    if (!(interaction.member?.roles instanceof GuildMemberRoleManager)) {
      bot.logger.info("Member's roles are not available.");
      return;
    }

    if (!interaction.member?.roles.cache.has(bot.context.roles.moderator.id)) {
      await interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true,
      });
      return;
    }

    const command = interactionClient.commands.find((_, command) => command.name === interaction.commandName);
    if (!command) return;

    if (!interaction.guild) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      bot.logger.error(
        `An unexpected error ocurred while executing the \`${command.command().name}\` slash command interaction: ${error}`,
      );
      interaction.reply({
        content:
          'An unexpected error ocurred while executing the command. If this keeps happening, please report the issue to the developers.',
        ephemeral: true,
      });
    }
  });
};

/**
 * Ensure that specified configuration fields exist in guild and are the desired kind.
 *
 * @param bot Bot instance.
 * @param guild Guild instance.
 * @param config Bot configuration
 */
export function initialiseContext(bot: BouncerBot, config: Omit<DiscordConfig, 'token'>) {
  const guild = bot.guilds.cache.get(config.serverId);

  if (!guild) {
    bot.logger.error(`Server with the id \`${config.serverId}\` could not be found.`);
    Deno.exit(1);
  }

  const interviewsCategory = guild.channels.cache.get(config.channels.interviewsCategoryId);
  const interviewFlagsChannel = guild.channels.cache.get(config.channels.interviewFlagsId);

  const moderatorRole = guild.roles.cache.get(config.roles.moderatorId);
  const pendingInterviewRole = guild.roles.cache.get(config.roles.pendingInterviewId);
  const ongoingInterviewRole = guild.roles.cache.get(config.roles.ongoingInterviewId);
  const nsfwAccessRole = guild.roles.cache.get(config.roles.nsfwAccessId);
  const nsfwVerifiedRole = guild.roles.cache.get(config.roles.nsfwVerifiedId);

  // Check interviews category
  if (!interviewsCategory) {
    bot.logger.error(
      `Category for \`interviewsCategoryId\` with the id \`${config.channels.interviewsCategoryId}\` could not be found.`,
    );
    Deno.exit(1);
  } else if (interviewsCategory.type !== ChannelType.GuildCategory) {
    bot.logger.error(
      `Channel for \`interviewsCategoryId\` with the id \`${config.channels.interviewsCategoryId}\` is not a category.`,
    );
    Deno.exit(1);
  }

  // Check channels
  if (!interviewFlagsChannel) {
    bot.logger.error(
      `Channel for \`interviewFlagsId\` with the id \`${config.channels.interviewFlagsId}\` could not be found.`,
    );
    Deno.exit(1);
  } else if (interviewFlagsChannel.type !== ChannelType.GuildText) {
    bot.logger.error(
      `Channel for \`interviewFlagsId\` with the id \`${config.channels.interviewFlagsId}\` is not a text channel.`,
    );
    Deno.exit(1);
  }

  // Check roles
  if (!moderatorRole) {
    bot.logger.error(
      `Role for \`moderatorId\` with the id \`${config.roles.moderatorId}\` could not be found.`,
    );
    Deno.exit(1);
  }

  if (!pendingInterviewRole) {
    bot.logger.error(
      `Role for \`pendingInterviewId\` with the id \`${config.roles.pendingInterviewId}\` could not be found.`,
    );
    Deno.exit(1);
  }

  if (!ongoingInterviewRole) {
    bot.logger.error(
      `Role for \`ongoingInterviewId\` with the id \`${config.roles.ongoingInterviewId}\` could not be found.`,
    );
    Deno.exit(1);
  }

  if (!nsfwAccessRole) {
    bot.logger.error(
      `Role for \`nsfwAccessId\` with the id \`${config.roles.nsfwAccessId}\` could not be found.`,
    );
    Deno.exit(1);
  }

  if (!nsfwVerifiedRole) {
    bot.logger.error(
      `Role for \`nsfwVerifiedId\` with the id \`${config.roles.nsfwVerifiedId}\` could not be found.`,
    );
    Deno.exit(1);
  }

  bot.context = {
    guild,
    channels: {
      interviewsCategory,
      interviewFlagsChannel,
    },
    roles: {
      moderator: moderatorRole,
      pendingInterview: pendingInterviewRole,
      ongoingInterview: ongoingInterviewRole,
      nsfwAccess: nsfwAccessRole,
      nsfwVerified: nsfwVerifiedRole,
    },
  };

  return true;
}

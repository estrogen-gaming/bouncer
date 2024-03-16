import { dirname, join } from '@std/path';

import { CommandInteraction, REST, Routes } from '@npm/discord.js';

import { BouncerBot, BouncerSlashCommandBuilder } from '../bouncer.ts';

/**
 * Abstract class for slash commands.
 */
export abstract class Command {
  /**
   * @returns the slash command builder for the slash command.
   */
  public abstract command(): BouncerSlashCommandBuilder;
  /**
   * Executor of the slash command.
   *
   * @param interaction Command interaction instance.
   */
  public abstract execute(interaction: CommandInteraction): Promise<void>;
}

/**
 * Scan all the commands in the current directory and
 * puts them to `BouncerBot.commands` collection.
 *
 * @param bot Bot instance.
 */
export const scanCommands = async (bot: BouncerBot) => {
  const commandsPath = join(
    dirname(new URL(import.meta.url).pathname),
    '.',
  );

  for await (const file of Deno.readDir(commandsPath)) {
    if (!file.name.endsWith('.ts') || file.name === 'index.ts') continue;

    const commandImport = await import(join(commandsPath, file.name));
    const command: Command = new commandImport.default();
    if (!('command' in command)) {
      bot.logger.warn(`\`${file.name}\` doesn't export \`command\` function, skipping...`);
      continue;
    } else if (!('execute' in command)) {
      bot.logger.warn(`\`${file.name}\` doesn't export \`execute\` function, skipping...`);
      continue;
    }

    bot.commands.set(command.command(), command);
  }
};

/**
 * Registers all the commands to the specified guild id.
 *
 * @param bot Bot instance.
 */
export const registerCommands = async (
  bot: BouncerBot,
) => {
  if (!bot.token) {
    throw new Error('Bot token is not set. Are you sure the bot has been started?');
  } else if (!bot.application) {
    throw new Error('Application is not set. Are you sure the bot has been started?');
  }

  const rest = new REST().setToken(bot.token);

  try {
    await rest.put(Routes.applicationGuildCommands(bot.application.id, bot.context.guild.id), {
      body: bot.commands.map((_, command) => command.toJSON()),
    });
  } catch (error) {
    bot.logger.error('Failed to register commands:', error);
  }
};

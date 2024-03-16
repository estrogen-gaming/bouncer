import { dirname, join } from '@std/path';

import { REST, Routes } from '@npm/discord.js';

import { Command } from './commands/@index.ts';
import { BouncerBot } from './bouncer.ts';

/**
 * Scan all the commands in the current directory and
 * puts them to `BouncerBot.commands` collection.
 *
 * @param bot Bot instance.
 */
export const scanCommands = async (bot: BouncerBot) => {
  const commandsPath = join(
    dirname(new URL(import.meta.url).pathname),
    './commands',
  );

  for await (const file of Deno.readDir(commandsPath)) {
    if (!file.name.endsWith('.ts') || file.name.startsWith('@')) continue;

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

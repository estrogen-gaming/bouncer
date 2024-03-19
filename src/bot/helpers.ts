import { dirname, join } from '@std/path';

import { DiscordAPIError, GuildMember, REST, Routes } from '@npm/discord.js';

import { Command } from './commands/@index.ts';
import { BouncerBot } from './bouncer.ts';
import { InterviewStatus, UserData } from '../database.ts';

/**
 * Scan all the commands in the current directory and
 * puts them to `BouncerBot.commands` collection.
 *
 * @param bot Bot instance.
 */
export const scanCommands = async (bot: BouncerBot) => {
  //? Maybe instead of doing that, we should import all the commands dynamically with
  //? `import`, so its its both easier to manage and `deno compile` would actually work.
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

/**
 * Check if user has been interviewed. If not, add them to the pending interview
 * role and send a message to the interview flags channel.
 *
 * @param bot Bot instance.
 * @param guild Current guild instance.
 * @param member Event invoker member instance.
 * @returns *void*
 */
export const checkUserInterviewStatus = async (bot: BouncerBot, member: GuildMember) => {
  const existsUser = await bot.database.get<UserData>(['users', member.user.id]);
  if (existsUser?.value?.interview.status === InterviewStatus.Approved) {
    bot.logger.warn(`User \`${member.user.globalName} (${member.user.id})\` has already been interviewed. Ignoring...`);
    return;
  } else if (existsUser?.value?.interview.status === InterviewStatus.Ongoing) {
    bot.logger.warn(`User \`${member.user.globalName} (${member.user.id})\` is on an ongoing interview. Ignoring...`);
    return;
  } else if (existsUser?.value?.interview.status === InterviewStatus.Disapproved) {
    bot.logger.warn(
      `User \`${member.user.globalName} (${member.user.id})\` has been disapproved in an interview. Ignoring...`,
    );
    return;
  }

  try {
    await member.roles.add(bot.context.roles.pendingInterview);
  } catch (error) {
    if (error instanceof DiscordAPIError && error.code === 50013) {
      bot.logger.error(
        `Bot does not have permission to add roles to user \`${member.user.globalName} (${member.user.id})\`.\nAre you sure bot's role is higher than the role you want to add?`,
      );
    } else {
      bot.logger.error(`An unexpected error occurred in \`${checkUserInterviewStatus.name}\` function: ${error}`);
    }

    return;
  }

  const interviewFlagsChannel = bot.context.channels.interviewFlagsChannel;

  await bot.database.set(
    ['users', member.user.id],
    {
      interview: {
        status: InterviewStatus.Pending,
      },
    } satisfies UserData,
  );

  bot.logger.info(`User \`${member.user.globalName} (${member.user.id})\` is marked as pending interview.`);

  // TODO: Mention the command instead of sending it directly.
  interviewFlagsChannel.send(
    `${member} marked as pending interview. To interview them, use /interview command. ${bot.context.roles.moderator}`,
  );
};

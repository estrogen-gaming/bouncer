import { CommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from '@npm/discord.js';

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

export type BouncerSlashCommandBuilder =
  | SlashCommandBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;

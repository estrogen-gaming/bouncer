import { CommandInteraction, SlashCommandBuilder } from '@npm/discord.js';

import { BouncerSlashCommandBuilder, Command } from './@index.ts';
import { startSelfIDInterview } from './@helpers.ts';

export default class Verify implements Command {
  public command(): BouncerSlashCommandBuilder {
    return new SlashCommandBuilder()
      .setName('verify')
      .setDescription('Request a self verification with ID.');
  }

  public async execute(interaction: CommandInteraction) {
    await startSelfIDInterview(interaction);
  }
}

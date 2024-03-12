import { CommandInteraction, SlashCommandBuilder } from '@npm/discord.js';
import { Command } from './index.ts';

export default class Ping implements Command {
  public command(): SlashCommandBuilder {
    return new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Replies with Pong!');
  }

  public async execute(interaction: CommandInteraction) {
    await interaction.reply('Pong!');
  }
}

import { CommandInteraction, SlashCommandBuilder } from '@npm/discord.js';

import { Command } from './index.ts';
import { endInterview } from '../helpers.ts';
import { InterviewStatus, InterviewType } from '../../database.ts';
import { BouncerBot, BouncerSlashCommandBuilder } from '../bouncer.ts';
import { checkInteractionMember } from '../helpers.ts';

export default class Approve implements Command {
  public command(): BouncerSlashCommandBuilder {
    return new SlashCommandBuilder()
      .setName('approve')
      .setDescription('Approve an user interview.')
      .addUserOption((builder) => {
        return builder.setName('user').setDescription('The user to approve.').setRequired(true);
      });
  }

  public async execute(interaction: CommandInteraction) {
    const interactionClient = interaction.client as BouncerBot;

    const member = await checkInteractionMember(interaction);
    if (!member) return;

    // TODO: This is not good.
    const endInterviewStatus = await endInterview(interactionClient, member, {
      status: InterviewStatus.Approved,
      type: InterviewType.Text,
    });
    if (!endInterviewStatus) {
      await interaction.reply({
        content: `User \`${member.user.globalName} (${member.user.id})\` is not being interviewed.`,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `User \`${member.user.globalName} (${member.user.id})\` has been approved.`,
      ephemeral: true,
    });
  }
}

import { CommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from '@npm/discord.js';

import { BouncerSlashCommandBuilder, Command } from './_index.ts';
import { checkInteractionMember, endInterview } from './_helpers.ts';
import { InterviewStatus, InterviewType } from '../../database.ts';
import { BouncerBot } from '../bouncer.ts';

export default class Disapprove implements Command {
  public command(): BouncerSlashCommandBuilder {
    return new SlashCommandBuilder()
      .setName('disapprove')
      .setDescription('Disapprove an user interview.')
      .addUserOption((builder) => {
        return builder.setName('user').setDescription('The user to disapprove.').setRequired(true);
      })
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
  }

  public async execute(interaction: CommandInteraction) {
    const interactionClient = interaction.client as BouncerBot;

    const member = await checkInteractionMember(interaction);
    if (!member) return;

    // TODO: This is not good.
    const endInterviewStatus = await endInterview(interactionClient, member, {
      status: InterviewStatus.Disapproved,
      type: InterviewType.Text,
    });
    if (!endInterviewStatus) {
      await interaction.reply({
        content: `${member} is not being interviewed.`,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `${member} has been disapproved.`,
      ephemeral: true,
    });
  }
}

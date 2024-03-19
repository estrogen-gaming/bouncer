import { CommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from '@npm/discord.js';

import { BouncerSlashCommandBuilder, Command } from './@index.ts';
import { BouncerBot } from '../bouncer.ts';
import { InterviewStatus, InterviewType, UserData } from '../../database.ts';
import { checkInteractionMember, startInterview } from './@helpers.ts';

export default class Interview implements Command {
  public command(): BouncerSlashCommandBuilder {
    return new SlashCommandBuilder()
      .setName('interview')
      .setDescription('Interview an user.')
      .addUserOption((builder) => {
        return builder.setName('user').setDescription('The user to interview.').setRequired(true);
      })
      .addStringOption((builder) => {
        return builder
          .setName('interview_type')
          .setDescription('Type of the interview.')
          .addChoices({ name: 'Text', value: 'text' }, { name: 'ID', value: 'id' });
      })
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
  }

  public async execute(interaction: CommandInteraction) {
    const interactionClient = interaction.client as BouncerBot;

    const member = await checkInteractionMember(interaction);
    if (!member) return;

    let interviewType: InterviewType;

    const interviewInput = interaction.options.get('interview_type');
    if (interviewInput?.value === 'id') {
      interviewType = InterviewType.Id;
    } else {
      interviewType = InterviewType.Text;
    }

    const interviewStatus = await interactionClient.database.get<UserData>(['users', member.id]);
    if (!interviewStatus?.value) {
      // TODO: Allow non-pending users to be interviewed?
      await interaction.reply({
        content: `${member} is not pending for interview.`,
        ephemeral: true,
      });
      return;
    }
    if (interviewStatus.value?.interview?.status === InterviewStatus.Ongoing) {
      await interaction.reply({
        content: `${member} is already on an ongoing interview in <#${interviewStatus.value.interview.channelId}>.`,
        ephemeral: true,
      });
      return;
    } else if (interviewStatus.value?.interview?.status === InterviewStatus.Approved) {
      await interaction.reply({
        content:
          `${member} has already been interviewed and approved in <#${interviewStatus.value.interview.channelId}>.`,
        ephemeral: true,
      });
      return;
    }

    const interviewChannel = await startInterview(interactionClient, member, interviewType);
    if (!interviewChannel) {
      await interaction.reply({
        content: `Failed to create interview channel for ${member}. Check logs for possible errors.`,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `Interview channel ${interviewChannel} has been created for ${member}.`,
      ephemeral: true,
    });

    return;
  }
}

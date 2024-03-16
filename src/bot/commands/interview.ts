import { CommandInteraction, SlashCommandBuilder } from '@npm/discord.js';

import { Command } from './index.ts';
import { BouncerBot, BouncerSlashCommandBuilder } from '../bouncer.ts';
import { InterviewStatus, InterviewType, UserData } from '../../database.ts';
import { checkInteractionMember, createInterviewChannel } from '../helpers.ts';

export default class Interview implements Command {
  public command(): BouncerSlashCommandBuilder {
    return new SlashCommandBuilder()
      .setName('interview')
      .setDescription('Interview an user.')
      .addUserOption((builder) => {
        return builder.setName('user').setDescription('The user to interview.').setRequired(true);
      });
  }

  public async execute(interaction: CommandInteraction) {
    const interactionClient = interaction.client as BouncerBot;

    const member = await checkInteractionMember(interaction);
    if (!member) return;

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

    // TODO: Create helper for this.
    const interviewChannel = await createInterviewChannel(interactionClient, interaction.guild!, member);
    await interactionClient.database.set(
      ['users', member.id],
      {
        interview: {
          type: InterviewType.Text,
          status: InterviewStatus.Ongoing,
          channelId: interviewChannel.id,
        },
      } satisfies UserData,
    );

    await interaction.reply({
      content: `Interview channel ${interviewChannel} has been created for ${member}.`,
      ephemeral: true,
    });

    return;
  }
}

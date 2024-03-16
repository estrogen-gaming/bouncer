import { CommandInteraction, SlashCommandBuilder } from '@npm/discord.js';
import { Command } from './index.ts';
import { BouncerBot, BouncerSlashCommandBuilder } from '../bouncer.ts';
import { UserData } from '../../database.ts';
import { InterviewStatus } from '../../database.ts';
import { createInterviewChannel } from '../helpers.ts';

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

    if (!interaction.guild) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        ephemeral: true,
      });
      return;
    }

    const user = interaction.options.getUser('user', true);
    const member = interaction.guild?.members.cache.get(user.id);
    if (!member) {
      await interaction.reply({
        content: 'Guild member not found.',
        ephemeral: true,
      });
      return;
    }

    const interviewStatus = await interactionClient.database.get<UserData>(['users', user.id]);
    if (interviewStatus?.value?.interview?.status === InterviewStatus.Ongoing) {
      await interaction.reply({
        content: `This user is already on an ongoing interview in <#${interviewStatus.value.interview.channelId}>.`,
        ephemeral: true,
      });
      return;
    } else if (interviewStatus?.value?.interview?.status === InterviewStatus.Approved) {
      await interaction.reply({
        content:
          `This user has already been interviewed and approved in <#${interviewStatus.value.interview.channelId}>.`,
        ephemeral: true,
      });
      return;
    }

    const interviewChannel = await createInterviewChannel(interactionClient, interaction.guild, member);
    await interactionClient.database.set(
      ['users', member.id],
      {
        interview: {
          status: InterviewStatus.Ongoing,
          channelId: interviewChannel.id,
        },
      } satisfies UserData,
    );

    await interaction.reply({
      content: `Interview channel ${interviewChannel} has been created for user ${member}.`,
      ephemeral: true,
    });

    return;
  }
}

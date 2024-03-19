import { CommandInteraction, PermissionFlagsBits, SlashCommandBuilder, time } from '@npm/discord.js';

import { BouncerSlashCommandBuilder, Command } from './@index.ts';

export default class DateOfBirth implements Command {
  public command(): BouncerSlashCommandBuilder {
    return new SlashCommandBuilder()
      .setName('dob')
      .setDescription('Calculate date of birth from given date.')
      .addStringOption((builder) => {
        return builder.setName('date').setDescription('Date in `YYYY-MM-DD` format.').setRequired(true);
      })
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
  }

  public async execute(interaction: CommandInteraction) {
    const dateInput = interaction.options.get('date', true).value! as string;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateInput)) {
      await interaction.reply({
        content: 'The date should be in `YYYY-MM-DD` format.',
        ephemeral: true,
      });
      return;
    }

    const [year, month, day] = dateInput.split('-').map(Number);

    if (month < 1 || month > 12) {
      await interaction.reply({
        content: 'Invalid month specified. It should be between 1 and 12.',
        ephemeral: true,
      });
      return;
    }

    if (day < 1 || day > daysInMonth(year, month)) {
      await interaction.reply({
        content: `Invalid day specified for month ${month}. It should be between 1 and ${daysInMonth(year, month)}.`,
        ephemeral: true,
      });
      return;
    }

    if (month === 2 && !isLeapYear(year) && day > 28) {
      await interaction.reply({
        content: `Invalid day specified for non-leap year February. It should be between 1 and 28.`,
        ephemeral: true,
      });
      return;
    }

    const dateOfBirth = new Date(year, month - 1, day);

    if (isNaN(dateOfBirth.getTime())) {
      await interaction.reply({
        content: 'Invalid date specified.',
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `The date of birth is ${time(dateOfBirth, 'D')} and the age is ${getExactAge(dateOfBirth)}.`,
      ephemeral: true,
    });
  }
}

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number) {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

function getExactAge(birthDate: Date): number {
  const currentDate = new Date();
  let age = currentDate.getFullYear() - birthDate.getFullYear();

  if (
    currentDate.getMonth() < birthDate.getMonth() ||
    (currentDate.getMonth() === birthDate.getMonth() && currentDate.getDate() < birthDate.getDate()) ||
    (isLeapYear(currentDate.getFullYear()) && currentDate.getMonth() === 1 && currentDate.getDate() === 29 &&
      birthDate.getMonth() === 1 && birthDate.getDate() === 29)
  ) {
    age--;
  }

  return age;
}

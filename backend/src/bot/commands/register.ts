import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { User } from '../../models/user';
import { BotCommand } from '../types';

export const registerCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register your SmashUps account'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const { id, username, discriminator, avatar } = interaction.user;

    const existing = await User.findOne({ where: { discordId: id } });
    if (existing) {
      await interaction.editReply('You are already registered!');
      return;
    }

    await User.create({
      discordId: id,
      username,
      discriminator: discriminator ?? '0',
      avatar: avatar ?? undefined,
    });

    await interaction.editReply('Successfully registered! Use `/setmain` to set your main character.');
  },
};

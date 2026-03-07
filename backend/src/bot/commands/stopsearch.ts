import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { leavePool } from '../../services/matchmaking';
import { BotCommand } from '../types';

export const stopSearchCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('stopsearch')
    .setDescription('Stop searching for an opponent'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const removed = leavePool(interaction.user.id);
    await interaction.editReply(removed ? 'Search cancelled.' : 'You are not currently searching.');
  },
};

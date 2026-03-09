import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { leavePool } from '../../services/matchmaking';
import { cancelReadyCheckForUser } from '../../services/readyCheck';
import { BotCommand } from '../types';
import { COLORS, base } from '../embeds';

export const stopSearchCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('stopsearch')
    .setDescription('Stop searching for an opponent'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const removed = leavePool(interaction.user.id);
    cancelReadyCheckForUser(interaction.user.id);

    if (removed) {
      const embed = base(COLORS.warning)
        .setTitle('🛑 Search Cancelled')
        .setDescription("You've been removed from the matchmaking queue.\nUse `/search` whenever you're ready to play again.");
      await interaction.editReply({ embeds: [embed] });
    } else {
      const embed = base(COLORS.info)
        .setTitle('Not Searching')
        .setDescription("You aren't currently in the matchmaking queue.\nUse `/search` to find an opponent.");
      await interaction.editReply({ embeds: [embed] });
    }
  },
};

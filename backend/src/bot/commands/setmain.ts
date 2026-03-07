import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { User } from '../../models/user';
import { CHARACTER_NAMES } from '../../data/characters';
import { BotCommand } from '../types';

export const setMainCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('setmain')
    .setDescription('Set your main character')
    .addStringOption((option) =>
      option
        .setName('character')
        .setDescription('Your main character')
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const character = interaction.options.getString('character', true);

    if (!CHARACTER_NAMES.includes(character)) {
      await interaction.editReply('Invalid character. Please select one from the autocomplete list.');
      return;
    }

    const user = await User.findOne({ where: { discordId: interaction.user.id } });
    if (!user) {
      await interaction.editReply('You are not registered. Use `/register` first.');
      return;
    }

    await user.update({ main: character });
    await interaction.editReply(`Your main is now set to **${character}**!`);
  },

  async autocomplete(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const choices = CHARACTER_NAMES
      .filter((name) => name.toLowerCase().includes(focused))
      .slice(0, 25)
      .map((name) => ({ name, value: name }));
    await interaction.respond(choices);
  },
};

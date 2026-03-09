import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { User } from '../../models/user';
import { CHARACTER_NAMES } from '../../data/characters';
import { BotCommand } from '../types';
import { COLORS, avatarUrl, base } from '../embeds';

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
    const { id, avatar } = interaction.user;

    if (!CHARACTER_NAMES.includes(character)) {
      const embed = base(COLORS.danger)
        .setTitle('❌ Invalid Character')
        .setDescription('Please select a character from the autocomplete list.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const user = await User.findOne({ where: { discordId: id } });
    if (!user) {
      const embed = base(COLORS.danger)
        .setTitle('❌ Not Registered')
        .setDescription('You need to register first. Use `/register` to get started.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const previous = user.main;
    await user.update({ main: character });

    const embed = base(COLORS.success)
      .setTitle('✅ Main Updated')
      .setThumbnail(avatarUrl(id, avatar))
      .addFields(
        { name: '🎮 New Main', value: character, inline: true },
        ...(previous ? [{ name: '🔄 Previous', value: previous, inline: true }] : []),
      )
      .setDescription('Your main has been updated. Ready to `/search`?');

    await interaction.editReply({ embeds: [embed] });
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

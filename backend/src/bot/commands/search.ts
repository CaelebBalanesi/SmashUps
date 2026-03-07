import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { User } from '../../models/user';
import { CHARACTER_NAMES } from '../../data/characters';
import { enterPool, isInPool } from '../../services/matchmaking';
import { BotCommand } from '../types';

export const searchCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search for an opponent to play against')
    .addStringOption((option) =>
      option
        .setName('looking_for')
        .setDescription('Character to play against (leave empty for anyone)')
        .setRequired(false)
        .setAutocomplete(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const user = await User.findOne({ where: { discordId: interaction.user.id } });
    if (!user) {
      await interaction.editReply('You are not registered. Use `/register` first.');
      return;
    }
    if (!user.main) {
      await interaction.editReply('You need to set a main first. Use `/setmain`.');
      return;
    }
    if (isInPool(interaction.user.id)) {
      await interaction.editReply('You are already searching. Use `/stopsearch` to cancel first.');
      return;
    }

    const lookingForRaw = interaction.options.getString('looking_for');
    let lookingFor: string[] = [];

    if (lookingForRaw && lookingForRaw.toLowerCase() !== 'anyone') {
      if (!CHARACTER_NAMES.includes(lookingForRaw)) {
        await interaction.editReply('Invalid character. Please select one from the autocomplete list, or leave blank for anyone.');
        return;
      }
      lookingFor = [lookingForRaw];
    }

    const discordUser = interaction.user;

    const matched = enterPool(
      discordUser.id,
      discordUser.username,
      discordUser.avatar ?? undefined,
      user.main,
      lookingFor,
      async (opponent) => {
        try {
          const dm = await discordUser.createDM();
          await dm.send(
            `**Match found!** You'll be playing against **${opponent.username}** who mains **${opponent.main}**. Good luck!`,
          );
        } catch {
          // User may have DMs disabled — nothing we can do
        }
      },
    );

    if (matched) {
      await interaction.editReply('Match found immediately! Check your DMs.');
    } else {
      const target = lookingFor.length > 0 ? `**${lookingFor[0]}** players` : 'any opponent';
      await interaction.editReply(
        `Searching for ${target} as **${user.main}**. You will receive a DM when a match is found.\nUse \`/stopsearch\` to cancel.`,
      );
    }
  },

  async autocomplete(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const choices = [
      { name: 'Anyone', value: 'anyone' },
      ...CHARACTER_NAMES
        .filter((name) => name.toLowerCase().includes(focused))
        .map((name) => ({ name, value: name })),
    ].slice(0, 25);
    await interaction.respond(choices);
  },
};

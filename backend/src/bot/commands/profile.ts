import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { User } from '../../models/user';
import { BotCommand } from '../types';

export const profileCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View a SmashUps profile')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('User to look up (defaults to you)')
        .setRequired(false),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const target = interaction.options.getUser('user') ?? interaction.user;
    const user = await User.findOne({ where: { discordId: target.id } });

    if (!user) {
      const msg =
        target.id === interaction.user.id
          ? 'You are not registered. Use `/register` to get started.'
          : 'That user is not registered.';
      await interaction.editReply(msg);
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Profile`)
      .setColor(0x5865f2)
      .addFields(
        { name: 'Main', value: user.main ?? 'Not set', inline: true },
        {
          name: 'Member since',
          value: new Date(Number(user.dateJoined)).toLocaleDateString(),
          inline: true,
        },
      );

    if (user.avatar) {
      embed.setThumbnail(
        `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`,
      );
    }

    await interaction.editReply({ embeds: [embed] });
  },
};

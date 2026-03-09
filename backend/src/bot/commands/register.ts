import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { User } from '../../models/user';
import { BotCommand } from '../types';
import { COLORS, avatarUrl, base } from '../embeds';

export const registerCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register your SmashUps account'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const { id, username, discriminator, avatar } = interaction.user;

    const existing = await User.findOne({ where: { discordId: id } });
    if (existing) {
      const embed = base(COLORS.info)
        .setTitle('Already Registered')
        .setDescription("You already have a SmashUps account. You're all set!")
        .setThumbnail(avatarUrl(id, avatar))
        .addFields(
          { name: 'Main', value: existing.main ?? 'Not set — use `/setmain`', inline: true },
        );
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    await User.create({
      discordId: id,
      username,
      discriminator: discriminator ?? '0',
      avatar: avatar ?? undefined,
    });

    const embed = base(COLORS.success)
      .setTitle('🎮 Welcome to SmashUps!')
      .setDescription("You're registered and ready to find matchup partners.")
      .setThumbnail(avatarUrl(id, avatar))
      .addFields(
        {
          name: '📋 Next Steps',
          value: '> Set your main with `/setmain`\n> View your profile with `/profile`\n> Start searching with `/search`',
        },
      );

    await interaction.editReply({ embeds: [embed] });
  },
};

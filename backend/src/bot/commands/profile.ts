import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { User } from '../../models/user';
import { MatchHistory } from '../../models/matchHistory';
import { BotCommand } from '../types';
import { COLORS, avatarUrl, ts, mention, base } from '../embeds';

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
      const isSelf = target.id === interaction.user.id;
      const embed = base(COLORS.danger)
        .setTitle('❌ Not Registered')
        .setDescription(
          isSelf
            ? "You don't have a SmashUps account yet. Use `/register` to get started."
            : 'That user is not registered on SmashUps.',
        );
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const matchCount = await MatchHistory.count({ where: { playerDiscordId: user.discordId } });

    const embed = base(COLORS.brand)
      .setAuthor({
        name: user.username,
        iconURL: avatarUrl(user.discordId, user.avatar),
      })
      .setTitle(`${user.username}'s SmashUps Profile`)
      .setThumbnail(avatarUrl(user.discordId, user.avatar))
      .addFields(
        { name: '👤 Discord', value: mention(user.discordId), inline: true },
        { name: '🎮 Main', value: user.main ?? '*Not set*', inline: true },
        { name: '\u200b', value: '\u200b', inline: true }, // spacer
        { name: '📅 Member Since', value: ts(Number(user.dateJoined), 'D'), inline: true },
        { name: '⚔️ Matches Played', value: matchCount.toString(), inline: true },
      );

    await interaction.editReply({ embeds: [embed] });
  },
};

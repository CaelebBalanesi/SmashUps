import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  User as DiscordUser,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
} from 'discord.js';
import { User } from '../../models/user';
import { MatchHistory } from '../../models/matchHistory';
import { CHARACTER_NAMES } from '../../data/characters';
import { enterPool, isInPool, OpponentInfo } from '../../services/matchmaking';
import { registerForReadyCheck, READY_TIMEOUT_MS } from '../../services/readyCheck';
import { BotCommand } from '../types';
import { COLORS, avatarUrl, mention, base } from '../embeds';

// ─── Embed Factories ────────────────────────────────────────────────────────

function createReadyEmbed(opponent: OpponentInfo, playerMain: string): EmbedBuilder {
  return base(COLORS.brand)
    .setTitle('⚡ Match Found!')
    .setDescription('A match has been found! Click **Ready!** before the timer expires to confirm.')
    .setThumbnail(avatarUrl(opponent.id, opponent.avatar))
    .addFields(
      { name: '👤 Opponent', value: `${mention(opponent.id)} (${opponent.username})`, inline: true },
      { name: '🎮 Their Main', value: opponent.main, inline: true },
      { name: '\u200b', value: '\u200b', inline: true },
      { name: '🛡️ Your Main', value: playerMain, inline: true },
      { name: '⏱️ Time Limit', value: `${READY_TIMEOUT_MS / 1000} seconds`, inline: true },
    );
}

export function createWaitingEmbed(opponent: OpponentInfo): EmbedBuilder {
  const opponentRef = opponent.id ? mention(opponent.id) : `**${opponent.username}**`;
  return base(COLORS.warning)
    .setTitle('⏳ Waiting for Opponent...')
    .setDescription(`You're ready! Waiting for ${opponentRef} to confirm.`)
    .setThumbnail(avatarUrl(opponent.id, opponent.avatar));
}

function createConfirmedEmbed(opponent: OpponentInfo, playerMain: string): EmbedBuilder {
  return base(COLORS.success)
    .setTitle('✅ Match Confirmed!')
    .setDescription(`Both players are ready! 🎮`)
    .setThumbnail(avatarUrl(opponent.id, opponent.avatar))
    .addFields(
      { name: '👤 Opponent', value: `${mention(opponent.id)} (${opponent.username})`, inline: true },
      { name: '🎮 Their Main', value: opponent.main, inline: true },
      { name: '\u200b', value: '\u200b', inline: true },
      { name: '🛡️ Your Main', value: playerMain, inline: true },
    );
}

function createDeclinedEmbed(): EmbedBuilder {
  return base(COLORS.danger)
    .setTitle('❌ Match Cancelled')
    .setDescription("You didn't ready up in time and have been removed from the queue.")
    .addFields({ name: '🔄 Find Another Match', value: 'Use `/search` to jump back in.' });
}

function createRequeueEmbed(): EmbedBuilder {
  return base(COLORS.warning)
    .setTitle('🔄 Searching Again...')
    .setDescription("Your opponent didn't ready up in time. You've been placed back in the queue.\nYou'll receive a new DM when a match is found.");
}

function createSearchingEmbed(main: string, lookingFor: string[]): EmbedBuilder {
  const target = lookingFor.length > 0 ? lookingFor.join(', ') : 'Anyone';
  return base(COLORS.brand)
    .setTitle('🔍 Searching for a Match')
    .setDescription("You're in the queue! You'll receive a DM when a match is found.")
    .addFields(
      { name: '🛡️ Your Main', value: main, inline: true },
      { name: '🎯 Looking For', value: target, inline: true },
    )
    .setFooter({ text: 'SmashUps • Use /stopsearch to cancel' });
}

// ─── View Profile Button ─────────────────────────────────────────────────────

function viewProfileRow(opponent: OpponentInfo): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel(`${opponent.username}'s Discord Profile`)
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/users/${opponent.id}`)
      .setEmoji('👤'),
  );
}

// ─── Ready Check Row ─────────────────────────────────────────────────────────

function buildReadyRow(matchId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`ready_${matchId}`)
      .setLabel('Ready!')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅'),
  );
}

// ─── Discord Match Callback ───────────────────────────────────────────────────

/** Creates the onMatch callback for a Discord bot user. */
export function createDiscordMatchCallback(discordUser: DiscordUser, main: string, lookingFor: string[]) {
  return async (matchId: string, opponent: OpponentInfo) => {
    const messageRef: { msg: Message | null } = { msg: null };

    registerForReadyCheck(
      matchId,
      discordUser.id,
      opponent,
      { main, lookingFor },
      {
        onConfirmed: async () => {
          MatchHistory.create({
            playerDiscordId: discordUser.id,
            opponentDiscordId: opponent.id,
            opponentUsername: opponent.username,
            opponentAvatar: opponent.avatar ?? null,
            opponentMain: opponent.main,
            playerMain: main,
            matchedAt: Date.now(),
          }).catch((err) => console.error('Failed to save match history:', err));
          try {
            if (messageRef.msg) {
              await messageRef.msg.edit({
                embeds: [createConfirmedEmbed(opponent, main)],
                components: [viewProfileRow(opponent)],
              });
            }
          } catch { /* DMs closed */ }
        },
        onDeclined: async () => {
          try {
            if (messageRef.msg) {
              await messageRef.msg.edit({ embeds: [createDeclinedEmbed()], components: [] });
            }
          } catch { /* DMs closed */ }
        },
        onRequeue: async () => {
          try {
            if (messageRef.msg) {
              await messageRef.msg.edit({ embeds: [createRequeueEmbed()], components: [] });
            }
          } catch { /* DMs closed */ }
          // Re-enter the pool with the same Discord ready-check flow
          enterPool(
            discordUser.id,
            discordUser.username,
            discordUser.avatar ?? undefined,
            main,
            lookingFor,
            createDiscordMatchCallback(discordUser, main, lookingFor),
          );
        },
      },
      () => {
        // reenterPool — handled inside onRequeue above, also called by cancelReadyCheckForUser.
      },
    );

    // Send the ready-check DM
    try {
      const dm = await discordUser.createDM();
      messageRef.msg = await dm.send({
        embeds: [createReadyEmbed(opponent, main)],
        components: [buildReadyRow(matchId)],
      });
    } catch {
      // DMs disabled — the ready-check timeout will handle kicking this player
    }
  };
}

// ─── /search Command ─────────────────────────────────────────────────────────

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
      const embed = base(COLORS.danger)
        .setTitle('❌ Not Registered')
        .setDescription('You need to register first. Use `/register` to get started.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    if (!user.main) {
      const embed = base(COLORS.warning)
        .setTitle('⚠️ No Main Set')
        .setDescription('You need to set a main character before searching.')
        .addFields({ name: 'How to fix', value: 'Use `/setmain` to choose your main.' });
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    if (isInPool(interaction.user.id)) {
      const embed = base(COLORS.warning)
        .setTitle('Already Searching')
        .setDescription("You're already in the matchmaking queue.")
        .addFields({ name: 'Want to stop?', value: 'Use `/stopsearch` to cancel your current search.' });
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const lookingForRaw = interaction.options.getString('looking_for');
    let lookingFor: string[] = [];

    if (lookingForRaw && lookingForRaw.toLowerCase() !== 'anyone') {
      if (!CHARACTER_NAMES.includes(lookingForRaw)) {
        const embed = base(COLORS.danger)
          .setTitle('❌ Invalid Character')
          .setDescription('Please select a character from the autocomplete list, or leave blank to match against anyone.');
        await interaction.editReply({ embeds: [embed] });
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
      createDiscordMatchCallback(discordUser, user.main, lookingFor),
    );

    if (matched) {
      const embed = base(COLORS.success)
        .setTitle('⚡ Match Found!')
        .setDescription('A match was found instantly! Check your DMs for the ready-check.');
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply({ embeds: [createSearchingEmbed(user.main, lookingFor)] });
    }
  },

  async autocomplete(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const choices = [
      { name: 'Anyone', value: 'anyone' },
      ...CHARACTER_NAMES.filter((name) => name.toLowerCase().includes(focused)).map((name) => ({
        name,
        value: name,
      })),
    ].slice(0, 25);
    await interaction.respond(choices);
  },
};

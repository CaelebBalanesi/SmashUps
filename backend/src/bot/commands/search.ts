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
import { CHARACTER_NAMES } from '../../data/characters';
import { enterPool, isInPool, OpponentInfo } from '../../services/matchmaking';
import { registerForReadyCheck, READY_TIMEOUT_MS } from '../../services/readyCheck';
import { BotCommand } from '../types';

function createReadyEmbed(opponent: OpponentInfo): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('⚡ Match Found!')
    .setDescription(
      `You've been matched against **${opponent.username}** who mains **${opponent.main}**.\n\n` +
        `Click **Ready!** within **${READY_TIMEOUT_MS / 1000} seconds** to confirm the match.`,
    )
    .setColor(0xd96cff);
}

export function createWaitingEmbed(opponent: OpponentInfo): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('⏳ Waiting for opponent...')
    .setDescription(`You are ready! Waiting for **${opponent.username}** to confirm.`)
    .setColor(0xff9800);
}

function createConfirmedEmbed(opponent: OpponentInfo): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('✅ Match Confirmed!')
    .setDescription(
      `Both players are ready! Your opponent is **${opponent.username}** who mains **${opponent.main}**.\n\nGood luck!`,
    )
    .setColor(0x4caf50);
}

function createDeclinedEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('❌ Match Cancelled')
    .setDescription('You did not ready up in time and have been removed from the queue.')
    .setColor(0xf44336);
}

function createRequeueEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🔄 Re-queuing...')
    .setDescription("Your opponent didn't ready up in time. You've been placed back in the queue.")
    .setColor(0xff9800);
}

function buildReadyRow(matchId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`ready_${matchId}`)
      .setLabel('Ready!')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅'),
  );
}

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
          try {
            if (messageRef.msg) {
              await messageRef.msg.edit({ embeds: [createConfirmedEmbed(opponent)], components: [] });
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
        // reenterPool — handled inside onRequeue above, but also called by cancelReadyCheckForUser
        // on disconnect. In that case we can't do much since the bot command is long finished.
      },
    );

    // Send the ready-check DM
    try {
      const dm = await discordUser.createDM();
      messageRef.msg = await dm.send({
        embeds: [createReadyEmbed(opponent)],
        components: [buildReadyRow(matchId)],
      });
    } catch {
      // DMs disabled — the ready-check timeout will handle kicking this player
    }
  };
}

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
        await interaction.editReply(
          'Invalid character. Please select one from the autocomplete list, or leave blank for anyone.',
        );
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
      await interaction.editReply('Match found! Check your DMs for the ready-check.');
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
      ...CHARACTER_NAMES.filter((name) => name.toLowerCase().includes(focused)).map((name) => ({
        name,
        value: name,
      })),
    ].slice(0, 25);
    await interaction.respond(choices);
  },
};

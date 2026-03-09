import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  Interaction,
  ChatInputCommandInteraction,
  ButtonInteraction,
} from 'discord.js';
import config from '../config/config';
import { BotCommand } from './types';
import { registerCommand } from './commands/register';
import { setMainCommand } from './commands/setmain';
import { searchCommand, createWaitingEmbed } from './commands/search';
import { stopSearchCommand } from './commands/stopsearch';
import { profileCommand } from './commands/profile';
import { markReady, getOpponentInfo } from '../services/readyCheck';

const commands: BotCommand[] = [
  registerCommand,
  setMainCommand,
  searchCommand,
  stopSearchCommand,
  profileCommand,
];

const commandMap = new Map<string, BotCommand>(
  commands.map((c) => [c.data.name, c]),
);

const READY_BUTTON_PREFIX = 'ready_';

async function handleReadyButtonInteraction(interaction: ButtonInteraction): Promise<void> {
  const matchId = interaction.customId.slice(READY_BUTTON_PREFIX.length);

  // Fetch opponent info before markReady deletes the check on full confirmation
  const opponent = getOpponentInfo(matchId, interaction.user.id);
  const result = markReady(matchId, interaction.user.id);

  if (result === 'waiting') {
    await interaction.update({
      embeds: [createWaitingEmbed(opponent ?? { id: '', username: 'your opponent', avatar: undefined, main: '' })],
      components: [],
    });
  } else if (result === 'confirmed') {
    // onConfirmed callbacks already fired (async) and will edit the messages.
    // Just acknowledge so Discord doesn't show a "failed" state on the button.
    await interaction.deferUpdate();
  } else {
    // 'not_found' — match expired before the click was processed
    await interaction.reply({
      content: 'This ready check has already expired.',
      ephemeral: true,
    });
  }
}

export const initBot = async (): Promise<void> => {
  const token = config.discordBotToken;
  if (!token) return;

  // Register slash commands via REST
  const rest = new REST().setToken(token);
  const commandData = commands.map((c) => c.data.toJSON());

  if (config.discordGuildId) {
    await rest.put(
      Routes.applicationGuildCommands(config.discordClientID, config.discordGuildId),
      { body: commandData },
    );
    console.log(`Bot slash commands registered to guild ${config.discordGuildId}`);
  } else {
    await rest.put(Routes.applicationCommands(config.discordClientID), { body: commandData });
    console.log('Bot slash commands registered globally');
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.on('interactionCreate', async (interaction: Interaction) => {
    if (interaction.isChatInputCommand()) {
      const command = commandMap.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction as ChatInputCommandInteraction);
      } catch (err) {
        console.error(`Error in /${interaction.commandName}:`, err);
        const reply = { content: 'Something went wrong.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    } else if (interaction.isButton()) {
      if (interaction.customId.startsWith(READY_BUTTON_PREFIX)) {
        try {
          await handleReadyButtonInteraction(interaction as ButtonInteraction);
        } catch (err) {
          console.error('Error handling ready button:', err);
        }
      }
    } else if (interaction.isAutocomplete()) {
      const command = commandMap.get(interaction.commandName);
      if (!command?.autocomplete) return;
      try {
        await command.autocomplete(interaction);
      } catch (err) {
        console.error(`Error in autocomplete for /${interaction.commandName}:`, err);
      }
    }
  });

  await client.login(token);
  console.log('Discord bot online');
};

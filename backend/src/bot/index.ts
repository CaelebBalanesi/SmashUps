import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  Interaction,
  ChatInputCommandInteraction,
} from 'discord.js';
import config from '../config/config';
import { BotCommand } from './types';
import { registerCommand } from './commands/register';
import { setMainCommand } from './commands/setmain';
import { searchCommand } from './commands/search';
import { stopSearchCommand } from './commands/stopsearch';
import { profileCommand } from './commands/profile';

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

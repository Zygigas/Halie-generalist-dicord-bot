import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { Command } from './types/commands';
import { deployCommands } from './scripts/deployCommands';
require('dotenv').config();

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.GuildMember],
});

client.commands = new Collection<string, Command>();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath, {recursive:true, withFileTypes: true})
  .filter(dirent => dirent.isFile() && dirent.name.endsWith('.js'));;

for (const file of commandFiles) {
  const filePath = path.join(file.parentPath, file.name);
  const command: Command = require(filePath).default;
  client.commands.set(command.data.name, command);
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath).default;
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on('error', (error) => {
  console.error('Discord.js error:', error);
});

client.login(process.env.DISCORD_TOKEN);
deployCommands();

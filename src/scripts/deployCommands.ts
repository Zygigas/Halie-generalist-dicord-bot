import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

export async function deployCommands() {

// 1. Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// 2. Validate required variables
if (!process.env.DISCORD_TOKEN) throw new Error('Missing DISCORD_TOKEN in .env');
if (!process.env.CLIENT_ID) throw new Error('Missing CLIENT_ID in .env');

// 3. Load all command files
const commandsPath = path.join(__dirname, '../commands');
const commandFiles = fs.readdirSync(commandsPath)
  .filter(file => file.endsWith('.js'));

const commands = [];
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath).default;
  if (command?.data) {
    commands.push(command.data.toJSON());
    console.log(`Loaded command: ${command.data.name}`);
  }
}

// 4. Deploy globally
new REST().setToken(process.env.DISCORD_TOKEN)
  .put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })
  .then(() => console.log(`Successfully deployed ${commands.length} global commands!`))
  .catch(console.error);

}

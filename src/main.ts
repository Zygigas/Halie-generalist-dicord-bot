import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '!ping') {
    await message.reply('Pong!');
  }
});

client.on('error', (error) => {
  console.error('Discord.js error:', error);
});

// Strip ALL non-visible characters
const token = `${process.env.DISCORD_TOKEN?.replace(/[^\x20-\x7E]/g, '')}`;

client.login(token);
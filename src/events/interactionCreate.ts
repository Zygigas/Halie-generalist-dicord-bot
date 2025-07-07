import { ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../types/commands';

export default {
  name: 'interactionCreate',
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName) as Command;
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Baka! Something broke...',
        ephemeral: true
      });
    }
  }
};
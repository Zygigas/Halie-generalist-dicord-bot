import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../types/commands';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with bot latency and API ping'),
  async execute(interaction: ChatInputCommandInteraction) {
  // 1. Start high-resolution timer
  const hrStart = process.hrtime();
  
  // 2. Immediate response
  await interaction.reply('🏓 Measuring...');
  
  // 3. Calculate real perceived latency
  const [seconds, nanoseconds] = process.hrtime(hrStart);
  const realLatencyMs = Math.round((seconds * 1000) + (nanoseconds / 1000000));
  
  // 4. Get WebSocket ping (wait for fresh measurement)
      const apiLatency = interaction.client.ws.ping;

  // 5. Update with accurate metrics
  await interaction.editReply([
    `Here are your stats...`,
    `• Real Latency: ${realLatencyMs}ms (from command press to visible reply)`,
    `• API Heartbeat: ${apiLatency}ms`,
    `_${getSassyRemark(realLatencyMs)}_`
  ].join('\n'));
},
}satisfies Command;
  
  // Optional: Add sassy remarks based on latency
  function getSassyRemark(latency: number): string {
    if (latency < 100) return 'I hope you last longer then that in bed...';
    if (latency < 500) return 'perfectly average, still pathetic.';
    if (latency < 1000) return 'you broke something didn\'t you? useless...';
    return 'if it gets any slower then this... just kill me please.';
  }
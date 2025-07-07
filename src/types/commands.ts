import { Collection ,SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

declare module "discord.js" {
  export interface Client {
    commands: Collection<unknown, any>
  }
}
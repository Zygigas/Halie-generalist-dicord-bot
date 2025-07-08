import { Collection ,SlashCommandBuilder, ChatInputCommandInteraction, SlashCommandOptionsOnlyBuilder } from 'discord.js';

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

declare module "discord.js" {
  export interface Client {
    commands: Collection<unknown, any>
  }
}
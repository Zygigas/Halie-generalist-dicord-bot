import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { ImportCharacterCardsToDBFromExcellSheet } from "../../../services/CharacterCardService";

export default {
  data: new SlashCommandBuilder()
    .setName("admin-upload-character-sheets")
    .setDescription("uploads the data from chracter sheets to DB.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages) // mod-only command
    .addAttachmentOption((option) =>
      option
        .setName("character-sheets")
        .setDescription(
          "XLSX file containing character sheets."
        )
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    
     await interaction.deferReply();

    const attachment = interaction.options.getAttachment('character-sheets', true);

     if (!attachment) {
        return interaction.editReply('No file was attached.');
    }

    try {
      const response = await fetch(attachment.url);

      if (!response.ok) {
            return interaction.editReply('Failed to fetch the file.');
        }

      const arrayBuffer = await response.arrayBuffer();
      
      await ImportCharacterCardsToDBFromExcellSheet(arrayBuffer, interaction.guildId!);

      await interaction.editReply("character data uploaded to DB.");



    } catch (error) {
      
      console.error(error);
      await interaction.editReply('An error occurred while processing the file.\n'+ error);

    }


  }
}
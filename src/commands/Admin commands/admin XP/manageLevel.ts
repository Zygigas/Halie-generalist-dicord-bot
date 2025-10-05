import { ChatInputCommandInteraction, CommandInteractionOptionResolver, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { decrementUserField, getUser, incrementUserField, setUserField } from "../../../services/UserService";

export default {
  data: new SlashCommandBuilder()
    .setName("admin-level")
    .setDescription("commands to manage the level of users on the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages) // mod-only
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Give level to a user.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to give level to.")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("The amount of level to give.")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("subtract")
        .setDescription("Take level from a user.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to take level from.")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("The amount of level to take.")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Set a user's level to a specific amount.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user whose level to set.")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("The specific amount to set the level to.")
            .setRequired(true)
            .setMinValue(0)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction)
  {
    if (!interaction.guildId) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand(true);
    const targetUser = interaction.options.getUser("user", true);
    const amount = interaction.options.getInteger("amount", true);

    if (targetUser.bot) {
      await interaction.reply({
        content: `Bots don't have levels`,
        ephemeral: true
      });
      return;
    }

    const userData = await getUser(targetUser.id, interaction.guildId);
    if (!userData) {
      await interaction.reply({
        content: `Could not find profile for **${targetUser.username}**. They might need to be verified first.`,
        ephemeral: true
      });
      return;
    }
    
    await interaction.deferReply({ ephemeral: true });

    switch (subcommand) {
      case "add":
        await incrementUserField(
          targetUser.id,
          interaction.guildId,
          "level",
          amount
        );
        await interaction.editReply({
          content: `Gave **${targetUser.username}** \`${amount}\` level(s), now they are at level \`${userData.level + amount}\`.`,
        });
        break;

        case "subtract":
          if (userData.level < amount) {
            await interaction.editReply({
              content: `⚠️ **${
                targetUser.username
              }** only is at level \`${userData.level}\`. You cannot take more than they have.`,
            });
            return;
          }
          await decrementUserField(
            targetUser.id,
            interaction.guildId,
            "level",
            amount
          );
          await interaction.editReply({
            content: `Took \`${amount}\` level(s) from **${targetUser.username}**, now they are at level \`${userData.level-amount}\`.`,
          });
          break;

          case "set":
          await setUserField(
            targetUser.id,
            interaction.guildId,
            "level",
            amount
          );
          await interaction.editReply({
            content: `Set **${
              targetUser.username
            }**'s level to \`${amount}\`.`,
          });
          break;
      }

  },
};
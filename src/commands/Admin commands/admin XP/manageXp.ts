import { ChatInputCommandInteraction, CommandInteractionOptionResolver, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { decrementUserField, getUser, incrementUserField, setUserField } from "../../../services/UserService";

export default {
  data: new SlashCommandBuilder()
    .setName("admin-xp")
    .setDescription("commands to manage the xp points of users on the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages) // mod-only
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Give xp to a user.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to give xp to.")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("The amount of xp to give.")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("subtract")
        .setDescription("Take xp from a user.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to take xp from.")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("The amount of xp to take.")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Set a user's xp points to a specific amount.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user whose xp to set.")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("The specific amount to set the xp to.")
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
        content: `Bots don't have xp points`,
        ephemeral: true,
      });
      return;
    }

    const userData = await getUser(targetUser.id, interaction.guildId);
    if (!userData) {
      await interaction.reply({
        content: `Could not find profile for **${targetUser.username}**. They might need to be verified first.`,
        ephemeral: true,
      });
      return;
    }
    
    await interaction.deferReply({ ephemeral: true });

    switch (subcommand) {
      case "add":
        await incrementUserField(
          targetUser.id,
          interaction.guildId,
          "xp",
          amount
        );
        await interaction.editReply({
          content: `Gave **${targetUser.username}** \`${amount}\` xp, now they have \`${userData.xp + amount}\` xp.`,
        });
        break;

        case "subtract":
          if (userData.xp < amount) {
            await interaction.editReply({
              content: `⚠️ **${
                targetUser.username
              }** only has \`${userData.xp}\` xp points. You cannot take more than they have.`,
            });
            return;
          }
          await decrementUserField(
            targetUser.id,
            interaction.guildId,
            "xp",
            amount
          );
          await interaction.editReply({
            content: `Took \`${amount}\` xp from **${targetUser.username}**, now they have \`${userData.xp-amount}\` xp.`,
          });
          break;

          case "set":
          await setUserField(
            targetUser.id,
            interaction.guildId,
            "xp",
            amount
          );
          await interaction.editReply({
            content: `Set **${
              targetUser.username
            }**'s xp points to \`${amount}\`.`,
          });
          break;
      }

  },
};
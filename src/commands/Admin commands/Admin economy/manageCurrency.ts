import { ChatInputCommandInteraction, CommandInteractionOptionResolver, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getServerSettings } from "../../../services/ServerSettingsService";
import { decrementUserField, getUser, incrementUserField, setUserField } from "../../../services/UserService";

export default {
  data: new SlashCommandBuilder()
    .setName("admin-economy")
    .setDescription("commands to manage the currency of users on the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages) // mod-only
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Give currency to a user.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to give currency to.")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("The amount of currency to give.")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("subtract")
        .setDescription("Take currency from a user.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to take currency from.")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("The amount of currency to take.")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Set a user's currency balance to a specific amount.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user whose balance to set.")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("The specific amount to set the balance to.")
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
    const { currencyName } = await getServerSettings(interaction.guildId);

    interaction.deferReply({ ephemeral: true });

    if (targetUser.bot) {
      await interaction.editReply({
        content: `Bots can't own any ${currencyName}`,
      });
      return;
    }

    const userData = await getUser(targetUser.id, interaction.guildId);
    if (!userData) {
      await interaction.editReply({
        content: `Could not find profile for **${targetUser.username}**. They might need to be verified first.`,
      });
      return;
    }

    switch (subcommand) {
      case "give":
        await incrementUserField(
          targetUser.id,
          interaction.guildId,
          "balance",
          amount
        );
        await interaction.editReply({
          content: `Gave **${targetUser.username}** \`${amount}\` ${currencyName}, now they have \`${userData.balance + amount}\` ${currencyName}.`,
        });
        break;

        case "take":
          if (userData.balance < amount) {
            await interaction.editReply({
              content: `⚠️ **${
                targetUser.username
              }** only has \`${userData.balance}\` ${currencyName}. You cannot take more than they have.`,
            });
            return;
          }
          await decrementUserField(
            targetUser.id,
            interaction.guildId,
            "balance",
            amount
          );
          await interaction.editReply({
            content: `Took \`${amount}\` ${currencyName} from **${targetUser.username}**, now they have \`${userData.balance-amount}\` ${currencyName}. **${
              targetUser.username
            }**.`,
          });
          break;

          case "set":
          await setUserField(
            targetUser.id,
            interaction.guildId,
            "balance",
            amount
          );
          await interaction.editReply({
            content: `Set **${
              targetUser.username
            }**'s balance to \`${amount}\` ${currencyName}.`,
          });
          break;
      }

  },
};

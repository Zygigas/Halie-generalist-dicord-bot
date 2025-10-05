import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../types/commands";
import { CreateUserSafe, createUserUnsafe } from "../../services/UserService";
import { getServerSettings } from "../../services/ServerSettingsService";

export default {
  data: new SlashCommandBuilder()
    .setName("fix-profile")
    .setDescription("Fixes or resets user profiles on the server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild) // Admin-only command
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription(
          "The specific user to fix. Leave blank to apply to all users."
        )
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("reset")
        .setDescription(
          "DANGER: Resets the profile to default values (balance, level, xp). Default: false."
        )
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    const user = interaction.options.getUser("user");
    const reset = interaction.options.getBoolean("reset") ?? false;
    const guild = interaction.guild;
    const { verifiedRoleId } = await getServerSettings(guild.id);

    if (!verifiedRoleId) {
      await interaction.reply({
        content: "verified role must be set to use this command",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const allMembers = await guild.members.fetch();
    const membersWithRole = allMembers.filter(
      (member) => member.roles.cache.has(verifiedRoleId) && !member.user.bot
    );

    if (reset) {
      const confirmId = `confirm_reset_${Date.now()}`;
      const cancelId = `cancel_reset_${Date.now()}`;

      const confirmationRow =
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(confirmId)
            .setLabel("Yes, I am sure")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(cancelId)
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Secondary)
        );

      const target = user ?? `${membersWithRole.size} users`;
      await interaction.editReply({
        content: `⚠️ **DANGER** ⚠️\nYou are about to reset ${target} to default values. This action cannot be undone. Are you sure you want to continue?`,
        components: [confirmationRow],
      });

      const filter = (i: { user: { id: string } }) =>
        i.user.id === interaction.user.id;
      try {
        const confirmation = await interaction.channel?.awaitMessageComponent({
          filter,
          time: 15000, // 15 seconds
        });

        if (confirmation?.customId === confirmId) {
          await confirmation.update({
            content: "Processing reset...",
            components: [],
          });

          if (user) {
            // Reset a single user
            if (user.bot) {
              await interaction.editReply(
                "Bots do not have profiles to reset."
              );
              return;
            }
            await createUserUnsafe(user, guild.id);
            await interaction.editReply(
              `Successfully reset the profile for **${user.username}**.`
            );
          } else {
            // Reset all users in the guild
            let count = 0;
            for (const member of membersWithRole.values()) {
              if (member.user.bot) continue;
              await createUserUnsafe(member.user, guild.id);
              count++;
            }
            await interaction.editReply(
              `**Operation complete.** Successfully reset **${count}** user profiles.`
            );
          }
        } else {
          await interaction.editReply({
            content: "Action cancelled.",
            components: [],
          });
        }
      } catch (e) {
        await interaction.editReply({
          content: "No confirmation received in 15 seconds. Action cancelled.",
          components: [],
        });
      }
    } else {
      if (user) {
        if (user.bot) {
          await interaction.editReply("Bots do not have profiles.");
          return;
        }
        const userData = await CreateUserSafe(user.id, guild.id);
        await interaction.editReply(
          `Successfully fixed the profile for **${user.username}**.`
        );
      } else {
        let count = 0;
        for (const member of membersWithRole.values()) {
          if (member.user.bot) continue;
          const userData = await CreateUserSafe(member.user.id, guild.id);
          count++;
        }
        await interaction.editReply(
          `**Operation complete.** Successfully fixed all user profiles.`
        );
      }
    }
  },
} satisfies Command;

import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  Guild,
  SlashCommandBuilder,
} from "discord.js";
import { getOrCreateUser, getUser } from "../services/UserService";
import { Command } from "../types/commands";

export default {
  data: new SlashCommandBuilder()
    .setName("show-profile")
    .setDescription("view the profile of a difrent user or yourself")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to show the profile of")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser("user") ?? interaction.user;

    let userData = await getUser(targetUser.id, interaction.guildId);

    if (!userData) {
      if (!interaction.guild?.members.fetch(targetUser.id)) {
        interaction.editReply({
          content: "Not a valid user, or the user is not in the server",
        });
        return;
      }

      userData = await getOrCreateUser(targetUser.id, interaction.guildId);

      if (!userData) {
        interaction.editReply({
          content: "Something went wrong, try again later...",
        });
        return;
      }
    }

    const profileEmbed = new EmbedBuilder()
      .setColor(targetUser.hexAccentColor ?? 0x000000)
      .setTitle(`✨ ${targetUser.username}'s Profile ✨`)
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        {
          name: "💰 Balance",
          value: `\`${userData.balance.toLocaleString()} coins\``,
          inline: true,
        },
        { name: "🌟 Level", value: `\`${userData.level}\``, inline: true },
        { name: "✨ XP", value: `\`${userData.xp}\``, inline: true }
      )
      .setFooter({
        text:
          `Joined server: ` +
          interaction.guild?.members.cache
            .get(targetUser.id)
            ?.joinedAt?.toDateString(),
      })
      .setTimestamp(targetUser.createdAt);

    await interaction.editReply({ embeds: [profileEmbed] });
  },
} satisfies Command;

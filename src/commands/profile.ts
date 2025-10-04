import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { getUser } from "../services/UserService";
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

    if (targetUser.bot) {
      interaction.editReply({
        content: "clankers don't have profiles, they are not people.",
      });
      return;
    }

    let userData = await getUser(targetUser.id, interaction.guildId);

    if (!userData) {
      await interaction.editReply({
        content: `**${targetUser.username}** doesn't have a profile yet. They need to be verified first.`,
      });
      return;
    }

    const member = await interaction.guild?.members.fetch(targetUser.id);

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
        text: `Joined server: ` + member?.joinedAt?.toDateString(),
      })
      .setTimestamp(targetUser.createdAt);

    await interaction.editReply({ embeds: [profileEmbed] });
  },
} satisfies Command;

import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { getUser } from "../../services/UserService";
import { Command } from "../../types/commands";

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
    const joinTime = member!.joinedAt!.getTime();

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
        text: `Joined server: ` + dateHelper(Date.now() - joinTime),
      })

    await interaction.editReply({ embeds: [profileEmbed] });
  },
} satisfies Command;

/**
 * shows the given time as a human readable string
 * @param timeInMs time in milliseconds
 */
function dateHelper(timeInMs: number) {
  const msPerSecond = 1000;
  const msPerMinute = msPerSecond * 60;
  const msPerHour = msPerMinute * 60;
  const msPerDay = msPerHour * 24;
  const msPerMonth = msPerDay * (365.25 / 12);
  const msPerYear = msPerDay * 365.25;

  let years = Math.floor(timeInMs / msPerYear);
  let months = Math.floor((timeInMs % msPerYear) / msPerMonth);
  let days = Math.floor((timeInMs % msPerMonth) / msPerDay);
  let hours = Math.floor((timeInMs % msPerDay) / msPerHour);
  let minutes = Math.floor((timeInMs % msPerHour) / msPerMinute);
  let seconds = Math.floor((timeInMs % msPerMinute) / msPerSecond);

  let dateConstruct = [years, months, days, hours, minutes, seconds];
  let dateConstructNames = [
    "year",
    "month",
    "day",
    "hour",
    "minute",
    "second",
  ];
  let stringConstruct = "";

  let weStartCountingFlag = false;
  for (let i = 0; i < dateConstruct.length; i++) {
    if (dateConstruct[i] > 0 || weStartCountingFlag) {
      stringConstruct += `${dateConstruct[i]} ${dateConstructNames[i]}`;
      weStartCountingFlag = true;

      if (dateConstruct[i] > 1) {
        stringConstruct += "s";
      }

      if (dateConstructNames[i] === "minute") {
      stringConstruct += " and ";
    } else if (dateConstructNames[i] === "second") {
      stringConstruct += " ago";
    } else {
      stringConstruct += ", ";
    }
    }
    
  }

  return stringConstruct;
}

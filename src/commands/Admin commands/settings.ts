import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/commands';
import { getServerSettings, setServerSettings } from '../../services/ServerSettingsService';
import { ServerSettings } from '../../types/firestore';

export default {
  data: new SlashCommandBuilder()
  .setName('server-settings')
  .setDescription('change of view the server settings of the bot')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages) // mod-only
  .addSubcommand(subcommand =>
    subcommand
      .setName('view')
      .setDescription('View the current server settings')
  )
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Set a new value for a setting.')
        .addRoleOption(option =>
          option.setName('verified-role')
            .setDescription('The role given to members when they are verified.')
        )
        .addIntegerOption(option =>
          option.setName('starting-balance')
            .setDescription('The amount of currency a new user starts with.')
        )
        .addChannelOption(option =>
          option.setName('log-channel')
            .setDescription('The channel to send log messages to.')
        )
        .addRoleOption(option =>
          option.setName('moderator-role')
            .setDescription('the role regular moderators have.')
        )
        .addRoleOption(option =>
          option.setName('elder-moderator-role')
            .setDescription('the role elder/senior moderators have.')
        )
        .addStringOption(option =>
          option.setName('currency-name')
            .setDescription('Name of the currency on the server.')
        )
        
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'view'){
      await interaction.deferReply({ ephemeral: true });
      const settings = await getServerSettings(interaction.guildId);

      const embed = new EmbedBuilder()
        .setTitle('Server Settings')
        .setColor('#5865F2')
        .addFields(
          { name: 'Verified Role', value: settings.verifiedRoleId ? `<@&${settings.verifiedRoleId}>` : 'Not Set' },
          { name: 'Starting Balance', value: `\`${settings.startingBalance?.toLocaleString()}\` ${settings.currencyName}` },
          { name: 'Log Channel', value: settings.logChannelId ? `<#${settings.logChannelId}>` : 'Not Set' },
          { name: 'Moderator Role', value: settings.moderatorRoleId ? `<@&${settings.moderatorRoleId}>` : 'Not Set' },
          { name: 'Elder Moderator Role', value: settings.elderModeratorRoleId ? `<@&${settings.elderModeratorRoleId}>` : 'Not Set' },
        );
      
      await interaction.editReply({ embeds: [embed] });
    }

    else if (subcommand === 'set')
      {
        await interaction.deferReply({ ephemeral: true });

        const verifiedRole = interaction.options.getRole('verified-role');
        const startingBalance = interaction.options.getInteger('starting-balance');
        const logChannel = interaction.options.getChannel('log-channel');
        const moderatorRole = interaction.options.getRole('moderator-role');
        const elderModeratorRole = interaction.options.getRole('elder-moderator-role');
        const currencyName = interaction.options.getString('currency-name');

        const settingsToUpdate: Partial<ServerSettings> = {};

        if (verifiedRole) settingsToUpdate.verifiedRoleId = verifiedRole.id;
        if (startingBalance) settingsToUpdate.startingBalance = startingBalance;
        if (logChannel) settingsToUpdate.logChannelId = logChannel.id;
        if (moderatorRole) settingsToUpdate.moderatorRoleId = moderatorRole.id;
        if (elderModeratorRole) settingsToUpdate.elderModeratorRoleId = elderModeratorRole.id;
        if (currencyName) settingsToUpdate.currencyName = currencyName;

        if (Object.keys(settingsToUpdate).length === 0) {
        await interaction.editReply('You must provide at least one setting to update.');
        return;
      }
      await setServerSettings(interaction.guildId, settingsToUpdate);
      await interaction.editReply('✅ Settings updated successfully!');

      }

  }

  } satisfies Command;
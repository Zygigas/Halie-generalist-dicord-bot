import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, PermissionsBitField, TextChannel, ChannelType, GuildMemberRoleManager } from 'discord.js';
import { Command } from '../types/commands';
import { permission } from 'process';

const channelVariableName = "target";
const messageVariableName = "message";


export default {
  data: new SlashCommandBuilder()
    .setName('impostor-message')
    .setDescription('Send a message as the bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)     
    .addChannelOption( option =>
      option
        .setName(channelVariableName)
        .setDescription('The channel to send the message to')
        .setRequired(true)
    ).addStringOption(option =>
      option
        .setName(messageVariableName)
        .setDescription('The message to send')
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {

  var targetChannel = interaction.options.getChannel(channelVariableName, true);
  const messageContent = interaction.options.getString(messageVariableName, true);
    
  // channel type validation check
  if ( !(targetChannel.type == ChannelType.GuildText || targetChannel.type == ChannelType.DM) ) {
    await interaction.reply({content:"You can't send messages to this channel... you idiot.",ephemeral:true});
    return;
  }

  targetChannel = targetChannel as TextChannel;

  const member = interaction.member;
  const memberIsAdmin = (member?.permissions as PermissionsBitField).has(PermissionsBitField.Flags.Administrator);
  // hardcoding the elder mod for now since I can't be arsed.
  // later on it could be moved into server settings once we have that set up. For not this works.
  const memberIsModerator = (member?.roles as GuildMemberRoleManager).cache.has("1386398927405842482"); 

  if (!memberIsAdmin && !memberIsModerator) {
    await interaction.reply({content:"You can't use this command... you idiot.", ephemeral:true})
    return;
  }

  const sentMessage = await targetChannel.send(messageContent);
  const messageLink = `https://discord.com/channels/${sentMessage.guildId}/${sentMessage.channelId}/${sentMessage.id}`
  await interaction.reply({content:"Message sent!\n"+messageLink,ephemeral:true});

  
},
}satisfies Command;
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  VoiceChannel,
  ChannelType,
  GuildMember,
} from "discord.js";
import {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  StreamType,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
} from "@discordjs/voice";
import ytdl from "ytdl-core";
import { Command } from "../../types/commands";

export default {
  data: new SlashCommandBuilder()
    .setName("music-player")
    .setDescription("Play music from a provided YouTube link in a voice channel.")
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("The YouTube URL of the song to play.")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("voice-channel")
        .setDescription("The voice channel to play the music in.")
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const url = interaction.options.getString("url", true);

    if (!ytdl.validateURL(url)) {
      await interaction.editReply({
        content: "Please provide a valid YouTube URL!",
      });
      return;
    }

    let targetChannel = interaction.options.getChannel("voice-channel") as VoiceChannel;

    if (!targetChannel) {
      const member = await interaction.guild?.members.fetch(interaction.user.id);
      if (member?.voice.channel) {
        targetChannel = member.voice.channel as VoiceChannel;
      } else {
        await interaction.editReply({
          content: "You must be in a voice channel or specify one to play music.",
        });
        return;
      }
    }

    try {
      const connection = joinVoiceChannel({
        channelId: targetChannel.id,
        guildId: interaction.guildId!,
        adapterCreator: interaction.guild!.voiceAdapterCreator,
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

      const stream = ytdl(url, {
        filter: "audioonly",
        quality: "highestaudio",
        highWaterMark: 1 << 25, 
      });

      const player = createAudioPlayer();
      const resource = createAudioResource(stream, {
        inputType: StreamType.Arbitrary,
      });

      player.play(resource);
      connection.subscribe(player);

      await interaction.editReply(`Now playing: ${url}`);

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });

      player.on("error", (error) => {
        console.error(`Error in audio player: ${error.message}`);
        connection.destroy(); 
      });

    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: "There was an error trying to play the song! Please try again.",
      });
    }
  },
} satisfies Command;
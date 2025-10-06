import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  VoiceChannel,
  ChannelType,
  TextChannel,
} from "discord.js";
import {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  StreamType,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  VoiceConnection,
} from "@discordjs/voice";
import ytDlp, { Payload } from "youtube-dl-exec";
import { Command } from "../../types/commands";

export default {
  data: new SlashCommandBuilder()
    .setName("music-player")
    .setDescription("Play music from a provided YouTube link using yt-dlp.")
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
    await interaction.deferReply({ ephemeral: true });

    const url = interaction.options.getString("url", true);
    let connection: VoiceConnection;

    try {
      const videoInfo = await ytDlp(url, {
        dumpSingleJson: true,
        noWarnings: true,
        preferFreeFormats: true,
      });

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

      const ytDlpProcess = ytDlp.exec(
        url,
        {
          format: 'bestaudio[ext=opus]/bestaudio/best',
          output: '-', 
          rmCacheDir: true,
        }
      );

      if (!ytDlpProcess.stdout) {
          throw new Error("Could not get a readable stream from yt-dlp.");
      }
      
      const audioStream = ytDlpProcess.stdout;

      ytDlpProcess.stderr?.on('data', (data) => {
        console.error(`[yt-dlp stderr]: ${data.toString()}`);
      });

      connection = joinVoiceChannel({
        channelId: targetChannel.id,
        guildId: interaction.guildId!,
        adapterCreator: interaction.guild!.voiceAdapterCreator,
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

      const player = createAudioPlayer();
      const resource = createAudioResource(audioStream, { inputType: StreamType.Arbitrary });

      player.play(resource);
      connection.subscribe(player);

      const title = (videoInfo as Payload).title ?? "the requested song";

      await interaction.editReply({ content: `Song loaded succesfully!` });

      await (interaction.channel as TextChannel).send(`Now playing: **${title}**`).then((message) =>{setTimeout(() => {
        message.delete();
      }, 5000 /* 5 seconds */);});

      player.on(AudioPlayerStatus.Idle, () => {
        if (connection?.state.status !== VoiceConnectionStatus.Destroyed) {
          connection.destroy();
        }
      });
      
      player.on("error", (error) => {
        console.error(`Audio Player Error: ${error.message}`);
        if (!ytDlpProcess.killed) ytDlpProcess.kill();
        if (connection?.state.status !== VoiceConnectionStatus.Destroyed) {
          connection.destroy();
        }
      });

    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: "An error occurred. Please check the console for details." });
    }
  },
} satisfies Command;
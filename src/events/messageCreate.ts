import { Message, TextChannel } from 'discord.js';
import { getServerSettings } from '../services/ServerSettingsService';
import { getUser, incrementUserField, setUserField } from '../services/UserService';
import { totalXpForLevel } from '../libraries/LevelingSystem/LevelingSystem';

const userCooldowns = new Map<string, number>();
const COOLDOWN_SECONDS = 60;

export default {
  name: 'messageCreate',
  async execute(message: Message) 
  {
    if (message.author.bot || !message.guild) {
      return;
    }

    const now = Date.now();
    const userKey = `${message.guild.id}-${message.author.id}`;
    const lastMessageTimestamp = userCooldowns.get(userKey) ?? 0;

    if (now < lastMessageTimestamp + COOLDOWN_SECONDS * 1000) {
      return; 
    }

     const settings = await getServerSettings(message.guild.id);
    if (settings.levelingDisabledChannels?.includes(message.channel.id)) {
      return; 
    }

    const userData = await getUser(message.author.id, message.guild.id);
    if (!userData) {
      return;
    }

    //Here be the SAUCE of the system

    const xpToGive = 1;
    await incrementUserField(message.author.id, message.guild.id, 'xp', xpToGive);
    userCooldowns.set(userKey, now);

    const newTotalXp = userData.xp + xpToGive;

    const xpNeededForNextLevel = totalXpForLevel(userData.level + 1);

     if (newTotalXp >= xpNeededForNextLevel) {
      let newLevel = userData.level;
      // while loop in case they gain enough XP for multiple levels
      while (totalXpForLevel(newLevel + 1) <= newTotalXp) {
        newLevel++;
      }
      await setUserField(message.author.id, message.guild.id, 'level', newLevel);
       await (message.channel as TextChannel).send({
        content: `Congratulations ${message.author}, you have reached **Level ${newLevel}**!`,
      });
    }
  }
}
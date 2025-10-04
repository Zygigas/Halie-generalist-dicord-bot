import { GuildMember } from 'discord.js';
import { getOrCreateUser } from '../services/UserService';
import { getServerSettings } from '../services/ServerSettingsService';

export default {
  name: 'guildMemberUpdate',
  async execute(oldMember: GuildMember, newMember: GuildMember) {

    const { verifiedRoleId } = await getServerSettings(newMember.guild.id);

    if (!verifiedRoleId) return;
    

    const oldHasRole = oldMember.roles.cache.has(verifiedRoleId);
    const newHasRole = newMember.roles.cache.has(verifiedRoleId);

    // Check if the role was JUST added
    if (!oldHasRole && newHasRole) {
      try {
        // Use getOrCreateUser as a safe way to create the profile.
        // It will only create if one doesn't already exist.
        await getOrCreateUser(newMember.id, newMember.guild.id);
      } catch (error) {
        console.error(`Failed to create profile for ${newMember.user.tag}:`, error);
      }
    }
  }
};
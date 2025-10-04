import { GuildMember } from 'discord.js';
import { getOrCreateUser } from '../services/UserService';

//const VERIFIED_ROLE_ID = process.env.VERIFIED_ROLE_ID; we will ignore it for now for testing.

export default {
  name: 'guildMemberUpdate',
  async execute(oldMember: GuildMember, newMember: GuildMember) {

    const oldHasRole = oldMember.roles.cache.has("1423836904561971303");
    const newHasRole = newMember.roles.cache.has("1423836904561971303");

    // Check if the role was JUST added
    if (!oldHasRole && newHasRole) {
      console.log(`User ${newMember.user.tag} has been verified. Creating profile...`);
      try {
        // Use getOrCreateUser as a safe way to create the profile.
        // It will only create if one doesn't already exist.
        await getOrCreateUser(newMember.id, newMember.guild.id);
        console.log(`Profile created successfully for ${newMember.user.tag}.`);
      } catch (error) {
        console.error(`Failed to create profile for ${newMember.user.tag}:`, error);
      }
    }
  }
};
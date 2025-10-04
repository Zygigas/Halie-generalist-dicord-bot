import { User } from "discord.js";
import FirestoreClient from "../libraries/FirestoreClient/FirestoreClient";
import { numberUserFields, UserData } from "../types/firestore";
import { client } from "../main";
import { FieldValue } from "firebase-admin/firestore";
import { getServerSettings } from './ServerSettingsService';

//remeber to keep this consistant, potential TODO: add a proper sstrict schema verifier.
const serversCollection = FirestoreClient.dataBase.collection("Halie-Servers");

/**
 * Helper function to get users collection for a specific server. This containts user
 * @param guildId
 * @returns CollectionReference
 */
const getUsersCollectionForGuild = (guildId: string) => {
  return serversCollection.doc(guildId).collection("users");
};

/**
 * function for retrieving a user document from Firestore based on the given userId and guildId.
 * Returns a UserData object if the document exists, otherwise null.
 * @param {string} userId - The user ID to retrieve.
 * @param {string} guildId - The guild ID where the user is located.
 * @returns {Promise<UserData | null>}
 */
export async function getUser(
  userId: string,
  guildId: string
): Promise<UserData | null> {
  const userDoc = await getUsersCollectionForGuild(guildId).doc(userId).get();
  return (userDoc?.data() as UserData) ?? null;
}

/**
 * helper function for creating a new user document in Firestore with the given discord user and guild ID.
 * This should not be used directly to create new users as it does not check if the user already exists and will overwrite it with default values.
 * @param {User} discordUser - The discord user to create.
 * @param {string} guildId - The guild ID where the user is located.
 * @returns {Promise<UserData|null>} - The created user data if successful, otherwise null if an error occurred.
 */
async function createUser(
  discordUser: User,
  guildId: string
): Promise<UserData | null> {
  const userId = discordUser.id;

  const { startingBalance } = await getServerSettings(guildId);

  const userData: UserData = {
    userId: userId,
    guildId: guildId,

    balance: startingBalance as number,
    level: 1,
    xp: 0,
  };
  await getUsersCollectionForGuild(guildId).doc(userId).set(userData);
  return userData;
}

/**
 * Retrieves a user document from Firestore for the given userId and guildId.
 * If the document does not exist, creates a new user document in Firestore with the given discord user and guild ID.
 * @param {string} userId - The user ID to retrieve.
 * @param {string} guildId - The guild ID where the user is located.
 * @returns {Promise<UserData | null>} - The retrieved user data if successful, otherwise null if an error occurred.
 */
export async function getOrCreateUser(
  userId: string,
  guildId: string
): Promise<UserData | null> {
  const existingUser = await getUser(userId, guildId);
  if (existingUser) return existingUser;
  const discordUser = await client.users.fetch(userId);
  const newUser = await createUser(discordUser, guildId);
  return newUser;
}

/**
 * Increments the given field of a user document in Firestore by the given amount.
 * If a given user does not exist, this function will create a broken user data. Make sure to always check if a user exists before using this function.
 *@param {string} userId - The user ID to update.
 *@param {string} guildId - The guild ID where the user is located.
 *@param {numberUserFields} field - The field of the user document to update.
 *@param {number} amount - The amount to increment the field by.
 * @returns {Promise<void>} - Resolves when the operation is complete, rejects with an error if an error occurred.
 */
export async function incrementUserField(
  userId: string,
  guildId: string,
  field: numberUserFields,
  amount: number
): Promise<void> {
  await getUsersCollectionForGuild(guildId)
    .doc(userId)
    .update({
      [field]: FieldValue.increment(amount),
    });
}

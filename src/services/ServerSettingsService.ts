import FirestoreClient from "../libraries/FirestoreClient/FirestoreClient";
import { ServerSettings } from "../types/firestore";

const serversCollection = FirestoreClient.dataBase.collection("Halie-Servers");

// change this to change the global default settings for the bot.
export const defaultSettings: ServerSettings = {
  startingBalance: 100,
  currencyName: "Gold",

  logChannelId: null,
  verifiedRoleId: null,
  moderatorRoleId: null,
  elderModeratorRoleId: null,
};

/**
 * Retrieves the server settings for the given guild ID.
 * If no settings are found for the server, it will set all the settings to the default values.
 * @param {string} guildId - The ID of the guild to retrieve settings for.
 * @returns {Promise<ServerSettings>} - A promise that resolves with the server settings for the given guild ID.
 */
export async function getServerSettings(
  guildId: string
): Promise<ServerSettings> {
  const serverDoc = await serversCollection.doc(guildId).get();

  const savedSettings = serverDoc.data() as ServerSettings | undefined;

  return { ...defaultSettings, ...savedSettings };
}

/**
 * Sets the server settings for the given guild ID.
 * @param {string} guildId - The ID of the guild to set settings for.
 * @param {Partial<ServerSettings>} settings - The server settings to set.
 */
export async function setServerSettings(
  guildId: string,
  settings: Partial<ServerSettings>
): Promise<void> {
  await serversCollection.doc(guildId).set(settings, { merge: true });
}

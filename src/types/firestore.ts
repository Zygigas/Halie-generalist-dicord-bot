// quick and dirty hack utility to get the keys of a type/interface that are of a certain type
type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export interface UserData {
  userId: string;
  guildId: string;

  balance: number;
  level: number;
  xp: number;
}

export interface ServerSettings {
  currencyName: string | null;

  verifiedRoleId: string | null;
  startingBalance: number | null;
  logChannelId: string | null; // TODO: add logging system for the bot.
  moderatorRoleId: string | null;
  elderModeratorRoleId: string | null;
}

export type numberUserFields = KeysOfType<UserData, number>;

import { Timestamp, FieldValue } from "firebase-admin/firestore";

// quick and dirty hack utility to get the keys of a type/interface that are of a certain type
type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export interface UserData {
  balance: number;
  level: number;
  xp: number;
}

export type numberUserFields = KeysOfType<UserData, number>;

import { Timestamp, FieldValue } from "firebase-admin/firestore";

export interface UserData 
{
    balance: number;
    level: number;
    xp: number;
}
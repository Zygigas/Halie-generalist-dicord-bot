import FirestoreClient from "../libraries/FirestoreClient/FirestoreClient";
import { exportXlsxToArrayOfElements } from "../libraries/ExcelClient/ExcelReader";

export interface CharacterSheet {
  Name: string;
  Player: string;
  Faction: string; 
  Concept: string;
  Nature: string;
  Demeanor: string;

  Strength: number;
  Dexterity: number;
  Stamina: number;
  Charisma: number;
  Manipulation: number;
  Composure: number;
  Intelligence: number;
  Wits: number;
  Resolve: number;

  Athletics: number;
  Brawl: number;
  Craft: number;
  Drive: number;
  Firearms: number;
  Larceny: number;
  Melee: number;
  Stealth: number;
  Survival: number;
  AnimalKen: number;
  Etiquette: number;
  Insight: number;
  Intimidation: number;
  Leadership: number;
  Performance: number;
  Persuasion: number;
  Streetwise: number;
  Subterfuge: number;
  Academics: number;
  Awareness: number;
  Finance: number;
  Investigation: number;
  Medicine: number;
  Occult: number;
  Politics: number;
  Science: number;
  Technology: number;

  Abilities: string; 
  Age: number;       
  PreviousLife: string;
  Connections: string;
  Goals: string;
  Enemies: string;
  Equipment: string;
  Notes: string;
  Attire: string;
}

export const characterSheetLabels: Record<keyof CharacterSheet, string> = {
  Name: "name",
  Player: "player",
  Faction: "origin/ faction",
  Concept: "concept",
  Nature: "nature",
  Demeanor: "demeanor",
  Strength: "strength",
  Dexterity: "dexterity",
  Stamina: "stamina",
  Charisma: "charisma",
  Manipulation: "manipulation",
  Composure: "composure",
  Intelligence: "intelligence",
  Wits: "wits",
  Resolve: "resolve",
  Athletics: "athletics",
  Brawl: "brawl",
  Craft: "craft",
  Drive: "drive",
  Firearms: "firearms",
  Larceny: "larceny",
  Melee: "melee",
  Stealth: "stealth",
  Survival: "survival",
  AnimalKen: "animal ken",  
  Etiquette: "etiquette",
  Insight: "insight",
  Intimidation: "intimidation",
  Leadership: "leadership",
  Performance: "performance",
  Persuasion: "persuasion",
  Streetwise: "streetwise",
  Subterfuge: "subterfuge",
  Academics: "academics",
  Awareness: "awareness",
  Finance: "finance",
  Investigation: "investigation",
  Medicine: "medicine",
  Occult: "occult",
  Politics: "politics",
  Science: "science",
  Technology: "technology",
  Abilities: "abilities",
  Age: "age",
  PreviousLife: "previous Life", 
  Connections: "connections",
  Goals: "goals",
  Enemies: "enemies",
  Equipment: "equipment",
  Notes: "notes",
  Attire: "attire"
};

// lookup map to make saving and veryfying stuff later easier.
const excelHeaderToKeyMap: Record<string, keyof CharacterSheet> = {};
for (const key in characterSheetLabels) {
  const interfaceKey = key as keyof CharacterSheet;
  const excelLabel = characterSheetLabels[interfaceKey].toLowerCase();
  excelHeaderToKeyMap[excelLabel] = interfaceKey;
}

//love me or hate me this is how we do it for now... this fucking needs a rework omg...
const serversCollection = FirestoreClient.dataBase.collection("Halie-Servers");


export async function ImportCharacterCardsToDBFromExcellSheet(file: ArrayBuffer, guildId: string) {

  const getCharactersCollectionForGuild = (guildId: string) => {
  return serversCollection.doc(guildId).collection("characters");
  };

  let values = await exportXlsxToArrayOfElements(file);

  //validate headers against const labels
  for (let i = 0; i < values.length; i++) {
    let characterSheet:Partial<CharacterSheet> = {};
    for (let j = 0; j < values[i].length; j++) {

      const rawName = values[i][j].name;
      const normaliedName = rawName.toLowerCase().trim();
 
      if (normaliedName in excelHeaderToKeyMap) {

        const key = excelHeaderToKeyMap[normaliedName];
        let value = values[i][j].value;

        const currentType = typeof characterSheet[key];

        if (!isNaN(Number(value)) && value !== "") {
          (characterSheet as any)[key] = Number(value);
        } else {
          (characterSheet as any)[key] = String(value);
        }
      } else {
        throw new Error(`unkown header name in file: ${values[i][j].name}`);
      }
    }  
    await getCharactersCollectionForGuild(guildId).doc(characterSheet.Name!).set(characterSheet);  
  }





}

export function totalXpForLevel(level: number): number {
  if (level <= 0) {
    return 0;
  }
  // hardcode the formula for now, most other bots don't let you adjust the formula anyway and we can add a mod on top later in some other func.
  const totalXp = 2.5 * level ** 2 + 22.5 * level;
  return Math.floor(totalXp);
}

export function xpToNextLevel(currentLevel: number): number {
    if (currentLevel < 1) {
        return totalXpForLevel(1);
    }
    const xpForNext = totalXpForLevel(currentLevel + 1);
    const xpForCurrent = totalXpForLevel(currentLevel);
    return xpForNext - xpForCurrent;
}
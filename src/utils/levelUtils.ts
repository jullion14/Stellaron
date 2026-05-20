export function ascensionForLevel(level: number): number {
  if (level <= 20) return 0;
  if (level <= 30) return 1;
  if (level <= 40) return 2;
  if (level <= 50) return 3;
  if (level <= 60) return 4;
  if (level <= 70) return 5;
  return 6;
}

export function calcStat(base: number, step: number, level: number): number {
  return Math.round(base + step * (level - 1));
}
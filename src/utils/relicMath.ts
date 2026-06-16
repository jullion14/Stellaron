// src/utils/relicMath.ts
import type { Relic, StatKey } from '@/types';
import type { RawRelicSubAffixGroup } from '@/api/staticData';

// Exact datamined linear scaling parameters from honkai-star-rail.fandom.com/wiki/Relic/Stats
export const RELIC_MAIN_STAT_PROFILES: Record<number, Partial<Record<StatKey, { base: number; step: number }>>> = {
  5: {
    hp:            { base: 112.896,  step: 39.5136 },
    atk:           { base: 56.448,   step: 19.7568 },
    spd:           { base: 4.032,    step: 1.4000 },
    hpPercent:     { base: 6.912,    step: 2.4192 },
    atkPercent:    { base: 6.912,    step: 2.4192 },
    defPercent:    { base: 8.640,    step: 3.0240 },
    effectHitRate: { base: 6.912,    step: 2.4192 },
    critRate:      { base: 5.184,    step: 1.8144 },
    critDmg:       { base: 10.368,   step: 3.6288 },
    breakEffect:   { base: 10.368,   step: 3.6288 },
    healBonus:     { base: 5.5296,   step: 1.9354 },
    energyRegen:   { base: 3.1104,   step: 1.0886 },
    dmgBonus:      { base: 6.2208,   step: 2.1773 },
  },
  4: {
    hp:            { base: 90.3168,   step: 31.61088 },
    atk:           { base: 45.1584,   step: 15.80544 },
    spd:           { base: 3.2256,   step: 1.1000 },
    hpPercent:     { base: 5.5296,   step: 1.9354 },
    atkPercent:    { base: 5.5296,   step: 1.9354 },
    defPercent:    { base: 6.9120,   step: 2.4192 },
    effectHitRate: { base: 5.5296,   step: 1.9354 },
    critRate:      { base: 4.1472,   step: 1.4515 },
    critDmg:       { base: 8.2944,   step: 2.9030 },
    breakEffect:   { base: 8.2944,   step: 2.9030 },
    healBonus:     { base: 4.4237,  step: 1.5483 },
    energyRegen:   { base: 2.4883,  step: 0.8709 },
    dmgBonus:      { base: 4.9766,  step: 1.7418 },
  },
  3: {
    hp:            { base: 67.7376,  step: 23.70816 },
    atk:           { base: 33.8688,  step: 11.85408 },
    spd:           { base: 2.4192,   step: 1.0000 },
    hpPercent:     { base: 4.1472,   step: 1.4515 },
    atkPercent:    { base: 4.1472,   step: 1.4515 },
    defPercent:    { base: 5.1840,   step: 1.8144 },
    effectHitRate: { base: 4.1472,   step: 1.4515 },
    critRate:      { base: 3.1104,   step: 1.0886 },
    critDmg:       { base: 6.2208,   step: 2.1773 },
    breakEffect:   { base: 6.2208,   step: 2.1773 },
    healBonus:     { base: 3.3178,  step: 1.1612 },
    energyRegen:   { base: 1.8662,  step: 0.6532 },
    dmgBonus:      { base: 3.7325,  step: 1.3064 },
  },
};

/**
 * Calculates the exact truncated value matching the in-game UI behavior.
 */
export function calculateMainStatValue(statKey: StatKey, level: number, rarity: number): number {
  const profile = RELIC_MAIN_STAT_PROFILES[rarity]?.[statKey];
  if (!profile) return 0;

  const exactRawValue = profile.base + (profile.step * level);
  const isPercent = !['hp', 'atk', 'spd'].includes(statKey);

  if (isPercent) {
    // Drop lower float anomalies to match UI truncation rules (e.g. 8.57% becomes 8.5%)
    return Math.floor(exactRawValue * 10) / 10;
  }
  return Math.floor(exactRawValue);
}

/**
 * Sums a single relic's main stat + substats into a flat stat map.
 * Used to render per-slot stat contribution in the relic grid.
 */
export function getRelicStatContribution(relic: Relic): Partial<Record<StatKey, number>> {
  const totals: Partial<Record<StatKey, number>> = {};

  // Main stat
  const mk = relic.mainStat.key;
  totals[mk] = (totals[mk] ?? 0) + relic.mainStat.value;

  // Substats
  for (const sub of relic.subStats) {
    if (sub.value > 0) {
      totals[sub.key] = (totals[sub.key] ?? 0) + sub.value;
    }
  }

  return totals;
}

// Maps StarRailRes property names → your StatKey
export const PROPERTY_TO_STAT_KEY: Record<string, StatKey> = {
  HPDelta:                    'hp',
  AttackDelta:                'atk',
  DefenceDelta:               'def',
  HPAddedRatio:               'hpPercent',
  AttackAddedRatio:           'atkPercent',
  DefenceAddedRatio:          'defPercent',
  SpeedDelta:                 'spd',
  CriticalChanceBase:         'critRate',
  CriticalDamageBase:         'critDmg',
  StatusProbabilityBase:      'effectHitRate',
  StatusResistanceBase:       'effectRes',
  BreakDamageAddedRatioBase:  'breakEffect',
};

/**
 * Returns the 3 roll tier values for a given substat within a rarity group.
 * Tiers are [low, mid, high] = [base, base+step, base+2*step].
 * Values are in the same unit as your StatKey convention:
 * - flat stats (hp/atk/def/spd): raw numbers
 * - percent stats: multiplied by 100 (so 0.0432 → 4.32)
 */
export function getSubStatRollTiers(
  group: RawRelicSubAffixGroup,
  statKey: StatKey
): [number, number, number] | null {
  const isPercent = !['hp', 'atk', 'def', 'spd'].includes(statKey);

  const affix = Object.values(group.affixes).find(
    (a) => PROPERTY_TO_STAT_KEY[a.property] === statKey
  );
  if (!affix) return null;

  const tiers = [0, 1, 2].map((i) => {
    const raw = affix.base + affix.step * i;
    return isPercent
      ? Math.round(raw * 1000) / 10   // e.g. 0.02592 → 2.592
      : Math.round(raw * 100) / 100;  // e.g. 33.87 → 33.87
  });

  return tiers as [number, number, number];
}

/**
 * Returns the absolute maximum number of substat lines a relic can hold at max level.
 * Every rarity tier can reach up to 4 lines total.
 */
export function getMaxLinesAllowed(rarity: number): number {
  return 4;
}

/**
 * Calculates the maximum allowed rolls for a single substat.
 * Accounts for upgrades consumed ("wasted") by unlocking hidden lines.
 */
export function getMaxSingleSubstatRolls(rarity: number, level: number): number {
  const totalUpgrades = Math.floor(level / 3);
  // Wasted unlocks needed to reach 4 lines: 5★ = 0, 4★ = 1, 3★ = 2
  const wastedUnlocks = 5 - rarity; 
  const effectiveUpgrades = Math.max(0, totalUpgrades - wastedUnlocks);
  
  return 1 + effectiveUpgrades; // 1 Base Roll + remaining upgrade boosts
}

/**
 * Calculates the maximum total combined rolls across the entire relic.
 * Formula: Maximum Starting Lines + Upgrades from Leveling
 */
export function getMaxTotalRollsAllowed(rarity: number, level: number): number {
  // Max starting base lines: 5★ = 4, 4★ = 3, 3★ = 2
  const maxStartingLines = rarity - 1; 
  const upgrades = Math.floor(level / 3);
  
  return maxStartingLines + upgrades;
}

/**
 * Translates a flat/percent substat value into its approximate in-game roll count.
 */
export function estimateRollCount(value: number, midRollValue: number): number {
  if (!value || !midRollValue) return 0;
  return Math.round(value / midRollValue);
}
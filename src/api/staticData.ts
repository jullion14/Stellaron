// Base URLs
const DB = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en';
const ASSETS = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master';

async function fetchJSON<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${DB}/${endpoint}.json`);
  if (!res.ok) throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);
  return res.json();
}

export function assetUrl(path: string): string {
  return `${ASSETS}/${path}`;
}

// ─── Raw API shapes ───────────────────────────────────────────────────────────

export interface RawCharacter {
  id: string;
  name: string;
  tag: string;
  rarity: number;
  path: string;
  element: string;
  max_sp: number;
  ranks: string[];
  skills: string[];
  skill_trees: string[];
  icon: string;
  preview: string;
  portrait: string;
}

export interface RawStatValue {
  base: number;
  step: number;
}

export interface RawPromotion {
  hp: RawStatValue;
  atk: RawStatValue;
  def: RawStatValue;
  spd: RawStatValue;
  taunt: RawStatValue;
  crit_rate: RawStatValue;
  crit_dmg: RawStatValue;
}

export interface RawCharacterPromotion {
  id: string;
  values: RawPromotion[]; // index 0–6 = ascension 0–6
}

export interface RawSkill {
  id: string;
  name: string;
  max_level: number;
  element: string;
  type: string;
  type_text: string;
  effect: string;
  effect_text: string;
  simple_desc: string;
  desc: string;
  params: number[][];
  icon: string;
}

export interface RawRank {
  id: string;
  name: string;
  rank: number;
  desc: string;
  icon: string;
}

export interface RawLightCone {
  id: string;
  name: string;
  rarity: number;
  path: string;
  desc: string;
  icon: string;
  portrait: string;
}

export interface RawLightConePromotion {
  id: string;
  values: RawPromotion[]; // index 0–6 = ascension 0–6 matching character layouts
}

export interface RawLightConeRank {
  id: string;
  name: string;
  rank: number; // Superimposition levels 1–5
  desc: string;
  params: number[][]; // Multiplier tables per superimposition tier
}
export interface RawRelic {
  id: string;
  set_id: string;
  name: string;
  rarity: number;
  type: string;
  max_level: number;
  main_affix_id: string;
  sub_affix_id: string;
  icon: string;
}

export interface RawRelicSet {
  id: string;
  name: string;
  desc: string[];
  properties: unknown[][];
  icon: string;
}
export interface RawRelicMainAffix {
  affix_id: string;
  property: string;
  base: number;
  step: number;
}

export interface RawRelicMainAffixGroup {
  affixes: Record<string, RawRelicMainAffix>;
}

export interface RawRelicSubAffix {
  affix_id: string;
  property: string;
  base: number;
  step: number;
  step_num: number;
}

export interface RawRelicSubAffixGroup {
  id: string;
  affixes: Record<string, RawRelicSubAffix>;
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

export const fetchRawCharacters = () =>
  fetchJSON<Record<string, RawCharacter>>('characters');

export const fetchCharacterPromotions = () =>
  fetchJSON<Record<string, RawCharacterPromotion>>('character_promotions');

export const fetchCharacterSkills = () =>
  fetchJSON<Record<string, RawSkill>>('character_skills');

export const fetchCharacterRanks = () =>
  fetchJSON<Record<string, RawRank>>('character_ranks');

export const fetchRawLightCones = () =>
  fetchJSON<Record<string, RawLightCone>>('light_cones');

export const fetchLightConePromotions = () =>
  fetchJSON<Record<string, RawLightConePromotion>>('light_cone_promotions');

export const fetchLightConeRanks = () =>
  fetchJSON<Record<string, RawLightConeRank>>('light_cone_ranks');

export const fetchRawRelics = () =>
  fetchJSON<Record<string, RawRelic>>('relics');

export async function fetchRawRelicSets(): Promise<Record<string, RawRelicSet>> {
  const res = await fetch(`${DB}/relic_sets.json`);
  return res.json();
}

export async function fetchCharacterSkillTrees() {
  const res = await fetch(
    `${DB}/character_skill_trees.json`
  );

  if (!res.ok) {
    throw new Error('Failed to fetch character skill trees');
  }

  return res.json();
}
export const fetchRelicMainAffixes = () =>
  fetchJSON<Record<string, RawRelicMainAffixGroup>>('relic_main_affixes');

export const fetchRelicSubAffixes = () =>
  fetchJSON<Record<string, RawRelicSubAffixGroup>>('relic_sub_affixes');

// ─── Stat calculator ─────────────────────────────────────────────────────────
// Computes final stat at a given ascension (0–6) and level (1–80)

export function calcStat(base: number, step: number, level: number): number {
  return Math.round((base + step * (level - 1)) * 100) / 100;
}
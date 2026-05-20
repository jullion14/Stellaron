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

export async function fetchCharacterSkillTrees() {
  const res = await fetch(
    `${DB}/character_skill_trees.json`
  );

  if (!res.ok) {
    throw new Error('Failed to fetch character skill trees');
  }

  return res.json();
}

// ─── Stat calculator ─────────────────────────────────────────────────────────
// Computes final stat at a given ascension (0–6) and level (1–80)

export function calcStat(base: number, step: number, level: number): number {
  return Math.round((base + step * (level - 1)) * 100) / 100;
}
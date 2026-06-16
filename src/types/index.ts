export type Element =
  | 'Fire' | 'Ice' | 'Lightning' | 'Wind'
  | 'Quantum' | 'Imaginary' | 'Physical';

export type Path =
  | 'TheHunt' | 'Erudition' | 'Nihility' | 'Abundance'
  | 'Destruction' | 'Harmony' | 'Preservation'
  | 'Remembrance' | 'Elation';

export type Rarity = 4 | 5;

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  critRate: number;
  critDmg: number;
}

// ─── Skills ──────────────────────────────────────────────────────────────────

export type SkillType = 'Normal' | 'BPSkill' | 'Ultra' | 'Talent' | 'Technique' | 'MazeNormal';

export interface Skill {
  id: string;
  name: string;
  typeText: string;   // "Basic ATK", "Skill", "Ultimate", "Talent"
  effectText: string; // "Single Target", "Blast", "AoE", etc.
  simpleDesc: string;
  desc: string;
  params: number[][];
  maxLevel: number;
  iconUrl: string;
}

// ─── Traces ──────────────────────────────────────────────────────────────────
export interface TraceNode {
  id: string;
  name: string;
  icon: string;
  desc?: string;
  anchor?: string;

  level_up_skills?: {
    property: string;
    value: number;
  }[];

  status_add_list?: {
    property: string;
    value: number;
  }[];
}

// ─── Eidolons ─────────────────────────────────────────────────────────────────

export interface Eidolon {
  id: string;
  name: string;
  rank: number;       // 1–6
  desc: string;
  iconUrl: string;
}

// ─── Characters ──────────────────────────────────────────────────────────────

export interface Character {
  id: string;
  name: string;
  rarity: Rarity;
  element: Element;
  path: Path;
  maxSP: number;
  iconUrl: string;
  previewUrl: string;
  portraitUrl: string;
  // Populated on detail fetch:
  baseStats?: BaseStats;
  skills?: Skill[];
  eidolons?: Eidolon[];
}

// ─── Light Cones ─────────────────────────────────────────────────────────────

export interface LightCone {
  id: string;
  name: string;
  rarity: Rarity;
  path: Path;
  desc: string;
  iconUrl: string;
  portraitUrl: string;
}

// ─── Relics ──────────────────────────────────────────────────────────────────

export type RelicSlot = 'Head' | 'Hands' | 'Body' | 'Feet' | 'PlanarSphere' | 'LinkRope';
// Relic Stat Definitions
export type StatKey = 
  | keyof BaseStats 
  | 'atkPercent' 
  | 'hpPercent' 
  | 'defPercent' 
  | 'dmgBonus'
  | 'breakEffect'
  | 'effectHitRate'
  | 'effectRes'
  | 'healBonus'
  | 'energyRegen'; 

export interface RelicSubStat {
  key: StatKey;
  value: number;
}

export interface Relic {
  id: string;
  setId: string;
  setName: string;
  slot: RelicSlot;
  rarity: Rarity;
  level: number;
  icon?: string;
  mainStat: RelicSubStat;
  subStats: RelicSubStat[];
}

// ─── Build ───────────────────────────────────────────────────────────────────

export interface Build {
  characterId: string;
  lightConeId?: string;
  lightConeLevel: number;
  lightConeSuperimposition: number;
  relics: Partial<Record<RelicSlot, Relic>>;
  eidolons: number;
}

export interface BuilderBuild {
  id: string;
  characterId: string;
  characterName: string;
  characterElement: Element;
  characterPath: Path;
  level: number;
  eidolonLevel: number;
  skillLevels: {
    normal: number;      // 1-7
    skill: number;       // 1-12
    ultimate: number;    // 1-12
    talent: number;      // 1-12
    technique: number;   // 1 only
  };
  lightConeId?: string;
  lightConeName?: string;
  lightConeSuperimposition: number
  relics: Partial<Record<RelicSlot, Relic>>; // Use your existing Relic type
  notes: string;
  savedAt: string;
  portraitUrl?: string;
}

export interface AggregatedStats extends BaseStats {
  breakEffect: number;
  effectHitRate: number;
  effectRes: number;
  healBonus: number;
  atkPercent: number;
  hpPercent: number;
  defPercent: number;
  dmgBonus: number;
}
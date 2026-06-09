import type { BuilderBuild, Relic, RelicSlot, StatKey, Element, Path, Rarity } from '@/types';

const ASSET = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master';
export const assetUrl = (path: string) => `${ASSET}/${path}`;

// ─── Field → StatKey ──────────────────────────────────────────────────────────
// Uses the `field` string from main_affix / sub_affix (NOT the `type` string).
// `percent` flag distinguishes flat hp/atk/def from their % variants.

function fieldToStatKey(field: string, percent: boolean): StatKey {
  if (field === 'hp')        return percent ? 'hpPercent'  : 'hp';
  if (field === 'atk')       return percent ? 'atkPercent' : 'atk';
  if (field === 'def')       return percent ? 'defPercent' : 'def';
  if (field === 'spd')       return 'spd';
  if (field === 'crit_rate') return 'critRate';
  if (field === 'crit_dmg')  return 'critDmg';
  // Everything else (elemental dmg, break, heal, effect hit/res) → dmgBonus
  return 'dmgBonus';
}

// Slot derived from icon path suffix: "icon/relic/104_0.png" → index 0 → Head
const SLOT_BY_INDEX: RelicSlot[] = ['Head', 'Hands', 'Body', 'Feet', 'PlanarSphere', 'LinkRope'];

function deriveSlot(icon: string, fallbackIndex: number): RelicSlot {
  const m = icon?.match(/_(\d)\.png$/);
  if (m) {
    const i = parseInt(m[1], 10);
    if (i >= 0 && i < 6) return SLOT_BY_INDEX[i];
  }
  return SLOT_BY_INDEX[fallbackIndex % 6];
}

// ─── Path / Element object → our union types ──────────────────────────────────
// The API returns { id: "Warrior", name: "Destruction", icon: "..." }

const PATH_ID_MAP: Record<string, Path> = {
  Warrior: 'Destruction', Rogue: 'TheHunt',   Mage: 'Erudition',
  Shaman:  'Harmony',     Warlock: 'Nihility', Knight: 'Preservation',
  Priest:  'Abundance',   Memory: 'Remembrance', Joker: 'Elation',
};

const ELEMENT_ID_MAP: Record<string, Element> = {
  Fire: 'Fire', Ice: 'Ice', Thunder: 'Lightning', Wind: 'Wind',
  Quantum: 'Quantum', Imaginary: 'Imaginary', Physical: 'Physical',
};

// ─── Mapper ───────────────────────────────────────────────────────────────────

export function mapMihomoCharacterToBuild(char: any): BuilderBuild {
  // --- Relics ---
  const relics: Partial<Record<RelicSlot, Relic>> = {};
  (char.relics ?? []).forEach((r: any, i: number) => {
    const slot = deriveSlot(r.icon ?? '', i);

    const mapAffix = (a: any) => ({
      key:   fieldToStatKey(a.field, a.percent) as StatKey,
      // percent values come as 0.058 → store as-is (display layer handles ×100)
      value: a.value as number,
    });

    relics[slot] = {
      id:      r.id ?? crypto.randomUUID(),
      setId:   r.set_id  ?? '',
      setName: r.set_name ?? '',
      slot,
      rarity:  (r.rarity ?? 5) as Rarity,
      level:   r.level   ?? 0,
      mainStat: r.main_affix ? mapAffix(r.main_affix) : { key: 'hp' as StatKey, value: 0 },
      subStats: (r.sub_affix ?? []).map(mapAffix),
    };
  });

  // --- Skills ---
  const skillLevels = { normal: 1, skill: 1, ultimate: 1, talent: 1, technique: 1 };
  (char.skills ?? []).forEach((s: any) => {
    const t = (s.type_text ?? '').toLowerCase();
    if (t.includes('basic'))     skillLevels.normal    = s.level;
    if (t.includes('skill'))     skillLevels.skill     = s.level;
    if (t.includes('ultimate'))  skillLevels.ultimate  = s.level;
    if (t.includes('talent'))    skillLevels.talent    = s.level;
    if (t.includes('technique')) skillLevels.technique = s.level;
  });

  // --- Path / Element (objects, not strings) ---
  const path    = PATH_ID_MAP[char.path?.id    ?? ''] ?? 'Destruction' as Path;
  const element = ELEMENT_ID_MAP[char.element?.id ?? ''] ?? 'Physical' as Element;

  return {
    id:               crypto.randomUUID(),
    characterId:      char.id,
    characterName:    char.name,
    characterElement: element,
    characterPath:    path,
    level:            char.level  ?? 80,
    eidolonLevel:     char.rank   ?? 0,
    skillLevels,
    lightConeId:              char.light_cone?.id,
    lightConeName:            char.light_cone?.name,
    lightConeSuperimposition: char.light_cone?.rank ?? 1,
    relics,
    notes:    `${char.name} — Showcase Import`,
    savedAt:  new Date().toISOString(),
  };
}

// ─── Stat display helpers ─────────────────────────────────────────────────────
// attributes = base stats (char + LC base)
// additions  = bonus stats (relics + traces + LC passives)

export function getStatDisplay(char: any, field: string): string {
  const base  = (char.attributes ?? []).find((a: any) => a.field === field);
  const bonus = (char.additions  ?? []).find((a: any) => a.field === field);
  const total = (base?.value ?? 0) + (bonus?.value ?? 0);
  if (base?.percent || bonus?.percent) return `${(total * 100).toFixed(1)}%`;
  return String(Math.round(total));
}
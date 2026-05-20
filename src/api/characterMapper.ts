import { assetUrl } from './staticData';
import type { RawCharacter, RawPromotion, RawSkill, RawRank } from './staticData';
import type { Character, Element, Path, Rarity, Skill, Eidolon, BaseStats } from '@/types';

function getTrailblazerName(id: string, element: string): string {
  const gender = parseInt(id) % 2 === 0 ? 'Stelle' : 'Caelus';
  return `Trailblazer (${gender}) · ${element}`;
}

const PATH_MAP: Record<string, Path> = {
  Warrior:     'Destruction',
  Rogue:       'TheHunt',
  Mage:        'Erudition',
  Shaman:      'Harmony',
  Warlock:     'Nihility',
  Knight:      'Preservation',
  Priest:      'Abundance',
  Memory:      'Remembrance',
  Joker:       'Elation',
};

const ELEMENT_MAP: Record<string, Element> = {
  Fire:      'Fire',
  Ice:       'Ice',
  Thunder:   'Lightning',
  Wind:      'Wind',
  Quantum:   'Quantum',
  Imaginary: 'Imaginary',
  Physical:  'Physical',
};

export function mapCharacter(raw: RawCharacter): Character {
    const isTrailblazer = raw.name === '{NICKNAME}';
    const element = ELEMENT_MAP[raw.element] ?? raw.element;
    return {
        id:          raw.id,
        name:        isTrailblazer ? getTrailblazerName(raw.id, element) : raw.name,
        rarity:      raw.rarity as Rarity,
        element:     ELEMENT_MAP[raw.element] ?? raw.element as Element,
        path:        PATH_MAP[raw.path] ?? raw.path as Path,
        maxSP:       raw.max_sp,
        iconUrl:     assetUrl(raw.icon),
        previewUrl:  assetUrl(raw.preview),
        portraitUrl: assetUrl(raw.portrait),
    };
}

// Ascension 6, level 80 — the standard "max stats" display
export function mapBaseStats(promotion: RawPromotion, level = 80): BaseStats {
  const asc = promotion; // caller passes the correct ascension tier
  return {
    hp:       Math.round(asc.hp.base  + asc.hp.step  * (level - 1)),
    atk:      Math.round(asc.atk.base + asc.atk.step * (level - 1)),
    def:      Math.round(asc.def.base + asc.def.step * (level - 1)),
    spd:      asc.spd.base,
    critRate: asc.crit_rate.base * 100,   // stored as 0.05 → display as 5
    critDmg:  asc.crit_dmg.base  * 100,   // stored as 0.5  → display as 50
  };
}

export function mapSkill(raw: RawSkill): Skill {
    const typeText = raw.type_text;
    const maxLevel = typeText === 'Technique' ? 1
        : typeText === 'Basic ATK' ? 7
        : 12;
    return {
        id:         raw.id,
        name:       raw.name,
        typeText:   raw.type_text,
        effectText: raw.effect_text,
        simpleDesc: raw.simple_desc,
        desc:       raw.desc,
        params:     raw.params,    
        maxLevel:   maxLevel,
        iconUrl:    assetUrl(raw.icon),
    };
}

export function mapEidolon(raw: RawRank): Eidolon {
  return {
    id:      raw.id,
    name:    raw.name,
    rank:    raw.rank,
    desc:    raw.desc,
    iconUrl: assetUrl(raw.icon),
  };
}
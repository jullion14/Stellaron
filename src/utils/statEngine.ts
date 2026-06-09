// src/utils/statEngine.ts
import type { BuilderBuild, AggregatedStats, BaseStats } from '@/types';

const createEmptyAggregated = (base: BaseStats): AggregatedStats => ({
  hp: base.hp,
  atk: base.atk,
  def: base.def,
  spd: base.spd,
  critRate: base.critRate,
  critDmg: base.critDmg,
  breakEffect: 0,
  effectHitRate: 0,
  effectRes: 0,
  healBonus: 0,
  atkPercent: 0,
  hpPercent: 0,
  defPercent: 0,
  dmgBonus: 0,
});

export function aggregateStats(
  characterBase: BaseStats | undefined,
  lightConeBase: BaseStats | undefined,
  build: BuilderBuild
): AggregatedStats {
  const baseStats: BaseStats = {
    hp: (characterBase?.hp ?? 0) + (lightConeBase?.hp ?? 0),
    atk: (characterBase?.atk ?? 0) + (lightConeBase?.atk ?? 0),
    def: (characterBase?.def ?? 0) + (lightConeBase?.def ?? 0),
    spd: characterBase?.spd ?? 0,
    critRate: characterBase?.critRate ?? 5,
    critDmg: characterBase?.critDmg ?? 50,
  };

  const totals = createEmptyAggregated(baseStats);
  const activeRelics = Object.values(build.relics).filter(Boolean);
  const allStats = activeRelics.flatMap(relic => [relic!.mainStat, ...relic!.subStats]);

  allStats.forEach(stat => {
    // Cast to string to safely evaluate combat-specific custom main-stats keys
    switch (stat.key as string) {
      case 'hpPercent':     totals.hpPercent += stat.value; break;
      case 'atkPercent':    totals.atkPercent += stat.value; break;
      case 'defPercent':    totals.defPercent += stat.value; break;
      case 'hp':            totals.hp += stat.value; break;
      case 'atk':           totals.atk += stat.value; break;
      case 'def':           totals.def += stat.value; break;
      case 'spd':           totals.spd += stat.value; break;
      case 'critRate':      totals.critRate += stat.value; break;
      case 'critDmg':       totals.critDmg += stat.value; break;
      case 'dmgBonus':      totals.dmgBonus += stat.value; break;
      case 'breakEffect':   totals.breakEffect += stat.value; break;
      case 'effectHitRate': totals.effectHitRate += stat.value; break;
      case 'effectRes':     totals.effectRes += stat.value; break;
      case 'healBonus':     totals.healBonus += stat.value; break;
    }
  });

  totals.hp  = Math.round(baseStats.hp  * (1 + totals.hpPercent / 100)  + (totals.hp - baseStats.hp));
  totals.atk = Math.round(baseStats.atk * (1 + totals.atkPercent / 100) + (totals.atk - baseStats.atk));
  totals.def = Math.round(baseStats.def * (1 + totals.defPercent / 100) + (totals.def - baseStats.def));
  
  totals.spd = Math.round(totals.spd * 10) / 10;
  totals.critRate = Math.round(totals.critRate * 10) / 10;
  totals.critDmg = Math.round(totals.critDmg * 10) / 10;

  return totals;
}
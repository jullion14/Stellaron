import { useQuery } from '@tanstack/react-query';
import { fetchRawCharacters } from '@/api/staticData';
import { mapCharacter } from '@/api/characterMapper';
import { useBuilderStore } from '@/store/builderStore';
import { calcStat, ascensionForLevel } from '@/utils/levelUtils';
import type { AggregatedStats } from '@/types';

export function StatsSummary() {
  // 1. Correctly extract the active sandbox build from the store state instance
  const activeBuild = useBuilderStore((state) => state.activeBuild);

  const { data: characters = [] } = useQuery({
    queryKey: ['characters'],
    queryFn: async () => {
      const raw = await fetchRawCharacters();
      return Object.values(raw).map(mapCharacter);
    },
    staleTime: 1000 * 60 * 10,
  });

  // 2. Early return guard if no active build workspace is running
  if (!activeBuild) {
    return (
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--color-muted)',
      }}>
        Select or import a character to see stats
      </div>
    );
  }

  // 3. Safely extract properties out of the valid activeBuild container
  const { characterId, level, relics } = activeBuild;
  const character = characters.find((c) => c.id === characterId);

  if (!character) {
    return (
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--color-muted)',
      }}>
        Character data not found in game assets index
      </div>
    );
  }

  // Calculate aggregated stats
  const stats: AggregatedStats = {
    hp: character.baseStats?.hp || 0,
    atk: character.baseStats?.atk || 0,
    def: character.baseStats?.def || 0,
    spd: character.baseStats?.spd || 0,
    critRate: character.baseStats?.critRate || 0,
    critDmg: character.baseStats?.critDmg || 0,
    breakEffect: 0,
    effectHitRate: 0,
    effectRes: 0,
    healBonus: 0,
    atkPercent: 0,
    hpPercent: 0,
    defPercent: 0,
    dmgBonus: 0,
  };

  // Add relic stats
  Object.values(relics).forEach((relic) => {
    if (!relic) return;
    addToStats(stats, relic.mainStat.key, relic.mainStat.value);
    relic.subStats.forEach((subStat) => {
      addToStats(stats, subStat.key, subStat.value);
    });
  });

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      padding: '1.25rem',
    }}>
      <h2 style={{
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '0.875rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--color-text)',
        marginBottom: '0.875rem',
      }}>
        Aggregated Stats (Lvl {level})
      </h2>

      {/* ── TWO ITEMS PER ROW GRID ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem',
      }}>
        <StatCard label="HP" value={Math.round(stats.hp)} />
        <StatCard label="ATK" value={Math.round(stats.atk)} />
        <StatCard label="DEF" value={Math.round(stats.def)} />
        <StatCard label="SPD" value={Math.round(stats.spd)} />
        <StatCard label="CRIT Rate" value={`${Math.round(stats.critRate * 100)}%`} />
        <StatCard label="CRIT DMG" value={`${Math.round(stats.critDmg * 100)}%`} />
        <StatCard label="Break Effect" value={`${Math.round(stats.breakEffect * 100)}%`} />
        <StatCard label="Effect Hit" value={`${Math.round(stats.effectHitRate * 100)}%`} />
        <StatCard label="Effect Res" value={`${Math.round(stats.effectRes * 100)}%`} />
        <StatCard label="Heal Bonus" value={`${Math.round(stats.healBonus * 100)}%`} />
      </div>
    </div>
  );
}

// ── COMPACT STAT CARD FOR CONDENSED SIDE-BY-SIDE PRESENTATION ──
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      background: 'var(--color-panel)',
      border: '1px solid var(--color-border)',
      borderRadius: '8px',
      padding: '0.625rem 0.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.125rem'
    }}>
      <div style={{
        fontSize: '0.6875rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: 'var(--color-muted)',
        fontFamily: 'Rajdhani, sans-serif'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '1.25rem',
        fontWeight: 700,
        color: 'var(--color-accent)',
        fontFamily: 'Rajdhani, sans-serif'
      }}>
        {value}
      </div>
    </div>
  );
}

function addToStats(stats: AggregatedStats, key: any, value: number): void {
  if (key in stats) {
    (stats as any)[key] += value;
  }
}
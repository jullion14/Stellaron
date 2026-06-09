import React, { useState } from 'react';
import { useBuilderStore } from '@/store/builderStore';
import type { RelicSlot, StatKey } from '@/types';

const RELIC_SLOTS: RelicSlot[] = ['Head', 'Hands', 'Body', 'Feet', 'PlanarSphere', 'LinkRope'];

const RELIC_SLOT_LABELS: Record<RelicSlot, string> = {
  Head: 'Head (HP)', Hands: 'Hands (ATK)', Body: 'Body',
  Feet: 'Feet', PlanarSphere: 'Planar Sphere', LinkRope: 'Link Rope',
};

const STAT_LABELS: Record<string, string> = {
  hp: 'HP', atk: 'ATK', def: 'DEF', spd: 'SPD', critRate: 'CRIT Rate', critDmg: 'CRIT DMG',
  atkPercent: 'ATK %', hpPercent: 'HP %', defPercent: 'DEF %', dmgBonus: 'DMG Bonus %',
  breakEffect: 'Break Effect %', effectHitRate: 'Effect Hit Rate %', effectRes: 'Effect RES %',
  healBonus: 'Outgoing Healing %', energyRegen: 'Energy Regen Rate %',
};

const SLOT_MAIN_STATS: Record<RelicSlot, StatKey[]> = {
  Head: ['hp'], Hands: ['atk'],
  Body: ['hpPercent', 'atkPercent', 'defPercent', 'critRate', 'critDmg', 'healBonus', 'effectHitRate'],
  Feet: ['hpPercent', 'atkPercent', 'defPercent', 'spd'],
  PlanarSphere: ['hpPercent', 'atkPercent', 'defPercent', 'dmgBonus'],
  LinkRope: ['hpPercent', 'atkPercent', 'defPercent', 'breakEffect', 'energyRegen'],
};

const SUBSTAT_KEYS: StatKey[] = [
  'hp', 'atk', 'def', 'hpPercent', 'atkPercent', 'defPercent',
  'spd', 'critRate', 'critDmg', 'breakEffect', 'effectHitRate', 'effectRes'
];

const STAT_MAX_VALUES: Record<string, number> = {
  hp: 705, atk: 352, hpPercent: 43.2, atkPercent: 43.2, defPercent: 54.0,
  critRate: 32.4, critDmg: 64.8, spd: 25, healBonus: 34.5, effectHitRate: 43.2,
  breakEffect: 64.8, energyRegen: 19.4, dmgBonus: 38.8,
};

export function RelicInput() {
  const activeBuild = useBuilderStore((state) => state.activeBuild);
  const setRelic = useBuilderStore((state) => state.setRelic);

  const [selectedSlot, setSelectedSlot] = useState<RelicSlot>('Head');
  const [mainStatKey, setMainStatKey] = useState<StatKey>('hp');
  const [mainStatValue, setMainStatValue] = useState<number>(705);
  const [relicLevel, setRelicLevel] = useState<number>(15);

  const [subStats, setSubStats] = useState<{ key: StatKey; value: number }[]>([
    { key: 'critRate', value: 0 }, { key: 'critDmg', value: 0 },
    { key: 'atkPercent', value: 0 }, { key: 'spd', value: 0 },
  ]);

  if (!activeBuild) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)' }}>
        Please select or import a character to begin configuration.
      </div>
    );
  }

  const handleSlotChange = (slot: RelicSlot) => {
    setSelectedSlot(slot);
    const allowed = SLOT_MAIN_STATS[slot];
    const defaultStat = allowed[0];
    setMainStatKey(defaultStat);
    setMainStatValue(STAT_MAX_VALUES[defaultStat] || 0);
  };

  const handleMainStatChange = (stat: StatKey) => {
    setMainStatKey(stat);
    setMainStatValue(STAT_MAX_VALUES[stat] || 0);
  };

  const handleSave = () => {
    const maxAllowed = STAT_MAX_VALUES[mainStatKey];
    if (mainStatValue > maxAllowed && maxAllowed > 0) {
      alert(`Invalid! Max value at +15 for ${STAT_LABELS[mainStatKey]} is ${maxAllowed}`);
      return;
    }
    setRelic(selectedSlot, {
      id: `${selectedSlot}_${Date.now()}`,
      setId: 'CustomSet',
      setName: 'Custom Sandbox Relic',
      slot: selectedSlot,
      rarity: 5,
      level: relicLevel,
      mainStat: { key: mainStatKey, value: mainStatValue },
      subStats: subStats.filter((s) => s.value > 0),
    });
  };

  return (
    <div style={{
      background: 'var(--color-surface)',
      padding: '1.5rem',
      borderRadius: '12px',
      border: '1px solid var(--color-border)',
      flex: 1,
    }}>
      <h3 style={{
        marginTop: 0, marginBottom: '1rem',
        fontFamily: 'Rajdhani, sans-serif', textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--color-text)',
      }}>
        Relic Modification Sandbox
      </h3>

      {/* Slot picker */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {RELIC_SLOTS.map((slot) => (
          <button
            key={slot}
            onClick={() => handleSlotChange(slot)}
            style={{
              padding: '0.5rem 0.75rem', borderRadius: '6px',
              border: `1px solid ${selectedSlot === slot ? 'var(--color-accent)' : 'var(--color-border)'}`,
              background: selectedSlot === slot ? 'rgba(79,195,247,0.15)' : 'var(--color-panel)',
              color: selectedSlot === slot ? 'var(--color-accent)' : 'var(--color-text)',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.8rem',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {RELIC_SLOT_LABELS[slot]}
          </button>
        ))}
      </div>

      {/* Main stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--color-muted)' }}>
            MAIN STAT
          </label>
          <select value={mainStatKey} onChange={(e) => handleMainStatChange(e.target.value as StatKey)} style={selectStyle}>
            {SLOT_MAIN_STATS[selectedSlot].map((stat) => (
              <option key={stat} value={stat}>{STAT_LABELS[stat]}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--color-muted)' }}>
            VALUE
          </label>
          <input
            type="number"
            step={mainStatKey.endsWith('Percent') || ['critRate','critDmg','breakEffect','dmgBonus','healBonus','effectHitRate','energyRegen'].includes(mainStatKey) ? '0.1' : '1'}
            value={mainStatValue}
            onChange={(e) => setMainStatValue(Number(e.target.value))}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Substats */}
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-muted)' }}>
        SUB STATS <span style={{ fontStyle: 'italic', fontWeight: 400, fontSize: '0.65rem' }}>(excludes main stat)</span>
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {subStats.map((sub, idx) => {
          const cleanOptions = SUBSTAT_KEYS.filter((k) => k !== mainStatKey);
          return (
            <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={cleanOptions.includes(sub.key) ? sub.key : cleanOptions[0]}
                onChange={(e) => {
                  const next = [...subStats];
                  next[idx].key = e.target.value as StatKey;
                  setSubStats(next);
                }}
                style={{ ...selectStyle, flex: 1 }}
              >
                {cleanOptions.map((k) => (
                  <option key={k} value={k}>{STAT_LABELS[k] || k}</option>
                ))}
              </select>
              <input
                type="number" min="0" step="0.1" value={sub.value}
                onChange={(e) => {
                  const next = [...subStats];
                  next[idx].value = Number(e.target.value);
                  setSubStats(next);
                }}
                style={{ ...inputStyle, width: '95px' }}
              />
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div style={{ marginTop: '1.5rem' }}>
        <button
          onClick={handleSave}
          style={{
            width: '100%', padding: '0.75rem', background: 'var(--color-accent)', color: '#000',
            border: 'none', borderRadius: '6px', fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 800, fontSize: '0.875rem', letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          Save Relic
        </button>
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem', background: 'var(--color-panel)',
  border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text)', outline: 'none',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem', background: 'var(--color-bg)',
  border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text)', outline: 'none',
};
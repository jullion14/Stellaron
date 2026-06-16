import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBuilderStore } from '@/store/builderStore';
import { 
  fetchRawRelics, 
  fetchRelicSubAffixes, 
  type RawRelic, 
  RawRelicSet, 
  RawRelicSubAffixGroup 
} from '@/api/staticData'; 
import { 
  calculateMainStatValue, 
  getRelicStatContribution, 
  getSubStatRollTiers,
  getMaxLinesAllowed,
  getMaxSingleSubstatRolls,
  getMaxTotalRollsAllowed,
  estimateRollCount
} from '@/utils/relicMath';
import type { RelicSlot, StatKey, Rarity } from '@/types';

const ASSET_URL = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master';

const RELIC_SLOTS: RelicSlot[] = ['Head', 'Hands', 'Body', 'Feet', 'PlanarSphere', 'LinkRope'];

const GRID_LABELS: Record<RelicSlot, string> = {
  Head: 'Head', Hands: 'Hands', Body: 'Chest',
  Feet: 'Boots', PlanarSphere: 'Orb', LinkRope: 'Rope',
};

const SLOT_TO_DB_TYPE: Record<RelicSlot, string> = {
  Head: 'HEAD', Hands: 'HAND', Body: 'BODY',
  Feet: 'FOOT', PlanarSphere: 'NECK', LinkRope: 'OBJECT'
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

interface RelicQueryData {
  rawRelicItems: Record<string, RawRelic>;
  setMapping: Record<string, RawRelicSet>;
  subAffixes: Record<string, RawRelicSubAffixGroup>;
}

export function RelicInput() {
  const activeBuild = useBuilderStore((state) => state.activeBuild);
  const setRelic = useBuilderStore((state) => state.setRelic);
  const removeRelic = useBuilderStore((state: any) => state.removeRelic || ((slot: RelicSlot) => setRelic(slot, null as any)));

  const [selectedSlot, setSelectedSlot] = useState<RelicSlot>('Head');
  const [mainStatKey, setMainStatKey] = useState<StatKey>('hp');
  const [relicLevel, setRelicLevel] = useState<number>(15);
  const [subStats, setSubStats] = useState<{ key: StatKey; value: number }[]>([
    { key: 'critRate', value: 0 }, { key: 'critDmg', value: 0 },
    { key: 'atkPercent', value: 0 }, { key: 'spd', value: 0 },
  ]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [targetSetId, setTargetSetId] = useState<string>('');
  const [targetSetName, setTargetSetName] = useState<string>('Custom Sandbox Relic');
  const [targetIcon, setTargetIcon] = useState<string>('');
  const [relicRarity, setRelicRarity] = useState<3 | 4 | 5>(5);

  const { data = { rawRelicItems: {}, setMapping: {}, subAffixes: {} } } = useQuery<RelicQueryData>({
    queryKey: ['raw-relics-sets-subaffixes'],
    queryFn: async (): Promise<RelicQueryData> => {
      const [relics, sets, subAffixesData] = await Promise.all([
        fetchRawRelics().catch(() => ({} as Record<string, RawRelic>)),
        import('@/api/staticData').then(m => m.fetchRawRelicSets ? m.fetchRawRelicSets() : {} as Record<string, RawRelicSet>).catch(() => ({} as Record<string, RawRelicSet>)),
        fetchRelicSubAffixes().catch(() => ({} as Record<string, RawRelicSubAffixGroup>))
      ]);
      return { rawRelicItems: relics, setMapping: sets, subAffixes: subAffixesData };
    },
    staleTime: 1000 * 60 * 30,
  });

  const { rawRelicItems, setMapping, subAffixes } = data;

  const uniqueSetsMap = useMemo(() => {
    const sets: Record<string, { id: string; name: string; isPlanar: boolean }> = {};
    const allPieces = Object.values(rawRelicItems);

    allPieces.forEach((piece) => {
      if (!piece.set_id) return;
      if (!sets[piece.set_id]) {
        const typeUpper = piece.type?.toUpperCase() || '';
        const isPlanar = typeUpper === 'OBJECT' || typeUpper === 'NECK' || typeUpper === 'BALL' || typeUpper.includes('PLANAR');
        let exactSetName = setMapping[piece.set_id]?.name;

        if (!exactSetName) {
          const setPieces = allPieces.filter(r => r.set_id === piece.set_id);
          let mainRelic = setPieces.find(r => r.type === 'HEAD' || r.type === 'NECK') || setPieces[0];
          
          if (mainRelic) {
            const parts = mainRelic.name.split(' ');
            exactSetName = parts.length > 2 ? parts.slice(0, -2).join(' ') : (parts.length > 1 ? parts.slice(0, -1).join(' ') : mainRelic.name);
          } else {
            exactSetName = 'Unknown Set';
          }
        }
        sets[piece.set_id] = { id: piece.set_id, name: exactSetName, isPlanar };
      }
    });
    return sets;
  }, [rawRelicItems, setMapping]);

  // Find this block in RelicInput.tsx and replace it:
  const modalSubAffixGroup = useMemo(() => {
  const dbType = SLOT_TO_DB_TYPE[selectedSlot];
  
  // FIX: Include rarity filtering so it fetches the exact tier selected by the user
  const matchingPiece = Object.values(rawRelicItems).find(
    (p) => 
      p.set_id === targetSetId && 
      p.type?.toUpperCase() === dbType && 
      p.rarity === relicRarity
  );

  // Robust fallback matrix if an exact rarity match for a custom set is missing
  const finalPiece = matchingPiece || Object.values(rawRelicItems).find(
    (p) => p.set_id === targetSetId && p.type?.toUpperCase() === dbType
  ) || Object.values(rawRelicItems).find((p) => p.rarity === relicRarity);

  if (!finalPiece || !finalPiece.sub_affix_id) return null;
  return subAffixes[finalPiece.sub_affix_id] || null;
}, [rawRelicItems, subAffixes, targetSetId, selectedSlot, relicRarity]);

  const maxLevelAllowed = useMemo(() => {
    if (relicRarity === 5) return 15;
    if (relicRarity === 4) return 12;
    return 9;
  }, [relicRarity]);

  const mainStatValue = useMemo(() => {
    return calculateMainStatValue(mainStatKey, relicLevel, relicRarity);
  }, [mainStatKey, relicLevel, relicRarity]);

  // ── CENTRALIZED MATHEMATICAL CONSTRAINTS ──
  const maxLinesAllowed = useMemo(() => getMaxLinesAllowed(relicRarity), [relicRarity]);

  // Pass both relicRarity and relicLevel here now:
  const maxSingleSubstatRolls = useMemo(() => {
    return getMaxSingleSubstatRolls(relicRarity, relicLevel);
  }, [relicRarity, relicLevel]);

  const maxTotalRollsAllowed = useMemo(() => {
    return getMaxTotalRollsAllowed(relicRarity, relicLevel);
  }, [relicRarity, relicLevel]);

  const validation = useMemo(() => {
    const errors: string[] = [];
    let currentTotalRolls = 0;
    let activeLinesCount = 0;
    const seenKeys = new Set<StatKey>();
    // Ensure a true game set is selected (Block sandbox/custom placeholders)
    if (!targetSetId || targetSetId === 'custom' || targetSetId === 'sandbox' || targetSetId === '') {
      errors.push("Invalid Relic Set: Please select a specific Relic Set before adding this piece to your inventory.");
    }
    subStats.slice(0, maxLinesAllowed).forEach((sub) => {
      // Treat 0, empty, or negative fields as unconfigured/inactive lines
      if (sub.value <= 0) return;
      
      const cleanOptions = SUBSTAT_KEYS.filter((k) => k !== mainStatKey);
      const targetKey = cleanOptions.includes(sub.key) ? sub.key : cleanOptions[0];

      // 1. Guard against duplicate fields (e.g., user selects 'CRIT Rate' on two rows)
      if (seenKeys.has(targetKey)) {
        errors.push(`Duplicate substat detected: ${STAT_LABELS[targetKey] || targetKey}. Each line must be a unique stat type.`);
      }
      seenKeys.add(targetKey);
      activeLinesCount++;

      const rollTiers = modalSubAffixGroup ? getSubStatRollTiers(modalSubAffixGroup, targetKey) : null;
      
      if (rollTiers) {
        const lineRolls = estimateRollCount(sub.value, rollTiers[1]);
        currentTotalRolls += lineRolls;

        if (lineRolls > maxSingleSubstatRolls) {
          errors.push(
            `${STAT_LABELS[targetKey] || targetKey} has ${lineRolls} rolls. Maximum allowed for a ${relicRarity}★ at +${relicLevel} is ${maxSingleSubstatRolls}.`
          );
        }
      }
    });

    // 2. Guard against incomplete configurations based on in-game unlocking behavior:
    // - 5★ starts with 3 or 4 lines (Absolute minimum baseline = 3)
    // - 4★ starts with 2 or 3 lines (Absolute minimum baseline = 2)
    // - 3★ starts with 1 or 2 lines (Absolute minimum baseline = 1)
    // At each level milestone (+3, +6, etc.), the base line count scales up until it hits the max cap of 4.
    const minLinesRequired = Math.min(4, (relicRarity - 2) + Math.floor(relicLevel / 3));
    
    if (activeLinesCount < minLinesRequired) {
      errors.push(
        `Incomplete configuration: A ${relicRarity}★ relic upgraded to +${relicLevel} must have at least ${minLinesRequired} active substat line(s). Please fill out the missing fields.`
      );
    }

    if (currentTotalRolls > maxTotalRollsAllowed) {
      errors.push(
        `Total rolls (${currentTotalRolls}) exceed the game logic ceiling of ${maxTotalRollsAllowed} for a ${relicRarity}★ piece at +${relicLevel}.`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      totalRolls: currentTotalRolls,
    };
  }, [subStats, maxLinesAllowed, maxSingleSubstatRolls, maxTotalRollsAllowed, modalSubAffixGroup, mainStatKey, relicLevel, relicRarity]);

  if (!activeBuild) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)' }}>
        Please select or import a character to begin configuration.
      </div>
    );
  }

  const equippedRelics = activeBuild.relics || {};

  const setCounts: Record<string, number> = {};
  Object.values(equippedRelics).forEach((relic: any) => {
    if (relic?.setId) setCounts[relic.setId] = (setCounts[relic.setId] || 0) + 1;
  });

  const hydrateEditingState = (slot: RelicSlot, existing?: any) => {
    setSelectedSlot(slot);
    if (existing) {
      setMainStatKey(existing.mainStat.key);
      setRelicLevel(existing.level ?? 15);
      setRelicRarity(existing.rarity ?? 5);
      setTargetSetId(existing.setId || 'CustomSet');
      setTargetSetName(existing.setName || 'Custom Sandbox Relic');
      setTargetIcon(existing.icon || '');
      
      const items = [...existing.subStats];
      while (items.length < 4) {
        const remaining = SUBSTAT_KEYS.find(k => k !== existing.mainStat.key && !items.some(i => i.key === k));
        items.push({ key: remaining || 'hp', value: 0 });
      }
      setSubStats(items.slice(0, 4));
    } else {
      const allowed = SLOT_MAIN_STATS[slot];
      setMainStatKey(allowed[0]);
      setRelicRarity(5);
      setRelicLevel(15);
      setTargetSetId('');
      setTargetSetName('');
      setTargetIcon('');
      setSubStats([
        { key: 'critRate', value: 0 }, { key: 'critDmg', value: 0 },
        { key: 'atkPercent', value: 0 }, { key: 'spd', value: 0 },
      ]);
    }
  };

  const handleSelectSetChange = (piece: RawRelic) => {
    const setName = uniqueSetsMap[piece.set_id]?.name || piece.name;
    setTargetSetId(piece.set_id);
    setTargetSetName(setName);
    setTargetIcon(piece.icon);
    // setRelicRarity(Math.max(3, (piece.rarity || 5)) as 3 | 4 | 5);
    // Defaults to 5* Rarity
    setRelicRarity(5);
  };

  const handleSave = () => {
    if (!validation.isValid) return;
    
    const cleanSavedSubs = subStats
      .slice(0, maxLinesAllowed)
      .filter((s) => s.value > 0);

    setRelic(selectedSlot, {
      id: `${selectedSlot}_${Date.now()}`,
      setId: targetSetId,
      setName: targetSetName,
      icon: targetIcon,
      slot: selectedSlot,
      rarity: relicRarity as Rarity,
      level: relicLevel,
      mainStat: { key: mainStatKey, value: mainStatValue },
      subStats: cleanSavedSubs,
    });
    setPickerOpen(false);
  };

  const handleClearSlot = (slot: RelicSlot) => {
    removeRelic(slot);
    if (selectedSlot === slot) {
      hydrateEditingState(slot, null);
    }
  };

  const getRarityThemeColor = (rarityNum: number) => {
    if (rarityNum === 5) return '#c8a84b'; 
    if (rarityNum === 4) return '#9b7ff5'; 
    return '#4b9cc8';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, width: '100%' }}>
      
      {/* ── VISUAL RELIC GRID ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem',
        background: 'var(--color-surface)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--color-border)'
      }}>
        {RELIC_SLOTS.map((slot) => {
          const relic = equippedRelics[slot];
          const isSelected = selectedSlot === slot && pickerOpen;

          return (
            <div
              key={slot}
              onClick={() => {
                hydrateEditingState(slot, relic);
                setPickerOpen(true);
              }}
              style={{
                border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: '8px',
                background: isSelected ? 'rgba(79,195,247,0.03)' : 'var(--color-panel)',
                minHeight: '110px',
                display: 'flex', flexDirection: 'column',
                cursor: 'pointer', position: 'relative', overflow: 'hidden',
                transition: 'all 0.15s ease'
              }}
            >
              {relic && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleClearSlot(slot); }}
                  style={{
                    position: 'absolute', top: '4px', right: '4px', zIndex: 10,
                    width: '18px', height: '18px', borderRadius: '50%',
                    border: '1px solid rgba(255, 77, 79, 0.4)', background: 'rgba(20, 10, 10, 0.85)',
                    color: '#ff4d4f', fontSize: '11px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', padding: 0, cursor: 'pointer', fontWeight: 'bold'
                  }}
                >
                  &times;
                </button>
              )}

              {relic?.icon && (
                <div style={{ position: 'absolute', inset: 0, opacity: 0.2, zIndex: 0, backgroundImage: `url(${ASSET_URL}/${relic.icon})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              )}

              <div style={{
                textAlign: 'center', padding: '0.375rem', fontSize: '0.75rem',
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                color: isSelected ? 'var(--color-accent)' : 'var(--color-muted)',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                position: 'relative', zIndex: 1
              }}>
                {GRID_LABELS[slot]}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', position: 'relative', zIndex: 1 }}>
                {!relic ? (
                  <span style={{ fontSize: '1.75rem', color: 'var(--color-border)', fontWeight: 300 }}>+</span>
                ) : (() => {
                  const contrib = getRelicStatContribution(relic);
                  const isPercent = (k: string) => !['hp', 'atk', 'def', 'spd'].includes(k);
                  const SHORT: Partial<Record<string, string>> = {
                    hp: 'HP', atk: 'ATK', def: 'DEF', spd: 'SPD', hpPercent: 'HP', atkPercent: 'ATK', 
                    defPercent: 'DEF', critRate: 'CRIT', critDmg: 'CD', breakEffect: 'BE', dmgBonus: 'DMG', 
                    healBonus: 'HB', effectHitRate: 'EHR', effectRes: 'RES', energyRegen: 'ERR',
                  };
                  return (
                    <div style={{ width: '100%' }}>
                      {relic.icon && <img src={`${ASSET_URL}/${relic.icon}`} alt="relic" style={{ width: '45px', height: '45px', margin: '0 auto', display: 'block' }} />}
                      <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        {(Object.entries(contrib) as [string, number][]).map(([k, v]) => {
                          const pct = isPercent(k);
                          return (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontFamily: 'Rajdhani, sans-serif', lineHeight: 1.2, color: k !== relic.mainStat.key ? 'var(--color-text)' : 'var(--color-accent)' }}>
                              <span style={{ fontWeight: k !== relic.mainStat.key ? 600 : 700 }}>{SHORT[k] ?? k}</span>
                              <span style={{ fontWeight: 700 }}>+{pct ? v.toFixed(1) : Math.floor(v)}{pct ? '%' : ''}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── ACTIVE SET BONUS LIST ── */}
      {Object.keys(setCounts).length > 0 && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.25rem' }}>
          <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)', margin: '0 0 0.875rem 0' }}>Active Set Bonus</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.entries(setCounts).map(([setId, count]) => {
              const matchedSet = uniqueSetsMap[setId];
              if (!matchedSet || setId === 'CustomSet') return null;

              return (
                <React.Fragment key={setId}>
                  {count >= 2 && (
                    <div style={{ background: 'var(--color-panel)', padding: '0.625rem 0.75rem', borderRadius: '6px', borderLeft: '3px solid var(--color-accent)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>[2-Piece] {matchedSet.name}</span>
                      {setMapping[setId]?.desc?.[0] && <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: setMapping[setId].desc[0] }} />}
                    </div>
                  )}
                  {count >= 4 && !matchedSet.isPlanar && (
                    <div style={{ background: 'var(--color-panel)', padding: '0.625rem 0.75rem', borderRadius: '6px', borderLeft: '3px solid #f5d78e', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 700, color: '#f5d78e' }}>[4-Piece] {matchedSet.name}</span>
                      {setMapping[setId]?.desc?.[1] && <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: setMapping[setId].desc[1] }} />}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MODAL WORKBENCH ── */}
      {pickerOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={() => setPickerOpen(false)}>
          <div style={{ background: 'var(--color-surface)', width: '100%', maxWidth: '850px', maxHeight: '85vh', borderRadius: '14px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-panel)' }}>
              <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--color-text)', fontSize: '1.1rem' }}>Configure {GRID_LABELS[selectedSlot]} Relic Box</span>
              <button onClick={() => setPickerOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: '1.25rem' }}>&times;</button>
            </div>

            {/* Content Splitter */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '580px' }}>
              
              {/* LEFT SIDEBAR: Artifact Catalog */}
              <div style={{ width: '40%', overflowY: 'auto', padding: '1.25rem 1.5rem', borderRight: '1px solid var(--color-border)' }}>
                {(() => {
                  const expectedDbType = SLOT_TO_DB_TYPE[selectedSlot];
                  const groupedSets: Record<string, { setName: string; firstIcon: string; pieces: RawRelic[] }> = {};
                  Object.values(rawRelicItems).forEach((piece) => {
                    if (piece.type?.toUpperCase() !== expectedDbType) return;
                    if (!groupedSets[piece.set_id]) {
                      groupedSets[piece.set_id] = { setName: setMapping[piece.set_id]?.name || uniqueSetsMap[piece.set_id]?.name || piece.name, firstIcon: piece.icon, pieces: [] };
                    }
                    groupedSets[piece.set_id].pieces.push(piece);
                  });

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {Object.entries(groupedSets).map(([setId, { setName, firstIcon, pieces }]) => {
                        const isSelected = targetSetId === setId;
                        return (
                          <button key={setId} onClick={() => handleSelectSetChange(pieces[0])} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', background: isSelected ? 'rgba(79,195,247,0.12)' : 'var(--color-panel)', border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', width: '100%', boxSizing: 'border-box' }}>
                            {firstIcon && <img src={`${ASSET_URL}/${firstIcon}`} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain', flexShrink: 0 }} />}
                            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.85rem', fontWeight: isSelected ? 700 : 600, color: isSelected ? 'var(--color-accent)' : 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{setName}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* RIGHT WORKBENCH: Modifiers */}
              <div style={{ width: '60%', overflowY: 'auto', padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '0.5rem 0.75rem', background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {targetIcon ? <img src={`${ASSET_URL}/${targetIcon}`} alt="" style={{ width: '28px', height: '28px', objectFit: 'contain' }} /> : <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 'bold' }}>S</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}><span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-muted)' }}>Selected Set</span><span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{targetSetName}</span></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--color-muted)' }}>MAIN STAT</label>
                    <select value={mainStatKey} onChange={(e) => setMainStatKey(e.target.value as StatKey)} style={selectStyle}>
                      {SLOT_MAIN_STATS[selectedSlot].map((stat) => <option key={stat} value={stat}>{STAT_LABELS[stat]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--color-muted)' }}>MAIN VALUE</label>
                    <div style={{ width: '100%', padding: '0.5rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-accent)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.95rem', boxSizing: 'border-box' }}>
                      {mainStatValue}{['hpPercent','atkPercent','defPercent','critRate','critDmg','breakEffect','dmgBonus','healBonus','effectHitRate','energyRegen'].includes(mainStatKey) ? '%' : ''}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, marginBottom: '0.375rem', color: 'var(--color-muted)' }}>RARITY TIER</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {([3, 4, 5] as const).map((r) => {
                      const isActive = relicRarity === r;
                      return (
                        <button key={r} type="button" onClick={() => { setRelicRarity(r); const maxL = r === 5 ? 15 : r === 4 ? 12 : 9; if (relicLevel > maxL) setRelicLevel(maxL); }} style={{ flex: 1, padding: '0.375rem', borderRadius: '6px', border: `1px solid ${isActive ? getRarityThemeColor(r) : 'var(--color-border)'}`, background: isActive ? `${getRarityThemeColor(r)}22` : 'var(--color-panel)', color: isActive ? getRarityThemeColor(r) : 'var(--color-muted)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>{'★'.repeat(r)}</button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-muted)' }}>RELIC UPGRADE LEVEL</label>
                    <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--color-accent)', fontSize: '0.875rem' }}>+{relicLevel}</span>
                  </div>
                  <input type="range" min={0} max={maxLevelAllowed} value={relicLevel} onChange={(e) => setRelicLevel(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--color-accent)', cursor: 'pointer', margin: 0 }} />       
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                    {[0, 3, 6, 9, 12, 15].filter(m => m <= maxLevelAllowed).map((mark) => <span key={mark} style={{ fontSize: '0.55rem', fontFamily: 'Rajdhani, sans-serif', color: relicLevel >= mark ? 'var(--color-accent)' : 'var(--color-border)' }}>+{mark}</span>)}
                  </div>
                </div>

                {/* SUBSTAT CONFIGURATION BENCH */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase' }}>
                      Substat Lines (4 Max)
                    </label>
                    <span style={{ 
                      fontFamily: 'Rajdhani, sans-serif', 
                      fontWeight: 700, 
                      fontSize: '0.75rem', 
                      color: validation.totalRolls > maxTotalRollsAllowed ? '#ff4d4f' : 'var(--color-accent)' 
                    }}>
                      Roll Count: {validation.totalRolls} / {maxTotalRollsAllowed} Max
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 0.5rem' }}>
                    {subStats.slice(0, maxLinesAllowed).map((sub, idx) => {
                      const cleanOptions = SUBSTAT_KEYS.filter((k) => k !== mainStatKey);
                      const selectedKey = cleanOptions.includes(sub.key) ? sub.key : cleanOptions[0];
                      const rollTiers = modalSubAffixGroup ? getSubStatRollTiers(modalSubAffixGroup, selectedKey) : null;
                      const isPercent = !['hp', 'atk', 'def', 'spd'].includes(selectedKey);
                      const lineRolls = rollTiers && sub.value > 0 ? estimateRollCount(sub.value, rollTiers[1]) : 0;

                      return (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                            <select
                              value={selectedKey}
                              onChange={(e) => { 
                                const next = [...subStats]; 
                                next[idx].key = e.target.value as StatKey; 
                                next[idx].value = 0; // <-- RESET VALUE TO 0 ON TYPE SWAP
                                setSubStats(next); 
                              }}
                              style={{ ...selectStyle, padding: '0.375rem', fontSize: '0.725rem' }}
                            >
                              {cleanOptions.map((k) => (
                                <option key={k} value={k}>
                                  {STAT_LABELS[k] || k}
                                </option>
                              ))}
                            </select>                           
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <input
                                type="number" min="0" step="0.1" value={sub.value || ''} placeholder="0.0"
                                onChange={(e) => { const next = [...subStats]; next[idx].value = Number(e.target.value); setSubStats(next); }}
                                style={{ ...inputStyle, width: '70px', padding: '0.375rem', paddingRight: lineRolls > 0 ? '24px' : '0.375rem', fontSize: '0.725rem', textAlign: 'right', fontWeight: 'bold', fontFamily: 'Rajdhani, sans-serif' }}
                              />
                              {lineRolls > 0 && (
                                <span style={{
                                  position: 'absolute', right: '6px', fontSize: '0.6rem', fontWeight: 700,
                                  color: lineRolls > maxSingleSubstatRolls ? '#ff4d4f' : 'var(--color-muted)',
                                  fontFamily: 'Rajdhani, sans-serif'
                                }} title={`${lineRolls} estimated upgrades`}>
                                  {lineRolls}r
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Incremental Injection Pills */}
                          {rollTiers && (
                            <div style={{ display: 'flex', gap: '3px', padding: '0 1px' }}>
                              {rollTiers.map((tierVal, tIdx) => (
                                <button
                                  key={tIdx} type="button"
                                  title={`Stack direct baseline roll increment (+${tierVal.toFixed(1)})`}
                                  onClick={() => {
                                    const next = [...subStats];
                                    const currentVal = next[idx].key === selectedKey ? next[idx].value : 0;
                                    next[idx].value = Math.round((currentVal + tierVal) * 100) / 100;
                                    setSubStats(next);
                                  }}
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '999px',
                                    padding: '1px 4px',
                                    fontSize: '0.58rem',
                                    color: 'var(--color-accent)',
                                    fontFamily: 'Rajdhani, sans-serif',
                                    cursor: 'pointer',
                                    flex: 1,
                                    textAlign: 'center',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-accent)';
                                    e.currentTarget.style.backgroundColor = 'rgba(79, 195, 247, 0.15)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                                  }}
                                >
                                  +{tierVal.toFixed(1)}{isPercent ? '%' : ''}
                                </button>
                              ))}
                              <button
                                type="button" title="Wipe row value back to zero"
                                onClick={() => { const next = [...subStats]; next[idx].value = 0; setSubStats(next); }}
                                style={{ background: 'rgba(255,77,79,0.05)', border: 'none', borderRadius: '4px', width: '18px', fontSize: '0.58rem', color: '#ff4d4f', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                &times;
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ERROR FEEDBACK BAR */}
                {!validation.isValid && (
                  <div style={{
                    background: 'rgba(255, 77, 79, 0.08)', border: '1px solid #ff4d4f', borderRadius: '6px',
                    padding: '0.625rem 0.85rem', fontSize: '0.725rem', color: '#ff4d4f',
                    display: 'flex', flexDirection: 'column', gap: '0.25rem'
                  }}>
                    {validation.errors.map((error, idx) => (
                      <div key={idx} style={{ lineHeight: 1.35 }}>• {error}</div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                  {equippedRelics[selectedSlot] && (
                    <button type="button" onClick={() => { handleClearSlot(selectedSlot); setPickerOpen(false); }} style={{ padding: '0.625rem 1rem', background: 'rgba(255,77,79,0.06)', border: '1px solid #ff4d4f', borderRadius: '6px', color: '#ff4d4f', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>DUMP PIECE</button>
                  )}
                  <button 
                    type="button" 
                    onClick={handleSave} 
                    disabled={!validation.isValid}
                    style={{ 
                      flex: 1, padding: '0.625rem', background: 'var(--color-accent)', color: '#000', border: 'none', borderRadius: '6px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.04em', textTransform: 'uppercase',
                      cursor: validation.isValid ? 'pointer' : 'not-allowed',
                      opacity: validation.isValid ? 1 : 0.45,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Save Configuration to {GRID_LABELS[selectedSlot]}
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem', background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text)', outline: 'none',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text)', outline: 'none',
};
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  fetchRawCharacters,
  fetchCharacterPromotions,
  fetchCharacterSkills,
  fetchCharacterRanks,
  fetchCharacterSkillTrees,
} from '@/api/staticData';
import { mapCharacter, mapSkill, mapEidolon } from '@/api/characterMapper';
import { ascensionForLevel, calcStat } from '@/utils/levelUtils';
import { ELEMENT_COLORS, PATH_LABELS, PATH_COLORS } from '@/utils/constants';
import type { Skill, Eidolon } from '@/types';
import { parseSkillDesc } from '@/utils/skillUtils';

// Level caps per ascension tier
const ASC_CAPS = [20, 20, 30, 40, 50, 60, 70, 80];

// Property name → display name lookup table
// Used to convert raw property keys (e.g., 'FireAddedRatio') into readable labels (e.g., 'Fire DMG Bonus')
// Applied to Minor Traces and any other dynamic property displays
const PROPERTY_LABELS: Record<string, string> = {
  BaseHP: 'HP',
  HPAddedRatio: 'HP %',

  BaseAttack: 'ATK',
  AttackAddedRatio: 'ATK %',

  BaseDefence: 'DEF',
  DefenceAddedRatio: 'DEF %',

  SpeedDelta: 'SPD',

  CriticalChanceBase: 'CRIT Rate',
  CriticalDamageBase: 'CRIT DMG',

  StatusProbabilityBase: 'Effect Hit Rate',
  StatusResistanceBase: 'Effect RES',

  BreakDamageAddedRatioBase: 'Break Effect',

  HealRatioBase: 'Outgoing Healing',

  SPRatioBase: 'Energy Regeneration Rate',

  FireAddedRatio: 'Fire DMG Bonus',
  IceAddedRatio: 'Ice DMG Bonus',
  LightningAddedRatio: 'Lightning DMG Bonus',
  WindAddedRatio: 'Wind DMG Bonus',
  QuantumAddedRatio: 'Quantum DMG Bonus',
  ImaginaryAddedRatio: 'Imaginary DMG Bonus',
  PhysicalAddedRatio: 'Physical DMG Bonus',

  ElationDamageAddedRatioBase: 'Elation',
};

const SKILL_COLORS: Record<string, string> = {
  ...ELEMENT_COLORS,
  'ElationDamage': '#ff6b8b', // Custom aesthetic palette color matching an Elation/Joy theme
  'Elation': '#ff6b8b',
};

export default function CharacterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [level, setLevel] = useState(80);
  const [activeTab, setActiveTab] = useState<'stats' | 'skills' | 'eidolons'>('skills');
  const [skillLevels, setSkillLevels] = useState<Record<string, number>>({});
  
  const getSkillLevel = (skill: Skill) => skillLevels[skill.id] ?? getSkillMaxLevel(skill);

  const getSkillMaxLevel = (skill: Skill): number => {
    // 1. Baseline parameter array length check
    const totalLevels = skill.params?.length ?? 0;
    if (totalLevels <= 1) return 1;

    // 2. Multiplier Progression Heuristic Check
    const firstLevelParams = skill.params[0] || [];
    const maxLevelParams = skill.params[totalLevels - 1] || [];

    const isStaticHeuristic =
      firstLevelParams.length === maxLevelParams.length &&
      firstLevelParams.every((val, index) => val === maxLevelParams[index]);

    // Force max level to 1 if multipliers do not scale across level rows
    if (isStaticHeuristic) {
      return 1;
    }

    // 3. Category Fallback Caps
    const typeTextLower = skill.typeText?.toLowerCase() || '';
    const typeLower = (skill as any).type?.toLowerCase() || '';

    if (typeTextLower.includes('elation') || typeLower.includes('elation')) {
      return Math.min(skill.maxLevel, 15);
    }
    if (typeTextLower.includes('memosprite') || typeLower.includes('memosprite')) {
      return Math.min(skill.maxLevel, 10);
    }

    return skill.maxLevel;
  };

  // Fetch all needed data in parallel
  const { data, isLoading, error } = useQuery({
    queryKey: ['character-detail', id],
    queryFn: async () => {
      const [chars, promotions, skills, ranks, skillTrees] = await Promise.all([
        fetchRawCharacters(),
        fetchCharacterPromotions(),
        fetchCharacterSkills(),
        fetchCharacterRanks(),
        fetchCharacterSkillTrees(),
      ]);
      
      const rawChar = chars[id!];
      if (!rawChar) throw new Error('Character not found');

      const character = mapCharacter(rawChar);
      const promotion = promotions[id!];
      const charSkills: Skill[] = rawChar.skills
        .map((sid) => skills[sid])
        .filter(Boolean)
        .map(mapSkill);
      
      const uniqueSkillsMap = new Map<string, Skill>();
      const traceNodes = rawChar.skill_trees
        ?.map((id: string) => skillTrees[id])
        .filter(Boolean) ?? [];
      
      const charEidolons: Eidolon[] = rawChar.ranks
        .map((rid) => ranks[rid])
        .filter(Boolean)
        .map(mapEidolon);

      charSkills.forEach((skill) => {
        const typeText = skill.typeText || '';
        const lowerTypeText = typeText.toLowerCase();
        const lowerType = (skill as any).type?.toLowerCase() || '';
        
        if (
          ['basic atk', 'skill', 'ultimate', 'talent', 'technique'].includes(lowerTypeText) ||
          lowerTypeText.includes('memosprite') ||
          lowerTypeText.includes('heir') ||
          lowerTypeText.includes('elation') ||
          lowerType.includes('elation')
        ) {
          // Normalize special variant types to cleanly flatten sub-variants by name
          const isSpecialVariant = 
            lowerTypeText.includes('memosprite') || 
            lowerTypeText.includes('heir') || 
            lowerTypeText.includes('elation') ||
            lowerType.includes('elation');

          const uniqueKey = isSpecialVariant ? skill.name : `${skill.name}_${typeText}`;
          
          if (uniqueSkillsMap.has(uniqueKey)) {
            const existingSkill = uniqueSkillsMap.get(uniqueKey)!;
            // Retain the version that contains structural string text data 
            if (!existingSkill.desc && skill.desc) {
              uniqueSkillsMap.set(uniqueKey, skill);
            }
          } else {
            uniqueSkillsMap.set(uniqueKey, skill);
          }
        }
      });

      const combatSkills = Array.from(uniqueSkillsMap.values());
      // Cleanly separate core and memosprite skill layouts
      // 1. Separate standard skills (exclude Memosprite and Elation)
      const coreSkills = combatSkills.filter(s => 
        !s.typeText?.toLowerCase().includes('memosprite') && 
        !s.typeText?.toLowerCase().includes('elation') &&
        !((s as any).type?.toLowerCase() || '').includes('elation')
      );
      
      // 2. Separate Memosprite skills
      const memospriteSkills = combatSkills.filter(s => 
        s.typeText?.toLowerCase().includes('memosprite')
      );
      
      // 3. Separate Elation skills
      const elationSkills = combatSkills.filter(s => 
        s.typeText?.toLowerCase().includes('elation') || 
        ((s as any).type?.toLowerCase() || '').includes('elation')
      );
      const majorTraces = Array.from(
        new Map(
          traceNodes
            .filter((trace: any) =>
              ['Point06', 'Point07', 'Point08'].includes(trace.anchor)
            )
            .map((trace: any) => {
              // Safe-extract parameter array across all common aggregate formats
              let traceParams: number[] = [];
              if (Array.isArray(trace.params)) {
                traceParams = Array.isArray(trace.params[0]) ? trace.params[0] : trace.params;
              } else if (trace.levels) {
                const levelData = trace.levels[0] || trace.levels['1'] || Object.values(trace.levels)[0];
                if (levelData && Array.isArray(levelData.params)) {
                  traceParams = levelData.params;
                }
              }

              // Format description using our smart heuristic parser
              const formattedDesc = parseSkillDesc(trace.desc ?? '', traceParams);

              // Spread all original properties to preserve icons/IDs perfectly
              return [
                trace.anchor,
                {
                  ...trace,
                  desc: formattedDesc,
                },
              ];
            })
        ).values()
      );

      const minorTraceMap = new Map();

      traceNodes.forEach((trace: any) => {
        const pointNum = Number(trace.anchor?.replace('Point', ''));

        if (
          pointNum >= 9 &&
          trace.levels?.[0]?.properties?.length
        ) {
          const prop = trace.levels[0].properties[0];

          if (!prop) return;

          const existing = minorTraceMap.get(prop.type);

          if (existing) {
            existing.value += prop.value;
          } else {
            minorTraceMap.set(prop.type, {
              type: prop.type,
              value: prop.value,
            });
          }
        }
      });

      const minorTraces = Array.from(minorTraceMap.values());

      return { character, promotion, coreSkills, memospriteSkills, elationSkills, eidolons: charEidolons, majorTraces, minorTraces };
    },
    staleTime: 1000 * 60 * 10,
    enabled: !!id,
  });

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '2rem', height: '2rem', border: '2px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Loading character…</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '1rem' }}>
      <div style={{ background: '#1a0a0a', border: '1px solid var(--color-red)', borderRadius: '8px', padding: '1rem', color: 'var(--color-red)', fontSize: '0.875rem' }}>
        Failed to load character. <button onClick={() => navigate('/characters')} style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>← Back</button>
      </div>
    </div>
  );

  const { character, promotion, coreSkills, memospriteSkills, elationSkills, eidolons, majorTraces, minorTraces } = data;
  const elementColor = ELEMENT_COLORS[character.element];
  const pathColor    = PATH_COLORS[character.path];
  const asc          = ascensionForLevel(level);
  const promo        = promotion.values[asc];

  // Base stats displayed in the hero section stat grid
  // Calculated from promotion data at the current character level
  // Shows the 6 core stats: HP, ATK, DEF, SPD, CRIT Rate, CRIT DMG
  const stats = promo ? [
    { label: 'HP',        value: calcStat(promo.hp.base,        promo.hp.step,        level) },
    { label: 'ATK',       value: calcStat(promo.atk.base,       promo.atk.step,       level) },
    { label: 'DEF',       value: calcStat(promo.def.base,       promo.def.step,       level) },
    { label: 'SPD',       value: promo.spd.base },
    { label: 'CRIT Rate', value: `${(promo.crit_rate.base * 100).toFixed(1)}%` },
    { label: 'CRIT DMG',  value: `${(promo.crit_dmg.base  * 100).toFixed(1)}%` },
  ] : [];
  
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* Back */}
      <button
        onClick={() => navigate('/characters')}
        style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
      >
        ← Back to Characters
      </button>

      {/* Hero section */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', marginBottom: '2rem' }}>

        {/* Portrait */}
        <div style={{ position: 'relative', background: `linear-gradient(160deg, var(--color-surface), var(--color-panel))`, border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', aspectRatio: '3/4' }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top, ${elementColor}22, transparent 70%)` }} />
          <img
            src={character.portraitUrl}
            alt={character.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
          />
          {/* Rarity bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: character.rarity === 5 ? 'linear-gradient(90deg, #c8a84b, #f5d78e, #c8a84b)' : 'linear-gradient(90deg, #9b7ff5, #c4b0ff)' }} />
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Name + badges */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.2em', color: elementColor, textTransform: 'uppercase' }}>{character.element}</span>
              <span style={{ width: '1px', height: '12px', background: 'var(--color-border)' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 600, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.2em', color: pathColor, textTransform: 'uppercase' }}>{PATH_LABELS[character.path]}</span>
              <span style={{ width: '1px', height: '12px', background: 'var(--color-border)' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 600, fontFamily: 'Rajdhani, sans-serif', color: character.rarity === 5 ? '#c8a84b' : '#9b7ff5' }}>{character.rarity}★</span>
            </div>
            <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '0.04em', lineHeight: 1 }}>
              {character.name}
            </h1>
          </div>

          {/* Level slider */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>Level</span>
              <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-accent)' }}>{level}</span>
            </div>
            <input
              type="range"
              min={1}
              max={80}
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--color-accent)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
              {ASC_CAPS.map((cap, i) => (
                <span key={i} style={{ fontSize: '0.6rem', color: ascensionForLevel(level) >= i ? 'var(--color-accent)' : 'var(--color-border)', fontFamily: 'Rajdhani, sans-serif' }}>
                  {cap}
                </span>
              ))}
            </div>
          </div>

          {/* Stat grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {stats.map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.75rem' }}>
                <p style={{ fontSize: '0.65rem', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: '0.25rem' }}>{label}</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: 'var(--color-text)' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
        {(['skills', 'eidolons'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.625rem 1.25rem',
              fontFamily: 'Rajdhani, sans-serif', fontSize: '0.875rem', fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-muted)',
              borderBottom: `2px solid ${activeTab === tab ? 'var(--color-accent)' : 'transparent'}`,
              marginBottom: '-1px',
              transition: 'color 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Skills tab */}
      {activeTab === 'skills' && (
        <>
          {/* Section 1: Standard Core Combat Skills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {coreSkills.map((skill) => {
              const maxLevelSafe = getSkillMaxLevel(skill); // ← Enforce dynamic caps/uniform steps here
              return (
                <SkillCard
                  key={skill.id}
                  elementColor={elementColor}
                  skill={{
                    ...skill,
                    maxLevel: maxLevelSafe
                  }}
                  skillLevel={Math.min(getSkillLevel(skill), maxLevelSafe)}
                  onLevelChange={(id, level) => setSkillLevels((prev) => ({ ...prev, [id]: level }))}
                />
              );
            })}
          </div>

          {/* Section 2: Memosprite Skills Separation breakout */}
          {memospriteSkills.length > 0 && (
            <div style={{ marginTop: '3rem' }}>
              <h2 style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.08em', fontSize: '1.25rem', marginBottom: '1rem', textTransform: 'uppercase', color: 'var(--color-accent)' }}>
                Memosprite Skills
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {memospriteSkills.map((skill) => {
                  const maxLevelSafe = getSkillMaxLevel(skill);
                  return (
                    <SkillCard
                      key={skill.id}
                      elementColor={elementColor}
                      skill={{
                        ...skill,
                        maxLevel: maxLevelSafe
                      }}
                      skillLevel={Math.min(getSkillLevel(skill), maxLevelSafe)}
                      onLevelChange={(id, level) => setSkillLevels((prev) => ({ ...prev, [id]: level }))}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Elation Skills Separation breakout */}
          {elationSkills.length > 0 && (
            <div style={{ marginTop: '3rem' }}>
              <h2 style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.08em', fontSize: '1.25rem', marginBottom: '1rem', textTransform: 'uppercase', color: 'var(--color-accent)' }}>
                Elation Skills
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {elationSkills.map((skill) => {
                  const maxLevelSafe = getSkillMaxLevel(skill);
                  const rawType = (skill as any).type || '';
                  const cardColor = SKILL_COLORS[rawType] || SKILL_COLORS[skill.typeText || ''] || elementColor;
                  
                  return (
                    <SkillCard
                      key={skill.id}
                      elementColor={cardColor}
                      skill={{
                        ...skill,
                        maxLevel: maxLevelSafe
                      }}
                      skillLevel={Math.min(getSkillLevel(skill), maxLevelSafe)}
                      onLevelChange={(id, level) => setSkillLevels((prev) => ({ ...prev, [id]: level }))}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Major Traces */}
          <div style={{ marginTop: '3rem' }}>
            <h2
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                letterSpacing: '0.08em',
                fontSize: '1.25rem',
                marginBottom: '1rem',
                textTransform: 'uppercase',
              }}
            >
              Major Traces
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
              }}
            >
              {majorTraces.map((trace: any) => (
                <div
                  key={trace.id}
                  style={{
                    background: 'var(--color-panel)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    padding: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <img
                      src={`https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/${trace.icon}`}
                      alt={trace.name}
                      style={{
                        width: '40px',
                        height: '40px',
                      }}
                    />

                    <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--color-text)' }}>
                      {trace.name}
                    </div>
                  </div>

                  <div
                    style={{
                      color: '#d1d5db',
                      lineHeight: 1.6,
                      fontSize: '0.95rem',
                    }}>
                     <div dangerouslySetInnerHTML={{ __html: trace.desc.replace(/(\d+\.?\d*%?)/g, `<span style="color:${elementColor};font-weight:600">$1</span>`) }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Minor Traces */}
          <div style={{ marginTop: '3rem' }}>
            <h2
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                letterSpacing: '0.08em',
                fontSize: '1.25rem',
                marginBottom: '1rem',
                textTransform: 'uppercase',
              }}
            >
              Minor Traces
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {minorTraces.map((stat: any) => (
                <div
                  key={stat.type}
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px',
                    padding: '0.85rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--color-muted)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {PROPERTY_LABELS[stat.type] ?? stat.type}
                  </div>

                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: elementColor,
                    }}
                  >
                    {stat.value < 1
                      ? `+${(stat.value * 100).toFixed(1)}%`
                      : `+${stat.value}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {/* Eidolons tab */}
      {activeTab === 'eidolons' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {eidolons.map((e) => (
            <div key={e.id} style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1.25rem', display: 'flex', gap: '1rem' }}>
              <div style={{ flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%', background: `${pathColor}22`, border: `1px solid ${pathColor}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: pathColor, fontSize: '1rem' }}>
                E{e.rank}
              </div>
              <div>
                <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.375rem' }}>{e.name}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>{e.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function SkillCard({ skill, elementColor, skillLevel, onLevelChange }: {
  skill: Skill;
  elementColor: string;
  skillLevel: number;
  onLevelChange: (id: string, level: number) => void;
}) {
  const params = skill.params[skillLevel - 1] ?? skill.params[0] ?? [];
  const parsedDesc = parseSkillDesc(skill.desc, params);

  // --- ADD THIS ASSET FALLBACK CHECK ---
  const typeTextLower = skill.typeText?.toLowerCase() || '';
  const typeLower = (skill as any).type?.toLowerCase() || '';
  const isElation = typeTextLower.includes('elation') || typeLower.includes('elation');

  // If it's an elation skill, point to the official repository path icon asset
  const resolvedIconUrl = isElation 
    ? "https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/path/Joy.png" // The game engine labels Elation internally as 'Joy'
    : skill.iconUrl;

  return (
    <div style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>

      {/* Header row */}
      <div style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <img
          src={resolvedIconUrl} // ← Use your new checked URL variable here
          alt={skill.name}
          style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--color-surface)', flexShrink: 0 }}
          onError={(e) => { 
            // Secondary safety guardrail if the asset branch path is updated
            (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/path/Joy.png'; 
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>{skill.name}</span>
            <span style={{ fontSize: '0.78rem', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.1em', padding: '0.2rem 0.65rem', borderRadius: '4px', background: `${elementColor}22`, color: elementColor, border: `1px solid ${elementColor}44` }}>
              {skill.typeText}</span>
            <span style={{ fontSize: '0.78rem', letterSpacing:"0.05em", background: 'rgba(255, 255, 255, 0.06)', border:'1px solid var(--color-border)', color: 'var(--color-text)', fontFamily: 'Rajdhani, sans-serif' }}>
              {skill.effectText}
            </span>
          </div>

          <p
            style={{ fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: 1.7, marginBottom: '1rem' }}
            dangerouslySetInnerHTML={{ __html: parsedDesc.replace(/(\d+\.?\d*%)/g, `<span style="color:${elementColor};font-weight:600">$1</span>`) }}
          />

          {skill.maxLevel > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                Lv. <span style={{ color: 'var(--color-accent)', fontSize: '0.875rem', fontWeight: 700 }}>{skillLevel}</span>
              </span>
              <input
                type="range"
                min={1}
                max={skill.maxLevel}
                value={skillLevel}
                onChange={(e) => onLevelChange(skill.id, Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--color-accent)', cursor: 'pointer' }}
              />
              <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.7rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                / {skill.maxLevel}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
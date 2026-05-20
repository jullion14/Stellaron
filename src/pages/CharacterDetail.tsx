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
};
export default function CharacterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [level, setLevel] = useState(80);
  const [activeTab, setActiveTab] = useState<'stats' | 'skills' | 'eidolons'>('skills');
  const [skillLevels, setSkillLevels] = useState<Record<string, number>>({});
  const getSkillLevel = (skill: Skill) => skillLevels[skill.id] ?? skill.maxLevel;

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
        if (['Basic ATK', 'Skill', 'Ultimate', 'Talent', 'Technique'].includes(skill.typeText)) {
          uniqueSkillsMap.set(skill.id, skill);
        }
      });

      const combatSkills = Array.from(uniqueSkillsMap.values());

      const majorTraces = Array.from(
        new Map(
          traceNodes
            .filter((trace: any) =>
              ['Point06', 'Point07', 'Point08'].includes(trace.anchor)
            )
            .map((trace: any) => [trace.anchor, trace])
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

      return { character, promotion, skills: combatSkills, eidolons: charEidolons, majorTraces, minorTraces };
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

  const { character, promotion, skills, eidolons, majorTraces, minorTraces } = data;
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
              <span style={{ fontSize: '0.7rem', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.2em', color: elementColor, textTransform: 'uppercase' }}>{character.element}</span>
              <span style={{ width: '1px', height: '12px', background: 'var(--color-border)' }} />
              <span style={{ fontSize: '0.7rem', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.2em', color: pathColor, textTransform: 'uppercase' }}>{PATH_LABELS[character.path]}</span>
              <span style={{ width: '1px', height: '12px', background: 'var(--color-border)' }} />
              <span style={{ fontSize: '0.7rem', fontFamily: 'Rajdhani, sans-serif', color: character.rarity === 5 ? '#c8a84b' : '#9b7ff5' }}>{character.rarity}★</span>
            </div>
            <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '0.04em', lineHeight: 1 }}>
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
          <h2
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              letterSpacing: '0.08em',
              fontSize: '1.25rem',
              marginBottom: '1rem',
              textTransform: 'uppercase',
            }}
          >
            Skills
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {skills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                elementColor={elementColor}
                skillLevel={getSkillLevel(skill)}
                onLevelChange={(id, level) => setSkillLevels((prev) => ({ ...prev, [id]: level }))}
              />
            ))}
          </div>

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

                    <div style={{ fontWeight: 600 }}>
                      {trace.name}
                    </div>
                  </div>

                  <div
                    style={{
                      color: 'var(--color-muted)',
                      lineHeight: 1.5,
                      fontSize: '0.9rem',
                    }}
                  >
                    {trace.desc}
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
  const [expanded, setExpanded] = useState(false);
  const params = skill.params[skillLevel - 1] ?? skill.params[0] ?? [];
  const parsedDesc = parseSkillDesc(skill.desc, params);

  return (
    <div style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>

      {/* Header row */}
      <div style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <img
          src={skill.iconUrl}
          alt={skill.name}
          style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--color-surface)', flexShrink: 0 }}
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>{skill.name}</span>
            <span style={{ fontSize: '0.65rem', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.1em', padding: '0.1rem 0.5rem', borderRadius: '4px', background: `${elementColor}22`, color: elementColor, border: `1px solid ${elementColor}44` }}>{skill.typeText}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)', fontFamily: 'Rajdhani, sans-serif' }}>{skill.effectText}</span>
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

      {skill.maxLevel > 1 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{ width: '100%', padding: '0.5rem', background: 'var(--color-surface)', border: 'none', borderTop: '1px solid var(--color-border)', color: 'var(--color-muted)', fontSize: '0.75rem', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
        >
          {expanded ? '▲ Hide Table' : '▼ Show All Levels'}
        </button>
      )}

      {expanded && (
        <div style={{ overflowX: 'auto', borderTop: '1px solid var(--color-border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface)' }}>
                <th style={{ padding: '0.5rem 1rem', textAlign: 'left', color: 'var(--color-muted)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.1em', fontWeight: 600 }}>LV</th>
                {params.map((_, i) => (
                  <th key={i} style={{ padding: '0.5rem 1rem', textAlign: 'right', color: 'var(--color-muted)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.1em', fontWeight: 600 }}>
                    {`Value ${i + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skill.params.map((levelParams, lvlIndex) => {
                const isActive = lvlIndex + 1 === skillLevel;
                return (
                  <tr
                    key={lvlIndex}
                    style={{ background: isActive ? `${elementColor}11` : 'transparent', borderTop: '1px solid var(--color-border)' }}
                  >
                    <td style={{ padding: '0.4rem 1rem', fontFamily: 'Rajdhani, sans-serif', fontWeight: isActive ? 700 : 400, color: isActive ? 'var(--color-accent)' : 'var(--color-muted)' }}>
                      {lvlIndex + 1}
                    </td>
                    {levelParams.map((val, i) => (
                      <td key={i} style={{ padding: '0.4rem 1rem', textAlign: 'right', fontFamily: 'Rajdhani, sans-serif', color: isActive ? elementColor : 'var(--color-text)', fontWeight: isActive ? 700 : 400 }}>
                        {val < 10 ? `${Math.round(val * 100)}%` : val}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { 
  fetchRawLightCones, 
  fetchLightConePromotions, 
  fetchLightConeRanks,
  calcStat 
} from '@/api/staticData';
import { PATH_COLORS, PATH_LABELS, ASC_CAPS } from '@/utils/constants';
import { parseSkillDesc } from '@/utils/skillUtils';
import type { Path } from '@/types';

export default function LightConeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [level, setLevel] = useState<number>(80);
  const [superimposition, setSuperimposition] = useState<number>(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['light-cone-detail', id],
    queryFn: async () => {
      const [lcs, promotions, ranks] = await Promise.all([
        fetchRawLightCones(),
        fetchLightConePromotions(),
        fetchLightConeRanks(),
      ]);

      const rawLC = lcs[id!];
      if (!rawLC) throw new Error('Light Cone asset not found');

      const internalPathMap: Record<string, Path> = {
        'Rogue': 'TheHunt', 'Mage': 'Erudition', 'Warlock': 'Nihility', 
        'Priest': 'Abundance', 'Warrior': 'Destruction', 'Shaman': 'Harmony', 
        'Knight': 'Preservation', 'Memory': 'Remembrance', 'Joy': 'Elation'
      };

      const normalizedLC = {
        ...rawLC,
        path: internalPathMap[rawLC.path] || (rawLC.path as Path),
        portraitUrl: `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/${rawLC.portrait}`,
      };

      const promo = promotions[id!];
      const matchedRanks = Object.values(ranks)
        .filter((r) => r.id.toString().startsWith(id!))
        .sort((a, b) => a.rank - b.rank);

      return {
        lightCone: normalizedLC,
        promotion: promo,
        ranks: matchedRanks,
      };
    },
    enabled: !!id,
  });

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div style={{ width: '2rem', height: '2rem', border: '2px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (error || !data) return (
    <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '1.5rem', background: '#1a0a0a', border: '1px solid var(--color-red)', borderRadius: '8px', color: 'var(--color-red)' }}>
      Light Cone data lookup error. <button onClick={() => navigate('/light-cones')} style={{ textDecoration: 'underline', marginLeft: '0.5rem' }}>Return to index</button>
    </div>
  );

  const { lightCone, promotion, ranks } = data;
  const pathColor = PATH_COLORS[lightCone.path as Path] || 'var(--color-muted)';
  const pathLabel = PATH_LABELS[lightCone.path as Path] || lightCone.path;

  const getAscension = (lvl: number) => {
    if (lvl <= 20) return 0;
    if (lvl <= 30) return 1;
    if (lvl <= 40) return 2;
    if (lvl <= 50) return 3;
    if (lvl <= 60) return 4;
    if (lvl <= 70) return 5;
    return 6;
  };

  const currentPromoValues = promotion?.values[getAscension(level)];
  
  const calculatedStats = currentPromoValues ? [
    { label: 'HP',  value: calcStat(currentPromoValues.hp.base,  currentPromoValues.hp.step,  level) },
    { label: 'ATK', value: calcStat(currentPromoValues.atk.base, currentPromoValues.atk.step, level) },
    { label: 'DEF', value: calcStat(currentPromoValues.def.base, currentPromoValues.def.step, level) },
  ] : [];

  const activeRankNode = ranks[superimposition - 1] || ranks[0];
  const parsedPassiveDesc = activeRankNode 
    ? parseSkillDesc(activeRankNode.desc, activeRankNode.params[superimposition - 1] ?? [])
    : '';

  return (
    // 1. CENTERED WRAPPER (Matches Characters.tsx alignment)
    <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '2rem 2rem' }}>
      
      <button
        onClick={() => navigate('/light-cones')}
        style={{ color: 'var(--color-muted)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        ← Back to Light Cones
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Col: High-res Canvas */}
        <div style={{ background: 'linear-gradient(160deg, var(--color-surface), var(--color-panel))', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1rem', position: 'relative', aspectRatio: '3/4', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          <img src={lightCone.portraitUrl} alt={lightCone.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
          <div style={{ background: lightCone.rarity === 5 ? 'linear-gradient(90deg, #c8a84b, #f5d78e, #c8a84b)' : lightCone.rarity === 4 ? 'linear-gradient(90deg, #9b7ff5, #c4b0ff, #9b7ff5)' : '#4b9cc8', position: 'absolute', top: 0, left: 0, right: 0, height: '4px' }} />
        </div>

        {/* Right Col: Controls & Data */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Header Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: pathColor, fontFamily: 'Rajdhani, sans-serif' }}>
              <span>{pathLabel}</span>
              <span style={{ color: 'var(--color-border)' }}>•</span>
              <span style={{ color: 'rgba(234, 179, 8, 0.9)' }}>{lightCone.rarity}★</span>
            </div>
            <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0, lineHeight: 1.1 }}>
              {lightCone.name}
            </h1>
          </div>

          {/* Level Slider */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--color-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Level Modifier</span>
              <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-accent)' }}>Lv. {level}</span>
            </div>
            <input 
              type="range" 
              min={1} 
              max={80} 
              value={level} 
              onChange={(e) => setLevel(Number(e.target.value))} 
              style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--color-accent)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.65rem', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif' }}>
              {ASC_CAPS.map((cap, idx) => (
                <span key={idx} style={{ color: getAscension(level) >= idx ? 'var(--color-accent)' : 'var(--color-border)' }}>{cap}</span>
              ))}
            </div>
          </div>

          {/* Computed Core Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {calculatedStats.map((st) => (
              <div key={st.label} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--color-muted)', fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '0.25rem' }}>
                  {st.label}
                </div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {st.value}
                </div>
              </div>
            ))}
          </div>

          {/* Prominent Superimposition Tracker & Effects */}
          {activeRankNode && (
            <div style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              
              <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-text)', margin: '0 0 1rem 0' }}>
                  Passive Ability: <span style={{ color: 'var(--color-accent)' }}>{activeRankNode.name}</span>
                </h2>
                
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5].map((rk) => {
                    const isActive = superimposition === rk;
                    return (
                      <button
                        key={rk}
                        onClick={() => setSuperimposition(rk)}
                        style={{ 
                          flex: 1,
                          minWidth: '40px',
                          padding: '0.5rem 0',
                          fontFamily: 'Rajdhani, sans-serif',
                          fontSize: '1rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                          background: isActive ? 'rgba(79,195,247,0.1)' : 'var(--color-surface)',
                          color: isActive ? 'var(--color-accent)' : 'var(--color-muted)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        S{rk}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 1. Main Mechanical Effect (Bigger, more prominent) */}
              <div 
                style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--color-text)', marginBottom: '1.5rem' }}
                dangerouslySetInnerHTML={{ 
                  __html: parsedPassiveDesc.replace(/(\d+\.?\d*%?)/g, `<span style="color:${pathColor};font-weight:700">$1</span>`) 
                }}
              />

              {/* 2. Flavor Text / Lore (Reserved, italicized, muted) */}
              <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '1rem' }}>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>
                  Data Bank Entry
                </div>
                <div 
                  style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--color-muted)', lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: lightCone.desc }} 
                />
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
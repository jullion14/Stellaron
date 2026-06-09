import React from 'react';
import { useBuilderStore } from '@/store/builderStore';
import { useQuery } from '@tanstack/react-query';
import { fetchRawCharacters, fetchRawLightCones, fetchLightConeRanks } from '@/api/staticData';
import { mapCharacter } from '@/api/characterMapper';
import { PATH_LABELS, PATH_COLORS } from '@/utils/constants';
import { parseSkillDesc } from '@/utils/skillUtils';
import type { Element, Path } from '@/types';

const ASSET = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master';

interface CharacterPreviewPanelProps {
  onOpenLightConePicker: () => void;
}

export function CharacterPreviewPanel({ onOpenLightConePicker }: CharacterPreviewPanelProps) {
  const activeBuild = useBuilderStore((state) => state.activeBuild);
  const initializeBuild = useBuilderStore((state) => state.initializeBuild);
  const setLevel = useBuilderStore((state) => state.setLevel);
  const setLightCone = useBuilderStore((state) => state.setLightCone);

  const { data: characters = [] } = useQuery({
    queryKey: ['characters'],
    queryFn: async () => {
      const raw = await fetchRawCharacters();
      return Object.values(raw).map(mapCharacter);
    },
  });

  // ── REUSED LOGIC: Fetch Light Cone Ranks for Preview ──
  const { data: lcPreviewData } = useQuery({
    queryKey: ['equipped-light-cone', activeBuild?.lightConeId],
    queryFn: async () => {
      if (!activeBuild?.lightConeId) return null;
      const [lcs, ranks] = await Promise.all([
        fetchRawLightCones(),
        fetchLightConeRanks(),
      ]);
      const rawLC = lcs[activeBuild.lightConeId];
      
      // Filter and sort ranks just like the detail page
      const matchedRanks = Object.values(ranks)
        .filter((r) => r.id.toString().startsWith(activeBuild.lightConeId!))
        .sort((a, b) => a.rank - b.rank);
        
      return { lightCone: rawLC, ranks: matchedRanks };
    },
    enabled: !!activeBuild?.lightConeId,
  });

  if (!activeBuild) return null;

  // Calculate active variables for the preview
  const superimposition = activeBuild.lightConeSuperimposition ?? 1;
  const activeRankNode = lcPreviewData?.ranks[superimposition - 1] || lcPreviewData?.ranks[0];
  const parsedPassiveDesc = activeRankNode 
    ? parseSkillDesc(activeRankNode.desc, activeRankNode.params[superimposition - 1] ?? [])
    : '';
  const pathColor = lcPreviewData 
    ? (PATH_COLORS[lcPreviewData.lightCone.path as Path] || 'var(--color-accent)') 
    : 'var(--color-accent)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '300px', flexShrink: 0 }}>
      
      {/* ── Swap Character + Level Slider ── */}
      <div style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted)' }}>SWAP CHARACTER</label>
          <select
            value={activeBuild.characterId}
            onChange={(e) => {
              const target = characters.find((c) => c.id === e.target.value);
              if (target) {
                initializeBuild({ id: target.id, name: target.name, element: target.element as Element, path: target.path as Path });
              }
            }}
            style={selectStyle}
          >
            {characters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
            <span style={{ color: 'var(--color-muted)' }}>LEVEL</span>
            <span style={{ color: 'var(--color-accent)' }}>Lv. {activeBuild.level}</span>
          </div>
          <input type="range" min="1" max="80" value={activeBuild.level} onChange={(e) => setLevel(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--color-accent)' }} />
        </div>
      </div>

      {/* ── Portrait Panel ── */}
      <div style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        <div style={{ position: 'relative', width: '100%', height: '450px', background: 'var(--color-bg)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          <img
            src={`${ASSET}/image/character_portrait/${activeBuild.characterId}.png`}
            alt={activeBuild.characterName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
            onError={(e) => { (e.target as HTMLImageElement).src = `${ASSET}/image/character_portrait/1001.png`; }}
          />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.88))', padding: '1.5rem 0.75rem 0.75rem' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>{activeBuild.characterName}</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
              {activeBuild.characterElement} · {PATH_LABELS[activeBuild.characterPath] || activeBuild.characterPath}
            </div>
          </div>
        </div>

        {/* ── UPGRADED LIGHT CONE PREVIEW PANEL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted)' }}>
              EQUIPPED LIGHT CONE
            </label>
            {activeBuild.lightConeId && (
              <button 
                onClick={onOpenLightConePicker} 
                style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                CHANGE
              </button>
            )}
          </div>

          {!activeBuild.lightConeId ? (
            <button
              onClick={onOpenLightConePicker}
              style={{ width: '100%', padding: '0.625rem', background: 'var(--color-bg)', border: '1px dashed var(--color-border)', borderRadius: '6px', color: 'var(--color-muted)', textAlign: 'center', fontSize: '0.812rem', cursor: 'pointer' }}
            >
              + Select Light Cone
            </button>
          ) : (
            <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
              
              {/* Top Section: LC Image, Name, and SI Toggles */}
              <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '64px', background: 'var(--color-surface)', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                  {lcPreviewData && (
                    <img 
                      src={`${ASSET}/${lcPreviewData.lightCone.portrait}`} 
                      alt="Light Cone Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  )}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.812rem', fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Rajdhani, sans-serif' }}>
                    {activeBuild.lightConeName}
                  </div>
                  
                  {/* Superimposition Toggles - Matches the detail page layout */}
                  <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map((rk) => {
                      const isActive = superimposition === rk;
                      return (
                        <button
                          key={rk}
                          onClick={() => setLightCone(activeBuild.lightConeId!, activeBuild.lightConeName!, rk)}
                          style={{ 
                            flex: 1, padding: '0.125rem 0', fontFamily: 'Rajdhani, sans-serif', fontSize: '0.75rem', fontWeight: 700, borderRadius: '4px',
                            border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                            background: isActive ? 'rgba(79,195,247,0.1)' : 'var(--color-surface)',
                            color: isActive ? 'var(--color-accent)' : 'var(--color-muted)',
                            cursor: 'pointer', transition: 'all 0.15s'
                          }}
                        >
                          S{rk}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Section: Parsed Mechanical Effect */}
              {activeRankNode && (
                <div style={{ padding: '0.75rem', background: 'var(--color-panel)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.375rem', fontFamily: 'Rajdhani, sans-serif', textTransform: 'uppercase' }}>
                    {activeRankNode.name}
                  </div>
                  <div 
                    style={{ fontSize: '0.7rem', color: 'var(--color-muted)', lineHeight: 1.5 }}
                    dangerouslySetInnerHTML={{ 
                      __html: parsedPassiveDesc.replace(/(\d+\.?\d*%?)/g, `<span style="color:${pathColor};font-weight:700">$1</span>`) 
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  background: 'var(--color-panel)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  color: 'var(--color-text)',
  outline: 'none',
};
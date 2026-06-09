import { useState } from 'react';
import { assetUrl } from '@/api/mihomo';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ASSET = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master';

function relicSlotIdx(icon: string): number {
  const m = icon?.match(/_(\d)\.png$/);
  return m ? parseInt(m[1], 10) : 0;   // keep 0 as fallback, but type takes priority now
}

const SLOT_LABELS = ['Head', 'Hands', 'Body', 'Feet', 'Sphere', 'Rope'];

// ─── Stat Name Cleaner ───────────────────────────────────────────────────────
const STAT_NAME_MAP: Record<string, string> = {
  'Base HP': 'HP',
  'Base ATK': 'ATK',
  'Base DEF': 'DEF',
  'Base SPD': 'SPD',
  'CRIT Rate': 'Crit Rate',
  'CRIT DMG': 'Crit DMG',
  'Effect Hit Rate': 'Effect Hit',
  'Effect RES': 'Effect RES',
  'Energy Regeneration Rate': 'Energy Regen',
  'Break Effect': 'Break Effect',
  'Healing Boost': 'Healing Boost',   // if it appears
};

function cleanStatName(name: string): string {
  return STAT_NAME_MAP[name] ?? 
         name.replace(/^Base\s+/i, '').trim();
}

// Combine attributes (base) + additions (bonus) into one stat map
function buildStatMap(char: any) {
  const map: Record<string, { name: string; icon: string; total: number; percent: boolean }> = {};
  
  [...(char.attributes ?? []), ...(char.additions ?? [])].forEach((a: any) => {
    if (!map[a.field]) {
      map[a.field] = { 
        name: cleanStatName(a.name),        // Clean once at creation
        icon: a.icon ?? '', 
        total: 0, 
        percent: a.percent 
      };
    }
    map[a.field].total += a.value;
  });
  return map;
}

type StatMap = ReturnType<typeof buildStatMap>;

function fmtStat(map: StatMap, field: string): string {
  const s = map[field];
  if (!s) return '—';
  return s.percent ? `${(s.total * 100).toFixed(1)}%` : String(Math.round(s.total));
}

// ─── Relic cell (right column) ────────────────────────────────────────────────

function RelicCell({ relic }: { relic: any }) {
  const [hov, setHov] = useState(false);
  const rc = relic.rarity === 5 ? '#c8a84b' : '#9b7ff5';

  return (
    <div
      style={{
        background: 'var(--color-panel)',
        border: `1px solid ${hov ? rc + 'aa' : 'var(--color-border)'}`,
        borderRadius: '8px',
        padding: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem',
        transition: 'border-color 0.15s',
        cursor: 'default',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Icon row: icon + level chip + main stat */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
        {/* Icon + level */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={`${ASSET}/${relic.icon}`}
            alt={relic.name}
            style={{
              width: '36px', height: '36px',
              objectFit: 'contain',
              borderRadius: '6px',
              background: `${rc}18`,
              border: `1px solid ${rc}44`,
              padding: '2px',
              display: 'block',
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
          />
          <div style={{
            position: 'absolute',
            bottom: '-4px', left: '50%',
            transform: 'translateX(-50%)',
            background: rc,
            color: '#000',
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 800,
            fontSize: '0.5rem',
            lineHeight: '11px',
            padding: '0 3px',
            borderRadius: '3px',
            whiteSpace: 'nowrap',
          }}>
            +{relic.level}
          </div>
        </div>

        {/* Main stat */}
        {relic.main_affix && (
          <div style={{ minWidth: 0, flex: 1, paddingTop: '1px' }}>
            <div style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 800,
              fontSize: '0.88rem',
              color: 'var(--color-accent)',
              lineHeight: 1,
              marginBottom: '2px',
            }}>
              {relic.main_affix.display}
            </div>
            <div style={{
              fontSize: '0.6rem',
              color: 'var(--color-muted)',
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}>
              {relic.main_affix.name}
            </div>
          </div>
        )}
      </div>

      {/* Substats */}
      {(relic.sub_affix ?? []).length > 0 && (
        <div style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: '0.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}>
          {(relic.sub_affix as any[]).map((sub: any, i: number) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              {/* Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', minWidth: 0 }}>
                {sub.icon && (
                  <img src={`${ASSET}/${sub.icon}`} alt="" style={{ width: '10px', height: '10px', opacity: 0.55, flexShrink: 0 }} />
                )}
                <span style={{
                  fontSize: '0.62rem',
                  fontFamily: 'Rajdhani, sans-serif',
                  color: 'var(--color-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {sub.name}
                </span>
              </div>

              {/* Value + roll dots */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0, marginLeft: '4px' }}>
                <span style={{
                  fontSize: '0.68rem',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                }}>
                  {sub.display}
                </span>
                <span style={{ display: 'flex', gap: '1px', alignItems: 'center' }}>
                  {Array.from({ length: Math.min(sub.count ?? 1, 6) }).map((_, di) => (
                    <span key={di} style={{
                      width: '3px', height: '3px',
                      borderRadius: '50%',
                      background: di < (sub.step ?? 1) ? 'var(--color-accent)' : 'var(--color-border)',
                      display: 'inline-block',
                    }} />
                  ))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyRelicCell({ label }: { label: string }) {
  return (
    <div style={{
      border: '1px dashed var(--color-border)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '90px',
      opacity: 0.35,
    }}>
      <span style={{
        fontSize: '0.62rem',
        fontFamily: 'Rajdhani, sans-serif',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-muted)',
      }}>
        {label}
      </span>
    </div>
  );
}

// ─── Stat row (middle column) ─────────────────────────────────────────────────

function StatRow({ icon, name, value }: { icon: string; name: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.22rem 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        {icon && (
          <img src={`${ASSET}/${icon}`} alt="" style={{ width: '14px', height: '14px', opacity: 0.65, flexShrink: 0 }} />
        )}
        <span style={{
          fontSize: '0.75rem',
          fontFamily: 'Rajdhani, sans-serif',
          fontWeight: 600,
          color: 'var(--color-muted)',
        }}>
          {name}
        </span>
      </div>
      <span style={{
        fontSize: '0.8rem',
        fontFamily: 'Rajdhani, sans-serif',
        fontWeight: 700,
        color: 'var(--color-text)',
      }}>
        {value}
      </span>
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

interface ShowcaseCharacterCardProps {
  char: any;
  onLoad: () => void;
}

export function ShowcaseCharacterCard({ char, onLoad }: ShowcaseCharacterCardProps) {
  const elColor  = char.element?.color ?? 'var(--color-accent)';
  const elIcon   = char.element?.icon  ?? '';
  const pathIcon = char.path?.icon     ?? '';
  const pathName = char.path?.name     ?? '';

  // Full portrait path: char.portrait = "image/character_portrait/{id}.png"
  const portraitUrl = char.portrait ? `${ASSET}/${char.portrait}` : `${ASSET}/${char.icon}`;

  const statMap = buildStatMap(char);

  // LC Modal Popup
  const [showLcModal, setShowLcModal] = useState(false);

  // Relic slots ordered 0–5
const relicSlots: (any | null)[] = Array.from({ length: 6 }, (_, i) => {
  const targetType = i + 1; // Mihomo parsed API: 1=Head, 2=Hands, 3=Body, 4=Feet, 5=Sphere, 6=Rope

  return (char.relics ?? []).find((r: any) => {
    const relicType = r.type || r.slot || r.position || relicSlotIdx(r.icon ?? '');
    
    // Direct type match (most reliable)
    if (relicType === targetType) return true;

    // Fallbacks for different API shapes
    if (targetType === 5 && (relicType === 'PLANAR_SPHERE' || relicType === 'sphere' || relicType === 5)) return true;
    if (targetType === 6 && (relicType === 'LINK_ROPE' || relicType === 'rope' || relicType === 6)) return true;

    return false;
  }) ?? null;
});

  const primaryStats   = ['hp', 'atk', 'def', 'spd', 'crit_rate', 'crit_dmg'];
  const secondaryStats = ['effect_hit', 'effect_res', 'break_dmg', 'heal_rate', 'sp_rate'];
  const visSecondary   = secondaryStats.filter((f) => statMap[f] && statMap[f].total > 0);

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: `1px solid var(--color-border)`,
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Rarity bar */}
      <div style={{
        height: '3px',
        background: char.rarity === 5
          ? 'linear-gradient(90deg, #c8a84b, #f5d78e, #c8a84b)'
          : 'linear-gradient(90deg, #9b7ff5, #c4b0ff)',
      }} />

      {/* ══ 3-COLUMN BODY ══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '360px 1fr 1fr',
        minHeight: '420px',
      }}>

      {/* ── COL 1: Full portrait ── */}
      <div style={{
        position: 'relative',
        borderRight: '1px solid var(--color-border)',
        overflow: 'hidden',
        background: `linear-gradient(180deg, ${elColor}18 0%, var(--color-bg) 100%)`,
        minHeight: '420px',
      }}>
        {/* Element wash */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 0%, ${elColor}22, transparent 65%)`,
          zIndex: 1,
          pointerEvents: 'none',
        }} />

        {/* Full portrait */}
        <img
          src={portraitUrl}
          alt={char.name}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top center',
            zIndex: 0,
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = `${ASSET}/${char.icon}`;
          }}
        />

        {/* Name overlay at bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '2.5rem 0.75rem 0.75rem',   // Increased padding to avoid overlap
          background: 'linear-gradient(to top, rgba(8,12,20,0.94) 0%, transparent 100%)',
          zIndex: 2,
        }}>
          {/* Element + path */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
            {elIcon && <img src={`${ASSET}/${elIcon}`} alt="" style={{ width: '16px', height: '16px' }} />}
            {pathIcon && <img src={`${ASSET}/${pathIcon}`} alt="" style={{ width: '14px', height: '14px', opacity: 0.7 }} />}
            <span style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: elColor,
            }}>
              {pathName}
            </span>
          </div>

          {/* Character name */}
          <div style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            fontSize: '1rem',
            color: '#fff',
            lineHeight: 1.1,
            marginBottom: '2px',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}>
            {char.name}
          </div>

          {/* Level + eidolon */}
          <div style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '2px',
          }}>
            Lv.{char.level} · {char.rank > 0 ? `E${char.rank}` : 'E0'}
          </div>

          {/* Stars */}
          <div style={{
            fontSize: '0.65rem',
            letterSpacing: '-1px',
            color: char.rarity === 5 ? '#c8a84b' : '#9b7ff5',
          }}>
            {'★'.repeat(char.rarity)}
          </div>
        </div>

        {/* Light Cone — Bottom Right (Clickable) */}
        {char.light_cone && (
          <div
            onClick={() => setShowLcModal(true)}
            style={{
              position: 'absolute',
              bottom: '1.25rem',
              right: '1rem',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'rgba(8,12,20,0.88)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              padding: '0.55rem 0.7rem',
              maxWidth: '185px',
              boxShadow: '0 6px 16px rgba(0,0,0,0.65)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.75)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.65)';
            }}
          >
            <img
              src={`${ASSET}/${char.light_cone.preview || char.light_cone.portrait}`}
              alt={char.light_cone.name}
              style={{
                width: '50px',
                height: '50px',
                objectFit: 'contain',
                borderRadius: '7px',
                flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(0,0,0,0.25)',
              }}
            />

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700,
                fontSize: '0.82rem',
                lineHeight: 1.25,
                color: '#fff',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {char.light_cone.name}
              </div>
              <div style={{
                fontSize: '0.71rem',
                color: 'rgba(255,255,255,0.8)',
                marginTop: '3px',
                whiteSpace: 'nowrap',
              }}>
                S{char.light_cone.rank} · Lv.{char.light_cone.level}
              </div>
            </div>
          </div>
        )}
      </div>

        {/* ── COL 2: Stats ── */}
        <div style={{
          padding: '1rem 0.875rem',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Primary stats */}
          {primaryStats.map((field) => {
            const s = statMap[field];
            if (!s) return null;
            return <StatRow key={field} icon={s.icon} name={s.name} value={fmtStat(statMap, field)} />;
          })}

          {/* Secondary stats */}
          {visSecondary.length > 0 && (
            <>
              <div style={{ borderTop: '1px solid var(--color-border)', margin: '0.5rem 0' }} />
              {visSecondary.map((field) => {
                const s = statMap[field];
                if (!s) return null;
                return <StatRow key={field} icon={s.icon} name={s.name} value={fmtStat(statMap, field)} />;
              })}
            </>
          )}

          {/* Active relic sets */}
          {(char.relic_sets ?? []).length > 0 && (
            <>
              <div style={{ borderTop: '1px solid var(--color-border)', margin: '0.5rem 0 0.375rem' }} />
              {(char.relic_sets as any[]).map((set: any) => {
                // Hide 2pc if 4pc of the same set is active
                if (set.num === 2 && char.relic_sets?.some((s: any) => s.id === set.id && s.num === 4)) {
                  return null;
                }

                return (
                  <div
                    key={`${set.id}-${set.num}`}
                    title={set.desc}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 0', cursor: 'help' }}
                  >
                    {set.icon && <img src={`${ASSET}/${set.icon}`} alt="" style={{ width: '14px', height: '14px', opacity: 0.7 }} />}
                    <span style={{
                      fontSize: '0.73rem',           // ← Bigger font
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 700,               // ← Bolder
                      color: 'var(--color-text)',    // ← Better visibility
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      <span style={{ color: 'var(--color-accent)' }}>{set.num}pc</span>{' '}{set.name}
                    </span>
                  </div>
                );
              })}
            </>
          )}

          {/* Spacer + Load button pinned to bottom */}
          <div style={{ flex: 1 }} />
          <button
            onClick={onLoad}
            style={{
              marginTop: '1rem',
              width: '100%',
              padding: '0.5rem',
              background: elColor,
              border: 'none',
              borderRadius: '7px',
              color: '#000',
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 800,
              fontSize: '0.78rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
          >
            Load into Builder →
          </button>
        </div>

        {/* ── COL 3: Relics 2×3 ── */}
        <div style={{
          padding: '0.75rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: '0.5rem',
          alignContent: 'start',
        }}>
          {relicSlots.map((relic, i) =>
            relic
              ? <RelicCell key={relic.id} relic={relic} />
              : <EmptyRelicCell key={i} label={SLOT_LABELS[i]} />
          )}
        </div>

      </div>
      {/* Light Cone Enlarged Modal */}
      {showLcModal && char.light_cone && (
        <div
          onClick={() => setShowLcModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(8px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '520px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowLcModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--color-muted)',
                fontSize: '1.8rem',
                cursor: 'pointer',
                lineHeight: 1,
                padding: '0.25rem',
              }}
            >
              ✕
            </button>

            {/* Enlarged Light Cone Image - Centered */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
              <img
                src={`${ASSET}/${char.light_cone.preview || char.light_cone.portrait}`}
                alt={char.light_cone.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '68vh',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                  background: 'rgba(0,0,0,0.4)',
                  display: 'block',
                }}
              />
            </div>

            {/* Light Cone Info */}
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '1.4rem',
                fontWeight: 700,
                color: '#fff',
                lineHeight: 1.2,
              }}>
                {char.light_cone.name}
              </div>
              <div style={{
                color: 'var(--color-muted)',
                fontSize: '0.95rem',
                marginTop: '0.4rem',
              }}>
                Superimposition {char.light_cone.rank} • Level {char.light_cone.level}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
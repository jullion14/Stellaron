import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchRawLightCones } from '@/api/staticData';
import { PATH_COLORS, PATH_LABELS, PATH_ICON_URLS, ALL_PATHS } from '@/utils/constants';
import type { Path } from '@/types';

export default function LightConeList() {
  const navigate = useNavigate();

  const { data: lightCones = [], isLoading, error } = useQuery({
    queryKey: ['light-cones-list'],
    queryFn: async () => {
      const rawData = await fetchRawLightCones();
      
      const internalPathMap: Record<string, Path> = {
        'Rogue': 'TheHunt',
        'Mage': 'Erudition',
        'Warlock': 'Nihility',
        'Priest': 'Abundance',
        'Warrior': 'Destruction',
        'Shaman': 'Harmony',
        'Knight': 'Preservation',
        'Memory': 'Remembrance',
        'Joy': 'Elation'
      };

      return Object.values(rawData).map((lc) => ({
        ...lc,
        path: internalPathMap[lc.path] || (lc.path as Path),
        portraitUrl: `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/${lc.portrait}`,
      }));
    },
    staleTime: 1000 * 60 * 10,
  });

  const [search, setSearch]             = useState('');
  const [filterPath, setFilterPath]     = useState<Path | 'All'>('All');
  const [filterRarity, setFilterRarity] = useState<3 | 4 | 5 | 0>(0); // Included 3★ for Light Cones

  const filtered = useMemo(() => {
    return lightCones.filter((lc) => {
      if (search && !lc.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterPath !== 'All' && lc.path !== filterPath) return false;
      if (filterRarity !== 0   && lc.rarity !== filterRarity) return false;
      return true;
    }).sort((a, b) => {
      // Sort by rarity first, then alphabetical
      if (b.rarity !== a.rarity) return b.rarity - a.rarity;
      return a.name.localeCompare(b.name);
    });
  }, [lightCones, search, filterPath, filterRarity]);

  return (
    <div style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '2rem 2rem' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--color-text)', fontSize: '2.25rem', fontWeight: 700, letterSpacing: '0.05em' }}>
          Light Cones
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
          {isLoading ? 'Loading…' : `${lightCones.length} light cones loaded`}
        </p>
      </div>

      {/* Filters (Matches Character Layout exactly) */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        
        {/* Search bar */}
        <input
          type="text"
          placeholder="Search light cone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text)', padding: '0.5rem 0.875rem', fontSize: '0.875rem', outline: 'none' }}
        />

        {/* Path filter */}
        <div>
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-muted)', display: 'block', marginBottom: '0.5rem' }}>Path</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <IconFilterPill 
              active={filterPath === 'All'} 
              onClick={() => setFilterPath('All')} 
              color="var(--color-muted)"
              label="All"
            />
            {ALL_PATHS.map((path) => (
              <IconFilterPill 
                key={path} 
                active={filterPath === path} 
                onClick={() => setFilterPath(path)} 
                color={PATH_COLORS[path]}
                iconUrl={PATH_ICON_URLS[path]}
                label={PATH_LABELS[path]}
              />
            ))}
          </div>
        </div>

        {/* Rarity filter */}
        <div>
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-muted)', display: 'block', marginBottom: '0.5rem' }}>Rarity</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <FilterPill active={filterRarity === 0} onClick={() => setFilterRarity(0)} color="var(--color-muted)">All ★</FilterPill>
            <FilterPill active={filterRarity === 5} onClick={() => setFilterRarity(5)} color="#c8a84b">5★</FilterPill>
            <FilterPill active={filterRarity === 4} onClick={() => setFilterRarity(4)} color="#9b7ff5">4★</FilterPill>
            <FilterPill active={filterRarity === 3} onClick={() => setFilterRarity(3)} color="#4b9cc8">3★</FilterPill>
          </div>
        </div>

      </div>

      {/* States */}
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '16rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '2rem', height: '2rem', border: '2px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Fetching data…</p>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: '#1a0a0a', border: '1px solid var(--color-red)', borderRadius: '8px', padding: '1rem', color: 'var(--color-red)', fontSize: '0.875rem' }}>
          Failed to load light cones. <br />
          <span style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>{String(error)}</span>
        </div>
      )}

      {!isLoading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
          {filtered.map((lc) => {
            const pathColor = PATH_COLORS[lc.path as Path] || 'var(--color-muted)';
            const pathLabel = PATH_LABELS[lc.path as Path] || lc.path;

            return (
              <div
                key={lc.id}
                onClick={() => navigate(`/light-cones/${lc.id}`)}
                style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '12px' }}
                className="group overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-[var(--color-accent)] shadow-md"
              >
                <div style={{ aspectRatio: '3/4', width: '100%', background: 'var(--color-surface)', overflow: 'hidden', position: 'relative' }}>
                  <img 
                    src={lc.portraitUrl} 
                    alt={lc.name} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div 
                    style={{ 
                      background: lc.rarity === 5 
                        ? 'linear-gradient(90deg, #c8a84b, #f5d78e, #c8a84b)' 
                        : lc.rarity === 4 ? 'linear-gradient(90deg, #9b7ff5, #c4b0ff, #9b7ff5)' : '#4b9cc8' 
                    }}
                  />
                </div>

                <div style={{ padding: '0.875rem' }}>
                  <div style={{ color: pathColor, fontFamily: 'Rajdhani, sans-serif', fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    {pathLabel}
                  </div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} className="group-hover:text-[var(--color-accent)] transition-colors">
                    {lc.name}
                  </h3>
                  <div style={{ fontSize: '0.6875rem', color: 'rgba(234, 179, 8, 0.8)', marginTop: '0.25rem', fontFamily: 'serif' }}>
                    {'★'.repeat(lc.rarity)}
                  </div>
                </div>
              </div>
            );
          })}
          
          {filtered.length === 0 && (
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', padding: '3rem', margin: '0 auto', gridColumn: '1 / -1', textAlign: 'center' }}>
              No light cones match your filters.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Filter Pill Components ─────────────────────────────────────────────
// You can extract these to a common components folder later, but they 
// are safe to live here for now so everything renders instantly.

function FilterPill({ children, active, onClick, color }: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontFamily: 'Rajdhani, sans-serif',
        fontWeight: 600,
        letterSpacing: '0.05em',
        background: active ? `${color}33` : 'var(--color-panel)',
        border: `1.5px solid ${active ? color : 'var(--color-border)'}`,
        color: active ? color : 'var(--color-text)',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

function IconFilterPill({ label, iconUrl, active, onClick, color }: {
  label: string;
  iconUrl?: string;
  active: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.35rem 0.75rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontFamily: 'Rajdhani, sans-serif',
        fontWeight: 600,
        letterSpacing: '0.05em',
        background: active ? `${color}33` : 'var(--color-panel)',
        border: `1.5px solid ${active ? color : 'var(--color-border)'}`,
        color: active ? color : 'var(--color-text)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
      }}
    >
      {iconUrl && (
        <img 
          src={iconUrl} 
          alt={label}
          style={{ width: '16px', height: '16px', opacity: active ? 1 : 0.6 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <span>{label}</span>
    </button>
  );
}
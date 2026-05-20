import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { fetchRawCharacters } from '@/api/staticData';
import { mapCharacter } from '@/api/characterMapper';
import { CharacterCard } from '@/components/characters/CharacterCard';
import type { Character, Element } from '@/types';
import { ELEMENT_COLORS } from '@/utils/constants';

const ALL_ELEMENTS: Element[] = ['Fire', 'Ice', 'Lightning', 'Wind', 'Quantum', 'Imaginary', 'Physical'];

export default function Characters() {
  const { data: characters = [], isLoading, error } = useQuery({
    queryKey: ['characters'],
    queryFn: async () => {
      const raw = await fetchRawCharacters();
      return Object.values(raw).map(mapCharacter);
    },
    staleTime: 1000 * 60 * 10,
  });

  const [search, setSearch]               = useState('');
  const [filterElement, setFilterElement] = useState<Element | 'All'>('All');
  const [filterRarity, setFilterRarity]   = useState<4 | 5 | 0>(0);

  const filtered = useMemo(() => {
    return characters.filter((c: Character) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterElement !== 'All' && c.element !== filterElement) return false;
      if (filterRarity  !== 0     && c.rarity  !== filterRarity)  return false;
      return true;
    });
  }, [characters, search, filterElement, filterRarity]);

  return (
    <div style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '2rem 2rem' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--color-text)', fontSize: '2.25rem', fontWeight: 700, letterSpacing: '0.05em' }}>
          Characters
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
          {isLoading ? 'Loading…' : `${characters.length} characters loaded`}
        </p>
      </div>

      {/* Filters */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Search character…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text)', padding: '0.375rem 0.75rem', fontSize: '0.875rem', outline: 'none', flex: 1, minWidth: '160px' }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          <FilterPill active={filterElement === 'All'} onClick={() => setFilterElement('All')} color="var(--color-muted)">All</FilterPill>
          {ALL_ELEMENTS.map((el) => (
            <FilterPill key={el} active={filterElement === el} onClick={() => setFilterElement(el)} color={ELEMENT_COLORS[el]}>{el}</FilterPill>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <FilterPill active={filterRarity === 0} onClick={() => setFilterRarity(0)}  color="var(--color-muted)">All ★</FilterPill>
          <FilterPill active={filterRarity === 5} onClick={() => setFilterRarity(5)}  color="#c8a84b">5★</FilterPill>
          <FilterPill active={filterRarity === 4} onClick={() => setFilterRarity(4)}  color="#9b7ff5">4★</FilterPill>
        </div>
      </div>

      {/* States */}
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '16rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '2rem', height: '2rem', border: '2px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Fetching character data…</p>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: '#1a0a0a', border: '1px solid var(--color-red)', borderRadius: '8px', padding: '1rem', color: 'var(--color-red)', fontSize: '0.875rem' }}>
          Failed to load characters — check your connection and try again.
          <br />
          <span style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>{String(error)}</span>
        </div>
      )}

      {!isLoading && !error && (   
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
          {filtered.map((c: Character) => (
            <CharacterCard key={c.id} character={c} />
          ))}
          {filtered.length === 0 && (
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', padding: '3rem', margin: '0 auto' }}>
              No characters match your filters.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

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
        background: active ? `${color}22` : 'var(--color-panel)',
        border: `1px solid ${active ? color : 'var(--color-border)'}`,
        color: active ? color : 'var(--color-muted)',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}
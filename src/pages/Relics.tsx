import { useQuery } from '@tanstack/react-query';
import { fetchRawRelics, assetUrl, RawRelic } from '@/api/staticData';
import type {  } from '@/api/staticData';
import { useState } from 'react';

// Utility to group unique relics by set_id and type
function groupRelicsUniqueBySet(relics: RawRelic[], typeFilter: string[]) {
  const grouped: { [setId: string]: RawRelic[] } = {};
  for (const relic of relics) {
    if (!typeFilter.includes(relic.type)) continue;
    if (!grouped[relic.set_id]) grouped[relic.set_id] = [];
    // Only keep the first occurrence of each unique name per set
    if (!grouped[relic.set_id].some(r => r.name === relic.name)) {
      grouped[relic.set_id].push(relic);
    }
  }
  return grouped;
}

// Updated to use the fetched setMapping dictionary with a clean fallback layout
function getSetNameForSet(setId: string, setRelics: RawRelic[], setMapping: Record<string, any>) {
  if (setMapping && setMapping[setId]) {
    return setMapping[setId].name;
  }

  // Fallback string-chopping logic if map lookup fails
  let mainRelic = setRelics.find(r => r.type === 'HEAD' || r.type === 'NECK');
  if (!mainRelic) mainRelic = setRelics[0];
  if (!mainRelic) return 'Unknown Set';

  const parts = mainRelic.name.split(' ');
  if (parts.length > 2) {
    return parts.slice(0, -2).join(' ');
  }
  if (parts.length > 1) {
    return parts.slice(0, -1).join(' ');
  }
  return mainRelic.name;
}

export default function Relics() {
    
  // Fetch both endpoints together to keep state consistent
  const { data, isLoading, error } = useQuery({
    queryKey: ['relics-with-sets'],
    queryFn: async () => {
      const [rawRelics, rawSets] = await Promise.all([
        fetchRawRelics(),
        import('@/api/staticData').then(m => m.fetchRawRelicSets ? m.fetchRawRelicSets() : {})
      ]);

      return {
        relics: Object.values(rawRelics),
        setMapping: rawSets
      };
    },
    staleTime: 1000 * 60 * 10,
  });

  // Safely extract pieces using fallback defaults to avoid crash errors
  const relics = data?.relics ?? [];
  const setMapping: Record<string, any> = data?.setMapping ?? {};

  // Main Relics (Cavern)
  const relicGroups = groupRelicsUniqueBySet(relics, ['HEAD', 'HAND', 'BODY', 'FOOT']);
  // Planar Ornaments
  const planarGroups = groupRelicsUniqueBySet(relics, ['NECK', 'OBJECT']);

  const [isModalOpen, setIsModalOpen] = useState(false);
  // 1. Change from a string to a string array
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([]);

  // 2. Update the filtering logic to check if the set_id exists in our array
  const filteredRelicGroups = Object.entries(relicGroups).filter(([set_id]) => {
    if (selectedSetIds.length === 0) return true; // Show all if nothing is selected
    return selectedSetIds.includes(set_id);
  });

  const filteredPlanarGroups = Object.entries(planarGroups).filter(([set_id]) => {
    if (selectedSetIds.length === 0) return true;
    return selectedSetIds.includes(set_id);
  });

  // Helper component to extract and render cleanly structured Set Effects
  function SetEffectsDisplay({ setId, setMapping }: { setId: string, setMapping: Record<string, any> }) {
    const setDetails = setMapping[setId];
    if (!setDetails || !setDetails.desc) return null;

    // The desc layout can be a string array or contain text with dynamic indexes.
    // Cavern sets will typically have 2 entries ([0]=2pc, [1]=4pc), ornaments will have 1 entry ([0]=2pc).
    const descriptions: string[] = Array.isArray(setDetails.desc) 
      ? setDetails.desc 
      : [setDetails.desc];

    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.5rem', 
        marginBottom: '1.5rem',
        padding: '0.75rem 1rem',
        background: 'var(--color-panel)',
        borderRadius: '8px',
        borderLeft: '3px solid var(--color-accent)'
      }}>
        {descriptions.map((descText, idx) => {
          // If there are 2 entries, it's 2-pc and 4-pc. Otherwise, it's a 2-pc planar bonus.
          const pieceThreshold = descriptions.length > 1 ? (idx === 0 ? '2-Piece' : '4-Piece') : '2-Piece';
          
          return (
            <div key={idx} style={{ fontSize: '0.825rem', lineHeight: '1.4', color: 'var(--color-text)' }}>
              <span style={{ 
                fontFamily: 'Rajdhani, sans-serif', 
                fontWeight: 700, 
                color: 'var(--color-accent)', 
                marginRight: '0.5rem',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.05em'
              }}>
                {pieceThreshold}:
              </span>
              <span 
                style={{ color: 'var(--color-muted)' }}
                dangerouslySetInnerHTML={{ __html: descText }}
              />
            </div>
          );
        })}
      </div>
    );
  }

  function renderSetGroup(
    filteredEntries: [string, RawRelic[]][],
    title: string,
    setMapping: Record<string, any>
  ) {
    return (
      <>
        <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-muted)', margin: '2.5rem 0 1rem 0' }}>{title}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(48%, 1fr))', 
            gap: '1.5rem',alignItems: 'start'}}>
          {filteredEntries.map(([set_id, relics]) => (
            <div
              key={set_id}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 12,
                marginBottom: '1.5rem',
                padding: '1.5rem 1.75rem',
              }}
            >
              <div style={{
                fontWeight: 800,
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '1.14rem',
                marginBottom: '0.75rem',
                letterSpacing: 1,
                color: 'var(--color-text)'
              }}>
                {getSetNameForSet(set_id, relics, setMapping)}
              </div>

              <div
                style={{
                    display: 'grid',
                    // Cavern Relics (4 pieces) get a 2-column layout (perfect 2x2 grid)
                    // Planar Ornaments (2 pieces) stay in a side-by-side row
                    gridTemplateColumns: title === 'Cavern Relics' 
                    ? 'repeat(2, 1fr)' 
                    : 'repeat(2, 1fr)', 
                    gap: '1.25rem 0.75rem',
                    justifyItems: 'center'
                }}>
                {relics.map(relic => (
                  <div
                    key={relic.id}
                    style={{
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '0.8rem 0.1rem'
                    }}
                  >
                    <img
                      src={assetUrl(relic.icon)}
                      alt={relic.name}
                      style={{
                        width: 52, height: 52,
                        margin: '0 0 0.5rem 0',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 1px 5px #0002)'
                      }}
                    />
                    <div style={{
                      fontWeight: 700,
                      fontSize: '1.04rem',
                      fontFamily: 'Rajdhani, sans-serif',
                      color: 'var(--color-text)'
                    }}>
                      {relic.name}
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: 'var(--color-muted)',
                      letterSpacing: '0.1em',
                    }}>
                      {relic.type}
                    </div>
                  </div>
                ))}
              </div>
                <div style={{ marginTop: '1.25rem' }}>
                <SetEffectsDisplay setId={set_id} setMapping={setMapping} />
                </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Update the parameters to expect an array of strings
  function renderFilterGridGroup(
    groupData: { [setId: string]: RawRelic[] }, 
    currentSelection: string[], // <-- Changed to string[]
    onSelect: React.Dispatch<React.SetStateAction<string[]>> // <-- Updated type
  ) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {Object.entries(groupData).map(([set_id, relics]) => {
          const setName = setMapping[set_id]?.name || getSetNameForSet(set_id, relics, setMapping);
          const firstIcon = relics[0]?.icon ? assetUrl(relics[0].icon) : '';
          
          // 1. Check if this specific ID is included in the active array
          const isSelected = currentSelection.includes(set_id);

          return (
            <button
              key={set_id}
              onClick={() => {
                // 2. Array toggle logic
                if (isSelected) {
                  // Remove from list if already selected
                  onSelect(prev => prev.filter(id => id !== set_id));
                } else {
                  // Add to list if not selected
                  onSelect(prev => [...prev, set_id]);
                }
              }}
              style={{
                // ... your existing button styling remains exactly the same ...
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.8rem',
                background: isSelected ? 'rgba(79, 195, 247, 0.15)' : 'var(--color-panel)',
                border: isSelected ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {firstIcon && <img src={firstIcon} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />}
              <span style={{ 
                fontFamily: 'Rajdhani, sans-serif', fontSize: '0.88rem', 
                fontWeight: isSelected ? 700 : 600, 
                color: isSelected ? 'var(--color-accent)' : 'var(--color-text)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {setName}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 1400,
      width: '100%',
      margin: '0 auto',
      padding: '2rem 2rem'
    }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
    <div>
        <h1 style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--color-text)', fontSize: '2.25rem', fontWeight: 700, letterSpacing: '0.05em', margin: 0 }}>
        Relics & Ornaments
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
        {isLoading ? 'Loading…' : `${relics.length} pieces available`}
        </p>
    </div>
    
    {/* Filter Trigger Button */}
    <button 
        onClick={() => setIsModalOpen(true)}
        style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-accent)',
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        fontFamily: 'Rajdhani, sans-serif',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s'
        }}
    >
        Search Filter {selectedSetIds.length > 0 && `• Active (${selectedSetIds.length})`}
    </button>
    </div>
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '8rem', fontFamily: 'Rajdhani, sans-serif', color: 'var(--color-muted)', fontSize: '1.1rem' }}>
          Fetching relic data…
        </div>
      )}
      {error && (
        <div style={{ background: '#1a0a0a', border: '1px solid var(--color-red)', borderRadius: '8px', padding: '1rem', color: 'var(--color-red)', fontSize: '0.96rem' }}>
          Failed to load relics — check your connection and try again.
          <br />
          <span style={{ color: 'var(--color-muted)', fontSize: '0.87', whiteSpace: 'pre-wrap' }}>{String(error)}</span>
        </div>
      )}
      {!isLoading && !error && (
        <>
          {renderSetGroup(filteredRelicGroups, 'Cavern Relics', setMapping)}
          {renderSetGroup(filteredPlanarGroups, 'Planar Ornaments', setMapping)}
        </>
      )}
      {/* Filter Modal */}
      {isModalOpen && (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 1000,
        backdropFilter: 'blur(4px)'
      }}>
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '14px', 
          width: '95%', 
          maxWidth: '680px', // Wider box to comfortably fit two cards side-by-side
          padding: '1.75rem', 
          boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
          maxHeight: '85vh', // Locks size to viewport
          display: 'flex', 
          flexDirection: 'column' // Keeps header fixed, makes body scrollable
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'Rajdhani, sans-serif', margin: 0, color: 'var(--color-text)', fontSize: '1.25rem' }}>Filter Set Database</h3>
            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: '1.25rem' }}>&times;</button>
          </div>
          
          {/* Scrollable Container for Visual Choice Cards */}
          <div style={{ overflowY: 'auto', paddingRight: '0.5rem', flex: 1, maxHeight: '60vh' }}>
            
            {/* 1. CAVERN RELICS SUBSECTION HEADER & GRID */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
              <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1rem', fontWeight: 700, color: '#4fc3f7', letterSpacing: '0.05em' }}>
                Cavern Relics
              </span>
              <span style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>▼</span>
            </div>
            {renderFilterGridGroup(relicGroups, selectedSetIds, setSelectedSetIds)}

            {/* 2. PLANAR ORNAMENTS SUBSECTION HEADER & GRID */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', marginTop: '1rem' }}>
              <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1rem', fontWeight: 700, color: '#4fc3f7', letterSpacing: '0.05em' }}>
                Planar Ornaments
              </span>
              <span style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>▼</span>
            </div>
            {renderFilterGridGroup(planarGroups, selectedSetIds, setSelectedSetIds)}

          </div>

            {/* Inside the modal action footer, change the reset condition */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
            {selectedSetIds.length > 0 && (
              <button 
                onClick={() => setSelectedSetIds([])} // Clears the array to reset
                style={{ background: 'none', border: 'none', color: 'var(--color-red)', cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}
              >
                Reset Filter
              </button>
            )}
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ background: 'var(--color-accent)', color: '#000', fontWeight: 800, padding: '0.6rem 1.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif' }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
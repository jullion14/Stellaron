import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRawCharacters, fetchRawLightCones } from '@/api/staticData';
import { mapCharacter } from '@/api/characterMapper';
import { useBuilderStore } from '@/store/builderStore';
import { RelicInput } from '@/components/builder/RelicInput';
import { CharacterPreviewPanel } from '@/components/builder/CharacterPreviewPanel';
import { StatsSummary } from '@/components/builder/StatsSummary';
import { ShowcaseCharacterCard } from '@/components/builder/ShowcaseCharacterCard';
import { mapMihomoCharacterToBuild } from '@/api/mihomo';
import { ELEMENT_COLORS, PATH_LABELS, PATH_ICON_URLS } from '@/utils/constants';
import type { Character } from '@/types';

type BuildSourceMode = 'manual' | 'uid';

// ─── Character Picker Modal ───────────────────────────────────────────────────

function CharacterPickerModal({
  characters,
  onSelect,
  onClose,
}: {
  characters: Character[];
  onSelect: (c: Character) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return characters;
    return characters.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [characters, search]);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5)' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text)', margin: 0, marginBottom: '0.75rem' }}>Select Character Base</h3>
          <input type="text" placeholder="Search characters..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.625rem 0.875rem', color: 'var(--color-text)', fontFamily: 'inherit', fontSize: '0.875rem', outline: 'none' }} autoFocus />
        </div>
        <div style={{ padding: '0.5rem', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {filtered.map((c) => (
              <button key={c.id} onClick={() => onSelect(c)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.625rem 0.75rem', background: 'transparent', border: 'none', borderRadius: '8px', color: 'var(--color-text)', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', overflow: 'hidden', border: `1px solid ${ELEMENT_COLORS[c.element]}40` }}>
                  <img src={c.iconUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontWeight: '500', fontSize: '0.937rem' }}>{c.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.125rem' }}>{c.element} · {PATH_LABELS[c.path] || c.path}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Light Cone Picker Modal ──────────────────────────────────────────────────

const ASSET = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master';
const RARITY_COLORS: Record<number, string> = { 5: '#c8a84b', 4: '#9b7ff5', 3: '#4b9cc8' };

function LightConePickerModal({ onSelect, onClose }: { onSelect: (lc: any) => void; onClose: () => void; }) {
  const [search, setSearch] = useState('');
  const [filterPath, setFilterPath] = useState('All');
  const [filterRarity, setFilterRarity] = useState('All');

  const { data: lightCones = [], isLoading } = useQuery({
    queryKey: ['light-cones-picker'],
    queryFn: async () => {
      const raw = await fetchRawLightCones();
      const PATH_MAP: Record<string, string> = { Rogue: 'TheHunt', Mage: 'Erudition', Warlock: 'Nihility', Priest: 'Abundance', Warrior: 'Destruction', Shaman: 'Harmony', Knight: 'Preservation', Memory: 'Remembrance', Joy: 'Elation' };
      return Object.values(raw).map((lc: any) => ({
        ...lc, path: PATH_MAP[lc.path] ?? lc.path, portraitUrl: `${ASSET}/${lc.portrait}`, iconUrl: `${ASSET}/${lc.icon}`,
      })).sort((a: any, b: any) => b.rarity - a.rarity || a.name.localeCompare(b.name));
    },
    staleTime: 1000 * 60 * 10,
  });

  // Updated filter logic to include search, path, and rarity
  const filtered = useMemo(() => {
    let res = lightCones as any[];
    if (search) res = res.filter((lc) => lc.name.toLowerCase().includes(search.toLowerCase()));
    if (filterPath !== 'All') res = res.filter((lc) => lc.path === filterPath);
    if (filterRarity !== 'All') res = res.filter((lc) => lc.rarity === parseInt(filterRarity));
    return res;
  }, [lightCones, search, filterPath, filterRarity]);

  // Available filter options
  const paths = ['All', 'Destruction', 'TheHunt', 'Erudition', 'Harmony', 'Nihility', 'Preservation', 'Abundance','Remembrance','Elation'];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', width: '100%', maxWidth: '820px', maxHeight: '82vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
        
        {/* ── UPDATED HEADER WITH FILTERS ── */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.875rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.125rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text)' }}>Select Light Cone</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}>×</button>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input autoFocus type="text" placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: '200px', background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text)', padding: '0.45rem 0.75rem', fontSize: '0.875rem', outline: 'none' }} />
            
            <select value={filterPath} onChange={(e) => setFilterPath(e.target.value)} style={{ width: '140px', background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text)', padding: '0.45rem 0.5rem', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}>
              {paths.map(p => (
                <option key={p} value={p}>{p === 'All' ? 'All Paths' : PATH_LABELS[p as keyof typeof PATH_LABELS] || p}</option>
              ))}
            </select>

            <select value={filterRarity} onChange={(e) => setFilterRarity(e.target.value)} style={{ width: '120px', background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text)', padding: '0.45rem 0.5rem', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}>
              <option value="All">All Rarities</option>
              <option value="5">5 Star ★</option>
              <option value="4">4 Star ★</option>
              <option value="3">3 Star ★</option>
            </select>
          </div>
        </div>

        {/* ── STABILIZED GRID LAYOUT ── */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gridAutoRows: 'max-content', gap: '0.75rem' }}>
          {isLoading && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--color-muted)' }}>Loading light cones…</div>}
          
          {(filtered as any[]).map((lc) => {
            const rc = RARITY_COLORS[lc.rarity] ?? 'var(--color-muted)';
            return (
              <div 
                key={lc.id} 
                onClick={() => onSelect(lc)}
                role="button"
                tabIndex={0}
                style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', padding: 0, transition: 'border-color 0.15s, transform 0.15s' }} 
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = rc; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }} 
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(lc); }}
              >
                <div style={{ height: '2px', width: '100%', background: `linear-gradient(90deg, ${rc}, ${rc}88)`, flexShrink: 0 }} />
                <div style={{ width: '100%', aspectRatio: '3/4', background: 'var(--color-surface)', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={lc.portraitUrl} alt={lc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2'; }} />
                </div>
                <div style={{ padding: '0.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.25rem', minWidth: 0 }}>
                  <div style={{ minWidth: 0 }}>
                    {PATH_ICON_URLS[lc.path as keyof typeof PATH_ICON_URLS] && <img src={PATH_ICON_URLS[lc.path as keyof typeof PATH_ICON_URLS]} alt={lc.path} style={{ width: '12px', height: '12px', opacity: 0.7, marginBottom: '2px', display: 'block' }} />}
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.72rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lc.name}</div>
                  </div>
                  <div style={{ fontSize: '0.6rem', color: rc, fontFamily: 'serif', letterSpacing: '-1px' }}>{'★'.repeat(lc.rarity)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Saved Build Card Component ────────────────────────────────────────────────

function SavedBuildCard({ build, onLoad, onDelete }: { build: any; onLoad: () => void; onDelete: () => void; }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={onLoad}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{build.characterName}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.125rem' }}>Lv. {build.level} · E{build.eidolonLevel}</div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem', fontSize: '0.875rem' }}>Delete</button>
    </div>
  );
}

// ─── Main Builder Page ─────────────────────────────────────────────────────────

export default function Builder() {
  const {
    activeBuild, savedBuilds, initializeBuild, setLevel, setEidolonLevel,
    setLightCone, loadBuild, saveBuild, deleteBuild, clearBuild, hydrateFromMihomo
  } = useBuilderStore();

  const [activeTab, setActiveTab]       = useState<BuildSourceMode>('manual');
  const [pickerOpen, setPickerOpen]     = useState(false);
  const [lcPickerOpen, setLcPickerOpen] = useState(false);
  const [uidInput, setUidInput]         = useState('');

  const { data: rawChars } = useQuery({
    queryKey: ['rawCharacters'],
    queryFn: fetchRawCharacters,
  });

  const characters = useMemo<Character[]>(() => {
    // Convert rawChars from an object to an array if it isn't one already
    const list = Array.isArray(rawChars) ? rawChars : Object.values(rawChars || {});
    return list.map(mapCharacter);
  }, [rawChars]);

  const { data: profileData, refetch: fetchProfile, isFetching: isProfileFetching, error: profileError } = useQuery({
    queryKey: ['mihomoProfile', uidInput],
    queryFn: async () => {
      if (!uidInput) return null;
      const res = await fetch(`/api/mihomo/sr_info_parsed/${uidInput}?lang=en`);
      if (!res.ok) throw new Error('UID context showcase data not found');
      return await res.json();
    },
    enabled: false,
  });

  const handleSelectCharacter = (c: Character) => {
    initializeBuild({ id: c.id, name: c.name, element: c.element, path: c.path });
    setPickerOpen(false);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem 3rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ── HEADER ── */}
      <div>
        <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', textTransform: 'uppercase', color: 'var(--color-text)', margin: 0 }}>
          Damage Calculator
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', margin: '0.25rem 0 0 0' }}>
          Configure and test your favourite character!
        </p>
      </div>

      {/* ── SOURCE TABS (Manual vs UID) ── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <button
            onClick={() => setActiveTab('manual')}
            style={{ padding: '0.5rem 1rem', background: activeTab === 'manual' ? 'var(--color-accent)' : 'transparent', color: activeTab === 'manual' ? '#000' : 'var(--color-muted)', border: 'none', borderRadius: '6px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.15s' }}
          >
            Manual Sandbox
          </button>
          <button
            onClick={() => setActiveTab('uid')}
            style={{ padding: '0.5rem 1rem', background: activeTab === 'uid' ? 'var(--color-accent)' : 'transparent', color: activeTab === 'uid' ? '#000' : 'var(--color-muted)', border: 'none', borderRadius: '6px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.15s' }}
          >
            Mihomo Sync
          </button>
        </div>

        {/* ── TAB CONTENT AREAS ── */}
        {activeTab === 'manual' ? (
          // MANUAL TAB: Only show the "Select Base" banner if there isn't an active character yet
          !activeBuild ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>Start a custom build from scratch by selecting an asset baseline.</span>
              <button
                onClick={() => setPickerOpen(true)}
                style={{ background: 'var(--color-panel)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.5rem 1rem', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
              >
                + Select Base Character
              </button>
            </div>
          ) : (
            <div style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
              You are actively tuning parameters in the workspace. Use the panel on the left to swap characters seamlessly.
            </div>
          )
        ) : (
          // MIHOMO SYNC TAB: Stays fully unlocked and visible no matter what
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text" placeholder="Enter Account UID..." value={uidInput} onChange={(e) => setUidInput(e.target.value)}
                style={{ flex: 1, maxWidth: '300px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.5rem', color: 'var(--color-text)', fontSize: '0.812rem', outline: 'none' }}
              />
              <button
                onClick={() => fetchProfile()} disabled={isProfileFetching}
                style={{ background: 'var(--color-panel)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0 1rem', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '0.812rem', cursor: 'pointer' }}
              >
                {isProfileFetching ? 'Syncing...' : 'Fetch Profile'}
              </button>
            </div>
            
            {profileError && <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>Failed to fetch player details. Please check UID.</div>}
            
            {profileData?.characters && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                {profileData.characters.map((char: any) => (
                  <ShowcaseCharacterCard
                    key={char.id}
                    char={char}
                    onLoad={() => {
                      hydrateFromMihomo(mapMihomoCharacterToBuild(char));
                      setActiveTab('manual'); 
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* ── WORKSPACE GRID ── */}
      {activeTab === 'manual' && (
        <div style={{ display: 'grid', gridTemplateColumns: activeBuild ? '1fr 320px' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Left Side: Sandbox Configuration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {activeBuild && (
              <>
                {/* Level / Eidolon Adjusters */}
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
                  <div>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      {activeBuild.characterName}
                    </div>
                    <div style={{ fontSize: '0.812rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>
                      {activeBuild.characterElement} · {PATH_LABELS[activeBuild.characterPath] || activeBuild.characterPath}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Level
                      <input type="number" min={1} max={80} value={activeBuild.level} onChange={(e) => setLevel(Math.max(1, Math.min(80, parseInt(e.target.value) || 1)))} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.375rem 0.5rem', color: 'var(--color-text)', width: '64px', outline: 'none' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Eidolon
                      <input type="number" min={0} max={6} value={activeBuild.eidolonLevel} onChange={(e) => setEidolonLevel(Math.max(0, Math.min(6, parseInt(e.target.value) || 0)))} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.375rem 0.5rem', color: 'var(--color-text)', width: '56px', outline: 'none' }} />
                    </label>
                  </div>
                </div>

                {/* ── Split Panel: Preview & Sandbox ── */}
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', width: '100%' }}>
                  <CharacterPreviewPanel onOpenLightConePicker={() => setLcPickerOpen(true)} />
                  <RelicInput />
                </div>
              </>
            )}
          </div>

          {/* Right Side: Stats Panel & Saves */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeBuild && <StatsSummary />}

            {activeBuild && (
              <button onClick={saveBuild} style={{ background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.625rem', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                Save Build
              </button>
            )}

            {savedBuilds.length > 0 && (
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.25rem' }}>
                <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: '0.75rem' }}>
                  Saved Builds ({savedBuilds.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {savedBuilds.map((b) => (
                    <SavedBuildCard key={b.id} build={b} onLoad={() => loadBuild(b.id)} onDelete={() => deleteBuild(b.id)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {pickerOpen && <CharacterPickerModal characters={characters} onSelect={handleSelectCharacter} onClose={() => setPickerOpen(false)} />}
      {lcPickerOpen && <LightConePickerModal onSelect={(lc) => { setLightCone(lc.id, lc.name, activeBuild?.lightConeSuperimposition ?? 1); setLcPickerOpen(false); }} onClose={() => setLcPickerOpen(false)} />}
    </div>
  );
}
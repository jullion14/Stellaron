import { create } from 'zustand';
import type { Character, LightCone, BuilderBuild, Relic, RelicSlot } from '@/types';

interface CharacterStore {
  // Existing baseline state
  characters: Character[];
  lightCones: LightCone[];
  setCharacters: (chars: Character[]) => void;
  setLightCones: (lcs: LightCone[]) => void;
  detailCache: Record<string, Character>;
  cacheDetail: (char: Character) => void;
  selectedId: string | null;
  searchQuery: string;
  selectCharacter: (id: string | null) => void;
  setSearchQuery: (q: string) => void;

  // ─── Builder Workspace Engine State ───
  activeBuild: BuilderBuild | null;
  savedBuilds: BuilderBuild[];
  initializeBuild: (character: Character) => void;
  updateBuildMeta: (fields: Partial<Pick<BuilderBuild, 'level' | 'eidolonLevel' | 'lightConeId' | 'lightConeSuperimposition' | 'notes'>>) => void;
  updateBuildSkills: (skills: Partial<BuilderBuild['skillLevels']>) => void;
  updateBuildRelic: (slot: RelicSlot, relic: Relic | null) => void;
  loadBuild: (id: string) => void;
  saveBuild: () => void;
  deleteBuild: (id: string) => void;
  hydrateBuildFromMihomo: (importedBuild: BuilderBuild) => void;
}

// Named export 'useBuilderStore' to perfectly match imports in Builder.tsx and related views
export const useBuilderStore = create<CharacterStore>((set, get) => ({
  characters:   [],
  lightCones:   [],
  detailCache:  {},
  selectedId:   null,
  searchQuery:  '',

  setCharacters: (characters) => set({ characters }),
  setLightCones: (lightCones) => set({ lightCones }),
  cacheDetail:   (char) => set((s) => ({
    detailCache: { ...s.detailCache, [char.id]: char },
  })),
  selectCharacter: (selectedId) => set({ selectedId }),
  setSearchQuery:  (searchQuery) => set({ searchQuery }),

  // ─── Builder Implementation ───
  activeBuild: null,
  savedBuilds: [],

  initializeBuild: (character) => set({
    activeBuild: {
      id: crypto.randomUUID(),
      characterId: character.id,
      characterName: character.name,
      characterElement: character.element,
      characterPath: character.path,
      level: 80,
      eidolonLevel: 0,
      skillLevels: { normal: 1, skill: 1, ultimate: 1, talent: 1, technique: 1 },
      lightConeSuperimposition: 1,
      relics: {},
      notes: '',
      savedAt: new Date().toISOString()
    }
  }),

  updateBuildMeta: (fields) => set((s) => ({
    activeBuild: s.activeBuild ? { ...s.activeBuild, ...fields, savedAt: new Date().toISOString() } : null
  })),

  updateBuildSkills: (skills) => set((s) => ({
    activeBuild: s.activeBuild ? {
      ...s.activeBuild,
      skillLevels: { ...s.activeBuild.skillLevels, ...skills },
      savedAt: new Date().toISOString()
    } : null
  })),

  updateBuildRelic: (slot, relic) => set((s) => {
    if (!s.activeBuild) return {};
    const updatedRelics = { ...s.activeBuild.relics };
    if (relic === null) {
      delete updatedRelics[slot];
    } else {
      updatedRelics[slot] = relic;
    }
    return {
      activeBuild: { ...s.activeBuild, relics: updatedRelics, savedAt: new Date().toISOString() }
    };
  }),

  loadBuild: (id) => {
    const target = get().savedBuilds.find(b => b.id === id);
    if (target) set({ activeBuild: { ...target } });
  },

  saveBuild: () => {
    const { activeBuild, savedBuilds } = get();
    if (!activeBuild) return;

    const existingIndex = savedBuilds.findIndex(b => b.id === activeBuild.id);
    const updated = [...savedBuilds];

    if (existingIndex > -1) {
      updated[existingIndex] = { ...activeBuild, savedAt: new Date().toISOString() };
    } else {
      updated.push({ ...activeBuild });
    }
    set({ savedBuilds: updated });
  },

  deleteBuild: (id) => set((s) => ({
    savedBuilds: s.savedBuilds.filter(b => b.id !== id),
    activeBuild: s.activeBuild?.id === id ? null : s.activeBuild
  })),

  hydrateBuildFromMihomo: (importedBuild) => set({ activeBuild: importedBuild })
}));
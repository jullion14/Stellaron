import { create } from 'zustand';
import type { Character, LightCone } from '@/types';

interface CharacterStore {
  // List data
  characters: Character[];
  lightCones: LightCone[];
  setCharacters: (chars: Character[]) => void;
  setLightCones: (lcs: LightCone[]) => void;

  // Detail cache — keyed by character id, populated on demand
  detailCache: Record<string, Character>;
  cacheDetail: (char: Character) => void;

  // UI state
  selectedId: string | null;
  searchQuery: string;
  selectCharacter: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
}

export const useCharacterStore = create<CharacterStore>((set) => ({
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
}));
import { create } from 'zustand';
import type { BuilderBuild, Element, Path, Relic, RelicSlot } from '@/types';

interface BuilderState {
  // Current active sandboxed build workspace instance
  activeBuild: BuilderBuild | null;
  
  // Array cache tracking historical snapshots saved inside local browser storage
  savedBuilds: BuilderBuild[];

  // Core Orchestration Actions
  initializeBuild: (character: { id: string; name: string; element: Element; path: Path }) => void;
  setLevel: (level: number) => void;
  setEidolonLevel: (level: number) => void;
  setSkillLevel: (skill: keyof BuilderBuild['skillLevels'], level: number) => void;
  setLightCone: (id: string, name: string, superimposition: number) => void;
  setRelic: (slot: RelicSlot, relic: Relic) => void;
  removeRelic: (slot: RelicSlot) => void;
  setNotes: (notes: string) => void;
  
  // Collection Management Actions
  saveBuild: () => void;
  loadBuild: (buildId: string) => void;
  deleteBuild: (buildId: string) => void;
  clearBuild: () => void;
  hydrateFromMihomo: (data: {
    characterId: string;
    characterName: string;
    characterElement: Element;
    characterPath: Path;
    level: number;
    eidolonLevel: number;
    skillLevels: BuilderBuild['skillLevels'];
    lightConeId?: string;
    lightConeName?: string;
    lightConeSuperimposition: number;
    relics: Partial<Record<RelicSlot, Relic>>;
  }) => void;
}

export const useBuilderStore = create<BuilderState>()((set, get) => ({
  activeBuild: null,
  savedBuilds: (() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('stellaron_builds');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })(),

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
      notes: 'Custom Simulation Build',
      savedAt: new Date().toISOString()
 
    }
  }),

  setLevel: (level) => set((s) => ({
    activeBuild: s.activeBuild ? { ...s.activeBuild, level } : null
  })),

  setEidolonLevel: (eidolonLevel) => set((s) => ({
    activeBuild: s.activeBuild ? { ...s.activeBuild, eidolonLevel } : null
  })),

  setSkillLevel: (skill, level) => set((s) => {
    if (!s.activeBuild) return {};
    return {
      activeBuild: {
        ...s.activeBuild,
        skillLevels: { ...s.activeBuild.skillLevels, [skill]: level }
      }
    };
  }),

  setLightCone: (id, name, superimposition) => set((s) => ({
    activeBuild: s.activeBuild ? {
      ...s.activeBuild,
      lightConeId: id,
      lightConeName: name,
      lightConeSuperimposition: superimposition
    } : null
  })),

  setRelic: (slot, relic) => set((s) => {
    if (!s.activeBuild) return {};
    return {
      activeBuild: {
        ...s.activeBuild,
        relics: { ...s.activeBuild.relics, [slot]: relic }
      }
    };
  }),

  removeRelic: (slot) => set((s) => {
    if (!s.activeBuild) return {};
    const updatedRelics = { ...s.activeBuild.relics };
    delete updatedRelics[slot];
    return {
      activeBuild: { ...s.activeBuild, relics: updatedRelics }
    };
  }),

  setNotes: (notes) => set((s) => ({
    activeBuild: s.activeBuild ? { ...s.activeBuild, notes } : null
  })),

  saveBuild: () => {
    const { activeBuild, savedBuilds } = get();
    if (!activeBuild) return;

    const existingIndex = savedBuilds.findIndex((b) => b.id === activeBuild.id);
    const updated = [...savedBuilds];

    const finalizedBuild: BuilderBuild = {
      ...activeBuild,
      savedAt: new Date().toISOString()
    };

    if (existingIndex > -1) {
      updated[existingIndex] = finalizedBuild;
    } else {
      updated.push(finalizedBuild);
    }

    localStorage.setItem('stellaron_builds', JSON.stringify(updated));
    set({ savedBuilds: updated, activeBuild: finalizedBuild });
    alert(`Build for "${finalizedBuild.characterName}" saved successfully!`);
  },

  loadBuild: (buildId) => {
    const { savedBuilds } = get();
    const target = savedBuilds.find((b) => b.id === buildId);
    if (target) {
      set({ activeBuild: { ...target } });
    }
  },

  deleteBuild: (buildId) => set((s) => {
    const updated = s.savedBuilds.filter((b) => b.id !== buildId);
    localStorage.setItem('stellaron_builds', JSON.stringify(updated));
    return {
      savedBuilds: updated,
      activeBuild: s.activeBuild?.id === buildId ? null : s.activeBuild
    };
  }),

  clearBuild: () => set({ activeBuild: null }),

  hydrateFromMihomo: (data) => set(() => {
    // Generate a fresh unique session ID for this newly hydrated workspace instance
    const freshBuildId = `mihomo_${data.characterId}_${Date.now()}`;

    return {
      activeBuild: {
        id: freshBuildId,
        characterId: data.characterId,
        characterName: data.characterName,
        characterElement: data.characterElement,
        characterPath: data.characterPath,
        level: data.level,
        eidolonLevel: data.eidolonLevel,
        skillLevels: { ...data.skillLevels },
        lightConeId: data.lightConeId,
        lightConeName: data.lightConeName,
        lightConeSuperimposition: data.lightConeSuperimposition,
        relics: { ...data.relics },
        notes: 'Imported from live UID profile', // Hardcoded fallback since it's not in the payload
        savedAt: new Date().toISOString() // Satisfies the required BuilderBuild property
      }
    };
  }),
}));
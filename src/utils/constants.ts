import type { Element, Path } from '@/types';

export const ALL_ELEMENTS: Element[] = ['Fire', 'Ice', 'Lightning', 'Wind', 'Quantum', 'Imaginary', 'Physical'];
export const ALL_PATHS: Path[] = ['Destruction', 'TheHunt', 'Erudition', 'Harmony', 'Nihility', 'Preservation', 'Abundance', 'Remembrance', 'Elation'];
export const ASC_CAPS = [20, 20, 30, 40, 50, 60, 70, 80];

export const ELEMENT_COLORS: Record<Element, string> = {
  Fire:      '#fb923c',
  Ice:       '#67e8f9',
  Lightning: '#c084fc',
  Wind:      '#4ade80',
  Quantum:   '#818cf8',
  Imaginary: '#fbbf24',
  Physical:  '#94a3b8',
};

export const ELEMENT_ICONS: Record<Element, string> = {
  Fire:      '🔥',
  Ice:       '❄️',
  Lightning: '⚡',
  Wind:      '🌪️',
  Quantum:   '✨',
  Imaginary: '🌀',
  Physical:  '⚪',
};

export const PATH_COLORS: Record<Path, string> = {
  TheHunt:     '#a78bfa',
  Erudition:   '#60a5fa',
  Nihility:    '#f472b6',
  Abundance:   '#34d399',
  Destruction: '#fb923c',
  Harmony:     '#fbbf24',
  Preservation:'#38bdf8',
  Remembrance: '#c084fc',
  Elation:     '#f9a8d4',
};

export const PATH_LABELS: Record<Path, string> = {
  TheHunt:     'The Hunt',
  Erudition:   'Erudition',
  Nihility:    'Nihility',
  Abundance:   'Abundance',
  Destruction: 'Destruction',
  Harmony:     'Harmony',
  Preservation:'Preservation',
  Remembrance: 'Remembrance',
  Elation:     'Elation',
};

// Icon URLs from StarRailRes
const ICON_BASE = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master';

export const ELEMENT_ICON_URLS: Record<Element, string> = {
  Fire:      `${ICON_BASE}/icon/element/Fire.png`,
  Ice:       `${ICON_BASE}/icon/element/Ice.png`,
  Lightning: `${ICON_BASE}/icon/element/Thunder.png`,
  Wind:      `${ICON_BASE}/icon/element/Wind.png`,
  Quantum:   `${ICON_BASE}/icon/element/Quantum.png`,
  Imaginary: `${ICON_BASE}/icon/element/Imaginary.png`,
  Physical:  `${ICON_BASE}/icon/element/Physical.png`,
};

export const PATH_ICON_URLS: Record<Path, string> = {
  TheHunt:     `${ICON_BASE}/icon/path/Hunt.png`,
  Erudition:   `${ICON_BASE}/icon/path/Erudition.png`,
  Nihility:    `${ICON_BASE}/icon/path/Nihility.png`,
  Abundance:   `${ICON_BASE}/icon/path/Abundance.png`,
  Destruction: `${ICON_BASE}/icon/path/Destruction.png`,
  Harmony:     `${ICON_BASE}/icon/path/Harmony.png`,
  Preservation:`${ICON_BASE}/icon/path/Preservation.png`,
  Remembrance: `${ICON_BASE}/icon/path/Remembrance.png`,
  Elation:     `${ICON_BASE}/icon/path/Elation.png`,
};
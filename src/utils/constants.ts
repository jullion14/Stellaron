import type { Element, Path } from '@/types';

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

import type { Character } from '@/types';
import { useNavigate } from 'react-router-dom';
import { ELEMENT_COLORS, PATH_LABELS, PATH_COLORS } from '@/utils/constants';

export function CharacterCard({ character }: { character: Character }) {
  const elementColor = ELEMENT_COLORS[character.element];
  const pathColor    = PATH_COLORS[character.path];
  const pathLabel    = PATH_LABELS[character.path];
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/characters/${character.id}`)}
      className="group relative flex flex-col overflow-hidden text-left transition-all duration-200"
      style={{
        background: 'var(--color-panel)',
        border: '1px solid var(--color-border)',
        borderRadius: '10px',
        // width: '140px',
        width: '100%',
      }}
    >
      {/* Rarity bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: character.rarity === 5
            ? 'linear-gradient(90deg, #c8a84b, #f5d78e, #c8a84b)'
            : 'linear-gradient(90deg, #9b7ff5, #c4b0ff)',
        }}
      />

      {/* Element dot */}
      <div
        className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full"
        style={{ background: elementColor, boxShadow: `0 0 6px ${elementColor}88` }}
      />

      {/* Portrait */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: '140px', background: `linear-gradient(160deg, #0e1521 0%, #131c2e 100%)` }}
      >
        <img
          src={character.iconUrl}
          alt={character.name}
          className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
        />
      </div>

      {/* Info */}
      <div className="px-2.5 py-2">
        <p
          className="text-sm font-semibold leading-tight truncate"
          style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--color-text)' }}
        >
          {character.name}
        </p>
        <p
          className="text-xs mt-0.5"
          style={{ color: pathColor }}
        >
          {pathLabel}
        </p>
      </div>

      {/* Hover overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top, ${elementColor}18, transparent 70%)` }}
      />
    </button>
  );
}

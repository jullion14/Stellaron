// Parses "#1[i]% of ATK" style desc strings, substituting real values from params
// #N[i]   → formatted as integer percentage if fractional or followed by % (0.5 → 50), otherwise raw integer (5 → 5)
// #N[f1]  → formatted to 1 decimal place (scaled if percentage)
// #N[p]   → formatted as % with 1 decimal

export function parseSkillDesc(desc: string, params: number[]): string {
  return desc.replace(/#(\d+)\[([^\]]+)\]/g, (fullMatch, indexStr, format, offset) => {
    const index = parseInt(indexStr, 10) - 1;
    const value = params[index] ?? 0;

    // Look ahead to see if a '%' sign follows this token (ignoring spaces)
    const nextChars = desc.slice(offset + fullMatch.length, offset + fullMatch.length + 5).trim();
    const hasPercent = nextChars.startsWith('%');

    if (format === 'i') {
      // It's a percentage if it's a raw decimal fraction (< 1) OR explicitly followed by a % sign
      if (value < 1 || hasPercent) {
        return String(Math.round(value * 100));
      }
      // Otherwise, it's a flat counter (like 5 Energy or 2 Turns)
      return String(Math.round(value));
    }

    if (format === 'f1') {
      if (value < 1 || hasPercent) {
        return (value * 100).toFixed(1);
      }
      return value.toFixed(1);
    }

    if (format === 'p') {
      return `${(value * 100).toFixed(1)}%`;
    }

    // fallback
    return String(value);
  })
  .replace(/\{nickname\}/gi, 'Trailblazer');
}

// export function getMaxSkillLevel(skillType: string): number {
//   if (skillType === 'Basic ATK') return 9;  // Talent/Basic go to 9 with traces
//   if (skillType === 'Technique') return 1;
//   return 15; // Skill, Ultimate go to 15
// }
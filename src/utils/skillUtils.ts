// Parses "#1[i]% of ATK" style desc strings, substituting real values from params
// #N[i]   → params[N-1] formatted as integer percentage (0.5 → 50)
// #N[f1]  → params[N-1] formatted to 1 decimal place
// #N[p]   → params[N-1] formatted as % with 1 decimal
// #N[i]%  → already has % in string, just substitute the number

export function parseSkillDesc(desc: string, params: number[]): string {
  return desc.replace(/#(\d+)\[([^\]]+)\]/g, (_, indexStr, format) => {
    const index = parseInt(indexStr, 10) - 1;
    const value = params[index] ?? 0;

    if (format === 'i') {
      // If value looks like a multiplier (< 10), treat as percentage
      return value < 10 ? String(Math.round(value * 100)) : String(Math.round(value));
    }
    if (format === 'f1') {
      return value < 10 ? (value * 100).toFixed(1) : value.toFixed(1);
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
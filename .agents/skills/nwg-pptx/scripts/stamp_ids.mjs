export function stampIds(html, idMap, slideId) {
  const counters = new Map();
  let output = html.replace(/\s+id="[^"]*"/g, '').replace(/\s+data-feedback="true"/g, '');
  for (const entry of idMap.elements || []) {
    const role = entry.role;
    const escaped = role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(<[a-zA-Z][^>]*\\sdata-role=["']${escaped}["'][^>]*)(>)`, 'g');
    output = output.replace(re, (match, open, close) => {
      const next = (counters.get(role) || 0) + 1;
      counters.set(role, next);
      const suffix = entry.indexed || next > 1 ? `-${next}` : '';
      return `${open} id="${slideId}--${role}${suffix}" data-feedback="true"${close}`;
    });
  }
  return output;
}

export function elementIdToRole(elementId) {
  const parts = String(elementId || '').split('--');
  if (parts.length < 2) return null;
  return parts.slice(1).join('--').replace(/-\d+$/, '');
}

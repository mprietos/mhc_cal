export function diffMatches(prev, next) {
  const prevMap = new Map(prev.map((m) => [m.id, m]));
  const nextMap = new Map(next.map((m) => [m.id, m]));

  const added = [];
  const removed = [];
  const changed = [];

  for (const [id, m] of nextMap) {
    if (!prevMap.has(id)) {
      added.push(m);
    } else {
      const before = prevMap.get(id);
      if (JSON.stringify(before) !== JSON.stringify(m)) {
        changed.push({ before, after: m });
      }
    }
  }

  for (const [id, m] of prevMap) {
    if (!nextMap.has(id)) removed.push(m);
  }

  return { added, removed, changed };
}

export function hasChanges({ added, removed, changed }) {
  return added.length > 0 || removed.length > 0 || changed.length > 0;
}

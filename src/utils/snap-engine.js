function numberOr(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function collectObjectTargets(object) {
  const x = numberOr(object.x, 0);
  const y = numberOr(object.y, 0);
  const width = numberOr(object.width, 0);
  const height = numberOr(object.height, 0);
  return [
    { axis: 'x', value: x, type: 'object-edge', objectId: object.id },
    { axis: 'x', value: x + (width / 2), type: 'object-midpoint', objectId: object.id },
    { axis: 'x', value: x + width, type: 'object-edge', objectId: object.id },
    { axis: 'y', value: y, type: 'object-edge', objectId: object.id },
    { axis: 'y', value: y + (height / 2), type: 'object-midpoint', objectId: object.id },
    { axis: 'y', value: y + height, type: 'object-edge', objectId: object.id }
  ];
}

function chooseMatch(value, targets, tolerance) {
  const priority = { guide: 0, 'object-midpoint': 1, 'object-edge': 2, grid: 3 };
  const matches = targets
    .map((target) => ({ ...target, distance: Math.abs(value - target.value) }))
    .filter((target) => target.distance <= tolerance)
    .sort((a, b) => (a.distance - b.distance) || ((priority[a.type] ?? 9) - (priority[b.type] ?? 9)));
  return matches[0] || null;
}

export function createSnapEngine({
  gridSize = 8,
  tolerance = 5,
  guides = [],
  objects = []
} = {}) {
  const safeGrid = Math.max(1, Number(gridSize) || 8);
  const safeTolerance = Math.max(0, Number(tolerance) || 0);
  const guideTargets = (Array.isArray(guides) ? guides : []).map((guide) => ({
    axis: guide.axis === 'y' ? 'y' : 'x',
    value: numberOr(guide.value, 0),
    type: 'guide'
  }));
  const objectTargets = (Array.isArray(objects) ? objects : []).flatMap(collectObjectTargets);

  return {
    snapPoint(point = {}, options = {}) {
      const excludeIds = new Set(options.excludeIds || []);
      const x = numberOr(point.x, 0);
      const y = numberOr(point.y, 0);
      const candidates = [
        { axis: 'x', value: Math.round(x / safeGrid) * safeGrid, type: 'grid' },
        { axis: 'y', value: Math.round(y / safeGrid) * safeGrid, type: 'grid' },
        ...guideTargets,
        ...objectTargets.filter((target) => !excludeIds.has(target.objectId))
      ];
      const xMatch = chooseMatch(x, candidates.filter((target) => target.axis === 'x'), safeTolerance);
      const yMatch = chooseMatch(y, candidates.filter((target) => target.axis === 'y'), safeTolerance);
      const matches = [xMatch, yMatch].filter(Boolean);
      return {
        point: {
          x: xMatch ? xMatch.value : x,
          y: yMatch ? yMatch.value : y
        },
        matches
      };
    }
  };
}

export function getSmartGuideLines(matches = []) {
  return (Array.isArray(matches) ? matches : [])
    .filter((match) => match.type !== 'grid')
    .map((match) => ({
      axis: match.axis,
      value: match.value,
      type: match.type,
      objectId: match.objectId || null
    }));
}

import { composeMatrix } from './math-utils.js';

export const DESIGN_DENSITY = {
  compact: { space: 8, row: 34, label: 'Compact' },
  balanced: { space: 12, row: 42, label: 'Balanced' },
  spacious: { space: 18, row: 52, label: 'Spacious' }
};

export const DESIGN_PRESETS = {
  workbench: {
    surface: '#111318',
    panel: '#1A1D24',
    ink: '#F5F5F7',
    accent: '#0A84FF',
    border: '#343842',
    density: 'balanced',
    radius: 8,
    elevation: 2,
    fontSize: 14
  },
  document: {
    surface: '#F5F5F7',
    panel: '#FFFFFF',
    ink: '#17181C',
    accent: '#0066CC',
    border: '#D6D8DE',
    density: 'spacious',
    radius: 6,
    elevation: 1,
    fontSize: 15
  },
  terminal: {
    surface: '#050608',
    panel: '#0D1117',
    ink: '#F0F3F6',
    accent: '#4CD964',
    border: '#30363D',
    density: 'compact',
    radius: 4,
    elevation: 0,
    fontSize: 13
  }
};

export const DEFAULT_VECTOR_VARIABLES = {
  '--vector-fill': '#0A84FF',
  '--vector-accent': '#4CD964',
  '--vector-stroke': '#F5F5F7',
  '--vector-muted': '#343842'
};

export const DEFAULT_VECTOR_BACKGROUND = {
  type: 'solid',
  start: '#050608',
  end: '#1A1D24',
  angle: 0
};

export const VECTOR_SHAPE_TYPES = ['rect', 'rounded-rect', 'circle', 'ellipse', 'line', 'polygon', 'star', 'path', 'text'];

const VECTOR_DEFAULTS = {
  rect: { x: 80, y: 70, width: 180, height: 110, rx: 10 },
  'rounded-rect': { x: 80, y: 70, width: 180, height: 110, rx: 24 },
  circle: { cx: 170, cy: 125, r: 64 },
  ellipse: { cx: 170, cy: 125, rx: 92, ry: 54 },
  line: { x1: 72, y1: 80, x2: 270, y2: 172 },
  polygon: { points: '170,46 280,186 60,186' },
  star: { cx: 170, cy: 125, outerRadius: 76, innerRadius: 34, pointCount: 5 },
  path: { d: 'M 80 180 C 130 40 230 40 280 180 Z' },
  text: { x: 90, y: 132, text: 'Vector', fontSize: 34 }
};

export function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
}

function escapeSvg(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function numberValue(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function attr(name, value) {
  if (value === undefined || value === null || value === '') return '';
  return ` ${name}="${escapeSvg(value)}"`;
}

function normalizeHexColor(value, fallback) {
  const normalized = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized : fallback;
}

function sanitizeSvgId(value) {
  return String(value || 'shape').replace(/[^\w-]+/g, '-');
}

function gradientVector(angle = 0) {
  const radians = ((numberValue(angle, 0) - 90) * Math.PI) / 180;
  const x = Math.cos(radians);
  const y = Math.sin(radians);
  return {
    x1: ((1 - x) / 2) * 100,
    y1: ((1 - y) / 2) * 100,
    x2: ((1 + x) / 2) * 100,
    y2: ((1 + y) / 2) * 100
  };
}

function buildVectorBackground(background = DEFAULT_VECTOR_BACKGROUND) {
  const type = ['transparent', 'solid', 'linear', 'radial'].includes(background.type) ? background.type : DEFAULT_VECTOR_BACKGROUND.type;
  if (type === 'transparent') {
    return { defs: '', fill: 'transparent' };
  }
  const start = normalizeHexColor(background.start, DEFAULT_VECTOR_BACKGROUND.start);
  if (type === 'solid') {
    return { defs: '', fill: start };
  }
  const end = normalizeHexColor(background.end, DEFAULT_VECTOR_BACKGROUND.end);
  if (type === 'radial') {
    return {
      defs: `<defs><radialGradient id="vector-background-gradient" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="${escapeSvg(start)}"/><stop offset="100%" stop-color="${escapeSvg(end)}"/></radialGradient></defs>`,
      fill: 'url(#vector-background-gradient)'
    };
  }
  const angle = numberValue(background.angle, 0);
  const radians = ((angle - 90) * Math.PI) / 180;
  const x = Math.cos(radians);
  const y = Math.sin(radians);
  const x1 = ((1 - x) / 2) * 100;
  const y1 = ((1 - y) / 2) * 100;
  const x2 = ((1 + x) / 2) * 100;
  const y2 = ((1 + y) / 2) * 100;
  return {
    defs: `<defs><linearGradient id="vector-background-gradient" x1="${x1.toFixed(2)}%" y1="${y1.toFixed(2)}%" x2="${x2.toFixed(2)}%" y2="${y2.toFixed(2)}%"><stop offset="0%" stop-color="${escapeSvg(start)}"/><stop offset="100%" stop-color="${escapeSvg(end)}"/></linearGradient></defs>`,
    fill: 'url(#vector-background-gradient)'
  };
}

export function getVectorShapeCenter(shape = {}) {
  const type = VECTOR_SHAPE_TYPES.includes(shape.type) ? shape.type : 'rect';
  if (type === 'rect') {
    return {
      x: numberValue(shape.x, 0) + (numberValue(shape.width, 120) / 2),
      y: numberValue(shape.y, 0) + (numberValue(shape.height, 80) / 2)
    };
  }
  if (type === 'rounded-rect') {
    return {
      x: numberValue(shape.x, 0) + (numberValue(shape.width, 120) / 2),
      y: numberValue(shape.y, 0) + (numberValue(shape.height, 80) / 2)
    };
  }
  if (type === 'circle' || type === 'ellipse') {
    return { x: numberValue(shape.cx, 120), y: numberValue(shape.cy, 120) };
  }
  if (type === 'line') {
    return {
      x: (numberValue(shape.x1, 0) + numberValue(shape.x2, 200)) / 2,
      y: (numberValue(shape.y1, 0) + numberValue(shape.y2, 120)) / 2
    };
  }
  if (type === 'polygon') {
    const points = String(shape.points || VECTOR_DEFAULTS.polygon.points).trim().split(/\s+/)
      .map((point) => point.split(',').map(Number))
      .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
    if (points.length) {
      return {
        x: points.reduce((sum, [x]) => sum + x, 0) / points.length,
        y: points.reduce((sum, [, y]) => sum + y, 0) / points.length
      };
    }
  }
  if (type === 'star') {
    return { x: numberValue(shape.cx, 120), y: numberValue(shape.cy, 120) };
  }
  return { x: numberValue(shape.x ?? shape.cx ?? shape.x1, 0), y: numberValue(shape.y ?? shape.cy ?? shape.y1, 0) };
}

function getShapeFill(shape) {
  if (shape.fillMode === 'linear') return `url(#paint-${sanitizeSvgId(shape.id)})`;
  return shape.fill ?? 'var(--vector-fill)';
}

function commonVectorAttrs(shape) {
  const opacity = Math.max(0, Math.min(1, Number(shape.opacity ?? 1)));
  const rotate = numberValue(shape.rotate, 0);
  const center = getVectorShapeCenter(shape);
  return [
    attr('id', shape.id),
    attr('fill', getShapeFill(shape)),
    attr('stroke', shape.stroke ?? 'var(--vector-stroke)'),
    attr('stroke-width', numberValue(shape.strokeWidth, 2)),
    attr('opacity', opacity),
    rotate ? attr('transform', `rotate(${rotate} ${center.x} ${center.y})`) : ''
  ].join('');
}

export function createDesignVectorShape(type = 'rect', overrides = {}, index = 0) {
  const shapeType = VECTOR_SHAPE_TYPES.includes(type) ? type : 'rect';
  return {
    id: overrides.id || `vector-${shapeType}-${index + 1}`,
    type: shapeType,
    fill: overrides.fill || 'var(--vector-fill)',
    stroke: overrides.stroke || 'var(--vector-stroke)',
    strokeWidth: overrides.strokeWidth ?? 2,
    opacity: overrides.opacity ?? 1,
    rotate: overrides.rotate ?? 0,
    fillMode: overrides.fillMode || 'solid',
    fillStart: overrides.fillStart || '#FFFFFF',
    fillEnd: overrides.fillEnd || '#0A84FF',
    fillAngle: overrides.fillAngle ?? 0,
    ...VECTOR_DEFAULTS[shapeType],
    ...overrides
  };
}

function buildStarPoints(shape) {
  const count = Math.max(3, Math.round(numberValue(shape.pointCount, 5)));
  const cx = numberValue(shape.cx, 120);
  const cy = numberValue(shape.cy, 120);
  const outerRadius = Math.max(1, numberValue(shape.outerRadius, 64));
  const innerRadius = Math.max(1, numberValue(shape.innerRadius, outerRadius / 2));
  const points = [];
  for (let index = 0; index < count * 2; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = (-Math.PI / 2) + (index * Math.PI) / count;
    points.push(`${Number((cx + Math.cos(angle) * radius).toFixed(2))},${Number((cy + Math.sin(angle) * radius).toFixed(2))}`);
  }
  return points.join(' ');
}

export function buildVectorShapeSvg(shape = {}) {
  const type = VECTOR_SHAPE_TYPES.includes(shape.type) ? shape.type : 'rect';
  const base = commonVectorAttrs(shape);
  if (type === 'rect' || type === 'rounded-rect') {
    return `<rect${base}${attr('x', numberValue(shape.x, 0))}${attr('y', numberValue(shape.y, 0))}${attr('width', numberValue(shape.width, 120))}${attr('height', numberValue(shape.height, 80))}${attr('rx', numberValue(shape.rx, 0))}/>`;
  }
  if (type === 'circle') {
    return `<circle${base}${attr('cx', numberValue(shape.cx, 120))}${attr('cy', numberValue(shape.cy, 120))}${attr('r', numberValue(shape.r, 48))}/>`;
  }
  if (type === 'ellipse') {
    return `<ellipse${base}${attr('cx', numberValue(shape.cx, 120))}${attr('cy', numberValue(shape.cy, 120))}${attr('rx', numberValue(shape.rx, 80))}${attr('ry', numberValue(shape.ry, 48))}/>`;
  }
  if (type === 'line') {
    return `<line${commonVectorAttrs({ ...shape, fill: 'none' })}${attr('x1', numberValue(shape.x1, 0))}${attr('y1', numberValue(shape.y1, 0))}${attr('x2', numberValue(shape.x2, 200))}${attr('y2', numberValue(shape.y2, 120))}/>`;
  }
  if (type === 'polygon') {
    return `<polygon${base}${attr('points', shape.points || VECTOR_DEFAULTS.polygon.points)}/>`;
  }
  if (type === 'star') {
    return `<polygon${base}${attr('points', buildStarPoints(shape))}/>`;
  }
  if (type === 'path') {
    return `<path${base}${attr('d', shape.d || VECTOR_DEFAULTS.path.d)}/>`;
  }
  return `<text${base}${attr('x', numberValue(shape.x, 80))}${attr('y', numberValue(shape.y, 120))}${attr('font-size', numberValue(shape.fontSize, 32))} font-family="Inter, Arial, sans-serif">${escapeSvg(shape.text || 'Vector')}</text>`;
}

function buildShapePaintDefs(shapes) {
  return shapes
    .filter((shape) => shape.fillMode === 'linear')
    .map((shape) => {
      const vector = gradientVector(shape.fillAngle);
      const start = normalizeHexColor(shape.fillStart, '#FFFFFF');
      const end = normalizeHexColor(shape.fillEnd, '#0A84FF');
      return `<linearGradient id="paint-${sanitizeSvgId(shape.id)}" x1="${vector.x1.toFixed(2)}%" y1="${vector.y1.toFixed(2)}%" x2="${vector.x2.toFixed(2)}%" y2="${vector.y2.toFixed(2)}%"><stop offset="0%" stop-color="${escapeSvg(start)}"/><stop offset="100%" stop-color="${escapeSvg(end)}"/></linearGradient>`;
    })
    .join('');
}

export function buildDesignVectorSvg(config = {}) {
  const width = Math.max(1, Math.round(numberValue(config.width, 640)));
  const height = Math.max(1, Math.round(numberValue(config.height, 420)));
  const variables = { ...DEFAULT_VECTOR_VARIABLES, ...(config.variables || {}) };
  const style = Object.entries(variables)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ');
  const shapes = Array.isArray(config.shapes) && config.shapes.length
    ? config.shapes
    : [createDesignVectorShape('rect')];
  const background = buildVectorBackground(config.background);
  const shapeDefs = buildShapePaintDefs(shapes);
  const defs = [background.defs, shapeDefs].filter(Boolean).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="${escapeSvg(style)}">${defs ? `<defs>${defs.replace(/^<defs>|<\/defs>$/g, '')}</defs>` : ''}<rect width="100%" height="100%" fill="${escapeSvg(background.fill)}"/>${shapes.map(buildVectorShapeSvg).join('')}</svg>`;
}

export function createAnchorPoint(x = 0, y = 0, options = {}) {
  return {
    x: numberValue(x, 0),
    y: numberValue(y, 0),
    type: ['corner', 'smooth', 'symmetric'].includes(options.type) ? options.type : 'corner',
    handleIn: options.handleIn ? { ...options.handleIn } : null,
    handleOut: options.handleOut ? { ...options.handleOut } : null
  };
}

function normalizeNodeStyle(style = {}) {
  return {
    fills: Array.isArray(style.fills) ? style.fills.map((fill) => ({ ...fill })) : [{ color: style.fill || '#0A84FF', opacity: 1 }],
    strokes: Array.isArray(style.strokes) ? style.strokes.map((stroke) => ({ ...stroke })) : [{ color: style.stroke || '#F5F5F7', width: style.strokeWidth ?? 1 }],
    effects: Array.isArray(style.effects) ? style.effects.map((effect) => ({ ...effect })) : [],
    opacity: Math.max(0, Math.min(1, Number(style.opacity ?? 1))),
    blendMode: style.blendMode || 'normal'
  };
}

function normalizeNodeTransform(transform = {}) {
  return {
    x: numberValue(transform.x, 0),
    y: numberValue(transform.y, 0),
    scaleX: numberValue(transform.scaleX, 1),
    scaleY: numberValue(transform.scaleY, 1),
    rotation: numberValue(transform.rotation, 0),
    skewX: numberValue(transform.skewX, 0),
    skewY: numberValue(transform.skewY, 0)
  };
}

export function createDesignNode(type = 'shape', overrides = {}) {
  const nodeType = ['shape', 'path', 'text', 'group', 'image'].includes(type) ? type : 'shape';
  const transform = normalizeNodeTransform(overrides.transform);
  return {
    id: overrides.id || `${nodeType}-${Math.random().toString(36).slice(2, 8)}`,
    type: nodeType,
    name: overrides.name || nodeType,
    transform,
    matrix: composeMatrix(transform),
    style: normalizeNodeStyle(overrides.style),
    constraints: { ...(overrides.constraints || {}) },
    shape: overrides.shape ? { ...overrides.shape } : null,
    anchors: Array.isArray(overrides.anchors) ? overrides.anchors.map((point) => createAnchorPoint(point.x, point.y, point)) : [],
    children: (Array.isArray(overrides.children) ? overrides.children : []).map((child) => createDesignNode(child.type, child))
  };
}

export function createSceneGraph(children = []) {
  return {
    root: createDesignNode('group', {
      id: 'root',
      name: 'Root',
      children
    })
  };
}

export function flattenSceneGraph(graphOrNode) {
  const root = graphOrNode?.root || graphOrNode;
  const output = [];
  const visit = (node) => {
    if (!node) return;
    output.push(node);
    (node.children || []).forEach(visit);
  };
  visit(root);
  return output;
}

function pointLineDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (!dx && !dy) return Math.hypot(point.x - start.x, point.y - start.y);
  const t = Math.max(0, Math.min(1, (((point.x - start.x) * dx) + ((point.y - start.y) * dy)) / ((dx * dx) + (dy * dy))));
  return Math.hypot(point.x - (start.x + (t * dx)), point.y - (start.y + (t * dy)));
}

function simplifyAnchorsRecursive(points, tolerance) {
  if (points.length <= 2) return points;
  let maxDistance = 0;
  let index = 0;
  for (let cursor = 1; cursor < points.length - 1; cursor += 1) {
    const distance = pointLineDistance(points[cursor], points[0], points.at(-1));
    if (distance > maxDistance) {
      maxDistance = distance;
      index = cursor;
    }
  }
  if (maxDistance <= tolerance) return [points[0], points.at(-1)];
  const left = simplifyAnchorsRecursive(points.slice(0, index + 1), tolerance);
  const right = simplifyAnchorsRecursive(points.slice(index), tolerance);
  return [...left.slice(0, -1), ...right];
}

export function simplifyPathAnchors(anchors = [], tolerance = 1) {
  return simplifyAnchorsRecursive((Array.isArray(anchors) ? anchors : []).map((point) => createAnchorPoint(point.x, point.y, point)), Math.max(0, Number(tolerance) || 0));
}

export function reversePathAnchors(anchors = []) {
  return (Array.isArray(anchors) ? anchors : []).map((point) => createAnchorPoint(point.x, point.y, {
    ...point,
    handleIn: point.handleOut,
    handleOut: point.handleIn
  })).reverse();
}

export function outlineStrokePath(anchors = [], strokeWidth = 1) {
  const points = (Array.isArray(anchors) ? anchors : []).map((point) => createAnchorPoint(point.x, point.y, point));
  const half = Math.max(0.5, Number(strokeWidth) || 1) / 2;
  const top = points.map((point) => createAnchorPoint(point.x, point.y - half));
  const bottom = points.slice().reverse().map((point) => createAnchorPoint(point.x, point.y + half));
  return [...top, ...bottom];
}

export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d) + (g < b ? 6 : 0);
    if (max === g) h = ((b - r) / d) + 2;
    if (max === b) h = ((r - g) / d) + 4;
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export function relativeChannel(value) {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function contrastRatio(hex) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.2126 * relativeChannel(r)) + (0.7152 * relativeChannel(g)) + (0.0722 * relativeChannel(b));
  const white = 1.05;
  const contrastOnWhite = white / (luminance + 0.05);
  const contrastOnBlack = (luminance + 0.05) / 0.05;
  return Math.max(contrastOnWhite, contrastOnBlack);
}

export function clampHex(value) {
  const normalized = String(value || '').trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : null;
}

export function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(Number(value) || 0)));
}

export function parseRgbValue(value) {
  const match = String(value || '').trim().match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
  if (!match) return null;
  const [r, g, b] = match.slice(1).map(clampChannel);
  return `#${[r, g, b].map((part) => part.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

export function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, Number(s))) / 100;
  const light = Math.max(0, Math.min(100, Number(l))) / 100;
  const chroma = (1 - Math.abs((2 * light) - 1)) * sat;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - (chroma / 2);
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 60) [r, g, b] = [chroma, x, 0];
  else if (hue < 120) [r, g, b] = [x, chroma, 0];
  else if (hue < 180) [r, g, b] = [0, chroma, x];
  else if (hue < 240) [r, g, b] = [0, x, chroma];
  else if (hue < 300) [r, g, b] = [x, 0, chroma];
  else [r, g, b] = [chroma, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

export function parseHslValue(value) {
  const match = String(value || '').trim().match(/^hsl\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i);
  if (!match) return null;
  const { r, g, b } = hslToRgb(Number(match[1]), Number(match[2]), Number(match[3]));
  return `#${[r, g, b].map((part) => part.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

export function resolveColorInput(value) {
  return clampHex(value) || parseRgbValue(value) || parseHslValue(value) || null;
}

export function buildPalette(hex) {
  const { r, g, b } = hexToRgb(hex);
  const base = rgbToHsl(r, g, b);
  return [18, 34, 50, 66, 82].map((lightness) => {
    const rgb = hslToRgb(base.h, Math.max(20, base.s), lightness);
    return `#${[rgb.r, rgb.g, rgb.b].map((part) => part.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
  });
}

export function contrastBetween(hexA, hexB) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const lumA = (0.2126 * relativeChannel(a.r)) + (0.7152 * relativeChannel(a.g)) + (0.0722 * relativeChannel(a.b));
  const lumB = (0.2126 * relativeChannel(b.r)) + (0.7152 * relativeChannel(b.g)) + (0.0722 * relativeChannel(b.b));
  const light = Math.max(lumA, lumB);
  const dark = Math.min(lumA, lumB);
  return (light + 0.05) / (dark + 0.05);
}

export function getDensityConfig(density) {
  return DESIGN_DENSITY[density] || DESIGN_DENSITY.balanced;
}

export function buildDesignSystemCss(values) {
  const density = getDensityConfig(values.density);
  const shadowAlpha = Math.min(0.42, 0.1 + values.elevation * 0.06).toFixed(2);
  return [
    ':root {',
    `  --app-bg: ${values.surface};`,
    `  --app-surface: ${values.panel};`,
    `  --app-ink: ${values.ink};`,
    `  --app-accent: ${values.accent};`,
    `  --app-border: ${values.border};`,
    `  --app-radius: ${values.radius}px;`,
    `  --app-font-size: ${values.fontSize}px;`,
    `  --app-space: ${density.space}px;`,
    `  --app-row: ${density.row}px;`,
    `  --app-shadow: 0 ${values.elevation * 8}px ${values.elevation * 18}px rgba(0, 0, 0, ${shadowAlpha});`,
    '}',
    '',
    '.app-shell {',
    '  min-height: 100vh;',
    '  color: var(--app-ink);',
    '  background: var(--app-bg);',
    '  font: var(--app-font-size)/1.45 Inter, system-ui, sans-serif;',
    '}',
    '',
    '.app-panel {',
    '  padding: calc(var(--app-space) * 1.25);',
    '  background: var(--app-surface);',
    '  border: 1px solid var(--app-border);',
    '  border-radius: var(--app-radius);',
    '  box-shadow: var(--app-shadow);',
    '}',
    '',
    '.app-button {',
    '  min-height: var(--app-row);',
    '  padding: 0 calc(var(--app-space) * 1.5);',
    '  color: #fff;',
    '  background: var(--app-accent);',
    '  border: 0;',
    '  border-radius: max(4px, calc(var(--app-radius) - 2px));',
    '}'
  ].join('\n');
}

export function buildDesignTokenJson(values) {
  return JSON.stringify({
    color: {
      surface: values.surface,
      panel: values.panel,
      ink: values.ink,
      accent: values.accent,
      border: values.border
    },
    layout: {
      density: values.density,
      radius: values.radius,
      elevation: values.elevation,
      fontSize: values.fontSize
    }
  }, null, 2);
}

export function buildDesignPreviewMarkup(values) {
  const density = getDensityConfig(values.density);
  return `
    <div class="design-preview-shell app-shell">
      <aside class="design-preview-nav app-panel">
        <strong>Atlas</strong>
        <button class="is-active">Overview</button>
        <button>Projects</button>
        <button>Reports</button>
      </aside>
      <main class="design-preview-main">
        <div class="design-preview-toolbar app-panel">
          <div>
            <span>${density.label}</span>
            <strong>Operations Board</strong>
          </div>
          <button class="app-button">New Item</button>
        </div>
        <div class="design-preview-cards">
          <div class="app-panel"><span>Revenue</span><strong>$42.8K</strong></div>
          <div class="app-panel"><span>Open Tasks</span><strong>18</strong></div>
          <div class="app-panel"><span>Cycle</span><strong>6.4d</strong></div>
        </div>
        <div class="design-preview-table app-panel">
          <div><span>Northline</span><strong>Ready</strong></div>
          <div><span>Clearway</span><strong>Review</strong></div>
          <div><span>Stone Yard</span><strong>Blocked</strong></div>
        </div>
      </main>
    </div>
  `;
}

export function buildDesignTokenSvg(values) {
  const labels = [
    ['Surface', values.surface],
    ['Panel', values.panel],
    ['Ink', values.ink],
    ['Accent', values.accent],
    ['Border', values.border]
  ];
  const rows = labels.map(([label, color], index) => {
    const y = 32 + index * 58;
    const text = contrastBetween(color, '#000000') >= 4.5 ? '#000000' : '#FFFFFF';
    return `<rect x="32" y="${y}" width="336" height="42" rx="8" fill="${color}"/><text x="48" y="${y + 27}" fill="${text}" font-family="Arial" font-size="15">${label} ${color}</text>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="340" viewBox="0 0 400 340"><rect width="400" height="340" fill="${values.surface}"/>${rows}</svg>`;
}

export function hexToRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

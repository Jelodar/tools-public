export const FORENSIC_MODES = [
  { id: 'error-level', label: 'Error Level Analysis', detail: 'Recompress JPEG and amplify compression differences.' },
  { id: 'magnifier', label: 'Forensic Magnifier', detail: 'Inspect local contrast and channel balance.' },
  { id: 'clone-detect', label: 'Clone Detection', detail: 'Mark repeated block neighborhoods for copy-move review.' },
  { id: 'noise', label: 'Noise Analysis', detail: 'Compare local pixel deltas and residual noise.' },
  { id: 'level-sweep', label: 'Level Sweep', detail: 'Threshold luminance at a chosen sweep level.' },
  { id: 'luminance-gradient', label: 'Luminance Gradient', detail: 'Reveal directional brightness transitions.' },
  { id: 'principal-component', label: 'Principal Component', detail: 'Project color components and differences.' },
  { id: 'jpeg-analysis', label: 'JPEG Analysis', detail: 'Inspect local JPEG markers and compression structure.' },
  { id: 'geo-tags', label: 'Geo Tags', detail: 'Search local metadata strings for location traces.' },
  { id: 'thumbnail', label: 'Thumbnail Analysis', detail: 'Detect embedded JPEG preview data.' },
  { id: 'metadata', label: 'Metadata', detail: 'List local file metadata and supported formats.' },
  { id: 'strings', label: 'String Extraction', detail: 'Extract readable byte strings from the file.' },
  { id: 'clean-copy', label: 'Clean Copy', detail: 'Plan local metadata-stripping export paths.' }
];

const FORENSIC_MODE_GROUPS = [
  {
    id: 'visual',
    label: 'Visual',
    modeIds: ['error-level', 'magnifier', 'clone-detect', 'noise', 'level-sweep', 'luminance-gradient', 'principal-component']
  },
  {
    id: 'structure',
    label: 'Structure',
    modeIds: ['jpeg-analysis', 'geo-tags', 'thumbnail', 'metadata', 'strings']
  },
  {
    id: 'export',
    label: 'Export',
    modeIds: ['clean-copy']
  }
];

export function getForensicModeGroups() {
  return FORENSIC_MODE_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    modes: group.modeIds.map((id) => getForensicMode(id)).filter(Boolean)
  }));
}

export function getPreviewConversionPlan(file = {}) {
  const name = String(file.name || '');
  const type = String(file.type || '');
  if (/\.(heic|heif)$/i.test(name)) {
    return {
      kind: 'heic',
      moduleUrl: 'https://esm.sh/heic2any@0.0.4?bundle',
      outputType: 'image/png'
    };
  }
  if (/\.(tif|tiff)$/i.test(name) || type === 'image/tiff') {
    return {
      kind: 'tiff',
      moduleUrl: 'https://esm.sh/utif@3.1.0?bundle',
      outputType: 'image/png'
    };
  }
  return null;
}

export const FORENSIC_METADATA_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'tif',
  'tiff',
  'heic',
  'avif',
  'pdf',
  'docx',
  'docm',
  'xlsx',
  'xlsm',
  'pptx',
  'pptm',
  'odt',
  'ods',
  'odp',
  'mp3',
  'm4a',
  'aac',
  'ogg',
  'wav',
  'flac',
  'mp4',
  'm4v',
  'mov',
  'avi',
  'mkv',
  'webm',
  'zip'
];

export const FORENSIC_METADATA_REMOVAL_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'pdf',
  'docx',
  'xlsx',
  'pptx',
  'odt',
  'ods',
  'odp',
  'mp3',
  'wav',
  'flac',
  'mp4',
  'mov',
  'mkv',
  'webm'
];

export function getForensicMode(modeId) {
  return FORENSIC_MODES.find((mode) => mode.id === modeId) || FORENSIC_MODES[0];
}

export function normalizeForensicAmount(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

export function buildErrorLevelSettings(options = {}) {
  return {
    jpegQuality: Math.round(normalizeForensicAmount(options.jpegQuality, 35, 98, 82)),
    errorScale: normalizeForensicAmount(options.errorScale, 1, 24, 8),
    opacity: normalizeForensicAmount(options.opacity, 0.05, 1, 0.85)
  };
}

export function buildMagnifierSettings(options = {}) {
  return {
    enhancement: normalizeForensicAmount(options.enhancement, 0.5, 4, 1.75),
    autoContrast: Boolean(options.autoContrast),
    autoContrastByChannel: Boolean(options.autoContrastByChannel),
    histogramEqualization: Boolean(options.histogramEqualization),
    opacity: normalizeForensicAmount(options.opacity, 0.05, 1, 0.85)
  };
}

export function buildForensicLensViewport(options = {}) {
  const zoom = normalizeForensicAmount(options.zoom, 1, 16, 4);
  const lensSize = Math.max(8, Math.round(normalizeForensicAmount(options.lensSize, 8, 512, 128)));
  const sourceWidth = Math.max(1, Math.round(Number(options.sourceWidth) || 1));
  const sourceHeight = Math.max(1, Math.round(Number(options.sourceHeight) || 1));
  const sw = Math.max(1, Math.round(lensSize / zoom));
  const sh = Math.max(1, Math.round(lensSize / zoom));
  const sx = Math.max(0, Math.min(sourceWidth - sw, Math.round((Number(options.x) || 0) - (sw / 2))));
  const sy = Math.max(0, Math.min(sourceHeight - sh, Math.round((Number(options.y) || 0) - (sh / 2))));
  return {
    sx,
    sy,
    sw,
    sh,
    dx: 0,
    dy: 0,
    dw: lensSize,
    dh: lensSize,
    zoom
  };
}

export function buildCloneDetectionSettings(options = {}) {
  return {
    minimalSimilarity: normalizeForensicAmount(options.minimalSimilarity, 0.1, 1, 0.82),
    minimalDetail: normalizeForensicAmount(options.minimalDetail, 0, 255, 18),
    minimalClusterSize: Math.round(normalizeForensicAmount(options.minimalClusterSize, 1, 64, 6)),
    blockSize: Math.round(normalizeForensicAmount(options.blockSize, 4, 64, 16)),
    maxImageSize: Math.round(normalizeForensicAmount(options.maxImageSize, 256, 4096, 1600)),
    showQuantized: Boolean(options.showQuantized)
  };
}

export function buildLevelSweepSettings(options = {}) {
  const sweep = normalizeForensicAmount(options.sweep, 0, 100, 50);
  const width = normalizeForensicAmount(options.width, 1, 100, 12);
  const opacity = normalizeForensicAmount(options.opacity, 0.05, 1, 0.72);
  return {
    sweep,
    width,
    opacity,
    threshold: Math.round((sweep / 100) * 255)
  };
}

export function buildPcaSettings(options = {}) {
  const componentCount = Math.round(normalizeForensicAmount(options.componentCount, 1, 4, 3));
  return {
    input: ['color', 'luminance-gradient', 'noise'].includes(options.input) ? options.input : 'color',
    mode: ['projection', 'difference', 'distance', 'component'].includes(options.mode) ? options.mode : 'projection',
    componentCount,
    component: Math.round(normalizeForensicAmount(options.component, 1, componentCount, 1)),
    linearize: Boolean(options.linearize),
    invert: Boolean(options.invert),
    enhancement: normalizeForensicAmount(options.enhancement, 0.25, 16, 4),
    opacity: normalizeForensicAmount(options.opacity, 0.05, 1, 0.85)
  };
}

export function getLuminance(pixel) {
  return (0.2126 * pixel[0]) + (0.7152 * pixel[1]) + (0.0722 * pixel[2]);
}

export function getLuminanceGradient(a, b) {
  return Math.round(Math.abs(getLuminance(a) - getLuminance(b)));
}

export function getNoiseDelta(a, b) {
  return Math.round((Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])) / 3);
}

export function getAutoContrastValue(value, min, max) {
  if (max <= min) return Math.max(0, Math.min(255, Math.round(value)));
  return Math.max(0, Math.min(255, Math.round(((value - min) / (max - min)) * 255)));
}

export function equalizeHistogramValue(value, histogram = [], total = 0) {
  const count = Math.max(1, total || histogram.reduce((sum, item) => sum + item, 0));
  const limit = Math.max(0, Math.min(histogram.length - 1, Math.round(value)));
  let cdf = 0;
  for (let i = 0; i <= limit; i += 1) cdf += histogram[i] || 0;
  return Math.max(0, Math.min(255, Math.round((cdf / count) * 255)));
}

export function getPcaProjectionValue(pixel, options = {}) {
  const settings = buildPcaSettings(options);
  const r = Number(pixel?.[0]) || 0;
  const g = Number(pixel?.[1]) || 0;
  const b = Number(pixel?.[2]) || 0;
  const lum = getLuminance([r, g, b, 255]);
  const components = [
    lum,
    Math.abs(g - b),
    Math.abs(r - ((g + b) / 2)),
    Math.sqrt(((r - lum) ** 2) + ((g - lum) ** 2) + ((b - lum) ** 2))
  ];
  let value = components[settings.component - 1] ?? components[0];
  if (settings.mode === 'difference') value = Math.abs(value - (settings.component === 2 ? 0 : 128));
  if (settings.mode === 'distance') value = Math.sqrt(Math.max(0, value * value));
  if (settings.mode === 'component') value = components[settings.component - 1] ?? 0;
  if (settings.linearize) value = 255 * Math.pow(Math.max(0, Math.min(1, value / 255)), 2.2);
  value *= settings.enhancement;
  if (settings.invert) value = 255 - value;
  return Math.max(0, Math.min(255, Math.round(value)));
}

function readUint16(bytes, index) {
  return ((bytes[index] || 0) << 8) | (bytes[index + 1] || 0);
}

function getJpegMarkerName(marker) {
  const names = {
    0xc0: 'SOF0',
    0xc2: 'SOF2',
    0xc4: 'DHT',
    0xd8: 'SOI',
    0xd9: 'EOI',
    0xda: 'SOS',
    0xdb: 'DQT',
    0xdd: 'DRI',
    0xe0: 'APP0',
    0xe1: 'APP1',
    0xe2: 'APP2',
    0xe3: 'APP3',
    0xe4: 'APP4',
    0xe5: 'APP5',
    0xe6: 'APP6',
    0xe7: 'APP7',
    0xe8: 'APP8',
    0xe9: 'APP9',
    0xea: 'APP10',
    0xeb: 'APP11',
    0xec: 'APP12',
    0xed: 'APP13',
    0xee: 'APP14',
    0xef: 'APP15',
    0xfe: 'COM'
  };
  return names[marker] || `0x${marker.toString(16).padStart(2, '0').toUpperCase()}`;
}

function segmentString(bytes, start, length) {
  let out = '';
  const end = Math.min(bytes.length, start + length);
  for (let i = start; i < end; i += 1) {
    const byte = bytes[i];
    if (byte >= 32 && byte <= 126) out += String.fromCharCode(byte);
  }
  return out;
}

export function analyzeJpegMarkers(bytes = new Uint8Array()) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  const summary = {
    isJpeg: data.length > 3 && data[0] === 0xff && data[1] === 0xd8,
    markers: [],
    appSegments: [],
    hasExif: false,
    hasIcc: false,
    hasXmp: false,
    quantizationTables: 0,
    huffmanTables: 0,
    scanCount: 0,
    commentCount: 0,
    width: 0,
    height: 0,
    components: 0
  };
  if (!summary.isJpeg) return summary;
  let index = 2;
  while (index < data.length - 1) {
    if (data[index] !== 0xff) {
      index += 1;
      continue;
    }
    while (data[index] === 0xff) index += 1;
    const marker = data[index];
    const offset = index - 1;
    index += 1;
    if (marker === 0x00) continue;
    if (marker === 0xd8 || marker === 0xd9) {
      summary.markers.push({ offset, marker, name: getJpegMarkerName(marker), length: 0 });
      if (marker === 0xd9) break;
      continue;
    }
    if (index + 1 >= data.length) break;
    const length = readUint16(data, index);
    const payloadStart = index + 2;
    const payloadLength = Math.max(0, length - 2);
    const name = getJpegMarkerName(marker);
    const markerInfo = { offset, marker, name, length };
    summary.markers.push(markerInfo);
    if (marker >= 0xe0 && marker <= 0xef) {
      const value = segmentString(data, payloadStart, Math.min(payloadLength, 64));
      summary.appSegments.push({ name, length, value });
      if (value.includes('Exif')) summary.hasExif = true;
      if (value.includes('ICC_PROFILE')) summary.hasIcc = true;
      if (value.includes('http://ns.adobe.com/xap') || value.includes('XMP')) summary.hasXmp = true;
    }
    if (marker === 0xdb) summary.quantizationTables += 1;
    if (marker === 0xc4) summary.huffmanTables += 1;
    if (marker === 0xfe) summary.commentCount += 1;
    if (marker === 0xc0 || marker === 0xc2) {
      summary.height = readUint16(data, payloadStart + 1);
      summary.width = readUint16(data, payloadStart + 3);
      summary.components = data[payloadStart + 5] || 0;
    }
    if (marker === 0xda) summary.scanCount += 1;
    index += length;
  }
  return summary;
}

export function extractReadableStrings(bytes, options = {}) {
  const minLength = Math.max(3, Math.round(Number(options.minLength) || 4));
  const limit = Math.max(1, Math.round(Number(options.limit) || 200));
  const out = [];
  let current = '';
  for (const byte of bytes || []) {
    if (byte >= 32 && byte <= 126) {
      current += String.fromCharCode(byte);
      continue;
    }
    if (current.length >= minLength) out.push(current);
    current = '';
    if (out.length >= limit) return out;
  }
  if (current.length >= minLength && out.length < limit) out.push(current);
  return out;
}

export function findGeoTagStrings(bytes, options = {}) {
  const strings = extractReadableStrings(bytes, {
    minLength: Math.max(5, Number(options.minLength) || 5),
    limit: Math.max(20, Number(options.limit) || 240)
  });
  const geoPattern = /(gps|geo|latitude|longitude|location|altitude|geotag|map datum|[-+]?\d{1,3}\.\d{3,})/i;
  return strings.filter((value) => geoPattern.test(value)).slice(0, Number(options.limit) || 40);
}

export function findEmbeddedJpegThumbnails(bytes = new Uint8Array()) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  const ranges = [];
  let primarySeen = false;
  for (let i = 0; i < data.length - 1; i += 1) {
    if (data[i] !== 0xff || data[i + 1] !== 0xd8) continue;
    if (!primarySeen && i === 0) {
      primarySeen = true;
      continue;
    }
    let end = -1;
    for (let j = i + 2; j < data.length - 1; j += 1) {
      if (data[j] === 0xff && data[j + 1] === 0xd9) {
        end = j + 2;
        break;
      }
    }
    ranges.push({ offset: i, length: end > i ? end - i : 0, complete: end > i });
  }
  return { count: ranges.length, ranges };
}

export function getFileExtension(name) {
  const match = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : '';
}

export function isMetadataExtensionSupported(name) {
  return FORENSIC_METADATA_EXTENSIONS.includes(getFileExtension(name));
}

export function buildMetadataRemovalPlan(file = {}) {
  const extension = getFileExtension(file.name);
  const supported = FORENSIC_METADATA_REMOVAL_EXTENSIONS.includes(extension);
  const raster = ['jpg', 'jpeg', 'png', 'webp'].includes(extension) || String(file.type || '').startsWith('image/');
  const container = ['docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp'].includes(extension);
  const media = ['mp3', 'wav', 'flac', 'mp4', 'mov', 'mkv', 'webm'].includes(extension);
  const pdf = extension === 'pdf';
  const actions = [];
  if (raster) actions.push('Re-encode visible pixels through canvas to remove file metadata blocks.');
  if (pdf) actions.push('Create a clean-copy workflow that preserves bytes only after a PDF-specific rewrite pass.');
  if (container) actions.push('Rewrite the document container and omit known metadata entries.');
  if (media) actions.push('Remux or re-encode streams without metadata tags.');
  if (!actions.length) actions.push('No reliable local stripping path is available for this extension.');
  return {
    extension: extension || 'unknown',
    type: file.type || 'unknown',
    supported,
    strategy: raster ? 'raster-reencode' : pdf ? 'pdf-rewrite' : container ? 'container-rewrite' : media ? 'media-remux' : 'unsupported',
    actions
  };
}

export function summarizeForensicFile(file, byteLength = 0) {
  const extension = getFileExtension(file?.name);
  return {
    name: file?.name || 'Untitled',
    type: file?.type || 'unknown',
    extension: extension || 'unknown',
    size: Number(file?.size ?? byteLength) || byteLength,
    metadataSupported: isMetadataExtensionSupported(file?.name)
  };
}

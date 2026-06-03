export const SUPPORTED_EXIF_EXTENSIONS = [
  'jpg',
  'jpeg',
  'jpe',
  'jfif',
  'tif',
  'tiff',
  'webp',
  'png',
  'heic',
  'heif',
  'avif',
  'dng',
  'cr2',
  'cr3',
  'nef',
  'arw',
  'orf',
  'rw2',
  'raf',
  'srw',
  'pef',
  'xmp'
];

export const CLEAN_EXIF_EXPORT_FORMATS = [
  { label: 'JPEG', mimeType: 'image/jpeg', extension: 'jpg' },
  { label: 'PNG', mimeType: 'image/png', extension: 'png' },
  { label: 'WebP', mimeType: 'image/webp', extension: 'webp' }
];

export const PIEXIFJS_MODULE_URL = 'https://esm.sh/piexifjs@1.0.6?bundle';

const CLEAN_SOURCE_EXTENSIONS = new Set(['jpg', 'jpeg', 'jpe', 'jfif', 'webp', 'png']);
const EXIF_MIME_TYPES = new Set([
  'image/jpeg',
  'image/tiff',
  'image/webp',
  'image/png',
  'image/heic',
  'image/heif',
  'image/avif',
  'application/rdf+xml',
  'application/xml',
  'text/xml'
]);

export function getFileExtension(file) {
  const name = String(file?.name || '').toLowerCase();
  return name.includes('.') ? name.split('.').pop() : '';
}

export function getSupportedExifFormats() {
  return {
    read: [...SUPPORTED_EXIF_EXTENSIONS],
    cleanExport: CLEAN_EXIF_EXPORT_FORMATS.map((format) => format.extension),
    sidecarEdit: ['json']
  };
}

export function isExifSupportedFile(file) {
  const extension = getFileExtension(file);
  const type = String(file?.type || '').toLowerCase();
  return SUPPORTED_EXIF_EXTENSIONS.includes(extension) || EXIF_MIME_TYPES.has(type);
}

export function normalizeExifEntries(data = {}) {
  return Object.entries(data)
    .map(([key, value]) => ({
      key,
      value,
      valueType: Array.isArray(value) ? 'array' : value instanceof Date ? 'date' : typeof value,
      isLocation: /^gps|latitude|longitude|altitude/i.test(key)
    }))
    .sort((left, right) => {
      if (left.isLocation !== right.isLocation) return left.isLocation ? -1 : 1;
      return left.key.localeCompare(right.key);
    });
}

export function applyExifSidecarEdit(data = {}, key, rawValue) {
  const targetKey = String(key || '').trim();
  if (!targetKey) throw new Error('Metadata key is required.');
  let value = rawValue;
  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();
    if (trimmed === '') value = '';
    else {
      try {
        value = JSON.parse(trimmed);
      } catch {
        value = rawValue;
      }
    }
  }
  return {
    ...data,
    [targetKey]: value
  };
}

export function planExifCleanCopy(file, mimeType = 'image/jpeg') {
  const extension = getFileExtension(file);
  const format = CLEAN_EXIF_EXPORT_FORMATS.find((entry) => entry.mimeType === mimeType) || CLEAN_EXIF_EXPORT_FORMATS[0];
  const base = String(file?.name || 'image')
    .replace(/\.[^.]+$/, '')
    .replace(/[^\w.-]+/g, '_') || 'image';
  const supported = CLEAN_SOURCE_EXTENSIONS.has(extension) || String(file?.type || '').startsWith('image/');
  return {
    supported,
    mimeType: format.mimeType,
    extension: format.extension,
    fileName: `${base}_clean.${format.extension}`,
    reason: supported ? '' : 'Clean image export needs a browser-decodable raster image.'
  };
}

export async function buildJpegWithXmpMetadata(file, metadata = {}) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error('Edited image metadata embedding currently supports JPEG files.');
  }

  const packet = buildXmpPacket(metadata);
  const packetBytes = new TextEncoder().encode(`http://ns.adobe.com/xap/1.0/\0${packet}`);
  const segmentLength = packetBytes.length + 2;
  if (segmentLength > 0xffff) {
    throw new Error('Edited metadata is too large for a single JPEG XMP segment.');
  }

  const segment = new Uint8Array(packetBytes.length + 4);
  segment[0] = 0xff;
  segment[1] = 0xe1;
  segment[2] = (segmentLength >> 8) & 0xff;
  segment[3] = segmentLength & 0xff;
  segment.set(packetBytes, 4);

  return new Blob([bytes.slice(0, 2), segment, bytes.slice(2)], { type: 'image/jpeg' });
}

function bytesToBinaryString(bytes) {
  let output = '';
  for (let index = 0; index < bytes.length; index += 1) output += String.fromCharCode(bytes[index]);
  return output;
}

function binaryStringToBytes(value) {
  const bytes = new Uint8Array(String(value).length);
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = String(value).charCodeAt(index) & 0xff;
  return bytes;
}

export async function buildJpegWithEditedExifMetadata(file, metadata = {}, piexifOverride = null) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error('Edited EXIF injection supports JPEG files.');
  }
  const module = piexifOverride || await import(PIEXIFJS_MODULE_URL);
  const piexif = module.default || module;
  const artistTag = piexif.ImageIFD?.Artist;
  const userCommentTag = piexif.ExifIFD?.UserComment || 37510;
  const zeroth = {};
  if (artistTag && metadata.Artist) zeroth[artistTag] = String(metadata.Artist);
  const exif = {
    [userCommentTag]: JSON.stringify(metadata)
  };
  const exifBytes = piexif.dump({
    '0th': zeroth,
    Exif: exif,
    GPS: {},
    '1st': {},
    thumbnail: null
  });
  const output = piexif.insert(exifBytes, bytesToBinaryString(bytes));
  return new Blob([binaryStringToBytes(output)], { type: 'image/jpeg' });
}

function buildXmpPacket(metadata = {}) {
  const json = JSON.stringify(metadata, null, 2);
  return [
    '<x:xmpmeta xmlns:x="adobe:ns:meta/">',
    '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">',
    '<rdf:Description xmlns:jt="https://jelodar.local/ns/metadata/1.0/">',
    `<jt:EditedMetadata>${escapeXml(json)}</jt:EditedMetadata>`,
    '</rdf:Description>',
    '</rdf:RDF>',
    '</x:xmpmeta>'
  ].join('');
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

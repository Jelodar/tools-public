const ZIP_FLAG_UTF8 = 0x0800;
const ZIP_VERSION = 20;
const DEFAULT_SUBTITLE_STYLE = {
  color: '#ffdc00',
  fontFamily: 'Arial',
  fontSize: 20,
  outline: 0,
  position: 'bottom',
  background: false
};

let crcTable = null;

export function parseWebMediaSubtitleText(text = '', format = 'auto') {
  const source = String(text || '').replace(/^\uFEFF/, '').replace(/\r/g, '');
  const selected = format === 'srt' || format === 'vtt'
    ? format
    : /^\s*WEBVTT\b/i.test(source)
      ? 'vtt'
      : 'srt';
  const cues = selected === 'vtt' ? parseVtt(source) : parseSrt(source);
  return normalizeSubtitleCues(cues);
}

export function serializeWebMediaTextTrack(cues = [], style = {}) {
  const normalizedStyle = normalizeWebMediaSubtitleStyle(style);
  const styleParts = [
    `color=${normalizedStyle.color}`,
    `font=${normalizedStyle.fontFamily}`,
    `size=${normalizedStyle.fontSize}`,
    normalizedStyle.outline ? `outline=${normalizedStyle.outline}` : '',
    normalizedStyle.position !== 'bottom' ? `position=${normalizedStyle.position}` : '',
    normalizedStyle.background ? 'background=true' : ''
  ].filter(Boolean).join(' ');
  const body = normalizeSubtitleCues(cues).map((cue, index) => [
    String(index + 1),
    `${formatSubtitleTimestamp(cue.start)} --> ${formatSubtitleTimestamp(cue.end)}`,
    cue.text
  ].join('\n')).join('\n\n');
  return `WEBVTT\n\nNOTE style ${styleParts}${body ? `\n\n${body}\n` : '\n'}`;
}

export function normalizeWebMediaSubtitleStyle(style = {}) {
  const source = style && typeof style === 'object' ? style : {};
  const color = String(source.color || DEFAULT_SUBTITLE_STYLE.color).trim();
  const fontFamily = String(source.fontFamily || source.font || DEFAULT_SUBTITLE_STYLE.fontFamily)
    .replace(/,/g, ' ')
    .trim() || DEFAULT_SUBTITLE_STYLE.fontFamily;
  return {
    color: /^#[0-9a-f]{6}$/i.test(color) ? color : DEFAULT_SUBTITLE_STYLE.color,
    fontFamily,
    fontSize: clampNumber(source.fontSize ?? source.size, DEFAULT_SUBTITLE_STYLE.fontSize, 8, 160),
    outline: clampNumber(source.outline, DEFAULT_SUBTITLE_STYLE.outline, 0, 24),
    position: ['bottom', 'top', 'center'].includes(source.position) ? source.position : DEFAULT_SUBTITLE_STYLE.position,
    background: Boolean(source.background)
  };
}

export function normalizeSubtitleCues(cues = []) {
  return Array.from(cues || [])
    .map((cue, index) => {
      const start = Math.max(0, Number(cue?.start) || 0);
      const end = Math.max(start + 0.1, Number(cue?.end) || start + 2);
      return {
        id: cue?.id || `cue-${index + 1}`,
        index: index + 1,
        start,
        end,
        text: String(cue?.text || '').trim()
      };
    })
    .filter((cue) => cue.text);
}

export async function buildStoredZipBlob(files = []) {
  const encoder = new TextEncoder();
  const entries = [];
  let offset = 0;

  for (const file of Array.from(files || [])) {
    const name = normalizeZipEntryName(file?.name);
    if (!name) continue;
    const data = await toUint8Array(file?.data);
    const nameBytes = encoder.encode(name);
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length);
    writeUint32LE(local, 0, 0x04034b50);
    writeUint16LE(local, 4, ZIP_VERSION);
    writeUint16LE(local, 6, ZIP_FLAG_UTF8);
    writeUint16LE(local, 8, 0);
    writeUint16LE(local, 10, 0);
    writeUint16LE(local, 12, 0);
    writeUint32LE(local, 14, crc);
    writeUint32LE(local, 18, data.length);
    writeUint32LE(local, 22, data.length);
    writeUint16LE(local, 26, nameBytes.length);
    writeUint16LE(local, 28, 0);
    local.set(nameBytes, 30);
    entries.push({ nameBytes, data, crc, local, offset });
    offset += local.length + data.length;
  }

  const central = [];
  for (const entry of entries) {
    const header = new Uint8Array(46 + entry.nameBytes.length);
    writeUint32LE(header, 0, 0x02014b50);
    writeUint16LE(header, 4, ZIP_VERSION);
    writeUint16LE(header, 6, ZIP_VERSION);
    writeUint16LE(header, 8, ZIP_FLAG_UTF8);
    writeUint16LE(header, 10, 0);
    writeUint16LE(header, 12, 0);
    writeUint16LE(header, 14, 0);
    writeUint32LE(header, 16, entry.crc);
    writeUint32LE(header, 20, entry.data.length);
    writeUint32LE(header, 24, entry.data.length);
    writeUint16LE(header, 28, entry.nameBytes.length);
    writeUint16LE(header, 30, 0);
    writeUint16LE(header, 32, 0);
    writeUint16LE(header, 34, 0);
    writeUint16LE(header, 36, 0);
    writeUint32LE(header, 38, 0);
    writeUint32LE(header, 42, entry.offset);
    header.set(entry.nameBytes, 46);
    central.push(header);
  }

  const centralSize = central.reduce((sum, chunk) => sum + chunk.length, 0);
  const centralOffset = offset;
  const end = new Uint8Array(22);
  writeUint32LE(end, 0, 0x06054b50);
  writeUint16LE(end, 4, 0);
  writeUint16LE(end, 6, 0);
  writeUint16LE(end, 8, entries.length);
  writeUint16LE(end, 10, entries.length);
  writeUint32LE(end, 12, centralSize);
  writeUint32LE(end, 16, centralOffset);
  writeUint16LE(end, 20, 0);

  const chunks = entries.flatMap((entry) => [entry.local, entry.data]);
  return new Blob([...chunks, ...central, end], { type: 'application/zip' });
}

export async function buildWebMediaSubtitlePackageBlob(plan = {}) {
  const subtitles = getPlanSubtitleSettings(plan);
  const cues = normalizeSubtitleCues(subtitles.cues);
  const captions = serializeWebMediaTextTrack(cues, subtitles);
  return buildStoredZipBlob([
    { name: 'captions.vtt', data: captions },
    { name: 'manifest.json', data: JSON.stringify(buildSubtitleManifest(plan, cues, subtitles), null, 2) }
  ]);
}

export async function buildWebMediaHlsPackageBlob(segmentBlob, plan = {}) {
  const packageOptions = plan.conversion?.package || plan.settings?.hls || {};
  const subtitles = getPlanSubtitleSettings(plan);
  const cues = normalizeSubtitleCues(subtitles.cues);
  const segmentBytes = await toUint8Array(segmentBlob);
  const captionsEnabled = cues.length > 0 && packageOptions.captionRendition !== false;
  const mediaPlaylist = buildHlsMediaPlaylist(plan, packageOptions);
  const masterPlaylist = buildHlsMasterPlaylist(plan, captionsEnabled);
  const files = [
    { name: 'master.m3u8', data: masterPlaylist },
    { name: 'media.m3u8', data: mediaPlaylist },
    { name: 'segment-000.ts', data: segmentBytes },
    { name: 'manifest.json', data: JSON.stringify(buildHlsManifest(plan, packageOptions, segmentBytes.length, captionsEnabled), null, 2) }
  ];
  if (captionsEnabled) files.splice(3, 0, {
    name: 'captions.vtt',
    data: serializeWebMediaTextTrack(cues, subtitles)
  });
  return buildStoredZipBlob(files);
}

function parseSrt(text) {
  return text.split(/\n{2,}/).flatMap((block) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    const timeIndex = lines.findIndex((line) => line.includes('-->'));
    if (timeIndex < 0) return [];
    const [startText, endText] = lines[timeIndex].split('-->').map((entry) => entry.trim().split(/\s+/)[0]);
    return [{
      start: parseSubtitleTimestamp(startText),
      end: parseSubtitleTimestamp(endText),
      text: lines.slice(timeIndex + 1).join('\n')
    }];
  });
}

function parseVtt(text) {
  return text.split(/\n{2,}/).flatMap((block) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    if (!lines.length || /^WEBVTT\b/i.test(lines[0]) || /^NOTE\b/i.test(lines[0]) || /^STYLE\b/i.test(lines[0])) return [];
    const timeIndex = lines.findIndex((line) => line.includes('-->'));
    if (timeIndex < 0) return [];
    const [startText, endText] = lines[timeIndex].split('-->').map((entry) => entry.trim().split(/\s+/)[0]);
    return [{
      start: parseSubtitleTimestamp(startText),
      end: parseSubtitleTimestamp(endText),
      text: lines.slice(timeIndex + 1).join('\n')
    }];
  });
}

function parseSubtitleTimestamp(value = '') {
  const [time, millis = '0'] = String(value || '').trim().replace(',', '.').split('.');
  const parts = time.split(':').map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  const seconds = parts.reduce((sum, part) => (sum * 60) + part, 0);
  return seconds + (Number(`0.${millis.padEnd(3, '0').slice(0, 3)}`) || 0);
}

function formatSubtitleTimestamp(value = 0) {
  const totalMs = Math.max(0, Math.round(Number(value || 0) * 1000));
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const millis = totalMs % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

function getPlanSubtitleSettings(plan = {}) {
  const adjustment = plan.conversion?.adjustments?.subtitles || {};
  const settings = plan.settings?.subtitles || {};
  return {
    ...settings,
    ...adjustment,
    cues: Array.isArray(adjustment.cues) ? adjustment.cues : settings.cues
  };
}

function buildSubtitleManifest(plan, cues, subtitles) {
  return {
    type: 'webmedia-subtitle-package',
    source: plan.source?.fileName || 'media',
    language: subtitles.language || 'und',
    cues: cues.length,
    style: normalizeWebMediaSubtitleStyle(subtitles),
    files: ['captions.vtt']
  };
}

function buildHlsManifest(plan, packageOptions, segmentBytes, captionsEnabled) {
  return {
    type: 'webmedia-hls-package',
    source: plan.source?.fileName || 'media',
    playlistType: packageOptions.playlistType || 'vod',
    segmentDuration: getHlsSegmentDuration(plan, packageOptions),
    segmentBytes,
    files: [
      'master.m3u8',
      'media.m3u8',
      'segment-000.ts',
      ...(captionsEnabled ? ['captions.vtt'] : [])
    ]
  };
}

function buildHlsMasterPlaylist(plan, captionsEnabled) {
  const bandwidth = Math.max(1, Math.round(Number(plan.conversion?.video?.bitrate || 0) || estimateBandwidth(plan)));
  const videoTrack = Array.isArray(plan.source?.tracks)
    ? plan.source.tracks.find((track) => track.kind === 'video')
    : null;
  const resolution = videoTrack?.width && videoTrack?.height ? `,RESOLUTION=${Math.round(videoTrack.width)}x${Math.round(videoTrack.height)}` : '';
  const subtitleLine = captionsEnabled
    ? '#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="Captions",DEFAULT=YES,AUTOSELECT=YES,LANGUAGE="eng",URI="captions.vtt"\n'
    : '';
  const subtitleAttr = captionsEnabled ? ',SUBTITLES="subs"' : '';
  return [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
    subtitleLine.trimEnd(),
    `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth}${resolution}${subtitleAttr}`,
    'media.m3u8',
    ''
  ].filter((line) => line !== '').join('\n');
}

function buildHlsMediaPlaylist(plan, packageOptions = {}) {
  const duration = getHlsSegmentDuration(plan, packageOptions);
  const playlistType = ['vod', 'event', 'live'].includes(packageOptions.playlistType) ? packageOptions.playlistType : 'vod';
  const rows = [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
    `#EXT-X-TARGETDURATION:${Math.max(1, Math.ceil(duration))}`
  ];
  if (playlistType !== 'live') rows.push(`#EXT-X-PLAYLIST-TYPE:${playlistType.toUpperCase()}`);
  if (packageOptions.independentSegments !== false) rows.push('#EXT-X-INDEPENDENT-SEGMENTS');
  rows.push(`#EXTINF:${duration.toFixed(3)},`);
  rows.push('segment-000.ts');
  if (playlistType !== 'live') rows.push('#EXT-X-ENDLIST');
  rows.push('');
  return rows.join('\n');
}

function getHlsSegmentDuration(plan, packageOptions = {}) {
  const sourceDuration = Number(plan.source?.duration || 0);
  const segmentDuration = Number(packageOptions.segmentDuration || 0);
  return Math.max(0.1, sourceDuration || segmentDuration || 6);
}

function estimateBandwidth(plan = {}) {
  const duration = Number(plan.source?.duration || 0);
  const size = Number(plan.source?.size || 0);
  if (duration > 0 && size > 0) return Math.max(1, Math.round((size * 8) / duration));
  return 2500000;
}

async function toUint8Array(data) {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  if (data && typeof data.arrayBuffer === 'function') return new Uint8Array(await data.arrayBuffer());
  return new TextEncoder().encode(String(data ?? ''));
}

function normalizeZipEntryName(name = '') {
  return String(name || '').replace(/\\/g, '/').replace(/^\/+/, '').split('/').filter(Boolean).join('/');
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function writeUint16LE(bytes, offset, value) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32LE(bytes, offset, value) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    crcTable[index] = value >>> 0;
  }
  return crcTable;
}

function crc32(bytes) {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (const byte of bytes) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

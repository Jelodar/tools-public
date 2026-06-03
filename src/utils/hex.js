export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function formatSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / (1024 ** exponent);
  return `${value.toFixed(value >= 100 || exponent === 0 ? 0 : value >= 10 ? 1 : 2)} ${units[exponent]}`;
}

export function formatOffset(offset, width = 8) {
  return clamp(offset, 0, Number.MAX_SAFE_INTEGER).toString(16).toUpperCase().padStart(width, '0');
}

export function getOffsetWidth(fileSize) {
  const safeSize = Math.max(1, fileSize);
  const width = Math.ceil(Math.log(safeSize) / Math.log(16));
  const evenWidth = width % 2 === 0 ? width : width + 1;
  return Math.max(8, evenWidth);
}

export function formatHexByte(value) {
  return clamp(value, 0, 255).toString(16).toUpperCase().padStart(2, '0');
}

export function byteToChar(value) {
  return value >= 32 && value <= 126 ? String.fromCharCode(value) : '.';
}

export function parseOffset(value) {
  const input = String(value ?? '').trim();
  if (!input) return Number.NaN;
  if (/^0x[0-9a-f]+$/i.test(input)) return parseInt(input, 16);
  if (/^[0-9a-f]+h$/i.test(input)) return parseInt(input.slice(0, -1), 16);
  if (/^[0-9]+$/i.test(input)) return parseInt(input, 10);
  return Number.NaN;
}

export function normalizeHexByteInput(value) {
  return String(value ?? '').replace(/[^0-9a-f]/gi, '').slice(0, 2).toUpperCase();
}

export function applyBytePatch(patches, index, originalValue, nextValue) {
  if (!Number.isInteger(index) || index < 0) return { valid: false, changed: false };
  if (!Number.isInteger(nextValue) || nextValue < 0 || nextValue > 255) return { valid: false, changed: false };
  if (nextValue === originalValue) {
    patches.delete(index);
    return { valid: true, changed: false, removed: true, value: nextValue };
  }
  patches.set(index, { original: originalValue, value: nextValue });
  return { valid: true, changed: true, removed: false, value: nextValue };
}

export function getPatchedByte(originalValue, patches, index) {
  return patches.get(index)?.value ?? originalValue;
}

export function buildPatchRecords(patches) {
  return Array.from(patches.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([offset, patch]) => ({
      offset,
      original: patch.original,
      value: patch.value
    }));
}

export function getViewportRows({ scrollTop, viewportHeight, rowHeight, totalRows, overscan = 8 }) {
  const safeHeight = Math.max(viewportHeight, rowHeight);
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleRows = Math.ceil(safeHeight / rowHeight) + overscan * 2;
  return {
    startRow,
    endRow: Math.min(totalRows, startRow + visibleRows)
  };
}

export function getSelectionRange(anchorIndex, focusIndex) {
  if (!Number.isInteger(anchorIndex) || !Number.isInteger(focusIndex)) return null;
  const start = Math.min(anchorIndex, focusIndex);
  const end = Math.max(anchorIndex, focusIndex);
  return {
    start,
    end,
    length: end - start + 1
  };
}

function parseHexSearchQuery(query) {
  const normalized = String(query ?? '').replace(/0x/gi, ' ').replace(/[^0-9a-f]/gi, '');
  if (!normalized || normalized.length % 2 !== 0) return null;
  const result = new Uint8Array(normalized.length / 2);
  for (let index = 0; index < normalized.length; index += 2) {
    result[index / 2] = parseInt(normalized.slice(index, index + 2), 16);
  }
  return result;
}

function lowerAsciiByte(value) {
  return value >= 65 && value <= 90 ? value + 32 : value;
}

export function buildSearchNeedle({ mode = 'text', query = '', caseSensitive = true }) {
  if (mode === 'hex') return parseHexSearchQuery(query);
  const value = String(query ?? '');
  if (!value) return null;
  const encoder = new TextEncoder();
  return encoder.encode(caseSensitive ? value : value.toLowerCase());
}

export function normalizeSearchHaystack(bytes, mode = 'text', caseSensitive = true) {
  if (mode !== 'text' || caseSensitive) return bytes;
  const normalized = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index += 1) {
    normalized[index] = lowerAsciiByte(bytes[index]);
  }
  return normalized;
}

export function findNeedleIndex(haystack, needle, startIndex = 0) {
  if (!needle?.length || haystack.length < needle.length) return -1;
  const limit = haystack.length - needle.length;
  for (let index = startIndex; index <= limit; index += 1) {
    let matched = true;
    for (let cursor = 0; cursor < needle.length; cursor += 1) {
      if (haystack[index + cursor] !== needle[cursor]) {
        matched = false;
        break;
      }
    }
    if (matched) return index;
  }
  return -1;
}

export function getSearchSegments({ fileSize, startOffset = 0, chunkSize = 1024 * 1024, needleLength = 1 }) {
  if (!Number.isFinite(fileSize) || fileSize <= 0) return [];
  const normalizedStart = clamp(startOffset, 0, Math.max(0, fileSize - 1));
  const overlap = Math.max(0, needleLength - 1);
  const step = Math.max(1, chunkSize - overlap);
  const segments = [];
  const appendSegments = (rangeStart, rangeEnd) => {
    for (let offset = rangeStart; offset < rangeEnd; offset += step) {
      segments.push({
        start: offset,
        end: Math.min(rangeEnd, offset + chunkSize)
      });
    }
  };
  appendSegments(normalizedStart, fileSize);
  if (normalizedStart > 0) appendSegments(0, normalizedStart);
  return segments;
}

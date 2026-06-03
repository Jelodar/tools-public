import {
  createArchiveWasmLocateFile,
  extractArchiveWasmEntry,
  extractArchiveWasmSelection,
  listArchiveWasmEntries,
  normalizeArchiveWasmPath
} from './archive-wasm-backend.js';

export { createArchiveWasmLocateFile };

const ZIP_CDN = 'https://esm.sh/jszip@3.10.1';
const ZIP_FAMILY_EXTENSIONS = [
  'zip',
  'jar',
  'war',
  'ear',
  'apk',
  'aar',
  'xpi',
  'vsix',
  'epub',
  'docx',
  'docm',
  'xlsx',
  'xlsm',
  'pptx',
  'pptm',
  'odt',
  'ods',
  'odp',
  'kmz',
  'cbz'
];
const LIBARCHIVE_EXTENSIONS = [
  '7z',
  'rar',
  'tar',
  'tgz',
  'tar.gz',
  'gz',
  'tbz',
  'tbz2',
  'tar.bz2',
  'bz2',
  'txz',
  'tar.xz',
  'xz',
  'zst',
  'lzma',
  'cab',
  'iso',
  'cpio',
  'ar',
  'deb',
  'rpm'
];
const ZIP_FAMILY_MIME_TYPES = new Set([
  'application/zip',
  'application/x-zip-compressed',
  'application/java-archive',
  'application/vnd.android.package-archive',
  'application/epub+zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  'application/vnd.google-earth.kmz'
]);
const LIBARCHIVE_MIME_TYPES = new Set([
  'application/x-7z-compressed',
  'application/vnd.rar',
  'application/x-rar-compressed',
  'application/x-tar',
  'application/gzip',
  'application/x-gzip',
  'application/x-bzip2',
  'application/x-xz',
  'application/x-lzma',
  'application/x-cpio',
  'application/vnd.debian.binary-package',
  'application/x-rpm'
]);

const ARCHIVE_ERROR_PATTERNS = [
  {
    code: 'ARCHIVE_ENCRYPTION_UNSUPPORTED',
    match: /(encrypted zip.*not supported|unsupported encryption|strong encryption|aes.*not supported|encryption.*not supported)/i,
    message: 'This archive uses encryption this browser reader cannot open.',
    retryable: false
  },
  {
    code: 'ARCHIVE_PASSWORD_INVALID',
    match: /(wrong password|incorrect password|bad password|password.*incorrect|data error.*password)/i,
    message: 'Password did not unlock this archive.',
    retryable: true,
    requiresProvidedPassword: true
  },
  {
    code: 'ARCHIVE_PASSWORD_REQUIRED',
    match: /(encrypted|password|required|wrong password)/i,
    message: 'Password required to open this encrypted archive.',
    retryable: true,
    requiresMissingPassword: true
  },
  {
    code: 'ARCHIVE_RETRYABLE_ERROR',
    match: /(worker failed|reader failed|runtime.*unavailable|network|fetch|timeout|temporar|failed to load)/i,
    message: 'Archive reader failed. Try again or use another archive.',
    retryable: true,
    preserveMessage: true
  }
];

function getZipLoader(options = {}) {
  if (typeof options.loadZip === 'function') return options.loadZip;
  if (typeof globalThis.__archiveToolsZipLoader === 'function') return globalThis.__archiveToolsZipLoader;
  return async () => {
    const mod = await import(ZIP_CDN);
    return mod.default;
  };
}

export function classifyArchiveError(error = {}, options = {}) {
  if (error.code && error.message) return error;

  const rawMessage = error?.message || String(error || '');
  const hasPassword = Boolean(String(options.password || ''));

  for (const pattern of ARCHIVE_ERROR_PATTERNS) {
    if (pattern.requiresProvidedPassword && !hasPassword) continue;
    if (pattern.requiresMissingPassword && hasPassword) continue;
    if (!pattern.match.test(rawMessage)) continue;
    return createArchiveError(pattern.code, pattern.message, {
      cause: error,
      retryable: pattern.retryable,
      message: pattern.preserveMessage ? rawMessage : ''
    });
  }

  if (/unsupported archive format/i.test(rawMessage)) {
    return createArchiveError('ARCHIVE_UNSUPPORTED_FORMAT', rawMessage, {
      cause: error,
      retryable: false
    });
  }

  return createArchiveError('ARCHIVE_READ_ERROR', rawMessage || 'Archive could not be read.', {
    cause: error,
    retryable: false
  });
}

function getFileExtension(name = '') {
  const lower = String(name || '').toLowerCase();
  if (lower.endsWith('.tar.gz')) return 'tar.gz';
  if (lower.endsWith('.tar.bz2')) return 'tar.bz2';
  if (lower.endsWith('.tar.xz')) return 'tar.xz';
  const parts = lower.split('.');
  return parts.length > 1 ? parts.pop() : '';
}

export function isZipLikeFile(file) {
  const name = String(file?.name || '').toLowerCase();
  const type = String(file?.type || '').toLowerCase();
  const extension = getFileExtension(name);
  return ZIP_FAMILY_EXTENSIONS.includes(extension) || ZIP_FAMILY_MIME_TYPES.has(type);
}

export function getArchiveOpenStrategy(file) {
  const name = String(file?.name || '').toLowerCase();
  const type = String(file?.type || '').toLowerCase();
  const extension = getFileExtension(name);
  if (ZIP_FAMILY_EXTENSIONS.includes(extension) || ZIP_FAMILY_MIME_TYPES.has(type)) return 'zip';
  if (LIBARCHIVE_EXTENSIONS.includes(extension) || LIBARCHIVE_MIME_TYPES.has(type)) return 'libarchive';
  return 'unsupported';
}

export function isSupportedArchiveFile(file) {
  return getArchiveOpenStrategy(file) !== 'unsupported';
}

export function getSupportedArchiveFormats() {
  return {
    open: [...ZIP_FAMILY_EXTENSIONS, ...LIBARCHIVE_EXTENSIONS],
    export: ['zip', 'tar', 'tar.gz']
  };
}

function getArchivePath(file) {
  return String(file?.webkitRelativePath || file?.relativePath || file?.name || 'file');
}

function getEntryFileName(entryName) {
  return String(entryName || '').split('/').filter(Boolean).pop() || 'archive-entry';
}

function normalizeArchiveEntryName(name = '') {
  return String(name || '').replace(/^\/+/, '').replace(/\\/g, '/');
}

function normalizeDirectoryPath(path = '') {
  const normalized = normalizeArchiveEntryName(path);
  if (!normalized) return '';
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

function getDirectChildFolder(prefix, entryName) {
  const relative = entryName.slice(prefix.length);
  const firstSlash = relative.indexOf('/');
  if (firstSlash < 0) return '';
  return `${prefix}${relative.slice(0, firstSlash + 1)}`;
}

function compareArchiveEntries(left, right) {
  if (left.isDirectory !== right.isDirectory) return left.isDirectory ? -1 : 1;
  return left.name.localeCompare(right.name);
}

async function runArchiveBackend(file, type, payload = {}, options = {}) {
  const buffer = await file.arrayBuffer();
  const request = {
    ...payload,
    name: file?.name || 'archive',
    password: options.password || '',
    buffer
  };
  const transferables = [buffer].filter((entry) => entry instanceof ArrayBuffer);
  if (shouldUseArchiveWorker(options)) {
    return runArchiveWorker(type, request, transferables, options);
  }
  if (type === 'archive-list') {
    return { entries: await listArchiveWasmEntries(buffer, options) };
  }
  if (type === 'archive-extract') {
    return extractArchiveWasmEntry(buffer, payload.entryName, options);
  }
  if (type === 'archive-extract-selection') {
    return { files: await extractArchiveWasmSelection(buffer, { prefix: payload.prefix }, options) };
  }
  throw new Error(`Unsupported archive task: ${type}`);
}

function shouldUseArchiveWorker(options = {}) {
  if (typeof options.runArchiveWorker === 'function') return true;
  if (options.preferWorker === false) return false;
  if (options.loadArchiveWasm || options.runtime || options.archiveWasmModule) return false;
  return typeof (options.Worker || globalThis.Worker) === 'function';
}

function runArchiveWorker(type, payload, transferables = [], options = {}) {
  if (typeof options.runArchiveWorker === 'function') {
    return options.runArchiveWorker(type, payload, transferables);
  }
  const WorkerCtor = options.Worker || globalThis.Worker;
  if (typeof WorkerCtor !== 'function') throw new Error('Archive worker is unavailable.');
  const workerUrl = options.workerUrl || new URL('../workers/archive.worker.js', import.meta.url);
  const worker = new WorkerCtor(workerUrl, { type: 'module', name: 'archive-tools-wasm' });
  return new Promise((resolve, reject) => {
    const finish = (callback) => {
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate?.();
      callback();
    };
    worker.onmessage = (event) => {
      const data = event.data || {};
      if (data.success) {
        finish(() => resolve(data.result));
        return;
      }
      finish(() => reject(new Error(data.error || 'Archive worker failed.')));
    };
    worker.onerror = (error) => {
      finish(() => reject(error instanceof Error ? error : new Error(error?.message || 'Archive worker failed.')));
    };
    worker.postMessage({ type, payload }, transferables);
  });
}

function normalizeArchiveWorkerEntries(entries = []) {
  return Array.from(entries || []).map((entry) => {
    const isDirectory = Boolean(entry?.isDirectory);
    const name = isDirectory
      ? normalizeDirectoryPath(entry?.name)
      : normalizeArchiveEntryName(entry?.name);
    return {
      name,
      size: isDirectory ? 0 : Number(entry?.size || 0),
      isDirectory
    };
  }).filter((entry) => entry.name);
}

export async function listArchiveEntries(file, options = {}) {
  try {
    const strategy = getArchiveOpenStrategy(file);
    if (strategy === 'libarchive') {
      const result = await runArchiveBackend(file, 'archive-list', {}, options);
      return normalizeArchiveWorkerEntries(result.entries).sort(compareArchiveEntries);
    }
    if (strategy === 'unsupported') throw new Error('Unsupported archive format.');

    const loadZip = getZipLoader(options);
    const JSZip = await loadZip();
    const zip = await JSZip.loadAsync(file);
    return Object.values(zip.files || {})
      .map((entry) => ({
        name: entry.name,
        size: entry.dir ? 0 : Number(entry?._data?.uncompressedSize || entry?._data?.length || 0),
        isDirectory: !!entry.dir
      }))
      .sort(compareArchiveEntries);
  } catch (error) {
    throw classifyArchiveError(error, options);
  }
}

export async function buildArchiveBlob(files, options = {}) {
  const format = options.format || 'zip';
  if (format === 'tar') return buildTarBlob(files);
  if (format === 'tar.gz') {
    const tar = await buildTarBlob(files);
    return new Blob([gzipStoredBytes(new Uint8Array(await tar.arrayBuffer()))], { type: 'application/gzip' });
  }

  const loadZip = getZipLoader(options);
  const JSZip = await loadZip();
  const zip = new JSZip();
  Array.from(files || []).forEach((file) => {
    zip.file(getArchivePath(file), file);
  });
  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });
}

export async function extractArchiveEntry(file, entryName, options = {}) {
  try {
    if (getArchiveOpenStrategy(file) === 'libarchive') {
      const extracted = await runArchiveBackend(file, 'archive-extract', { entryName }, options);
      return {
        blob: new Blob([extracted.buffer], { type: extracted.mimeType || 'application/octet-stream' }),
        fileName: getEntryFileName(extracted.name || entryName),
        mimeType: extracted.mimeType || 'application/octet-stream'
      };
    }

    const loadZip = getZipLoader(options);
    const JSZip = await loadZip();
    const zip = await JSZip.loadAsync(file);
    const entry = zip.files?.[entryName];
    if (!entry) throw new Error('Archive entry was not found.');
    if (entry.dir) throw new Error('Cannot extract a folder directly. Export the folder as ZIP instead.');
    return {
      blob: await entry.async('blob'),
      fileName: getEntryFileName(entry.name || entryName),
      mimeType: 'application/octet-stream'
    };
  } catch (error) {
    throw classifyArchiveError(error, options);
  }
}

export async function repackageArchiveAsZip(file, selection = {}, options = {}) {
  try {
    const format = selection.format || 'zip';
    if (getArchiveOpenStrategy(file) === 'libarchive') {
      const extractedFiles = await extractArchiveSelectionFiles(file, selection, options);
      return buildArchiveBlob(extractedFiles, { ...options, format });
    }

    const loadZip = getZipLoader(options);
    const JSZip = await loadZip();
    const sourceZip = await JSZip.loadAsync(file);
    const prefix = String(selection.prefix || '');
    const entries = Object.values(sourceZip.files || {})
      .filter((entry) => !entry.dir)
      .filter((entry) => !prefix || entry.name.startsWith(prefix));

    if (!entries.length) throw new Error('No files matched the archive export selection.');

    if (format === 'zip') {
      const outputZip = new JSZip();
      for (const entry of entries) {
        outputZip.file(entry.name, await entry.async('blob'));
      }
      return outputZip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      });
    }

    const files = [];
    for (const entry of entries) {
      const blob = await entry.async('blob');
      files.push(namedBlob(blob, entry.name));
    }

    return buildArchiveBlob(files, { ...options, format });
  } catch (error) {
    throw classifyArchiveError(error, options);
  }
}

export function getArchiveExplorerView(entries = [], currentPath = '') {
  const prefix = normalizeDirectoryPath(currentPath);
  const folders = new Map();
  const files = [];

  Array.from(entries || []).forEach((entry) => {
    const name = entry.isDirectory ? normalizeDirectoryPath(entry.name) : normalizeArchiveEntryName(entry.name);
    if (!name || name === prefix || !name.startsWith(prefix)) return;
    const childFolder = getDirectChildFolder(prefix, name);
    if (childFolder) {
      folders.set(childFolder, { name: childFolder, size: 0, isDirectory: true });
      return;
    }
    if (entry.isDirectory) folders.set(name, { ...entry, name, isDirectory: true });
    else files.push({ ...entry, name, isDirectory: false });
  });

  const segments = prefix.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'Root', path: '' }];
  let path = '';
  segments.forEach((segment) => {
    path += `${segment}/`;
    breadcrumbs.push({ label: segment, path });
  });

  return {
    path: prefix,
    parentPath: segments.length > 0 ? `${segments.slice(0, -1).join('/')}${segments.length > 1 ? '/' : ''}` : '',
    breadcrumbs,
    folders: Array.from(folders.values()).sort(compareArchiveEntries),
    files: files.sort(compareArchiveEntries)
  };
}

async function extractArchiveSelectionFiles(file, selection = {}, options = {}) {
  const result = await runArchiveBackend(file, 'archive-extract-selection', {
    prefix: normalizeDirectoryPath(selection.prefix || '')
  }, options);
  return Array.from(result.files || []).map((entry) => namedBlob(
    new Blob([entry.buffer], { type: entry.mimeType || 'application/octet-stream' }),
    normalizeArchiveWasmPath(entry.name)
  ));
}

function namedBlob(blob, name) {
  if (blob?.name === name) return blob;
  try {
    return new File([blob], name, {
      type: blob?.type || 'application/octet-stream',
      lastModified: blob?.lastModified || Date.now()
    });
  } catch {
    const next = new Blob([blob], { type: blob?.type || 'application/octet-stream' });
    Object.defineProperty(next, 'name', { value: name });
    Object.defineProperty(next, 'lastModified', { value: blob?.lastModified || Date.now() });
    return next;
  }
}

function createArchiveError(code, message, options = {}) {
  const error = new Error(options.message || message);
  error.name = 'ArchiveError';
  error.code = code;
  error.retryable = options.retryable !== false;
  if (options.cause) error.cause = options.cause;
  return error;
}

async function buildTarBlob(files) {
  const chunks = [];
  for (const file of Array.from(files || [])) {
    const name = getArchivePath(file).replace(/^\/+/, '');
    if (!name) continue;
    const bytes = new Uint8Array(await file.arrayBuffer());
    chunks.push(buildTarHeader({
      name,
      size: bytes.length,
      mtime: Math.floor(Number(file.lastModified || Date.now()) / 1000)
    }));
    chunks.push(bytes);
    const padding = (512 - (bytes.length % 512)) % 512;
    if (padding) chunks.push(new Uint8Array(padding));
  }
  chunks.push(new Uint8Array(1024));
  return new Blob(chunks, { type: 'application/x-tar' });
}

function buildTarHeader({ name, size, mtime }) {
  const header = new Uint8Array(512);
  writeTarString(header, 0, 100, name);
  writeTarOctal(header, 100, 8, 0o644);
  writeTarOctal(header, 108, 8, 0);
  writeTarOctal(header, 116, 8, 0);
  writeTarOctal(header, 124, 12, size);
  writeTarOctal(header, 136, 12, mtime);
  for (let index = 148; index < 156; index += 1) header[index] = 0x20;
  header[156] = 0x30;
  writeTarString(header, 257, 6, 'ustar');
  writeTarString(header, 263, 2, '00');
  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  writeTarOctal(header, 148, 8, checksum);
  return header;
}

function writeTarString(header, offset, length, value) {
  const bytes = new TextEncoder().encode(String(value || '').slice(0, length));
  header.set(bytes.slice(0, length), offset);
}

function writeTarOctal(header, offset, length, value) {
  const text = Math.max(0, Number(value) || 0).toString(8).padStart(length - 1, '0').slice(-(length - 1));
  writeTarString(header, offset, length, `${text}\0`);
}

export function gzipStoredBytes(payload) {
  const input = payload instanceof Uint8Array ? payload : new Uint8Array(payload || []);
  const blocks = [];
  for (let offset = 0; offset < input.length || offset === 0; offset += 65535) {
    const chunk = input.slice(offset, Math.min(input.length, offset + 65535));
    const final = offset + chunk.length >= input.length;
    const block = new Uint8Array(5 + chunk.length);
    block[0] = final ? 0x01 : 0x00;
    block[1] = chunk.length & 0xff;
    block[2] = (chunk.length >> 8) & 0xff;
    const nlen = (~chunk.length) & 0xffff;
    block[3] = nlen & 0xff;
    block[4] = (nlen >> 8) & 0xff;
    block.set(chunk, 5);
    blocks.push(block);
    if (!input.length) break;
  }

  const output = new Uint8Array(10 + blocks.reduce((sum, block) => sum + block.length, 0) + 8);
  output.set([0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03], 0);
  let cursor = 10;
  blocks.forEach((block) => {
    output.set(block, cursor);
    cursor += block.length;
  });
  const crc = crc32(input);
  writeUint32LE(output, cursor, crc);
  writeUint32LE(output, cursor + 4, input.length >>> 0);
  return output;
}

function writeUint32LE(bytes, offset, value) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) {
    crc ^= bytes[index];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

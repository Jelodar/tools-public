const SEVEN_ZIP_MODULE_URL = 'https://raw.esm.sh/7z-wasm@1.2.0/7zz.es6.js';
const SEVEN_ZIP_ASSET_BASE_URL = 'https://raw.esm.sh/7z-wasm@1.2.0/';

let archiveWasmRuntimePromise = null;
let sevenZipOutputCapture = null;
let workspaceId = 0;

export function createArchiveWasmLocateFile(options = {}) {
  const assetBaseUrl = options.assetBaseUrl || options.distBaseUrl || SEVEN_ZIP_ASSET_BASE_URL;
  return (path) => `${assetBaseUrl}${String(path || '').split('/').pop() || '7zz.wasm'}`;
}

export function normalizeArchiveWasmPath(path = '') {
  return String(path || '').replace(/^\/+/, '').replace(/\\/g, '/');
}

export function normalizeArchiveWasmDirectory(path = '') {
  const normalized = normalizeArchiveWasmPath(path);
  if (!normalized) return '';
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

export async function loadArchiveWasmRuntime(options = {}) {
  if (options.runtime) return normalizeSevenZipRuntime(options.runtime, options);
  const customLoader = options.loadArchiveWasm || globalThis.__archiveToolsArchiveWasmLoader;
  if (!customLoader && archiveWasmRuntimePromise) return archiveWasmRuntimePromise;

  const loadSevenZip = customLoader || (async () => import(SEVEN_ZIP_MODULE_URL));
  const runtimePromise = loadSevenZip().then((loaded) => normalizeSevenZipRuntime(loaded, options));

  if (!customLoader) archiveWasmRuntimePromise = runtimePromise;
  return runtimePromise;
}

export async function listArchiveWasmEntries(buffer, options = {}) {
  return withArchiveWorkspace(buffer, options, (runtime, paths) => {
    return listWorkspaceEntries(runtime.sevenZip, paths.inputPath, options);
  });
}

export async function extractArchiveWasmEntry(buffer, entryName, options = {}) {
  const targetName = normalizeArchiveWasmPath(entryName);
  return withArchiveWorkspace(buffer, options, (runtime, paths) => {
    const entries = listWorkspaceEntries(runtime.sevenZip, paths.inputPath, options);
    const record = entries.find((entry) => entry.name === targetName);
    if (!record) throw new Error('Archive entry was not found.');
    if (record.isDirectory) throw new Error('Cannot extract a folder directly. Export the folder as ZIP instead.');
    extractWorkspace(runtime.sevenZip, paths, options);
    const files = collectExtractedFiles(runtime.sevenZip, paths.outputPath);
    const extracted = files.find((entry) => entry.name === record.name);
    if (!extracted) throw new Error('Archive entry was not found.');
    return {
      name: record.name,
      buffer: extracted.buffer,
      mimeType: 'application/octet-stream'
    };
  });
}

export async function extractArchiveWasmSelection(buffer, selection = {}, options = {}) {
  const prefix = normalizeArchiveWasmDirectory(selection.prefix || '');
  return withArchiveWorkspace(buffer, options, (runtime, paths) => {
    const entries = listWorkspaceEntries(runtime.sevenZip, paths.inputPath, options);
    const wantedNames = new Set(entries
      .filter((entry) => !entry.isDirectory)
      .filter((entry) => !prefix || entry.name.startsWith(prefix))
      .map((entry) => entry.name));
    if (!wantedNames.size) throw new Error('No files matched the archive export selection.');

    extractWorkspace(runtime.sevenZip, paths, options);
    const files = collectExtractedFiles(runtime.sevenZip, paths.outputPath)
      .filter((entry) => wantedNames.has(entry.name))
      .map((entry) => ({
        name: entry.name,
        buffer: entry.buffer,
        mimeType: 'application/octet-stream'
      }));
    if (!files.length) throw new Error('No files matched the archive export selection.');
    return files;
  });
}

async function normalizeSevenZipRuntime(loaded, options = {}) {
  const existingSevenZip = loaded?.sevenZip || (loaded?.FS && loaded?.callMain ? loaded : null);
  if (existingSevenZip) return { sevenZip: existingSevenZip };

  const factory = loaded?.default || loaded?.SevenZip || loaded;
  if (typeof factory !== 'function') throw new Error('Archive WASM runtime is unavailable.');
  const sevenZip = await factory({
    locateFile: options.locateFile || createArchiveWasmLocateFile(options),
    print: (line) => captureSevenZipLine('output', line),
    printErr: (line) => captureSevenZipLine('error', line)
  });
  return { sevenZip };
}

async function withArchiveWorkspace(buffer, options, callback) {
  const runtime = await loadArchiveWasmRuntime(options);
  const sevenZip = runtime.sevenZip;
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer || new ArrayBuffer(0));
  const workspace = `/archive-tools-${Date.now()}-${workspaceId++}`;
  const paths = {
    workspace,
    inputPath: `${workspace}/input.archive`,
    outputPath: `${workspace}/out`
  };

  sevenZip.FS.mkdir(workspace);
  sevenZip.FS.mkdir(paths.outputPath);
  sevenZip.FS.writeFile(paths.inputPath, bytes);

  try {
    return callback(runtime, paths);
  } finally {
    removeFsTree(sevenZip.FS, workspace);
  }
}

function listWorkspaceEntries(sevenZip, inputPath, options = {}) {
  const output = runSevenZipCommand(sevenZip, [
    'l',
    '-slt',
    ...getSevenZipPasswordArgs(options),
    inputPath
  ]);
  return parseSevenZipListing(output.stdout);
}

function extractWorkspace(sevenZip, paths, options = {}) {
  runSevenZipCommand(sevenZip, [
    'x',
    '-y',
    ...getSevenZipPasswordArgs(options),
    paths.inputPath,
    `-o${paths.outputPath}`
  ]);
}

function runSevenZipCommand(sevenZip, args) {
  const capture = { stdout: [], stderr: [] };
  sevenZipOutputCapture = capture;
  try {
    const code = sevenZip.callMain(args);
    if (Number.isFinite(Number(code)) && Number(code) !== 0) {
      throw new Error(getSevenZipErrorMessage(capture, code));
    }
    return capture;
  } finally {
    sevenZipOutputCapture = null;
  }
}

function captureSevenZipLine(kind, line) {
  if (!sevenZipOutputCapture) return;
  const key = kind === 'error' ? 'stderr' : 'stdout';
  sevenZipOutputCapture[key].push(String(line || ''));
}

function getSevenZipPasswordArgs(options = {}) {
  const password = String(options.password || '');
  return password ? [`-p${password}`] : [];
}

function getSevenZipErrorMessage(capture, code) {
  const message = [...capture.stderr, ...capture.stdout]
    .map((line) => String(line || '').trim())
    .filter(Boolean)
    .slice(-6)
    .join(' ');
  return message || `Archive reader failed with exit code ${code}.`;
}

export function parseSevenZipListing(lines = []) {
  const entries = [];
  let record = null;
  let readingEntries = false;

  for (const rawLine of lines) {
    const line = String(rawLine || '').replace(/[\b\r]/g, '').trimEnd();
    if (line.trim() === '----------') {
      if (record) pushSevenZipRecord(entries, record);
      record = null;
      readingEntries = true;
      continue;
    }
    if (!readingEntries) continue;
    if (!line.trim()) {
      if (record) pushSevenZipRecord(entries, record);
      record = null;
      continue;
    }
    const match = line.match(/^([^=]+?)\s*=\s*(.*)$/);
    if (!match) continue;
    record ||= {};
    record[match[1].trim()] = match[2].trim();
  }

  if (record) pushSevenZipRecord(entries, record);
  return entries;
}

function pushSevenZipRecord(entries, record) {
  const name = normalizeArchiveWasmPath(record.Path || '');
  if (!name) return;
  const attributes = String(record.Attributes || '');
  const isDirectory = attributes.trim().startsWith('D') || name.endsWith('/');
  entries.push({
    name: isDirectory ? normalizeArchiveWasmDirectory(name) : name,
    size: isDirectory ? 0 : Number(record.Size || 0) || 0,
    isDirectory
  });
}

function collectExtractedFiles(sevenZip, outputPath, prefix = '') {
  const files = [];
  const names = sevenZip.FS.readdir(outputPath).filter((name) => name !== '.' && name !== '..');
  for (const name of names) {
    const fullPath = `${outputPath}/${name}`;
    const entryName = prefix ? `${prefix}/${name}` : name;
    const stat = sevenZip.FS.stat(fullPath);
    if (sevenZip.FS.isDir(stat.mode)) {
      files.push(...collectExtractedFiles(sevenZip, fullPath, entryName));
      continue;
    }
    const data = sevenZip.FS.readFile(fullPath);
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data || []);
    files.push({
      name: normalizeArchiveWasmPath(entryName),
      buffer: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    });
  }
  return files;
}

function removeFsTree(FS, path) {
  try {
    const stat = FS.stat(path);
    if (!FS.isDir(stat.mode)) {
      FS.unlink(path);
      return;
    }
    for (const name of FS.readdir(path)) {
      if (name === '.' || name === '..') continue;
      removeFsTree(FS, `${path}/${name}`);
    }
    FS.rmdir(path);
  } catch {}
}

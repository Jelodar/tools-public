import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { buildWaveformPyramid } from '../utils/media-trimmer.js';
import { summarizeJsonValue, setValueAtPointer, deleteValueAtPointer } from '../utils/json-document.js';
import { processTrimAudioSamples, samplesToWavBuffer } from '../utils/audio-trim-processing.js';

/**
 * Main Web Worker
 * Handles high-compute crypto and media tasks.
 */
let ffmpeg = null;
let ffmpegTelemetryBound = false;

// Shared JSON sessions in worker memory
const jsonSessions = new Map();

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  try {
    let result;
    switch (type) {
      case 'hash':
        result = await handleHash(payload);
        break;
      case 'sqlite-query':
        result = await handleSQLite(payload);
        break;
      case 'ffmpeg-cmd':
        result = await handleFFmpeg(payload);
        break;
      case 'waveform-pyramid':
        result = await handleWaveformPyramid(payload);
        break;
      case 'waveform-pyramid-samples':
        result = await handleWaveformSamples(payload);
        break;
      case 'json-op':
        result = await handleJsonOp(payload);
        break;
      case 'audio-process':
        result = await handleAudioProcess(payload);
        break;
      default:
        throw new Error(`Unsupported task type: ${type}`);
    }
    
    if (result === undefined) {
      throw new Error(`Task ${type} completed but returned no result.`);
    }

    self.postMessage({ success: true, result });
  } catch (err) {
    console.error(`Worker error [${type}]:`, err);
    self.postMessage({ success: false, error: err.message });
  }
};

async function handleHash({ buffer, file, algorithm, key, encoding = 'hex' }) {
  const algo = algorithm.toUpperCase().replace(/-/g, '');
  let hasher;
  const BASE_URL = 'https://esm.sh/@noble/hashes@1.3.1';

  if (algo === 'SHA256' || algo === 'SHA224') {
    const { sha256, sha224 } = await import(`${BASE_URL}/sha256.js`);
    hasher = algo === 'SHA256' ? sha256 : sha224;
  } else if (algo === 'SHA512' || algo === 'SHA384') {
    const { sha512, sha384 } = await import(`${BASE_URL}/sha512.js`);
    hasher = algo === 'SHA512' ? sha512 : sha384;
  } else if (algo === 'SHA1') {
    const { sha1 } = await import(`${BASE_URL}/sha1.js`);
    hasher = sha1;
  } else if (algo === 'MD5') {
    const { md5 } = await import(`${BASE_URL}/md5.js`);
    hasher = md5;
  } else if (algo.startsWith('SHA3') || algo.startsWith('KECCAK')) {
    const { sha3_256, sha3_512, sha3_224, sha3_384, keccak_256, keccak_512 } = await import(`${BASE_URL}/sha3.js`);
    if (algo === 'SHA3256') hasher = sha3_256;
    else if (algo === 'SHA3512') hasher = sha3_512;
    else if (algo === 'SHA3224') hasher = sha3_224;
    else if (algo === 'SHA3384') hasher = sha3_384;
    else if (algo === 'KECCAK256') hasher = keccak_256;
    else if (algo === 'KECCAK512') hasher = keccak_512;
  } else if (algo === 'BLAKE3') {
    const { blake3 } = await import(`${BASE_URL}/blake3.js`);
    hasher = blake3;
  } else if (algo === 'BLAKE2B') {
    const { blake2b } = await import(`${BASE_URL}/blake2b.js`);
    hasher = blake2b;
  } else if (algo === 'BLAKE2S') {
    const { blake2s } = await import(`${BASE_URL}/blake2s.js`);
    hasher = blake2s;
  } else if (algo === 'RIPEMD160') {
    const { ripemd160 } = await import(`${BASE_URL}/ripemd160.js`);
    hasher = ripemd160;
  }
  
  if (!hasher) throw new Error(`Algorithm ${algorithm} not supported.`);

  let hashResult;
  if (key) {
    const { hmac } = await import(`${BASE_URL}/hmac.js`);
    const h = hmac.create(hasher, key);
    if (file) await processFileInChunks(file, (chunk) => h.update(new Uint8Array(chunk)));
    else h.update(new Uint8Array(buffer));
    hashResult = h.digest();
  } else {
    const h = hasher.create();
    if (file) await processFileInChunks(file, (chunk) => h.update(new Uint8Array(chunk)));
    else h.update(new Uint8Array(buffer));
    hashResult = h.digest();
  }

  if (encoding === 'base64') return btoa(String.fromCharCode(...hashResult));
  return Array.from(hashResult).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function processFileInChunks(file, onChunk) {
  const chunkSize = 2 * 1024 * 1024;
  let offset = 0;
  const total = file.size;
  while (offset < total) {
    const slice = file.slice(offset, offset + chunkSize);
    const chunk = await slice.arrayBuffer();
    onChunk(chunk);
    offset += chunkSize;
    self.postMessage({ type: 'progress', payload: { percent: Math.min(100, (offset/total)*100) } });
  }
}

async function handleSQLite({ dbBuffer, sql = '', params = [], includeMetadata = true }) {
  const initSqlJs = (await import('https://esm.sh/sql.js@1.8.0')).default;
  const SQL = await initSqlJs({ locateFile: file => `https://esm.sh/sql.js@1.8.0/dist/${file}` });
  const db = dbBuffer ? new SQL.Database(new Uint8Array(dbBuffer)) : new SQL.Database();
  const statements = Array.isArray(sql) ? sql : [sql];
  let result = [];

  statements.forEach((statement, index) => {
    if (!String(statement || '').trim()) return;
    const statementParams = Array.isArray(params[index]) ? params[index] : params;
    result = db.exec(statement, statementParams);
  });

  const changes = db.getRowsModified?.() || 0;
  const exported = db.export();
  const output = exported.buffer.slice(exported.byteOffset, exported.byteOffset + exported.byteLength);
  const metadata = includeMetadata ? getSQLiteMetadata(db) : null;
  db.close();
  return {
    result,
    changes,
    dbBuffer: output,
    metadata
  };
}

function getSQLiteRows(db, sql, params = []) {
  const result = db.exec(sql, params)[0];
  if (!result) return [];
  return result.values.map((row) => Object.fromEntries(result.columns.map((column, index) => [column, row[index]])));
}

function quoteSQLiteWorkerIdentifier(identifier) {
  return `"${String(identifier || '').replace(/"/g, '""')}"`;
}

function getSQLiteMetadata(db) {
  const objects = getSQLiteRows(
    db,
    `SELECT type, name, tbl_name AS tableName, sql FROM sqlite_master WHERE type IN ('table', 'view', 'index', 'trigger') AND name NOT LIKE 'sqlite_%' ORDER BY type, name`
  );
  const tables = objects
    .filter((entry) => entry.type === 'table')
    .map((entry) => {
      const quotedName = quoteSQLiteWorkerIdentifier(entry.name);
      const rowCount = getSQLiteRows(db, `SELECT COUNT(*) AS count FROM ${quotedName}`)[0]?.count || 0;
      return {
        ...entry,
        rowCount,
        columns: getSQLiteRows(db, `PRAGMA table_info(${quotedName})`),
        foreignKeys: getSQLiteRows(db, `PRAGMA foreign_key_list(${quotedName})`),
        indexes: getSQLiteRows(db, `PRAGMA index_list(${quotedName})`)
      };
    });

  return {
    objects,
    tables,
    views: objects.filter((entry) => entry.type === 'view'),
    indexes: objects.filter((entry) => entry.type === 'index'),
    triggers: objects.filter((entry) => entry.type === 'trigger')
  };
}

async function handleFFmpeg({ files, command, commandSequence, outputFileName }) {
  const engine = await ensureFFmpeg();
  
  self.postMessage({ type: 'ffmpeg-status', payload: { phase: 'writing-inputs', message: 'Writing source files' } });
  for (const file of files) {
    await engine.writeFile(file.name, await fetchFile(new Blob([file.buffer])));
  }

  const sequence = Array.isArray(commandSequence) && commandSequence.length
    ? commandSequence
    : [{ name: 'FFmpeg command', command, outputFileName }];
  for (const [index, step] of sequence.entries()) {
    const stepCommand = step.command || [];
    self.postMessage({
      type: 'ffmpeg-status',
      payload: {
        phase: 'running',
        message: `${step.name || 'Running FFmpeg command'} (${index + 1}/${sequence.length})`
      }
    });
    const code = await engine.exec(stepCommand);
    if (code !== 0) {
      throw new Error(`FFmpeg execution failed with exit code ${code}`);
    }
  }

  const finalStep = sequence.at(-1) || {};
  const finalCommand = finalStep.command || command || [];
  const resolvedOutputFileName = outputFileName || finalStep.outputFileName || finalCommand[finalCommand.length - 1];
  self.postMessage({ type: 'ffmpeg-status', payload: { phase: 'reading-output', message: `Reading ${resolvedOutputFileName}` } });
  const data = await engine.readFile(resolvedOutputFileName);
  
  for (const file of files) {
    try { await engine.deleteFile(file.name); } catch(e) {}
  }
  for (const step of sequence) {
    const stepOutput = step.outputFileName;
    if (stepOutput && stepOutput !== resolvedOutputFileName) {
      try { await engine.deleteFile(stepOutput); } catch(e) {}
    }
  }
  try { await engine.deleteFile(resolvedOutputFileName); } catch(e) {}
  
  if (!data || !data.buffer) {
    throw new Error(`FFmpeg completed but output file ${resolvedOutputFileName} is empty or missing.`);
  }

  self.postMessage({ type: 'ffmpeg-status', payload: { phase: 'complete', message: 'FFmpeg job complete' } });
  return { name: resolvedOutputFileName, buffer: data.buffer };
}

async function ensureFFmpeg() {
  if (ffmpeg) return ffmpeg;
  self.postMessage({ type: 'ffmpeg-status', payload: { phase: 'loading-core', message: 'Loading FFmpeg core' } });
  ffmpeg = new FFmpeg();
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
  await ffmpeg.load({
    coreURL: `${baseURL}/ffmpeg-core.js`,
    wasmURL: `${baseURL}/ffmpeg-core.wasm`,
  });

  if (!ffmpegTelemetryBound) {
    ffmpeg.on('log', ({ message }) => {
      self.postMessage({ type: 'ffmpeg-log', payload: { message } });
    });
    ffmpeg.on('progress', ({ progress, time }) => {
      self.postMessage({
        type: 'ffmpeg-progress',
        payload: {
          progress: Math.max(0, Math.min(100, Number(progress || 0) * 100)),
          time: Number(time || 0)
        }
      });
    });
    ffmpegTelemetryBound = true;
  }
  return ffmpeg;
}

function buildWaveformPreviewSamples(samples, maxFrames, sampleRate) {
  const source = samples instanceof Float32Array ? samples : new Float32Array(0);
  const limit = Math.max(1, Math.floor(Number(maxFrames) || 1));
  if (source.length <= limit) {
    return {
      samples: source.slice(0),
      sampleRate: Math.max(1, Number(sampleRate) || 1)
    };
  }
  const output = new Float32Array(limit);
  const windowSize = source.length / limit;
  for (let index = 0; index < limit; index += 1) {
    const start = Math.floor(index * windowSize);
    const end = Math.min(source.length, Math.max(start + 1, Math.floor((index + 1) * windowSize)));
    let peak = 0;
    for (let offset = start; offset < end; offset += 1) {
      const sample = source[offset] || 0;
      if (Math.abs(sample) > Math.abs(peak)) peak = sample;
    }
    output[index] = peak;
  }
  return {
    samples: output,
    sampleRate: Math.max(1, Number(sampleRate) || 1) * (limit / source.length)
  };
}

async function handleWaveformPyramid({ fileName, fileBuffer, maxBins = 4096, includeSamples = false, maxSampleFrames = 2000000 }) {
  const engine = await ensureFFmpeg();
  const inputName = fileName || 'media';
  const outputName = 'waveform.f32';
  try {
    self.postMessage({ type: 'waveform-status', payload: { phase: 'decoding', message: 'Decoding media for waveform' } });
    await engine.writeFile(inputName, await fetchFile(new Blob([fileBuffer])));
    const command = [
      '-i', inputName,
      '-vn',
      '-ac', '1',
      '-ar', '12000',
      '-f', 'f32le',
      outputName
    ];
    const code = await engine.exec(command);
    if (code !== 0) throw new Error(`Waveform analysis failed with exit code ${code}`);
    const data = await engine.readFile(outputName);
    const samples = new Float32Array(data.buffer.slice(0));
    self.postMessage({ type: 'waveform-status', payload: { phase: 'analyzing', message: 'Building waveform cache' } });
    const sampleRate = 12000;
    const pyramid = buildWaveformPyramid({ samples, maxBins });
    const previewSamples = includeSamples ? buildWaveformPreviewSamples(samples, maxSampleFrames, sampleRate) : null;
    self.postMessage({ type: 'waveform-status', payload: { phase: 'complete', message: 'Waveform ready' } });
    return {
      duration: Number((samples.length / sampleRate).toFixed(3)),
      sampleRate,
      samplesSampleRate: previewSamples?.sampleRate || 0,
      samples: previewSamples?.samples || null,
      levels: pyramid.levels
    };
  } finally {
    try { await engine.deleteFile(inputName); } catch {}
    try { await engine.deleteFile(outputName); } catch {}
  }
}

function handleWaveformSamples({ sampleBuffer, sampleRate = 44100, maxBins = 4096 }) {
  self.postMessage({ type: 'waveform-status', payload: { phase: 'analyzing', message: 'Building waveform cache' } });
  const samples = new Float32Array(sampleBuffer);
  const pyramid = buildWaveformPyramid({ samples, maxBins });
  self.postMessage({ type: 'waveform-status', payload: { phase: 'complete', message: 'Waveform ready' } });
  return {
    duration: Number((samples.length / Math.max(1, sampleRate)).toFixed(3)),
    sampleRate,
    levels: pyramid.levels
  };
}

async function handleJsonOp({ op, sessionId, payload }) {
  if (op === 'load') {
    const value = JSON.parse(payload.text);
    const summary = summarizeJsonValue(value);
    jsonSessions.set(sessionId, { value, summary });
    return { summary };
  }

  const session = jsonSessions.get(sessionId);
  if (!session) throw new Error(`JSON session ${sessionId} not found in worker.`);

  switch (op) {
    case 'get-summary':
      return { summary: summarizeJsonValue(session.value) };
    case 'format':
    case 'minify':
      // Just confirm existence and return summary, 
      // the actual formatting is done on export/preview
      return { summary: summarizeJsonValue(session.value) };
    case 'set': {
      const nextValue = JSON.parse(payload.valueText);
      session.value = setValueAtPointer(session.value, payload.pointer, nextValue);
      session.summary = summarizeJsonValue(session.value);
      return { summary: session.summary };
    }
    case 'delete': {
      session.value = deleteValueAtPointer(session.value, payload.pointer);
      session.summary = summarizeJsonValue(session.value);
      return { summary: session.summary };
    }
    case 'query': {
      const { JSONPath } = await import('https://esm.sh/jsonpath-plus@7.2.0');
      const result = JSONPath({ path: payload.query, json: session.value });
      return { result, summary: summarizeJsonValue(result) };
    }
    case 'export': {
      return { text: JSON.stringify(session.value, null, payload.indent || 0) };
    }
    case 'clear': {
      jsonSessions.delete(sessionId);
      return { success: true };
    }
    default:
      throw new Error(`Unsupported JSON operation: ${op}`);
  }
}

async function handleAudioProcess(payload) {
  const processedSamples = processTrimAudioSamples({
    sampleBuffer: payload.sampleBuffer,
    sampleRate: payload.sampleRate,
    start: payload.start,
    end: payload.end,
    speed: payload.speed,
    pitch: payload.pitch,
    gain: payload.gain,
    effects: payload.effects,
    volumeEnvelope: payload.volumeEnvelope,
    noiseProfile: payload.noiseProfile,
    noiseAmount: payload.noiseAmount,
    levelerAmount: payload.levelerAmount
  });
  const wavBuffer = samplesToWavBuffer(processedSamples, payload.sampleRate);
  return {
    wavBuffer,
    sampleBuffer: processedSamples.buffer,
    duration: processedSamples.length / Math.max(1, Number(payload.sampleRate) || 1)
  };
}

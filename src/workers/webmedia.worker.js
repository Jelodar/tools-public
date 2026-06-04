import {
  buildWebMediaOutputName,
  createWebMediaInspection,
  planWebMediaOperation
} from '../utils/webmedia-plan.js';
import {
  buildWebMediaHlsPackageBlob,
  buildWebMediaSubtitlePackageBlob
} from '../utils/webmedia-package.js';

const MEDIABUNNY_MODULE_URL = 'https://esm.sh/mediabunny@1.45.4';
const activeJobs = new Map();
const SUPPORTED_MESSAGES = new Set(['ready', 'capabilities', 'inspect', 'plan', 'run', 'cancel']);

export function normalizeWebMediaWorkerMessage(message = {}) {
  const type = String(message.type || '');
  if (!SUPPORTED_MESSAGES.has(type)) {
    throw new Error(`Unsupported web media message: ${type || 'missing'}`);
  }
  return {
    requestId: message.requestId || '',
    type,
    payload: message.payload || {}
  };
}

export async function handleWebMediaWorkerMessage(message = {}, context = {}) {
  const normalized = normalizeWebMediaWorkerMessage(message);
  const emit = typeof context.emit === 'function' ? context.emit : () => {};
  const jobs = context.jobs || activeJobs;

  try {
    if (normalized.type === 'ready' || normalized.type === 'capabilities') return;

    if (normalized.type === 'inspect') {
      emit({
        type: 'progress',
        payload: {
          phase: 'inspect',
          percent: 8,
          processedBytes: 0
        }
      });
      const metadataResult = await readMediabunnyMetadata(normalized.payload.mediaFile || normalized.payload.file, context);
      const inspection = createWebMediaInspection(normalized.payload.file || {}, {
        tracks: normalized.payload.tracks,
        capabilities: normalized.payload.capabilities,
        metadata: metadataResult.metadata,
        warnings: metadataResult.warnings
      });
      emit({
        type: 'progress',
        payload: {
          phase: 'inspect',
          percent: 100,
          processedBytes: inspection.size || 0
        }
      });
      emit({
        type: 'result',
        payload: { inspection }
      });
      return;
    }

    if (normalized.type === 'plan') {
      const plan = planWebMediaOperation(normalized.payload);
      emit({
        type: 'result',
        payload: { plan }
      });
      return;
    }

    if (normalized.type === 'cancel') {
      const jobId = normalized.payload.jobId;
      const job = jobs.get(jobId) || { canceled: false };
      job.canceled = true;
      if (typeof job.cancel === 'function') await job.cancel();
      jobs.set(jobId, job);
      emit({
        type: 'warning',
        payload: {
          code: 'JOB_CANCELED',
          message: 'Job canceled.'
        }
      });
      emit({
        type: 'result',
        payload: {
          canceled: true,
          jobId
        }
      });
      return;
    }

    await runWebMediaJob(normalized.payload, { emit, jobs, context });
  } catch (error) {
    emit({
      type: 'error',
      payload: normalizeWebMediaError(error)
    });
  }
}

export function normalizeWebMediaError(error = {}) {
  if (error.code && error.message) {
    return {
      code: error.code,
      message: error.message,
      recoverable: error.recoverable !== false,
      suggestedRoute: error.suggestedRoute || ''
    };
  }
  return {
    code: 'WEBMEDIA_WORKER_ERROR',
    message: error?.message || String(error),
    recoverable: true,
    suggestedRoute: ''
  };
}

export async function readMediabunnyMetadata(file, context = {}) {
  if (!file || (!context.loadMediabunny && !isBlobLike(file))) {
    return { metadata: null, warnings: [] };
  }

  try {
    const loader = context.loadMediabunny || loadMediabunny;
    const mediabunny = await loader();
    const metadata = await inspectMediabunnyFile(file, mediabunny);
    return { metadata, warnings: [] };
  } catch (error) {
    return {
      metadata: null,
      warnings: [{
        code: 'MEDIA_METADATA_UNAVAILABLE',
        message: error?.message || 'Mediabunny metadata inspection was unavailable.'
      }]
    };
  }
}

async function loadMediabunny() {
  return import(MEDIABUNNY_MODULE_URL);
}

async function inspectMediabunnyFile(file, mediabunny = {}) {
  const { ALL_FORMATS, BlobSource, Input } = mediabunny;
  if (!ALL_FORMATS || typeof BlobSource !== 'function' || typeof Input !== 'function') {
    throw new Error('Mediabunny metadata APIs are unavailable.');
  }

  const input = new Input({
    formats: ALL_FORMATS,
    source: new BlobSource(file)
  });

  try {
    const tracks = await readOptional(() => input.getTracks(), []);
    const duration = await readOptional(() => input.computeDuration(), 0);
    const tags = await readOptional(() => input.getMetadataTags(), {});
    const metadataTracks = [];

    for (let index = 0; index < tracks.length; index += 1) {
      metadataTracks.push(await readMediabunnyTrackMetadata(tracks[index], index));
    }

    return {
      provider: 'mediabunny',
      depth: 'metadata',
      duration: numberOrZero(duration),
      tracks: metadataTracks,
      tags
    };
  } finally {
    const dispose = input.dispose || input.close;
    if (typeof dispose === 'function') await dispose.call(input);
  }
}

async function readMediabunnyTrackMetadata(track = {}, index = 0) {
  const kind = normalizeTrackKind(track.type || track.kind);
  const decoderConfig = await readOptional(() => track.getDecoderConfig?.(), null);
  const packetStats = kind === 'video'
    ? await readOptional(() => track.computePacketStats?.(100), null)
    : null;

  return {
    id: String(track.id ?? `${kind}-${index + 1}`),
    kind,
    codec: stringifyCodec(decoderConfig?.codec || track.codec),
    codecString: stringifyCodec(decoderConfig?.codec || track.codec),
    width: kind === 'video' ? numberOrZero(await readOptional(() => track.getDisplayWidth?.(), 0)) : 0,
    height: kind === 'video' ? numberOrZero(await readOptional(() => track.getDisplayHeight?.(), 0)) : 0,
    sampleRate: kind === 'audio' ? numberOrZero(await readOptional(() => track.getSampleRate?.(), decoderConfig?.sampleRate || 0)) : 0,
    channels: kind === 'audio' ? numberOrZero(await readOptional(() => track.getNumberOfChannels?.(), decoderConfig?.numberOfChannels || 0)) : 0,
    duration: numberOrZero(await readOptional(() => track.computeDuration?.(), 0)),
    language: String(track.language || ''),
    rotation: kind === 'video' ? numberOrZero(await readOptional(() => track.getRotation?.(), 0)) : 0,
    frameRate: kind === 'video' ? numberOrZero(packetStats?.averagePacketRate) : 0,
    decodable: await readOptional(() => track.canDecode?.(), false) === true
  };
}

async function readOptional(reader, fallback) {
  try {
    if (typeof reader !== 'function') return fallback;
    const value = await reader();
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeTrackKind(value) {
  const kind = String(value || '').toLowerCase();
  if (kind === 'video' || kind === 'audio' || kind === 'subtitle') return kind;
  if (kind === 'subtitles' || kind === 'text') return 'subtitle';
  return 'unknown';
}

function stringifyCodec(codec) {
  if (!codec) return '';
  if (typeof codec === 'string') return codec;
  if (typeof codec === 'object') {
    const value = codec.codec || codec.name || codec.id || codec.label;
    if (value) return String(value);
  }
  const value = String(codec);
  return value === '[object Object]' ? '' : value;
}

function numberOrZero(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function isBlobLike(file) {
  return typeof Blob === 'function' && file instanceof Blob;
}

async function runWebMediaJob(payload = {}, { emit, jobs, context = {} }) {
  const jobId = payload.jobId || `webmedia-${Math.random().toString(36).slice(2, 9)}`;
  const job = jobs.get(jobId) || { canceled: false };
  jobs.set(jobId, job);
  emit({
    type: 'progress',
    payload: {
      phase: 'start',
      percent: 0,
      processedBytes: 0
    }
  });

  if (job.canceled) {
    emit({
      type: 'error',
      payload: {
        code: 'JOB_CANCELED',
        message: 'Job canceled.',
        recoverable: true
      }
    });
    return;
  }

  const plan = payload.plan || {};
  if (plan.operation === 'inspect' || plan.mode === 'Inspect') {
    const summary = JSON.stringify({ plan, source: plan.source || {} }, null, 2);
    emit({
      type: 'progress',
      payload: {
        phase: 'report',
        percent: 100,
        outputBytes: summary.length
      }
    });
    emit({
      type: 'result',
      payload: {
        blob: new Blob([summary], { type: 'application/json' }),
        filename: buildWebMediaOutputName(plan.source?.fileName || 'media', {
          output: { extension: 'json' }
        }),
        mime: 'application/json',
        summary: { mode: 'Inspect', bytes: summary.length }
      }
    });
    jobs.delete(jobId);
    return;
  }

  if (isMediabunnyConversionPlan(plan)) {
    if (!payload.mediaFile) {
      emit({
        type: 'error',
        payload: {
          code: 'WEBMEDIA_SOURCE_MISSING',
          message: 'Original media file is required for browser-native export.',
          recoverable: true
        }
      });
      jobs.delete(jobId);
      return;
    }

    try {
      const result = await runMediabunnyConversionJob(payload.mediaFile, plan, { emit, job, loadMediabunny: context.loadMediabunny });
      emit({
        type: 'result',
        payload: result
      });
    } catch (error) {
      emit({
        type: 'error',
        payload: normalizeWebMediaError(job.canceled ? {
          code: 'JOB_CANCELED',
          message: 'Job canceled.',
          recoverable: true
        } : error)
      });
    } finally {
      jobs.delete(jobId);
    }
    return;
  }

  if (plan.execution === 'webmedia-subtitle-package') {
    try {
      const result = await runSubtitlePackageJob(plan, { emit });
      emit({
        type: 'result',
        payload: result
      });
    } finally {
      jobs.delete(jobId);
    }
    return;
  }

  if (plan.execution === 'webmedia-hls-package') {
    if (!payload.mediaFile) {
      emit({
        type: 'error',
        payload: {
          code: 'WEBMEDIA_SOURCE_MISSING',
          message: 'Original media file is required for HLS package export.',
          recoverable: true
        }
      });
      jobs.delete(jobId);
      return;
    }

    try {
      const result = await runHlsPackageJob(payload.mediaFile, plan, { emit, job, loadMediabunny: context.loadMediabunny });
      emit({
        type: 'result',
        payload: result
      });
    } catch (error) {
      emit({
        type: 'error',
        payload: normalizeWebMediaError(job.canceled ? {
          code: 'JOB_CANCELED',
          message: 'Job canceled.',
          recoverable: true
        } : error)
      });
    } finally {
      jobs.delete(jobId);
    }
    return;
  }

  emit({
    type: 'error',
    payload: {
      code: 'WEBMEDIA_EXECUTION_PENDING',
      message: 'This browser-native export path is planned but not enabled until fixture verification passes.',
      recoverable: true,
      suggestedRoute: '/video-studio'
    }
  });
  jobs.delete(jobId);
}

function isMediabunnyConversionPlan(plan = {}) {
  const legacyRemux = plan.operation === 'remux' && plan.mode === 'Remux' && plan.requiresReencode === false && plan.remuxOnly === true;
  return (
    (plan.execution === 'mediabunny-conversion' || legacyRemux) &&
    ['remux', 'transcode', 'trim', 'transform', 'audio', 'subtitles'].includes(plan.operation) &&
    (!Array.isArray(plan.errors) || plan.errors.length === 0)
  );
}

async function runSubtitlePackageJob(plan, { emit }) {
  emit({
    type: 'progress',
    payload: {
      phase: 'subtitle-package',
      percent: 40
    }
  });
  const blob = await buildWebMediaSubtitlePackageBlob(plan);
  emit({
    type: 'progress',
    payload: {
      phase: 'subtitle-package',
      percent: 100,
      outputBytes: blob.size
    }
  });
  return {
    blob,
    filename: buildWebMediaOutputName(plan.source?.fileName || 'media', plan),
    mime: 'application/zip',
    summary: { mode: 'Package', bytes: blob.size }
  };
}

async function runHlsPackageJob(file, plan, { emit, job, loadMediabunny }) {
  emit({
    type: 'progress',
    payload: {
      phase: 'hls-package',
      percent: 8,
      processedBytes: 0
    }
  });
  const segmentBlob = canUseSourceAsHlsSegment(plan)
    ? file
    : (await runMediabunnyConversionJob(file, createHlsSegmentPlan(plan), {
      emit: (event) => {
        if (event.type !== 'progress') {
          emit(event);
          return;
        }
        emit({
          type: 'progress',
          payload: {
            ...event.payload,
            phase: 'hls-package',
            percent: Math.max(10, Math.min(88, Number(event.payload.percent || 0)))
          }
        });
      },
      job,
      loadMediabunny
    })).blob;

  if (job.canceled) {
    throw {
      code: 'JOB_CANCELED',
      message: 'Job canceled.',
      recoverable: true
    };
  }

  const blob = await buildWebMediaHlsPackageBlob(segmentBlob, plan);
  emit({
    type: 'progress',
    payload: {
      phase: 'hls-package',
      percent: 100,
      outputBytes: blob.size
    }
  });
  return {
    blob,
    filename: buildWebMediaOutputName(plan.source?.fileName || file.name || 'media', plan),
    mime: 'application/zip',
    summary: { mode: 'Package', bytes: blob.size }
  };
}

function canUseSourceAsHlsSegment(plan = {}) {
  return plan.source?.container === 'mpegts' &&
    !Object.keys(plan.conversion?.video || {}).length &&
    !Object.keys(plan.conversion?.audio || {}).length;
}

function createHlsSegmentPlan(plan = {}) {
  return {
    ...plan,
    targetContainer: 'mpegts',
    output: {
      container: 'mpegts',
      label: 'MPEG-TS',
      extension: 'ts',
      mime: 'video/mp2t'
    },
    execution: 'mediabunny-conversion',
    errors: []
  };
}

async function runMediabunnyConversionJob(file, plan, { emit, job, loadMediabunny }) {
  const loader = loadMediabunny || loadMediabunnyModule;
  const mediabunny = await loader();
  const {
    ALL_FORMATS,
    BlobSource,
    BufferTarget,
    Conversion,
    Input,
    Output
  } = mediabunny;

  if (!ALL_FORMATS || typeof BlobSource !== 'function' || typeof BufferTarget !== 'function' || typeof Conversion?.init !== 'function' || typeof Input !== 'function' || typeof Output !== 'function') {
    throw {
      code: 'WEBMEDIA_RUNTIME_UNAVAILABLE',
      message: 'Mediabunny conversion APIs are unavailable.',
      recoverable: true
    };
  }

  const input = new Input({
    formats: ALL_FORMATS,
    source: new BlobSource(file)
  });
  const target = new BufferTarget();
  const output = new Output({
    format: createMediabunnyOutputFormat(plan, mediabunny),
    target
  });
  const conversionOptions = {
    input,
    output,
    ...buildMediabunnyConversionOptions(plan),
    showWarnings: false
  };
  const conversion = await Conversion.init(conversionOptions);

  job.cancel = async () => conversion.cancel?.();

  if (!conversion.isValid) {
    throw {
      code: 'WEBMEDIA_CONVERSION_INVALID',
      message: formatDiscardedTracks(conversion.discardedTracks) || 'Mediabunny rejected this conversion plan.',
      recoverable: true,
      suggestedRoute: '/video-studio'
    };
  }

  if (Array.isArray(conversion.discardedTracks) && conversion.discardedTracks.length) {
    throw {
      code: 'WEBMEDIA_CONVERSION_DISCARDED_TRACKS',
      message: formatDiscardedTracks(conversion.discardedTracks),
      recoverable: true,
      suggestedRoute: '/video-studio'
    };
  }

  conversion.onProgress = (progress, processedTime) => {
    emit({
      type: 'progress',
      payload: {
        phase: plan.operation || 'convert',
        percent: Math.max(1, Math.min(99, Math.round(Number(progress || 0) * 100))),
        processedTime: Number(processedTime || 0)
      }
    });
  };

  if (job.canceled) {
    throw {
      code: 'JOB_CANCELED',
      message: 'Job canceled.',
      recoverable: true
    };
  }

  await conversion.execute();

  if (job.canceled) {
    throw {
      code: 'JOB_CANCELED',
      message: 'Job canceled.',
      recoverable: true
    };
  }

  const buffer = target.buffer || output.target?.buffer || new ArrayBuffer(0);
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const blob = new Blob([bytes], { type: plan.output?.mime || 'application/octet-stream' });
  emit({
    type: 'progress',
    payload: {
      phase: plan.operation || 'convert',
      percent: 100,
      outputBytes: blob.size
    }
  });

  return {
    blob,
    filename: buildWebMediaOutputName(plan.source?.fileName || file.name || 'media', plan),
    mime: plan.output?.mime || 'application/octet-stream',
    summary: { mode: plan.mode || 'Export', bytes: blob.size }
  };
}

function buildMediabunnyConversionOptions(plan = {}) {
  const source = plan.conversion || {};
  const options = {};
  if (source.tracks === 'all' || source.tracks === 'primary') options.tracks = source.tracks;
  const video = sanitizeConversionVideoOptions(source.video);
  const audio = sanitizeConversionAudioOptions(source.audio);
  const trim = sanitizeTrimOptions(source.trim);
  const tags = sanitizeTags(source.tags);
  if (Object.keys(video).length) options.video = video;
  if (Object.keys(audio).length) options.audio = audio;
  if (Object.keys(trim).length) options.trim = trim;
  if (Object.keys(tags).length) options.tags = tags;
  return options;
}

function sanitizeConversionVideoOptions(input = {}) {
  const output = {};
  if (input.discard === true) output.discard = true;
  if (['avc', 'hevc', 'vp8', 'vp9', 'av1'].includes(input.codec)) output.codec = input.codec;
  if (positiveInteger(input.width)) output.width = positiveInteger(input.width);
  if (positiveInteger(input.height)) output.height = positiveInteger(input.height);
  if (['fill', 'contain', 'cover'].includes(input.fit)) output.fit = input.fit;
  if ([0, 90, 180, 270].includes(Number(input.rotate)) && Number(input.rotate) !== 0) output.rotate = Number(input.rotate);
  if (input.allowRotationMetadata === false) output.allowRotationMetadata = false;
  const crop = sanitizeCrop(input.crop);
  if (crop) output.crop = crop;
  if (positiveNumber(input.frameRate)) output.frameRate = positiveNumber(input.frameRate);
  if (positiveNumber(input.bitrate)) output.bitrate = positiveNumber(input.bitrate);
  if (['discard', 'keep'].includes(input.alpha)) output.alpha = input.alpha;
  if (positiveNumber(input.keyFrameInterval)) output.keyFrameInterval = positiveNumber(input.keyFrameInterval);
  if (['no-preference', 'prefer-hardware', 'prefer-software'].includes(input.hardwareAcceleration)) output.hardwareAcceleration = input.hardwareAcceleration;
  if (input.forceTranscode === true) output.forceTranscode = true;
  return output;
}

function sanitizeConversionAudioOptions(input = {}) {
  const output = {};
  if (input.discard === true) output.discard = true;
  if (['aac', 'opus', 'mp3', 'vorbis', 'flac', 'pcm-u8', 'pcm-s16', 'pcm-s32', 'pcm-f32'].includes(input.codec)) output.codec = input.codec;
  if (positiveInteger(input.numberOfChannels)) output.numberOfChannels = positiveInteger(input.numberOfChannels);
  if (positiveInteger(input.sampleRate)) output.sampleRate = positiveInteger(input.sampleRate);
  if (['u8', 's16', 's32', 'f32'].includes(input.sampleFormat)) output.sampleFormat = input.sampleFormat;
  if (positiveNumber(input.bitrate)) output.bitrate = positiveNumber(input.bitrate);
  if (input.forceTranscode === true) output.forceTranscode = true;
  return output;
}

function sanitizeTrimOptions(input = {}) {
  const output = {};
  if (positiveNumber(input.start)) output.start = positiveNumber(input.start);
  if (positiveNumber(input.end)) output.end = positiveNumber(input.end);
  return output;
}

function sanitizeCrop(input = {}) {
  const x = Math.max(0, Math.round(Number(input.x || 0)));
  const y = Math.max(0, Math.round(Number(input.y || 0)));
  const width = positiveInteger(input.width);
  const height = positiveInteger(input.height);
  return width > 0 && height > 0 ? { x, y, width, height } : null;
}

function sanitizeTags(input = {}) {
  if (!input || typeof input !== 'object') return {};
  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
      .map(([key, value]) => [key, String(value)])
  );
}

function positiveInteger(value) {
  const number = Math.round(Number(value || 0));
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function positiveNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

async function loadMediabunnyModule() {
  return import(MEDIABUNNY_MODULE_URL);
}

function createMediabunnyOutputFormat(plan, mediabunny = {}) {
  const constructors = {
    adts: 'AdtsOutputFormat',
    flac: 'FlacOutputFormat',
    matroska: 'MkvOutputFormat',
    mov: 'MovOutputFormat',
    mp3: 'Mp3OutputFormat',
    mp4: 'Mp4OutputFormat',
    mpegts: 'MpegTsOutputFormat',
    ogg: 'OggOutputFormat',
    wav: 'WavOutputFormat',
    webm: 'WebMOutputFormat'
  };
  const Constructor = mediabunny[constructors[plan.targetContainer]];
  if (typeof Constructor !== 'function') {
    throw {
      code: 'WEBMEDIA_OUTPUT_UNSUPPORTED',
      message: `${plan.output?.label || plan.targetContainer || 'Selected output'} is not available in this Mediabunny runtime.`,
      recoverable: true
    };
  }
  return new Constructor();
}

function formatDiscardedTracks(discardedTracks = []) {
  return Array.from(discardedTracks || [])
    .map((entry) => entry.reason || entry.message || entry.track?.id || '')
    .filter(Boolean)
    .join('; ');
}

function isDedicatedWorkerRuntime(scope = globalThis) {
  return typeof WorkerGlobalScope !== 'undefined' &&
    scope instanceof WorkerGlobalScope &&
    typeof scope.postMessage === 'function' &&
    typeof scope.document === 'undefined';
}

if (typeof self !== 'undefined' && isDedicatedWorkerRuntime(self)) {
  self.postMessage({ type: 'ready' });
  self.postMessage({
    type: 'capabilities',
    payload: {
      worker: {
        VideoDecoder: typeof self.VideoDecoder === 'function',
        VideoEncoder: typeof self.VideoEncoder === 'function',
        AudioDecoder: typeof self.AudioDecoder === 'function',
        AudioEncoder: typeof self.AudioEncoder === 'function',
        EncodedVideoChunk: typeof self.EncodedVideoChunk === 'function',
        EncodedAudioChunk: typeof self.EncodedAudioChunk === 'function'
      }
    }
  });
  self.onmessage = async (event) => {
    const requestId = event.data?.requestId || '';
    await handleWebMediaWorkerMessage(event.data, {
      jobs: activeJobs,
      emit: (workerEvent) => {
        self.postMessage({ requestId, ...workerEvent });
      }
    });
  };
}

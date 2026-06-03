import {
  getOrientedMediaDimensions,
  normalizeRightAngleRotation
} from '../utils/media-geometry.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function makeEvenFloor(value) {
  const floored = Math.floor(Number(value) || 0);
  return floored % 2 === 0 ? floored : floored - 1;
}

function normalizePositiveEven(value, fallback) {
  const numeric = Math.max(2, Math.round(Number(value) || fallback || 2));
  return numeric % 2 === 0 ? numeric : numeric + 1;
}

function normalizePreset(value) {
  return ['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow'].includes(value)
    ? value
    : 'slow';
}

function normalizePresetOrNumber(value, fallback) {
  const text = String(value ?? '').trim().toLowerCase();
  if (/^\d+$/.test(text)) return text;
  if (/^\d+$/.test(String(fallback))) return String(fallback);
  if (['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow'].includes(text)) return text;
  return String(fallback);
}

function normalizeOutputFormat(value, isAudioOnly = false) {
  const audioFormats = ['m4a', 'mp3', 'wav'];
  const videoFormats = ['mp4', 'webm', 'mkv'];
  const allowed = isAudioOnly ? audioFormats : videoFormats;
  return allowed.includes(value) ? value : allowed[0];
}

function replaceExtension(fileName, extension) {
  const safeName = String(fileName || `render.${extension}`).replace(/\.[^.]+$/, '');
  return `${safeName}.${extension}`;
}

function formatHexColor(value, fallback = '000000') {
  const hex = String(value || '').replace('#', '').trim();
  return /^[0-9a-f]{6}$/i.test(hex) ? hex : fallback;
}

function sanitizeMediaWorkName(fileName, fallback) {
  const safe = String(fileName || fallback).replace(/[^\w.-]+/g, '_');
  return safe || fallback;
}

function makeTextBuffer(text) {
  const bytes = new TextEncoder().encode(text);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function clampFadeDuration(fadeDuration, clipDuration) {
  const fade = Number(fadeDuration) || 0;
  const duration = Math.max(0, Number(clipDuration) || 0);
  if (!fade || !duration) return 0;
  return Math.max(0, Math.min(fade, Math.max(0, duration - 0.1)));
}

function normalizeFilterAmount(value, min, max, fallback = 0) {
  return clamp(Number(value) || fallback, min, max);
}

function normalizeBoolean(value, fallback = false) {
  if (value === true || value === 'true' || value === 'on' || value === '1') return true;
  if (value === false || value === 'false' || value === 'off' || value === '0') return false;
  return fallback;
}

function numberOr(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeFilmGrainOptions(input = {}, legacyStrength = 0) {
  const source = input && typeof input === 'object' ? input : {};
  const legacy = normalizeFilterAmount(legacyStrength, 0, 100);
  const preset = ['off', 'standard-film', 'gritty-bw', 'digital-iso', 'av1-synthesis', 'custom'].includes(source.preset)
    ? source.preset
    : legacy > 0 ? 'custom' : 'off';
  const strength = normalizeFilterAmount(source.strength ?? legacy, 0, 100);
  const lumaStrength = normalizeFilterAmount(source.lumaStrength ?? strength, 0, 100);
  const chromaStrength = normalizeFilterAmount(source.chromaStrength ?? strength, 0, 100);
  const mode = ['all', 'luma', 'chroma', 'custom'].includes(source.mode) ? source.mode : 'all';
  const distribution = source.distribution === 'uniform' ? 'uniform' : 'gaussian';
  return {
    preset,
    strength,
    lumaStrength,
    chromaStrength,
    mode,
    distribution,
    temporal: normalizeBoolean(source.temporal, true),
    pattern: normalizeBoolean(source.pattern, false),
    averaged: normalizeBoolean(source.averaged, false),
    grayscale: normalizeBoolean(source.grayscale, false),
    blur: normalizeFilterAmount(source.blur, 0, 6, 0),
    av1Denoise: normalizeBoolean(source.av1Denoise, false)
  };
}

function buildFilmGrainFlags(options) {
  return [
    options.temporal ? 't' : '',
    options.distribution === 'uniform' ? 'u' : '',
    options.pattern ? 'p' : '',
    options.averaged ? 'a' : ''
  ].filter(Boolean).join('+');
}

function buildPlaneNoiseFilter(entries, flags) {
  const parts = [];
  entries.forEach(([plane, strength]) => {
    const value = normalizeFilterAmount(strength, 0, 100);
    if (value <= 0) return;
    parts.push(`${plane}s=${Number(value.toFixed(2)).toString()}`);
    if (flags) parts.push(`${plane}f=${flags}`);
  });
  return parts.length ? `noise=${parts.join(':')}` : '';
}

function buildFilmGrainFilters(input = {}, legacyStrength = 0) {
  const options = normalizeFilmGrainOptions(input, legacyStrength);
  if (options.preset === 'off' || options.preset === 'av1-synthesis') return [];
  if (options.preset === 'standard-film') return ['noise=alls=12:allf=t'];
  if (options.preset === 'gritty-bw') return ['boxblur=lr=1.2', 'noise=c0s=7:c0f=t'];
  if (options.preset === 'digital-iso') return ['noise=alls=20:allf=t+u'];

  const filters = [];
  if (options.blur > 0) filters.push(`boxblur=lr=${Number(options.blur.toFixed(2)).toString()}`);
  const flags = buildFilmGrainFlags(options);
  const mode = options.grayscale ? 'luma' : options.mode;
  const chromaStrength = options.grayscale ? 0 : options.chromaStrength;
  if (mode === 'all' && options.lumaStrength === chromaStrength) {
    const value = normalizeFilterAmount(options.strength || options.lumaStrength, 0, 100);
    if (value > 0) filters.push(`noise=alls=${Number(value.toFixed(2)).toString()}${flags ? `:allf=${flags}` : ''}`);
    return filters;
  }
  if (mode === 'luma') {
    const filter = buildPlaneNoiseFilter([['c0', options.lumaStrength]], flags);
    if (filter) filters.push(filter);
    return filters;
  }
  if (mode === 'chroma') {
    const filter = buildPlaneNoiseFilter([['c1', chromaStrength], ['c2', chromaStrength]], flags);
    if (filter) filters.push(filter);
    return filters;
  }
  const filter = buildPlaneNoiseFilter([
    ['c0', options.lumaStrength],
    ['c1', chromaStrength],
    ['c2', chromaStrength]
  ], flags);
  if (filter) filters.push(filter);
  return filters;
}

function getFilmGrainEncoderArgs(input = {}, legacyStrength = 0) {
  const options = normalizeFilmGrainOptions(input, legacyStrength);
  if (options.preset !== 'av1-synthesis' || options.strength <= 0) return [];
  const amount = Math.round(clamp(options.strength, 0, 50));
  const denoise = options.av1Denoise ? 1 : 0;
  return ['-svtav1-params', `film-grain=${amount}:film-grain-denoise=${denoise}`];
}

const VIDEO_ENCODER_PROFILES = {
  copy: { args: ['-c:v', 'copy'], copy: true },
  x264: { args: ['-c:v', 'libx264'] },
  x265: { args: ['-c:v', 'libx265'] },
  vp9: { args: ['-c:v', 'libvpx-vp9'], constrainedCrfBitrate: '0' },
  'svt-av1': { args: ['-c:v', 'libsvtav1'], presetFlag: '-preset', defaultPreset: '6' },
  'aom-av1': { args: ['-c:v', 'libaom-av1'], presetFlag: '-cpu-used', defaultPreset: '4' },
  mpeg4: { args: ['-c:v', 'mpeg4'] },
  prores: { args: ['-c:v', 'prores_ks'], defaultProfile: '3', crf: false },
  dnxhr: { args: ['-c:v', 'dnxhd'], defaultProfile: 'dnxhr_hq', crf: false }
};

const VIDEO_ENCODER_ALIASES = {
  h264: 'x264',
  'libx264': 'x264',
  h265: 'x265',
  hevc: 'x265',
  'libx265': 'x265',
  av1: 'svt-av1',
  svtav1: 'svt-av1',
  'libsvtav1': 'svt-av1',
  'libsvt-av1': 'svt-av1',
  aom: 'aom-av1',
  'av1-aom': 'aom-av1',
  'libaom-av1': 'aom-av1',
  prores_ks: 'prores',
  dnxhd: 'dnxhr'
};

const FFMPEG_OUTPUT_QUALITY_PROFILES = {
  preview: { scaleQuality: 'preview', encoder: 'x264', preset: 'veryfast', crf: 30, audioBitrate: '128k' },
  draft: { scaleQuality: 'draft', encoder: 'x264', preset: 'veryfast', crf: 28, audioBitrate: '128k' },
  balanced: { scaleQuality: 'balanced', encoder: 'x264', preset: 'medium', crf: 20, audioBitrate: '192k' },
  delivery: { scaleQuality: 'balanced', encoder: 'x264', preset: 'medium', crf: 18, audioBitrate: '192k' },
  high: { scaleQuality: 'high', encoder: 'x264', preset: 'slow', crf: 16, audioBitrate: '256k' },
  archive: { scaleQuality: 'archive', encoder: 'x265', preset: 'slower', crf: 12, audioBitrate: '320k' },
  lossless: { scaleQuality: 'archive', encoder: 'x264', preset: 'slow', crf: 0, audioBitrate: '320k' }
};

const SCALE_ALGORITHM_BY_QUALITY = {
  preview: 'fast_bilinear',
  speed: 'fast_bilinear',
  low: 'fast_bilinear',
  draft: 'fast_bilinear',
  balanced: 'bicubic',
  medium: 'bicubic',
  high: 'lanczos',
  best: 'spline',
  archive: 'spline'
};

const SCALE_ALGORITHMS = new Set(['fast_bilinear', 'bilinear', 'bicubic', 'lanczos', 'spline', 'neighbor', 'area', 'gauss', 'sinc', 'experimental']);
const SCALE_ALGORITHM_ALIASES = {
  nearest: 'neighbor',
  nearest_neighbor: 'neighbor',
  point: 'neighbor',
  box: 'area',
  best: 'spline'
};
const SCALE_FILTER_FLAGS = new Set([...SCALE_ALGORITHMS, 'accurate_rnd', 'full_chroma_int', 'full_chroma_inp', 'bitexact']);
const X264_TUNES = new Set(['film', 'animation', 'grain', 'stillimage', 'fastdecode', 'zerolatency']);
const FPS_MODES = new Set(['cfr', 'vfr', 'passthrough', 'auto']);

const AUDIO_CODEC_ALIASES = {
  aac: 'aac',
  opus: 'libopus',
  libopus: 'libopus',
  mp3: 'libmp3lame',
  libmp3lame: 'libmp3lame',
  flac: 'flac',
  pcm16: 'pcm_s16le',
  pcm_s16le: 'pcm_s16le',
  pcm24: 'pcm_s24le',
  pcm_s24le: 'pcm_s24le',
  copy: 'copy'
};

function normalizeVideoEncoder(value, outputConfig, filmGrainEncoderArgs = []) {
  if (filmGrainEncoderArgs.length) return 'svt-av1';
  const key = String(value || '').trim().toLowerCase();
  const normalized = VIDEO_ENCODER_ALIASES[key] || key;
  if (VIDEO_ENCODER_PROFILES[normalized]) return normalized;
  return outputConfig.encoder || 'x264';
}

function normalizeVideoRateControl(value, bitrate) {
  const mode = String(value || '').trim().toLowerCase();
  if (['crf', 'bitrate', 'lossless'].includes(mode)) return mode;
  return bitrate ? 'bitrate' : 'crf';
}

function normalizeFpsMode(value) {
  const mode = String(value || '').trim().toLowerCase();
  return FPS_MODES.has(mode) ? mode : '';
}

function normalizeAudioCodec(value) {
  const key = String(value || '').trim().toLowerCase();
  return AUDIO_CODEC_ALIASES[key] || key || '';
}

function pushVideoRateArgs(args, encoderProfile, encoderId, options) {
  const bitrate = options.videoBitrate || options.bitrate;
  const rateControl = normalizeVideoRateControl(options.rateControl, bitrate);
  const supportsCrf = encoderProfile.crf !== false;
  if (encoderProfile.constrainedCrfBitrate && rateControl !== 'bitrate') args.push('-b:v', encoderProfile.constrainedCrfBitrate);
  if (rateControl === 'bitrate' && bitrate) {
    args.push('-b:v', String(bitrate));
  } else if (rateControl === 'lossless') {
    if (encoderId === 'vp9') args.push('-lossless', '1');
    if (supportsCrf) args.push('-crf', '0');
  } else if (supportsCrf) {
    args.push('-crf', String(Math.max(0, Math.min(63, Math.round(Number(options.crf) || 18)))));
  }
  if (options.maxrate) args.push('-maxrate', String(options.maxrate));
  if (options.bufsize) args.push('-bufsize', String(options.bufsize));
}

function buildVideoEncodeArgs({ outputConfig, encoder, preset, crf = 18, filmGrain, tune, rateControl, videoBitrate, bitrate, maxrate, bufsize, gopSize, profile, level, threads, extraArgs }) {
  const filmGrainEncoderArgs = getFilmGrainEncoderArgs(filmGrain);
  const encoderId = normalizeVideoEncoder(encoder, outputConfig, filmGrainEncoderArgs);
  const encoderProfile = VIDEO_ENCODER_PROFILES[encoderId] || VIDEO_ENCODER_PROFILES.x264;
  const args = [...encoderProfile.args];
  if (encoderProfile.copy) return { encoder: encoderId, args };
  if (encoderId === 'x264' || encoderId === 'x265') {
    args.push('-preset', normalizePreset(preset));
    if (X264_TUNES.has(tune)) args.push('-tune', tune);
  } else if (encoderProfile.presetFlag) {
    args.push(encoderProfile.presetFlag, normalizePresetOrNumber(preset, encoderProfile.defaultPreset));
  }
  const outputProfile = profile || encoderProfile.defaultProfile;
  if (outputProfile) args.push('-profile:v', String(outputProfile));
  if (level) args.push('-level', String(level));
  pushVideoRateArgs(args, encoderProfile, encoderId, { rateControl, videoBitrate, bitrate, crf, maxrate, bufsize });
  if (gopSize) args.push('-g', String(Math.max(1, Math.round(Number(gopSize) || 1))));
  if (threads) args.push('-threads', String(Math.max(1, Math.round(Number(threads) || 1))));
  args.push(...filmGrainEncoderArgs);
  args.push(...normalizeExtraArgs(extraArgs));
  return { encoder: encoderId, args };
}

function flattenArgs(values = []) {
  return values.flatMap((value) => {
    if (Array.isArray(value)) return flattenArgs(value);
    if (value === null || value === undefined || value === false || value === '') return [];
    return [String(value)];
  });
}

function normalizeExtraArgs(value) {
  if (!Array.isArray(value)) return [];
  return flattenArgs(value);
}

export function resolveFFmpegScalePlan(input = {}) {
  const rawMode = input.mode || (input.scaleWidth === 'copy' ? 'copy' : 'width');
  const modeAliases = {
    fit: 'contain',
    letterbox: 'contain',
    fill: 'cover',
    crop: 'cover',
    stretch: 'exact'
  };
  const mode = modeAliases[rawMode] || rawMode;
  const width = normalizePositiveEven(input.width ?? input.scaleWidth, input.widthFallback || 1280);
  const height = normalizePositiveEven(input.height, input.heightFallback || 720);
  const rawAlgorithm = String(input.algorithm || '').trim().toLowerCase();
  const algorithmCandidate = SCALE_ALGORITHM_ALIASES[rawAlgorithm] || rawAlgorithm;
  const qualityAlgorithm = SCALE_ALGORITHM_BY_QUALITY[String(input.quality || '').trim().toLowerCase()] || '';
  const algorithm = SCALE_ALGORITHMS.has(algorithmCandidate)
    ? algorithmCandidate
    : qualityAlgorithm;
  const requestedFlags = input.flags || input.extraFlags || [];
  const flags = [
    ...(algorithm ? [algorithm] : []),
    ...flattenArgs(Array.isArray(requestedFlags) ? requestedFlags : [requestedFlags]).map((flag) => String(flag).trim().toLowerCase())
  ].filter((flag, index, list) => SCALE_FILTER_FLAGS.has(flag) && list.indexOf(flag) === index);
  const scaleFilter = (value) => (flags.length ? `${value}:flags=${flags.join('+')}` : value);
  let filters = [];
  if (mode === 'contain') {
    filters = [
      scaleFilter(`scale=${width}:${height}:force_original_aspect_ratio=decrease`),
      `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`
    ];
  } else if (mode === 'cover') {
    filters = [
      scaleFilter(`scale=${width}:${height}:force_original_aspect_ratio=increase`),
      `crop=${width}:${height}`
    ];
  } else if (mode === 'exact') {
    filters = [scaleFilter(`scale=${width}:${height}`)];
  } else if (mode !== 'copy') {
    filters = [scaleFilter(`scale=${width}:-2`)];
  }
  return {
    mode: mode === 'copy' || mode === 'contain' || mode === 'cover' || mode === 'exact' ? mode : 'width',
    width,
    height,
    algorithm,
    flags,
    filters
  };
}

export function resolveFFmpegVideoEncodePlan(options = {}) {
  const outputConfig = getOutputConfig({
    outputFormat: options.outputFormat,
    isAudioOnly: false,
    outputName: options.outputName || 'render.mp4',
    mimeType: options.mimeType || 'video/mp4'
  });
  const plan = buildVideoEncodeArgs({
    outputConfig,
    encoder: options.encoder,
    preset: options.preset,
    crf: options.crf,
    filmGrain: options.filmGrain,
    tune: options.tune,
    rateControl: options.rateControl,
    videoBitrate: options.videoBitrate,
    bitrate: options.bitrate,
    maxrate: options.maxrate,
    bufsize: options.bufsize,
    gopSize: options.gopSize,
    profile: options.profile,
    level: options.level,
    threads: options.threads,
    extraArgs: options.extraArgs || options.videoExtraArgs
  });
  return {
    ...outputConfig,
    encoder: plan.encoder,
    args: plan.args,
    faststart: !!outputConfig.faststart,
    pixelFormat: options.pixelFormat || 'yuv420p'
  };
}

export function resolveFFmpegAudioEncodePlan(options = {}) {
  const outputConfig = getOutputConfig({
    outputFormat: options.outputFormat,
    isAudioOnly: !!options.isAudioOnly,
    outputName: options.outputName || 'render.mp4',
    mimeType: options.mimeType
  });
  const codec = normalizeAudioCodec(options.codec);
  const args = codec
    ? ['-c:a', codec]
    : [...outputConfig.audioCodec];
  if (codec === 'copy') {
    return {
      ...outputConfig,
      args
    };
  }
  if (options.bitrate) {
    const bitrateIndex = args.indexOf('-b:a');
    if (bitrateIndex >= 0) args[bitrateIndex + 1] = String(options.bitrate);
    else args.push('-b:a', String(options.bitrate));
  }
  if (options.quality !== undefined && options.quality !== null && options.quality !== '') args.push('-q:a', String(options.quality));
  if (options.sampleRate) args.push('-ar', String(Math.round(Number(options.sampleRate) || 48000)));
  if (options.channels) args.push('-ac', String(Math.max(1, Math.min(8, Math.round(Number(options.channels) || 2)))));
  if (options.sampleFormat) args.push('-sample_fmt', String(options.sampleFormat));
  args.push(...normalizeExtraArgs(options.extraArgs || options.audioExtraArgs));
  return {
    ...outputConfig,
    args
  };
}

function buildMetadataArgs(metadata = {}) {
  if (!metadata || typeof metadata !== 'object') return [];
  return Object.entries(metadata).flatMap(([key, value]) => {
    if (value === null || value === undefined || value === '') return [];
    return ['-metadata', `${key}=${value}`];
  });
}

export function resolveFFmpegOutputPolicy(options = {}) {
  const profileId = String(options.qualityProfile || options.outputQuality || '').toLowerCase();
  const profile = FFMPEG_OUTPUT_QUALITY_PROFILES[profileId] || {};
  const isAudioOnly = !!options.isAudioOnly;
  const outputFormat = options.outputFormat || 'mp4';
  const outputName = options.outputName || `render.${normalizeOutputFormat(outputFormat, isAudioOnly)}`;
  const outputConfig = getOutputConfig({
    outputFormat,
    isAudioOnly,
    outputName,
    mimeType: options.mimeType
  });
  const scaleOptions = options.scale && typeof options.scale === 'object' ? options.scale : {};
  const scale = isAudioOnly
    ? null
    : resolveFFmpegScalePlan({
      ...scaleOptions,
      quality: scaleOptions.quality || options.scaleQuality || profile.scaleQuality
    });
  const video = isAudioOnly
    ? null
    : resolveFFmpegVideoEncodePlan({
      outputFormat,
      outputName,
      mimeType: options.mimeType,
      encoder: options.encoder || profile.encoder,
      preset: options.preset || profile.preset,
      crf: options.crf ?? profile.crf ?? 18,
      filmGrain: options.filmGrain,
      tune: options.tune,
      pixelFormat: options.pixelFormat || 'yuv420p',
      rateControl: options.rateControl,
      videoBitrate: options.videoBitrate || options.bitrate,
      maxrate: options.maxrate,
      bufsize: options.bufsize,
      gopSize: options.gopSize,
      profile: options.profile,
      level: options.level,
      threads: options.threads,
      extraArgs: options.videoExtraArgs || options.extraVideoArgs
    });
  const audio = resolveFFmpegAudioEncodePlan({
    outputFormat,
    outputName,
    mimeType: options.mimeType,
    isAudioOnly,
    codec: options.audioCodec,
    bitrate: options.audioBitrate || profile.audioBitrate,
    quality: options.audioQuality,
    sampleRate: options.sampleRate ?? 48000,
    channels: options.channels ?? 2,
    sampleFormat: options.audioSampleFormat,
    extraArgs: options.audioExtraArgs || options.extraAudioArgs
  });
  const args = video ? [...video.args] : [];
  if (!isAudioOnly && video?.encoder !== 'copy') {
    args.push('-pix_fmt', video.pixelFormat);
    if (options.frameRate) args.push('-r', String(Math.round(Number(options.frameRate) || 30)));
    const fpsMode = normalizeFpsMode(options.frameRateMode);
    if (fpsMode) args.push('-fps_mode', fpsMode);
  }
  args.push(...audio.args);
  if (options.shortest) args.push('-shortest');
  args.push(...buildMetadataArgs(options.metadata));
  const faststart = options.faststart === undefined ? !!outputConfig.faststart : Boolean(options.faststart);
  if (faststart) args.push('-movflags', '+faststart');
  return {
    qualityProfile: profileId || 'custom',
    outputConfig,
    outputName: outputConfig.outputName,
    outputFormat: outputConfig.format,
    mimeType: outputConfig.mimeType,
    faststart,
    scale,
    video,
    audio,
    args
  };
}

export class FFmpegFilterChain {
  constructor(filters = []) {
    this.filters = [];
    this.add(filters);
  }

  add(...filters) {
    this.filters.push(...flattenArgs(filters));
    return this;
  }

  trim({ start = 0, end = null } = {}) {
    const parts = [`start=${formatFilterNumber(Math.max(0, Number(start) || 0))}`];
    if (end !== null && end !== undefined) parts.push(`end=${formatFilterNumber(Math.max(0, Number(end) || 0))}`);
    return this.add(`trim=${parts.join(':')}`);
  }

  setpts(expression = 'PTS-STARTPTS') {
    return this.add(`setpts=${expression}`);
  }

  scale(options = {}) {
    return this.add(resolveFFmpegScalePlan(options).filters);
  }

  crop({ width, height, x = 0, y = 0 } = {}) {
    return this.add(`crop=${normalizePositiveEven(width, 2)}:${normalizePositiveEven(height, 2)}:${Math.max(0, Math.round(Number(x) || 0))}:${Math.max(0, Math.round(Number(y) || 0))}`);
  }

  format(value = 'yuv420p') {
    return this.add(`format=${value}`);
  }

  fade({ type = 'out', start = 0, duration = 0.25, alpha = false, filter = 'fade' } = {}) {
    const suffix = alpha ? ':alpha=1' : '';
    return this.add(`${filter}=t=${type}:st=${formatFilterNumber(Math.max(0, Number(start) || 0))}:d=${formatFilterNumber(Math.max(0, Number(duration) || 0))}${suffix}`);
  }

  toArray() {
    return [...this.filters];
  }

  toString() {
    return this.filters.join(',');
  }
}

export class FFmpegArgumentChain {
  constructor(args = []) {
    this.args = [];
    this.add(args);
  }

  add(...args) {
    this.args.push(...flattenArgs(args));
    return this;
  }

  inputOptions(args = []) {
    return this.add(args);
  }

  globalOptions(args = []) {
    return this.add(args);
  }

  outputOptions(args = []) {
    return this.add(args);
  }

  overwrite(enabled = true) {
    return this.add(enabled ? '-y' : '-n');
  }

  input(name, options = {}) {
    if (options.streamLoop !== undefined) this.add('-stream_loop', options.streamLoop);
    if (options.readrate !== undefined) this.add('-readrate', options.readrate);
    if (options.format) this.add('-f', options.format);
    if (options.framerate) this.add('-framerate', options.framerate);
    if (options.threadQueueSize) this.add('-thread_queue_size', options.threadQueueSize);
    if (options.seek !== undefined) this.add('-ss', options.seek);
    if (options.duration !== undefined) this.add('-t', options.duration);
    return this.add('-i', name);
  }

  filterComplex(graph) {
    const value = Array.isArray(graph) ? graph.filter(Boolean).join(';') : String(graph || '');
    return value ? this.add('-filter_complex', value) : this;
  }

  videoFilter(filters) {
    const value = Array.isArray(filters) ? filters.filter(Boolean).join(',') : String(filters || '');
    return value ? this.add('-vf', value) : this;
  }

  audioFilter(filters) {
    const value = Array.isArray(filters) ? filters.filter(Boolean).join(',') : String(filters || '');
    return value ? this.add('-af', value) : this;
  }

  complexFilter(graph) {
    return this.filterComplex(graph);
  }

  filterGraph(graph) {
    return this.filterComplex(graph);
  }

  map(stream, options = {}) {
    if (!stream) return this;
    const value = options.optional && !String(stream).endsWith('?') ? `${stream}?` : stream;
    return this.add('-map', value);
  }

  videoEncode(options = {}) {
    return this.add(resolveFFmpegVideoEncodePlan(options).args);
  }

  audioEncode(options = {}) {
    return this.add(resolveFFmpegAudioEncodePlan(options).args);
  }

  outputPolicy(options = {}) {
    return this.add(resolveFFmpegOutputPolicy(options).args);
  }

  pixelFormat(value = 'yuv420p') {
    return this.add('-pix_fmt', value);
  }

  frameRate(value) {
    return value ? this.add('-r', value) : this;
  }

  seekOutput(value) {
    return value !== undefined && value !== null && value !== '' ? this.add('-ss', value) : this;
  }

  duration(value) {
    return value !== undefined && value !== null && value !== '' ? this.add('-t', value) : this;
  }

  format(value) {
    return value ? this.add('-f', value) : this;
  }

  bitrate(value) {
    return value ? this.add('-b', value) : this;
  }

  videoBitrate(value) {
    return value ? this.add('-b:v', value) : this;
  }

  audioBitrate(value) {
    return value ? this.add('-b:a', value) : this;
  }

  shortest(enabled = true) {
    return enabled ? this.add('-shortest') : this;
  }

  disableVideo() {
    return this.add('-vn');
  }

  disableAudio() {
    return this.add('-an');
  }

  copyVideo() {
    return this.add('-c:v', 'copy');
  }

  copyAudio() {
    return this.add('-c:a', 'copy');
  }

  faststart(enabled = true) {
    return enabled ? this.add('-movflags', '+faststart') : this;
  }

  threads(value) {
    return value ? this.add('-threads', Math.max(1, Math.round(Number(value) || 1))) : this;
  }

  fpsMode(value) {
    const mode = normalizeFpsMode(value);
    return mode ? this.add('-fps_mode', mode) : this;
  }

  mapChapters(value = '-1') {
    return this.add('-map_chapters', value);
  }

  mapMetadata(value = '0') {
    return this.add('-map_metadata', value);
  }

  metadata(key, value) {
    if (!key || value === null || value === undefined) return this;
    return this.add('-metadata', `${key}=${value}`);
  }

  disposition(stream, value) {
    if (!stream || !value) return this;
    return this.add(`-disposition:${stream}`, value);
  }

  maxMuxingQueueSize(value) {
    return value ? this.add('-max_muxing_queue_size', value) : this;
  }

  avoidNegativeTs(value = 'make_zero') {
    return value ? this.add('-avoid_negative_ts', value) : this;
  }

  timestamp(value) {
    return value ? this.add('-timestamp', value) : this;
  }

  movflags(flags) {
    const values = flattenArgs(Array.isArray(flags) ? flags : [flags]).filter(Boolean);
    if (!values.length) return this;
    return this.add('-movflags', values.join(''));
  }

  output(name) {
    return this.add(name);
  }

  toArray() {
    return [...this.args];
  }

  toString() {
    return this.args.join(' ');
  }
}

function normalizeHexSubtitleColor(value) {
  const hex = String(value || '').replace('#', '').padStart(6, '0').slice(0, 6);
  return hex.match(/[A-Za-z0-9]{2}/g).reverse().join('');
}

function escapeSubtitleStyleValue(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/,/g, '\\,')
    .replace(/:/g, '\\:');
}

function buildSubtitleFilter({ color, fontFamily, fontSize, outline, fileName = 'sub.srt' }) {
  const safeFileName = sanitizeMediaWorkName(fileName, 'sub.srt');
  if (String(safeFileName).toLowerCase().endsWith('.ass')) {
    return `subtitles=filename='${escapeSubtitleStyleValue(safeFileName)}'`;
  }
  const style = [
    `Fontname=${escapeSubtitleStyleValue(fontFamily)}`,
    `PrimaryColour=&H00${normalizeHexSubtitleColor(color)}`,
    `Outline=${Number(outline) || 0}`,
    `FontSize=${Number(fontSize) || 20}`,
    'OutlineColour=&H00000000'
  ].join(',');
  return `subtitles=filename='${escapeSubtitleStyleValue(safeFileName)}':force_style='${style}'`;
}

function normalizeSubtitleBuffer(buffer) {
  if (buffer instanceof ArrayBuffer) return buffer;
  if (ArrayBuffer.isView(buffer)) {
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  }
  return null;
}

function normalizeSubtitleOptions(subtitles) {
  return subtitles && typeof subtitles === 'object' ? subtitles : {};
}

function normalizeSubtitleStyle(input = {}, fallback = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const base = fallback && typeof fallback === 'object' ? fallback : {};
  const color = String(source.color || base.color || '#ffdc00');
  return {
    color: /^#[0-9a-f]{6}$/i.test(color) ? color : '#ffdc00',
    fontFamily: String(source.fontFamily || source.font || base.fontFamily || base.font || 'Arial').replace(/,/g, ' ').trim() || 'Arial',
    fontSize: Math.max(8, Math.min(160, Math.round(Number(source.fontSize ?? source.size ?? base.fontSize ?? base.size) || 20))),
    outline: Math.max(0, Math.min(12, Number(source.outline ?? base.outline) || 0))
  };
}

function getSubtitleCueStyle(cue = {}) {
  const style = cue.style || cue.subtitleStyle;
  return style && typeof style === 'object' ? normalizeSubtitleStyle(style) : null;
}

function escapeAssText(value) {
  return normalizeSubtitleCueText(value)
    .replace(/\r\n|\r|\n/g, '\\N')
    .replace(/[{}]/g, '');
}

function formatAssTimestamp(value) {
  const totalCs = Math.max(0, Math.round((Number(value) || 0) * 100));
  const hours = Math.floor(totalCs / 360000);
  const minutes = Math.floor((totalCs % 360000) / 6000);
  const seconds = Math.floor((totalCs % 6000) / 100);
  const centiseconds = totalCs % 100;
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

function formatAssStyleLine(name, style) {
  const normalized = normalizeSubtitleStyle(style);
  return `Style: ${[
    name,
    normalized.fontFamily,
    normalized.fontSize,
    `&H00${normalizeHexSubtitleColor(normalized.color)}`,
    '&H000000FF',
    '&H00000000',
    '&H00000000',
    0,
    0,
    0,
    0,
    100,
    100,
    0,
    0,
    1,
    Number(normalized.outline.toFixed(2)),
    0,
    2,
    24,
    24,
    24,
    1
  ].join(',')}`;
}

function serializeAssSubtitles(cues = [], defaultStyle = {}) {
  const baseStyle = normalizeSubtitleStyle(defaultStyle);
  const styleByKey = new Map();
  const styleNames = new Map();
  const getStyleName = (style) => {
    const normalized = normalizeSubtitleStyle(style, baseStyle);
    const key = JSON.stringify(normalized);
    if (!styleNames.has(key)) {
      const name = styleNames.size ? `S${styleNames.size}` : 'S1';
      styleNames.set(key, name);
      styleByKey.set(key, normalized);
    }
    return styleNames.get(key);
  };
  const events = (Array.isArray(cues) ? cues : []).map((cue) => {
    const styleName = getStyleName(getSubtitleCueStyle(cue) || baseStyle);
    return `Dialogue: 0,${formatAssTimestamp(cue.start)},${formatAssTimestamp(cue.end)},${styleName},,0,0,0,,${escapeAssText(cue.text)}`;
  });
  if (!styleNames.size) getStyleName(baseStyle);
  return [
    '[Script Info]',
    'ScriptType: v4.00+',
    'WrapStyle: 2',
    'ScaledBorderAndShadow: yes',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    ...Array.from(styleNames.entries()).map(([key, name]) => formatAssStyleLine(name, styleByKey.get(key))),
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    ...events
  ].join('\n');
}

function getGeneratedSubtitlePayload(subtitles = {}) {
  const options = normalizeSubtitleOptions(subtitles);
  const cues = Array.isArray(options.cues) ? options.cues : [];
  if (cues.length) {
    const hasStyledCues = cues.some((cue) => getSubtitleCueStyle(cue));
    return hasStyledCues
      ? { buffer: makeTextBuffer(serializeAssSubtitles(cues, options)), format: 'ass' }
      : { buffer: makeTextBuffer(serializeSrtSubtitles(cues)), format: 'srt' };
  }
  const buffer = normalizeSubtitleBuffer(options.fileBuffer);
  return buffer ? { buffer, format: 'srt' } : null;
}

export function getSubtitleCueSpan(cues = []) {
  const validCues = (Array.isArray(cues) ? cues : [])
    .map((cue) => ({
      start: Math.max(0, Number(cue?.start) || 0),
      end: Math.max(0, Number(cue?.end) || 0)
    }))
    .filter((cue) => cue.end > cue.start);
  if (!validCues.length) return { start: 0, end: 0, duration: 0 };
  const start = Math.min(...validCues.map((cue) => cue.start));
  const end = Math.max(...validCues.map((cue) => cue.end));
  return {
    start: formatFilterNumber(start),
    end: formatFilterNumber(end),
    duration: formatFilterNumber(Math.max(0, end - start))
  };
}

function getSubtitleDuration(subtitles = {}) {
  const options = normalizeSubtitleOptions(subtitles);
  const cues = Array.isArray(options.cues) ? options.cues : [];
  return getSubtitleCueSpan(cues).end;
}

function readSubtitleCuesFromBuffer(buffer) {
  const normalized = normalizeSubtitleBuffer(buffer);
  if (!normalized) return [];
  try {
    return parseSrtSubtitles(new TextDecoder().decode(normalized));
  } catch {
    return [];
  }
}

function getSubtitleClipCues(clip = {}) {
  if (Array.isArray(clip.cues) && clip.cues.length) return clip.cues;
  return readSubtitleCuesFromBuffer(clip.fileBuffer || clip.buffer);
}

function shiftSubtitleClipCues(clip = {}) {
  const cues = getSubtitleClipCues(clip);
  if (!cues.length) return [];
  const clipStart = getCompositionClipStart(clip);
  const cueSpan = getSubtitleCueSpan(cues);
  const cueOrigin = Number.isFinite(Number(clip.subtitleCueOrigin))
    ? Math.max(0, Number(clip.subtitleCueOrigin))
    : cueSpan.start;
  const trimStart = Math.max(0, Number(clip.trimStart) || 0);
  const clipDuration = getCompositionClipDuration(clip);
  const clipEnd = clipStart + clipDuration;
  const style = clip.subtitleStyle && typeof clip.subtitleStyle === 'object'
    ? normalizeSubtitleStyle(clip.subtitleStyle)
    : null;
  return cues.map((cue, index) => {
    const start = clipStart + Math.max(0, (Number(cue.start) || 0) - cueOrigin - trimStart);
    const end = clipStart + Math.max(0.1, (Number(cue.end) || 0) - cueOrigin - trimStart);
    return {
      ...cue,
      id: cue.id || `${clip.id || 'subtitle'}-${index + 1}`,
      start,
      end: Math.min(clipEnd, Math.max(start + 0.1, end)),
      ...(style ? { style } : {})
    };
  }).filter((cue) => cue.start < clipEnd && cue.end > clipStart);
}

function collectSubtitleClipsFromTracks(tracks = []) {
  return (Array.isArray(tracks) ? tracks : []).flatMap((track) => (
    (Array.isArray(track.clips) ? track.clips : [])
      .filter((clip) => getClipKind(clip, track) === 'subtitle' && !clip.hidden && clip.visible !== false && !clip.disabled)
      .flatMap(shiftSubtitleClipCues)
  ));
}

function getSubtitleOptionCues(subtitles = {}) {
  const options = normalizeSubtitleOptions(subtitles);
  if (Array.isArray(options.cues) && options.cues.length) return options.cues;
  return readSubtitleCuesFromBuffer(options.fileBuffer);
}

function mergeMixerSubtitleOptions(baseSubtitles, subtitleCues = []) {
  const base = normalizeSubtitleOptions(baseSubtitles);
  const mergedCues = [
    ...getSubtitleOptionCues(base),
    ...(Array.isArray(subtitleCues) ? subtitleCues : [])
  ].filter((cue) => Number(cue.end) > Number(cue.start));
  if (!mergedCues.length) return baseSubtitles || null;
  return {
    ...base,
    fileBuffer: null,
    cues: mergedCues.sort((left, right) => (Number(left.start) || 0) - (Number(right.start) || 0))
  };
}

function appendSubtitleBurn({ files, filterParts, currentVideo, subtitles, outputLabel, fileName = 'mixer_subtitles.srt' }) {
  const options = normalizeSubtitleOptions(subtitles);
  const payload = getGeneratedSubtitlePayload(options);
  if (!payload?.buffer) return currentVideo;
  const fallbackName = payload.format === 'ass' ? replaceExtension(fileName, 'ass') : fileName;
  const requestedName = payload.format === 'ass'
    ? replaceExtension(options.fileName || fileName, 'ass')
    : options.fileName || fileName;
  const safeName = sanitizeMediaWorkName(requestedName, fallbackName);
  files.push({ name: safeName, buffer: payload.buffer });
  filterParts.push(`[${currentVideo}]${buildSubtitleFilter({ ...options, fileName: safeName })}[${outputLabel}]`);
  return outputLabel;
}

function hasRtlScript(value) {
  return /[\u0590-\u05ff\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/.test(String(value || ''));
}

export function normalizeSubtitleCueText(value) {
  const text = String(value ?? '');
  if (!hasRtlScript(text)) return text;
  if ((text.startsWith('\u202B') && text.endsWith('\u202C')) || (text.startsWith('\u2067') && text.endsWith('\u2069'))) return text;
  return `\u202B${text}\u202C`;
}

function parseSrtTimestamp(value) {
  const match = String(value || '').trim().match(/^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/);
  if (!match) return 0;
  const [, hours, minutes, seconds, milliseconds] = match;
  return (Number(hours) * 3600) + (Number(minutes) * 60) + Number(seconds) + (Number(milliseconds) / 1000);
}

function formatSrtTimestamp(value) {
  const totalMs = Math.max(0, Math.round((Number(value) || 0) * 1000));
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const milliseconds = totalMs % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

export function parseSrtSubtitles(input) {
  return String(input || '').replace(/\r/g, '').split(/\n{2,}/).map((block, index) => {
    const lines = block.split('\n').map((line) => line.trimEnd()).filter(Boolean);
    if (!lines.length) return null;
    const timeLineIndex = lines.findIndex((line) => line.includes('-->'));
    if (timeLineIndex < 0) return null;
    const [startText, endText] = lines[timeLineIndex].split('-->').map((part) => part.trim());
    return {
      id: `cue-${index + 1}`,
      index: Number(lines[0]) || index + 1,
      start: parseSrtTimestamp(startText),
      end: Math.max(parseSrtTimestamp(startText) + 0.1, parseSrtTimestamp(endText)),
      text: lines.slice(timeLineIndex + 1).join('\n')
    };
  }).filter(Boolean);
}

export function shiftSubtitleCues(cues, offsetSeconds = 0) {
  const offset = Number(offsetSeconds) || 0;
  return (Array.isArray(cues) ? cues : []).map((cue) => ({
    ...cue,
    start: Math.max(0, (Number(cue.start) || 0) + offset),
    end: Math.max(0.1, (Number(cue.end) || 0) + offset)
  })).map((cue) => cue.end <= cue.start ? { ...cue, end: cue.start + 0.1 } : cue);
}

export function serializeSrtSubtitles(cues) {
  return (Array.isArray(cues) ? cues : []).map((cue, index) => [
    String(index + 1),
    `${formatSrtTimestamp(cue.start)} --> ${formatSrtTimestamp(cue.end)}`,
    normalizeSubtitleCueText(cue.text)
  ].join('\n')).join('\n\n');
}

export function getFramePreviewSubtitleCues(cues = [], currentTime = 0) {
  const time = Math.max(0, Number(currentTime) || 0);
  return (Array.isArray(cues) ? cues : [])
    .filter((cue) => time >= (Number(cue.start) || 0) && time <= (Number(cue.end) || 0))
    .map((cue) => ({
      ...cue,
      start: 0,
      end: Math.max(0.1, Number(((Number(cue.end) || time + 0.1) - time).toFixed(3)))
    }));
}

function getOutputConfig({ outputFormat, isAudioOnly, outputName, mimeType }) {
  const format = normalizeOutputFormat(outputFormat, isAudioOnly);
  const configs = {
    mp4: { extension: 'mp4', mimeType: 'video/mp4', encoder: 'x264', audioCodec: ['-c:a', 'aac', '-b:a', '192k'], faststart: true },
    webm: { extension: 'webm', mimeType: 'video/webm', encoder: 'vp9', audioCodec: ['-c:a', 'libopus', '-b:a', '160k'], faststart: false },
    mkv: { extension: 'mkv', mimeType: 'video/x-matroska', encoder: 'x264', audioCodec: ['-c:a', 'aac', '-b:a', '192k'], faststart: false },
    m4a: { extension: 'm4a', mimeType: 'audio/mp4', audioCodec: ['-c:a', 'aac', '-b:a', '192k'] },
    mp3: { extension: 'mp3', mimeType: 'audio/mpeg', audioCodec: ['-c:a', 'libmp3lame', '-b:a', '192k'] },
    wav: { extension: 'wav', mimeType: 'audio/wav', audioCodec: ['-c:a', 'pcm_s16le'] }
  };
  const config = configs[format];
  return {
    ...config,
    format,
    outputName: replaceExtension(outputName, config.extension),
    mimeType: config.mimeType || mimeType
  };
}

function buildScaleFilters({ scaleWidth, scale, widthFallback = 1280, heightFallback = 720 }) {
  return resolveFFmpegScalePlan({
    mode: scale?.mode || (scaleWidth === 'copy' ? 'copy' : 'width'),
    width: scale?.width || scaleWidth,
    height: scale?.height,
    widthFallback,
    heightFallback,
    algorithm: scale?.algorithm,
    quality: scale?.quality
  }).filters;
}

function buildOrientationFilters(rotate) {
  const angle = normalizeRightAngleRotation(rotate);
  if (angle === 90) return ['transpose=1'];
  if (angle === 180) return ['hflip', 'vflip'];
  if (angle === 270) return ['transpose=2'];
  return [];
}

function isRightAngleOrientation(rotate) {
  const angle = normalizeRightAngleRotation(rotate);
  return angle === 90 || angle === 180 || angle === 270;
}

function getCropSourceDimensions(crop, fallbackWidth, fallbackHeight, rotate = 0) {
  if (Number(crop?.sourceWidth) > 0 && Number(crop?.sourceHeight) > 0) {
    return {
      sourceWidth: Number(crop.sourceWidth),
      sourceHeight: Number(crop.sourceHeight)
    };
  }
  const dimensions = getOrientedMediaDimensions(fallbackWidth, fallbackHeight, rotate);
  return {
    sourceWidth: dimensions.width,
    sourceHeight: dimensions.height
  };
}

function getTimelineOutputArgs({
  outputFormat,
  outputName,
  preset,
  crf = 18,
  filmGrain,
  encoder,
  tune,
  qualityProfile,
  scaleQuality,
  audioBitrate,
  rateControl,
  videoBitrate,
  maxrate,
  bufsize,
  gopSize,
  profile,
  level,
  pixelFormat,
  threads,
  frameRateMode,
  audioCodec,
  audioQuality,
  sampleRate,
  channels,
  audioSampleFormat,
  faststart,
  shortest,
  metadata
}) {
  const policy = resolveFFmpegOutputPolicy({
    outputFormat,
    outputName,
    qualityProfile,
    preset,
    crf,
    filmGrain,
    encoder,
    tune,
    scaleQuality,
    audioBitrate,
    rateControl,
    videoBitrate,
    maxrate,
    bufsize,
    gopSize,
    profile,
    level,
    pixelFormat,
    threads,
    frameRateMode,
    audioCodec,
    audioQuality,
    sampleRate: sampleRate ?? 48000,
    channels: channels ?? 2,
    audioSampleFormat,
    faststart,
    shortest,
    metadata
  });
  return { outputConfig: policy.outputConfig, args: policy.args };
}

function getClipScaleOptions(clip = {}, width, height, quality) {
  const base = clip.scale && typeof clip.scale === 'object'
    ? clip.scale
    : { mode: clip.fitMode || 'fit', width, height };
  return {
    ...(quality ? { quality } : {}),
    ...base
  };
}

function getCompositionClipDuration(clip) {
  const explicit = Number(clip.duration);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const start = Number(clip.trimStart) || Number(clip.sourceStart) || 0;
  const end = Number(clip.trimEnd);
  if (Number.isFinite(end) && end > start) return end - start;
  return 1;
}

function getCompositionClipStart(clip) {
  return Math.max(0, Number(clip.start) || 0);
}

function getCompositionClipEnd(clip) {
  return getCompositionClipStart(clip) + getCompositionClipDuration(clip);
}

function isSubtitleClipKind(kind) {
  return ['subtitle', 'captions'].includes(String(kind || '').toLowerCase());
}

function getCompositionRenderDuration(clips = [], subtitles = {}) {
  const sourceClips = Array.isArray(clips) ? clips : [];
  const contentClips = sourceClips.filter((clip) => !isSubtitleClipKind(clip.kind));
  const timelineClips = contentClips.length ? contentClips : sourceClips;
  return Math.max(0.1, ...timelineClips.map(getCompositionClipEnd), contentClips.length ? 0 : getSubtitleDuration(subtitles));
}

function buildFadeFilters(clip, duration, alpha = false, filterName = 'fade') {
  const filters = [];
  const suffix = alpha ? ':alpha=1' : '';
  const fadeIn = Math.min(Math.max(0, Number(clip.fadeIn) || 0), Math.max(0, duration - 0.1));
  const fadeOut = Math.min(Math.max(0, Number(clip.fadeOut) || 0), Math.max(0, duration - 0.1));
  if (fadeIn > 0) filters.push(`${filterName}=t=in:st=0:d=${Number(fadeIn.toFixed(3))}${suffix}`);
  if (fadeOut > 0) filters.push(`${filterName}=t=out:st=${Number(Math.max(0, duration - fadeOut).toFixed(3))}:d=${Number(fadeOut.toFixed(3))}${suffix}`);
  return filters;
}

function getCompositionGeometry(clip, width, height) {
  return {
    x: Math.round(Number(clip.x) || 0),
    y: Math.round(Number(clip.y) || 0),
    width: normalizePositiveEven(clip.width, width),
    height: normalizePositiveEven(clip.height, height)
  };
}

export function getMediaCompositionClipDuration(clip) {
  return getCompositionClipDuration(clip);
}

export function getMediaCompositionClipStart(clip) {
  return getCompositionClipStart(clip);
}

export function getMediaCompositionClipEnd(clip) {
  return getCompositionClipEnd(clip);
}

export function getMediaCompositionGeometry(clip, width, height) {
  return getCompositionGeometry(clip, width, height);
}

function createOverlayEnable(clip, duration) {
  const start = Math.max(0, Number(clip.start) || 0);
  const end = start + duration;
  return `between(t,${Number(start.toFixed(3))},${Number(end.toFixed(3))})`;
}

function buildVisualFilterChain({
  clip = {},
  width,
  height,
  scale,
  includeTimeline = true,
  alpha = false,
  duration = 1
} = {}) {
  const filters = [];
  const start = Math.max(0, Number(clip.trimStart ?? clip.start) || 0);
  const end = Math.max(start + 0.1, Number(clip.trimEnd ?? clip.end) || start + duration);
  const speed = clamp(numberOr(clip.speed, 1), 0.25, 4);
  const rightAngleOrientation = isRightAngleOrientation(clip.rotate);
  if (includeTimeline) {
    filters.push(`trim=start=${start}:end=${end}`, speed !== 1 ? `setpts=(PTS-STARTPTS)/${Number(speed.toFixed(3))}` : 'setpts=PTS-STARTPTS');
  }
  if (clip.reverse) filters.push('reverse');
  filters.push(...buildOrientationFilters(clip.rotate));
  if (clip.crop) {
    const cropSource = getCropSourceDimensions(clip.crop, width, height, clip.rotate);
    const crop = normalizeCropRect({
      crop: clip.crop,
      sourceWidth: cropSource.sourceWidth,
      sourceHeight: cropSource.sourceHeight
    });
    filters.push(`crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}`);
  }
  const clipScale = scale || (clip.scale && typeof clip.scale === 'object' ? clip.scale : { mode: clip.fitMode || 'fit', width, height });
  filters.push(...buildScaleFilters({ scaleWidth: 'copy', scale: clipScale, widthFallback: width, heightFallback: height }));
  if (!rightAngleOrientation && Number(clip.rotate) && Number(clip.rotate) % 360 !== 0) filters.push(`rotate=${(Number(clip.rotate) * Math.PI / 180).toFixed(6)}:fillcolor=none`);
  filters.push('setsar=1', alpha ? 'format=rgba' : 'format=yuv420p');
  const brightness = numberOr(clip.brightness, 0);
  const contrast = numberOr(clip.contrast, 1);
  const saturation = numberOr(clip.saturation, 1);
  const gamma = numberOr(clip.gamma, 1);
  if (brightness || contrast !== 1 || saturation !== 1 || gamma !== 1) filters.push(`eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}:gamma=${gamma}`);
  const sharpen = normalizeFilterAmount(clip.sharpen, 0, 2);
  const denoise = normalizeFilterAmount(clip.denoise, 0, 12);
  if (sharpen > 0) filters.push(`unsharp=5:5:${sharpen.toFixed(2)}:3:3:0`);
  if (denoise > 0) filters.push(`hqdn3d=${denoise.toFixed(1)}:${denoise.toFixed(1)}:${(denoise * 1.5).toFixed(1)}:${(denoise * 1.5).toFixed(1)}`);
  filters.push(...buildFilmGrainFilters(clip.filmGrain, clip.noise));
  if (Number(clip.blur) > 0) filters.push(`boxblur=${Number(clip.blur).toFixed(1)}:1`);
  if (Number(clip.opacity) >= 0 && Number(clip.opacity) < 1) filters.push(`colorchannelmixer=aa=${Number(Number(clip.opacity).toFixed(3))}`);
  filters.push(...buildFadeFilters(clip, duration, alpha));
  if (clip.subtitleFile) filters.push(buildSubtitleFilter(clip.subtitle || {}));
  return filters;
}

function formatFilterNumber(value) {
  return Number(Number(value).toFixed(6));
}

function buildVisualTimelineOffsetFilters(clip = {}) {
  const start = Math.max(0, Number(clip.start) || 0);
  return start > 0 ? [`setpts=PTS+${formatFilterNumber(start)}/TB`] : [];
}

function normalizeVolumeAutomation(automation = [], duration = 1) {
  const safeDuration = Math.max(0.1, Number(duration) || 1);
  const points = (Array.isArray(automation) ? automation : [])
    .map((point) => ({
      time: clamp(Number(point?.time) || 0, 0, safeDuration),
      value: clamp(Number(point?.value), 0, 2)
    }))
    .filter((point) => Number.isFinite(point.value))
    .sort((left, right) => left.time - right.time);
  if (!points.length) return [];
  const first = points[0];
  const last = points[points.length - 1];
  const withStart = first.time > 0 ? [{ time: 0, value: first.value }, ...points] : points;
  const bounded = last.time < safeDuration ? [...withStart, { time: safeDuration, value: last.value }] : withStart;
  return bounded.reduce((accumulator, point) => {
    const previous = accumulator[accumulator.length - 1];
    if (previous && Math.abs(previous.time - point.time) < 0.001) {
      previous.value = point.value;
      return accumulator;
    }
    accumulator.push(point);
    return accumulator;
  }, []);
}

function buildVolumeAutomationFilter(automation, duration) {
  const points = normalizeVolumeAutomation(automation, duration);
  if (points.length < 2) return '';
  let expression = String(formatFilterNumber(points.at(-1).value));
  for (let index = points.length - 2; index >= 0; index -= 1) {
    const left = points[index];
    const right = points[index + 1];
    const span = Math.max(0.0001, right.time - left.time);
    const leftTime = formatFilterNumber(left.time);
    const rightTime = formatFilterNumber(right.time);
    const leftValue = formatFilterNumber(left.value);
    const rightValue = formatFilterNumber(right.value);
    const valueExpression = `${leftValue}+(${rightValue}-${leftValue})*((t-${leftTime})/${formatFilterNumber(span)})`;
    expression = `if(between(t\\,${leftTime}\\,${rightTime})\\,${valueExpression}\\,${expression})`;
  }
  const first = points[0];
  expression = `if(lt(t\\,${formatFilterNumber(first.time)})\\,${formatFilterNumber(first.value)}\\,${expression})`;
  return `volume='${expression}':eval=frame`;
}

function buildAtempoFilters(speed = 1) {
  let remaining = clamp(numberOr(speed, 1), 0.25, 4);
  const filters = [];
  while (remaining > 2) {
    filters.push('atempo=2');
    remaining /= 2;
  }
  while (remaining < 0.5) {
    filters.push('atempo=0.5');
    remaining /= 0.5;
  }
  if (Math.abs(remaining - 1) > 0.001) filters.push(`atempo=${Number(remaining.toFixed(3))}`);
  return filters;
}

function buildAudioFilterChain({ clip = {}, duration = 1, delay = 0 } = {}) {
  const start = Math.max(0, Number(clip.trimStart ?? clip.start) || 0);
  const end = Math.max(start + 0.1, Number(clip.trimEnd ?? clip.end) || start + duration);
  const volume = clamp(numberOr(clip.volume, 1), 0, 4);
  const speed = clamp(numberOr(clip.speed, 1), 0.25, 4);
  const filters = [`atrim=start=${start}:end=${end}`, 'asetpts=PTS-STARTPTS'];
  filters.push(...buildAtempoFilters(speed));
  if (clip.reverse) filters.push('areverse');
  filters.push(`volume=${Number(volume.toFixed(3))}`);
  const automationFilter = buildVolumeAutomationFilter(clip.volumeAutomation, duration);
  if (automationFilter) filters.push(automationFilter);
  filters.push(...buildFadeFilters(clip, duration, false, 'afade'));
  if (delay > 0) filters.push(`adelay=${delay}|${delay}`);
  return filters;
}

export class FFmpegPlanBuilder {
  constructor(options = {}) {
    this.options = {
      width: normalizePositiveEven(options.width, 1280),
      height: normalizePositiveEven(options.height, 720),
      fps: Math.max(1, Math.min(120, Math.round(Number(options.fps) || 30))),
      backgroundColor: options.backgroundColor || '#000000',
      outputName: options.outputName || 'media_export.mp4',
      outputFormat: options.outputFormat || 'mp4',
      qualityProfile: options.qualityProfile || '',
      scaleQuality: options.scaleQuality || '',
      audioBitrate: options.audioBitrate || '',
      preset: options.preset || 'slow',
      tune: options.tune || 'none',
      encoder: options.encoder || '',
      rateControl: options.rateControl || '',
      videoBitrate: options.videoBitrate || '',
      maxrate: options.maxrate || '',
      bufsize: options.bufsize || '',
      gopSize: options.gopSize || '',
      profile: options.profile || '',
      level: options.level || '',
      pixelFormat: options.pixelFormat || 'yuv420p',
      threads: options.threads || '',
      frameRateMode: options.frameRateMode || '',
      audioCodec: options.audioCodec || '',
      audioQuality: options.audioQuality || '',
      sampleRate: options.sampleRate ?? 48000,
      channels: options.channels ?? 2,
      audioSampleFormat: options.audioSampleFormat || '',
      faststart: options.faststart,
      shortest: !!options.shortest,
      metadata: options.metadata || null,
      filmGrain: options.filmGrain,
      crf: options.crf ?? 18
    };
    this.files = [];
    this.command = [];
    this.filterParts = [];
    this.inputIndex = 0;
    this.diagnostics = [];
    this.videoLabels = [];
    this.audioLabels = [];
  }

  addFile(name, buffer) {
    const fileName = sanitizeMediaWorkName(name, `input_${this.files.length}`);
    this.files.push({ name: fileName, buffer: buffer || new ArrayBuffer(0) });
    this.command.push('-i', fileName);
    const index = this.inputIndex;
    this.inputIndex += 1;
    return index;
  }

  addSequentialVideo(clip, index) {
    const duration = getCompositionClipDuration(clip);
    const label = `v${index}`;
    if (clip.type === 'color' || clip.kind === 'color') {
      this.filterParts.push(`color=c=0x${formatHexColor(clip.color)}:s=${this.options.width}x${this.options.height}:d=${duration}:r=${this.options.fps}[${label}]`);
    } else {
      const input = this.addFile(clip.fileName || `video-${index}.mp4`, clip.buffer);
      const filters = buildVisualFilterChain({ clip, width: this.options.width, height: this.options.height, duration, alpha: false });
      this.filterParts.push(`[${input}:v]${filters.join(',')}[${label}]`);
    }
    this.videoLabels.push({ label, duration });
  }

  addOverlayClip(clip, index, currentVideo, totalDuration) {
    const duration = getCompositionClipDuration(clip);
    const label = `cv${index}`;
    const nextVideo = `comp${index}`;
    const geometry = getCompositionGeometry(clip, this.options.width, this.options.height);
    if (clip.kind === 'color' || clip.type === 'color') {
      const filters = ['format=rgba', ...buildFadeFilters(clip, duration, true), ...buildVisualTimelineOffsetFilters(clip)];
      this.filterParts.push(`color=c=0x${formatHexColor(clip.color)}:s=${geometry.width}x${geometry.height}:d=${Number(duration.toFixed(3))}:r=${this.options.fps},${filters.join(',')}[${label}]`);
    } else if (clip.kind === 'text' || clip.type === 'text') {
      const text = normalizeSubtitleCueText(clip.text || 'Text').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:');
      const filters = [
        'format=rgba',
        `drawtext=text='${text}':fontcolor=white:fontsize=${Math.max(8, Math.round(Number(clip.fontSize) || 42))}:x=24:y=24`,
        ...buildFadeFilters(clip, duration, true),
        ...buildVisualTimelineOffsetFilters(clip)
      ];
      this.filterParts.push(`color=c=0x00000000:s=${geometry.width}x${geometry.height}:d=${Number(duration.toFixed(3))}:r=${this.options.fps},${filters.join(',')}[${label}]`);
    } else {
      const input = this.addFile(clip.fileName, clip.buffer);
      const includeTimeline = (clip.kind || clip.type) !== 'image';
      const filters = buildVisualFilterChain({
        clip,
        width: geometry.width,
        height: geometry.height,
        duration,
        alpha: true,
        includeTimeline,
        scale: getClipScaleOptions(clip, geometry.width, geometry.height, this.options.scaleQuality)
      });
      filters.push(...buildVisualTimelineOffsetFilters(clip));
      this.filterParts.push(`[${input}:v]${filters.join(',')}[${label}]`);
    }
    this.filterParts.push(`[${currentVideo}][${label}]overlay=x=${geometry.x}:y=${geometry.y}:enable='${createOverlayEnable(clip, Math.min(duration, totalDuration))}'[${nextVideo}]`);
    return nextVideo;
  }

  addAudioClip(clip, index) {
    const duration = getCompositionClipDuration(clip);
    const label = `a${index}`;
    if (clip.kind === 'silence' || clip.type === 'silence') {
      this.filterParts.push(`anullsrc=r=48000:cl=stereo:d=${Number(duration.toFixed(3))}[${label}]`);
    } else {
      const input = this.addFile(clip.fileName || `audio-${index}.wav`, clip.buffer);
      const delay = Math.round(Math.max(0, Number(clip.start) || 0) * 1000);
      this.filterParts.push(`[${input}:a]${buildAudioFilterChain({ clip, duration, delay }).join(',')}[${label}]`);
    }
    this.audioLabels.push(label);
  }

  buildSequential({ crossfadeDuration = 0 } = {}) {
    let finalVideo = this.videoLabels[0]?.label || '';
    let videoOffset = this.videoLabels[0]?.duration || 0;
    for (let index = 1; index < this.videoLabels.length; index += 1) {
      const next = this.videoLabels[index];
      const label = `vx${index}`;
      const fade = Math.min(Math.max(0, Number(crossfadeDuration) || 0), Math.max(0, videoOffset - 0.1), Math.max(0, next.duration - 0.1));
      if (fade > 0) {
        this.filterParts.push(`[${finalVideo}][${next.label}]xfade=transition=fade:duration=${fade}:offset=${Math.max(0, videoOffset - fade)}[${label}]`);
        videoOffset += next.duration - fade;
      } else {
        this.filterParts.push(`[${finalVideo}][${next.label}]concat=n=2:v=1:a=0[${label}]`);
        videoOffset += next.duration;
      }
      finalVideo = label;
    }
    if (!finalVideo) {
      finalVideo = 'v0';
      this.filterParts.push(`color=c=0x000000:s=${this.options.width}x${this.options.height}:r=${this.options.fps}:d=1[${finalVideo}]`);
      videoOffset = 1;
    }
    let finalAudio = this.audioLabels[0] || '';
    for (let index = 1; index < this.audioLabels.length; index += 1) {
      const label = `ax${index}`;
      const fade = Math.max(0.01, Number(crossfadeDuration) || 0.01);
      this.filterParts.push(`[${finalAudio}][${this.audioLabels[index]}]acrossfade=d=${fade}[${label}]`);
      finalAudio = label;
    }
    if (!finalAudio) {
      finalAudio = 'silent';
      this.filterParts.push(`anullsrc=r=48000:cl=stereo:d=${Math.max(1, videoOffset || 1)}[${finalAudio}]`);
    }
    return this.finalize(finalVideo, finalAudio, videoOffset);
  }

  finalize(finalVideo, finalAudio, duration = 1) {
    const filterGraph = this.filterParts.join(';');
    const { outputConfig, args } = getTimelineOutputArgs(this.options);
    this.command.push(
      '-filter_complex', filterGraph,
      '-map', `[${finalVideo}]`,
      '-map', `[${finalAudio}]`,
      '-r', String(this.options.fps),
      ...args,
      outputConfig.outputName
    );
    return {
      files: this.files,
      command: this.command,
      filterGraph,
      outputName: outputConfig.outputName,
      mimeType: outputConfig.mimeType,
      duration: Math.max(duration, 0.1),
      width: this.options.width,
      height: this.options.height,
      fps: this.options.fps,
      diagnostics: this.diagnostics
    };
  }
}

export function normalizeCropRect({ crop, sourceWidth, sourceHeight }) {
  const safeSourceWidth = Math.max(2, Math.floor(Number(sourceWidth) || 2));
  const safeSourceHeight = Math.max(2, Math.floor(Number(sourceHeight) || 2));
  const requestedX = Math.max(0, Math.floor(Number(crop?.x) || 0));
  const requestedY = Math.max(0, Math.floor(Number(crop?.y) || 0));
  let x = clamp(requestedX, 0, Math.max(0, safeSourceWidth - 2));
  let y = clamp(requestedY, 0, Math.max(0, safeSourceHeight - 2));
  let width = clamp(makeEvenFloor(Number(crop?.width) || safeSourceWidth), 2, safeSourceWidth);
  let height = clamp(makeEvenFloor(Number(crop?.height) || safeSourceHeight), 2, safeSourceHeight);
  if ((x + width) > safeSourceWidth) width = safeSourceWidth - x;
  if ((y + height) > safeSourceHeight) height = safeSourceHeight - y;
  if (width < 2) {
    width = Math.min(safeSourceWidth, 2);
    x = Math.max(0, safeSourceWidth - width);
  }
  if (height < 2) {
    height = Math.min(safeSourceHeight, 2);
    y = Math.max(0, safeSourceHeight - height);
  }
  if (width % 2 !== 0 && width > 2) width -= 1;
  if (height % 2 !== 0 && height > 2) height -= 1;
  if ((x + width) > safeSourceWidth) x = Math.max(0, safeSourceWidth - width);
  if ((y + height) > safeSourceHeight) y = Math.max(0, safeSourceHeight - height);
  return { x, y, width, height };
}

export function buildMediaRenderPlan(options) {
  const { startTime, endTime, scaleWidth, scale, outputFormat, fx, crt, subtitles, mastering, crop, media, transform = {} } = options;
  const subtitleOptions = normalizeSubtitleOptions(subtitles);
  const clipDuration = Math.max(0.1, (Number(endTime) || 0) - (Number(startTime) || 0));
  const speed = clamp(numberOr(transform.speed, 1), 0.25, 4);
  const outputDuration = clipDuration / speed;
  const fadeDuration = clampFadeDuration(mastering.fadeDuration, outputDuration);
  const isAudioOnly = !!media.isAudioOnly;
  const outputConfig = getOutputConfig({ outputFormat, isAudioOnly, outputName: media.outputName, mimeType: media.mimeType });
  const filmGrain = normalizeFilmGrainOptions(fx?.filmGrain, fx?.noise);
  const files = [{ name: media.sourceName, buffer: media.sourceBuffer }];
  if (subtitleOptions.fileBuffer && !isAudioOnly) files.push({ name: 'sub.srt', buffer: subtitleOptions.fileBuffer });

  const videoFilters = [];
  if (!isAudioOnly) {
    const rightAngleOrientation = isRightAngleOrientation(transform.rotate);
    videoFilters.push(...buildOrientationFilters(transform.rotate));
    const cropSource = getCropSourceDimensions(crop, crop.sourceWidth || crop.width, crop.sourceHeight || crop.height, transform.rotate);
    const normalizedCrop = normalizeCropRect({
      crop,
      sourceWidth: cropSource.sourceWidth,
      sourceHeight: cropSource.sourceHeight
    });
    videoFilters.push(`crop=${normalizedCrop.width}:${normalizedCrop.height}:${normalizedCrop.x}:${normalizedCrop.y}`);
    videoFilters.push(...buildScaleFilters({ scaleWidth, scale }));
    if (transform.reverse) videoFilters.push('reverse');
    if (speed !== 1) videoFilters.push(`setpts=(PTS-STARTPTS)/${Number(speed.toFixed(3))}`);
    if (!rightAngleOrientation && Number(transform.rotate) && Number(transform.rotate) % 360 !== 0) videoFilters.push(`rotate=${(Number(transform.rotate) * Math.PI / 180).toFixed(6)}:fillcolor=none`);
    videoFilters.push(`eq=brightness=${fx.brightness}:contrast=${fx.contrast}:saturation=${fx.saturation}:gamma=${fx.gamma}`);
    const sharpen = normalizeFilterAmount(fx.sharpen, 0, 2);
    const denoise = normalizeFilterAmount(fx.denoise, 0, 12);
    if (sharpen > 0) videoFilters.push(`unsharp=5:5:${sharpen.toFixed(2)}:3:3:0`);
    if (denoise > 0) videoFilters.push(`hqdn3d=${denoise.toFixed(1)}:${denoise.toFixed(1)}:${(denoise * 1.5).toFixed(1)}:${(denoise * 1.5).toFixed(1)}`);
    videoFilters.push(...buildFilmGrainFilters(filmGrain));
    if (Number(crt.horizontalOpacity) > 0) videoFilters.push(`drawgrid=w=iw:h=${crt.horizontalDistance}:t=${crt.horizontalThickness}:c=black@${crt.horizontalOpacity}`);
    if (Number(crt.verticalOpacity) > 0) videoFilters.push(`drawgrid=w=${crt.verticalDistance}:h=ih:t=${crt.verticalThickness}:c=black@${crt.verticalOpacity}`);
    if (fadeDuration > 0) videoFilters.push(`fade=t=out:st=${outputDuration - fadeDuration}:d=${fadeDuration}`);
    if (subtitleOptions.fileBuffer) videoFilters.push(buildSubtitleFilter(subtitleOptions));
  }

  const audioFilters = [];
  if (transform.reverse) audioFilters.push('areverse');
  audioFilters.push(...buildAtempoFilters(speed));
  audioFilters.push(`volume=${mastering.volume}`);
  if (fadeDuration > 0) audioFilters.push(`afade=t=out:st=${outputDuration - fadeDuration}:d=${fadeDuration}`);
  audioFilters.push('aresample=async=1:first_pts=0');

  const command = ['-fflags', '+genpts', '-ss', String(startTime), '-i', media.sourceName, '-t', String(clipDuration)];
  if (videoFilters.length) command.push('-vf', videoFilters.join(','));
  if (audioFilters.length) command.push('-af', audioFilters.join(','));
  if (isAudioOnly) {
    command.push('-vn', ...outputConfig.audioCodec, '-ar', '48000', '-ac', '2', outputConfig.outputName);
  } else {
    const encodePlan = buildVideoEncodeArgs({
      outputConfig,
      encoder: mastering.encoder,
      preset: mastering.preset,
      crf: 18,
      filmGrain,
      tune: mastering.tune
    });
    command.push(...encodePlan.args);
    if (encodePlan.encoder === 'x264' && (outputConfig.format === 'mp4' || outputConfig.format === 'mkv')) {
      command.push('-profile:v', mastering.profile, '-level', '4.1');
    }
    command.push('-pix_fmt', 'yuv420p');
    if (outputConfig.faststart) command.push('-movflags', '+faststart');
    command.push(...outputConfig.audioCodec, '-ar', '48000', '-ac', '2', '-map', '0:v:0', '-map', '0:a:0?', outputConfig.outputName);
  }

  return { files, command, outputName: outputConfig.outputName, mimeType: outputConfig.mimeType, clipDuration: outputDuration, sourceDuration: clipDuration, videoFilters, audioFilters };
}

export function describeMediaRenderPlan(plan) {
  return {
    sections: [
      { title: 'Inputs', items: plan.files.map((file) => file.name) },
      { title: 'Video Filters', items: plan.videoFilters.length ? plan.videoFilters : ['None'] },
      { title: 'Audio Filters', items: plan.audioFilters.length ? plan.audioFilters : ['None'] },
      { title: 'Output', items: [plan.outputName, plan.mimeType, `${plan.clipDuration.toFixed(2)}s`] },
      { title: 'Command', items: [plan.command.join(' ')] }
    ],
    commandText: plan.command.join(' ')
  };
}

export function buildMediaTimelinePlan(options) {
  const builder = new FFmpegPlanBuilder(options);
  for (const [index, layer] of (options.videoLayers || []).entries()) builder.addSequentialVideo(layer, index);
  for (const [index, layer] of (options.audioLayers || []).entries()) builder.addAudioClip({ ...layer, kind: 'audio' }, index);
  return builder.buildSequential({ crossfadeDuration: options.crossfadeDuration });
}

export function buildMediaCompositionPlan(options = {}) {
  const width = normalizePositiveEven(options.width, 1280);
  const height = normalizePositiveEven(options.height, 720);
  const fps = Math.max(1, Math.min(120, Math.round(Number(options.fps) || 30)));
  const clips = Array.isArray(options.clips) ? options.clips : [];
  const inferredDuration = getCompositionRenderDuration(clips, options.subtitles);
  const duration = Number(options.duration) > 0 ? Number(options.duration) : inferredDuration;
  const encoderFilmGrain = options.filmGrain || clips.find((clip) => normalizeFilmGrainOptions(clip.filmGrain, clip.noise).preset === 'av1-synthesis')?.filmGrain;
  const builder = new FFmpegPlanBuilder({ ...options, width, height, fps, filmGrain: encoderFilmGrain });
  const videoClips = clips.filter((clip) => ['video', 'color', 'image', 'text'].includes(clip.kind));
  const audioClips = clips.filter((clip) => clip.kind === 'audio');
  let currentVideo = 'compbase';
  builder.filterParts.push(`color=c=0x${formatHexColor(options.backgroundColor || '#000000')}:s=${width}x${height}:d=${Number(duration.toFixed(3))}:r=${fps}[${currentVideo}]`);
  videoClips.forEach((clip, index) => {
    currentVideo = builder.addOverlayClip(clip, index, currentVideo, duration);
  });
  currentVideo = appendSubtitleBurn({
    files: builder.files,
    filterParts: builder.filterParts,
    currentVideo,
    subtitles: options.subtitles,
    outputLabel: 'comp_subtitles'
  });
  audioClips.forEach((clip, index) => builder.addAudioClip(clip, index));
  let finalAudio = 'compsilent';
  if (builder.audioLabels.length) {
    finalAudio = 'compaudio';
    builder.filterParts.push(`${builder.audioLabels.map((label) => `[${label}]`).join('')}amix=inputs=${builder.audioLabels.length}:duration=longest:normalize=0,aresample=async=1:first_pts=0[${finalAudio}]`);
  } else {
    builder.filterParts.push(`anullsrc=r=48000:cl=stereo:d=${Number(duration.toFixed(3))}[${finalAudio}]`);
  }
  return builder.finalize(currentVideo, finalAudio, duration);
}

function shouldKeepTrack(track, kind) {
  if (kind === 'audio') return !track.muted;
  return track.visible !== false;
}

function getClipKind(clip = {}, track = {}) {
  return clip.kind || track.kind || 'video';
}

function isVisualClipKind(kind) {
  return ['video', 'image', 'color', 'text', 'overlay'].includes(kind);
}

function applyLaneOverlapFades(clips = []) {
  const sorted = clips
    .map((clip, index) => ({ clip: { ...clip }, index }))
    .sort((left, right) => getCompositionClipStart(left.clip) - getCompositionClipStart(right.clip));
  sorted.forEach((entry, index) => {
    const next = sorted[index + 1];
    if (!next) return;
    const overlap = getCompositionClipEnd(entry.clip) - getCompositionClipStart(next.clip);
    if (overlap <= 0) return;
    const safeOverlap = Math.min(
      overlap,
      Math.max(0, getCompositionClipDuration(entry.clip) - 0.1),
      Math.max(0, getCompositionClipDuration(next.clip) - 0.1)
    );
    if (safeOverlap <= 0) return;
    entry.clip.fadeOut = Math.max(Number(entry.clip.fadeOut) || 0, safeOverlap);
    next.clip.fadeIn = Math.max(Number(next.clip.fadeIn) || 0, safeOverlap);
  });
  return sorted
    .sort((left, right) => left.index - right.index)
    .map((entry) => entry.clip);
}

function flattenMixerTracks(tracks = []) {
  const soloTracks = tracks.filter((track) => track.solo);
  const activeTracks = soloTracks.length ? soloTracks : tracks;
  const visualByLane = [];
  const audioClips = [];
  activeTracks.forEach((track, laneIndex) => {
    if (!shouldKeepTrack(track, track.kind)) return;
    const trackOpacity = track.opacity === undefined ? 1 : clamp(Number(track.opacity) || 0, 0, 1);
    const trackVolume = track.volume === undefined ? 1 : clamp(Number(track.volume) || 0, 0, 4);
    const laneVisualClips = [];
    const laneAudioClips = [];
    (Array.isArray(track.clips) ? track.clips : []).forEach((clip) => {
      if (clip.hidden || clip.visible === false || clip.disabled) return;
      const kind = getClipKind(clip, track);
      const merged = {
        ...clip,
        kind,
        trackId: track.id,
        laneIndex,
        opacity: clamp((clip.opacity === undefined ? 1 : Number(clip.opacity) || 0) * trackOpacity, 0, 1),
        volume: clamp((clip.volume === undefined ? 1 : Number(clip.volume) || 0) * trackVolume, 0, 4)
      };
      if (kind === 'audio') laneAudioClips.push(merged);
      else if (isVisualClipKind(kind)) laneVisualClips.push(merged);
      if ((kind === 'video' || kind === 'image') && clip.hasAudio !== false && !track.muted) {
        laneAudioClips.push({
          ...merged,
          id: `${clip.id || clip.fileName || 'clip'}-audio`,
          kind: 'audio',
          opacity: 1
        });
      }
    });
    if (laneVisualClips.length) visualByLane.push({ laneIndex, clips: applyLaneOverlapFades(laneVisualClips) });
    audioClips.push(...applyLaneOverlapFades(laneAudioClips));
  });
  return [
    ...visualByLane
      .sort((left, right) => right.laneIndex - left.laneIndex)
      .flatMap((lane) => lane.clips),
    ...audioClips
  ];
}

export function flattenMediaMixerTracks(tracks = []) {
  return flattenMixerTracks(tracks);
}

export function buildMediaMixerPlan(options = {}) {
  const tracks = Array.isArray(options.tracks) ? options.tracks : [];
  const clips = flattenMixerTracks(tracks);
  const subtitles = mergeMixerSubtitleOptions(options.subtitles, collectSubtitleClipsFromTracks(tracks));
  return buildMediaCompositionPlan({
    ...options,
    subtitles,
    clips,
    outputName: options.outputName || 'mixer_export.mp4'
  });
}

function needsSequentialPreprocess(clip = {}) {
  return Boolean(clip.chromaKey || clip.mask || clip.lut || clip.requiresPreprocess);
}

function needsSequentialVisualStage(clip = {}) {
  return (clip.kind || 'video') === 'video' || needsSequentialPreprocess(clip);
}

function buildChromaKeyFilter(chromaKey = {}) {
  const color = formatHexColor(chromaKey.color || '#00ff00', '00ff00');
  const similarity = clamp(numberOr(chromaKey.similarity, 0.18), 0.01, 1);
  const blend = clamp(numberOr(chromaKey.blend, 0.08), 0, 1);
  return `chromakey=0x${color}:${Number(similarity.toFixed(3))}:${Number(blend.toFixed(3))}`;
}

function buildSequentialPreprocessFilters(clip, width, height) {
  const duration = getCompositionClipDuration(clip);
  const filters = buildVisualFilterChain({ clip, width, height, duration, alpha: true });
  if (clip.chromaKey) filters.push(buildChromaKeyFilter(clip.chromaKey));
  if (clip.lut?.fileName) filters.push(`lut3d=file='${sanitizeMediaWorkName(clip.lut.fileName, 'look.cube')}'`);
  if (clip.mask?.type) filters.push('format=rgba');
  return filters;
}

function hasGeneratedAudioCompanion(clips = [], clip = {}) {
  const clipId = String(clip.id || '');
  if (!clipId) return false;
  return clips.some((entry) => {
    return entry !== clip
      && (entry.kind || 'video') === 'audio'
      && String(entry.id || '') === `${clipId}-audio`;
  });
}

export function buildMediaSequentialChainPlan(options = {}) {
  const width = normalizePositiveEven(options.width, 1280);
  const height = normalizePositiveEven(options.height, 720);
  const fps = Math.max(1, Math.min(120, Math.round(Number(options.fps) || 30)));
  const outputConfig = getOutputConfig({
    outputFormat: options.outputFormat || 'mp4',
    isAudioOnly: false,
    outputName: options.outputName || 'video_studio_master.mp4',
    mimeType: 'video/mp4'
  });
  const tracks = Array.isArray(options.tracks) ? options.tracks : [];
  const subtitles = mergeMixerSubtitleOptions(options.subtitles, collectSubtitleClipsFromTracks(tracks));
  const clips = flattenMixerTracks(tracks).concat(Array.isArray(options.clips) ? options.clips : []);
  const duration = Number(options.duration) > 0 ? Number(options.duration) : getCompositionRenderDuration(clips, subtitles);
  const files = [];
  const commandSequence = [];
  const preparedClips = [];

  clips.forEach((clip, index) => {
    const kind = clip.kind || 'video';
    const chainKey = `clip-${index}`;
    if (kind === 'text' || kind === 'color') {
      preparedClips.push({ ...clip, chainKey, chainFileName: '', chainInput: false });
      return;
    }
    const inputName = sanitizeMediaWorkName(clip.fileName || `${kind}_${index}.mp4`, `${kind}_${index}.mp4`);
    files.push({ name: inputName, buffer: clip.buffer || new ArrayBuffer(0) });
    if (clip.lut?.fileName && clip.lut?.buffer) {
      files.push({ name: sanitizeMediaWorkName(clip.lut.fileName, 'look.cube'), buffer: clip.lut.buffer });
    }
    if (needsSequentialVisualStage({ ...clip, kind }) && kind !== 'audio') {
      const stageOutput = `stage_a_clip_${index}.mkv`;
      commandSequence.push({
        stage: 'A',
        name: `Stage A preprocess ${clip.name || clip.id || index + 1}`,
        command: [
          '-y',
          '-i', inputName,
          '-vf', buildSequentialPreprocessFilters(clip, width, height).join(','),
          '-map', '0:v:0',
          '-map', '0:a:0?',
          '-c:v', 'ffv1',
          '-level', '3',
          '-g', '1',
          '-c:a', 'pcm_s24le',
          stageOutput
        ],
        outputFileName: stageOutput,
        keepOutput: true
      });
      preparedClips.push({ ...clip, chainKey, chainFileName: stageOutput, chainInput: true, chainPreprocessed: true });
    } else {
      preparedClips.push({ ...clip, chainKey, chainFileName: inputName, chainInput: true });
    }
  });

  const stageInputs = preparedClips.filter((clip) => clip.chainInput);
  const inputIndexByClipId = new Map();
  const stageBCommand = ['-y'];
  stageInputs.forEach((clip, index) => {
    inputIndexByClipId.set(clip.chainKey, index);
    stageBCommand.push('-i', clip.chainFileName);
  });

  const filterParts = [];
  let currentVideo = 'stageb_base';
  filterParts.push(`color=c=0x${formatHexColor(options.backgroundColor || '#000000')}:s=${width}x${height}:d=${Number(duration.toFixed(3))}:r=${fps}[${currentVideo}]`);
  const audioLabels = [];

  preparedClips.forEach((clip, index) => {
    const kind = clip.kind || 'video';
    const clipDuration = Math.min(getCompositionClipDuration(clip), duration);
    const geometry = getCompositionGeometry(clip, width, height);
    if (['video', 'image'].includes(kind)) {
      const inputIndex = inputIndexByClipId.get(clip.chainKey);
      const label = `stageb_v${index}`;
      const nextVideo = `stageb_comp${index}`;
      const startFilters = clip.chainPreprocessed
        ? [`setpts=PTS-STARTPTS`, `scale=${geometry.width}:${geometry.height}`, 'format=rgba']
        : buildVisualFilterChain({
          clip,
          width: geometry.width,
          height: geometry.height,
          duration: clipDuration,
          alpha: true,
          includeTimeline: kind !== 'image',
          scale: getClipScaleOptions(clip, geometry.width, geometry.height, options.scaleQuality)
        });
      startFilters.push(...buildVisualTimelineOffsetFilters(clip));
      filterParts.push(`[${inputIndex}:v]${startFilters.join(',')}[${label}]`);
      filterParts.push(`[${currentVideo}][${label}]overlay=x=${geometry.x}:y=${geometry.y}:enable='${createOverlayEnable(clip, clipDuration)}'[${nextVideo}]`);
      currentVideo = nextVideo;
      if (clip.hasAudio !== false && !hasGeneratedAudioCompanion(preparedClips, clip)) {
        const delay = Math.round(Math.max(0, Number(clip.start) || 0) * 1000);
        const audioLabel = `stageb_a${index}`;
        filterParts.push(`[${inputIndex}:a]${buildAudioFilterChain({ clip, duration: clipDuration, delay }).join(',')}[${audioLabel}]`);
        audioLabels.push(audioLabel);
      }
    } else if (kind === 'text') {
      const label = `stageb_t${index}`;
      const nextVideo = `stageb_comp${index}`;
      const text = normalizeSubtitleCueText(clip.text || 'Text').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:');
      const filters = [
        'format=rgba',
        `drawtext=text='${text}':fontcolor=white:fontsize=${Math.max(8, Math.round(Number(clip.fontSize) || 42))}:x=24:y=24`,
        ...buildFadeFilters(clip, clipDuration, true),
        ...buildVisualTimelineOffsetFilters(clip)
      ];
      filterParts.push(`color=c=0x00000000:s=${geometry.width}x${geometry.height}:d=${Number(clipDuration.toFixed(3))}:r=${fps},${filters.join(',')}[${label}]`);
      filterParts.push(`[${currentVideo}][${label}]overlay=x=${geometry.x}:y=${geometry.y}:enable='${createOverlayEnable(clip, clipDuration)}'[${nextVideo}]`);
      currentVideo = nextVideo;
    } else if (kind === 'color') {
      const label = `stageb_c${index}`;
      const nextVideo = `stageb_comp${index}`;
      const filters = ['format=rgba', ...buildFadeFilters(clip, clipDuration, true), ...buildVisualTimelineOffsetFilters(clip)];
      filterParts.push(`color=c=0x${formatHexColor(clip.color)}:s=${geometry.width}x${geometry.height}:d=${Number(clipDuration.toFixed(3))}:r=${fps},${filters.join(',')}[${label}]`);
      filterParts.push(`[${currentVideo}][${label}]overlay=x=${geometry.x}:y=${geometry.y}:enable='${createOverlayEnable(clip, clipDuration)}'[${nextVideo}]`);
      currentVideo = nextVideo;
    } else if (kind === 'audio') {
      const inputIndex = inputIndexByClipId.get(clip.chainKey);
      const delay = Math.round(Math.max(0, Number(clip.start) || 0) * 1000);
      const audioLabel = `stageb_a${index}`;
      filterParts.push(`[${inputIndex}:a]${buildAudioFilterChain({ clip, duration: clipDuration, delay }).join(',')}[${audioLabel}]`);
      audioLabels.push(audioLabel);
    }
  });

  currentVideo = appendSubtitleBurn({
    files,
    filterParts,
    currentVideo,
    subtitles,
    outputLabel: 'stageb_subtitles'
  });

  let finalAudio = 'stageb_silent';
  if (audioLabels.length) {
    finalAudio = 'stageb_audio';
    filterParts.push(`${audioLabels.map((label) => `[${label}]`).join('')}amix=inputs=${audioLabels.length}:duration=longest:normalize=0,aresample=async=1:first_pts=0[${finalAudio}]`);
  } else {
    filterParts.push(`anullsrc=r=48000:cl=stereo:d=${Number(duration.toFixed(3))}[${finalAudio}]`);
  }

  const stageBOutput = 'stage_b_composite.mkv';
  stageBCommand.push(
    '-filter_complex', filterParts.join(';'),
    '-map', `[${currentVideo}]`,
    '-map', `[${finalAudio}]`,
    '-c:v', 'ffv1',
    '-level', '3',
    '-g', '1',
    '-c:a', 'pcm_s24le',
    stageBOutput
  );
  commandSequence.push({
    stage: 'B',
    name: 'Stage B compose overlays',
    command: stageBCommand,
    outputFileName: stageBOutput,
    keepOutput: true
  });

  const encoderFilmGrain = options.filmGrain || preparedClips.find((clip) => normalizeFilmGrainOptions(clip.filmGrain, clip.noise).preset === 'av1-synthesis')?.filmGrain;
  const { args } = getTimelineOutputArgs({
    ...options,
    outputName: outputConfig.outputName,
    outputFormat: outputConfig.format,
    preset: options.preset || 'slow',
    crf: options.crf ?? 18,
    qualityProfile: options.qualityProfile,
    scaleQuality: options.scaleQuality,
    audioBitrate: options.audioBitrate,
    rateControl: options.rateControl,
    videoBitrate: options.videoBitrate,
    maxrate: options.maxrate,
    bufsize: options.bufsize,
    gopSize: options.gopSize,
    profile: options.profile,
    level: options.level,
    pixelFormat: options.pixelFormat,
    threads: options.threads,
    frameRateMode: options.frameRateMode,
    audioCodec: options.audioCodec,
    audioQuality: options.audioQuality,
    sampleRate: options.sampleRate,
    channels: options.channels,
    audioSampleFormat: options.audioSampleFormat,
    faststart: options.faststart,
    shortest: options.shortest,
    metadata: options.metadata,
    filmGrain: encoderFilmGrain
  });
  const finalCommand = [
    '-y',
    '-i', stageBOutput,
    '-map', '0:v:0',
    '-map', '0:a:0?',
    '-r', String(fps),
    ...args,
    outputConfig.outputName
  ];
  commandSequence.push({
    stage: 'C',
    name: 'Stage C final encode',
    command: finalCommand,
    outputFileName: outputConfig.outputName
  });

  return {
    files,
    commandSequence,
    command: finalCommand,
    outputName: outputConfig.outputName,
    mimeType: outputConfig.mimeType,
    duration,
    width,
    height,
    fps,
    filterGraph: filterParts.join(';'),
    stageOutputs: commandSequence.map((step) => step.outputFileName)
  };
}

export function buildMediaNormalizedStitchPlan(options = {}) {
  const width = normalizePositiveEven(options.width, 1280);
  const height = normalizePositiveEven(options.height, 720);
  const fps = Math.max(1, Math.min(120, Math.round(Number(options.fps) || 30)));
  const preset = normalizePreset(options.preset);
  const crf = Math.max(0, Math.min(51, Math.round(Number(options.crf) || 18)));
  const outputConfig = getOutputConfig({ outputFormat: 'mp4', isAudioOnly: false, outputName: options.outputName || 'stitched_export.mp4', mimeType: 'video/mp4' });
  const clips = Array.isArray(options.clips) ? options.clips : [];
  if (!clips.length) throw new Error('At least one clip is required for normalized stitching.');
  const files = [];
  const commandSequence = [];
  const segmentNames = [];

  clips.forEach((clip, index) => {
    const inputName = sanitizeMediaWorkName(clip.fileName, `clip_${index}.mp4`);
    const segmentName = `seg_${index}.ts`;
    const start = Math.max(0, Number(clip.start) || 0);
    const end = Number(clip.end);
    const duration = Number.isFinite(end) && end > start ? end - start : Number(clip.duration) || 0;
    const vf = [`scale=${width}:${height}:force_original_aspect_ratio=decrease`, `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`, 'setsar=1'].join(',');
    files.push({ name: inputName, buffer: clip.buffer || new ArrayBuffer(0) });
    segmentNames.push(segmentName);
    const command = ['-y', '-hide_banner', ...(start > 0 ? ['-ss', String(start)] : []), '-i', inputName, ...(duration > 0 ? ['-t', String(Number(duration.toFixed(3)))] : [])];
    if (clip.hasAudio === false) {
      command.push('-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-vf', vf, '-map', '0:v:0', '-map', '1:a:0', '-shortest');
    } else {
      command.push('-vf', vf, '-af', 'aresample=async=1:first_pts=0,loudnorm=I=-23:TP=-1:LRA=11:linear=true');
    }
    command.push('-c:v', 'libx264', '-preset', preset, '-crf', String(crf), '-pix_fmt', 'yuv420p', '-fps_mode', 'cfr', '-r', String(fps), '-tune', 'grain', '-profile:v', 'high', '-level', '4.0', '-bsf:v', 'h264_mp4toannexb', '-c:a', 'aac', '-b:a', '192k', '-ac', '2', '-ar', '44100', '-video_track_timescale', '90000', '-f', 'mpegts', segmentName);
    commandSequence.push({ name: `Normalize segment ${index + 1}`, command, outputFileName: segmentName, keepOutput: true });
  });

  const listText = segmentNames.map((name) => `file '${name}'`).join('\n');
  files.push({ name: 'concat_list.txt', buffer: makeTextBuffer(`${listText}\n`) });
  commandSequence.push({
    name: 'Concat segments',
    command: ['-f', 'concat', '-safe', '0', '-i', 'concat_list.txt', '-bsf:a', 'aac_adtstoasc', '-c', 'copy', '-movflags', '+faststart', outputConfig.outputName],
    outputFileName: outputConfig.outputName
  });

  return { files, commandSequence, command: commandSequence.at(-1).command, outputName: outputConfig.outputName, mimeType: outputConfig.mimeType, segmentNames, width, height, fps };
}

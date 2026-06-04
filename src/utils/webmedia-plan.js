import { normalizeSubtitleCues, normalizeWebMediaSubtitleStyle } from './webmedia-package.js';

const MIME_CONTAINER = new Map([
  ['video/mp4', 'mp4'],
  ['audio/mp4', 'mp4'],
  ['video/quicktime', 'mov'],
  ['video/webm', 'webm'],
  ['audio/webm', 'webm'],
  ['video/x-matroska', 'matroska'],
  ['audio/x-matroska', 'matroska'],
  ['audio/wav', 'wav'],
  ['audio/wave', 'wav'],
  ['audio/mpeg', 'mp3'],
  ['audio/ogg', 'ogg'],
  ['video/ogg', 'ogg'],
  ['audio/flac', 'flac'],
  ['audio/aac', 'adts'],
  ['application/vnd.apple.mpegurl', 'hls'],
  ['application/x-mpegurl', 'hls'],
  ['video/mp2t', 'mpegts']
]);

const EXTENSION_CONTAINER = new Map([
  ['mp4', 'mp4'],
  ['m4v', 'mp4'],
  ['m4a', 'mp4'],
  ['mov', 'mov'],
  ['webm', 'webm'],
  ['mkv', 'matroska'],
  ['mka', 'matroska'],
  ['wav', 'wav'],
  ['wave', 'wav'],
  ['mp3', 'mp3'],
  ['ogg', 'ogg'],
  ['oga', 'ogg'],
  ['flac', 'flac'],
  ['aac', 'adts'],
  ['adts', 'adts'],
  ['ts', 'mpegts'],
  ['m2ts', 'mpegts'],
  ['m3u8', 'hls']
]);

export const WEBMEDIA_CONTAINERS = {
  mp4: {
    label: 'MP4',
    extension: 'mp4',
    mime: 'video/mp4',
    video: ['h264', 'hevc', 'av1'],
    audio: ['aac', 'mp3', 'opus'],
    subtitles: ['vtt', 'tx3g']
  },
  mov: {
    label: 'QuickTime',
    extension: 'mov',
    mime: 'video/quicktime',
    video: ['h264', 'hevc', 'prores'],
    audio: ['aac', 'pcm', 'mp3'],
    subtitles: ['tx3g']
  },
  webm: {
    label: 'WebM',
    extension: 'webm',
    mime: 'video/webm',
    video: ['vp8', 'vp9', 'av1'],
    audio: ['opus', 'vorbis'],
    subtitles: ['vtt']
  },
  matroska: {
    label: 'Matroska',
    extension: 'mkv',
    mime: 'video/x-matroska',
    video: ['h264', 'hevc', 'av1', 'vp8', 'vp9'],
    audio: ['aac', 'opus', 'vorbis', 'flac', 'mp3', 'pcm'],
    subtitles: ['vtt', 'srt', 'ass']
  },
  wav: {
    label: 'WAVE',
    extension: 'wav',
    mime: 'audio/wav',
    video: [],
    audio: ['pcm'],
    subtitles: []
  },
  mp3: {
    label: 'MP3',
    extension: 'mp3',
    mime: 'audio/mpeg',
    video: [],
    audio: ['mp3'],
    subtitles: []
  },
  ogg: {
    label: 'Ogg',
    extension: 'ogg',
    mime: 'audio/ogg',
    video: ['theora', 'vp8'],
    audio: ['opus', 'vorbis', 'flac'],
    subtitles: []
  },
  adts: {
    label: 'ADTS AAC',
    extension: 'aac',
    mime: 'audio/aac',
    video: [],
    audio: ['aac'],
    subtitles: []
  },
  flac: {
    label: 'FLAC',
    extension: 'flac',
    mime: 'audio/flac',
    video: [],
    audio: ['flac'],
    subtitles: []
  },
  mpegts: {
    label: 'MPEG-TS',
    extension: 'ts',
    mime: 'video/mp2t',
    video: ['h264', 'hevc'],
    audio: ['aac', 'mp3'],
    subtitles: []
  },
  hls: {
    label: 'HLS',
    extension: 'm3u8',
    mime: 'application/vnd.apple.mpegurl',
    video: ['h264', 'hevc'],
    audio: ['aac', 'mp3'],
    subtitles: ['vtt']
  }
};

const DEFAULT_TARGETS = {
  inspect: 'mp4',
  remux: 'mp4',
  transcode: 'mp4',
  trim: 'mp4',
  transform: 'mp4',
  audio: 'mp3',
  subtitles: 'mp4',
  hls: 'hls'
};

const REQUIRED_WEB_CODECS = ['VideoDecoder', 'VideoEncoder', 'AudioDecoder', 'AudioEncoder'];
const INSPECT_DEPTH_VALUES = new Set(['summary', 'metadata', 'packets', 'compatibility']);
const FIT_VALUES = new Set(['fill', 'contain', 'cover']);
const HARDWARE_VALUES = new Set(['no-preference', 'prefer-hardware', 'prefer-software']);
const ALPHA_VALUES = new Set(['discard', 'keep']);
const SAMPLE_FORMAT_VALUES = new Set(['u8', 's16', 's32', 'f32']);
const TRACK_VALUES = new Set(['all', 'primary']);
const ROTATION_VALUES = new Set([0, 90, 180, 270]);
const TIMESTAMP_POLICY_VALUES = new Set(['preserve', 'rebase', 'zero']);
const REMUX_ROTATION_POLICY_VALUES = new Set(['preserve', 'matrix', 'bake']);
const CHAPTER_POLICY_VALUES = new Set(['keep', 'drop']);
const ATTACHMENT_POLICY_VALUES = new Set(['drop', 'keep-compatible']);
const METADATA_POLICY_VALUES = new Set(['keep', 'replace', 'strip']);
const RATE_CONTROL_VALUES = new Set(['bitrate', 'quality', 'lossless']);
const SPEED_PRESET_VALUES = new Set(['draft', 'preview', 'fast', 'medium', 'quality', 'slow', 'veryslow']);
const LATENCY_VALUES = new Set(['auto', 'quality', 'realtime']);
const TUNE_VALUES = new Set(['none', 'film', 'animation', 'screen', 'grain']);
const SNAP_POLICY_VALUES = new Set(['none', 'keyframe', 'frame', 'sample']);
const SUBTITLE_FORMAT_VALUES = new Set(['auto', 'vtt', 'srt']);
const SUBTITLE_POSITION_VALUES = new Set(['bottom', 'top', 'center']);
const HLS_PLAYLIST_VALUES = new Set(['vod', 'event', 'live']);

export function detectMediaContainer(input = {}) {
  const type = String(input.type || input.mime || '').toLowerCase().split(';')[0].trim();
  if (MIME_CONTAINER.has(type)) return MIME_CONTAINER.get(type);
  const name = String(input.name || input.fileName || '').toLowerCase();
  const ext = name.includes('.') ? name.split('.').pop() : '';
  return EXTENSION_CONTAINER.get(ext) || 'unknown';
}

export function normalizeCodec(codec = '') {
  const value = String(codec || '').toLowerCase().trim();
  if (!value) return 'unknown';
  if (value.startsWith('avc1') || value.startsWith('avc3') || value === 'avc' || value === 'h264' || value === 'h.264') return 'h264';
  if (value.startsWith('hev1') || value.startsWith('hvc1') || value === 'hevc' || value === 'h265' || value === 'h.265') return 'hevc';
  if (value.startsWith('av01')) return 'av1';
  if (value.startsWith('vp09')) return 'vp9';
  if (value.startsWith('vp08')) return 'vp8';
  if (value.startsWith('mp4a') || value.includes('aac')) return 'aac';
  if (value.includes('pcm')) return 'pcm';
  if (value.includes('vorbis')) return 'vorbis';
  if (value.includes('opus')) return 'opus';
  if (value.includes('flac')) return 'flac';
  if (value.includes('mp3') || value.includes('mpeg')) return 'mp3';
  if (value.includes('vtt')) return 'vtt';
  if (value.includes('srt')) return 'srt';
  if (value.includes('ass')) return 'ass';
  return value.split(/[.,\s/]+/)[0] || 'unknown';
}

export function normalizeWebMediaSource(source = {}) {
  const fileName = source.fileName || source.name || 'media';
  return {
    fileName,
    mime: source.mime || source.type || '',
    size: Number(source.size || 0),
    duration: Number(source.duration || 0),
    container: source.container || detectMediaContainer({ name: fileName, type: source.mime || source.type }),
    tracks: Array.isArray(source.tracks)
      ? source.tracks.map((track, index) => normalizeTrack(track, index))
      : []
  };
}

export function normalizeTrack(track = {}, index = 0) {
  const kind = ['video', 'audio', 'subtitle'].includes(track.kind) ? track.kind : 'unknown';
  return {
    id: track.id || `${kind}-${index + 1}`,
    kind,
    codec: normalizeCodec(track.codec || track.codecString),
    codecString: track.codecString || track.codec || '',
    width: Number(track.width || 0),
    height: Number(track.height || 0),
    sampleRate: Number(track.sampleRate || 0),
    channels: Number(track.channels || 0),
    duration: Number(track.duration || 0),
    language: track.language || '',
    rotation: Number(track.rotation || 0),
    frameRate: Number(track.frameRate || 0),
    decodable: track.decodable === true
  };
}

export function canContainerCarryTrack(containerId, track) {
  const container = WEBMEDIA_CONTAINERS[containerId];
  if (!container) return false;
  const codec = normalizeCodec(track.codec || track.codecString);
  if (track.kind === 'video') return container.video.includes(codec);
  if (track.kind === 'audio') return container.audio.includes(codec);
  if (track.kind === 'subtitle') return container.subtitles.includes(codec);
  return false;
}

export function createWebMediaInspection(file = {}, options = {}) {
  const metadata = options.metadata || {};
  const source = normalizeWebMediaSource({
    fileName: file.name || file.fileName,
    mime: file.type || file.mime,
    size: file.size,
    duration: metadata.duration ?? file.duration,
    tracks: metadata.tracks || file.tracks || options.tracks || []
  });
  const capabilities = summarizeWebMediaCapabilities(options.capabilities || {});
  const warnings = Array.isArray(options.warnings) ? [...options.warnings] : [];
  if (source.container === 'unknown') {
    warnings.push({
      code: 'UNSUPPORTED_INPUT_FORMAT',
      message: 'Input container could not be identified locally.'
    });
  }
  if (!capabilities.ready) {
    warnings.push({
      code: 'WEB_CODECS_INCOMPLETE',
      message: 'Browser WebCodecs support is incomplete; transcode and accurate trim may be blocked.'
    });
  }
  return {
    ...source,
    modifiedAt: file.lastModified || null,
    metadata: {
      provider: metadata.provider || 'summary',
      depth: metadata.depth || 'summary',
      tags: sanitizeMetadataTags(metadata.tags)
    },
    capabilities,
    warnings
  };
}

export function summarizeWebMediaCapabilities(capabilities = {}) {
  const mainSource = capabilities.main || capabilities;
  const workerSource = capabilities.worker || {};
  const main = normalizeCapabilityScope(mainSource);
  const worker = normalizeCapabilityScope(workerSource);
  const missingMain = REQUIRED_WEB_CODECS.filter((key) => !main[key]);
  const missingWorker = REQUIRED_WEB_CODECS.filter((key) => !worker[key]);
  const mainKnown = hasCapabilitySignals(mainSource);
  const workerKnown = hasCapabilitySignals(workerSource);
  return {
    main,
    worker,
    mainKnown,
    workerKnown,
    missingMain,
    missingWorker,
    ready: mainKnown && workerKnown && missingMain.length === 0 && missingWorker.length === 0
  };
}

export function planWebMediaOperation(input = {}) {
  const operation = String(input.operation || 'inspect').toLowerCase();
  const source = normalizeWebMediaSource(input.source || {});
  const settings = normalizeWebMediaSettings(input, operation);
  const targetContainer = WEBMEDIA_CONTAINERS[input.targetContainer] ? input.targetContainer : DEFAULT_TARGETS[operation] || 'mp4';
  const outputContainer = WEBMEDIA_CONTAINERS[targetContainer] || WEBMEDIA_CONTAINERS.mp4;
  const warnings = [];
  const errors = [];
  const conversion = buildWebMediaConversionPlan(operation, source, settings, targetContainer);
  const remuxOnly = Boolean(input.remuxOnly ?? settings.remux.remuxOnly);
  const transformRequiresReencode = conversion.requiresReencode;
  const hlsPackage = operation === 'hls' || targetContainer === 'hls';
  const subtitlePackage = operation === 'subtitles' && settings.subtitles.importText;
  const packageMode = hlsPackage || subtitlePackage;

  if (source.container === 'unknown') {
    errors.push({
      code: 'UNSUPPORTED_INPUT_FORMAT',
      message: 'Input container is not recognized by the local planner.'
    });
  }

  if (subtitlePackage && !settings.subtitles.cues.length) {
    warnings.push({
      code: 'WEBMEDIA_SUBTITLE_TEXT_EMPTY',
      message: 'Subtitle package will export an empty WebVTT sidecar until cues are added.'
    });
  }

  if (settings.subtitles.burnIn) {
    errors.push({
      code: 'WEBMEDIA_SUBTITLE_BURNIN_HANDOFF',
      message: 'Subtitle burn-in requires a verified frame render pipeline; use Video Studio for burn-in.'
    });
  }

  if (hasFrameAdjustmentWork(conversion.adjustments?.transform)) {
    errors.push({
      code: 'WEBMEDIA_FRAME_EFFECTS_PENDING',
      message: 'Frame effects, flips, canvas positioning, and color adjustments need the verified frame render path before browser-native export.',
      suggestedRoute: '/video-studio'
    });
  }

  if (hasAudioAdjustmentWork(conversion.adjustments?.audio)) {
    errors.push({
      code: 'WEBMEDIA_AUDIO_EFFECTS_PENDING',
      message: 'Audio gain, fades, normalization, dynamics, pan, and filters need the verified Web Audio render path before browser-native export.',
      suggestedRoute: '/video-studio'
    });
  }

  const plannedOutputTracks = getPlannedOutputTracks(source, conversion);
  if (operation !== 'inspect' && source.tracks.length && !plannedOutputTracks.length) {
    errors.push({
      code: 'WEBMEDIA_NO_OUTPUT_TRACKS',
      message: 'Selected settings would remove every media track.'
    });
  }

  const incompatibleTracks = packageMode ? [] : plannedOutputTracks.filter((track) => !canContainerCarryTrack(targetContainer, track));
  if (incompatibleTracks.length) {
    errors.push({
      code: 'TARGET_CONTAINER_CODEC_UNSUPPORTED',
      message: `${outputContainer.label} cannot carry ${incompatibleTracks.map((track) => `${track.kind}:${track.codec}`).join(', ')} with the selected settings.`
    });
  }

  if (remuxOnly && transformRequiresReencode) {
    errors.push({
      code: 'REMUX_ONLY_REENCODE_REQUIRED',
      message: 'Requested operation requires decode and encode, but remux-only is selected.'
    });
  }

  if (transformRequiresReencode) {
    warnings.push({
      code: 'REENCODE_REQUIRED',
      message: 'This operation requires reencode; packet-copy remux is not possible.'
    });
  }

  let mode = 'Remux';
  if (operation === 'inspect') mode = 'Inspect';
  else if (errors.length) mode = 'Blocked';
  else if (packageMode) mode = 'Package';
  else if (operation === 'audio') mode = 'Audio';
  else if (transformRequiresReencode || operation === 'transcode') mode = 'Transcode';
  else if (operation === 'trim' && settings.trim.mode === 'packet') mode = 'Remux';

  const output = getWebMediaPlanOutput(operation, targetContainer, outputContainer, {
    hlsPackage,
    subtitlePackage
  });

  return {
    operation,
    mode,
    source,
    targetContainer,
    requiresReencode: transformRequiresReencode,
    remuxOnly,
    execution: operation === 'inspect'
      ? 'inspect-report'
      : errors.length
        ? 'blocked'
        : hlsPackage
          ? 'webmedia-hls-package'
          : subtitlePackage
            ? 'webmedia-subtitle-package'
            : 'mediabunny-conversion',
    settings,
    conversion: pruneConversionPlan(conversion),
    output,
    warnings,
    errors
  };
}

export function buildWebMediaOutputName(fileName = 'media', plan = {}) {
  const clean = String(fileName || 'media').replace(/[\\/]/g, '_');
  const base = clean.includes('.') ? clean.slice(0, clean.lastIndexOf('.')) : clean;
  const extension = plan.output?.extension || WEBMEDIA_CONTAINERS[plan.targetContainer]?.extension || 'bin';
  return `${base || 'media'}.webmedia.${extension}`;
}

function normalizeCapabilityScope(scope = {}) {
  return {
    VideoDecoder: Boolean(scope.VideoDecoder),
    VideoEncoder: Boolean(scope.VideoEncoder),
    AudioDecoder: Boolean(scope.AudioDecoder),
    AudioEncoder: Boolean(scope.AudioEncoder),
    EncodedVideoChunk: Boolean(scope.EncodedVideoChunk),
    EncodedAudioChunk: Boolean(scope.EncodedAudioChunk)
  };
}

function hasCapabilitySignals(scope = {}) {
  return REQUIRED_WEB_CODECS.some((key) => Object.prototype.hasOwnProperty.call(scope, key));
}

function normalizeWebMediaSettings(input = {}, operation = 'inspect') {
  const settings = input.settings || {};
  const inspect = settings.inspect || {};
  const transcode = settings.transcode || {};
  const transform = settings.transform || input.transform || {};
  const trim = settings.trim || input.trim || {};
  const audio = settings.audio || {};
  const subtitles = settings.subtitles || {};
  const hls = settings.hls || {};
  return {
    inspect: {
      depth: INSPECT_DEPTH_VALUES.has(inspect.depth) ? inspect.depth : 'metadata',
      packetSampleLimit: clampInteger(inspect.packetSampleLimit, 0, 2000),
      includeTags: inspect.includeTags !== false,
      includePackets: Boolean(inspect.includePackets),
      includeCompatibility: inspect.includeCompatibility !== false
    },
    tracks: TRACK_VALUES.has(settings.tracks) ? settings.tracks : 'all',
    remux: {
      remuxOnly: input.remuxOnly !== undefined ? Boolean(input.remuxOnly) : operation === 'remux' && settings.remux?.remuxOnly !== false,
      trackPolicy: settings.remux?.trackPolicy === 'drop-incompatible' ? 'drop-incompatible' : 'keep-all',
      timestampPolicy: TIMESTAMP_POLICY_VALUES.has(settings.remux?.timestampPolicy) ? settings.remux.timestampPolicy : 'preserve',
      rotationPolicy: REMUX_ROTATION_POLICY_VALUES.has(settings.remux?.rotationPolicy) ? settings.remux.rotationPolicy : 'preserve',
      fastStart: Boolean(settings.remux?.fastStart),
      interleaveMs: clampInteger(settings.remux?.interleaveMs, 0, 10000),
      chapterPolicy: CHAPTER_POLICY_VALUES.has(settings.remux?.chapterPolicy) ? settings.remux.chapterPolicy : 'keep',
      attachmentPolicy: ATTACHMENT_POLICY_VALUES.has(settings.remux?.attachmentPolicy) ? settings.remux.attachmentPolicy : 'drop',
      metadataPolicy: METADATA_POLICY_VALUES.has(settings.remux?.metadataPolicy) ? settings.remux.metadataPolicy : 'keep'
    },
    transcode: {
      preset: String(transcode.preset || 'custom'),
      speedPreset: SPEED_PRESET_VALUES.has(transcode.speedPreset) ? transcode.speedPreset : 'medium',
      videoCodec: normalizeCodecChoice(transcode.videoCodec ?? input.videoCodec ?? 'copy'),
      audioCodec: normalizeCodecChoice(transcode.audioCodec ?? input.audioCodec ?? 'copy'),
      rateControl: RATE_CONTROL_VALUES.has(transcode.rateControl) ? transcode.rateControl : 'bitrate',
      quality: clampNumber(transcode.quality, 0, 100),
      videoBitrateKbps: numberOrZero(transcode.videoBitrateKbps),
      maxVideoBitrateKbps: numberOrZero(transcode.maxVideoBitrateKbps),
      bufferSizeKbps: numberOrZero(transcode.bufferSizeKbps),
      audioBitrateKbps: numberOrZero(transcode.audioBitrateKbps),
      width: positiveInteger(transcode.width),
      height: positiveInteger(transcode.height),
      fit: FIT_VALUES.has(transcode.fit) ? transcode.fit : 'contain',
      preventUpscale: Boolean(transcode.preventUpscale),
      frameRate: positiveNumber(transcode.frameRate),
      keyFrameInterval: positiveNumber(transcode.keyFrameInterval),
      hardwareAcceleration: HARDWARE_VALUES.has(transcode.hardwareAcceleration) ? transcode.hardwareAcceleration : 'no-preference',
      alpha: ALPHA_VALUES.has(transcode.alpha) ? transcode.alpha : 'discard',
      latencyMode: LATENCY_VALUES.has(transcode.latencyMode) ? transcode.latencyMode : 'auto',
      tune: TUNE_VALUES.has(transcode.tune) ? transcode.tune : 'none',
      bitDepth: clampInteger(transcode.bitDepth, 0, 16),
      colorSpace: String(transcode.colorSpace || 'auto').trim() || 'auto',
      sampleRate: positiveInteger(transcode.sampleRate),
      channels: positiveInteger(transcode.channels),
      sampleFormat: SAMPLE_FORMAT_VALUES.has(transcode.sampleFormat) ? transcode.sampleFormat : '',
      discardVideo: Boolean(transcode.discardVideo),
      discardAudio: Boolean(transcode.discardAudio),
      forceVideo: transcode.forceVideo !== false && operation === 'transcode',
      forceAudio: transcode.forceAudio !== false && operation === 'transcode'
    },
    trim: {
      start: positiveNumber(trim.start),
      end: positiveNumber(trim.end),
      duration: positiveNumber(trim.duration),
      mode: trim.mode === 'accurate' ? 'accurate' : 'packet',
      snapPolicy: SNAP_POLICY_VALUES.has(trim.snapPolicy) ? trim.snapPolicy : 'keyframe',
      preroll: positiveNumber(trim.preroll),
      postroll: positiveNumber(trim.postroll),
      preserveTimestamps: Boolean(trim.preserveTimestamps),
      fadeIn: positiveNumber(trim.fadeIn),
      fadeOut: positiveNumber(trim.fadeOut)
    },
    transform: {
      width: positiveInteger(transform.width ?? transform.resize?.width),
      height: positiveInteger(transform.height ?? transform.resize?.height),
      fit: FIT_VALUES.has(transform.fit) ? transform.fit : 'contain',
      rotate: normalizeRotation(transform.rotate),
      allowRotationMetadata: transform.allowRotationMetadata !== false,
      crop: normalizeCrop(transform.crop),
      frameRate: positiveNumber(transform.frameRate),
      anchor: String(transform.anchor || 'center').trim() || 'center',
      scale: positiveNumber(transform.scale),
      x: signedNumber(transform.x),
      y: signedNumber(transform.y),
      flipHorizontal: Boolean(transform.flipHorizontal),
      flipVertical: Boolean(transform.flipVertical),
      background: normalizeColorValue(transform.background),
      color: normalizeColorAdjustments(transform.color),
      effects: normalizeTransformEffects(transform.effects)
    },
    audio: {
      mode: audio.mode === 'drop' ? 'drop' : audio.mode === 'copy' ? 'copy' : 'convert',
      audioCodec: normalizeCodecChoice(audio.audioCodec ?? input.audioCodec ?? 'mp3'),
      audioBitrateKbps: numberOrZero(audio.audioBitrateKbps),
      sampleRate: positiveInteger(audio.sampleRate),
      channels: positiveInteger(audio.channels),
      sampleFormat: SAMPLE_FORMAT_VALUES.has(audio.sampleFormat) ? audio.sampleFormat : '',
      discardVideo: audio.discardVideo !== false,
      gainDb: signedNumber(audio.gainDb),
      normalize: Boolean(audio.normalize),
      normalizeTargetDb: signedNumber(audio.normalizeTargetDb || -14),
      limiter: Boolean(audio.limiter),
      fadeIn: positiveNumber(audio.fadeIn),
      fadeOut: positiveNumber(audio.fadeOut),
      pan: clampNumber(audio.pan, -1, 1),
      highpassHz: positiveNumber(audio.highpassHz),
      lowpassHz: positiveNumber(audio.lowpassHz),
      compressorThreshold: signedNumber(audio.compressorThreshold),
      compressorRatio: positiveNumber(audio.compressorRatio)
    },
    subtitles: {
      mode: subtitles.mode === 'drop' ? 'drop' : 'copy',
      importText: Boolean(subtitles.importText),
      burnIn: Boolean(subtitles.burnIn),
      language: String(subtitles.language || '').trim(),
      sourceFormat: SUBTITLE_FORMAT_VALUES.has(subtitles.sourceFormat) ? subtitles.sourceFormat : 'auto',
      fileName: String(subtitles.fileName || '').trim(),
      offset: signedNumber(subtitles.offset),
      ...normalizeWebMediaSubtitleStyle(subtitles),
      position: SUBTITLE_POSITION_VALUES.has(subtitles.position) ? subtitles.position : 'bottom',
      outline: positiveNumber(subtitles.outline),
      background: Boolean(subtitles.background),
      cues: normalizeSubtitleCues(subtitles.cues)
    },
    hls: {
      segmentDuration: clampNumber(hls.segmentDuration || 6, 1, 30),
      playlistType: HLS_PLAYLIST_VALUES.has(hls.playlistType) ? hls.playlistType : 'vod',
      variantLadder: String(hls.variantLadder || '').trim(),
      independentSegments: hls.independentSegments !== false,
      iframePlaylist: Boolean(hls.iframePlaylist),
      audioRenditions: Boolean(hls.audioRenditions),
      captionRendition: Boolean(hls.captionRendition)
    },
    metadata: sanitizeMetadataTags(settings.metadata || input.metadata || {})
  };
}

function buildWebMediaConversionPlan(operation, source, settings, targetContainer) {
  const conversion = {
    tracks: settings.tracks,
    video: {},
    audio: {},
    trim: {},
    mux: buildMuxOptions(settings.remux),
    profile: buildTranscodeProfile(settings.transcode),
    adjustments: buildAdjustmentPlan(operation, settings),
    package: {},
    tags: settings.metadata,
    requiresReencode: false
  };

  if (operation === 'remux' && settings.remux.trackPolicy === 'drop-incompatible') {
    applySimpleTrackDrop(conversion, source, targetContainer);
  }

  if (operation === 'transcode') {
    Object.assign(conversion.video, buildVideoOptions(settings.transcode));
    Object.assign(conversion.audio, buildAudioOptions(settings.transcode));
  }

  if (operation === 'trim') {
    if (settings.trim.start > 0) conversion.trim.start = settings.trim.start;
    if (settings.trim.end > 0) conversion.trim.end = settings.trim.end;
    if (settings.trim.duration > 0 && !conversion.trim.end) conversion.trim.duration = settings.trim.duration;
    if (settings.trim.mode === 'accurate') {
      conversion.video.forceTranscode = hasTrackKind(source, 'video');
      conversion.audio.forceTranscode = hasTrackKind(source, 'audio');
      conversion.requiresReencode = conversion.video.forceTranscode || conversion.audio.forceTranscode;
    }
    if (settings.trim.fadeIn > 0 || settings.trim.fadeOut > 0) {
      conversion.adjustments.audio.fadeIn = settings.trim.fadeIn;
      conversion.adjustments.audio.fadeOut = settings.trim.fadeOut;
    }
  }

  if (operation === 'transform') {
    Object.assign(conversion.video, buildTransformOptions(settings.transform));
    conversion.requiresReencode = Object.keys(conversion.video).length > 0;
  }

  if (operation === 'audio') {
    if (settings.audio.discardVideo) conversion.video.discard = true;
    if (settings.audio.mode === 'drop') conversion.audio.discard = true;
    else Object.assign(conversion.audio, buildAudioOptions(settings.audio));
  }

  if (operation === 'subtitles') {
    conversion.tracks = settings.subtitles.mode === 'drop' ? 'primary' : settings.tracks;
  }

  if (operation === 'hls') {
    conversion.package = buildHlsPackage(settings.hls);
    applyHlsPackagingOptions(conversion, source);
  }

  if (operation === 'remux' || operation === 'subtitles') {
    conversion.requiresReencode = false;
  } else {
    conversion.requiresReencode = conversion.requiresReencode || needsVideoReencode(conversion.video) || needsAudioReencode(conversion.audio);
  }

  conversion.requiresReencode = conversion.requiresReencode || hasFrameAdjustmentWork(conversion.adjustments.transform) || hasAudioAdjustmentWork(conversion.adjustments.audio);

  return conversion;
}

function buildMuxOptions(remux = {}) {
  const output = {};
  if (remux.fastStart) output.fastStart = true;
  if (remux.interleaveMs > 0) output.interleaveMs = remux.interleaveMs;
  if (remux.timestampPolicy !== 'preserve') output.timestampPolicy = remux.timestampPolicy;
  if (remux.rotationPolicy !== 'preserve') output.rotationPolicy = remux.rotationPolicy;
  if (remux.chapterPolicy !== 'keep') output.chapterPolicy = remux.chapterPolicy;
  if (remux.attachmentPolicy !== 'drop') output.attachmentPolicy = remux.attachmentPolicy;
  if (remux.metadataPolicy !== 'keep') output.metadataPolicy = remux.metadataPolicy;
  return output;
}

function buildTranscodeProfile(transcode = {}) {
  const output = {};
  if (transcode.rateControl !== 'bitrate') output.rateControl = transcode.rateControl;
  if (transcode.speedPreset !== 'medium') output.speedPreset = transcode.speedPreset;
  if (transcode.quality > 0) output.quality = transcode.quality;
  if (transcode.maxVideoBitrateKbps > 0) output.maxVideoBitrate = transcode.maxVideoBitrateKbps * 1000;
  if (transcode.bufferSizeKbps > 0) output.bufferSize = transcode.bufferSizeKbps * 1000;
  if (transcode.preventUpscale) output.preventUpscale = true;
  if (transcode.latencyMode !== 'auto') output.latencyMode = transcode.latencyMode;
  if (transcode.tune !== 'none') output.tune = transcode.tune;
  if (transcode.bitDepth > 0) output.bitDepth = transcode.bitDepth;
  if (transcode.colorSpace !== 'auto') output.colorSpace = transcode.colorSpace;
  return output;
}

function buildAdjustmentPlan(operation, settings = {}) {
  return {
    transform: ['transform'].includes(operation) ? normalizeTransformAdjustmentPlan(settings.transform) : {},
    audio: ['audio', 'trim'].includes(operation) ? normalizeAudioAdjustmentPlan(settings.audio, settings.trim) : {},
    subtitles: operation === 'subtitles' ? normalizeSubtitleAdjustmentPlan(settings.subtitles) : {}
  };
}

function normalizeTransformAdjustmentPlan(transform = {}) {
  const output = {};
  if (transform.anchor !== 'center') output.anchor = transform.anchor;
  if (transform.scale > 0 && transform.scale !== 1) output.scale = transform.scale;
  if (transform.x !== 0) output.x = transform.x;
  if (transform.y !== 0) output.y = transform.y;
  if (transform.flipHorizontal) output.flipHorizontal = true;
  if (transform.flipVertical) output.flipVertical = true;
  if (transform.background) output.background = transform.background;
  if (hasColorAdjustmentWork(transform.color)) output.color = transform.color;
  if (hasTransformEffectWork(transform.effects)) output.effects = transform.effects;
  return output;
}

function normalizeAudioAdjustmentPlan(audio = {}, trim = {}) {
  const output = {};
  if (audio.gainDb !== 0) output.gainDb = audio.gainDb;
  if (audio.normalize) {
    output.normalize = true;
    output.normalizeTargetDb = audio.normalizeTargetDb;
  }
  if (audio.limiter) output.limiter = true;
  const fadeIn = Math.max(audio.fadeIn || 0, trim.fadeIn || 0);
  const fadeOut = Math.max(audio.fadeOut || 0, trim.fadeOut || 0);
  if (fadeIn > 0) output.fadeIn = fadeIn;
  if (fadeOut > 0) output.fadeOut = fadeOut;
  if (audio.pan !== 0) output.pan = audio.pan;
  if (audio.highpassHz > 0) output.highpassHz = audio.highpassHz;
  if (audio.lowpassHz > 0) output.lowpassHz = audio.lowpassHz;
  if (audio.compressorThreshold !== 0) output.compressorThreshold = audio.compressorThreshold;
  if (audio.compressorRatio > 0) output.compressorRatio = audio.compressorRatio;
  return output;
}

function normalizeSubtitleAdjustmentPlan(subtitles = {}) {
  const output = {};
  if (!subtitles.importText) return output;
  if (subtitles.sourceFormat !== 'auto') output.sourceFormat = subtitles.sourceFormat;
  if (subtitles.fileName) output.fileName = subtitles.fileName;
  if (subtitles.language) output.language = subtitles.language;
  if (subtitles.offset !== 0) output.offset = subtitles.offset;
  if (subtitles.fontSize > 0) output.fontSize = subtitles.fontSize;
  if (subtitles.color) output.color = subtitles.color;
  if (subtitles.fontFamily) output.fontFamily = subtitles.fontFamily;
  if (subtitles.position !== 'bottom') output.position = subtitles.position;
  if (subtitles.outline > 0) output.outline = subtitles.outline;
  if (subtitles.background) output.background = true;
  if (subtitles.cues.length) output.cues = subtitles.cues;
  return output;
}

function buildHlsPackage(hls = {}) {
  const output = {
    segmentDuration: hls.segmentDuration,
    playlistType: hls.playlistType,
    independentSegments: hls.independentSegments
  };
  if (hls.variantLadder) output.variantLadder = hls.variantLadder;
  if (hls.iframePlaylist) output.iframePlaylist = true;
  if (hls.audioRenditions) output.audioRenditions = true;
  if (hls.captionRendition) output.captionRendition = true;
  return output;
}

function applySimpleTrackDrop(conversion, source, targetContainer) {
  const videoTracks = source.tracks.filter((track) => track.kind === 'video');
  const audioTracks = source.tracks.filter((track) => track.kind === 'audio');
  if (videoTracks.length && videoTracks.every((track) => !canContainerCarryTrack(targetContainer, track))) {
    conversion.video.discard = true;
  }
  if (audioTracks.length && audioTracks.every((track) => !canContainerCarryTrack(targetContainer, track))) {
    conversion.audio.discard = true;
  }
}

function applyHlsPackagingOptions(conversion, source) {
  const videoTracks = source.tracks.filter((track) => track.kind === 'video');
  const audioTracks = source.tracks.filter((track) => track.kind === 'audio');
  if (videoTracks.some((track) => !['h264', 'hevc'].includes(normalizeCodec(track.codec)))) {
    conversion.video.codec = 'avc';
    conversion.video.forceTranscode = true;
  }
  if (audioTracks.some((track) => !['aac', 'mp3'].includes(normalizeCodec(track.codec)))) {
    conversion.audio.codec = 'aac';
    conversion.audio.forceTranscode = true;
  }
  conversion.requiresReencode = needsVideoReencode(conversion.video) || needsAudioReencode(conversion.audio);
}

function getWebMediaPlanOutput(operation, targetContainer, outputContainer, options = {}) {
  if (operation === 'inspect') {
    return {
      container: targetContainer,
      label: outputContainer.label,
      extension: 'json',
      mime: 'application/json'
    };
  }
  if (options.hlsPackage) {
    return {
      container: 'hls',
      label: 'HLS package',
      extension: 'zip',
      mime: 'application/zip'
    };
  }
  if (options.subtitlePackage) {
    return {
      container: targetContainer,
      label: 'Subtitle package',
      extension: 'zip',
      mime: 'application/zip'
    };
  }
  return {
    container: targetContainer,
    label: outputContainer.label,
    extension: outputContainer.extension,
    mime: outputContainer.mime
  };
}

function buildVideoOptions(input = {}) {
  const output = {};
  const codec = toMediabunnyVideoCodec(input.videoCodec);
  if (input.discardVideo) output.discard = true;
  if (codec) output.codec = codec;
  if (input.videoBitrateKbps > 0) output.bitrate = input.videoBitrateKbps * 1000;
  if (input.width > 0) output.width = input.width;
  if (input.height > 0) output.height = input.height;
  if (input.width > 0 && input.height > 0) output.fit = input.fit;
  if (input.frameRate > 0) output.frameRate = input.frameRate;
  if (input.keyFrameInterval > 0) output.keyFrameInterval = input.keyFrameInterval;
  if (input.hardwareAcceleration) output.hardwareAcceleration = input.hardwareAcceleration;
  if (input.alpha) output.alpha = input.alpha;
  if (input.forceVideo || codec || input.videoBitrateKbps > 0) output.forceTranscode = true;
  return output;
}

function buildTransformOptions(input = {}) {
  const output = {};
  if (input.width > 0) output.width = input.width;
  if (input.height > 0) output.height = input.height;
  if (input.width > 0 && input.height > 0) output.fit = input.fit;
  if (input.rotate) output.rotate = input.rotate;
  if (input.allowRotationMetadata === false) output.allowRotationMetadata = false;
  if (input.crop) output.crop = input.crop;
  if (input.frameRate > 0) output.frameRate = input.frameRate;
  if (Object.keys(output).length) output.forceTranscode = true;
  return output;
}

function buildAudioOptions(input = {}) {
  const output = {};
  const codec = toMediabunnyAudioCodec(input.audioCodec);
  if (input.discardAudio) output.discard = true;
  if (codec) output.codec = codec;
  if (input.audioBitrateKbps > 0) output.bitrate = input.audioBitrateKbps * 1000;
  if (input.sampleRate > 0) output.sampleRate = input.sampleRate;
  if (input.channels > 0) output.numberOfChannels = input.channels;
  if (input.sampleFormat) output.sampleFormat = input.sampleFormat;
  if (input.forceAudio || codec || input.audioBitrateKbps > 0 || input.sampleRate > 0 || input.channels > 0 || input.sampleFormat) output.forceTranscode = true;
  return output;
}

function getPlannedOutputTracks(source, conversion) {
  return source.tracks
    .filter((track) => {
      if (track.kind === 'video') return conversion.video.discard !== true;
      if (track.kind === 'audio') return conversion.audio.discard !== true;
      if (track.kind === 'subtitle') return true;
      return false;
    })
    .map((track) => {
      if (track.kind === 'video' && conversion.video.codec) return { ...track, codec: normalizeCodec(conversion.video.codec) };
      if (track.kind === 'audio' && conversion.audio.codec) return { ...track, codec: normalizeCodec(conversion.audio.codec) };
      return track;
    });
}

function pruneConversionPlan(conversion) {
  return {
    tracks: conversion.tracks,
    ...(Object.keys(conversion.video).length ? { video: conversion.video } : {}),
    ...(Object.keys(conversion.audio).length ? { audio: conversion.audio } : {}),
    ...(Object.keys(conversion.trim).length ? { trim: conversion.trim } : {}),
    ...(Object.keys(conversion.mux).length ? { mux: conversion.mux } : {}),
    ...(Object.keys(conversion.profile).length ? { profile: conversion.profile } : {}),
    ...(hasAdjustmentPlan(conversion.adjustments) ? { adjustments: conversion.adjustments } : {}),
    ...(Object.keys(conversion.package).length ? { package: conversion.package } : {}),
    ...(Object.keys(conversion.tags).length ? { tags: conversion.tags } : {})
  };
}

function needsVideoReencode(video = {}) {
  return Boolean(video.codec || video.bitrate || video.width || video.height || video.rotate || video.crop || video.frameRate || video.keyFrameInterval || video.forceTranscode || video.allowRotationMetadata === false);
}

function needsAudioReencode(audio = {}) {
  return Boolean(audio.codec || audio.bitrate || audio.sampleRate || audio.numberOfChannels || audio.sampleFormat || audio.forceTranscode);
}

function hasAdjustmentPlan(adjustments = {}) {
  return Boolean(
    Object.keys(adjustments.transform || {}).length ||
    Object.keys(adjustments.audio || {}).length ||
    Object.keys(adjustments.subtitles || {}).length
  );
}

function hasFrameAdjustmentWork(transform = {}) {
  return Object.keys(transform || {}).length > 0;
}

function hasAudioAdjustmentWork(audio = {}) {
  return Object.keys(audio || {}).length > 0;
}

function normalizeColorAdjustments(color = {}) {
  return {
    exposure: clampNumber(color.exposure, -5, 5),
    contrast: clampNumber(color.contrast, -100, 100),
    saturation: clampNumber(color.saturation, -100, 100),
    temperature: clampNumber(color.temperature, -100, 100),
    tint: clampNumber(color.tint, -100, 100),
    gamma: clampNumber(color.gamma, 0, 5)
  };
}

function normalizeTransformEffects(effects = {}) {
  return {
    sharpen: clampNumber(effects.sharpen, 0, 100),
    denoise: clampNumber(effects.denoise, 0, 100),
    grain: clampNumber(effects.grain, 0, 100),
    blur: clampNumber(effects.blur, 0, 100)
  };
}

function hasColorAdjustmentWork(color = {}) {
  return ['exposure', 'contrast', 'saturation', 'temperature', 'tint', 'gamma']
    .some((key) => Number(color[key] || 0) !== 0);
}

function hasTransformEffectWork(effects = {}) {
  return ['sharpen', 'denoise', 'grain', 'blur']
    .some((key) => Number(effects[key] || 0) !== 0);
}

function hasTrackKind(source, kind) {
  return source.tracks.some((track) => track.kind === kind);
}

function normalizeCodecChoice(value) {
  const codec = normalizeCodec(value);
  return codec === 'unknown' ? 'copy' : codec;
}

function toMediabunnyVideoCodec(value) {
  const codec = normalizeCodec(value);
  if (codec === 'copy' || codec === 'unknown') return '';
  if (codec === 'h264') return 'avc';
  if (['hevc', 'vp8', 'vp9', 'av1'].includes(codec)) return codec;
  return '';
}

function toMediabunnyAudioCodec(value) {
  const codec = normalizeCodec(value);
  if (codec === 'copy' || codec === 'unknown') return '';
  if (codec === 'pcm') return 'pcm-s16';
  if (['aac', 'opus', 'mp3', 'vorbis', 'flac'].includes(codec)) return codec;
  return '';
}

function normalizeCrop(crop = {}) {
  const x = Math.max(0, Math.round(Number(crop.x || 0)));
  const y = Math.max(0, Math.round(Number(crop.y || 0)));
  const width = positiveInteger(crop.width);
  const height = positiveInteger(crop.height);
  return width > 0 && height > 0 ? { x, y, width, height } : null;
}

function normalizeRotation(value) {
  const rotation = Math.round(Number(value || 0));
  return ROTATION_VALUES.has(rotation) ? rotation : 0;
}

function normalizeColorValue(value) {
  const color = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : '';
}

function positiveInteger(value) {
  const number = Math.round(Number(value || 0));
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function positiveNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function numberOrZero(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function signedNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function clampInteger(value, min, max) {
  return Math.round(clampNumber(value, min, max));
}

function clampNumber(value, min, max) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return 0;
  return Math.min(max, Math.max(min, number));
}

function sanitizeMetadataTags(tags = {}) {
  if (!tags || typeof tags !== 'object') return {};
  return Object.fromEntries(
    Object.entries(tags)
      .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
      .map(([key, value]) => [key, String(value)])
  );
}

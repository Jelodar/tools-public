import { setupDragAndDrop } from '../ui/drag-drop.js';
import { downloadFile } from '../ui/ui-utils.js';
import { runFFmpegJob } from '../core/ffmpeg-service.js';
import { analyzeWaveform } from '../core/media-visualization-service.js';
import { createJobProgress } from '../ui/job-progress.js';
import { createMediaTrimmer } from '../ui/media-trimmer.js';
import { createMixerComponent } from '../ui/mixer-components.js';
import { createContextMenu } from '../ui/context-menu.js';
import { createPropertyGrid } from '../ui/property-grid.js';
import { renderToggleSwitch } from '../ui/form-controls.js';
import { bindMediaControls, setMediaPlaybackState } from '../utils/media-session.js';
import { createDebouncedFunction } from '../utils/timing.js';
import { fitRectToAspect, getOrientedMediaDimensions } from '../utils/media-geometry.js';
import {
  getAnchoredMixerScrollLeft,
  formatMixerTime,
  getMixerDropPlacement,
  getMixerTimelineDuration,
  getMixerZoomToFit
} from '../utils/audio-mixer.js';
import {
  applyMediaCommandOverride,
  applyMediaCommandSequenceDraft,
  buildMediaCompositionPlan,
  buildMediaMixerPlan,
  buildMediaNormalizedStitchPlan,
  buildMediaRenderPlan,
  buildMediaSequentialChainPlan,
  describeMediaRenderPlan,
  flattenMediaMixerTracks,
  getFramePreviewSubtitleCues,
  getMediaCompositionClipDuration,
  getMediaCompositionClipEnd,
  getMediaCompositionClipStart,
  getMediaCompositionGeometry,
  getMediaFfmpegCommandOutputName,
  getSubtitleCueSpan,
  normalizeCropRect,
  normalizeSubtitleCueText,
  parseSrtSubtitles,
  serializeSrtSubtitles,
  shiftSubtitleCues,
  getVideoExportProfile,
  shouldUseSequentialChain
} from '../utils/video-studio.js';
import {
  addMixerAsset,
  addMixerTrack as addMixerTrackState,
  appendMixerLane,
  clearMixerLaneTracks,
  createMixerCompositionSnapshot,
  createMixerState,
  duplicateMixerLane,
  duplicateMixerTrack as duplicateMixerTrackState,
  getMixerActiveClipsAtTime,
  moveMixerTrack,
  moveMixerTrackToNewLane,
  removeMixerLane as removeMixerLaneState,
  removeMixerTrack as removeMixerTrackState,
  removeMixerTracks as removeMixerTracksState,
  renameMixerAsset,
  renameMixerAssetReferences,
  renameMixerLane,
  selectMixerLane,
  selectMixerTrack,
  selectMixerTracks,
  sequenceMixerTracks,
  setMixerLaneVolume,
  setMixerTrackFadeStyle,
  setMixerTrackVolume,
  splitMixerTrack as splitMixerTrackState,
  toggleMixerLaneMute,
  toggleMixerLaneSolo,
  toggleMixerTrackMute,
  toggleMixerTrackSolo,
  trimMixerTrackEnd,
  trimMixerTrackStart
} from '../core/mixer-session.js';
import { captureVideoFrameStrip } from '../utils/media-visualization.js';

let container = null;
let activeFile = null;
let srtFile = null;
let videoDuration = 0;
let videoWidth = 0;
let videoHeight = 0;
let cleanup = [];
let stopCropTracking = null;
let progressController = null;
let trimmer = null;
let mixerController = null;
let mixerInspectorGrid = null;
let videoStudioContextMenu = null;
let previewObjectUrl = null;
let framePreviewUrl = null;
let activeFramePreviewController = null;
let autoFramePreviewDebounce = null;
let framePreviewValid = false;
let manualCommandText = '';
let manualCommandActive = false;
let commandEditorDirty = false;
let manualMixerCommandText = '';
let manualMixerCommandActive = false;
let mixerCommandEditorDirty = false;
let mixerCommandSequenceDraft = [];
let mixerCommandSequenceActive = false;
let mixerCommandSequenceDirty = false;
let mixerCommandSequenceSignature = '';
let activeCommandStepIndex = null;
let mediaControlsCleanup = null;
let nextAssetIndex = 1;
let nextClipIndex = 1;
let selectedLibraryAssetId = null;
let libraryLaneOverride = false;
let libraryCreateLaneOnAdd = false;
let editingTrackId = null;
let editingAssetId = null;
let editingSubtitleTrackId = null;
let mixerState = createVideoMixerState();
let subtitleCues = [];
let trimmerVisualToken = 0;
let startVal = 0;
let endVal = 0;
let studioTimelineScale = 100;
let mixerZoomFollowsFit = true;
let studioCurrentPos = 0;
let studioCursorVisible = false;
let isStudioPlaying = false;
let mixerLoopPlayback = true;
let activePreviewSurface = 'mixer';
let mixerPreviewFrameId = 0;
let mixerPreviewStartedAt = 0;
let mixerPreviewStartTime = 0;
let solidColorEditTrackId = null;
let mixerPreviewUrls = new Map();
let editorVolumeEnvelope = [];
let activeEditorVolumePointIndex = null;
let sourceCropRect = null;

const DEFAULT_SUBTITLE_STYLE = {
  color: '#ffdc00',
  fontFamily: 'Arial',
  fontSize: 20,
  outline: 1
};

let globalSubtitleStyle = { ...DEFAULT_SUBTITLE_STYLE };

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createVideoMixerState() {
  return createMixerState({
    laneCount: 4,
    lanes: [
      { name: 'Video', kind: 'video', visible: true, opacity: 1, volume: 1 },
      { name: 'Overlay', kind: 'overlay', visible: true, opacity: 1, volume: 1 },
      { name: 'Subtitles', kind: 'subtitle', visible: true, opacity: 1, volume: 1 },
      { name: 'Audio', kind: 'audio', visible: true, opacity: 1, volume: 1 }
    ],
    tracks: [],
    assets: [],
    selectedLaneIndex: 0,
    selectedTrackId: null,
    selectedTrackIds: []
  });
}

function revokeMediaPreviewUrl() {
  if (!previewObjectUrl) return;
  URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = null;
}

function revokeFramePreviewUrl() {
  if (!framePreviewUrl) return;
  URL.revokeObjectURL(framePreviewUrl);
  framePreviewUrl = null;
}

function revokeMixerPreviewUrls() {
  mixerPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  mixerPreviewUrls.clear();
}

function clearFramePreview({ revoke = true } = {}) {
  if (revoke) revokeFramePreviewUrl();
  framePreviewValid = false;
  const framePreview = container?.querySelector('#media-frame-preview');
  const cropBox = container?.querySelector('#crop-box');
  if (framePreview) {
    if (revoke) framePreview.removeAttribute('src');
    framePreview.classList.add('hidden');
  }
  cropBox?.classList.remove('has-frame-preview', 'is-frame-preview-stale');
}

function markFramePreviewStale({ schedule = true } = {}) {
  framePreviewValid = false;
  const framePreview = container?.querySelector('#media-frame-preview');
  const cropBox = container?.querySelector('#crop-box');
  if (!framePreviewUrl || !framePreview || !cropBox) {
    clearFramePreview();
    return;
  }
  framePreview.classList.remove('hidden');
  cropBox.classList.add('has-frame-preview', 'is-frame-preview-stale');
  if (schedule) setRenderStatus('Generating new frame preview...', 'neutral', 'Keeping previous frame until replacement is ready.');
}

function abortActiveFramePreview() {
  activeFramePreviewController?.abort?.();
  activeFramePreviewController = null;
  const button = container?.querySelector('#btn-editor-frame-preview');
  if (button) button.disabled = false;
}

function invalidateFramePreview({ schedule = true } = {}) {
  abortActiveFramePreview();
  if (!framePreviewValid && !framePreviewUrl) {
    if (schedule) scheduleAutoFramePreview();
    return;
  }
  markFramePreviewStale({ schedule });
  if (schedule) scheduleAutoFramePreview();
}

function isAudioFile(file) {
  return String(file?.type || '').startsWith('audio/');
}

function isImageFile(file) {
  return String(file?.type || '').startsWith('image/');
}

function isSubtitleFile(file) {
  const name = String(file?.name || '').toLowerCase();
  const type = String(file?.type || '').toLowerCase();
  return name.endsWith('.srt') || type.includes('subrip') || type.includes('srt');
}

function sanitizeNumber(value, fallback, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function getTimelineCanvasSize() {
  return {
    width: sanitizeNumber(container?.querySelector('#timeline-width')?.value, 1280, 2),
    height: sanitizeNumber(container?.querySelector('#timeline-height')?.value, 720, 2)
  };
}

function normalizeMixerClipCanvasGeometry(clip = {}) {
  const kind = String(clip.kind || '').toLowerCase();
  if (kind === 'audio' || kind === 'subtitle' || clip.canvasFit !== true) return clip;
  const canvasSize = getTimelineCanvasSize();
  return {
    ...clip,
    x: 0,
    y: 0,
    width: canvasSize.width,
    height: canvasSize.height,
    canvasWidth: canvasSize.width,
    canvasHeight: canvasSize.height
  };
}

function normalizeSubtitleStyle(style = {}, fallback = DEFAULT_SUBTITLE_STYLE) {
  const source = style && typeof style === 'object' ? style : {};
  const base = fallback && typeof fallback === 'object' ? fallback : DEFAULT_SUBTITLE_STYLE;
  const color = String(source.color || base.color || DEFAULT_SUBTITLE_STYLE.color);
  return {
    color: /^#[0-9a-f]{6}$/i.test(color) ? color : DEFAULT_SUBTITLE_STYLE.color,
    fontFamily: String(source.fontFamily || source.font || base.fontFamily || DEFAULT_SUBTITLE_STYLE.fontFamily).replace(/,/g, ' ').trim() || DEFAULT_SUBTITLE_STYLE.fontFamily,
    fontSize: sanitizeNumber(source.fontSize ?? source.size ?? base.fontSize, DEFAULT_SUBTITLE_STYLE.fontSize, 8, 160),
    outline: sanitizeNumber(source.outline ?? base.outline, DEFAULT_SUBTITLE_STYLE.outline, 0, 12)
  };
}

function getGlobalSubtitleStyle() {
  globalSubtitleStyle = normalizeSubtitleStyle(globalSubtitleStyle);
  return { ...globalSubtitleStyle };
}

function getSubtitleStyleControls() {
  return {
    color: container?.querySelector('#sub-color'),
    fontFamily: container?.querySelector('#sub-font'),
    fontSize: container?.querySelector('#sub-size'),
    outline: container?.querySelector('#sub-outline')
  };
}

function getSubtitleStyleFromControls() {
  const controls = getSubtitleStyleControls();
  return normalizeSubtitleStyle({
    color: controls.color?.value,
    fontFamily: controls.fontFamily?.value,
    fontSize: controls.fontSize?.value,
    outline: controls.outline?.value
  }, getSubtitleEditorStyle());
}

function applySubtitleStyleToControls(style) {
  const nextStyle = normalizeSubtitleStyle(style);
  const controls = getSubtitleStyleControls();
  if (controls.color) controls.color.value = nextStyle.color;
  if (controls.fontFamily) controls.fontFamily.value = nextStyle.fontFamily;
  if (controls.fontSize) controls.fontSize.value = String(nextStyle.fontSize);
  if (controls.outline) controls.outline.value = String(nextStyle.outline);
}

function setControlValue(id, value) {
  const input = container?.querySelector(`#${id}`);
  if (!input || value === undefined || value === null) return;
  if (input.type === 'checkbox') input.checked = Boolean(value);
  else input.value = String(value);
  syncClipEditorControlChrome(input);
}

function getEditorFilmGrainOptions() {
  const preset = container.querySelector('#fx-grain-preset')?.value || 'off';
  const strength = sanitizeNumber(container.querySelector('#fx-grain')?.value, 0, 0, 100);
  const effectivePreset = preset === 'off' && strength > 0 ? 'custom' : preset;
  return {
    preset: strength > 0 || effectivePreset === 'av1-synthesis' ? effectivePreset : 'off',
    strength,
    mode: container.querySelector('#fx-grain-mode')?.value || 'all',
    lumaStrength: sanitizeNumber(container.querySelector('#fx-grain-luma')?.value, strength, 0, 100),
    chromaStrength: sanitizeNumber(container.querySelector('#fx-grain-chroma')?.value, strength, 0, 100),
    distribution: container.querySelector('#fx-grain-distribution')?.value || 'gaussian',
    temporal: Boolean(container.querySelector('#fx-grain-temporal')?.checked),
    pattern: Boolean(container.querySelector('#fx-grain-pattern')?.checked),
    averaged: Boolean(container.querySelector('#fx-grain-averaged')?.checked),
    grayscale: Boolean(container.querySelector('#fx-grain-grayscale')?.checked),
    blur: sanitizeNumber(container.querySelector('#fx-grain-blur')?.value, 0, 0, 6),
    av1Denoise: Boolean(container.querySelector('#fx-grain-av1-denoise')?.checked)
  };
}

function applyFilmGrainPresetControls(preset) {
  const presets = {
    off: { strength: 0, mode: 'all', lumaStrength: 0, chromaStrength: 0, distribution: 'gaussian', temporal: true, pattern: false, averaged: false, grayscale: false, blur: 0, av1Denoise: false },
    'standard-film': { strength: 12, mode: 'all', lumaStrength: 12, chromaStrength: 12, distribution: 'gaussian', temporal: true, pattern: false, averaged: false, grayscale: false, blur: 0, av1Denoise: false },
    'gritty-bw': { strength: 7, mode: 'luma', lumaStrength: 7, chromaStrength: 0, distribution: 'gaussian', temporal: true, pattern: false, averaged: false, grayscale: true, blur: 1.2, av1Denoise: false },
    'digital-iso': { strength: 20, mode: 'all', lumaStrength: 20, chromaStrength: 20, distribution: 'uniform', temporal: true, pattern: false, averaged: false, grayscale: false, blur: 0, av1Denoise: false },
    'av1-synthesis': { strength: 20, mode: 'all', lumaStrength: 0, chromaStrength: 0, distribution: 'gaussian', temporal: true, pattern: false, averaged: false, grayscale: false, blur: 0, av1Denoise: false }
  };
  const values = presets[preset];
  if (!values) return;
  setControlValue('fx-grain', values.strength);
  setControlValue('fx-grain-mode', values.mode);
  setControlValue('fx-grain-luma', values.lumaStrength);
  setControlValue('fx-grain-chroma', values.chromaStrength);
  setControlValue('fx-grain-distribution', values.distribution);
  setControlValue('fx-grain-temporal', values.temporal);
  setControlValue('fx-grain-pattern', values.pattern);
  setControlValue('fx-grain-averaged', values.averaged);
  setControlValue('fx-grain-grayscale', values.grayscale);
  setControlValue('fx-grain-blur', values.blur);
  setControlValue('fx-grain-av1-denoise', values.av1Denoise);
}

function applyClipMetaToEditor(meta = {}) {
  setControlValue('fx-bright', meta.brightness ?? 0);
  setControlValue('fx-contrast', meta.contrast ?? 1);
  setControlValue('fx-sat', meta.saturation ?? 1);
  setControlValue('fx-gamma', meta.gamma ?? 1);
  setControlValue('fx-sharpen', meta.sharpen ?? 0);
  setControlValue('fx-denoise', meta.denoise ?? 0);
  setControlValue('clip-orientation', meta.rotate ?? 0);
  setControlValue('clip-speed', meta.speed ?? 1);
  setControlValue('master-vol', Math.round((Number(meta.volume) || 1) * 100));
  const grain = meta.filmGrain || {};
  setControlValue('fx-grain-preset', grain.preset ?? (Number(meta.noise) > 0 ? 'custom' : 'off'));
  setControlValue('fx-grain', grain.strength ?? meta.noise ?? 0);
  setControlValue('fx-grain-mode', grain.mode ?? 'all');
  setControlValue('fx-grain-luma', grain.lumaStrength ?? grain.strength ?? meta.noise ?? 0);
  setControlValue('fx-grain-chroma', grain.chromaStrength ?? grain.strength ?? meta.noise ?? 0);
  setControlValue('fx-grain-distribution', grain.distribution ?? 'gaussian');
  setControlValue('fx-grain-temporal', grain.temporal ?? true);
  setControlValue('fx-grain-pattern', grain.pattern ?? false);
  setControlValue('fx-grain-averaged', grain.averaged ?? false);
  setControlValue('fx-grain-grayscale', grain.grayscale ?? false);
  setControlValue('fx-grain-blur', grain.blur ?? 0);
  setControlValue('fx-grain-av1-denoise', grain.av1Denoise ?? false);
}

function makeAssetFromFile(file) {
  const kind = isSubtitleFile(file) ? 'subtitle' : isAudioFile(file) ? 'audio' : isImageFile(file) ? 'image' : 'video';
  const asset = {
    id: `asset-${nextAssetIndex}`,
    file,
    name: file.name || `${kind}-${nextAssetIndex}`,
    kind,
    size: file.size || 0
  };
  nextAssetIndex += 1;
  return asset;
}

function getClipKindForAsset(asset) {
  if (asset.kind === 'subtitle') return 'subtitle';
  if (asset.kind === 'audio') return 'audio';
  if (asset.kind === 'image') return 'image';
  return 'video';
}

function getLaneKindForAsset(asset) {
  const kind = getClipKindForAsset(asset);
  if (kind === 'audio' || kind === 'subtitle') return kind;
  if (kind === 'image' || kind === 'text') return 'overlay';
  return 'video';
}

function getTrackForKind(kind) {
  const targetKind = kind === 'audio' ? 'audio' : kind === 'subtitle' ? 'subtitle' : kind === 'image' || kind === 'text' ? 'overlay' : 'video';
  const index = mixerState.lanes.findIndex((lane) => lane.kind === targetKind);
  return index >= 0 ? index : 0;
}

function isSubtitleTrack(track = {}) {
  return String(track.kind || track.mixerMeta?.kind || '').toLowerCase() === 'subtitle';
}

function getMixerDuration() {
  const contentTracks = mixerState.tracks.filter((track) => !isSubtitleTrack(track));
  if (!mixerState.tracks.length && subtitleCues.length) return Math.max(1, getSubtitleCueDuration(subtitleCues));
  return Math.max(1, getMixerTimelineDuration(contentTracks.length ? contentTracks : mixerState.tracks));
}

function getMixerRenderDurationFromTracks(tracks = []) {
  const clips = tracks.flatMap((track) => (
    (Array.isArray(track.clips) ? track.clips : []).map((clip) => ({
      ...clip,
      kind: clip.kind || track.kind
    }))
  ));
  const contentClips = clips.filter((clip) => String(clip.kind || '').toLowerCase() !== 'subtitle');
  const timelineClips = contentClips.length ? contentClips : clips;
  return Math.max(0.1, ...timelineClips.map((clip) => (Math.max(0, Number(clip.start) || 0) + Math.max(0.1, Number(clip.duration) || 0.1))));
}

function getSubtitleCueDuration(cues = []) {
  return Math.max(0.1, ...cues.map((cue) => Math.max(0, Number(cue.end) || 0)));
}

function getSubtitleTrackTiming(cues = [], origin = null) {
  const span = getSubtitleCueSpan(cues);
  const cueOrigin = Number.isFinite(Number(origin)) ? Math.max(0, Number(origin)) : span.start;
  return {
    origin: cueOrigin,
    duration: Math.max(0.1, span.end ? span.end - cueOrigin : span.duration || 0.1)
  };
}

function shiftSubtitleCuesForTrack(track = {}) {
  const meta = track.mixerMeta || {};
  const cues = Array.isArray(meta.cues) ? meta.cues : [];
  if (!cues.length) return [];
  const offset = Math.max(0, Number(track.offset) || 0);
  const timing = getSubtitleTrackTiming(cues, meta.subtitleCueOrigin);
  const trimStart = Math.max(0, Number(track.trimStart) || 0);
  const clipDuration = Math.max(0.1, (Number(track.trimEnd) || 0) - trimStart);
  const clipEnd = offset + clipDuration;
  const style = normalizeSubtitleStyle(meta.subtitleStyle, getGlobalSubtitleStyle());
  return cues.map((cue) => {
    const start = offset + Math.max(0, (Number(cue.start) || 0) - timing.origin - trimStart);
    const end = offset + Math.max(0.1, (Number(cue.end) || 0) - timing.origin - trimStart);
    return {
      ...cue,
      start,
      end: Math.min(clipEnd, Math.max(start + 0.1, end)),
      style
    };
  }).filter((cue) => cue.start < clipEnd && cue.end > offset);
}

function getMixerSubtitleCues() {
  return mixerState.tracks
    .filter((track) => (track.kind || track.mixerMeta?.kind) === 'subtitle' && track.visible !== false && !track.hidden && !track.disabled)
    .flatMap(shiftSubtitleCuesForTrack);
}

function getPreviewSubtitleCues() {
  return activePreviewSurface === 'mixer'
    ? [...subtitleCues.map((cue) => ({ ...cue, style: getGlobalSubtitleStyle() })), ...getMixerSubtitleCues()]
    : subtitleCues.map((cue) => ({ ...cue, style: getGlobalSubtitleStyle() }));
}

function getSelectedClip() {
  return mixerState.tracks.find((track) => track.id === mixerState.selectedTrackId) || null;
}

function getSelectedTrackIds() {
  const ids = Array.isArray(mixerState.selectedTrackIds) ? mixerState.selectedTrackIds.filter(Boolean) : [];
  if (!ids.length && mixerState.selectedTrackId) ids.push(mixerState.selectedTrackId);
  return ids.filter((id, index) => ids.indexOf(id) === index && mixerState.tracks.some((track) => track.id === id));
}

function getSelectedTracks() {
  const selectedIds = new Set(getSelectedTrackIds());
  return mixerState.tracks.filter((track) => selectedIds.has(track.id));
}

function getClipPlaybackDuration(track = {}) {
  const trimStart = Math.max(0, Number(track.trimStart) || 0);
  const trimEnd = Math.max(trimStart, Number(track.trimEnd) || trimStart);
  const speed = sanitizeNumber(track.mixerMeta?.speed ?? track.speed, 1, 0.25, 4);
  return Math.max(0.1, (trimEnd - trimStart) / speed);
}

function getTimelineSettings() {
  const outputFormat = container.querySelector('#timeline-output-format').value;
  const metadataTitle = String(container.querySelector('#master-metadata-title')?.value || '').trim();
  return {
    width: container.querySelector('#timeline-width').value,
    height: container.querySelector('#timeline-height').value,
    fps: container.querySelector('#timeline-fps').value,
    crossfadeDuration: container.querySelector('#timeline-crossfade').value,
    outputFormat,
    qualityProfile: container.querySelector('#timeline-quality-profile')?.value || '',
    scaleQuality: container.querySelector('#timeline-scale-quality')?.value || '',
    encoder: container.querySelector('#master-encoder')?.value || '',
    preset: container.querySelector('#master-preset').value,
    crf: container.querySelector('#master-crf')?.value || 18,
    tune: container.querySelector('#master-tune')?.value || 'none',
    audioBitrate: container.querySelector('#master-audio-bitrate')?.value || '',
    rateControl: container.querySelector('#master-rate-control')?.value || '',
    videoBitrate: container.querySelector('#master-video-bitrate')?.value || '',
    maxrate: container.querySelector('#master-maxrate')?.value || '',
    bufsize: container.querySelector('#master-bufsize')?.value || '',
    gopSize: container.querySelector('#master-gop')?.value || '',
    profile: container.querySelector('#master-video-profile')?.value || '',
    level: container.querySelector('#master-video-level')?.value || '',
    pixelFormat: container.querySelector('#master-pixel-format')?.value || 'yuv420p',
    threads: container.querySelector('#master-threads')?.value || '',
    frameRateMode: container.querySelector('#master-frame-mode')?.value || '',
    audioCodec: container.querySelector('#master-audio-codec')?.value || '',
    audioQuality: container.querySelector('#master-audio-quality')?.value || '',
    sampleRate: container.querySelector('#master-audio-sample-rate')?.value || 48000,
    channels: container.querySelector('#master-audio-channels')?.value || 2,
    audioSampleFormat: container.querySelector('#master-audio-sample-format')?.value || '',
    faststart: outputFormat === 'mp4' && (container.querySelector('#master-faststart')?.checked ?? true),
    shortest: Boolean(container.querySelector('#master-shortest')?.checked),
    metadata: metadataTitle ? { title: metadataTitle } : null,
    backgroundColor: container.querySelector('#timeline-background-color').value
  };
}

function applyTimelineExportProfile(profileId) {
  if (!profileId || profileId === 'custom') {
    updateMixerPlanPreview();
    return;
  }
  const profile = getVideoExportProfile(profileId);
  container.querySelector('#timeline-width').value = String(profile.width);
  container.querySelector('#timeline-height').value = String(profile.height);
  container.querySelector('#timeline-fps').value = String(profile.fps);
  container.querySelector('#timeline-output-format').value = profile.outputFormat;
  syncPreviewViewportAspect();
  updateMixerPlanPreview();
}

function getOutputBaseName(isAudioOnly) {
  return `media_source_${Date.now()}.${isAudioOnly ? 'm4a' : 'mp4'}`;
}

function getScaleOptions() {
  const scaleWidth = container.querySelector('#media-scale').value;
  const mode = container.querySelector('#media-scale-mode').value;
  const width = mode === 'width' && scaleWidth !== 'copy'
    ? scaleWidth
    : container.querySelector('#media-scale-width').value;
  return {
    scaleWidth,
    scale: {
      mode,
      width,
      height: container.querySelector('#media-scale-height').value
    }
  };
}

function getEditorTransformOptions() {
  return {
    rotate: sanitizeNumber(container?.querySelector('#clip-orientation')?.value, 0),
    speed: sanitizeNumber(container?.querySelector('#clip-speed')?.value, 1, 0.25, 4)
  };
}

function getEditorPreviewTransform() {
  const rotate = ((getEditorTransformOptions().rotate % 360) + 360) % 360;
  return rotate ? `translate(-50%, -50%) rotate(${rotate}deg)` : 'translate(-50%, -50%)';
}

function getEditorSourceDimensions(rotation = getEditorTransformOptions().rotate) {
  return getOrientedMediaDimensions(videoWidth || 1, videoHeight || 1, rotation);
}

function getEditorMediaBounds(viewportRect, rotation = getEditorTransformOptions().rotate) {
  const dimensions = getEditorSourceDimensions(rotation);
  return fitRectToAspect(viewportRect.width, viewportRect.height, dimensions.width / Math.max(1, dimensions.height));
}

function syncEditorPreviewGeometry() {
  const preview = container?.querySelector('#media-preview');
  const viewport = container?.querySelector('#preview-viewport');
  if (!preview || !viewport) return;
  const viewportRect = viewport.getBoundingClientRect();
  const rotation = getEditorTransformOptions().rotate;
  const bounds = getEditorMediaBounds(viewportRect, rotation);
  const dimensions = getEditorSourceDimensions(rotation);
  const elementWidth = dimensions.swapped ? bounds.height : bounds.width;
  const elementHeight = dimensions.swapped ? bounds.width : bounds.height;
  preview.style.left = `${bounds.left + (bounds.width / 2)}px`;
  preview.style.top = `${bounds.top + (bounds.height / 2)}px`;
  preview.style.width = `${elementWidth}px`;
  preview.style.height = `${elementHeight}px`;
  preview.style.transform = getEditorPreviewTransform();
}

function getTimelineFileName(clip) {
  const fallback = clip.kind === 'audio' ? 'audio.wav' : clip.kind === 'image' ? 'image.png' : 'video.mp4';
  const name = String(clip.file?.name || clip.fileName || clip.name || fallback).replace(/[^\w.-]+/g, '_');
  return `clip-${clip.id}-${name}`;
}

async function fileBufferOrEmpty(file, includeBuffers) {
  if (!includeBuffers || !file?.arrayBuffer) return new ArrayBuffer(0);
  return file.arrayBuffer();
}

export async function mount(parent) {
  cleanup = [];
  autoFramePreviewDebounce?.cancel?.();
  autoFramePreviewDebounce = null;
  activeFile = null;
  srtFile = null;
  videoDuration = 0;
  videoWidth = 0;
  videoHeight = 0;
  nextAssetIndex = 1;
  nextClipIndex = 1;
  selectedLibraryAssetId = null;
  editingTrackId = null;
  editingAssetId = null;
  subtitleCues = [];
  globalSubtitleStyle = { ...DEFAULT_SUBTITLE_STYLE };
  manualCommandText = '';
  manualCommandActive = false;
  commandEditorDirty = false;
  manualMixerCommandText = '';
  manualMixerCommandActive = false;
  mixerCommandEditorDirty = false;
  mixerCommandSequenceDraft = [];
  mixerCommandSequenceActive = false;
  mixerCommandSequenceDirty = false;
  mixerCommandSequenceSignature = '';
  activeCommandStepIndex = null;
  studioTimelineScale = 100;
  mixerZoomFollowsFit = true;
  studioCurrentPos = 0;
  studioCursorVisible = false;
  isStudioPlaying = false;
  mixerLoopPlayback = true;
  activePreviewSurface = 'mixer';
  mixerPreviewFrameId = 0;
  mixerPreviewStartedAt = 0;
  mixerPreviewStartTime = 0;
  solidColorEditTrackId = null;
  mixerPreviewUrls = new Map();
  editorVolumeEnvelope = [];
  activeEditorVolumePointIndex = null;
  sourceCropRect = null;
  mixerState = createVideoMixerState();
  container = document.createElement('div');
  container.className = 'tool-media-transcoder tool-sound-studio';
  container.innerHTML = `
    <div class="rj-layout media-transcoder-card video-studio-root">
      <div id="media-ui" class="media-transcoder-ui video-studio-flow">
        <div id="modal-clip-editor" class="studio-modal video-studio-clip-editor-modal video-studio-editor-modal">
          <div class="modal-content">
          <div class="modal-header video-studio-editor-head">
            <div class="video-studio-editor-title">
              <span class="studio-section-title">Clip Editor</span>
              <span id="video-studio-editing-status" class="video-studio-editing-status">New media</span>
            </div>
            <div class="video-studio-editor-head-actions">
              ${renderToggleSwitch({
                id: 'auto-frame-preview',
                label: 'Auto Frame Preview',
                className: 'video-studio-auto-preview',
                rootAttributes: 'data-editor-source-action',
                checked: true
              })}
              <button id="btn-editor-frame-preview" class="sound-studio-mixer-action" type="button" data-editor-source-action>Preview Frame</button>
              <button id="btn-editor-import" class="sound-studio-mixer-action" type="button">Add Media</button>
              <button id="btn-clip-plan" class="sound-studio-mixer-action" type="button" data-editor-source-action>Source Plan</button>
              <button id="btn-clip-editor-close" type="button" class="mini-btn danger sound-studio-modal-close">Close</button>
            </div>
          </div>

          <div class="modal-body video-studio-clip-editor-body">
          <div id="clip-editor-preview-slot" class="video-studio-preview-slot"></div>
          <div class="video-studio-editor-workspace">
          <div id="media-drop-zone" class="media-transcoder-drop-zone video-studio-source-drop">
            <div class="media-transcoder-drop-icon">
              <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"></rect><circle cx="8.5" cy="10" r="1.5"></circle><circle cx="15.5" cy="10" r="1.5"></circle><path d="M7 15h10"></path></svg>
            </div>
            <div class="media-transcoder-drop-title">Drop media source</div>
            <div id="media-file-info" class="media-transcoder-file-info"></div>
            <input type="file" id="media-input" class="hidden" accept="video/*,audio/*,image/*">
          </div>

          <div id="video-studio-editor-section" class="video-studio-editor-section">
            <div class="media-transcoder-trim-shell">
              <div id="trim-host"></div>
            </div>

            <div class="video-studio-editor-panels">
              <details class="video-studio-editor-panel" open id="sec-fx" data-editor-panel="fx">
                <summary>
                  <span class="video-studio-panel-actions">${renderToggleSwitch({
                    id: 'video-panel-enabled',
                    label: 'Visual',
                    checked: true,
                    className: 'video-studio-panel-toggle',
                    inputClassName: 'video-studio-panel-enabled'
                  })}</span>
                  <button class="mini-btn video-studio-panel-reset" type="button">Reset All</button>
                </summary>
                <div class="settings-grid">
                  <div class="form-group"><label>Brightness</label><input type="range" id="fx-bright" min="-1" max="1" step="0.05" value="0"></div>
                  <div class="form-group"><label>Contrast</label><input type="range" id="fx-contrast" min="0" max="2" step="0.05" value="1"></div>
                  <div class="form-group"><label>Saturation</label><input type="range" id="fx-sat" min="0" max="3" step="0.05" value="1"></div>
                  <div class="form-group"><label>Gamma</label><input type="range" id="fx-gamma" min="0.1" max="10" step="0.1" value="1"></div>
                  <div class="form-group"><label>Grain Amount</label><input type="range" id="fx-grain" min="0" max="100" value="0"></div>
                  <div class="form-group">
                    <label>Grain Preset</label>
                    <select id="fx-grain-preset">
                      <option value="off" selected>Off</option>
                      <option value="standard-film">Standard Film</option>
                      <option value="gritty-bw">16mm Mono Grain</option>
                      <option value="digital-iso">Digital ISO</option>
                      <option value="av1-synthesis">AV1 Synthesis</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <details class="video-studio-grain-controls">
                    <summary>Texture Controls</summary>
                    <div class="settings-grid">
                      <div class="form-group">
                        <label>Color Planes</label>
                        <select id="fx-grain-mode">
                          <option value="all" selected>Luma + Chroma</option>
                          <option value="luma">Luma Only</option>
                          <option value="chroma">Chroma Only</option>
                          <option value="custom">Custom Planes</option>
                        </select>
                      </div>
                      <div class="form-group"><label>Luma Grain</label><input type="range" id="fx-grain-luma" min="0" max="100" value="0"></div>
                      <div class="form-group"><label>Chroma Grain</label><input type="range" id="fx-grain-chroma" min="0" max="100" value="0"></div>
                      <div class="form-group">
                        <label>Noise Curve</label>
                        <select id="fx-grain-distribution">
                          <option value="gaussian" selected>Gaussian</option>
                          <option value="uniform">Uniform</option>
                        </select>
                      </div>
                      <div class="form-group video-studio-toggle-row">${renderToggleSwitch({ id: 'fx-grain-temporal', label: 'Frame-varying', checked: true })}</div>
                      <div class="form-group video-studio-toggle-row">${renderToggleSwitch({ id: 'fx-grain-pattern', label: 'Pattern Mix' })}</div>
                      <div class="form-group video-studio-toggle-row">${renderToggleSwitch({ id: 'fx-grain-averaged', label: 'Temporal Smooth' })}</div>
                      <div class="form-group video-studio-toggle-row">${renderToggleSwitch({ id: 'fx-grain-grayscale', label: 'Monochrome Grain' })}</div>
                      <div class="form-group"><label>Pre-blur</label><input type="range" id="fx-grain-blur" min="0" max="6" step="0.1" value="0"></div>
                      <div class="form-group video-studio-toggle-row">${renderToggleSwitch({ id: 'fx-grain-av1-denoise', label: 'AV1 Denoise' })}</div>
                    </div>
                  </details>
                  <div class="form-group"><label>Sharpen</label><input type="range" id="fx-sharpen" min="0" max="2" step="0.05" value="0"></div>
                  <div class="form-group"><label>Denoise</label><input type="range" id="fx-denoise" min="0" max="12" step="0.5" value="0"></div>
                  <div class="form-group">
                    <label>Orientation</label>
                    <select id="clip-orientation">
                      <option value="0" selected>Normal</option>
                      <option value="90">Right 90</option>
                      <option value="180">Upside Down</option>
                      <option value="270">Left 90</option>
                    </select>
                  </div>
                  <div class="form-group"><label>Speed</label><input type="range" id="clip-speed" min="0.25" max="25" step="0.05" value="1"></div>
                </div>
              </details>

              <details class="video-studio-editor-panel" open id="sec-crt" data-editor-panel="crt">
                <summary>
                  <span class="video-studio-panel-actions">${renderToggleSwitch({
                    id: 'scanlines-panel-enabled',
                    label: 'Scanlines',
                    checked: true,
                    className: 'video-studio-panel-toggle',
                    inputClassName: 'video-studio-panel-enabled'
                  })}</span>
                  <button class="mini-btn video-studio-panel-reset" type="button">Reset All</button>
                </summary>
                <div class="settings-grid">
                  <div class="form-group"><label>H-Scan Opacity</label><input type="range" id="crt-h-op" min="0" max="1" step="0.05" value="0"></div>
                  <div class="form-group"><label>H-Scan Distance</label><input type="number" id="crt-h-dist" value="4"></div>
                  <div class="form-group"><label>H-Scan Thickness</label><input type="number" id="crt-h-thick" value="1"></div>
                  <div class="form-group"><label>V-Scan Opacity</label><input type="range" id="crt-v-op" min="0" max="1" step="0.05" value="0"></div>
                  <div class="form-group"><label>V-Scan Distance</label><input type="number" id="crt-v-dist" value="4"></div>
                  <div class="form-group"><label>V-Scan Thickness</label><input type="number" id="crt-v-thick" value="1"></div>
                </div>
              </details>

              <details class="video-studio-editor-panel" open id="sec-dynamics" data-editor-panel="audio">
                <summary>
                  <span class="video-studio-panel-actions">${renderToggleSwitch({
                    id: 'audio-panel-enabled',
                    label: 'Audio',
                    checked: true,
                    className: 'video-studio-panel-toggle',
                    inputClassName: 'video-studio-panel-enabled'
                  })}</span>
                  <button class="mini-btn video-studio-panel-reset" type="button">Reset All</button>
                </summary>
                <div class="settings-grid">
                  <div class="form-group"><label>Volume Boost</label><input type="range" id="master-vol" min="0" max="300" value="100"></div>
                  <div class="form-group"><label>Fade Out Duration</label><input type="number" id="master-fade" value="0" min="0" step="0.5"></div>
                </div>
              </details>
            </div>

            <div class="video-studio-editor-foot">
              <button id="btn-editor-cancel" class="sound-studio-mixer-action hidden" type="button">Discard</button>
              <button id="btn-editor-commit" class="sound-studio-mixer-action sound-studio-mixer-action-export" type="button">Add to Mixer</button>
            </div>
          </div>
          </div>
          </div>
          </div>
        </div>

        <div id="studio-sections" class="media-transcoder-sections video-studio-main-flow">

          <div id="video-studio-mixer" class="studio-section expanded sound-studio-mixer-shell">
            <div class="studio-section-header sound-studio-mixer-header video-studio-mixer-header">
              <div class="video-studio-mixer-headline">
                <div class="sound-studio-mixer-summary">
                  <span class="studio-section-title sound-studio-mixer-title">Mixer</span>
                  <div class="sound-studio-mixer-metrics">
                    <div class="sound-studio-mixer-metric">
                      <span class="sound-studio-mixer-metric-label">Length</span>
                      <strong id="metric-duration" class="sound-studio-mixer-metric-value">00:00</strong>
                    </div>
                    <div class="sound-studio-mixer-metric">
                      <span class="sound-studio-mixer-metric-label">Clips</span>
                      <strong id="metric-tracks" class="sound-studio-mixer-metric-value">0</strong>
                    </div>
                  </div>
                </div>
                <div class="sound-studio-mixer-toolbar-group video-studio-mixer-editor-actions">
                  <button id="btn-open-clip-editor" class="sound-studio-mixer-action" type="button">Clip Editor</button>
                  <button id="btn-subtitle-edit" type="button" class="sound-studio-mixer-action">Subtitles</button>
                </div>
                <div class="video-studio-mixer-primary-actions">
                  <div class="sound-studio-mixer-toolbar-group sound-studio-mixer-toolbar-group-transport">
                    <div class="sound-studio-mixer-transport">
                      <button id="btn-studio-play" class="media-trimmer-playback sound-studio-transport-toggle" type="button">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" data-role="studio-play-icon"><path d="M8 5.14v14l11-7-11-7z"/></svg>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" class="hidden" data-role="studio-pause-icon"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                      </button>
                    </div>
                    ${renderToggleSwitch({
                      id: 'mixer-loop-playback',
                      label: 'Loop',
                      checked: true,
                      className: 'video-studio-mixer-loop'
                    })}
                  </div>
                  <button id="btn-video-settings" class="sound-studio-mixer-action" type="button">Settings</button>
                  <button id="btn-studio-export" class="sound-studio-mixer-action sound-studio-mixer-action-export" type="button">Render</button>
                </div>
              </div>
              <div class="sound-studio-mixer-toolbar video-studio-mixer-commandbar">
                <div class="sound-studio-mixer-toolbar-group video-studio-mixer-zoom-group">
                  <div class="sound-studio-mixer-zoom">
                    <label class="sound-studio-mixer-zoom-label">Zoom</label>
                    <input type="range" id="studio-zoom" class="sound-studio-mixer-zoom-range" min="0.01" max="500" value="100" step="0.01">
                    <button id="btn-studio-zoom-fit" class="mini-btn sound-studio-mixer-fit" type="button">Fit All</button>
                    <button id="btn-studio-zoom-selection" class="mini-btn sound-studio-mixer-fit hidden" type="button">Fit Selected Track</button>
                  </div>
                </div>
                <div class="sound-studio-mixer-toolbar-group video-studio-mixer-media-actions">
                  <button id="btn-studio-add-track" class="sound-studio-mixer-action sound-studio-mixer-action-accent" type="button">Media Library</button>
                  <button id="btn-mixer-import" class="sound-studio-mixer-action" type="button">Import Media</button>
                  <button id="btn-mixer-add-color" class="sound-studio-mixer-action" type="button">Add Solid Color</button>
                </div>
              </div>
              <div id="video-studio-selection-toolbar" class="video-studio-selection-toolbar hidden">
                <span id="video-studio-selection-count">0 selected</span>
                <button id="btn-mixer-properties-selected" class="sound-studio-mixer-action" type="button">Track Properties</button>
                <button id="btn-mixer-delete-selected" class="sound-studio-mixer-action" type="button">Delete</button>
                <button id="btn-mixer-sequence-selected" class="sound-studio-mixer-action" type="button">Sequence</button>
              </div>
              <input id="studio-upload-input" class="hidden" type="file" accept="video/*,audio/*,image/*" multiple>
            </div>
            <div id="video-studio-preview-dock" class="media-transcoder-preview-shell video-studio-preview-dock">
              <div id="mixer-preview-slot" class="video-studio-preview-slot">
                <div class="video-studio-editor-stage video-studio-shared-preview-stage">
                  <div id="preview-viewport" class="media-transcoder-preview-viewport">
                    <video id="media-preview" class="media-transcoder-preview-video"></video>
                    <div id="mixer-preview-stage" class="video-studio-mixer-preview-stage hidden"></div>
                    <div id="subtitle-live-preview" class="media-subtitle-live-preview"></div>
                    <div id="cropper-mask" class="media-transcoder-cropper-mask">
                      <div id="crop-box" class="media-transcoder-crop-box hidden">
                        <img id="media-frame-preview" class="media-frame-preview hidden" alt="">
                        <div class="crop-handle media-transcoder-crop-handle media-transcoder-crop-handle-nw" data-h="nw"></div>
                        <div class="crop-handle media-transcoder-crop-handle media-transcoder-crop-handle-ne" data-h="ne"></div>
                        <div class="crop-handle media-transcoder-crop-handle media-transcoder-crop-handle-sw" data-h="sw"></div>
                        <div class="crop-handle media-transcoder-crop-handle media-transcoder-crop-handle-se" data-h="se"></div>
                        <div class="crop-handle media-transcoder-crop-edge media-transcoder-crop-edge-n" data-h="n"></div>
                        <div class="crop-handle media-transcoder-crop-edge media-transcoder-crop-edge-e" data-h="e"></div>
                        <div class="crop-handle media-transcoder-crop-edge media-transcoder-crop-edge-s" data-h="s"></div>
                        <div class="crop-handle media-transcoder-crop-edge media-transcoder-crop-edge-w" data-h="w"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div id="mixer-host" class="studio-section-content sound-studio-mixer-content"></div>
            <div id="studio-empty-msg" class="studio-empty-state">
              <span>No clips in the mixer.</span>
              <button id="btn-studio-empty-lib" class="btn-secondary studio-empty-state-action" type="button">Open Media Library</button>
            </div>
          </div>
        </div>
        <div id="media-progress-host" class="media-transcoder-progress-host"></div>
      </div>

      <div id="modal-library" class="studio-modal">
        <div class="modal-content">
          <div class="modal-header">
            <div class="sound-studio-modal-title-stack">
              <span class="sound-studio-modal-title">Media Library</span>
              <div class="sound-studio-library-toolbar">
                <span id="library-target-lane" class="studio-library-target">Selected lane: Video</span>
                <select id="library-target-select" class="rj-select sound-studio-library-target-select"></select>
                <span class="studio-library-note">Drag clips to the mixer or add them to the selected lane.</span>
              </div>
            </div>
            <div class="sound-studio-modal-actions">
              <button id="btn-lib-import" type="button" class="btn-secondary sound-studio-modal-button sound-studio-modal-button-compact">Import Media</button>
              <button id="btn-lib-close" type="button" class="mini-btn danger sound-studio-modal-close">Close</button>
            </div>
          </div>
          <div class="modal-body" id="library-list">
            <div id="library-dropzone" class="studio-library-dropzone">Drop media files here to import them into the library</div>
            <div class="studio-library-empty">Your library is empty.</div>
          </div>
        </div>
      </div>

      <div id="modal-video-settings" class="studio-modal video-studio-settings-modal">
        <div class="modal-content">
          <div class="modal-header">
            <div class="sound-studio-modal-title-stack">
              <span id="video-studio-final-output-title" class="sound-studio-modal-title">Settings</span>
              <span id="video-studio-final-output-note" class="studio-library-note">Final output file settings.</span>
            </div>
            <div class="sound-studio-modal-actions">
              <button id="btn-render-confirm" type="button" class="sound-studio-mixer-action sound-studio-mixer-action-export">Render</button>
              <button id="btn-video-settings-close" type="button" class="mini-btn danger sound-studio-modal-close">Close</button>
            </div>
          </div>
          <div id="video-studio-settings-body" class="modal-body video-studio-settings-body">
            <div id="video-studio-settings-summary" class="video-studio-settings-summary">
              <div class="video-studio-settings-summary-item">
                <span>Output</span>
                <strong id="settings-summary-output">1280x720 @ 30 fps</strong>
              </div>
              <div class="video-studio-settings-summary-item">
                <span>Mixer</span>
                <strong id="settings-summary-mixer">0 clips</strong>
              </div>
            </div>
            <div class="video-studio-settings-panel">
              <div class="media-mixer-head"><span>Final Output</span></div>
              <div class="video-studio-settings-cluster">
                <span class="video-studio-settings-cluster-title">Canvas</span>
                <div class="settings-grid">
                  <div class="form-group"><label>Width</label><input id="timeline-width" type="number" min="2" step="2" value="1280"></div>
                  <div class="form-group"><label>Height</label><input id="timeline-height" type="number" min="2" step="2" value="720"></div>
                  <div class="form-group"><label>Background</label><input id="timeline-background-color" type="color" value="#000000"></div>
                  <div class="form-group">
                    <label>Profile</label>
                    <select id="timeline-export-profile">
                      <option value="custom" selected>Custom</option>
                      <option value="social-vertical">Vertical</option>
                      <option value="social-square">Square</option>
                      <option value="master">Master</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="video-studio-settings-cluster">
                <span class="video-studio-settings-cluster-title">Timeline</span>
                <div class="settings-grid">
                  <div class="form-group"><label>FPS</label><input id="timeline-fps" type="number" min="1" max="120" value="30"></div>
                  <div class="form-group">
                    <label>Output</label>
                    <select id="timeline-output-format">
                      <option value="mp4" selected>MP4</option>
                      <option value="webm">WebM</option>
                      <option value="mkv">MKV</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="video-studio-settings-cluster">
                <span class="video-studio-settings-cluster-title">Encoding</span>
                <div class="settings-grid">
                  <div class="form-group">
                    <label>Quality Profile</label>
                    <select id="timeline-quality-profile">
                      <option value="" selected>Custom</option>
                      <option value="preview">Preview</option>
                      <option value="draft">Draft</option>
                      <option value="balanced">Balanced</option>
                      <option value="delivery">Delivery</option>
                      <option value="high">High</option>
                      <option value="archive">Archive</option>
                      <option value="lossless">Lossless</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Encoder</label>
                    <select id="master-encoder">
                      <option value="" selected>Auto</option>
                      <option value="x264">H.264</option>
                      <option value="x265">H.265</option>
                      <option value="vp9">VP9</option>
                      <option value="svt-av1">AV1 SVT</option>
                      <option value="aom-av1">AV1 AOM</option>
                      <option value="mpeg4">MPEG-4</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Encoding Speed</label>
                    <select id="master-preset" class="media-transcoder-preset-select">
                      <option value="veryfast">Very Fast</option>
                      <option value="faster">Faster</option>
                      <option value="fast">Fast</option>
                      <option value="medium">Medium</option>
                      <option value="slow" selected>Slow</option>
                      <option value="slower">Slower</option>
                    </select>
                  </div>
                  <div class="form-group"><label>CRF</label><input id="master-crf" type="number" min="0" max="51" value="18"></div>
                  <div class="form-group">
                    <label>Scale Quality</label>
                    <select id="timeline-scale-quality">
                      <option value="" selected>Auto</option>
                      <option value="draft">Draft</option>
                      <option value="balanced">Balanced</option>
                      <option value="high">High</option>
                      <option value="archive">Archive</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Audio Bitrate</label>
                    <select id="master-audio-bitrate">
                      <option value="" selected>Auto</option>
                      <option value="128k">128k</option>
                      <option value="192k">192k</option>
                      <option value="256k">256k</option>
                      <option value="320k">320k</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Tune</label>
                    <select id="master-tune">
                      <option value="none" selected>None</option>
                      <option value="film">Film</option>
                      <option value="animation">Animation</option>
                      <option value="grain">Grain</option>
                      <option value="stillimage">Still Image</option>
                      <option value="fastdecode">Fast Decode</option>
                      <option value="zerolatency">Zero Latency</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="video-studio-settings-cluster">
                <span class="video-studio-settings-cluster-title">Advanced Output</span>
                <div class="video-studio-settings-subgroup">
                  <span class="video-studio-settings-subgroup-title">Advanced Video</span>
                  <div class="settings-grid video-studio-settings-subgrid">
                    <div class="form-group">
                      <label>Rate Mode</label>
                      <select id="master-rate-control">
                        <option value="" selected>Auto</option>
                        <option value="crf">CRF</option>
                        <option value="bitrate">Bitrate</option>
                        <option value="lossless">Lossless</option>
                      </select>
                    </div>
                    <div class="form-group"><label>Video Bitrate</label><input id="master-video-bitrate" type="text" placeholder="6M"></div>
                    <div class="form-group"><label>Maxrate</label><input id="master-maxrate" type="text" placeholder="8M"></div>
                    <div class="form-group"><label>Buffer</label><input id="master-bufsize" type="text" placeholder="16M"></div>
                    <div class="form-group"><label>GOP</label><input id="master-gop" type="number" min="1" step="1"></div>
                    <div class="form-group"><label>Video Profile</label><input id="master-video-profile" type="text" placeholder="main"></div>
                    <div class="form-group"><label>Level</label><input id="master-video-level" type="text" placeholder="5.1"></div>
                    <div class="form-group">
                      <label>Pixel Format</label>
                      <select id="master-pixel-format">
                        <option value="yuv420p" selected>yuv420p</option>
                        <option value="yuv422p">yuv422p</option>
                        <option value="yuv444p">yuv444p</option>
                        <option value="yuv420p10le">yuv420p10le</option>
                        <option value="yuv422p10le">yuv422p10le</option>
                        <option value="yuv444p10le">yuv444p10le</option>
                      </select>
                    </div>
                    <div class="form-group"><label>Encode Threads</label><input id="master-threads" type="number" min="1" max="64" step="1" placeholder="Auto"></div>
                    <div class="form-group">
                      <label>Frame Mode</label>
                      <select id="master-frame-mode">
                        <option value="" selected>Auto</option>
                        <option value="cfr">CFR</option>
                        <option value="vfr">VFR</option>
                        <option value="passthrough">Pass Through</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div class="video-studio-settings-subgroup">
                  <span class="video-studio-settings-subgroup-title">Advanced Audio</span>
                  <div class="settings-grid video-studio-settings-subgrid">
                    <div class="form-group">
                      <label>Audio Codec</label>
                      <select id="master-audio-codec">
                        <option value="" selected>Auto</option>
                        <option value="aac">AAC</option>
                        <option value="opus">Opus</option>
                        <option value="mp3">MP3</option>
                        <option value="flac">FLAC</option>
                        <option value="pcm16">PCM 16</option>
                        <option value="pcm24">PCM 24</option>
                        <option value="copy">Copy</option>
                      </select>
                    </div>
                    <div class="form-group"><label>Audio Quality</label><input id="master-audio-quality" type="number" min="0" max="10" step="1"></div>
                    <div class="form-group">
                      <label>Sample Rate</label>
                      <select id="master-audio-sample-rate">
                        <option value="48000" selected>48 kHz</option>
                        <option value="44100">44.1 kHz</option>
                        <option value="96000">96 kHz</option>
                        <option value="32000">32 kHz</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Channels</label>
                      <select id="master-audio-channels">
                        <option value="2" selected>Stereo</option>
                        <option value="1">Mono</option>
                        <option value="6">5.1</option>
                        <option value="8">7.1</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Sample Format</label>
                      <select id="master-audio-sample-format">
                        <option value="" selected>Auto</option>
                        <option value="fltp">Float Planar</option>
                        <option value="s16">16-bit</option>
                        <option value="s32">32-bit</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div class="video-studio-settings-subgroup">
                  <span class="video-studio-settings-subgroup-title">Container</span>
                  <div class="settings-grid video-studio-settings-subgrid">
                    <div class="form-group video-studio-toggle-row">${renderToggleSwitch({ id: 'master-faststart', label: 'Fast Start', checked: true })}</div>
                    <div class="form-group video-studio-toggle-row">${renderToggleSwitch({ id: 'master-shortest', label: 'Stop At Shortest' })}</div>
                    <div class="form-group"><label>Metadata Title</label><input id="master-metadata-title" type="text" value="Video Studio"></div>
                  </div>
                </div>
              </div>
            </div>
            <div id="media-mixer-plan" class="media-transcoder-plan"></div>
          </div>
        </div>
      </div>

      <div class="video-studio-hidden-defaults">
        <input id="timeline-crossfade" type="hidden" value="0.5">
        <input id="timeline-color" type="hidden" value="#111111">
        <input id="timeline-color-duration" type="hidden" value="2">
      </div>

      <div id="modal-track-properties" class="studio-modal video-studio-track-properties-modal video-studio-editor-modal">
        <div class="modal-content">
          <div class="modal-header">
            <div class="sound-studio-modal-title-stack">
              <span class="sound-studio-modal-title">Track Properties</span>
              <span class="studio-library-note">Selected clip timing, transforms, audio, and render flags.</span>
            </div>
            <div class="sound-studio-modal-actions">
              <button id="btn-track-properties-close" type="button" class="mini-btn danger sound-studio-modal-close">Close</button>
            </div>
          </div>
          <div id="track-properties-body" class="modal-body video-studio-settings-body">
            <div class="video-studio-settings-panel" data-track-properties-panel="clip">
              <div class="media-mixer-head">
                <span>Clip Inspector</span>
                <div class="media-mixer-actions">
                  <button id="btn-mixer-duplicate" type="button" class="btn-secondary">Duplicate</button>
                  <button id="btn-mixer-split" type="button" class="btn-secondary">Split</button>
                  <button id="btn-mixer-remove-selected" type="button" class="btn-secondary">Remove</button>
                </div>
              </div>
              <div id="media-mixer-inspector-fields" class="media-mixer-inspector-fields video-studio-track-property-groups"></div>
            </div>
          </div>
        </div>
      </div>

      <div id="modal-clip-plan" class="studio-modal video-studio-plan-modal video-studio-editor-modal">
        <div class="modal-content">
          <div class="modal-header">
            <div class="sound-studio-modal-title-stack">
              <span class="sound-studio-modal-title">Source Plan</span>
              <span class="studio-library-note">Source media FFmpeg plan. Mixer render arguments stay in Settings.</span>
            </div>
            <div class="sound-studio-modal-actions">
              <button id="btn-clip-plan-close" type="button" class="mini-btn danger sound-studio-modal-close">Close</button>
            </div>
          </div>
          <div class="modal-body video-studio-settings-body">
            <div class="video-studio-settings-panel video-studio-settings-panel-secondary video-studio-source-defaults">
              <div class="media-mixer-head"><span>Source Defaults</span></div>
              <div class="settings-grid">
                <div class="form-group">
                  <label>Clip Profile</label>
                  <select id="master-profile">
                    <option value="high">High 4.1</option>
                    <option value="main">Main</option>
                    <option value="baseline">Baseline</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Clip Format</label>
                  <select id="media-output-format">
                    <option value="mp4" selected>MP4</option>
                    <option value="webm">WebM</option>
                    <option value="mkv">MKV</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Source Scale</label>
                  <select id="media-scale">
                    <option value="copy">Source</option>
                    <option value="1920">1920</option>
                    <option value="1280">1280</option>
                    <option value="720">720</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Source Fit</label>
                  <select id="media-scale-mode">
                    <option value="copy">Source</option>
                    <option value="width" selected>Width Only</option>
                    <option value="fit">Fit Box</option>
                    <option value="fill">Fill Box</option>
                    <option value="exact">Exact Box</option>
                  </select>
                </div>
                <div class="form-group"><label>Source Width</label><input type="number" id="media-scale-width" value="1280" min="2" step="2"></div>
                <div class="form-group"><label>Source Height</label><input type="number" id="media-scale-height" value="720" min="2" step="2"></div>
              </div>
            </div>
            <div id="media-render-plan" class="media-transcoder-plan">
              <div class="media-transcoder-plan-empty">Load media to inspect the local FFmpeg plan.</div>
            </div>
          </div>
        </div>
      </div>

      <div id="modal-command-step" class="studio-modal video-studio-command-step-modal">
        <div class="modal-content">
          <div class="modal-header">
            <div class="sound-studio-modal-title-stack">
              <span id="command-step-title" class="sound-studio-modal-title">Command</span>
              <span id="command-step-note" class="studio-library-note">Edit one FFmpeg execution in the render chain.</span>
            </div>
            <div class="sound-studio-modal-actions">
              <button id="btn-command-step-delete" type="button" class="mini-btn danger sound-studio-modal-close">Delete</button>
              <button id="btn-command-step-restore" type="button" class="mini-btn sound-studio-modal-close">Restore</button>
              <button id="btn-command-step-close" type="button" class="mini-btn sound-studio-modal-close">Done</button>
            </div>
          </div>
          <div class="modal-body video-studio-settings-body">
            <div class="media-mixer-command-panel">
              <label for="command-step-editor">FFmpeg Arguments</label>
              <textarea id="command-step-editor" class="media-transcoder-command-editor" spellcheck="false"></textarea>
              <div id="command-step-status" class="media-transcoder-command-status"></div>
            </div>
          </div>
        </div>
      </div>

      <div id="modal-sequence-selected" class="studio-modal video-studio-sequence-modal">
        <div class="modal-content">
          <div class="modal-header">
            <div class="sound-studio-modal-title-stack">
              <span class="sound-studio-modal-title">Sequence Clips</span>
              <span class="studio-library-note">Arrange selected clips end to end on one lane.</span>
            </div>
            <div class="sound-studio-modal-actions">
              <button id="btn-sequence-selected-cancel" type="button" class="mini-btn sound-studio-modal-close">Cancel</button>
              <button id="btn-sequence-selected-apply" type="button" class="sound-studio-mixer-action sound-studio-mixer-action-export">Apply</button>
            </div>
          </div>
          <div class="modal-body video-studio-settings-body">
            <div class="video-studio-settings-panel">
              <div class="media-mixer-head"><span>Arrangement</span></div>
              <div class="settings-grid">
                <div class="form-group"><label>Crossfade</label><input id="sequence-crossfade" type="number" min="0" step="0.1" value="0"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="modal-subtitle-editor" class="studio-modal video-studio-subtitle-modal video-studio-editor-modal">
        <div class="modal-content">
          <div class="modal-header">
            <div class="sound-studio-modal-title-stack">
              <span class="sound-studio-modal-title">Subtitles</span>
              <span class="studio-library-note">Edit timing and text cues used by preview and final render.</span>
            </div>
            <div class="sound-studio-modal-actions">
              <button id="btn-subtitle-editor-close" type="button" class="mini-btn danger sound-studio-modal-close">Close</button>
            </div>
          </div>
          <div class="modal-body video-studio-settings-body">
            <div class="video-studio-settings-panel video-studio-subtitle-source-panel">
              <div class="media-mixer-head">
                <span>Subtitle Source</span>
                <button id="btn-subtitle-unload" type="button" class="btn-secondary">Unload</button>
              </div>
              <div class="settings-grid">
                <div class="form-group">
                  <label>SRT Source</label>
                  <div id="srt-drop-zone" class="media-transcoder-srt-drop">
                    <span id="srt-info">Drop .srt file</span>
                    <input type="file" id="srt-input" class="hidden" accept=".srt">
                  </div>
                </div>
                <div class="form-group"><label>Text Color</label><input type="color" id="sub-color" value="${DEFAULT_SUBTITLE_STYLE.color}"></div>
                <div class="form-group"><label>Font Family</label><input type="text" id="sub-font" value="${DEFAULT_SUBTITLE_STYLE.fontFamily}"></div>
                <div class="form-group"><label>Font Size</label><input type="number" id="sub-size" value="${DEFAULT_SUBTITLE_STYLE.fontSize}" min="8" max="160"></div>
                <div class="form-group"><label>Outline Weight</label><input type="number" id="sub-outline" value="${DEFAULT_SUBTITLE_STYLE.outline}" min="0" max="12" step="0.5"></div>
              </div>
              <div class="media-subtitle-editor-entry">
                <span id="subtitle-editor-summary" class="studio-library-note">No subtitle cues loaded.</span>
              </div>
            </div>
            <div class="media-subtitle-editor">
              <div class="media-subtitle-actions">
                <button id="btn-subtitle-add" type="button" class="btn-secondary">Add Cue</button>
                <label><span>Shift</span><input id="subtitle-shift-amount" type="number" step="0.1" value="0.5"></label>
                <button id="btn-subtitle-shift" type="button" class="btn-secondary">Shift All</button>
                <button id="btn-subtitle-clear" type="button" class="btn-secondary">Clear</button>
              </div>
              <div id="subtitle-editor-list" class="subtitle-editor-list"></div>
            </div>
          </div>
        </div>
      </div>

      <div id="modal-solid-color" class="studio-modal video-studio-solid-modal video-studio-editor-modal">
        <div class="modal-content">
          <div class="modal-header">
            <div class="sound-studio-modal-title-stack">
              <span class="sound-studio-modal-title">Solid Color</span>
              <span class="studio-library-note">Set color clip properties before it lands on the selected lane.</span>
            </div>
            <div class="sound-studio-modal-actions">
              <button id="btn-solid-color-cancel" type="button" class="mini-btn sound-studio-modal-close">Cancel</button>
              <button id="btn-solid-color-apply" type="button" class="sound-studio-mixer-action sound-studio-mixer-action-export">Apply</button>
            </div>
          </div>
          <div class="modal-body video-studio-solid-body">
            <div class="video-studio-settings-panel">
              <div class="media-mixer-head"><span>Color Clip</span></div>
              <div class="settings-grid">
                <div class="form-group"><label>Color</label><input id="solid-color-value" type="color" value="#111111"></div>
                <div class="form-group"><label>Duration</label><input id="solid-color-duration" type="number" min="0.1" step="0.1" value="2"></div>
                <div class="form-group"><label>Width</label><input id="solid-color-width" type="number" min="2" step="2" value="1280"></div>
                <div class="form-group"><label>Height</label><input id="solid-color-height" type="number" min="2" step="2" value="720"></div>
                <div class="form-group">
                  <label>Lane</label>
                  <select id="solid-color-lane"></select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button id="video-studio-miniplayer" class="video-studio-miniplayer hidden" type="button">
        <video id="video-studio-mini-video" muted playsinline></video>
        <span>Composition</span>
      </button>
    </div>
  `;

  parent.appendChild(container);
  progressController = createJobProgress(container.querySelector('#media-progress-host'), { variant: 'compact' });
  videoStudioContextMenu = createContextMenu({ documentTarget: document, mount: container });
  initMixer();
  setRenderStatus('Ready for source media.');
  bindStaticControls();
  syncEditorCommitChrome();
  syncPreviewViewportAspect();
  renderMediaLibrary();
  syncSubtitleModalControls();
  renderSubtitleEditor();
  renderMixerWorkspace();
}

function setRenderStatus(message, tone = 'neutral', detail = '', duration = 0) {
  progressController?.update({ title: message, detail, tone, autoResetMs: duration });
}

function syncEditorImportLabel() {
  const button = container?.querySelector('#btn-editor-import');
  if (button) button.textContent = activeFile ? 'Replace Media' : 'Add Media';
}

function syncEditorCommitChrome() {
  const status = container?.querySelector('#video-studio-editing-status');
  const commit = container?.querySelector('#btn-editor-commit');
  const cancel = container?.querySelector('#btn-editor-cancel');
  if (status) {
    const track = editingTrackId ? mixerState.tracks.find((entry) => entry.id === editingTrackId) : null;
    status.textContent = track ? `Editing ${track.name || 'clip'}` : activeFile ? (activeFile.name || 'New media') : 'Awaiting media';
  }
  if (commit) commit.textContent = editingTrackId ? 'Update Mixer' : 'Add to Mixer';
  cancel?.classList.toggle('hidden', !activeFile);
  container?.querySelectorAll('[data-editor-source-action]').forEach((node) => {
    node.classList.toggle('hidden', !activeFile);
  });
  syncEditorImportLabel();
}

function resetInputToDefault(input) {
  if (!input) return;
  const defaultValue = getControlDefaultValue(input);
  if (input.type === 'checkbox') input.checked = input.dataset.defaultChecked === 'true';
  else input.value = defaultValue;
  syncClipEditorControlChrome(input);
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('change'));
}

function syncEditorPanelState(panel) {
  const enabled = panel.querySelector('.video-studio-panel-enabled')?.checked !== false;
  panel.classList.toggle('is-disabled', !enabled);
  panel.querySelectorAll('input, select, button, textarea').forEach((control) => {
    if (control.closest('summary') || control.classList.contains('video-studio-panel-enabled')) return;
    control.disabled = !enabled;
  });
  updatePlanPreview();
  invalidateFramePreview({ schedule: true });
}

function shouldKeepEditorPanelsOpen() {
  return !window.matchMedia || window.matchMedia('(min-width: 901px)').matches;
}

function installEditorPanelChrome() {
  container.querySelectorAll('.video-studio-editor-panel').forEach((panel) => {
    const summary = panel.querySelector('summary');
    const toggle = panel.querySelector('.video-studio-panel-enabled');
    const reset = panel.querySelector('.video-studio-panel-reset');
    summary?.addEventListener('click', (event) => {
      if (!shouldKeepEditorPanelsOpen()) return;
      event.preventDefault();
      panel.open = true;
    });
    summary?.querySelector('.video-studio-panel-actions')?.addEventListener('click', (event) => {
      event.stopPropagation();
    });
    panel.addEventListener('toggle', () => {
      if (shouldKeepEditorPanelsOpen() && !panel.open) panel.open = true;
    });
    toggle?.addEventListener('change', () => syncEditorPanelState(panel));
    reset?.addEventListener('click', (event) => {
      event.preventDefault();
      panel.querySelectorAll('.settings-grid input:not([type="file"]), .settings-grid select').forEach(resetInputToDefault);
      syncEditorPanelState(panel);
    });
    syncEditorPanelState(panel);
  });
}

function getPreviewAspectSize() {
  const width = sanitizeNumber(container?.querySelector('#timeline-width')?.value, 1280, 2);
  const height = sanitizeNumber(container?.querySelector('#timeline-height')?.value, 720, 2);
  return { width, height };
}

function syncPreviewViewportAspect() {
  const viewport = container?.querySelector('#preview-viewport');
  if (!viewport) return;
  const { width, height } = getPreviewAspectSize();
  viewport.style.aspectRatio = `${width} / ${height}`;
  syncEditorPreviewGeometry();
  container?._applyCropFromSource?.();
}

function getAutoFramePreviewDebounce() {
  if (!autoFramePreviewDebounce) {
    autoFramePreviewDebounce = createDebouncedFunction(() => {
      generateClipFramePreview({ automatic: true });
    }, 450);
  }
  return autoFramePreviewDebounce;
}

function cancelAutoFramePreview() {
  autoFramePreviewDebounce?.cancel?.();
}

function scheduleAutoFramePreview() {
  cancelAutoFramePreview();
  if (!container?.querySelector('#auto-frame-preview')?.checked || !activeFile || isAudioFile(activeFile)) return;
  getAutoFramePreviewDebounce()();
}

function clearEditorSource() {
  const preview = container?.querySelector('#media-preview');
  abortActiveFramePreview();
  cancelAutoFramePreview();
  if (preview) {
    preview.pause?.();
    preview.removeAttribute('src');
    preview.load?.();
    preview.style.filter = '';
    preview.style.transform = '';
    preview.playbackRate = 1;
  }
  clearFramePreview();
  revokeMediaPreviewUrl();
  trimmer?.destroy();
  trimmer = null;
  activeFile = null;
  editingTrackId = null;
  editingAssetId = null;
  videoDuration = 0;
  videoWidth = 0;
  videoHeight = 0;
  startVal = 0;
  endVal = 0;
  editorVolumeEnvelope = [];
  activeEditorVolumePointIndex = null;
  sourceCropRect = null;
  container?.classList.remove('has-editor-source');
  container?.querySelector('#media-drop-zone')?.classList.remove('has-file');
  const fileInfo = container?.querySelector('#media-file-info');
  if (fileInfo) fileInfo.textContent = '';
  container?.querySelector('#crop-box')?.classList.add('hidden');
  syncEditorCommitChrome();
  updatePlanPreview();
  setActivePreviewSurface('mixer');
  closeClipEditorModal();
  updateSubtitlePreview(studioCurrentPos);
}

function loadEditorFile(file, options = {}) {
  if (!file) return;
  const preview = container?.querySelector('#media-preview');
  const dropZone = container?.querySelector('#media-drop-zone');
  const cropBox = container?.querySelector('#crop-box');
  const previewViewport = container?.querySelector('#preview-viewport');
  if (!preview || !dropZone || !cropBox || !previewViewport) return;
  activeFile = file;
  editingTrackId = options.trackId || null;
  editingAssetId = options.assetId || null;
  manualCommandText = '';
  manualCommandActive = false;
  commandEditorDirty = false;
  openClipEditorModal();
  setActivePreviewSurface('editor');
  if (options.addToLibrary !== false) addFilesToMediaLibrary([file], { select: options.select !== false });
  container.querySelector('#media-file-info').textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
  revokeMediaPreviewUrl();
  clearFramePreview();
  previewObjectUrl = URL.createObjectURL(activeFile);
  preview.src = previewObjectUrl;
  container.classList.add('has-editor-source');
  dropZone.classList.add('has-file');
  syncEditorCommitChrome();
  setRenderStatus(options.trackId ? 'Clip opened for editing.' : 'Source loaded.', 'success', file.name, 1800);
  const onLoadedMetadata = () => {
    videoDuration = Number.isFinite(preview.duration) ? preview.duration : 5;
    videoWidth = preview.videoWidth || 1280;
    videoHeight = preview.videoHeight || 720;
    const track = editingTrackId ? mixerState.tracks.find((entry) => entry.id === editingTrackId) : null;
    if (track?.mixerMeta) applyClipMetaToEditor(track.mixerMeta);
    startVal = Number(track?.trimStart) || 0;
    endVal = Math.max(startVal + 0.1, Number(track?.trimEnd) || videoDuration);
    editorVolumeEnvelope = normalizeEditorVolumeEnvelope(track?.volumeAutomation || track?.mixerMeta?.volumeAutomation || []);
    activeEditorVolumePointIndex = null;
    initTrimmer(preview);
    if (startVal || endVal !== videoDuration) trimmer?.setRange(startVal, endVal, false);
    if (trimmer) trimmer.setPlayhead(startVal, 'initial');
    preview.currentTime = startVal;
    syncEditorPreviewGeometry();
    initCropper(cropBox, previewViewport, preview);
    if (track?.mixerMeta?.crop) {
      const dimensions = getEditorSourceDimensions();
      sourceCropRect = normalizeCropRect({
        crop: track.mixerMeta.crop,
        sourceWidth: track.mixerMeta.crop.sourceWidth || dimensions.width,
        sourceHeight: track.mixerMeta.crop.sourceHeight || dimensions.height
      });
      container._applyCropFromSource?.();
    }
    updatePlanPreview();
    updateSubtitlePreview(startVal);
    syncPreviewViewportAspect();
    scheduleAutoFramePreview();
  };
  const onLoadedData = () => {
    if (Math.abs((Number(preview.currentTime) || 0) - startVal) > 0.001) {
      setEditorPlayhead(startVal, 'initial-frame', { syncTrimmer: false });
    }
  };
  preview.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
  preview.addEventListener('loadeddata', onLoadedData, { once: true });
  cleanup.push(() => preview.removeEventListener('loadedmetadata', onLoadedMetadata));
  cleanup.push(() => preview.removeEventListener('loadeddata', onLoadedData));
}

function getControlDefaultValue(input) {
  if (!input) return '';
  if (input.type === 'checkbox' && input.dataset.defaultChecked === undefined) input.dataset.defaultChecked = input.checked ? 'true' : 'false';
  if (input.dataset.defaultValue !== undefined) return input.dataset.defaultValue;
  const fallback = input.getAttribute('value') ?? input.value ?? '';
  input.dataset.defaultValue = String(fallback);
  return input.dataset.defaultValue;
}

function formatClipControlReadout(input) {
  if (!input) return '';
  const inputType = input.getAttribute?.('type') || input.type || '';
  if (inputType === 'checkbox') return input.checked ? 'On' : 'Off';
  if (input.tagName === 'SELECT') {
    const option = Array.from(input.children || []).find((entry) => entry.getAttribute('value') === input.value);
    return option?.textContent || input.value;
  }
  if (inputType === 'color') return input.value;
  const value = Number(input.value);
  if (!Number.isFinite(value)) return input.value || '';
  if (input.id === 'master-vol') return `${Math.round(value)}%`;
  if (input.id?.includes('op') || ['fx-bright', 'fx-contrast', 'fx-sat', 'fx-gamma', 'fx-sharpen', 'fx-denoise'].includes(input.id)) {
    return String(Number(value.toFixed(2)));
  }
  return String(value);
}

function syncClipEditorControlChrome(input) {
  const group = input?.closest?.('.form-group');
  if (!group) return;
  const readout = group.querySelector(`[data-control-readout="${input.id}"]`);
  const value = formatClipControlReadout(input);
  if (readout) readout.textContent = value;
  const inputType = input.getAttribute?.('type') || input.type || '';
  if (inputType === 'range') input.title = value;
}

function installClipEditorControlChrome() {
  container.querySelectorAll('.video-studio-editor-panels .form-group input:not([type="file"]), .video-studio-editor-panels .form-group select').forEach((input) => {
    if (!input.id) return;
    getControlDefaultValue(input);
    const group = input.closest('.form-group');
    if (!group || group.querySelector(`[data-reset-control="${input.id}"]`)) {
      syncClipEditorControlChrome(input);
      return;
    }
    const actions = group.ownerDocument.createElement('div');
    actions.className = 'video-studio-setting-actions';
    const readout = group.ownerDocument.createElement('span');
    readout.className = 'video-studio-setting-readout';
    readout.dataset.controlReadout = input.id;
    const reset = group.ownerDocument.createElement('button');
    reset.type = 'button';
    reset.className = 'mini-btn video-studio-setting-reset';
    reset.dataset.resetControl = input.id;
    reset.textContent = 'Reset';
    reset.addEventListener('click', (event) => {
      event.preventDefault();
      resetInputToDefault(input);
    });
    input.addEventListener('input', () => syncClipEditorControlChrome(input));
    input.addEventListener('change', () => syncClipEditorControlChrome(input));
    actions.appendChild(readout);
    actions.appendChild(reset);
    group.appendChild(actions);
    syncClipEditorControlChrome(input);
  });
}

function bindStaticControls() {
  const preview = container.querySelector('#media-preview');
  const dropZone = container.querySelector('#media-drop-zone');
  const cropBox = container.querySelector('#crop-box');
  const previewViewport = container.querySelector('#preview-viewport');
  installClipEditorControlChrome();
  installEditorPanelChrome();

  container.querySelectorAll('.studio-section-header').forEach((header) => {
    if (header.classList.contains('sound-studio-mixer-header')) return;
    if (header.closest('.video-studio-settings-modal')) return;
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('expanded');
    });
  });

  const onFile = (files) => {
    const file = Array.from(files || [])[0];
    if (!file) return;
    loadEditorFile(file, { addToLibrary: true, select: true });
  };

  dropZone.addEventListener('click', () => container.querySelector('#media-input').click());
  container.querySelector('#btn-editor-import').addEventListener('click', () => container.querySelector('#media-input').click());
  container.querySelector('#btn-editor-frame-preview').addEventListener('click', generateClipFramePreview);
  container.querySelector('#media-input').addEventListener('change', (event) => {
    onFile(event.target.files);
    event.target.value = '';
  });
  cleanup.push(setupDragAndDrop(dropZone, onFile));
  cleanup.push(setupDragAndDrop(container.querySelector('.video-studio-editor-stage'), onFile));

  const syncEditorPreviewVisuals = () => {
    const b = container.querySelector('#fx-bright').value;
    const c = container.querySelector('#fx-contrast').value;
    const s = container.querySelector('#fx-sat').value;
    preview.style.filter = `brightness(${1 + Number.parseFloat(b)}) contrast(${c}) saturate(${s})`;
    syncEditorPreviewGeometry();
    container._applyCropFromSource?.();
    preview.playbackRate = getEditorTransformOptions().speed;
    updatePlanPreview();
  };
  ['fx-bright', 'fx-contrast', 'fx-sat', 'clip-orientation', 'clip-speed'].forEach((id) => {
    container.querySelector(`#${id}`).addEventListener('input', syncEditorPreviewVisuals);
    container.querySelector(`#${id}`).addEventListener('change', syncEditorPreviewVisuals);
  });
  container.querySelector('#fx-grain-preset').addEventListener('change', (event) => {
    applyFilmGrainPresetControls(event.target.value);
    updatePlanPreview();
    invalidateFramePreview({ schedule: true });
  });
  [
    'fx-grain',
    'fx-grain-mode',
    'fx-grain-luma',
    'fx-grain-chroma',
    'fx-grain-distribution',
    'fx-grain-temporal',
    'fx-grain-pattern',
    'fx-grain-averaged',
    'fx-grain-grayscale',
    'fx-grain-blur',
    'fx-grain-av1-denoise'
  ].forEach((id) => {
    const input = container.querySelector(`#${id}`);
    input.addEventListener('input', () => {
      const preset = container.querySelector('#fx-grain-preset');
      if (id === 'fx-grain' && Number(input.value) > 0 && preset.value === 'off') {
        preset.value = 'custom';
        syncClipEditorControlChrome(preset);
      } else if (id !== 'fx-grain' && preset.value !== 'off') {
        preset.value = 'custom';
        syncClipEditorControlChrome(preset);
      }
    });
    input.addEventListener('change', () => {
      const preset = container.querySelector('#fx-grain-preset');
      if (id === 'fx-grain' && Number(input.value) > 0 && preset.value === 'off') {
        preset.value = 'custom';
        syncClipEditorControlChrome(preset);
      } else if (id !== 'fx-grain' && preset.value !== 'off') {
        preset.value = 'custom';
        syncClipEditorControlChrome(preset);
      }
    });
  });

  const planInputSelector = [
    '#fx-bright',
    '#fx-contrast',
    '#fx-sat',
    '#fx-gamma',
    '#fx-grain',
    '#fx-grain-preset',
    '#fx-grain-mode',
    '#fx-grain-luma',
    '#fx-grain-chroma',
    '#fx-grain-distribution',
    '#fx-grain-temporal',
    '#fx-grain-pattern',
    '#fx-grain-averaged',
    '#fx-grain-grayscale',
    '#fx-grain-blur',
    '#fx-grain-av1-denoise',
    '#fx-sharpen',
    '#fx-denoise',
    '#media-scale',
    '#media-scale-mode',
    '#media-scale-width',
    '#media-scale-height',
    '#clip-orientation',
    '#clip-speed',
    '#crt-h-op',
    '#crt-h-dist',
    '#crt-h-thick',
    '#crt-v-op',
    '#crt-v-dist',
    '#crt-v-thick',
    '#sub-color',
    '#sub-font',
    '#sub-size',
    '#sub-outline',
    '#master-vol',
    '#master-fade',
    '#master-profile',
    '#master-preset',
    '#master-tune',
    '#media-output-format'
  ].join(',');
  container.querySelectorAll(planInputSelector).forEach((input) => {
    input.addEventListener('input', updatePlanPreview);
    input.addEventListener('change', updatePlanPreview);
  });
  const framePreviewInputSelector = [
    '#fx-bright',
    '#fx-contrast',
    '#fx-sat',
    '#fx-gamma',
    '#fx-grain',
    '#fx-grain-preset',
    '#fx-grain-mode',
    '#fx-grain-luma',
    '#fx-grain-chroma',
    '#fx-grain-distribution',
    '#fx-grain-temporal',
    '#fx-grain-pattern',
    '#fx-grain-averaged',
    '#fx-grain-grayscale',
    '#fx-grain-blur',
    '#fx-grain-av1-denoise',
    '#fx-sharpen',
    '#fx-denoise',
    '#media-scale',
    '#media-scale-mode',
    '#media-scale-width',
    '#media-scale-height',
    '#clip-orientation',
    '#clip-speed',
    '#crt-h-op',
    '#crt-h-dist',
    '#crt-h-thick',
    '#crt-v-op',
    '#crt-v-dist',
    '#crt-v-thick',
    '#sub-color',
    '#sub-font',
    '#sub-size',
    '#sub-outline'
  ].join(',');
  container.querySelectorAll(framePreviewInputSelector).forEach((input) => {
    input.addEventListener('input', () => invalidateFramePreview({ schedule: true }));
    input.addEventListener('change', () => invalidateFramePreview({ schedule: true }));
  });
  container.querySelector('#media-scale').addEventListener('change', (event) => {
    const mode = container.querySelector('#media-scale-mode');
    if (event.target.value === 'copy') mode.value = 'copy';
    else if (mode.value === 'copy') mode.value = 'width';
    updatePlanPreview();
  });
  container.querySelector('#auto-frame-preview').addEventListener('change', () => {
    if (container.querySelector('#auto-frame-preview')?.checked) scheduleAutoFramePreview();
  });

  const srtDropZone = container.querySelector('#srt-drop-zone');
  srtDropZone.addEventListener('click', () => container.querySelector('#srt-input').click());
  container.querySelector('#srt-input').addEventListener('change', (event) => {
    handleSrtFile(event.target.files?.[0]);
  });
  cleanup.push(setupDragAndDrop(srtDropZone, (files) => handleSrtFile(Array.from(files || [])[0])));

  container.querySelector('#btn-subtitle-add').addEventListener('click', addSubtitleCue);
  container.querySelector('#btn-subtitle-shift').addEventListener('click', () => {
    setSubtitleEditorCues(shiftSubtitleCues(getSubtitleEditorCues(), container.querySelector('#subtitle-shift-amount').value));
    if (getSubtitleEditorTrack()) renderMixerWorkspace();
    renderSubtitleEditor();
    updateMixerPlanPreview();
    updatePlanPreview();
    invalidateFramePreview({ schedule: true });
  });
  container.querySelector('#btn-subtitle-clear').addEventListener('click', () => {
    setSubtitleEditorCues([], { resetOrigin: true });
    if (getSubtitleEditorTrack()) renderMixerWorkspace();
    renderSubtitleEditor();
    updateSubtitlePreview(preview.currentTime || 0);
    updateMixerPlanPreview();
    updatePlanPreview();
    invalidateFramePreview({ schedule: true });
  });
  container.querySelector('#btn-subtitle-edit').addEventListener('click', openSubtitleEditorModal);
  container.querySelector('#btn-subtitle-unload').addEventListener('click', unloadSubtitle);
  container.querySelector('#btn-subtitle-editor-close').addEventListener('click', closeSubtitleEditorModal);
  container.querySelectorAll('#sub-color, #sub-font, #sub-size, #sub-outline').forEach((input) => {
    input.addEventListener('input', handleSubtitleStyleControlInput);
    input.addEventListener('change', handleSubtitleStyleControlInput);
  });

  container.querySelector('#btn-studio-add-track').addEventListener('click', openMediaLibrary);
  container.querySelector('#btn-studio-empty-lib').addEventListener('click', openMediaLibrary);
  container.querySelector('#btn-open-clip-editor').addEventListener('click', openClipEditorModal);
  container.querySelector('#btn-video-settings').addEventListener('click', openVideoSettings);
  container.querySelector('#btn-video-settings-close').addEventListener('click', closeVideoSettings);
  container.querySelector('#btn-track-properties-close').addEventListener('click', closeTrackProperties);
  container.querySelector('#btn-clip-plan').addEventListener('click', openClipPlan);
  container.querySelector('#btn-clip-editor-close').addEventListener('click', closeClipEditorModal);
  container.querySelector('#btn-clip-plan-close').addEventListener('click', closeClipPlan);
  container.querySelector('#btn-command-step-close').addEventListener('click', closeCommandStepModal);
  container.querySelector('#btn-command-step-delete').addEventListener('click', deleteActiveCommandStep);
  container.querySelector('#btn-command-step-restore').addEventListener('click', restoreActiveCommandStep);
  container.querySelector('#command-step-editor').addEventListener('input', updateActiveCommandStepDraft);
  container.querySelector('#btn-render-confirm').addEventListener('click', renderMixer);
  container.querySelector('#btn-solid-color-cancel').addEventListener('click', closeSolidColorDialog);
  container.querySelector('#btn-solid-color-apply').addEventListener('click', applySolidColorDialog);
  container.querySelector('#btn-lib-import').addEventListener('click', () => container.querySelector('#studio-upload-input').click());
  container.querySelector('#btn-mixer-import').addEventListener('click', () => container.querySelector('#studio-upload-input').click());
  container.querySelector('#studio-upload-input').addEventListener('change', (event) => {
    addFilesToMediaLibrary(event.target.files, { addToMixer: true, select: true });
    event.target.value = '';
  });
  container.querySelector('#btn-editor-commit').addEventListener('click', commitEditorClipToMixer);
  container.querySelector('#btn-editor-cancel').addEventListener('click', cancelEditorClipEdit);
  container.querySelector('#btn-mixer-add-color').addEventListener('click', () => openSolidColorDialog());
  container.querySelector('#btn-mixer-properties-selected').addEventListener('click', openSelectedMixerProperties);
  container.querySelector('#btn-mixer-delete-selected').addEventListener('click', deleteSelectedMixerTracks);
  container.querySelector('#btn-mixer-sequence-selected').addEventListener('click', openSelectedTrackSequenceDialog);
  container.querySelector('#btn-sequence-selected-cancel').addEventListener('click', closeSelectedTrackSequenceDialog);
  container.querySelector('#btn-sequence-selected-apply').addEventListener('click', applySelectedTrackSequence);
  container.querySelector('#btn-lib-close').addEventListener('click', closeMediaLibrary);
  container.querySelector('#library-target-select').addEventListener('change', (event) => {
    libraryLaneOverride = true;
    libraryCreateLaneOnAdd = event.target.value === '__new_lane__';
    if (!libraryCreateLaneOnAdd) applyMixerState(selectMixerLane(getMixerStateSnapshot(), Number(event.target.value)));
    renderMixerWorkspace();
  });
  cleanup.push(setupDragAndDrop(container.querySelector('#library-list'), (files) => addFilesToMediaLibrary(files, { select: true })));
  container.querySelector('#btn-studio-play').addEventListener('click', () => {
    setActivePreviewSurface('mixer');
    toggleMixerPreview();
  });
  container.querySelector('#mixer-loop-playback').addEventListener('change', (event) => {
    mixerLoopPlayback = Boolean(event.target.checked);
  });
  container.querySelector('#btn-studio-export').addEventListener('click', openRenderConfirm);
  container.querySelector('#btn-mixer-duplicate').addEventListener('click', duplicateSelectedMixerClip);
  container.querySelector('#btn-mixer-split').addEventListener('click', splitSelectedMixerClip);
  container.querySelector('#btn-mixer-remove-selected').addEventListener('click', removeSelectedMixerClip);
  container.querySelector('#timeline-export-profile').addEventListener('change', (event) => applyTimelineExportProfile(event.target.value));
  container.querySelectorAll('#timeline-width, #timeline-height, #timeline-fps, #timeline-crossfade, #timeline-output-format, #timeline-quality-profile, #timeline-scale-quality, #timeline-background-color, #timeline-color, #master-encoder, #master-preset, #master-crf, #master-tune, #master-audio-bitrate, #master-rate-control, #master-video-bitrate, #master-maxrate, #master-bufsize, #master-gop, #master-video-profile, #master-video-level, #master-pixel-format, #master-threads, #master-frame-mode, #master-audio-codec, #master-audio-quality, #master-audio-sample-rate, #master-audio-channels, #master-audio-sample-format, #master-faststart, #master-shortest, #master-metadata-title').forEach((input) => {
    input.addEventListener('input', () => {
      if (input.id === 'timeline-width' || input.id === 'timeline-height') {
        syncPreviewViewportAspect();
        renderMixerWorkspace();
        return;
      }
      updateMixerPlanPreview();
    });
    input.addEventListener('change', () => {
      if (input.id === 'timeline-width' || input.id === 'timeline-height') {
        syncPreviewViewportAspect();
        renderMixerWorkspace();
        return;
      }
      updateMixerPlanPreview();
    });
  });
  container.querySelector('#studio-zoom').addEventListener('input', (event) => {
    const timeline = mixerController?.getTimelineContainer();
    const nextScale = Number(event.target.value) || studioTimelineScale;
    mixerZoomFollowsFit = false;
    const nextScrollLeft = timeline
      ? getAnchoredMixerScrollLeft({
        scrollLeft: timeline.scrollLeft,
        viewportWidth: timeline.clientWidth,
        oldScale: studioTimelineScale,
        newScale: nextScale,
        anchorTime: studioCursorVisible ? studioCurrentPos : undefined
      })
      : 0;
    studioTimelineScale = nextScale;
    mixerController?.updateScale(studioTimelineScale);
    if (timeline) timeline.scrollLeft = nextScrollLeft;
  });
  container.querySelector('#btn-studio-zoom-fit').addEventListener('click', fitMixerTimeline);
  container.querySelector('#btn-studio-zoom-selection').addEventListener('click', zoomMixerToSelectedClip);
  setupMixerDropTargets();
  setupVideoStudioMediaControls();
  setupMiniPlayer(preview);
}

function initCropper(cropBox, previewViewport, preview) {
  let cropData = { x: 0, y: 0, w: 0, h: 0 };
  const getViewportBounds = () => {
    const viewportRect = previewViewport.getBoundingClientRect();
    return getEditorMediaBounds(viewportRect);
  };
  const getCropDimensions = () => getEditorSourceDimensions();
  const clampCropData = () => {
    const bounds = getViewportBounds();
    const minSize = 24;
    cropData.w = Math.max(minSize, Math.min(cropData.w, bounds.right - bounds.left));
    cropData.h = Math.max(minSize, Math.min(cropData.h, bounds.bottom - bounds.top));
    cropData.x = Math.max(bounds.left, Math.min(cropData.x, bounds.right - cropData.w));
    cropData.y = Math.max(bounds.top, Math.min(cropData.y, bounds.bottom - cropData.h));
  };
  function commitCropFromUi() {
    const viewportBounds = getViewportBounds();
    const dimensions = getCropDimensions();
    const scaleX = dimensions.width / Math.max(1, viewportBounds.width);
    const scaleY = dimensions.height / Math.max(1, viewportBounds.height);
    sourceCropRect = normalizeCropRect({
      crop: {
        x: (cropData.x - viewportBounds.left) * scaleX,
        y: (cropData.y - viewportBounds.top) * scaleY,
        width: cropData.w * scaleX,
        height: cropData.h * scaleY
      },
      sourceWidth: dimensions.width,
      sourceHeight: dimensions.height
    });
    return sourceCropRect;
  }
  const updateCropUI = (options = {}) => {
    clampCropData();
    if (options.commit !== false) commitCropFromUi();
    cropBox.style.left = `${cropData.x}px`;
    cropBox.style.top = `${cropData.y}px`;
    cropBox.style.width = `${cropData.w}px`;
    cropBox.style.height = `${cropData.h}px`;
    updatePlanPreview();
    if (options.invalidatePreview) invalidateFramePreview({ schedule: true });
  };
  function applyCropFromSource() {
    if (!sourceCropRect) return;
    syncSourceCropRectToOrientation();
    const bounds = getViewportBounds();
    const dimensions = getCropDimensions();
    const scaleX = bounds.width / Math.max(1, dimensions.width);
    const scaleY = bounds.height / Math.max(1, dimensions.height);
    cropData = {
      x: bounds.left + (sourceCropRect.x * scaleX),
      y: bounds.top + (sourceCropRect.y * scaleY),
      w: sourceCropRect.width * scaleX,
      h: sourceCropRect.height * scaleY
    };
    updateCropUI({ commit: false });
  }
  cropBox.classList.remove('hidden');
  if (stopCropTracking) stopCropTracking();
  const makeDefaultCropRect = () => {
    const dimensions = getCropDimensions();
    return normalizeCropRect({
      crop: {
        x: dimensions.width * 0.1,
        y: dimensions.height * 0.1,
        width: dimensions.width * 0.8,
        height: dimensions.height * 0.8
      },
      sourceWidth: dimensions.width,
      sourceHeight: dimensions.height
    });
  };
  function syncSourceCropRectToOrientation() {
    const dimensions = getCropDimensions();
    if (!sourceCropRect) {
      sourceCropRect = makeDefaultCropRect();
      return;
    }
    const previousWidth = Math.max(1, Number(sourceCropRect.sourceWidth) || dimensions.width);
    const previousHeight = Math.max(1, Number(sourceCropRect.sourceHeight) || dimensions.height);
    if (Math.abs(previousWidth - dimensions.width) < 0.001 && Math.abs(previousHeight - dimensions.height) < 0.001) return;
    sourceCropRect = normalizeCropRect({
      crop: {
        x: (Number(sourceCropRect.x) || 0) / previousWidth * dimensions.width,
        y: (Number(sourceCropRect.y) || 0) / previousHeight * dimensions.height,
        width: (Number(sourceCropRect.width) || previousWidth) / previousWidth * dimensions.width,
        height: (Number(sourceCropRect.height) || previousHeight) / previousHeight * dimensions.height
      },
      sourceWidth: dimensions.width,
      sourceHeight: dimensions.height
    });
  }
  sourceCropRect = makeDefaultCropRect();
  applyCropFromSource();
  const resetCropToDefault = () => {
    sourceCropRect = makeDefaultCropRect();
    applyCropFromSource();
    invalidateFramePreview({ schedule: true });
  };
  const scheduleCropResize = createDebouncedFunction(() => {
    syncEditorPreviewGeometry();
    applyCropFromSource();
  }, 80);
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(scheduleCropResize) : null;
  resizeObserver?.observe(previewViewport);
  window.addEventListener('resize', scheduleCropResize);
  const getPoint = (event) => {
    const touch = event.touches?.[0] || event.changedTouches?.[0];
    const clientX = touch ? touch.clientX : event.clientX;
    const clientY = touch ? touch.clientY : event.clientY;
    const rect = previewViewport.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };
  const clampPointToViewport = (point) => {
    const bounds = getViewportBounds();
    return {
      x: Math.max(bounds.left, Math.min(bounds.right, Number(point.x) || bounds.left)),
      y: Math.max(bounds.top, Math.min(bounds.bottom, Number(point.y) || bounds.top))
    };
  };
  const startTracking = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const initialPoint = getPoint(event);
    let startX = initialPoint.x;
    let startY = initialPoint.y;
    const type = event.target.dataset.h || 'move';
    const move = (nextEvent) => {
      const point = getPoint(nextEvent);
      const dx = point.x - startX;
      const dy = point.y - startY;
      startX = point.x;
      startY = point.y;
      if (type === 'move') {
        cropData.x += dx;
        cropData.y += dy;
      } else if (type === 'nw') {
        cropData.x += dx;
        cropData.y += dy;
        cropData.w -= dx;
        cropData.h -= dy;
      } else if (type === 'se') {
        cropData.w += dx;
        cropData.h += dy;
      } else if (type === 'ne') {
        cropData.y += dy;
        cropData.w += dx;
        cropData.h -= dy;
      } else if (type === 'sw') {
        cropData.x += dx;
        cropData.w -= dx;
        cropData.h += dy;
      } else if (type === 'n') {
        cropData.y += dy;
        cropData.h -= dy;
      } else if (type === 'e') {
        cropData.w += dx;
      } else if (type === 's') {
        cropData.h += dy;
      } else if (type === 'w') {
        cropData.x += dx;
        cropData.w -= dx;
      }
      updateCropUI({ invalidatePreview: true });
      if (nextEvent.cancelable) nextEvent.preventDefault();
    };
    const end = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
  };
  function startPreviewCropSelection(event) {
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target.closest?.('#crop-box')) return;
    const startPoint = clampPointToViewport(getPoint(event));
    const move = (nextEvent) => {
      const point = clampPointToViewport(getPoint(nextEvent));
      cropData = {
        x: Math.min(startPoint.x, point.x),
        y: Math.min(startPoint.y, point.y),
        w: Math.abs(point.x - startPoint.x),
        h: Math.abs(point.y - startPoint.y)
      };
      updateCropUI({ invalidatePreview: true });
      if (nextEvent.cancelable) nextEvent.preventDefault();
    };
    const end = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
  }
  const openCropContextMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    videoStudioContextMenu?.open({
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          id: 'preview-frame',
          label: 'Preview Frame',
          onSelect() {
            generateClipFramePreview();
          }
        },
        {
          id: 'toggle-editor-playback',
          label: preview.paused ? 'Play' : 'Pause',
          onSelect() {
            toggleClipEditorPreview();
          }
        },
        {
          id: 'reset-crop',
          label: 'Reset Crop',
          onSelect() {
            resetCropToDefault();
          }
        },
        {
          id: 'clear-preview-frame',
          label: 'Clear Preview Frame',
          disabled: !framePreviewUrl,
          onSelect() {
            clearFramePreview();
          }
        }
      ]
    });
  };
  previewViewport.addEventListener('mousedown', startPreviewCropSelection);
  previewViewport.addEventListener('touchstart', startPreviewCropSelection, { passive: false });
  cropBox.addEventListener('mousedown', startTracking);
  cropBox.addEventListener('touchstart', startTracking, { passive: false });
  cropBox.addEventListener('contextmenu', openCropContextMenu);
  stopCropTracking = () => {
    previewViewport.removeEventListener('mousedown', startPreviewCropSelection);
    previewViewport.removeEventListener('touchstart', startPreviewCropSelection);
    cropBox.removeEventListener('mousedown', startTracking);
    cropBox.removeEventListener('touchstart', startTracking);
    cropBox.removeEventListener('contextmenu', openCropContextMenu);
    resizeObserver?.disconnect();
    window.removeEventListener('resize', scheduleCropResize);
    scheduleCropResize.cancel();
  };
  container._getCropRect = () => {
    syncSourceCropRectToOrientation();
    const crop = sourceCropRect || commitCropFromUi();
    const dimensions = getCropDimensions();
    return { ...crop, sourceWidth: dimensions.width, sourceHeight: dimensions.height };
  };
  container._applyCropFromSource = applyCropFromSource;
  container._resetCropBox = resetCropToDefault;
}

function collectRenderPlan({ sourceBuffer, subtitleBuffer, outputName }) {
  if (!activeFile) return null;
  const isAudioOnly = isAudioFile(activeFile) || !videoWidth || !videoHeight;
  const subtitleStyle = getGlobalSubtitleStyle();
  const crop = isAudioOnly
    ? { x: 0, y: 0, width: Math.max(2, videoWidth || 2), height: Math.max(2, videoHeight || 2) }
    : container._getCropRect?.() || { x: 0, y: 0, width: videoWidth, height: videoHeight, sourceWidth: videoWidth, sourceHeight: videoHeight };
  const scaleOptions = getScaleOptions();
  return buildMediaRenderPlan({
    startTime: startVal,
    endTime: endVal,
    scaleWidth: scaleOptions.scaleWidth,
    scale: scaleOptions.scale,
    outputFormat: isAudioOnly ? 'm4a' : container.querySelector('#media-output-format').value,
    fx: {
      brightness: container.querySelector('#fx-bright').value,
      contrast: container.querySelector('#fx-contrast').value,
      saturation: container.querySelector('#fx-sat').value,
      gamma: container.querySelector('#fx-gamma').value,
      noise: container.querySelector('#fx-grain').value,
      filmGrain: getEditorFilmGrainOptions(),
      sharpen: container.querySelector('#fx-sharpen').value,
      denoise: container.querySelector('#fx-denoise').value
    },
    crt: {
      horizontalOpacity: container.querySelector('#crt-h-op').value,
      horizontalDistance: container.querySelector('#crt-h-dist').value,
      horizontalThickness: container.querySelector('#crt-h-thick').value,
      verticalOpacity: container.querySelector('#crt-v-op').value,
      verticalDistance: container.querySelector('#crt-v-dist').value,
      verticalThickness: container.querySelector('#crt-v-thick').value
    },
    subtitles: {
      fileBuffer: subtitleBuffer,
      color: subtitleStyle.color,
      fontFamily: subtitleStyle.fontFamily,
      fontSize: subtitleStyle.fontSize,
      outline: subtitleStyle.outline
    },
    mastering: {
      volume: container.querySelector('#master-vol').value / 100,
      fadeDuration: Number.parseFloat(container.querySelector('#master-fade').value),
      profile: container.querySelector('#master-profile').value,
      preset: container.querySelector('#master-preset').value,
      tune: container.querySelector('#master-tune')?.value || 'none'
    },
    transform: getEditorTransformOptions(),
    crop,
    media: {
      isAudioOnly,
      sourceName: activeFile.name || (isAudioOnly ? 'input.wav' : 'input.mp4'),
      sourceBuffer,
      outputName,
      mimeType: isAudioOnly ? 'audio/mp4' : 'video/mp4'
    }
  });
}

function buildFramePreviewPlan({ sourceBuffer, subtitleBuffer, currentTime }) {
  const subtitleStyle = getGlobalSubtitleStyle();
  const crop = normalizeCropRect({
    crop: container._getCropRect?.() || { x: 0, y: 0, width: videoWidth, height: videoHeight },
    sourceWidth: videoWidth,
    sourceHeight: videoHeight
  });
  const basePlan = buildMediaRenderPlan({
    startTime: startVal,
    endTime: endVal,
    scaleWidth: 'copy',
    scale: { mode: 'exact', width: crop.width, height: crop.height },
    outputFormat: 'mp4',
    fx: {
      brightness: container.querySelector('#fx-bright').value,
      contrast: container.querySelector('#fx-contrast').value,
      saturation: container.querySelector('#fx-sat').value,
      gamma: container.querySelector('#fx-gamma').value,
      noise: container.querySelector('#fx-grain').value,
      filmGrain: getEditorFilmGrainOptions(),
      sharpen: container.querySelector('#fx-sharpen').value,
      denoise: container.querySelector('#fx-denoise').value
    },
    crt: {
      horizontalOpacity: container.querySelector('#crt-h-op').value,
      horizontalDistance: container.querySelector('#crt-h-dist').value,
      horizontalThickness: container.querySelector('#crt-h-thick').value,
      verticalOpacity: container.querySelector('#crt-v-op').value,
      verticalDistance: container.querySelector('#crt-v-dist').value,
      verticalThickness: container.querySelector('#crt-v-thick').value
    },
    subtitles: {
      fileBuffer: subtitleBuffer,
      color: subtitleStyle.color,
      fontFamily: subtitleStyle.fontFamily,
      fontSize: subtitleStyle.fontSize,
      outline: subtitleStyle.outline
    },
    mastering: {
      volume: 1,
      fadeDuration: 0,
      profile: container.querySelector('#master-profile').value,
      preset: container.querySelector('#master-preset').value,
      tune: container.querySelector('#master-tune')?.value || 'none'
    },
    transform: getEditorTransformOptions(),
    crop: { ...crop, sourceWidth: videoWidth, sourceHeight: videoHeight },
    media: {
      isAudioOnly: false,
      sourceName: activeFile.name || 'input.mp4',
      sourceBuffer,
      outputName: 'clip_frame_preview.mp4',
      mimeType: 'video/mp4'
    }
  });
  if (!basePlan || !basePlan.videoFilters?.length) throw new Error('Frame preview requires video source media.');
  const sourceName = activeFile.name || 'input.mp4';
  const outputName = 'clip_frame_preview.png';
  return {
    files: basePlan.files,
    command: [
      '-ss', String(Math.max(0, Number(currentTime) || 0)),
      '-i', sourceName,
      '-frames:v', '1',
      '-vf', basePlan.videoFilters.join(','),
      '-an',
      '-f', 'image2',
      outputName
    ],
    outputName,
    mimeType: 'image/png'
  };
}

async function generateClipFramePreview() {
  if (!activeFile || isAudioFile(activeFile)) {
    setRenderStatus('Load video media first.', 'danger', 'Frame preview uses the selected video frame.');
    return;
  }
  abortActiveFramePreview();
  activeFramePreviewController = new AbortController();
  const previewController = activeFramePreviewController;
  const button = container.querySelector('#btn-editor-frame-preview');
  const preview = container.querySelector('#media-preview');
  const framePreview = container.querySelector('#media-frame-preview');
  const cropBox = container.querySelector('#crop-box');
  const currentTime = preview?.currentTime || startVal || 0;
  button.disabled = true;
  setActivePreviewSurface('editor');
  pauseClipEditorPreview();
  setRenderStatus('Generating frame preview...', 'neutral', 'FFmpeg is rendering the selected frame.');
  try {
    const frameSubtitleCues = getFramePreviewSubtitleCues(subtitleCues, currentTime);
    const subtitleText = frameSubtitleCues.length ? serializeSrtSubtitles(frameSubtitleCues) : '';
    const plan = buildFramePreviewPlan({
      sourceBuffer: await activeFile.arrayBuffer(),
      subtitleBuffer: subtitleText ? new TextEncoder().encode(subtitleText).buffer : null,
      currentTime
    });
    const result = await runFFmpegJob({
      files: plan.files,
      command: plan.command,
      outputFileName: plan.outputName,
      signal: previewController.signal
    });
    if (previewController.signal.aborted || previewController !== activeFramePreviewController) return;
    revokeFramePreviewUrl();
    framePreviewUrl = URL.createObjectURL(new Blob([result.buffer], { type: plan.mimeType }));
    if (framePreview) {
      framePreview.src = framePreviewUrl;
      framePreview.classList.remove('hidden');
    }
    framePreviewValid = true;
    cropBox?.classList.remove('is-frame-preview-stale');
    cropBox?.classList.add('has-frame-preview');
    setRenderStatus('Frame preview ready.', 'success', `${currentTime.toFixed(2)}s`, 1800);
  } catch (error) {
    if (error?.name === 'AbortError') return;
    setRenderStatus('Frame preview failed.', 'danger', error.message);
  } finally {
    if (previewController === activeFramePreviewController) {
      activeFramePreviewController = null;
      button.disabled = false;
    }
  }
}

function applyManualCommandOverride(plan) {
  if (!manualCommandActive) return plan;
  return applyMediaCommandOverride(plan, manualCommandText);
}

function renderPlanInspector(plan, commandText, commandStatus = '') {
  const details = describeMediaRenderPlan(plan);
  const sections = details.sections.map((section) => `
    <div class="media-transcoder-plan-section">
      <div class="media-transcoder-plan-title">${escapeHtml(section.title)}</div>
      <div class="media-transcoder-plan-items">
        ${section.items.map((item) => `<code>${escapeHtml(item)}</code>`).join('')}
      </div>
    </div>
  `).join('');
  return `
    ${sections}
    <div class="media-transcoder-command-panel">
      <label for="media-command-editor">FFmpeg Arguments</label>
      <textarea id="media-command-editor" class="media-transcoder-command-editor" spellcheck="false">${escapeHtml(commandText)}</textarea>
      <div class="media-transcoder-command-actions">
        <button id="btn-media-command-apply" type="button" class="btn-secondary">Apply Arguments</button>
        <button id="btn-media-command-reset" type="button" class="btn-secondary">Reset Arguments</button>
      </div>
      <div id="media-command-status" class="media-transcoder-command-status">${escapeHtml(commandStatus)}</div>
    </div>
  `;
}

function bindCommandEditor(basePlan) {
  const editor = container.querySelector('#media-command-editor');
  const applyButton = container.querySelector('#btn-media-command-apply');
  const resetButton = container.querySelector('#btn-media-command-reset');
  const status = container.querySelector('#media-command-status');
  if (!editor || !applyButton || !resetButton) return;
  editor.addEventListener('input', () => {
    manualCommandText = editor.value;
    commandEditorDirty = true;
    if (status) status.textContent = 'Arguments edited. Apply them before adding the source as a mixer clip.';
  });
  applyButton.addEventListener('click', () => {
    try {
      applyMediaCommandOverride(basePlan, editor.value);
      manualCommandText = editor.value;
      manualCommandActive = true;
      commandEditorDirty = false;
      updatePlanPreview();
      setRenderStatus('Custom FFmpeg arguments applied.', 'success', 'The source plan inspector uses the edited command.', 1800);
    } catch (error) {
      if (status) status.textContent = error.message;
      setRenderStatus('Command rejected.', 'danger', error.message);
    }
  });
  resetButton.addEventListener('click', () => {
    manualCommandText = '';
    manualCommandActive = false;
    commandEditorDirty = false;
    updatePlanPreview();
    setRenderStatus('Generated FFmpeg plan restored.', 'success', '', 1400);
  });
}

function updatePlanPreview() {
  const planNode = container?.querySelector('#media-render-plan');
  if (!planNode) return;
  if (!activeFile) {
    planNode.innerHTML = '<div class="media-transcoder-plan-empty">Load media to inspect the local FFmpeg plan.</div>';
    return;
  }
  try {
    const subtitleText = subtitleCues.length ? serializeSrtSubtitles(subtitleCues) : '';
    const basePlan = collectRenderPlan({
      sourceBuffer: new ArrayBuffer(0),
      subtitleBuffer: subtitleText ? new TextEncoder().encode(subtitleText).buffer : srtFile ? new ArrayBuffer(0) : null,
      outputName: getOutputBaseName(isAudioFile(activeFile) || !videoWidth || !videoHeight)
    });
    let plan = basePlan;
    let commandStatus = manualCommandActive ? 'Custom arguments active.' : 'Generated arguments are ready.';
    if (manualCommandActive) {
      try {
        plan = applyManualCommandOverride(basePlan);
      } catch (error) {
        commandStatus = error.message;
        plan = basePlan;
      }
    } else if (commandEditorDirty) {
      commandStatus = 'Arguments edited. Apply them before using this plan.';
    }
    const commandText = manualCommandActive || commandEditorDirty ? manualCommandText : basePlan.command.join(' ');
    planNode.innerHTML = renderPlanInspector(plan, commandText, commandStatus);
    bindCommandEditor(basePlan);
  } catch (error) {
    planNode.innerHTML = `<div class="media-transcoder-plan-empty">${escapeHtml(error.message || 'Render plan unavailable.')}</div>`;
  }
}

function getMixerStateSnapshot() {
  return createMixerState({
    laneCount: mixerState.lanes.length,
    lanes: mixerState.lanes,
    tracks: mixerState.tracks,
    assets: mixerState.assets,
    selectedLaneIndex: mixerState.selectedLaneIndex,
    selectedTrackId: mixerState.selectedTrackId,
    selectedTrackIds: mixerState.selectedTrackIds
  });
}

function applyMixerState(state) {
  mixerState = createMixerState({
    laneCount: state.lanes.length,
    lanes: state.lanes,
    tracks: state.tracks,
    assets: state.assets,
    selectedLaneIndex: state.selectedLaneIndex,
    selectedTrackId: state.selectedTrackId,
    selectedTrackIds: state.selectedTrackIds
  });
}

function getMediaLibrary() {
  return mixerState.assets;
}

function getEditableClip(track = getSelectedClip()) {
  if (!track) return null;
  const meta = track.mixerMeta || {};
  const trimStart = Math.max(0, Number(track.trimStart) || 0);
  const trimEnd = Math.max(trimStart, Number(track.trimEnd) || trimStart);
  return normalizeMixerClipCanvasGeometry({
    ...meta,
    ...track,
    ...meta,
    kind: track.kind || meta.kind || 'audio',
    start: Number(track.offset) || 0,
    duration: getClipPlaybackDuration(track),
    trimStart,
    trimEnd,
    volume: Number(track.volume) || 1,
    fadeIn: Number(track.fadeIn) || 0,
    fadeOut: Number(track.fadeOut) || 0
  });
}

function getMixerCompositionClip(track, buffer = new ArrayBuffer(0)) {
  const clip = getEditableClip(track);
  return {
    ...clip,
    id: track.id,
    start: Number(track.offset) || 0,
    duration: getClipPlaybackDuration(track),
    muted: track.muted,
    solo: track.soloed,
    volume: Number(track.volume) || 1,
    fileName: getTimelineFileName(clip),
    buffer
  };
}

function getMixerCompositionSnapshot() {
  return createMixerCompositionSnapshot(getMixerStateSnapshot(), {
    mapClip: ({ track }) => getMixerCompositionClip(track)
  });
}

function getMixerCompositionTracksFromSnapshot(snapshot) {
  const clipById = new Map(snapshot.clips.map((clip) => [clip.id, clip]));
  return snapshot.lanes.map((lane) => ({
    id: lane.id,
    name: lane.name,
    kind: lane.kind,
    visible: lane.visible,
    muted: lane.muted,
    solo: lane.soloed,
    opacity: lane.opacity,
    volume: lane.volume,
    clips: lane.clipIds.map((id) => clipById.get(id)).filter(Boolean)
  }));
}

function getMixerCompositionTracks() {
  return getMixerCompositionTracksFromSnapshot(getMixerCompositionSnapshot());
}

async function getMixerCompositionTracksWithBuffers(includeBuffers = false) {
  const clipByTrackId = new Map();
  for (const track of mixerState.tracks) {
    const clip = getEditableClip(track);
    clipByTrackId.set(track.id, getMixerCompositionClip(track, await fileBufferOrEmpty(clip.file, includeBuffers)));
  }
  const snapshot = createMixerCompositionSnapshot(getMixerStateSnapshot(), {
    mapClip: ({ track }) => clipByTrackId.get(track.id) || getMixerCompositionClip(track)
  });
  return getMixerCompositionTracksFromSnapshot(snapshot);
}

function getMixerPreviewSourceUrl(clip = {}) {
  if (!clip.file) return '';
  if (!mixerPreviewUrls.has(clip.file)) {
    mixerPreviewUrls.set(clip.file, URL.createObjectURL(clip.file));
  }
  return mixerPreviewUrls.get(clip.file);
}

function applyMixerPreviewLayerGeometry(layer, clip, settings) {
  const geometry = getMediaCompositionGeometry(clip, settings.width, settings.height);
  layer.style.left = `${(geometry.x / settings.width) * 100}%`;
  layer.style.top = `${(geometry.y / settings.height) * 100}%`;
  layer.style.width = `${(geometry.width / settings.width) * 100}%`;
  layer.style.height = `${(geometry.height / settings.height) * 100}%`;
  layer.style.opacity = String(Math.max(0, Math.min(1, Number(clip.opacity ?? 1))));
  if (clip.blendMode && clip.blendMode !== 'normal') layer.style.mixBlendMode = clip.blendMode;
  const rotate = Number(clip.rotate) || 0;
  layer.style.transform = rotate ? `rotate(${rotate}deg)` : '';
  const brightness = 1 + (Number(clip.brightness) || 0);
  const contrast = Number(clip.contrast ?? 1) || 1;
  const saturation = Number(clip.saturation ?? 1) || 1;
  const blur = Math.max(0, Number(clip.blur) || 0);
  layer.style.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) blur(${blur}px)`;
}

function getMixerPreviewClipSpeed(clip = {}) {
  return sanitizeNumber(clip.speed ?? clip.mixerMeta?.speed, 1, 0.25, 4);
}

function getMixerPreviewClipSourceTime(clip, time) {
  const speed = getMixerPreviewClipSpeed(clip);
  const trimStart = Math.max(0, Number(clip.trimStart) || 0);
  const trimEnd = Math.max(trimStart + 0.1, Number(clip.trimEnd) || trimStart + getMediaCompositionClipDuration(clip));
  const localTime = Math.max(0, (time - getMediaCompositionClipStart(clip)) * speed);
  return clip.reverse
    ? Math.max(trimStart, trimEnd - localTime)
    : Math.max(0, trimStart + localTime);
}

function getMixerPreviewClipVolume(clip) {
  return Math.max(0, Math.min(1, (Number(clip.volume) || 1) * (Number(clip.laneVolume) || 1)));
}

function syncMixerPreviewMediaElement(media, clip, time, options = {}) {
  if (!media || !clip) return;
  const speed = getMixerPreviewClipSpeed(clip);
  const sourceTime = getMixerPreviewClipSourceTime(clip, time);
  const duration = Number(media.duration);
  const targetTime = Number.isFinite(duration) && duration > 0
    ? Math.min(Math.max(0, duration - 0.04), sourceTime)
    : sourceTime;
  try {
    const drift = Math.abs((Number(media.currentTime) || 0) - targetTime);
    if (!isStudioPlaying || clip.reverse || drift > 0.35) media.currentTime = targetTime;
  } catch {}
  if (media.tagName !== 'VIDEO' && media.tagName !== 'AUDIO') return;
  media.volume = getMixerPreviewClipVolume(clip);
  media.muted = !options.audible;
  media.playbackRate = clip.reverse ? 1 : speed;
  if (isStudioPlaying && !clip.reverse) {
    media.play?.().catch?.(() => {});
  } else {
    media.pause?.();
  }
}

function createMixerPreviewLayer(clip, settings, time, options = {}) {
  const documentTarget = container.ownerDocument;
  const kind = clip.kind || 'video';
  const layer = documentTarget.createElement('div');
  layer.className = `video-studio-mixer-preview-layer is-${kind}`;
  layer.dataset.clipId = String(clip.id || '');
  applyMixerPreviewLayerGeometry(layer, clip, settings);
  if (kind === 'color') {
    layer.style.background = clip.color || '#111111';
    return layer;
  }
  if (kind === 'text') {
    layer.textContent = clip.text || '';
    layer.style.color = clip.color || '#ffffff';
    layer.style.fontSize = `${Math.max(8, Number(clip.fontSize) || 42)}px`;
    return layer;
  }
  const sourceUrl = getMixerPreviewSourceUrl(clip);
  if (!sourceUrl) return layer;
  const media = documentTarget.createElement(kind === 'image' ? 'img' : 'video');
  media.className = 'video-studio-mixer-preview-media';
  media.src = sourceUrl;
  media.playsInline = true;
  media.preload = 'metadata';
  media.style.objectFit = clip.fitMode === 'fill' ? 'cover' : clip.fitMode === 'exact' ? 'fill' : 'contain';
  layer.appendChild(media);
  if (kind === 'video') {
    const syncTime = () => {
      syncMixerPreviewMediaElement(media, clip, time, { audible: options.audible });
    };
    media.addEventListener('loadedmetadata', syncTime, { once: true });
    syncTime();
  }
  return layer;
}

function createMixerPreviewAudioElement(clip, time) {
  const sourceUrl = getMixerPreviewSourceUrl(clip);
  if (!sourceUrl) return null;
  const audio = container.ownerDocument.createElement('audio');
  audio.className = 'video-studio-mixer-preview-audio';
  audio.setAttribute('data-mixer-preview-audio', String(clip.id || ''));
  audio.src = sourceUrl;
  audio.preload = 'metadata';
  const syncTime = () => {
    syncMixerPreviewMediaElement(audio, clip, time, { audible: true });
  };
  audio.addEventListener('loadedmetadata', syncTime, { once: true });
  syncTime();
  return audio;
}

function pauseMixerPreviewMedia() {
  container?.querySelectorAll('#mixer-preview-stage video, #mixer-preview-stage audio').forEach((media) => {
    media.pause?.();
  });
}

function syncMixerPreviewPlayback(stage, visualClips, audioClips, settings, time) {
  const visualClipById = new Map(visualClips.map((clip) => [String(clip.id), clip]));
  const audioClipById = new Map(audioClips.map((clip) => [String(clip.id), clip]));
  stage.querySelectorAll('[data-clip-id]').forEach((layer) => {
    const clip = visualClipById.get(String(layer.dataset.clipId || ''));
    if (!clip) return;
    applyMixerPreviewLayerGeometry(layer, clip, settings);
    const media = layer.querySelector('video');
    if (media) {
      syncMixerPreviewMediaElement(media, clip, time, { audible: audioClipById.has(String(clip.id)) });
    }
  });
  stage.querySelectorAll('[data-mixer-preview-audio]').forEach((media) => {
    const clip = audioClipById.get(String(media.getAttribute('data-mixer-preview-audio') || ''));
    if (clip) syncMixerPreviewMediaElement(media, clip, time, { audible: true });
  });
}

function renderMixerCompositionPreview(time = studioCurrentPos) {
  const stage = container?.querySelector('#mixer-preview-stage');
  const viewport = container?.querySelector('#preview-viewport');
  const preview = container?.querySelector('#media-preview');
  if (!stage || !viewport || !preview) return;
  const isMixer = activePreviewSurface === 'mixer';
  viewport.classList.toggle('is-mixer-preview', isMixer);
  stage.classList.toggle('hidden', !isMixer);
  preview.classList.toggle('hidden', isMixer);
  updateSubtitlePreview(time);
  if (!isMixer) {
    pauseMixerPreviewMedia();
    stage.dataset.previewSignature = '';
    return;
  }
  const settings = {
    width: sanitizeNumber(container.querySelector('#timeline-width')?.value, 1280, 2),
    height: sanitizeNumber(container.querySelector('#timeline-height')?.value, 720, 2),
    backgroundColor: container.querySelector('#timeline-background-color')?.value || '#000000'
  };
  stage.style.background = settings.backgroundColor;
  const snapshot = getMixerCompositionSnapshot();
  const activeClips = getMixerActiveClipsAtTime(snapshot, time, {
    roles: ['visual'],
    order: 'visual'
  });
  const activeAudioClips = getMixerActiveClipsAtTime(snapshot, time, { order: 'audio' })
    .filter((clip) => clip.audioActive);
  const visualIds = new Set(activeClips.map((clip) => String(clip.id)));
  const audioIds = new Set(activeAudioClips.map((clip) => String(clip.id)));
  const signature = JSON.stringify({
    settings,
    visual: [...visualIds],
    audio: [...audioIds]
  });
  if (stage.dataset.previewSignature === signature) {
    syncMixerPreviewPlayback(stage, activeClips, activeAudioClips, settings, time);
    return;
  }
  pauseMixerPreviewMedia();
  stage.dataset.previewSignature = signature;
  stage.replaceChildren();
  if (!activeClips.length) {
    const empty = stage.ownerDocument.createElement('div');
    empty.className = 'video-studio-mixer-preview-empty';
    empty.textContent = activeAudioClips.length ? 'Audio-only preview' : mixerState.tracks.length ? 'No clip at playhead' : 'Mixer is empty';
    stage.appendChild(empty);
  }
  activeClips.forEach((clip) => {
    stage.appendChild(createMixerPreviewLayer(clip, settings, time, { audible: audioIds.has(String(clip.id)) }));
  });
  activeAudioClips
    .filter((clip) => !visualIds.has(String(clip.id)))
    .forEach((clip) => {
      const audio = createMixerPreviewAudioElement(clip, time);
      if (audio) stage.appendChild(audio);
  });
  syncMixerPreviewPlayback(stage, activeClips, activeAudioClips, settings, time);
}

function getDefaultClipMeta(asset, options = {}) {
  const kind = options.kind || getClipKindForAsset(asset);
  const assetMeta = asset.mixerMeta || {};
  const duration = Math.max(0.1, Number(options.duration) || Number(assetMeta.duration) || (kind === 'image' ? 4 : Number(asset.duration) || videoDuration || 5));
  const canvasSize = getTimelineCanvasSize();
  return {
    ...assetMeta,
    kind,
    file: asset.file || null,
    fileName: asset.file?.name || asset.name || `${kind}.mp4`,
    name: asset.name || 'Clip',
    duration,
    x: 0,
    y: 0,
    width: kind === 'audio' || kind === 'subtitle' ? 2 : canvasSize.width,
    height: kind === 'audio' || kind === 'subtitle' ? 2 : canvasSize.height,
    canvasWidth: kind === 'audio' || kind === 'subtitle' ? 2 : canvasSize.width,
    canvasHeight: kind === 'audio' || kind === 'subtitle' ? 2 : canvasSize.height,
    canvasFit: kind !== 'audio' && kind !== 'subtitle',
    opacity: 1,
    fitMode: 'fit',
    blendMode: 'normal',
    brightness: 0,
    contrast: 1,
    saturation: 1,
    gamma: 1,
    noise: 0,
    filmGrain: {
      preset: 'off',
      strength: 0,
      mode: 'all',
      lumaStrength: 0,
      chromaStrength: 0,
      distribution: 'gaussian',
      temporal: true,
      pattern: false,
      averaged: false,
      grayscale: false,
      blur: 0,
      av1Denoise: false
    },
    sharpen: 0,
    denoise: 0,
    blur: 0,
    rotate: 0,
    speed: 1,
    reverse: false,
    hasAudio: kind === 'video',
    subtitleStyle: kind === 'subtitle' ? getGlobalSubtitleStyle() : null,
    ...(options.meta || {})
  };
}

function getTrackAsset(asset, options = {}) {
  const meta = getDefaultClipMeta(asset, options);
  const bufferDuration = Math.max(Number(options.trimEnd) || 0, Number(meta.duration) || 0.1);
  return {
    ...asset,
    kind: meta.kind,
    file: meta.file,
    fileName: meta.fileName,
    duration: bufferDuration,
    buffer: { duration: bufferDuration },
    mixerMeta: meta
  };
}

function updateMixerTrack(trackId, updater) {
  mixerState = {
    ...mixerState,
    tracks: mixerState.tracks.map((track) => (
      track.id === trackId ? updater({ ...track, mixerMeta: { ...(track.mixerMeta || {}) } }) : { ...track }
    ))
  };
}

function getSelectedLibraryAsset() {
  return getMediaLibrary().find((asset) => asset.id === selectedLibraryAssetId) || null;
}

function getLibraryAddOptions(asset) {
  if (libraryCreateLaneOnAdd) return { createLane: true };
  const kind = getClipKindForAsset(asset);
  if (kind === 'subtitle' && !libraryLaneOverride) return {};
  return { laneIndex: mixerState.selectedLaneIndex };
}

function getLibraryTargetLaneIndex(asset = getSelectedLibraryAsset()) {
  if (libraryCreateLaneOnAdd) return -1;
  if (asset && getClipKindForAsset(asset) === 'subtitle' && !libraryLaneOverride) return getTrackForKind('subtitle');
  return mixerState.selectedLaneIndex;
}

function syncLibraryLaneTargetChrome() {
  const targetLaneIndex = getLibraryTargetLaneIndex();
  const laneLabel = libraryCreateLaneOnAdd ? 'New lane' : mixerState.lanes[targetLaneIndex]?.name || `Lane ${targetLaneIndex + 1}`;
  const target = container?.querySelector('#library-target-lane');
  const select = container?.querySelector('#library-target-select');
  if (target) target.textContent = `Selected lane: ${laneLabel}`;
  if (!select) return;
  select.innerHTML = '';
  mixerState.lanes.forEach((lane, index) => {
    const option = select.ownerDocument.createElement('option');
    option.value = String(index);
    option.textContent = lane.name || `Lane ${index + 1}`;
    option.selected = index === targetLaneIndex;
    select.appendChild(option);
  });
  const option = select.ownerDocument.createElement('option');
  option.value = '__new_lane__';
  option.textContent = 'New lane';
  option.selected = libraryCreateLaneOnAdd;
  select.appendChild(option);
  select.value = libraryCreateLaneOnAdd ? '__new_lane__' : String(targetLaneIndex);
  container.querySelectorAll('.studio-library-commit').forEach((button) => {
    button.textContent = `Add to ${laneLabel}`;
  });
}

function syncStudioSummaryChrome() {
  const duration = getMixerDuration();
  const durationMetric = container?.querySelector('#metric-duration');
  const tracksMetric = container?.querySelector('#metric-tracks');
  if (durationMetric) durationMetric.textContent = formatMixerTime(duration);
  if (tracksMetric) tracksMetric.textContent = String(mixerState.tracks.length);
}

function syncMixerPlaybackChrome() {
  mixerController?.setPlaying(isStudioPlaying);
  mixerController?.setPlayhead(studioCursorVisible ? studioCurrentPos : null);
  const playIcon = container?.querySelector('[data-role="studio-play-icon"]');
  const pauseIcon = container?.querySelector('[data-role="studio-pause-icon"]');
  const playButton = container?.querySelector('#btn-studio-play');
  playButton?.classList.toggle('active', isStudioPlaying);
  playIcon?.classList.toggle('hidden', isStudioPlaying);
  pauseIcon?.classList.toggle('hidden', !isStudioPlaying);
  setMediaPlaybackState(isStudioPlaying ? 'playing' : 'paused');
}

function setMixerPlayhead(time, options = {}) {
  studioCurrentPos = Math.max(0, Number(time) || 0);
  studioCursorVisible = true;
  if (isStudioPlaying && options.resyncPlayback) {
    mixerPreviewStartTime = studioCurrentPos;
    mixerPreviewStartedAt = performance.now();
  }
  updateSubtitlePreview(studioCurrentPos);
  renderMixerCompositionPreview(studioCurrentPos);
  syncMixerPlaybackChrome();
}

function fitMixerTimeline() {
  const timeline = mixerController?.getTimelineContainer();
  if (!timeline) return;
  mixerZoomFollowsFit = true;
  studioTimelineScale = getMixerZoomToFit({
    tracks: mixerState.tracks,
    duration: getMixerDuration(),
    viewportWidth: timeline.clientWidth,
    minScale: 0.01,
    maxScale: 500
  });
  const zoom = container.querySelector('#studio-zoom');
  if (zoom) zoom.value = String(studioTimelineScale);
  mixerController.updateScale(studioTimelineScale);
  timeline.scrollLeft = 0;
  syncMixerPlaybackChrome();
}

function zoomMixerToSelectedClip() {
  const timeline = mixerController?.getTimelineContainer();
  const track = getSelectedClip();
  mixerZoomFollowsFit = false;
  if (!timeline || !track) {
    fitMixerTimeline();
    return;
  }
  const span = Math.max(0.1, (Number(track.trimEnd) || 0) - (Number(track.trimStart) || 0));
  studioTimelineScale = Math.max(0.01, Math.min(500, timeline.clientWidth / Math.max(0.4, span * 1.45)));
  const zoom = container.querySelector('#studio-zoom');
  if (zoom) zoom.value = String(studioTimelineScale);
  mixerController.updateScale(studioTimelineScale);
  const centerTime = (Number(track.offset) || 0) + (span / 2);
  timeline.scrollLeft = Math.max(0, Math.min(timeline.scrollWidth - timeline.clientWidth, (centerTime * studioTimelineScale) - (timeline.clientWidth / 2)));
  syncMixerPlaybackChrome();
}

function syncMixerZoomSelectionChrome() {
  const button = container?.querySelector('#btn-studio-zoom-selection');
  if (!button) return;
  const hasSelection = Boolean(getSelectedClip());
  button.classList.toggle('hidden', !hasSelection);
  button.disabled = !hasSelection;
}

function syncMixerMultiSelectionChrome() {
  const toolbar = container?.querySelector('#video-studio-selection-toolbar');
  const count = container?.querySelector('#video-studio-selection-count');
  const deleteButton = container?.querySelector('#btn-mixer-delete-selected');
  const propertiesButton = container?.querySelector('#btn-mixer-properties-selected');
  const sequenceButton = container?.querySelector('#btn-mixer-sequence-selected');
  const selectedCount = getSelectedTrackIds().length;
  if (count) count.textContent = `${selectedCount} selected`;
  toolbar?.classList.toggle('hidden', selectedCount < 1);
  if (deleteButton) deleteButton.disabled = selectedCount < 1;
  if (propertiesButton) propertiesButton.disabled = selectedCount !== 1;
  if (sequenceButton) {
    sequenceButton.disabled = selectedCount <= 1;
    sequenceButton.classList.toggle('hidden', selectedCount <= 1);
  }
}

function syncVideoSettingsVisibility() {
  const body = container?.querySelector('#video-studio-settings-body');
  if (!body) return;
  const output = body.querySelector('#settings-summary-output');
  const mixer = body.querySelector('#settings-summary-mixer');
  const width = sanitizeNumber(container.querySelector('#timeline-width')?.value, 1280, 2);
  const height = sanitizeNumber(container.querySelector('#timeline-height')?.value, 720, 2);
  const fps = sanitizeNumber(container.querySelector('#timeline-fps')?.value, 30, 1, 120);
  if (output) output.textContent = `${width}x${height} @ ${fps} fps`;
  if (mixer) mixer.textContent = `${mixerState.tracks.length} clip${mixerState.tracks.length === 1 ? '' : 's'} · ${formatMixerTime(getMixerDuration())}`;
}

function moveSharedPreviewToSlot(selector) {
  const slot = container?.querySelector(selector);
  const stage = container?.querySelector('.video-studio-shared-preview-stage');
  if (!slot || !stage || stage.parentElement === slot) return;
  slot.appendChild(stage);
  syncPreviewViewportAspect();
}

function openClipEditorModal() {
  container?.querySelector('#modal-clip-editor')?.classList.add('active');
  moveSharedPreviewToSlot('#clip-editor-preview-slot');
  if (activeFile) setActivePreviewSurface('editor');
  else renderMixerCompositionPreview(studioCurrentPos);
  syncEditorPreviewGeometry();
}

function closeClipEditorModal() {
  container?.querySelector('#modal-clip-editor')?.classList.remove('active');
  moveSharedPreviewToSlot('#mixer-preview-slot');
  setActivePreviewSurface('mixer');
  updateSubtitlePreview(studioCurrentPos);
}

function openFinalOutputDialog(mode = 'settings') {
  const modal = container.querySelector('#modal-video-settings');
  const title = container.querySelector('#video-studio-final-output-title');
  const note = container.querySelector('#video-studio-final-output-note');
  modal?.classList.add('active');
  if (modal) modal.dataset.mode = mode;
  if (title) title.textContent = mode === 'render' ? 'Render' : 'Settings';
  if (note) {
    note.textContent = mode === 'render'
      ? 'Review final output settings and mixer arguments before export.'
      : 'Final output file settings.';
  }
  syncVideoSettingsVisibility();
  updateMixerPlanPreview();
}

function openVideoSettings() {
  openFinalOutputDialog('settings');
}

function closeVideoSettings() {
  container.querySelector('#modal-video-settings')?.classList.remove('active');
}

function openTrackProperties() {
  if (!getSelectedClip()) return;
  container.querySelector('#modal-track-properties')?.classList.add('active');
  renderMixerInspector();
}

function closeTrackProperties() {
  container.querySelector('#modal-track-properties')?.classList.remove('active');
}

function openClipPlan() {
  container.querySelector('#modal-clip-plan')?.classList.add('active');
  updatePlanPreview();
}

function closeClipPlan() {
  container.querySelector('#modal-clip-plan')?.classList.remove('active');
}

function openSubtitleEditorModal(trackId = null) {
  editingSubtitleTrackId = trackId;
  const title = container.querySelector('#modal-subtitle-editor .sound-studio-modal-title');
  const note = container.querySelector('#modal-subtitle-editor .studio-library-note');
  if (title) title.textContent = trackId ? 'Subtitle Track' : 'Subtitles';
  if (note) note.textContent = trackId ? 'Edit this mixer subtitle track.' : 'Edit timing and text cues used by preview and final render.';
  container.querySelector('#modal-subtitle-editor')?.classList.add('active');
  syncSubtitleModalControls();
  renderSubtitleEditor();
}

function closeSubtitleEditorModal() {
  container.querySelector('#modal-subtitle-editor')?.classList.remove('active');
  editingSubtitleTrackId = null;
}

function applyRenderConfirmSettings() {
  updateMixerPlanPreview();
}

function openRenderConfirm() {
  if (!mixerState.tracks.length && !subtitleCues.length) {
    setRenderStatus('Add mixer content first.', 'danger', 'The final output is rendered from the mixer.');
    return;
  }
  setActivePreviewSurface('mixer');
  openFinalOutputDialog('render');
}

function closeRenderConfirm() {
  closeVideoSettings();
}

function setActivePreviewSurface(surface) {
  activePreviewSurface = surface === 'editor' ? 'editor' : 'mixer';
  renderMixerCompositionPreview(studioCurrentPos);
}

function clampEditorPreviewTime(time) {
  const nextTime = Math.max(0, Number(time) || 0);
  if (nextTime < startVal || nextTime >= endVal) return startVal;
  return nextTime;
}

function setEditorPlayhead(time, reason = 'external', options = {}) {
  const preview = container?.querySelector('#media-preview');
  if (!preview) return;
  const syncTrimmer = options.syncTrimmer !== false;
  const nextTime = clampEditorPreviewTime(time);
  const previousTime = Number(preview.currentTime) || 0;
  preview.currentTime = nextTime;
  if (syncTrimmer) trimmer?.setPlayhead(nextTime, reason === 'ruler-click' ? 'preview-seek' : reason);
  updateSubtitlePreview(nextTime);
  if (Math.abs(previousTime - nextTime) > 0.001) invalidateFramePreview({ schedule: true });
}

function normalizeEditorVolumeEnvelope(points = editorVolumeEnvelope) {
  const duration = Math.max(0.1, Number(videoDuration) || 0.1);
  const sourcePoints = (Array.isArray(points) ? points : [])
    .map((point) => ({
      time: Math.max(0, Math.min(duration, Number(point?.time) || 0)),
      value: Math.max(0, Math.min(2, Number(point?.value)))
    }))
    .filter((point) => Number.isFinite(point.value))
    .sort((left, right) => left.time - right.time);
  if (!sourcePoints.length) return [
    { time: 0, value: 1 },
    { time: duration, value: 1 }
  ];
  const first = sourcePoints[0];
  const last = sourcePoints[sourcePoints.length - 1];
  const next = first.time > 0 ? [{ time: 0, value: first.value }, ...sourcePoints] : [...sourcePoints];
  if (last.time < duration) next.push({ time: duration, value: last.value });
  return next.reduce((accumulator, point) => {
    const previous = accumulator[accumulator.length - 1];
    if (previous && Math.abs(previous.time - point.time) < 0.01) {
      previous.value = point.value;
      return accumulator;
    }
    accumulator.push(point);
    return accumulator;
  }, []);
}

function getEditorVolumePercentX(time) {
  return (Math.max(0, Math.min(videoDuration || 0.1, Number(time) || 0)) / Math.max(0.1, videoDuration || 0.1)) * 100;
}

function getEditorVolumePercentY(value) {
  return (1 - (Math.max(0, Math.min(2, Number(value))) / 2)) * 100;
}

function projectEditorVolumePoint(event, surface) {
  const rect = surface.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width || 1, event.clientX - rect.left));
  const y = Math.max(0, Math.min(rect.height || 1, event.clientY - rect.top));
  return {
    time: Number(((x / Math.max(1, rect.width || 1)) * Math.max(0.1, videoDuration || 0.1)).toFixed(3)),
    value: Number((2 - ((y / Math.max(1, rect.height || 1)) * 2)).toFixed(3))
  };
}

function renderEditorVolumeEnvelope() {
  const body = container?.querySelector('#trim-host .media-trimmer-body');
  if (!body) return;
  let root = body.querySelector('.video-studio-volume-envelope');
  if (!root) {
    root = body.ownerDocument.createElement('div');
    root.className = 'video-studio-volume-envelope';
    body.appendChild(root);
  }
  editorVolumeEnvelope = normalizeEditorVolumeEnvelope();
  const points = editorVolumeEnvelope;
  const path = points.map((point, index) => {
    const x = getEditorVolumePercentX(point.time);
    const y = getEditorVolumePercentY(point.value);
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(3)} ${y.toFixed(3)}`;
  }).join(' ');
  root.innerHTML = `
    <svg class="video-studio-volume-envelope-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <line x1="0" y1="50" x2="100" y2="50" class="video-studio-volume-envelope-base"></line>
      <path d="${path}" class="video-studio-volume-envelope-hit"></path>
      <path d="${path}" class="video-studio-volume-envelope-line"></path>
    </svg>
  `;
  points.forEach((point, index) => {
    const pointNode = root.ownerDocument.createElement('button');
    pointNode.type = 'button';
    pointNode.className = `video-studio-volume-point${index === activeEditorVolumePointIndex ? ' is-active' : ''}`;
    pointNode.dataset.volumePoint = String(index);
    pointNode.style.left = `${getEditorVolumePercentX(point.time)}%`;
    pointNode.style.top = `${getEditorVolumePercentY(point.value)}%`;
    root.appendChild(pointNode);
  });
  const hitPath = root.querySelector('.video-studio-volume-envelope-hit');
  hitPath?.addEventListener('pointerdown', (event) => {
    const point = projectEditorVolumePoint(event, root);
    editorVolumeEnvelope = normalizeEditorVolumeEnvelope([...editorVolumeEnvelope, point]);
    activeEditorVolumePointIndex = editorVolumeEnvelope.findIndex((entry) => Math.abs(entry.time - point.time) < 0.02);
    renderEditorVolumeEnvelope();
    event.stopPropagation();
  });
  root.querySelectorAll('.video-studio-volume-point').forEach((pointNode) => {
    pointNode.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      const index = Number(pointNode.dataset.volumePoint);
      activeEditorVolumePointIndex = index;
      const move = (moveEvent) => {
        const nextPoint = projectEditorVolumePoint(moveEvent, root);
        const next = editorVolumeEnvelope.map((entry, entryIndex) => (
          entryIndex === index ? nextPoint : entry
        ));
        editorVolumeEnvelope = normalizeEditorVolumeEnvelope(next);
        renderEditorVolumeEnvelope();
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  });
}

function stopMixerPreview() {
  if (mixerPreviewFrameId) cancelAnimationFrame(mixerPreviewFrameId);
  mixerPreviewFrameId = 0;
  isStudioPlaying = false;
  pauseMixerPreviewMedia();
  syncMixerPlaybackChrome();
}

function playMixerPreview() {
  if (!mixerState.tracks.length && !subtitleCues.length) {
    setRenderStatus('Add mixer content first.', 'danger', 'The mixer transport follows lane content.');
    return;
  }
  if (mixerPreviewFrameId) cancelAnimationFrame(mixerPreviewFrameId);
  mixerPreviewFrameId = 0;
  isStudioPlaying = true;
  setActivePreviewSurface('mixer');
  container?.querySelector('#media-preview')?.pause?.();
  const duration = getMixerDuration();
  mixerPreviewStartTime = studioCursorVisible ? Math.min(studioCurrentPos, duration) : 0;
  if (mixerLoopPlayback && mixerPreviewStartTime >= duration) mixerPreviewStartTime = 0;
  mixerPreviewStartedAt = performance.now();
  syncMixerPlaybackChrome();
  const tick = (now) => {
    if (!isStudioPlaying) return;
    const elapsed = (now - mixerPreviewStartedAt) / 1000;
    const nextTime = mixerPreviewStartTime + elapsed;
    if (nextTime >= duration) {
      if (mixerLoopPlayback && duration > 0) {
        setMixerPlayhead(0);
        mixerPreviewStartTime = 0;
        mixerPreviewStartedAt = now;
        mixerPreviewFrameId = requestAnimationFrame(tick);
        return;
      }
      setMixerPlayhead(duration);
      stopMixerPreview();
      return;
    }
    setMixerPlayhead(nextTime);
    mixerPreviewFrameId = requestAnimationFrame(tick);
  };
  mixerPreviewFrameId = requestAnimationFrame(tick);
}

function toggleMixerPreview() {
  if (isStudioPlaying) stopMixerPreview();
  else playMixerPreview();
}

function playClipEditorPreview() {
  const preview = container?.querySelector('#media-preview');
  if (!preview || !activeFile) {
    setRenderStatus('Load source media first.', 'danger', 'The preview transport follows the source file.');
    return;
  }
  openClipEditorModal();
  setActivePreviewSurface('editor');
  stopMixerPreview();
  clearFramePreview();
  if (preview.currentTime >= endVal || preview.currentTime < startVal) preview.currentTime = startVal;
  preview.play?.();
}

function pauseClipEditorPreview() {
  container?.querySelector('#media-preview')?.pause?.();
}

function toggleClipEditorPreview() {
  const preview = container?.querySelector('#media-preview');
  if (!preview || preview.paused) playClipEditorPreview();
  else pauseClipEditorPreview();
}

function playVideoStudioPreview() {
  if (activePreviewSurface === 'editor') playClipEditorPreview();
  else playMixerPreview();
}

function pauseVideoStudioPreview() {
  if (activePreviewSurface === 'editor') pauseClipEditorPreview();
  else stopMixerPreview();
}

function toggleVideoStudioPreview() {
  if (activePreviewSurface === 'editor') toggleClipEditorPreview();
  else toggleMixerPreview();
}

function jumpVideoStudioClip(delta) {
  const clips = [...mixerState.tracks].sort((a, b) => (Number(a.offset) || 0) - (Number(b.offset) || 0));
  if (!clips.length) return;
  const currentIndex = clips.findIndex((track) => track.id === mixerState.selectedTrackId);
  const fallbackIndex = clips.findIndex((track) => (Number(track.offset) || 0) > studioCurrentPos);
  const baseIndex = currentIndex >= 0 ? currentIndex : fallbackIndex >= 0 ? fallbackIndex : 0;
  const nextIndex = (baseIndex + delta + clips.length) % clips.length;
  const nextClip = clips[nextIndex];
  applyMixerState(selectMixerTrack(getMixerStateSnapshot(), nextClip.id));
  setMixerPlayhead(Number(nextClip.offset) || 0);
  renderMixerWorkspace();
}

function jumpVideoStudioTransport(delta) {
  if (activePreviewSurface === 'editor' && activeFile) {
    setEditorPlayhead(delta > 0 ? endVal : startVal);
    return;
  }
  jumpVideoStudioClip(delta);
}

function setupVideoStudioMediaControls() {
  mediaControlsCleanup?.();
  mediaControlsCleanup = bindMediaControls({
    target: window,
    metadata: { title: 'Video Studio', artist: 'Jelodar Tools' },
    playbackState: 'paused',
    handlers: {
      play: playVideoStudioPreview,
      pause: pauseVideoStudioPreview,
      stop: pauseVideoStudioPreview,
      toggle: toggleVideoStudioPreview,
      nexttrack: () => jumpVideoStudioTransport(1),
      previoustrack: () => jumpVideoStudioTransport(-1)
    }
  });
}

function setupMiniPlayer(preview) {
  const mini = container.querySelector('#video-studio-miniplayer');
  const miniVideo = container.querySelector('#video-studio-mini-video');
  const previewShell = container.querySelector('.media-transcoder-preview-shell');
  if (!mini || !miniVideo || !previewShell) return;
  let previewVisible = true;
  let miniDragged = false;
  function syncMiniPlayer() {
    const shouldShow = activePreviewSurface === 'editor' && activeFile && !preview.paused && !previewVisible;
    mini.classList.toggle('hidden', !shouldShow);
    if (!shouldShow) {
      miniVideo.pause?.();
      return;
    }
    if (miniVideo.src !== preview.src) miniVideo.src = preview.src;
    if (Math.abs((miniVideo.currentTime || 0) - (preview.currentTime || 0)) > 0.3) miniVideo.currentTime = preview.currentTime || 0;
    miniVideo.play?.().catch?.(() => {});
  }
  const observer = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver((entries) => {
      previewVisible = entries.some((entry) => entry.isIntersecting);
      syncMiniPlayer();
    }, { threshold: 0.25 })
    : null;
  observer?.observe(previewShell);
  window.addEventListener('scroll', syncMiniPlayer, true);
  preview.addEventListener('play', syncMiniPlayer);
  preview.addEventListener('pause', syncMiniPlayer);
  preview.addEventListener('timeupdate', syncMiniPlayer);
  mini.addEventListener('click', () => {
    if (miniDragged) {
      miniDragged = false;
      return;
    }
    previewShell.scrollIntoView?.({ block: 'center', inline: 'nearest' });
  });
  mini.addEventListener('pointerdown', (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const rect = mini.getBoundingClientRect();
    const startLeft = rect.left;
    const startTop = rect.top;
    let moved = false;
    const move = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      const width = mini.offsetWidth || rect.width;
      const height = mini.offsetHeight || rect.height;
      const left = Math.max(8, Math.min(window.innerWidth - width - 8, startLeft + dx));
      const top = Math.max(8, Math.min(window.innerHeight - height - 8, startTop + dy));
      mini.style.left = `${left}px`;
      mini.style.top = `${top}px`;
      mini.style.right = 'auto';
      mini.style.bottom = 'auto';
    };
    const up = (upEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (moved) {
        miniDragged = true;
        upEvent.stopPropagation?.();
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
  cleanup.push(() => {
    observer?.disconnect();
    window.removeEventListener('scroll', syncMiniPlayer, true);
    preview.removeEventListener('play', syncMiniPlayer);
    preview.removeEventListener('pause', syncMiniPlayer);
    preview.removeEventListener('timeupdate', syncMiniPlayer);
  });
  container._syncMiniPlayer = syncMiniPlayer;
}

function initMixer() {
  const host = container.querySelector('#mixer-host');
  if (!host) return;
  mixerController = createMixerComponent({
    mount: host,
    state: getMixerStateSnapshot(),
    timelineScale: studioTimelineScale,
    onTrackSelect(id, selection = {}) {
      applyMixerState(selectMixerTrack(getMixerStateSnapshot(), id, selection));
      renderMixerWorkspace();
    },
    onTrackMarqueeSelect(ids, selection = {}) {
      const currentIds = selection.additive ? getSelectedTrackIds() : [];
      applyMixerState(selectMixerTracks(getMixerStateSnapshot(), currentIds.concat(ids), ids.at(-1) || currentIds.at(-1) || null));
      renderMixerWorkspace();
    },
    onTrackMove(id, offset, laneIndex) {
      applyMixerState(moveMixerTrack(getMixerStateSnapshot(), { trackId: id, offset, laneIndex }));
      renderMixerWorkspace();
    },
    onTrackMoveToNewLane(id, offset) {
      applyMixerState(moveMixerTrackToNewLane(getMixerStateSnapshot(), { trackId: id, offset }));
      renderMixerWorkspace();
    },
    onTrackTrimStart(id, trimStart) {
      applyMixerState(trimMixerTrackStart(getMixerStateSnapshot(), { trackId: id, trimStart }));
      renderMixerWorkspace();
    },
    onTrackTrimEnd(id, trimEnd) {
      applyMixerState(trimMixerTrackEnd(getMixerStateSnapshot(), { trackId: id, trimEnd }));
      renderMixerWorkspace();
    },
    onTrackFadeStyleChange(id, style) {
      applyMixerState(setMixerTrackFadeStyle(getMixerStateSnapshot(), id, style));
      renderMixerWorkspace();
    },
    onTrackVolumeChange(id, volume) {
      applyMixerState(setMixerTrackVolume(getMixerStateSnapshot(), id, volume));
      renderMixerWorkspace();
    },
    onTrackCrossfadeMenu: openMixerCrossfadeContextMenu,
    onTrackMuteToggle(id) {
      applyMixerState(toggleMixerTrackMute(getMixerStateSnapshot(), id));
      renderMixerWorkspace();
    },
    onTrackSoloToggle(id) {
      applyMixerState(toggleMixerTrackSolo(getMixerStateSnapshot(), id));
      renderMixerWorkspace();
    },
    onTrackRemove(id) {
      applyMixerState(removeMixerTrackState(getMixerStateSnapshot(), id));
      renderMixerWorkspace();
    },
    onTrackEdit(id) {
      beginMixerClipEdit(id);
    },
    onTrackDuplicate(id) {
      duplicateMixerClip(id);
    },
    onTrackDoubleClick(id) {
      beginMixerClipEdit(id);
    },
    onTrackContextMenu: openMixerTrackContextMenu,
    onLaneSelect(index) {
      applyMixerState(selectMixerLane(getMixerStateSnapshot(), index));
      renderMixerWorkspace();
    },
    onLaneMuteToggle(index) {
      applyMixerState(toggleMixerLaneMute(getMixerStateSnapshot(), index));
      renderMixerWorkspace();
    },
    onLaneSoloToggle(index) {
      applyMixerState(toggleMixerLaneSolo(getMixerStateSnapshot(), index));
      renderMixerWorkspace();
    },
    onLaneRemove(index) {
      applyMixerState(removeMixerLaneState(getMixerStateSnapshot(), index));
      renderMixerWorkspace();
    },
    onLaneRename(index, name) {
      applyMixerState(renameMixerLane(getMixerStateSnapshot(), index, name));
      renderMixerWorkspace();
    },
    onLaneVolumeChange(index, volume) {
      applyMixerState(setMixerLaneVolume(getMixerStateSnapshot(), index, volume));
      renderMixerWorkspace();
    },
    onLaneContextMenu: openMixerLaneContextMenu,
    onLaneAdd() {
      const state = appendMixerLane(getMixerStateSnapshot(), { kind: 'video' });
      applyMixerState(selectMixerLane(state, state.lanes.length - 1));
      renderMixerWorkspace();
    },
    onSeek(time) {
      setMixerPlayhead(time, { resyncPlayback: true });
    },
    onRulerContextMenu: openMixerRulerContextMenu
  });
}

async function hydrateSubtitleAsset(assetId, file) {
  if (!assetId || !file) return;
  try {
    const text = await file.text();
    const cues = parseSrtSubtitles(text);
    const timing = getSubtitleTrackTiming(cues);
    const duration = timing.duration;
    mixerState = {
      ...mixerState,
      assets: mixerState.assets.map((asset) => (
        asset.id === assetId
          ? {
            ...asset,
            duration,
            buffer: { ...(asset.buffer || {}), duration },
            mixerMeta: {
              ...(asset.mixerMeta || {}),
              kind: 'subtitle',
              cues,
              duration,
              trimStart: 0,
              trimEnd: duration,
              subtitleCueOrigin: timing.origin,
              subtitleStyle: asset.mixerMeta?.subtitleStyle || getGlobalSubtitleStyle(),
              hasAudio: false
            }
          }
          : asset
      )),
      tracks: mixerState.tracks.map((track) => {
        if (track.assetId !== assetId) return track;
        const trimStart = Math.max(0, Number(track.trimStart) || 0);
        return {
          ...track,
          kind: 'subtitle',
          duration,
          buffer: { ...(track.buffer || {}), duration },
          trimStart,
          trimEnd: Math.max(trimStart + 0.1, trimStart + duration),
          mixerMeta: {
            ...(track.mixerMeta || {}),
            kind: 'subtitle',
            cues,
            duration,
            trimStart: 0,
            trimEnd: duration,
            subtitleCueOrigin: timing.origin,
            subtitleStyle: track.mixerMeta?.subtitleStyle || getGlobalSubtitleStyle(),
            hasAudio: false
          }
        };
      })
    };
    renderMediaLibrary();
    renderMixerWorkspace();
  } catch (error) {
    setRenderStatus('Subtitle import failed.', 'danger', error.message);
  }
}

function addFilesToMediaLibrary(files, options = {}) {
  const assets = Array.from(files || []).map(makeAssetFromFile);
  if (!assets.length) return assets;
  let nextState = getMixerStateSnapshot();
  assets.forEach((asset) => {
    nextState = addMixerAsset(nextState, {
      ...asset,
      duration: asset.file === activeFile ? videoDuration : 0,
      buffer: { duration: asset.file === activeFile ? videoDuration || 5 : 5 },
      mixerMeta: getDefaultClipMeta(asset, { duration: asset.file === activeFile ? videoDuration || 5 : 5 })
    });
  });
  applyMixerState(nextState);
  assets
    .filter((asset) => asset.kind === 'subtitle')
    .forEach((asset) => hydrateSubtitleAsset(asset.id, asset.file));
  if (options.select && assets[0]) selectedLibraryAssetId = assets[0].id;
  if (options.addToMixer) assets.forEach((asset) => addAssetToMixer(asset, { rerender: false }));
  renderMediaLibrary();
  renderMixerWorkspace();
  return assets;
}

function renderMediaLibrary() {
  const host = container?.querySelector('#library-list');
  if (!host) return;
  const assets = getMediaLibrary();
  const dropMarkup = '<div id="library-dropzone" class="studio-library-dropzone">Drop media files here to import them into the library</div>';
  host.innerHTML = assets.length
    ? `${dropMarkup}${assets.map((asset) => `
      <div class="library-item${asset.id === selectedLibraryAssetId ? ' is-selected' : ''}" data-media-library-asset="${escapeHtml(asset.id)}" draggable="true">
        <div class="studio-library-item-info">
          <input type="text" value="${escapeHtml(asset.name)}" class="studio-library-item-name" data-media-library-name="${escapeHtml(asset.id)}">
          <span class="studio-library-item-meta">${escapeHtml(asset.kind)} · ${((asset.size || 0) / 1024 / 1024).toFixed(2)}MB</span>
        </div>
        <div class="studio-library-item-actions">
          <button class="mini-btn" type="button" data-media-library-edit="${escapeHtml(asset.id)}">Edit</button>
          <button class="mini-btn" type="button" data-media-library-duplicate="${escapeHtml(asset.id)}">Duplicate</button>
          <button class="mini-btn danger" type="button" data-media-library-remove="${escapeHtml(asset.id)}">Delete</button>
          <button class="btn-secondary studio-library-commit" type="button" data-media-library-add="${escapeHtml(asset.id)}">Add</button>
        </div>
      </div>
    `).join('')}`
    : `${dropMarkup}<div class="studio-library-empty">Your library is empty.</div>`;
  syncLibraryLaneTargetChrome();
  host.querySelectorAll('[data-media-library-asset]').forEach((item) => {
    item.addEventListener('click', () => {
      if (selectedLibraryAssetId !== item.dataset.mediaLibraryAsset) {
        libraryLaneOverride = false;
        libraryCreateLaneOnAdd = false;
      }
      selectedLibraryAssetId = item.dataset.mediaLibraryAsset;
      renderMediaLibrary();
    });
    item.addEventListener('dblclick', () => {
      const asset = getMediaLibrary().find((entry) => entry.id === item.dataset.mediaLibraryAsset);
      if (asset) addAssetToMixer(asset, getLibraryAddOptions(asset));
    });
    item.addEventListener('dragstart', (event) => {
      event.dataTransfer?.setData('application/x-sound-asset-id', item.dataset.mediaLibraryAsset);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
    });
  });
  host.querySelectorAll('[data-media-library-add]').forEach((button) => {
    button.addEventListener('click', () => {
      const asset = getMediaLibrary().find((entry) => entry.id === button.dataset.mediaLibraryAdd);
      if (asset) addAssetToMixer(asset, getLibraryAddOptions(asset));
    });
  });
  host.querySelectorAll('[data-media-library-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      beginLibraryAssetEdit(button.dataset.mediaLibraryEdit);
    });
  });
  host.querySelectorAll('[data-media-library-name]').forEach((input) => {
    input.addEventListener('change', () => {
      const assetId = input.dataset.mediaLibraryName;
      applyMixerState(renameMixerAsset(getMixerStateSnapshot(), assetId, input.value));
      applyMixerState(renameMixerAssetReferences(getMixerStateSnapshot(), assetId, input.value));
      renderMediaLibrary();
      renderMixerWorkspace();
    });
  });
  host.querySelectorAll('[data-media-library-duplicate]').forEach((button) => {
    button.addEventListener('click', () => {
      const asset = getMediaLibrary().find((entry) => entry.id === button.dataset.mediaLibraryDuplicate);
      if (!asset) return;
      const copy = {
        ...asset,
        id: `asset-${nextAssetIndex}`,
        name: `${asset.name} Copy`
      };
      nextAssetIndex += 1;
      applyMixerState(addMixerAsset(getMixerStateSnapshot(), copy));
      selectedLibraryAssetId = copy.id;
      renderMediaLibrary();
    });
  });
  host.querySelectorAll('[data-media-library-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      const assetId = button.dataset.mediaLibraryRemove;
      mixerState = {
        ...mixerState,
        assets: mixerState.assets.filter((asset) => asset.id !== assetId),
        tracks: mixerState.tracks.filter((track) => track.assetId !== assetId),
        selectedTrackId: mixerState.tracks.some((track) => track.id === mixerState.selectedTrackId && track.assetId !== assetId) ? mixerState.selectedTrackId : null,
        selectedTrackIds: getSelectedTrackIds().filter((trackId) => mixerState.tracks.some((track) => track.id === trackId && track.assetId !== assetId))
      };
      if (selectedLibraryAssetId === assetId) selectedLibraryAssetId = null;
      renderMediaLibrary();
      renderMixerWorkspace();
    });
  });
}

function openMediaLibrary() {
  container.querySelector('#modal-library')?.classList.add('active');
  renderMediaLibrary();
}

function closeMediaLibrary() {
  container.querySelector('#modal-library')?.classList.remove('active');
}

function getMixerDropEventPlacement(event) {
  const timeline = mixerController?.getTimelineContainer?.();
  const lanes = container?.querySelector('#studio-tracks-lanes');
  if (!timeline || !lanes) {
    return {
      laneIndex: mixerState.selectedLaneIndex,
      offset: studioCursorVisible ? studioCurrentPos : 0
    };
  }
  const timelineRect = timeline.getBoundingClientRect?.() || { left: 0 };
  const lanesRect = lanes.getBoundingClientRect?.() || { top: 0 };
  const firstLane = lanes.querySelector('.track-lane');
  const laneRect = firstLane?.getBoundingClientRect?.();
  return getMixerDropPlacement({
    clientX: event.clientX,
    clientY: event.clientY,
    timelineLeft: timelineRect.left,
    lanesTop: lanesRect.top,
    scrollLeft: timeline.scrollLeft,
    scale: mixerController?.getEffectiveScale?.() || studioTimelineScale,
    laneHeight: laneRect?.height || 156,
    laneCount: mixerState.lanes.length
  });
}

function setupMixerDropTargets() {
  const mixerShell = container.querySelector('#video-studio-mixer');
  const newLaneDrop = container.querySelector('#studio-new-lane-drop');
  const setHighlight = (active) => {
    mixerShell?.classList.toggle('is-drop-hover', !!active);
    newLaneDrop?.classList.toggle('active', !!active);
    container.querySelector('#studio-new-lane-drop-callout')?.classList.toggle('active', !!active);
  };
  mixerShell?.addEventListener('dragover', (event) => {
    event.preventDefault();
    mixerShell.classList.add('is-drop-hover');
  });
  mixerShell?.addEventListener('dragleave', () => mixerShell.classList.remove('is-drop-hover'));
  mixerShell?.addEventListener('drop', (event) => {
    event.preventDefault();
    mixerShell.classList.remove('is-drop-hover');
    const placement = getMixerDropEventPlacement(event);
    const assetId = event.dataTransfer?.getData('application/x-sound-asset-id');
    if (assetId) {
      const asset = getMediaLibrary().find((entry) => String(entry.id) === String(assetId));
      if (asset) addAssetToMixer(asset, { laneIndex: placement.laneIndex, offset: placement.offset });
      return;
    }
    addFilesToMediaLibrary(event.dataTransfer?.files, { select: true }).forEach((asset) => {
      addAssetToMixer(asset, { laneIndex: placement.laneIndex, offset: placement.offset });
    });
  });
  newLaneDrop?.addEventListener('dragover', (event) => {
    event.preventDefault();
    setHighlight(true);
  });
  newLaneDrop?.addEventListener('dragleave', () => setHighlight(false));
  newLaneDrop?.addEventListener('drop', (event) => {
    event.preventDefault();
    setHighlight(false);
    const assetId = event.dataTransfer?.getData('application/x-sound-asset-id');
    const assets = assetId
      ? getMediaLibrary().filter((asset) => String(asset.id) === String(assetId))
      : addFilesToMediaLibrary(event.dataTransfer?.files, { select: true });
    assets.forEach((asset) => {
      const state = appendMixerLane(getMixerStateSnapshot(), { kind: getClipKindForAsset(asset) === 'audio' ? 'audio' : 'video' });
      applyMixerState(selectMixerLane(state, state.lanes.length - 1));
      addAssetToMixer(asset, { laneIndex: mixerState.selectedLaneIndex, offset: 0 });
    });
  });
}

function addAssetToMixer(asset, options = {}) {
  const kind = options.kind || getClipKindForAsset(asset);
  let laneIndex = Number.isFinite(Number(options.laneIndex)) ? Number(options.laneIndex) : getTrackForKind(kind);
  if (options.createLane) {
    const state = appendMixerLane(getMixerStateSnapshot(), { kind: getLaneKindForAsset(asset) });
    laneIndex = state.lanes.length - 1;
    applyMixerState(selectMixerLane(state, laneIndex));
  }
  const duration = Math.max(0.1, Number(options.duration) || Number(asset.mixerMeta?.duration) || (kind === 'image' ? 4 : videoDuration || asset.duration || 5));
  const trimStart = Math.max(0, Number(options.trimStart ?? asset.mixerMeta?.trimStart) || 0);
  const trimEnd = Math.max(trimStart + 0.1, Number(options.trimEnd ?? asset.mixerMeta?.trimEnd) || (trimStart + duration));
  const trackAsset = getTrackAsset(asset, {
    kind,
    duration,
    trimEnd,
    meta: options.meta
  });
  applyMixerState(addMixerTrackState(getMixerStateSnapshot(), {
    asset: trackAsset,
    laneIndex,
    offset: Number.isFinite(Number(options.offset)) ? Number(options.offset) : -1,
    id: options.id || `clip-${nextClipIndex}`,
    trimStart,
    trimEnd,
    fadeIn: options.fadeIn ?? 0,
    fadeOut: options.fadeOut ?? 0,
    volumeAutomation: options.volumeAutomation || trackAsset.mixerMeta?.volumeAutomation
  }));
  nextClipIndex += 1;
  if (options.rerender !== false) renderMixerWorkspace();
}

function getEditorClipMeta(asset, kind = getClipKindForAsset(asset)) {
  const width = sanitizeNumber(container.querySelector('#media-scale-width')?.value || container.querySelector('#timeline-width')?.value, 1280, 2);
  const height = sanitizeNumber(container.querySelector('#media-scale-height')?.value || container.querySelector('#timeline-height')?.value, 720, 2);
  const canvasSize = getTimelineCanvasSize();
  const fitMode = ['fit', 'fill', 'exact'].includes(container.querySelector('#media-scale-mode')?.value)
    ? container.querySelector('#media-scale-mode').value
    : 'fit';
  const transform = getEditorTransformOptions();
  const editingTrack = editingTrackId ? mixerState.tracks.find((track) => track.id === editingTrackId) : null;
  return {
    ...getDefaultClipMeta(asset, { kind, duration: videoDuration || 5 }),
    crop: kind === 'audio' ? null : container._getCropRect?.(),
    width: kind === 'audio' ? 2 : width,
    height: kind === 'audio' ? 2 : height,
    canvasWidth: kind === 'audio' ? 2 : canvasSize.width,
    canvasHeight: kind === 'audio' ? 2 : canvasSize.height,
    canvasFit: kind !== 'audio' && width === canvasSize.width && height === canvasSize.height,
    fitMode,
    brightness: Number(container.querySelector('#fx-bright')?.value) || 0,
    contrast: Number(container.querySelector('#fx-contrast')?.value) || 1,
    saturation: Number(container.querySelector('#fx-sat')?.value) || 1,
    gamma: Number(container.querySelector('#fx-gamma')?.value) || 1,
    noise: Number(container.querySelector('#fx-grain')?.value) || 0,
    filmGrain: getEditorFilmGrainOptions(),
    sharpen: Number(container.querySelector('#fx-sharpen')?.value) || 0,
    denoise: Number(container.querySelector('#fx-denoise')?.value) || 0,
    rotate: kind === 'audio' ? 0 : transform.rotate,
    speed: transform.speed,
    reverse: editingTrack?.mixerMeta?.reverse ?? editingTrack?.reverse ?? false,
    volume: sanitizeNumber(container.querySelector('#master-vol')?.value, 100, 0, 300) / 100,
    volumeAutomation: normalizeEditorVolumeEnvelope()
  };
}

function beginMixerClipEdit(trackId) {
  const track = mixerState.tracks.find((entry) => entry.id === trackId);
  const asset = mixerState.assets.find((entry) => entry.id === track?.assetId);
  if (track?.kind === 'subtitle' || track?.mixerMeta?.kind === 'subtitle') {
    applyMixerState(selectMixerTrack(getMixerStateSnapshot(), trackId));
    renderMixerWorkspace();
    openSubtitleEditorModal(trackId);
    return;
  }
  if (track?.kind === 'color' || track?.mixerMeta?.kind === 'color') {
    applyMixerState(selectMixerTrack(getMixerStateSnapshot(), trackId));
    renderMixerWorkspace();
    openSolidColorDialog(trackId);
    return;
  }
  if (!track || !asset?.file) {
    applyMixerState(selectMixerTrack(getMixerStateSnapshot(), trackId));
    renderMixerWorkspace();
    openTrackProperties();
    return;
  }
  applyMixerState(selectMixerTrack(getMixerStateSnapshot(), trackId));
  renderMixerWorkspace();
  loadEditorFile(asset.file, { addToLibrary: false, trackId, assetId: asset.id });
}

function beginLibraryAssetEdit(assetId) {
  const asset = getMediaLibrary().find((entry) => entry.id === assetId);
  if (!asset?.file) return;
  selectedLibraryAssetId = asset.id;
  closeMediaLibrary();
  loadEditorFile(asset.file, { addToLibrary: false, assetId: asset.id });
}

function cancelEditorClipEdit() {
  const wasEditing = Boolean(editingTrackId);
  clearEditorSource();
  syncEditorCommitChrome();
  setRenderStatus(wasEditing ? 'Clip edit discarded.' : 'Editor source discarded.', 'neutral', '', 1200);
}

function commitEditorClipToMixer() {
  if (!activeFile) {
    setRenderStatus('Load source media first.', 'danger', 'Drop or import a source before adding it to the mixer.');
    return;
  }
  const asset = getMediaLibrary().find((entry) => entry.file === activeFile)
    || getMediaLibrary().find((entry) => entry.id === editingAssetId)
    || addFilesToMediaLibrary([activeFile], { select: true })[0];
  const kind = getClipKindForAsset(asset);
  const start = kind === 'audio' ? 0 : startVal;
  const end = Math.max(start + 0.1, kind === 'audio' ? videoDuration || 5 : endVal || start + 5);
  const meta = getEditorClipMeta(asset, kind);
  if (editingTrackId) {
    updateMixerTrack(editingTrackId, (track) => ({
      ...track,
      file: activeFile,
      fileName: activeFile.name || track.fileName,
      name: meta.name || track.name,
      kind,
      buffer: { duration: videoDuration || end },
      duration: videoDuration || end,
      trimStart: start,
      trimEnd: end,
      volume: Number(meta.volume) || track.volume || 1,
      volumeAutomation: meta.volumeAutomation,
      mixerMeta: {
        ...(track.mixerMeta || {}),
        ...meta,
        file: activeFile,
        fileName: activeFile.name || track.fileName,
        duration: videoDuration || end
      }
    }));
    setRenderStatus('Mixer clip updated.', 'success', activeFile.name || '', 1500);
  } else {
    addAssetToMixer(asset, {
      duration: videoDuration || end,
      trimStart: start,
      trimEnd: end,
      volumeAutomation: meta.volumeAutomation,
      meta
    });
    setRenderStatus('Clip added to mixer.', 'success', activeFile.name || '', 1500);
  }
  editingTrackId = null;
  editingAssetId = asset.id;
  syncEditorCommitChrome();
  renderMixerWorkspace();
  clearEditorSource();
}

function addCurrentClipToMixer() {
  commitEditorClipToMixer();
}

function addColorClipToMixer(color, options = {}) {
  const duration = sanitizeNumber(options.duration ?? container.querySelector('#timeline-color-duration')?.value, 2, 0.1);
  const selectedColor = color || container.querySelector('#timeline-color')?.value || '#111111';
  const width = sanitizeNumber(options.width ?? container.querySelector('#timeline-width')?.value, 1280, 2);
  const height = sanitizeNumber(options.height ?? container.querySelector('#timeline-height')?.value, 720, 2);
  const laneIndex = Number.isFinite(Number(options.laneIndex)) ? Number(options.laneIndex) : mixerState.selectedLaneIndex;
  const trackId = `clip-${nextClipIndex}`;
  addAssetToMixer({
    id: `asset-color-${nextAssetIndex}`,
    name: 'Solid Color',
    kind: 'color',
    file: null,
    size: 0
  }, {
    kind: 'color',
    duration,
    trimStart: 0,
    trimEnd: duration,
    laneIndex,
    id: trackId,
    meta: {
      color: selectedColor,
      width,
      height,
      canvasFit: options.width === undefined && options.height === undefined,
      hasAudio: false
    }
  });
  nextAssetIndex += 1;
  applyMixerState(selectMixerTrack(getMixerStateSnapshot(), trackId));
  renderMixerWorkspace();
  return trackId;
}

function syncSolidColorLaneSelect() {
  const select = container?.querySelector('#solid-color-lane');
  if (!select) return;
  select.innerHTML = '';
  mixerState.lanes.forEach((lane, index) => {
    const option = select.ownerDocument.createElement('option');
    option.value = String(index);
    option.textContent = lane.name || `Lane ${index + 1}`;
    select.appendChild(option);
  });
}

function openSolidColorDialog(trackId = null) {
  solidColorEditTrackId = trackId;
  syncSolidColorLaneSelect();
  const track = trackId ? mixerState.tracks.find((entry) => entry.id === trackId) : null;
  const clip = track ? getEditableClip(track) : null;
  const colorInput = container.querySelector('#solid-color-value');
  const durationInput = container.querySelector('#solid-color-duration');
  const widthInput = container.querySelector('#solid-color-width');
  const heightInput = container.querySelector('#solid-color-height');
  const laneInput = container.querySelector('#solid-color-lane');
  if (colorInput) colorInput.value = clip?.color || container.querySelector('#timeline-color')?.value || '#111111';
  if (durationInput) durationInput.value = String(clip?.duration || container.querySelector('#timeline-color-duration')?.value || 2);
  if (widthInput) widthInput.value = String(clip?.width || container.querySelector('#timeline-width')?.value || 1280);
  if (heightInput) heightInput.value = String(clip?.height || container.querySelector('#timeline-height')?.value || 720);
  if (laneInput) laneInput.value = String(track?.laneIndex ?? mixerState.selectedLaneIndex);
  container.querySelector('#modal-solid-color')?.classList.add('active');
}

function closeSolidColorDialog() {
  solidColorEditTrackId = null;
  container.querySelector('#modal-solid-color')?.classList.remove('active');
}

function applySolidColorDialog() {
  const color = container.querySelector('#solid-color-value')?.value || '#111111';
  const duration = sanitizeNumber(container.querySelector('#solid-color-duration')?.value, 2, 0.1);
  const width = sanitizeNumber(container.querySelector('#solid-color-width')?.value, 1280, 2);
  const height = sanitizeNumber(container.querySelector('#solid-color-height')?.value, 720, 2);
  const laneIndex = Math.max(0, Number(container.querySelector('#solid-color-lane')?.value) || 0);
  const timelineDuration = container.querySelector('#timeline-color-duration');
  if (timelineDuration) timelineDuration.value = String(duration);
  if (solidColorEditTrackId) {
    updateMixerTrack(solidColorEditTrackId, (track) => ({
      ...track,
      kind: 'color',
      laneIndex,
      trimEnd: (Number(track.trimStart) || 0) + duration,
      buffer: { duration },
      duration,
      mixerMeta: {
        ...(track.mixerMeta || {}),
        kind: 'color',
        color,
        width,
        height,
        canvasFit: false,
        duration,
        hasAudio: false
      }
    }));
    applyMixerState(selectMixerTrack(getMixerStateSnapshot(), solidColorEditTrackId));
    renderMixerWorkspace();
  } else {
    addColorClipToMixer(color, { duration, width, height, laneIndex });
  }
  closeSolidColorDialog();
}

function renderMixerWorkspace() {
  if (!container) return;
  const hasContent = mixerState.tracks.length > 0;
  mixerController?.root?.classList.remove('is-hidden');
  container.querySelector('#studio-empty-msg')?.classList.toggle('is-hidden', hasContent);
  mixerController?.updateState(getMixerStateSnapshot());
  syncMixerPlaybackChrome();
  if (mixerZoomFollowsFit) fitMixerTimeline();
  syncMixerZoomSelectionChrome();
  syncMixerMultiSelectionChrome();
  syncStudioSummaryChrome();
  syncLibraryLaneTargetChrome();
  syncVideoSettingsVisibility();
  renderMixerInspector();
  renderMixerCompositionPreview(studioCurrentPos);
  updateMixerPlanPreview();
}

function renderMixerInspector() {
  const host = container?.querySelector('#media-mixer-inspector-fields');
  if (!host) return;
  mixerInspectorGrid?.destroy();
  mixerInspectorGrid = null;
  const clip = getEditableClip();
  if (!clip) {
    host.innerHTML = '<div class="media-transcoder-plan-empty">Select or add a clip.</div>';
    return;
  }

  function option(value, label) {
    return { value, label: label || value };
  }

  function propertyGroup(title, trackPropertyGroup, fields, className = '') {
    return {
      title,
      className: `video-studio-track-property-group${className ? ` ${className}` : ''}`,
      titleClassName: 'video-studio-track-property-group-title',
      dataset: { trackPropertyGroup },
      fields
    };
  }

  function getMixerInspectorSections(targetClip, targetIsVisual) {
    const sections = [
      propertyGroup('Timing', 'timing', [
        { key: 'name', label: 'Name', type: 'text', value: targetClip.name || '' },
        { key: 'start', label: 'Start', type: 'number', value: targetClip.start, min: 0, step: 0.1 },
        { key: 'duration', label: 'Duration', type: 'number', value: targetClip.duration, min: 0.1, step: 0.1 },
        { key: 'trimStart', label: 'Trim Start', type: 'number', value: targetClip.trimStart, min: 0, step: 0.1 },
        { key: 'trimEnd', label: 'Trim End', type: 'number', value: targetClip.trimEnd, min: 0.1, step: 0.1 },
        ...(targetClip.kind === 'subtitle' ? [] : [
          { key: 'speed', label: 'Speed', type: 'number', value: targetClip.speed ?? 1, min: 0.25, max: 4, step: 0.05 },
          { key: 'reverse', label: 'Reverse', type: 'toggle', id: 'mixer-clip-reverse', value: Boolean(targetClip.reverse) }
        ])
      ])
    ];
    if (targetIsVisual) {
      sections.push(
        propertyGroup('Placement', 'placement', [
          { key: 'x', label: 'X', type: 'number', value: targetClip.x, step: 1 },
          { key: 'y', label: 'Y', type: 'number', value: targetClip.y, step: 1 },
          { key: 'width', label: 'Width', type: 'number', value: targetClip.width, min: 2, step: 2 },
          { key: 'height', label: 'Height', type: 'number', value: targetClip.height, min: 2, step: 2 },
          { key: 'fitMode', label: 'Fit', type: 'select', value: targetClip.fitMode || 'fit', options: [option('fit', 'Fit'), option('fill', 'Fill'), option('exact', 'Exact')] },
          { key: 'rotate', label: 'Rotate', type: 'number', value: targetClip.rotate ?? 0, step: 1 }
        ]),
        propertyGroup('Visual', 'visual', [
          { key: 'opacity', label: 'Opacity', type: 'number', value: targetClip.opacity, min: 0, max: 1, step: 0.05 },
          { key: 'blendMode', label: 'Blend', type: 'select', value: targetClip.blendMode || 'normal', options: [option('normal', 'Normal'), option('multiply', 'Multiply'), option('screen', 'Screen'), option('overlay', 'Overlay')] },
          { key: 'brightness', label: 'Brightness', type: 'number', value: targetClip.brightness ?? 0, min: -1, max: 1, step: 0.05 },
          { key: 'contrast', label: 'Contrast', type: 'number', value: targetClip.contrast ?? 1, min: 0, max: 3, step: 0.05 },
          { key: 'saturation', label: 'Saturation', type: 'number', value: targetClip.saturation ?? 1, min: 0, max: 3, step: 0.05 },
          { key: 'gamma', label: 'Gamma', type: 'number', value: targetClip.gamma ?? 1, min: 0.1, max: 10, step: 0.1 }
        ]),
        propertyGroup('Keying', 'keying', [
          { key: 'chromaKeyEnabled', label: 'Chroma', type: 'select', value: targetClip.chromaKey ? 'on' : 'off', options: [option('off', 'Off'), option('on', 'On')] },
          { key: 'chromaKeyColor', label: 'Key Color', type: 'color', value: targetClip.chromaKey?.color || '#00ff00' },
          { key: 'chromaKeySimilarity', label: 'Similarity', type: 'number', value: targetClip.chromaKey?.similarity ?? 0.18, min: 0.01, max: 1, step: 0.01 },
          { key: 'chromaKeyBlend', label: 'Key Blend', type: 'number', value: targetClip.chromaKey?.blend ?? 0.08, min: 0, max: 1, step: 0.01 }
        ])
      );
    }
    sections.push(propertyGroup('Audio', 'audio', [
      { key: 'volume', label: 'Volume', type: 'number', value: targetClip.volume, min: 0, max: 4, step: 0.05 },
      { key: 'fadeIn', label: 'Fade In', type: 'number', value: targetClip.fadeIn, min: 0, step: 0.1 },
      { key: 'fadeOut', label: 'Fade Out', type: 'number', value: targetClip.fadeOut, min: 0, step: 0.1 }
    ]));
    if (targetIsVisual) {
      sections.push(propertyGroup('Effects', 'effects', [
        { key: 'noise', label: 'Grain', type: 'number', value: targetClip.noise ?? targetClip.filmGrain?.strength ?? 0, min: 0, max: 100, step: 1 },
        { key: 'filmGrainPreset', label: 'Grain Preset', type: 'select', value: targetClip.filmGrain?.preset || 'off', options: ['off', 'standard-film', 'gritty-bw', 'digital-iso', 'av1-synthesis', 'custom'].map((value) => option(value, value === 'off' ? 'Off' : value)) },
        { key: 'sharpen', label: 'Sharpen', type: 'number', value: targetClip.sharpen ?? 0, min: 0, max: 2, step: 0.05 },
        { key: 'denoise', label: 'Denoise', type: 'number', value: targetClip.denoise ?? 0, min: 0, max: 12, step: 0.5 },
        { key: 'blur', label: 'Blur', type: 'number', value: targetClip.blur ?? 0, min: 0, max: 64, step: 0.5 },
        ...(targetClip.kind === 'color' ? [{ key: 'color', label: 'Color', type: 'color', value: targetClip.color || '#111111' }] : [])
      ]));
    }
    return sections;
  }

  function applyMixerInspectorChange({ key: field, value }) {
    let updates = null;
    if (field === 'chromaKeyEnabled') {
      updates = {
        chromaKey: value === 'on'
          ? (clip.chromaKey || { color: '#00ff00', similarity: 0.18, blend: 0.08 })
          : null
      };
    } else if (field === 'chromaKeyColor' || field === 'chromaKeySimilarity' || field === 'chromaKeyBlend') {
      const key = field === 'chromaKeyColor' ? 'color' : field === 'chromaKeySimilarity' ? 'similarity' : 'blend';
      updates = {
        chromaKey: {
          ...(clip.chromaKey || { color: '#00ff00', similarity: 0.18, blend: 0.08 }),
          [key]: key === 'color' ? value : Number(value)
        }
      };
    } else if (field === 'filmGrainPreset') {
      updates = {
        filmGrain: {
          ...(clip.filmGrain || {}),
          preset: value,
          strength: Number(clip.noise ?? clip.filmGrain?.strength) || 0
        }
      };
    } else if (field === 'noise') {
      const strength = Number(value) || 0;
      updates = {
        noise: strength,
        filmGrain: {
          ...(clip.filmGrain || {}),
          preset: strength > 0 && (!clip.filmGrain?.preset || clip.filmGrain.preset === 'off') ? 'custom' : clip.filmGrain?.preset || 'off',
          strength,
          lumaStrength: clip.filmGrain?.lumaStrength ?? strength,
          chromaStrength: clip.filmGrain?.chromaStrength ?? strength
        }
      };
    } else {
      updates = { [field]: value };
    }
    if (['x', 'y', 'width', 'height'].includes(field)) updates.canvasFit = false;
    if (field === 'name') {
      updateMixerTrack(clip.id, (track) => ({
        ...track,
        name: String(value || '').trim() || track.name,
        mixerMeta: { ...(track.mixerMeta || {}), name: String(value || '').trim() || track.name }
      }));
    } else if (field === 'start') {
      applyMixerState(moveMixerTrack(getMixerStateSnapshot(), { trackId: clip.id, offset: Number(value) || 0 }));
    } else if (field === 'trimStart') {
      applyMixerState(trimMixerTrackStart(getMixerStateSnapshot(), { trackId: clip.id, trimStart: Number(value) || 0 }));
    } else if (field === 'trimEnd') {
      applyMixerState(trimMixerTrackEnd(getMixerStateSnapshot(), { trackId: clip.id, trimEnd: Number(value) || 0 }));
    } else if (field === 'duration') {
      const track = getSelectedClip();
      const trimStart = Number(track?.trimStart) || 0;
      applyMixerState(trimMixerTrackEnd(getMixerStateSnapshot(), { trackId: clip.id, trimEnd: trimStart + Math.max(0.1, Number(value) || 0.1) }));
    } else if (field === 'volume') {
      applyMixerState(setMixerTrackVolume(getMixerStateSnapshot(), clip.id, Number(value) || 0));
    } else if (field === 'fadeIn' || field === 'fadeOut') {
      updateMixerTrack(clip.id, (track) => ({ ...track, [field]: Math.max(0, Number(value) || 0) }));
    } else {
      updateMixerTrack(clip.id, (track) => ({
        ...track,
        mixerMeta: {
          ...(track.mixerMeta || {}),
          ...updates
        }
      }));
    }
    renderMixerWorkspace();
  }

  const isSubtitle = clip.kind === 'subtitle';
  const isVisual = clip.kind !== 'audio' && !isSubtitle;
  mixerInspectorGrid = createPropertyGrid(host, {
    useParent: true,
    rootClassName: 'shared-property-grid',
    sections: getMixerInspectorSections(clip, isVisual),
    onChange: applyMixerInspectorChange
  });
  if (isSubtitle) {
    const cueCount = Array.isArray(clip.cues) ? clip.cues.length : 0;
    const section = host.ownerDocument.createElement('section');
    section.className = 'shared-property-section video-studio-track-property-group is-wide';
    section.setAttribute('data-track-property-group', 'subtitles');
    const title = host.ownerDocument.createElement('div');
    title.className = 'video-studio-track-property-group-title';
    title.textContent = 'Subtitles';
    const summary = host.ownerDocument.createElement('div');
    summary.className = 'media-transcoder-plan-empty';
    summary.textContent = `${cueCount} cue${cueCount === 1 ? '' : 's'} on this subtitle track.`;
    const button = host.ownerDocument.createElement('button');
    button.id = 'btn-mixer-subtitle-edit';
    button.type = 'button';
    button.className = 'btn-secondary';
    button.textContent = 'Edit Subtitle Track';
    button.addEventListener('click', () => openSubtitleEditorModal(clip.id));
    section.appendChild(title);
    section.appendChild(summary);
    section.appendChild(button);
    host.appendChild(section);
  }
}

function duplicateSelectedMixerClip() {
  const clip = getSelectedClip();
  if (!clip) return;
  duplicateMixerClip(clip.id);
}

function duplicateMixerClip(trackId) {
  const sourceTrack = mixerState.tracks.find((track) => track.id === trackId);
  if (!sourceTrack) return;
  const asset = mixerState.assets.find((entry) => entry.id === sourceTrack.assetId) || {
    id: sourceTrack.assetId,
    name: sourceTrack.name,
    buffer: sourceTrack.buffer,
    kind: sourceTrack.kind,
    file: sourceTrack.file,
    mixerMeta: sourceTrack.mixerMeta
  };
  applyMixerState(duplicateMixerTrackState(getMixerStateSnapshot(), { trackId: sourceTrack.id, asset }));
  renderMixerWorkspace();
}

function splitSelectedMixerClip() {
  const clip = getEditableClip();
  if (!clip) return;
  const splitAt = studioCursorVisible && studioCurrentPos > clip.start && studioCurrentPos < clip.start + clip.duration
    ? studioCurrentPos
    : clip.start + (clip.duration / 2);
  applyMixerState(splitMixerTrackState(getMixerStateSnapshot(), { trackId: clip.id, time: splitAt }));
  renderMixerWorkspace();
}

function removeSelectedMixerClip() {
  const clip = getSelectedClip();
  if (!clip) return;
  applyMixerState(removeMixerTrackState(getMixerStateSnapshot(), clip.id));
  renderMixerWorkspace();
}

function openSelectedMixerProperties() {
  const ids = getSelectedTrackIds();
  if (ids.length !== 1) return;
  applyMixerState(selectMixerTrack(getMixerStateSnapshot(), ids[0]));
  renderMixerWorkspace();
  openTrackProperties();
}

function deleteSelectedMixerTracks() {
  const ids = getSelectedTrackIds();
  if (!ids.length) return;
  applyMixerState(ids.length === 1
    ? removeMixerTrackState(getMixerStateSnapshot(), ids[0])
    : removeMixerTracksState(getMixerStateSnapshot(), ids));
  renderMixerWorkspace();
  setRenderStatus('Selected clips deleted.', 'neutral', `${ids.length} clip${ids.length === 1 ? '' : 's'}`, 1400);
}

function openSelectedTrackSequenceDialog() {
  if (getSelectedTrackIds().length <= 1) return;
  const input = container.querySelector('#sequence-crossfade');
  if (input) input.value = '0';
  container.querySelector('#modal-sequence-selected')?.classList.add('active');
}

function closeSelectedTrackSequenceDialog() {
  container.querySelector('#modal-sequence-selected')?.classList.remove('active');
}

function applySelectedTrackSequence() {
  const ids = getSelectedTrackIds();
  if (ids.length <= 1) {
    closeSelectedTrackSequenceDialog();
    return;
  }
  const crossfadeDuration = sanitizeNumber(container.querySelector('#sequence-crossfade')?.value, 0, 0);
  applyMixerState(sequenceMixerTracks(getMixerStateSnapshot(), ids, { crossfadeDuration }));
  closeSelectedTrackSequenceDialog();
  renderMixerWorkspace();
  setRenderStatus('Selected clips sequenced.', 'success', crossfadeDuration > 0 ? `${crossfadeDuration.toFixed(1)}s crossfade` : 'No crossfade', 1600);
}

function openMixerTrackContextMenu({ trackId, time, x, y } = {}) {
  const track = mixerState.tracks.find((entry) => entry.id === trackId);
  if (!track) return;
  videoStudioContextMenu?.open({
    x,
    y,
    items: [
      {
        id: 'select-track',
        label: 'Select Clip',
        onSelect() {
          applyMixerState(selectMixerTrack(getMixerStateSnapshot(), trackId));
          renderMixerWorkspace();
        }
      },
      {
        id: 'track-properties',
        label: 'Track Properties',
        onSelect() {
          applyMixerState(selectMixerTrack(getMixerStateSnapshot(), trackId));
          renderMixerWorkspace();
          openTrackProperties();
        }
      },
      {
        id: 'reverse-track',
        label: track.mixerMeta?.reverse ? 'Clear Reverse' : 'Reverse Track',
        onSelect() {
          updateMixerTrack(trackId, (entry) => ({
            ...entry,
            mixerMeta: {
              ...(entry.mixerMeta || {}),
              reverse: !(entry.mixerMeta?.reverse ?? entry.reverse ?? false)
            }
          }));
          applyMixerState(selectMixerTrack(getMixerStateSnapshot(), trackId));
          renderMixerWorkspace();
        }
      },
      {
        id: 'duplicate-track',
        label: 'Duplicate Clip',
        onSelect() {
          duplicateMixerClip(trackId);
        }
      },
      {
        id: 'split-track',
        label: 'Split Clip Here',
        onSelect() {
          applyMixerState(splitMixerTrackState(getMixerStateSnapshot(), { trackId, time }));
          renderMixerWorkspace();
        }
      },
      {
        id: 'move-playhead',
        label: 'Move Playhead Here',
        onSelect() {
          setMixerPlayhead(time);
        }
      },
      { separator: true },
      {
        id: 'remove-track',
        label: 'Remove Clip',
        danger: true,
        onSelect() {
          applyMixerState(removeMixerTrackState(getMixerStateSnapshot(), trackId));
          renderMixerWorkspace();
        }
      }
    ]
  });
}

function openMixerLaneContextMenu({ laneIndex, x, y } = {}) {
  const lane = mixerState.lanes[laneIndex];
  if (!lane) return;
  videoStudioContextMenu?.open({
    x,
    y,
    items: [
      {
        id: 'select-lane',
        label: 'Select Lane',
        onSelect() {
          applyMixerState(selectMixerLane(getMixerStateSnapshot(), laneIndex));
          renderMixerWorkspace();
        }
      },
      {
        id: 'duplicate-lane',
        label: 'Duplicate Lane',
        onSelect() {
          applyMixerState(duplicateMixerLane(getMixerStateSnapshot(), { laneIndex }));
          renderMixerWorkspace();
        }
      },
      {
        id: 'clear-lane',
        label: 'Clear Lane',
        onSelect() {
          applyMixerState(clearMixerLaneTracks(getMixerStateSnapshot(), laneIndex));
          renderMixerWorkspace();
        }
      },
      {
        id: 'mute-lane',
        label: lane.muted ? 'Unmute Lane' : 'Mute Lane',
        onSelect() {
          applyMixerState(toggleMixerLaneMute(getMixerStateSnapshot(), laneIndex));
          renderMixerWorkspace();
        }
      },
      {
        id: 'solo-lane',
        label: lane.soloed ? 'Clear Solo' : 'Solo Lane',
        onSelect() {
          applyMixerState(toggleMixerLaneSolo(getMixerStateSnapshot(), laneIndex));
          renderMixerWorkspace();
        }
      },
      { separator: true },
      {
        id: 'add-lane',
        label: 'Add Lane',
        onSelect() {
          const state = appendMixerLane(getMixerStateSnapshot(), { kind: 'video' });
          applyMixerState(selectMixerLane(state, state.lanes.length - 1));
          renderMixerWorkspace();
        }
      },
      {
        id: 'remove-lane',
        label: 'Remove Lane',
        danger: true,
        disabled: mixerState.lanes.length <= 1,
        onSelect() {
          applyMixerState(removeMixerLaneState(getMixerStateSnapshot(), laneIndex));
          renderMixerWorkspace();
        }
      }
    ]
  });
}

function openMixerCrossfadeContextMenu({ trackId, x, y } = {}) {
  const track = mixerState.tracks.find((entry) => entry.id === trackId);
  if (!track) return;
  videoStudioContextMenu?.open({
    x,
    y,
    items: ['linear', 'equal-power', 'logarithmic'].map((mode) => ({
      id: `crossfade-${mode}`,
      label: mode === 'equal-power' ? 'Equal Power' : mode === 'logarithmic' ? 'Logarithmic' : 'Linear',
      disabled: (track.fadeStyle || 'linear') === mode,
      onSelect() {
        applyMixerState(setMixerTrackFadeStyle(getMixerStateSnapshot(), trackId, mode));
        renderMixerWorkspace();
      }
    }))
  });
}

function openMixerRulerContextMenu({ time, x, y } = {}) {
  videoStudioContextMenu?.open({
    x,
    y,
    items: [
      {
        id: 'move-playhead',
        label: 'Move Playhead Here',
        onSelect() {
          setMixerPlayhead(time);
        }
      },
      {
        id: 'split-selected',
        label: mixerState.selectedTrackId ? 'Split Selected Clip Here' : 'No Clip Selected',
        disabled: !mixerState.selectedTrackId,
        onSelect() {
          applyMixerState(splitMixerTrackState(getMixerStateSnapshot(), { trackId: mixerState.selectedTrackId, time }));
          renderMixerWorkspace();
        }
      },
      {
        id: 'fit-timeline',
        label: 'Fit Timeline',
        onSelect() {
          fitMixerTimeline();
        }
      }
    ]
  });
}

async function buildMixerPlanFromState({ includeBuffers = false, outputName = 'mixer_export.mp4' } = {}) {
  const tracks = await getMixerCompositionTracksWithBuffers(includeBuffers);
  const subtitleStyle = getGlobalSubtitleStyle();
  const renderDuration = tracks.length ? getMixerRenderDurationFromTracks(tracks) : getSubtitleCueDuration(subtitleCues);
  const settings = {
    ...getTimelineSettings(),
    outputName,
    duration: renderDuration,
    tracks,
    subtitles: subtitleCues.length ? {
      cues: subtitleCues,
      color: subtitleStyle.color,
      fontFamily: subtitleStyle.fontFamily,
      fontSize: subtitleStyle.fontSize,
      outline: subtitleStyle.outline,
      fileName: 'mixer_subtitles.srt'
    } : null
  };
  const flattenedClips = tracks.flatMap((track) => track.clips || []);
  if (shouldUseSequentialChain(flattenedClips)) {
    return buildMediaSequentialChainPlan(settings);
  }
  return buildMediaMixerPlan(settings);
}

function getCommandSequenceSignature(plan) {
  return (Array.isArray(plan.commandSequence) ? plan.commandSequence : [])
    .map((step) => `${step.stage || ''}|${step.name || ''}|${(step.command || []).join('\u0001')}|${step.outputFileName || ''}`)
    .join('\u0002');
}

function getCommandText(command = []) {
  return (Array.isArray(command) ? command : []).join(' ');
}

function createMixerCommandSequenceDraft(plan) {
  return (Array.isArray(plan.commandSequence) ? plan.commandSequence : []).map((step, index) => {
    const commandText = getCommandText(step.command);
    return {
      stage: step.stage || '',
      name: step.name || `Command ${index + 1}`,
      commandText,
      baseCommandText: commandText,
      outputFileName: step.outputFileName || step.command?.at?.(-1) || '',
      keepOutput: step.keepOutput === true,
      deleted: false
    };
  });
}

function ensureMixerCommandSequenceDraft(plan) {
  const signature = getCommandSequenceSignature(plan);
  if (!Array.isArray(plan.commandSequence) || !plan.commandSequence.length) {
    mixerCommandSequenceDraft = [];
    mixerCommandSequenceSignature = '';
    mixerCommandSequenceActive = false;
    mixerCommandSequenceDirty = false;
    return;
  }
  if (!mixerCommandSequenceDraft.length || (!mixerCommandSequenceDirty && signature !== mixerCommandSequenceSignature)) {
    mixerCommandSequenceDraft = createMixerCommandSequenceDraft(plan);
    mixerCommandSequenceSignature = signature;
    mixerCommandSequenceActive = false;
    mixerCommandSequenceDirty = false;
  }
}

function applyMixerCommandSequenceDraft(plan) {
  if (!Array.isArray(plan.commandSequence) || !plan.commandSequence.length) return plan;
  ensureMixerCommandSequenceDraft(plan);
  if (!mixerCommandSequenceActive && !mixerCommandSequenceDirty) return plan;
  return applyMediaCommandSequenceDraft(plan, mixerCommandSequenceDraft);
}

function openCommandStepModal(index) {
  activeCommandStepIndex = index;
  const step = mixerCommandSequenceDraft[index];
  if (!step) return;
  const title = container.querySelector('#command-step-title');
  const note = container.querySelector('#command-step-note');
  const editor = container.querySelector('#command-step-editor');
  const status = container.querySelector('#command-step-status');
  const deleteButton = container.querySelector('#btn-command-step-delete');
  if (title) title.textContent = `${step.stage ? `${step.stage} ` : ''}${step.name || `Command ${index + 1}`}`.trim();
  if (note) note.textContent = step.outputFileName ? `Output: ${step.outputFileName}` : 'Edit one FFmpeg execution in the render chain.';
  if (editor) editor.value = step.commandText || '';
  if (status) status.textContent = step.deleted ? 'This command is marked for deletion.' : '';
  if (deleteButton) deleteButton.disabled = mixerCommandSequenceDraft.filter((entry) => !entry.deleted).length <= 1;
  container.querySelector('#modal-command-step')?.classList.add('active');
}

function closeCommandStepModal() {
  container.querySelector('#modal-command-step')?.classList.remove('active');
  activeCommandStepIndex = null;
  updateMixerPlanPreview();
}

function updateActiveCommandStepDraft(event) {
  if (!Number.isInteger(activeCommandStepIndex)) return;
  const step = mixerCommandSequenceDraft[activeCommandStepIndex];
  if (!step) return;
  step.commandText = event.target.value;
  step.deleted = false;
  step.outputFileName = getMediaFfmpegCommandOutputName(step.commandText) || step.outputFileName;
  mixerCommandSequenceActive = true;
  mixerCommandSequenceDirty = true;
  const status = container.querySelector('#command-step-status');
  if (status) status.textContent = 'Arguments edited. This command will be used on render.';
}

function deleteActiveCommandStep() {
  if (!Number.isInteger(activeCommandStepIndex)) return;
  if (mixerCommandSequenceDraft.filter((entry) => !entry.deleted).length <= 1) return;
  const step = mixerCommandSequenceDraft[activeCommandStepIndex];
  if (!step) return;
  step.deleted = true;
  mixerCommandSequenceActive = true;
  mixerCommandSequenceDirty = true;
  closeCommandStepModal();
}

function restoreActiveCommandStep() {
  if (!Number.isInteger(activeCommandStepIndex)) return;
  const step = mixerCommandSequenceDraft[activeCommandStepIndex];
  if (!step) return;
  step.commandText = step.baseCommandText || step.commandText;
  step.deleted = false;
  step.outputFileName = getMediaFfmpegCommandOutputName(step.commandText) || step.outputFileName;
  mixerCommandSequenceActive = true;
  mixerCommandSequenceDirty = true;
  openCommandStepModal(activeCommandStepIndex);
}

function addCommandStepDraft() {
  const index = mixerCommandSequenceDraft.length;
  const previousOutput = [...mixerCommandSequenceDraft].reverse().find((entry) => !entry.deleted)?.outputFileName || 'stage_b_composite.mkv';
  const outputFileName = `custom_stage_${index + 1}.mkv`;
  mixerCommandSequenceDraft.push({
    stage: 'Custom',
    name: `Command ${index + 1}`,
    commandText: `-y -i ${previousOutput} ${outputFileName}`,
    baseCommandText: '',
    outputFileName,
    keepOutput: true,
    deleted: false
  });
  mixerCommandSequenceActive = true;
  mixerCommandSequenceDirty = true;
  updateMixerPlanPreview();
  openCommandStepModal(index);
}

function renderMixerCommandSequenceEditor(plan) {
  ensureMixerCommandSequenceDraft(plan);
  if (!mixerCommandSequenceDraft.length) return '';
  return `
    <div class="media-mixer-command-panel video-studio-command-chain-editor">
      <div class="media-mixer-head">
        <span>Command Chain</span>
        <button id="btn-command-step-add" type="button" class="btn-secondary">Add Command</button>
      </div>
      <div class="video-studio-command-step-list">
        ${mixerCommandSequenceDraft.map((step, index) => `
          <button type="button" class="video-studio-command-step${step.deleted ? ' is-deleted' : ''}" data-command-step-index="${index}">
            <span>${escapeHtml(`${step.stage ? `${step.stage} ` : ''}${step.name || `Command ${index + 1}`}`.trim())}</span>
            <small>${escapeHtml(step.deleted ? 'Deleted' : step.outputFileName || 'No output')}</small>
          </button>
        `).join('')}
      </div>
      <div class="media-transcoder-command-status">${mixerCommandSequenceDirty ? 'Command chain edited.' : 'Generated command chain is ready.'}</div>
    </div>
  `;
}

function bindMixerCommandSequenceEditor() {
  container.querySelectorAll('[data-command-step-index]').forEach((button) => {
    button.addEventListener('click', () => openCommandStepModal(Number(button.dataset.commandStepIndex)));
  });
  container.querySelector('#btn-command-step-add')?.addEventListener('click', addCommandStepDraft);
}

function renderMixerPlan(plan) {
  const hasCommandChain = Array.isArray(plan.commandSequence) && plan.commandSequence.length;
  return `
    <div class="media-transcoder-plan-section">
      <div class="media-transcoder-plan-title">Mixer</div>
      <div class="media-transcoder-plan-items">
        <code>${mixerState.lanes.length} lane${mixerState.lanes.length === 1 ? '' : 's'}</code>
        <code>${mixerState.tracks.length} clip${mixerState.tracks.length === 1 ? '' : 's'}</code>
        <code>${plan.width}x${plan.height} @ ${plan.fps} fps</code>
        <code>${plan.duration.toFixed(2)}s</code>
      </div>
    </div>
    ${hasCommandChain ? renderMixerCommandSequenceEditor(plan) : ''}
    ${hasCommandChain ? '' : `<div class="media-transcoder-plan-section">
      <div class="media-transcoder-plan-title">Filter Graph</div>
      <div class="media-transcoder-plan-items"><code>${escapeHtml(plan.filterGraph)}</code></div>
    </div>
    <div class="media-transcoder-plan-section">
      <div class="media-transcoder-plan-title">Command</div>
      <div class="media-transcoder-plan-items"><code>${escapeHtml(plan.command.join(' '))}</code></div>
    </div>`}
  `;
}

function applyManualMixerCommandOverride(plan) {
  if (!manualMixerCommandActive) return plan;
  return applyMediaCommandOverride(plan, manualMixerCommandText);
}

function renderMixerCommandEditor(commandText, commandStatus = '') {
  return `
    <div class="media-mixer-command-panel">
      <label for="media-mixer-command-editor">Final FFmpeg Arguments</label>
      <textarea id="media-mixer-command-editor" class="media-transcoder-command-editor" spellcheck="false">${escapeHtml(commandText)}</textarea>
      <div class="media-transcoder-command-actions">
        <button id="btn-media-mixer-command-apply" type="button" class="btn-secondary">Apply Final Arguments</button>
        <button id="btn-media-mixer-command-reset" type="button" class="btn-secondary">Reset Final Arguments</button>
      </div>
      <div id="media-mixer-command-status" class="media-transcoder-command-status">${escapeHtml(commandStatus)}</div>
    </div>
  `;
}

function bindMixerCommandEditor(basePlan) {
  const editor = container.querySelector('#media-mixer-command-editor');
  const applyButton = container.querySelector('#btn-media-mixer-command-apply');
  const resetButton = container.querySelector('#btn-media-mixer-command-reset');
  const status = container.querySelector('#media-mixer-command-status');
  if (!editor || !applyButton || !resetButton) return;
  editor.addEventListener('input', () => {
    manualMixerCommandText = editor.value;
    mixerCommandEditorDirty = true;
    if (status) status.textContent = 'Arguments edited. Apply them before rendering.';
  });
  applyButton.addEventListener('click', () => {
    try {
      applyMediaCommandOverride(basePlan, editor.value);
      manualMixerCommandText = editor.value;
      manualMixerCommandActive = true;
      mixerCommandEditorDirty = false;
      updateMixerPlanPreview();
      setRenderStatus('Final FFmpeg arguments applied.', 'success', 'Mixer render uses the edited command.', 1800);
    } catch (error) {
      if (status) status.textContent = error.message;
      setRenderStatus('Final command rejected.', 'danger', error.message);
    }
  });
  resetButton.addEventListener('click', () => {
    manualMixerCommandText = '';
    manualMixerCommandActive = false;
    mixerCommandEditorDirty = false;
    updateMixerPlanPreview();
    setRenderStatus('Generated mixer command restored.', 'success', '', 1400);
  });
}

async function updateMixerPlanPreview() {
  const host = container?.querySelector('#media-mixer-plan');
  syncVideoSettingsVisibility();
  if (!host) return;
  if (!mixerState.tracks.length && !subtitleCues.length) {
    host.innerHTML = '<div class="media-transcoder-plan-empty">Mixer plan appears after a clip or subtitle is added.</div>';
    return;
  }
  try {
    const basePlan = await buildMixerPlanFromState({ outputName: 'mixer_export.mp4' });
    const compatibility = buildMediaCompositionPlan;
    const stitch = buildMediaNormalizedStitchPlan;
    if (!compatibility || !stitch) throw new Error('Media planning helpers unavailable.');
    let plan = basePlan;
    let commandStatus = manualMixerCommandActive ? 'Custom final arguments active.' : 'Generated final arguments are ready.';
    if (Array.isArray(basePlan.commandSequence) && basePlan.commandSequence.length) {
      try {
        plan = applyMixerCommandSequenceDraft(basePlan);
      } catch (error) {
        commandStatus = error.message;
        plan = basePlan;
      }
    } else if (manualMixerCommandActive) {
      try {
        plan = applyManualMixerCommandOverride(basePlan);
      } catch (error) {
        commandStatus = error.message;
        plan = basePlan;
      }
    } else if (mixerCommandEditorDirty) {
      commandStatus = 'Arguments edited. Apply them before rendering.';
    }
    const commandText = manualMixerCommandActive || mixerCommandEditorDirty ? manualMixerCommandText : basePlan.command.join(' ');
    host.innerHTML = Array.isArray(basePlan.commandSequence) && basePlan.commandSequence.length
      ? renderMixerPlan(plan)
      : `${renderMixerPlan(plan)}${renderMixerCommandEditor(commandText, commandStatus)}`;
    bindMixerCommandSequenceEditor();
    if (!Array.isArray(basePlan.commandSequence) || !basePlan.commandSequence.length) bindMixerCommandEditor(basePlan);
  } catch (error) {
    host.innerHTML = `<div class="media-transcoder-plan-empty">${escapeHtml(error.message || 'Mixer plan unavailable.')}</div>`;
  }
}

async function renderMixer() {
  if (!mixerState.tracks.length && !subtitleCues.length) {
    setRenderStatus('Add mixer content first.', 'danger', 'The final output is rendered from the mixer.');
    return;
  }
  const button = container.querySelector('#btn-render-confirm') || container.querySelector('#btn-studio-export');
  button.disabled = true;
  applyRenderConfirmSettings();
  closeRenderConfirm();
  progressController.update({ title: 'Rendering mixer...', detail: 'Building local FFmpeg graph.', busy: true });
  try {
    const basePlan = await buildMixerPlanFromState({ includeBuffers: true, outputName: `mixer_export_${Date.now()}.mp4` });
    const plan = Array.isArray(basePlan.commandSequence) && basePlan.commandSequence.length
      ? applyMixerCommandSequenceDraft(basePlan)
      : applyManualMixerCommandOverride(basePlan);
    const result = await runFFmpegJob({
      files: plan.files,
      command: plan.command,
      commandSequence: plan.commandSequence,
      outputFileName: plan.outputName,
      onEvent(event) {
        if (event.type === 'ffmpeg-progress') {
          progressController.update({ title: 'Rendering mixer...', detail: 'FFmpeg graph in progress.', busy: true, progress: event.payload.progress });
        } else if (event.type === 'ffmpeg-log' && event.payload.message) {
          progressController.update({ title: 'Rendering mixer...', detail: event.payload.message, busy: true });
        }
      }
    });
    downloadFile(result.buffer, plan.outputName, plan.mimeType);
    progressController.update({ title: 'Mixer complete.', detail: plan.outputName, tone: 'success', autoResetMs: 2200 });
  } catch (error) {
    progressController.update({ title: 'Mixer error', detail: error.message, tone: 'danger' });
  } finally {
    button.disabled = false;
  }
}

function getSubtitleEditorTrack() {
  return editingSubtitleTrackId
    ? mixerState.tracks.find((track) => track.id === editingSubtitleTrackId && (track.kind === 'subtitle' || track.mixerMeta?.kind === 'subtitle'))
    : null;
}

function getSubtitleEditorStyle() {
  const track = getSubtitleEditorTrack();
  if (track) return normalizeSubtitleStyle(track.mixerMeta?.subtitleStyle, getGlobalSubtitleStyle());
  return getGlobalSubtitleStyle();
}

function setSubtitleEditorStyle(style) {
  const nextStyle = normalizeSubtitleStyle(style);
  const track = getSubtitleEditorTrack();
  if (track) {
    updateMixerTrack(track.id, (entry) => ({
      ...entry,
      mixerMeta: {
        ...(entry.mixerMeta || {}),
        kind: 'subtitle',
        subtitleStyle: nextStyle
      }
    }));
  } else {
    globalSubtitleStyle = nextStyle;
  }
}

function syncSubtitleSourceInfo() {
  const info = container?.querySelector('#srt-info');
  if (!info) return;
  const track = getSubtitleEditorTrack();
  if (track) {
    info.textContent = track.fileName || track.name || 'Subtitle track';
    return;
  }
  info.textContent = srtFile?.name || (subtitleCues.length ? 'Inline subtitles' : 'Drop .srt file');
}

function syncSubtitleModalControls() {
  applySubtitleStyleToControls(getSubtitleEditorStyle());
  syncSubtitleSourceInfo();
}

function handleSubtitleStyleControlInput() {
  setSubtitleEditorStyle(getSubtitleStyleFromControls());
  updateSubtitlePreview(activePreviewSurface === 'editor' ? container?.querySelector('#media-preview')?.currentTime || 0 : studioCurrentPos);
  updatePlanPreview();
  updateMixerPlanPreview();
  renderMixerCompositionPreview(studioCurrentPos);
  invalidateFramePreview({ schedule: true });
}

function getSubtitleEditorCues() {
  const track = getSubtitleEditorTrack();
  if (track) return Array.isArray(track.mixerMeta?.cues) ? track.mixerMeta.cues : [];
  return subtitleCues;
}

function setSubtitleEditorCues(cues, options = {}) {
  const nextCues = (Array.isArray(cues) ? cues : []).map((cue, index) => ({
    ...cue,
    id: cue.id || `cue-${Date.now()}-${index}`,
    index: index + 1,
    start: Math.max(0, Number(cue.start) || 0),
    end: Math.max(Math.max(0, Number(cue.start) || 0) + 0.1, Number(cue.end) || 0),
    text: String(cue.text || '')
  }));
  const track = getSubtitleEditorTrack();
  if (track) {
    const previousOrigin = options.resetOrigin ? null : track.mixerMeta?.subtitleCueOrigin;
    const timing = getSubtitleTrackTiming(nextCues, previousOrigin);
    const duration = timing.duration;
    updateMixerTrack(track.id, (entry) => {
      const trimStart = Math.max(0, Number(entry.trimStart) || 0);
      return {
        ...entry,
        kind: 'subtitle',
        duration,
        buffer: { ...(entry.buffer || {}), duration },
        trimEnd: Math.max(trimStart + 0.1, trimStart + duration),
        mixerMeta: {
          ...(entry.mixerMeta || {}),
          kind: 'subtitle',
          cues: nextCues,
          duration,
          trimStart: 0,
          trimEnd: duration,
          subtitleCueOrigin: timing.origin,
          subtitleStyle: entry.mixerMeta?.subtitleStyle || getGlobalSubtitleStyle(),
          hasAudio: false
        }
      };
    });
  } else {
    subtitleCues = nextCues;
  }
}

async function handleSrtFile(file) {
  if (!file) return;
  const text = await file.text();
  const cues = parseSrtSubtitles(text);
  const track = getSubtitleEditorTrack();
  if (track) {
    setSubtitleEditorCues(cues, { resetOrigin: true });
    updateMixerTrack(track.id, (entry) => ({
      ...entry,
      fileName: file.name || entry.fileName,
      name: file.name || entry.name,
      mixerMeta: {
        ...(entry.mixerMeta || {}),
        fileName: file.name || entry.fileName,
        name: file.name || entry.name
      }
    }));
  } else {
    srtFile = file;
    subtitleCues = cues;
  }
  syncSubtitleSourceInfo();
  renderSubtitleEditor();
  updateSubtitlePreview(activePreviewSurface === 'editor' ? container.querySelector('#media-preview')?.currentTime || 0 : studioCurrentPos);
  if (track) renderMixerWorkspace();
  updatePlanPreview();
  updateMixerPlanPreview();
  invalidateFramePreview({ schedule: true });
}

function unloadSubtitle() {
  const track = getSubtitleEditorTrack();
  if (track) {
    setSubtitleEditorCues([], { resetOrigin: true });
  } else {
    srtFile = null;
    subtitleCues = [];
  }
  const info = container?.querySelector('#srt-info');
  const input = container?.querySelector('#srt-input');
  if (info) info.textContent = 'Drop .srt file';
  if (input) input.value = '';
  syncSubtitleSourceInfo();
  renderSubtitleEditor();
  updateSubtitlePreview(container?.querySelector('#media-preview')?.currentTime || 0);
  if (track) renderMixerWorkspace();
  updatePlanPreview();
  updateMixerPlanPreview();
  invalidateFramePreview({ schedule: true });
}

function addSubtitleCue() {
  const playhead = studioCursorVisible ? studioCurrentPos : 0;
  setSubtitleEditorCues([...getSubtitleEditorCues(), {
    id: `cue-${Date.now()}`,
    index: getSubtitleEditorCues().length + 1,
    start: playhead,
    end: playhead + 2,
    text: 'Subtitle'
  }]);
  if (getSubtitleEditorTrack()) renderMixerWorkspace();
  renderSubtitleEditor();
  updateMixerPlanPreview();
  invalidateFramePreview({ schedule: true });
}

function renderSubtitleEditor() {
  const host = container?.querySelector('#subtitle-editor-list');
  const summary = container?.querySelector('#subtitle-editor-summary');
  const cues = getSubtitleEditorCues();
  const track = getSubtitleEditorTrack();
  syncSubtitleSourceInfo();
  if (summary) {
    summary.textContent = cues.length
      ? `${cues.length} cue${cues.length === 1 ? '' : 's'} ${track ? 'on selected track' : 'loaded'}.`
      : 'No subtitle cues loaded.';
  }
  if (!host) return;
  host.innerHTML = cues.length
    ? cues.map((cue, index) => `
      <div class="subtitle-editor-row" data-subtitle-cue="${escapeHtml(cue.id)}">
        <span>${index + 1}</span>
        <input data-subtitle-field="start" type="number" min="0" step="0.1" value="${escapeHtml(cue.start)}">
        <input data-subtitle-field="end" type="number" min="0.1" step="0.1" value="${escapeHtml(cue.end)}">
        <input data-subtitle-field="text" value="${escapeHtml(cue.text)}">
        <button type="button" class="btn-secondary" data-subtitle-remove="${escapeHtml(cue.id)}">Remove</button>
      </div>
    `).join('')
    : '<div class="media-transcoder-plan-empty">Subtitle cues appear here.</div>';
  host.querySelectorAll('[data-subtitle-field]').forEach((input) => {
    input.addEventListener('input', () => {
      const row = input.closest('[data-subtitle-cue]');
      const nextCues = getSubtitleEditorCues().map((cue) => ({ ...cue }));
      const cue = nextCues.find((entry) => entry.id === row?.dataset.subtitleCue);
      if (!cue) return;
      const field = input.dataset.subtitleField;
      cue[field] = field === 'text' ? input.value : Number(input.value);
      if (cue.end <= cue.start) cue.end = cue.start + 0.1;
      setSubtitleEditorCues(nextCues);
      if (getSubtitleEditorTrack()) renderMixerWorkspace();
      updateSubtitlePreview(container.querySelector('#media-preview')?.currentTime || 0);
      updatePlanPreview();
      updateMixerPlanPreview();
      invalidateFramePreview({ schedule: true });
    });
  });
  host.querySelectorAll('[data-subtitle-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      setSubtitleEditorCues(getSubtitleEditorCues().filter((cue) => cue.id !== button.dataset.subtitleRemove));
      if (getSubtitleEditorTrack()) renderMixerWorkspace();
      renderSubtitleEditor();
      updatePlanPreview();
      updateMixerPlanPreview();
      invalidateFramePreview({ schedule: true });
    });
  });
}

function updateSubtitlePreview(time) {
  const host = container?.querySelector('#subtitle-live-preview');
  if (!host) return;
  const cue = getPreviewSubtitleCues().find((entry) => time >= Number(entry.start || 0) && time <= Number(entry.end || 0));
  const style = normalizeSubtitleStyle(cue?.style, getGlobalSubtitleStyle());
  host.textContent = cue ? normalizeSubtitleCueText(cue.text) : '';
  host.style.color = style.color;
  host.style.fontFamily = style.fontFamily;
  host.style.fontSize = `${style.fontSize}px`;
  host.style.webkitTextStroke = style.outline ? `${style.outline}px #000000` : '';
  host.style.textShadow = style.outline ? '0 1px 2px rgba(0,0,0,0.9)' : '';
}

async function hydrateTrimmerVisual() {
  if (!trimmer || !activeFile) return;
  const token = ++trimmerVisualToken;
  trimmer.setWaveform(null);
  trimmer.setFrameStrip([]);
  trimmer.setLoading({ visible: true, title: 'Preparing waveform', detail: 'Analyzing local media...', progress: 8 });
  try {
    const waveform = await analyzeWaveform({
      file: activeFile,
      fileName: activeFile.name || 'media',
      cacheKey: `${activeFile.name || 'media'}:${activeFile.size}:${activeFile.lastModified || 0}`,
      maxBins: 32768,
      includeSamples: true,
      maxSampleFrames: 2000000,
      onEvent(event) {
        if (!trimmer || token !== trimmerVisualToken) return;
        if (event.type === 'ffmpeg-progress') {
          trimmer.setLoading({ visible: true, title: 'Preparing waveform', detail: 'Decoding audio envelope...', progress: event.payload.progress });
        } else if (event.type === 'waveform-status') {
          trimmer.setLoading({ visible: event.payload.phase !== 'complete', title: 'Preparing waveform', detail: event.payload.message, progress: event.payload.phase === 'complete' ? 100 : 72 });
        }
      }
    });
    if (token !== trimmerVisualToken || !trimmer) return;
    if (waveform?.levels?.length) {
      trimmer.setWaveform(waveform);
      trimmer.setSamples(waveform.samples, waveform.samplesSampleRate || waveform.sampleRate);
      trimmer.setLoading({ visible: false });
      return;
    }
  } catch {}
  const frames = await captureVideoFrameStrip({ file: activeFile, count: 12, width: 104, height: 58 });
  if (token !== trimmerVisualToken || !trimmer) return;
  trimmer.setFrameStrip(frames);
  trimmer.setLoading({ visible: false });
}

let lastLoopState = false;
function initTrimmer(preview) {
  trimmer?.destroy();
  trimmer = createMediaTrimmer({
    mount: container.querySelector('#trim-host'),
    idPrefix: 'media',
    duration: videoDuration,
    start: startVal,
    end: endVal || videoDuration,
    playhead: startVal,
    minSpan: 0.1,
    zoom: 1,
    maxZoom: 80,
    isLooping: lastLoopState,
    onChange(range) {
      startVal = range.start;
      endVal = range.end;
      updatePlanPreview();
      invalidateFramePreview({ schedule: true });
      const nextPlayhead = clampEditorPreviewTime(preview.currentTime);
      if (Math.abs((Number(preview.currentTime) || 0) - nextPlayhead) > 0.001) setEditorPlayhead(nextPlayhead, 'range');
    },
    onRulerSeek({ time }) {
      setActivePreviewSurface('editor');
      setEditorPlayhead(time, 'ruler-click', { syncTrimmer: false });
    },
    onSeek(time) {
      setActivePreviewSurface('editor');
      setEditorPlayhead(time);
    },
    onTogglePlayback({ isPlaying, time }) {
      setActivePreviewSurface('editor');
      if (isPlaying) {
        if (time !== undefined) preview.currentTime = time;
        playClipEditorPreview();
      } else {
        pauseClipEditorPreview();
      }
    },
    onLoopChange({ isLooping }) {
      lastLoopState = isLooping;
    }
  });
  const onTimeUpdate = () => {
    if (!trimmer) return;
    if (preview.currentTime > endVal) {
      if (lastLoopState) {
        preview.currentTime = startVal;
        preview.play();
      } else {
        preview.pause();
        preview.currentTime = startVal;
        trimmer.setPlayhead(startVal, 'ended');
        trimmer.emitEnded();
      }
      return;
    }
    trimmer.setPlayhead(preview.currentTime);
    updateSubtitlePreview(preview.currentTime);
    if (framePreviewValid || framePreviewUrl) clearFramePreview();
  };
  const onPause = () => {
    trimmer?.setPlaying(false);
    if (activePreviewSurface === 'editor') setMediaPlaybackState('paused');
  };
  const onPlay = () => {
    trimmer?.setPlaying(true);
    setActivePreviewSurface('editor');
    setMediaPlaybackState('playing');
  };
  preview.addEventListener('timeupdate', onTimeUpdate);
  preview.addEventListener('pause', onPause);
  preview.addEventListener('play', onPlay);
  cleanup.push(() => {
    preview.removeEventListener('timeupdate', onTimeUpdate);
    preview.removeEventListener('pause', onPause);
    preview.removeEventListener('play', onPlay);
  });
  renderEditorVolumeEnvelope();
  hydrateTrimmerVisual();
}

export function unmount() {
  mediaControlsCleanup?.();
  mediaControlsCleanup = null;
  cancelAutoFramePreview();
  autoFramePreviewDebounce = null;
  trimmer?.destroy();
  trimmer = null;
  mixerController?.destroy?.();
  mixerController = null;
  mixerInspectorGrid?.destroy();
  mixerInspectorGrid = null;
  videoStudioContextMenu?.destroy?.();
  videoStudioContextMenu = null;
  if (stopCropTracking) stopCropTracking();
  stopCropTracking = null;
  progressController?.destroy();
  progressController = null;
  stopMixerPreview();
  revokeMixerPreviewUrls();
  revokeFramePreviewUrl();
  revokeMediaPreviewUrl();
  const preview = container?.querySelector('#media-preview');
  if (preview) preview.removeAttribute('src');
  for (const dispose of cleanup) dispose();
  cleanup = [];
  container?.remove();
  container = null;
}

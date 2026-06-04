import { downloadFile, showToast } from '../ui/ui-utils.js';
import { registerShortcuts } from '../core/shortcuts.js';
import { runFFmpegJob } from '../core/ffmpeg-service.js';
import { globalWorkerPool } from '../workers/pool.js';
import { analyzeWaveformSamples } from '../core/media-visualization-service.js';
import {
  createMixerState,
  appendMixerLane,
  duplicateMixerLane,
  clearMixerLaneTracks,
  selectMixerLane,
  renameMixerLane,
  setMixerLaneVolume,
  toggleMixerLaneMute,
  toggleMixerLaneSolo,
  addMixerAsset,
  removeMixerLane as removeMixerLaneState,
  selectMixerTrack,
  renameMixerAsset,
  renameMixerAssetReferences,
  setMixerTrackVolume,
  setMixerTrackFadeStyle,
  setMixerTrackAutomation,
  addMixerTrackKeyframe,
  removeMixerTrackKeyframe,
  toggleMixerTrackMute,
  toggleMixerTrackSolo,
  trimMixerTrackStart,
  trimMixerTrackEnd,
  moveMixerTrack,
  moveMixerTrackToNewLane,
  addMixerTrack as addMixerTrackState,
  duplicateMixerTrack as duplicateMixerTrackState,
  splitMixerTrack as splitMixerTrackState,
  removeMixerTrack as removeMixerTrackState,
  removeMixerAsset as removeMixerAssetState,
  replaceMixerAsset,
  setMixerAssetWaveform,
  setMixerTrackWaveform
} from '../core/mixer-session.js';
import { createMediaTrimmer } from '../ui/media-trimmer.js';
import { createModalController } from '../ui/modal.js';
import { createContextMenu } from '../ui/context-menu.js';
import { createMixerPlaybackService } from '../core/mixer-playback-service.js';
import { createMixerComponent } from '../ui/mixer-components.js';
import { processTrimAudioSamples, samplesToWavBuffer } from '../utils/audio-trim-processing.js';
import { deleteAudioSampleRange } from '../utils/audio-range-effects.js';
import { decodeMediaAudioFile } from '../utils/media-audio-import.js';
import { closeAudioContext, createBrowserAudioContext, resumeAudioContext } from '../utils/audio-context.js';
import { bindMediaControls, setMediaPlaybackState } from '../utils/media-session.js';
import {
  buildMixerTrackGainPoints,
  getAnchoredMixerScrollLeft,
  formatMixerTime,
  getMixerTimelineDuration,
  getMixerZoomToFit,
  getTrackCopyName
} from '../utils/audio-mixer.js';

const PCM_RECORDER_WORKLET_URL = new URL('../workers/pcm-recorder.worklet.js', import.meta.url);

export function getPcmRecorderWorkletUrl() {
  return PCM_RECORDER_WORKLET_URL;
}

let container = null;
let audioCtx = null;
let stream = null;
let sourceNode = null;
let analyzer = null;
let animationId = null;

// Processing Nodes
let inputGainNode = null;
let compressorNode = null;
let gateNode = null;

// Recording State
let isRecording = false;
let startTime = 0;
let timerInterval = null;
let recordedChunks = [];
let mediaRecorder = null;
let noiseProfile = null; // Frequency magnitudes of the noise floor

let studioTracks = []; // Multi-track mixer (Clips on timeline)
let audioLibrary = []; // Audio assets ready to be used
let studioLanesCount = 4;
let laneSettings = []; // [{ muted: false, soloed: false, name: 'Lane 1' }]
let selectedLaneIndex = 0;
let selectedTrackId = null;
let currentPreviewAudio = null;
let tickerAnimationId = null;
let removeShortcuts = null;
let mediaControlsCleanup = null;
let studioInterval = null;
let soundTrimmer = null;
let soundTrimmerToken = 0;
let editingAssetId = null;
let previewController = null;
let mixerController = null;
let studioContextMenu = null;
let destroyTrimmerSessionUi = null;
let activeTrimmerSource = null;
let activeTrimmerBufferReader = null;
let activeTrimmerNameReader = null;
let pendingRecordResumeMode = null;
let pendingRecordStartPromise = null;
let pendingRecordStopRequested = false;
let activeKeyboardSurface = 'mixer';
let waveformRefreshTimer = null;
let trimBusyState = { waveform: false, preview: false };
let isStudioSeekAutoplayEnabled = false;
let deleteSelectedTrimmerAudioRange = () => false;

// Studio State
let isStudioPlaying = false;
let studioCurrentPos = 0;
let studioCursorVisible = false;
let studioTimelineScale = 100; // pixels per second
let playbackService = createMixerPlaybackService();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smoothEnvelopeRatio(value) {
  const ratio = clamp(Number(value) || 0, 0, 1);
  return (ratio * ratio) * (3 - (2 * ratio));
}

function resetStudioState() {
  studioContextMenu?.destroy?.();
  studioContextMenu = null;
  destroyTrimmerSessionUi?.();
  destroyTrimmerSessionUi = null;
  isRecording = false;
  startTime = 0;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  recordedChunks = [];
  mediaRecorder = null;
  noiseProfile = null;
  studioTracks = [];
  audioLibrary = [];
  studioLanesCount = 4;
  laneSettings = [];
  selectedLaneIndex = 0;
  selectedTrackId = null;
  currentPreviewAudio = null;
  studioInterval = null;
  soundTrimmer = null;
  soundTrimmerToken = 0;
  editingAssetId = null;
  previewController = null;
  mixerController = null;
  activeTrimmerSource = null;
  activeTrimmerBufferReader = null;
  activeTrimmerNameReader = null;
  pendingRecordResumeMode = null;
  pendingRecordStartPromise = null;
  pendingRecordStopRequested = false;
  activeKeyboardSurface = 'mixer';
  if (waveformRefreshTimer) clearTimeout(waveformRefreshTimer);
  waveformRefreshTimer = null;
  trimBusyState = { waveform: false, preview: false };
  isStudioSeekAutoplayEnabled = false;
  deleteSelectedTrimmerAudioRange = () => false;
  isStudioPlaying = false;
  studioCurrentPos = 0;
  studioCursorVisible = false;
  studioTimelineScale = 100;
  playbackService.stop();
  playbackService = createMixerPlaybackService();
}

function createMonoAudioBuffer(samples, sampleRate) {
  if (typeof audioCtx?.createBuffer === 'function') {
    const buffer = audioCtx.createBuffer(1, samples.length, sampleRate);
    buffer.getChannelData(0).set(samples);
    return buffer;
  }
  const channelData = new Float32Array(samples);
  return {
    duration: channelData.length / sampleRate,
    sampleRate,
    length: channelData.length,
    numberOfChannels: 1,
    getChannelData() {
      return channelData;
    }
  };
}

function appendMonoBuffers(leftBuffer, rightBuffer) {
  if (!leftBuffer) return rightBuffer;
  if (!rightBuffer) return leftBuffer;
  const sampleRate = Number(leftBuffer.sampleRate) || Number(rightBuffer.sampleRate) || 44100;
  const left = leftBuffer.getChannelData(0);
  const right = rightBuffer.getChannelData(0);
  const samples = new Float32Array(left.length + right.length);
  samples.set(left, 0);
  samples.set(right, left.length);
  return createMonoAudioBuffer(samples, sampleRate);
}

function clearTrimmerSession() {
  activeTrimmerSource = null;
  activeTrimmerBufferReader = null;
  activeTrimmerNameReader = null;
}

function setTrimmerActive(active) {
  container?.classList.toggle('trimmer-active', !!active);
  container?.parentElement?.classList?.toggle?.('trimmer-active', !!active);
  if (active) activeKeyboardSurface = 'trimmer';
}

function closeTrimmerArea() {
  studioContextMenu?.close?.();
  destroyTrimmerSessionUi?.();
  destroyTrimmerSessionUi = null;
  previewController?.stop?.();
  previewController = null;
  editingAssetId = null;
  if (waveformRefreshTimer) clearTimeout(waveformRefreshTimer);
  waveformRefreshTimer = null;
  trimBusyState.preview = false;
  trimBusyState.waveform = false;
  soundTrimmer?.clearPlayhead?.();
  deleteSelectedTrimmerAudioRange = () => false;
  setTrimmerActive(false);
  container?.querySelector('#trim-area')?.classList.add('hidden');
  clearTrimmerSession();
  activeKeyboardSurface = 'mixer';
}

function setActiveKeyboardSurface(surface = 'mixer') {
  activeKeyboardSurface = surface === 'trimmer' ? 'trimmer' : 'mixer';
}

function resolveActiveKeyboardSurface() {
  if (!container?.classList.contains('trimmer-active')) return 'mixer';
  return activeKeyboardSurface === 'mixer' ? 'mixer' : 'trimmer';
}

const setNewLaneDropHighlight = (active) => {
  if (!container) return;
  const newLaneDrop = container.querySelector('#studio-new-lane-drop');
  const newLaneDropCallout = container.querySelector('#studio-new-lane-drop-callout');
  newLaneDrop?.classList.toggle('active', !!active);
  newLaneDropCallout?.classList.toggle('active', !!active);
};

function scrollNodeIntoView(node) {
  node?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
}

function centerTrimmerViewportOnRange(startTime, endTime = startTime) {
  const scroll = soundTrimmer?.root?.querySelector?.('[data-role="scroll"]');
  const timeline = soundTrimmer?.getTimelineElement?.();
  if (!scroll || !timeline) return;
  const duration = Math.max(0.001, Number(soundTrimmer?.getRange?.()?.duration) || Number(editingAssetId && audioLibrary.find((asset) => asset.id == editingAssetId)?.buffer?.duration) || 0.001);
  const timelineWidth = timeline.getBoundingClientRect?.().width || timeline.clientWidth || 0;
  if (!timelineWidth) return;
  const centerRatio = clamp((((Number(startTime) || 0) + (Number(endTime) || Number(startTime) || 0)) / 2) / duration, 0, 1);
  const targetLeft = Math.max(0, (timelineWidth * centerRatio) - (scroll.clientWidth / 2));
  scroll.scrollLeft = targetLeft;
}

function syncStudioTransportChrome() {
  if (!container) return;
  const btn = container.querySelector('#btn-studio-play');
  const playIcon = container.querySelector('[data-role="studio-play-icon"]');
  const pauseIcon = container.querySelector('[data-role="studio-pause-icon"]');
  const autoplayToggle = container.querySelector('#studio-autoplay');
  if (btn) btn.classList.toggle('active', isStudioPlaying);
  playIcon?.classList.toggle('hidden', isStudioPlaying);
  pauseIcon?.classList.toggle('hidden', !isStudioPlaying);
  if (autoplayToggle) autoplayToggle.checked = isStudioSeekAutoplayEnabled;
  setMediaPlaybackState(isStudioPlaying ? 'playing' : 'paused');
}

function jumpSoundStudioClip(delta) {
  const clips = [...studioTracks].sort((a, b) => (Number(a.offset) || 0) - (Number(b.offset) || 0));
  if (!clips.length) return;
  const currentIndex = clips.findIndex((track) => track.id === selectedTrackId);
  const fallbackIndex = clips.findIndex((track) => (Number(track.offset) || 0) > studioCurrentPos);
  const baseIndex = currentIndex >= 0 ? currentIndex : fallbackIndex >= 0 ? fallbackIndex : 0;
  const nextClip = clips[(baseIndex + delta + clips.length) % clips.length];
  applyMixerState(selectMixerTrack(getMixerStateSnapshot(), nextClip.id));
  studioCurrentPos = Number(nextClip.offset) || 0;
  studioCursorVisible = true;
  setActiveKeyboardSurface('mixer');
  centerMixerViewportOnTime(studioCurrentPos);
  renderStudio();
}

function handleSoundStudioMediaCommand(command) {
  const trimmerActive = resolveActiveKeyboardSurface() === 'trimmer';
  if (command === 'play') {
    if (trimmerActive) playPreview();
    else playStudio(studioCursorVisible ? studioCurrentPos : 0);
    return;
  }
  if (command === 'pause' || command === 'stop') {
    if (currentPreviewAudio && !currentPreviewAudio.paused) stopPreview();
    if (isStudioPlaying) stopStudio();
    return;
  }
  if (command === 'toggle') {
    if (trimmerActive) {
      if (currentPreviewAudio && !currentPreviewAudio.paused) stopPreview();
      else playPreview();
    } else if (isStudioPlaying) {
      stopStudio();
    } else {
      playStudio(studioCursorVisible ? studioCurrentPos : 0);
    }
    return;
  }
  if (command === 'nexttrack') jumpSoundStudioClip(1);
  if (command === 'previoustrack') jumpSoundStudioClip(-1);
}

function setupSoundStudioMediaControls() {
  mediaControlsCleanup?.();
  mediaControlsCleanup = bindMediaControls({
    target: window,
    metadata: { title: 'Sound Studio', artist: 'Jelodar Tools' },
    playbackState: 'paused',
    handlers: {
      play: () => handleSoundStudioMediaCommand('play'),
      pause: () => handleSoundStudioMediaCommand('pause'),
      stop: () => handleSoundStudioMediaCommand('stop'),
      toggle: () => handleSoundStudioMediaCommand('toggle'),
      nexttrack: () => handleSoundStudioMediaCommand('nexttrack'),
      previoustrack: () => handleSoundStudioMediaCommand('previoustrack')
    }
  });
}

function fitStudioTimeline() {
  const timeline = mixerController?.getTimelineContainer();
  if (!timeline || studioTracks.length === 0) return;
  const nextScale = getMixerZoomToFit({
    tracks: studioTracks,
    viewportWidth: timeline.clientWidth,
    minScale: 0.01,
    maxScale: 500
  });
  if (nextScale <= 0) return;
  studioTimelineScale = nextScale;
  container.querySelector('#studio-zoom').value = String(studioTimelineScale);
  syncStudioMixerSurface({ syncScale: true });
  syncStudioSummaryChrome();
  syncLibraryLaneTargetChrome();
  syncStudioTransportChrome();
  if (studioCursorVisible) centerMixerViewportOnTime(studioCurrentPos);
  else timeline.scrollLeft = 0;
}

function zoomStudioTimelineToSelection() {
  const timeline = mixerController?.getTimelineContainer();
  if (!timeline) return;
  const track = studioTracks.find((entry) => entry.id === selectedTrackId);
  if (!track) {
    fitStudioTimeline();
    return;
  }
  const span = Math.max(0.1, (Number(track.trimEnd) || 0) - (Number(track.trimStart) || 0));
  const paddedSpan = Math.max(0.4, span * 1.45);
  studioTimelineScale = clamp(timeline.clientWidth / paddedSpan, 0.01, 500);
  container.querySelector('#studio-zoom').value = String(studioTimelineScale);
  syncStudioMixerSurface({ syncScale: true });
  syncStudioSummaryChrome();
  syncLibraryLaneTargetChrome();
  syncStudioTransportChrome();
  centerMixerViewportOnTime((Number(track.offset) || 0) + (span / 2));
}

function centerMixerViewportOnTime(time) {
  const timeline = mixerController?.getTimelineContainer();
  if (!timeline) return;
  const maxScroll = Math.max(0, timeline.scrollWidth - timeline.clientWidth);
  timeline.scrollLeft = clamp((Math.max(0, Number(time) || 0) * studioTimelineScale) - (timeline.clientWidth / 2), 0, maxScroll);
}

function syncLaneSettings() {
  const state = createMixerState({
    laneCount: studioLanesCount,
    lanes: laneSettings,
    tracks: studioTracks,
    assets: audioLibrary,
    selectedLaneIndex,
    selectedTrackId
  });
  studioLanesCount = state.lanes.length;
  laneSettings = state.lanes;
  studioTracks = state.tracks;
  audioLibrary = state.assets;
  selectedLaneIndex = state.selectedLaneIndex;
  selectedTrackId = state.selectedTrackId;
}

function getMixerStateSnapshot() {
  return createMixerState({
    laneCount: studioLanesCount,
    lanes: laneSettings,
    tracks: studioTracks,
    assets: audioLibrary,
    selectedLaneIndex,
    selectedTrackId
  });
}

function applyMixerState(state) {
  studioLanesCount = state.lanes.length;
  laneSettings = state.lanes;
  studioTracks = state.tracks;
  audioLibrary = state.assets;
  selectedLaneIndex = state.selectedLaneIndex;
  selectedTrackId = state.selectedTrackId;
}

function syncMixerPlaybackChrome() {
  if (!mixerController) return;
  mixerController.setPlaying(isStudioPlaying);
  mixerController.setPlayhead(studioCursorVisible ? studioCurrentPos : null);
}

function syncLibraryLaneTargetChrome() {
  if (!container) return;
  const laneLabel = laneSettings[selectedLaneIndex]?.name || `Lane ${selectedLaneIndex + 1}`;
  const target = container.querySelector('#library-target-lane');
  const laneSelect = container.querySelector('#library-target-select');
  if (target) target.textContent = `Selected lane: ${laneLabel}`;
  if (laneSelect) {
    laneSelect.innerHTML = '';
    laneSettings.forEach((lane, index) => {
      const option = laneSelect.ownerDocument.createElement('option');
      option.value = String(index);
      option.selected = index === selectedLaneIndex;
      option.textContent = lane.name || `Lane ${index + 1}`;
      laneSelect.appendChild(option);
    });
    laneSelect.value = String(selectedLaneIndex);
  }
  container.querySelectorAll('.studio-library-commit').forEach((button) => {
    button.textContent = `Add to ${laneLabel}`;
  });
}

function syncStudioSummaryChrome() {
  if (!container) return;
  const mixerSection = container.querySelector('#studio-mixer');
  const durationMetric = container.querySelector('#metric-duration');
  const tracksMetric = container.querySelector('#metric-tracks');
  const hasSolo = studioTracks.some((track) => track.soloed) || laneSettings.some((lane) => lane.soloed);
  mixerSection?.classList.toggle('solo-active', hasSolo);
  const timelineDuration = getMixerTimelineDuration(studioTracks);
  if (durationMetric) durationMetric.textContent = formatMixerTime(timelineDuration);
  if (tracksMetric) tracksMetric.textContent = String(studioTracks.length);
}

function syncStudioMixerSurface(options = {}) {
  if (!container) return;
  const emptyState = container.querySelector('#studio-empty-msg');
  const hasContent = studioTracks.length > 0 || audioLibrary.length > 0;
  mixerController?.root?.classList.toggle('is-hidden', !hasContent);
  emptyState?.classList.toggle('is-hidden', hasContent);
  if (!hasContent) {
    return;
  }
  if (!mixerController) return;
  if (options.syncScale) mixerController.updateScale(studioTimelineScale);
  mixerController.updateState(getMixerStateSnapshot());
  syncMixerPlaybackChrome();
}

function openMixerTrackContextMenu({ trackId, time, x, y } = {}) {
  const track = studioTracks.find((entry) => String(entry.id) === String(trackId));
  if (!track) return;
  const canMoveToSelectedLane = Number(track.laneIndex) !== Number(selectedLaneIndex);
  const clipSpan = Math.max(0, (Number(track.trimEnd) || 0) - (Number(track.trimStart) || 0));
  const clipStart = Math.max(0, Number(track.offset) || 0);
  const clipEnd = clipStart + clipSpan;
  const contextTime = Math.max(clipStart, Math.min(clipEnd, Number(time) || studioCurrentPos || clipStart));
  const playheadSplitTime = Math.max(clipStart, Math.min(clipEnd, Number(studioCurrentPos) || clipStart));
  const canSplitAtContext = contextTime > clipStart + 0.05 && contextTime < clipEnd - 0.05;
  const canSplitAtPlayhead = playheadSplitTime > clipStart + 0.05 && playheadSplitTime < clipEnd - 0.05;
  const canTrimAtContext = contextTime > clipStart + 0.05 && contextTime < clipEnd - 0.05;
  studioContextMenu?.open({
    x,
    y,
    items: [
      {
        id: 'edit-track',
        label: 'Open Clip',
        onSelect() {
          window.editAsset(track.assetId);
        }
      },
      {
        id: 'duplicate-track',
        label: 'Duplicate Clip',
        onSelect() {
          window.duplicateTrack(track.id);
        }
      },
      {
        id: 'duplicate-track-to-selected-lane',
        label: canMoveToSelectedLane ? 'Duplicate to Selected Lane' : 'Already on Selected Lane',
        disabled: !canMoveToSelectedLane,
        onSelect() {
          const asset = audioLibrary.find((entry) => entry.id == track.assetId);
          if (!asset) return;
          applyMixerState(duplicateMixerTrackState(getMixerStateSnapshot(), {
            trackId: track.id,
            asset,
            laneIndex: selectedLaneIndex,
            offset: track.offset
          }));
          syncStudioMixerSurface();
          syncStudioSummaryChrome();
          syncStudioPlaybackMix();
        }
      },
      {
        id: 'split-track-here',
        label: 'Split Clip Here',
        disabled: !canSplitAtContext,
        onSelect() {
          window.splitTrack(track.id, contextTime);
        }
      },
      {
        id: 'split-track-at-playhead',
        label: canSplitAtPlayhead ? 'Split at Playhead' : 'Playhead Outside Clip',
        disabled: !canSplitAtPlayhead,
        onSelect() {
          window.splitTrack(track.id, playheadSplitTime);
        }
      },
      {
        id: 'trim-track-start-to-cursor',
        label: canTrimAtContext ? 'Trim Start to Cursor' : 'Cannot Trim Start Here',
        disabled: !canTrimAtContext,
        onSelect() {
          applyMixerState(trimMixerTrackStart(getMixerStateSnapshot(), {
            trackId: track.id,
            trimStart: (Number(track.trimStart) || 0) + (contextTime - clipStart)
          }));
          syncStudioMixerSurface();
          syncStudioSummaryChrome();
          syncStudioPlaybackMix();
        }
      },
      {
        id: 'trim-track-end-to-cursor',
        label: canTrimAtContext ? 'Trim End to Cursor' : 'Cannot Trim End Here',
        disabled: !canTrimAtContext,
        onSelect() {
          applyMixerState(trimMixerTrackEnd(getMixerStateSnapshot(), {
            trackId: track.id,
            trimEnd: (Number(track.trimStart) || 0) + (contextTime - clipStart)
          }));
          syncStudioMixerSurface();
          syncStudioSummaryChrome();
          syncStudioPlaybackMix();
        }
      },
      {
        id: 'center-track',
        label: 'Center Clip',
        onSelect() {
          applyMixerState(selectMixerTrack(getMixerStateSnapshot(), track.id));
          syncStudioMixerSurface();
          centerMixerViewportOnTime((Number(track.offset) || 0) + (clipSpan / 2));
        }
      },
      {
        id: 'move-playhead-to-track-start',
        label: 'Move Playhead to Clip Start',
        onSelect() {
          studioCurrentPos = clipStart;
          studioCursorVisible = true;
          syncMixerPlaybackChrome();
          centerMixerViewportOnTime(studioCurrentPos);
        }
      },
      {
        id: 'move-playhead-to-track-end',
        label: 'Move Playhead to Clip End',
        onSelect() {
          studioCurrentPos = clipEnd;
          studioCursorVisible = true;
          syncMixerPlaybackChrome();
          centerMixerViewportOnTime(studioCurrentPos);
        }
      },
      {
        id: 'fit-timeline-from-track',
        label: 'Fit Timeline',
        onSelect() {
          fitStudioTimeline();
          centerMixerViewportOnTime((Number(track.offset) || 0) + (clipSpan / 2));
        }
      },
      {
        id: 'select-track-source',
        label: 'Show Source in Library',
        onSelect() {
          const modal = container?.querySelector('#modal-library');
          modal?.classList.add('active');
          renderLibrary();
          const node = container?.querySelector(`.library-item[data-asset-id="${track.assetId}"]`);
          scrollNodeIntoView(node);
          node?.classList.add?.('is-selected');
        }
      },
      {
        id: 'move-track-to-new-lane',
        label: 'Move to New Lane',
        onSelect() {
          applyMixerState(moveMixerTrackToNewLane(getMixerStateSnapshot(), {
            trackId: track.id,
            offset: track.offset
          }));
          syncStudioMixerSurface();
          syncStudioSummaryChrome();
          syncLibraryLaneTargetChrome();
          syncStudioPlaybackMix();
        }
      },
      {
        id: 'move-track-to-selected-lane',
        label: canMoveToSelectedLane ? 'Move to Selected Lane' : 'Already in Selected Lane',
        disabled: !canMoveToSelectedLane,
        onSelect() {
          applyMixerState(moveMixerTrack(getMixerStateSnapshot(), {
            trackId: track.id,
            laneIndex: selectedLaneIndex,
            offset: track.offset
          }));
          syncStudioMixerSurface();
          syncStudioSummaryChrome();
          syncLibraryLaneTargetChrome();
          syncStudioPlaybackMix();
        }
      },
      { separator: true },
      {
        id: track.muted ? 'unmute-track' : 'mute-track',
        label: track.muted ? 'Unmute Clip' : 'Mute Clip',
        onSelect() {
          window.toggleTrackMute(track.id);
        }
      },
      {
        id: track.soloed ? 'unsolo-track' : 'solo-track',
        label: track.soloed ? 'Clear Solo' : 'Solo Clip',
        onSelect() {
          window.toggleTrackSolo(track.id);
        }
      },
      {
        id: 'play-from-track',
        label: 'Play From Here',
        onSelect() {
          playStudio(track.offset);
        }
      },
      { separator: true },
      {
        id: 'remove-track',
        label: 'Remove Clip',
        danger: true,
        onSelect() {
          window.removeTrack(track.id);
        }
      }
    ]
  });
}

function openMixerCrossfadeContextMenu({ trackId, x, y } = {}) {
  const track = studioTracks.find((entry) => String(entry.id) === String(trackId));
  if (!track) return;
  studioContextMenu?.open({
    x,
    y,
    items: ['linear', 'equal-power', 'logarithmic'].map((mode) => ({
      id: `crossfade-${mode}`,
      label: mode === 'equal-power' ? 'Equal Power' : mode === 'logarithmic' ? 'Logarithmic' : 'Linear',
      disabled: (track.fadeStyle || 'linear') === mode,
      onSelect() {
        applyMixerState(setMixerTrackFadeStyle(getMixerStateSnapshot(), track.id, mode));
        syncStudioMixerSurface();
        syncStudioPlaybackMix();
      }
    }))
  });
}

function openMixerLaneContextMenu({ laneIndex, x, y } = {}) {
  const lane = laneSettings[laneIndex];
  if (!lane) return;
  studioContextMenu?.open({
    x,
    y,
    items: [
      {
        id: 'select-lane',
        label: 'Select Lane',
        onSelect() {
          window.selectLane(laneIndex);
        }
      },
      {
        id: 'target-library-lane',
        label: 'Use for Library Adds',
        onSelect() {
          window.selectLane(laneIndex);
        }
      },
      {
        id: 'rename-lane',
        label: 'Rename Lane',
        onSelect() {
          window.selectLane(laneIndex);
          const input = container?.querySelector(`.lane-control-row[data-lane-index="${laneIndex}"] .track-name-input`);
          scrollNodeIntoView(input);
          input?.focus?.();
          input?.select?.();
        }
      },
      {
        id: 'duplicate-lane',
        label: 'Duplicate Lane',
        onSelect() {
          window.duplicateLane(laneIndex);
        }
      },
      {
        id: 'clear-lane',
        label: 'Clear Lane',
        onSelect() {
          window.clearLane(laneIndex);
        }
      },
      {
        id: lane.muted ? 'unmute-lane' : 'mute-lane',
        label: lane.muted ? 'Unmute Lane' : 'Mute Lane',
        onSelect() {
          window.toggleLaneMute(laneIndex);
        }
      },
      {
        id: lane.soloed ? 'unsolo-lane' : 'solo-lane',
        label: lane.soloed ? 'Clear Solo' : 'Solo Lane',
        onSelect() {
          window.toggleLaneSolo(laneIndex);
        }
      },
      { separator: true },
      {
        id: 'add-lane-after',
        label: 'Add Lane',
        onSelect() {
          const nextState = appendMixerLane(getMixerStateSnapshot());
          applyMixerState(selectMixerLane(nextState, nextState.lanes.length - 1));
          syncStudioMixerSurface();
          syncStudioSummaryChrome();
          syncLibraryLaneTargetChrome();
        }
      },
      {
        id: 'remove-lane',
        label: 'Remove Lane',
        danger: true,
        onSelect() {
          window.removeLane(laneIndex);
        }
      }
    ]
  });
}

function openMixerRulerContextMenu({ time, x, y } = {}) {
  const seekTime = Math.max(0, Number(time) || 0);
  const selectedTrack = studioTracks.find((track) => track.id === selectedTrackId);
  const selectedTrackStart = Math.max(0, Number(selectedTrack?.offset) || 0);
  const selectedTrackEnd = selectedTrack
    ? selectedTrackStart + Math.max(0, (Number(selectedTrack.trimEnd) || 0) - (Number(selectedTrack.trimStart) || 0))
    : 0;
  const canSplitSelectedTrack = !!selectedTrack && seekTime > selectedTrackStart + 0.05 && seekTime < selectedTrackEnd - 0.05;
  studioContextMenu?.open({
    x,
    y,
    items: [
      {
        id: 'play-from-here',
        label: 'Play From Here',
        onSelect() {
          playStudio(seekTime);
        }
      },
      {
        id: 'move-playhead',
        label: 'Move Playhead Here',
        onSelect() {
          studioCurrentPos = seekTime;
          studioCursorVisible = true;
          syncMixerPlaybackChrome();
        }
      },
      {
        id: 'center-playhead',
        label: 'Center Playhead',
        onSelect() {
          studioCurrentPos = seekTime;
          studioCursorVisible = true;
          syncMixerPlaybackChrome();
          centerMixerViewportOnTime(seekTime);
        }
      },
      {
        id: 'split-selected-track-here',
        label: canSplitSelectedTrack ? 'Split Selected Clip Here' : 'No Clip Split Here',
        disabled: !canSplitSelectedTrack,
        onSelect() {
          window.splitTrack(selectedTrack.id, seekTime);
        }
      },
      {
        id: 'fit-timeline',
        label: 'Fit Timeline',
        onSelect() {
          fitStudioTimeline();
        }
      },
      isStudioPlaying
        ? {
          id: 'stop-playback',
          label: 'Stop Playback',
          onSelect() {
            stopStudio();
          }
        }
        : null,
      { separator: true },
      {
        id: 'add-lane',
        label: 'Add Lane',
        onSelect() {
          const nextState = appendMixerLane(getMixerStateSnapshot());
          applyMixerState(selectMixerLane(nextState, nextState.lanes.length - 1));
          syncStudioMixerSurface();
          syncStudioSummaryChrome();
          syncLibraryLaneTargetChrome();
        }
      }
    ]
  });
}

function initMixer() {
  const mixerSection = container.querySelector('#studio-mixer');
  const host = container.querySelector('#mixer-host') || mixerSection?.querySelector('.studio-section-content');
  if (!host) return;

  mixerController = createMixerComponent({
    mount: host,
    state: getMixerStateSnapshot(),
    timelineScale: studioTimelineScale,
    onTrackSelect: (id) => {
      applyMixerState(selectMixerTrack(getMixerStateSnapshot(), id));
      syncStudioMixerSurface();
    },
    onTrackMove: (id, offset, laneIndex) => {
      applyMixerState(moveMixerTrack(getMixerStateSnapshot(), { trackId: id, offset, laneIndex }));
      syncStudioMixerSurface();
      syncStudioSummaryChrome();
      syncLibraryLaneTargetChrome();
      syncStudioPlaybackMix();
    },
    onTrackMoveToNewLane: (id, offset) => {
      applyMixerState(moveMixerTrackToNewLane(getMixerStateSnapshot(), { trackId: id, offset }));
      syncStudioMixerSurface();
      syncStudioSummaryChrome();
      syncLibraryLaneTargetChrome();
      syncStudioPlaybackMix();
    },
    onTrackTrimStart: (id, trimStart) => {
      applyMixerState(trimMixerTrackStart(getMixerStateSnapshot(), { trackId: id, trimStart }));
      syncStudioMixerSurface();
      syncStudioSummaryChrome();
      syncStudioPlaybackMix();
    },
    onTrackTrimEnd: (id, trimEnd) => {
      applyMixerState(trimMixerTrackEnd(getMixerStateSnapshot(), { trackId: id, trimEnd }));
      syncStudioMixerSurface();
      syncStudioSummaryChrome();
      syncStudioPlaybackMix();
    },
    onTrackAutomationUpdate: (id, automation) => {
      applyMixerState(setMixerTrackAutomation(getMixerStateSnapshot(), id, automation));
      syncStudioMixerSurface();
    },
    onTrackAutomationCommit: () => {
      syncStudioPlaybackMix();
    },
    onTrackAutomationRemove: (id, idx) => {
      applyMixerState(removeMixerTrackKeyframe(getMixerStateSnapshot(), id, idx));
      syncStudioMixerSurface();
      syncStudioPlaybackMix();
    },
    onTrackAddKeyframe: (id, { time, value }) => {
      applyMixerState(addMixerTrackKeyframe(getMixerStateSnapshot(), id, { time, value }));
      syncStudioMixerSurface();
      syncStudioPlaybackMix();
    },
    onTrackFadeStyleChange: (id, style) => {
      applyMixerState(setMixerTrackFadeStyle(getMixerStateSnapshot(), id, style));
      syncStudioMixerSurface();
      syncStudioPlaybackMix();
    },
    onTrackVolumeChange: (id, volume) => window.updateTrackVolume(id, volume),
    onTrackCrossfadeMenu: openMixerCrossfadeContextMenu,
    onTrackMuteToggle: (id) => window.toggleTrackMute(id),
    onTrackSoloToggle: (id) => window.toggleTrackSolo(id),
    onTrackRemove: (id) => window.removeTrack(id),
    onTrackEdit: (id) => {
      const t = studioTracks.find(t => t.id === id);
      if (t) window.editAsset(t.assetId);
    },
    onTrackDuplicate: (id) => window.duplicateTrack(id),
    onTrackDoubleClick: (id) => {
      const t = studioTracks.find(t => t.id === id);
      if (t) window.editAsset(t.assetId);
    },
    onTrackContextMenu: openMixerTrackContextMenu,
    onLaneSelect: (idx) => window.selectLane(idx),
    onLaneMuteToggle: (idx) => window.toggleLaneMute(idx),
    onLaneSoloToggle: (idx) => window.toggleLaneSolo(idx),
    onLaneRemove: (idx) => window.removeLane(idx),
    onLaneRename: (idx, name) => window.renameLane(idx, name),
    onLaneVolumeChange: (idx, vol) => window.updateLaneVolume(idx, vol),
    onLaneContextMenu: openMixerLaneContextMenu,
    onLaneAdd: () => {
      applyMixerState(appendMixerLane(getMixerStateSnapshot()));
      syncStudioMixerSurface();
      syncStudioSummaryChrome();
      syncLibraryLaneTargetChrome();
    },
    onSeek: (time) => {
      studioCurrentPos = time;
      studioCursorVisible = true;
      if (isStudioPlaying || isStudioSeekAutoplayEnabled) playStudio(time);
      else syncMixerPlaybackChrome();
    },
    onScroll: (scrollLeft) => {
      // Sync other parts if needed
    },
    onRulerContextMenu: openMixerRulerContextMenu
  });
}

function stopPreview() {
  previewController?.stop?.();
}

async function playPreview(from = 0) {
  return previewController?.play?.(from);
}

function syncStudioPlaybackMix() {
  if (!isStudioPlaying || !audioCtx) return;
  const sync = playbackService.syncState({
    state: getMixerStateSnapshot()
  });
  if (sync?.requiresRestart) {
    playStudio(sync.restartFromTime ?? playbackService.getCurrentTime()).catch(() => {});
  }
}

export async function mount(parent) {
  resetStudioState();
  syncLaneSettings();

  container = document.createElement('div');
  container.className = 'tool-sound-studio';
  container.innerHTML = `
    <div class="rj-layout sound-studio-root-layout">
      <div class="sticky-studio-head">
        <div class="visualizer-container sound-studio-visualizer">
          <div class="sound-studio-viz-grid">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="viz-grid" width="80" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 80 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#viz-grid)" />
              <line x1="0" y1="25%" x2="100%" y2="25%" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
              <line x1="0" y1="75%" x2="100%" y2="75%" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
            </svg>
          </div>
          <div class="sound-studio-viz-overlay"></div>
          <canvas id="audio-viz-wave" class="sound-studio-viz-canvas sound-studio-viz-wave"></canvas>
          <canvas id="audio-viz-freq" class="sound-studio-viz-canvas sound-studio-viz-freq"></canvas>
          
          <div class="sound-studio-recorder-transport">
            <div id="rec-timer" class="sound-studio-recorder-timer">00:00:00</div>
            <div id="rec-dot" class="sound-studio-record-dot"></div>
            <button id="btn-rec-control" class="sound-studio-record-button">Start Recording</button>
          </div>
        </div>
      </div>

      <div class="studio-main-flow">
        
        <div class="rj-layout sound-studio-input-panel">
          <div class="sound-studio-input-header">
            <label class="nav-group-title sound-studio-section-label">Signal Chain & Input</label>
            <div class="sound-studio-input-actions">
               <div id="pre-noise-status" class="sound-studio-pre-noise-status">Auto-Profile Ready</div>
            </div>
          </div>

          <div class="compact-signal-grid">
            <div class="form-group">
              <label class="sound-studio-control-row">
                <div class="sound-studio-control-label">
                  <label class="rj-switch">
                    <input type="checkbox" id="input-gain-toggle" checked>
                    <span class="slider-switch"></span>
                  </label>
                  <span>Input Gain (+<span id="val-gain">1</span>dB)</span>
                </div>
                <button class="mini-btn reset-val sound-studio-reset-dot" data-for="input-gain">↺</button>
              </label>
              <input type="range" id="input-gain" min="0" max="2" step="0.01" value="1.05">
              <div class="info-hint">Boost or cut microphone level before processing.</div>
            </div>
            <div class="form-group">
              <label class="sound-studio-control-row">
                <div class="sound-studio-control-label">
                  <label class="rj-switch">
                    <input type="checkbox" id="comp-ratio-toggle" checked>
                    <span class="slider-switch"></span>
                  </label>
                  <span>Compression Ratio (<span id="val-ratio">5.5</span>:1)</span>
                </div>
                <button class="mini-btn reset-val sound-studio-reset-dot" data-for="comp-ratio">↺</button>
              </label>
              <input type="range" id="comp-ratio" min="1" max="20" step="0.5" value="5.5">
              <div class="info-hint">Reduce volume spikes for a more consistent sound.</div>
            </div>
            <div class="form-group">
              <label class="sound-studio-control-row">
                <div class="sound-studio-control-label">
                  <label class="rj-switch">
                    <input type="checkbox" id="rec-gate-toggle" checked>
                    <span class="slider-switch"></span>
                  </label>
                  <span>Gate Threshold (<span id="val-gate">-40</span>dB)</span>
                </div>
                <button class="mini-btn reset-val sound-studio-reset-dot" data-for="rec-gate">↺</button>
              </label>
              <input type="range" id="rec-gate" min="-100" max="-20" step="1" value="-40">
              <div class="info-hint">Mute background hiss by setting a floor for active audio.</div>
            </div>
          </div>
          
          <div class="sound-studio-recording-settings">
             <div class="sound-studio-recording-column">
                <label class="sound-studio-field-label">Recording Mode</label>
                <div class="sound-studio-recording-mode-row">
                   <div class="sound-studio-inline-control" data-tooltip="Auto-adjust noise gate based on live room environment.">
                      <label class="rj-switch">
                        <input type="checkbox" id="rec-anc">
                        <span class="slider-switch"></span>
                      </label>
                      <label for="rec-anc" class="sound-studio-mode-label sound-studio-mode-label-success">Adaptive ANC</label>
                   </div>
                   <div class="sound-studio-inline-control" data-tooltip="Record clean audio without any processing applied.">
                      <label class="rj-switch">
                        <input type="checkbox" id="rec-raw">
                        <span class="slider-switch"></span>
                      </label>
                      <label for="rec-raw" class="sound-studio-mode-label">Raw Bypass</label>
                   </div>
                </div>
             </div>
             <div class="sound-studio-recording-column">
               <label class="sound-studio-field-label">Encoding Engine</label>
               <select id="rec-engine" class="sound-studio-encoding-select">
                 <option value="wav">Lossless PCM (WAV)</option>
                 <option value="audio/mpeg">Standard MP3 (LAME)</option>
                 <option value="audio/webm;codecs=opus">WebM Opus (Voice)</option>
                 <option value="audio/mp4;codecs=mp4a.40.2">AAC Low Complexity (MP4)</option>
               </select>
               <div class="info-hint">WAV for quality, MP3/AAC for compatibility, Opus for voice.</div>             </div>
          </div>

          <!-- TRIMMER VIEW -->
          <div id="trim-area" class="hidden sound-studio-trim-area">
             <div class="sound-studio-trim-panel">
                <div class="sound-studio-trim-header">
                  <div class="sound-studio-trim-title-stack">
                    <label class="nav-group-title sound-studio-section-label">Adjustments & Trim</label>
                  </div>
                  <div class="sound-studio-selection-controls">
                    <button id="btn-select-noise" class="mini-btn sound-studio-selection-control sound-studio-pill-button" data-selection-tone="danger" data-tooltip="Activate noise selection mode.">Select Noise Profile</button>
                    <button id="btn-clear-noise" class="mini-btn sound-studio-selection-control sound-studio-pill-button hidden" data-selection-tone="danger" data-tooltip="Reset noise profile to auto-detected floor.">Clear Noise Profile</button>
                    <button id="btn-select-effect-range" class="mini-btn sound-studio-selection-control sound-studio-pill-button" data-selection-tone="accent" data-tooltip="Mark a local range for clip effects.">Select Effect Range</button>
                    <button id="btn-clear-effect-range" class="mini-btn sound-studio-selection-control sound-studio-pill-button hidden" data-selection-tone="accent" data-tooltip="Clear the current effect range selection.">Clear Effect Range</button>
                    <button id="btn-delete-selection" class="mini-btn sound-studio-selection-control sound-studio-pill-button" data-selection-tone="danger" data-tooltip="Remove the selected audio from this clip." disabled>Delete Selection</button>
                    <button id="btn-trim-reset" class="mini-btn sound-studio-pill-button" data-tooltip="Restore original clip settings.">Reset Defaults</button>
                  </div>
                </div>
                
                <div id="sound-trim-host" class="sound-studio-focus-surface sound-studio-trim-host" tabindex="0"></div>

                <div class="sound-studio-local-effects-shell">
                  <div class="sound-studio-trim-toolbar">
                    <div class="sound-studio-trim-statuses">
                      <div id="effect-range-status" class="sound-studio-selection-status" data-selection-tone="accent">No effect range selected</div>
                      <div id="clip-effect-count" class="sound-studio-selection-status" data-selection-tone="accent">0 local effects</div>
                      <div id="clip-volume-envelope-readout" class="sound-studio-selection-status sound-studio-envelope-readout" data-selection-tone="accent">Flat 0 dB</div>
                    </div>
                    <div class="sound-studio-trim-actions">
                      <button id="btn-reset-volume-envelope" class="mini-btn sound-studio-pill-button">Reset Envelope</button>
                      <button id="btn-apply-effects-to-asset" class="mini-btn sound-studio-pill-button" disabled>Apply Effects</button>
                      <button id="btn-undo-applied-effects" class="mini-btn sound-studio-pill-button" disabled>Undo Apply</button>
                      <button id="btn-clear-effects" class="mini-btn sound-studio-pill-button">Clear Local Edits</button>
                    </div>
                  </div>
                  <div id="effects-section" class="sound-studio-effects-grid">
                    <button id="btn-effect-silence" class="mini-btn sound-studio-pill-button" disabled>Silence</button>
                    <button id="btn-effect-fade-in" class="mini-btn sound-studio-pill-button" disabled>Fade In</button>
                    <button id="btn-effect-fade-out" class="mini-btn sound-studio-pill-button" disabled>Fade Out</button>
                    <button id="btn-effect-normalize" class="mini-btn sound-studio-pill-button" disabled>Normalize</button>
                    <button id="btn-effect-reverse" class="mini-btn sound-studio-pill-button" disabled>Reverse</button>
                    <button id="btn-effect-low-pass" class="mini-btn sound-studio-pill-button" disabled>Low Pass</button>
                    <button id="btn-effect-high-pass" class="mini-btn sound-studio-pill-button" disabled>High Pass</button>
                    <button id="btn-effect-band-pass" class="mini-btn sound-studio-pill-button" disabled>Band Pass</button>
                    <button id="btn-effect-notch" class="mini-btn sound-studio-pill-button" disabled>Notch</button>
                    <button id="btn-effect-talkback" class="mini-btn sound-studio-pill-button" disabled>Talkback</button>
                    <button id="btn-effect-vocal-remove" class="mini-btn sound-studio-pill-button" disabled>Vocal Remover</button>
                    <button id="btn-effect-de-esser" class="mini-btn sound-studio-pill-button" disabled>De-Esser</button>
                    <button id="btn-effect-radio" class="mini-btn sound-studio-pill-button" disabled>Radio</button>
                    <button id="btn-effect-bass-cut" class="mini-btn sound-studio-pill-button" disabled>Bass Cut</button>
                    <button id="btn-effect-noise-gate" class="mini-btn sound-studio-pill-button" disabled>Noise Gate</button>
                    <button id="btn-effect-reverb" class="mini-btn sound-studio-pill-button" disabled>Reverb</button>
                    <button id="btn-effect-compression" class="mini-btn sound-studio-pill-button" disabled>Compression</button>
                    <button id="btn-effect-saturation" class="mini-btn sound-studio-pill-button" disabled>Saturation</button>
                    <button id="btn-effect-formant-shift" class="mini-btn sound-studio-pill-button" disabled>Formant Shift</button>
                    <button id="btn-effect-pitch-shift" class="mini-btn sound-studio-pill-button" disabled>Pitch Shift</button>
                    <button id="btn-effect-echo" class="mini-btn sound-studio-pill-button" disabled>Echo</button>
                  </div>
                  <div id="clip-effect-editor" class="sound-studio-effect-editor hidden">
                    <div class="form-group hidden sound-studio-effect-field" data-effect-field="fade">
                      <label class="sound-studio-effect-field-label">
                        <span>Fade Curve</span>
                        <span id="clip-effect-fade-readout">1.0x</span>
                      </label>
                      <input type="range" id="clip-effect-fade-curve" min="0.5" max="3" step="0.1" value="1">
                      <div class="info-hint">Adjusts the steepness of the fade. Use 1.0 for linear transitions or higher values for a natural exponential feel.</div>
                    </div>
                    <div class="form-group hidden sound-studio-effect-field" data-effect-field="normalize">
                      <label class="sound-studio-effect-field-label">
                        <span>Normalize Target</span>
                        <span id="clip-effect-normalize-readout">-1 dB</span>
                      </label>
                      <input type="range" id="clip-effect-normalize-db" min="-18" max="0" step="1" value="-1">
                      <div class="info-hint">Rescales the selection so the loudest peak reaches this level. Use -1.0 dB to maximize volume without clipping.</div>
                    </div>
                    <div class="form-group hidden sound-studio-effect-field" data-effect-field="filter">
                      <label class="sound-studio-effect-field-label">
                        <span>Cutoff</span>
                        <span id="clip-effect-filter-readout">1200 Hz</span>
                      </label>
                      <input type="range" id="clip-effect-filter-hz" min="120" max="12000" step="10" value="1200">
                      <div class="info-hint">Frequency threshold for frequency removal. Low Pass keeps bass and cuts treble; High Pass keeps treble and cuts rumble.</div>
                    </div>
                    <div class="form-group hidden sound-studio-effect-field" data-effect-field="echo">
                      <label class="sound-studio-effect-field-label">
                        <span>Delay</span>
                        <span id="clip-effect-echo-delay-readout">180 ms</span>
                      </label>
                      <input type="range" id="clip-effect-echo-delay" min="40" max="800" step="10" value="180">
                      <div class="info-hint">The time interval between repeats. Use short values (40-100ms) for slapback or longer values for rhythmic depth.</div>
                    </div>
                    <div class="form-group hidden sound-studio-effect-field" data-effect-field="echo-decay">
                      <label class="sound-studio-effect-field-label">
                        <span>Decay</span>
                        <span id="clip-effect-echo-decay-readout">35%</span>
                      </label>
                      <input type="range" id="clip-effect-echo-decay" min="5" max="90" step="1" value="35">
                      <div class="info-hint">Determines how long the echo persists. Higher percentages create more feedback and a longer trailing tail.</div>
                    </div>
                    <div class="form-group hidden sound-studio-effect-field" data-effect-field="shift">
                      <label class="sound-studio-effect-field-label">
                        <span>Shift</span>
                        <span id="clip-effect-shift-readout">+3 st</span>
                      </label>
                      <input type="range" id="clip-effect-shift-st" min="-12" max="12" step="1" value="3">
                      <div class="info-hint">Pitch or formant movement for the selected range.</div>
                    </div>
                    <div class="form-group hidden sound-studio-effect-field" data-effect-field="amount">
                      <label class="sound-studio-effect-field-label">
                        <span>Amount</span>
                        <span id="clip-effect-amount-readout">76%</span>
                      </label>
                      <input type="range" id="clip-effect-amount" min="0" max="100" step="1" value="76">
                      <div class="info-hint">Controls how strongly the selected voice utility effect is applied.</div>
                    </div>
                    <div class="sound-studio-effect-editor-copy">
                      <div id="clip-effect-editor-title" class="sound-studio-effect-editor-title">Ready</div>
                      <div id="clip-effect-editor-detail" class="sound-studio-effect-editor-detail">Select a range, then apply or revise a local clip effect.</div>
                      <button id="btn-update-effect" class="mini-btn sound-studio-pill-button sound-studio-update-effect-button" disabled>Update Selected Effect</button>
                    </div>
                  </div>
                  <div id="clip-effect-list" class="sound-studio-effect-list"></div>
                </div>

                <div class="settings-grid sound-studio-trim-settings-grid">
                  <div class="form-group">
                    <label class="sound-studio-control-row">
                      <div class="sound-studio-control-label">
                        <label class="rj-switch">
                          <input type="checkbox" id="trim-speed-toggle" checked>
                          <span class="slider-switch"></span>
                        </label>
                        <span>Duration Speed (<span id="val-speed">1.0</span>x)</span>
                      </div>
                      <button class="mini-btn reset-val sound-studio-reset-dot" data-for="trim-speed">↺</button>
                    </label>
                    <input type="range" id="trim-speed" min="0.5" max="2" step="0.1" value="1">
                    <div class="info-hint">Time-stretch audio without changing the pitch.</div>
                  </div>
                  <div class="form-group">
                    <label class="sound-studio-control-row">
                      <div class="sound-studio-control-label">
                        <label class="rj-switch">
                          <input type="checkbox" id="trim-pitch-toggle" checked>
                          <span class="slider-switch"></span>
                        </label>
                        <span>Pitch Shift (<span id="val-pitch">0</span> st)</span>
                      </div>
                      <button class="mini-btn reset-val sound-studio-reset-dot" data-for="trim-pitch">↺</button>
                    </label>
                    <input type="range" id="trim-pitch" min="-12" max="12" step="1" value="0">
                    <div class="info-hint">Change the pitch of the clip without affecting its speed.</div>
                  </div>
                  <div class="form-group">
                    <label class="sound-studio-control-row">
                      <div class="sound-studio-control-label">
                        <label class="rj-switch">
                          <input type="checkbox" id="trim-postgain-toggle" checked>
                          <span class="slider-switch"></span>
                        </label>
                        <span>Post-Process Gain (<span id="val-postgain">0</span>dB)</span>
                      </div>
                      <button class="mini-btn reset-val sound-studio-reset-dot" data-for="trim-postgain">↺</button>
                    </label>
                    <input type="range" id="trim-postgain" min="-30" max="20" step="1" value="0">
                    <div class="info-hint">Adjust the final volume level of this specific segment.</div>
                  </div>
                  <div class="form-group">
                    <label class="sound-studio-control-row">
                      <div class="sound-studio-control-label">
                        <label class="rj-switch">
                          <input type="checkbox" id="trim-leveler-toggle" checked>
                          <span class="slider-switch"></span>
                        </label>
                        <span>Dynamic Leveler (<span id="val-leveler">0</span>%)</span>
                      </div>
                      <button class="mini-btn reset-val sound-studio-reset-dot" data-for="trim-leveler">↺</button>
                    </label>
                    <input type="range" id="trim-leveler" min="0" max="100" step="1" value="0">
                    <div class="info-hint">Auto-normalize and balance volume across the clip.</div>
                  </div>
                  
                  <div class="sound-studio-trim-noise-row">
                    <div class="form-group sound-studio-trim-noise-group">
                      <label class="sound-studio-control-row">
                        <div class="sound-studio-control-label">
                          <label class="rj-switch">
                            <input type="checkbox" id="trim-noise-toggle" checked>
                            <span class="slider-switch"></span>
                          </label>
                          <span>Spectral Noise Reducer (<span id="val-noise">0</span>%)</span>
                        </div>
                        <button class="mini-btn reset-val sound-studio-reset-dot" data-for="trim-noise">↺</button>
                      </label>
                      <input type="range" id="trim-noise" min="0" max="100" step="1" value="0">
                      <div class="info-hint">Remove unwanted artifacts using Magnitude Over-subtraction & Expansion.</div>
                      <div id="noise-profile-status" class="sound-studio-selection-status sound-studio-noise-profile-status hidden" data-selection-tone="danger">Manual Profile Active</div>
                    </div>
                  </div>
                </div>

                <div class="sound-studio-trim-action-row">
                  <button id="btn-discard-trim" class="btn-secondary danger sound-studio-trim-discard" data-tooltip="Delete this recording and return to studio.">Discard</button>
                  <button id="btn-save-trim" class="sound-studio-trim-save" data-tooltip="Process effects and add this clip to the mixer timeline.">Add to Mixer</button>
                </div>
             </div>
          </div>
        </div>

        <!-- STUDIO MIXER SECTION -->
        <div id="studio-mixer" class="studio-section expanded sound-studio-mixer-shell">
          <div class="studio-section-header sound-studio-mixer-header">
            <div class="sound-studio-mixer-summary">
              <span class="studio-section-title sound-studio-mixer-title">Mixer</span>
              <div class="sound-studio-mixer-metrics">
                <div class="sound-studio-mixer-metric">
                  <span class="sound-studio-mixer-metric-label">Length</span>
                  <strong id="metric-duration" class="sound-studio-mixer-metric-value">00:00</strong>
                </div>
                <div class="sound-studio-mixer-metric">
                  <span class="sound-studio-mixer-metric-label">Tracks</span>
                  <strong id="metric-tracks" class="sound-studio-mixer-metric-value">0</strong>
                </div>
              </div>
            </div>
            <div class="sound-studio-mixer-toolbar">
               <div class="sound-studio-mixer-transport" data-tooltip="Listen to the full mixdown of all active tracks.">
                  <button id="btn-studio-play" class="media-trimmer-playback sound-studio-transport-toggle" type="button" aria-label="Toggle mixer playback">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" data-role="studio-play-icon"><path d="M8 5.14v14l11-7-11-7z"/></svg>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" class="hidden" data-role="studio-pause-icon"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  </button>
                  <div class="media-trimmer-loop-shell sound-studio-transport-switch" data-tooltip="Automatically restart playback from the beginning.">
                    <label class="rj-switch">
                      <input type="checkbox" id="studio-loop">
                      <span class="slider-switch"></span>
                    </label>
                    <label for="studio-loop" class="media-trimmer-loop-label">Loop</label>
                  </div>
                  <div class="media-trimmer-loop-shell sound-studio-transport-switch" data-tooltip="Start playback when the ruler is clicked while transport is idle.">
                    <label class="rj-switch">
                      <input type="checkbox" id="studio-autoplay">
                      <span class="slider-switch"></span>
                    </label>
                    <label for="studio-autoplay" class="media-trimmer-loop-label">Autoplay</label>
                  </div>
               </div>
                <div class="sound-studio-mixer-zoom" data-tooltip="Scale timeline for precise clip placement.">
                  <label class="sound-studio-mixer-zoom-label">Zoom</label>
                  <input type="range" id="studio-zoom" class="sound-studio-mixer-zoom-range" min="0.01" max="500" value="100" step="0.01">
                  <button id="btn-studio-zoom-fit" class="mini-btn sound-studio-mixer-fit">Fit</button>
                  <button id="btn-studio-zoom-selection" class="mini-btn sound-studio-mixer-fit">Selection</button>
               </div>
               <button id="btn-studio-add-track" class="sound-studio-mixer-action sound-studio-mixer-action-accent" data-tooltip="Manage your media library and add clips to the mixer.">Media Library</button>
               <button id="btn-studio-export" class="sound-studio-mixer-action sound-studio-mixer-action-export" data-tooltip="Render all tracks into a single lossless WAV.">Export Mix</button>
            </div>
            <input type="file" id="studio-upload-input" class="hidden" accept="audio/*,video/*" multiple>
          </div>
          
          <div class="studio-section-content sound-studio-mixer-content">
            <div class="studio-mixer-grid">
              <!-- Left: Controls -->
              <div id="studio-controls-col" class="studio-controls-col">
                 <div class="studio-lanes-title">Mixer Lanes</div>
                 <div id="studio-lanes-controls" class="studio-lanes-controls"></div>
                 <button id="btn-add-lane" class="mini-btn studio-add-lane">+ Add Lane</button>
              </div>
              
              <!-- Right: Timeline -->
              <div class="studio-timeline-shell">
                <div id="studio-timeline-container" class="sound-studio-focus-surface" tabindex="0">
                   <div id="studio-timeline-ruler">
                      <canvas id="studio-ruler-canvas" class="sound-studio-mixer-ruler-canvas"></canvas>
                   </div>
                   <div id="studio-playhead"></div>
                   <div id="studio-tracks-lanes"></div>
                   <div id="studio-new-lane-drop" class="studio-new-lane-drop"></div>
                </div>
                <div id="studio-new-lane-drop-callout" class="studio-new-lane-drop-callout">Drop files or clips here to create a lane</div>
              </div>
            </div>
            
            <div id="studio-empty-msg" class="studio-empty-state">
               <span>No tracks in studio. Record or open library to begin.</span>
               <button id="btn-studio-empty-lib" class="btn-secondary studio-empty-state-action">Open Media Library</button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- MEDIA LIBRARY MODAL -->
    <div id="modal-library" class="studio-modal">
      <div class="modal-content">
        <div class="modal-header">
          <div class="sound-studio-modal-title-stack">
            <span class="sound-studio-modal-title">Media Library</span>
            <div class="sound-studio-library-toolbar">
              <span id="library-target-lane" class="studio-library-target">Selected lane: Lane 1</span>
              <select id="library-target-select" class="rj-select sound-studio-library-target-select"></select>
              <span class="studio-library-note">Drag clips to the mixer or create a new lane below the timeline.</span>
            </div>
          </div>
          <div class="sound-studio-modal-actions">
            <button id="btn-lib-import" class="btn-secondary sound-studio-modal-button sound-studio-modal-button-compact">Import Audio</button>
            <button id="btn-lib-close" class="mini-btn danger sound-studio-modal-close">Close</button>
          </div>
        </div>
        <div class="modal-body" id="library-list">
          <div id="library-dropzone" class="studio-library-dropzone">Drop audio or video files here to import them into the library</div>
          <div class="studio-library-empty">Your library is empty.</div>
        </div>
      </div>
    </div>

    <div id="modal-record-confirm" class="studio-modal">
      <div class="modal-content sound-studio-modal-content-compact">
        <div class="modal-header">
          <div class="sound-studio-modal-title-stack">
            <span class="sound-studio-modal-title">Start Another Recording</span>
            <div class="sound-studio-modal-copy">The current unsaved recording is still open in the trimmer. Discard it or append the next take to its end.</div>
          </div>
          <button id="btn-record-confirm-close" class="mini-btn danger sound-studio-modal-close">Close</button>
        </div>
        <div class="modal-body sound-studio-modal-body-tight">
          <button id="btn-record-restart-discard" class="btn-secondary danger sound-studio-modal-action-button sound-studio-modal-action-button-primary">Discard Current Take</button>
          <button id="btn-record-restart-append" class="btn-secondary sound-studio-modal-action-button sound-studio-modal-action-button-primary">Append New Take</button>
          <button id="btn-record-restart-cancel" class="btn-secondary sound-studio-modal-action-button">Cancel</button>
        </div>
      </div>
    </div>
  `;
  
  parent.appendChild(container);
  studioContextMenu = createContextMenu({
    documentTarget: document,
    mount: container
  });
  initMixer();
  setupListeners();
  initVisualizers();
  renderLibrary();
  renderStudio();
  setStudioStatus('Ready');
  setupSoundStudioMediaControls();
  container.addEventListener('focusin', (event) => {
    if (event.target?.closest?.('#sound-trim-host, .media-trimmer')) {
      setActiveKeyboardSurface('trimmer');
      return;
    }
    if (event.target?.closest?.('#studio-mixer')) {
      setActiveKeyboardSurface('mixer');
    }
  });
  container.addEventListener('pointerdown', (event) => {
    if (event.target?.closest?.('#sound-trim-host, .media-trimmer')) {
      setActiveKeyboardSurface('trimmer');
      return;
    }
    if (event.target?.closest?.('#studio-mixer')) {
      setActiveKeyboardSurface('mixer');
    }
  });

  removeShortcuts = registerShortcuts([
    {
      code: 'Space',
      when: () => container?.isConnected && document.activeElement?.closest?.('.tool-sound-studio') !== null,
      handler: () => {
        if (resolveActiveKeyboardSurface() === 'trimmer') {
          if (currentPreviewAudio && !currentPreviewAudio.paused) stopPreview();
          else playPreview();
        }
        else container.querySelector('#btn-studio-play').click();
      }
    },
    {
      key: 'MediaPlayPause',
      when: () => container?.isConnected,
      handler: () => {
        if (resolveActiveKeyboardSurface() === 'trimmer') {
          if (currentPreviewAudio && !currentPreviewAudio.paused) stopPreview();
          else playPreview();
        }
        else container.querySelector('#btn-studio-play').click();
      }
    },
    {
      code: 'Delete',
      when: () => container?.isConnected && resolveActiveKeyboardSurface() === 'trimmer',
      handler: () => {
        deleteSelectedTrimmerAudioRange();
      }
    },
    {
      code: 'Backspace',
      when: () => container?.isConnected && resolveActiveKeyboardSurface() === 'trimmer',
      handler: () => {
        deleteSelectedTrimmerAudioRange();
      }
    },
    {
      code: 'Delete',
      when: () => container?.isConnected && selectedTrackId !== null,
      handler: () => {
        window.removeTrack(selectedTrackId);
      }
    },
    {
      code: 'Backspace',
      when: () => container?.isConnected && selectedTrackId !== null,
      handler: () => {
        window.removeTrack(selectedTrackId);
      }
    }
  ]);
}

function setStudioStatus(message, tone = 'neutral', duration = 2400) {
  const nextMessage = String(message || '').trim();
  if (!nextMessage || nextMessage === 'Ready') return;
  if (tone === 'neutral' && duration === 0) return;
  const toastTone = tone === 'danger' ? 'danger' : tone === 'success' ? 'success' : 'info';
  showToast(nextMessage, toastTone, duration > 0 ? duration : 2200);
}

function setupListeners() {
  const btnRec = container.querySelector('#btn-rec-control');
  const gainIn = container.querySelector('#input-gain');
  const ratioIn = container.querySelector('#comp-ratio');
  const speedIn = container.querySelector('#trim-speed');
  const postGainIn = container.querySelector('#trim-postgain');
  const pitchIn = container.querySelector('#trim-pitch');
  const recordConfirmModal = container.querySelector('#modal-record-confirm');
  const closeRecordConfirmModal = () => {
    recordConfirmModal?.classList.remove('active');
  };
  const startRecordingFromModal = (mode) => {
    pendingRecordResumeMode = mode;
    closeRecordConfirmModal();
    startRecording();
  };

  const updatePreNodes = () => {
    if (!audioCtx) return;
    const gainToggled = container.querySelector('#input-gain-toggle').checked;
    const compToggled = container.querySelector('#comp-ratio-toggle').checked;
    const gateToggled = container.querySelector('#rec-gate-toggle').checked;

    if (inputGainNode) {
      inputGainNode.gain.setTargetAtTime(gainToggled ? Number.parseFloat(gainIn.value) : 1.0, audioCtx.currentTime, 0.05);
    }

    if (compressorNode) {
      compressorNode.ratio.setTargetAtTime(compToggled ? Number.parseFloat(ratioIn.value) : 1.0, audioCtx.currentTime, 0.05);
    }

    if (gateNode) {
      const gateValue = Number.parseFloat(container.querySelector('#rec-gate').value);
      gateNode.threshold.setTargetAtTime(gateToggled ? gateValue : -100.0, audioCtx.currentTime, 0.05);
    }
  };

  gainIn.oninput = (e) => {
    container.querySelector('#val-gain').textContent = Math.round((Number.parseFloat(e.target.value) - 1) * 20);
    updatePreNodes();
  };
  ratioIn.oninput = (e) => {
    container.querySelector('#val-ratio').textContent = e.target.value;
    updatePreNodes();
  };
  container.querySelector('#rec-gate').oninput = (e) => {
    container.querySelector('#val-gate').textContent = e.target.value;
    updatePreNodes();
  };
  container.querySelector('#input-gain-toggle').onchange = updatePreNodes;
  container.querySelector('#comp-ratio-toggle').onchange = updatePreNodes;
  container.querySelector('#rec-gate-toggle').onchange = updatePreNodes;

  container.querySelector('#rec-raw').onchange = (e) => {
    const isRaw = e.target.checked;
    [
      '#rec-anc',
      '#input-gain',
      '#comp-ratio',
      '#rec-gate',
      '#input-gain-toggle',
      '#comp-ratio-toggle',
      '#rec-gate-toggle'
    ].forEach((selector) => {
      container.querySelector(selector).disabled = isRaw;
    });

    if (isRecording) {
      stopRecording();
    }
  };

  btnRec.onclick = () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    if (container.classList.contains('trimmer-active') && editingAssetId === null && activeTrimmerSource === 'recording') {
      recordConfirmModal?.classList.add('active');
      return;
    }
    pendingRecordResumeMode = null;
    startRecording();
  };

  const btnTrimReset = container.querySelector('#btn-trim-reset');
  if (btnTrimReset) {
    btnTrimReset.onclick = () => {
      speedIn.value = 1.0;
      pitchIn.value = 0;
      postGainIn.value = 0;
      container.querySelector('#trim-leveler').value = 0;
      container.querySelector('#trim-noise').value = 0;

      ['speed', 'pitch', 'postgain', 'leveler', 'noise'].forEach((key) => {
        container.querySelector(`#val-${key}`).textContent = key === 'speed' ? '1.0' : '0';
      });

      ['speed', 'pitch', 'postgain', 'leveler', 'noise'].forEach((key) => {
        container.querySelector(`#trim-${key}-toggle`).checked = true;
      });

      [
        speedIn,
        pitchIn,
        postGainIn,
        container.querySelector('#trim-leveler'),
        container.querySelector('#trim-noise')
      ].forEach((input) => input.dispatchEvent(new Event('input')));
    };
  }

  const btnStudioPlay = container.querySelector('#btn-studio-play');
  const btnStudioAdd = container.querySelector('#btn-studio-add-track');
  const btnStudioExport = container.querySelector('#btn-studio-export');
  const studioUploadInput = container.querySelector('#studio-upload-input');
  const modalLib = container.querySelector('#modal-library');
  const btnLibClose = container.querySelector('#btn-lib-close');
  const btnLibImport = container.querySelector('#btn-lib-import');
  const newLaneDrop = container.querySelector('#studio-new-lane-drop');
  const newLaneDropCallout = container.querySelector('#studio-new-lane-drop-callout');
  const studioLoopToggle = container.querySelector('#studio-loop');
  const studioAutoplayToggle = container.querySelector('#studio-autoplay');
  const getDroppedMediaFiles = (fileList) => Array.from(fileList || []).filter((file) => (
    file?.type?.startsWith?.('audio/') ||
    file?.type?.startsWith?.('video/') ||
    /\.(wav|mp3|m4a|aac|ogg|flac|opus|webm|mp4|m4v|mov|mkv|avi)$/i.test(file?.name || '')
  ));
  const importFilesToLibrary = async (fileList, options = {}) => {
    const files = getDroppedMediaFiles(fileList);
    const importedAssets = [];
    const shouldRenderStudio = options.renderStudio !== false;
    for (const file of files) {
      try {
        const asset = await importAudioFile(file);
        if (asset) importedAssets.push(asset);
      } catch (error) {
        setStudioStatus(error.message, 'danger', 3600);
        showToast(error.message, 'danger');
      }
    }
    if (importedAssets.length) {
      renderLibrary();
      if (shouldRenderStudio) {
        syncStudioMixerSurface();
        syncStudioSummaryChrome();
        syncLibraryLaneTargetChrome();
        syncStudioTransportChrome();
      }
    }
    return importedAssets;
  };
  const setImportStatus = (count, openedLibrary = false) => {
    if (!count) return;
    if (openedLibrary) modalLib.classList.add('active');
    setStudioStatus(count === 1 ? '1 clip imported' : `${count} clips imported`, 'success');
  };
  const addImportedAssetsToSelectedLane = (assets) => {
    if (!assets.length) return;
    const laneIndex = selectedLaneIndex;
    const laneName = laneSettings[laneIndex]?.name || `Lane ${laneIndex + 1}`;
    assets.forEach((asset) => {
      addTrackToMixer(asset, laneIndex);
    });
    setStudioStatus(
      assets.length === 1
        ? `1 clip imported to ${laneName}`
        : `${assets.length} clips imported to ${laneName}`,
      'success'
    );
  };
  
  modalLib.ondragover = (e) => {
    e.preventDefault();
    modalLib.classList.add('dragover');
  };
  modalLib.ondragleave = () => {
    modalLib.classList.remove('dragover');
  };
  modalLib.ondrop = async (e) => {
    e.preventDefault();
    modalLib.classList.remove('dragover');
    const importedAssets = await importFilesToLibrary(e.dataTransfer.files);
    setImportStatus(importedAssets.length);
  };

  btnStudioPlay.onpointerdown = (event) => {
    event.stopPropagation();
  };
  btnStudioPlay.onclick = (event) => {
    event.stopPropagation();
    if (!isStudioPlaying) {
      playStudio(studioCursorVisible ? studioCurrentPos : 0);
    } else {
      stopStudio();
    }
  };
  btnStudioAdd.onclick = () => {
    modalLib.classList.add('active');
    renderLibrary();
  };
  btnLibClose.onclick = () => modalLib.classList.remove('active');
  modalLib.onclick = (event) => {
    if (event.target === modalLib) modalLib.classList.remove('active');
  };
  btnLibImport.onclick = () => studioUploadInput.click();
  const emptyLibraryButton = container.querySelector('#btn-studio-empty-lib');
  if (emptyLibraryButton) {
    emptyLibraryButton.onclick = () => {
      modalLib.classList.add('active');
      renderLibrary();
    };
  }
  container.querySelector('#btn-record-confirm-close').onclick = closeRecordConfirmModal;
  container.querySelector('#btn-record-restart-cancel').onclick = closeRecordConfirmModal;
  container.querySelector('#btn-record-restart-discard').onclick = () => {
    closeTrimmerArea();
    startRecordingFromModal('discard');
  };
  container.querySelector('#btn-record-restart-append').onclick = () => {
    startRecordingFromModal('append');
  };
  recordConfirmModal.onclick = (event) => {
    if (event.target === recordConfirmModal) closeRecordConfirmModal();
  };
  const libraryTargetSelect = container.querySelector('#library-target-select');
  if (libraryTargetSelect) {
    libraryTargetSelect.onchange = (event) => {
      window.selectLane(Number(event.target.value));
    };
  }
  [studioLoopToggle, studioAutoplayToggle].forEach((toggle) => {
    if (!toggle) return;
    toggle.onpointerdown = (event) => {
      event.stopPropagation();
    };
  });
  if (studioAutoplayToggle) {
    studioAutoplayToggle.onchange = (event) => {
      event.stopPropagation();
      isStudioSeekAutoplayEnabled = !!event.target.checked;
      syncStudioTransportChrome();
    };
  }

  btnStudioExport.onclick = exportStudioMix;
  studioUploadInput.onchange = async (e) => {
    const importedAssets = await importFilesToLibrary(e.target.files);
    studioUploadInput.value = '';
    setImportStatus(importedAssets.length, true);
  };

  container.querySelector('#studio-zoom').oninput = (e) => {
    const timeline = mixerController?.getTimelineContainer();
    if (!timeline) return;
    const nextScale = parseFloat(e.target.value);
    const nextScrollLeft = studioCursorVisible
      ? getAnchoredMixerScrollLeft({
        scrollLeft: timeline.scrollLeft,
        viewportWidth: timeline.clientWidth,
        oldScale: studioTimelineScale,
        newScale: nextScale,
        anchorTime: studioCurrentPos
      })
      : getAnchoredMixerScrollLeft({
        scrollLeft: timeline.scrollLeft,
        viewportWidth: timeline.clientWidth,
        oldScale: studioTimelineScale,
        newScale: nextScale
      });
    studioTimelineScale = nextScale;
    mixerController?.updateScale(nextScale);
    if (isStudioPlaying) mixerController?.setPlayhead(studioCurrentPos);
    timeline.scrollLeft = nextScrollLeft;
  };
  container.querySelector('#studio-zoom').onchange = () => {
    syncStudioMixerSurface({ syncScale: true });
    syncStudioSummaryChrome();
    syncLibraryLaneTargetChrome();
    syncStudioTransportChrome();
  };
  container.querySelector('#btn-studio-zoom-fit').onclick = () => {
    fitStudioTimeline();
  };
  container.querySelector('#btn-studio-zoom-selection').onclick = () => {
    zoomStudioTimelineToSelection();
  };
  window.selectLane = (idx) => {
    applyMixerState(selectMixerLane(getMixerStateSnapshot(), idx));
    syncStudioMixerSurface();
    syncLibraryLaneTargetChrome();
  };
  window.renameLane = (idx, value) => {
    applyMixerState(renameMixerLane(getMixerStateSnapshot(), idx, value));
    syncStudioMixerSurface();
    syncLibraryLaneTargetChrome();
  };

  const mixerSec = container.querySelector('#studio-mixer');
  mixerSec.ondragover = (e) => {
    e.preventDefault();
    mixerSec.classList.add('is-drop-hover');
  };
  mixerSec.ondragleave = () => {
    mixerSec.classList.remove('is-drop-hover');
  };
  mixerSec.ondrop = async (e) => {
    e.preventDefault();
    mixerSec.classList.remove('is-drop-hover');
    const importedAssets = await importFilesToLibrary(e.dataTransfer.files, { renderStudio: false });
    addImportedAssetsToSelectedLane(importedAssets);
  };
  newLaneDrop.ondragover = (e) => {
    e.preventDefault();
    setNewLaneDropHighlight(true);
  };
  newLaneDrop.ondragleave = () => {
    setNewLaneDropHighlight(false);
  };
  newLaneDrop.ondrop = async (e) => {
    e.preventDefault();
    setNewLaneDropHighlight(false);
    const assetId = e.dataTransfer.getData('application/x-sound-asset-id');
    if (assetId) {
      applyMixerState(appendMixerLane(getMixerStateSnapshot()));
      const asset = audioLibrary.find((entry) => String(entry.id) === String(assetId));
      if (asset) {
        await addTrackToMixer(asset, studioLanesCount - 1, 0);
        setStudioStatus('New lane created from library clip', 'success');
      } else {
        syncStudioMixerSurface();
        syncStudioSummaryChrome();
        syncLibraryLaneTargetChrome();
      }
      return;
    }
    const importedAssets = await importFilesToLibrary(e.dataTransfer.files, { renderStudio: false });
    if (!importedAssets.length) return;
    importedAssets.forEach((asset) => {
      applyMixerState(appendMixerLane(getMixerStateSnapshot()));
      addTrackToMixer(asset, studioLanesCount - 1, 0);
    });
    setStudioStatus(importedAssets.length === 1 ? 'New lane created from imported clip' : `${importedAssets.length} lanes created from imported clips`, 'success');
  };

  window.addAssetToMixer = (assetId, laneIdx = -1) => {
    const asset = audioLibrary.find((entry) => entry.id == assetId);
    if (!asset) {
      return;
    }

    addTrackToMixer(asset, laneIdx === -1 ? selectedLaneIndex : laneIdx);
    modalLib.classList.remove('active');
    setStudioStatus('Clip added to mixer', 'success');
  };
  window.removeAsset = (assetId) => { 
    if (editingAssetId == assetId) {
      closeTrimmerArea();
    }
    applyMixerState(removeMixerAssetState(getMixerStateSnapshot(), assetId));
    renderLibrary();
    syncStudioMixerSurface();
    syncStudioSummaryChrome();
    syncLibraryLaneTargetChrome();
    syncStudioPlaybackMix();
    setStudioStatus('Clip removed from library', 'neutral', 1200); 
  };
  window.downloadAsset = (assetId) => {
    const asset = audioLibrary.find((entry) => entry.id == assetId);
    if (asset) {
      downloadFile(audioBufferToWav(asset.buffer), `${asset.name}.wav`);
    }
  };
  window.duplicateAsset = (assetId) => {
    const asset = audioLibrary.find(a => a.id == assetId);
    if (asset) {
      applyMixerState(addMixerAsset(getMixerStateSnapshot(), {
        id: Date.now() + Math.random(),
        name: getTrackCopyName(asset.name, audioLibrary.map((entry) => entry.name)),
        buffer: asset.buffer,
        originalBuffer: asset.originalBuffer || asset.buffer,
        isEdited: asset.isEdited || false
      }));
      renderLibrary();
      setStudioStatus('Clip duplicated', 'success');
    }
  };
  window.restoreAsset = (assetId) => {
    const asset = audioLibrary.find(a => a.id == assetId);
    if (!asset || !asset.originalBuffer) return;
    applyMixerState(replaceMixerAsset(getMixerStateSnapshot(), {
      assetId: asset.id,
      name: asset.name,
      buffer: asset.originalBuffer,
      originalBuffer: asset.originalBuffer,
      isEdited: false,
      fadeIn: asset.fadeIn,
      fadeOut: asset.fadeOut
    }));
    const firstTrack = studioTracks.find(t => t.assetId == asset.id);
    if (firstTrack) {
      analyzeWaveformSamples({
        sampleBuffer: firstTrack.buffer.getChannelData(0).slice(0).buffer,
        sampleRate: firstTrack.buffer.sampleRate,
        cacheKey: `track:${firstTrack.assetId}:${firstTrack.buffer.length}:${firstTrack.buffer.sampleRate}`,
        maxBins: 8192
      }).then((waveform) => {
        applyMixerState(setMixerAssetWaveform(getMixerStateSnapshot(), asset.id, waveform));
        syncStudioMixerSurface();
      }).catch(() => {});
    }
    renderLibrary();
    syncStudioMixerSurface();
    syncStudioSummaryChrome();
    syncLibraryLaneTargetChrome();
    setStudioStatus('Restored to original', 'success');
  };
  window.renameAsset = (assetId, newName) => {
    if (!audioLibrary.some((entry) => entry.id == assetId)) return;
    applyMixerState(renameMixerAsset(getMixerStateSnapshot(), assetId, newName));
    applyMixerState(renameMixerAssetReferences(getMixerStateSnapshot(), assetId, newName));
    renderLibrary();
    syncStudioMixerSurface();
    syncStudioSummaryChrome();
    syncLibraryLaneTargetChrome();
  };
  window.editAsset = (assetId) => {
    const asset = audioLibrary.find((entry) => entry.id == assetId);
    if (!asset) {
      return;
    }

    modalLib.classList.remove('active');
    showTrimmer(asset.buffer, asset.name, asset.id);
  };
  window.updateTrackVolume = (id, val) => {
    applyMixerState(setMixerTrackVolume(getMixerStateSnapshot(), id, val));
    syncStudioMixerSurface();
    syncStudioPlaybackMix();
  };
  window.duplicateTrack = (id) => {
    const sourceTrack = studioTracks.find((track) => track.id == id);
    if (!sourceTrack) return;
    const asset = audioLibrary.find((entry) => entry.id == sourceTrack.assetId);
    if (!asset) return;
    const nextState = duplicateMixerTrackState(getMixerStateSnapshot(), {
      trackId: sourceTrack.id,
      asset
    });
    applyMixerState(nextState);
    syncStudioMixerSurface();
    syncStudioSummaryChrome();
    syncStudioPlaybackMix();
    setStudioStatus('Track duplicated', 'success');
  };
  window.splitTrack = (id, time) => {
    const snapshot = getMixerStateSnapshot();
    const nextState = splitMixerTrackState(snapshot, {
      trackId: id,
      time
    });
    if (nextState === snapshot) return;
    applyMixerState(nextState);
    syncStudioMixerSurface();
    syncStudioSummaryChrome();
    syncStudioPlaybackMix();
    setStudioStatus('Track split', 'success');
  };
  window.toggleTrackMute = (id) => {
    applyMixerState(toggleMixerTrackMute(getMixerStateSnapshot(), id));
    syncStudioMixerSurface();
    syncStudioSummaryChrome();
    syncStudioPlaybackMix();
  };
  window.toggleTrackSolo = (id) => {
    applyMixerState(toggleMixerTrackSolo(getMixerStateSnapshot(), id));
    syncStudioMixerSurface();
    syncStudioSummaryChrome();
    syncStudioPlaybackMix();
  };
  window.removeTrack = (id) => {
    const t = studioTracks.find(t => t.id == id);
    if (t && editingAssetId == t.assetId && currentPreviewAudio && !currentPreviewAudio.paused) stopPreview();
    applyMixerState(removeMixerTrackState(getMixerStateSnapshot(), id));
    syncStudioMixerSurface();
    syncStudioSummaryChrome();
    syncStudioPlaybackMix();
    setStudioStatus('Track removed', 'neutral', 1200);
  };
  
  window.toggleLaneMute = (idx) => { 
    applyMixerState(toggleMixerLaneMute(getMixerStateSnapshot(), idx));
    syncStudioMixerSurface();
    syncStudioSummaryChrome();
    syncStudioPlaybackMix();
  };
  window.toggleLaneSolo = (idx) => { 
    applyMixerState(toggleMixerLaneSolo(getMixerStateSnapshot(), idx));
    syncStudioMixerSurface();
    syncStudioSummaryChrome();
    syncStudioPlaybackMix();
  };
  window.duplicateLane = (idx) => {
    applyMixerState(duplicateMixerLane(getMixerStateSnapshot(), { laneIndex: idx }));
    syncStudioMixerSurface();
    syncStudioSummaryChrome();
    syncLibraryLaneTargetChrome();
    syncStudioPlaybackMix();
    setStudioStatus('Lane duplicated', 'success');
  };
  window.clearLane = (idx) => {
    applyMixerState(clearMixerLaneTracks(getMixerStateSnapshot(), idx));
    syncStudioMixerSurface();
    syncStudioSummaryChrome();
    syncStudioPlaybackMix();
    setStudioStatus('Lane cleared', 'neutral', 1200);
  };
  window.updateLaneVolume = (idx, val) => {
    applyMixerState(setMixerLaneVolume(getMixerStateSnapshot(), idx, val));
    syncStudioMixerSurface();
    syncStudioPlaybackMix();
  };
  window.removeLane = (idx) => { 
    if (studioLanesCount <= 1) return;
    applyMixerState(removeMixerLaneState(getMixerStateSnapshot(), idx));
    syncStudioMixerSurface();
    syncStudioSummaryChrome();
    syncLibraryLaneTargetChrome();
    syncStudioPlaybackMix();
    setStudioStatus('Lane removed', 'neutral', 1200);
  };
}

async function importAudioFile(file) {
  await ensureAudioCtx();
  const decoded = await decodeMediaAudioFile(file, {
    audioContext: audioCtx,
    sampleRate: audioCtx.sampleRate,
    outputName: 'converted.wav',
    onConvertStart: () => setStudioStatus(`Converting ${file.name}`, 'neutral', 0)
  });
  const asset = {
    id: Date.now() + Math.random(),
    name: decoded.name,
    buffer: decoded.buffer,
    originalBuffer: decoded.buffer,
    sourceType: decoded.sourceType,
    wasConverted: decoded.wasConverted
  };
  applyMixerState(addMixerAsset(getMixerStateSnapshot(), asset));
  return asset;
}

function renderLibrary() {
  const list = container.querySelector('#library-list');
  const laneLabel = laneSettings[selectedLaneIndex]?.name || `Lane ${selectedLaneIndex + 1}`;
  syncLibraryLaneTargetChrome();
  const dropMarkup = `<div id="library-dropzone" class="studio-library-dropzone">Drop audio or video files here to import them into the library</div>`;
  if (audioLibrary.length === 0) {
    list.innerHTML = `${dropMarkup}<div class="studio-library-empty">Your library is empty.</div>`;
    return;
  }
  list.innerHTML = `${dropMarkup}${audioLibrary.map(asset => `
    <div class="library-item" data-asset-id="${asset.id}" draggable="true" ondragstart="event.dataTransfer.setData('application/x-sound-asset-id', '${asset.id}'); event.dataTransfer.effectAllowed = 'copy';">
      <div class="studio-library-item-info">
        <input type="text" value="${asset.name}" 
          onchange="window.renameAsset('${asset.id}', this.value)"
          class="studio-library-item-name">
        <span class="studio-library-item-meta">${asset.buffer.duration.toFixed(2)}s • ${asset.buffer.numberOfChannels}ch • ${asset.buffer.sampleRate}Hz</span>
      </div>
      <div class="studio-library-item-actions">
        ${asset.isEdited ? `<button class="mini-btn" onclick="window.restoreAsset('${asset.id}')" data-tooltip="Restore to original">Restore</button>` : ''}
        <button class="mini-btn" onclick="window.downloadAsset('${asset.id}')" data-tooltip="Download WAV">Download</button>
        <button class="mini-btn" onclick="window.duplicateAsset('${asset.id}')" data-tooltip="Duplicate">Duplicate</button>
        <button class="mini-btn" onclick="window.editAsset('${asset.id}')" data-tooltip="Edit in Trimmer">Edit</button>
        <button class="mini-btn danger" onclick="window.removeAsset('${asset.id}')" data-tooltip="Remove from library">Delete</button>
        <button class="btn-secondary studio-library-commit" onclick="window.addAssetToMixer('${asset.id}')">Add to ${laneLabel}</button>
      </div>
    </div>
  `).join('')}`;
  syncLibraryLaneTargetChrome();
}

async function addTrackToMixer(asset, laneIdx = 0, offset = -1) {
  applyMixerState(addMixerTrackState(getMixerStateSnapshot(), { 
    asset, 
    laneIndex: laneIdx, 
    offset,
    fadeIn: asset.fadeIn,
    fadeOut: asset.fadeOut
  }));
  const trackId = selectedTrackId;
  syncStudioMixerSurface();
  syncStudioSummaryChrome();
  syncLibraryLaneTargetChrome();
  syncStudioPlaybackMix();
  if (!trackId || asset.waveform) return;

  analyzeWaveformSamples({
    sampleBuffer: asset.buffer.getChannelData(0).slice(0).buffer,
    sampleRate: asset.buffer.sampleRate,
    cacheKey: `track:${asset.id}:${asset.buffer.length}:${asset.buffer.sampleRate}`,
    maxBins: 8192
  }).then(waveform => {
    applyMixerState(setMixerAssetWaveform(getMixerStateSnapshot(), asset.id, waveform));
    applyMixerState(setMixerTrackWaveform(getMixerStateSnapshot(), trackId, waveform));
    syncStudioMixerSurface();
  }).catch(() => {});
}

async function ensureAudioCtx() {
  if (!audioCtx) {
    audioCtx = createBrowserAudioContext(window);
  }

  const resumeResult = resumeAudioContext(audioCtx);
  if (typeof resumeResult?.then === 'function') await resumeResult;
}

async function initStudio() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }

  await ensureAudioCtx();
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  sourceNode = audioCtx.createMediaStreamSource(stream);
  inputGainNode = audioCtx.createGain();
  compressorNode = audioCtx.createDynamicsCompressor();
  gateNode = audioCtx.createDynamicsCompressor();

  const gateEnabled = container.querySelector('#rec-gate-toggle').checked;
  gateNode.threshold.value = gateEnabled ? Number.parseFloat(container.querySelector('#rec-gate').value) : -100;
  gateNode.ratio.value = 20;
  gateNode.attack.value = 0.005;
  gateNode.release.value = 0.1;

  analyzer = audioCtx.createAnalyser();
  inputGainNode.gain.value = container.querySelector('#input-gain-toggle').checked
    ? Number.parseFloat(container.querySelector('#input-gain').value)
    : 1.0;
  compressorNode.ratio.value = container.querySelector('#comp-ratio-toggle').checked
    ? Number.parseFloat(container.querySelector('#comp-ratio').value)
    : 1.0;

  if (container.querySelector('#rec-raw').checked) {
    sourceNode.connect(analyzer);
  } else {
    sourceNode.connect(inputGainNode);
    inputGainNode.connect(compressorNode);
    compressorNode.connect(gateNode);
    gateNode.connect(analyzer);
  }
}

function initVisualizers() {
  if (animationId && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(animationId);
  }

  const waveCanvas = container.querySelector('#audio-viz-wave');
  const freqCanvas = container.querySelector('#audio-viz-freq');
  if (!waveCanvas || !freqCanvas || typeof waveCanvas.getContext !== 'function' || typeof freqCanvas.getContext !== 'function') {
    return;
  }

  const wCtx = waveCanvas.getContext('2d');
  const fCtx = freqCanvas.getContext('2d');
  const draw = () => {
    animationId = requestAnimationFrame(draw);
    const dpr = window.devicePixelRatio || 1;
    const w = waveCanvas.offsetWidth * dpr;
    const h = waveCanvas.offsetHeight * dpr;
    waveCanvas.width = w;
    freqCanvas.width = w;
    waveCanvas.height = h;
    freqCanvas.height = h;
    const isPlaying = (isRecording || isStudioPlaying) && analyzer;
    fCtx.clearRect(0, 0, w, h);
    if (isPlaying) {
      analyzer.fftSize = 2048;
      const data = new Uint8Array(analyzer.frequencyBinCount);
      analyzer.getByteFrequencyData(data);

      if (isRecording && container.querySelector('#rec-anc').checked) {
        let average = 0;
        for (let i = 0; i < data.length; i += 1) {
          average += data[i];
        }
        average /= data.length;

        if (average < 50) {
          const currentGate = Number.parseFloat(container.querySelector('#rec-gate').value);
          gateNode.threshold.setTargetAtTime(Math.max(currentGate, -100 + average), audioCtx.currentTime, 0.5);
        }
      }

      for (let i = 0; i < data.length; i += 1) {
        const barHeight = (data[i] / 255) * h;
        const x = i * (w / data.length) * 2.5;
        const width = (w / data.length) * 2;
        fCtx.fillStyle = isRecording ? 'rgba(255,69,58,0.2)' : 'rgba(10,132,255,0.2)';
        fCtx.fillRect(x, h - barHeight, width, barHeight);
      }
    }

    wCtx.clearRect(0, 0, w, h);
    wCtx.font = `${10 * dpr}px "Inter", sans-serif`;
    wCtx.fillStyle = 'rgba(255,255,255,0.2)';
    wCtx.fillText('+6dB', 10 * dpr, (h * 0.25) - (5 * dpr));
    wCtx.fillText('-6dB', 10 * dpr, (h * 0.75) + (12 * dpr));
    wCtx.lineWidth = 1 * dpr;
    wCtx.strokeStyle = isRecording ? '#ff453a' : 'rgba(255,255,255,0.15)';
    wCtx.beginPath();

    if (isPlaying) {
      wCtx.lineWidth = 2 * dpr;
      const data = new Uint8Array(analyzer.frequencyBinCount);
      analyzer.getByteTimeDomainData(data);
      let waveX = 0;

      for (let i = 0; i < data.length; i += 1) {
        const value = data[i] / 128.0;
        const y = (value * h) / 2;

        if (i === 0) {
          wCtx.moveTo(waveX, y);
        } else {
          wCtx.lineTo(waveX, y);
        }

        waveX += w / data.length;
      }
    } else {
      wCtx.moveTo(0, h / 2);
      wCtx.lineTo(w, h / 2);
    }

    wCtx.stroke();
  };
  draw();
}

async function startRecording() {
  const engine = container.querySelector('#rec-engine').value;
  const btnRec = container.querySelector('#btn-rec-control');
  const dot = container.querySelector('#rec-dot');
  btnRec.textContent = 'Stop';
  dot.classList.add('is-recording');
  isRecording = true;
  setTrimmerActive(false);
  container.querySelector('#trim-area').classList.add('hidden');
  startTime = Date.now();
  recordedChunks = [];
  pendingRecordStopRequested = false;

  const startPromise = (async () => {
    await initStudio();
    if (engine === 'wav') {
      await audioCtx.audioWorklet.addModule(PCM_RECORDER_WORKLET_URL);
      mediaRecorder = new AudioWorkletNode(audioCtx, 'pcm-recorder-processor');
      gateNode.connect(mediaRecorder);
      mediaRecorder.connect(audioCtx.destination);
      return;
    }
    const dest = audioCtx.createMediaStreamDestination();
    gateNode.connect(dest);
    let mime = engine;
    if (mime === 'audio/mpeg' || !MediaRecorder.isTypeSupported(mime)) {
      mime = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mime)) mime = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mime)) mime = 'audio/ogg;codecs=opus';
    }
    mediaRecorder = new MediaRecorder(dest.stream, mime ? { mimeType: mime } : {});
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.start();
  })();
  pendingRecordStartPromise = startPromise;

  try {
    await startPromise;
    if (pendingRecordStopRequested) {
      pendingRecordStopRequested = false;
      stopRecording();
      return;
    }
  } catch (error) {
    isRecording = false;
    btnRec.textContent = 'Start Recording';
    dot.classList.remove('is-recording');
    throw error;
  } finally {
    if (pendingRecordStartPromise === startPromise) pendingRecordStartPromise = null;
  }
  timerInterval = setInterval(() => {
    const el = Date.now() - startTime,
      h = Math.floor(el / 3600000).toString().padStart(2, '0'),
      m = Math.floor((el % 3600000) / 60000).toString().padStart(2, '0'),
      s = Math.floor((el % 60000) / 1000).toString().padStart(2, '0');
    container.querySelector('#rec-timer').textContent = `${h}:${m}:${s}`;
  }, 100);
  setStudioStatus('Recording', 'success', 0);
}

async function stopRecording() {
  if (pendingRecordStartPromise && !mediaRecorder) {
    pendingRecordStopRequested = true;
    await pendingRecordStartPromise.catch(() => {});
  }
  if (!mediaRecorder) {
    pendingRecordStopRequested = false;
    return;
  }
  isRecording = false;
  pendingRecordStopRequested = false;
  clearInterval(timerInterval);
  const dot = container.querySelector('#rec-dot');
  container.querySelector('#btn-rec-control').textContent = 'Record';
  dot.classList.remove('is-recording');
  const recorder = mediaRecorder;
  mediaRecorder = null;

  if (container.querySelector('#rec-engine').value === 'wav') {
    recorder.port.onmessage = async (e) => {
      const decoded = await audioCtx.decodeAudioData(await pcmToWav(flattenPCM(e.data.buffer), audioCtx.sampleRate).arrayBuffer());
      const baseBuffer = pendingRecordResumeMode === 'append' ? activeTrimmerBufferReader?.() : null;
      pendingRecordResumeMode = null;
      showTrimmer(appendMonoBuffers(baseBuffer, decoded), activeTrimmerNameReader?.() || '', null, { source: 'recording' });
    };
    recorder.port.postMessage({ command: 'flush' });
  } else {
    recorder.onstop = async () => {
      const buffer = await new Blob(recordedChunks, { type: recorder.mimeType }).arrayBuffer();
      const decoded = await audioCtx.decodeAudioData(buffer);
      const baseBuffer = pendingRecordResumeMode === 'append' ? activeTrimmerBufferReader?.() : null;
      pendingRecordResumeMode = null;
      showTrimmer(appendMonoBuffers(baseBuffer, decoded), activeTrimmerNameReader?.() || '', null, { source: 'recording' });
    };
    recorder.stop();
  }
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  setStudioStatus('Recording captured', 'success');
}

function flattenPCM(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Float32Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

function showTrimmer(originalBuffer, suggestedName = '', assetId = null, options = {}) {
  previewController?.stop?.();
  previewController = null;
  editingAssetId = assetId;
  const asset = (assetId ? audioLibrary.find(a => a.id == assetId) : null) || { fadeIn: 0, fadeOut: 0 };
  let workingBuffer = originalBuffer;
  let pendingFadeIn = asset.fadeIn || 0;
  let pendingFadeOut = asset.fadeOut || 0;
  const dur = workingBuffer.duration;
  setTrimmerActive(true);
  container.querySelector('#trim-area').classList.remove('hidden');
  scrollNodeIntoView(container.querySelector('#trim-area'));
  container.querySelector('#btn-save-trim').textContent = assetId ? 'Update Media' : 'Add to Mixer';
  activeTrimmerSource = options.source || (assetId ? 'asset' : 'recording');
  activeTrimmerBufferReader = () => workingBuffer;
  activeTrimmerNameReader = () => suggestedName;
  
  const spIn = container.querySelector('#trim-speed');
  const piIn = container.querySelector('#trim-pitch');
  const pgIn = container.querySelector('#trim-postgain');
  
  spIn.value = 1.0;
  piIn.value = 0;
  pgIn.value = 0;
  container.querySelector('#trim-leveler').value = 0; container.querySelector('#trim-noise').value = 0;
  ['speed','pitch','postgain','leveler','noise'].forEach(k => {
    container.querySelector('#val-'+k).textContent = (k==='speed'?'1.0':'0');
    container.querySelector('#trim-'+k+'-toggle').checked = true;
  });
  noiseProfile = null;
  let sVal = 0;
  let eVal = dur;
  let isManual = false;
  let activeSelectionMode = 'effect-range';
  let clipEffects = [];
  let activeEffectId = null;
  let hoveredEffectId = null;
  let appliedEffectHistory = [];
  let currentPreviewRate = 1;
  let isSeekAutoplayEnabled = false;
  let processedWaveformToken = 0;

  const noiseButton = container.querySelector('#btn-select-noise');
  const clearNoiseButton = container.querySelector('#btn-clear-noise');
  const effectRangeButton = container.querySelector('#btn-select-effect-range');
  const clearEffectRangeButton = container.querySelector('#btn-clear-effect-range');
  const deleteSelectionButton = container.querySelector('#btn-delete-selection');
  const noiseProfileStatus = container.querySelector('#noise-profile-status');
  const effectRangeStatus = container.querySelector('#effect-range-status');
  const effectCount = container.querySelector('#clip-effect-count');
  const effectList = container.querySelector('#clip-effect-list');
  const clearEffectsButton = container.querySelector('#btn-clear-effects');
  const applyEffectsButton = container.querySelector('#btn-apply-effects-to-asset');
  const undoAppliedEffectsButton = container.querySelector('#btn-undo-applied-effects');
  const effectEditor = container.querySelector('#clip-effect-editor');
  const updateEffectButton = container.querySelector('#btn-update-effect');
  const volumeEnvelopeReadout = container.querySelector('#clip-volume-envelope-readout');
  const resetVolumeEnvelopeButton = container.querySelector('#btn-reset-volume-envelope');
  const fadeField = container.querySelector('[data-effect-field="fade"]');
  const normalizeField = container.querySelector('[data-effect-field="normalize"]');
  const filterField = container.querySelector('[data-effect-field="filter"]');
  const echoField = container.querySelector('[data-effect-field="echo"]');
  const echoDecayField = container.querySelector('[data-effect-field="echo-decay"]');
  const effectFadeInput = container.querySelector('#clip-effect-fade-curve');
  const effectFadeReadout = container.querySelector('#clip-effect-fade-readout');
  const effectNormalizeInput = container.querySelector('#clip-effect-normalize-db');
  const effectNormalizeReadout = container.querySelector('#clip-effect-normalize-readout');
  const effectFilterInput = container.querySelector('#clip-effect-filter-hz');
  const effectFilterReadout = container.querySelector('#clip-effect-filter-readout');
  const effectEchoDelayInput = container.querySelector('#clip-effect-echo-delay');
  const effectEchoDelayReadout = container.querySelector('#clip-effect-echo-delay-readout');
  const effectEchoDecayInput = container.querySelector('#clip-effect-echo-decay');
  const effectEchoDecayReadout = container.querySelector('#clip-effect-echo-decay-readout');
  const effectShiftInput = container.querySelector('#clip-effect-shift-st');
  const effectShiftReadout = container.querySelector('#clip-effect-shift-readout');
  const effectAmountInput = container.querySelector('#clip-effect-amount');
  const effectAmountReadout = container.querySelector('#clip-effect-amount-readout');
  const effectEditorTitle = container.querySelector('#clip-effect-editor-title');
  const effectEditorDetail = container.querySelector('#clip-effect-editor-detail');
  const levelerInput = container.querySelector('#trim-leveler');
  const noiseInput = container.querySelector('#trim-noise');
  const trimOptionMap = {
    speed: { toggle: container.querySelector('#trim-speed-toggle'), input: spIn },
    pitch: { toggle: container.querySelector('#trim-pitch-toggle'), input: piIn },
    postgain: { toggle: container.querySelector('#trim-postgain-toggle'), input: pgIn },
    leveler: { toggle: container.querySelector('#trim-leveler-toggle'), input: levelerInput },
    noise: { toggle: container.querySelector('#trim-noise-toggle'), input: noiseInput }
  };
  const waveformReactiveOptions = new Set(['postgain', 'leveler', 'noise']);
  const effectButtons = [
    container.querySelector('#btn-effect-silence'),
    container.querySelector('#btn-effect-fade-in'),
    container.querySelector('#btn-effect-fade-out'),
    container.querySelector('#btn-effect-normalize'),
    container.querySelector('#btn-effect-reverse'),
    container.querySelector('#btn-effect-low-pass'),
    container.querySelector('#btn-effect-high-pass'),
    container.querySelector('#btn-effect-band-pass'),
    container.querySelector('#btn-effect-notch'),
    container.querySelector('#btn-effect-talkback'),
    container.querySelector('#btn-effect-vocal-remove'),
    container.querySelector('#btn-effect-de-esser'),
    container.querySelector('#btn-effect-radio'),
    container.querySelector('#btn-effect-bass-cut'),
    container.querySelector('#btn-effect-noise-gate'),
    container.querySelector('#btn-effect-reverb'),
    container.querySelector('#btn-effect-compression'),
    container.querySelector('#btn-effect-saturation'),
    container.querySelector('#btn-effect-formant-shift'),
    container.querySelector('#btn-effect-pitch-shift'),
    container.querySelector('#btn-effect-echo')
  ];
  const effectSettings = {
    fadeCurve: 1,
    normalizeDb: -1,
    filterCutoffHz: 1200,
    echoDelayMs: 180,
    echoDecay: 0.35,
    shiftSemitones: 3,
    amount: 0.76
  };
  const effectFieldMap = {
    fade: fadeField,
    normalize: normalizeField,
    filter: filterField,
    echo: echoField,
    echoDecay: echoDecayField,
    shift: container.querySelector('[data-effect-field="shift"]'),
    amount: container.querySelector('[data-effect-field="amount"]')
  };
  const syncTrimOptionAvailability = () => {
    Object.values(trimOptionMap).forEach(({ toggle, input }) => {
      if (!toggle || !input) return;
      input.disabled = !toggle.checked;
    });
  };
  const syncTrimmerBusyState = () => {
    if (!soundTrimmer) return;
    if (trimBusyState.preview) {
      soundTrimmer.setLoading({ visible: true, title: 'Preparing preview', detail: 'Rendering preview audio…', progress: 48 });
      return;
    }
    if (trimBusyState.waveform) {
      soundTrimmer.setLoading({ visible: true, title: 'Refreshing waveform', detail: 'Applying current clip audio…', progress: 32 });
      return;
    }
    soundTrimmer.setLoading({ visible: false });
  };
  const setTrimmerBusy = (key, active) => {
    trimBusyState[key] = !!active;
    syncTrimmerBusyState();
  };
  const envelopeGainLimits = { min: -24, max: 24 };
  let volumeEnvelope = [
    { time: 0, gainDb: 0 },
    { time: dur, gainDb: 0 }
  ];
  let activeEnvelopePointIndex = null;
  const effectChipNodes = new Map();
  let linkedEffectVisualId = null;
  let openEffectPalette = () => {};
  let openEffectContextMenu = () => {};
  let openEnvelopePointContextMenu = () => {};

  const performScan = (st = null, et = null) => {
    const data = workingBuffer.getChannelData(0);

    if (st !== null && et !== null) {
      let sum = 0;
      let count = 0;
      const startSample = Math.floor(st * workingBuffer.sampleRate);
      const endSample = Math.floor(et * workingBuffer.sampleRate);

      for (let i = startSample; i < endSample; i += 1) {
        sum += data[i] * data[i];
        count += 1;
      }

      noiseProfile = new Float32Array(1024).fill(20 * Math.log10(Math.sqrt(sum / Math.max(1, count))));
      isManual = true;
    } else {
      const rms = [];

      for (let i = 0; i < data.length - 2048; i += 2048) {
        let sum = 0;
        for (let j = 0; j < 2048; j += 1) {
          sum += data[i + j] * data[i + j];
        }
        rms.push(Math.sqrt(sum / 2048));
      }

      rms.sort((a, b) => a - b);
      const candidates = rms
        .filter((value) => value > 1e-7)
        .slice(0, Math.max(1, Math.floor(rms.length * 0.05)));
      const floor = candidates.length
        ? candidates.reduce((sum, value) => sum + value, 0) / candidates.length
        : 1e-7;
      noiseProfile = new Float32Array(1024).fill(20 * Math.log10(floor));
      isManual = false;
    }

    noiseProfileStatus?.classList.toggle('hidden', !isManual);
    noiseProfileStatus?.classList.toggle('is-selected', isManual);
    if (clearNoiseButton) clearNoiseButton.classList.toggle('hidden', !isManual);
  };
  if (!noiseProfile) performScan();

  const formatRangeLabel = (start, end) => `${start.toFixed(1)}s - ${end.toFixed(1)}s`;
  const formatDbLabel = (value) => `${value > 0 ? '+' : ''}${Number(value.toFixed(1))} dB`;
  const formatCurveLabel = (value) => `${Number(value).toFixed(1)}x`;
  const formatFrequencyLabel = (value) => `${Math.round(value)} Hz`;
  const formatDelayLabel = (value) => `${Math.round(value)} ms`;
  const formatPercentLabel = (value) => `${Math.round(value * 100)}%`;
  const formatSemitoneLabel = (value) => `${Number(value) > 0 ? '+' : ''}${Math.round(Number(value) || 0)} st`;
  const getEffectById = (effectId) => clipEffects.find((effect) => effect.id === effectId) || null;
  const getLinkedEffectId = () => hoveredEffectId || activeEffectId;
  const cloneClipEffects = () => clipEffects.map((effect) => ({ ...effect }));
  const cloneVolumeEnvelope = () => volumeEnvelope.map((point) => ({ ...point }));
  const clampEnvelopeGainDb = (value) => Math.max(envelopeGainLimits.min, Math.min(envelopeGainLimits.max, Number(value) || 0));
  const envelopeTimeToPercent = (time, duration = dur) => {
    const paddedWidth = 98.4;
    const edgePadding = 0.8;
    return edgePadding + (clamp((Number(time) || 0) / Math.max(0.001, duration), 0, 1) * paddedWidth);
  };
  const envelopeGainDbToPercent = (gainDb) => {
    const clamped = clampEnvelopeGainDb(gainDb);
    const positiveLimit = Math.max(0.01, envelopeGainLimits.max);
    const negativeLimit = Math.max(0.01, Math.abs(envelopeGainLimits.min));
    if (clamped >= 0) return 50 - ((clamped / positiveLimit) * 50);
    return 50 + ((Math.abs(clamped) / negativeLimit) * 50);
  };
  const envelopePercentToGainDb = (percent) => {
    const clampedPercent = Math.max(0, Math.min(100, Number(percent) || 0));
    if (clampedPercent <= 50) {
      const ratio = (50 - clampedPercent) / 50;
      return Number((ratio * envelopeGainLimits.max).toFixed(2));
    }
    const ratio = (clampedPercent - 50) / 50;
    return Number((-ratio * Math.abs(envelopeGainLimits.min)).toFixed(2));
  };
  const getEnvelopeGainDbAt = (time, points = volumeEnvelope) => {
    const safePoints = Array.isArray(points) && points.length ? points : [{ time: 0, gainDb: 0 }, { time: dur, gainDb: 0 }];
    const safeTime = Math.max(0, Math.min(dur, Number(time) || 0));
    if (safeTime <= safePoints[0].time) return safePoints[0].gainDb;
    if (safeTime >= safePoints[safePoints.length - 1].time) return safePoints[safePoints.length - 1].gainDb;
    for (let index = 1; index < safePoints.length; index += 1) {
      const left = safePoints[index - 1];
      const right = safePoints[index];
      if (safeTime > right.time) continue;
      const span = Math.max(0.0001, right.time - left.time);
      const ratio = smoothEnvelopeRatio((safeTime - left.time) / span);
      return Number((left.gainDb + ((right.gainDb - left.gainDb) * ratio)).toFixed(2));
    }
    return 0;
  };
  const normalizeVolumeEnvelope = (points) => {
    const safeDuration = Math.max(0.1, workingBuffer.duration || dur || 0.1);
    const sourcePoints = (Array.isArray(points) ? points : [])
      .map((point) => ({
        time: Math.max(0, Math.min(safeDuration, Number(point?.time) || 0)),
        gainDb: clampEnvelopeGainDb(point?.gainDb)
      }))
      .sort((left, right) => left.time - right.time);
    const interiorPoints = sourcePoints.filter((point) => point.time > 0 && point.time < safeDuration);
    const boundaryPoints = [
      { time: 0, gainDb: getEnvelopeGainDbAt(0, sourcePoints) },
      { time: safeDuration, gainDb: getEnvelopeGainDbAt(safeDuration, sourcePoints) }
    ];
    return boundaryPoints
      .slice(0, 1)
      .concat(interiorPoints)
      .concat(boundaryPoints.slice(1))
      .reduce((accumulator, point) => {
        const previous = accumulator[accumulator.length - 1];
        if (previous && Math.abs(previous.time - point.time) < 0.0001) {
          previous.gainDb = point.gainDb;
          return accumulator;
        }
        accumulator.push({
          time: Number(point.time.toFixed(3)),
          gainDb: Number(point.gainDb.toFixed(2))
        });
        return accumulator;
      }, []);
  };
  const buildEnvelopePathData = (points = volumeEnvelope) => {
    const safePoints = normalizeVolumeEnvelope(points);
    const coordinates = [];
    safePoints.forEach((point, index) => {
      if (index === 0) {
        coordinates.push(`${envelopeTimeToPercent(point.time)},${envelopeGainDbToPercent(point.gainDb)}`);
        return;
      }
      const previousPoint = safePoints[index - 1];
      const span = Math.max(0.0001, point.time - previousPoint.time);
      const steps = Math.max(8, Math.ceil(span / Math.max(0.15, dur / 48)));
      for (let step = 1; step <= steps; step += 1) {
        const time = previousPoint.time + (span * (step / steps));
        coordinates.push(`${envelopeTimeToPercent(time)},${envelopeGainDbToPercent(getEnvelopeGainDbAt(time, safePoints))}`);
      }
    });
    if (!coordinates.length) return '';
    return `M ${coordinates[0]} ${coordinates.slice(1).map((point) => `L ${point}`).join(' ')}`;
  };
  const hasVolumeEnvelopeAdjustments = () => volumeEnvelope.length > 2 || volumeEnvelope.some((point) => Math.abs(point.gainDb) > 0.05);
  const hasLocalClipAdjustments = () => clipEffects.length > 0 || hasVolumeEnvelopeAdjustments();
  const syncVolumeEnvelopeReadout = () => {
    const selectedPoint = Number.isInteger(activeEnvelopePointIndex) ? volumeEnvelope[activeEnvelopePointIndex] : null;
    if (selectedPoint) {
      volumeEnvelopeReadout.textContent = `${selectedPoint.time.toFixed(2)}s • ${formatDbLabel(selectedPoint.gainDb)}`;
      return;
    }
    if (!hasVolumeEnvelopeAdjustments()) {
      volumeEnvelopeReadout.textContent = 'Flat 0 dB';
      return;
    }
    const minGain = Math.min(...volumeEnvelope.map((point) => point.gainDb));
    const maxGain = Math.max(...volumeEnvelope.map((point) => point.gainDb));
    volumeEnvelopeReadout.textContent = `${volumeEnvelope.length} keyframes • ${formatDbLabel(minGain)} to ${formatDbLabel(maxGain)}`;
  };
  const removeEnvelopePoint = (index) => {
    if (!Number.isInteger(index) || index <= 0 || index >= volumeEnvelope.length - 1) return false;
    volumeEnvelope = normalizeVolumeEnvelope(volumeEnvelope.filter((_, pointIndex) => pointIndex !== index));
    activeEnvelopePointIndex = null;
    syncEffectBatchButtons();
    renderVolumeEnvelope();
    debouncedRestart();
    scheduleProcessedWaveformRefresh();
    return true;
  };
  const renderVolumeEnvelope = () => {
    const trimmerBody = soundTrimmer?.root?.querySelector('.media-trimmer-body');
    if (!trimmerBody) return;
    let shell = trimmerBody.querySelector('.sound-studio-trimmer-envelope-shell');
    if (!shell) {
      shell = document.createElement('div');
      shell.className = 'sound-studio-trimmer-envelope-shell';
      trimmerBody.appendChild(shell);
    }
    shell.innerHTML = '';
    const surface = document.createElement('div');
    surface.className = 'sound-studio-envelope-surface';
    const createSvgNode = (tag) => (
      typeof document.createElementNS === 'function'
        ? document.createElementNS('http://www.w3.org/2000/svg', tag)
        : document.createElement(tag)
    );
    const svg = createSvgNode('svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.classList.add('sound-studio-envelope-svg');
    const baseline = createSvgNode('line');
    baseline.classList?.add?.('sound-studio-envelope-baseline');
    baseline.setAttribute('x1', '0');
    baseline.setAttribute('x2', '100');
    baseline.setAttribute('y1', '50');
    baseline.setAttribute('y2', '50');
    baseline.setAttribute('stroke', 'rgba(255,255,255,0.18)');
    baseline.setAttribute('stroke-width', '1');
    baseline.setAttribute('stroke-dasharray', '2 2');
    baseline.style.pointerEvents = 'none';
    const pointHandles = [];
    const envelopePath = createSvgNode('path');
    envelopePath.setAttribute('fill', 'none');
    envelopePath.setAttribute('stroke', 'rgba(123, 255, 194, 0.94)');
    envelopePath.setAttribute('stroke-width', '2');
    envelopePath.setAttribute('stroke-linecap', 'round');
    envelopePath.setAttribute('stroke-linejoin', 'round');
    envelopePath.setAttribute('vector-effect', 'non-scaling-stroke');
    envelopePath.style.pointerEvents = 'none';
    const hitPath = createSvgNode('path');
    hitPath.classList?.add?.('sound-studio-envelope-hit-path');
    hitPath.setAttribute('fill', 'none');
    hitPath.setAttribute('stroke', 'rgba(0,0,0,0)');
    hitPath.setAttribute('stroke-width', '18');
    hitPath.setAttribute('stroke-linecap', 'round');
    hitPath.setAttribute('stroke-linejoin', 'round');
    hitPath.setAttribute('vector-effect', 'non-scaling-stroke');
    hitPath.style.pointerEvents = 'stroke';
    svg.appendChild(baseline);
    svg.appendChild(envelopePath);
    svg.appendChild(hitPath);
    surface.appendChild(svg);
    let pointerState = null;

    const getSurfaceMetrics = () => {
      const rect = surface.getBoundingClientRect?.() || { left: 0, top: 0, width: 320, height: 96 };
      return {
        left: rect.left || 0,
        top: rect.top || 0,
        width: rect.width || surface.clientWidth || surface.offsetWidth || 320,
        height: rect.height || surface.clientHeight || surface.offsetHeight || 96
      };
    };
    const projectPoint = (event) => {
      const metrics = getSurfaceMetrics();
      const ratioX = Math.max(0, Math.min(1, (event.clientX - metrics.left) / Math.max(1, metrics.width)));
      const ratioY = Math.max(0, Math.min(1, (event.clientY - metrics.top) / Math.max(1, metrics.height)));
      return {
        time: Number((ratioX * dur).toFixed(3)),
        gainDb: envelopePercentToGainDb(ratioY * 100)
      };
    };
    const syncRenderedEnvelopeGeometry = () => {
      const pathData = buildEnvelopePathData();
      envelopePath.setAttribute('d', pathData);
      hitPath.setAttribute('d', pathData);
      pointHandles.forEach((handle, index) => {
        const point = volumeEnvelope[index];
        if (!handle || !point) return;
        handle.classList.toggle('is-active', index === activeEnvelopePointIndex);
        handle.style.left = `${envelopeTimeToPercent(point.time)}%`;
        handle.style.top = `${envelopeGainDbToPercent(point.gainDb)}%`;
      });
    };
    const commitEnvelopePoint = (index, event, { live = false } = {}) => {
      const projected = projectPoint(event);
      const nextPoints = cloneVolumeEnvelope();
      const previousPoint = nextPoints[index - 1] || null;
      const nextPoint = nextPoints[index + 1] || null;
      const isBoundaryStart = index === 0;
      const isBoundaryEnd = index === (nextPoints.length - 1);
      nextPoints[index] = {
        time: isBoundaryStart
          ? 0
          : isBoundaryEnd
            ? dur
            : Math.max((previousPoint?.time ?? 0) + 0.01, Math.min((nextPoint?.time ?? dur) - 0.01, projected.time)),
        gainDb: clampEnvelopeGainDb(projected.gainDb)
      };
      volumeEnvelope = normalizeVolumeEnvelope(nextPoints);
      activeEnvelopePointIndex = Math.min(index, volumeEnvelope.length - 1);
      syncEffectBatchButtons();
      if (live) {
        syncRenderedEnvelopeGeometry();
        scheduleLivePreviewRefresh();
        return;
      }
      renderVolumeEnvelope();
    };

    const trackEnvelopePointer = (event) => {
      event.stopPropagation();
      const startX = event.clientX;
      const startY = event.clientY;
      pointerState = {
        moved: false,
        move(eventToTrack) {
          if (Math.abs(eventToTrack.clientX - startX) > 3 || Math.abs(eventToTrack.clientY - startY) > 3) {
            pointerState.moved = true;
          }
        },
        stop() {
          document.removeEventListener('pointermove', pointerState.move);
          document.removeEventListener('pointerup', pointerState.stop);
        }
      };
      document.addEventListener('pointermove', pointerState.move);
      document.addEventListener('pointerup', pointerState.stop, { once: true });
    };

    hitPath.addEventListener('pointerdown', trackEnvelopePointer);
    hitPath.addEventListener('click', (event) => {
      event.stopPropagation();
      if (pointerState?.moved) {
        pointerState = null;
        return;
      }
      const projected = projectPoint(event);
      const nextPoints = cloneVolumeEnvelope();
      nextPoints.push(projected);
      volumeEnvelope = normalizeVolumeEnvelope(nextPoints);
      activeEnvelopePointIndex = volumeEnvelope.findIndex((point) => Math.abs(point.time - projected.time) < 0.05 && Math.abs(point.gainDb - projected.gainDb) < 0.6);
      syncEffectBatchButtons();
      syncVolumeEnvelopeReadout();
      renderVolumeEnvelope();
      debouncedRestart();
      scheduleProcessedWaveformRefresh();
      pointerState = null;
    });

    volumeEnvelope.forEach((point, index) => {
      const handle = document.createElement('button');
      handle.type = 'button';
      handle.className = 'sound-studio-envelope-point';
      handle.dataset.pointIndex = String(index);
      if (index === activeEnvelopePointIndex) handle.classList.add('is-active');
      handle.style.left = `${envelopeTimeToPercent(point.time)}%`;
      handle.style.top = `${envelopeGainDbToPercent(point.gainDb)}%`;
      handle.addEventListener('click', (event) => {
        event.stopPropagation();
        activeEnvelopePointIndex = index;
        syncEffectBatchButtons();
        syncRenderedEnvelopeGeometry();
      });
      handle.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        event.stopPropagation();
        activeEnvelopePointIndex = index;
        syncEffectBatchButtons();
        syncRenderedEnvelopeGeometry();
        openEnvelopePointContextMenu(index, event.clientX, event.clientY);
      });
      handle.addEventListener('dblclick', (event) => {
        event.stopPropagation();
        removeEnvelopePoint(index);
      });
      handle.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
        activeEnvelopePointIndex = index;
        syncEffectBatchButtons();
        syncRenderedEnvelopeGeometry();
        const move = (moveEvent) => {
          commitEnvelopePoint(index, moveEvent, { live: true });
        };
        const up = () => {
          document.removeEventListener('pointermove', move);
          document.removeEventListener('pointerup', up);
          renderVolumeEnvelope();
          debouncedRestart();
          scheduleProcessedWaveformRefresh();
        };
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
      });
      pointHandles.push(handle);
      surface.appendChild(handle);
    });

    shell.appendChild(surface);
    syncRenderedEnvelopeGeometry();
  };
  const syncEffectControlReadouts = () => {
    effectFadeReadout.textContent = formatCurveLabel(effectSettings.fadeCurve);
    effectNormalizeReadout.textContent = `${Math.round(effectSettings.normalizeDb)} dB`;
    effectFilterReadout.textContent = formatFrequencyLabel(effectSettings.filterCutoffHz);
    effectEchoDelayReadout.textContent = formatDelayLabel(effectSettings.echoDelayMs);
    effectEchoDecayReadout.textContent = formatPercentLabel(effectSettings.echoDecay);
    if (effectShiftReadout) effectShiftReadout.textContent = formatSemitoneLabel(effectSettings.shiftSemitones);
    if (effectAmountReadout) effectAmountReadout.textContent = formatPercentLabel(effectSettings.amount);
  };
  const describeEffect = (effect) => {
    if (effect.type === 'silence') return 'Silence';
    if (effect.type === 'fade-in') return 'Fade In';
    if (effect.type === 'fade-out') return 'Fade Out';
    if (effect.type === 'normalize') return 'Normalize';
    if (effect.type === 'reverse') return 'Reverse';
    if (effect.type === 'low-pass') return 'Low Pass';
    if (effect.type === 'high-pass') return 'High Pass';
    if (effect.type === 'band-pass') return 'Band Pass';
    if (effect.type === 'notch') return 'Notch';
    if (effect.type === 'telephone') return 'Talkback';
    if (effect.type === 'vocal-remove') return 'Vocal Remover';
    if (effect.type === 'de-esser') return 'De-Esser';
    if (effect.type === 'radio') return 'Radio';
    if (effect.type === 'bass-cut') return 'Bass Cut';
    if (effect.type === 'noise-gate') return 'Noise Gate';
    if (effect.type === 'reverb') return 'Reverb';
    if (effect.type === 'compression') return 'Compression';
    if (effect.type === 'saturation') return 'Saturation';
    if (effect.type === 'formant-shift') return 'Formant Shift';
    if (effect.type === 'pitch-shift') return 'Pitch Shift';
    if (effect.type === 'echo') return 'Echo';
    return 'Effect';
  };

  const describeEffectValue = (effect) => {
    if (effect.type === 'fade-in' || effect.type === 'fade-out') return formatCurveLabel(Math.max(0.1, Number(effect.curve) || 1));
    if (effect.type === 'normalize') return `${Math.round(Number(effect.targetDb) || -1)} dB`;
    if (effect.type === 'low-pass' || effect.type === 'high-pass') return formatFrequencyLabel(Math.max(120, Number(effect.cutoffHz) || 1200));
    if (effect.type === 'band-pass' || effect.type === 'notch') return formatFrequencyLabel(Math.max(120, Number(effect.centerHz) || 1200));
    if (effect.type === 'vocal-remove') {
      const strength = Number(effect.strength);
      return formatPercentLabel(Number.isFinite(strength) ? strength : 0.75);
    }
    if (effect.type === 'de-esser') {
      const amount = Number(effect.amount);
      return `${formatFrequencyLabel(Math.max(120, Number(effect.frequencyHz) || 5200))} • ${formatPercentLabel(Number.isFinite(amount) ? amount : 0.58)}`;
    }
    if (effect.type === 'radio') return 'Narrow';
    if (effect.type === 'bass-cut') return formatFrequencyLabel(Math.max(80, Number(effect.cutoffHz) || 180));
    if (effect.type === 'noise-gate') return `${Math.round((Number(effect.threshold) || 0.035) * 100)}%`;
    if (effect.type === 'echo' || effect.type === 'reverb') return `${formatDelayLabel((Number(effect.delay) || 0.18) * 1000)} • ${formatPercentLabel(Number(effect.decay) || 0.35)}`;
    if (effect.type === 'compression') return `${Math.round(Number(effect.ratio) || 3)}:1`;
    if (effect.type === 'saturation') return `${Number(Number(effect.drive || 2).toFixed(1))}x`;
    if (effect.type === 'formant-shift' || effect.type === 'pitch-shift') return formatSemitoneLabel(effect.semitones);
    return '';
  };

  const getEffectTone = (effect) => {
    if (effect.type === 'silence') return 'danger';
    if (effect.type === 'reverse') return 'neutral';
    if (
      effect.type === 'low-pass' ||
      effect.type === 'high-pass' ||
      effect.type === 'band-pass' ||
      effect.type === 'notch' ||
      effect.type === 'telephone' ||
      effect.type === 'vocal-remove' ||
      effect.type === 'de-esser' ||
      effect.type === 'radio' ||
      effect.type === 'bass-cut' ||
      effect.type === 'noise-gate' ||
      effect.type === 'formant-shift'
    ) return 'neutral';
    return 'accent';
  };

  const loadEffectSettings = (effect) => {
    if (!effect) return;
    if (effect.type === 'fade-in' || effect.type === 'fade-out') {
      effectSettings.fadeCurve = Math.max(0.5, Math.min(3, Number(effect.curve) || 1));
    }
    if (effect.type === 'normalize') {
      effectSettings.normalizeDb = Math.max(-18, Math.min(0, Number(effect.targetDb) || -1));
    }
    if (effect.type === 'low-pass' || effect.type === 'high-pass') {
      effectSettings.filterCutoffHz = Math.max(120, Math.min(12000, Number(effect.cutoffHz) || 1200));
    }
    if (effect.type === 'band-pass' || effect.type === 'notch') {
      effectSettings.filterCutoffHz = Math.max(120, Math.min(12000, Number(effect.centerHz) || 1200));
    }
    if (effect.type === 'de-esser') {
      effectSettings.filterCutoffHz = Math.max(120, Math.min(12000, Number(effect.frequencyHz) || 5200));
      const amount = Number(effect.amount);
      effectSettings.amount = Math.max(0, Math.min(1, Number.isFinite(amount) ? amount : 0.58));
    }
    if (effect.type === 'vocal-remove') {
      const strength = Number(effect.strength);
      effectSettings.amount = Math.max(0, Math.min(1, Number.isFinite(strength) ? strength : 0.76));
    }
    if (effect.type === 'bass-cut') {
      effectSettings.filterCutoffHz = Math.max(80, Math.min(12000, Number(effect.cutoffHz) || 180));
    }
    if (effect.type === 'echo' || effect.type === 'reverb') {
      effectSettings.echoDelayMs = Math.max(40, Math.min(800, Math.round((Number(effect.delay) || 0.18) * 1000)));
      effectSettings.echoDecay = Math.max(0.05, Math.min(0.9, Number(effect.decay) || 0.35));
    }
    if (effect.type === 'formant-shift' || effect.type === 'pitch-shift') {
      effectSettings.shiftSemitones = Math.max(-12, Math.min(12, Number(effect.semitones) || 3));
    }
    effectFadeInput.value = String(effectSettings.fadeCurve);
    effectNormalizeInput.value = String(Math.round(effectSettings.normalizeDb));
    effectFilterInput.value = String(Math.round(effectSettings.filterCutoffHz));
    effectEchoDelayInput.value = String(Math.round(effectSettings.echoDelayMs));
    effectEchoDecayInput.value = String(Math.round(effectSettings.echoDecay * 100));
    if (effectShiftInput) effectShiftInput.value = String(Math.round(effectSettings.shiftSemitones));
    if (effectAmountInput) effectAmountInput.value = String(Math.round(effectSettings.amount * 100));
    syncEffectControlReadouts();
  };

  const syncEffectVisualSelection = () => {
    const linkedEffectId = getLinkedEffectId();
    soundTrimmer?.setActiveEffect(linkedEffectId);
    if (linkedEffectVisualId && linkedEffectVisualId !== linkedEffectId) {
      effectChipNodes.get(linkedEffectVisualId)?.classList.remove('is-linked-active');
    }
    if (linkedEffectId) {
      effectChipNodes.get(linkedEffectId)?.classList.add('is-linked-active');
    }
    linkedEffectVisualId = linkedEffectId || null;
  };

  const syncEffectBatchButtons = () => {
    clearEffectsButton.disabled = !hasLocalClipAdjustments();
    applyEffectsButton.disabled = !hasLocalClipAdjustments();
    undoAppliedEffectsButton.disabled = appliedEffectHistory.length === 0;
    resetVolumeEnvelopeButton.disabled = !hasVolumeEnvelopeAdjustments();
    syncVolumeEnvelopeReadout();
  };

  const syncEffectEditorState = () => {
    const effect = getEffectById(activeEffectId);
    if (!effect) {
      effectEditor.classList.add('hidden');
      updateEffectButton.disabled = true;
      effectEditorTitle.textContent = 'Ready';
      effectEditorDetail.textContent = 'Select a range, then apply or revise a local clip effect.';
      Object.values(effectFieldMap).forEach((node) => node.classList.add('hidden'));
      syncEffectBatchButtons();
      syncEffectVisualSelection();
      return;
    }
    effectEditor.classList.remove('hidden');
    const isAdjustable = effect.type === 'fade-in' ||
      effect.type === 'fade-out' ||
      effect.type === 'normalize' ||
      effect.type === 'low-pass' ||
      effect.type === 'high-pass' ||
      effect.type === 'band-pass' ||
      effect.type === 'notch' ||
      effect.type === 'vocal-remove' ||
      effect.type === 'de-esser' ||
      effect.type === 'bass-cut' ||
      effect.type === 'echo' ||
      effect.type === 'reverb' ||
      effect.type === 'formant-shift' ||
      effect.type === 'pitch-shift';
    updateEffectButton.disabled = !isAdjustable;
    fadeField.classList.toggle('hidden', effect.type !== 'fade-in' && effect.type !== 'fade-out');
    normalizeField.classList.toggle('hidden', effect.type !== 'normalize');
    filterField.classList.toggle(
      'hidden',
      effect.type !== 'low-pass' &&
        effect.type !== 'high-pass' &&
        effect.type !== 'band-pass' &&
        effect.type !== 'notch' &&
        effect.type !== 'de-esser' &&
        effect.type !== 'bass-cut'
    );
    echoField.classList.toggle('hidden', effect.type !== 'echo' && effect.type !== 'reverb');
    echoDecayField.classList.toggle('hidden', effect.type !== 'echo' && effect.type !== 'reverb');
    effectFieldMap.shift?.classList.toggle('hidden', effect.type !== 'formant-shift' && effect.type !== 'pitch-shift');
    effectFieldMap.amount?.classList.toggle('hidden', effect.type !== 'vocal-remove' && effect.type !== 'de-esser');
    effectEditorTitle.textContent = `Selected ${describeEffect(effect)}`;
    effectEditorDetail.textContent = isAdjustable
      ? `Range ${formatRangeLabel(effect.start, effect.end)}. Drag the timeline overlay to retime it, or revise its setting here.`
      : `Range ${formatRangeLabel(effect.start, effect.end)}. Drag the timeline overlay to retime it.`;
    syncEffectBatchButtons();
    syncEffectVisualSelection();
  };

  const hoverEffect = (effectId = null) => {
    hoveredEffectId = effectId && getEffectById(effectId) ? effectId : null;
    syncEffectVisualSelection();
  };

  const selectEffect = (effectId = null) => {
    activeEffectId = effectId && getEffectById(effectId) ? effectId : null;
    if (activeEffectId) loadEffectSettings(getEffectById(activeEffectId));
    syncEffectEditorState();
  };

  const buildEffectPayload = (kind, currentEffect = null) => {
    if (kind === 'silence') return { type: 'silence' };
    if (kind === 'fade-in' || kind === 'fade-out') {
      return { type: kind, curve: effectSettings.fadeCurve };
    }
    if (kind === 'normalize') {
      return { type: 'normalize', targetDb: effectSettings.normalizeDb };
    }
    if (kind === 'reverse') return { type: 'reverse' };
    if (kind === 'low-pass' || kind === 'high-pass') {
      return { type: kind, cutoffHz: effectSettings.filterCutoffHz };
    }
    if (kind === 'band-pass' || kind === 'notch') {
      return { type: kind, centerHz: effectSettings.filterCutoffHz, q: kind === 'notch' ? 1.6 : 1.1 };
    }
    if (kind === 'telephone') {
      return { type: 'telephone' };
    }
    if (kind === 'vocal-remove') {
      return { type: 'vocal-remove', strength: effectSettings.amount };
    }
    if (kind === 'de-esser') {
      return { type: 'de-esser', frequencyHz: effectSettings.filterCutoffHz || 5200, amount: effectSettings.amount };
    }
    if (kind === 'radio') {
      return { type: 'radio' };
    }
    if (kind === 'bass-cut') {
      return { type: 'bass-cut', cutoffHz: effectSettings.filterCutoffHz || 180 };
    }
    if (kind === 'noise-gate') {
      return { type: 'noise-gate', threshold: 0.035, floorGain: 0 };
    }
    if (kind === 'reverb') {
      return { type: 'reverb', delay: effectSettings.echoDelayMs / 1000, decay: effectSettings.echoDecay, wet: 0.32 };
    }
    if (kind === 'compression') {
      return { type: 'compression', thresholdDb: -16, ratio: 3, makeupDb: 1.5 };
    }
    if (kind === 'saturation') {
      return { type: 'saturation', drive: 2.4, mix: 0.85 };
    }
    if (kind === 'formant-shift' || kind === 'pitch-shift') {
      return { type: kind, semitones: effectSettings.shiftSemitones };
    }
    if (kind === 'echo') {
      return { type: 'echo', delay: effectSettings.echoDelayMs / 1000, decay: effectSettings.echoDecay };
    }
    return null;
  };

  const syncEffectElements = () => {
    soundTrimmer?.setEffects(clipEffects.map((effect) => ({
      id: effect.id,
      start: effect.start,
      end: effect.end,
      tone: getEffectTone(effect),
      label: [describeEffect(effect), describeEffectValue(effect)].filter(Boolean).join(' '),
      draggable: true,
      resizable: true,
      removable: true
    })));
    syncEffectVisualSelection();
  };

  const removeClipEffect = (effectId) => {
    const nextEffects = clipEffects.filter((effect) => effect.id !== effectId);
    if (nextEffects.length === clipEffects.length) return;
    clipEffects = nextEffects;
    if (activeEffectId === effectId) activeEffectId = null;
    if (hoveredEffectId === effectId) hoveredEffectId = null;
    renderClipEffects();
    renderEffectSelectionState();
    debouncedRestart();
    scheduleProcessedWaveformRefresh();
  };

  const renderClipEffects = () => {
    effectCount.textContent = `${clipEffects.length} local effect${clipEffects.length === 1 ? '' : 's'}`;
    syncEffectBatchButtons();
    syncEffectElements();
    effectChipNodes.clear();
    linkedEffectVisualId = null;
    if (!clipEffects.length) {
      effectList.innerHTML = `<div class="sound-studio-effect-empty">No local effects applied</div>`;
      syncEffectEditorState();
      return;
    }
    effectList.innerHTML = clipEffects.map((effect) => `
      <div class="sound-studio-effect-chip" data-effect-id="${effect.id}">
        <span class="sound-studio-effect-chip-label">${describeEffect(effect)}</span>
        <span class="sound-studio-effect-chip-value">${describeEffectValue(effect)}</span>
        <span class="sound-studio-effect-chip-range">${formatRangeLabel(effect.start, effect.end)}</span>
        <button type="button" class="sound-studio-effect-chip-remove" data-remove-effect="${effect.id}" aria-label="Remove effect">
          <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="M4 4l8 8"></path>
            <path d="M12 4l-8 8"></path>
          </svg>
        </button>
      </div>
    `).join('');
    effectList.querySelectorAll('[data-effect-id]').forEach((chip) => {
      const effectId = chip.getAttribute('data-effect-id');
      effectChipNodes.set(effectId, chip);
      chip.addEventListener('mouseenter', () => {
        hoverEffect(effectId);
      });
      chip.addEventListener('mouseleave', () => {
        hoverEffect(null);
      });
      chip.addEventListener('click', () => {
        selectEffect(effectId);
      });
      chip.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openEffectContextMenu(effectId, event.clientX, event.clientY);
      });
      chip.querySelector('[data-remove-effect]')?.addEventListener('click', (event) => {
        event.stopPropagation();
        removeClipEffect(effectId);
      });
    });
    syncEffectEditorState();
  };

  const renderEffectSelectionState = () => {
    const range = soundTrimmer?.getSelection('effect-range');
    const actionableRange = getActionableTrimmerRange();
    effectRangeStatus.textContent = range ? `Effect Range ${formatRangeLabel(range.start, range.end)}` : 'No effect range selected';
    effectRangeStatus.classList.toggle('is-selected', !!range);
    clearEffectRangeButton.classList.toggle('hidden', !range);
    if (deleteSelectionButton) deleteSelectionButton.disabled = !actionableRange;
    effectButtons.forEach((button) => {
      button.disabled = !range;
    });
    syncEffectBatchButtons();
  };

  const getTrimPreviewRate = () => {
    if (!container.querySelector('#trim-speed-toggle').checked) return 1;
    return Math.max(0.1, parseFloat(spIn.value) || 1);
  };

  let previewRenderJob = null;
  let previewRenderKey = '';
  let previewRequestToken = 0;
  let currentPreviewRangeStart = 0;

  const buildPreviewRenderKey = () => JSON.stringify({
    start: Number(sVal.toFixed(4)),
    end: Number(eVal.toFixed(4)),
    speed: container.querySelector('#trim-speed-toggle').checked ? parseFloat(spIn.value) : 1,
    pitch: container.querySelector('#trim-pitch-toggle').checked ? parseFloat(piIn.value) : 0,
    gain: container.querySelector('#trim-postgain-toggle').checked ? parseFloat(pgIn.value) : 0,
    noiseAmount: container.querySelector('#trim-noise-toggle').checked ? parseFloat(container.querySelector('#trim-noise').value) : 0,
    levelerAmount: container.querySelector('#trim-leveler-toggle').checked ? parseFloat(container.querySelector('#trim-leveler').value) : 0,
    length: workingBuffer.length,
    sampleRate: workingBuffer.sampleRate,
    effects: clipEffects.map((effect) => ({
      type: effect.type,
      start: Number(effect.start?.toFixed?.(4) || effect.start || 0),
      end: Number(effect.end?.toFixed?.(4) || effect.end || 0),
      curve: Number(effect.curve?.toFixed?.(2) || effect.curve || 0),
      targetDb: Number(effect.targetDb?.toFixed?.(2) || effect.targetDb || 0),
      cutoffHz: Number(effect.cutoffHz?.toFixed?.(2) || effect.cutoffHz || 0),
      centerHz: Number(effect.centerHz?.toFixed?.(2) || effect.centerHz || 0),
      frequencyHz: Number(effect.frequencyHz?.toFixed?.(2) || effect.frequencyHz || 0),
      delay: Number(effect.delay?.toFixed?.(3) || effect.delay || 0),
      decay: Number(effect.decay?.toFixed?.(3) || effect.decay || 0),
      strength: Number(effect.strength?.toFixed?.(3) || effect.strength || 0),
      amount: Number(effect.amount?.toFixed?.(3) || effect.amount || 0),
      threshold: Number(effect.threshold?.toFixed?.(3) || effect.threshold || 0),
      ratio: Number(effect.ratio?.toFixed?.(2) || effect.ratio || 0),
      drive: Number(effect.drive?.toFixed?.(2) || effect.drive || 0),
      mix: Number(effect.mix?.toFixed?.(3) || effect.mix || 0),
      semitones: Number(effect.semitones?.toFixed?.(2) || effect.semitones || 0)
    })),
    volumeEnvelope: volumeEnvelope.map((point) => ({
      time: Number(point.time?.toFixed?.(4) || point.time || 0),
      gainDb: Number(point.gainDb?.toFixed?.(2) || point.gainDb || 0)
    }))
  });

  const getPreviewRenderJob = () => {
    const nextKey = buildPreviewRenderKey();
    if (previewRenderJob && previewRenderKey === nextKey) return previewRenderJob;
    previewRenderKey = nextKey;
    previewRenderJob = processBufferWSOLA(workingBuffer, sVal, eVal).finally(() => {
      if (previewRenderKey === nextKey) previewRenderJob = null;
    });
    return previewRenderJob;
  };

  const clampPreviewSourceTime = (time) => Math.max(sVal, Math.min(eVal, Number(time) || sVal));
  const getPreviewOffsetForSourceTime = (time, rate = currentPreviewRate || getTrimPreviewRate(), rangeStart = sVal) => {
    return Math.max(0, clampPreviewSourceTime(time) - rangeStart) / Math.max(0.1, rate || 1);
  };
  const getSourceTimeFromPreviewOffset = (offset, rangeStart = currentPreviewRangeStart) => {
    return clampPreviewSourceTime(rangeStart + (Math.max(0, Number(offset) || 0) * Math.max(0.1, currentPreviewRate || 1)));
  };
  const setTrimRangeTo = (start, end, options = {}) => {
    const rangeStart = Math.max(0, Number(start) || 0);
    const rangeEnd = Math.max(rangeStart, Number(end) || rangeStart);
    soundTrimmer?.setRange(rangeStart, rangeEnd, true);
    if (options.zoom) focusTrimmerRange(rangeStart, rangeEnd, { zoom: true });
    else centerTrimmerViewportOnRange(rangeStart, rangeEnd);
  };
  const setEffectRangeTo = (start, end, options = {}) => {
    const rangeStart = Math.max(0, Number(start) || 0);
    const rangeEnd = Math.max(rangeStart, Number(end) || rangeStart);
    soundTrimmer?.setSelection('effect-range', rangeStart, rangeEnd, false);
    setActiveSelection('effect-range');
    renderEffectSelectionState();
    if (options.zoom) focusTrimmerRange(rangeStart, rangeEnd, { zoom: true });
    else if (options.center) centerTrimmerViewportOnRange(rangeStart, rangeEnd);
  };
  const getActionableTrimmerRange = () => soundTrimmer?.getSelectionRange('selection') || soundTrimmer?.getSelectionRange('effect-range');
  const deleteSelectedAudioRange = () => {
    const range = getActionableTrimmerRange();
    if (!range || (range.end - range.start) <= 0.02) return false;
    stopPreview();
    const previousDuration = workingBuffer.duration;
    const nextSamples = deleteAudioSampleRange(workingBuffer.getChannelData(0), {
      sampleRate: workingBuffer.sampleRate,
      start: range.start,
      end: range.end
    });
    workingBuffer = createAudioBufferFromSamples(nextSamples, workingBuffer.sampleRate);
    const removedDuration = Math.max(0, previousDuration - workingBuffer.duration);
    sVal = Math.min(sVal, workingBuffer.duration);
    eVal = Math.max(0.1, Math.min(workingBuffer.duration, eVal - removedDuration));
    if (eVal <= sVal) {
      sVal = 0;
      eVal = workingBuffer.duration;
    }
    pendingFadeIn = Math.min(pendingFadeIn, (eVal - sVal) / 2);
    pendingFadeOut = Math.min(pendingFadeOut, (eVal - sVal) / 2);
    clipEffects = clipEffects
      .map((effect) => {
        if (effect.end <= range.start) return effect;
        if (effect.start >= range.end) {
          return {
            ...effect,
            start: Math.max(0, effect.start - removedDuration),
            end: Math.max(0, effect.end - removedDuration)
          };
        }
        return null;
      })
      .filter(Boolean);
    volumeEnvelope = normalizeVolumeEnvelope(volumeEnvelope.map((point) => {
      if (point.time <= range.start) return point;
      return { ...point, time: Math.max(range.start, point.time - removedDuration) };
    }));
    activeEffectId = activeEffectId && getEffectById(activeEffectId) ? activeEffectId : null;
    hoveredEffectId = hoveredEffectId && getEffectById(hoveredEffectId) ? hoveredEffectId : null;
    soundTrimmer?.setDuration(workingBuffer.duration);
    soundTrimmer?.setRange(sVal, eVal, false);
    soundTrimmer?.clearSelection('selection', false);
    soundTrimmer?.clearSelection('effect-range', false);
    soundTrimmer?.setPlayhead(Math.min(range.start, workingBuffer.duration), 'delete-selection');
    activeTrimmerBufferReader = () => workingBuffer;
    performScan();
    refreshTrimmerWaveform();
    renderVolumeEnvelope();
    renderClipEffects();
    renderEffectSelectionState();
    setActiveSelection('effect-range');
    setStudioStatus('Selected audio removed', 'success');
    return true;
  };
  deleteSelectedTrimmerAudioRange = deleteSelectedAudioRange;
  const convertRangeToNoiseProfile = (range, sourceSelectionId = 'effect-range') => {
    if (!range) return;
    performScan(range.start, range.end);
    soundTrimmer?.setSelection('noise-profile', range.start, range.end, false);
    if (sourceSelectionId && sourceSelectionId !== 'noise-profile') {
      soundTrimmer?.clearSelection(sourceSelectionId, false);
    }
    setActiveSelection('effect-range');
    renderEffectSelectionState();
    debouncedRestart();
  };
  const duplicateClipEffect = (effectId) => {
    const effect = getEffectById(effectId);
    if (!effect) return;
    clipEffects.unshift({
      ...effect,
      id: `${Date.now()}-${Math.random()}`
    });
    renderClipEffects();
    selectEffect(clipEffects[0].id);
    debouncedRestart();
    scheduleProcessedWaveformRefresh();
  };
  const duplicateActiveEffectToRange = (range) => {
    const effect = getEffectById(activeEffectId);
    if (!effect || !range) return;
    clipEffects.unshift({
      ...effect,
      id: `${Date.now()}-${Math.random()}`,
      start: range.start,
      end: range.end
    });
    soundTrimmer?.clearSelection('effect-range', false);
    setActiveSelection('effect-range');
    renderClipEffects();
    renderEffectSelectionState();
    selectEffect(clipEffects[0].id);
    debouncedRestart();
    scheduleProcessedWaveformRefresh();
  };

  const syncSelectionButtons = () => {
    noiseButton.classList.toggle('active', activeSelectionMode === 'noise-profile');
    noiseButton.textContent = activeSelectionMode === 'noise-profile' ? 'Cancel Noise Range' : 'Select Noise Profile';
    effectRangeButton.classList.toggle('active', activeSelectionMode !== 'noise-profile');
    effectRangeButton.textContent = activeSelectionMode === 'noise-profile' ? 'Select Effect Range' : 'Effect Range Ready';
  };

  const setActiveSelection = (selectionId = null) => {
    activeSelectionMode = selectionId === 'noise-profile' ? 'noise-profile' : 'effect-range';
    soundTrimmer?.setActiveSelection(activeSelectionMode);
    syncSelectionButtons();
    renderEffectSelectionState();
  };

  const applySelectedEffect = (effect) => {
    const range = soundTrimmer?.getSelection('effect-range');
    if (!range) return;
    clipEffects.unshift({
      id: `${Date.now()}-${Math.random()}`,
      ...effect,
      start: range.start,
      end: range.end
    });
    soundTrimmer?.clearSelection('effect-range', false);
    setActiveSelection('effect-range');
    selectEffect(clipEffects[0].id);
    renderClipEffects();
    renderEffectSelectionState();
    debouncedRestart();
    scheduleProcessedWaveformRefresh();
  };

  const updateSelectedEffect = () => {
    const effect = getEffectById(activeEffectId);
    if (!effect) return;
    const nextPayload = buildEffectPayload(effect.type, effect);
    if (!nextPayload || nextPayload.type !== effect.type) return;
    clipEffects = clipEffects.map((entry) => entry.id === effect.id ? { ...entry, ...nextPayload } : entry);
    renderClipEffects();
    debouncedRestart();
    scheduleProcessedWaveformRefresh();
  };

  const analyzeTrimmerWaveform = (samples, sampleRate, cacheKey) => {
    if (!soundTrimmer) return Promise.resolve();
    const safeSamples = samples instanceof Float32Array ? samples : Float32Array.from(samples || []);
    setTrimmerBusy('waveform', true);
    soundTrimmer.setSamples(safeSamples);
    const waveformToken = ++soundTrimmerToken;
    return analyzeWaveformSamples({
      sampleBuffer: safeSamples.slice(0).buffer,
      sampleRate,
      cacheKey: `${cacheKey}:${waveformToken}`,
      maxBins: 65536
    }).then((waveform) => {
      if (!soundTrimmer || waveformToken !== soundTrimmerToken) return;
      soundTrimmer.setWaveform(waveform);
      setTrimmerBusy('waveform', false);
    }).catch(() => {
      if (!soundTrimmer || waveformToken !== soundTrimmerToken) return;
      setTrimmerBusy('waveform', false);
    });
  };
  const refreshTrimmerWaveform = () => (
    analyzeTrimmerWaveform(
      workingBuffer.getChannelData(0).slice(0),
      workingBuffer.sampleRate,
      `${suggestedName || 'clip'}:${workingBuffer.length}:${workingBuffer.sampleRate}`
    )
  );
  const refreshProcessedWaveform = async () => {
    const requestToken = ++processedWaveformToken;
    setTrimmerBusy('waveform', true);
    const sampleCopy = workingBuffer.getChannelData(0).slice(0);
    const transferables = [sampleCopy.buffer];
    let noiseProfileBuffer = null;
    if (noiseProfile instanceof Float32Array && noiseProfile.length) {
      noiseProfileBuffer = noiseProfile.slice(0).buffer;
      transferables.push(noiseProfileBuffer);
    }
    try {
      const response = await globalWorkerPool.run('audio-process', {
        sampleBuffer: sampleCopy.buffer,
        sampleRate: workingBuffer.sampleRate,
        start: 0,
        end: workingBuffer.duration,
        speed: 1,
        pitch: 0,
        gain: trimOptionMap.postgain.toggle.checked ? Math.pow(10, parseFloat(pgIn.value) / 20) : 1,
        effects: clipEffects,
        volumeEnvelope,
        noiseProfile: noiseProfileBuffer,
        noiseAmount: trimOptionMap.noise.toggle.checked ? parseFloat(noiseInput.value) / 100 : 0,
        levelerAmount: trimOptionMap.leveler.toggle.checked ? parseFloat(levelerInput.value) / 100 : 0
      }, transferables);
      if (requestToken !== processedWaveformToken) return;
      const processedSampleBuffer = response?.result?.sampleBuffer;
      if (processedSampleBuffer) {
        await analyzeTrimmerWaveform(
          new Float32Array(processedSampleBuffer),
          workingBuffer.sampleRate,
          `${suggestedName || 'clip'}:processed:${workingBuffer.length}:${workingBuffer.sampleRate}:${buildPreviewRenderKey()}`
        );
        return;
      }
    } catch (error) {
      if (requestToken !== processedWaveformToken) return;
    }
    if (requestToken !== processedWaveformToken) return;
    const fallbackSamples = processTrimAudioSamples({
      samples: workingBuffer.getChannelData(0).slice(0),
      sampleRate: workingBuffer.sampleRate,
      start: 0,
      end: workingBuffer.duration,
      speed: 1,
      pitch: 0,
      gain: trimOptionMap.postgain.toggle.checked ? Math.pow(10, parseFloat(pgIn.value) / 20) : 1,
      effects: clipEffects,
      volumeEnvelope,
      noiseProfile,
      noiseAmount: trimOptionMap.noise.toggle.checked ? parseFloat(noiseInput.value) / 100 : 0,
      levelerAmount: trimOptionMap.leveler.toggle.checked ? parseFloat(levelerInput.value) / 100 : 0
    });
    if (requestToken !== processedWaveformToken) return;
    await analyzeTrimmerWaveform(
      fallbackSamples,
      workingBuffer.sampleRate,
      `${suggestedName || 'clip'}:processed-fallback:${workingBuffer.length}:${workingBuffer.sampleRate}:${buildPreviewRenderKey()}`
    );
  };
  const scheduleProcessedWaveformRefresh = () => {
    if (waveformRefreshTimer) clearTimeout(waveformRefreshTimer);
    waveformRefreshTimer = setTimeout(() => {
      waveformRefreshTimer = null;
      refreshProcessedWaveform();
    }, 140);
  };

  const createAudioBufferFromSamples = (samples, sampleRate) => {
    if (typeof audioCtx?.createBuffer === 'function') {
      const buffer = audioCtx.createBuffer(1, samples.length, sampleRate);
      buffer.getChannelData(0).set(samples);
      return buffer;
    }
    const channelData = new Float32Array(samples);
    return {
      duration: channelData.length / sampleRate,
      sampleRate,
      length: channelData.length,
      numberOfChannels: 1,
      getChannelData() {
        return channelData;
      }
    };
  };

  const applyEffectsToWorkingClip = async () => {
    if (!hasLocalClipAdjustments()) return;
    appliedEffectHistory.push({
      buffer: workingBuffer,
      effects: cloneClipEffects(),
      volumeEnvelope: cloneVolumeEnvelope()
    });
    const bakedSamples = processTrimAudioSamples({
      samples: workingBuffer.getChannelData(0).slice(0),
      sampleRate: workingBuffer.sampleRate,
      start: 0,
      end: workingBuffer.duration,
      effects: clipEffects,
      volumeEnvelope
    });
    workingBuffer = createAudioBufferFromSamples(bakedSamples, workingBuffer.sampleRate);
    clipEffects = [];
    volumeEnvelope = normalizeVolumeEnvelope([]);
    activeEnvelopePointIndex = null;
    activeEffectId = null;
    hoveredEffectId = null;
    soundTrimmer?.clearSelection('effect-range', false);
    performScan();
    await refreshTrimmerWaveform();
    renderVolumeEnvelope();
    renderClipEffects();
    renderEffectSelectionState();
    cancelPendingRestart();
    setStudioStatus('Effects applied to working clip', 'success');
  };

  const undoAppliedEffects = async () => {
    const previous = appliedEffectHistory.pop();
    if (!previous) return;
    workingBuffer = previous.buffer;
    clipEffects = previous.effects;
    volumeEnvelope = normalizeVolumeEnvelope(previous.volumeEnvelope);
    activeEnvelopePointIndex = null;
    activeEffectId = null;
    hoveredEffectId = null;
    performScan();
    await refreshTrimmerWaveform();
    renderVolumeEnvelope();
    renderClipEffects();
    renderEffectSelectionState();
    cancelPendingRestart();
    setStudioStatus('Applied effects restored', 'success');
  };

  let lastLoopState = false;
  destroyTrimmerSessionUi?.();
  destroyTrimmerSessionUi = null;
  soundTrimmer?.destroy();
  soundTrimmer = createMediaTrimmer({
    mount: container.querySelector('#sound-trim-host'),
    idPrefix: 'sound',
    duration: dur,
    start: 0,
    end: dur,
    minSpan: 0.1,
    zoom: 1,
    maxZoom: 120,
    isLooping: lastLoopState,
    showFades: true,
    fadeIn: pendingFadeIn,
    fadeOut: pendingFadeOut,
    includeDefaultSelectionLayer: false,
    showSeekAutoplayToggle: true,
    seekAutoplayEnabled: false,
    rulerDragCreatesRange: true,
    selectionLayers: [
      { id: 'noise-profile', tone: 'danger' },
      { id: 'effect-range', tone: 'accent' }
    ],
    activeSelectionId: activeSelectionMode,
    onEffectHover({ id }) {
      hoverEffect(id);
    },
    onEffectSelect({ id }) {
      selectEffect(id);
    },
    onEffectChange({ id, start, end, reason }) {
      let changed = false;
      clipEffects = clipEffects.map((effect) => {
        if (effect.id !== id) return effect;
        changed = true;
        return { ...effect, start, end };
      });
      if (!changed) return;
      if (reason === 'commit') {
        renderClipEffects();
        debouncedRestart();
      } else if (activeEffectId === id) {
        syncEffectEditorState();
      }
    },
    onChange(range) {
      sVal = range.start;
      eVal = range.end;
      pendingFadeIn = range.fadeIn;
      pendingFadeOut = range.fadeOut;
      soundTrimmer?.clearPlayhead();
      debouncedRestart();
    },
    onSelectionChange(change) {
      if (change.id === 'noise-profile') {
        if (change.cleared) {
          return;
        }
        if (change.reason === 'commit') {
          performScan(change.start, change.end);
          setActiveSelection('effect-range');
          debouncedRestart();
        }
      }
      if (change.id === 'effect-range') {
        renderEffectSelectionState();
        if (change.reason === 'commit') {
          renderEffectSelectionState();
          return;
        }
      }
    },
    onRulerSeek({ time, rangeRepositioned, isSeekAutoplayEnabled: seekAutoplayEnabled }) {
      const clamped = Math.max(sVal, Math.min(eVal, time));
      const isPreviewPlaying = !!(currentPreviewAudio && !currentPreviewAudio.paused);
      isSeekAutoplayEnabled = !!seekAutoplayEnabled;
      if (isPreviewPlaying && !rangeRepositioned) {
        currentPreviewAudio.currentTime = Math.min(
          getPreviewOffsetForSourceTime(clamped, currentPreviewRate, currentPreviewRangeStart),
          Math.max(0, currentPreviewAudio.duration - 0.01)
        );
        soundTrimmer?.setPlayhead(clamped, 'preview-seek');
        return;
      }
      if (!isPreviewPlaying && !isSeekAutoplayEnabled) return;
      cancelPendingRestart();
      playPreview(clamped);
    },
    onSeek(time) {
      const clamped = Math.max(sVal, Math.min(eVal, time));
      cancelPendingRestart();
      playPreview(clamped);
    },
    onTogglePlayback({ isPlaying, time }) {
      if (isPlaying) {
        cancelPendingRestart();
        playPreview(time !== undefined ? time : sVal);
      } else {
        stopPreview();
      }
    },
    onLoopChange({ isLooping }) {
      lastLoopState = isLooping;
    },
    onSeekAutoplayChange({ isSeekAutoplayEnabled: seekAutoplay }) {
      isSeekAutoplayEnabled = !!seekAutoplay;
    },
    onRulerDoubleClick({ time }) {
      if (currentPreviewAudio && !currentPreviewAudio.paused) stopPreview();
      else {
        if (!isSeekAutoplayEnabled) return;
        const clamped = Math.max(sVal, Math.min(eVal, time));
        playPreview(clamped);
      }
    }
  });
  soundTrimmer.root.classList.add('sound-studio-focus-surface');
  soundTrimmer.root.tabIndex = 0;
  const effectPaletteModal = document.createElement('div');
  effectPaletteModal.id = 'sound-studio-effect-palette';
  effectPaletteModal.className = 'studio-modal active hidden sound-studio-effect-palette-modal';
  effectPaletteModal.innerHTML = `
    <div class="modal-content sound-studio-modal-content-compact">
      <div class="modal-header">
        <div class="sound-studio-modal-title-stack">
          <strong class="sound-studio-modal-heading">Apply Local Effect</strong>
          <span class="sound-studio-modal-copy">Choose the effect to place on the selected trimmer range.</span>
        </div>
        <button type="button" class="mini-btn danger sound-studio-modal-close" data-close-effect-palette>Close</button>
      </div>
      <div class="modal-body">
        <div class="sound-studio-effect-palette-grid">
          <button type="button" class="sound-studio-effect-palette-btn" data-effect-kind="silence">Silence</button>
          <button type="button" class="sound-studio-effect-palette-btn" data-effect-kind="fade-in">Fade In</button>
          <button type="button" class="sound-studio-effect-palette-btn" data-effect-kind="fade-out">Fade Out</button>
          <button type="button" class="sound-studio-effect-palette-btn" data-effect-kind="normalize">Normalize</button>
          <button type="button" class="sound-studio-effect-palette-btn" data-effect-kind="reverse">Reverse</button>
          <button type="button" class="sound-studio-effect-palette-btn" data-effect-kind="low-pass">Low Pass</button>
          <button type="button" class="sound-studio-effect-palette-btn" data-effect-kind="high-pass">High Pass</button>
          <button type="button" class="sound-studio-effect-palette-btn" data-effect-kind="band-pass">Band Pass</button>
          <button type="button" class="sound-studio-effect-palette-btn" data-effect-kind="notch">Notch</button>
          <button type="button" class="sound-studio-effect-palette-btn" data-effect-kind="telephone">Talkback</button>
          <button type="button" class="sound-studio-effect-palette-btn" data-effect-kind="vocal-remove">Vocal Remover</button>
          <button type="button" class="sound-studio-effect-palette-btn" data-effect-kind="de-esser">De-Esser</button>
          <button type="button" class="sound-studio-effect-palette-btn" data-effect-kind="radio">Radio</button>
          <button type="button" class="sound-studio-effect-palette-btn" data-effect-kind="bass-cut">Bass Cut</button>
          <button type="button" class="sound-studio-effect-palette-btn" data-effect-kind="noise-gate">Noise Gate</button>
          <button type="button" class="sound-studio-effect-palette-btn" data-effect-kind="reverb">Reverb</button>
          <button type="button" class="sound-studio-effect-palette-btn" data-effect-kind="compression">Compression</button>
          <button type="button" class="sound-studio-effect-palette-btn" data-effect-kind="saturation">Saturation</button>
          <button type="button" class="sound-studio-effect-palette-btn" data-effect-kind="formant-shift">Formant Shift</button>
          <button type="button" class="sound-studio-effect-palette-btn" data-effect-kind="pitch-shift">Pitch Shift</button>
          <button type="button" class="sound-studio-effect-palette-btn" data-effect-kind="echo">Echo</button>
        </div>
      </div>
    </div>
  `;
  soundTrimmer.root.appendChild(effectPaletteModal);
  const effectPaletteModalController = createModalController(effectPaletteModal, {
    closeSelectors: ['[data-close-effect-palette]'],
    documentTarget: document
  });
  effectPaletteModal.querySelectorAll('[data-effect-kind]').forEach((button) => {
    button.addEventListener('click', () => {
      const payload = buildEffectPayload(button.getAttribute('data-effect-kind'));
      if (!payload) return;
      effectPaletteModalController.close('select');
      applySelectedEffect(payload);
    });
  });
  openEffectPalette = () => {
    effectPaletteModalController.open('context');
  };
  const focusTrimmerRange = (startTime, endTime = startTime, { zoom = false } = {}) => {
    const rangeStart = Math.max(sVal, Math.min(eVal, Number(startTime) || sVal));
    const rangeEnd = Math.max(rangeStart, Math.min(eVal, Number(endTime) || rangeStart));
    if (zoom) {
      const totalDuration = Math.max(0.1, Number(soundTrimmer?.getRange?.()?.duration) || dur || 0.1);
      const paddedSpan = Math.min(totalDuration, Math.max(0.8, (rangeEnd - rangeStart) * 1.6));
      soundTrimmer?.setZoom(totalDuration / paddedSpan, false);
    }
    centerTrimmerViewportOnRange(rangeStart, rangeEnd);
  };
  const moveTrimmerPlayheadToTime = (time) => {
    const clamped = Math.max(sVal, Math.min(eVal, Number(time) || sVal));
    soundTrimmer?.setPlayhead(clamped, 'ruler-click');
    centerTrimmerViewportOnRange(clamped);
  };
  const playTrimmerFromTime = (time) => {
    const clamped = Math.max(sVal, Math.min(eVal, Number(time) || sVal));
    cancelPendingRestart();
    moveTrimmerPlayheadToTime(clamped);
    playPreview(clamped);
  };
  const getTrimmerContextTime = (event) => {
    const timeline = soundTrimmer?.getTimelineElement?.();
    const duration = Math.max(0.001, Number(soundTrimmer?.getRange?.()?.duration) || dur || 0.001);
    const rect = timeline?.getBoundingClientRect?.() || { left: 0, width: 1 };
    const width = rect.width || timeline?.clientWidth || 1;
    return clamp((((event.clientX || 0) - rect.left) / Math.max(1, width)) * duration, 0, duration);
  };
  const openEffectRangeContextMenu = (range, x, y) => {
    if (!range) return;
    studioContextMenu?.open({
      x,
      y,
      items: [
        {
          id: 'center-effect-range',
          label: 'Center Range',
          onSelect() {
            focusTrimmerRange(range.start, range.end);
          }
        },
        {
          id: 'move-playhead-to-range-start',
          label: 'Move Playhead to Range Start',
          onSelect() {
            moveTrimmerPlayheadToTime(range.start);
          }
        },
        {
          id: 'move-playhead-to-range-end',
          label: 'Move Playhead to Range End',
          onSelect() {
            moveTrimmerPlayheadToTime(range.end);
          }
        },
        {
          id: 'play-effect-range',
          label: 'Play Range',
          onSelect() {
            playTrimmerFromTime(range.start);
          }
        },
        {
          id: 'play-effect-range-end',
          label: 'Play From Range End',
          onSelect() {
            playTrimmerFromTime(range.end);
          }
        },
        {
          id: 'zoom-to-effect-range',
          label: 'Zoom to Range',
          onSelect() {
            focusTrimmerRange(range.start, range.end, { zoom: true });
          }
        },
        {
          id: 'set-trim-to-range',
          label: 'Set Trim to Range',
          onSelect() {
            setTrimRangeTo(range.start, range.end, { zoom: true });
          }
        },
        {
          id: 'set-trim-start-to-range',
          label: 'Set Trim Start to Range',
          onSelect() {
            setTrimRangeTo(range.start, eVal, { zoom: true });
          }
        },
        {
          id: 'set-trim-end-to-range',
          label: 'Set Trim End to Range',
          onSelect() {
            setTrimRangeTo(sVal, range.end, { zoom: true });
          }
        },
        {
          id: 'fit-effect-range-to-trim',
          label: 'Fit Range to Trim',
          onSelect() {
            setEffectRangeTo(sVal, eVal, { center: true });
          }
        },
        { separator: true },
        {
          id: 'delete-selected-audio',
          label: 'Delete Selected Part',
          danger: true,
          onSelect() {
            deleteSelectedAudioRange();
          }
        },
        { separator: true },
        {
          id: 'apply-effect',
          label: 'Apply Effect',
          onSelect() {
            openEffectPalette();
          }
        },
        {
          id: 'copy-active-effect-to-range',
          label: activeEffectId ? 'Copy Active Effect Here' : 'No Active Effect to Copy',
          disabled: !activeEffectId,
          onSelect() {
            duplicateActiveEffectToRange(range);
          }
        },
        {
          id: 'noise-from-range',
          label: 'Convert to Noise Profile',
          onSelect() {
            convertRangeToNoiseProfile(range, 'effect-range');
          }
        },
        {
          id: 'clear-effect-range',
          label: 'Clear Range',
          onSelect() {
            soundTrimmer?.clearSelection('effect-range');
            renderEffectSelectionState();
          }
        }
      ]
    });
  };
  const openGenericTrimmerContextMenu = (time, x, y) => {
    const clickedTime = Math.max(sVal, Math.min(eVal, Number(time) || sVal));
    studioContextMenu?.open({
      x,
      y,
      items: [
        {
          id: 'move-playhead-here',
          label: 'Move Playhead Here',
          onSelect() {
            moveTrimmerPlayheadToTime(clickedTime);
          }
        },
        {
          id: 'play-from-here',
          label: 'Play From Here',
          onSelect() {
            playTrimmerFromTime(clickedTime);
          }
        },
        {
          id: 'center-view-here',
          label: 'Center View Here',
          onSelect() {
            centerTrimmerViewportOnRange(clickedTime);
          }
        },
        { separator: true },
        {
          id: 'center-trim-range',
          label: 'Center Trim Range',
          onSelect() {
            focusTrimmerRange(sVal, eVal);
          }
        },
        {
          id: 'zoom-to-trim-range',
          label: 'Zoom to Trim Range',
          onSelect() {
            focusTrimmerRange(sVal, eVal, { zoom: true });
          }
        },
        {
          id: 'fit-full-clip',
          label: 'Fit Full Clip',
          onSelect() {
            soundTrimmer?.setZoom(1);
            centerTrimmerViewportOnRange((sVal + eVal) / 2);
          }
        }
      ]
    });
  };
  openEffectContextMenu = (effectId, x, y) => {
    const effect = getEffectById(effectId);
    if (!effect) return;
    studioContextMenu?.open({
      x,
      y,
      items: [
        {
          id: 'edit-effect',
          label: 'Edit Effect',
          onSelect() {
            selectEffect(effectId);
            scrollNodeIntoView(effectEditor);
          }
        },
        {
          id: 'center-effect',
          label: 'Center Effect',
          onSelect() {
            selectEffect(effectId);
            centerTrimmerViewportOnRange(effect.start, effect.end);
          }
        },
        {
          id: 'move-playhead-to-effect-start',
          label: 'Move Playhead to Effect Start',
          onSelect() {
            moveTrimmerPlayheadToTime(effect.start);
          }
        },
        {
          id: 'move-playhead-to-effect-end',
          label: 'Move Playhead to Effect End',
          onSelect() {
            moveTrimmerPlayheadToTime(effect.end);
          }
        },
        {
          id: 'play-effect',
          label: 'Play Effect',
          onSelect() {
            playTrimmerFromTime(effect.start);
          }
        },
        {
          id: 'zoom-to-effect',
          label: 'Zoom to Effect',
          onSelect() {
            focusTrimmerRange(effect.start, effect.end, { zoom: true });
          }
        },
        {
          id: 'use-effect-as-range',
          label: 'Use Effect as Range',
          onSelect() {
            setEffectRangeTo(effect.start, effect.end, { center: true });
          }
        },
        {
          id: 'copy-effect-to-active-range',
          label: soundTrimmer?.getSelectionRange('effect-range') ? 'Copy Effect to Active Range' : 'No Active Range',
          disabled: !soundTrimmer?.getSelectionRange('effect-range'),
          onSelect() {
            const range = soundTrimmer?.getSelectionRange('effect-range');
            if (!range) return;
            clipEffects.unshift({
              ...effect,
              id: `${Date.now()}-${Math.random()}`,
              start: range.start,
              end: range.end
            });
            renderClipEffects();
            selectEffect(clipEffects[0].id);
            debouncedRestart();
            scheduleProcessedWaveformRefresh();
          }
        },
        {
          id: 'set-trim-to-effect',
          label: 'Set Trim to Effect',
          onSelect() {
            setTrimRangeTo(effect.start, effect.end, { zoom: true });
          }
        },
        {
          id: 'duplicate-effect',
          label: 'Duplicate Effect',
          onSelect() {
            duplicateClipEffect(effectId);
          }
        },
        {
          id: 'remove-effect',
          label: 'Remove Effect',
          danger: true,
          onSelect() {
            removeClipEffect(effectId);
          }
        }
      ]
    });
  };
  openEnvelopePointContextMenu = (index, x, y) => {
    studioContextMenu?.open({
      x,
      y,
      items: [
        {
          id: 'remove-envelope-point',
          label: 'Remove Keyframe',
          disabled: index <= 0 || index >= volumeEnvelope.length - 1,
          onSelect() {
            removeEnvelopePoint(index);
          }
        },
        {
          id: 'reset-envelope',
          label: 'Reset Envelope',
          onSelect() {
            resetVolumeEnvelopeButton.onclick?.();
          }
        }
      ]
    });
  };
  const handleTrimmerContextMenu = (event) => {
    const effectNode = event.target?.closest?.('.media-trimmer-effect');
    if (effectNode) {
      event.preventDefault();
      event.stopPropagation();
      openEffectContextMenu(effectNode.dataset?.effectId || effectNode.getAttribute?.('data-effect-id'), event.clientX, event.clientY);
      return;
    }

    const selectionRange = soundTrimmer?.getSelectionRange('selection');
    const effectRange = soundTrimmer?.getSelectionRange('effect-range');
    const targetRange = selectionRange || effectRange;
    const effectRangeTarget = event.target?.closest?.('.media-trimmer-custom-selection')
      || event.target?.closest?.('.media-trimmer-custom-handle');
    const effectRangeSelectionId = effectRangeTarget?.dataset?.selectionId || effectRangeTarget?.getAttribute?.('data-selection-id');

    if (effectRange && effectRangeSelectionId === 'effect-range') {
      event.preventDefault();
      event.stopPropagation();
      openEffectRangeContextMenu(effectRange, event.clientX, event.clientY);
      return;
    }

    if (targetRange || event.target?.closest('.media-trimmer-body, .media-trimmer-ruler, .media-trimmer-effects-track')) {
      event.preventDefault();
      event.stopPropagation();
      
      const contextItems = [];
      
      if (targetRange) {
        contextItems.push(
          {
            id: 'play-selection',
            label: 'Play Selection',
            onSelect() {
              playPreview(targetRange.start);
            }
          },
          {
            id: 'play-selection-end',
            label: 'Play From Selection End',
            onSelect() {
              playPreview(targetRange.end);
            }
          },
          {
            id: 'zoom-to-selection',
            label: 'Zoom to Selection',
            onSelect() {
              centerTrimmerViewportOnRange(targetRange.start, targetRange.end);
            }
          },
          {
            id: 'set-trim-start-to-selection',
            label: 'Set Trim Start to Selection',
            onSelect() {
              setTrimRangeTo(targetRange.start, eVal, { zoom: true });
            }
          },
          {
            id: 'set-trim-end-to-selection',
            label: 'Set Trim End to Selection',
            onSelect() {
              setTrimRangeTo(sVal, targetRange.end, { zoom: true });
            }
          },
          {
            id: 'noise-from-selection',
            label: 'Convert to Noise Profile',
            onSelect() {
              convertRangeToNoiseProfile(targetRange, selectionRange ? 'selection' : 'effect-range');
            }
          },
          {
            id: 'delete-selected-audio',
            label: 'Delete Selected Part',
            danger: true,
            onSelect() {
              deleteSelectedAudioRange();
            }
          },
          {
            id: 'copy-active-effect-to-selection',
            label: activeEffectId ? 'Copy Active Effect Here' : 'No Active Effect to Copy',
            disabled: !activeEffectId,
            onSelect() {
              duplicateActiveEffectToRange(targetRange);
            }
          },
          { separator: true }
        );
      }

      if (effectRange) {
        contextItems.push({
          id: 'apply-effect',
          label: 'Apply Effect...',
          onSelect() {
            openEffectPalette();
          }
        });
      }

      if (targetRange) {
        contextItems.push({
          id: 'clear-selection',
          label: 'Clear Selection',
          onSelect() {
            soundTrimmer.clearSelectionRange(selectionRange ? 'selection' : 'effect-range', true);
          }
        });
      }

      if (contextItems.length === 0 || !targetRange) {
        openGenericTrimmerContextMenu(getTrimmerContextTime(event), event.clientX, event.clientY);
        return;
      }

      studioContextMenu?.open({
        x: event.clientX,
        y: event.clientY,
        items: contextItems
      });
    }
  };
  soundTrimmer.root.addEventListener('contextmenu', handleTrimmerContextMenu);
  destroyTrimmerSessionUi = () => {
    effectPaletteModalController.destroy();
    soundTrimmer?.root?.removeEventListener?.('contextmenu', handleTrimmerContextMenu);
  };
  syncTrimOptionAvailability();
  refreshTrimmerWaveform();
  effectFadeInput.value = String(effectSettings.fadeCurve);
  effectNormalizeInput.value = String(Math.round(effectSettings.normalizeDb));
  effectFilterInput.value = String(Math.round(effectSettings.filterCutoffHz));
  effectEchoDelayInput.value = String(Math.round(effectSettings.echoDelayMs));
  effectEchoDecayInput.value = String(Math.round(effectSettings.echoDecay * 100));
  if (effectShiftInput) effectShiftInput.value = String(Math.round(effectSettings.shiftSemitones));
  syncEffectControlReadouts();
  renderVolumeEnvelope();
  renderClipEffects();
  renderEffectSelectionState();
  syncSelectionButtons();

  const updatePlayhead = () => {
    if (!currentPreviewAudio || currentPreviewAudio.paused) {
      soundTrimmer?.clearPlayhead();
      soundTrimmer?.setPlaying(false);
      return;
    }
    const current = getSourceTimeFromPreviewOffset(currentPreviewAudio.currentTime);
    if (current >= eVal) {
      if (lastLoopState) {
        playPreview(sVal);
      } else {
        stopPreview();
        soundTrimmer?.emitEnded();
      }
      return;
    }
    soundTrimmer?.setPlayhead(current);
    tickerAnimationId = requestAnimationFrame(updatePlayhead);
  };

  let currentPreviewUrl = '';
  let currentPreviewMetadataHandler = null;

  const releasePreviewAudio = (audio = currentPreviewAudio, { preserveVisualState = false } = {}) => {
    const targetAudio = audio || currentPreviewAudio;
    if (currentPreviewMetadataHandler && typeof targetAudio?.removeEventListener === 'function') {
      targetAudio.removeEventListener('loadedmetadata', currentPreviewMetadataHandler);
    }
    currentPreviewMetadataHandler = null;
    if (targetAudio) {
      targetAudio.onplay = null;
      targetAudio.onpause = null;
      targetAudio.onended = null;
      try {
        targetAudio.pause();
      } catch {}
      try {
        if (typeof targetAudio.removeAttribute === 'function') targetAudio.removeAttribute('src');
        if ('src' in targetAudio) targetAudio.src = '';
      } catch {}
      try {
        targetAudio.currentTime = 0;
      } catch {}
      try {
        targetAudio.load?.();
      } catch {}
    }
    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
      currentPreviewUrl = '';
    }
    if (!preserveVisualState) {
      soundTrimmer?.clearPlayhead();
      soundTrimmer?.setPlaying(false);
    }
    currentPreviewAudio = null;
  };

  const stopPreview = () => {
    previewRequestToken += 1;
    cancelPendingRestart();
    cancelLivePreviewRefresh();
    setTrimmerBusy('preview', false);
    releasePreviewAudio();
    currentPreviewRangeStart = sVal;
    if (tickerAnimationId && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(tickerAnimationId);
  };

  const playPreview = async (sourceTime = sVal) => {
    cancelPendingRestart();
    const requestToken = ++previewRequestToken;
    const clampedSourceTime = clampPreviewSourceTime(sourceTime);
    const renderRangeStart = sVal;
    currentPreviewRate = getTrimPreviewRate();
    const previewOffset = getPreviewOffsetForSourceTime(clampedSourceTime, currentPreviewRate, renderRangeStart);
    releasePreviewAudio(null, { preserveVisualState: true });
    if (tickerAnimationId && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(tickerAnimationId);
    setTrimmerBusy('preview', true);
    
    let pb;
    try {
      pb = await getPreviewRenderJob();
    } catch (err) {
      if (requestToken === previewRequestToken) setTrimmerBusy('preview', false);
      return;
    }

    if (requestToken !== previewRequestToken) {
      setTrimmerBusy('preview', false);
      return;
    }

    currentPreviewRangeStart = renderRangeStart;
    const url = URL.createObjectURL(pb);
    const previewAudio = new Audio(url);
    previewAudio.loop = !!lastLoopState;
    
    // Guard against another preview starting while we were creating the Audio element
    if (requestToken !== previewRequestToken) {
      URL.revokeObjectURL(url);
      return;
    }
    
    currentPreviewAudio = previewAudio;
    currentPreviewUrl = url;
    
    previewAudio.onplay = () => {
      if (currentPreviewAudio !== previewAudio || requestToken !== previewRequestToken) {
        previewAudio.pause();
        return;
      }
      setTrimmerBusy('preview', false);
      soundTrimmer?.setPlaying(true);
      updatePlayhead();
    };
    previewAudio.onpause = () => {
      if (currentPreviewAudio !== previewAudio || requestToken !== previewRequestToken) return;
      setTrimmerBusy('preview', false);
      soundTrimmer?.clearPlayhead();
      soundTrimmer?.setPlaying(false);
      if (currentPreviewAudio === previewAudio) {
        currentPreviewAudio = null;
        currentPreviewMetadataHandler = null;
        if (currentPreviewUrl === url) currentPreviewUrl = '';
      }
      URL.revokeObjectURL(url);
    };
    previewAudio.onended = () => {
      if (currentPreviewAudio !== previewAudio || requestToken !== previewRequestToken) return;
      currentPreviewAudio = null;
      currentPreviewMetadataHandler = null;
      if (currentPreviewUrl === url) currentPreviewUrl = '';
      URL.revokeObjectURL(url);
      setTrimmerBusy('preview', false);
      soundTrimmer?.clearPlayhead();
      soundTrimmer?.setPlaying(false);
      soundTrimmer?.emitEnded();
    };
    currentPreviewMetadataHandler = () => {
      if (currentPreviewAudio !== previewAudio || requestToken !== previewRequestToken) {
        previewAudio.pause();
        return;
      }
      previewAudio.currentTime = Math.min(previewOffset, Math.max(0, previewAudio.duration - 0.01));
      previewAudio.play().catch(() => {});
    };
    if (previewOffset > 0) previewAudio.addEventListener('loadedmetadata', currentPreviewMetadataHandler, { once: true });
    else previewAudio.play().catch(() => {});
  };
  const restart = async () => {
    if (!currentPreviewAudio || currentPreviewAudio.paused) return;
    const resumeSourceTime = getSourceTimeFromPreviewOffset(currentPreviewAudio.currentTime);
    await playPreview(resumeSourceTime);
  };
  let restartDebounceTimer = null;
  let livePreviewRefreshTimer = null;
  const cancelPendingRestart = () => {
    if (!restartDebounceTimer) return;
    clearTimeout(restartDebounceTimer);
    restartDebounceTimer = null;
  };
  const cancelLivePreviewRefresh = () => {
    if (!livePreviewRefreshTimer) return;
    clearTimeout(livePreviewRefreshTimer);
    livePreviewRefreshTimer = null;
  };
  const scheduleLivePreviewRefresh = () => {
    if (!currentPreviewAudio || currentPreviewAudio.paused) return;
    if (livePreviewRefreshTimer) return;
    livePreviewRefreshTimer = setTimeout(() => {
      livePreviewRefreshTimer = null;
      restart();
    }, 120);
  };
  const debouncedRestart = () => {
    cancelPendingRestart();
    if (!currentPreviewAudio || currentPreviewAudio.paused) return;
    restartDebounceTimer = setTimeout(() => {
      restartDebounceTimer = null;
      restart();
    }, 1000);
  };
  previewController = { play: playPreview, stop: stopPreview };

  noiseButton.onclick = () => {
    setActiveSelection(activeSelectionMode === 'noise-profile' ? 'effect-range' : 'noise-profile');
  };
  effectRangeButton.onclick = () => {
    setActiveSelection('effect-range');
  };
  clearEffectRangeButton.onclick = () => {
    soundTrimmer?.clearSelection('effect-range');
    setActiveSelection('effect-range');
    renderEffectSelectionState();
  };
  if (deleteSelectionButton) {
    deleteSelectionButton.onclick = () => {
      deleteSelectedAudioRange();
    };
  }
  container.querySelector('#btn-effect-silence').onclick = () => {
    applySelectedEffect(buildEffectPayload('silence'));
  };
  container.querySelector('#btn-effect-fade-in').onclick = () => {
    applySelectedEffect(buildEffectPayload('fade-in'));
  };
  container.querySelector('#btn-effect-fade-out').onclick = () => {
    applySelectedEffect(buildEffectPayload('fade-out'));
  };
  container.querySelector('#btn-effect-normalize').onclick = () => {
    applySelectedEffect(buildEffectPayload('normalize'));
  };
  container.querySelector('#btn-effect-reverse').onclick = () => {
    applySelectedEffect(buildEffectPayload('reverse'));
  };
  container.querySelector('#btn-effect-low-pass').onclick = () => {
    applySelectedEffect(buildEffectPayload('low-pass'));
  };
  container.querySelector('#btn-effect-high-pass').onclick = () => {
    applySelectedEffect(buildEffectPayload('high-pass'));
  };
  container.querySelector('#btn-effect-band-pass').onclick = () => {
    applySelectedEffect(buildEffectPayload('band-pass'));
  };
  container.querySelector('#btn-effect-notch').onclick = () => {
    applySelectedEffect(buildEffectPayload('notch'));
  };
  container.querySelector('#btn-effect-talkback').onclick = () => {
    applySelectedEffect(buildEffectPayload('telephone'));
  };
  container.querySelector('#btn-effect-vocal-remove').onclick = () => {
    applySelectedEffect(buildEffectPayload('vocal-remove'));
  };
  container.querySelector('#btn-effect-de-esser').onclick = () => {
    applySelectedEffect(buildEffectPayload('de-esser'));
  };
  container.querySelector('#btn-effect-radio').onclick = () => {
    applySelectedEffect(buildEffectPayload('radio'));
  };
  container.querySelector('#btn-effect-bass-cut').onclick = () => {
    applySelectedEffect(buildEffectPayload('bass-cut'));
  };
  container.querySelector('#btn-effect-noise-gate').onclick = () => {
    applySelectedEffect(buildEffectPayload('noise-gate'));
  };
  container.querySelector('#btn-effect-reverb').onclick = () => {
    applySelectedEffect(buildEffectPayload('reverb'));
  };
  container.querySelector('#btn-effect-compression').onclick = () => {
    applySelectedEffect(buildEffectPayload('compression'));
  };
  container.querySelector('#btn-effect-saturation').onclick = () => {
    applySelectedEffect(buildEffectPayload('saturation'));
  };
  container.querySelector('#btn-effect-formant-shift').onclick = () => {
    applySelectedEffect(buildEffectPayload('formant-shift'));
  };
  container.querySelector('#btn-effect-pitch-shift').onclick = () => {
    applySelectedEffect(buildEffectPayload('pitch-shift'));
  };
  container.querySelector('#btn-effect-echo').onclick = () => {
    applySelectedEffect(buildEffectPayload('echo'));
  };
  updateEffectButton.onclick = () => {
    updateSelectedEffect();
  };
  applyEffectsButton.onclick = async () => {
    await applyEffectsToWorkingClip();
  };
  undoAppliedEffectsButton.onclick = async () => {
    await undoAppliedEffects();
  };
  container.querySelector('#btn-clear-effects').onclick = () => {
    clipEffects = [];
    volumeEnvelope = normalizeVolumeEnvelope([]);
    activeEnvelopePointIndex = null;
    activeEffectId = null;
    hoveredEffectId = null;
    renderVolumeEnvelope();
    renderClipEffects();
    debouncedRestart();
    scheduleProcessedWaveformRefresh();
  };
  resetVolumeEnvelopeButton.onclick = () => {
    volumeEnvelope = normalizeVolumeEnvelope([]);
    activeEnvelopePointIndex = null;
    renderVolumeEnvelope();
    syncEffectBatchButtons();
    debouncedRestart();
    scheduleProcessedWaveformRefresh();
  };

  container.querySelector('#btn-trim-reset').onclick = () => {
    spIn.value = 1.0;
    piIn.value = 0;
    pgIn.value = 0;
    container.querySelector('#trim-leveler').value = 0;
    container.querySelector('#trim-noise').value = 0;
    ['speed','pitch','postgain','leveler','noise'].forEach(k => container.querySelector('#val-'+k).textContent = (k==='speed'?'1.0':'0'));
    ['speed','pitch','postgain','leveler','noise'].forEach(k => container.querySelector('#trim-'+k+'-toggle').checked = true);
    [spIn, piIn, pgIn, container.querySelector('#trim-leveler'), container.querySelector('#trim-noise')].forEach(el => el.dispatchEvent(new Event('input')));
    workingBuffer = originalBuffer;
    clipEffects = [];
    appliedEffectHistory = [];
    volumeEnvelope = normalizeVolumeEnvelope([]);
    activeEnvelopePointIndex = null;
    soundTrimmer?.clearSelection('effect-range', false);
    soundTrimmer?.clearSelection('noise-profile', false);
    activeEffectId = null;
    hoveredEffectId = null;
    effectSettings.fadeCurve = 1;
    effectSettings.normalizeDb = -1;
    effectSettings.filterCutoffHz = 1200;
    effectSettings.echoDelayMs = 180;
    effectSettings.echoDecay = 0.35;
    effectSettings.shiftSemitones = 3;
    effectSettings.amount = 0.76;
    effectFadeInput.value = '1';
    effectNormalizeInput.value = '-1';
    effectFilterInput.value = '1200';
    effectEchoDelayInput.value = '180';
    effectEchoDecayInput.value = '35';
    if (effectShiftInput) effectShiftInput.value = '3';
    if (effectAmountInput) effectAmountInput.value = '76';
    syncEffectControlReadouts();
    setActiveSelection('effect-range');
    performScan();
    refreshTrimmerWaveform();
    renderVolumeEnvelope();
    renderClipEffects();
    renderEffectSelectionState();
    syncTrimOptionAvailability();
  };

  effectFadeInput.oninput = (event) => {
    effectSettings.fadeCurve = Math.max(0.5, Math.min(3, Number(event.target.value) || 1));
    syncEffectControlReadouts();
  };
  effectNormalizeInput.oninput = (event) => {
    effectSettings.normalizeDb = Math.max(-18, Math.min(0, Number(event.target.value) || -1));
    syncEffectControlReadouts();
  };
  effectFilterInput.oninput = (event) => {
    effectSettings.filterCutoffHz = Math.max(120, Math.min(12000, Number(event.target.value) || 1200));
    syncEffectControlReadouts();
  };
  effectEchoDelayInput.oninput = (event) => {
    effectSettings.echoDelayMs = Math.max(40, Math.min(800, Number(event.target.value) || 180));
    syncEffectControlReadouts();
  };
  effectEchoDecayInput.oninput = (event) => {
    effectSettings.echoDecay = Math.max(0.05, Math.min(0.9, (Number(event.target.value) || 35) / 100));
    syncEffectControlReadouts();
  };
  if (effectShiftInput) {
    effectShiftInput.oninput = (event) => {
      effectSettings.shiftSemitones = Math.max(-12, Math.min(12, Number(event.target.value) || 0));
      syncEffectControlReadouts();
    };
  }
  if (effectAmountInput) {
    effectAmountInput.oninput = (event) => {
      effectSettings.amount = Math.max(0, Math.min(1, (Number(event.target.value) || 0) / 100));
      syncEffectControlReadouts();
    };
  }

  [spIn, piIn, pgIn, container.querySelector('#trim-leveler'), container.querySelector('#trim-noise')].forEach(el => {
    el.oninput = (e) => {
      const key = e.target.id.split('-')[1];
      container.querySelector('#val-'+key).textContent = e.target.value;
      debouncedRestart();
      if (waveformReactiveOptions.has(key)) scheduleProcessedWaveformRefresh();
    };
  });

  ['speed','pitch','postgain','leveler','noise'].forEach(k => {
    container.querySelector('#trim-'+k+'-toggle').onchange = () => {
      syncTrimOptionAvailability();
      debouncedRestart();
      if (waveformReactiveOptions.has(k)) scheduleProcessedWaveformRefresh();
    };
  });

  container.querySelectorAll('.reset-val').forEach(btn => {
    btn.onclick = () => {
      const tid = btn.getAttribute('data-for');
      const el = container.querySelector('#'+tid);
      if (el) {
        el.value = el.getAttribute('value') || (tid === 'trim-speed' ? '1' : '0');
        el.dispatchEvent(new Event('input'));
      }
    };
  });

  container.querySelector('#btn-clear-noise').onclick = () => {
    soundTrimmer?.clearSelection('noise-profile');
    setActiveSelection('effect-range');
    performScan();
    restart();
  };

  container.querySelector('#btn-discard-trim').onclick = () => {
    stopPreview();
    previewController = null;
    editingAssetId = null;
    closeTrimmerArea();
  };

  container.querySelector('#btn-save-trim').onclick = async () => {
    stopPreview();
    const pb = await processBufferWSOLA(workingBuffer, sVal, eVal);
    const buffer = await audioCtx.decodeAudioData(await pb.arrayBuffer());
    const wasEditingAsset = Boolean(editingAssetId);
    
    if (wasEditingAsset) {
      const existingAsset = audioLibrary.find(a => a.id == editingAssetId);
      if (existingAsset) {
        applyMixerState(replaceMixerAsset(getMixerStateSnapshot(), {
          assetId: editingAssetId,
          name: existingAsset.name,
          buffer,
          originalBuffer: existingAsset.originalBuffer || existingAsset.buffer,
          isEdited: true,
          fadeIn: pendingFadeIn,
          fadeOut: pendingFadeOut
        }));
        const firstTrack = studioTracks.find(t => t.assetId == editingAssetId);
        if (firstTrack) {
          analyzeWaveformSamples({
            sampleBuffer: buffer.getChannelData(0).slice(0).buffer,
            sampleRate: buffer.sampleRate,
            cacheKey: `track:${editingAssetId}:${buffer.length}:${buffer.sampleRate}`,
            maxBins: 8192
          }).then(waveform => {
            applyMixerState(setMixerAssetWaveform(getMixerStateSnapshot(), editingAssetId, waveform));
            syncStudioMixerSurface();
          }).catch(() => {});
        }
      }
    } else {
      const asset = {
        id: Date.now() + Math.random(),
        name: suggestedName || `take_${audioLibrary.length + 1}.wav`,
        buffer,
        originalBuffer: buffer,
        fadeIn: pendingFadeIn,
        fadeOut: pendingFadeOut
      };
      applyMixerState(addMixerAsset(getMixerStateSnapshot(), asset));
      await addTrackToMixer(asset, selectedLaneIndex);
    }
    
    previewController = null;
    editingAssetId = null;
    closeTrimmerArea();
    setStudioStatus(wasEditingAsset ? 'Asset updated' : 'Clip committed to mixer', 'success');
    renderLibrary();
    syncStudioMixerSurface();
    syncStudioSummaryChrome();
    syncLibraryLaneTargetChrome();
    syncStudioTransportChrome();
  };

  async function processBufferWSOLA(buf, s, e, isVis = false) {
    const speed = container.querySelector('#trim-speed-toggle').checked ? parseFloat(spIn.value) : 1.0;
    const pitch = container.querySelector('#trim-pitch-toggle').checked ? parseFloat(piIn.value) : 0;
    const gain = container.querySelector('#trim-postgain-toggle').checked ? Math.pow(10, parseFloat(pgIn.value) / 20) : 1.0;
    const noiseAmount = container.querySelector('#trim-noise-toggle').checked ? parseFloat(container.querySelector('#trim-noise').value) / 100 : 0;
    const levelerAmount = container.querySelector('#trim-leveler-toggle').checked ? parseFloat(container.querySelector('#trim-leveler').value) / 100 : 0;
    const sampleCopy = buf.getChannelData(0).slice(0);
    const transferables = [sampleCopy.buffer];
    let noiseProfileBuffer = null;
    if (noiseProfile instanceof Float32Array && noiseProfile.length) {
      noiseProfileBuffer = noiseProfile.slice(0).buffer;
      transferables.push(noiseProfileBuffer);
    }

    try {
      const response = await globalWorkerPool.run('audio-process', {
        sampleBuffer: sampleCopy.buffer,
        sampleRate: buf.sampleRate,
        start: s,
        end: e,
        speed,
        pitch,
        gain,
        effects: clipEffects,
        volumeEnvelope,
        noiseProfile: noiseProfileBuffer,
        noiseAmount,
        levelerAmount
      }, transferables);
      const wavBuffer = response?.result?.wavBuffer;
      const processedSampleBuffer = response?.result?.sampleBuffer;
      if (isVis && processedSampleBuffer) {
        const processedSamples = new Float32Array(processedSampleBuffer);
        const previewBuffer = audioCtx.createBuffer(1, Math.max(1, processedSamples.length), buf.sampleRate);
        previewBuffer.getChannelData(0).set(processedSamples.subarray(0, previewBuffer.length));
        return previewBuffer;
      }
      if (!wavBuffer) throw new Error('Trim processing returned no WAV buffer.');
      return new Blob([wavBuffer], { type: 'audio/wav' });
    } catch (error) {
      const fallbackSamples = processTrimAudioSamples({
        samples: buf.getChannelData(0),
        sampleRate: buf.sampleRate,
        start: s,
        end: e,
        speed,
        pitch,
        gain,
        effects: clipEffects,
        volumeEnvelope,
        noiseProfile,
        noiseAmount,
        levelerAmount
      });
      if (isVis) {
        const previewBuffer = audioCtx.createBuffer(1, Math.max(1, fallbackSamples.length), buf.sampleRate);
        previewBuffer.getChannelData(0).set(fallbackSamples.subarray(0, previewBuffer.length));
        return previewBuffer;
      }
      return new Blob([samplesToWavBuffer(fallbackSamples, buf.sampleRate)], { type: 'audio/wav' });
    }
  }
}

function renderStudio() {
  if (!container || !container.parentElement) return;
  syncStudioMixerSurface({ syncScale: true });
  syncStudioSummaryChrome();
  syncLibraryLaneTargetChrome();
  syncStudioTransportChrome();
}

function stopStudio() {
  isStudioPlaying = false;
  studioCursorVisible = false;
  playbackService.stop();
  syncStudioTransportChrome();
  syncMixerPlaybackChrome();
}

async function playStudio(startTime = 0) {
  if (isStudioPlaying) stopStudio();
  stopPreview();
  await ensureAudioCtx();
  isStudioPlaying = true;
  studioCurrentPos = startTime;
  studioCursorVisible = true;
  syncStudioTransportChrome();
  syncMixerPlaybackChrome();

  try {
    await playbackService.play({
      audioContext: audioCtx,
      state: getMixerStateSnapshot(),
      startTime,
      onTimeUpdate: (pos) => {
        studioCurrentPos = pos;
        studioCursorVisible = true;
        mixerController?.setPlayhead(studioCurrentPos);
      },
      onEnded: () => {
        if (container.querySelector('#studio-loop').checked) playStudio(0);
        else stopStudio();
      }
    });
  } catch (error) {
    stopStudio();
    throw error;
  }
}

async function exportStudioMix() {
  if (studioTracks.length === 0) return; 
  const btn = container.querySelector('#btn-studio-export');
  const ot = btn.textContent;
  btn.textContent = 'Rendering...'; 
  btn.disabled = true;
  
  try {
    setStudioStatus('Rendering mix', 'neutral', 0);
    const maxD = Math.max(...studioTracks.map(t => t.offset + (t.trimEnd - t.trimStart))), 
          offline = new OfflineAudioContext(2, Math.ceil(maxD * audioCtx.sampleRate), audioCtx.sampleRate);
    
    const hasSolo = studioTracks.some(t => t.soloed) || laneSettings.some(l => l.soloed);
    const lanes = Array.from({ length: studioLanesCount }, () => []);
    
    studioTracks.forEach(t => { 
      const ls = laneSettings[t.laneIndex];
      const isMuted = t.muted || ls.muted;
      const isSoloed = t.soloed || ls.soloed;
      if (!isMuted && (!hasSolo || isSoloed)) lanes[t.laneIndex].push(t); 
    });
    lanes.forEach(l => l.sort((a,b)=>a.offset-b.offset));
    
    for (const t of studioTracks) { 
      const ls = laneSettings[t.laneIndex];
      const isMuted = t.muted || ls.muted;
      const isSoloed = t.soloed || ls.soloed;
      if (isMuted || (hasSolo && !isSoloed)) continue; 
      
      const clipDur = t.trimEnd - t.trimStart;
      const s = offline.createBufferSource(); 
      s.buffer = t.buffer; 
      const g = offline.createGain(); 
      g.gain.value = t.volume; 
      
      buildMixerTrackGainPoints(t, lanes[t.laneIndex], { fromTime: 0 }).forEach((point, index) => {
        if (index === 0) {
          g.gain.setValueAtTime(point.value, t.offset + point.time);
          return;
        }
        g.gain.linearRampToValueAtTime(point.value, t.offset + point.time);
      });
      
      s.connect(g).connect(offline.destination); 
      s.start(t.offset, t.trimStart, clipDur); 
    }
    
    const rendered = await offline.startRendering();
    const wav = audioBufferToWav(rendered);
    const engine = container.querySelector('#rec-engine').value;

    if (engine === 'wav') {
      downloadFile(wav, `studio_mix_${Date.now()}.wav`);
    } else {
      btn.textContent = 'Encoding...';
      setStudioStatus('Encoding export', 'neutral', 0);
      let ext = 'mp4';
      let codec = 'aac';

      if (engine.includes('opus')) {
        ext = 'webm';
        codec = 'libopus';
      } else if (engine.includes('mpeg')) {
        ext = 'mp3';
        codec = 'libmp3lame';
      }

      const outputFileName = `out.${ext}`;
      const result = await runFFmpegJob({
        files: [{ name: 'in.wav', buffer: await wav.arrayBuffer() }],
        command: [
          '-i', 'in.wav',
          '-ar', '44100',
          '-ac', '2',
          '-c:a', codec,
          '-b:a', '192k',
          outputFileName
        ],
        outputFileName
      });
      downloadFile(result.buffer, `studio_mix_${Date.now()}.${ext}`, engine);
    }
    setStudioStatus('Mix exported', 'success');
    showToast('Mix exported.', 'success');
  } catch (err) {
    setStudioStatus(`Export failed: ${err.message}`, 'danger', 4000);
    showToast(`Export failed: ${err.message}`, 'danger');
  } finally {
    btn.textContent = ot;
    btn.disabled = false;
  }
}

function audioBufferToWav(buffer) {
  const channelCount = buffer.numberOfChannels;
  const byteLength = (buffer.length * channelCount * 2) + 44;
  const output = new ArrayBuffer(byteLength);
  const view = new DataView(output);
  const write16 = (data, position) => view.setUint16(position, data, true);
  const write32 = (data, position) => view.setUint32(position, data, true);

  write32(0x46464952, 0);
  write32(byteLength - 8, 4);
  write32(0x45564157, 8);
  write32(0x20746d66, 12);
  write32(16, 16);
  write16(1, 20);
  write16(channelCount, 22);
  write32(buffer.sampleRate, 24);
  write32(buffer.sampleRate * 2 * channelCount, 28);
  write16(channelCount * 2, 32);
  write16(16, 34);
  write32(0x61746164, 36);
  write32(byteLength - 44, 40);

  let offset = 0;
  let position = 44;
  while (position < byteLength) {
    for (let i = 0; i < channelCount; i += 1) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(i)[offset]));
      view.setInt16(position, (sample < 0 ? sample * 0x8000 : sample * 0x7FFF) | 0, true);
      position += 2;
    }
    offset += 1;
  }

  return new Blob([output], { type: 'audio/wav' });
}

function pcmToWav(flat, sampleRate) {
  const buffer = new ArrayBuffer(44 + (flat.length * 2));
  const view = new DataView(buffer);
  const writeString = (offset, value) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + (flat.length * 2), true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, flat.length * 2, true);

  for (let i = 0; i < flat.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, flat[i]));
    view.setInt16(44 + (i * 2), sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export function unmount() {
  mediaControlsCleanup?.();
  mediaControlsCleanup = null;
  if (animationId && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(animationId);
  if (tickerAnimationId && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(tickerAnimationId);
  if (studioInterval) clearInterval(studioInterval);
  if (removeShortcuts) removeShortcuts();
  studioContextMenu?.destroy?.();
  studioContextMenu = null;
  destroyTrimmerSessionUi?.();
  destroyTrimmerSessionUi = null;
  stopPreview();
  previewController = null;
  soundTrimmer?.destroy();
  soundTrimmer = null;
  playbackService.stop();
  mixerController?.destroy();
  mixerController = null;
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null;
  sourceNode = null;
  analyzer = null;
  inputGainNode = null;
  compressorNode = null;
  gateNode = null;
  closeAudioContext(audioCtx);
  audioCtx = null;
  mediaRecorder = null;
  pendingRecordStartPromise = null;
  pendingRecordStopRequested = false;
  resetStudioState();
  if (container) {
    container.parentElement?.classList?.remove?.('trimmer-active');
    container.remove();
    container = null;
  }
}

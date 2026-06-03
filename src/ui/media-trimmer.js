import {
  clampTrimRange,
  resolveTrimViewport,
  pickWaveformLevel,
  buildViewportWaveformLevel,
  resolveViewportWaveformPlan,
  buildTimeRulerTicks,
  getViewportWaveformSignature,
  getMinimumViewportDuration,
  getViewportDurationForSlider,
  getSliderValueForViewportDuration,
  getWaveformPeakAmplitude,
  shouldResetPlayheadToRangeStart
} from '../utils/media-trimmer.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value) {
  return Number(Number(value || 0).toFixed(3));
}

function isPrimaryPointerEvent(event) {
  return !Number.isFinite(Number(event?.button)) || Number(event.button) === 0;
}

function getPointerClientX(event) {
  const value = Number(event?.clientX);
  return Number.isFinite(value) ? value : 0;
}

const HANDLE_WIDTH = 12;
const HANDLE_GAP = 4;
const BACKGROUND_DRAG_THRESHOLD = 10;
const EFFECT_ROW_HEIGHT = 22;
const EFFECT_ROW_OFFSET = 4;

function buildSelectionLayers(layers, duration, defaultMinSpan) {
  const entries = new Map();
  for (const layer of Array.isArray(layers) ? layers : []) {
    if (!layer?.id || entries.has(layer.id)) continue;
    const minSpan = Math.max(0.01, Number(layer.minSpan) || defaultMinSpan);
    const hasRange = Number.isFinite(layer.start) && Number.isFinite(layer.end);
    entries.set(layer.id, {
      id: layer.id,
      tone: layer.tone || 'accent',
      minSpan,
      range: hasRange ? clampTrimRange({ start: layer.start, end: layer.end, duration, minSpan }) : null
    });
  }
  return entries;
}

function buildEffects(effects, duration) {
  const entries = [];
  for (const effect of Array.isArray(effects) ? effects : []) {
    if (!effect?.id) continue;
    const range = clampTrimRange({
      start: effect.start,
      end: effect.end,
      duration,
      minSpan: 0.01
    });
    if (!range?.span) continue;
    entries.push({
      id: effect.id,
      tone: effect.tone || 'accent',
      label: String(effect.label || '').trim(),
      removable: !!effect.removable,
      draggable: !!effect.draggable,
      resizable: !!effect.resizable,
      minSpan: Math.max(0.01, Number(effect.minSpan) || 0.01),
      start: range.start,
      end: range.end,
      span: range.span
    });
  }
  return entries;
}

function layoutEffectRows(effects, activeDragEffectId = null, lockedRowIndex = 0) {
  const usedRows = new Set();
  const lockedRow = Math.max(0, Number(lockedRowIndex) || 0);
  if (activeDragEffectId) usedRows.add(lockedRow);
  return effects
    .slice()
    .sort((left, right) => left.start - right.start || left.end - right.end)
    .map((effect, index) => {
      if (effect.id === activeDragEffectId) {
        return { ...effect, rowIndex: lockedRow };
      }
      let rowIndex = index;
      while (usedRows.has(rowIndex)) rowIndex += 1;
      usedRows.add(rowIndex);
      return {
        ...effect,
        rowIndex
      };
    });
}

function syncPlaybackToggleChrome(refs, isPlaying, hasPlaybackToggle) {
  if (!hasPlaybackToggle) return;
  refs.playbackToggle.classList.remove('hidden');
  refs.playIcon.classList.toggle('hidden', isPlaying);
  refs.pauseIcon.classList.toggle('hidden', !isPlaying);
}

function syncLoopChrome(refs, isLooping, hasPlaybackToggle) {
  if (!hasPlaybackToggle) return;
  refs.loopContainer.classList.remove('hidden');
  refs.loopToggle.checked = isLooping;
}

function syncSeekAutoplayChrome(refs, isEnabled, isVisible) {
  if (!isVisible) return;
  refs.seekAutoplayContainer.classList.remove('hidden');
  refs.seekAutoplayToggle.checked = isEnabled;
}

function syncPlayheadChrome(refs, x) {
  if (!Number.isFinite(x)) {
    refs.playhead.classList.add('hidden');
    refs.playhead.style.transform = 'translate3d(0px, 0, 0)';
    return;
  }
  refs.playhead.classList.remove('hidden');
  refs.playhead.style.transform = `translate3d(${x}px, 0, 0)`;
}

export function createMediaTrimmer(options) {
  const mount = options?.mount;
  if (!mount) throw new Error('createMediaTrimmer requires a mount element.');
  const hasPlaybackToggle = !!options.onTogglePlayback;
  const hasSeekAutoplayToggle = hasPlaybackToggle && !!options.showSeekAutoplayToggle;
  const includeDefaultSelectionLayer = options.includeDefaultSelectionLayer !== false;

  const idPrefix = options.idPrefix || 'media';
  const root = document.createElement('section');
  root.className = 'media-trimmer';
  root.innerHTML = `
    <div class="media-trimmer-head">
      <div class="media-trimmer-controls">
        <button type="button" class="media-trimmer-playback hidden" data-role="playback-toggle" aria-label="Toggle playback">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" data-role="play-icon"><path d="M8 5.14v14l11-7-11-7z"/></svg>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" class="hidden" data-role="pause-icon"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        </button>
        <div class="media-trimmer-loop-shell hidden" data-role="loop-container">
          <label class="rj-switch">
            <input type="checkbox" data-role="loop-toggle">
            <span class="slider-switch"></span>
          </label>
          <span class="media-trimmer-loop-label">Loop</span>
        </div>
        <div class="media-trimmer-loop-shell hidden" data-role="seek-autoplay-container">
          <label class="rj-switch">
            <input type="checkbox" data-role="seek-autoplay-toggle">
            <span class="slider-switch"></span>
          </label>
          <span class="media-trimmer-loop-label">Autoplay</span>
        </div>
      </div>
      <div class="media-trimmer-zoom">
        <label for="${idPrefix}-trimmer-zoom">Zoom</label>
        <input type="range" min="0" max="100" step="1" value="0" id="${idPrefix}-trimmer-zoom">
        <span data-role="zoom-label">Full</span>
        <button type="button" class="mini-btn media-trimmer-zoom-selection" data-role="zoom-selection">Fit Trimmed Area</button>
      </div>
      <div class="media-trimmer-readout">
          <div class="media-trimmer-inputs">
            <input type="number" step="0.1" min="0" data-role="start-input" class="media-trimmer-time-input" aria-label="Start time">
            <span class="media-trimmer-separator">/</span>
            <input type="number" step="0.1" min="0" data-role="end-input" class="media-trimmer-time-input" aria-label="End time">
          </div>
          <span data-role="summary">0.0s selected</span>
      </div>
    </div>
    <div class="media-trimmer-frame">
      <div class="media-trimmer-loading hidden" data-role="loading">
        <div class="media-trimmer-loading-copy">
          <strong data-role="loading-title">Preparing waveform</strong>
          <span data-role="loading-detail">Analyzing local media…</span>
        </div>
        <div class="media-trimmer-loading-meter">
          <div data-role="loading-bar"></div>
        </div>
      </div>
      <div class="media-trimmer-scroll" data-role="scroll">
        <div class="media-trimmer-timeline" data-role="timeline">
          <canvas class="media-trimmer-ruler" data-role="ruler"></canvas>
          <div class="media-trimmer-body">
            <div class="media-trimmer-base"></div>
            <canvas class="media-trimmer-waveform hidden" data-role="waveform"></canvas>
            <div class="media-trimmer-filmstrip hidden" data-role="filmstrip"></div>
            <div class="media-trimmer-mask media-trimmer-mask-start" data-role="mask-start"></div>
            <div class="media-trimmer-mask media-trimmer-mask-end" data-role="mask-end"></div>
            <div class="media-trimmer-selection" data-role="selection"></div>
            <button type="button" class="media-trimmer-handle media-trimmer-handle-start" data-role="handle-start" aria-label="Adjust trim start"></button>
            <button type="button" class="media-trimmer-handle media-trimmer-handle-end" data-role="handle-end" aria-label="Adjust trim end"></button>
            <button type="button" class="media-trimmer-fade media-trimmer-fade-in hidden" data-role="fade-in" aria-label="Adjust fade in"></button>
            <button type="button" class="media-trimmer-fade media-trimmer-fade-out hidden" data-role="fade-out" aria-label="Adjust fade out"></button>
            <div class="media-trimmer-custom-selections" data-role="custom-selections"></div>
            <div class="media-trimmer-playhead hidden" data-role="playhead"></div>
            <div class="media-trimmer-overlay" data-role="overlay"></div>
          </div>
          <div class="media-trimmer-effects-track hidden" data-role="effects-track">
            <div class="media-trimmer-effects" data-role="effects"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  if (typeof mount.replaceChildren === 'function') {
    mount.replaceChildren(root);
  } else {
    mount.innerHTML = '';
    mount.appendChild(root);
  }

  const refs = {
    playbackToggle: root.querySelector('[data-role="playback-toggle"]'),
    playIcon: root.querySelector('[data-role="play-icon"]'),
    pauseIcon: root.querySelector('[data-role="pause-icon"]'),
    loopContainer: root.querySelector('[data-role="loop-container"]'),
    loopToggle: root.querySelector('[data-role="loop-toggle"]'),
    seekAutoplayContainer: root.querySelector('[data-role="seek-autoplay-container"]'),
    seekAutoplayToggle: root.querySelector('[data-role="seek-autoplay-toggle"]'),
    startInput: root.querySelector('[data-role="start-input"]'),
    endInput: root.querySelector('[data-role="end-input"]'),
    summary: root.querySelector('[data-role="summary"]'),
    zoom: root.querySelector('input[type="range"]'),
    zoomSelection: root.querySelector('[data-role="zoom-selection"]'),
    zoomLabel: root.querySelector('[data-role="zoom-label"]'),
    scroll: root.querySelector('[data-role="scroll"]'),
    timeline: root.querySelector('[data-role="timeline"]'),
    body: root.querySelector('.media-trimmer-body'),
    ruler: root.querySelector('[data-role="ruler"]'),
    waveform: root.querySelector('[data-role="waveform"]'),
    filmstrip: root.querySelector('[data-role="filmstrip"]'),
    maskStart: root.querySelector('[data-role="mask-start"]'),
    maskEnd: root.querySelector('[data-role="mask-end"]'),
    selection: root.querySelector('[data-role="selection"]'),
    effectsTrack: root.querySelector('[data-role="effects-track"]'),
    effects: root.querySelector('[data-role="effects"]'),
    handleStart: root.querySelector('[data-role="handle-start"]'),
    handleEnd: root.querySelector('[data-role="handle-end"]'),
    fadeIn: root.querySelector('[data-role="fade-in"]'),
    fadeOut: root.querySelector('[data-role="fade-out"]'),
    customSelections: root.querySelector('[data-role="custom-selections"]'),
    playhead: root.querySelector('[data-role="playhead"]'),
    overlay: root.querySelector('[data-role="overlay"]'),
    loading: root.querySelector('[data-role="loading"]'),
    loadingTitle: root.querySelector('[data-role="loading-title"]'),
    loadingDetail: root.querySelector('[data-role="loading-detail"]'),
    loadingBar: root.querySelector('[data-role="loading-bar"]')
  };

  const state = {
    duration: Math.max(0.1, Number(options.duration) || 0.1),
    minSpan: Math.max(0.01, Number(options.minSpan) || 0.1),
    minimumViewportDuration: getMinimumViewportDuration(
      Math.max(0.1, Number(options.duration) || 0.1),
      options.minimumViewportDuration || 3
    ),
    viewportDuration: Math.max(0.1, Number(options.duration) || 0.1),
    sliderValue: 0,
    playhead: Number.isFinite(Number(options.playhead)) ? clamp(Number(options.playhead), 0, Math.max(0.1, Number(options.duration) || 0.1)) : null,
    isPlaying: !!options.isPlaying,
    isLooping: !!options.isLooping,
    isSeekAutoplayEnabled: !!options.seekAutoplayEnabled,
    fadeIn: Number(options.fadeIn) || 0,
    fadeOut: Number(options.fadeOut) || 0,
    showFades: !!options.showFades,
    viewport: { start: 0, end: 0, span: 0 },
    waveform: null,
    samples: options.samples || null,
    viewportWaveform: null,
    viewportWaveformSignature: '',
    pendingViewportWaveformSignature: '',
    sampleRate: Number(options.sampleRate) || 0,
    frameStrip: [],
    effects: buildEffects(options.effects, Math.max(0.1, Number(options.duration) || 0.1)),
    activeEffectId: null,
    loading: { visible: false, title: 'Preparing waveform', detail: 'Analyzing local media…', progress: null }
  };
  state.viewportDuration = getViewportDurationForSlider(
    state.duration,
    getSliderValueForViewportDuration(
      state.duration,
      state.duration / Math.max(1, Number(options.zoom) || 1),
      state.minimumViewportDuration
    ),
    state.minimumViewportDuration
  );
  state.sliderValue = getSliderValueForViewportDuration(state.duration, state.viewportDuration, state.minimumViewportDuration);
  state.range = clampTrimRange({
    start: options.start ?? 0,
    end: options.end ?? state.duration,
    duration: state.duration,
    minSpan: state.minSpan
  });
  state.selectionLayers = buildSelectionLayers(options.selectionLayers, state.duration, state.minSpan);
  if (includeDefaultSelectionLayer && !state.selectionLayers.has('selection')) {
    state.selectionLayers.set('selection', {
      id: 'selection',
      tone: 'accent',
      minSpan: state.minSpan,
      range: null
    });
  }
  state.activeSelectionId = state.selectionLayers.has(options.activeSelectionId) ? options.activeSelectionId : null;

  let drawFrame = 0;
  let viewportWaveformTimer = 0;
  let dragState = null;
  let suppressAutoViewport = false;
  let playheadResetTimer = 0;
  let lastPlayheadResetAt = Number.NEGATIVE_INFINITY;
  const selectionNodes = new Map();
  const effectNodes = new Map();
  const getMeasuredWidth = () => (
    refs.scroll.clientWidth ||
    refs.scroll.offsetWidth ||
    refs.timeline.getBoundingClientRect?.().width ||
    refs.body.getBoundingClientRect?.().width ||
    root.getBoundingClientRect?.().width ||
    720
  );

  const getBaseWidth = () => {
    if (dragState?.baseWidth) return dragState.baseWidth;
    return getMeasuredWidth();
  };
  const getZoomRatio = () => Math.max(1, state.duration / Math.max(0.001, state.viewportDuration));
  const getTimelineWidth = () => {
    const base = getBaseWidth();
    return Math.max(base, Math.round(base * getZoomRatio()));
  };
  const getVisibleWidth = () => {
    if (dragState?.baseWidth) return dragState.baseWidth;
    return getMeasuredWidth();
  };
  const getViewportFromScroll = () => {
    const timelineWidth = getTimelineWidth();
    const visibleWidth = getVisibleWidth();
    const maxScroll = Math.max(1, timelineWidth - visibleWidth);
    const start = (refs.scroll.scrollLeft / maxScroll) * Math.max(0, state.duration - state.viewportDuration);
    const span = state.viewportDuration;
    return {
      start: round(start),
      end: round(Math.min(state.duration, start + span)),
      span: round(span)
    };
  };
  const timeToX = (time) => (clamp(time, 0, state.duration) / state.duration) * getTimelineWidth();
  const eventToTime = (event) => {
    const rect = refs.timeline.getBoundingClientRect();
    const totalWidth = dragState?.timelineWidth || getTimelineWidth();
    const left = dragState?.timelineLeft ?? rect.left;
    if (totalWidth <= 0) return 0;
    const x = clamp(getPointerClientX(event) - left, 0, totalWidth);
    return round((x / totalWidth) * state.duration);
  };
  const getSelectionLayer = (selectionId) => (selectionId ? state.selectionLayers.get(selectionId) || null : null);
  const getSelectionRange = (selectionId) => selectionId ? getSelectionLayer(selectionId)?.range || null : state.range;
  const getEffect = (effectId) => state.effects.find((effect) => effect.id === effectId) || null;
  const clampSelectionRange = (selectionId, start, end) => {
    const minSpan = getSelectionLayer(selectionId)?.minSpan || state.minSpan;
    return clampTrimRange({ start, end, duration: state.duration, minSpan });
  };
  const hasSelectionLayer = (selectionId) => !!selectionId && state.selectionLayers.has(selectionId);
  const isWithinTrimRange = (time) => Number.isFinite(time) && time >= state.range.start && time <= state.range.end;

  const emitRange = (reason) => {
    options.onChange?.({ ...state.range, reason });
  };

  const emitSelectionChange = (selectionId, reason, cleared = false) => {
    const layer = getSelectionLayer(selectionId);
    if (!layer) return;
    options.onSelectionChange?.(
      layer.range
        ? { id: selectionId, ...layer.range, reason, active: state.activeSelectionId === selectionId }
        : { id: selectionId, reason, active: state.activeSelectionId === selectionId, cleared }
    );
  };

  const emitEffectChange = (effectId, reason) => {
    const effect = getEffect(effectId);
    if (!effect) return;
    options.onEffectChange?.({
      id: effect.id,
      start: effect.start,
      end: effect.end,
      reason
    });
  };

  const emitCaret = (reason, extra = {}) => {
    if (state.playhead === null) return;
    const payload = {
      time: state.playhead,
      reason,
      isPlaying: state.isPlaying,
      isSeekAutoplayEnabled: state.isSeekAutoplayEnabled,
      ...extra
    };
    options.onPlayheadChange?.(payload);
    if (reason === 'ruler-click') options.onRulerSeek?.(payload);
    if (reason === 'play') options.onPlay?.(payload);
    if (reason === 'pause') options.onPause?.(payload);
    if (reason === 'ended') options.onEnded?.(payload);
  };

  const clearPlayheadReset = () => {
    if (!playheadResetTimer) return;
    clearTimeout(playheadResetTimer);
    playheadResetTimer = 0;
  };

  const commitPlayheadReset = (reason) => {
    clearPlayheadReset();
    if (state.playhead === null) return;
    lastPlayheadResetAt = Date.now();
    state.playhead = state.range.start;
    render({ preserveViewport: true });
    emitCaret(reason);

    // Resume playing from the reset point if we were already playing
    if (state.isPlaying) {
      options.onTogglePlayback?.({ isPlaying: true, time: state.playhead });
    }
  };

  const syncPlayheadToRange = (reason = 'range-reset') => {
    if (state.playhead === null) {
      clearPlayheadReset();
      return;
    }
    if (!shouldResetPlayheadToRangeStart({
      playhead: state.playhead,
      rangeStart: state.range.start,
      rangeEnd: state.range.end,
      now: Date.now(),
      lastResetAt: lastPlayheadResetAt
    })) {
      clearPlayheadReset();
      return;
    }
    if (playheadResetTimer) return;
    playheadResetTimer = window.setTimeout(() => {
      if (!shouldResetPlayheadToRangeStart({
        playhead: state.playhead,
        rangeStart: state.range.start,
        rangeEnd: state.range.end,
        now: Date.now(),
        lastResetAt: lastPlayheadResetAt
      })) {
        clearPlayheadReset();
        return;
      }
      if (state.isPlaying) {
        options.onTogglePlayback?.({ isPlaying: true, time: state.range.start });
      }
      commitPlayheadReset(reason);
    }, 120);
  };

  const scheduleDraw = () => {
    if (drawFrame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(drawFrame);
    if (typeof requestAnimationFrame !== 'function') {
      drawFrame = 0;
      drawWaveform();
      drawRuler();
      return;
    }
    drawFrame = requestAnimationFrame(() => {
      drawFrame = 0;
      drawWaveform();
      drawRuler();
    });
  };

  const clearViewportWaveformTimer = () => {
    if (!viewportWaveformTimer) return;
    clearTimeout(viewportWaveformTimer);
    viewportWaveformTimer = 0;
  };

  const resetViewportWaveform = () => {
    clearViewportWaveformTimer();
    state.viewportWaveform = null;
    state.viewportWaveformSignature = '';
    state.pendingViewportWaveformSignature = '';
  };

  const getWaveformSampleRate = () => Math.max(1, Math.round(
    Number(state.waveform?.sampleRate) ||
    Number(state.sampleRate) ||
    12000
  ));

  const scheduleViewportWaveform = (viewport, width) => {
    if (!state.samples?.length || !viewport?.span || !width) return '';
    const sampleRate = getWaveformSampleRate();
    const plan = resolveViewportWaveformPlan({
      waveform: state.waveform,
      samples: state.samples,
      sampleRate,
      viewportStart: viewport.start,
      viewportEnd: viewport.end,
      width,
      includeViewportLevel: false
    });
    if (!plan.needsViewportDetail) return '';
    const signature = getViewportWaveformSignature({
      viewportStart: viewport.start,
      viewportEnd: viewport.end,
      width,
      sampleRate,
      sampleLength: state.samples.length
    });
    if (state.viewportWaveformSignature === signature || state.pendingViewportWaveformSignature === signature) return signature;
    clearViewportWaveformTimer();
    state.pendingViewportWaveformSignature = signature;
    viewportWaveformTimer = setTimeout(() => {
      viewportWaveformTimer = 0;
      const level = buildViewportWaveformLevel({
        waveform: state.waveform,
        samples: state.samples,
        sampleRate,
        viewportStart: viewport.start,
        viewportEnd: viewport.end,
        width
      });
      if (state.pendingViewportWaveformSignature !== signature) return;
      state.viewportWaveform = level;
      state.viewportWaveformSignature = signature;
      state.pendingViewportWaveformSignature = '';
      scheduleDraw();
    }, 0);
    return signature;
  };

  const updateSelectionRange = (selectionId, start, end, emit = true, preserveViewport = false, reason = 'selection') => {
    if (!selectionId) {
      state.range = clampSelectionRange(null, start, end);
      syncPlayheadToRange('range-reset');
      render({ preserveViewport });
      if (emit) emitRange(reason);
      return;
    }
    const layer = getSelectionLayer(selectionId);
    if (!layer) return;
    layer.range = clampSelectionRange(selectionId, start, end);
    render({ preserveViewport });
    if (emit) emitSelectionChange(selectionId, reason);
  };

  const clearSelectionRange = (selectionId, emit = true, reason = 'clear') => {
    const layer = getSelectionLayer(selectionId);
    if (!layer) return;
    layer.range = null;
    render({ preserveViewport: true });
    if (emit) emitSelectionChange(selectionId, reason, true);
  };

  const moveEffectRange = (effectId, start, end, reason = 'move') => {
    const effect = getEffect(effectId);
    if (!effect) return;
    const next = clampTrimRange({
      start,
      end,
      duration: state.duration,
      minSpan: Math.max(0.01, effect.minSpan || effect.span || (effect.end - effect.start) || 0.01)
    });
    effect.start = next.start;
    effect.end = next.end;
    effect.span = next.span;
    render({ preserveViewport: true });
    if (reason) emitEffectChange(effectId, reason);
  };

  const resizeEffectRange = (effectId, edge, time, reason = 'resize') => {
    const effect = getEffect(effectId);
    if (!effect) return;
    const next = clampTrimRange({
      start: edge === 'start' ? time : effect.start,
      end: edge === 'end' ? time : effect.end,
      duration: state.duration,
      minSpan: Math.max(0.01, effect.minSpan || effect.span || (effect.end - effect.start) || 0.01)
    });
    effect.start = next.start;
    effect.end = next.end;
    effect.span = next.span;
    render({ preserveViewport: true });
    if (reason) emitEffectChange(effectId, reason);
  };

  state.selectionLayers.forEach((layer, selectionId) => {
    const selection = document.createElement('div');
    selection.className = `media-trimmer-custom-selection media-trimmer-custom-selection-${layer.tone} hidden`;
    selection.dataset.selectionId = selectionId;
    const handleStart = document.createElement('button');
    handleStart.type = 'button';
    handleStart.className = `media-trimmer-handle media-trimmer-custom-handle media-trimmer-custom-handle-${layer.tone} hidden`;
    handleStart.dataset.selectionId = selectionId;
    const handleEnd = document.createElement('button');
    handleEnd.type = 'button';
    handleEnd.className = `media-trimmer-handle media-trimmer-custom-handle media-trimmer-custom-handle-${layer.tone} hidden`;
    handleEnd.dataset.selectionId = selectionId;
    refs.customSelections.appendChild(selection);
    refs.customSelections.appendChild(handleStart);
    refs.customSelections.appendChild(handleEnd);
    selectionNodes.set(selectionId, { selection, handleStart, handleEnd });
  });

  const syncViewport = () => {
    if (suppressAutoViewport) return;
    const viewport = resolveTrimViewport({
      duration: state.duration,
      zoom: getZoomRatio(),
      selectionStart: state.playhead ?? state.range.start,
      selectionEnd: state.playhead ?? state.range.end,
      minSpan: state.minSpan
    });
    const maxScroll = Math.max(0, getTimelineWidth() - getVisibleWidth());
    if (maxScroll <= 0) {
      refs.scroll.scrollLeft = 0;
      state.viewport = getViewportFromScroll();
      return;
    }
    const denominator = Math.max(0.001, state.duration - viewport.span);
    refs.scroll.scrollLeft = maxScroll * (viewport.start / denominator);
    state.viewport = getViewportFromScroll();
  };

  function zoomToRange(startTime, endTime = startTime, emit = true) {
    const normalizedRange = clampTrimRange({
      start: Math.min(Number(startTime) || 0, Number(endTime) || Number(startTime) || 0),
      end: Math.max(Number(startTime) || 0, Number(endTime) || Number(startTime) || 0),
      duration: state.duration,
      minSpan: state.minSpan
    });
    const rangeStart = normalizedRange.start;
    const rangeEnd = normalizedRange.end;
    const paddedSpan = clamp(Math.max(state.minimumViewportDuration, (rangeEnd - rangeStart) * 1.6), state.minimumViewportDuration, state.duration);
    const centerTime = clamp((rangeStart + rangeEnd) / 2, 0, state.duration);
    state.viewportDuration = paddedSpan;
    state.sliderValue = getSliderValueForViewportDuration(state.duration, state.viewportDuration, state.minimumViewportDuration);
    render({ preserveViewport: true });
    const maxScroll = Math.max(0, getTimelineWidth() - getVisibleWidth());
    if (maxScroll > 0) {
      const nextStart = clamp(centerTime - (state.viewportDuration / 2), 0, Math.max(0, state.duration - state.viewportDuration));
      const denominator = Math.max(0.001, state.duration - state.viewportDuration);
      refs.scroll.scrollLeft = maxScroll * (nextStart / denominator);
    } else {
      refs.scroll.scrollLeft = 0;
    }
    state.viewport = getViewportFromScroll();
    scheduleDraw();
    if (emit) options.onZoomChange?.({ ratio: getZoomRatio(), viewportDuration: state.viewportDuration, sliderValue: state.sliderValue });
  }

  function zoomToSelection(emit = true) {
    const range = state.activeSelectionId
      ? getSelectionRange(state.activeSelectionId) || state.range
      : state.range;
    if (!range) return;
    if (range === state.range) {
      zoomToRange(state.range.start, state.range.end, emit);
      return;
    }
    zoomToRange(range.start, range.end, emit);
  }

  const drawWaveform = () => {
    const width = getVisibleWidth();
    const height = refs.body.clientHeight || 96;
    if (!width || !height) return;

    const dpr = globalThis.window?.devicePixelRatio || 1;
    const viewport = state.viewport.span ? state.viewport : getViewportFromScroll();

    refs.waveform.style.left = `${timeToX(viewport.start)}px`;
    refs.waveform.style.top = '0';
    refs.waveform.style.right = 'auto';
    refs.waveform.style.bottom = 'auto';
    refs.waveform.style.width = `${width}px`;
    refs.waveform.style.height = `${height}px`;
    refs.waveform.width = Math.max(1, Math.floor(width * dpr));
    refs.waveform.height = Math.max(1, Math.floor(height * dpr));
    
    const context = refs.waveform.getContext?.('2d');
    if (
      !context ||
      typeof context.setTransform !== 'function' ||
      typeof context.scale !== 'function' ||
      typeof context.clearRect !== 'function'
    ) return;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(dpr, dpr);
    context.clearRect(0, 0, width, height);

    const centerY = height / 2;
    const innerHeight = height * 0.78;
    const background = context.createLinearGradient(0, 0, 0, height);
    background.addColorStop(0, '#07110c');
    background.addColorStop(1, '#040705');
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    // If waveform is missing but we're loading, show a representative "pulse" bar
    if (!state.waveform?.levels?.length && state.loading.visible) {
      refs.waveform.classList.remove('hidden');
      context.fillStyle = 'rgba(85, 255, 177, 0.1)';
      context.fillRect(0, centerY - 8, width, 16);
      context.strokeStyle = 'rgba(85, 255, 177, 0.2)';
      context.setLineDash([4, 4]);
      context.beginPath();
      context.moveTo(0, centerY);
      context.lineTo(width, centerY);
      context.stroke();
      context.setLineDash([]);
      return;
    }

    if (!state.waveform?.levels?.length) return;

    const viewportSignature = scheduleViewportWaveform(viewport, width);
    const viewportLevel = viewportSignature && state.viewportWaveformSignature === viewportSignature
      ? state.viewportWaveform
      : null;
    const level = viewportLevel || pickWaveformLevel(state.waveform, width * 2);
    if (!level?.bins) return;
    context.strokeStyle = 'rgba(77, 255, 166, 0.08)';
    context.lineWidth = 1;
    for (let x = 0; x <= width; x += 24) {
      context.beginPath();
      context.moveTo(x + 0.5, 0);
      context.lineTo(x + 0.5, height);
      context.stroke();
    }
    context.fillStyle = 'rgba(56, 255, 159, 0.18)';
    context.fillRect(0, centerY - 1, width, 2);
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(122, 255, 188, 0.95)');
    gradient.addColorStop(0.5, 'rgba(74, 255, 155, 0.98)');
    gradient.addColorStop(1, 'rgba(27, 197, 100, 0.92)');
    context.fillStyle = gradient;
    const waveformPeak = Math.max(0.0001, Number(state.waveform?.peak) || getWaveformPeakAmplitude(state.waveform));

    for (let x = 0; x < width; x += 1) {
      let sampleMin = 0;
      let sampleMax = 0;

      if (viewportLevel) {
        const bin = Math.max(0, Math.min(level.bins - 1, Math.floor((x / Math.max(1, width)) * level.bins)));
        sampleMin = level.min[bin] || 0;
        sampleMax = level.max[bin] || 0;
      } else {
        const startTime = viewport.start + (x / width) * viewport.span;
        const endTime = viewport.start + ((x + 1) / width) * viewport.span;
        const startBin = Math.max(0, Math.min(level.bins - 1, Math.floor((startTime / state.duration) * level.bins)));
        const endBin = Math.max(startBin + 1, Math.min(level.bins, Math.ceil((endTime / state.duration) * level.bins)));
        for (let index = startBin; index < endBin; index += 1) {
          sampleMin = Math.min(sampleMin, level.min[index] || 0);
          sampleMax = Math.max(sampleMax, level.max[index] || 0);
        }
      }

      const min = Math.min(1, Math.abs(sampleMin) / waveformPeak);
      const max = Math.min(1, Math.abs(sampleMax) / waveformPeak);
      const barTop = centerY - (max * innerHeight * 0.5);
      const barBottom = centerY + (min * innerHeight * 0.5);
      const barHeight = Math.max(1, barBottom - barTop);
      context.fillRect(x, barTop, 1, barHeight);
    }
    context.strokeStyle = 'rgba(111, 255, 185, 0.38)';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, centerY + 0.5);
    context.lineTo(width, centerY + 0.5);
    context.stroke();
  };

  const drawRuler = () => {
    const width = getVisibleWidth();
    const height = refs.ruler.clientHeight || 28;
    const dpr = globalThis.window?.devicePixelRatio || 1;
    const viewport = state.viewport.span ? state.viewport : getViewportFromScroll();
    refs.ruler.style.left = `${timeToX(viewport.start)}px`;
    refs.ruler.style.right = 'auto';
    refs.ruler.style.width = `${width}px`;
    refs.ruler.width = Math.max(1, Math.floor(width * dpr));
    refs.ruler.height = Math.max(1, Math.floor(height * dpr));
    const context = refs.ruler.getContext?.('2d');
    if (
      !context ||
      typeof context.setTransform !== 'function' ||
      typeof context.scale !== 'function' ||
      typeof context.clearRect !== 'function'
    ) return;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(dpr, dpr);
    context.clearRect(0, 0, width, height);
    const background = context.createLinearGradient(0, 0, 0, height);
    background.addColorStop(0, '#101615');
    background.addColorStop(1, '#0a0f0e');
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    context.fillStyle = 'rgba(154, 255, 209, 0.82)';
    context.font = '11px var(--font-mono)';
    context.textBaseline = 'top';
    const ticks = buildTimeRulerTicks({
      duration: state.duration,
      viewportStart: viewport.start,
      viewportEnd: viewport.end,
      minPixelSpacing: 72,
      width: getVisibleWidth()
    });
    ticks.forEach((tick) => {
      const x = (((tick.time - viewport.start) / Math.max(0.001, viewport.span)) * width) + 0.5;
      context.strokeStyle = 'rgba(92, 255, 177, 0.26)';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(x, height - 11);
      context.lineTo(x, height);
      context.stroke();
      context.fillText(tick.label, x + 4, 4);
    });
  };

  const renderFrames = () => {
    refs.filmstrip.innerHTML = '';
    if (!state.frameStrip.length) return;
    const width = 100 / state.frameStrip.length;
    state.frameStrip.forEach((src) => {
      const frame = document.createElement('div');
      frame.className = 'media-trimmer-frame-image';
      frame.style.width = `${width}%`;
      frame.style.backgroundImage = `url("${src}")`;
      refs.filmstrip.appendChild(frame);
    });
  };

  const createEffectNode = (effectId) => {
    const node = document.createElement('div');
    node.dataset.effectId = effectId;
    node.addEventListener('pointerdown', (event) => {
      if (!isPrimaryPointerEvent(event)) return;
      event.stopPropagation();
      const effect = getEffect(effectId);
      if (!effect || !effect.draggable || event.target.closest('.media-trimmer-effect-remove, .media-trimmer-effect-handle')) return;
      startDrag(event, 'effect-move', null, effectId);
    });
    node.addEventListener('mouseenter', () => {
      options.onEffectHover?.({ id: effectId });
    });
    node.addEventListener('mouseleave', () => {
      options.onEffectHover?.({ id: null });
    });
    node.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!getEffect(effectId)) return;
      options.onEffectSelect?.({ id: effectId });
    });
    return node;
  };

  const syncEffectNode = (node, effect) => {
    node.className = `media-trimmer-effect media-trimmer-effect-${effect.tone}`;
    if (effect.resizable) node.classList.add('is-resizable');
    if (state.activeEffectId === effect.id) node.classList.add('is-active');
    node.dataset.effectId = effect.id;
    node.style.left = `${timeToX(effect.start)}px`;
    node.style.width = `${Math.max(2, timeToX(effect.end) - timeToX(effect.start))}px`;
    node.style.top = `${EFFECT_ROW_OFFSET + (effect.rowIndex * EFFECT_ROW_HEIGHT)}px`;
    node.style.pointerEvents = 'auto';
    node.style.cursor = effect.draggable ? 'grab' : '';
    node.innerHTML = '';

    const ownerDocument = node.ownerDocument || root.ownerDocument || document;
    const label = ownerDocument.createElement('span');
    label.className = 'media-trimmer-effect-label';
    label.textContent = effect.label;
    node.appendChild(label);

    if (effect.resizable) {
      ['start', 'end'].forEach((edge) => {
        const handle = ownerDocument.createElement('button');
        handle.type = 'button';
        handle.className = `media-trimmer-effect-handle media-trimmer-effect-handle-${edge}`;
        handle.setAttribute('aria-label', edge === 'start' ? 'Resize effect start' : 'Resize effect end');
        handle.addEventListener('pointerdown', (event) => {
          if (!isPrimaryPointerEvent(event)) return;
          event.stopPropagation();
          startDrag(event, edge === 'start' ? 'effect-start' : 'effect-end', null, effect.id);
        });
        node.appendChild(handle);
      });
    }

    if (!effect.removable) return;
    const remove = ownerDocument.createElement('button');
    remove.type = 'button';
    remove.className = 'media-trimmer-effect-remove';
    remove.setAttribute('aria-label', 'Remove effect');
    remove.innerHTML = `
      <svg viewBox="0 0 16 16" width="8" height="8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
        <path d="M4 4l8 8"></path>
        <path d="M12 4l-8 8"></path>
      </svg>
    `;
    remove.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
    });
    remove.addEventListener('click', (event) => {
      event.stopPropagation();
      options.onEffectRemove?.({ id: effect.id });
    });
    node.appendChild(remove);
  };

  const renderEffects = () => {
    if (!state.effects.length) {
      refs.effects.innerHTML = '';
      effectNodes.clear();
      refs.effectsTrack.classList.add('hidden');
      refs.effectsTrack.style.height = '0px';
      return;
    }
    refs.effectsTrack.classList.remove('hidden');
    const laidOutEffects = layoutEffectRows(state.effects, dragState?.effectId, dragState?.initialEffectRowIndex ?? 0);
    const trackHeight = Math.max(
      EFFECT_ROW_HEIGHT + (EFFECT_ROW_OFFSET * 2),
      ((laidOutEffects.reduce((max, effect) => Math.max(max, effect.rowIndex), 0) + 1) * EFFECT_ROW_HEIGHT) + (EFFECT_ROW_OFFSET * 2)
    );
    refs.effectsTrack.style.height = `${trackHeight}px`;
    const orderedNodes = laidOutEffects.map((effect) => {
      const node = effectNodes.get(effect.id) || createEffectNode(effect.id);
      syncEffectNode(node, effect);
      effectNodes.set(effect.id, node);
      return node;
    });
    const nextEffectIds = new Set(laidOutEffects.map((effect) => effect.id));
    Array.from(effectNodes.keys()).forEach((effectId) => {
      if (nextEffectIds.has(effectId)) return;
      effectNodes.delete(effectId);
    });
    const needsOrderSync = refs.effects.children.length !== orderedNodes.length ||
      orderedNodes.some((node, index) => refs.effects.children[index] !== node);
    if (!needsOrderSync) return;
    refs.effects.innerHTML = '';
    orderedNodes.forEach((node) => {
      refs.effects.appendChild(node);
    });
  };

  const render = ({ preserveViewport = false } = {}) => {
    refs.zoom.value = String(state.sliderValue);
    refs.zoom.disabled = state.duration <= (state.minimumViewportDuration + 0.001);
    refs.zoomLabel.textContent = state.viewportDuration >= (state.duration - 0.01)
      ? 'Full'
      : `${state.viewportDuration >= 10 ? state.viewportDuration.toFixed(0) : state.viewportDuration.toFixed(1)}s view`;
    
    if (hasPlaybackToggle) {
      syncPlaybackToggleChrome(refs, state.isPlaying, true);
      syncLoopChrome(refs, state.isLooping, true);
      syncSeekAutoplayChrome(refs, state.isSeekAutoplayEnabled, hasSeekAutoplayToggle);
    } else {
      refs.playbackToggle.classList.add('hidden');
      refs.loopContainer.classList.add('hidden');
      refs.seekAutoplayContainer.classList.add('hidden');
    }

    refs.timeline.style.width = `${getTimelineWidth()}px`;
    refs.startInput.value = state.range.start.toFixed(1);
    refs.endInput.value = state.range.end.toFixed(1);
    refs.startInput.max = (state.range.end - state.minSpan).toFixed(1);
    refs.endInput.min = (state.range.start + state.minSpan).toFixed(1);
    refs.endInput.max = state.duration.toFixed(1);
    refs.summary.textContent = `${state.range.span.toFixed(1)}s selected`;
    const startX = timeToX(state.range.start);
    const endX = timeToX(state.range.end);
    refs.selection.style.left = `${startX}px`;
    refs.selection.style.width = `${Math.max(2, endX - startX)}px`;
    refs.maskStart.style.width = `${startX}px`;
    refs.maskEnd.style.left = `${endX}px`;
    refs.handleStart.style.left = `${Math.max(0, startX - HANDLE_WIDTH - HANDLE_GAP)}px`;
    refs.handleEnd.style.left = `${Math.max(0, Math.min(getTimelineWidth() - HANDLE_WIDTH, endX + HANDLE_GAP))}px`;
    
    if (state.showFades) {
      const fadeInX = timeToX(state.range.start + state.fadeIn);
      const fadeOutX = timeToX(state.range.end - state.fadeOut);
      refs.fadeIn.classList.remove('hidden');
      refs.fadeOut.classList.remove('hidden');
      refs.fadeIn.style.left = `${fadeInX - 6}px`; // 6 is half width of fade handle
      refs.fadeOut.style.left = `${fadeOutX - 6}px`;
    } else {
      refs.fadeIn.classList.add('hidden');
      refs.fadeOut.classList.add('hidden');
    }

    refs.waveform.classList.toggle('hidden', !state.waveform?.levels?.length);
    refs.filmstrip.classList.toggle('hidden', !!state.waveform?.levels?.length || !state.frameStrip.length);
    renderEffects();
    refs.customSelections.classList.toggle('media-trimmer-custom-selections-active', !!state.activeSelectionId);
    selectionNodes.forEach((nodes, selectionId) => {
      const layer = getSelectionLayer(selectionId);
      const range = layer?.range || null;
      const isActive = state.activeSelectionId === selectionId;
      nodes.selection.classList.toggle('hidden', !range);
      nodes.handleStart.classList.toggle('hidden', !range);
      nodes.handleEnd.classList.toggle('hidden', !range);
      nodes.selection.classList.toggle('is-active', isActive);
      nodes.handleStart.classList.toggle('is-active', isActive);
      nodes.handleEnd.classList.toggle('is-active', isActive);
      nodes.selection.style.pointerEvents = isActive ? 'auto' : 'none';
      nodes.handleStart.style.pointerEvents = range ? 'auto' : 'none';
      nodes.handleEnd.style.pointerEvents = range ? 'auto' : 'none';
      if (!range) return;
      const layerStartX = timeToX(range.start);
      const layerEndX = timeToX(range.end);
      nodes.selection.style.left = `${layerStartX}px`;
      nodes.selection.style.width = `${Math.max(2, layerEndX - layerStartX)}px`;
      nodes.handleStart.style.left = `${Math.max(0, layerStartX - HANDLE_WIDTH - HANDLE_GAP)}px`;
      nodes.handleEnd.style.left = `${Math.max(0, Math.min(getTimelineWidth() - HANDLE_WIDTH, layerEndX + HANDLE_GAP))}px`;
    });
    syncPlayheadChrome(refs, state.playhead === null ? null : timeToX(state.playhead));
    refs.loading.classList.toggle('hidden', !state.loading.visible);
    refs.loadingTitle.textContent = state.loading.title;
    refs.loadingDetail.textContent = state.loading.detail;
    refs.loadingBar.style.width = `${clamp(Number(state.loading.progress) || 8, 8, 100)}%`;
    if (!preserveViewport) syncViewport();
    state.viewport = getViewportFromScroll();
    scheduleDraw();
  };

  const startDrag = (event, mode, selectionId = null, effectId = null) => {
    event.preventDefault();
    const initialRange = getSelectionRange(selectionId);
    const initialEffect = getEffect(effectId);
    const initialEffectLayout = initialEffect
      ? layoutEffectRows(state.effects).find((effect) => effect.id === effectId)
      : null;
    const baseWidth = getMeasuredWidth();
    const timelineWidth = Math.max(baseWidth, Math.round(baseWidth * getZoomRatio()));
    
    dragState = {
      selectionId,
      effectId,
      mode,
      startX: getPointerClientX(event),
      baseWidth,
      timelineWidth,
      timelineLeft: refs.timeline.getBoundingClientRect?.().left ?? 0,
      width: timelineWidth,
      initialAnchor: eventToTime(event),
      initialStart: initialRange?.start ?? eventToTime(event),
      initialEnd: initialRange?.end ?? eventToTime(event),
      initialEffectStart: initialEffect?.start ?? null,
      initialEffectEnd: initialEffect?.end ?? null,
      initialEffectSpan: initialEffect?.span ?? null,
      initialEffectRowIndex: initialEffectLayout?.rowIndex ?? 0,
      initialPlayhead: selectionId ? null : state.playhead,
      initialFadeIn: state.fadeIn,
      initialFadeOut: state.fadeOut,
      hadInitialRange: !!initialRange,
      moved: false,
      thresholdPx: mode === 'background' ? BACKGROUND_DRAG_THRESHOLD : 1
    };
    suppressAutoViewport = true;
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', stopDrag);
  };

  const onPointerMove = (event) => {
    if (!dragState) return;
    const pointerDelta = Math.abs(getPointerClientX(event) - dragState.startX);
    if (pointerDelta >= dragState.thresholdPx) dragState.moved = true;
    if (dragState.mode === 'background' && !dragState.moved) return;

    const currentTime = eventToTime(event);
    const deltaTime = currentTime - dragState.initialAnchor;

    if (dragState.mode === 'start') {
      updateSelectionRange(dragState.selectionId, dragState.initialStart + deltaTime, dragState.initialEnd, true, true);
      return;
    }
    if (dragState.mode === 'end') {
      updateSelectionRange(dragState.selectionId, dragState.initialStart, dragState.initialEnd + deltaTime, true, true);
      return;
    }
    if (dragState.mode === 'fade-in') {
      const maxFade = (state.range.end - state.range.start) / 2;
      state.fadeIn = clamp(dragState.initialFadeIn + deltaTime, 0, maxFade);
      render({ preserveViewport: true });
      return;
    }
    if (dragState.mode === 'fade-out') {
      const maxFade = (state.range.end - state.range.start) / 2;
      state.fadeOut = clamp(dragState.initialFadeOut - deltaTime, 0, maxFade);
      render({ preserveViewport: true });
      return;
    }
    if (dragState.mode === 'effect-move') {
      const dragDeltaTime = ((getPointerClientX(event) - dragState.startX) / Math.max(1, dragState.timelineWidth)) * state.duration;
      const span = Math.max(0.01, dragState.initialEffectSpan || ((dragState.initialEffectEnd || 0) - (dragState.initialEffectStart || 0)));
      const start = clamp(
        (dragState.initialEffectStart || 0) + dragDeltaTime,
        0,
        Math.max(0, state.duration - span)
      );
      moveEffectRange(dragState.effectId, start, start + span, 'move');
      return;
    }
    if (dragState.mode === 'effect-start') {
      resizeEffectRange(dragState.effectId, 'start', currentTime, 'resize');
      return;
    }
    if (dragState.mode === 'effect-end') {
      resizeEffectRange(dragState.effectId, 'end', currentTime, 'resize');
      return;
    }
    const anchor = round(dragState.initialPlayhead ?? dragState.initialAnchor);
    updateSelectionRange(dragState.selectionId, Math.min(anchor, currentTime), Math.max(anchor, currentTime), true, true);
  };

  const stopDrag = (event) => {
    if (!dragState) return;
    const activeDragState = dragState;
    const activeSelectionId = activeDragState.selectionId;
    const activeEffectId = activeDragState.effectId;
    const mode = activeDragState.mode;
    dragState = null;
    suppressAutoViewport = false;
    state.viewport = getViewportFromScroll();

    if (
      mode === 'background' &&
      !activeDragState.moved &&
      isPrimaryPointerEvent(event)
    ) {
      // Exclude effect remove button from seeking/clearing
      if (event?.target?.closest('.media-trimmer-effect-remove')) {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', stopDrag);
        return;
      }

      if (state.activeSelectionId) {
        const sid = state.activeSelectionId;
        clearSelectionRange(sid, true);
        emitSelectionChange(sid, 'clear', true);
      }
      state.playhead = activeDragState.initialAnchor;
      syncPlayheadToRange('seek');
      emitCaret('seek');
      render({ preserveViewport: true });
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', stopDrag);
      return;
    } else if (mode === 'ruler' && !activeDragState.moved && isPrimaryPointerEvent(event)) {
      state.playhead = activeDragState.initialAnchor;
      syncPlayheadToRange('ruler-click');
      emitCaret('ruler-click');
    }

    if (activeDragState.moved) {
      render({ preserveViewport: true });
      if (activeEffectId && (mode === 'effect-move' || mode === 'effect-start' || mode === 'effect-end')) emitEffectChange(activeEffectId, 'commit');
      else if (activeSelectionId) emitSelectionChange(activeSelectionId, 'commit');
      else if (mode === 'fade-in' || mode === 'fade-out') emitRange('fade-commit');
      else emitRange('commit');
    }
    
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', stopDrag);
  };

  refs.selection.addEventListener('pointerdown', (event) => {
    if (!isPrimaryPointerEvent(event)) return;
    if (state.activeSelectionId) {
      event.stopPropagation();
      startDrag(event, 'background', state.activeSelectionId);
      return;
    }
    if (!hasSelectionLayer('selection')) return;
    event.stopPropagation();
    startDrag(event, 'background', 'selection');
  });
  refs.handleStart.addEventListener('pointerdown', (event) => {
    if (!isPrimaryPointerEvent(event)) return;
    event.stopPropagation();
    startDrag(event, 'start');
  });
  refs.handleEnd.addEventListener('pointerdown', (event) => {
    if (!isPrimaryPointerEvent(event)) return;
    event.stopPropagation();
    startDrag(event, 'end');
  });
  refs.fadeIn.addEventListener('pointerdown', (event) => {
    if (!isPrimaryPointerEvent(event)) return;
    event.stopPropagation();
    startDrag(event, 'fade-in');
  });
  refs.fadeOut.addEventListener('pointerdown', (event) => {
    if (!isPrimaryPointerEvent(event)) return;
    event.stopPropagation();
    startDrag(event, 'fade-out');
  });
  selectionNodes.forEach((nodes, selectionId) => {
    nodes.selection.addEventListener('pointerdown', (event) => {
      if (!isPrimaryPointerEvent(event)) return;
      if (state.activeSelectionId !== selectionId) return;
      event.stopPropagation();
      startDrag(event, 'background', selectionId);
    });
    nodes.handleStart.addEventListener('pointerdown', (event) => {
      if (!isPrimaryPointerEvent(event)) return;
      event.stopPropagation();
      startDrag(event, 'start', selectionId);
    });
    nodes.handleEnd.addEventListener('pointerdown', (event) => {
      if (!isPrimaryPointerEvent(event)) return;
      event.stopPropagation();
      startDrag(event, 'end', selectionId);
    });
  });
  refs.body.addEventListener('pointerdown', (event) => {
    if (!isPrimaryPointerEvent(event)) return;
    if (event.target.closest('.media-trimmer-selection, .media-trimmer-handle, .media-trimmer-custom-selection, .media-trimmer-custom-handle, .media-trimmer-effect, .media-trimmer-effect-remove')) return;

    const selectionId = state.activeSelectionId || (hasSelectionLayer('selection') ? 'selection' : null);
    if (!selectionId) return;
    startDrag(event, 'background', selectionId);
  });

  refs.playbackToggle.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
  });

  refs.playbackToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    state.isPlaying = !state.isPlaying;
    options.onTogglePlayback?.({ isPlaying: state.isPlaying, time: state.playhead });
    render({ preserveViewport: true });
    emitCaret(state.isPlaying ? 'play' : 'pause');
  });

  refs.loopToggle.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
  });

  refs.loopToggle.addEventListener('change', (event) => {
    event.stopPropagation();
    state.isLooping = refs.loopToggle.checked;
    options.onLoopChange?.({ isLooping: state.isLooping });
    render({ preserveViewport: true });
  });

  refs.seekAutoplayToggle.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
  });

  refs.seekAutoplayToggle.addEventListener('change', (event) => {
    event.stopPropagation();
    state.isSeekAutoplayEnabled = refs.seekAutoplayToggle.checked;
    options.onSeekAutoplayChange?.({ isSeekAutoplayEnabled: state.isSeekAutoplayEnabled });
    render({ preserveViewport: true });
  });

  refs.ruler.addEventListener('pointerdown', (event) => {
    if (!isPrimaryPointerEvent(event)) return;
    const time = eventToTime(event);
    const withinTrimRange = isWithinTrimRange(time);
    const rangeRepositioned = false;
    state.playhead = time;
    render({ preserveViewport: true });
    emitCaret('ruler-click', { requestedTime: time, withinTrimRange, rangeRepositioned });
    if (options.rulerDragCreatesRange !== false && !rangeRepositioned) {
      startDrag(event, 'background', null);
    }
  });

  refs.ruler.addEventListener('dblclick', (event) => {
    state.range = clampSelectionRange(null, 0, state.duration);
    syncPlayheadToRange('range-reset');
    render({ preserveViewport: true });
    emitRange('commit');
    options.onRulerDoubleClick?.({ time: eventToTime(event) });
  });

  refs.scroll.addEventListener('scroll', () => {
    state.viewport = getViewportFromScroll();
    scheduleDraw();
  });

  // Support horizontal scroll via wheel even if cursor is over handles/selection
  root.addEventListener('wheel', (event) => {
    if (state.duration <= state.viewportDuration) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    event.preventDefault();
    refs.scroll.scrollLeft += event.deltaY;
  }, { passive: false });

  refs.startInput.addEventListener('change', () => {
    const val = Number(refs.startInput.value) || 0;
    updateSelectionRange(null, val, state.range.end, true, false);
    emitRange('commit');
  });

  refs.endInput.addEventListener('change', () => {
    const val = Number(refs.endInput.value) || state.duration;
    updateSelectionRange(null, state.range.start, val, true, false);
    emitRange('commit');
  });

  refs.zoom.addEventListener('input', () => {
    const previousViewport = getViewportFromScroll();
    
    const focusTime = (state.playhead !== null && state.playhead >= previousViewport.start && state.playhead <= previousViewport.end)
      ? state.playhead
      : ((previousViewport.start + previousViewport.end) / 2);

    const relativePos = (focusTime - previousViewport.start) / Math.max(0.001, previousViewport.span);

    state.sliderValue = clamp(Number(refs.zoom.value) || 0, 0, 100);
    state.viewportDuration = getViewportDurationForSlider(
      state.duration,
      state.sliderValue,
      state.minimumViewportDuration
    );
    
    render({ preserveViewport: true });
    
    const span = state.viewportDuration;
    const nextStart = clamp(focusTime - (span * relativePos), 0, Math.max(0, state.duration - span));
    
    const maxScroll = Math.max(0, getTimelineWidth() - getVisibleWidth());
    const denominator = Math.max(0.001, state.duration - span);
    refs.scroll.scrollLeft = maxScroll * (nextStart / denominator);
    
    state.viewport = getViewportFromScroll();
    scheduleDraw();
    options.onZoomChange?.({ ratio: getZoomRatio(), viewportDuration: state.viewportDuration, sliderValue: state.sliderValue });
  });

  refs.zoomSelection.addEventListener('click', (event) => {
    event.stopPropagation();
    zoomToSelection();
  });

  const handleResize = () => {
    render({ preserveViewport: true });
  };
  window.addEventListener('resize', handleResize);

  render();

  return {
    root,
    getTimelineElement: () => refs.timeline,
    getOverlayElement: () => refs.overlay,
    getRulerElement: () => refs.ruler,
    getRange: () => ({ ...state.range, fadeIn: state.fadeIn, fadeOut: state.fadeOut }),
    getSelection(selectionId) {
      const range = getSelectionRange(selectionId);
      return selectionId && range ? { id: selectionId, ...range } : range ? { ...range } : null;
    },
    setRange(start, end, emit = true) {
      updateSelectionRange(null, start, end, emit);
    },
    setFades(fadeIn, fadeOut, emit = true) {
      state.fadeIn = Number(fadeIn) || 0;
      state.fadeOut = Number(fadeOut) || 0;
      render({ preserveViewport: true });
      if (emit) emitRange('external-fade');
    },
    setSelection(selectionId, start, end, emit = true) {
      updateSelectionRange(selectionId, start, end, emit);
    },
    clearSelection(selectionId, emit = true) {
      clearSelectionRange(selectionId, emit);
    },
    setActiveSelection(selectionId) {
      state.activeSelectionId = selectionId && state.selectionLayers.has(selectionId) ? selectionId : null;
      render({ preserveViewport: true });
    },
    getActiveSelection() {
      return state.activeSelectionId;
    },
    getPlayhead() {
      return state.playhead;
    },
    setDuration(duration) {
      state.duration = Math.max(0.1, Number(duration) || 0.1);
      resetViewportWaveform();
      state.minimumViewportDuration = getMinimumViewportDuration(state.duration, options.minimumViewportDuration || 3);
      state.viewportDuration = Math.min(state.duration, Math.max(state.minimumViewportDuration, state.viewportDuration));
      state.sliderValue = getSliderValueForViewportDuration(state.duration, state.viewportDuration, state.minimumViewportDuration);
      state.range = clampTrimRange({ start: state.range.start, end: state.range.end, duration: state.duration, minSpan: state.minSpan });
      state.selectionLayers.forEach((layer) => {
        if (!layer.range) return;
        layer.range = clampTrimRange({
          start: layer.range.start,
          end: layer.range.end,
          duration: state.duration,
          minSpan: layer.minSpan
        });
      });
      state.effects = buildEffects(state.effects, state.duration);
      syncPlayheadToRange('range-reset');
      render();
    },
    setZoom(zoom, emit = true) {
      state.viewportDuration = clamp(
        state.duration / Math.max(1, Number(zoom) || 1),
        state.minimumViewportDuration,
        state.duration
      );
      state.sliderValue = getSliderValueForViewportDuration(state.duration, state.viewportDuration, state.minimumViewportDuration);
      render();
      if (emit) options.onZoomChange?.({ ratio: getZoomRatio(), viewportDuration: state.viewportDuration, sliderValue: state.sliderValue });
    },
    zoomToRange(startTime, endTime = startTime, emit = true) {
      zoomToRange(startTime, endTime, emit);
    },
    zoomToSelection(emit = true) {
      zoomToSelection(emit);
    },
    setWaveform(data) {
      state.waveform = data && Array.isArray(data.levels) ? data : null;
      state.sampleRate = Number(state.waveform?.sampleRate) || state.sampleRate;
      resetViewportWaveform();
      render({ preserveViewport: true });
    },
    setSamples(samples, sampleRate) {
      state.samples = samples instanceof Float32Array ? samples : null;
      state.sampleRate = Number(sampleRate) || state.sampleRate;
      resetViewportWaveform();
      render({ preserveViewport: true });
    },
    setWaveformPeaks(peaks) {
      if (!Array.isArray(peaks) || !peaks.length) {
        state.waveform = null;
        resetViewportWaveform();
        render({ preserveViewport: true });
        return;
      }
      state.waveform = {
        peak: Math.max(0.0001, ...peaks.map((value) => Math.abs(Number(value) || 0))),
        levels: [{
          bins: peaks.length,
          min: peaks.map((value) => -Math.abs(value)),
          max: peaks.map((value) => Math.abs(value))
        }]
      };
      resetViewportWaveform();
      render({ preserveViewport: true });
    },
    setFrameStrip(frames) {
      state.frameStrip = Array.isArray(frames) ? frames : [];
      renderFrames();
      render({ preserveViewport: true });
    },
    setEffects(effects) {
      state.effects = buildEffects(effects, state.duration);
      if (state.activeEffectId && !state.effects.some((effect) => effect.id === state.activeEffectId)) {
        state.activeEffectId = null;
      }
      render({ preserveViewport: true });
    },
    setActiveEffect(effectId) {
      const nextEffectId = effectId && state.effects.some((effect) => effect.id === effectId) ? effectId : null;
      if (state.activeEffectId === nextEffectId) return;
      const previousEffectId = state.activeEffectId;
      state.activeEffectId = nextEffectId;
      if (previousEffectId) effectNodes.get(previousEffectId)?.classList.remove('is-active');
      if (nextEffectId) effectNodes.get(nextEffectId)?.classList.add('is-active');
    },
    setPlayhead(time, reason = 'external') {
      state.playhead = Number.isFinite(time) ? clamp(time, 0, state.duration) : null;
      syncPlayheadToRange(reason === 'ruler-click' ? 'range-reset' : 'playhead-limit');
      syncPlayheadChrome(refs, state.playhead === null ? null : timeToX(state.playhead));
      if (state.playhead !== null) emitCaret(reason);
    },
    setPlaying(isPlaying) {
      state.isPlaying = !!isPlaying;
      syncPlaybackToggleChrome(refs, state.isPlaying, !!options.onTogglePlayback);
    },
    setLooping(isLooping) {
      state.isLooping = !!isLooping;
      syncLoopChrome(refs, state.isLooping, !!options.onTogglePlayback);
    },
    setSeekAutoplay(isEnabled) {
      state.isSeekAutoplayEnabled = !!isEnabled;
      syncSeekAutoplayChrome(refs, state.isSeekAutoplayEnabled, hasSeekAutoplayToggle);
    },
    emitEnded() {
      emitCaret('ended');
    },
    clearPlayhead() {
      clearPlayheadReset();
      state.playhead = null;
      syncPlayheadChrome(refs, null);
    },
    setLoading(nextState = {}) {
      state.loading = {
        visible: !!nextState.visible,
        title: nextState.title || 'Preparing waveform',
        detail: nextState.detail || 'Analyzing local media…',
        progress: nextState.progress ?? null
      };
      render({ preserveViewport: true });
    },
    getRange() {
      return { ...state.range, fadeIn: state.fadeIn, fadeOut: state.fadeOut };
    },
    getSelectionRange(selectionId) {
      const range = getSelectionRange(selectionId);
      return range ? { ...range } : null;
    },
    clearSelectionRange(selectionId, emit = true) {
      clearSelectionRange(selectionId, emit);
    },
    getEffect(effectId) {
      const effect = getEffect(effectId);
      return effect ? { ...effect } : null;
    },
    destroy() {
      clearPlayheadReset();
      clearViewportWaveformTimer();
      if (drawFrame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(drawFrame);
      window?.removeEventListener?.('resize', handleResize);
      document?.removeEventListener?.('pointermove', onPointerMove);
      document?.removeEventListener?.('pointerup', stopDrag);
      root.remove();
    }
  };
}

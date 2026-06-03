import {
  buildMixerRulerTicks,
  formatMixerTime,
  getMixerTrackMovePreview,
  getMixerTimelineDuration,
  getMixerTrimPreviewValue,
  getTrackWaveformCanvasMetrics
} from '../utils/audio-mixer.js';
import { pickWaveformLevel } from '../utils/media-trimmer.js';

function clearNode(node) {
  node.innerHTML = '';
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const MIXER_LANE_HEIGHT = 64;
const TRACK_CLIP_HEIGHT = MIXER_LANE_HEIGHT - 12;
const TRACK_WAVEFORM_HEIGHT = TRACK_CLIP_HEIGHT;

const mixerRenderTokens = new WeakMap();
let nextMixerRenderToken = 1;

function getMixerRenderToken(value) {
  if (!value || typeof value !== 'object') return '0';
  if (!mixerRenderTokens.has(value)) mixerRenderTokens.set(value, String(nextMixerRenderToken++));
  return mixerRenderTokens.get(value);
}

function getMixerRenderStateSignature(state = {}) {
  const lanes = Array.isArray(state.lanes) ? state.lanes : [];
  const tracks = Array.isArray(state.tracks) ? state.tracks : [];
  return JSON.stringify({
    lanes: lanes.map((lane) => ({
      muted: Boolean(lane?.muted),
      soloed: Boolean(lane?.soloed),
      name: lane?.name || '',
      volume: Number(lane?.volume) || 0
    })),
    tracks: tracks.map((track) => ({
      id: track?.id ?? null,
      assetId: track?.assetId ?? null,
      name: track?.name || '',
      laneIndex: Number(track?.laneIndex) || 0,
      offset: Number(track?.offset) || 0,
      trimStart: Number(track?.trimStart) || 0,
      trimEnd: Number(track?.trimEnd) || 0,
      volume: Number(track?.volume) || 0,
      muted: Boolean(track?.muted),
      soloed: Boolean(track?.soloed),
      fadeStyle: track?.fadeStyle || 'linear',
      fadeIn: Number(track?.fadeIn) || 0,
      fadeOut: Number(track?.fadeOut) || 0,
      waveform: getMixerRenderToken(track?.waveform),
      volumeAutomation: Array.isArray(track?.volumeAutomation)
        ? track.volumeAutomation.map((point) => ({
          time: Number(point?.time) || 0,
          value: Number(point?.value) || 0
        }))
        : []
    }))
  });
}

function getTrackSpan(track = {}) {
  return Math.max(0, (Number(track.trimEnd) || 0) - (Number(track.trimStart) || 0));
}

function getSelectedTrackIds(state = {}) {
  const ids = Array.isArray(state.selectedTrackIds) ? state.selectedTrackIds.filter(Boolean) : [];
  if (!ids.length && state.selectedTrackId) ids.push(state.selectedTrackId);
  return new Set(ids);
}

function openMenuFromEvent(event, callback, payload = {}) {
  if (typeof callback !== 'function') return;
  const rect = event?.currentTarget?.getBoundingClientRect?.() || { left: event?.clientX || 0, top: event?.clientY || 0, width: 0, height: 0 };
  callback({
    ...payload,
    x: event?.clientX ?? (rect.left + (rect.width / 2)),
    y: event?.clientY ?? (rect.top + (rect.height / 2))
  });
}

function ensureMarkup(mount) {
  if (mount.querySelector('#studio-timeline-container')) return;
  mount.innerHTML = `
    <div class="studio-mixer-grid">
      <div id="studio-controls-col" class="studio-controls-col">
        <div class="studio-lanes-title">Mixer Lanes</div>
        <div id="studio-lanes-controls" class="studio-lanes-controls"></div>
        <button id="btn-add-lane" class="mini-btn studio-add-lane" type="button">Add Lane</button>
      </div>
      <div class="studio-timeline-shell">
        <div id="studio-timeline-container">
          <div id="studio-timeline-ruler">
            <canvas id="studio-ruler-canvas"></canvas>
          </div>
          <div id="studio-playhead"></div>
          <div id="studio-tracks-lanes"></div>
          <div id="studio-marquee-selection" class="studio-marquee-selection hidden"></div>
          <div id="studio-new-lane-drop" class="studio-new-lane-drop"></div>
        </div>
        <div id="studio-new-lane-drop-callout" class="studio-new-lane-drop-callout">Drop files or clips here to create a lane</div>
      </div>
    </div>
  `;
}

export function drawRuler({
  canvas,
  duration,
  scale,
  viewportWidth = 0,
  scrollLeft = 0
} = {}) {
  const context = canvas?.getContext?.('2d');
  if (!canvas || !context) return;
  const dpr = Math.max(1, Number(globalThis.window?.devicePixelRatio) || 1);
  const totalWidth = Math.max(viewportWidth, Math.ceil(Math.max(1, duration * scale)));
  const displayWidth = Math.max(1, Math.ceil(Number(viewportWidth) || totalWidth));
  const height = 40;
  const maxBitmapEdge = 16384;
  const maxBitmapArea = 16777216;
  const targetRenderWidth = Math.min(maxBitmapEdge, Math.max(1, Math.ceil(displayWidth * dpr)));
  const renderHeight = Math.min(maxBitmapEdge, Math.max(1, Math.ceil(height * dpr)));
  const renderWidth = (targetRenderWidth * renderHeight) > maxBitmapArea
    ? Math.max(1, Math.min(targetRenderWidth, Math.floor(maxBitmapArea / renderHeight)))
    : targetRenderWidth;
  const xScale = renderWidth / Math.max(1, displayWidth);
  const yScale = renderHeight / Math.max(1, height);
  canvas.width = renderWidth;
  canvas.height = renderHeight;
  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${height}px`;
  canvas.style.transform = `translate3d(${Math.max(0, Number(scrollLeft) || 0)}px, 0, 0)`;
  canvas.style.transformOrigin = '0 0';
  context.setTransform?.(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.scale?.(xScale, yScale);

  const safeScrollLeft = Math.max(0, Number(scrollLeft) || 0);
  const visibleStart = safeScrollLeft / Math.max(0.01, scale);
  const visibleSpan = Math.max(0.1, viewportWidth / Math.max(0.01, scale));
  const visibleEnd = visibleStart + visibleSpan;
  const ticks = buildMixerRulerTicks({
    duration: Math.max(1, Number(duration) || 1),
    scale,
    viewportWidth,
    visibleSpan
  }).filter((tick) => tick.time >= Math.max(0, visibleStart - 1) && tick.time <= visibleEnd + 1);

  context.fillStyle = 'rgba(255,255,255,0.28)';
  context.strokeStyle = 'rgba(255,255,255,0.14)';
  context.lineWidth = 1;
  context.font = '10px var(--font-mono)';

  ticks.forEach((tick) => {
    const x = (tick.time * scale) - safeScrollLeft;
    context.beginPath();
    context.moveTo(x, tick.major ? 14 : 22);
    context.lineTo(x, 40);
    context.stroke();
    if (tick.label) context.fillText(tick.label, x + 4, 12);
  });
}

export function drawTrackWaveform({
  canvas,
  waveform,
  duration,
  scale,
  selected = false
} = {}) {
  const context = canvas?.getContext?.('2d');
  if (!canvas || !context) return;
  const metrics = getTrackWaveformCanvasMetrics({
    duration,
    scale,
    dpr: Math.max(1, Number(globalThis.window?.devicePixelRatio) || 1),
    height: TRACK_WAVEFORM_HEIGHT
  });
  canvas.width = metrics.renderWidth;
  canvas.height = metrics.renderHeight;
  canvas.style.width = `${metrics.displayWidth}px`;
  canvas.style.height = `${TRACK_WAVEFORM_HEIGHT}px`;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = selected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const level = pickWaveformLevel(waveform, metrics.renderWidth);
  const mins = Array.isArray(level?.min) ? level.min : [];
  const maxes = Array.isArray(level?.max) ? level.max : [];
  if (!mins.length || !maxes.length) return;

  const mid = canvas.height / 2;
  const color = selected ? '#ffffff' : 'rgba(255,255,255,0.78)';
  context.strokeStyle = color;
  context.lineWidth = 1;

  for (let index = 0; index < mins.length; index += 1) {
    const x = (index / mins.length) * canvas.width;
    const top = mid - (Math.max(0, maxes[index] || 0) * mid * 0.92);
    const bottom = mid - (Math.min(0, mins[index] || 0) * mid * 0.92);
    context.beginPath();
    context.moveTo(x, top);
    context.lineTo(x, bottom);
    context.stroke();
  }
}

export function renderCrossFadeGauge({
  root,
  track,
  overlapBefore = 0,
  onFadeStyleChange,
  onOpenMenu,
  scale = 100
} = {}) {
  if (!root) return;
  clearNode(root);
  if (overlapBefore <= 0) return;

  const overlapWidth = Math.max(22, overlapBefore * scale);
  root.style.left = '0px';
  root.style.width = `${overlapWidth}px`;
  
  const button = root.ownerDocument.createElement('button');
  button.type = 'button';
  button.classList.add('track-control-btn', 'track-crossfade-mode-toggle');
  button.setAttribute('data-action', 'track-crossfade-options');
  
  const mode = track.fadeStyle || 'linear';
  button.textContent = mode === 'equal-power' ? 'EQ' : mode === 'logarithmic' ? 'LOG' : 'LIN';
  button.title = `Crossfade: ${mode} (${overlapBefore.toFixed(2)}s)`;
  
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    openMenuFromEvent(event, onOpenMenu, {
      trackId: track.id,
      track,
      overlapBefore
    });
  });
  
  root.appendChild(button);
}

export function createMixerComponent(options = {}) {
  const mount = options.mount;
  ensureMarkup(mount);

  const root = mount.querySelector('.studio-mixer-grid') || mount.querySelector('#studio-controls-col')?.parentElement || mount;
  root.classList.add('studio-mixer-layout');
  const lanesControls = mount.querySelector('#studio-lanes-controls');
  const timelineContainer = mount.querySelector('#studio-timeline-container');
  const ruler = mount.querySelector('#studio-timeline-ruler');
  const rulerCanvas = mount.querySelector('#studio-ruler-canvas');
  const playhead = mount.querySelector('#studio-playhead');
  const tracksLanes = mount.querySelector('#studio-tracks-lanes');
  const marquee = mount.querySelector('#studio-marquee-selection');
  const newLaneDrop = mount.querySelector('#studio-new-lane-drop');
  const newLaneDropCallout = mount.querySelector('#studio-new-lane-drop-callout');
  const addLaneButton = mount.querySelector('#btn-add-lane');

  let state = options.state || { lanes: [], tracks: [], selectedLaneIndex: 0, selectedTrackId: null };
  let timelineScale = Math.max(0.01, Number(options.timelineScale) || 100);
  let stateSignature = getMixerRenderStateSignature(state);
  let selectionSignature = JSON.stringify({
    selectedLaneIndex: Number(state.selectedLaneIndex) || 0,
    selectedTrackId: state.selectedTrackId ?? null,
    selectedTrackIds: Array.isArray(state.selectedTrackIds) ? state.selectedTrackIds : []
  });
  let isPlaying = false;
  let playheadTime = null;
  const laneRowNodes = new Map();
  const trackClipNodes = new Map();
  const trackWaveformNodes = new Map();
  const getTimelineDuration = () => Math.max(8, getMixerTimelineDuration(state.tracks));
  const getViewportWidth = () => timelineContainer?.clientWidth || root?.clientWidth || 880;
  const getRulerViewportWidth = () => timelineContainer?.clientWidth || root?.clientWidth || mount?.clientWidth || 880;
  const getEffectiveScale = () => {
    const viewportWidth = getViewportWidth();
    return Math.max(0.01, timelineScale, viewportWidth / Math.max(0.001, getTimelineDuration()));
  };

  const syncPlayhead = () => {
    if (!playhead) return;
    if (!Number.isFinite(playheadTime)) {
      playhead.style.display = 'none';
      return;
    }
    playhead.style.display = 'block';
    playhead.style.left = `${Math.max(0, playheadTime) * getEffectiveScale()}px`;
  };

  const getTimelineWidth = () => {
    const viewportWidth = getViewportWidth();
    return Math.max(viewportWidth, Math.ceil(getTimelineDuration() * getEffectiveScale()));
  };

  const bindTrimHandle = (handle, track, edge, scale) => {
    handle.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      const initialX = event.clientX;
      const initialValue = edge === 'start' ? track.trimStart : track.trimEnd;
      const move = (moveEvent) => {
        const nextValue = getMixerTrimPreviewValue({
          initialValue,
          initialClientX: initialX,
          currentClientX: moveEvent.clientX,
          scale
        });
        if (edge === 'start') {
          options.onTrackTrimStart?.(track.id, nextValue);
        } else {
          options.onTrackTrimEnd?.(track.id, nextValue);
        }
      };
      const up = () => {
        mount.ownerDocument.removeEventListener('pointermove', move);
        mount.ownerDocument.removeEventListener('pointerup', up);
      };
      mount.ownerDocument.addEventListener('pointermove', move);
      mount.ownerDocument.addEventListener('pointerup', up);
    });
  };

  const syncSelectionState = (previousSelection = {}) => {
    const selectedTrackIds = getSelectedTrackIds(state);
    laneRowNodes.forEach((row, laneIndex) => {
      row.classList.toggle('selected', laneIndex === state.selectedLaneIndex);
    });
    trackClipNodes.forEach((clip, trackId) => {
      clip.classList.toggle('selected', selectedTrackIds.has(trackId));
      clip.classList.toggle('primary-selected', trackId === state.selectedTrackId);
    });
    const affectedTrackIds = new Set([
      previousSelection.selectedTrackId ?? null,
      state.selectedTrackId ?? null,
      ...(Array.isArray(previousSelection.selectedTrackIds) ? previousSelection.selectedTrackIds : []),
      ...selectedTrackIds
    ]);
    affectedTrackIds.forEach((trackId) => {
      if (!trackId) return;
      const entry = trackWaveformNodes.get(trackId);
      if (!entry) return;
      drawTrackWaveform({
        canvas: entry.canvas,
        waveform: entry.waveform,
        duration: entry.duration,
        scale: getEffectiveScale(),
        selected: selectedTrackIds.has(trackId)
      });
      entry.canvas.style.left = `${Math.max(0, Number(entry.trimStart) || 0) * -getEffectiveScale()}px`;
    });
  };

  const buildClip = (track, laneTracks) => {
    const scale = getEffectiveScale();
    const selectedTrackIds = getSelectedTrackIds(state);
    const clipDuration = getTrackSpan(track);
    const clipWidth = Math.max(88, clipDuration * scale);
    const compactToolbar = clipWidth < 150;
    const clip = mount.ownerDocument.createElement('div');
    clip.classList.add('track-clip');
    if (selectedTrackIds.has(track.id)) clip.classList.add('selected');
    if (track.id === state.selectedTrackId) clip.classList.add('primary-selected');
    clip.setAttribute('data-track-id', String(track.id));
    clip.dataset.compact = compactToolbar ? 'true' : 'false';

    clip.style.left = `${Math.max(0, track.offset) * scale}px`;
    clip.style.top = '8px';
    clip.style.width = `${clipWidth}px`;

    const surface = mount.ownerDocument.createElement('div');
    surface.classList.add('track-clip-surface');
    clip.appendChild(surface);

    const waveformStack = mount.ownerDocument.createElement('div');
    waveformStack.classList.add('track-waveform-stack');
    surface.appendChild(waveformStack);

    const chrome = mount.ownerDocument.createElement('div');
    chrome.classList.add('track-clip-chrome');
    const titlebar = mount.ownerDocument.createElement('div');
    titlebar.classList.add('track-clip-titlebar');
    const copy = mount.ownerDocument.createElement('div');
    copy.classList.add('track-clip-copy');
    const title = mount.ownerDocument.createElement('div');
    title.classList.add('track-clip-title');
    title.textContent = track.name || 'Clip';
    const meta = mount.ownerDocument.createElement('div');
    meta.classList.add('track-clip-meta');
    meta.textContent = `${formatMixerTime(track.offset)} • ${formatMixerTime(clipDuration)}`;
    copy.appendChild(title);
    copy.appendChild(meta);

    const actions = mount.ownerDocument.createElement('div');
    actions.classList.add('track-clip-toolbar');
    
    const actionButtons = [
      { action: 'mute-track', label: 'M', handler: () => options.onTrackMuteToggle?.(track.id), active: track.muted },
      { action: 'solo-track', label: 'S', handler: () => options.onTrackSoloToggle?.(track.id), active: track.soloed },
      { action: 'duplicate-track', label: 'D', handler: () => options.onTrackDuplicate?.(track.id) },
      { action: 'edit-track', label: 'Edit', handler: () => options.onTrackEdit?.(track.id) },
      { action: 'remove-track', label: 'X', handler: () => options.onTrackRemove?.(track.id) }
    ];

    actionButtons.forEach((entry) => {
      const button = mount.ownerDocument.createElement('button');
      button.type = 'button';
      button.classList.add('track-control-btn');
      if (entry.active) button.classList.add('active');
      button.setAttribute('data-action', entry.action);
      button.textContent = entry.label;
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        entry.handler(event);
      });
      actions.appendChild(button);
    });

    titlebar.appendChild(copy);
    titlebar.appendChild(actions);
    chrome.appendChild(titlebar);

    const waveformViewport = mount.ownerDocument.createElement('div');
    waveformViewport.classList.add('track-waveform-viewport');
    const waveformCanvas = mount.ownerDocument.createElement('canvas');
    waveformCanvas.classList.add('track-waveform-canvas');
    waveformViewport.appendChild(waveformCanvas);
    waveformStack.appendChild(waveformViewport);
    const waveformDuration = Math.max(clipDuration, Number(track.buffer?.duration) || 0);
    drawTrackWaveform({
      canvas: waveformCanvas,
      waveform: track.waveform,
      duration: waveformDuration,
      scale,
      selected: selectedTrackIds.has(track.id)
    });
    waveformCanvas.style.left = `${Math.max(0, Number(track.trimStart) || 0) * -scale}px`;
    trackClipNodes.set(track.id, clip);
    trackWaveformNodes.set(track.id, {
      canvas: waveformCanvas,
      waveform: track.waveform,
      duration: waveformDuration,
      trimStart: track.trimStart
    });

    const trackIndex = laneTracks.findIndex((entry) => entry.id === track.id);
    const previousTrack = trackIndex > 0 ? laneTracks[trackIndex - 1] : null;
    const overlapBefore = previousTrack ? Math.max(0, (previousTrack.offset + getTrackSpan(previousTrack)) - track.offset) : 0;
    waveformStack.appendChild(chrome);

    if (overlapBefore > 0) {
      const crossFade = mount.ownerDocument.createElement('div');
      crossFade.classList.add('track-crossfade-gauge');
      renderCrossFadeGauge({
        root: crossFade,
        track,
        overlapBefore,
        scale,
        onFadeStyleChange(mode) {
          options.onTrackFadeStyleChange?.(track.id, mode);
        },
        onOpenMenu(payload) {
          options.onTrackCrossfadeMenu?.(payload);
        }
      });
      waveformStack.appendChild(crossFade);
    }

    ['start', 'end'].forEach((edge) => {
      const handle = mount.ownerDocument.createElement('div');
      handle.classList.add('track-trim-handle', edge);
      bindTrimHandle(handle, track, edge, scale);
      clip.appendChild(handle);
    });

    clip.addEventListener('click', (event) => {
      options.onTrackSelect?.(track.id, {
        additive: Boolean(event.ctrlKey || event.metaKey),
        range: Boolean(event.shiftKey)
      });
    });
    clip.addEventListener('dblclick', () => {
      options.onTrackDoubleClick?.(track.id);
    });
    clip.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const rect = clip.getBoundingClientRect?.() || { left: event.clientX || 0, width: clipWidth };
      const contextRatio = clamp(((event.clientX || 0) - rect.left) / Math.max(1, clipWidth), 0, 1);
      options.onTrackContextMenu?.({
        trackId: track.id,
        track,
        time: (Number(track.offset) || 0) + (contextRatio * clipDuration),
        x: event.clientX,
        y: event.clientY
      });
    });
    clip.addEventListener('pointerdown', (event) => {
      if (event.target.closest?.('.track-control-btn, .track-trim-handle, .track-crossfade-gauge')) return;
      const initialX = event.clientX;
      const initialY = event.clientY;
      const initialOffset = Number(track.offset) || 0;
      const initialLaneIndex = Number(track.laneIndex) || 0;
      let moved = false;
      const getMovePreview = (pointerEvent) => getMixerTrackMovePreview({
        initialOffset,
        initialLaneIndex,
        initialClientX: initialX,
        initialClientY: initialY,
        currentClientX: pointerEvent.clientX,
        currentClientY: pointerEvent.clientY,
        scale,
        laneHeight: MIXER_LANE_HEIGHT,
        laneCount: state.lanes.length
      });
      const move = (moveEvent) => {
        const preview = getMovePreview(moveEvent);
        moved = true;
        clip.classList.add('is-dragging');
        clip.style.transform = `translate3d(${preview.translateX}px, ${preview.translateY}px, 0)`;
        newLaneDrop?.classList.toggle('active', preview.createLane);
        newLaneDropCallout?.classList.toggle('active', preview.createLane);
      };
      const up = (upEvent) => {
        mount.ownerDocument.removeEventListener('pointermove', move);
        mount.ownerDocument.removeEventListener('pointerup', up);
        clip.classList.remove('is-dragging');
        clip.style.transform = '';
        if (!moved) return;
        const preview = getMovePreview(upEvent);
        newLaneDrop?.classList.remove('active');
        newLaneDropCallout?.classList.remove('active');
        if (preview.createLane) options.onTrackMoveToNewLane?.(track.id, preview.offset);
        else options.onTrackMove?.(track.id, preview.offset, preview.laneTarget);
      };
      mount.ownerDocument.addEventListener('pointermove', move);
      mount.ownerDocument.addEventListener('pointerup', up);
    });

    return clip;
  };

  const appendLaneTrimOverlays = (laneRow, track) => {
    const scale = getEffectiveScale();
    const clipDuration = getTrackSpan(track);
    const clipWidth = Math.max(88, clipDuration * scale);
    ['start', 'end'].forEach((edge) => {
      const handle = mount.ownerDocument.createElement('div');
      handle.classList.add('track-trim-handle', 'track-trim-overlay', edge);
      handle.dataset.trackId = String(track.id);
      handle.style.left = `${Math.max(0, (Number(track.offset) || 0) * scale) + (edge === 'end' ? Math.max(0, clipWidth - 8) : 0)}px`;
      handle.style.top = '8px';
      handle.style.bottom = '8px';
      bindTrimHandle(handle, track, edge, scale);
      laneRow.appendChild(handle);
    });
  };

  const render = () => {
    const timelineWidth = getTimelineWidth();
    laneRowNodes.clear();
    trackClipNodes.clear();
    trackWaveformNodes.clear();

    lanesControls.innerHTML = '';
    state.lanes.forEach((lane, laneIndex) => {
      const row = mount.ownerDocument.createElement('div');
      row.classList.add('lane-control-row');
      if (laneIndex === state.selectedLaneIndex) row.classList.add('selected');
      row.setAttribute('data-lane-index', String(laneIndex));

      const top = mount.ownerDocument.createElement('div');
      top.classList.add('lane-control-top');
      const name = mount.ownerDocument.createElement('input');
      name.type = 'text';
      name.classList.add('track-name-input');
      name.value = lane.name || `Lane ${laneIndex + 1}`;
      name.addEventListener('click', (event) => event.stopPropagation());
      name.addEventListener('change', (event) => {
        options.onLaneRename?.(laneIndex, event.target.value);
      });
      top.appendChild(name);

      const actions = mount.ownerDocument.createElement('div');
      actions.classList.add('lane-control-actions');
      [
        { label: 'M', handler: () => options.onLaneMuteToggle?.(laneIndex), active: lane.muted },
        { label: 'S', handler: () => options.onLaneSoloToggle?.(laneIndex), active: lane.soloed },
        { label: 'X', handler: () => options.onLaneRemove?.(laneIndex) }
      ].forEach((entry) => {
        const button = mount.ownerDocument.createElement('button');
        button.type = 'button';
        button.classList.add('track-control-btn');
        if (entry.active) button.classList.add('active');
        button.textContent = entry.label;
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          entry.handler();
        });
        actions.appendChild(button);
      });
      top.appendChild(actions);
      row.appendChild(top);

      const volume = mount.ownerDocument.createElement('input');
      volume.type = 'range';
      volume.min = '0';
      volume.max = '2';
      volume.step = '0.01';
      volume.value = String(Number(lane.volume) || 1);
      volume.classList.add('lane-volume-slider');
      volume.addEventListener('click', (event) => event.stopPropagation());
      volume.addEventListener('input', (event) => {
        options.onLaneVolumeChange?.(laneIndex, Number(event.target.value));
      });
      row.appendChild(volume);

      row.addEventListener('click', () => {
        options.onLaneSelect?.(laneIndex);
      });
      row.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        event.stopPropagation();
        options.onLaneContextMenu?.({
          laneIndex,
          lane,
          x: event.clientX,
          y: event.clientY
        });
      });
      lanesControls.appendChild(row);
      laneRowNodes.set(laneIndex, row);
    });

    tracksLanes.innerHTML = '';
    tracksLanes.style.minWidth = `${timelineWidth}px`;
    ruler.style.width = `${timelineWidth}px`;
    newLaneDrop.style.width = `${timelineWidth}px`;
    drawRuler({
      canvas: rulerCanvas,
      duration: getTimelineDuration(),
      scale: getEffectiveScale(),
      viewportWidth: getRulerViewportWidth(),
      scrollLeft: timelineContainer?.scrollLeft || 0
    });

    state.lanes.forEach((lane, laneIndex) => {
      const laneRow = mount.ownerDocument.createElement('div');
      laneRow.classList.add('track-lane');
      laneRow.setAttribute('data-lane-index', String(laneIndex));
      laneRow.style.minWidth = `${timelineWidth}px`;
      const laneTracks = state.tracks
        .filter((track) => track.laneIndex === laneIndex)
        .sort((left, right) => left.offset - right.offset);
      laneTracks.forEach((track) => {
        laneRow.appendChild(buildClip(track, laneTracks));
      });
      laneTracks.forEach((track) => {
        appendLaneTrimOverlays(laneRow, track);
      });
      tracksLanes.appendChild(laneRow);
    });

    syncPlayhead();
    syncSelectionState();
  };

  const hideMarquee = () => {
    if (!marquee) return;
    marquee.classList.add('hidden');
    marquee.style.left = '0px';
    marquee.style.top = '0px';
    marquee.style.width = '0px';
    marquee.style.height = '0px';
  };

  const getTracksInMarquee = (rect) => {
    const lanesRect = tracksLanes.getBoundingClientRect?.() || { left: 0, top: 0 };
    const scale = getEffectiveScale();
    return state.tracks
      .filter((track) => {
        const clipDuration = getTrackSpan(track);
        const clipRect = {
          left: lanesRect.left + ((Number(track.offset) || 0) * scale),
          top: lanesRect.top + ((Number(track.laneIndex) || 0) * MIXER_LANE_HEIGHT) + 6,
          right: lanesRect.left + ((Number(track.offset) || 0) * scale) + Math.max(88, clipDuration * scale),
          bottom: lanesRect.top + ((Number(track.laneIndex) || 0) * MIXER_LANE_HEIGHT) + 6 + TRACK_CLIP_HEIGHT
        };
        return rect.left <= clipRect.right && rect.right >= clipRect.left && rect.top <= clipRect.bottom && rect.bottom >= clipRect.top;
      })
      .sort((left, right) => (Number(left.laneIndex) || 0) - (Number(right.laneIndex) || 0) || (Number(left.offset) || 0) - (Number(right.offset) || 0))
      .map((track) => track.id);
  };

  tracksLanes.addEventListener('pointerdown', (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target?.closest?.('.track-clip, .track-control-btn, .track-trim-handle')) return;
    const startX = Number(event.clientX) || 0;
    const startY = Number(event.clientY) || 0;
    let moved = false;
    const move = (moveEvent) => {
      const currentX = Number(moveEvent.clientX) || startX;
      const currentY = Number(moveEvent.clientY) || startY;
      if (Math.abs(currentX - startX) + Math.abs(currentY - startY) < 5) return;
      moved = true;
      const timelineRect = timelineContainer.getBoundingClientRect?.() || { left: 0, top: 0 };
      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      marquee?.classList.remove('hidden');
      if (marquee) {
        marquee.style.left = `${left - timelineRect.left + timelineContainer.scrollLeft}px`;
        marquee.style.top = `${top - timelineRect.top}px`;
        marquee.style.width = `${Math.abs(currentX - startX)}px`;
        marquee.style.height = `${Math.abs(currentY - startY)}px`;
      }
      moveEvent.preventDefault?.();
    };
    const up = (upEvent) => {
      mount.ownerDocument.removeEventListener('pointermove', move);
      mount.ownerDocument.removeEventListener('pointerup', up);
      hideMarquee();
      if (!moved) return;
      const rect = {
        left: Math.min(startX, Number(upEvent.clientX) || startX),
        top: Math.min(startY, Number(upEvent.clientY) || startY),
        right: Math.max(startX, Number(upEvent.clientX) || startX),
        bottom: Math.max(startY, Number(upEvent.clientY) || startY)
      };
      options.onTrackMarqueeSelect?.(getTracksInMarquee(rect), {
        additive: Boolean(upEvent.ctrlKey || upEvent.metaKey)
      });
    };
    mount.ownerDocument.addEventListener('pointermove', move);
    mount.ownerDocument.addEventListener('pointerup', up);
    event.preventDefault?.();
  });

  timelineContainer.addEventListener('scroll', () => {
    options.onScroll?.(timelineContainer.scrollLeft);
    drawRuler({
      canvas: rulerCanvas,
      duration: getTimelineDuration(),
      scale: getEffectiveScale(),
      viewportWidth: getRulerViewportWidth(),
      scrollLeft: timelineContainer.scrollLeft
    });
    syncPlayhead();
  });

  ruler.addEventListener('click', (event) => {
    const rect = ruler.getBoundingClientRect?.() || { left: 0, width: ruler.clientWidth || 800 };
    const width = rect.width || ruler.clientWidth || 800;
    const ratio = clamp((event.clientX - rect.left) / width, 0, 1);
    const time = (timelineContainer.scrollLeft + (ratio * width)) / getEffectiveScale();
    options.onSeek?.(time);
  });
  ruler.addEventListener('contextmenu', (event) => {
    const rect = ruler.getBoundingClientRect?.() || { left: 0, width: ruler.clientWidth || 800 };
    const width = rect.width || ruler.clientWidth || 800;
    const ratio = clamp((event.clientX - rect.left) / width, 0, 1);
    event.preventDefault();
    options.onRulerContextMenu?.({
      time: (timelineContainer.scrollLeft + (ratio * width)) / getEffectiveScale(),
      x: event.clientX,
      y: event.clientY
    });
  });

  addLaneButton?.addEventListener('click', () => {
    options.onLaneAdd?.();
  });

  render();

  return {
    root,
    updateState(nextState) {
      const previousSelection = {
        selectedLaneIndex: Number(state.selectedLaneIndex) || 0,
        selectedTrackId: state.selectedTrackId ?? null,
        selectedTrackIds: Array.isArray(state.selectedTrackIds) ? state.selectedTrackIds : []
      };
      const resolvedState = nextState || state;
      const nextSignature = getMixerRenderStateSignature(resolvedState);
      const nextSelectionSignature = JSON.stringify({
        selectedLaneIndex: Number(resolvedState.selectedLaneIndex) || 0,
        selectedTrackId: resolvedState.selectedTrackId ?? null,
        selectedTrackIds: Array.isArray(resolvedState.selectedTrackIds) ? resolvedState.selectedTrackIds : []
      });
      state = resolvedState;
      if (nextSignature === stateSignature) {
        if (nextSelectionSignature === selectionSignature) return;
        selectionSignature = nextSelectionSignature;
        syncSelectionState(previousSelection);
        return;
      }
      stateSignature = nextSignature;
      selectionSignature = nextSelectionSignature;
      render();
    },
    updateScale(nextScale) {
      const normalizedScale = Math.max(0.01, Number(nextScale) || timelineScale);
      const previousEffectiveScale = getEffectiveScale();
      if (Math.abs(normalizedScale - timelineScale) < 0.0001) return;
      timelineScale = normalizedScale;
      if (Math.abs(getEffectiveScale() - previousEffectiveScale) < 0.0001) {
        syncPlayhead();
        return;
      }
      render();
    },
    setPlaying(nextPlaying) {
      isPlaying = Boolean(nextPlaying);
      root.dataset.playing = isPlaying ? 'true' : 'false';
      syncPlayhead();
    },
    setPlayhead(time) {
      playheadTime = Number.isFinite(Number(time)) ? Number(time) : null;
      syncPlayhead();
    },
    getTimelineContainer() {
      return timelineContainer;
    },
    getEffectiveScale() {
      return getEffectiveScale();
    },
    destroy() {
      if (root.parentElement === mount) clearNode(mount);
    }
  };
}

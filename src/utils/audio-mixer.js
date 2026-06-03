function round(value, precision = 4) {
  const factor = 10 ** precision;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getTrackSpan(track = {}) {
  const trimStart = Math.max(0, Number(track.trimStart) || 0);
  const trimEnd = Math.max(trimStart, Number(track.trimEnd) || trimStart);
  return trimEnd - trimStart;
}

function getCopyBaseName(name) {
  return String(name || 'Clip').replace(/\s+\(Copy(?:\s+\d+)?\)$/u, '');
}

export function createMixerLaneState(index, overrides = {}) {
  return {
    muted: false,
    soloed: false,
    name: `Lane ${Math.max(1, Number(index) || 1)}`,
    volume: 1,
    ...overrides,
    volume: Number.isFinite(Number(overrides.volume)) ? Number(overrides.volume) : 1
  };
}

export function createMixerTrackPointer(options = {}) {
  const asset = options.asset || {};
  const sourceTrack = options.sourceTrack || null;
  const trackBuffer = sourceTrack?.buffer || asset.buffer || null;
  const trimStart = Math.max(0, Number(options.trimStart ?? sourceTrack?.trimStart) || 0);
  const trimEnd = sourceTrack
    ? Math.max(trimStart, Number(options.trimEnd ?? sourceTrack.trimEnd) || trimStart)
    : Math.max(trimStart, Number(options.trimEnd ?? trackBuffer?.duration) || trimStart);
  const mixerMeta = {
    ...(asset.mixerMeta || {}),
    ...(sourceTrack?.mixerMeta || {})
  };
  const metadata = {};
  if (sourceTrack?.kind || asset.kind || mixerMeta.kind) metadata.kind = sourceTrack?.kind ?? asset.kind ?? mixerMeta.kind;
  if (sourceTrack?.file || asset.file || mixerMeta.file) metadata.file = sourceTrack?.file ?? asset.file ?? mixerMeta.file;
  if (sourceTrack?.fileName || asset.fileName || mixerMeta.fileName) metadata.fileName = sourceTrack?.fileName ?? asset.fileName ?? mixerMeta.fileName;
  if (Object.keys(mixerMeta).length) metadata.mixerMeta = mixerMeta;
  return {
    id: options.id ?? `${Date.now()}-${Math.random()}`,
    assetId: sourceTrack?.assetId ?? asset.id,
    name: sourceTrack?.name ?? asset.name ?? 'Clip',
    buffer: trackBuffer,
    ...metadata,
    laneIndex: Math.max(0, Number(options.laneIndex) || 0),
    offset: Math.max(0, Number(options.offset) || 0),
    trimStart,
    trimEnd,
    volume: Number.isFinite(Number(sourceTrack?.volume)) ? Number(sourceTrack.volume) : 1,
    volumeAutomation: Array.isArray(options.volumeAutomation)
      ? options.volumeAutomation.map((point) => ({ ...point }))
      : sourceTrack?.volumeAutomation
        ? JSON.parse(JSON.stringify(sourceTrack.volumeAutomation))
        : [],
    fadeStyle: options.fadeStyle ?? sourceTrack?.fadeStyle ?? 'linear',
    fadeIn: Number(options.fadeIn ?? sourceTrack?.fadeIn) || 0,
    fadeOut: Number(options.fadeOut ?? sourceTrack?.fadeOut) || 0,
    muted: false,
    soloed: false,
    waveform: sourceTrack?.waveform || asset.waveform || null
  };
}

export function getMixerTimelineDuration(tracks = []) {
  return round(
    tracks.reduce((furthestEdge, track) => {
      const offset = Math.max(0, Number(track.offset) || 0);
      return Math.max(furthestEdge, offset + getTrackSpan(track));
    }, 0)
  );
}

export function getMixerZoomToFit(options = {}) {
  const duration = Math.max(
    0,
    Number(options.duration) || 0,
    getMixerTimelineDuration(options.tracks || [])
  );
  if (duration <= 0) return round(clamp(Number(options.minScale) || 0.1, 0.1, Number(options.maxScale) || 500));
  const viewportWidth = Math.max(0, Number(options.viewportWidth) || 0);
  const padding = Math.max(0, Number(options.padding) || 0);
  const availableWidth = Math.max(1, viewportWidth - padding);
  return round(
    clamp(
      availableWidth / duration,
      Number(options.minScale) || 0.1,
      Number(options.maxScale) || 500
    )
  );
}

export function getAnchoredMixerScrollLeft(options = {}) {
  const oldScale = Math.max(0.0001, Number(options.oldScale) || 0.0001);
  const newScale = Math.max(0.0001, Number(options.newScale) || oldScale);
  const viewportWidth = Math.max(0, Number(options.viewportWidth) || 0);
  const scrollLeft = Math.max(0, Number(options.scrollLeft) || 0);
  const explicitAnchorTime = Number(options.anchorTime);
  const anchorRatio = clamp(Number(options.anchorRatio), 0, 1);
  const anchorOffset = Number.isFinite(Number(options.anchorOffset))
    ? Number(options.anchorOffset)
    : viewportWidth * (Number.isFinite(explicitAnchorTime) ? 0.5 : (Number.isFinite(anchorRatio) ? anchorRatio : 0.5));
  const anchorTime = Number.isFinite(explicitAnchorTime)
    ? Math.max(0, explicitAnchorTime)
    : (scrollLeft + anchorOffset) / oldScale;
  return round(Math.max(0, (anchorTime * newScale) - anchorOffset));
}

export function getMixerDropPlacement(options = {}) {
  const scale = Math.max(0.01, Number(options.scale) || 0.01);
  const laneHeight = Math.max(1, Number(options.laneHeight) || 1);
  const laneCount = Math.max(1, Math.floor(Number(options.laneCount) || 1));
  const clientX = Number(options.clientX) || 0;
  const clientY = Number(options.clientY) || 0;
  const timelineLeft = Number(options.timelineLeft) || 0;
  const lanesTop = Number(options.lanesTop) || 0;
  const scrollLeft = Math.max(0, Number(options.scrollLeft) || 0);
  return {
    laneIndex: clamp(Math.floor((clientY - lanesTop) / laneHeight), 0, laneCount - 1),
    offset: round(Math.max(0, (clientX - timelineLeft + scrollLeft) / scale))
  };
}

export function getMixerTrimPreviewValue(options = {}) {
  const scale = Math.max(0.01, Number(options.scale) || 0.01);
  const initialValue = Math.max(0, Number(options.initialValue) || 0);
  const initialClientX = Number(options.initialClientX) || 0;
  const currentClientX = Number(options.currentClientX) || 0;
  return round(Math.max(0, initialValue + ((currentClientX - initialClientX) / scale)));
}

export function getMixerTrackMovePreview(options = {}) {
  const scale = Math.max(0.01, Number(options.scale) || 0.01);
  const laneHeight = Math.max(1, Number(options.laneHeight) || 1);
  const laneCount = Math.max(0, Math.floor(Number(options.laneCount) || 0));
  const initialOffset = Math.max(0, Number(options.initialOffset) || 0);
  const initialLaneIndex = Math.max(0, Math.floor(Number(options.initialLaneIndex) || 0));
  const initialClientX = Number(options.initialClientX) || 0;
  const initialClientY = Number(options.initialClientY) || 0;
  const currentClientX = Number(options.currentClientX) || 0;
  const currentClientY = Number(options.currentClientY) || 0;
  const offset = round(Math.max(0, initialOffset + ((currentClientX - initialClientX) / scale)));
  const laneIndex = initialLaneIndex + Math.round((currentClientY - initialClientY) / laneHeight);
  const laneTarget = laneIndex >= laneCount ? laneCount : clamp(laneIndex, 0, Math.max(0, laneCount - 1));

  return {
    offset,
    laneIndex,
    laneTarget,
    createLane: laneIndex >= laneCount,
    translateX: Math.round((offset - initialOffset) * scale),
    translateY: Math.round(currentClientY - initialClientY)
  };
}

export function formatMixerTime(seconds) {
  const whole = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatMixerRulerTime(seconds, step) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const decimals = step < 0.1 ? 3 : step < 1 ? 2 : 0;
  const whole = Math.floor(safeSeconds);
  const fraction = safeSeconds - whole;
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  const base = hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  if (!decimals) return base;
  const fractionValue = Math.round(fraction * (10 ** decimals));
  return `${base}.${String(fractionValue).padStart(decimals, '0')}`;
}

export function buildMixerRulerTicks(options = {}) {
  const duration = Math.max(1, Number(options.duration) || 1);
  const scale = Math.max(0.01, Number(options.scale) || 0.01);
  const viewportWidth = Math.max(1, Number(options.viewportWidth) || 0);
  const visibleSpan = Math.max(
    0.1,
    Math.min(
      duration,
      Number(options.visibleSpan) || (viewportWidth / scale) || duration
    )
  );
  const steps = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
  const targetMajorCount = clamp(Math.floor(viewportWidth / 48) || 12, 6, 24);
  const desiredStep = visibleSpan / targetMajorCount;
  const majorStep = steps.find((step) => step >= desiredStep) || steps.at(-1);
  const minorStep = majorStep / 2;
  const ticks = [];

  for (let time = 0; time <= duration + minorStep; time += minorStep) {
    const normalizedTime = round(time, 4);
    const major = Math.abs((normalizedTime / majorStep) - Math.round(normalizedTime / majorStep)) < 0.0001;
    ticks.push({
      time: normalizedTime,
      major,
      label: major ? formatMixerRulerTime(normalizedTime, majorStep) : ''
    });
  }

  return ticks;
}

export function getMixerFadeValueAt(style = 'linear', progress = 0, direction = 'in') {
  const safeProgress = clamp(Number(progress) || 0, 0, 1);
  if (style === 'equal-power') {
    return direction === 'out'
      ? Math.cos(safeProgress * (Math.PI / 2))
      : Math.sin(safeProgress * (Math.PI / 2));
  }
  if (style === 'logarithmic') {
    const floor = 0.001;
    return direction === 'out'
      ? floor * Math.pow(1 / floor, 1 - safeProgress)
      : floor * Math.pow(1 / floor, safeProgress);
  }
  return direction === 'out' ? 1 - safeProgress : safeProgress;
}

export function getMixerTrackFadeMultiplierAt(track = {}, laneTracks = [], clipTime = 0) {
  const safeClipTime = Math.max(0, Number(clipTime) || 0);
  const clipDuration = getTrackSpan(track);
  const trackIndex = laneTracks.findIndex((entry) => entry.id === track.id);
  if (trackIndex < 0 || clipDuration <= 0) return 1;

  let multiplier = 1;
  if (trackIndex > 0) {
    const previousTrack = laneTracks[trackIndex - 1];
    const previousOverlap = (Number(previousTrack.offset) || 0) + getTrackSpan(previousTrack) - (Number(track.offset) || 0);
    if (previousOverlap > 0 && safeClipTime < previousOverlap) {
      multiplier *= getMixerFadeValueAt(track.fadeStyle, safeClipTime / previousOverlap, 'in');
    }
  }

  if (trackIndex < laneTracks.length - 1) {
    const nextTrack = laneTracks[trackIndex + 1];
    const nextOverlap = ((Number(track.offset) || 0) + clipDuration) - (Number(nextTrack.offset) || 0);
    if (nextOverlap > 0) {
      const fadeOutStart = Math.max(0, (Number(nextTrack.offset) || 0) - (Number(track.offset) || 0));
      if (safeClipTime >= fadeOutStart) {
        multiplier *= getMixerFadeValueAt(nextTrack.fadeStyle, (safeClipTime - fadeOutStart) / nextOverlap, 'out');
      }
    }
  }

  return round(clamp(multiplier, 0, 1), 6);
}

export function buildMixerTrackGainPoints(track = {}, laneTracks = [], options = {}) {
  const clipDuration = getTrackSpan(track);
  const fromTime = clamp(Number(options.fromTime) || 0, 0, clipDuration);
  const subdivisions = Math.max(4, Number(options.subdivisions) || 12);
  const automation = Array.isArray(track.volumeAutomation) ? track.volumeAutomation : [];
  const times = new Set([fromTime, clipDuration]);
  const trackIndex = laneTracks.findIndex((entry) => entry.id === track.id);

  automation.forEach((point) => {
    const time = clamp(Number(point?.time) || 0, 0, clipDuration);
    if (time >= fromTime && time <= clipDuration) times.add(round(time, 4));
  });

  if (trackIndex > 0) {
    const previousTrack = laneTracks[trackIndex - 1];
    const previousOverlap = (Number(previousTrack.offset) || 0) + getTrackSpan(previousTrack) - (Number(track.offset) || 0);
    if (previousOverlap > 0) {
      for (let index = 0; index <= subdivisions; index += 1) {
        const time = (previousOverlap * index) / subdivisions;
        if (time >= fromTime && time <= clipDuration) times.add(round(time, 4));
      }
    }
  }

  if (trackIndex >= 0 && trackIndex < laneTracks.length - 1) {
    const nextTrack = laneTracks[trackIndex + 1];
    const nextOverlap = ((Number(track.offset) || 0) + clipDuration) - (Number(nextTrack.offset) || 0);
    if (nextOverlap > 0) {
      const fadeOutStart = Math.max(0, (Number(nextTrack.offset) || 0) - (Number(track.offset) || 0));
      for (let index = 0; index <= subdivisions; index += 1) {
        const time = fadeOutStart + ((nextOverlap * index) / subdivisions);
        if (time >= fromTime && time <= clipDuration) times.add(round(time, 4));
      }
    }
  }

  return Array.from(times)
    .sort((left, right) => left - right)
    .map((time) => ({
      time,
      value: round(
        getMixerAutomationValueAt(automation, time, track.volume) *
        getMixerTrackFadeMultiplierAt(track, laneTracks, time),
        6
      )
    }))
    .reduce((accumulator, point) => {
      const previous = accumulator[accumulator.length - 1];
      if (previous && Math.abs(previous.time - point.time) < 0.0001) {
        previous.value = point.value;
        return accumulator;
      }
      accumulator.push(point);
      return accumulator;
    }, []);
}

export function getTrackCopyName(sourceName, existingNames = []) {
  const baseName = getCopyBaseName(sourceName);
  const escapedBase = baseName.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const matcher = new RegExp(`^${escapedBase}\\s+\\(Copy(?:\\s+(\\d+))?\\)$`, 'u');
  let maxCopyNumber = 0;

  existingNames.forEach((name) => {
    if (String(name) === baseName) {
      maxCopyNumber = Math.max(maxCopyNumber, 0);
      return;
    }
    const match = String(name).match(matcher);
    if (!match) return;
    const copyNumber = match[1] ? Number(match[1]) : 1;
    maxCopyNumber = Math.max(maxCopyNumber, copyNumber);
  });

  return `${baseName} (Copy${maxCopyNumber >= 1 ? ` ${maxCopyNumber + 1}` : ''})`;
}

export function getTrackWaveformCanvasMetrics(options = {}) {
  const displayWidth = Math.max(1, Math.round(Math.max(0, Number(options.duration) || 0) * Math.max(0.1, Number(options.scale) || 0.1)));
  const dpr = Math.max(1, Number(options.dpr) || 1);
  const height = Math.max(1, Math.round(Number(options.height) || 90));
  const maxRenderWidth = Math.max(256, Math.round(Number(options.maxRenderWidth) || 4096));
  return {
    displayWidth,
    renderWidth: Math.min(maxRenderWidth, Math.max(1, Math.ceil(displayWidth * dpr))),
    renderHeight: Math.max(1, Math.ceil(height * dpr))
  };
}

export function resolveMixerAudibility(options = {}) {
  const lanes = Array.isArray(options.lanes) ? options.lanes : [];
  const tracks = Array.isArray(options.tracks) ? options.tracks : [];
  const hasSolo = lanes.some((lane) => lane?.soloed) || tracks.some((track) => track?.soloed);
  const trackAudibility = {};
  const laneAudibility = lanes.map((lane, laneIndex) => {
    const laneHasSoloTrack = tracks.some((track) => track.laneIndex === laneIndex && track.soloed);
    return !lane?.muted && (!hasSolo || lane?.soloed || laneHasSoloTrack);
  });

  tracks.forEach((track) => {
    const lane = lanes[track.laneIndex];
    trackAudibility[track.id] = Boolean(
      lane &&
      !track.muted &&
      !lane.muted &&
      (!hasSolo || track.soloed || lane.soloed)
    );
  });

  return {
    hasSolo,
    laneAudibility,
    trackAudibility
  };
}

export function getMixerAutomationValueAt(automation = [], time = 0, fallback = 1) {
  const safeFallback = clamp(Number(fallback), 0, 2);
  const points = Array.isArray(automation)
    ? automation
      .map((point) => ({
        time: Math.max(0, Number(point?.time) || 0),
        value: clamp(Number(point?.value), 0, 2)
      }))
      .sort((left, right) => left.time - right.time)
    : [];
  const safeTime = Math.max(0, Number(time) || 0);

  if (!points.length) return safeFallback;

  const firstPoint = points[0];
  if (safeTime <= firstPoint.time) {
    if (firstPoint.time <= 0) return firstPoint.value;
    const ratio = safeTime / firstPoint.time;
    return round(safeFallback + ((firstPoint.value - safeFallback) * ratio));
  }

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const next = points[index];
    if (safeTime > next.time) continue;
    const span = Math.max(0.0001, next.time - previous.time);
    const ratio = (safeTime - previous.time) / span;
    return round(previous.value + ((next.value - previous.value) * ratio));
  }

  return points.at(-1).value;
}

export function snapTimeToGrid(time, gridSize) {
  if (!gridSize || gridSize <= 0) return time;
  return Math.round(time / gridSize) * gridSize;
}

export function snapTimeToClips(time, tracks, excludeTrackId = null, threshold = 0.1) {
  let bestSnap = time;
  let minDiff = threshold;

  tracks.forEach(track => {
    if (track.id === excludeTrackId) return;
    const start = track.offset;
    const end = track.offset + (track.trimEnd - track.trimStart);
    
    [start, end].forEach(edge => {
      const diff = Math.abs(time - edge);
      if (diff < minDiff) {
        minDiff = diff;
        bestSnap = edge;
      }
    });
  });

  return bestSnap;
}

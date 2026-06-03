function round(value) {
  return Number(Number(value || 0).toFixed(3));
}

export function getMinimumViewportDuration(duration, minimumSeconds = 3) {
  const safeDuration = Math.max(0.1, Number(duration) || 0.1);
  return round(Math.min(safeDuration, Math.max(0.1, Number(minimumSeconds) || 3)));
}

export function getViewportDurationForSlider(duration, sliderValue, minimumSeconds = 3) {
  const safeDuration = Math.max(0.1, Number(duration) || 0.1);
  const minimumViewport = getMinimumViewportDuration(safeDuration, minimumSeconds);
  if (safeDuration <= minimumViewport) return safeDuration;
  const normalized = Math.max(0, Math.min(1, (Number(sliderValue) || 0) / 100));
  const ratio = minimumViewport / safeDuration;
  return round(safeDuration * Math.pow(ratio, normalized));
}

export function getSliderValueForViewportDuration(duration, viewportDuration, minimumSeconds = 3) {
  const safeDuration = Math.max(0.1, Number(duration) || 0.1);
  const safeViewport = Math.max(0.1, Number(viewportDuration) || safeDuration);
  const minimumViewport = getMinimumViewportDuration(safeDuration, minimumSeconds);
  if (safeDuration <= minimumViewport) return 100;
  const clampedViewport = Math.max(minimumViewport, Math.min(safeDuration, safeViewport));
  const ratio = minimumViewport / safeDuration;
  const normalized = Math.log(clampedViewport / safeDuration) / Math.log(ratio);
  return round(Math.max(0, Math.min(100, normalized * 100)));
}

export function clampTrimRange(options) {
  const duration = Math.max(0, Number(options?.duration) || 0);
  const minSpan = Math.max(0.01, Number(options?.minSpan) || 0.1);
  const safeEnd = Math.min(duration, Math.max(0, Number(options?.end) || duration || minSpan));
  const safeStart = Math.max(0, Math.min(Number(options?.start) || 0, safeEnd));
  let start = safeStart;
  let end = safeEnd;
  if ((end - start) < minSpan) {
    if ((end - minSpan) >= 0) {
      start = end - minSpan;
    } else {
      start = 0;
      end = Math.min(duration, minSpan);
    }
    if ((end - start) < minSpan) {
      start = Math.max(0, duration - minSpan);
      end = duration;
    }
  }
  return {
    start: round(start),
    end: round(end),
    duration: round(duration),
    minSpan: round(minSpan),
    span: round(end - start)
  };
}

export function getWaveformPeakAmplitude(pyramid) {
  if (pyramid?.peak && pyramid.peak > 0.0001) return pyramid.peak;
  const levels = pyramid?.levels || [];
  let peak = 0.0001;
  // Use the highest resolution level for the most accurate peak
  if (levels.length > 0) {
    const level = levels[0];
    const mins = Array.isArray(level?.min) ? level.min : [];
    const maxes = Array.isArray(level?.max) ? level.max : [];
    for (let i = 0; i < mins.length; i++) {
      const val = Math.max(Math.abs(mins[i] || 0), Math.abs(maxes[i] || 0));
      if (val > peak) peak = val;
    }
  }
  return round(peak);
}

export function shouldResetPlayheadToRangeStart(options = {}) {
  const playhead = options.playhead;
  if (!Number.isFinite(playhead)) return false;
  const rangeStart = Math.max(0, Number(options.rangeStart) || 0);
  const rangeEnd = Math.max(rangeStart, Number(options.rangeEnd) || rangeStart);
  const now = Number(options.now) || 0;
  const lastResetAt = Number(options.lastResetAt);
  const minInterval = Math.max(0, Number(options.minInterval) || 1000);
  if (playhead < rangeStart || playhead >= rangeEnd) {
    if (!Number.isFinite(lastResetAt)) return true;
    return (now - lastResetAt) >= minInterval;
  }
  return false;
}

export function resolveTrimViewport(options) {
  const duration = Math.max(0.1, Number(options?.duration) || 0.1);
  const zoom = Math.max(1, Number(options?.zoom) || 1);
  const selection = clampTrimRange({
    start: options?.selectionStart,
    end: options?.selectionEnd,
    duration,
    minSpan: options?.minSpan || 0.1
  });
  const span = round(duration / zoom);
  const center = (selection.start + selection.end) / 2;
  const maxStart = Math.max(0, duration - span);
  const start = Math.max(0, Math.min(maxStart, center - (span / 2)));
  const end = Math.min(duration, start + span);
  return {
    duration: round(duration),
    zoom: round(zoom),
    start: round(start),
    end: round(end),
    span: round(end - start)
  };
}

export function buildWaveformPeaks(options) {
  const samples = options?.samples;
  const bins = Math.max(1, Math.floor(Number(options?.bins) || 1));
  if (!samples?.length) return Array.from({ length: bins }, () => 0);
  const windowSize = samples.length / bins;
  const peaks = [];
  for (let index = 0; index < bins; index += 1) {
    const start = Math.floor(index * windowSize);
    const end = Math.min(samples.length, Math.floor((index + 1) * windowSize) || (start + 1));
    let peak = 0;
    for (let offset = start; offset < end; offset += 1) {
      peak = Math.max(peak, Math.abs(samples[offset] || 0));
    }
    peaks.push(Number(Math.min(1, peak).toFixed(4)));
  }
  return peaks;
}

function buildMinMaxLevel(minSamples, maxSamples) {
  const bins = minSamples.length;
  return {
    bins,
    min: Array.from(minSamples, (value) => Number(Math.max(-1, Math.min(0, value)).toFixed(4))),
    max: Array.from(maxSamples, (value) => Number(Math.max(0, Math.min(1, value)).toFixed(4)))
  };
}

export function buildWaveformPyramid(options) {
  const samples = options?.samples;
  const maxBins = Math.max(1, Math.floor(Number(options?.maxBins) || 8192));
  if (!samples?.length) {
    return {
      peak: 0.0001,
      levels: [{ bins: maxBins, min: Array.from({ length: maxBins }, () => 0), max: Array.from({ length: maxBins }, () => 0) }]
    };
  }
  const targetBins = Math.min(maxBins, samples.length);
  const baseMin = new Float32Array(targetBins);
  const baseMax = new Float32Array(targetBins);
  const windowSize = samples.length / targetBins;
  
  let globalPeak = 0.0001;

  for (let index = 0; index < targetBins; index += 1) {
    const start = Math.floor(index * windowSize);
    const end = Math.min(samples.length, Math.floor((index + 1) * windowSize) || (start + 1));
    let min = 0;
    let max = 0;
    for (let offset = start; offset < end; offset += 1) {
      const sample = samples[offset] || 0;
      if (sample < min) min = sample;
      if (sample > max) max = sample;
      const abs = Math.abs(sample);
      if (abs > globalPeak) globalPeak = abs;
    }
    baseMin[index] = min;
    baseMax[index] = max;
  }

  const levels = [];
  let currentMin = baseMin;
  let currentMax = baseMax;
  
  while (currentMin.length > 0) {
    levels.push(buildMinMaxLevel(currentMin, currentMax));
    if (currentMin.length === 1) break;
    
    const nextBins = Math.max(1, Math.floor(currentMin.length / 2));
    const nextMin = new Float32Array(nextBins);
    const nextMax = new Float32Array(nextBins);
    for (let index = 0; index < nextBins; index += 1) {
      const sourceIndex = index * 2;
      const hasNext = sourceIndex + 1 < currentMin.length;
      nextMin[index] = hasNext 
        ? Math.min(currentMin[sourceIndex], currentMin[sourceIndex + 1])
        : currentMin[sourceIndex];
      nextMax[index] = hasNext
        ? Math.max(currentMax[sourceIndex], currentMax[sourceIndex + 1])
        : currentMax[sourceIndex];
    }
    currentMin = nextMin;
    currentMax = nextMax;
  }

  return {
    peak: round(globalPeak),
    levels
  };
}

export function pickWaveformLevel(pyramid, width) {
  const levels = pyramid?.levels || [];
  if (!levels.length) return { bins: 0, min: [], max: [] };
  const targetBins = Math.max(1, Math.floor(Number(width) || 1));
  return levels.reduce((best, level) => {
    if (!best) return level;
    return Math.abs(level.bins - targetBins) < Math.abs(best.bins - targetBins) ? level : best;
  }, null);
}

export function getViewportWaveformSignature(options = {}) {
  const start = Number(Number(options.viewportStart || 0).toFixed(3));
  const end = Number(Number(options.viewportEnd || 0).toFixed(3));
  const width = Math.max(1, Math.round(Number(options.width) || 1));
  const sampleRate = Math.max(1, Math.round(Number(options.sampleRate) || 1));
  const sampleLength = Math.max(0, Math.round(Number(options.sampleLength) || 0));
  return `${start.toFixed(3)}:${end.toFixed(3)}:${width}:${sampleRate}:${sampleLength}`;
}

export function buildViewportWaveformLevel(options = {}) {
  const samples = options.samples;
  const sampleRate = Math.max(1, Number(options.sampleRate) || 1);
  const viewportStart = Math.max(0, Number(options.viewportStart) || 0);
  const viewportEnd = Math.max(viewportStart + (1 / sampleRate), Number(options.viewportEnd) || viewportStart);
  const bins = Math.max(1, Math.round(Number(options.width) || 1));
  if (!samples?.length) {
    return {
      bins,
      min: Array.from({ length: bins }, () => 0),
      max: Array.from({ length: bins }, () => 0)
    };
  }
  const min = [];
  const max = [];
  const span = viewportEnd - viewportStart;
  for (let index = 0; index < bins; index += 1) {
    const startTime = viewportStart + ((index / bins) * span);
    const endTime = viewportStart + (((index + 1) / bins) * span);
    const startIndex = Math.max(0, Math.min(samples.length - 1, Math.floor(startTime * sampleRate)));
    const endIndex = Math.max(startIndex + 1, Math.min(samples.length, Math.ceil(endTime * sampleRate)));
    let sampleMin = 0;
    let sampleMax = 0;
    for (let offset = startIndex; offset < endIndex; offset += 1) {
      const sample = samples[offset] || 0;
      if (sample < sampleMin) sampleMin = sample;
      if (sample > sampleMax) sampleMax = sample;
    }
    min.push(Number(Math.max(-1, Math.min(0, sampleMin)).toFixed(4)));
    max.push(Number(Math.max(0, Math.min(1, sampleMax)).toFixed(4)));
  }
  return { bins, min, max };
}

export function resolveViewportWaveformPlan(options = {}) {
  const width = Math.max(1, Math.round(Number(options.width) || 1));
  const sampleRate = Math.max(1, Math.round(
    Number(options.sampleRate) ||
    Number(options.waveform?.sampleRate) ||
    1
  ));
  const samples = options.samples instanceof Float32Array ? options.samples : null;
  const viewportStart = Math.max(0, Number(options.viewportStart) || 0);
  const viewportEnd = Math.max(viewportStart, Number(options.viewportEnd) || viewportStart);
  const signature = getViewportWaveformSignature({
    viewportStart,
    viewportEnd,
    width,
    sampleRate,
    sampleLength: samples?.length || 0
  });
  const immediateLevel = pickWaveformLevel(options.waveform, width * 2);
  const canBuildDetail = !!samples?.length && viewportEnd > viewportStart && width > 0;
  const viewportLevel = canBuildDetail && options.includeViewportLevel !== false
    ? buildViewportWaveformLevel({
      samples,
      sampleRate,
      viewportStart,
      viewportEnd,
      width
    })
    : null;
  return {
    signature,
    immediateLevel,
    viewportLevel,
    needsViewportDetail: canBuildDetail
  };
}

function formatClock(value, options = {}) {
  const total = Math.max(0, Number(value) || 0);
  const whole = Math.floor(total);
  const hours = Math.floor(whole / 3600);
  const mins = Math.floor((whole % 3600) / 60);
  const secs = Math.floor(whole % 60);
  const milliseconds = Math.floor((total - whole) * 1000);
  const showMilliseconds = (Number(options.viewportSpan) || 0) < 10 || (Number(options.tickStep) || 0) < 1;
  if (hours > 0) {
    const base = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return showMilliseconds ? `${base}.${String(milliseconds).padStart(3, '0')}` : base;
  }
  if (showMilliseconds) {
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function chooseTickStep(secondsPerTick) {
  const steps = [
    0.01, 0.02, 0.05,
    0.1, 0.2, 0.5,
    1, 2, 5,
    10, 15, 30,
    60, 120, 300,
    600, 900, 1800,
    3600
  ];
  return steps.find((step) => step >= secondsPerTick) || steps.at(-1);
}

export function buildTimeRulerTicks(options) {
  const width = Math.max(1, Number(options?.width) || 1);
  const viewportStart = Math.max(0, Number(options?.viewportStart) || 0);
  const viewportEnd = Math.max(viewportStart, Number(options?.viewportEnd) || viewportStart);
  const minPixelSpacing = Math.max(10, Number(options?.minPixelSpacing) || 60);
  const viewportSpan = Math.max(0.001, viewportEnd - viewportStart);
  const tickStep = chooseTickStep((viewportSpan / width) * minPixelSpacing);
  const firstTick = Math.ceil(viewportStart / tickStep) * tickStep;
  const ticks = [];
  for (let time = firstTick; time <= viewportEnd + 0.0001; time += tickStep) {
    ticks.push({
      time: round(time),
      ratio: (time - viewportStart) / viewportSpan,
      label: formatClock(time, { viewportSpan, tickStep })
    });
  }
  if (!ticks.length || ticks[0].time !== round(viewportStart)) {
    ticks.unshift({
      time: round(viewportStart),
      ratio: 0,
      label: formatClock(viewportStart, { viewportSpan, tickStep })
    });
  }
  return ticks;
}

import { transformPitchAndSpeed } from './audio-stretch.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value) {
  return Number(Number(value || 0).toFixed(4));
}

function normalizeRange(start, end) {
  const safeStart = Number(start) || 0;
  const safeEnd = Number(end) || 0;
  return safeStart <= safeEnd
    ? { start: safeStart, end: safeEnd }
    : { start: safeEnd, end: safeStart };
}

function dbToGain(value) {
  return Math.pow(10, (Number(value) || 0) / 20);
}

function smoothRatio(value) {
  const ratio = clamp(Number(value) || 0, 0, 1);
  return (ratio * ratio) * (3 - (2 * ratio));
}

function applyLowPassRange(output, startIndex, endIndex, rate, cutoffHz) {
  const cutoff = Math.max(20, Number(cutoffHz) || 1200);
  const dt = 1 / rate;
  const rc = 1 / (2 * Math.PI * cutoff);
  const alpha = dt / (rc + dt);
  let previous = 0;
  for (let index = startIndex; index < endIndex; index += 1) {
    previous += alpha * (output[index] - previous);
    output[index] = previous;
  }
}

function applyHighPassRange(output, startIndex, endIndex, rate, cutoffHz) {
  const cutoff = Math.max(20, Number(cutoffHz) || 1200);
  const dt = 1 / rate;
  const rc = 1 / (2 * Math.PI * cutoff);
  const alpha = rc / (rc + dt);
  let previousInput = 0;
  let previousOutput = 0;
  for (let index = startIndex; index < endIndex; index += 1) {
    const currentInput = output[index];
    previousOutput = alpha * (previousOutput + currentInput - previousInput);
    output[index] = previousOutput;
    previousInput = currentInput;
  }
}

function getBandEdges(effect) {
  if (Number.isFinite(Number(effect.lowHz)) && Number.isFinite(Number(effect.highHz))) {
    const lowHz = Math.max(20, Number(effect.lowHz));
    const highHz = Math.max(lowHz + 20, Number(effect.highHz));
    return { lowHz, highHz };
  }
  const centerHz = Math.max(40, Number(effect.centerHz) || Number(effect.cutoffHz) || 1200);
  const q = Math.max(0.2, Number(effect.q) || 1.2);
  const width = Math.max(40, centerHz / q);
  return {
    lowHz: Math.max(20, centerHz - (width / 2)),
    highHz: Math.max(60, centerHz + (width / 2))
  };
}

function applyBandPassRange(output, startIndex, endIndex, rate, effect) {
  const { lowHz, highHz } = getBandEdges(effect || {});
  applyHighPassRange(output, startIndex, endIndex, rate, lowHz);
  applyLowPassRange(output, startIndex, endIndex, rate, highHz);
}

function applyNotchRange(output, startIndex, endIndex, rate, effect) {
  const band = output.slice();
  applyBandPassRange(band, startIndex, endIndex, rate, effect);
  const depth = clamp(Number(effect.depth) || 1, 0, 1);
  for (let index = startIndex; index < endIndex; index += 1) {
    output[index] -= band[index] * depth;
  }
}

function applyCompressionRange(output, startIndex, endIndex, effect) {
  const thresholdDb = Number.isFinite(Number(effect.thresholdDb)) ? Number(effect.thresholdDb) : -18;
  const ratio = Math.max(1, Number(effect.ratio) || 3);
  const makeupGain = dbToGain(Number(effect.makeupDb) || 0);
  for (let index = startIndex; index < endIndex; index += 1) {
    const sample = output[index];
    const absolute = Math.max(0.000001, Math.abs(sample));
    const db = 20 * Math.log10(absolute);
    if (db <= thresholdDb) {
      output[index] = sample * makeupGain;
      continue;
    }
    const compressedDb = thresholdDb + ((db - thresholdDb) / ratio);
    const gain = dbToGain(compressedDb - db) * makeupGain;
    output[index] = sample * gain;
  }
}

function applySaturationRange(output, startIndex, endIndex, effect) {
  const drive = Math.max(1, Number(effect.drive) || 2);
  const mix = clamp(Number(effect.mix) || 1, 0, 1);
  const normalizer = Math.tanh(drive) || 1;
  for (let index = startIndex; index < endIndex; index += 1) {
    const dry = output[index];
    const wet = Math.tanh(dry * drive) / normalizer;
    output[index] = (dry * (1 - mix)) + (wet * mix);
  }
}

function applyReverbRange(output, startIndex, endIndex, rate, effect) {
  const delaySamples = Math.max(1, Math.round(Math.max(0.002, Number(effect.delay) || 0.035) * rate));
  const decay = clamp(Number(effect.decay) || 0.32, 0, 0.95);
  const wet = clamp(Number(effect.wet) || 0.28, 0, 1);
  const source = output.slice();
  for (let index = startIndex; index < endIndex; index += 1) {
    let reflected = 0;
    let gain = decay;
    for (let tap = 1; tap <= 4; tap += 1) {
      const readIndex = index - (delaySamples * tap);
      if (readIndex < startIndex) break;
      reflected += source[readIndex] * gain;
      gain *= decay;
    }
    output[index] = (source[index] * (1 - wet)) + ((source[index] + reflected) * wet);
  }
}

function applyPitchRange(output, startIndex, endIndex, rate, effect) {
  const section = output.slice(startIndex, endIndex);
  const shifted = transformPitchAndSpeed(section, {
    sampleRate: rate,
    speed: 1,
    pitchSemitones: clamp(Number(effect.semitones) || 0, -24, 24)
  });
  for (let offset = 0; offset < section.length; offset += 1) {
    output[startIndex + offset] = shifted[Math.min(shifted.length - 1, offset)] || 0;
  }
}

function applyFormantShiftRange(output, startIndex, endIndex, rate, effect) {
  const semitones = clamp(Number(effect.semitones) || 3, -12, 12);
  const ratio = Math.pow(2, semitones / 12);
  applyHighPassRange(output, startIndex, endIndex, rate, clamp(260 * ratio, 80, 1800));
  applyLowPassRange(output, startIndex, endIndex, rate, clamp(3400 * ratio, 900, 7600));
  applySaturationRange(output, startIndex, endIndex, { drive: 1.25, mix: 0.28 });
}

function applyBandReductionRange(output, startIndex, endIndex, rate, effect) {
  const band = output.slice();
  applyBandPassRange(band, startIndex, endIndex, rate, effect);
  const amount = clamp(Number(effect.amount ?? effect.strength) || 0.65, 0, 1);
  for (let index = startIndex; index < endIndex; index += 1) {
    output[index] -= band[index] * amount;
  }
}

function applyNoiseGateRange(output, startIndex, endIndex, effect) {
  const threshold = clamp(Number(effect.threshold) || dbToGain(Number(effect.thresholdDb) || -38), 0, 1);
  const floorGain = clamp(Number(effect.floorGain) || 0, 0, 1);
  for (let index = startIndex; index < endIndex; index += 1) {
    if (Math.abs(output[index]) < threshold) output[index] *= floorGain;
  }
}

function applyRadioRange(output, startIndex, endIndex, rate, effect) {
  applyHighPassRange(output, startIndex, endIndex, rate, Number(effect.highPassHz) || 480);
  applyLowPassRange(output, startIndex, endIndex, rate, Number(effect.lowPassHz) || 2600);
  applyCompressionRange(output, startIndex, endIndex, { thresholdDb: -20, ratio: 5, makeupDb: 2 });
  applySaturationRange(output, startIndex, endIndex, { drive: Number(effect.drive) || 2, mix: Number(effect.mix) || 0.55 });
}

function normalizeEnvelopePoints(points = []) {
  const entries = (Array.isArray(points) ? points : [])
    .map((point) => ({
      time: round(point?.time),
      gainDb: round(point?.gainDb)
    }))
    .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.gainDb))
    .sort((left, right) => left.time - right.time);

  if (!entries.length) {
    return [
      { time: 0, gainDb: 0 }
    ];
  }

  return entries.reduce((accumulator, point) => {
    const previous = accumulator[accumulator.length - 1];
    if (previous && Math.abs(previous.time - point.time) < 0.0001) {
      previous.gainDb = point.gainDb;
      return accumulator;
    }
    accumulator.push(point);
    return accumulator;
  }, []);
}

function interpolateEnvelopeGain(points, time) {
  const safePoints = normalizeEnvelopePoints(points);
  const safeTime = Number(time) || 0;
  if (safeTime <= safePoints[0].time) return safePoints[0].gainDb;
  if (safeTime >= safePoints[safePoints.length - 1].time) return safePoints[safePoints.length - 1].gainDb;

  for (let index = 1; index < safePoints.length; index += 1) {
    const left = safePoints[index - 1];
    const right = safePoints[index];
    if (safeTime > right.time) continue;
    const span = Math.max(0.0001, right.time - left.time);
    const ratio = smoothRatio((safeTime - left.time) / span);
    return round(left.gainDb + ((right.gainDb - left.gainDb) * ratio));
  }

  return safePoints[safePoints.length - 1].gainDb;
}

export function resolveVolumeEnvelope({ clipStart = 0, clipEnd = 0, points = [] } = {}) {
  const bounds = normalizeRange(clipStart, clipEnd);
  const safePoints = normalizeEnvelopePoints(points);
  const localPoints = [];
  const boundaryTimes = [bounds.start, bounds.end];

  boundaryTimes.forEach((time) => {
    localPoints.push({
      time: round(time - bounds.start),
      gainDb: interpolateEnvelopeGain(safePoints, time)
    });
  });

  safePoints.forEach((point) => {
    if (point.time <= bounds.start || point.time >= bounds.end) return;
    localPoints.push({
      time: round(point.time - bounds.start),
      gainDb: point.gainDb
    });
  });

  return localPoints
    .sort((left, right) => left.time - right.time)
    .reduce((accumulator, point) => {
      const previous = accumulator[accumulator.length - 1];
      if (previous && Math.abs(previous.time - point.time) < 0.0001) {
        previous.gainDb = point.gainDb;
        return accumulator;
      }
      accumulator.push(point);
      return accumulator;
    }, []);
}

export function applyVolumeEnvelope(samples, { sampleRate = 1, points = [] } = {}) {
  const source = samples instanceof Float32Array ? samples : Float32Array.from(samples || []);
  const output = source.slice();
  if (!output.length) return output;
  const rate = Math.max(1, Number(sampleRate) || 1);
  const duration = output.length / rate;
  const localPoints = resolveVolumeEnvelope({
    clipStart: 0,
    clipEnd: duration,
    points
  });

  for (let index = 0; index < output.length; index += 1) {
    const gainDb = interpolateEnvelopeGain(localPoints, index / rate);
    output[index] *= dbToGain(gainDb);
  }

  return Float32Array.from(output, round);
}

export function resolveAudioRangeEffects({ clipStart = 0, clipEnd = 0, effects = [] } = {}) {
  const bounds = normalizeRange(clipStart, clipEnd);
  const resolved = [];

  for (const effect of Array.isArray(effects) ? effects : []) {
    if (!effect?.type) continue;
    const range = normalizeRange(effect.start, effect.end);
    const start = clamp(range.start, bounds.start, bounds.end);
    const end = clamp(range.end, bounds.start, bounds.end);
    if ((end - start) <= 0) continue;
    resolved.push({
      ...effect,
      start: start - bounds.start,
      end: end - bounds.start
    });
  }

  return resolved.sort((left, right) => left.start - right.start);
}

export function applyAudioRangeEffects(samples, { sampleRate = 1, effects = [] } = {}) {
  const source = samples instanceof Float32Array ? samples : Float32Array.from(samples || []);
  const output = source.slice();
  const rate = Math.max(1, Number(sampleRate) || 1);

  for (const effect of Array.isArray(effects) ? effects : []) {
    if (!effect?.type) continue;
    const range = normalizeRange(effect.start, effect.end);
    const startIndex = clamp(Math.floor(range.start * rate), 0, output.length);
    const endIndex = clamp(Math.ceil(range.end * rate), startIndex, output.length);
    const span = endIndex - startIndex;
    if (span <= 0) continue;

    if (effect.type === 'silence') {
      output.fill(0, startIndex, endIndex);
      continue;
    }

    if (effect.type === 'gain') {
      const gain = Number.isFinite(Number(effect.gain))
        ? Number(effect.gain)
        : dbToGain(effect.gainDb);
      if (!Number.isFinite(gain)) continue;
      for (let index = startIndex; index < endIndex; index += 1) {
        output[index] *= gain;
      }
      continue;
    }

    if (effect.type === 'fade-in' || effect.type === 'fade-out') {
      const denominator = Math.max(1, span - 1);
      const curve = Math.max(0.1, Number(effect.curve) || 1);
      for (let offset = 0; offset < span; offset += 1) {
        const progress = offset / denominator;
        const gain = effect.type === 'fade-in'
          ? Math.pow(progress, curve)
          : Math.pow(1 - progress, curve);
        output[startIndex + offset] *= gain;
      }
      continue;
    }

    if (effect.type === 'reverse') {
      const section = output.slice(startIndex, endIndex);
      for (let offset = 0; offset < section.length; offset += 1) {
        output[startIndex + offset] = section[section.length - 1 - offset];
      }
      continue;
    }

    if (effect.type === 'normalize') {
      let peak = 0;
      for (let index = startIndex; index < endIndex; index += 1) {
        peak = Math.max(peak, Math.abs(output[index]));
      }
      if (peak <= 0.000001) continue;
      const targetDb = Number.isFinite(Number(effect.targetDb)) ? Number(effect.targetDb) : -1;
      const targetGain = dbToGain(targetDb);
      const gain = targetGain / peak;
      for (let index = startIndex; index < endIndex; index += 1) {
        output[index] *= gain;
      }
      continue;
    }

    if (effect.type === 'low-pass' || effect.type === 'high-pass') {
      if (effect.type === 'low-pass') {
        applyLowPassRange(output, startIndex, endIndex, rate, effect.cutoffHz);
      } else {
        applyHighPassRange(output, startIndex, endIndex, rate, effect.cutoffHz);
      }
      continue;
    }

    if (effect.type === 'band-pass') {
      applyBandPassRange(output, startIndex, endIndex, rate, effect);
      continue;
    }

    if (effect.type === 'notch') {
      applyNotchRange(output, startIndex, endIndex, rate, effect);
      continue;
    }

    if (effect.type === 'telephone') {
      const highPassHz = Math.max(200, Number(effect.highPassHz) || 320);
      const lowPassHz = Math.max(highPassHz + 100, Number(effect.lowPassHz) || 3200);
      const drive = Math.max(1, Number(effect.drive) || 1.2);
      const normalizeDrive = Math.tanh(drive) || 1;
      applyHighPassRange(output, startIndex, endIndex, rate, highPassHz);
      applyLowPassRange(output, startIndex, endIndex, rate, lowPassHz);
      for (let index = startIndex; index < endIndex; index += 1) {
        output[index] = Math.tanh(output[index] * drive) / normalizeDrive;
      }
      continue;
    }

    if (effect.type === 'vocal-remove') {
      applyBandReductionRange(output, startIndex, endIndex, rate, {
        lowHz: Number(effect.lowHz) || 180,
        highHz: Number(effect.highHz) || 3600,
        amount: Number(effect.strength) || 0.75
      });
      continue;
    }

    if (effect.type === 'de-esser') {
      applyBandReductionRange(output, startIndex, endIndex, rate, {
        lowHz: Number(effect.lowHz) || Math.max(2200, (Number(effect.frequencyHz) || 5200) * 0.72),
        highHz: Number(effect.highHz) || Math.min(rate / 2, (Number(effect.frequencyHz) || 5200) * 1.35),
        amount: Number(effect.amount) || 0.55
      });
      continue;
    }

    if (effect.type === 'radio') {
      applyRadioRange(output, startIndex, endIndex, rate, effect);
      continue;
    }

    if (effect.type === 'bass-cut') {
      applyHighPassRange(output, startIndex, endIndex, rate, Number(effect.cutoffHz) || 180);
      continue;
    }

    if (effect.type === 'noise-gate') {
      applyNoiseGateRange(output, startIndex, endIndex, effect);
      continue;
    }

    if (effect.type === 'compression') {
      applyCompressionRange(output, startIndex, endIndex, effect);
      continue;
    }

    if (effect.type === 'saturation') {
      applySaturationRange(output, startIndex, endIndex, effect);
      continue;
    }

    if (effect.type === 'reverb') {
      applyReverbRange(output, startIndex, endIndex, rate, effect);
      continue;
    }

    if (effect.type === 'formant-shift') {
      applyFormantShiftRange(output, startIndex, endIndex, rate, effect);
      continue;
    }

    if (effect.type === 'pitch-shift') {
      applyPitchRange(output, startIndex, endIndex, rate, effect);
      continue;
    }

    if (effect.type === 'echo') {
      const delaySamples = Math.max(1, Math.round(Math.max(0.01, Number(effect.delay) || 0.2) * rate));
      const decay = clamp(Number(effect.decay) || 0.35, 0, 0.95);
      for (let index = startIndex + delaySamples; index < endIndex; index += 1) {
        output[index] += output[index - delaySamples] * decay;
      }
    }
  }

  return Float32Array.from(output, round);
}

export function deleteAudioSampleRange(samples, { sampleRate = 1, start = 0, end = 0 } = {}) {
  const source = samples instanceof Float32Array ? samples : Float32Array.from(samples || []);
  const rate = Math.max(1, Number(sampleRate) || 1);
  const range = normalizeRange(start, end);
  const startIndex = clamp(Math.floor(range.start * rate), 0, source.length);
  const endIndex = clamp(Math.ceil(range.end * rate), startIndex, source.length);
  if (endIndex <= startIndex) return source.slice();
  const outputLength = source.length - (endIndex - startIndex);
  if (outputLength <= 0) return Float32Array.of(0);
  const output = new Float32Array(outputLength);
  output.set(source.subarray(0, startIndex), 0);
  output.set(source.subarray(endIndex), startIndex);
  return output;
}

import {
  applyAudioRangeEffects,
  applyVolumeEnvelope,
  resolveAudioRangeEffects,
  resolveVolumeEnvelope
} from './audio-range-effects.js';
import { transformPitchAndSpeed } from './audio-stretch.js';

function clampUnit(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function normalizeSamples(samples) {
  if (samples instanceof Float32Array) return samples;
  if (samples instanceof ArrayBuffer) return new Float32Array(samples);
  return Float32Array.from(samples || []);
}

export function processTrimAudioSamples({
  sampleBuffer,
  samples,
  sampleRate = 44100,
  start = 0,
  end = 0,
  speed = 1,
  pitchSemitones = 0,
  pitch = pitchSemitones,
  gain = 1,
  effects = [],
  volumeEnvelope = [],
  noiseProfile = null,
  noiseAmount = 0,
  levelerAmount = 0
} = {}) {
  const source = normalizeSamples(sampleBuffer || samples);
  const safeSampleRate = Math.max(1, Number(sampleRate) || 44100);
  const safeStart = Math.max(0, Number(start) || 0);
  const safeEnd = Math.max(safeStart, Number(end) || safeStart);
  const startFrame = Math.max(0, Math.floor(safeStart * safeSampleRate));
  const endFrame = Math.max(startFrame, Math.min(source.length, Math.floor(safeEnd * safeSampleRate)));
  let output = source.slice(startFrame, endFrame);

  const localEffects = resolveAudioRangeEffects({
    clipStart: safeStart,
    clipEnd: safeEnd,
    effects
  });
  if (localEffects.length) {
    output = applyAudioRangeEffects(output, {
      sampleRate: safeSampleRate,
      effects: localEffects
    });
  }

  const localVolumeEnvelope = resolveVolumeEnvelope({
    clipStart: safeStart,
    clipEnd: safeEnd,
    points: volumeEnvelope
  });
  if (localVolumeEnvelope.length) {
    output = applyVolumeEnvelope(output, {
      sampleRate: safeSampleRate,
      points: localVolumeEnvelope
    });
  }

  const safeNoiseAmount = clampUnit(noiseAmount);
  const profile = noiseProfile instanceof Float32Array
    ? noiseProfile
    : noiseProfile instanceof ArrayBuffer
      ? new Float32Array(noiseProfile)
      : null;
  if (safeNoiseAmount > 0 && profile?.length) {
    const floor = Math.pow(10, ((profile[0] || 0) + 12) / 20);
    const alpha = 1 + (safeNoiseAmount * 7);
    const gamma = 1 + (safeNoiseAmount * 5);
    for (let index = 0; index < output.length; index += 1) {
      const amplitude = Math.abs(output[index]);
      if (amplitude <= 0) continue;
      let nextMagnitude = Math.max(0, amplitude - (floor * alpha * safeNoiseAmount));
      const softThreshold = floor * (4 + (8 * safeNoiseAmount));
      if (nextMagnitude > 0 && nextMagnitude < softThreshold) {
        nextMagnitude = Math.pow(nextMagnitude / softThreshold, gamma) * softThreshold;
      }
      output[index] = (output[index] / amplitude) * nextMagnitude;
    }
  }

  output = transformPitchAndSpeed(output, {
    sampleRate: safeSampleRate,
    speed,
    pitchSemitones: pitch
  });

  const safeLevelerAmount = clampUnit(levelerAmount);
  if (safeLevelerAmount > 0) {
    let peak = 0;
    for (let index = 0; index < output.length; index += 1) {
      peak = Math.max(peak, Math.abs(output[index]));
    }
    const normalizeGain = peak > 0 ? 0.95 / peak : 1;
    const threshold = 1 - (safeLevelerAmount * 0.85);
    const ratio = 1 + (safeLevelerAmount * 10);
    for (let index = 0; index < output.length; index += 1) {
      let sample = output[index] * normalizeGain;
      const amplitude = Math.abs(sample);
      if (amplitude > threshold && amplitude > 0) {
        sample = (sample / amplitude) * (threshold + ((amplitude - threshold) / ratio));
      }
      output[index] = sample;
    }
  }

  const safeGain = Number(gain);
  if (Number.isFinite(safeGain) && safeGain !== 1) {
    for (let index = 0; index < output.length; index += 1) {
      output[index] *= safeGain;
    }
  }

  return output;
}

export function samplesToWavBuffer(samples, sampleRate = 44100) {
  const source = normalizeSamples(samples);
  const safeSampleRate = Math.max(1, Number(sampleRate) || 44100);
  const buffer = new ArrayBuffer(44 + (source.length * 2));
  const view = new DataView(buffer);
  const writeText = (offset, text) => {
    for (let index = 0; index < text.length; index += 1) {
      view.setUint8(offset + index, text.charCodeAt(index));
    }
  };

  writeText(0, 'RIFF');
  view.setUint32(4, 36 + (source.length * 2), true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, safeSampleRate, true);
  view.setUint32(28, safeSampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, 'data');
  view.setUint32(40, source.length * 2, true);

  for (let index = 0; index < source.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, source[index]));
    view.setInt16(44 + (index * 2), sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return buffer;
}

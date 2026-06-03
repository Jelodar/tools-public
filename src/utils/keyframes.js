import { clamp, lerp } from './math-utils.js';

function easeValue(amount, easing = 'linear') {
  const t = clamp(amount, 0, 1);
  if (easing === 'ease-in') return t * t;
  if (easing === 'ease-out') return 1 - ((1 - t) * (1 - t));
  if (easing === 'ease-in-out') return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2 / 2);
  if (Array.isArray(easing) && easing.length === 4) {
    const [, y1, , y2] = easing.map(Number);
    const inv = 1 - t;
    return (3 * inv * inv * t * y1) + (3 * inv * t * t * y2) + (t * t * t);
  }
  return t;
}

export function normalizeKeyframes(keyframes = []) {
  return (Array.isArray(keyframes) ? keyframes : [])
    .map((keyframe) => ({
      time: Math.max(0, Number(keyframe.time) || 0),
      value: Number.isFinite(Number(keyframe.value)) ? Number(keyframe.value) : keyframe.value,
      easing: keyframe.easing || 'linear'
    }))
    .sort((a, b) => a.time - b.time);
}

export function evaluateKeyframes(keyframes = [], time = 0, fallback = 0) {
  const entries = normalizeKeyframes(keyframes);
  if (!entries.length) return fallback;
  const cursor = Math.max(0, Number(time) || 0);
  if (cursor <= entries[0].time) return entries[0].value;
  if (cursor >= entries.at(-1).time) return entries.at(-1).value;
  for (let index = 1; index < entries.length; index += 1) {
    const previous = entries[index - 1];
    const next = entries[index];
    if (cursor > next.time) continue;
    if (typeof previous.value !== 'number' || typeof next.value !== 'number') return previous.value;
    const span = Math.max(0.000001, next.time - previous.time);
    const amount = easeValue((cursor - previous.time) / span, previous.easing);
    return lerp(previous.value, next.value, amount);
  }
  return fallback;
}

export function evaluateClipKeyframes(clip = {}, time = 0) {
  const output = {};
  Object.entries(clip.keyframes || {}).forEach(([property, keyframes]) => {
    output[property] = evaluateKeyframes(keyframes, time, clip[property]);
  });
  return output;
}

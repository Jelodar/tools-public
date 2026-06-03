function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeSamples(samples) {
  if (samples instanceof Float32Array) return samples;
  return Float32Array.from(samples || []);
}

function getFrameSize(sampleRate, length) {
  if (length <= 512) return Math.max(64, length);
  if (sampleRate >= 48000) return Math.min(2048, length);
  if (sampleRate >= 32000) return Math.min(1536, length);
  return Math.min(1024, length);
}

function resampleLinear(samples, targetLength) {
  const source = normalizeSamples(samples);
  const desiredLength = Math.max(1, Math.round(targetLength));
  if (desiredLength === source.length) return source.slice();
  if (source.length <= 1) return new Float32Array(desiredLength).fill(source[0] || 0);
  const output = new Float32Array(desiredLength);
  const ratio = (source.length - 1) / Math.max(1, desiredLength - 1);
  for (let index = 0; index < desiredLength; index += 1) {
    const position = index * ratio;
    const leftIndex = Math.floor(position);
    const rightIndex = Math.min(source.length - 1, leftIndex + 1);
    const mix = position - leftIndex;
    output[index] = (source[leftIndex] * (1 - mix)) + (source[rightIndex] * mix);
  }
  return output;
}

function findBestOverlapOffset(source, output, outputPos, predictedPos, overlap, searchRadius) {
  const maxStart = Math.max(0, source.length - overlap - 1);
  const start = clamp(predictedPos - searchRadius, 0, maxStart);
  const end = clamp(predictedPos + searchRadius, start, maxStart);
  let bestPos = clamp(predictedPos, start, end);
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let candidate = start; candidate <= end; candidate += 1) {
    let dot = 0;
    let outputEnergy = 0;
    let sourceEnergy = 0;
    for (let index = 0; index < overlap; index += 1) {
      const left = output[outputPos + index];
      const right = source[candidate + index];
      dot += left * right;
      outputEnergy += left * left;
      sourceEnergy += right * right;
    }
    const score = dot / Math.sqrt(Math.max(1e-9, outputEnergy * sourceEnergy));
    if (score > bestScore) {
      bestScore = score;
      bestPos = candidate;
    }
  }

  return bestPos;
}

export function stretchMonoSamples(samples, { sampleRate = 44100, speed = 1 } = {}) {
  const source = normalizeSamples(samples);
  const stretchFactor = Math.max(0.25, Math.min(4, Number(speed) || 1));
  if (source.length <= 1) return source.slice();
  if (Math.abs(stretchFactor - 1) < 1e-6) return source.slice();

  const frameSize = getFrameSize(sampleRate, source.length);
  if (source.length <= frameSize) {
    return resampleLinear(source, Math.round(source.length / stretchFactor));
  }

  const overlap = Math.max(32, Math.min(frameSize - 32, Math.floor(frameSize * 0.75)));
  const synthesisHop = Math.max(16, frameSize - overlap);
  const analysisHop = synthesisHop * stretchFactor;
  const searchRadius = Math.max(16, Math.floor(frameSize * 0.3));
  const targetLength = Math.max(1, Math.round(source.length / stretchFactor));
  const frameCount = Math.max(1, Math.ceil(Math.max(0, targetLength - frameSize) / synthesisHop) + 1);
  const outputLength = Math.max(targetLength, ((frameCount - 1) * synthesisHop) + frameSize);
  const output = new Float32Array(outputLength);

  output.set(source.subarray(0, frameSize), 0);

  for (let frameIndex = 1; frameIndex < frameCount; frameIndex += 1) {
    const outputPos = frameIndex * synthesisHop;
    const predictedPos = Math.round(frameIndex * analysisHop);
    const inputPos = findBestOverlapOffset(source, output, outputPos, predictedPos, overlap, searchRadius);

    for (let index = 0; index < overlap; index += 1) {
      const blend = index / Math.max(1, overlap - 1);
      output[outputPos + index] = (output[outputPos + index] * (1 - blend)) + (source[inputPos + index] * blend);
    }

    for (let index = overlap; index < frameSize; index += 1) {
      const outputIndex = outputPos + index;
      const inputIndex = inputPos + index;
      if (outputIndex >= output.length || inputIndex >= source.length) break;
      output[outputIndex] = source[inputIndex];
    }
  }

  return output.slice(0, targetLength);
}

export function transformPitchAndSpeed(samples, { sampleRate = 44100, speed = 1, pitchSemitones = 0 } = {}) {
  const source = normalizeSamples(samples);
  if (source.length <= 1) return source.slice();

  let output = source.slice();
  const pitchFactor = Math.pow(2, (Number(pitchSemitones) || 0) / 12);

  if (Math.abs(pitchFactor - 1) > 1e-6) {
    output = stretchMonoSamples(output, {
      sampleRate,
      speed: 1 / pitchFactor
    });
    output = resampleLinear(output, source.length);
  }

  if (Math.abs((Number(speed) || 1) - 1) > 1e-6) {
    output = stretchMonoSamples(output, {
      sampleRate,
      speed
    });
  }

  return output;
}

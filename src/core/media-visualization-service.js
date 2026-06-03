import { globalWorkerPool } from '../workers/pool.js';
import { taskManager } from './task-manager.js';

const waveformCache = new Map();

function buildCacheKey({ file, fileName, cacheKey }) {
  if (cacheKey) return String(cacheKey);
  if (file && typeof file.size === 'number') return `${fileName || 'media'}:${file.size}:${file.type || ''}`;
  return `${fileName || 'media'}:volatile`;
}

export async function analyzeWaveform(options = {}) {
  const file = options.file;
  if (!file) return { duration: 0, sampleRate: 0, levels: [] };
  const cacheId = buildCacheKey(options);
  if (waveformCache.has(cacheId)) return waveformCache.get(cacheId);
  
  const taskId = `waveform-${Math.random().toString(36).slice(2, 9)}`;
  const task = (async () => {
    taskManager.register(taskId, {
      title: 'Waveform',
      detail: 'Decoding audio…',
      busy: true
    });
    const buffer = await file.arrayBuffer();
    const { result, error } = await globalWorkerPool.run(
      'waveform-pyramid',
      {
        fileName: options.fileName || 'media',
        fileBuffer: buffer,
        maxBins: options.maxBins || 16384,
        includeSamples: !!options.includeSamples,
        maxSampleFrames: options.maxSampleFrames || 2000000
      },
      [buffer],
      { 
        onEvent: (event) => {
          if (event.type === 'waveform-status') {
            taskManager.update(taskId, { detail: event.payload.message });
          }
          options.onEvent?.(event);
        }
      }
    );
    if (error) {
      taskManager.unregister(taskId);
      throw new Error(error);
    }
    taskManager.unregister(taskId);
    return result;
  })();
  waveformCache.set(cacheId, task);
  try {
    return await task;
  } catch (error) {
    waveformCache.delete(cacheId);
    throw error;
  }
}

export async function analyzeWaveformSamples(options = {}) {
  const sampleBuffer = options.sampleBuffer;
  if (!(sampleBuffer instanceof ArrayBuffer)) return { duration: 0, sampleRate: 0, levels: [] };
  const cacheId = buildCacheKey({ cacheKey: options.cacheKey, fileName: options.fileName || 'samples' });
  if (waveformCache.has(cacheId)) return waveformCache.get(cacheId);
  const task = (async () => {
    const transfer = sampleBuffer.slice(0);
    const { result, error } = await globalWorkerPool.run(
      'waveform-pyramid-samples',
      {
        sampleBuffer: transfer,
        sampleRate: options.sampleRate || 44100,
        maxBins: options.maxBins || 16384
      },
      [transfer],
      { onEvent: options.onEvent }
    );
    if (error) throw new Error(error);
    return result;
  })();
  waveformCache.set(cacheId, task);
  try {
    return await task;
  } catch (error) {
    waveformCache.delete(cacheId);
    throw error;
  }
}

export function resetWaveformCache() {
  waveformCache.clear();
}

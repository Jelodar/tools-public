import {
  buildWebMediaOutputName,
  createWebMediaInspection,
  planWebMediaOperation,
  summarizeWebMediaCapabilities
} from '../utils/webmedia-plan.js';
import {
  handleWebMediaWorkerMessage,
  normalizeWebMediaError
} from '../workers/webmedia.worker.js';

function createDefaultWorker() {
  return new Worker(new URL('../workers/webmedia.worker.js', import.meta.url), { type: 'module' });
}

export function detectWebMediaCapabilities(scope = globalThis) {
  return {
    VideoDecoder: typeof scope.VideoDecoder === 'function',
    VideoEncoder: typeof scope.VideoEncoder === 'function',
    AudioDecoder: typeof scope.AudioDecoder === 'function',
    AudioEncoder: typeof scope.AudioEncoder === 'function',
    EncodedVideoChunk: typeof scope.EncodedVideoChunk === 'function',
    EncodedAudioChunk: typeof scope.EncodedAudioChunk === 'function'
  };
}

export function createWebMediaService(options = {}) {
  const createWorker = options.createWorker || createDefaultWorker;
  const forceLocal = Boolean(options.forceLocal);
  const pending = new Map();
  let worker = null;
  let disposed = false;
  let requestSeq = 0;
  let capabilityTimerSeq = 0;
  const capabilities = {
    main: detectWebMediaCapabilities(globalThis),
    worker: {}
  };
  const hasInjectedWorker = typeof options.createWorker === 'function';
  const capabilityWaiters = new Map();

  const resolveCapabilityWaiters = () => {
    const summary = summarizeWebMediaCapabilities(capabilities);
    for (const { resolve, timer } of capabilityWaiters.values()) {
      clearTimeout(timer);
      resolve(summary);
    }
    capabilityWaiters.clear();
  };

  const ensureWorker = () => {
    if (forceLocal || (!hasInjectedWorker && typeof Worker !== 'function')) return null;
    if (worker) return worker;
    worker = createWorker();
    worker.onmessage = (event) => {
      const data = event.data || {};
      if (data.type === 'capabilities') {
        capabilities.worker = data.payload?.worker || {};
        resolveCapabilityWaiters();
        return;
      }
      const entry = pending.get(data.requestId);
      if (!entry) return;
      if (data.type === 'result') {
        pending.delete(data.requestId);
        entry.resolve(data.payload);
        return;
      }
      if (data.type === 'error') {
        pending.delete(data.requestId);
        entry.reject(toError(data.payload));
        entry.onEvent?.(data);
        return;
      }
      entry.onEvent?.(data);
    };
    worker.onerror = (event) => {
      const error = typeof ErrorEvent === 'function' && event instanceof ErrorEvent && event.error
        ? event.error
        : new Error(event.message || 'Web media worker failed.');
      for (const [requestId, entry] of pending.entries()) {
        entry.reject(error);
        pending.delete(requestId);
      }
      resolveCapabilityWaiters();
    };
    return worker;
  };

  const post = async (type, payload = {}, options = {}) => {
    if (disposed) throw new Error('Web media service has been disposed.');
    const targetWorker = ensureWorker();
    if (!targetWorker) return runLocal(type, payload, options.onEvent);
    const requestId = `webmedia-${++requestSeq}`;
    const promise = new Promise((resolve, reject) => {
      pending.set(requestId, { resolve, reject, onEvent: options.onEvent });
    });
    const abort = () => {
      targetWorker.postMessage({ requestId: `${requestId}:cancel`, type: 'cancel', payload: { jobId: payload.jobId } });
    };
    options.signal?.addEventListener?.('abort', abort, { once: true });
    targetWorker.postMessage({ requestId, type, payload });
    try {
      return await promise;
    } finally {
      options.signal?.removeEventListener?.('abort', abort);
    }
  };

  return {
    getCapabilities() {
      return summarizeWebMediaCapabilities(capabilities);
    },
    probeCapabilities(options = {}) {
      const targetWorker = ensureWorker();
      const current = summarizeWebMediaCapabilities(capabilities);
      if (!targetWorker || current.workerKnown) return Promise.resolve(current);
      const timeoutMs = Math.max(0, Number(options.timeoutMs ?? 700));
      return new Promise((resolve) => {
        const id = `capability-${++capabilityTimerSeq}`;
        const timer = setTimeout(() => {
          capabilityWaiters.delete(id);
          resolve(summarizeWebMediaCapabilities(capabilities));
        }, timeoutMs);
        capabilityWaiters.set(id, { resolve, timer });
      });
    },
    inspectFile(file, options = {}) {
      const payload = {
        file: serializeFile(file),
        capabilities
      };
      if (isTransferableMediaFile(file)) payload.mediaFile = file;
      return post('inspect', payload, options);
    },
    plan(input, options = {}) {
      return post('plan', input, options);
    },
    run(plan, options = {}) {
      const jobId = options.jobId || `webmedia-${Math.random().toString(36).slice(2, 9)}`;
      const payload = { jobId, plan };
      const mediaFile = options.mediaFile || options.file || options.sourceFile;
      if (isTransferableMediaFile(mediaFile)) payload.mediaFile = mediaFile;
      return post('run', payload, options);
    },
    cancel(jobId, options = {}) {
      return post('cancel', { jobId }, options);
    },
    dispose() {
      disposed = true;
      pending.clear();
      for (const { resolve, timer } of capabilityWaiters.values()) {
        clearTimeout(timer);
        resolve(summarizeWebMediaCapabilities(capabilities));
      }
      capabilityWaiters.clear();
      worker?.terminate?.();
      worker = null;
    }
  };
}

export function createInspectReport(inspection) {
  const payload = JSON.stringify(inspection || {}, null, 2);
  return {
    blob: new Blob([payload], { type: 'application/json' }),
    filename: buildWebMediaOutputName(inspection?.fileName || 'media', { output: { extension: 'json' } }),
    mime: 'application/json',
    summary: { bytes: payload.length }
  };
}

async function runLocal(type, payload, onEvent) {
  const events = [];
  await handleWebMediaWorkerMessage({ type, payload }, {
    emit: (event) => {
      events.push(event);
      onEvent?.(event);
    }
  });
  const error = events.find((event) => event.type === 'error');
  if (error) throw toError(error.payload);
  const result = events.findLast((event) => event.type === 'result');
  return result?.payload || {};
}

function serializeFile(file = {}) {
  return {
    name: file.name || file.fileName || 'media',
    type: file.type || file.mime || '',
    size: Number(file.size || 0),
    lastModified: file.lastModified || null,
    duration: file.duration || 0,
    tracks: Array.isArray(file.tracks) ? file.tracks : []
  };
}

function isTransferableMediaFile(file) {
  return typeof Blob === 'function' && file instanceof Blob;
}

function toError(payload = {}) {
  const normalized = normalizeWebMediaError(payload);
  const error = new Error(normalized.message);
  error.code = normalized.code;
  error.recoverable = normalized.recoverable;
  error.suggestedRoute = normalized.suggestedRoute;
  return error;
}

export { createWebMediaInspection, normalizeWebMediaError, planWebMediaOperation };

import { getWllamaConfig } from './ai.js';

function createDefaultWorker() {
  return new Worker(new URL('../workers/ai.worker.js', import.meta.url), { type: 'module' });
}

export function createAiSession(options = {}) {
  const createWorker = options.createWorker || createDefaultWorker;
  const resolveConfig = options.resolveConfig || getWllamaConfig;
  const loadTimeoutMs = Math.max(0, Number(options.loadTimeoutMs ?? 30000) || 0);
  const scheduleTimeout = options.setTimeout || globalThis.setTimeout;
  const cancelTimeout = options.clearTimeout || globalThis.clearTimeout;
  const listeners = new Set();
  let worker = null;
  let disposed = false;
  let currentModelUrl = null;
  let pendingLoad = null;

  const emit = (event) => {
    listeners.forEach((listener) => listener(event));
  };

  const clearPendingLoadTimer = () => {
    if (pendingLoad?.timeoutId) cancelTimeout?.(pendingLoad.timeoutId);
  };

  const resetPendingLoad = () => {
    clearPendingLoadTimer();
    pendingLoad = null;
  };

  const rejectPendingLoad = (error) => {
    if (!pendingLoad) return;
    pendingLoad.reject(error);
    resetPendingLoad();
  };

  const ensureWorker = () => {
    if (disposed) throw new Error('AI session has been disposed.');
    if (worker) return worker;
    worker = createWorker();
    worker.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'status' && payload.status === 'ready' && pendingLoad) {
        currentModelUrl = pendingLoad.url;
        pendingLoad.resolve({ url: currentModelUrl });
        resetPendingLoad();
      } else if (type === 'error' && pendingLoad) {
        rejectPendingLoad(new Error(payload.message));
      }
      emit({ type, payload });
    };
    worker.onerror = (event) => {
      const error = event instanceof ErrorEvent && event.error
        ? event.error
        : new Error(event.message || 'AI worker failed.');
      rejectPendingLoad(error);
      emit({ type: 'error', payload: { message: error.message } });
    };
    return worker;
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async loadModel(url) {
      if (!url) throw new Error('Model URL is required.');
      if (currentModelUrl === url && !pendingLoad) return { url };
      if (pendingLoad && pendingLoad.url === url) return pendingLoad.promise;

      const targetWorker = ensureWorker();
      const promise = new Promise((resolve, reject) => {
        pendingLoad = { url, resolve, reject, promise: null };
      });
      pendingLoad.promise = promise;
      if (loadTimeoutMs > 0) {
        pendingLoad.timeoutId = scheduleTimeout(() => {
          rejectPendingLoad(new Error(`AI model load timed out after ${loadTimeoutMs}ms.`));
        }, loadTimeoutMs);
      }
      try {
        const config = await resolveConfig();
        if (!pendingLoad || pendingLoad.url !== url) return promise;
        targetWorker.postMessage({ type: 'load', payload: { url, config } });
      } catch (error) {
        rejectPendingLoad(error);
        throw error;
      }
      return promise;
    },
    generate(payload) {
      ensureWorker().postMessage({ type: 'generate', payload });
    },
    stop() {
      if (!worker) return;
      worker.postMessage({ type: 'stop' });
    },
    getState() {
      return {
        currentModelUrl,
        isLoading: !!pendingLoad
      };
    },
    dispose() {
      disposed = true;
      if (worker) {
        worker.terminate();
        worker = null;
      }
      rejectPendingLoad(new Error('AI session disposed.'));
      listeners.clear();
    }
  };
}

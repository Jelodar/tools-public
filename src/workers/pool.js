const DEFAULT_TASK_WORKER_URL = new URL('./task.worker.js', import.meta.url);

export function getDefaultTaskWorkerUrl() {
  return DEFAULT_TASK_WORKER_URL;
}

export class WorkerPool {
  constructor(workerScript = getDefaultTaskWorkerUrl(), maxWorkers = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4) {
    this.workerScript = workerScript;
    this.maxWorkers = maxWorkers;
    this.queue = [];
    this.activeCount = 0;
  }

  run(type, payload = {}, transferables = [], options = {}) {
    const task = {
      type,
      payload,
      transferables,
      resolve: null,
      reject: null,
      onEvent: options.onEvent,
      worker: null,
      active: false,
      settled: false
    };
    const promise = new Promise((resolve, reject) => {
      task.resolve = resolve;
      task.reject = reject;
      this.queue.push(task);
      this.next();
    });
    promise.cancel = () => {
      if (task.settled) return;
      const error = createAbortError();
      const queuedIndex = this.queue.indexOf(task);
      if (queuedIndex >= 0) {
        this.queue.splice(queuedIndex, 1);
        task.settled = true;
        task.reject(error);
        return;
      }
      if (!task.active || !task.worker) return;
      const worker = task.worker;
      task.settled = true;
      task.active = false;
      task.worker = null;
      this.activeCount = Math.max(0, this.activeCount - 1);
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate?.();
      task.reject(error);
      this.next();
    };
    return promise;
  }

  next() {
    if (this.queue.length === 0 || this.activeCount >= this.maxWorkers) return;

    const task = this.queue.shift();
    const worker = this.getAvailableWorker();
    task.worker = worker;
    task.active = true;
    
    this.activeCount++;

    const finish = (callback) => {
      if (task.settled) return;
      task.settled = true;
      task.active = false;
      task.worker = null;
      this.activeCount--;
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate?.();
      callback();
      this.next();
    };
    
    worker.onmessage = (e) => {
      if (!e.data || typeof e.data !== 'object' || !('success' in e.data)) {
        task.onEvent?.(e.data);
        return;
      }
      finish(() => task.resolve(e.data));
    };

    worker.onerror = (err) => {
      finish(() => task.reject(err));
    };

    worker.postMessage({ type: task.type, payload: task.payload }, task.transferables);
  }

  getAvailableWorker() {
    return new Worker(this.workerScript, { type: 'module' });
  }
}

function createAbortError() {
  if (typeof DOMException === 'function') {
    return new DOMException('Worker task aborted.', 'AbortError');
  }
  const error = new Error('Worker task aborted.');
  error.name = 'AbortError';
  return error;
}

export const globalWorkerPool = new WorkerPool();

import { globalWorkerPool } from '../workers/pool.js';
import { taskManager } from './task-manager.js';

function createAbortError() {
  if (typeof DOMException === 'function') return new DOMException('Worker task aborted.', 'AbortError');
  const error = new Error('Worker task aborted.');
  error.name = 'AbortError';
  return error;
}

export async function runFFmpegJob({ files, command, commandSequence, outputFileName, onEvent, signal }) {
  const taskId = `ffmpeg-${Math.random().toString(36).slice(2, 9)}`;
  let workerHandle = null;
  if (signal?.aborted) throw createAbortError();
  const normalizedFiles = files.map((file) => ({
    name: file.name,
    buffer: file.buffer
  }));
  const transferables = normalizedFiles
    .map((file) => file.buffer)
    .filter((buffer, index, buffers) => buffer instanceof ArrayBuffer && buffers.indexOf(buffer) === index);
    
  taskManager.register(taskId, {
    title: 'Media Task',
    detail: 'Initializing FFmpeg…',
    busy: true,
    cancellable: true,
    onStop: () => {
      workerHandle?.cancel?.();
    }
  });

  const abortWorker = () => workerHandle?.cancel?.();
  signal?.addEventListener?.('abort', abortWorker, { once: true });

  try {
    workerHandle = globalWorkerPool.run(
      'ffmpeg-cmd',
      { files: normalizedFiles, command, commandSequence, outputFileName },
      transferables,
      { 
        onEvent: (event) => {
          if (event.type === 'ffmpeg-progress') {
            taskManager.update(taskId, {
              title: 'Media Task',
              detail: `Processing: ${Math.round(event.payload.progress)}%`,
              progress: event.payload.progress
            });
          } else if (event.type === 'ffmpeg-status') {
            taskManager.update(taskId, {
              detail: event.payload.message
            });
          }
          onEvent?.(event);
        }
      }
    );
    if (signal?.aborted) workerHandle.cancel?.();
    const { result, error } = await workerHandle;
    if (error) {
      taskManager.update(taskId, {
        title: 'Task failed',
        detail: error,
        busy: false,
        cancellable: false,
        tone: 'danger'
      });
      setTimeout(() => taskManager.unregister(taskId), 5000);
      throw new Error(error);
    }
    taskManager.update(taskId, {
      title: 'Task complete',
      detail: 'Media export ready.',
      busy: false,
      cancellable: false,
      tone: 'success',
      progress: 100
    });
    setTimeout(() => taskManager.unregister(taskId), 2000);
    return result;
  } catch (err) {
    if (err?.name === 'AbortError') {
      taskManager.update(taskId, {
        title: 'Task cancelled',
        detail: 'Media export stopped.',
        busy: false,
        cancellable: false,
        tone: 'neutral'
      });
      setTimeout(() => taskManager.unregister(taskId), 2000);
      throw err;
    }
    taskManager.update(taskId, {
      title: 'Task failed',
      detail: err.message,
      busy: false,
      cancellable: false,
      tone: 'danger'
    });
    setTimeout(() => taskManager.unregister(taskId), 5000);
    throw err;
  } finally {
    signal?.removeEventListener?.('abort', abortWorker);
  }
}

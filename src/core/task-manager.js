const activeTasks = new Map();
const listeners = new Set();

function isTerminalTask(task = {}) {
  const tone = String(task.tone || '').toLowerCase();
  const text = `${task.title || ''} ${task.detail || ''}`.toLowerCase();
  return tone === 'danger' || /\b(complete|completed|done|failed|error|cancelled|canceled|stopped)\b/.test(text);
}

function normalizeTerminalState(task, source = {}) {
  if (!isTerminalTask(task)) return task;
  if (!Object.prototype.hasOwnProperty.call(source, 'busy')) task.busy = false;
  if (!Object.prototype.hasOwnProperty.call(source, 'cancellable')) task.cancellable = false;
  return task;
}

function getCurrentReturnPath() {
  const pathname = globalThis.window?.location?.pathname || '';
  return pathname && pathname !== '/' ? pathname : '';
}

export const taskManager = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  register(id, task) {
    activeTasks.set(id, normalizeTerminalState({
      id,
      title: task.title || 'Background Task',
      detail: task.detail || '',
      progress: task.progress || 0,
      busy: task.busy ?? true,
      cancellable: task.cancellable ?? false,
      onStop: task.onStop,
      tone: task.tone || 'neutral',
      toolId: task.toolId || '',
      returnPath: task.returnPath || task.path || getCurrentReturnPath()
    }, task));
    this.notify();
  },

  update(id, updates) {
    const task = activeTasks.get(id);
    if (!task) return;
    Object.assign(task, updates);
    normalizeTerminalState(task, updates);
    this.notify();
  },

  unregister(id) {
    activeTasks.delete(id);
    this.notify();
  },

  getTasks() {
    return Array.from(activeTasks.values());
  },

  notify() {
    const tasks = this.getTasks();
    listeners.forEach((listener) => listener(tasks));
  }
};

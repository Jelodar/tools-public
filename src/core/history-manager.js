import { cloneValue, createSnapshotCommand } from './command.js';

function readMetadata(entry) {
  return entry?.metadata || { label: 'Command', timestamp: Date.now() };
}

export class HistoryManager {
  constructor({
    limit = 100,
    autosave = null,
    autosaveIntervalMs = 30000,
    now = () => Date.now()
  } = {}) {
    this.limit = Math.max(1, Math.round(Number(limit) || 100));
    this.autosave = autosave;
    this.autosaveIntervalMs = Math.max(1000, Number(autosaveIntervalMs) || 30000);
    this.now = now;
    this.undoStack = [];
    this.redoStack = [];
    this.lastAutosaveAt = 0;
    this.lastSnapshot = null;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  execute(command, { significant = true } = {}) {
    if (!command || typeof command.execute !== 'function' || typeof command.undo !== 'function') {
      throw new TypeError('HistoryManager.execute requires a command object.');
    }
    command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
    this.trim();
    this.markChanged(significant);
    return command;
  }

  undo() {
    const command = this.undoStack.pop();
    if (!command) return null;
    command.undo();
    this.redoStack.push(command);
    this.markChanged(true);
    return command;
  }

  redo() {
    const command = this.redoStack.pop();
    if (!command) return null;
    command.execute();
    this.undoStack.push(command);
    this.trim();
    this.markChanged(true);
    return command;
  }

  captureSnapshot(target, label = 'Snapshot', metadata = {}) {
    const after = cloneValue(target);
    const before = this.lastSnapshot ? cloneValue(this.lastSnapshot) : cloneValue(after);
    const command = createSnapshotCommand(target, before, after, {
      label,
      timestamp: this.now(),
      ...metadata
    });
    this.undoStack.push(command);
    this.redoStack = [];
    this.lastSnapshot = cloneValue(after);
    this.trim();
    this.markChanged(true);
    return command;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.lastSnapshot = null;
    this.markChanged(true);
  }

  trim() {
    while (this.undoStack.length > this.limit) this.undoStack.shift();
  }

  markChanged(significant = false) {
    if (!this.autosave) return;
    const elapsed = this.now() - this.lastAutosaveAt;
    if (significant || elapsed >= this.autosaveIntervalMs) this.flushAutosave();
  }

  flushAutosave() {
    if (!this.autosave) return null;
    const payload = this.serialize();
    this.lastAutosaveAt = this.now();
    this.autosave(payload);
    return payload;
  }

  serialize() {
    return {
      undoStack: this.undoStack.map((entry) => ({
        metadata: readMetadata(entry),
        serialized: typeof entry.serialize === 'function' ? entry.serialize() : null
      })),
      redoStack: this.redoStack.map((entry) => ({
        metadata: readMetadata(entry),
        serialized: typeof entry.serialize === 'function' ? entry.serialize() : null
      })),
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    };
  }
}

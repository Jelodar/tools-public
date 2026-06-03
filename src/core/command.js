function cloneValue(value) {
  if (value === undefined) return undefined;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function normalizeMetadata(metadata = {}) {
  return {
    label: metadata.label || 'Command',
    timestamp: Number(metadata.timestamp) || Date.now(),
    ...metadata
  };
}

export function createCommand({ execute, undo, metadata = {}, label = '', serialize = null } = {}) {
  if (typeof execute !== 'function' || typeof undo !== 'function') {
    throw new TypeError('Command requires execute and undo functions.');
  }
  return {
    metadata: normalizeMetadata({ label: label || metadata.label, ...metadata }),
    execute,
    undo,
    serialize
  };
}

function parsePointer(path) {
  if (path === '') return [];
  if (!String(path).startsWith('/')) throw new Error(`Invalid JSON pointer: ${path}`);
  return String(path).slice(1).split('/').map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'));
}

function getContainer(target, pointer) {
  const parts = parsePointer(pointer);
  const key = parts.pop();
  const parent = parts.reduce((node, part) => node?.[part], target);
  if (parent == null || key == null) throw new Error(`JSON pointer target not found: ${pointer}`);
  return { parent, key };
}

function readAt(target, pointer) {
  return parsePointer(pointer).reduce((node, part) => node?.[part], target);
}

function writeAt(target, pointer, value) {
  if (pointer === '') throw new Error('Root replacement is not supported by patch commands.');
  const { parent, key } = getContainer(target, pointer);
  if (Array.isArray(parent)) {
    const index = key === '-' ? parent.length : Number(key);
    parent.splice(index, 0, cloneValue(value));
    return;
  }
  parent[key] = cloneValue(value);
}

function replaceAt(target, pointer, value) {
  if (pointer === '') throw new Error('Root replacement is not supported by patch commands.');
  const { parent, key } = getContainer(target, pointer);
  if (Array.isArray(parent)) {
    parent[Number(key)] = cloneValue(value);
    return;
  }
  parent[key] = cloneValue(value);
}

function removeAt(target, pointer) {
  if (pointer === '') throw new Error('Root removal is not supported by patch commands.');
  const { parent, key } = getContainer(target, pointer);
  if (Array.isArray(parent)) {
    parent.splice(Number(key), 1);
    return;
  }
  delete parent[key];
}

function applyPatch(target, patch) {
  if (patch.op === 'add') {
    writeAt(target, patch.path, patch.value);
    return;
  }
  if (patch.op === 'replace') {
    replaceAt(target, patch.path, patch.value);
    return;
  }
  if (patch.op === 'remove') {
    removeAt(target, patch.path);
    return;
  }
  throw new Error(`Unsupported JSON patch operation: ${patch.op}`);
}

function buildInversePatch(target, patch) {
  if (patch.op === 'add') {
    return { op: 'remove', path: patch.path };
  }
  if (patch.op === 'replace') {
    return { op: 'replace', path: patch.path, value: cloneValue(readAt(target, patch.path)) };
  }
  if (patch.op === 'remove') {
    return { op: 'add', path: patch.path, value: cloneValue(readAt(target, patch.path)) };
  }
  throw new Error(`Unsupported JSON patch operation: ${patch.op}`);
}

export function applyJsonPatches(target, patches = []) {
  for (const patch of patches) applyPatch(target, patch);
  return target;
}

export function createJsonPatchCommand(target, patches = [], metadata = {}) {
  const normalizedPatches = patches.map((patch) => ({ ...patch, value: cloneValue(patch.value) }));
  let inversePatches = [];
  return createCommand({
    metadata: {
      label: metadata.label || 'Patch',
      ...metadata,
      patchCount: normalizedPatches.length
    },
    execute() {
      inversePatches = normalizedPatches.map((patch) => buildInversePatch(target, patch)).reverse();
      applyJsonPatches(target, normalizedPatches);
    },
    undo() {
      applyJsonPatches(target, inversePatches);
    },
    serialize() {
      return {
        type: 'json-patch',
        metadata: this.metadata,
        patches: cloneValue(normalizedPatches)
      };
    }
  });
}

export function createSnapshotCommand(target, before, after, metadata = {}) {
  const restore = (snapshot) => {
    for (const key of Object.keys(target)) delete target[key];
    Object.assign(target, cloneValue(snapshot));
  };
  return createCommand({
    metadata: {
      label: metadata.label || 'Snapshot',
      ...metadata
    },
    execute() {
      restore(after);
    },
    undo() {
      restore(before);
    },
    serialize() {
      return {
        type: 'snapshot',
        metadata: this.metadata
      };
    }
  });
}

export { cloneValue };

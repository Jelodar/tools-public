export function getPersistedToolState(storeState, toolId, defaults = {}) {
  return {
    ...defaults,
    ...(storeState?.toolData?.[toolId] || {})
  };
}

export function createPersistedToolState(store, toolId, defaults = {}, options = {}) {
  const debounceMs = options.debounceMs ?? 180;
  let snapshot = getPersistedToolState(store?.getState?.(), toolId, defaults);
  let pending = {};
  let timer = null;
  const listeners = new Set();

  const emit = () => {
    listeners.forEach((listener) => listener(snapshot));
  };

  const flush = async () => {
    if (!Object.keys(pending).length) return snapshot;
    const payload = pending;
    pending = {};
    await store.dispatch({ type: 'SAVE_TOOL_DATA', toolId, payload });
    snapshot = getPersistedToolState(store.getState(), toolId, defaults);
    emit();
    return snapshot;
  };

  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      flush().catch(() => {});
    }, debounceMs);
  };

  return {
    getSnapshot() {
      return snapshot;
    },
    save(patch, saveOptions = {}) {
      snapshot = { ...snapshot, ...patch };
      pending = { ...pending, ...patch };
      emit();
      if (saveOptions.immediate) return flush();
      schedule();
      return Promise.resolve(snapshot);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    flush,
    dispose() {
      if (timer) clearTimeout(timer);
      timer = null;
    }
  };
}

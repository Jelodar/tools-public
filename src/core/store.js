const memoryStorage = new Map();
let storageAdapterPromise = null;

async function getStorageAdapter() {
  if (storageAdapterPromise) return storageAdapterPromise;
  storageAdapterPromise = (async () => {
    if (typeof indexedDB === 'undefined') {
      return {
        async get(key) {
          return memoryStorage.get(key);
        },
        async set(key, value) {
          memoryStorage.set(key, value);
        }
      };
    }
    const mod = await import('https://esm.sh/idb-keyval@6.2.1');
    return { get: mod.get, set: mod.set };
  })();
  return storageAdapterPromise;
}

export class Store {
  constructor(initialState = {}) {
    this.state = {
      preferences: { theme: 'dark' },
      toolData: {},
      navigation: {
        recentTools: [],
        favoriteTools: []
      },
      ...initialState
    };
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState() {
    return this.state;
  }

  async dispatch(action) {
    switch (action.type) {
      case 'SET_PREFERENCE':
        this.state.preferences = { ...this.state.preferences, ...action.payload };
        break;
      case 'SAVE_TOOL_DATA':
        this.state.toolData[action.toolId] = { 
          ...this.state.toolData[action.toolId], 
          ...action.payload 
        };
        break;
      case 'TOUCH_RECENT_TOOL': {
        const recent = this.state.navigation.recentTools.filter((toolId) => toolId !== action.toolId);
        this.state.navigation = {
          ...this.state.navigation,
          recentTools: [action.toolId, ...recent].slice(0, 8)
        };
        break;
      }
      case 'TOGGLE_FAVORITE_TOOL': {
        const favorites = new Set(this.state.navigation.favoriteTools);
        if (favorites.has(action.toolId)) favorites.delete(action.toolId);
        else favorites.add(action.toolId);
        this.state.navigation = {
          ...this.state.navigation,
          favoriteTools: Array.from(favorites)
        };
        break;
      }
    }
    this.listeners.forEach(l => l(this.state));
    await this.persist();
  }

  async persist() {
    const storage = await getStorageAdapter();
    await storage.set('app_state', this.state);
  }

  async load() {
    const storage = await getStorageAdapter();
    const saved = await storage.get('app_state');
    if (saved) {
      this.state = { ...this.state, ...saved };
      this.listeners.forEach(l => l(this.state));
    }
  }
}

export const globalStore = new Store();

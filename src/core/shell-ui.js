import { ICONS, TOOLS } from './config.js';
import { getNavigationCollections, getNavigationSearchText, resolveNavigationTool } from './navigation.js';
import { taskManager } from './task-manager.js';
import { createJobProgress } from '../ui/job-progress.js';
import { button, div, el, span } from '../ui/dom.js';

const toolByPath = new Map(TOOLS.map((tool) => [tool.path, tool]));
const COLLECTION_KEYS = {
  Favorites: 'favorites',
  Recent: 'recent'
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getPathnameFromHref(href = '/') {
  return new URL(href, 'https://tools.local').pathname;
}

function getActiveNavigationPath(pathname = '/') {
  const tool = toolByPath.get(pathname);
  if (!tool) return pathname;
  return resolveNavigationTool(tool.id)?.path || tool.path;
}

function getCollectionPreference(store, collectionKey) {
  const preferences = store?.getState?.().preferences || {};
  const preferenceKey = `sidebarCollection:${collectionKey}:expanded`;
  return preferences[preferenceKey] !== false;
}

function getSidebarGroupPreference(store, groupKey) {
  const preferences = store?.getState?.().preferences || {};
  const preferenceKey = `sidebarGroup:${groupKey}:expanded`;
  return preferences[preferenceKey] !== false;
}

function toSidebarGroupKey(group, index) {
  const existing = group.dataset.groupId || group.dataset.sidebarGroupKey;
  if (existing) return existing;
  const title = group.querySelector('.nav-group-title')?.textContent || `group-${index + 1}`;
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `group-${index + 1}`;
}

function setSidebarGroupExpanded(group, expanded) {
  const toggle = group.querySelector('[data-sidebar-group-toggle]');
  const body = group.querySelector('.nav-sub-menu');
  toggle?.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  if (body) {
    body.dataset.collapsed = expanded ? 'false' : 'true';
    body.classList.toggle('is-collapsed', !expanded);
  }
}

function renderSidebarCollection(title, tools, activePath, expanded) {
  if (!tools.length) return '';
  const collectionKey = COLLECTION_KEYS[title] || title.toLowerCase();
  return `
    <div class="nav-group nav-group-dynamic">
      <div class="nav-group-title">
        <button
          type="button"
          class="nav-group-toggle"
          data-collection-toggle="${collectionKey}"
          aria-expanded="${expanded ? 'true' : 'false'}"
          aria-controls="sidebar-collection-${collectionKey}"
        >
          <span class="nav-group-toggle-copy">
            <span>${title}</span>
            <span>${tools.length}</span>
          </span>
          <span class="nav-group-toggle-icon" aria-hidden="true"></span>
        </button>
      </div>
      <div
        class="nav-sub-menu${expanded ? '' : ' is-collapsed'}"
        id="sidebar-collection-${collectionKey}"
        data-collapsed="${expanded ? 'false' : 'true'}"
      >
        ${tools.map((tool) => `
          <a
            class="block-card"
            href="${tool.path}"
            data-route
            data-name="${tool.title.toLowerCase()}"
            data-desc="${tool.description.toLowerCase()}"
            data-keywords="${getNavigationSearchText(tool.id)}"
            data-active="${tool.path === activePath ? 'true' : 'false'}"
          >
            <div class="regex-block-label nav-tool-label">
              ${ICONS[tool.icon] || ICONS.home}
              <span class="nav-tool-title">${tool.title}</span>
            </div>
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

export function setupShellUi({ store } = {}) {
  const sidebar = document.getElementById('sidebar');
  const searchInput = document.getElementById('sidebar-search');
  const searchClear = document.getElementById('search-clear');
  const menuToggle = document.getElementById('shell-menu-toggle');
  const sidebarCollapseToggle = document.getElementById('sidebar-collapse-toggle');
  const sidebarAutoHideToggle = document.getElementById('sidebar-autohide-toggle');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const favoritesHost = document.getElementById('sidebar-favorites');
  const recentsHost = document.getElementById('sidebar-recents');
  const tasksHost = document.getElementById('global-tasks-host');
  let mediaControlsHost = document.getElementById('sidebar-media-controls');
  const collectionHosts = {
    favorites: favoritesHost,
    recent: recentsHost
  };
  let currentTerm = '';
  let unsubscribe = null;
  let collectionToggleCleanup = [];
  let groupToggleCleanup = [];
  let shellChromeCleanup = [];

  const activeTaskUis = new Map();
  let sidebarMediaState = null;

  if (!mediaControlsHost && sidebar) {
    mediaControlsHost = document.createElement('div');
    mediaControlsHost.id = 'sidebar-media-controls';
    mediaControlsHost.className = 'sidebar-media-controls hidden';
    const anchor = tasksHost || document.getElementById('sidebar-collections') || sidebar.querySelector('.sidebar-nav');
    if (anchor && typeof sidebar.insertBefore === 'function') sidebar.insertBefore(mediaControlsHost, anchor);
    else sidebar.appendChild(mediaControlsHost);
  }

  const getSidebarCollapsed = () => store?.getState?.().preferences?.sidebarCollapsed === true;
  const getSidebarAutoHide = () => store?.getState?.().preferences?.sidebarAutoHide === true;

  const setSidebarOpen = (open) => {
    document.body.classList.toggle('is-sidebar-open', open);
    menuToggle?.classList.toggle('is-open', open);
    menuToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  const syncSidebarPreferenceValues = ({ collapsed, autoHide }) => {
    document.body.classList.toggle('is-sidebar-collapsed', collapsed);
    document.body.classList.toggle('is-sidebar-auto-hide', autoHide);
    if (sidebar) sidebar.dataset.autoHide = autoHide ? 'true' : 'false';
    sidebarCollapseToggle?.classList.toggle('is-active', collapsed);
    sidebarCollapseToggle?.setAttribute('aria-pressed', collapsed ? 'true' : 'false');
    sidebarCollapseToggle?.setAttribute('title', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    sidebarAutoHideToggle?.classList.toggle('is-active', autoHide);
    sidebarAutoHideToggle?.setAttribute('aria-pressed', autoHide ? 'true' : 'false');
    sidebarAutoHideToggle?.setAttribute('title', autoHide ? 'Auto-hide on' : 'Auto-hide off');
  };

  const syncSidebarPreferences = () => {
    syncSidebarPreferenceValues({
      collapsed: getSidebarCollapsed(),
      autoHide: getSidebarAutoHide()
    });
  };

  const setSidebarPreference = (payload) => {
    if (!store?.dispatch) return;
    const preferences = { ...store.getState().preferences, ...payload };
    syncSidebarPreferenceValues({
      collapsed: preferences.sidebarCollapsed === true,
      autoHide: preferences.sidebarAutoHide === true
    });
    store.dispatch({ type: 'SET_PREFERENCE', payload });
  };

  const syncTasks = (tasks) => {
    if (!tasksHost) return;

    for (const [id, ui] of activeTaskUis.entries()) {
      if (!tasks.find((t) => t.id === id)) {
        const itemContainer = ui.root.parentElement;
        ui.destroy();
        itemContainer?.remove();
        activeTaskUis.delete(id);
      }
    }

    tasks.forEach((task) => {
      let ui = activeTaskUis.get(task.id);
      if (!ui) {
        const itemContainer = document.createElement('div');
        itemContainer.className = 'global-task-item';
        if (task.returnPath) {
          itemContainer.classList.add('is-returnable');
          itemContainer.dataset.returnPath = task.returnPath;
        }
        itemContainer.addEventListener('click', (event) => {
          const returnPath = itemContainer.dataset.returnPath || '';
          if (!returnPath || event.target?.closest?.('.job-progress-stop')) return;
          window.dispatchEvent(new CustomEvent('app:navigate-tool', { detail: { path: returnPath } }));
        });
        tasksHost.appendChild(itemContainer);
        ui = createJobProgress(itemContainer, {
          variant: 'compact',
          stopLabel: 'Cancel',
          onStop: (event) => {
            event?.stopPropagation?.();
            task.onStop?.();
          }
        });
        activeTaskUis.set(task.id, ui);
      } else {
        const itemContainer = ui.root.parentElement;
        itemContainer?.classList.toggle('is-returnable', Boolean(task.returnPath));
        if (itemContainer && task.returnPath) itemContainer.dataset.returnPath = task.returnPath;
        else if (itemContainer) delete itemContainer.dataset.returnPath;
      }
      ui.update({
        title: task.title,
        detail: task.detail,
        progress: task.progress,
        busy: task.busy,
        cancellable: task.cancellable,
        tone: task.tone
      });
    });

    tasksHost.classList.toggle('hidden', tasks.length === 0);
  };

  const unsubscribeTasks = taskManager.subscribe(syncTasks);

  const runSidebarMediaAction = (action) => {
    const handlers = sidebarMediaState?.handlers || {};
    if (action === 'toggle') {
      const direct = handlers.toggle;
      if (typeof direct === 'function') {
        direct();
        return;
      }
      const fallback = sidebarMediaState?.playbackState === 'playing' ? handlers.pause : handlers.play;
      if (typeof fallback === 'function') fallback();
      return;
    }
    const handler = handlers[action];
    if (typeof handler === 'function') handler();
  };

  const clearSidebarMediaControls = () => {
    while (mediaControlsHost?.children?.length) {
      mediaControlsHost.removeChild(mediaControlsHost.children[0]);
    }
    if (mediaControlsHost) mediaControlsHost.textContent = '';
  };

  const createSidebarMediaButton = ({ action, label, title, disabled = false, primary = false }) => {
    const node = button({
      document,
      className: `sidebar-media-button${primary ? ' is-primary' : ''}`,
      text: label,
      attrs: {
        type: 'button',
        title
      },
      dataset: { mediaSidebarAction: action },
      props: { disabled },
      on: {
        click(event) {
          event.stopPropagation();
          if (node.disabled) return;
          runSidebarMediaAction(action);
        }
      }
    });
    return node;
  };

  const renderSidebarMediaControls = () => {
    if (!mediaControlsHost) return;
    const playbackState = sidebarMediaState?.playbackState || 'none';
    const canShow = sidebarMediaState?.active && playbackState === 'playing';
    if (!canShow) {
      clearSidebarMediaControls();
      mediaControlsHost.classList.add('hidden');
      return;
    }
    const handlers = sidebarMediaState.handlers || {};
    const metadata = sidebarMediaState.metadata || {};
    const canPrevious = typeof handlers.previoustrack === 'function';
    const canNext = typeof handlers.nexttrack === 'function';
    const canStop = typeof handlers.stop === 'function';
    mediaControlsHost.classList.remove('hidden');
    clearSidebarMediaControls();
    mediaControlsHost.appendChild(div({ document, className: 'sidebar-media-card' }, [
      div({ document, className: 'sidebar-media-copy' }, [
        span({ document, className: 'sidebar-media-kicker', text: 'Now Playing' }),
        el('strong', { document, className: 'sidebar-media-title', text: metadata.title || 'Media' }),
        span({ document, className: 'sidebar-media-artist', text: metadata.artist || '' })
      ]),
      div({ document, className: 'sidebar-media-actions' }, [
        createSidebarMediaButton({ action: 'previoustrack', label: 'Prev', title: 'Previous', disabled: !canPrevious }),
        createSidebarMediaButton({ action: 'stop', label: 'Stop', title: 'Stop', disabled: !canStop, primary: true }),
        createSidebarMediaButton({ action: 'nexttrack', label: 'Next', title: 'Next', disabled: !canNext })
      ])
    ]));
  };

  const onSidebarMediaControls = (event) => {
    sidebarMediaState = event.detail || null;
    renderSidebarMediaControls();
  };
  window.addEventListener('app:media-controls', onSidebarMediaControls);
  shellChromeCleanup.push(() => window.removeEventListener('app:media-controls', onSidebarMediaControls));

  const enhanceStaticSidebarGroups = () => {
    const groups = sidebar?.querySelector('.sidebar-nav')?.querySelectorAll('.nav-group') || [];
    groups.forEach((group, index) => {
      const title = group.querySelector('.nav-group-title');
      const body = group.querySelector('.nav-sub-menu');
      if (!title || !body) return;
      const groupKey = toSidebarGroupKey(group, index);
      group.dataset.sidebarGroupKey = groupKey;
      if (!group.dataset.groupId) group.dataset.groupId = groupKey;
      if (!title.querySelector('[data-sidebar-group-toggle]')) {
        const titleHtml = title.innerHTML.trim();
        const fallback = escapeHtml(title.textContent || groupKey.replace(/-/g, ' '));
        title.innerHTML = `
          <button
            type="button"
            class="nav-group-toggle"
            data-sidebar-group-toggle="${groupKey}"
            aria-expanded="true"
            aria-controls="sidebar-group-${groupKey}"
          >
            <span class="nav-group-toggle-copy">${titleHtml || fallback}</span>
            <span class="nav-group-toggle-icon" aria-hidden="true"></span>
          </button>
        `;
      }
      body.id = body.id || `sidebar-group-${groupKey}`;
      setSidebarGroupExpanded(group, currentTerm ? true : getSidebarGroupPreference(store, groupKey));
    });
  };

  const bindSidebarGroupToggles = () => {
    groupToggleCleanup.forEach((dispose) => dispose());
    groupToggleCleanup = [];
    const toggles = sidebar?.querySelectorAll('[data-sidebar-group-toggle]') || [];
    toggles.forEach((toggle) => {
      const groupKey = toggle.dataset.sidebarGroupToggle;
      const group = toggle.closest('.nav-group');
      if (!groupKey || !group) return;
      const onClick = () => {
        const expanded = toggle.getAttribute('aria-expanded') !== 'true';
        setSidebarGroupExpanded(group, expanded);
        store?.dispatch?.({
          type: 'SET_PREFERENCE',
          payload: { [`sidebarGroup:${groupKey}:expanded`]: expanded }
        });
      };
      toggle.addEventListener('click', onClick);
      groupToggleCleanup.push(() => toggle.removeEventListener('click', onClick));
    });
  };

  const bindCollectionToggles = () => {
    collectionToggleCleanup.forEach((dispose) => dispose());
    collectionToggleCleanup = [];

    Object.entries(collectionHosts).forEach(([collectionKey, host]) => {
      const toggle = host?.querySelector('[data-collection-toggle]');
      if (!toggle) return;
      const onClick = () => {
        const expanded = toggle.getAttribute('aria-expanded') !== 'true';
        store.dispatch({
          type: 'SET_PREFERENCE',
          payload: { [`sidebarCollection:${collectionKey}:expanded`]: expanded }
        });
      };
      toggle.addEventListener('click', onClick);
      collectionToggleCleanup.push(() => toggle.removeEventListener('click', onClick));
    });
  };

  const filterTools = (term) => {
    currentTerm = String(term || '').toLowerCase().trim();
    const links = sidebar?.querySelectorAll('a[data-route]') || [];
    const groups = sidebar?.querySelectorAll('.nav-group') || [];
    const terms = currentTerm.split(/\s+/).filter(Boolean);

    if (searchClear) {
      searchClear.classList.toggle('is-visible', !!currentTerm);
    }

    links.forEach((link) => {
      const route = getPathnameFromHref(link.href);
      const toolId = route === '/' ? 'home' : route.slice(1);
      const searchable = `${link.getAttribute('data-name') || ''} ${link.getAttribute('data-desc') || ''} ${link.getAttribute('data-keywords') || ''} ${getNavigationSearchText(toolId)}`.toLowerCase();
      const isMatch = terms.length === 0 || terms.every((part) => searchable.includes(part));
      link.classList.toggle('is-filter-hidden', !isMatch);
    });

    groups.forEach((group) => {
      const hasVisible = Array.from(group.querySelectorAll('a[data-route]')).some((link) => !link.classList.contains('is-filter-hidden'));
      group.classList.toggle('is-filter-hidden', !hasVisible);
      const groupKey = group.dataset.sidebarGroupKey;
      if (groupKey) {
        setSidebarGroupExpanded(group, terms.length > 0 ? true : getSidebarGroupPreference(store, groupKey));
      }
    });

    Object.entries(collectionHosts).forEach(([collectionKey, host]) => {
      const toggle = host?.querySelector('[data-collection-toggle]');
      const body = host?.querySelector('.nav-sub-menu');
      if (!toggle || !body) return;
      const expanded = terms.length > 0 ? true : getCollectionPreference(store, collectionKey);
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      body.dataset.collapsed = expanded ? 'false' : 'true';
      body.classList.toggle('is-collapsed', !expanded);
    });
  };

  const renderCollections = () => {
    const activePath = getActiveNavigationPath(window.location.pathname);
    const { favorites, recent } = getNavigationCollections(store?.getState?.().navigation || {});
    if (favoritesHost) favoritesHost.innerHTML = renderSidebarCollection('Favorites', favorites, activePath, getCollectionPreference(store, 'favorites'));
    if (recentsHost) recentsHost.innerHTML = renderSidebarCollection('Recent', recent, activePath, getCollectionPreference(store, 'recent'));
    bindCollectionToggles();
    filterTools(currentTerm);
  };

  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      filterTools(event.target.value);
    });
  }

  if (searchClear && searchInput) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      filterTools('');
      searchInput.focus();
    });
  }

  if (sidebar && store?.subscribe) {
    unsubscribe = store.subscribe(() => {
      syncSidebarPreferences();
      renderCollections();
    });
  }

  if (menuToggle) {
    menuToggle.setAttribute('aria-expanded', 'false');
    const onClick = () => setSidebarOpen(!document.body.classList.contains('is-sidebar-open'));
    menuToggle.addEventListener('click', onClick);
    shellChromeCleanup.push(() => menuToggle.removeEventListener('click', onClick));
  }

  if (sidebarCollapseToggle) {
    const onClick = () => setSidebarPreference({ sidebarCollapsed: !getSidebarCollapsed() });
    sidebarCollapseToggle.addEventListener('click', onClick);
    shellChromeCleanup.push(() => sidebarCollapseToggle.removeEventListener('click', onClick));
  }

  if (sidebarAutoHideToggle) {
    const onClick = () => setSidebarPreference({ sidebarAutoHide: !getSidebarAutoHide() });
    sidebarAutoHideToggle.addEventListener('click', onClick);
    shellChromeCleanup.push(() => sidebarAutoHideToggle.removeEventListener('click', onClick));
  }

  if (sidebarBackdrop) {
    const onClick = () => setSidebarOpen(false);
    sidebarBackdrop.addEventListener('click', onClick);
    shellChromeCleanup.push(() => sidebarBackdrop.removeEventListener('click', onClick));
  }

  if (sidebar) {
    const onClick = (event) => {
      if (!event.target?.closest?.('a[data-route]')) return;
      setSidebarOpen(false);
      if (getSidebarAutoHide()) setSidebarPreference({ sidebarCollapsed: true });
    };
    sidebar.addEventListener('click', onClick);
    shellChromeCleanup.push(() => sidebar.removeEventListener('click', onClick));
  }

  enhanceStaticSidebarGroups();
  bindSidebarGroupToggles();
  syncSidebarPreferences();
  renderCollections();

  return {
    dispose() {
      setSidebarOpen(false);
      document.body.classList.remove('is-sidebar-collapsed', 'is-sidebar-auto-hide');
      shellChromeCleanup.forEach((dispose) => dispose());
      shellChromeCleanup = [];
      collectionToggleCleanup.forEach((dispose) => dispose());
      collectionToggleCleanup = [];
      groupToggleCleanup.forEach((dispose) => dispose());
      groupToggleCleanup = [];
      unsubscribe?.();
      unsubscribe = null;
      unsubscribeTasks();
      activeTaskUis.forEach((ui) => ui.destroy());
      activeTaskUis.clear();
    },
    renderCollections,
    filterTools
  };
}

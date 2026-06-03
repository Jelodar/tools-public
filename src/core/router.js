import { TOOLS, CONFIG } from './config.js';
import { getToolBreadcrumbs, resolveNavigationTool } from './navigation.js';
import { getStudioByToolId } from './studios.js';
import { globalStore } from './store.js';
import { taskManager } from './task-manager.js';
import { TOOL_BOOT_TIMEOUT_MS, createToolErrorMarkup, runWithTimeout } from './router-utils.js';

const MAX_PRESERVED_TOOL_SESSIONS = 12;

function getPathnameFromHref(href = '/') {
  return new URL(href, 'https://tools.local').pathname;
}

export class Router {
  constructor(rootElement) {
    this.root = rootElement;
    this.currentToolModule = null;
    this.currentPath = null;
    this.navigationToken = 0;
    this.toolBootTimeoutMs = TOOL_BOOT_TIMEOUT_MS;
    this.loader = document.getElementById('loading-overlay');
    this.routes = new Map(TOOLS.map(t => [t.path, t]));
    this.contentArea = document.getElementById('content');
    this.preservedToolSessions = new Map();
    this.preservedToolOrder = [];
    this.unsubscribeTasks = taskManager.subscribe(() => this.disposeExpiredPreservedToolSessions());
    this.init();
  }

  init() {
    window.addEventListener('popstate', () => this.handleNavigation(window.location.pathname, false));
    window.addEventListener('app:navigate-tool', (event) => {
      const path = event.detail?.path;
      if (typeof path === 'string' && path.startsWith('/')) this.handleNavigation(path);
    });
    document.body.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-route]');
      if (link) {
        e.preventDefault();
        this.handleNavigation(new URL(link.href).pathname);
      }
    });
  }

  async handleNavigation(path, pushState = true, options = {}) {
    const tool = this.routes.get(path) || this.routes.get('/');
    const resolvedPath = tool.path;
    if (!options.force && this.currentPath === resolvedPath) return;
    const previousPath = this.currentPath;
    const navigationToken = ++this.navigationToken;

    if (this.currentToolModule?.unmount) {
      if (!options.force && this.shouldPreserveCurrentToolSession(previousPath)) {
        this.preserveCurrentToolSession(previousPath);
      } else {
        try { this.currentToolModule.unmount(); } catch (err) { console.error(err); }
      }
    }
    this.currentToolModule = null;
    this.currentPath = resolvedPath;
    
    this.updateUI(tool);
    if (pushState) window.history.pushState({}, '', tool.path);
    if (tool.id !== 'home') {
      globalStore.dispatch({ type: 'TOUCH_RECENT_TOOL', toolId: tool.id }).catch((err) => console.warn('Failed to persist recent tool:', err));
    }

    this.root.innerHTML = '';
    if (this.restorePreservedToolSession(resolvedPath)) {
      if (this.contentArea) this.contentArea.scrollTop = 0;
      return;
    }

    this.showLoader(true);

    const toolContainer = document.createElement('div');
    toolContainer.id = `tool-container-${tool.id}`;
    toolContainer.className = 'isolated-tool-root';
    toolContainer.style.cssText = 'position: relative; width: 100%; height: 100%; min-height: 0; display: flex; flex-direction: column;';
    this.root.appendChild(toolContainer);
    
    if (this.contentArea) this.contentArea.scrollTop = 0;
    
    try {
      const module = await runWithTimeout(
        import(`../tools/${tool.id}.js`),
        this.toolBootTimeoutMs,
        `${tool.title} import timed out after ${Math.ceil(this.toolBootTimeoutMs / 1000)} seconds.`
      );
      if (navigationToken !== this.navigationToken) return;
      this.currentToolModule = module;
      if (module.mount) {
        await runWithTimeout(
          module.mount(toolContainer),
          this.toolBootTimeoutMs,
          `${tool.title} mount timed out after ${Math.ceil(this.toolBootTimeoutMs / 1000)} seconds.`
        );
        if (navigationToken !== this.navigationToken) {
          if (module.unmount) {
            try { module.unmount(); } catch (err) { console.error(err); }
          }
          return;
        }
      }
    } catch (err) {
      if (navigationToken !== this.navigationToken) return;
      console.error(err);
      this.currentToolModule = null;
      toolContainer.innerHTML = createToolErrorMarkup(tool, err, this.toolBootTimeoutMs);
      const retryButton = toolContainer.querySelector('[data-error-retry]');
      if (retryButton) {
        retryButton.addEventListener('click', () => this.handleNavigation(tool.path, false, { force: true }), { once: true });
      }
    } finally {
      if (navigationToken === this.navigationToken) this.showLoader(false);
    }
  }

  hasReturnableTaskForPath(path) {
    if (!path) return false;
    return taskManager.getTasks().some((task) => task.returnPath === path);
  }

  shouldPreserveCurrentToolSession(path) {
    return Boolean(
      path &&
      this.currentToolModule &&
      this.root?.firstElementChild &&
      (this.hasReturnableTaskForPath(path) || this.isReturnableToolSessionPath(path))
    );
  }

  isReturnableToolSessionPath(path) {
    const tool = this.routes.get(path);
    return Boolean(tool && tool.id !== 'home');
  }

  preserveCurrentToolSession(path) {
    const node = this.root?.firstElementChild;
    if (!node) return;
    const previous = this.preservedToolSessions.get(path);
    if (previous?.module?.unmount) {
      try { previous.module.unmount(); } catch (err) { console.error(err); }
    }
    previous?.node?.remove();
    this.preservedToolSessions.set(path, {
      module: this.currentToolModule,
      node
    });
    this.preservedToolOrder = this.preservedToolOrder.filter((entry) => entry !== path);
    this.preservedToolOrder.push(path);
    node.remove();
    this.trimPreservedToolSessions();
  }

  restorePreservedToolSession(resolvedPath) {
    const session = this.preservedToolSessions.get(resolvedPath);
    if (!session) return false;
    this.preservedToolSessions.delete(resolvedPath);
    this.preservedToolOrder = this.preservedToolOrder.filter((entry) => entry !== resolvedPath);
    this.root.appendChild(session.node);
    this.currentToolModule = session.module;
    return true;
  }

  trimPreservedToolSessions() {
    while (this.preservedToolOrder.length > MAX_PRESERVED_TOOL_SESSIONS) {
      const path = this.preservedToolOrder.shift();
      const session = this.preservedToolSessions.get(path);
      if (!session) continue;
      if (session.module?.unmount) {
        try { session.module.unmount(); } catch (err) { console.error(err); }
      }
      session.node.remove();
      this.preservedToolSessions.delete(path);
    }
  }

  disposeExpiredPreservedToolSessions() {
    for (const [path, session] of this.preservedToolSessions.entries()) {
      if (this.hasReturnableTaskForPath(path) || this.isReturnableToolSessionPath(path)) continue;
      if (session.module?.unmount) {
        try { session.module.unmount(); } catch (err) { console.error(err); }
      }
      session.node.remove();
      this.preservedToolSessions.delete(path);
      this.preservedToolOrder = this.preservedToolOrder.filter((entry) => entry !== path);
    }
  }

  showLoader(show) {
    if (!this.loader) return;
    if (show) {
      const currentHeight = this.root?.getBoundingClientRect().height || 0;
      if (this.root) {
        this.root.style.minHeight = `${Math.max(420, Math.ceil(currentHeight))}px`;
      }
    } else if (this.root) {
      requestAnimationFrame(() => {
        if (this.root) this.root.style.minHeight = '';
      });
    }
    this.loader.classList.toggle('hidden', !show);
  }

  updateUI(tool) {
    document.title = tool.id === 'home' ? CONFIG.title : `${tool.title} - ${CONFIG.title}`;
    const activeNavigationTool = resolveNavigationTool(tool.id) || tool;
    document.querySelectorAll('a[data-route]').forEach(link => {
      link.setAttribute('data-active', getPathnameFromHref(link.href) === activeNavigationTool.path ? 'true' : 'false');
    });
    const header = document.querySelector('article header');
    if (header) {
      const studio = getStudioByToolId(tool.id);
      const breadcrumbRoot = header.querySelector('#route-breadcrumbs');
      if (breadcrumbRoot) {
        const breadcrumbs = getToolBreadcrumbs(tool.id);
        breadcrumbRoot.innerHTML = breadcrumbs.map((item, index) => {
          const isCurrent = index === breadcrumbs.length - 1;
          const content = item.path
            ? `<a href="${item.path}"${item.path === '/' || !isCurrent ? ' data-route' : ' data-route aria-current="page"'}>${item.label}</a>`
            : `<span>${item.label}</span>`;
          const separator = isCurrent ? '' : '<span class="route-breadcrumb-separator">/</span>';
          return `${content}${separator}`;
        }).join('');
      }
      header.querySelector('h1').textContent = tool.title;
      header.querySelector('p').textContent = studio && studio.entryToolId !== tool.id
        ? `${tool.description} Part of ${studio.title}.`
        : tool.description;
    }
  }
}

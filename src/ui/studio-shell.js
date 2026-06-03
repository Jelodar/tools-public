import { escapeHtml } from '../utils/string-utils.js';

function renderToolButton(tool, activeToolId) {
  const active = tool.id === activeToolId ? ' is-active' : '';
  return `
    <button type="button" class="workspace-studio-tool${active}" data-studio-tool="${escapeHtml(tool.id)}" title="${escapeHtml(tool.label)}">
      <span class="workspace-studio-tool-icon">${tool.icon || ''}</span>
    </button>
  `;
}

function renderShelfTab(label, activeShelf) {
  const active = label === activeShelf ? ' is-active' : '';
  return `<button type="button" class="workspace-studio-shelf-tab${active}" data-studio-shelf-tab="${escapeHtml(label)}">${escapeHtml(label)}</button>`;
}

export function createStudioShell(parent, {
  projectName = 'Untitled',
  tools = [],
  activeToolId = tools[0]?.id || '',
  shelfTabs = ['Timeline'],
  activeShelf = shelfTabs[0] || '',
  onAction = () => {}
} = {}) {
  const root = document.createElement('section');
  root.className = 'workspace-studio-shell';
  root.innerHTML = `
    <header class="workspace-studio-header">
      <input class="workspace-studio-project" data-studio-project value="${escapeHtml(projectName)}">
      <div class="workspace-studio-selector">
        ${tools.map((tool) => `<button type="button" class="workspace-studio-selector-item${tool.id === activeToolId ? ' is-active' : ''}" data-studio-tool-select="${escapeHtml(tool.id)}">${escapeHtml(tool.label)}</button>`).join('')}
      </div>
      <div class="workspace-studio-actions">
        <button type="button" data-studio-action="save">Save</button>
        <button type="button" data-studio-action="export">Export</button>
        <button type="button" data-studio-action="think" data-active="false">Think</button>
      </div>
    </header>
    <div class="workspace-studio-body">
      <nav class="workspace-studio-toolbar">
        ${tools.map((tool) => renderToolButton(tool, activeToolId)).join('')}
      </nav>
      <main class="workspace-studio-workspace"></main>
      <aside class="workspace-studio-inspector"></aside>
    </div>
    <section class="workspace-studio-shelf">
      <div class="workspace-studio-shelf-tabs">
        ${shelfTabs.map((label) => renderShelfTab(label, activeShelf)).join('')}
        <button type="button" data-studio-action="toggle-shelf">Collapse</button>
      </div>
      <div class="workspace-studio-shelf-content"></div>
    </section>
  `;
  parent.appendChild(root);

  const header = root.querySelector('.workspace-studio-header');
  const body = root.querySelector('.workspace-studio-body');
  const toolbar = root.querySelector('.workspace-studio-toolbar');
  const workspace = root.querySelector('.workspace-studio-workspace');
  const inspector = root.querySelector('.workspace-studio-inspector');
  const shelf = root.querySelector('.workspace-studio-shelf');
  const shelfContent = root.querySelector('.workspace-studio-shelf-content');
  const projectInput = root.querySelector('[data-studio-project]');
  const listeners = [];

  const emit = (event) => onAction(event);
  const listen = (node, type, handler) => {
    node.addEventListener(type, handler);
    listeners.push(() => node.removeEventListener(type, handler));
  };

  listen(root, 'click', (event) => {
    const actionNode = event.target.closest('[data-studio-action]');
    if (actionNode) {
      const type = actionNode.dataset.studioAction;
      if (type === 'think') {
        actionNode.dataset.active = actionNode.dataset.active === 'true' ? 'false' : 'true';
      }
      if (type === 'toggle-shelf') {
        shelf.classList.toggle('is-collapsed');
      }
      emit({ type, target: actionNode });
      return;
    }
    const toolNode = event.target.closest('[data-studio-tool]') || event.target.closest('[data-studio-tool-select]');
    if (toolNode) {
      const toolId = toolNode.dataset.studioTool || toolNode.dataset.studioToolSelect;
      api.setActiveTool(toolId);
      emit({ type: 'tool', toolId, target: toolNode });
      return;
    }
    const shelfNode = event.target.closest('[data-studio-shelf-tab]');
    if (shelfNode) {
      api.setActiveShelf(shelfNode.dataset.studioShelfTab);
      emit({ type: 'shelf', shelf: shelfNode.dataset.studioShelfTab, target: shelfNode });
    }
  });

  const api = {
    root,
    header,
    body,
    toolbar,
    workspace,
    inspector,
    shelf,
    shelfContent,
    setProjectName(value) {
      projectInput.value = String(value ?? '');
    },
    setActiveTool(toolId) {
      root.querySelectorAll('[data-studio-tool], [data-studio-tool-select]').forEach((node) => {
        const id = node.dataset.studioTool || node.dataset.studioToolSelect;
        node.classList.toggle('is-active', id === toolId);
      });
    },
    setActiveShelf(label) {
      root.querySelectorAll('[data-studio-shelf-tab]').forEach((node) => {
        node.classList.toggle('is-active', node.dataset.studioShelfTab === label);
      });
    },
    setInspector(content) {
      if (typeof content === 'string') {
        inspector.innerHTML = content;
      } else {
        inspector.innerHTML = '';
        if (content) inspector.appendChild(content);
      }
    },
    setShelfContent(content) {
      if (typeof content === 'string') {
        shelfContent.innerHTML = content;
      } else {
        shelfContent.innerHTML = '';
        if (content) shelfContent.appendChild(content);
      }
    },
    setShelfCollapsed(collapsed) {
      shelf.classList.toggle('is-collapsed', Boolean(collapsed));
    },
    setThinkEnabled(enabled) {
      const node = root.querySelector('[data-studio-action="think"]');
      if (node) node.dataset.active = enabled ? 'true' : 'false';
    },
    destroy() {
      listeners.splice(0).forEach((cleanup) => cleanup());
      root.remove();
    }
  };

  return api;
}

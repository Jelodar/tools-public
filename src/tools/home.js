import { TOOLS, ICONS } from '../core/config.js';
import { getNavigationCategories, getNavigationTools, resolveNavigationTool } from '../core/navigation.js';
import { STUDIOS, getStudioByToolId } from '../core/studios.js';
import { globalStore } from '../core/store.js';
import { computeDashboardSummary } from '../utils/dashboard.js';

let container = null;
let unsubscribe = null;

const CATEGORY_LABELS = {
  dev: 'Development',
  crypto: 'Security & Crypto',
  media: 'Media & Design',
  data: 'Data & Text',
  time: 'Time & Units',
  network: 'Network & DevOps'
};

export async function mount(parent) {
  container = document.createElement('div');
  container.className = 'tool-home';
  parent.appendChild(container);

  const render = () => {
    const entries = getNavigationTools().filter((tool) => tool.id !== 'home');
    const summary = computeDashboardSummary({
      tools: TOOLS,
      entryTools: getNavigationTools(),
      studios: STUDIOS,
      categories: getNavigationCategories()
    });
    const { recentTools = [], favoriteTools = [] } = globalStore.getState().navigation || {};
    const favorites = uniqueTools(favoriteTools.map((toolId) => resolveNavigationTool(toolId)).filter(Boolean));
    const recent = uniqueTools(recentTools.map((toolId) => resolveNavigationTool(toolId)).filter(Boolean));

    const categories = groupByCategory(entries);

    container.innerHTML = `<div class="dashboard-summary">
        ${renderStudiosSection()}
        ${renderPinnedSection('Favorites', favorites, 'Pin tools from the dashboard cards to keep them here.')}
        ${renderPinnedSection('Recent', recent, 'Open a tool once and it will appear here for faster return navigation.')}
        ${Object.entries(categories).map(([category, tools]) => renderCategorySection(category, tools, favorites.map((tool) => tool.id))).join('')}
      </div>
    `;

    container.querySelectorAll('[data-favorite-tool]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        globalStore.dispatch({ type: 'TOGGLE_FAVORITE_TOOL', toolId: button.dataset.favoriteTool });
      });
    });
  };

  unsubscribe = globalStore.subscribe(render);
  render();
}

export function unmount() {
  unsubscribe?.();
  unsubscribe = null;
  if (container) {
    container.remove();
    container = null;
  }
}

function groupByCategory(entries) {
  return entries.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {});
}

function uniqueTools(tools) {
  const seen = new Set();
  return tools.filter((tool) => {
    if (!tool || seen.has(tool.id)) return false;
    seen.add(tool.id);
    return true;
  });
}

function renderStudiosSection() {
  return `
    <section class="dashboard-section">
      <div class="dashboard-section-head">
        <h2>Studios</h2>
        <p>Shared workspaces that absorb smaller focused views.</p>
      </div>
      <div class="tool-grid studio-grid">
        ${STUDIOS.map((studio) => {
          const entryTool = TOOLS.find((tool) => tool.id === studio.entryToolId);
          return `
            <a href="${entryTool.path}" data-route class="tool-card studio-card-link">
              <div class="card-inner studio-summary-card">
                <div class="tool-card-topline">
                  <div class="icon-box">
                    ${ICONS[entryTool.icon] || ICONS.home}
                  </div>
                  <span class="studio-route-count">${studio.toolIds.length} Tools</span>
                </div>
                <div class="card-content">
                  <h3>${studio.title}</h3>
                  <p>${studio.description}</p>
                </div>
                <div class="studio-chip-row">
                  ${studio.toolIds.map((toolId) => `<span>${TOOLS.find((tool) => tool.id === toolId)?.title || toolId}</span>`).join('')}
                </div>
              </div>
            </a>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function renderPinnedSection(title, tools, emptyMessage) {
  return `
    <section class="dashboard-section">
      <div class="dashboard-section-head">
        <h2>${title}</h2>
        <p>${tools.length ? `${tools.length} tools` : emptyMessage}</p>
      </div>
      <div class="tool-grid">
        ${tools.length ? tools.map((tool) => renderToolCard(tool, true)).join('') : '<div class="dashboard-empty-state">No tools yet.</div>'}
      </div>
    </section>
  `;
}

function renderCategorySection(category, tools, favoriteTools) {
  return `
    <section class="dashboard-section">
      <div class="dashboard-section-head">
        <h2>${CATEGORY_LABELS[category] || 'Other'}</h2>
        <p>${tools.length} entry routes</p>
      </div>
      <div class="tool-grid">
        ${tools.map((tool) => renderToolCard(tool, favoriteTools.includes(tool.id))).join('')}
      </div>
    </section>
  `;
}

function renderToolCard(tool, isFavorite) {
  const studio = getStudioByToolId(tool.id);
  return `
    <a href="${tool.path}" data-route class="tool-card">
      <div class="card-inner">
        <div class="tool-card-topline">
          <div class="icon-box">
            ${ICONS[tool.icon] || ICONS.home}
          </div>
          <button class="tool-favorite-button${isFavorite ? ' is-active' : ''}" data-favorite-tool="${tool.id}" aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
            ${isFavorite ? 'Pinned' : 'Pin'}
          </button>
        </div>
        <div class="card-content">
          <h3>${tool.title}</h3>
          <p>${tool.description}</p>
          ${studio ? `<div class="tool-card-meta">${studio.title}</div>` : ''}
        </div>
      </div>
    </a>
  `;
}

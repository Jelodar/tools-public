import { ICONS, TOOLS } from '../../core/config.js';

function getTool(toolId) {
  return TOOLS.find((tool) => tool.id === toolId);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function createStudioShell(parent, {
  className = '',
  eyebrow = '',
  title = '',
  description = '',
  toolIds = [],
  activeToolId = '',
  metrics = [],
  showHero = true,
  showRouteTabs = true
} = {}) {
  const root = document.createElement('div');
  root.className = `studio-shell ${className}`.trim();
  const routeTabs = toolIds
    .map((toolId) => ({ toolId, tool: getTool(toolId) }))
    .filter((entry) => entry.tool?.path && !entry.tool.hidden);
  root.innerHTML = `
    ${showHero ? `<section class="studio-hero card">
      <div class="studio-hero-copy">
        ${eyebrow ? `<div class="studio-eyebrow">${escapeHtml(eyebrow)}</div>` : ''}
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(description)}</p>
      </div>
      ${metrics.length ? `
        <div class="studio-metric-grid">
          ${metrics.map((metric) => `
            <div class="studio-metric-card">
              <span>${escapeHtml(metric.label)}</span>
              <strong data-metric-key="${escapeHtml(metric.key)}">${escapeHtml(metric.value)}</strong>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </section>` : ''}
    ${showRouteTabs && toolIds.length > 1 && routeTabs.length ? `
      <nav class="studio-route-tabs" aria-label="${escapeHtml(title)} views">
        ${routeTabs.map(({ toolId, tool }) => {
          return `
            <a href="${escapeHtml(tool.path)}" data-route data-route-target="${escapeHtml(toolId)}" class="studio-route-tab${toolId === activeToolId ? ' is-active' : ''}">
              <span class="studio-route-tab-icon">${ICONS[tool.icon] || ICONS.home}</span>
              <span>${escapeHtml(tool.title)}</span>
            </a>
          `;
        }).join('')}
      </nav>
    ` : ''}
    <div class="studio-content"></div>
    <div class="studio-status" data-tone="neutral">Ready.</div>
  `;

  parent.appendChild(root);

  return {
    root,
    content: root.querySelector('.studio-content'),
    status: root.querySelector('.studio-status'),
    setMetric(key, value) {
      const node = root.querySelector(`[data-metric-key="${key}"]`);
      if (node) node.textContent = value;
    },
    setStatus(message, tone = 'neutral') {
      const status = root.querySelector('.studio-status');
      if (!status) return;
      status.textContent = message;
      status.dataset.tone = tone;
    }
  };
}

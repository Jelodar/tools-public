import { TOOLS } from '../../core/config.js';
import { getStudioByToolId } from '../../core/studios.js';
import { downloadFile, showToast } from '../../ui/ui-utils.js';
import { collectDeviceCapabilityGroups } from '../../utils/device-capabilities.js';
import { createStudioShell } from './studio-shell.js';

let state = null;

const DISPLAY_SWATCHES = [
  { color: '#ff3b30', className: 'device-swatch-red' },
  { color: '#ffd60a', className: 'device-swatch-yellow' },
  { color: '#34c759', className: 'device-swatch-green' },
  { color: '#0a84ff', className: 'device-swatch-blue' },
  { color: '#ffffff', className: 'device-swatch-white' },
  { color: '#000000', className: 'device-swatch-black' }
];

function getTool(toolId) {
  return TOOLS.find((tool) => tool.id === toolId);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function readBattery() {
  if (!navigator.getBattery) {
    return Promise.resolve('Not supported');
  }

  return navigator.getBattery()
    .then((battery) => `${Math.round(battery.level * 100)}% (${battery.charging ? 'Charging' : 'Discharging'})`)
    .catch(() => 'Not supported');
}

function collectEnvironmentData(battery) {
  return {
    system: [
      { label: 'Platform', value: navigator.platform || 'Unknown' },
      { label: 'Cores', value: navigator.hardwareConcurrency || 'Unknown' },
      { label: 'Memory', value: navigator.deviceMemory ? `~${navigator.deviceMemory} GB` : 'Unknown' },
      { label: 'Battery', value: battery }
    ],
    browser: [
      { label: 'Language', value: navigator.language || 'Unknown' },
      { label: 'Online', value: navigator.onLine ? 'Yes' : 'No' },
      { label: 'Cookies', value: navigator.cookieEnabled ? 'Enabled' : 'Disabled' },
      { label: 'Timezone', value: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown' }
    ],
    display: [
      { label: 'Resolution', value: `${window.screen.width}x${window.screen.height}` },
      { label: 'Viewport', value: `${window.innerWidth}x${window.innerHeight}` },
      { label: 'Pixel Ratio', value: `${window.devicePixelRatio}` },
      { label: 'Color Depth', value: `${window.screen.colorDepth}-bit` }
    ]
  };
}

function renderCapabilityGroups(groups) {
  return groups.map((group) => `
    <div class="device-capability-group">
      <h4>${escapeHtml(group.label)}</h4>
      <div class="device-capability-list">
        ${group.items.map((item) => `
          <div class="device-capability-item${item.supported ? ' is-available' : ''}">
            <span>${escapeHtml(item.label)}</span>
            <code>${escapeHtml(item.value)}</code>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function renderEnvironmentSections(data) {
  return Object.entries(data).map(([section, items]) => `
    <div class="studio-panel">
      <div class="studio-panel-head">
        <h3>${section[0].toUpperCase()}${section.slice(1)}</h3>
      </div>
      <div class="studio-list">
        ${items.map((item) => `
          <div class="studio-list-item">
            <span>${escapeHtml(item.label)}</span>
            <code>${escapeHtml(item.value)}</code>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function renderDeviceLab(defaultTab) {
  return `
    <div class="studio-stack">
      <section class="card studio-card">
        <div class="tabs-header">
          ${[
            ['environment', 'Environment'],
            ['input', 'Input'],
            ['display', 'Display']
          ].map(([id, label]) => `
            <button class="tab-btn${id === defaultTab ? ' active' : ''}" data-device-tab="${id}">${label}</button>
          `).join('')}
        </div>

        <section class="device-view${defaultTab === 'environment' ? '' : ' hidden'}" data-view="environment">
          <div class="studio-toolbar">
            <div class="studio-toolbar-group">
              <div class="studio-field">
                <span>Snapshot</span>
                <strong id="device-captured-at">${new Date().toLocaleTimeString()}</strong>
              </div>
            </div>
            <div class="studio-toolbar-group studio-toolbar-actions">
              <button id="device-refresh">Refresh</button>
              <button id="device-export" class="btn-secondary">Export JSON</button>
            </div>
          </div>
          <div id="device-environment-grid" class="studio-panel-grid studio-panel-grid-dual"></div>
          <div class="studio-panel">
            <div class="studio-panel-head">
              <h3>Capability Surfaces</h3>
            </div>
            <div id="device-capability-grid" class="device-capability-grid"></div>
          </div>
          <div class="studio-panel">
            <div class="studio-panel-head">
              <h3>User Agent</h3>
            </div>
            <div class="studio-output-card">
              <code id="device-user-agent"></code>
            </div>
          </div>
        </section>

        <section class="device-view${defaultTab === 'input' ? '' : ' hidden'}" data-view="input">
          <div class="studio-panel-grid studio-panel-grid-dual">
            <div class="studio-panel">
              <div class="studio-panel-head">
                <h3>Keyboard</h3>
              </div>
              <div class="studio-output-card">
                <span>Last Key</span>
                <strong id="device-key-display">Press a key</strong>
                <code id="device-key-details">Focus this page and press any key.</code>
              </div>
            </div>
            <div class="studio-panel">
              <div class="studio-panel-head">
                <h3>Pointer</h3>
              </div>
              <div id="device-pointer-zone" class="studio-empty device-pointer-zone">
                Move or click here
                <div id="device-pointer-dot" class="device-pointer-dot"></div>
              </div>
              <div class="studio-output-card">
                <span>Pointer State</span>
                <code id="device-pointer-details">Waiting for pointer input.</code>
              </div>
              <div class="studio-output-card">
                <span>Wheel</span>
                <code id="device-wheel-details">Scroll over the pointer zone.</code>
              </div>
            </div>
          </div>
        </section>

        <section class="device-view${defaultTab === 'display' ? '' : ' hidden'}" data-view="display">
          <div class="studio-panel">
            <div class="studio-panel-head">
              <h3>Color Patterns</h3>
            </div>
            <div class="studio-result-grid">
              ${DISPLAY_SWATCHES.map(({ color, className }) => `
                <button class="device-color-swatch ${className}" data-color="${color}"></button>
              `).join('')}
            </div>
          </div>
          <div class="studio-panel-grid studio-panel-grid-dual">
            <div class="studio-output-card">
              <span>Fullscreen</span>
              <code>Click any swatch to enter fullscreen. Click again or press escape to exit.</code>
            </div>
            <div class="studio-output-card">
              <span>Current Panel</span>
              <code id="device-display-details">No active test pattern.</code>
            </div>
          </div>
          <div id="device-fullscreen-test" class="hidden device-fullscreen-test"></div>
        </section>
      </section>
    </div>
  `;
}

export async function mountDeviceLab(parent, toolId) {
  const tool = getTool(toolId);
  const studio = getStudioByToolId(toolId);
  const defaultTab = ({
    'input-tester': 'input',
    'display-tester': 'display'
  })[toolId] || 'environment';
  const battery = await readBattery();
  const shell = createStudioShell(parent, {
    className: 'device-lab-shell',
    eyebrow: studio.title,
    title: tool.title,
    description: ({
      'input-tester': 'Keyboard, pointer, and wheel diagnostics now live beside environment and display checks.',
      'display-tester': 'Display test patterns now live inside Device Lab with compatibility routing preserved.'
    })[toolId] || 'Inspect environment signals, test input handling, and run fullscreen display checks from one workspace.',
    toolIds: studio.toolIds,
    activeToolId: toolId,
    metrics: [
      { key: 'platform', label: 'Platform', value: navigator.platform || 'Unknown' },
      { key: 'viewport', label: 'Viewport', value: `${window.innerWidth}x${window.innerHeight}` }
    ]
  });

  shell.content.innerHTML = renderDeviceLab(defaultTab);

  const cleanup = [];
  let environmentData = collectEnvironmentData(battery);
  let capabilityData = await collectDeviceCapabilityGroups();

  const renderEnvironment = () => {
    shell.content.querySelector('#device-captured-at').textContent = new Date().toLocaleTimeString();
    shell.content.querySelector('#device-environment-grid').innerHTML = renderEnvironmentSections(environmentData);
    shell.content.querySelector('#device-capability-grid').innerHTML = renderCapabilityGroups(capabilityData);
    shell.content.querySelector('#device-user-agent').textContent = navigator.userAgent;
  };

  const openView = (viewId) => {
    shell.content.querySelectorAll('[data-device-tab]').forEach((button) => {
      button.classList.toggle('active', button.dataset.deviceTab === viewId);
    });
    shell.content.querySelectorAll('.device-view').forEach((view) => {
      view.classList.toggle('hidden', view.dataset.view !== viewId);
    });
  };

  const refreshEnvironment = async () => {
    environmentData = collectEnvironmentData(await readBattery());
    capabilityData = await collectDeviceCapabilityGroups();
    shell.setMetric('viewport', `${window.innerWidth}x${window.innerHeight}`);
    renderEnvironment();
    shell.setStatus('Environment snapshot refreshed.', 'success');
  };

  const exportEnvironment = () => {
    downloadFile(
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          environment: environmentData,
          capabilities: capabilityData,
          userAgent: navigator.userAgent
        },
        null,
        2
      ),
      'device-lab-report.json',
      'application/json'
    );
    showToast('Device report exported.', 'success');
    shell.setStatus('Device report exported.', 'success');
  };

  const pointerZone = shell.content.querySelector('#device-pointer-zone');
  const pointerDot = shell.content.querySelector('#device-pointer-dot');
  const pointerDetails = shell.content.querySelector('#device-pointer-details');
  const wheelDetails = shell.content.querySelector('#device-wheel-details');
  const keyDisplay = shell.content.querySelector('#device-key-display');
  const keyDetails = shell.content.querySelector('#device-key-details');
  const fullscreenPanel = shell.content.querySelector('#device-fullscreen-test');
  const displayDetails = shell.content.querySelector('#device-display-details');

  const onKeyDown = (event) => {
    keyDisplay.textContent = event.key === ' ' ? 'Space' : event.key;
    keyDetails.textContent = `Code ${event.code} | Ctrl ${event.ctrlKey} | Shift ${event.shiftKey} | Alt ${event.altKey} | Meta ${event.metaKey}`;
  };

  const onPointerMove = (event) => {
    const rect = pointerZone.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);
    pointerDot.style.left = `${x}px`;
    pointerDot.style.top = `${y}px`;
    pointerDetails.textContent = `X ${x} | Y ${y} | Buttons ${event.buttons} | Pointer ${event.pointerType || 'mouse'}`;
  };

  const onWheel = (event) => {
    wheelDetails.textContent = `deltaX ${Math.round(event.deltaX)} | deltaY ${Math.round(event.deltaY)} | mode ${event.deltaMode}`;
  };

  const onFullscreenChange = () => {
    if (!document.fullscreenElement) {
      fullscreenPanel.classList.add('hidden');
      displayDetails.textContent = 'No active test pattern.';
    }
  };

  cleanup.push(...Array.from(shell.content.querySelectorAll('[data-device-tab]')).map((button) => bind(button, 'click', () => openView(button.dataset.deviceTab))));
  cleanup.push(bind(shell.content.querySelector('#device-refresh'), 'click', refreshEnvironment));
  cleanup.push(bind(shell.content.querySelector('#device-export'), 'click', exportEnvironment));
  cleanup.push(bind(window, 'keydown', onKeyDown));
  cleanup.push(bind(pointerZone, 'pointermove', onPointerMove));
  cleanup.push(bind(pointerZone, 'pointerdown', onPointerMove));
  cleanup.push(bind(pointerZone, 'wheel', onWheel));
  cleanup.push(bind(document, 'fullscreenchange', onFullscreenChange));
  cleanup.push(...Array.from(shell.content.querySelectorAll('.device-color-swatch')).map((button) => bind(button, 'click', async () => {
    fullscreenPanel.style.background = button.dataset.color;
    fullscreenPanel.classList.remove('hidden');
    displayDetails.textContent = `Active pattern ${button.dataset.color}`;
    if (fullscreenPanel.requestFullscreen) {
      try {
        await fullscreenPanel.requestFullscreen();
      } catch {
        shell.setStatus('Fullscreen request was blocked.', 'danger');
      }
    }
  })));
  cleanup.push(bind(fullscreenPanel, 'click', async () => {
    fullscreenPanel.classList.add('hidden');
    displayDetails.textContent = 'No active test pattern.';
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
      }
    }
  }));

  renderEnvironment();
  openView(defaultTab);

  state = {
    root: shell.root,
    cleanup
  };
}

export function unmountDeviceLab() {
  if (!state) return;
  for (const dispose of state.cleanup) dispose();
  state.root?.remove();
  state = null;
}

function bind(node, eventName, handler) {
  if (!node) return () => {};
  node.addEventListener(eventName, handler);
  return () => node.removeEventListener(eventName, handler);
}

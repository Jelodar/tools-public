import { TOOLS } from '../../core/config.js';
import { getStudioByToolId } from '../../core/studios.js';
import { copyToClipboard, downloadFile } from '../../ui/ui-utils.js';
import { convertCase, parseUrlDetails, transformEncoding } from '../../utils/text-workbench.js';
import { createStudioShell } from './studio-shell.js';

let state = null;

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

function renderTextWorkbench(defaultTab) {
  return `
    <div class="studio-stack">
      <section class="card studio-card">
        <div class="tabs-header">
          ${[
            ['encode', 'Encoders'],
            ['case', 'Case'],
            ['url', 'URL']
          ].map(([id, label]) => `
            <button class="tab-btn${id === defaultTab ? ' active' : ''}" data-text-tab="${id}">${label}</button>
          `).join('')}
        </div>

        <section class="text-view${defaultTab === 'encode' ? '' : ' hidden'}" data-view="encode">
          <div class="studio-panel-grid studio-panel-grid-dual">
            <div class="studio-panel">
              <div class="studio-panel-head"><h3>Source</h3></div>
              <textarea id="text-encode-input" class="text-workbench-textarea" placeholder="Enter text to encode or decode."></textarea>
              <div class="studio-actions">
                <button data-encode-op="b64-enc">Base64 Encode</button>
                <button data-encode-op="b64-dec" class="btn-secondary">Base64 Decode</button>
                <button data-encode-op="url-enc">URL Encode</button>
                <button data-encode-op="url-dec" class="btn-secondary">URL Decode</button>
                <button data-encode-op="html-enc">HTML Escape</button>
                <button data-encode-op="html-dec" class="btn-secondary">HTML Unescape</button>
                <button data-encode-op="hex-enc">To Hex</button>
                <button data-encode-op="bin-enc" class="btn-secondary">To Binary</button>
              </div>
            </div>
            <div class="studio-panel">
              <div class="studio-panel-head"><h3>Result</h3></div>
              <textarea id="text-encode-output" readonly class="text-workbench-textarea text-workbench-output text-workbench-code-output"></textarea>
              <div class="studio-actions">
                <button id="text-encode-copy">Copy</button>
                <button id="text-encode-download" class="btn-secondary">Download</button>
                <button id="text-encode-clear" class="btn-secondary">Clear</button>
              </div>
            </div>
          </div>
        </section>

        <section class="text-view${defaultTab === 'case' ? '' : ' hidden'}" data-view="case">
          <div class="studio-panel-grid studio-panel-grid-dual">
            <div class="studio-panel">
              <div class="studio-panel-head"><h3>Input</h3></div>
              <textarea id="text-case-input" class="text-workbench-textarea" placeholder="Enter text to rename or normalize."></textarea>
              <div class="studio-actions">
                <button data-case-op="lower">lowercase</button>
                <button data-case-op="upper">UPPERCASE</button>
                <button data-case-op="camel">camelCase</button>
                <button data-case-op="pascal">PascalCase</button>
                <button data-case-op="snake">snake_case</button>
                <button data-case-op="kebab">kebab-case</button>
                <button data-case-op="title">Title Case</button>
              </div>
            </div>
            <div class="studio-panel">
              <div class="studio-panel-head"><h3>Result</h3></div>
              <textarea id="text-case-output" readonly class="text-workbench-textarea text-workbench-output"></textarea>
              <div class="studio-actions">
                <button id="text-case-copy">Copy</button>
                <button id="text-case-clear" class="btn-secondary">Clear</button>
              </div>
            </div>
          </div>
        </section>

        <section class="text-view${defaultTab === 'url' ? '' : ' hidden'}" data-view="url">
          <div class="studio-toolbar">
            <div class="studio-toolbar-group">
              <label class="studio-field studio-field-wide">
                <span>URL</span>
                <input id="text-url-input" type="text" value="https://example.com/path?a=1&b=two#frag">
              </label>
            </div>
            <div class="studio-toolbar-group studio-toolbar-actions">
              <button id="text-url-parse">Parse</button>
              <button id="text-url-clear" class="btn-secondary">Clear</button>
            </div>
          </div>
          <div class="studio-result-grid">
            <div class="studio-output-card"><span>Protocol</span><code id="text-url-protocol">--</code></div>
            <div class="studio-output-card"><span>Origin</span><code id="text-url-origin">--</code></div>
            <div class="studio-output-card"><span>Host</span><code id="text-url-host">--</code></div>
            <div class="studio-output-card"><span>Path</span><code id="text-url-path">--</code></div>
            <div class="studio-output-card"><span>Search</span><code id="text-url-search">--</code></div>
            <div class="studio-output-card"><span>Hash</span><code id="text-url-hash">--</code></div>
          </div>
          <div class="studio-panel">
            <div class="studio-panel-head"><h3>Query Parameters</h3></div>
            <div id="text-url-params" class="studio-list"></div>
          </div>
        </section>
      </section>
    </div>
  `;
}

export async function mountTextWorkbench(parent, toolId) {
  const tool = getTool(toolId);
  const studio = getStudioByToolId(toolId);
  const defaultTab = ({ 'case-converter': 'case', 'url-parser': 'url' })[toolId] || 'encode';
  const shell = createStudioShell(parent, {
    className: 'text-workbench-shell',
    eyebrow: studio.title,
    title: tool.title,
    description: ({
      'case-converter': 'Case conversion now lives inside one deterministic text workspace with encoding and URL inspection nearby.',
      'url-parser': 'URL parsing now lives inside Text Workbench so deterministic string and URL transforms stay together.'
    })[toolId] || 'Encode, decode, normalize text casing, and inspect URLs from one deterministic workspace.',
    toolIds: studio.toolIds,
    activeToolId: toolId,
    metrics: [
      { key: 'transforms', label: 'Modes', value: '3' },
      { key: 'local', label: 'Execution', value: 'Browser local' }
    ]
  });

  shell.content.innerHTML = renderTextWorkbench(defaultTab);

  const cleanup = [];

  const openView = (viewId) => {
    shell.content.querySelectorAll('[data-text-tab]').forEach((button) => {
      button.classList.toggle('active', button.dataset.textTab === viewId);
    });
    shell.content.querySelectorAll('.text-view').forEach((view) => {
      view.classList.toggle('hidden', view.dataset.view !== viewId);
    });
  };

  const encodeInput = shell.content.querySelector('#text-encode-input');
  const encodeOutput = shell.content.querySelector('#text-encode-output');
  const runEncoding = (operation) => {
    try {
      encodeOutput.value = transformEncoding(encodeInput.value, operation);
      shell.setStatus('Transform complete.', 'success');
    } catch (error) {
      encodeOutput.value = `Error: ${error.message}`;
      shell.setStatus(error.message, 'danger');
    }
  };

  const caseInput = shell.content.querySelector('#text-case-input');
  const caseOutput = shell.content.querySelector('#text-case-output');
  const runCase = (operation) => {
    try {
      caseOutput.value = convertCase(caseInput.value, operation);
      shell.setStatus('Case conversion complete.', 'success');
    } catch (error) {
      caseOutput.value = `Error: ${error.message}`;
      shell.setStatus(error.message, 'danger');
    }
  };

  const renderParams = (params) => {
    const node = shell.content.querySelector('#text-url-params');
    if (!params.length) {
      node.innerHTML = '<div class="studio-empty">No query parameters.</div>';
      return;
    }
    node.innerHTML = params.map((entry) => `
      <div class="studio-list-item">
        <div>
          <strong>${escapeHtml(entry.key)}</strong>
          <span>${escapeHtml(entry.value)}</span>
        </div>
      </div>
    `).join('');
  };

  const runUrlParse = () => {
    try {
      const parsed = parseUrlDetails(shell.content.querySelector('#text-url-input').value);
      shell.content.querySelector('#text-url-protocol').textContent = parsed.protocol;
      shell.content.querySelector('#text-url-origin').textContent = parsed.origin;
      shell.content.querySelector('#text-url-host').textContent = parsed.host;
      shell.content.querySelector('#text-url-path').textContent = parsed.pathname;
      shell.content.querySelector('#text-url-search').textContent = parsed.search || '(none)';
      shell.content.querySelector('#text-url-hash').textContent = parsed.hash || '(none)';
      renderParams(parsed.params);
      shell.setStatus('URL parsed.', 'success');
    } catch (error) {
      shell.content.querySelector('#text-url-protocol').textContent = 'Invalid';
      shell.content.querySelector('#text-url-origin').textContent = error.message;
      shell.content.querySelector('#text-url-host').textContent = '--';
      shell.content.querySelector('#text-url-path').textContent = '--';
      shell.content.querySelector('#text-url-search').textContent = '--';
      shell.content.querySelector('#text-url-hash').textContent = '--';
      renderParams([]);
      shell.setStatus(error.message, 'danger');
    }
  };

  cleanup.push(...Array.from(shell.content.querySelectorAll('[data-text-tab]')).map((button) => bind(button, 'click', () => openView(button.dataset.textTab))));
  cleanup.push(...Array.from(shell.content.querySelectorAll('[data-encode-op]')).map((button) => bind(button, 'click', () => runEncoding(button.dataset.encodeOp))));
  cleanup.push(bind(shell.content.querySelector('#text-encode-copy'), 'click', () => copyToClipboard(encodeOutput.value, 'Text copied.')));
  cleanup.push(bind(shell.content.querySelector('#text-encode-download'), 'click', () => downloadFile(encodeOutput.value, 'text-workbench-output.txt')));
  cleanup.push(bind(shell.content.querySelector('#text-encode-clear'), 'click', () => {
    encodeInput.value = '';
    encodeOutput.value = '';
    shell.setStatus('Encoder fields cleared.', 'neutral');
  }));
  cleanup.push(...Array.from(shell.content.querySelectorAll('[data-case-op]')).map((button) => bind(button, 'click', () => runCase(button.dataset.caseOp))));
  cleanup.push(bind(shell.content.querySelector('#text-case-copy'), 'click', () => copyToClipboard(caseOutput.value, 'Text copied.')));
  cleanup.push(bind(shell.content.querySelector('#text-case-clear'), 'click', () => {
    caseInput.value = '';
    caseOutput.value = '';
    shell.setStatus('Case fields cleared.', 'neutral');
  }));
  cleanup.push(bind(shell.content.querySelector('#text-url-parse'), 'click', runUrlParse));
  cleanup.push(bind(shell.content.querySelector('#text-url-clear'), 'click', () => {
    shell.content.querySelector('#text-url-input').value = '';
    runUrlParse();
  }));

  openView(defaultTab);
  if (defaultTab === 'url') runUrlParse();

  state = {
    root: shell.root,
    cleanup
  };
}

export function unmountTextWorkbench() {
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

import { TOOLS } from '../../core/config.js';
import { getStudioByToolId } from '../../core/studios.js';
import { createEditor } from '../../ui/ui-monaco.js';
import { copyToClipboard, downloadFile } from '../../ui/ui-utils.js';
import { convertBaseValue } from '../../utils/studio.js';
import { createStudioShell } from './studio-shell.js';

const MODE_META = {
  'web-formatters': {
    title: 'Web Formatting',
    language: 'html',
    sample: '<section class="wrap"><h1>Spacing</h1><p>Clean up this layout.</p></section>',
    actionLabel: 'Format Code',
    resultFileName: (root) => `formatted.${root.querySelector('#workbench-parser').value}`,
    heroDescription: 'Format markup and stylesheet snippets with parser-specific controls.'
  },
  'sql-formatter': {
    title: 'SQL Formatting',
    language: 'sql',
    sample: 'select id,name,created_at from users where status = \'active\' order by created_at desc',
    actionLabel: 'Format SQL',
    resultFileName: () => 'formatted.sql',
    heroDescription: 'Normalize SQL layout with dialect-aware formatting.'
  },
  minifier: {
    title: 'JS Minify',
    language: 'javascript',
    sample: 'function renderCard(title, subtitle) {\n  const value = `${title} ${subtitle}`.trim();\n  return value.toUpperCase();\n}',
    actionLabel: 'Minify Script',
    resultFileName: () => 'script.min.js',
    heroDescription: 'Compress JavaScript for smaller delivery while keeping import/export semantics explicit.'
  },
  'js-obfuscator': {
    title: 'JS Obfuscation',
    language: 'javascript',
    sample: 'function buildLicenseToken(customerId) {\n  const seed = `${customerId}:stable`;\n  return btoa(seed).replace(/=/g, "");\n}',
    actionLabel: 'Obfuscate Script',
    resultFileName: () => 'script.protected.js',
    heroDescription: 'Apply identifier and string protection when minification alone is not enough.'
  },
  'base-calc': {
    title: 'Radix Conversion',
    actionLabel: 'Convert',
    heroDescription: 'Inspect the same value across binary, octal, decimal, hexadecimal, and custom bases.'
  },
  'radix-converter': {
    title: 'Radix Conversion',
    actionLabel: 'Convert',
    heroDescription: 'Inspect the same value across binary, octal, decimal, hexadecimal, and custom bases.'
  }
};

let state = null;

function getTool(toolId) {
  return TOOLS.find((tool) => tool.id === toolId);
}

function renderBaseLayout() {
  return `
    <div class="studio-stack">
      <section class="card studio-card">
        <div class="studio-toolbar">
          <div class="studio-toolbar-group">
            <label class="studio-field studio-field-wide">
              <span>Input Value</span>
              <input id="base-input" type="text" value="255" placeholder="255">
            </label>
            <label class="studio-field">
              <span>Input Radix</span>
              <select id="base-input-radix">
                <option value="10">Decimal</option>
                <option value="2">Binary</option>
                <option value="8">Octal</option>
                <option value="16">Hex</option>
              </select>
            </label>
            <label class="studio-field">
              <span>Custom Radix</span>
              <input id="base-custom-radix" type="number" min="2" max="36" value="32">
            </label>
          </div>
        </div>
        <div class="studio-result-grid">
          ${[
            ['Decimal', '10'],
            ['Binary', '2'],
            ['Octal', '8'],
            ['Hexadecimal', '16'],
            ['Custom', 'custom']
          ].map(([label, radix]) => `
            <div class="studio-output-card">
              <span>${label}</span>
              <strong data-base-output="${radix}">0</strong>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `;
}

function renderCodeLayout(toolId) {
  return `
    <div class="studio-stack">
      <section class="card studio-card">
        <div class="studio-toolbar">
          <div class="studio-toolbar-group">
            ${toolId === 'web-formatters' ? `
              <label class="studio-field">
                <span>Parser</span>
                <select id="workbench-parser">
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="scss">SCSS</option>
                  <option value="less">LESS</option>
                </select>
              </label>
              <label class="studio-field">
                <span>Indent</span>
                <select id="workbench-indent">
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                </select>
              </label>
            ` : ''}
            ${toolId === 'sql-formatter' ? `
              <label class="studio-field">
                <span>Dialect</span>
                <select id="workbench-dialect">
                  <option value="sql">Standard SQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="sqlite">SQLite</option>
                  <option value="mariadb">MariaDB</option>
                </select>
              </label>
              <label class="studio-field">
                <span>Indent</span>
                <select id="workbench-indent">
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                </select>
              </label>
            ` : ''}
            ${toolId === 'minifier' ? `
              <label class="studio-toggle">
                <input id="workbench-mangle" type="checkbox" checked>
                <span>Mangle</span>
              </label>
              <label class="studio-toggle">
                <input id="workbench-compress" type="checkbox" checked>
                <span>Compress</span>
              </label>
              <label class="studio-toggle">
                <input id="workbench-module" type="checkbox">
                <span>Module</span>
              </label>
            ` : ''}
            ${toolId === 'js-obfuscator' ? `
              <label class="studio-field">
                <span>Protection Level</span>
                <select id="workbench-obf-preset">
                  <option value="default">Balanced</option>
                  <option value="high">Aggressive</option>
                  <option value="low">Light</option>
                </select>
              </label>
              <label class="studio-toggle">
                <input id="workbench-obf-strings" type="checkbox" checked>
                <span>String Array</span>
              </label>
              <label class="studio-toggle">
                <input id="workbench-obf-compact" type="checkbox" checked>
                <span>Compact</span>
              </label>
              <label class="studio-toggle">
                <input id="workbench-obf-deadcode" type="checkbox">
                <span>Dead Code</span>
              </label>
            ` : ''}
          </div>
          <div class="studio-toolbar-group studio-toolbar-actions">
            ${toolId === 'minifier' || toolId === 'js-obfuscator' ? '<input id="workbench-file-input" class="hidden" type="file" accept=".js,text/javascript">' : ''}
            ${toolId === 'minifier' || toolId === 'js-obfuscator' ? '<button id="workbench-upload" class="btn-secondary">Import</button>' : ''}
            <button id="workbench-sample" class="btn-secondary">Sample</button>
            <button id="workbench-run">${MODE_META[toolId].actionLabel}</button>
            <button id="workbench-copy" class="btn-secondary">Copy Result</button>
            <button id="workbench-download" class="btn-secondary">Download</button>
          </div>
        </div>
        <div class="studio-panel-grid studio-panel-grid-dual">
          <section class="studio-panel">
            <div class="studio-panel-head">
              <h3>Source</h3>
            </div>
            <div id="workbench-source" class="studio-editor"></div>
          </section>
          <section class="studio-panel">
            <div class="studio-panel-head">
              <h3>Result</h3>
            </div>
            <div id="workbench-result" class="studio-editor"></div>
          </section>
        </div>
      </section>
    </div>
  `;
}

export async function mountDevWorkbench(parent, toolId) {
  const tool = getTool(toolId);
  const studio = getStudioByToolId(toolId);
  const shell = createStudioShell(parent, {
    className: 'dev-workbench-shell',
    eyebrow: studio.title,
    title: tool.title,
    description: MODE_META[toolId].heroDescription,
    toolIds: studio.toolIds,
    activeToolId: toolId,
    metrics: [
      { key: 'views', label: 'Views', value: `${studio.toolIds.length}` },
      { key: 'focus', label: 'Focus', value: MODE_META[toolId].title }
    ]
  });

  shell.content.innerHTML = toolId === 'base-calc' || toolId === 'radix-converter' ? renderBaseLayout() : renderCodeLayout(toolId);

  const cleanup = [];
  const setStatus = (message, tone = 'neutral') => shell.setStatus(message, tone);

  if (toolId === 'base-calc' || toolId === 'radix-converter') {
    const input = shell.content.querySelector('#base-input');
    const inputRadix = shell.content.querySelector('#base-input-radix');
    const customRadix = shell.content.querySelector('#base-custom-radix');

    const update = () => {
      try {
        const outputMap = {
          10: convertBaseValue(input.value, inputRadix.value, 10),
          2: convertBaseValue(input.value, inputRadix.value, 2),
          8: convertBaseValue(input.value, inputRadix.value, 8),
          16: convertBaseValue(input.value, inputRadix.value, 16),
          custom: convertBaseValue(input.value, inputRadix.value, Number(customRadix.value))
        };

        shell.content.querySelectorAll('[data-base-output]').forEach((node) => {
          node.textContent = outputMap[node.dataset.baseOutput];
        });
        setStatus('Converted across radices.', 'success');
      } catch (error) {
        shell.content.querySelectorAll('[data-base-output]').forEach((node) => {
          node.textContent = 'Error';
        });
        setStatus(error.message, 'danger');
      }
    };

    cleanup.push(bind(input, 'input', update));
    cleanup.push(bind(inputRadix, 'change', update));
    cleanup.push(bind(customRadix, 'input', update));
    update();

    state = { root: shell.root, cleanup, editors: [] };
    return;
  }

  const sourceHost = shell.content.querySelector('#workbench-source');
  const resultHost = shell.content.querySelector('#workbench-result');
  const sourceSetup = await createEditor(sourceHost, {
    value: MODE_META[toolId].sample,
    language: MODE_META[toolId].language
  });
  const resultSetup = await createEditor(resultHost, {
    value: '',
    language: MODE_META[toolId].language,
    readOnly: true
  });
  const sourceEditor = sourceSetup.editor;
  const resultEditor = resultSetup.editor;

  const setResult = (text, tone = 'success', status = 'Done.') => {
    resultEditor.setValue(text);
    setStatus(status, tone);
  };

  const run = async () => {
    const source = sourceEditor.getValue();
    if (!source.trim()) {
      setStatus('Enter source input first.', 'danger');
      return;
    }

    try {
      if (toolId === 'web-formatters') {
        const parser = shell.content.querySelector('#workbench-parser').value;
        const prettier = await import('https://esm.sh/prettier@3.0.3/standalone');
        const parserHtml = await import('https://esm.sh/prettier@3.0.3/plugins/html');
        const parserCss = await import('https://esm.sh/prettier@3.0.3/plugins/postcss');
        const formatted = await prettier.format(source, {
          parser,
          plugins: [parserHtml.default, parserCss.default],
          tabWidth: Number(shell.content.querySelector('#workbench-indent').value)
        });
        setResult(formatted, 'success', 'Web code formatted.');
        return;
      }

      if (toolId === 'sql-formatter') {
        const { format } = await import('https://esm.sh/sql-formatter@12.2.4');
        const formatted = format(source, {
          language: shell.content.querySelector('#workbench-dialect').value,
          indent: ' '.repeat(Number(shell.content.querySelector('#workbench-indent').value)),
          uppercase: true
        });
        setResult(formatted, 'success', 'SQL formatted.');
        return;
      }

      if (toolId === 'minifier') {
        const { minify } = await import('https://esm.sh/terser@5.30.0');
        const result = await minify(source, {
          mangle: shell.content.querySelector('#workbench-mangle').checked,
          compress: shell.content.querySelector('#workbench-compress').checked,
          module: shell.content.querySelector('#workbench-module').checked,
          ecma: 2020
        });
        setResult(result.code || '', 'success', 'Script minified.');
        return;
      }

      const mod = await import('https://esm.sh/javascript-obfuscator@4.1.0');
      const Obfuscator = mod.default || mod;
      const preset = shell.content.querySelector('#workbench-obf-preset').value;
      const options = {
        compact: shell.content.querySelector('#workbench-obf-compact').checked,
        stringArray: shell.content.querySelector('#workbench-obf-strings').checked,
        deadCodeInjection: shell.content.querySelector('#workbench-obf-deadcode').checked,
        deadCodeInjectionThreshold: 0.4,
        identifierNamesGenerator: 'hexadecimal',
        renameGlobals: preset === 'high',
        controlFlowFlattening: preset !== 'low',
        controlFlowFlatteningThreshold: 0.75,
        numbersToExpressions: true,
        simplify: true,
        splitStrings: preset === 'high',
        unicodeEscapeSequence: false
      };
      const result = Obfuscator.obfuscate(source, options);
      setResult(result.getObfuscatedCode(), 'success', 'Script obfuscated.');
    } catch (error) {
      setResult(error.message, 'danger', error.message);
    }
  };

  cleanup.push(bind(shell.content.querySelector('#workbench-run'), 'click', run));
  cleanup.push(bind(shell.content.querySelector('#workbench-sample'), 'click', () => {
    sourceEditor.setValue(MODE_META[toolId].sample);
    resultEditor.setValue('');
    setStatus('Sample restored.', 'neutral');
  }));
  cleanup.push(bind(shell.content.querySelector('#workbench-copy'), 'click', () => copyToClipboard(resultEditor.getValue())));
  cleanup.push(bind(shell.content.querySelector('#workbench-download'), 'click', () => {
    const fileName = MODE_META[toolId].resultFileName(shell.content);
    downloadFile(resultEditor.getValue(), fileName);
    setStatus('Result downloaded.', 'success');
  }));

  const upload = shell.content.querySelector('#workbench-upload');
  const fileInput = shell.content.querySelector('#workbench-file-input');
  cleanup.push(bind(upload, 'click', () => fileInput.click()));
  cleanup.push(bind(fileInput, 'change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    sourceEditor.setValue(await file.text());
    setStatus(`${file.name} loaded.`, 'success');
  }));

  state = {
    root: shell.root,
    cleanup,
    editors: [sourceEditor, resultEditor]
  };
}

export function unmountDevWorkbench() {
  if (!state) return;
  for (const dispose of state.cleanup) dispose();
  for (const editor of state.editors) editor.dispose();
  state.root?.remove();
  state = null;
}

function bind(node, eventName, handler) {
  if (!node) return () => {};
  node.addEventListener(eventName, handler);
  return () => node.removeEventListener(eventName, handler);
}

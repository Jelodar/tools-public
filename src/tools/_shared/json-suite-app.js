import { TOOLS } from '../../core/config.js';
import { getStudioByToolId } from '../../core/studios.js';
import { globalStore } from '../../core/store.js';
import { globalWorkerPool } from '../../workers/pool.js';
import { createEditor } from '../../ui/ui-monaco.js';
import { copyToClipboard, downloadFile, showToast } from '../../ui/ui-utils.js';
import { createPersistedToolState } from '../../utils/tool-state.js';
import { createJsonDocumentSession } from '../../utils/json-document.js';
import { createStudioShell } from './studio-shell.js';

const SAMPLE_JSON = `{
  "status": "ok",
  "generatedAt": "2026-04-16T12:00:00.000Z",
  "items": [
    { "id": 1, "name": "North Dock", "enabled": true },
    { "id": 2, "name": "South Dock", "enabled": false }
  ]
}`;

const CANONICAL_TOOL_ID = 'json-suite';

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

function buildJsonLayout() {
  return `
    <div class="studio-stack">
      <section class="card studio-card">
        <div class="studio-toolbar">
          <div class="studio-toolbar-group" id="json-mode-tabs">
            <button type="button" class="btn-secondary json-mode-tab" data-mode="format">Format</button>
            <button type="button" class="btn-secondary json-mode-tab" data-mode="query">Query</button>
            <button type="button" class="btn-secondary json-mode-tab" data-mode="patch">Patch</button>
          </div>
          <div class="studio-toolbar-group studio-toolbar-actions">
            <input id="json-file-input" type="file" accept=".json,application/json" class="hidden">
            <button id="json-load" class="btn-secondary">Import</button>
            <button id="json-sample" class="btn-secondary">Sample</button>
            <button id="json-reset" class="btn-secondary">Reset</button>
          </div>
        </div>
        <div class="studio-toolbar">
          <div class="studio-toolbar-group">
            <label class="studio-field">
              <span>Indent</span>
              <select id="json-indent">
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
              </select>
            </label>
            <label class="studio-field">
              <span>Large Threshold KB</span>
              <input id="json-large-threshold" type="number" min="64" step="64">
            </label>
            <div class="studio-field json-memory-mode-field">
              <span>Memory Mode</span>
              <label class="json-checkbox-row">
                <input id="json-auto-large" type="checkbox">
                <span>Auto for large documents</span>
              </label>
            </div>
          </div>
          <div class="studio-toolbar-group studio-toolbar-actions">
            <button id="json-copy-source" class="btn-secondary">Copy Source</button>
            <button id="json-copy-result" class="btn-secondary">Copy Result</button>
            <button id="json-commit-result" class="btn-secondary">Use Result As Source</button>
            <button id="json-download" class="btn-secondary">Download</button>
          </div>
        </div>
        <div id="json-query-row" class="studio-toolbar hidden">
          <div class="studio-toolbar-group json-wide-toolbar-group">
            <label class="studio-field studio-field-wide json-flex-1">
              <span>JSONPath</span>
              <input id="json-query" type="text" placeholder="$.items[*].id">
            </label>
            <button id="json-query-run" class="btn-secondary">Run Query</button>
          </div>
        </div>
        <div id="json-patch-row" class="studio-toolbar hidden">
          <div class="studio-toolbar-group json-wide-toolbar-group json-stretch-toolbar-group">
            <label class="studio-field studio-field-wide json-flex-1">
              <span>JSON Pointer</span>
              <input id="json-pointer" type="text" placeholder="/items/0/name">
            </label>
            <label class="studio-field studio-field-wide json-flex-2">
              <span>Set Value</span>
              <textarea id="json-pointer-value" class="json-pointer-value" placeholder="{&quot;next&quot;:true}"></textarea>
            </label>
            <button id="json-pointer-set" class="btn-secondary">Set Path</button>
            <button id="json-pointer-delete" class="btn-secondary">Delete Path</button>
          </div>
        </div>
        <div id="json-memory-banner" class="hidden json-memory-banner">
          <div>
            <div class="json-memory-title">Large document in memory mode</div>
            <div id="json-memory-copy" class="json-memory-copy"></div>
          </div>
          <button id="json-open-editor" class="btn-secondary">Open In Editor</button>
        </div>
        <div id="json-editor-grid" class="studio-panel-grid studio-panel-grid-dual">
          <section class="studio-panel">
            <div class="studio-panel-head">
              <h3>Source</h3>
            </div>
            <div id="json-input-editor" class="studio-editor"></div>
          </section>
          <section class="studio-panel">
            <div class="studio-panel-head">
              <h3>Result</h3>
            </div>
            <div id="json-output-editor" class="studio-editor"></div>
          </section>
        </div>
        <div id="json-memory-grid" class="studio-panel-grid studio-panel-grid-dual hidden">
          <section class="studio-panel">
            <div class="studio-panel-head">
              <h3>Source Summary</h3>
            </div>
            <div id="json-source-summary" class="json-summary-list"></div>
            <pre id="json-source-preview" class="json-preview-block"></pre>
          </section>
          <section class="studio-panel">
            <div class="studio-panel-head">
              <h3>Working Summary</h3>
            </div>
            <div id="json-result-summary" class="json-summary-list"></div>
            <pre id="json-result-preview" class="json-preview-block"></pre>
            <div id="json-op-log" class="json-op-log"></div>
          </section>
        </div>
        <div class="studio-actions">
          <button id="json-format">Format</button>
          <button id="json-minify" class="btn-secondary">Minify</button>
          <button id="json-validate" class="btn-secondary">Validate</button>
        </div>
      </section>
    </div>
  `;
}

function renderSummaryRows(summary, bytes) {
  if (!summary) {
    return '<div class="json-empty-note">No document loaded.</div>';
  }

  const rows = [
    ['Kind', summary.kind],
    ['Nodes', summary.nodes],
    ['Depth', summary.depth],
    ['Entries', summary.entries],
    ['Bytes', new Intl.NumberFormat().format(bytes || 0)]
  ];

  return rows.map(([label, value]) => `
    <div class="json-summary-row">
      <span class="json-summary-label">${label}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join('');
}

export async function mountJsonStudio(parent, toolId) {
  const tool = getTool(CANONICAL_TOOL_ID);
  const studio = getStudioByToolId(toolId);
  const defaultMode = toolId === 'json-formatter' || toolId === 'json-quick-format' ? 'format' : 'query';
  const shell = createStudioShell(parent, {
    className: 'json-studio-shell',
    eyebrow: studio.title,
    title: tool.title,
    description: 'Format, validate, query, patch, and export JSON from one workspace. Large imports stay in memory mode by default.',
    toolIds: [CANONICAL_TOOL_ID],
    activeToolId: CANONICAL_TOOL_ID,
    metrics: [
      { key: 'views', label: 'Views', value: '1' },
      { key: 'query', label: 'Mode', value: defaultMode === 'query' ? 'Query' : 'Format' }
    ]
  });

  shell.content.innerHTML = buildJsonLayout();
  const persistedState = createPersistedToolState(globalStore, CANONICAL_TOOL_ID, {
    input: SAMPLE_JSON,
    output: '',
    indent: '2',
    query: '',
    mode: defaultMode,
    autoLargeMode: true,
    largeThresholdKb: 512,
    pointer: '',
    pointerValue: 'true'
  });
  const initialState = persistedState.getSnapshot();
  const initialThresholdBytes = Number(initialState.largeThresholdKb) * 1024;
  const initialSourceText = initialState.input || '';
  const initialResultText = initialState.output?.trim() ? initialState.output : '';
  const shouldBootInMemory = Boolean(initialState.autoLargeMode) && [initialSourceText, initialResultText]
    .some((text) => text && new Blob([text]).size >= initialThresholdBytes);
  const runJsonWorkerTask = typeof Worker === 'function'
    ? globalWorkerPool.run.bind(globalWorkerPool)
    : null;
  const jsonSession = createJsonDocumentSession({ 
    thresholdBytes: initialThresholdBytes,
    runWorkerTask: runJsonWorkerTask
  });

  const inputHost = shell.content.querySelector('#json-input-editor');
  const outputHost = shell.content.querySelector('#json-output-editor');
  const fileInput = shell.content.querySelector('#json-file-input');
  const indentSelect = shell.content.querySelector('#json-indent');
  const queryInput = shell.content.querySelector('#json-query');
  const modeTabs = [...shell.content.querySelectorAll('.json-mode-tab')];
  const largeThresholdInput = shell.content.querySelector('#json-large-threshold');
  const autoLargeInput = shell.content.querySelector('#json-auto-large');
  const pointerInput = shell.content.querySelector('#json-pointer');
  const pointerValueInput = shell.content.querySelector('#json-pointer-value');
  const memoryBanner = shell.content.querySelector('#json-memory-banner');
  const memoryCopy = shell.content.querySelector('#json-memory-copy');
  const memoryGrid = shell.content.querySelector('#json-memory-grid');
  const editorGrid = shell.content.querySelector('#json-editor-grid');
  const sourceSummary = shell.content.querySelector('#json-source-summary');
  const resultSummary = shell.content.querySelector('#json-result-summary');
  const sourcePreview = shell.content.querySelector('#json-source-preview');
  const resultPreview = shell.content.querySelector('#json-result-preview');
  const opLog = shell.content.querySelector('#json-op-log');
  const queryRow = shell.content.querySelector('#json-query-row');
  const patchRow = shell.content.querySelector('#json-patch-row');

  indentSelect.value = initialState.indent;
  queryInput.value = initialState.query;
  largeThresholdInput.value = String(initialState.largeThresholdKb);
  autoLargeInput.checked = Boolean(initialState.autoLargeMode);
  pointerInput.value = initialState.pointer;
  pointerValueInput.value = initialState.pointerValue;

  const inputEditorResult = await createEditor(inputHost, {
    value: shouldBootInMemory ? '' : initialState.input,
    language: 'json'
  });
  const outputEditorResult = await createEditor(outputHost, {
    value: shouldBootInMemory ? '' : initialState.output,
    language: 'json',
    readOnly: true
  });

  const inputEditor = inputEditorResult.editor;
  const outputEditor = outputEditorResult.editor;
  const cleanup = [];
  let activeMode = initialState.mode || defaultMode;
  let renderMode = 'editor';
  let suppressPersistence = false;

  const persistSettings = () => {
    persistedState.save({
      indent: indentSelect.value,
      query: queryInput.value,
      mode: activeMode,
      autoLargeMode: autoLargeInput.checked,
      largeThresholdKb: Number(largeThresholdInput.value),
      pointer: pointerInput.value,
      pointerValue: pointerValueInput.value
    });
  };

  const setStatus = (message, tone = 'neutral') => {
    shell.setStatus(message, tone);
  };

  function handleRestoreFailure(error) {
    resetEditors(initialState.input, initialState.output);
    setStatus(`Restore failed: ${error?.message || 'Could not restore saved JSON.'}`, 'danger');
  }

  const updateModeUi = () => {
    modeTabs.forEach((tab) => {
      tab.classList.toggle('is-active', tab.dataset.mode === activeMode);
    });
    queryRow.classList.toggle('hidden', activeMode !== 'query');
    patchRow.classList.toggle('hidden', activeMode !== 'patch');
    shell.setMetric('query', activeMode === 'patch' ? 'Patch' : activeMode === 'query' ? 'Query' : 'Format');
  };

  const renderMemoryState = () => {
    const snapshot = jsonSession.getState();
    const workingSummary = snapshot.resultSummary || snapshot.sourceSummary;
    const workingBytes = snapshot.resultBytes || snapshot.sourceBytes;
    const logMarkup = snapshot.operationLog.length
      ? snapshot.operationLog.map((entry) => `
          <div class="json-op-log-row">
            <span class="json-op-kind">${escapeHtml(entry.kind)}</span>
            <span class="json-op-at">${escapeHtml(entry.at)}</span>
          </div>
        `).join('')
      : '<div class="json-empty-note">No operations yet.</div>';

    sourceSummary.innerHTML = renderSummaryRows(snapshot.sourceSummary, snapshot.sourceBytes);
    resultSummary.innerHTML = renderSummaryRows(workingSummary, workingBytes);
    sourcePreview.textContent = jsonSession.getSourcePreview({ indent: Number(indentSelect.value) }) || 'Source preview unavailable.';
    resultPreview.textContent = jsonSession.getResultPreview({ indent: Number(indentSelect.value) }) || jsonSession.getSourcePreview({ indent: Number(indentSelect.value) }) || 'Working preview unavailable.';
    opLog.innerHTML = logMarkup;
    memoryCopy.textContent = `Threshold ${largeThresholdInput.value} KB. The document stays as parsed JSON until you explicitly open it in the editor.`;
  };

  const setRenderMode = (nextMode) => {
    renderMode = nextMode;
    const isMemory = nextMode === 'memory';
    memoryBanner.classList.toggle('hidden', !isMemory);
    memoryGrid.classList.toggle('hidden', !isMemory);
    editorGrid.classList.toggle('hidden', isMemory);
    if (isMemory) renderMemoryState();
  };

  const resetEditors = (sourceText = '', resultText = '') => {
    suppressPersistence = true;
    inputEditor.setValue(sourceText);
    outputEditor.setValue(resultText);
    suppressPersistence = false;
  };

  const loadSessionFromEditors = () => {
    const candidate = inputEditor.getValue();
    if (!candidate.trim()) {
      throw new Error('Paste or import JSON first.');
    }
    jsonSession.setThresholdBytes(Number(largeThresholdInput.value) * 1024);
    return jsonSession.load(candidate);
  };

  const syncEditorsFromResult = () => {
    if (renderMode === 'memory') {
      renderMemoryState();
      return;
    }
    return resolveMaybeAsync(
      jsonSession.getResultText({ indent: Number(indentSelect.value) }),
      (resultText) => {
        resetEditors(inputEditor.getValue(), resultText);
      }
    );
  };

  const switchToMemoryIfNeeded = (snapshot, message) => {
    if (autoLargeInput.checked && (snapshot.sourceLarge || snapshot.resultLarge)) {
      setRenderMode('memory');
      setStatus(message, 'success');
      return true;
    }
    return false;
  };

  const loadText = (text, statusMessage) => {
    jsonSession.setThresholdBytes(Number(largeThresholdInput.value) * 1024);
    return resolveMaybeAsync(
      jsonSession.load(text),
      (snapshot) => {
        if (switchToMemoryIfNeeded(snapshot, statusMessage)) {
          resetEditors('', '');
          persistedState.save({ input: '', output: '' }, { immediate: true });
          return;
        }
        setRenderMode('editor');
        resetEditors(text, '');
        persistedState.save({ input: text, output: '' });
        setStatus(statusMessage, 'success');
      }
    );
  };

  const ensureSession = () => {
    jsonSession.setThresholdBytes(Number(largeThresholdInput.value) * 1024);
    if (renderMode === 'memory' && jsonSession.getSourceValue() !== null) {
      return jsonSession.getState();
    }
    if (renderMode === 'memory') return jsonSession.getState();
    return loadSessionFromEditors();
  };

  const runFormat = async (minify = false) => {
    try {
      await ensureSession();
      const snapshot = minify
        ? await jsonSession.minify()
        : await jsonSession.format(Number(indentSelect.value));
      if (switchToMemoryIfNeeded(snapshot, minify ? 'JSON minified in memory mode.' : 'JSON formatted in memory mode.')) {
        persistSettings();
        return;
      }
      setRenderMode('editor');
      await syncEditorsFromResult();
      setStatus(minify ? 'JSON minified.' : 'JSON formatted.', 'success');
      persistSettings();
    } catch (error) {
      setStatus(error.message, 'danger');
    }
  };

  const runValidate = async () => {
    try {
      await ensureSession();
      jsonSession.validate();
      setStatus('JSON is valid.', 'success');
      persistSettings();
    } catch (error) {
      setStatus(error.message, 'danger');
    }
  };

  const runQuery = async () => {
    const query = queryInput.value.trim();
    if (!query) {
      setStatus('Enter a JSONPath query.', 'danger');
      return;
    }
    try {
      await ensureSession();
      const snapshot = await jsonSession.runQuery(
        query,
        async (value, path) => {
          const { JSONPath } = await import('https://esm.sh/jsonpath-plus@7.2.0');
          return JSONPath({ path, json: value });
        },
        Number(indentSelect.value)
      );
      if (switchToMemoryIfNeeded(snapshot, 'Query completed in memory mode.')) {
        persistSettings();
        return;
      }
      setRenderMode('editor');
      await syncEditorsFromResult();
      setStatus('Query completed.', 'success');
      persistSettings();
    } catch (error) {
      setStatus(error.message, 'danger');
    }
  };

  const runPatch = (kind) => {
    const pointer = pointerInput.value.trim();
    if (!pointer) {
      setStatus('Enter a JSON Pointer path.', 'danger');
      return;
    }
    try {
      return resolveMaybeAsync(
        ensureSession(),
        () => resolveMaybeAsync(
          kind === 'set'
            ? jsonSession.setAtPointer(pointer, pointerValueInput.value, Number(indentSelect.value))
            : jsonSession.deleteAtPointer(pointer, Number(indentSelect.value)),
          (snapshot) => {
            if (switchToMemoryIfNeeded(snapshot, kind === 'set' ? 'Path updated in memory mode.' : 'Path deleted in memory mode.')) {
              persistSettings();
              return;
            }
            setRenderMode('editor');
            return resolveMaybeAsync(syncEditorsFromResult(), () => {
              setStatus(kind === 'set' ? 'Path updated.' : 'Path deleted.', 'success');
              persistSettings();
            });
          },
          (error) => {
            setStatus(error.message, 'danger');
          }
        ),
        (error) => {
          setStatus(error.message, 'danger');
        }
      );
    } catch (error) {
      setStatus(error.message, 'danger');
    }
  };

  const downloadCurrent = async () => {
    try {
      const text = renderMode === 'memory'
        ? await jsonSession.getDownloadText({ indent: Number(indentSelect.value) })
        : (outputEditor.getValue() || inputEditor.getValue());
      if (!text.trim()) {
        setStatus('Nothing to download yet.', 'danger');
        return;
      }
      downloadFile(text, 'json-result.json', 'application/json');
      setStatus('JSON downloaded.', 'success');
    } catch (error) {
      setStatus(error.message, 'danger');
    }
  };

  const commitResult = () => {
    try {
      return resolveMaybeAsync(
        jsonSession.commitResult(Number(indentSelect.value)),
        (snapshot) => {
          if (autoLargeInput.checked && snapshot.sourceLarge) {
            setRenderMode('memory');
            resetEditors('', '');
            persistedState.save({ input: '', output: '' }, { immediate: true });
            setStatus('Result promoted to source.', 'success');
            return;
          }

          setRenderMode('editor');
          return resolveMaybeAsync(
            jsonSession.getSourceText({ indent: Number(indentSelect.value) }),
            (sourceText) => {
              resetEditors(sourceText, '');
              persistedState.save({ input: inputEditor.getValue(), output: '' }, { immediate: true });
              setStatus('Result promoted to source.', 'success');
            },
            (error) => {
              setStatus(error.message, 'danger');
            }
          );
        },
        (error) => {
          setStatus(error.message, 'danger');
        }
      );
    } catch (error) {
      setStatus(error.message, 'danger');
    }
  };

  const copySource = async () => {
    try {
      const text = renderMode === 'memory'
        ? await jsonSession.getSourceText({ indent: Number(indentSelect.value) })
        : inputEditor.getValue();
      if (!text.trim()) {
        setStatus('Nothing to copy yet.', 'danger');
        return;
      }
      await copyToClipboard(text);
      setStatus('Source copied.', 'success');
    } catch (error) {
      setStatus(error.message, 'danger');
    }
  };

  const copyResult = async () => {
    try {
      const text = renderMode === 'memory'
        ? await jsonSession.getDownloadText({ indent: Number(indentSelect.value) })
        : (outputEditor.getValue() || inputEditor.getValue());
      if (!text.trim()) {
        setStatus('Nothing to copy yet.', 'danger');
        return;
      }
      await copyToClipboard(text);
      setStatus('Result copied.', 'success');
    } catch (error) {
      setStatus(error.message, 'danger');
    }
  };

  const openWorkingDocumentInEditor = () => {
    try {
      return resolveMaybeAsync(
        jsonSession.getDownloadText({ indent: Number(indentSelect.value) }),
        (text) => {
          setRenderMode('editor');
          resetEditors(text, '');
          persistedState.save({ input: text, output: '' }, { immediate: true });
          jsonSession.clearResult();
          setStatus('Working document opened in the editor.', 'neutral');
        },
        (error) => {
          setStatus(error.message, 'danger');
        }
      );
    } catch (error) {
      setStatus(error.message, 'danger');
    }
  };

  cleanup.push(bind(shell.content.querySelector('#json-format'), 'click', () => runFormat(false)));
  cleanup.push(bind(shell.content.querySelector('#json-minify'), 'click', () => runFormat(true)));
  cleanup.push(bind(shell.content.querySelector('#json-validate'), 'click', runValidate));
  cleanup.push(bind(shell.content.querySelector('#json-query-run'), 'click', runQuery));
  cleanup.push(bind(shell.content.querySelector('#json-pointer-set'), 'click', () => runPatch('set')));
  cleanup.push(bind(shell.content.querySelector('#json-pointer-delete'), 'click', () => runPatch('delete')));
  cleanup.push(bind(shell.content.querySelector('#json-load'), 'click', () => fileInput.click()));
  cleanup.push(bind(shell.content.querySelector('#json-sample'), 'click', async () => {
    setRenderMode('editor');
    jsonSession.clearResult();
    await loadText(SAMPLE_JSON, 'Sample loaded.');
  }));
  cleanup.push(bind(shell.content.querySelector('#json-reset'), 'click', () => {
    setRenderMode('editor');
    jsonSession.clearResult();
    resetEditors('', '');
    if (fileInput) fileInput.value = '';
    persistedState.save({
      input: '',
      output: '',
      query: '',
      pointer: '',
      pointerValue: 'true',
      mode: 'format'
    }, { immediate: true });
    queryInput.value = '';
    pointerInput.value = '';
    pointerValueInput.value = 'true';
    activeMode = 'format';
    updateModeUi();
    setStatus('Editors cleared.', 'neutral');
  }));
  cleanup.push(bind(shell.content.querySelector('#json-download'), 'click', downloadCurrent));
  cleanup.push(bind(shell.content.querySelector('#json-copy-source'), 'click', copySource));
  cleanup.push(bind(shell.content.querySelector('#json-copy-result'), 'click', copyResult));
  cleanup.push(bind(shell.content.querySelector('#json-commit-result'), 'click', commitResult));
  cleanup.push(bind(shell.content.querySelector('#json-open-editor'), 'click', openWorkingDocumentInEditor));
  cleanup.push(bind(fileInput, 'change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await loadText(text, `${file.name} loaded.`);
    } catch (error) {
      showToast(error.message, 'danger');
      setStatus('Import failed.', 'danger');
    }
  }));
  cleanup.push(bind(indentSelect, 'change', persistSettings));
  cleanup.push(bind(queryInput, 'input', persistSettings));
  cleanup.push(bind(pointerInput, 'input', persistSettings));
  cleanup.push(bind(pointerValueInput, 'input', persistSettings));
  cleanup.push(bind(largeThresholdInput, 'change', () => {
    jsonSession.setThresholdBytes(Number(largeThresholdInput.value) * 1024);
    renderMemoryState();
    persistSettings();
  }));
  cleanup.push(bind(autoLargeInput, 'change', persistSettings));
  cleanup.push(() => jsonSession.dispose());

  modeTabs.forEach((tab) => {
    cleanup.push(bind(tab, 'click', () => {
      activeMode = tab.dataset.mode;
      updateModeUi();
      persistSettings();
    }));
  });

  const inputChangeSubscription = inputEditor.onDidChangeModelContent(() => {
    if (suppressPersistence) return;
    jsonSession.clearResult();
    persistedState.save({ input: inputEditor.getValue(), output: '' });
  });
  const outputChangeSubscription = outputEditor.onDidChangeModelContent(() => {
    if (suppressPersistence) return;
    persistedState.save({ output: outputEditor.getValue() });
  });
  cleanup.push(() => inputChangeSubscription.dispose());
  cleanup.push(() => outputChangeSubscription.dispose());

  updateModeUi();

  if (initialState.input?.trim()) {
    try {
      jsonSession.setThresholdBytes(Number(largeThresholdInput.value) * 1024);
      resolveMaybeAsync(
        jsonSession.restore({
          sourceText: initialState.input,
          resultText: initialState.output,
          indent: Number(indentSelect.value)
        }),
        (snapshot) => {
          if (autoLargeInput.checked && (snapshot.sourceLarge || snapshot.resultLarge)) {
            setRenderMode('memory');
            resetEditors('', '');
            setStatus('JSON restored.', 'success');
            return;
          }

          setRenderMode('editor');
          resolveMaybeAsync(
            jsonSession.getSourceText({ indent: Number(indentSelect.value) }),
            (sourceText) => resolveMaybeAsync(
              jsonSession.getResultText({ indent: Number(indentSelect.value) }),
              (resultText) => {
                resetEditors(sourceText, resultText);
                setStatus('JSON restored.', 'success');
              },
              handleRestoreFailure
            ),
            handleRestoreFailure
          );
        },
        handleRestoreFailure
      );
    } catch (err) {
      handleRestoreFailure(err);
    }
  } else {
    resetEditors('', '');
    setStatus(toolId === 'json-formatter' || toolId === 'json-quick-format' ? 'JSON format view. Full studio features stay available.' : 'Ready.', 'neutral');
  }

  state = {
    root: shell.root,
    cleanup,
    inputEditor,
    outputEditor,
    persistedState
  };
}

export function unmountJsonStudio() {
  if (!state) return;
  state.persistedState?.flush().catch(() => {});
  state.persistedState?.dispose();
  for (const dispose of state.cleanup) dispose();
  state.inputEditor?.dispose();
  state.outputEditor?.dispose();
  state.root?.remove();
  state = null;
}

function bind(node, eventName, handler) {
  if (!node) return () => {};
  node.addEventListener(eventName, handler);
  return () => node.removeEventListener(eventName, handler);
}

function resolveMaybeAsync(value, onResolve, onReject = (error) => { throw error; }) {
  try {
    if (value && typeof value.then === 'function') {
      return value.then(onResolve).catch(onReject);
    }
    return onResolve(value);
  } catch (error) {
    return onReject(error);
  }
}

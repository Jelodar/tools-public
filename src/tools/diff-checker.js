import { createDiffEditor, getResponsiveDiffOptions } from '../ui/ui-monaco.js';

let container = null;
let diffEditor = null;
let monacoInst = null;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function mount(parent) {
  container = document.createElement('div');
  container.className = 'tool-diff-checker';
  container.innerHTML = `
    <div class="card">
      <div class="settings-grid">
        <div class="form-group">
          <label>Compare Mode</label>
          <select id="diff-mode">
            <option value="side-by-side">Side by Side</option>
            <option value="inline">Inline</option>
          </select>
        </div>
        <div class="form-group">
          <label>Language</label>
          <select id="diff-lang">
            <option value="plaintext">Plain Text</option>
            <option value="javascript">JavaScript</option>
            <option value="json">JSON</option>
            <option value="css">CSS</option>
            <option value="html">HTML</option>
          </select>
        </div>
        <div class="form-group tool-inline-control-group">
          <div class="tool-inline-control">
            <label class="rj-switch">
              <input type="checkbox" id="diff-whitespace" checked>
              <span class="slider-switch"></span>
            </label>
            <label for="diff-whitespace" class="tool-inline-label">Trim Whitespace</label>
          </div>
        </div>
      </div>

      <div class="form-group tool-section-gap">
        <label>Comparison View</label>
        <div id="monaco-diff-editor" class="tool-editor-host-large"></div>
      </div>

      <div class="tool-action-row">
        <button id="btn-clear-left" class="btn-secondary tool-grow-1">Clear Original</button>
        <button id="btn-clear-right" class="btn-secondary tool-grow-1">Clear Modified</button>
      </div>
    </div>
  `;
  
  parent.appendChild(container);
  
  const monacoContainer = container.querySelector('#monaco-diff-editor');
  const langSelect = container.querySelector('#diff-lang');
  const modeSelect = container.querySelector('#diff-mode');
  const whiteCb = container.querySelector('#diff-whitespace');
  const initialDiffOptions = getResponsiveDiffOptions();
  modeSelect.value = initialDiffOptions.renderSideBySide ? 'side-by-side' : 'inline';

  try {
    const { diffEditor: inst, monaco } = await createDiffEditor(monacoContainer, {
      ...initialDiffOptions,
      originalEditable: true,
      readOnly: false,
      ignoreTrimWhitespace: true
    });
    diffEditor = inst;
    monacoInst = monaco;

    const originalModel = monaco.editor.createModel('', 'plaintext');
    const modifiedModel = monaco.editor.createModel('', 'plaintext');

    diffEditor.setModel({ original: originalModel, modified: modifiedModel });

    const updateOptions = () => {
      diffEditor.updateOptions({
        renderSideBySide: modeSelect.value === 'side-by-side',
        ignoreTrimWhitespace: whiteCb.checked
      });
    };

    langSelect.addEventListener('change', () => {
      monaco.editor.setModelLanguage(originalModel, langSelect.value);
      monaco.editor.setModelLanguage(modifiedModel, langSelect.value);
    });

    modeSelect.addEventListener('change', updateOptions);
    whiteCb.addEventListener('change', updateOptions);

    container.querySelector('#btn-clear-left').addEventListener('click', () => originalModel.setValue(''));
    container.querySelector('#btn-clear-right').addEventListener('click', () => modifiedModel.setValue(''));

  } catch (err) {
    monacoContainer.innerHTML = `<div class="error-state">Failed to load: ${escapeHtml(err.message)}</div>`;
  }
}

export function unmount() {
  if (diffEditor) diffEditor.dispose();
  if (container) container.remove();
}

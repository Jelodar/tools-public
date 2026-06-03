import { createEditor } from '../ui/ui-monaco.js';
import { downloadFile } from '../ui/ui-utils.js';

/**
 * Markdown Editor
 * Monaco-powered live preview markdown editor.
 */

let container = null;
let editor = null;

function sanitizeMarkdownHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = String(html || '');
  template.content.querySelectorAll('script, style, iframe, object, embed, link, meta').forEach((node) => node.remove());
  template.content.querySelectorAll('*').forEach((node) => {
    Array.from(node.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = String(attribute.value || '').trim().toLowerCase();
      if (name.startsWith('on') || value.startsWith('javascript:')) {
        node.removeAttribute(attribute.name);
      }
    });
  });
  return template.innerHTML;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function mount(parent) {
  container = document.createElement('div');
  container.className = 'tool-markdown';
  container.innerHTML = `
    <div class="card tool-shell-stack tool-shell-tall">
      <div class="tool-grid-two tool-fill-height">
        <div class="tool-column-stack">
          <label class="tool-pane-label">Markdown</label>
          <div id="monaco-md-input" class="tool-frame"></div>
        </div>
        <div class="tool-column-stack">
          <label class="tool-pane-label">Preview</label>
          <div id="md-preview" class="markdown-body tool-preview-surface"></div>
        </div>
      </div>
      
      <div class="tool-action-row">
        <button id="btn-download-md" class="tool-neutral-button tool-grow-1">Download .md</button>
        <button id="btn-copy-html" class="tool-neutral-button tool-grow-1">Copy as HTML</button>
      </div>
    </div>
  `;
  
  parent.appendChild(container);
  
  const monacoContainer = container.querySelector('#monaco-md-input');
  const preview = container.querySelector('#md-preview');

  try {
    const { marked } = await import('https://esm.sh/marked@9.1.2');

    const editorResult = await createEditor(monacoContainer, {
      value: '# Markdown Editor\n\nEdit here to see live preview.\n\n* List item\n* Another item',
      language: 'markdown',
      renderLineHighlight: 'all',
      minimap: { enabled: false },
      wordWrap: 'on'
    });
    editor = editorResult.editor;

    const updatePreview = () => {
      preview.innerHTML = sanitizeMarkdownHtml(marked.parse(editor.getValue()));
    };

    editor.onDidChangeModelContent(updatePreview);
    updatePreview();

    container.querySelector('#btn-download-md').addEventListener('click', () => {
      downloadFile(editor.getValue(), 'document.md', 'text/markdown');
    });

    container.querySelector('#btn-copy-html').addEventListener('click', () => {
      navigator.clipboard.writeText(preview.innerHTML);
    });

  } catch (err) {
    monacoContainer.innerHTML = `<div class="error-state">Failed to load: ${escapeHtml(err.message)}</div>`;
  }
}

export function unmount() {
  if (editor) editor.dispose();
  if (container) {
    container.remove();
    container = null;
  }
}

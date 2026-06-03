import { escapeHtml } from '../utils/string-utils.js';

export function createThoughtProcess(parent, {
  title = 'Thought Process'
} = {}) {
  const root = document.createElement('section');
  root.className = 'thought-process hidden';
  root.dataset.active = 'false';
  root.innerHTML = `
    <header class="thought-process-header">
      <strong>${escapeHtml(title)}</strong>
      <button type="button" data-thought-action="toggle">Toggle</button>
    </header>
    <pre data-thought-content></pre>
  `;
  parent.appendChild(root);
  const content = root.querySelector('[data-thought-content]');
  const toggle = root.querySelector('[data-thought-action="toggle"]');
  const handleToggle = () => {
    root.classList.toggle('is-collapsed');
  };
  toggle.addEventListener('click', handleToggle);

  return {
    root,
    content,
    start() {
      root.classList.remove('hidden');
      root.dataset.active = 'true';
    },
    append(text = '') {
      content.textContent += String(text || '');
      content.scrollTop = content.scrollHeight;
    },
    end() {
      root.dataset.active = 'false';
    },
    clear() {
      content.textContent = '';
      root.dataset.active = 'false';
      root.classList.add('hidden');
      root.classList.remove('is-collapsed');
    },
    destroy() {
      toggle.removeEventListener('click', handleToggle);
      root.remove();
    }
  };
}

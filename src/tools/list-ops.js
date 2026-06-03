import { copyToClipboard, downloadFile } from '../ui/ui-utils.js';

let container = null;

export async function mount(parent) {
  container = document.createElement('div');
  container.className = 'tool-list-ops';
  container.innerHTML = `
    <div class="card">
      <div class="form-group">
        <label>Input List (One item per line)</label>
        <textarea id="list-input" class="list-input" placeholder="Item 1\nItem 2\nItem 3..."></textarea>
      </div>

      <div class="settings-grid">
        <div class="form-group">
          <label>Add Prefix</label>
          <input type="text" id="list-prefix" placeholder="e.g. ID_">
        </div>
        <div class="form-group">
          <label>Add Suffix</label>
          <input type="text" id="list-suffix" placeholder="e.g. _v1">
        </div>
      </div>

      <div class="controls list-controls">
        <button data-op="sort-asc">Sort A-Z</button>
        <button data-op="sort-desc" class="btn-secondary">Sort Z-A</button>
        <button data-op="unique">Unique Only</button>
        <button data-op="reverse" class="btn-secondary">Reverse</button>
        <button data-op="shuffle">Shuffle</button>
        <button data-op="apply-wrap" class="btn-secondary">Apply Wraps</button>
      </div>

      <div class="form-group list-output-group">
        <label>Resulting List</label>
        <textarea id="list-output" class="list-output" readonly></textarea>
      </div>

      <div class="list-actions">
        <button id="btn-copy-list" class="list-action">Copy List</button>
        <button id="btn-dl-list" class="btn-secondary list-action">Download .txt</button>
      </div>
    </div>
  `;
  
  parent.appendChild(container);
  
  const input = container.querySelector('#list-input');
  const output = container.querySelector('#list-output');
  const preIn = container.querySelector('#list-prefix');
  const sufIn = container.querySelector('#list-suffix');

  const process = (op) => {
    let lines = input.value.split('\n').filter((line) => line.trim() !== '');
    if (lines.length === 0) return;

    switch (op) {
      case 'sort-asc':
        lines.sort();
        break;
      case 'sort-desc':
        lines.sort().reverse();
        break;
      case 'unique':
        lines = [...new Set(lines)];
        break;
      case 'reverse':
        lines.reverse();
        break;
      case 'shuffle':
        for (let i = lines.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [lines[i], lines[j]] = [lines[j], lines[i]];
        }
        break;
      case 'apply-wrap':
        const p = preIn.value;
        const s = sufIn.value;
        lines = lines.map(line => `${p}${line}${s}`);
        break;
    }
    output.value = lines.join('\n');
  };

  container.querySelectorAll('button[data-op]').forEach(btn => {
    btn.addEventListener('click', () => process(btn.dataset.op));
  });

  container.querySelector('#btn-copy-list').addEventListener('click', () => copyToClipboard(output.value));
  container.querySelector('#btn-dl-list').addEventListener('click', () => downloadFile(output.value, 'processed_list.txt'));
}

export function unmount() {
  if (container) container.remove();
}

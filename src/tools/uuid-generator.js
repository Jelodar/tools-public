import { generateUUIDv7, generateUUIDv4, generateAdvancedUUID } from '../utils/uuid.js';
import { copyToClipboard, downloadFile } from '../ui/ui-utils.js';

let container = null;

export async function mount(parent) {
  container = document.createElement('div');
  container.className = 'tool-uuid-generator';
  container.innerHTML = `
    <div class="card">
      <div class="settings-grid">
        <div class="form-group">
          <label>UUID Version</label>
          <select id="uuid-version">
            <option value="7" data-tooltip="Timestamp-ordered; recommended choice for database primary keys.">v7 (Timestamp-ordered)</option>
            <option value="4" selected data-tooltip="Fully random; the industry standard for general use.">v4 (Fully Random)</option>
            <option value="1" data-tooltip="Time-based; includes host MAC address (potential privacy risk).">v1 (Time-based)</option>
            <option value="6" data-tooltip="Reordered v1; similar to v7 but using older standards.">v6 (Reordered v1)</option>
            <option value="3" data-tooltip="Deterministic UUID based on MD5 hashing of a name.">v3 (MD5 Name-based)</option>
            <option value="5" data-tooltip="Deterministic UUID based on SHA-1 hashing of a name.">v5 (SHA-1 Name-based)</option>
          </select>
          <div class="info-hint">Use v7 for databases or v4 for everything else.</div>
        </div>
        <div class="form-group">
          <label>Quantity</label>
          <input type="number" id="uuid-count" value="1" min="1" max="500">
          <div class="info-hint">Generate up to 500 UUIDs in one batch.</div>
        </div>
        <div class="form-group">
          <label>Format</label>
          <select id="uuid-case">
            <option value="lower">lowercase</option>
            <option value="upper">UPPERCASE</option>
          </select>
        </div>
      </div>

      <div id="name-based-options" class="hidden settings-grid uuid-name-options">
        <div class="form-group">
          <label>Name</label>
          <input type="text" id="uuid-name" placeholder="e.g. example.com">
        </div>
        <div class="form-group">
          <label>Namespace (UUID)</label>
          <input type="text" id="uuid-namespace" placeholder="DNS, URL, OID, or Custom UUID">
        </div>
      </div>
      
      <button id="btn-generate" class="uuid-generate-button">Generate Batch</button>
      
      <div class="form-group uuid-results-group">
        <label>Generated UUIDs</label>
        <textarea id="uuid-results" class="uuid-results" readonly></textarea>
      </div>

      <div class="uuid-actions">
        <button id="btn-copy-all" class="uuid-action">Copy All</button>
        <button id="btn-dl-txt" class="btn-secondary uuid-action">Download .txt</button>
        <button id="btn-dl-json" class="btn-secondary uuid-action">Download .json</button>
      </div>
    </div>
  `;
  
  parent.appendChild(container);
  
  const version = container.querySelector('#uuid-version');
  const count = container.querySelector('#uuid-count');
  const caseSelect = container.querySelector('#uuid-case');
  const nameOpts = container.querySelector('#name-based-options');
  const resultsArea = container.querySelector('#uuid-results');
  const btnGen = container.querySelector('#btn-generate');

  version.addEventListener('change', () => {
    nameOpts.classList.toggle('hidden', !['3', '5'].includes(version.value));
  });

  const generate = async () => {
    btnGen.disabled = true;
    const num = Math.min(parseInt(count.value) || 1, 500);
    const ver = version.value;
    const isUpper = caseSelect.value === 'upper';
    
    let out = [];
    for (let i = 0; i < num; i++) {
      let u;
      if (['1', '3', '5', '6'].includes(ver)) {
        u = await generateAdvancedUUID(ver, container.querySelector('#uuid-name').value, container.querySelector('#uuid-namespace').value);
      } else if (ver === '7') {
        u = generateUUIDv7();
      } else {
        u = generateUUIDv4();
      }
      if (isUpper) u = u.toUpperCase();
      out.push(u);
    }
    
    resultsArea.value = out.join('\n');
    btnGen.disabled = false;
  };

  btnGen.addEventListener('click', generate);
  container.querySelector('#btn-copy-all').addEventListener('click', () => copyToClipboard(resultsArea.value));
  container.querySelector('#btn-dl-txt').addEventListener('click', () => downloadFile(resultsArea.value, 'uuids.txt'));
  container.querySelector('#btn-dl-json').addEventListener('click', () => {
    const json = JSON.stringify(resultsArea.value.split('\n'), null, 2);
    downloadFile(json, 'uuids.json', 'application/json');
  });

  generate();
}

export function unmount() {
  if (container) container.remove();
}

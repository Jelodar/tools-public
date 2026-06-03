import { globalWorkerPool } from '../workers/pool.js';
import { copyToClipboard, showToast } from '../ui/ui-utils.js';
import { setupDragAndDrop } from '../ui/drag-drop.js';

let container = null;
let activeFile = null;

export async function mount(parent) {
  container = document.createElement('div');
  container.className = 'tool-hash';
  container.innerHTML = `
    <div class="card rj-layout">
      <div id="hash-drop-zone" class="hash-drop-zone">
        <div id="drop-zone-content">
          <div class="hash-drop-title">Drop large file to hash</div>
          <div class="hash-drop-subtitle">Chunked processing supported</div>
        </div>
        <div id="file-info" class="hidden hash-file-info">
          <div id="active-file-name" class="hash-file-name"></div>
          <div id="active-file-size" class="hash-file-size"></div>
          <button id="btn-clear-file" class="btn-secondary hash-clear-file">Clear File</button>
        </div>
        <input type="file" id="file-input" class="hidden">
      </div>

      <div class="form-group" id="text-input-group">
        <label>Text Content</label>
        <textarea id="hash-input" class="hash-input" placeholder="Type or paste content for instant hashing..."></textarea>
      </div>

      <div class="settings-grid">
        <div class="form-group">
          <label>Algorithm Family</label>
          <select id="hash-algo">
            <optgroup label="SHA-2">
              <option value="SHA-256" selected>SHA-256</option>
              <option value="SHA-512">SHA-512</option>
              <option value="SHA-384">SHA-384</option>
              <option value="SHA-224">SHA-224</option>
            </optgroup>
            <optgroup label="SHA-3 / Keccak">
              <option value="SHA3-256">SHA3-256</option>
              <option value="SHA3-512">SHA3-512</option>
              <option value="KECCAK-256">Keccak-256 (Ethereum)</option>
              <option value="KECCAK-512">Keccak-512</option>
            </optgroup>
            <optgroup label="BLAKE">
              <option value="BLAKE3">BLAKE3 (Fastest)</option>
              <option value="BLAKE2B">BLAKE2b</option>
              <option value="BLAKE2S">BLAKE2s</option>
            </optgroup>
            <optgroup label="Legacy / Specialized">
              <option value="MD5">MD5</option>
              <option value="SHA-1">SHA-1</option>
              <option value="RIPEMD160">RIPEMD-160</option>
            </optgroup>
          </select>
        </div>
        <div class="form-group">
          <label>Output Encoding</label>
          <select id="hash-encoding">
            <option value="hex">Hexadecimal (Lowercase)</option>
            <option value="HEX">Hexadecimal (Uppercase)</option>
            <option value="base64">Base64</option>
          </select>
        </div>
      </div>

      <div class="studio-section">
        <div class="studio-section-header">
          <span class="studio-section-title">HMAC & Authentication</span>
          <span class="section-toggle-icon">▼</span>
        </div>
        <div class="studio-section-content">
          <div class="form-group">
            <label>HMAC Secret Key</label>
            <input type="password" id="hmac-key" placeholder="Enter key to enable HMAC mode...">
            <div class="hash-hint">If a key is provided, the tool switches to Hash-based Message Authentication Code mode.</div>
          </div>
        </div>
      </div>

      <button id="btn-hash-run" class="hash-run-button">Compute Hash</button>

      <div class="form-group hash-result-group">
        <label>Message Digest</label>
        <div id="hash-result" class="hash-result">--</div>
      </div>

      <div id="hash-progress-container" class="hidden hash-progress">
        <div class="hash-progress-row">
          <span>Processing data...</span>
          <span id="hash-progress-text">0%</span>
        </div>
        <div class="hash-progress-track">
          <div id="hash-progress-bar" class="hash-progress-bar"></div>
        </div>
      </div>

      <div class="hash-action-row">
        <button id="btn-copy-hash" class="btn-secondary hash-action">Copy Digest</button>
        <button id="btn-compare-hash" class="btn-secondary hash-action">Verify/Compare</button>
      </div>

      <div class="form-group">
        <label>Comparison Digest</label>
        <input type="text" id="hash-compare-input" placeholder="Paste a digest to compare against the current result...">
        <div id="hash-compare-status" class="hash-compare-status" data-tone="neutral"></div>
      </div>
    </div>
  `;
  
  parent.appendChild(container);
  setupListeners();
}

function setupListeners() {
  const textInput = container.querySelector('#hash-input');
  const fileInput = container.querySelector('#file-input');
  const dropZone = container.querySelector('#hash-drop-zone');
  const algoSelect = container.querySelector('#hash-algo');
  const hmacKey = container.querySelector('#hmac-key');
  const encodingSelect = container.querySelector('#hash-encoding');
  const resultArea = container.querySelector('#hash-result');
  const btnRun = container.querySelector('#btn-hash-run');
  const fileInfo = container.querySelector('#file-info');
  const dzContent = container.querySelector('#drop-zone-content');
  const fileNameDisplay = container.querySelector('#active-file-name');
  const fileSizeDisplay = container.querySelector('#active-file-size');
  const progressContainer = container.querySelector('#hash-progress-container');
  const progressBar = container.querySelector('#hash-progress-bar');
  const progressText = container.querySelector('#hash-progress-text');
  const compareInput = container.querySelector('#hash-compare-input');
  const compareStatus = container.querySelector('#hash-compare-status');

  container.querySelector('.studio-section-header').onclick = (e) => {
    e.currentTarget.parentElement.classList.toggle('expanded');
  };

  const onFiles = (files) => {
    if (!files.length) return;
    activeFile = files[0];
    fileNameDisplay.textContent = activeFile.name;
    fileSizeDisplay.textContent = formatBytes(activeFile.size);
    fileInfo.classList.remove('hidden');
    dzContent.classList.add('hidden');
    container.querySelector('#text-input-group').classList.add('hidden');
    resultArea.textContent = '--';
    progressContainer.classList.add('hidden');
  };

  dropZone.onclick = () => fileInput.click();
  fileInput.onchange = (e) => onFiles(e.target.files);
  setupDragAndDrop(dropZone, onFiles);

  container.querySelector('#btn-clear-file').onclick = (e) => {
    e.stopPropagation();
    activeFile = null;
    fileInfo.classList.add('hidden');
    dzContent.classList.remove('hidden');
    container.querySelector('#text-input-group').classList.remove('hidden');
    fileInput.value = '';
    resultArea.textContent = '--';
    progressContainer.classList.add('hidden');
  };

  const runHash = async () => {
    btnRun.disabled = true;
    resultArea.textContent = 'INITIALIZING...';
    resultArea.classList.add('is-pending');
    resultArea.classList.remove('is-error');
    
    try {
      const algo = algoSelect.value;
      const key = hmacKey.value;
      const encoding = encodingSelect.value.toLowerCase();
      
      let payload = {
        algorithm: algo,
        key: key || null,
        encoding: encoding
      };

      if (activeFile) {
        progressContainer.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        payload.file = activeFile;

        const { result, error } = await globalWorkerPool.run('hash', payload, [], {
          onEvent(event) {
            if (event.type !== 'progress') return;
            progressBar.style.width = `${event.payload.percent}%`;
            progressText.textContent = `${Math.round(event.payload.percent)}%`;
          }
        });
        if (error) throw new Error(error);
        
        let finalResult = result;
        if (encodingSelect.value === 'HEX') finalResult = result.toUpperCase();
        resultArea.textContent = finalResult;
      } else {
        payload.buffer = new TextEncoder().encode(textInput.value).buffer;
        const { result, error } = await globalWorkerPool.run('hash', payload);
        if (error) throw new Error(error);
        let finalResult = result;
        if (encodingSelect.value === 'HEX') finalResult = result.toUpperCase();
        resultArea.textContent = finalResult;
      }
      
      resultArea.classList.remove('is-pending');
    } catch (err) {
      resultArea.textContent = 'CRYPTO_ERROR: ' + err.message;
      resultArea.classList.remove('is-pending');
      resultArea.classList.add('is-error');
    } finally {
      btnRun.disabled = false;
      setTimeout(() => progressContainer.classList.add('hidden'), 1000);
    }
  };

  btnRun.onclick = runHash;

  container.querySelector('#btn-copy-hash').onclick = () => {
    if (resultArea.textContent !== '--') copyToClipboard(resultArea.textContent);
  };

  container.querySelector('#btn-compare-hash').onclick = () => {
    const compare = compareInput.value.trim();
    if (!compare) {
      compareStatus.textContent = 'Paste a digest before running comparison.';
      compareStatus.dataset.tone = 'neutral';
      return;
    }
    const current = resultArea.textContent.trim().toLowerCase();
    const target = compare.trim().toLowerCase();
    if (current === target) {
      compareStatus.textContent = 'Match: the digests are identical.';
      compareStatus.dataset.tone = 'success';
      showToast('Digest match confirmed.', 'success');
    } else {
      compareStatus.textContent = 'Mismatch: the digests differ.';
      compareStatus.dataset.tone = 'danger';
      showToast('Digest mismatch detected.', 'danger');
    }
  };

  textInput.oninput = () => {
    if (!activeFile && textInput.value.length < 5000) {
      runHash();
    }
  };
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function unmount() {
  if (container) container.remove();
}

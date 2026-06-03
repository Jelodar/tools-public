import { setupDragAndDrop } from '../ui/drag-drop.js';
import { downloadFile } from '../ui/ui-utils.js';

let container = null;
let activeFile = null;
let optimizedBlob = null;
let cleanup = [];
let originalPreviewUrl = null;
let decodePreviewUrl = null;
let optimizedPreviewUrl = null;

function revokeImageOptimizerUrl(url) {
  if (url) URL.revokeObjectURL(url);
}

export async function mount(parent) {
  cleanup = [];
  container = document.createElement('div');
  container.className = 'tool-image-optimizer';
  container.innerHTML = `
    <div class="card">
      <div id="img-drop-zone" class="img-optimizer-dropzone">
        <div class="img-optimizer-dropzone-icon">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="9" cy="10" r="1.5"></circle><path d="m21 16-4.5-4.5a2 2 0 0 0-2.8 0L7 18"></path></svg>
        </div>
        <div class="img-optimizer-dropzone-copy">Drop image or click to optimize</div>
        <div id="img-info" class="img-optimizer-file-info"></div>
        <input type="file" id="img-input" class="hidden" accept="image/*">
      </div>

      <div id="img-ui" class="hidden img-optimizer-ui">
        <div class="img-optimizer-previews">
           <div class="preview-panel">
             <label class="nav-group-title img-optimizer-preview-label">Original Preview</label>
             <div id="original-preview" class="img-optimizer-preview-box">
               <img id="img-orig" class="img-optimizer-img">
             </div>
           </div>
           <div class="preview-panel">
             <label class="nav-group-title img-optimizer-preview-label">Optimized Preview</label>
             <div id="optimized-preview" class="img-optimizer-preview-box">
               <img id="img-opt" class="img-optimizer-img">
               <div id="optimize-loader" class="hidden img-optimizer-loader">
                 <div class="spinner"></div>
               </div>
             </div>
           </div>
        </div>

        <div class="settings-grid">
          <div class="form-group">
            <label>Output Format</label>
            <select id="img-format">
              <option value="webp" data-tooltip="Next-gen format with superior compression and quality.">WebP (High Efficiency)</option>
              <option value="jpeg" data-tooltip="Standard format for maximum compatibility across all platforms.">MozJPEG (Compatible)</option>
              <option value="png" data-tooltip="Preserves every pixel exactly; best for graphics and logos.">PNG (Lossless)</option>
            </select>
            <div class="info-hint">WebP is recommended for most web use cases.</div>
          </div>
          <div class="form-group">
            <label>Quality (<span id="quality-val">80</span>%)</label>
            <input type="range" id="img-quality" min="1" max="100" value="80">
            <div class="info-hint">Lower quality reduces file size but may add artifacts.</div>
          </div>
        </div>

        <div class="settings-grid">
          <div class="form-group">
            <label>Width Override (px)</label>
            <input type="number" id="img-width" placeholder="Keep Original">
            <div class="info-hint">Scale image width. Height adjusts automatically.</div>
          </div>
          <div class="form-group">
            <label>Height Override (px)</label>
            <input type="number" id="img-height" placeholder="Keep Original">
            <div class="info-hint">Scale image height. Width adjusts automatically.</div>
          </div>
        </div>

        <div class="img-optimizer-stats-bar">
          <div id="optimize-stats" class="img-optimizer-stats-info">Waiting for optimization...</div>
          <button id="btn-export-img" disabled class="btn-primary img-optimizer-export-button">Download Optimized File</button>
        </div>
      </div>
    </div>
  `;
  
  parent.appendChild(container);
  
  const dropZone = container.querySelector('#img-drop-zone');
  const fileInput = container.querySelector('#img-input');
  const ui = container.querySelector('#img-ui');
  const qIn = container.querySelector('#img-quality');
  const qVal = container.querySelector('#quality-val');
  const stats = container.querySelector('#optimize-stats');
  const btnExport = container.querySelector('#btn-export-img');
  const formatSelect = container.querySelector('#img-format');
  const widthIn = container.querySelector('#img-width');
  const heightIn = container.querySelector('#img-height');
  const imgOrig = container.querySelector('#img-orig');
  const imgOpt = container.querySelector('#img-opt');
  const loader = container.querySelector('#optimize-loader');

  const onFile = (files) => {
    activeFile = files[0];
    if (!activeFile) return;
    revokeImageOptimizerUrl(originalPreviewUrl);
    revokeImageOptimizerUrl(optimizedPreviewUrl);
    originalPreviewUrl = URL.createObjectURL(activeFile);
    optimizedPreviewUrl = null;
    optimizedBlob = null;
    imgOrig.src = originalPreviewUrl;
    imgOpt.removeAttribute('src');
    ui.classList.remove('hidden');
    dropZone.classList.add('is-compact');
    container.querySelector('#img-info').textContent = `${activeFile.name} (${(activeFile.size / 1024).toFixed(1)} KB)`;
    optimize();
  };

  const optimize = async () => {
    if (!activeFile) return;
    loader.classList.remove('hidden');
    btnExport.disabled = true;

    try {
      const format = formatSelect.value;
      const quality = parseInt(qIn.value) / 100;
      const maxWidth = parseInt(widthIn.value);
      const maxHeight = parseInt(heightIn.value);

      const img = new Image();
      revokeImageOptimizerUrl(decodePreviewUrl);
      decodePreviewUrl = URL.createObjectURL(activeFile);
      img.src = decodePreviewUrl;
      try {
        await img.decode();
      } finally {
        revokeImageOptimizerUrl(decodePreviewUrl);
        decodePreviewUrl = null;
      }

      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;

      if (maxWidth && w > maxWidth) {
        h = (maxWidth / w) * h;
        w = maxWidth;
      }

      if (maxHeight && h > maxHeight) {
        w = (maxHeight / h) * w;
        h = maxHeight;
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);

      const mime = `image/${format === 'jpeg' ? 'jpeg' : format}`;
      canvas.toBlob((blob) => {
        if (!blob) {
          stats.textContent = 'Error: Image export failed.';
          loader.classList.add('hidden');
          return;
        }
        revokeImageOptimizerUrl(optimizedPreviewUrl);
        optimizedBlob = blob;
        optimizedPreviewUrl = URL.createObjectURL(blob);
        imgOpt.src = optimizedPreviewUrl;
        const saved = ((1 - blob.size / activeFile.size) * 100).toFixed(1);
        stats.textContent = `${(blob.size / 1024).toFixed(1)}KB | Saved: ${saved}%`;
        btnExport.disabled = false;
        loader.classList.add('hidden');
      }, mime, quality);
    } catch (err) {
      stats.textContent = 'Error: ' + err.message;
      loader.classList.add('hidden');
    }
  };

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => onFile(e.target.files));

  const onPaste = (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    const files = [];
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      onFile(files);
    }
  };
  window.addEventListener('paste', onPaste);
  cleanup.push(() => window.removeEventListener('paste', onPaste));

  const dragDrop = setupDragAndDrop(dropZone, onFile);
  cleanup.push(() => dragDrop?.());

  [qIn, formatSelect].forEach((el) => el.addEventListener('change', optimize));
  [widthIn, heightIn].forEach((el) => el.addEventListener('blur', optimize));
  
  qIn.addEventListener('input', () => {
    qVal.textContent = qIn.value;
  });

  btnExport.addEventListener('click', () => {
    if (optimizedBlob) {
      const format = formatSelect.value;
      downloadFile(optimizedBlob, `optimized_${Date.now()}.${format}`);
    }
  });
}

export function unmount() {
  cleanup.forEach((dispose) => dispose());
  cleanup = [];
  revokeImageOptimizerUrl(originalPreviewUrl);
  revokeImageOptimizerUrl(decodePreviewUrl);
  revokeImageOptimizerUrl(optimizedPreviewUrl);

  if (container) {
    container.remove();
  }

  container = null;
  activeFile = null;
  optimizedBlob = null;
  originalPreviewUrl = null;
  decodePreviewUrl = null;
  optimizedPreviewUrl = null;
}

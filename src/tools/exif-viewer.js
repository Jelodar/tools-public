import { setupDragAndDrop } from '../ui/drag-drop.js';
import { downloadFile, copyToClipboard, showToast } from '../ui/ui-utils.js';
import {
  CLEAN_EXIF_EXPORT_FORMATS,
  buildJpegWithEditedExifMetadata,
  SUPPORTED_EXIF_EXTENSIONS,
  applyExifSidecarEdit,
  getSupportedExifFormats,
  isExifSupportedFile,
  normalizeExifEntries,
  planExifCleanCopy
} from '../utils/exif.js';

let container = null;
let cleanup = [];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatExifValue(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

async function encodeCleanImage(file, mimeType) {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('Clean image export is not available in this browser.');
  }
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create an image export surface.');
  context.drawImage(bitmap, 0, 0);
  bitmap.close?.();
  if (typeof canvas.convertToBlob === 'function') {
    return canvas.convertToBlob({ type: mimeType, quality: 0.92 });
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Clean image export failed.'));
    }, mimeType, 0.92);
  });
}

export async function mount(parent) {
  cleanup = [];
  const supportedFormats = getSupportedExifFormats();
  container = document.createElement('div');
  container.className = 'tool-exif';
  container.innerHTML = `
    <div class="card">
      <div id="exif-drop-zone" class="exif-drop-zone">
        <div class="exif-drop-title">EXIF</div>
        <div class="exif-drop-copy">Drop image metadata files to inspect, clean, or export a sidecar</div>
        <div id="exif-support-list" class="exif-support-list"></div>
        <input type="file" id="exif-input" class="hidden" accept="${SUPPORTED_EXIF_EXTENSIONS.map((extension) => `.${extension}`).join(',')},image/jpeg,image/webp,image/tiff,image/png,image/heic,image/heif,image/avif">
      </div>

      <div id="exif-ui" class="hidden exif-results-shell">
        <div class="exif-summary-row">
          <div>
            <div id="exif-file-name" class="exif-file-name">No file loaded</div>
            <div id="exif-file-note" class="exif-file-note"></div>
          </div>
          <div class="exif-clean-export">
            <select id="exif-clean-format">
              ${CLEAN_EXIF_EXPORT_FORMATS.map((format) => `<option value="${format.mimeType}">${format.label}</option>`).join('')}
            </select>
            <button id="btn-clean-exif-copy" class="btn-secondary exif-action" type="button">Export Clean Image</button>
            <button id="btn-save-edited-exif-image" class="btn-secondary exif-action" type="button">Save Edited Image</button>
          </div>
        </div>

        <div class="exif-table-frame">
          <table class="exif-table">
            <thead class="exif-table-head">
              <tr>
                <th class="exif-table-heading exif-table-heading-key">PROPERTY</th>
                <th class="exif-table-heading">TYPE</th>
                <th class="exif-table-heading">VALUE</th>
              </tr>
            </thead>
            <tbody id="exif-table-body"></tbody>
          </table>
        </div>

        <div class="exif-edit-panel">
          <label>
            Sidecar Key
            <select id="exif-edit-key"></select>
          </label>
          <label>
            Sidecar Value
            <textarea id="exif-edit-value" rows="3"></textarea>
          </label>
          <button id="btn-apply-exif-edit" class="btn-secondary exif-action" type="button">Apply Sidecar Edit</button>
          <button id="btn-remove-exif-field" class="btn-secondary exif-action" type="button">Remove Field</button>
          <button id="btn-remove-all-exif" class="btn-secondary exif-action" type="button">Remove All</button>
        </div>

        <div class="exif-actions">
          <button id="btn-copy-exif" class="exif-action" type="button">Copy JSON</button>
          <button id="btn-dl-exif" class="btn-secondary exif-action" type="button">Download Original JSON</button>
          <button id="btn-dl-edited-exif" class="btn-secondary exif-action" type="button">Download Edited JSON</button>
        </div>
      </div>
    </div>
  `;
  
  parent.appendChild(container);
  
  const dropZone = container.querySelector('#exif-drop-zone');
  const fileInput = container.querySelector('#exif-input');
  const ui = container.querySelector('#exif-ui');
  const tableBody = container.querySelector('#exif-table-body');
  const supportList = container.querySelector('#exif-support-list');
  const fileName = container.querySelector('#exif-file-name');
  const fileNote = container.querySelector('#exif-file-note');
  const editKey = container.querySelector('#exif-edit-key');
  const editValue = container.querySelector('#exif-edit-value');
  const cleanFormat = container.querySelector('#exif-clean-format');

  let lastFile = null;
  let originalData = null;
  let editedData = null;

  supportList.textContent = `Reads ${supportedFormats.read.join(', ')}. Clean image export: ${supportedFormats.cleanExport.join(', ')}. Editable output: JSON sidecar.`;

  const renderTable = () => {
    const entries = normalizeExifEntries(editedData || {});
    tableBody.innerHTML = entries.map((entry) => `
      <tr class="exif-table-row${entry.isLocation ? ' exif-location-row' : ''}">
        <td class="exif-table-key">${escapeHtml(entry.key)}</td>
        <td class="exif-table-type">${escapeHtml(entry.valueType)}</td>
        <td class="exif-table-value exif-editable-value" contenteditable="true" data-exif-edit-key="${escapeHtml(entry.key)}">${escapeHtml(formatExifValue(entry.value))}</td>
      </tr>
    `).join('');
    editKey.innerHTML = entries.map((entry) => `<option value="${escapeHtml(entry.key)}">${escapeHtml(entry.key)}</option>`).join('');
    editKey.value = editKey.value || entries[0]?.key || '';
    editValue.value = editKey.value ? formatExifValue(editedData[editKey.value]) : '';
  };

  const onFile = async (files) => {
    const file = files[0];
    if (!file) return;
    if (!isExifSupportedFile(file)) {
      showToast('This file extension is not in the supported metadata list.', 'danger');
      return;
    }

    try {
      const { default: exifr } = await import('https://esm.sh/exifr@7.1.3/lite?bundle');
      const data = await exifr.parse(file, {
        tiff: true,
        ifd0: true,
        ifd1: true,
        exif: true,
        gps: true,
        interop: true,
        xmp: true,
        icc: true,
        iptc: true,
        jfif: true,
        ihdr: true
      });
      
      if (!data || !Object.keys(data).length) throw new Error('No metadata detected in this file.');
      lastFile = file;
      originalData = data;
      editedData = { ...data };

      const cleanPlan = planExifCleanCopy(file, cleanFormat.value);
      fileName.textContent = file.name;
      fileNote.textContent = `${Object.keys(data).length} metadata fields. ${cleanPlan.supported ? 'Clean image export available.' : cleanPlan.reason}`;
      renderTable();
      
      ui.classList.remove('hidden');
      showToast(`Loaded metadata for ${file.name}.`, 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  function commitExifInlineEdit(key, value) {
    if (!editedData || !key) return;
    editedData = applyExifSidecarEdit(editedData, key, value);
    editKey.value = key;
    editValue.value = formatExifValue(editedData[key]);
    renderTable();
  }

  async function saveEditedExifImage() {
    if (!lastFile || !editedData) return;
    if (/\.jpe?g$/i.test(lastFile.name) || lastFile.type === 'image/jpeg') {
      const blob = await buildJpegWithEditedExifMetadata(lastFile, editedData);
      downloadFile(blob, getEditedImageName(lastFile.name, 'jpg'), 'image/jpeg');
      showToast('Edited metadata embedded in JPEG EXIF.', 'success');
      return;
    }
    const plan = planExifCleanCopy(lastFile, cleanFormat.value);
    if (!plan.supported) {
      downloadFile(JSON.stringify(editedData, null, 2), 'metadata.edited.json', 'application/json');
      showToast(plan.reason, 'danger');
      return;
    }
    const blob = await encodeCleanImage(lastFile, plan.mimeType);
    downloadFile(blob, plan.fileName, plan.mimeType);
    downloadFile(JSON.stringify(editedData, null, 2), plan.fileName.replace(/\.[^.]+$/, '.metadata.json'), 'application/json');
    showToast('Edited image and metadata sidecar exported.', 'success');
  }

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

  editKey.addEventListener('change', () => {
    editValue.value = editKey.value && editedData ? formatExifValue(editedData[editKey.value]) : '';
  });

  container.querySelector('#btn-apply-exif-edit').addEventListener('click', () => {
    if (!editedData) return;
    try {
      editedData = applyExifSidecarEdit(editedData, editKey.value, editValue.value);
      renderTable();
      showToast('Sidecar metadata updated.', 'success');
    } catch (error) {
      showToast(error.message, 'danger');
    }
  });

  tableBody.addEventListener('blur', (event) => {
    const target = event.target.closest('[data-exif-edit-key]');
    if (!target) return;
    try {
      commitExifInlineEdit(target.dataset.exifEditKey, target.textContent);
      showToast('Metadata value updated.', 'success');
    } catch (error) {
      showToast(error.message, 'danger');
    }
  }, true);

  tableBody.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.target.blur();
  });

  container.querySelector('#btn-remove-exif-field').addEventListener('click', () => {
    if (!editedData || !editKey.value) return;
    delete editedData[editKey.value];
    renderTable();
    showToast('Metadata field removed.', 'success');
  });

  container.querySelector('#btn-remove-all-exif').addEventListener('click', () => {
    if (!editedData) return;
    editedData = {};
    renderTable();
    showToast('Metadata sidecar cleared.', 'success');
  });

  container.querySelector('#btn-copy-exif').addEventListener('click', () => {
    if (editedData) copyToClipboard(JSON.stringify(editedData, null, 2));
  });

  container.querySelector('#btn-dl-exif').addEventListener('click', () => {
    if (originalData) downloadFile(JSON.stringify(originalData, null, 2), 'metadata.original.json', 'application/json');
  });

  container.querySelector('#btn-dl-edited-exif').addEventListener('click', () => {
    if (editedData) downloadFile(JSON.stringify(editedData, null, 2), 'metadata.edited.json', 'application/json');
  });

  container.querySelector('#btn-clean-exif-copy').addEventListener('click', async () => {
    if (!lastFile) return;
    const button = container.querySelector('#btn-clean-exif-copy');
    const plan = planExifCleanCopy(lastFile, cleanFormat.value);
    if (!plan.supported) {
      showToast(plan.reason, 'danger');
      return;
    }
    button.disabled = true;
    button.textContent = 'Exporting...';
    try {
      const blob = await encodeCleanImage(lastFile, plan.mimeType);
      downloadFile(blob, plan.fileName, plan.mimeType);
      showToast('Clean image exported.', 'success');
    } catch (error) {
      showToast(error.message, 'danger');
    } finally {
      button.disabled = false;
      button.textContent = 'Export Clean Image';
    }
  });

  container.querySelector('#btn-save-edited-exif-image').addEventListener('click', () => {
    saveEditedExifImage().catch((error) => showToast(error.message, 'danger'));
  });
}

export function unmount() {
  cleanup.forEach((dispose) => dispose());
  cleanup = [];
  if (container) container.remove();
  container = null;
}

function getEditedImageName(name = 'image.jpg', extension = 'jpg') {
  const base = String(name || 'image')
    .replace(/\.[^.]+$/, '')
    .replace(/[^\w.-]+/g, '_') || 'image';
  return `${base}_edited.${extension}`;
}

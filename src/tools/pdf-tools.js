import { setupDragAndDrop } from '../ui/drag-drop.js';
import { downloadFile, showToast } from '../ui/ui-utils.js';
import {
  appendPdfFiles,
  removePdfFile,
  movePdfFile,
  getPdfMergeState,
  getPdfQueueFile,
  getPdfPagePreviewItems,
  applyPdfPageAction,
  movePdfPreviewPage,
  normalizePdfRotation,
  parsePdfPageSelection,
  togglePdfPreviewPage,
  updatePdfPageCount,
  updatePdfPageRotation,
  updatePdfPageSelection,
  updatePdfPageStatus
} from '../utils/pdf.js';

let container = null;
let pendingPdfs = [];
let cleanupDragDrop = null;
let pdfLibPromise = null;
let pageMetadataToken = 0;

async function loadPdfLib() {
  if (!pdfLibPromise) {
    pdfLibPromise = import('https://esm.sh/pdf-lib@1.17.1?bundle');
  }
  return pdfLibPromise;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderPdfPagePreview(file, index) {
  const chips = getPdfPagePreviewItems(file);
  if (!chips.length) return '';
  return `
    <div class="pdf-page-preview" data-page-preview="${index}">
      ${chips.map((chip) => `
        <button
          type="button"
          class="pdf-page-chip${chip.selected ? ' is-selected' : ' is-omitted'}${chip.duplicate ? ' is-duplicate' : ''}"
          data-page-toggle="${index}"
          data-page-number="${chip.page}"
          data-page-sequence="${chip.sequenceIndex}"
          ${chip.selected ? `data-page-drag="${index}" data-page-drop="${index}" draggable="true"` : ''}
        >
          <span class="pdf-page-chip-number">${chip.page}</span>
          <span class="pdf-page-chip-state">${chip.selected ? (chip.duplicate ? 'Copy' : 'Page') : 'Off'}</span>
        </button>
      `).join('')}
    </div>
  `;
}

export async function mount(parent) {
  container = document.createElement('div');
  container.className = 'tool-pdf';
  container.innerHTML = `
    <div class="card tool-shell-stack">
      <div id="pdf-drop-zone" class="tool-dropzone tool-dropzone-large">
        <div class="tool-dropzone-glyph">PDF</div>
        <div class="tool-dropzone-copy">Drop PDFs here to merge or click to upload</div>
        <input type="file" id="pdf-input" class="hidden" accept=".pdf" multiple>
      </div>

      <div id="pdf-list-section" class="hidden tool-list-panel">
        <div class="tool-list-head">
          <h4 class="tool-list-title">Merge Queue</h4>
          <div id="pdf-queue-meta" class="tool-list-meta"></div>
        </div>
        <ul id="pdf-queue" class="tool-file-list"></ul>
        <div class="pdf-page-help">Use page ranges like all, 1-3,7,5. Omitted pages are removed; order controls the export order. Use the page tools for common edits.</div>
        <div id="pdf-status" class="tool-status-copy"></div>
        <div class="tool-action-row tool-action-row-compact">
          <button id="btn-clear-pdfs" class="btn-secondary tool-grow-1">Clear</button>
          <button id="btn-merge-pdfs" class="tool-grow-2">Merge / Export</button>
        </div>
      </div>
    </div>
  `;
  
  parent.appendChild(container);
  
  const dropZone = container.querySelector('#pdf-drop-zone');
  const fileInput = container.querySelector('#pdf-input');
  const listSection = container.querySelector('#pdf-list-section');
  const queue = container.querySelector('#pdf-queue');
  const queueMeta = container.querySelector('#pdf-queue-meta');
  const status = container.querySelector('#pdf-status');
  const btnMerge = container.querySelector('#btn-merge-pdfs');
  const btnClear = container.querySelector('#btn-clear-pdfs');
  let pageDragState = null;

  const onPdfs = (files) => {
    pendingPdfs = appendPdfFiles(pendingPdfs, files).filter((file) => file?.name?.toLowerCase().endsWith('.pdf'));
    renderQueue();
    refreshPdfPageCounts();
  };

  const renderQueue = () => {
    const mergeState = getPdfMergeState(pendingPdfs);
    const pageErrors = pendingPdfs
      .map((item) => {
        if (!item.pageCount) return '';
        const pageState = parsePdfPageSelection(item.pageSelection, item.pageCount);
        return pageState.error ? `${item.name}: ${pageState.error}` : '';
      })
      .filter(Boolean);
    listSection.classList.toggle('hidden', mergeState.count === 0);
    queueMeta.textContent = mergeState.count === 0 ? '' : `${mergeState.count} file${mergeState.count === 1 ? '' : 's'}`;
    status.textContent = pageErrors[0] || mergeState.message;
    btnMerge.disabled = !mergeState.canMerge || pageErrors.length > 0;
    btnClear.disabled = mergeState.count === 0;
    if (mergeState.count === 0) {
      queue.innerHTML = '';
      return;
    }

    queue.innerHTML = pendingPdfs.map((file, index) => `
      <li class="tool-file-row">
        <div class="tool-file-row-index">${index + 1}</div>
        <div class="pdf-file-main">
          <div class="tool-file-row-name">${escapeHtml(file.name)}</div>
          <div class="tool-file-row-size">${(file.size / 1024).toFixed(1)} KB · ${escapeHtml(file.pageStatus || (file.pageCount ? `${file.pageCount} pages` : 'Page count pending'))}</div>
          <label class="pdf-page-field">
            <span>Pages</span>
            <input data-pages="${index}" value="${escapeHtml(file.pageSelection || 'all')}" placeholder="all or 1-3,7,5">
          </label>
          <div class="pdf-page-actions">
            <button type="button" data-page-action="all" data-idx="${index}" class="btn-secondary tool-btn-compact">All</button>
            <button type="button" data-page-action="reverse" data-idx="${index}" class="btn-secondary tool-btn-compact">Reverse</button>
            <button type="button" data-page-action="odd" data-idx="${index}" class="btn-secondary tool-btn-compact">Odd</button>
            <button type="button" data-page-action="even" data-idx="${index}" class="btn-secondary tool-btn-compact">Even</button>
            <button type="button" data-page-action="duplicate" data-idx="${index}" class="btn-secondary tool-btn-compact">Duplicate</button>
          </div>
          ${renderPdfPagePreview(file, index)}
          <label class="pdf-page-field pdf-rotation-field">
            <span>Rotate Exported Pages</span>
            <select data-rotation="${index}">
              <option value="0" ${normalizePdfRotation(file.rotation) === 0 ? 'selected' : ''}>None</option>
              <option value="90" ${normalizePdfRotation(file.rotation) === 90 ? 'selected' : ''}>90 deg</option>
              <option value="180" ${normalizePdfRotation(file.rotation) === 180 ? 'selected' : ''}>180 deg</option>
              <option value="270" ${normalizePdfRotation(file.rotation) === 270 ? 'selected' : ''}>270 deg</option>
            </select>
          </label>
        </div>
        <div class="tool-file-row-actions">
          <button type="button" data-move="up" data-idx="${index}" class="btn-secondary tool-btn-compact">Up</button>
          <button type="button" data-move="down" data-idx="${index}" class="btn-secondary tool-btn-compact">Down</button>
          <button type="button" data-remove="${index}" class="tool-btn-danger tool-btn-compact">Remove</button>
        </div>
      </li>
    `).join('');
  };

  const findPdfItemIndex = (target) => {
    const targetFile = getPdfQueueFile(target);
    return pendingPdfs.findIndex((item) => getPdfQueueFile(item) === targetFile);
  };

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => onPdfs(e.target.files));
  cleanupDragDrop = setupDragAndDrop(dropZone, onPdfs);

  const refreshPdfPageCounts = async () => {
    const token = ++pageMetadataToken;
    const candidates = pendingPdfs
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !item.pageCount && typeof getPdfQueueFile(item)?.arrayBuffer === 'function');
    if (!candidates.length) return;

    let PDFDocument = null;
    try {
      ({ PDFDocument } = await loadPdfLib());
    } catch (error) {
      pendingPdfs = pendingPdfs.map((item) => item.pageCount ? item : { ...item, pageStatus: 'Page count unavailable' });
      renderQueue();
      return;
    }

    for (const { item } of candidates) {
      if (token !== pageMetadataToken) return;
      let index = findPdfItemIndex(item);
      if (index === -1) continue;
      pendingPdfs = updatePdfPageStatus(pendingPdfs, index, 'Reading pages...');
      renderQueue();
      try {
        const pdf = await PDFDocument.load(await getPdfQueueFile(item).arrayBuffer());
        index = findPdfItemIndex(item);
        if (index === -1) continue;
        const count = pdf.getPageCount();
        pendingPdfs = updatePdfPageCount(pendingPdfs, index, count, `${count} page${count === 1 ? '' : 's'}`);
      } catch (error) {
        index = findPdfItemIndex(item);
        if (index === -1) continue;
        pendingPdfs = updatePdfPageStatus(pendingPdfs, index, `Page count failed: ${error.message}`);
      }
      renderQueue();
    }
  };

  container.addEventListener('click', (e) => {
    const dataset = e.target.dataset || {};
    const index = Number(dataset.idx);
    if (dataset.remove !== undefined) {
      pendingPdfs = removePdfFile(pendingPdfs, Number(dataset.remove));
      renderQueue();
      return;
    }
    if (dataset.move === 'up') {
      pendingPdfs = movePdfFile(pendingPdfs, index, index - 1);
      renderQueue();
      return;
    }
    if (dataset.move === 'down') {
      pendingPdfs = movePdfFile(pendingPdfs, index, index + 1);
      renderQueue();
      return;
    }
    if (dataset.pageAction) {
      pendingPdfs = applyPdfPageAction(pendingPdfs, index, dataset.pageAction);
      renderQueue();
      return;
    }
    if (dataset.pageToggle !== undefined) {
      pendingPdfs = togglePdfPreviewPage(pendingPdfs, Number(dataset.pageToggle), Number(dataset.pageNumber), Number(dataset.pageSequence));
      renderQueue();
    }
  });

  container.addEventListener('dragstart', (e) => {
    const dataset = e.target.dataset || {};
    if (dataset.pageDrag === undefined) return;
    pageDragState = {
      index: Number(dataset.pageDrag),
      sequenceIndex: Number(dataset.pageSequence)
    };
    e.dataTransfer?.setData('text/plain', JSON.stringify(pageDragState));
  });

  container.addEventListener('dragover', (e) => {
    if (e.target.dataset?.pageDrop === undefined) return;
    e.preventDefault();
  });

  container.addEventListener('drop', (e) => {
    const dataset = e.target.dataset || {};
    if (dataset.pageDrop === undefined || !pageDragState) return;
    e.preventDefault();
    const index = Number(dataset.pageDrop);
    if (index === pageDragState.index) {
      pendingPdfs = movePdfPreviewPage(pendingPdfs, index, pageDragState.sequenceIndex, Number(dataset.pageSequence));
      renderQueue();
    }
    pageDragState = null;
  });

  container.addEventListener('input', (e) => {
    if (e.target.dataset?.pages === undefined) return;
    pendingPdfs = updatePdfPageSelection(pendingPdfs, Number(e.target.dataset.pages), e.target.value);
    renderQueue();
  });

  container.addEventListener('change', (e) => {
    if (e.target.dataset?.rotation === undefined) return;
    pendingPdfs = updatePdfPageRotation(pendingPdfs, Number(e.target.dataset.rotation), e.target.value);
    renderQueue();
  });

  btnClear.addEventListener('click', () => {
    pendingPdfs = [];
    renderQueue();
  });

  btnMerge.addEventListener('click', async () => {
    const mergeState = getPdfMergeState(pendingPdfs);
    if (!mergeState.canMerge) {
      status.textContent = mergeState.message;
      return;
    }
    
    btnMerge.disabled = true;
    btnMerge.textContent = 'Merging...';
    status.textContent = 'Loading PDF engine...';

    try {
      const { PDFDocument, degrees } = await loadPdfLib();
      const mergedPdf = await PDFDocument.create();
      
      for (const item of pendingPdfs) {
        const file = getPdfQueueFile(item);
        status.textContent = `Reading ${item.name}...`;
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        const pageCount = item.pageCount || pdf.getPageCount();
        const pageState = parsePdfPageSelection(item.pageSelection, pageCount);
        if (pageState.error) throw new Error(`${item.name}: ${pageState.error}`);
        const rotation = normalizePdfRotation(item.rotation);
        const copiedPages = await mergedPdf.copyPages(pdf, pageState.indices);
        copiedPages.forEach((page) => {
          if (rotation) page.setRotation(degrees(rotation));
          mergedPdf.addPage(page);
        });
      }

      status.textContent = 'Saving PDF...';
      const mergedBytes = await mergedPdf.save();
      downloadFile(mergedBytes, pendingPdfs.length === 1 ? `${pendingPdfs[0].name.replace(/\.pdf$/i, '')}_pages.pdf` : 'merged.pdf', 'application/pdf');
      status.textContent = pendingPdfs.length === 1 ? 'PDF exported.' : `Merged ${pendingPdfs.length} PDFs.`;
      showToast('PDF downloaded.', 'success');
    } catch (err) {
      status.textContent = err.message;
      showToast('Merge failed: ' + err.message, 'danger');
    } finally {
      btnMerge.textContent = 'Merge / Export';
      btnMerge.disabled = !getPdfMergeState(pendingPdfs).canMerge;
    }
  });

  renderQueue();
}

export function unmount() {
  cleanupDragDrop?.();
  cleanupDragDrop = null;
  pendingPdfs = [];
  pageMetadataToken += 1;
  if (container) {
    container.remove();
    container = null;
  }
}

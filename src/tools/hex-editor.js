import { setupDragAndDrop } from '../ui/drag-drop.js';
import { copyToClipboard, downloadFile } from '../ui/ui-utils.js';
import {
  applyBytePatch,
  buildPatchRecords,
  buildSearchNeedle,
  byteToChar,
  clamp,
  findNeedleIndex,
  formatHexByte,
  formatOffset,
  formatSize,
  getOffsetWidth,
  getSearchSegments,
  getSelectionRange,
  getViewportRows,
  normalizeHexByteInput,
  normalizeSearchHaystack,
  parseOffset
} from '../utils/hex.js';

const ROW_HEIGHT = 28;
const DEFAULT_BYTES_PER_ROW = 16;
const MAX_WINDOW_ROWS = 100000;
const RENDER_OVERSCAN = 10;
const PAGE_SIZE = 256 * 1024;
const PAGE_CACHE_LIMIT = 48;
const SEARCH_CHUNK_SIZE = 1024 * 1024;
const utf8Decoder = new TextDecoder();

let container = null;
let cleanup = [];
let refs = {};
let state = null;
let renderToken = 0;
let selectionToken = 0;
let searchToken = 0;
let renderQueued = false;

class SlidingBlobReader {
  constructor(file, pageSize = PAGE_SIZE, pageLimit = PAGE_CACHE_LIMIT) {
    this.file = file;
    this.pageSize = pageSize;
    this.pageLimit = pageLimit;
    this.pages = new Map();
    this.pending = new Map();
    this.clock = 0;
  }

  async getPage(pageIndex) {
    const cached = this.pages.get(pageIndex);
    if (cached) {
      cached.tick = ++this.clock;
      return cached.bytes;
    }
    const inflight = this.pending.get(pageIndex);
    if (inflight) return inflight;
    const task = this.file
      .slice(pageIndex * this.pageSize, Math.min(this.file.size, (pageIndex + 1) * this.pageSize))
      .arrayBuffer()
      .then((buffer) => {
        const bytes = new Uint8Array(buffer);
        this.pending.delete(pageIndex);
        this.pages.set(pageIndex, { bytes, tick: ++this.clock });
        this.trim();
        return bytes;
      })
      .catch((error) => {
        this.pending.delete(pageIndex);
        throw error;
      });
    this.pending.set(pageIndex, task);
    return task;
  }

  trim() {
    if (this.pages.size <= this.pageLimit) return;
    let oldestKey = null;
    let oldestTick = Number.POSITIVE_INFINITY;
    for (const [pageIndex, page] of this.pages.entries()) {
      if (page.tick < oldestTick) {
        oldestTick = page.tick;
        oldestKey = pageIndex;
      }
    }
    if (oldestKey !== null) this.pages.delete(oldestKey);
  }

  async readRange(start, end) {
    const safeStart = clamp(start, 0, this.file.size);
    const safeEnd = clamp(end, 0, this.file.size);
    if (safeEnd <= safeStart) return new Uint8Array(0);
    const bytes = new Uint8Array(safeEnd - safeStart);
    const firstPage = Math.floor(safeStart / this.pageSize);
    const lastPage = Math.floor((safeEnd - 1) / this.pageSize);
    let writeOffset = 0;

    for (let pageIndex = firstPage; pageIndex <= lastPage; pageIndex += 1) {
      const pageBytes = await this.getPage(pageIndex);
      const pageStart = pageIndex * this.pageSize;
      const sliceStart = Math.max(safeStart, pageStart);
      const sliceEnd = Math.min(safeEnd, pageStart + pageBytes.length);
      const from = sliceStart - pageStart;
      const to = sliceEnd - pageStart;
      bytes.set(pageBytes.subarray(from, to), writeOffset);
      writeOffset += to - from;
    }

    return bytes;
  }

  getCachedPageCount() {
    return this.pages.size;
  }

  dispose() {
    this.pages.clear();
    this.pending.clear();
  }
}

function createInitialState() {
  return {
    file: null,
    reader: null,
    bytesPerRow: DEFAULT_BYTES_PER_ROW,
    totalRows: 0,
    offsetWidth: 8,
    patches: new Map(),
    bookmarks: [],
    selectionAnchor: null,
    selectionFocus: null,
    windowStartRow: 0,
    windowRowCount: 0,
    editor: null,
    search: {
      open: false,
      active: false,
      mode: 'text',
      query: '',
      caseSensitive: false,
      cursor: 0,
      lastMatch: null,
      progressText: 'Ready.'
    }
  };
}

function resetRuntime() {
  closeEditor(false);
  cancelSearch('Search cancelled.');
  if (state?.reader) state.reader.dispose();
  renderToken += 1;
  selectionToken += 1;
  state = createInitialState();
}

export async function mount(parent) {
  resetRuntime();
  cleanup = [];
  container = document.createElement('div');
  container.className = 'tool-hex-editor';
  container.innerHTML = `
    <div class="card hex-suite-card">
      <div id="hex-drop-zone" class="hex-suite-drop">
        <div class="hex-suite-drop-icon">
          <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="3.5" width="16" height="17" rx="2"></rect><path d="M8 7.5h8"></path><path d="M8 11.5h3"></path><path d="M13 11.5h3"></path><path d="M8 15.5h3"></path><path d="M13 15.5h3"></path></svg>
        </div>
        <div class="hex-suite-drop-title">Open a file</div>
        <div class="hex-suite-drop-copy">Bytes stay paged and windowed so large files remain workable.</div>
        <div class="hex-suite-drop-actions">
          <button type="button" id="hex-open-file">Open File</button>
        </div>
        <input type="file" id="hex-input" class="hidden">
      </div>

      <div id="hex-shell" class="hex-suite-shell hidden">
        <div class="hex-suite-toolbar">
          <div class="hex-suite-summary">
            <div class="hex-suite-chip"><span>File</span><strong id="hex-filename">-</strong></div>
            <div class="hex-suite-chip"><span>Size</span><strong id="hex-filesize">-</strong></div>
            <div class="hex-suite-chip"><span>Changes</span><strong id="hex-dirty-count">0</strong></div>
            <div class="hex-suite-chip"><span>Window</span><strong id="hex-window-label">-</strong></div>
          </div>
          <div class="hex-suite-actions">
            <label class="hex-field">
              <span>Bytes / Row</span>
              <select id="hex-bytes-per-row">
                <option value="8">8</option>
                <option value="16" selected>16</option>
                <option value="24">24</option>
                <option value="32">32</option>
              </select>
            </label>
            <label class="hex-field">
              <span>Jump to</span>
              <input type="text" id="hex-goto" placeholder="0x400">
            </label>
            <button type="button" class="btn-secondary" id="hex-find-btn">Find</button>
            <button type="button" class="btn-secondary" id="hex-replace-btn">Replace File</button>
            <button type="button" class="btn-secondary" id="hex-bookmark-btn">Bookmark</button>
            <button type="button" class="btn-secondary" id="hex-export-patches-btn">Patch Set</button>
            <button type="button" id="hex-export-btn">Export File</button>
          </div>
        </div>

        <div class="hex-suite-main">
          <section class="hex-browser-panel">
            <div class="hex-grid-header">
              <div>Offset</div>
              <div>Hex</div>
              <div>ASCII</div>
            </div>
            <div class="hex-viewport-wrap">
              <div id="hex-viewport" class="hex-viewport" tabindex="0">
                <div id="hex-spacer" class="hex-spacer"></div>
                <div id="hex-content" class="hex-content"></div>
              </div>
              <div id="hex-editor-layer" class="hex-editor-layer"></div>
              <div id="hex-search-overlay" class="hex-search-overlay hidden">
                <div class="hex-search-header">
                  <strong>Search</strong>
                  <button type="button" class="hex-ghost-btn" id="hex-close-search-btn">Close</button>
                </div>
                <div class="hex-search-grid">
                  <label class="hex-field">
                    <span>Mode</span>
                    <select id="hex-search-mode">
                      <option value="text">Text</option>
                      <option value="hex">Hex Bytes</option>
                    </select>
                  </label>
                  <label class="hex-field hex-search-query-field">
                    <span>Query</span>
                    <input type="text" id="hex-search-query" placeholder="needle">
                  </label>
                  <label class="hex-check">
                    <input type="checkbox" id="hex-search-case">
                    <span>Match case</span>
                  </label>
                </div>
                <div class="hex-search-actions">
                  <button type="button" id="hex-search-next-btn">Find Next</button>
                  <button type="button" class="btn-secondary" id="hex-search-cancel-btn">Cancel</button>
                </div>
                <div id="hex-search-status" class="hex-search-status">Ready.</div>
              </div>
            </div>
          </section>

          <aside class="hex-sidebar">
            <div class="studio-section expanded" data-hex-section>
              <div class="studio-section-header" data-section-toggle>
                <span class="studio-section-title">Overview</span>
                <span class="section-toggle-icon">▾</span>
              </div>
              <div class="studio-section-content">
                <div class="hex-info-grid">
                  <div><span>Rows</span><strong id="hex-total-rows">-</strong></div>
                  <div><span>Page Cache</span><strong id="hex-cache-pages">0</strong></div>
                  <div><span>Page Size</span><strong id="hex-page-size">${formatSize(PAGE_SIZE)}</strong></div>
                  <div><span>Search Chunk</span><strong id="hex-search-chunk">${formatSize(SEARCH_CHUNK_SIZE)}</strong></div>
                </div>
              </div>
            </div>

            <div class="studio-section expanded" data-hex-section>
              <div class="studio-section-header" data-section-toggle>
                <span class="studio-section-title">Selection</span>
                <span class="section-toggle-icon">▾</span>
              </div>
              <div class="studio-section-content">
                <div class="hex-info-grid">
                  <div><span>Offset</span><strong id="hex-selection-offset">-</strong></div>
                  <div><span>Length</span><strong id="hex-selection-length">0</strong></div>
                  <div><span>Hex</span><strong id="hex-selection-hex">-</strong></div>
                  <div><span>ASCII</span><strong id="hex-selection-ascii">-</strong></div>
                  <div><span>Unsigned</span><strong id="hex-selection-dec">-</strong></div>
                  <div><span>Binary</span><strong id="hex-selection-bin">-</strong></div>
                  <div><span>UInt16 LE</span><strong id="hex-selection-u16le">-</strong></div>
                  <div><span>UInt16 BE</span><strong id="hex-selection-u16be">-</strong></div>
                </div>
                <div class="hex-panel-actions">
                  <button type="button" class="btn-secondary" id="hex-copy-hex-btn">Copy Hex</button>
                  <button type="button" class="btn-secondary" id="hex-copy-text-btn">Copy Text</button>
                  <button type="button" class="btn-secondary" id="hex-revert-selection-btn">Revert Selection</button>
                </div>
              </div>
            </div>

            <div class="studio-section expanded" data-hex-section>
              <div class="studio-section-header" data-section-toggle>
                <span class="studio-section-title">Bookmarks</span>
                <span class="section-toggle-icon">▾</span>
              </div>
              <div class="studio-section-content">
                <div id="hex-bookmarks" class="hex-list"></div>
                <div class="hex-panel-actions">
                  <button type="button" class="btn-secondary" id="hex-clear-bookmarks-btn">Clear Bookmarks</button>
                </div>
              </div>
            </div>

            <div class="studio-section expanded" data-hex-section>
              <div class="studio-section-header" data-section-toggle>
                <span class="studio-section-title">Changes</span>
                <span class="section-toggle-icon">▾</span>
              </div>
              <div class="studio-section-content">
                <div id="hex-patches" class="hex-list"></div>
                <div class="hex-panel-actions">
                  <button type="button" class="btn-secondary" id="hex-revert-all-btn">Revert All</button>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div id="hex-status" class="hex-suite-status">Open a byte with Enter or by clicking the same cell twice. Shift extends the selection.</div>
      </div>
    </div>
  `;

  parent.appendChild(container);

  refs = {
    dropZone: container.querySelector('#hex-drop-zone'),
    fileInput: container.querySelector('#hex-input'),
    shell: container.querySelector('#hex-shell'),
    viewport: container.querySelector('#hex-viewport'),
    spacer: container.querySelector('#hex-spacer'),
    content: container.querySelector('#hex-content'),
    editorLayer: container.querySelector('#hex-editor-layer'),
    searchOverlay: container.querySelector('#hex-search-overlay'),
    filename: container.querySelector('#hex-filename'),
    filesize: container.querySelector('#hex-filesize'),
    dirtyCount: container.querySelector('#hex-dirty-count'),
    windowLabel: container.querySelector('#hex-window-label'),
    totalRows: container.querySelector('#hex-total-rows'),
    cachePages: container.querySelector('#hex-cache-pages'),
    status: container.querySelector('#hex-status'),
    goto: container.querySelector('#hex-goto'),
    bytesPerRow: container.querySelector('#hex-bytes-per-row'),
    searchMode: container.querySelector('#hex-search-mode'),
    searchQuery: container.querySelector('#hex-search-query'),
    searchCase: container.querySelector('#hex-search-case'),
    searchStatus: container.querySelector('#hex-search-status'),
    selectionOffset: container.querySelector('#hex-selection-offset'),
    selectionLength: container.querySelector('#hex-selection-length'),
    selectionHex: container.querySelector('#hex-selection-hex'),
    selectionAscii: container.querySelector('#hex-selection-ascii'),
    selectionDec: container.querySelector('#hex-selection-dec'),
    selectionBin: container.querySelector('#hex-selection-bin'),
    selectionU16le: container.querySelector('#hex-selection-u16le'),
    selectionU16be: container.querySelector('#hex-selection-u16be'),
    bookmarks: container.querySelector('#hex-bookmarks'),
    patches: container.querySelector('#hex-patches')
  };

  const onFilePick = (files) => {
    const file = Array.from(files || [])[0];
    if (file) loadFile(file);
  };

  bind(refs.dropZone, 'click', (event) => {
    if (event.target === refs.dropZone || event.target.closest('#hex-open-file')) refs.fileInput.click();
  });
  bind(refs.fileInput, 'change', (event) => onFilePick(event.target.files));
  cleanup.push(setupDragAndDrop(refs.dropZone, onFilePick));
  bind(refs.viewport, 'scroll', handleViewportScroll);
  bind(refs.content, 'click', handleContentClick);
  bind(refs.content, 'dblclick', handleContentDoubleClick);
  bind(refs.viewport, 'keydown', handleViewportKeydown);
  bind(refs.bytesPerRow, 'change', handleBytesPerRowChange);
  bind(refs.goto, 'keydown', handleGotoKeydown);
  bind(container.querySelector('#hex-find-btn'), 'click', () => openSearchOverlay(true));
  bind(container.querySelector('#hex-replace-btn'), 'click', () => refs.fileInput.click());
  bind(container.querySelector('#hex-bookmark-btn'), 'click', addBookmarkFromSelection);
  bind(container.querySelector('#hex-export-btn'), 'click', exportPatchedFile);
  bind(container.querySelector('#hex-export-patches-btn'), 'click', exportPatchSet);
  bind(container.querySelector('#hex-copy-hex-btn'), 'click', () => copySelection('hex'));
  bind(container.querySelector('#hex-copy-text-btn'), 'click', () => copySelection('text'));
  bind(container.querySelector('#hex-revert-selection-btn'), 'click', revertSelection);
  bind(container.querySelector('#hex-clear-bookmarks-btn'), 'click', clearBookmarks);
  bind(container.querySelector('#hex-revert-all-btn'), 'click', revertAll);
  bind(container.querySelector('#hex-close-search-btn'), 'click', closeSearchOverlay);
  bind(container.querySelector('#hex-search-cancel-btn'), 'click', () => cancelSearch('Search cancelled.'));
  bind(container.querySelector('#hex-search-next-btn'), 'click', startProgressiveSearch);
  bind(refs.searchQuery, 'keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      startProgressiveSearch();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSearchOverlay();
    }
  });
  bind(refs.searchMode, 'change', syncSearchInputsToState);
  bind(refs.searchQuery, 'input', syncSearchInputsToState);
  bind(refs.searchCase, 'change', syncSearchInputsToState);
  bind(refs.bookmarks, 'click', handleBookmarkListClick);
  bind(refs.patches, 'click', handlePatchListClick);
  container.querySelectorAll('[data-section-toggle]').forEach((node) => {
    bind(node, 'click', () => node.closest('[data-hex-section]')?.classList.toggle('expanded'));
  });

  renderBookmarks();
  renderPatches();
}

function bind(node, eventName, handler) {
  if (!node) return;
  node.addEventListener(eventName, handler);
  cleanup.push(() => node.removeEventListener(eventName, handler));
}

async function loadFile(file) {
  resetRuntime();
  state.file = file;
  state.reader = new SlidingBlobReader(file);
  state.totalRows = Math.max(1, Math.ceil(file.size / state.bytesPerRow));
  state.offsetWidth = getOffsetWidth(file.size);
  state.windowRowCount = Math.min(state.totalRows, MAX_WINDOW_ROWS);
  refs.filename.textContent = file.name;
  refs.filesize.textContent = formatSize(file.size);
  refs.totalRows.textContent = state.totalRows.toLocaleString();
  refs.dropZone.classList.add('hidden');
  refs.shell.classList.remove('hidden');
  refs.searchOverlay.classList.add('hidden');
  refs.searchMode.value = state.search.mode;
  refs.searchQuery.value = '';
  refs.searchCase.checked = false;
  refs.searchStatus.textContent = 'Ready.';
  refs.viewport.scrollTop = 0;
  state.windowStartRow = 0;
  refs.spacer.style.height = `${Math.max(1, state.windowRowCount) * ROW_HEIGHT}px`;
  renderBookmarks();
  renderPatches();
  refreshSelectionPanel();
  updateSummary();
  setStatus('File ready. The viewport stays in a bounded window even on very large binaries.');
  await renderVisibleRows();
  refs.viewport.focus();
}

function updateSummary() {
  if (!state.file) return;
  refs.dirtyCount.textContent = state.patches.size.toLocaleString();
  const windowStart = state.windowStartRow + 1;
  const windowEnd = Math.min(state.totalRows, state.windowStartRow + state.windowRowCount);
  refs.windowLabel.textContent = `${windowStart.toLocaleString()}-${windowEnd.toLocaleString()}`;
  refs.cachePages.textContent = state.reader?.getCachedPageCount().toLocaleString() ?? '0';
}

function setStatus(message, tone = 'neutral') {
  refs.status.textContent = message;
  refs.status.dataset.tone = tone;
}

function syncSearchInputsToState() {
  state.search.mode = refs.searchMode.value;
  state.search.query = refs.searchQuery.value;
  state.search.caseSensitive = refs.searchCase.checked;
}

function openSearchOverlay(autoFocus = false) {
  state.search.open = true;
  refs.searchOverlay.classList.remove('hidden');
  syncSearchInputsToState();
  if (autoFocus) {
    requestAnimationFrame(() => {
      refs.searchQuery.focus();
      refs.searchQuery.select();
    });
  }
}

function closeSearchOverlay() {
  cancelSearch('Search closed.');
  state.search.open = false;
  refs.searchOverlay.classList.add('hidden');
}

function cancelSearch(message = 'Search cancelled.') {
  searchToken += 1;
  if (state?.search) {
    state.search.active = false;
    state.search.progressText = message;
    if (refs.searchStatus) refs.searchStatus.textContent = message;
  }
}

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(async () => {
    renderQueued = false;
    await renderVisibleRows();
  });
}

function getSearchMatchRange() {
  if (!state.search.lastMatch) return null;
  return {
    start: state.search.lastMatch.start,
    end: state.search.lastMatch.start + state.search.lastMatch.length - 1
  };
}

function escapeText(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function readEffectiveRange(start, end) {
  const bytes = await state.reader.readRange(start, end);
  for (const [offset, patch] of state.patches.entries()) {
    if (offset >= start && offset < end) bytes[offset - start] = patch.value;
  }
  return bytes;
}

async function renderVisibleRows() {
  if (!state.file || !state.reader) return;
  const token = ++renderToken;
  const { startRow: localStartRow, endRow: localEndRow } = getViewportRows({
    scrollTop: refs.viewport.scrollTop,
    viewportHeight: refs.viewport.clientHeight,
    rowHeight: ROW_HEIGHT,
    totalRows: state.windowRowCount,
    overscan: RENDER_OVERSCAN
  });
  const absoluteStartRow = state.windowStartRow + localStartRow;
  const absoluteEndRow = state.windowStartRow + localEndRow;
  const startByte = absoluteStartRow * state.bytesPerRow;
  const endByte = Math.min(state.file.size, absoluteEndRow * state.bytesPerRow);
  const bytes = await readEffectiveRange(startByte, endByte);
  if (token !== renderToken || !state.file) return;

  const selection = getSelectionRange(state.selectionAnchor, state.selectionFocus);
  const matchRange = getSearchMatchRange();
  const minWidth = 132 + state.bytesPerRow * 34 + Math.max(220, state.bytesPerRow * 14);
  const rows = [];

  for (let rowIndex = absoluteStartRow; rowIndex < absoluteEndRow; rowIndex += 1) {
    const rowBase = rowIndex * state.bytesPerRow;
    const rowOffset = rowBase - startByte;
    const hexCells = [];
    const asciiCells = [];

    for (let byteIndex = rowBase; byteIndex < Math.min(rowBase + state.bytesPerRow, state.file.size); byteIndex += 1) {
      const visibleIndex = rowOffset + (byteIndex - rowBase);
      const value = bytes[visibleIndex];
      const patch = state.patches.get(byteIndex);
      const original = patch?.original ?? value;
      const selected = selection && byteIndex >= selection.start && byteIndex <= selection.end;
      const focused = state.selectionFocus === byteIndex;
      const bookmarked = state.bookmarks.includes(byteIndex);
      const matched = matchRange && byteIndex >= matchRange.start && byteIndex <= matchRange.end;
      const classes = ['hex-byte-cell'];
      if (selected) classes.push('is-selected');
      if (focused) classes.push('is-focused');
      if (patch) classes.push('is-patched');
      if (bookmarked) classes.push('is-bookmarked');
      if (matched) classes.push('is-match');
      const className = classes.join(' ');
      const hexLabel = formatHexByte(value);
      const asciiLabel = escapeText(byteToChar(value));

      hexCells.push(`<span class="${className}" data-byte-index="${byteIndex}" data-cell-role="hex" data-current="${value}" data-original="${original}">${hexLabel}</span>`);
      asciiCells.push(`<span class="${className}" data-byte-index="${byteIndex}" data-cell-role="ascii" data-current="${value}" data-original="${original}">${asciiLabel}</span>`);
    }

    rows.push(`
      <div class="hex-row">
        <div class="hex-row-offset">${formatOffset(rowBase, state.offsetWidth)}</div>
        <div class="hex-row-hex">${hexCells.join('')}</div>
        <div class="hex-row-ascii">${asciiCells.join('')}</div>
      </div>
    `);
  }

  refs.content.style.transform = `translateY(${localStartRow * ROW_HEIGHT}px)`;
  refs.content.style.minWidth = `${minWidth}px`;
  refs.content.innerHTML = rows.join('');
  refs.cachePages.textContent = state.reader.getCachedPageCount().toLocaleString();
  updateSummary();
}

function maybeRecenterWindow() {
  if (!state.file || state.totalRows <= state.windowRowCount) return false;
  const localRow = Math.floor(refs.viewport.scrollTop / ROW_HEIGHT);
  const buffer = Math.max(256, Math.floor(state.windowRowCount * 0.18));
  if (localRow >= buffer && localRow <= state.windowRowCount - buffer) return false;
  const anchorRow = state.windowStartRow + localRow;
  const nextWindowStart = clamp(anchorRow - Math.floor(state.windowRowCount / 2), 0, state.totalRows - state.windowRowCount);
  if (nextWindowStart === state.windowStartRow) return false;
  const remainder = refs.viewport.scrollTop % ROW_HEIGHT;
  state.windowStartRow = nextWindowStart;
  refs.viewport.scrollTop = (anchorRow - nextWindowStart) * ROW_HEIGHT + remainder;
  refs.spacer.style.height = `${Math.max(1, state.windowRowCount) * ROW_HEIGHT}px`;
  updateSummary();
  return true;
}

function handleViewportScroll() {
  closeEditor(true);
  maybeRecenterWindow();
  queueRender();
}

function handleContentClick(event) {
  const cell = event.target.closest('[data-byte-index]');
  if (!cell) return;
  const byteIndex = Number(cell.dataset.byteIndex);
  const extend = event.shiftKey && Number.isInteger(state.selectionAnchor);
  if (extend) state.selectionFocus = byteIndex;
  else if (state.selectionFocus === byteIndex && cell.dataset.cellRole === 'hex') openEditor(cell);
  else {
    state.selectionAnchor = byteIndex;
    state.selectionFocus = byteIndex;
  }
  refreshSelectionPanel();
  queueRender();
  refs.viewport.focus();
}

function handleContentDoubleClick(event) {
  const cell = event.target.closest('[data-byte-index][data-cell-role="hex"]');
  if (cell) openEditor(cell);
}

function openEditor(cell, seed = '') {
  closeEditor(true);
  const byteIndex = Number(cell.dataset.byteIndex);
  const currentValue = Number(cell.dataset.current);
  const originalValue = Number(cell.dataset.original);
  const viewportRect = refs.viewport.getBoundingClientRect();
  const cellRect = cell.getBoundingClientRect();
  const input = document.createElement('input');
  input.type = 'text';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.maxLength = 2;
  input.value = seed ? normalizeHexByteInput(seed) : formatHexByte(currentValue);
  input.className = 'hex-byte-editor';
  input.style.left = `${cellRect.left - viewportRect.left + refs.viewport.scrollLeft}px`;
  input.style.top = `${cellRect.top - viewportRect.top + refs.viewport.scrollTop}px`;
  input.style.width = `${cellRect.width}px`;
  input.style.height = `${cellRect.height}px`;
  refs.editorLayer.innerHTML = '';
  refs.editorLayer.appendChild(input);
  state.editor = { input, byteIndex, originalValue };
  requestAnimationFrame(() => {
    input.focus();
    if (seed) input.setSelectionRange(input.value.length, input.value.length);
    else input.select();
  });

  input.addEventListener('input', () => {
    input.value = normalizeHexByteInput(input.value);
  });
  input.addEventListener('blur', () => closeEditor(true), { once: true });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      closeEditor(true);
      moveSelection(1, false);
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeEditor(false);
      refs.viewport.focus();
    }
  });
}

function closeEditor(commit) {
  if (!state?.editor) return;
  const { input, byteIndex, originalValue } = state.editor;
  if (commit) {
    const normalized = normalizeHexByteInput(input.value);
    if (normalized.length === 2) {
      applyBytePatch(state.patches, byteIndex, originalValue, parseInt(normalized, 16));
      renderPatches();
      updateSummary();
      refreshSelectionPanel();
    }
  }
  refs.editorLayer.innerHTML = '';
  state.editor = null;
  queueRender();
}

function handleViewportKeydown(event) {
  if (!state.file) return;
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') {
    event.preventDefault();
    openSearchOverlay(true);
    return;
  }
  if (event.key === 'Escape') {
    closeEditor(false);
    cancelSearch('Search cancelled.');
    return;
  }
  if (!Number.isInteger(state.selectionFocus)) return;
  if (/^[0-9a-f]$/i.test(event.key) && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    const cell = refs.content.querySelector(`[data-byte-index="${state.selectionFocus}"][data-cell-role="hex"]`);
    if (cell) openEditor(cell, event.key);
    return;
  }

  let delta = null;
  if (event.key === 'ArrowLeft') delta = -1;
  if (event.key === 'ArrowRight') delta = 1;
  if (event.key === 'ArrowUp') delta = -state.bytesPerRow;
  if (event.key === 'ArrowDown') delta = state.bytesPerRow;
  if (event.key === 'PageUp') delta = -state.bytesPerRow * Math.max(1, Math.floor(refs.viewport.clientHeight / ROW_HEIGHT));
  if (event.key === 'PageDown') delta = state.bytesPerRow * Math.max(1, Math.floor(refs.viewport.clientHeight / ROW_HEIGHT));

  if (delta !== null) {
    event.preventDefault();
    moveSelection(delta, event.shiftKey);
    return;
  }
  if (event.key === 'Home') {
    event.preventDefault();
    selectOffset(0, event.shiftKey);
    return;
  }
  if (event.key === 'End') {
    event.preventDefault();
    selectOffset(state.file.size - 1, event.shiftKey);
    return;
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    const cell = refs.content.querySelector(`[data-byte-index="${state.selectionFocus}"][data-cell-role="hex"]`);
    if (cell) openEditor(cell);
  }
}

function moveSelection(delta, extend) {
  const nextIndex = clamp((state.selectionFocus ?? 0) + delta, 0, Math.max(0, state.file.size - 1));
  selectOffset(nextIndex, extend);
}

function selectOffset(byteIndex, extend = false) {
  if (!extend || !Number.isInteger(state.selectionAnchor)) state.selectionAnchor = byteIndex;
  state.selectionFocus = byteIndex;
  revealOffset(byteIndex);
  refreshSelectionPanel();
  queueRender();
}

function revealOffset(byteIndex) {
  if (!state.file) return;
  const targetRow = Math.floor(byteIndex / state.bytesPerRow);
  if (targetRow < state.windowStartRow || targetRow >= state.windowStartRow + state.windowRowCount) {
    state.windowStartRow = clamp(targetRow - Math.floor(state.windowRowCount / 2), 0, Math.max(0, state.totalRows - state.windowRowCount));
    refs.viewport.scrollTop = (targetRow - state.windowStartRow) * ROW_HEIGHT;
    refs.spacer.style.height = `${Math.max(1, state.windowRowCount) * ROW_HEIGHT}px`;
    updateSummary();
    return;
  }

  const localTop = (targetRow - state.windowStartRow) * ROW_HEIGHT;
  const localBottom = localTop + ROW_HEIGHT;
  if (localTop < refs.viewport.scrollTop) refs.viewport.scrollTop = localTop;
  else if (localBottom > refs.viewport.scrollTop + refs.viewport.clientHeight) refs.viewport.scrollTop = localBottom - refs.viewport.clientHeight;
}

function handleBytesPerRowChange(event) {
  const nextValue = Number(event.target.value);
  if (!Number.isFinite(nextValue) || nextValue <= 0 || !state.file) return;
  const anchor = state.selectionFocus ?? 0;
  state.bytesPerRow = nextValue;
  state.totalRows = Math.max(1, Math.ceil(state.file.size / state.bytesPerRow));
  state.windowRowCount = Math.min(state.totalRows, MAX_WINDOW_ROWS);
  state.windowStartRow = clamp(Math.floor(anchor / state.bytesPerRow) - Math.floor(state.windowRowCount / 2), 0, Math.max(0, state.totalRows - state.windowRowCount));
  state.offsetWidth = getOffsetWidth(state.file.size);
  refs.totalRows.textContent = state.totalRows.toLocaleString();
  refs.spacer.style.height = `${Math.max(1, state.windowRowCount) * ROW_HEIGHT}px`;
  revealOffset(anchor);
  refreshSelectionPanel();
  queueRender();
}

function handleGotoKeydown(event) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  const offset = parseOffset(event.target.value);
  if (!Number.isFinite(offset) || offset < 0 || offset >= state.file.size) {
    setStatus('Jump target is outside the loaded file.', 'danger');
    return;
  }
  selectOffset(offset, false);
  setStatus(`Jumped to 0x${formatOffset(offset, state.offsetWidth)}.`);
}

async function refreshSelectionPanel() {
  const selection = getSelectionRange(state.selectionAnchor, state.selectionFocus);
  if (!selection || !state.file) {
    refs.selectionOffset.textContent = '-';
    refs.selectionLength.textContent = '0';
    refs.selectionHex.textContent = '-';
    refs.selectionAscii.textContent = '-';
    refs.selectionDec.textContent = '-';
    refs.selectionBin.textContent = '-';
    refs.selectionU16le.textContent = '-';
    refs.selectionU16be.textContent = '-';
    return;
  }

  const token = ++selectionToken;
  const previewSize = Math.min(Math.max(selection.length, 2), 64);
  const bytes = await readEffectiveRange(selection.start, Math.min(state.file.size, selection.start + previewSize));
  if (token !== selectionToken) return;

  const first = bytes[0];
  const uint16le = bytes.length >= 2 ? (bytes[0] | (bytes[1] << 8)) : null;
  const uint16be = bytes.length >= 2 ? ((bytes[0] << 8) | bytes[1]) : null;
  refs.selectionOffset.textContent = `0x${formatOffset(selection.start, state.offsetWidth)}`;
  refs.selectionLength.textContent = selection.length.toLocaleString();
  refs.selectionHex.textContent = Array.from(bytes.slice(0, Math.min(bytes.length, 16))).map(formatHexByte).join(' ') || '-';
  refs.selectionAscii.textContent = Array.from(bytes.slice(0, Math.min(bytes.length, 24))).map(byteToChar).join('') || '-';
  refs.selectionDec.textContent = Number.isInteger(first) ? String(first) : '-';
  refs.selectionBin.textContent = Number.isInteger(first) ? first.toString(2).padStart(8, '0') : '-';
  refs.selectionU16le.textContent = Number.isInteger(uint16le) ? String(uint16le) : '-';
  refs.selectionU16be.textContent = Number.isInteger(uint16be) ? String(uint16be) : '-';
}

function addBookmarkFromSelection() {
  if (!Number.isInteger(state.selectionFocus)) {
    setStatus('Select a byte before adding a bookmark.', 'danger');
    return;
  }
  if (!state.bookmarks.includes(state.selectionFocus)) {
    state.bookmarks = [...state.bookmarks, state.selectionFocus].sort((left, right) => left - right);
    renderBookmarks();
  }
  setStatus(`Bookmarked 0x${formatOffset(state.selectionFocus, state.offsetWidth)}.`);
}

function clearBookmarks() {
  state.bookmarks = [];
  renderBookmarks();
  setStatus('Bookmarks cleared.');
}

function handleBookmarkListClick(event) {
  const button = event.target.closest('[data-bookmark-offset]');
  if (button) selectOffset(Number(button.dataset.bookmarkOffset), false);
}

function handlePatchListClick(event) {
  const button = event.target.closest('[data-patch-offset]');
  if (button) selectOffset(Number(button.dataset.patchOffset), false);
}

function renderBookmarks() {
  if (!refs.bookmarks) return;
  if (!state.bookmarks.length) {
    refs.bookmarks.innerHTML = '<div class="hex-empty-list">No bookmarks yet.</div>';
    return;
  }
  refs.bookmarks.innerHTML = state.bookmarks
    .map((offset) => `
      <button type="button" class="hex-list-row" data-bookmark-offset="${offset}">
        <span>0x${formatOffset(offset, state.offsetWidth)}</span>
        <strong>${offset.toLocaleString()}</strong>
      </button>
    `)
    .join('');
}

function renderPatches() {
  if (!refs.patches) return;
  const records = buildPatchRecords(state.patches);
  if (!records.length) {
    refs.patches.innerHTML = '<div class="hex-empty-list">No changes yet.</div>';
    return;
  }
  refs.patches.innerHTML = records.slice(0, 64)
    .map((record) => `
      <button type="button" class="hex-list-row" data-patch-offset="${record.offset}">
        <span>0x${formatOffset(record.offset, state.offsetWidth)}</span>
        <strong>${formatHexByte(record.original)} → ${formatHexByte(record.value)}</strong>
      </button>
    `)
    .join('');
}

async function copySelection(mode) {
  const selection = getSelectionRange(state.selectionAnchor, state.selectionFocus);
  if (!selection) {
    setStatus('Select a byte range first.', 'danger');
    return;
  }
  const bytes = await readEffectiveRange(selection.start, selection.end + 1);
  const payload = mode === 'hex'
    ? Array.from(bytes).map(formatHexByte).join(' ')
    : utf8Decoder.decode(bytes);
  await copyToClipboard(payload, mode === 'hex' ? 'Selection copied as hex.' : 'Selection copied as text.');
}

function revertSelection() {
  const selection = getSelectionRange(state.selectionAnchor, state.selectionFocus);
  if (!selection) {
    setStatus('Select a range to revert.', 'danger');
    return;
  }
  let removed = 0;
  for (let offset = selection.start; offset <= selection.end; offset += 1) {
    if (state.patches.delete(offset)) removed += 1;
  }
  renderPatches();
  updateSummary();
  refreshSelectionPanel();
  queueRender();
  setStatus(removed ? `Reverted ${removed} byte${removed === 1 ? '' : 's'} in the selection.` : 'The selection had no pending changes.');
}

function revertAll() {
  const count = state.patches.size;
  state.patches.clear();
  renderPatches();
  updateSummary();
  refreshSelectionPanel();
  queueRender();
  setStatus(count ? `Reverted ${count} byte${count === 1 ? '' : 's'}.` : 'No changes to revert.');
}

async function exportPatchSet() {
  if (!state.patches.size || !state.file) {
    setStatus('There are no changes to export.', 'danger');
    return;
  }
  const records = buildPatchRecords(state.patches).map((record) => ({
    offset: record.offset,
    offsetHex: `0x${formatOffset(record.offset, state.offsetWidth)}`,
    original: formatHexByte(record.original),
    value: formatHexByte(record.value)
  }));
  downloadFile(JSON.stringify({
    fileName: state.file.name,
    fileSize: state.file.size,
    bytesPerRow: state.bytesPerRow,
    changes: records
  }, null, 2), `${state.file.name}.patches.json`, 'application/json');
  setStatus('Patch set exported.');
}

async function exportPatchedFile() {
  if (!state.file) return;
  if (!state.patches.size) {
    setStatus('Nothing changed. Export skipped.', 'danger');
    return;
  }
  const parts = [];
  const records = buildPatchRecords(state.patches);
  let cursor = 0;

  for (const record of records) {
    if (record.offset > cursor) parts.push(state.file.slice(cursor, record.offset));
    parts.push(new Uint8Array([record.value]));
    cursor = record.offset + 1;
  }
  if (cursor < state.file.size) parts.push(state.file.slice(cursor));

  downloadFile(new Blob(parts, { type: state.file.type || 'application/octet-stream' }), `patched_${state.file.name}`, state.file.type || 'application/octet-stream');
  setStatus('Patched file exported.');
}

async function startProgressiveSearch() {
  if (!state.file || !state.reader) return;
  syncSearchInputsToState();
  const needle = buildSearchNeedle({
    mode: state.search.mode,
    query: state.search.query,
    caseSensitive: state.search.caseSensitive
  });
  if (!needle?.length) {
    refs.searchStatus.textContent = state.search.mode === 'hex'
      ? 'Hex search needs complete byte pairs.'
      : 'Enter a search term first.';
    return;
  }

  const token = ++searchToken;
  state.search.active = true;
  const startOffset = clamp(
    Number.isInteger(state.search.cursor)
      ? state.search.cursor
      : Number.isInteger(state.selectionFocus)
        ? state.selectionFocus
        : 0,
    0,
    Math.max(0, state.file.size - 1)
  );
  const segments = getSearchSegments({
    fileSize: state.file.size,
    startOffset,
    chunkSize: SEARCH_CHUNK_SIZE,
    needleLength: needle.length
  });
  let scanned = 0;

  refs.searchStatus.textContent = 'Searching...';
  setStatus('Search is scanning the file in streaming chunks.');

  for (let index = 0; index < segments.length; index += 1) {
    if (token !== searchToken || !state.search.active) return;
    const segment = segments[index];
    const bytes = await state.reader.readRange(segment.start, segment.end);
    if (token !== searchToken || !state.search.active) return;
    const haystack = normalizeSearchHaystack(bytes, state.search.mode, state.search.caseSensitive);
    const matchIndex = findNeedleIndex(haystack, needle);
    scanned += segment.end - segment.start;
    refs.searchStatus.textContent = `Page ${index + 1} / ${segments.length} · ${formatSize(scanned)} scanned`;

    if (matchIndex !== -1) {
      const matchOffset = segment.start + matchIndex;
      state.search.active = false;
      state.search.lastMatch = { start: matchOffset, length: needle.length };
      state.search.cursor = (matchOffset + 1) % Math.max(1, state.file.size);
      state.selectionAnchor = matchOffset;
      state.selectionFocus = Math.min(state.file.size - 1, matchOffset + needle.length - 1);
      revealOffset(matchOffset);
      refs.searchStatus.textContent = `Found at 0x${formatOffset(matchOffset, state.offsetWidth)} after ${index + 1} page${index === 0 ? '' : 's'}.`;
      setStatus(`Match found at 0x${formatOffset(matchOffset, state.offsetWidth)}.`);
      refreshSelectionPanel();
      queueRender();
      return;
    }

    if ((index + 1) % 4 === 0) await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  state.search.active = false;
  refs.searchStatus.textContent = 'No further matches.';
  setStatus('Search reached the end of the wrapped scan with no match.', 'danger');
}

export function unmount() {
  closeEditor(false);
  cancelSearch('Search cancelled.');
  if (state?.reader) state.reader.dispose();
  for (const dispose of cleanup) dispose();
  cleanup = [];
  refs = {};
  if (container) container.remove();
  container = null;
}

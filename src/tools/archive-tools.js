import { setupDragAndDrop } from '../ui/drag-drop.js';
import { downloadFile, showToast } from '../ui/ui-utils.js';
import {
  buildArchiveBlob,
  classifyArchiveError,
  extractArchiveEntry,
  getArchiveExplorerView,
  getSupportedArchiveFormats,
  isSupportedArchiveFile,
  listArchiveEntries,
  repackageArchiveAsZip
} from '../utils/archive.js';

let container = null;
let currentFiles = [];
let inspectedArchive = null;
let archiveMode = 'build';
let archivePath = '';
let disposeDragAndDrop = null;

export async function mount(parent) {
  const supportedFormats = getSupportedArchiveFormats();
  container = document.createElement('div');
  container.className = 'tool-archive';
  container.innerHTML = `
    <div class="card">
      <div id="zip-drop-zone" class="archive-drop-zone">
        <div class="archive-drop-icon">ARC</div>
        <div class="archive-drop-copy">Drop files to bundle or an archive to inspect</div>
        <input type="file" id="zip-input" class="hidden" multiple accept="${supportedFormats.open.map((format) => `.${format}`).join(',')}">
      </div>
      <div class="archive-ingest-row">
        <button id="btn-add-archive-files" type="button" class="btn-secondary">Add Files</button>
        <label class="archive-password-control">
          <span>Password</span>
          <input id="archive-password" type="password" autocomplete="off" placeholder="If encrypted">
        </label>
        <div id="archive-support-note" class="archive-support-note">
          Opens ${supportedFormats.open.join(', ')}. Exports ${supportedFormats.export.join(', ')}.
        </div>
      </div>
      <div id="archive-status" class="archive-status">Ready.</div>

      <div id="archive-ui" class="hidden archive-ui" data-mode="build">
        <div class="form-group">
          <div class="archive-list-header">
            <label id="archive-list-label">File Queue</label>
            <div id="archive-mode-note" class="archive-mode-note"></div>
          </div>
          <div id="archive-breadcrumbs" class="archive-breadcrumbs"></div>
          <div class="archive-table-shell">
            <table class="archive-table">
              <thead>
                <tr>
                  <th class="archive-name-heading">FILENAME</th>
                  <th class="archive-size-heading">SIZE</th>
                  <th id="archive-action-header" class="archive-action-heading">ACTION</th>
                </tr>
              </thead>
              <tbody id="archive-list-body"></tbody>
            </table>
          </div>
        </div>

        <div class="archive-actions">
          <label class="archive-format-control">
            <span>Output</span>
            <select id="archive-output-format">
              ${supportedFormats.export.map((format) => `<option value="${format}">${format.toUpperCase()}</option>`).join('')}
            </select>
          </label>
          <button id="btn-build-zip" class="archive-build-button" type="button">Build & Download</button>
          <button id="btn-archive-export-all" class="archive-build-button hidden" type="button">Export All</button>
          <button id="btn-clear-archive" class="btn-secondary archive-clear-button">Clear All</button>
        </div>
      </div>
    </div>
  `;

  parent.appendChild(container);

  const dropZone = container.querySelector('#zip-drop-zone');
  const fileInput = container.querySelector('#zip-input');
  const ui = container.querySelector('#archive-ui');
  const addFilesButton = container.querySelector('#btn-add-archive-files');
  const supportNote = container.querySelector('#archive-support-note');
  const listLabel = container.querySelector('#archive-list-label');
  const modeNote = container.querySelector('#archive-mode-note');
  const breadcrumbs = container.querySelector('#archive-breadcrumbs');
  const listBody = container.querySelector('#archive-list-body');
  const actionHeader = container.querySelector('#archive-action-header');
  const buildButton = container.querySelector('#btn-build-zip');
  const exportAllButton = container.querySelector('#btn-archive-export-all');
  const clearButton = container.querySelector('#btn-clear-archive');
  const outputFormat = container.querySelector('#archive-output-format');
  const passwordInput = container.querySelector('#archive-password');
  const status = container.querySelector('#archive-status');
  supportNote.textContent = `Opens ${supportedFormats.open.join(', ')}. Exports ${supportedFormats.export.join(', ')}.`;
  outputFormat.innerHTML = supportedFormats.export.map((format) => `<option value="${format}">${format.toUpperCase()}</option>`).join('');

  const setStatus = (message, tone = '', code = '') => {
    status.textContent = message;
    status.dataset.tone = tone;
    if (code) status.dataset.code = code;
    else delete status.dataset.code;
  };

  const handleArchiveError = (error) => {
    const classified = classifyArchiveError(error, { password: passwordInput.value });
    setStatus(classified.message, 'danger', classified.code);
    showToast(classified.message, 'danger');
  };

  const render = () => {
    const showingInspect = archiveMode === 'inspect' && inspectedArchive;
    const hasBuildQueue = currentFiles.length > 0;

    if (!showingInspect && !hasBuildQueue) {
      ui.classList.add('hidden');
      ui.dataset.mode = 'build';
      listLabel.textContent = 'File Queue';
      modeNote.textContent = '';
      breadcrumbs.innerHTML = '';
      listBody.innerHTML = '';
      actionHeader.textContent = 'ACTION';
      buildButton.classList.remove('hidden');
      exportAllButton.classList.add('hidden');
      clearButton.textContent = 'Clear All';
      return;
    }

    ui.classList.remove('hidden');

    if (showingInspect) {
      ui.dataset.mode = 'inspect';
      listLabel.textContent = 'Archive Contents';
      const fileCount = inspectedArchive.entries.filter((entry) => !entry.isDirectory).length;
      const folderCount = inspectedArchive.entries.filter((entry) => entry.isDirectory).length;
      const explorerView = getArchiveExplorerView(inspectedArchive.entries, archivePath);
      modeNote.textContent = `${inspectedArchive.name} - ${fileCount} files, ${folderCount} folders`;
      actionHeader.textContent = 'ACTION';
      buildButton.classList.add('hidden');
      exportAllButton.classList.remove('hidden');
      clearButton.textContent = hasBuildQueue ? 'Back to Queue' : 'Close View';
      breadcrumbs.innerHTML = explorerView.breadcrumbs.map((crumb, index) => `
        <button type="button" class="archive-breadcrumb" data-archive-path="${escapeHtml(crumb.path)}">${escapeHtml(crumb.label)}</button>
        ${index < explorerView.breadcrumbs.length - 1 ? '<span>/</span>' : ''}
      `).join('');
      listBody.innerHTML = [...explorerView.folders, ...explorerView.files].map((entry) => `
        <tr data-archive-entry="true" class="archive-row">
          <td class="archive-name-cell">
            <span class="archive-kind-badge ${entry.isDirectory ? 'is-folder' : 'is-file'}">${entry.isDirectory ? 'Folder' : 'File'}</span>
            ${entry.isDirectory
              ? `<button type="button" class="archive-entry-open" data-open-folder="${escapeHtml(entry.name)}">${escapeHtml(entry.name)}</button>`
              : `<span class="archive-entry-path">${escapeHtml(entry.name)}</span>`}
          </td>
          <td class="archive-size-cell">${formatArchiveSize(entry.size)}</td>
          <td class="archive-action-cell">
            ${entry.isDirectory
              ? `<button type="button" class="archive-export-button" data-extract-prefix="${escapeHtml(entry.name)}">Export Folder</button>`
              : `<button type="button" class="archive-export-button" data-extract-entry="${escapeHtml(entry.name)}">Extract</button>`}
          </td>
        </tr>
      `).join('');
      return;
    }

    ui.dataset.mode = 'build';
    listLabel.textContent = 'File Queue';
    modeNote.textContent = `${currentFiles.length} files ready to bundle.`;
    breadcrumbs.innerHTML = '';
    actionHeader.textContent = 'ACTION';
    buildButton.classList.remove('hidden');
    exportAllButton.classList.add('hidden');
    clearButton.textContent = 'Clear All';
    listBody.innerHTML = currentFiles.map((file, index) => `
      <tr data-archive-queue-row="true" class="archive-row">
        <td class="archive-name-cell">
          <span class="archive-kind-badge is-file">File</span>
          <span class="archive-entry-path">${escapeHtml(file.webkitRelativePath || file.name)}</span>
        </td>
        <td class="archive-size-cell">${formatArchiveSize(file.size)}</td>
        <td class="archive-action-cell">
          <button data-idx="${index}" class="archive-remove-button">Remove</button>
        </td>
      </tr>
    `).join('');
  };

  const inspectArchive = async (file) => {
    try {
      setStatus(`Opening ${file.name}...`, 'working');
      const entries = await listArchiveEntries(file, { password: passwordInput.value });
      inspectedArchive = {
        name: file.name,
        file,
        entries
      };
      archiveMode = 'inspect';
      archivePath = '';
      render();
      setStatus(`Opened ${file.name}.`, 'success');
      showToast('Archive inspected.', 'success');
    } catch (error) {
      handleArchiveError(error);
    }
  };

  const handleFiles = async (files) => {
    const fileList = Array.from(files || []).filter(Boolean);
    if (!fileList.length) return;
    if (fileList.length === 1 && isSupportedArchiveFile(fileList[0])) {
      await inspectArchive(fileList[0]);
      return;
    }
    currentFiles.push(...fileList);
    archiveMode = 'build';
    inspectedArchive = null;
    archivePath = '';
    render();
  };

  const withButtonState = async (button, label, task) => {
    const previousText = button?.textContent || '';
    if (button) {
      button.disabled = true;
      button.textContent = label;
    }
    try {
      await task();
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = previousText;
      }
    }
  };

  const archiveDownloadName = (format = 'zip', suffix = '') => {
    const base = String(inspectedArchive?.name || 'archive')
      .replace(/\.(tar\.gz|tar\.bz2|tar\.xz|[^.]+)$/i, '')
      .replace(/[^\w.-]+/g, '_') || 'archive';
    return `${base}${suffix}.${format}`;
  };

  const extractEntry = async (entryName, button) => {
    if (!inspectedArchive?.file) return;
    await withButtonState(button, 'Extracting...', async () => {
      const extracted = await extractArchiveEntry(inspectedArchive.file, entryName, { password: passwordInput.value });
      downloadFile(extracted.blob, extracted.fileName, extracted.mimeType);
      setStatus(`Extracted ${extracted.fileName}.`, 'success');
      showToast('File extracted.', 'success');
    });
  };

  const exportZipSelection = async (prefix, button) => {
    if (!inspectedArchive?.file) return;
    await withButtonState(button, 'Exporting...', async () => {
      const format = outputFormat.value || 'zip';
      const blob = await repackageArchiveAsZip(inspectedArchive.file, { prefix, format }, { password: passwordInput.value });
      const suffix = prefix ? `_${prefix.replace(/[^\w.-]+/g, '_').replace(/_$/, '')}` : '';
      downloadFile(blob, archiveDownloadName(format, suffix), getArchiveMime(format));
      setStatus(`Exported ${format.toUpperCase()}.`, 'success');
      showToast('Archive export ready.', 'success');
    });
  };

  dropZone.addEventListener('click', () => fileInput.click());
  addFilesButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async (event) => {
    await handleFiles(event.target.files);
    event.target.value = '';
  });
  disposeDragAndDrop = setupDragAndDrop(dropZone, handleFiles);

  container.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    if (!target) return;
    if (target.dataset.openFolder !== undefined) {
      archivePath = target.dataset.openFolder;
      render();
      return;
    }
    if (target.dataset.archivePath !== undefined) {
      archivePath = target.dataset.archivePath;
      render();
      return;
    }
    if (target.dataset.extractEntry) {
      extractEntry(target.dataset.extractEntry, target).catch(handleArchiveError);
      return;
    }
    if (target.dataset.extractPrefix) {
      exportZipSelection(target.dataset.extractPrefix, target).catch(handleArchiveError);
      return;
    }
    if (target.dataset.idx === undefined) return;
    currentFiles.splice(parseInt(target.dataset.idx, 10), 1);
    render();
  });

  clearButton.addEventListener('click', () => {
    if (archiveMode === 'inspect') {
      inspectedArchive = null;
      archiveMode = 'build';
      archivePath = '';
      render();
      return;
    }
    currentFiles = [];
    render();
  });

  buildButton.addEventListener('click', async () => {
    buildButton.disabled = true;
    buildButton.textContent = 'Compressing...';
    try {
      const format = outputFormat.value || 'zip';
      const blob = await buildArchiveBlob(currentFiles, { format });
      downloadFile(blob, `archive_${Date.now()}.${format}`, getArchiveMime(format));
      setStatus(`Built ${format.toUpperCase()}.`, 'success');
      showToast('Archive ready.', 'success');
    } catch (error) {
      handleArchiveError(error);
    } finally {
      buildButton.disabled = false;
      buildButton.textContent = 'Build & Download';
    }
  });

  exportAllButton.addEventListener('click', () => {
    exportZipSelection('', exportAllButton).catch(handleArchiveError);
  });

  render();
}

export function unmount() {
  disposeDragAndDrop?.();
  disposeDragAndDrop = null;
  currentFiles = [];
  inspectedArchive = null;
  archiveMode = 'build';
  archivePath = '';
  if (container) container.remove();
  container = null;
}

function formatArchiveSize(size = 0) {
  const value = Number(size) || 0;
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} B`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getArchiveMime(format = 'zip') {
  if (format === 'tar') return 'application/x-tar';
  if (format === 'tar.gz') return 'application/gzip';
  return 'application/zip';
}

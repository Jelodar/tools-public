import { globalWorkerPool } from '../workers/pool.js';
import { setupDragAndDrop } from '../ui/drag-drop.js';
import { createModalController } from '../ui/modal.js';
import { createEditor } from '../ui/ui-monaco.js';
import { downloadFile, showToast } from '../ui/ui-utils.js';
import {
  buildSQLiteBrowseQuery,
  buildSQLiteCreateTableStatement,
  buildSQLiteDeleteStatement,
  buildSQLiteDropTableStatement,
  buildSQLiteInsertStatement,
  buildSQLiteRestoreRowStatement,
  buildSQLiteUpdateStatement,
  formatSQLiteSchema,
  sqliteResultToCsv,
  sqliteResultToObjects
} from '../utils/sqlite-explorer.js';

let container = null;
let cleanup = [];
let currentDbBuffer = null;
let currentDbName = '';
let sqlEditor = null;
let errorModalController = null;
let cellModalController = null;
let metadata = { objects: [], tables: [], views: [], indexes: [], triggers: [] };
let selectedObject = null;
let selectedTable = null;
let selectedRow = null;
let cellDetailRow = null;
let cellDetailColumn = null;
let lastResults = null;
let queryHistory = [];
let sqliteUndoLog = [];
let createColumnDrafts = [
  { name: 'id', type: 'INTEGER', primaryKey: true, notNull: false, unique: false, defaultValue: '' },
  { name: 'name', type: 'TEXT', primaryKey: false, notNull: false, unique: false, defaultValue: '' }
];

function bind(node, event, handler) {
  node?.addEventListener(event, handler);
  cleanup.push(() => node?.removeEventListener(event, handler));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getRefs() {
  return {
    dropZone: container.querySelector('#db-drop-zone'),
    fileInput: container.querySelector('#db-input'),
    dbName: container.querySelector('#active-db-name'),
    ui: container.querySelector('#db-explorer-ui'),
    objectFilter: container.querySelector('#sqlite-object-filter'),
    objectList: container.querySelector('#sqlite-object-list'),
    schemaTitle: container.querySelector('#sqlite-schema-title'),
    schemaBody: container.querySelector('#sqlite-schema-body'),
    browseTable: container.querySelector('#sqlite-browse-table'),
    browseFilter: container.querySelector('#sqlite-browse-filter'),
    browseOrder: container.querySelector('#sqlite-browse-order'),
    browseDirection: container.querySelector('#sqlite-browse-direction'),
    browseLimit: container.querySelector('#sqlite-browse-limit'),
    browseOffset: container.querySelector('#sqlite-browse-offset'),
    browseFirst: container.querySelector('#sqlite-browse-first'),
    browsePrev: container.querySelector('#sqlite-browse-prev'),
    browseNext: container.querySelector('#sqlite-browse-next'),
    browseLast: container.querySelector('#sqlite-browse-last'),
    browsePageIndex: container.querySelector('#sqlite-browse-page-index'),
    browsePage: container.querySelector('#sqlite-browse-page'),
    createTable: container.querySelector('#sqlite-create-table'),
    createColumns: container.querySelector('#sqlite-create-columns'),
    rowEditor: container.querySelector('#sqlite-row-editor'),
    rowEditorTitle: container.querySelector('#sqlite-row-editor-title'),
    resultsHead: container.querySelector('#results-head'),
    resultsBody: container.querySelector('#results-body'),
    status: container.querySelector('#sqlite-status'),
    history: container.querySelector('#sqlite-query-history'),
    undoLog: container.querySelector('#sqlite-undo-log'),
    cellTitle: container.querySelector('#sqlite-cell-title'),
    cellMeta: container.querySelector('#sqlite-cell-meta'),
    cellValue: container.querySelector('#sqlite-cell-value'),
    cellEditValue: container.querySelector('#sqlite-cell-edit-value'),
    cellApply: container.querySelector('#btn-sqlite-apply-cell'),
    latestUndo: container.querySelector('#btn-sqlite-undo-latest')
  };
}

function setStatus(message, tone = 'muted') {
  const status = getRefs().status;
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function setSQLiteStatus(message, tone = 'muted') {
  setStatus(message, tone);
}

function clampInteger(value, fallback, min, max) {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function centerElement(node) {
  node?.scrollIntoView?.({ block: 'center', inline: 'nearest' });
}

function centerSQLiteSection(node) {
  if (node?.scrollIntoView) node.scrollIntoView({ block: 'center', inline: 'nearest' });
}

function switchSQLiteWorkspacePanel(panelId) {
  const target = panelId || 'browse';
  container?.querySelectorAll('[data-sqlite-workspace-tab]').forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.sqliteWorkspaceTab === target);
  });
  container?.querySelectorAll('[data-sqlite-workspace-panel]').forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.sqliteWorkspacePanel === target);
  });
  centerSQLiteSection(container?.querySelector(`[data-sqlite-workspace-panel="${target}"]`));
}

function setDatabaseReady(name) {
  const refs = getRefs();
  currentDbName = name || 'Untitled database';
  refs.dbName.textContent = `Current: ${currentDbName}`;
  refs.ui.classList.remove('hidden');
  container.querySelector('#btn-sqlite-download-db').disabled = false;
}

function resetDatabaseState() {
  currentDbBuffer = null;
  currentDbName = '';
  metadata = { objects: [], tables: [], views: [], indexes: [], triggers: [] };
  selectedObject = null;
  selectedTable = null;
  selectedRow = null;
  cellDetailRow = null;
  cellDetailColumn = null;
  lastResults = null;
  sqliteUndoLog = [];
}

function clearDatabaseWorkspace(statusMessage = 'Open or create a database.') {
  resetDatabaseState();
  const refs = getRefs();
  refs.dbName.textContent = 'No database loaded';
  refs.ui.classList.add('hidden');
  container.querySelector('#btn-sqlite-download-db').disabled = true;
  refs.objectFilter.value = '';
  refs.objectList.innerHTML = '';
  refs.browseTable.innerHTML = '';
  refs.browseOrder.innerHTML = '';
  refs.browseFilter.value = '';
  refs.browseDirection.value = 'ASC';
  refs.browseLimit.value = '100';
  refs.browseOffset.value = '0';
  updateBrowsePagination(0);
  refs.schemaTitle.textContent = 'Schema';
  refs.schemaBody.innerHTML = '<div class="sqlite-empty-note">Select a database object.</div>';
  refs.rowEditorTitle.textContent = 'Row Editor';
  refs.rowEditor.innerHTML = '<div class="sqlite-empty-note">Select a table to edit rows.</div>';
  refs.resultsHead.innerHTML = '';
  refs.resultsBody.innerHTML = '';
  renderSQLiteUndoLog();
  setSQLiteStatus(statusMessage);
}

function showImportErrorDialog(fileName, error) {
  const safeName = fileName || 'Selected file';
  const detail = container.querySelector('#sqlite-error-detail');
  if (detail) {
    detail.textContent = `${safeName} could not be opened. SQLite reported: ${error.message}. The workspace was cleared so stale tables are not shown.`;
  }
  errorModalController?.open('sqlite-import-error');
}

function openSQLiteCellDetail(column, value) {
  const refs = getRefs();
  cellDetailColumn = column;
  const rowid = cellDetailRow?.__rowid__;
  const normalizedValue = value === null || value === undefined ? 'NULL' : String(value);
  refs.cellTitle.textContent = column ? `Cell: ${column}` : 'Cell Detail';
  refs.cellMeta.textContent = [
    selectedTable ? `Table ${selectedTable}` : '',
    rowid !== undefined ? `rowid ${rowid}` : '',
    `${normalizedValue.length} characters`
  ].filter(Boolean).join(' / ');
  refs.cellValue.textContent = normalizedValue;
  refs.cellEditValue.value = value === null || value === undefined ? '' : String(value);
  refs.cellApply.disabled = !selectedTable || !column || column === '__rowid__' || rowid === undefined;
  syncSQLiteUndoActions();
  cellModalController?.open('cell-detail');
  switchSQLiteWorkspacePanel('results');
  centerSQLiteSection(refs.cellValue);
}

async function initMonaco() {
  if (sqlEditor) return;
  const { editor, monaco } = await createEditor(container.querySelector('#monaco-sql-editor'), {
    value: 'SELECT name, type, sql FROM sqlite_master ORDER BY type, name;',
    language: 'sql',
    renderLineHighlight: 'all',
    minimap: { enabled: false }
  });
  sqlEditor = editor;
  sqlEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, runQuery);
}

async function executeSQLite(sql, params = [], options = {}) {
  const response = await globalWorkerPool.run('sqlite-query', {
    dbBuffer: currentDbBuffer,
    sql,
    params,
    includeMetadata: options.includeMetadata !== false
  });
  if (!response.success) throw new Error(response.error || 'SQLite task failed.');
  const payload = response.result || {};
  if (payload.dbBuffer) currentDbBuffer = payload.dbBuffer;
  if (payload.metadata) metadata = payload.metadata;
  return payload;
}

function getTable(name = selectedTable) {
  return metadata.tables.find((table) => table.name === name) || null;
}

function renderObjectList() {
  const refs = getRefs();
  const filter = String(refs.objectFilter.value || '').trim().toLowerCase();
  const groups = [
    ['Tables', metadata.tables],
    ['Views', metadata.views],
    ['Indexes', metadata.indexes],
    ['Triggers', metadata.triggers]
  ];
  refs.objectList.innerHTML = groups.map(([label, entries]) => {
    const filtered = entries.filter((entry) => `${entry.name} ${entry.tableName || ''}`.toLowerCase().includes(filter));
    if (!filtered.length) return '';
    return `
      <div class="sqlite-object-group">
        <div class="sqlite-object-group-title">${label}</div>
        ${filtered.map((entry) => `
          <button class="sqlite-object-item${selectedObject?.name === entry.name && selectedObject?.type === entry.type ? ' selected' : ''}" type="button" data-object-type="${escapeHtml(entry.type)}" data-object-name="${escapeHtml(entry.name)}">
            <span>${escapeHtml(entry.name)}</span>
            <small>${entry.type === 'table' ? `${Number(entry.rowCount) || 0} rows` : escapeHtml(entry.tableName || entry.type)}</small>
          </button>
        `).join('')}
      </div>
    `;
  }).join('') || '<div class="sqlite-empty-note">No matching objects.</div>';

  refs.objectList.querySelectorAll('.sqlite-object-item').forEach((button) => {
    button.addEventListener('click', () => {
      selectObject(button.dataset.objectType, button.dataset.objectName);
    });
  });
}

function renderTableControls() {
  const refs = getRefs();
  refs.browseTable.innerHTML = metadata.tables.map((table) => `<option value="${escapeHtml(table.name)}">${escapeHtml(table.name)}</option>`).join('');
  refs.browseTable.value = selectedTable || metadata.tables[0]?.name || '';
  renderOrderOptions();
  updateBrowsePagination(lastResults?.values?.length || 0);
}

function renderOrderOptions() {
  const refs = getRefs();
  const table = getTable(refs.browseTable.value);
  const currentValue = refs.browseOrder.value;
  refs.browseOrder.innerHTML = '<option value="">Natural order</option><option value="rowid">rowid</option>' + (table?.columns || [])
    .map((column) => `<option value="${escapeHtml(column.name)}">${escapeHtml(column.name)}</option>`)
    .join('');
  const availableValues = ['', 'rowid', ...(table?.columns || []).map((column) => column.name)];
  refs.browseOrder.value = availableValues.includes(currentValue) ? currentValue : '';
}

function resetBrowseControlsForTable() {
  const refs = getRefs();
  refs.browseFilter.value = '';
  refs.browseDirection.value = 'ASC';
  refs.browseLimit.value = '100';
  refs.browseOffset.value = '0';
  renderOrderOptions();
  refs.browseOrder.value = '';
  updateBrowsePagination(0);
}

function getBrowsePaginationState(loadedRows = 0) {
  const refs = getRefs();
  const limit = 100;
  const offset = clampInteger(refs.browseOffset.value, 0, 0, 1000000000);
  const loaded = Math.max(0, Math.floor(Number(loadedRows)) || 0);
  const table = getTable();
  const totalRows = Number(table?.rowCount);
  const hasTotal = Number.isFinite(totalRows) && totalRows >= 0 && !String(refs.browseFilter.value || '').trim();
  const canPrevious = offset > 0;
  const canNext = hasTotal ? offset + loaded < totalRows : loaded >= limit;
  const pageIndex = Math.floor(offset / Math.max(1, limit)) + 1;
  const pageCount = hasTotal ? Math.max(1, Math.ceil(totalRows / Math.max(1, limit))) : null;
  const label = loaded
    ? `Rows ${offset + 1}-${offset + loaded}${hasTotal ? ` of ${totalRows}` : ''}${pageCount ? ` / page ${pageIndex} of ${pageCount}` : ` / page ${pageIndex}`}`
    : offset > 0 ? `No rows at offset ${offset}` : 'No rows loaded';
  return { limit, offset, loaded, totalRows, hasTotal, canPrevious, canNext, pageIndex, pageCount, label };
}

function updateBrowsePagination(loadedRows = 0) {
  const refs = getRefs();
  if (!refs.browsePage || !refs.browsePrev || !refs.browseNext) return;
  const state = getBrowsePaginationState(loadedRows);
  refs.browseLimit.value = String(state.limit);
  refs.browseOffset.value = String(state.offset);
  refs.browsePage.textContent = state.label;
  refs.browsePageIndex.value = String(state.pageIndex);
  refs.browseFirst.disabled = !state.canPrevious;
  refs.browsePrev.disabled = !state.canPrevious;
  refs.browseNext.disabled = !state.canNext;
  refs.browseLast.disabled = !state.hasTotal || !state.canNext;
}

function renderCreateTablePanel() {
  const refs = getRefs();
  refs.createColumns.innerHTML = createColumnDrafts.map((column, index) => `
    <div class="sqlite-create-column-row" data-create-index="${index}">
      <input data-create-column-name value="${escapeHtml(column.name)}" placeholder="Column name">
      <select data-create-column-type>
        ${['INTEGER', 'TEXT', 'REAL', 'BLOB', 'NUMERIC'].map((type) => `<option value="${type}" ${column.type === type ? 'selected' : ''}>${type}</option>`).join('')}
      </select>
      <label><input type="checkbox" data-create-column-primary ${column.primaryKey ? 'checked' : ''}> PK</label>
      <label><input type="checkbox" data-create-column-required ${column.notNull ? 'checked' : ''}> Required</label>
      <label><input type="checkbox" data-create-column-unique ${column.unique ? 'checked' : ''}> Unique</label>
      <input data-create-column-default value="${escapeHtml(column.defaultValue || '')}" placeholder="Default">
      <button class="btn-secondary sqlite-create-remove" type="button" data-create-remove="${index}">Remove</button>
    </div>
  `).join('');

  refs.createColumns.querySelectorAll('[data-create-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      syncCreateColumnDrafts();
      createColumnDrafts.splice(Number(button.dataset.createRemove), 1);
      if (!createColumnDrafts.length) createColumnDrafts.push({ name: '', type: 'TEXT', primaryKey: false, notNull: false, unique: false, defaultValue: '' });
      renderCreateTablePanel();
    });
  });
}

function syncCreateColumnDrafts() {
  const refs = getRefs();
  createColumnDrafts = Array.from(refs.createColumns.querySelectorAll('.sqlite-create-column-row')).map((row) => ({
    name: row.querySelector('[data-create-column-name]')?.value || '',
    type: row.querySelector('[data-create-column-type]')?.value || 'TEXT',
    primaryKey: Boolean(row.querySelector('[data-create-column-primary]')?.checked),
    notNull: Boolean(row.querySelector('[data-create-column-required]')?.checked),
    unique: Boolean(row.querySelector('[data-create-column-unique]')?.checked),
    defaultValue: row.querySelector('[data-create-column-default]')?.value || ''
  }));
}

function renderSchemaPanel() {
  const refs = getRefs();
  if (!selectedObject) {
    refs.schemaTitle.textContent = 'Schema';
    refs.schemaBody.innerHTML = '<div class="sqlite-empty-note">Select a database object.</div>';
    return;
  }

  refs.schemaTitle.textContent = `${selectedObject.type}: ${selectedObject.name}`;
  const table = selectedObject.type === 'table' ? getTable(selectedObject.name) : null;
  const columns = table?.columns?.length
    ? `
      <table class="sqlite-schema-table">
        <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Default</th><th>PK</th></tr></thead>
        <tbody>
          ${table.columns.map((column) => `
            <tr>
              <td>${escapeHtml(column.name)}</td>
              <td>${escapeHtml(column.type || '')}</td>
              <td>${column.notnull ? 'Yes' : 'No'}</td>
              <td>${escapeHtml(column.dflt_value ?? '')}</td>
              <td>${column.pk ? 'Yes' : 'No'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
    : '';

  refs.schemaBody.innerHTML = `
    ${columns}
    <pre class="sqlite-schema-sql">${escapeHtml(formatSQLiteSchema(selectedObject.sql || ''))}</pre>
    ${table ? `
      <div class="sqlite-schema-actions">
        <input id="sqlite-drop-confirm" placeholder="Type ${escapeHtml(table.name)} to drop">
        <button id="btn-sqlite-drop-table" class="btn-secondary danger" type="button" disabled>Drop Table</button>
      </div>
    ` : ''}
  `;
  const dropInput = refs.schemaBody.querySelector('#sqlite-drop-confirm');
  const dropButton = refs.schemaBody.querySelector('#btn-sqlite-drop-table');
  if (dropInput && dropButton && table) {
    dropInput.addEventListener('input', () => {
      dropButton.disabled = dropInput.value !== table.name;
    });
    dropButton.addEventListener('click', () => dropSelectedTable(table.name));
  }
}

function renderRowEditor() {
  const refs = getRefs();
  const table = getTable();
  if (!table) {
    refs.rowEditor.innerHTML = '<div class="sqlite-empty-note">Select a table to edit rows.</div>';
    refs.rowEditorTitle.textContent = 'Row Editor';
    return;
  }

  refs.rowEditorTitle.textContent = selectedRow ? `Editing rowid ${selectedRow.__rowid__}` : `Insert into ${table.name}`;
  refs.rowEditor.innerHTML = table.columns.map((column) => `
    <label class="sqlite-row-field">
      <span>${escapeHtml(column.name)} <small>${escapeHtml(column.type || 'value')}</small></span>
      <input data-column="${escapeHtml(column.name)}" value="${escapeHtml(selectedRow?.[column.name] ?? '')}" placeholder="${column.notnull ? 'required' : 'NULL'}">
    </label>
  `).join('') + `
    <div class="sqlite-row-actions">
      <button id="btn-sqlite-insert-row" type="button">Insert Row</button>
      <button id="btn-sqlite-update-row" type="button" class="btn-secondary" ${selectedRow ? '' : 'disabled'}>Update Row</button>
      <button id="btn-sqlite-delete-row" type="button" class="btn-secondary danger" ${selectedRow ? '' : 'disabled'}>Delete Row</button>
      <button id="btn-sqlite-clear-row" type="button" class="btn-secondary">Clear</button>
    </div>
  `;

  refs.rowEditor.querySelector('#btn-sqlite-insert-row')?.addEventListener('click', insertRow);
  refs.rowEditor.querySelector('#btn-sqlite-update-row')?.addEventListener('click', updateRow);
  refs.rowEditor.querySelector('#btn-sqlite-delete-row')?.addEventListener('click', deleteRow);
  refs.rowEditor.querySelector('#btn-sqlite-clear-row')?.addEventListener('click', () => {
    selectedRow = null;
    renderRowEditor();
  });
}

function collectRowValues() {
  return Object.fromEntries(
    Array.from(getRefs().rowEditor.querySelectorAll('[data-column]'))
      .map((input) => [input.dataset.column, input.value])
  );
}

function renderResults(result, options = {}) {
  const refs = getRefs();
  lastResults = result || null;
  refs.resultsHead.innerHTML = '';
  refs.resultsBody.innerHTML = '';

  if (!result?.columns?.length) {
    refs.resultsBody.innerHTML = '<tr><td class="tool-table-state-cell is-success">Command executed. No rows returned.</td></tr>';
    if (options.editable) updateBrowsePagination(0);
    return;
  }

  refs.resultsHead.innerHTML = `<tr>${result.columns.map((column) => `<th class="tool-table-head-cell">${escapeHtml(column)}</th>`).join('')}</tr>`;
  const rows = sqliteResultToObjects(result);
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.className = 'tool-table-row';
    if (options.editable && row.__rowid__ !== undefined) tr.classList.add('sqlite-editable-row');
    result.columns.forEach((column) => {
      const td = document.createElement('td');
      td.className = 'tool-table-cell tool-table-cell-ellipsis';
      td.setAttribute('data-cell-column', column);
      td.addEventListener('click', () => {
        cellDetailRow = row;
        openSQLiteCellDetail(column, row[column]);
      });
      if (row[column] === null || row[column] === undefined) {
        td.innerHTML = '<span class="tool-table-null">NULL</span>';
      } else {
        td.textContent = row[column];
      }
      tr.appendChild(td);
    });
    if (options.editable && row.__rowid__ !== undefined) {
      tr.addEventListener('click', () => {
        selectedRow = row;
        renderRowEditor();
      });
    }
    refs.resultsBody.appendChild(tr);
  });
}

async function refreshMetadata() {
  const payload = await executeSQLite('PRAGMA user_version;', [], { includeMetadata: true });
  if (!selectedTable && metadata.tables[0]) selectedTable = metadata.tables[0].name;
  if (!selectedObject && selectedTable) {
    selectedObject = metadata.objects.find((entry) => entry.type === 'table' && entry.name === selectedTable) || null;
  }
  renderObjectList();
  renderTableControls();
  renderSchemaPanel();
  renderRowEditor();
  updateBrowsePagination(0);
  return payload;
}

async function openDatabaseFromFile(files) {
  const file = files?.[0];
  if (!file) return;
  try {
    currentDbBuffer = await file.arrayBuffer();
    selectedObject = null;
    selectedTable = null;
    selectedRow = null;
    setDatabaseReady(file.name);
    await initMonaco();
    setStatus('Inspecting database...');
    await refreshMetadata();
    if (metadata.tables[0]) selectObject('table', metadata.tables[0].name);
    setStatus('Database ready.', 'success');
  } catch (error) {
    clearDatabaseWorkspace('Database open failed.');
    showImportErrorDialog(file.name, error);
  } finally {
    const fileInput = getRefs().fileInput;
    if (fileInput) fileInput.value = '';
  }
}

async function createNewDatabase() {
  currentDbBuffer = null;
  selectedObject = null;
  selectedTable = null;
  selectedRow = null;
  setDatabaseReady('Untitled.sqlite');
  await initMonaco();
  await executeSQLite('PRAGMA user_version = 0;', [], { includeMetadata: true });
  if (metadata.tables[0]) {
    selectedTable = metadata.tables[0].name;
    selectedObject = metadata.objects.find((entry) => entry.type === 'table' && entry.name === selectedTable) || null;
  }
  renderObjectList();
  renderTableControls();
  renderSchemaPanel();
  renderRowEditor();
  updateBrowsePagination(0);
  setStatus('New empty database ready.', 'success');
}

async function createTableFromDraft() {
  syncCreateColumnDrafts();
  const refs = getRefs();
  const statement = buildSQLiteCreateTableStatement({
    tableName: refs.createTable.value,
    columns: createColumnDrafts
  });
  setStatus(`Creating ${refs.createTable.value}...`);
  await executeSQLite(statement.sql, statement.params, { includeMetadata: true });
  selectedTable = refs.createTable.value;
  selectedObject = metadata.objects.find((entry) => entry.type === 'table' && entry.name === selectedTable) || null;
  selectedRow = null;
  refs.createTable.value = '';
  resetBrowseControlsForTable();
  createColumnDrafts = [
    { name: 'id', type: 'INTEGER', primaryKey: true, notNull: false, unique: false, defaultValue: '' },
    { name: 'name', type: 'TEXT', primaryKey: false, notNull: false, unique: false, defaultValue: '' }
  ];
  renderCreateTablePanel();
  renderObjectList();
  renderTableControls();
  renderSchemaPanel();
  renderRowEditor();
  await browseTable();
  showToast('Table created.', 'success');
}

async function dropSelectedTable(tableName) {
  const statement = buildSQLiteDropTableStatement({ tableName });
  setStatus(`Dropping ${tableName}...`);
  await executeSQLite(statement.sql, statement.params, { includeMetadata: true });
  selectedTable = metadata.tables[0]?.name || null;
  selectedObject = selectedTable
    ? metadata.objects.find((entry) => entry.type === 'table' && entry.name === selectedTable) || null
    : null;
  selectedRow = null;
  resetBrowseControlsForTable();
  renderObjectList();
  renderTableControls();
  renderSchemaPanel();
  renderRowEditor();
  renderResults(null);
  setStatus(`Dropped ${tableName}.`, 'success');
}

function selectObject(type, name) {
  const tableChanged = type === 'table' && selectedTable !== name;
  selectedObject = metadata.objects.find((entry) => entry.type === type && entry.name === name) || null;
  if (type === 'table') selectedTable = name;
  selectedRow = null;
  if (tableChanged) resetBrowseControlsForTable();
  renderObjectList();
  renderTableControls();
  renderSchemaPanel();
  renderRowEditor();
  if (type === 'table') browseTable();
}

async function browseTable() {
  const refs = getRefs();
  selectedTable = refs.browseTable.value || selectedTable || metadata.tables[0]?.name || '';
  const table = getTable();
  if (!table) {
    renderResults(null);
    return;
  }
  selectedObject = metadata.objects.find((entry) => entry.type === 'table' && entry.name === selectedTable) || selectedObject;
  const query = buildSQLiteBrowseQuery({
    tableName: selectedTable,
    columns: table.columns.map((column) => column.name),
    filter: refs.browseFilter.value,
    orderBy: refs.browseOrder.value,
    orderDirection: refs.browseDirection.value,
    limit: refs.browseLimit.value,
    offset: refs.browseOffset.value
  });
  setStatus(`Browsing ${selectedTable}...`);
  const payload = await executeSQLite(query.sql, query.params, { includeMetadata: false });
  const result = payload.result?.[0];
  renderResults(result, { editable: true });
  renderObjectList();
  renderSchemaPanel();
  renderRowEditor();
  updateBrowsePagination(result?.values?.length || 0);
  switchSQLiteWorkspacePanel('results');
  centerElement(container.querySelector('.sqlite-results-panel'));
  const pageLabel = getRefs().browsePage.textContent || `${result?.values?.length || 0} rows`;
  setStatus(`${pageLabel} loaded from ${selectedTable}. Click a cell for full value.`, 'success');
}

function pageBrowseBy(direction) {
  const refs = getRefs();
  if (direction < 0 && refs.browsePrev.disabled) return;
  if (direction > 0 && refs.browseNext.disabled) return;
  const state = getBrowsePaginationState(lastResults?.values?.length || 0);
  refs.browseOffset.value = String(Math.max(0, state.offset + direction * state.limit));
  browseTable();
}

function pageBrowseTo(position) {
  const refs = getRefs();
  const state = getBrowsePaginationState(lastResults?.values?.length || 0);
  if (position === 'first') {
    refs.browseOffset.value = '0';
  } else if (position === 'last' && state.hasTotal) {
    refs.browseOffset.value = String(Math.max(0, (Math.max(1, state.pageCount) - 1) * state.limit));
  } else {
    const pageIndex = clampInteger(refs.browsePageIndex.value, state.pageIndex, 1, state.pageCount || 1000000000);
    refs.browseOffset.value = String(Math.max(0, (pageIndex - 1) * state.limit));
  }
  browseTable();
}

function pushHistory(sql) {
  const value = String(sql || '').trim();
  if (!value) return;
  queryHistory = [value, ...queryHistory.filter((entry) => entry !== value)].slice(0, 12);
  renderHistory();
}

function renderHistory() {
  const history = getRefs().history;
  history.innerHTML = queryHistory.length
    ? queryHistory.map((entry, index) => `<button class="sqlite-history-item" type="button" data-history-index="${index}">${escapeHtml(entry)}</button>`).join('')
    : '<div class="sqlite-empty-note">No query history yet.</div>';
  history.querySelectorAll('[data-history-index]').forEach((button) => {
    button.addEventListener('click', () => {
      sqlEditor?.setValue(queryHistory[Number(button.dataset.historyIndex)] || '');
    });
  });
}

function pushSQLiteUndoEntry(entry) {
  sqliteUndoLog = [entry, ...sqliteUndoLog].slice(0, 12);
  renderSQLiteUndoLog();
}

function syncSQLiteUndoActions() {
  const latest = getRefs().latestUndo;
  if (latest) latest.disabled = !sqliteUndoLog.length;
}

function renderSQLiteUndoLog() {
  const undoLog = getRefs().undoLog;
  if (!undoLog) return;
  undoLog.innerHTML = sqliteUndoLog.length
    ? sqliteUndoLog.map((entry, index) => `
      <button class="sqlite-undo-item" type="button" data-undo-index="${index}">
        <span>${escapeHtml(entry.label)}</span>
        <small>${escapeHtml(entry.detail || '')}</small>
      </button>
    `).join('')
    : '<div class="sqlite-empty-note">No row edits yet.</div>';
  undoLog.querySelectorAll('[data-undo-index]').forEach((button) => {
    button.addEventListener('click', () => undoSQLiteEdit(Number(button.dataset.undoIndex)));
  });
  syncSQLiteUndoActions();
}

async function undoSQLiteEdit(index) {
  const entry = sqliteUndoLog[index];
  if (!entry) return;
  await executeSQLite(entry.statement.sql, entry.statement.params, { includeMetadata: true });
  sqliteUndoLog.splice(index, 1);
  renderSQLiteUndoLog();
  await browseTable();
  showToast('Undo applied.', 'success');
}

async function applySQLiteCellEdit() {
  if (!selectedTable || !cellDetailRow || !cellDetailColumn || cellDetailColumn === '__rowid__') return;
  const refs = getRefs();
  const previousValue = cellDetailRow[cellDetailColumn];
  const nextValue = refs.cellEditValue.value;
  const statement = buildSQLiteUpdateStatement({
    tableName: selectedTable,
    rowid: cellDetailRow.__rowid__,
    values: { [cellDetailColumn]: nextValue }
  });
  await executeSQLite(statement.sql, statement.params, { includeMetadata: true });
  pushSQLiteUndoEntry({
    label: `Cell ${cellDetailColumn} rowid ${cellDetailRow.__rowid__}`,
    detail: selectedTable,
    statement: buildSQLiteUpdateStatement({
      tableName: selectedTable,
      rowid: cellDetailRow.__rowid__,
      values: { [cellDetailColumn]: previousValue }
    })
  });
  refs.cellValue.textContent = nextValue;
  cellDetailRow[cellDetailColumn] = nextValue;
  await browseTable();
  switchSQLiteWorkspacePanel('results');
  showToast('Cell updated.', 'success');
}

async function runQuery() {
  if (!sqlEditor) return;
  const sql = sqlEditor.getValue();
  const button = container.querySelector('#btn-run-query');
  button.disabled = true;
  setStatus('Executing query...');
  try {
    const payload = await executeSQLite(sql, [], { includeMetadata: true });
    renderResults(payload.result?.[0]);
    pushHistory(sql);
    renderObjectList();
    renderTableControls();
    renderSchemaPanel();
    renderRowEditor();
    switchSQLiteWorkspacePanel('results');
    setStatus(payload.result?.[0] ? `${payload.result[0].values.length} rows returned.` : `Command complete. ${payload.changes || 0} rows changed.`, 'success');
  } catch (error) {
    setStatus(error.message, 'danger');
    getRefs().resultsBody.innerHTML = `<tr><td class="tool-table-state-cell is-danger">${escapeHtml(error.message)}</td></tr>`;
  } finally {
    button.disabled = false;
  }
}

async function insertRow() {
  const statement = buildSQLiteInsertStatement({ tableName: selectedTable, values: collectRowValues() });
  await executeSQLite(statement.sql, statement.params, { includeMetadata: true });
  selectedRow = null;
  await browseTable();
  switchSQLiteWorkspacePanel('edit');
  showToast('Row inserted.', 'success');
}

async function updateRow() {
  if (!selectedRow) return;
  const previousRow = { ...selectedRow };
  const statement = buildSQLiteUpdateStatement({
    tableName: selectedTable,
    rowid: selectedRow.__rowid__,
    values: collectRowValues()
  });
  await executeSQLite(statement.sql, statement.params, { includeMetadata: true });
  pushSQLiteUndoEntry({
    label: `Row update rowid ${previousRow.__rowid__}`,
    detail: selectedTable,
    statement: buildSQLiteUpdateStatement({
      tableName: selectedTable,
      rowid: previousRow.__rowid__,
      values: previousRow
    })
  });
  selectedRow = null;
  await browseTable();
  switchSQLiteWorkspacePanel('edit');
  showToast('Row updated.', 'success');
}

async function deleteRow() {
  if (!selectedRow) return;
  const previousRow = { ...selectedRow };
  const statement = buildSQLiteDeleteStatement({ tableName: selectedTable, rowid: selectedRow.__rowid__ });
  await executeSQLite(statement.sql, statement.params, { includeMetadata: true });
  pushSQLiteUndoEntry({
    label: `Row delete rowid ${previousRow.__rowid__}`,
    detail: selectedTable,
    statement: buildSQLiteRestoreRowStatement({
      tableName: selectedTable,
      row: previousRow
    })
  });
  selectedRow = null;
  await browseTable();
  switchSQLiteWorkspacePanel('edit');
  showToast('Row deleted.', 'success');
}

function exportCsv() {
  if (!lastResults) return;
  downloadFile(sqliteResultToCsv(lastResults), `${selectedTable || 'query'}_export.csv`, 'text/csv');
}

function exportSql() {
  const sql = metadata.objects
    .map((entry) => formatSQLiteSchema(entry.sql))
    .filter(Boolean)
    .join(';\n\n');
  downloadFile(`${sql}${sql ? ';\n' : ''}`, `${currentDbName || 'database'}_schema.sql`, 'application/sql');
}

function downloadDatabase() {
  if (!currentDbBuffer) return;
  downloadFile(currentDbBuffer, currentDbName || `database_${Date.now()}.sqlite`, 'application/x-sqlite3');
}

export async function mount(parent) {
  container = document.createElement('div');
  container.className = 'tool-sqlite';
  container.innerHTML = `
    <div class="sqlite-shell">
      <section class="card sqlite-open-card">
        <div id="db-drop-zone" class="tool-dropzone sqlite-dropzone">
          <div class="tool-dropzone-icon">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5" rx="7.5" ry="2.5"></ellipse><path d="M4.5 5v14c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5V5"></path><path d="M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5"></path></svg>
          </div>
          <div class="tool-dropzone-title">Drop .sqlite / .db or click to open</div>
          <div id="active-db-name" class="tool-dropzone-meta">No database loaded</div>
          <input type="file" id="db-input" class="hidden" accept=".sqlite,.db,.sqlite3">
        </div>
        <div class="sqlite-file-actions">
          <button id="btn-sqlite-new-db" type="button">New Database</button>
          <button id="btn-sqlite-download-db" type="button" class="btn-secondary" disabled>Download Database</button>
          <button id="btn-sqlite-export-sql" type="button" class="btn-secondary">Export Schema SQL</button>
        </div>
      </section>

      <div id="db-explorer-ui" class="sqlite-workspace hidden">
        <aside class="sqlite-sidebar">
          <div class="sqlite-sidebar-head">
            <label for="sqlite-object-filter">Objects</label>
            <input id="sqlite-object-filter" placeholder="Filter objects">
          </div>
          <div id="sqlite-object-list" class="sqlite-object-list"></div>
          <div class="sqlite-schema-panel sqlite-workspace-panel" data-sqlite-workspace-panel="schema">
            <div id="sqlite-schema-title" class="sqlite-schema-title">Schema</div>
            <div id="sqlite-schema-body" class="sqlite-schema-body"></div>
          </div>
        </aside>

        <main class="sqlite-main">
          <div id="sqlite-workspace-tabs" class="sqlite-workspace-tabs">
            <button type="button" class="btn-secondary is-active" data-sqlite-workspace-tab="browse">Browse</button>
            <button type="button" class="btn-secondary" data-sqlite-workspace-tab="edit">Edit</button>
            <button type="button" class="btn-secondary" data-sqlite-workspace-tab="query">Query</button>
            <button type="button" class="btn-secondary" data-sqlite-workspace-tab="schema">Schema</button>
            <button type="button" class="btn-secondary" data-sqlite-workspace-tab="results">Results</button>
          </div>
          <section class="sqlite-panel sqlite-workspace-panel is-active" data-sqlite-workspace-panel="browse">
            <div class="sqlite-panel-title">Browse</div>
            <div class="sqlite-browse-controls">
              <div class="sqlite-control-group">
                <span>Table</span>
                <select id="sqlite-browse-table"></select>
              </div>
              <div class="sqlite-control-group sqlite-control-wide">
                <span>Filter</span>
                <input id="sqlite-browse-filter" placeholder="Filter visible columns">
              </div>
              <div class="sqlite-control-group">
                <span>Order</span>
                <select id="sqlite-browse-order"></select>
              </div>
              <div class="sqlite-control-group">
                <span>Direction</span>
                <select id="sqlite-browse-direction">
                  <option value="ASC">Ascending</option>
                  <option value="DESC">Descending</option>
                </select>
              </div>
              <div class="sqlite-control-group">
                <span>Rows</span>
                <input id="sqlite-browse-limit" type="number" min="1" max="1000" value="100">
              </div>
              <div class="sqlite-control-group">
                <span>Offset</span>
                <input id="sqlite-browse-offset" type="number" min="0" value="0">
              </div>
              <button id="btn-sqlite-browse" type="button">Refresh</button>
            </div>
            <div class="sqlite-browse-footer">
              <div id="sqlite-browse-page" class="sqlite-browse-page">No rows loaded</div>
              <div class="sqlite-browse-pagination">
                <button id="sqlite-browse-first" type="button" class="btn-secondary" disabled>First</button>
                <button id="sqlite-browse-prev" type="button" class="btn-secondary" disabled>Previous</button>
                <input id="sqlite-browse-page-index" type="number" min="1" value="1">
                <button id="sqlite-browse-next" type="button" class="btn-secondary" disabled>Next</button>
                <button id="sqlite-browse-last" type="button" class="btn-secondary" disabled>Last</button>
              </div>
            </div>
          </section>

          <section class="sqlite-panel sqlite-create-panel sqlite-workspace-panel" data-sqlite-workspace-panel="edit">
            <div class="sqlite-panel-title">Create Table</div>
            <div class="sqlite-create-table-controls">
              <input id="sqlite-create-table" placeholder="Table name">
              <button id="btn-sqlite-add-column" type="button" class="btn-secondary">Add Column</button>
              <button id="btn-sqlite-create-table" type="button">Create Table</button>
            </div>
            <div id="sqlite-create-columns" class="sqlite-create-columns"></div>
          </section>

          <section class="sqlite-panel sqlite-row-panel sqlite-workspace-panel" data-sqlite-workspace-panel="edit">
            <div id="sqlite-row-editor-title" class="sqlite-panel-title">Row Editor</div>
            <div id="sqlite-row-editor" class="sqlite-row-editor"></div>
            <div class="sqlite-undo-panel">
              <div class="sqlite-panel-title">Undo</div>
              <div id="sqlite-undo-log" class="sqlite-undo-log"></div>
            </div>
          </section>

          <section class="sqlite-panel sqlite-query-panel sqlite-workspace-panel" data-sqlite-workspace-panel="query">
            <div class="sqlite-panel-title">SQL Query</div>
            <div id="monaco-sql-editor" class="tool-editor-host-compact sqlite-editor"></div>
            <div class="tool-action-row tool-action-row-top">
              <button id="btn-run-query" class="tool-grow-2" type="button">Run Query</button>
              <button id="btn-export-csv" class="btn-secondary tool-grow-1" type="button">Export CSV</button>
            </div>
            <div id="sqlite-query-history" class="sqlite-query-history"></div>
          </section>

          <section class="sqlite-results-panel sqlite-workspace-panel" data-sqlite-workspace-panel="results">
            <div class="sqlite-results-head">
              <div class="sqlite-panel-title">Results</div>
              <div id="sqlite-status" class="sqlite-status" data-tone="muted">Open or create a database.</div>
            </div>
            <div id="results-grid-container" class="tool-table-shell sqlite-results-shell">
              <table id="results-table" class="tool-table">
                <thead id="results-head" class="tool-table-head"></thead>
                <tbody id="results-body"></tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      <div id="sqlite-error-modal" class="sqlite-error-modal hidden">
        <div class="sqlite-error-card">
          <div class="sqlite-error-title">Database Open Failed</div>
          <p id="sqlite-error-detail" class="sqlite-error-detail"></p>
          <div class="sqlite-error-actions">
            <button type="button" data-close-sqlite-error>OK</button>
          </div>
        </div>
      </div>

      <div id="sqlite-cell-modal" class="sqlite-cell-modal hidden">
        <div class="sqlite-cell-card">
          <div class="sqlite-cell-head">
            <div>
              <div id="sqlite-cell-title" class="sqlite-cell-title">Cell Detail</div>
              <div id="sqlite-cell-meta" class="sqlite-cell-meta"></div>
            </div>
            <button type="button" class="btn-secondary" data-close-sqlite-cell>Close</button>
          </div>
          <pre id="sqlite-cell-value" class="sqlite-cell-value"></pre>
          <textarea id="sqlite-cell-edit-value" class="sqlite-cell-edit-value" spellcheck="false"></textarea>
          <div class="sqlite-cell-undo-row">
            <button id="btn-sqlite-undo-latest" type="button" class="btn-secondary" disabled>Undo Last Edit</button>
          </div>
          <div class="sqlite-cell-actions">
            <button id="btn-sqlite-apply-cell" type="button">Apply Cell Edit</button>
          </div>
        </div>
      </div>
    </div>
  `;
  parent.appendChild(container);

  const refs = getRefs();
  errorModalController = createModalController(container.querySelector('#sqlite-error-modal'), {
    closeSelectors: ['[data-close-sqlite-error]'],
    closeOnBackdrop: false
  });
  cleanup.push(() => {
    errorModalController?.destroy();
    errorModalController = null;
  });
  cellModalController = createModalController(container.querySelector('#sqlite-cell-modal'), {
    closeSelectors: ['[data-close-sqlite-cell]']
  });
  cleanup.push(() => {
    cellModalController?.destroy();
    cellModalController = null;
  });
  cleanup.push(setupDragAndDrop(refs.dropZone, openDatabaseFromFile));
  bind(refs.dropZone, 'click', () => refs.fileInput.click());
  bind(refs.fileInput, 'change', (event) => openDatabaseFromFile(event.target.files));
  bind(container.querySelector('#btn-sqlite-new-db'), 'click', createNewDatabase);
  bind(container.querySelector('#btn-sqlite-download-db'), 'click', downloadDatabase);
  bind(container.querySelector('#btn-sqlite-export-sql'), 'click', exportSql);
  container.querySelectorAll('[data-sqlite-workspace-tab]').forEach((tab) => {
    bind(tab, 'click', () => switchSQLiteWorkspacePanel(tab.dataset.sqliteWorkspaceTab));
  });
  bind(container.querySelector('#btn-run-query'), 'click', runQuery);
  bind(container.querySelector('#btn-export-csv'), 'click', exportCsv);
  bind(container.querySelector('#btn-sqlite-browse'), 'click', browseTable);
  bind(refs.browseFirst, 'click', () => pageBrowseTo('first'));
  bind(refs.browsePrev, 'click', () => pageBrowseBy(-1));
  bind(refs.browseNext, 'click', () => pageBrowseBy(1));
  bind(refs.browseLast, 'click', () => pageBrowseTo('last'));
  bind(refs.browsePageIndex, 'keydown', (event) => {
    if (event.key === 'Enter') pageBrowseTo('page');
  });
  bind(refs.cellApply, 'click', applySQLiteCellEdit);
  bind(refs.latestUndo, 'click', () => undoSQLiteEdit(0));
  bind(container.querySelector('#btn-sqlite-create-table'), 'click', createTableFromDraft);
  bind(container.querySelector('#btn-sqlite-add-column'), 'click', () => {
    syncCreateColumnDrafts();
    createColumnDrafts.push({ name: '', type: 'TEXT', primaryKey: false, notNull: false, unique: false, defaultValue: '' });
    renderCreateTablePanel();
  });
  bind(refs.browseTable, 'change', () => {
    selectedTable = refs.browseTable.value;
    selectedRow = null;
    resetBrowseControlsForTable();
    browseTable();
  });
  bind(refs.objectFilter, 'input', renderObjectList);
  [refs.browseFilter, refs.browseOrder, refs.browseDirection, refs.browseLimit, refs.browseOffset].forEach((node) => {
    bind(node, 'keydown', (event) => {
      if (event.key === 'Enter') browseTable();
    });
  });
  renderCreateTablePanel();
  renderHistory();
  renderSQLiteUndoLog();
}

export function unmount() {
  cleanup.forEach((dispose) => dispose?.());
  cleanup = [];
  sqlEditor?.dispose?.();
  sqlEditor = null;
  currentDbBuffer = null;
  currentDbName = '';
  metadata = { objects: [], tables: [], views: [], indexes: [], triggers: [] };
  selectedObject = null;
  selectedTable = null;
  selectedRow = null;
  cellDetailRow = null;
  cellDetailColumn = null;
  lastResults = null;
  queryHistory = [];
  sqliteUndoLog = [];
  createColumnDrafts = [
    { name: 'id', type: 'INTEGER', primaryKey: true, notNull: false, unique: false, defaultValue: '' },
    { name: 'name', type: 'TEXT', primaryKey: false, notNull: false, unique: false, defaultValue: '' }
  ];
  if (container) container.remove();
  container = null;
  errorModalController = null;
  cellModalController = null;
}

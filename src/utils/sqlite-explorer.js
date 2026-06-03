export function quoteSQLiteIdentifier(identifier) {
  const value = String(identifier ?? '').trim();
  if (!value) throw new Error('Identifier is required.');
  return `"${value.replace(/"/g, '""')}"`;
}

function toPositiveInteger(value, fallback, max = 1000) {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number) || number < 0) return fallback;
  return Math.min(max, number);
}

function getEditableEntries(values = {}) {
  return Object.entries(values)
    .filter(([key]) => key !== '__rowid__' && String(key || '').trim())
    .map(([key, value]) => [String(key), value === '' ? null : value]);
}

function normalizeColumnType(value) {
  const type = String(value || 'TEXT').trim().toUpperCase();
  return ['INTEGER', 'REAL', 'TEXT', 'BLOB', 'NUMERIC'].includes(type) ? type : 'TEXT';
}

export function buildSQLiteBrowseQuery(options = {}) {
  const tableName = quoteSQLiteIdentifier(options.tableName);
  const columns = Array.isArray(options.columns) ? options.columns.filter(Boolean).map(String) : [];
  const filter = String(options.filter ?? '').trim();
  const params = [];
  const where = filter && columns.length
    ? ` WHERE ${columns.map((column) => {
      params.push(`%${filter}%`);
      return `CAST(${quoteSQLiteIdentifier(column)} AS TEXT) LIKE ?`;
    }).join(' OR ')}`
    : '';
  const orderColumn = columns.includes(options.orderBy) || options.orderBy === 'rowid'
    ? options.orderBy
    : '';
  const order = orderColumn
    ? ` ORDER BY ${orderColumn === 'rowid' ? 'rowid' : quoteSQLiteIdentifier(orderColumn)} ${String(options.orderDirection).toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`
    : '';
  const limit = 100;
  const offset = toPositiveInteger(options.offset, 0, 1000000000);
  params.push(limit, offset);

  return {
    sql: `SELECT rowid AS __rowid__, * FROM ${tableName}${where}${order} LIMIT ? OFFSET ?`,
    params
  };
}

export function buildSQLiteInsertStatement(options = {}) {
  const entries = getEditableEntries(options.values);
  if (!entries.length) throw new Error('At least one column value is required.');
  return {
    sql: `INSERT INTO ${quoteSQLiteIdentifier(options.tableName)} (${entries.map(([column]) => quoteSQLiteIdentifier(column)).join(', ')}) VALUES (${entries.map(() => '?').join(', ')})`,
    params: entries.map(([, value]) => value)
  };
}

export function buildSQLiteCreateTableStatement(options = {}) {
  const columns = Array.isArray(options.columns) ? options.columns : [];
  const definitions = columns
    .filter((column) => String(column?.name || '').trim())
    .map((column) => {
      const parts = [
        quoteSQLiteIdentifier(column.name),
        normalizeColumnType(column.type)
      ];
      if (column.primaryKey) parts.push('PRIMARY KEY');
      if (column.notNull && !column.primaryKey) parts.push('NOT NULL');
      if (column.unique && !column.primaryKey) parts.push('UNIQUE');
      if (column.defaultValue !== undefined && String(column.defaultValue).trim() !== '') {
        parts.push(`DEFAULT ${String(column.defaultValue).replace(/;/g, '')}`);
      }
      return parts.join(' ');
    });
  if (!definitions.length) throw new Error('At least one column is required.');
  return {
    sql: `CREATE TABLE ${quoteSQLiteIdentifier(options.tableName)} (${definitions.join(', ')})`,
    params: []
  };
}

export function buildSQLiteDropTableStatement(options = {}) {
  return {
    sql: `DROP TABLE ${quoteSQLiteIdentifier(options.tableName)}`,
    params: []
  };
}

export function buildSQLiteUpdateStatement(options = {}) {
  const entries = getEditableEntries(options.values);
  const rowid = Number(options.rowid);
  if (!Number.isFinite(rowid)) throw new Error('A rowid is required for updates.');
  if (!entries.length) throw new Error('At least one column value is required.');
  return {
    sql: `UPDATE ${quoteSQLiteIdentifier(options.tableName)} SET ${entries.map(([column]) => `${quoteSQLiteIdentifier(column)} = ?`).join(', ')} WHERE rowid = ?`,
    params: [...entries.map(([, value]) => value), rowid]
  };
}

export function buildSQLiteDeleteStatement(options = {}) {
  const rowid = Number(options.rowid);
  if (!Number.isFinite(rowid)) throw new Error('A rowid is required for deletion.');
  return {
    sql: `DELETE FROM ${quoteSQLiteIdentifier(options.tableName)} WHERE rowid = ?`,
    params: [rowid]
  };
}

export function buildSQLiteRestoreRowStatement(options = {}) {
  const row = options.row || {};
  const rowid = Number(row.__rowid__);
  if (!Number.isFinite(rowid)) throw new Error('A rowid is required for row restore.');
  const entries = getEditableEntries(row);
  return {
    sql: `INSERT INTO ${quoteSQLiteIdentifier(options.tableName)} (rowid${entries.length ? `, ${entries.map(([column]) => quoteSQLiteIdentifier(column)).join(', ')}` : ''}) VALUES (${['?', ...entries.map(() => '?')].join(', ')})`,
    params: [rowid, ...entries.map(([, value]) => value)]
  };
}

function csvCell(value) {
  if (value === null || value === undefined) return '';
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function sqliteResultToCsv(result = {}) {
  const columns = Array.isArray(result.columns) ? result.columns : [];
  const values = Array.isArray(result.values) ? result.values : [];
  return [
    columns.map(csvCell).join(','),
    ...values.map((row) => (Array.isArray(row) ? row : []).map(csvCell).join(','))
  ].join('\n');
}

export function sqliteResultToObjects(result = {}) {
  const columns = Array.isArray(result.columns) ? result.columns : [];
  const values = Array.isArray(result.values) ? result.values : [];
  return values.map((row) => Object.fromEntries(columns.map((column, index) => [column, row[index]])));
}

export function formatSQLiteSchema(sql) {
  return String(sql || '').replace(/\s+/g, ' ').trim();
}

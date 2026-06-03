import {
  extractArchiveWasmEntry,
  extractArchiveWasmSelection,
  listArchiveWasmEntries
} from '../utils/archive-wasm-backend.js';

self.onmessage = async (event) => {
  const { type, payload = {} } = event.data || {};
  try {
    let result;
    if (type === 'archive-list') {
      result = { entries: await listArchiveWasmEntries(payload.buffer, { password: payload.password }) };
    } else if (type === 'archive-extract') {
      result = await extractArchiveWasmEntry(payload.buffer, payload.entryName, { password: payload.password });
    } else if (type === 'archive-extract-selection') {
      result = {
        files: await extractArchiveWasmSelection(payload.buffer, { prefix: payload.prefix }, { password: payload.password })
      };
    } else {
      throw new Error(`Unsupported archive task: ${type}`);
    }
    const transfers = collectTransferables(result);
    self.postMessage({ success: true, result }, transfers);
  } catch (error) {
    self.postMessage({ success: false, error: error?.message || String(error) });
  }
};

function collectTransferables(value) {
  const transfers = [];
  const visit = (entry) => {
    if (!entry || typeof entry !== 'object') return;
    if (entry instanceof ArrayBuffer) {
      transfers.push(entry);
      return;
    }
    Object.values(entry).forEach(visit);
  };
  visit(value);
  return transfers;
}

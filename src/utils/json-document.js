function cloneJsonValue(value) {
  return globalThis.structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function unescapePointerToken(token) {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

function buildTextState(value, thresholdBytes, indent = 2) {
  const text = JSON.stringify(value, null, indent);
  const large = shouldUseLargeJsonMode(text, thresholdBytes);
  return large
    ? { text: '', available: false, large }
    : { text, available: true, large };
}

function isPromiseLike(value) {
  return !!value && typeof value.then === 'function';
}

export function getJsonByteSize(text = '') {
  return new Blob([text]).size;
}

export function shouldUseLargeJsonMode(text = '', thresholdBytes = 512 * 1024) {
  return getJsonByteSize(text) >= thresholdBytes;
}

export function parseJsonPointerPath(pointer = '') {
  if (!pointer) return [];
  if (!pointer.startsWith('/')) {
    throw new Error('Path must use JSON Pointer syntax, for example /items/0/name.');
  }
  return pointer
    .split('/')
    .slice(1)
    .map((segment) => {
      const token = unescapePointerToken(segment);
      return /^\d+$/.test(token) ? Number(token) : token;
    });
}

export function summarizeJsonValue(value) {
  let nodes = 0;
  let depth = 0;
  let entries = 0;

  const visit = (current, level) => {
    nodes += 1;
    depth = Math.max(depth, level);
    if (Array.isArray(current)) {
      entries += current.length;
      for (const item of current) visit(item, level + 1);
      return;
    }
    if (current && typeof current === 'object') {
      const keys = Object.keys(current);
      entries += keys.length;
      for (const key of keys) visit(current[key], level + 1);
    }
  };

  visit(value, 1);

  return {
    kind: Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value,
    nodes,
    depth,
    entries
  };
}

function ensureContainerAtPath(root, segments) {
  let cursor = root;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const nextSegment = segments[index + 1];
    const existing = cursor[segment];
    if (existing === undefined) {
      cursor[segment] = typeof nextSegment === 'number' ? [] : {};
      cursor = cursor[segment];
      continue;
    }
    if (!existing || typeof existing !== 'object') {
      throw new Error(`Path segment ${String(segment)} does not point to an object or array.`);
    }
    cursor = existing;
  }
  return cursor;
}

export function setValueAtPointer(root, pointer, nextValue) {
  const segments = parseJsonPointerPath(pointer);
  if (!segments.length) return cloneJsonValue(nextValue);
  const output = cloneJsonValue(root);
  const parent = ensureContainerAtPath(output, segments);
  parent[segments.at(-1)] = nextValue;
  return output;
}

export function deleteValueAtPointer(root, pointer) {
  const segments = parseJsonPointerPath(pointer);
  if (!segments.length) {
    throw new Error('Deleting the root document is not supported.');
  }
  const output = cloneJsonValue(root);
  let cursor = output;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    cursor = cursor?.[segment];
    if (cursor === undefined) {
      throw new Error(`Path ${pointer} does not exist.`);
    }
  }
  const last = segments.at(-1);
  if (Array.isArray(cursor) && typeof last === 'number') {
    if (last < 0 || last >= cursor.length) {
      throw new Error(`Path ${pointer} does not exist.`);
    }
    cursor.splice(last, 1);
    return output;
  }
  if (!cursor || typeof cursor !== 'object' || !(last in cursor)) {
    throw new Error(`Path ${pointer} does not exist.`);
  }
  delete cursor[last];
  return output;
}

export function createJsonDocumentSession({ thresholdBytes = 512 * 1024, runWorkerTask = null } = {}) {
  let sourceValue = null;
  let sourceSummary = null;
  let sourceText = '';
  let sourceTextAvailable = false;
  let sourceLarge = false;
  let sourceBytes = 0;
  let resultValue = null;
  let resultSummary = null;
  let resultText = '';
  let resultTextAvailable = false;
  let resultLarge = false;
  let resultBytes = 0;
  let operationLog = [];
  
  const sessionId = crypto.randomUUID?.() || Math.random().toString(36).slice(2);

  const applyResultValue = (value, kind, indent = 2) => {
    resultValue = value;
    resultSummary = summarizeJsonValue(value);
    const textState = buildTextState(value, thresholdBytes, indent);
    resultText = textState.text;
    resultTextAvailable = textState.available;
    resultLarge = textState.large;
    resultBytes = getJsonByteSize(JSON.stringify(value));
    operationLog = [
      ...operationLog,
      {
        kind,
        at: new Date().toISOString()
      }
    ];
    return getState();
  };

  const getWorkingValue = () => resultValue ?? sourceValue;

  const getPreviewText = (value, text, available, indent, limit = 4000) => {
    if (available) return text.slice(0, limit);
    if (value === null) return '';
    return JSON.stringify(value, null, indent).slice(0, limit);
  };

  const getState = () => ({
    sourceLarge,
    sourceTextAvailable,
    sourceBytes,
    sourceSummary,
    resultLarge,
    resultTextAvailable,
    resultBytes,
    resultSummary,
    operationLog
  });

  const runOp = async (op, payload = {}) => {
    if (runWorkerTask && (sourceLarge || resultLarge || op === 'load')) {
      const response = await runWorkerTask('json-op', { op, sessionId, payload });
      if (!response.success) throw new Error(response.error || `Worker op ${op} failed.`);
      const result = response.result;

      if (op === 'load') {
        sourceLarge = true;
        sourceTextAvailable = false;
        sourceText = '';
        sourceBytes = getJsonByteSize(payload.text);
        sourceSummary = result.summary;
        sourceValue = null; // Don't keep in memory if large
      } else if (op === 'set' || op === 'delete' || op === 'query' || op === 'format' || op === 'minify') {
        resultLarge = true;
        resultTextAvailable = false;
        resultText = '';
        resultSummary = result.summary;
        if (op === 'query') {
          resultValue = result.result; 
          const resText = JSON.stringify(result.result);
          if (shouldUseLargeJsonMode(resText, thresholdBytes)) {
             resultValue = null;
             resultLarge = true;
          } else {
             resultValue = result.result;
             resultLarge = false;
             resultText = resText;
             resultTextAvailable = true;
          }
        } else {
          resultValue = null;
        }
        resultBytes = 0; // Unknown without stringify
        operationLog = [...operationLog, { kind: op, at: new Date().toISOString() }];
      }
      return getState();
    }
    return null;
  };

  return {
    setThresholdBytes(nextThresholdBytes) {
      thresholdBytes = nextThresholdBytes;
      if (sourceValue !== null) {
        const sourceState = buildTextState(sourceValue, thresholdBytes, 2);
        sourceText = sourceState.text;
        sourceTextAvailable = sourceState.available;
        sourceLarge = sourceState.large;
      }
      if (resultValue !== null) {
        const resultState = buildTextState(resultValue, thresholdBytes, 2);
        resultText = resultState.text;
        resultTextAvailable = resultState.available;
        resultLarge = resultState.large;
      }
      return getState();
    },
    load(text) {
      sourceLarge = shouldUseLargeJsonMode(text, thresholdBytes);
      if (sourceLarge && runWorkerTask) {
        return runOp('load', { text });
      }
      sourceValue = JSON.parse(text);
      sourceSummary = summarizeJsonValue(sourceValue);
      sourceTextAvailable = !sourceLarge;
      sourceText = sourceTextAvailable ? text : '';
      sourceBytes = getJsonByteSize(text);
      resultValue = null;
      resultSummary = null;
      resultText = '';
      resultTextAvailable = false;
      resultLarge = false;
      resultBytes = 0;
      operationLog = [];
      return getState();
    },
    restore({ sourceText: nextSourceText = '', resultText: nextResultText = '', indent = 2 } = {}) {
      if (!String(nextSourceText).trim()) {
        throw new Error('Load JSON first.');
      }

      const finalizeRestore = () => {
        if (String(nextResultText).trim()) {
          const isResLarge = shouldUseLargeJsonMode(nextResultText, thresholdBytes);
          resultValue = JSON.parse(nextResultText);
          resultSummary = summarizeJsonValue(resultValue);
          resultLarge = isResLarge;
          resultTextAvailable = !resultLarge;
          resultText = resultTextAvailable ? nextResultText : '';
          resultBytes = getJsonByteSize(nextResultText);
        }
        return getState();
      };

      const restored = this.load(nextSourceText);
      if (isPromiseLike(restored)) {
        return restored.then(() => finalizeRestore());
      }
      return finalizeRestore();
    },
    clearResult() {
      resultValue = null;
      resultSummary = null;
      resultText = '';
      resultTextAvailable = false;
      resultLarge = false;
      resultBytes = 0;
      operationLog = [];
      return getState();
    },
    commitResult(indent = 2) {
      if (resultValue === null && !resultLarge) throw new Error('No result available to apply.');
      
      if (resultLarge && runWorkerTask) {
        sourceValue = null;
        sourceLarge = true;
        sourceTextAvailable = false;
        sourceSummary = resultSummary;
        sourceBytes = resultBytes;
        
        resultValue = null;
        resultSummary = null;
        resultLarge = false;
        resultText = '';
        resultBytes = 0;
        operationLog = [...operationLog, { kind: 'commit', at: new Date().toISOString() }];
        return getState();
      }

      sourceValue = cloneJsonValue(resultValue);
      sourceSummary = summarizeJsonValue(sourceValue);
      const sourceState = buildTextState(sourceValue, thresholdBytes, indent);
      sourceText = sourceState.text;
      sourceTextAvailable = sourceState.available;
      sourceLarge = sourceState.large;
      sourceBytes = resultBytes || getJsonByteSize(JSON.stringify(sourceValue));
      resultValue = null;
      resultSummary = null;
      resultText = '';
      resultTextAvailable = false;
      resultLarge = false;
      resultBytes = 0;
      operationLog = [
        ...operationLog,
        {
          kind: 'commit',
          at: new Date().toISOString()
        }
      ];
      return getState();
    },
    format(indent = 2) {
      if (getWorkingValue() === null && !sourceLarge) throw new Error('Load JSON first.');
      if (sourceLarge && runWorkerTask) return runOp('format');
      return applyResultValue(cloneJsonValue(getWorkingValue()), 'format', indent);
    },
    minify() {
      if (getWorkingValue() === null && !sourceLarge) throw new Error('Load JSON first.');
      if (sourceLarge && runWorkerTask) return runOp('minify');
      return applyResultValue(cloneJsonValue(getWorkingValue()), 'minify', 0);
    },
    validate() {
      if (getWorkingValue() === null && !sourceLarge) throw new Error('Load JSON first.');
      return getState();
    },
    async runQuery(query, evaluator, indent = 2) {
      if (getWorkingValue() === null && !sourceLarge) throw new Error('Load JSON first.');
      if (sourceLarge && runWorkerTask) return runOp('query', { query });
      const value = await evaluator(getWorkingValue(), query);
      return applyResultValue(value, 'query', indent);
    },
    setAtPointer(pointer, valueText, indent = 2) {
      if (getWorkingValue() === null && !sourceLarge) throw new Error('Load JSON first.');
      if (sourceLarge && runWorkerTask) return runOp('set', { pointer, valueText });
      const nextValue = JSON.parse(valueText);
      const updated = setValueAtPointer(getWorkingValue(), pointer, nextValue);
      return applyResultValue(updated, 'set', indent);
    },
    deleteAtPointer(pointer, indent = 2) {
      if (getWorkingValue() === null && !sourceLarge) throw new Error('Load JSON first.');
      if (sourceLarge && runWorkerTask) return runOp('delete', { pointer });
      const updated = deleteValueAtPointer(getWorkingValue(), pointer);
      return applyResultValue(updated, 'delete', indent);
    },
    getDownloadText({ indent = 2 } = {}) {
      if (getWorkingValue() === null && !sourceLarge) throw new Error('Load JSON first.');
      if (sourceLarge && runWorkerTask) {
        return runOp('export', { indent }).then((res) => res.text);
      }
      return JSON.stringify(getWorkingValue(), null, indent);
    },
    getSourceText({ indent = 2 } = {}) {
      if (sourceValue === null && !sourceLarge) return '';
      if (sourceLarge && runWorkerTask) {
        return runWorkerTask('json-op', { op: 'export', sessionId, payload: { indent } }).then((res) => res.text);
      }
      return sourceTextAvailable ? sourceText : JSON.stringify(sourceValue, null, indent);
    },
    getResultText({ indent = 2 } = {}) {
      if (resultValue === null && !resultLarge) return '';
      if (resultLarge && runWorkerTask) {
        return runWorkerTask('json-op', { op: 'export', sessionId, payload: { indent } }).then((res) => res.text);
      }
      return resultTextAvailable ? resultText : JSON.stringify(resultValue, null, indent);
    },
    getWorkingText({ indent = 2 } = {}) {
      return (resultValue !== null || resultLarge)
        ? this.getResultText({ indent })
        : this.getSourceText({ indent });
    },
    getSourcePreview({ indent = 2, limit = 4000 } = {}) {
      if (sourceValue === null && !sourceLarge) return '';
      return getPreviewText(sourceValue, sourceText, sourceTextAvailable, indent, limit);
    },
    getResultPreview({ indent = 2, limit = 4000 } = {}) {
      if (resultValue === null && !resultLarge) return '';
      return getPreviewText(resultValue, resultText, resultTextAvailable, indent, limit);
    },
    getSourceValue() {
      return sourceValue;
    },
    getResultValue() {
      return resultValue;
    },
    getState,
    dispose() {
      if (runWorkerTask) {
        runWorkerTask('json-op', { op: 'clear', sessionId }).catch(() => {});
      }
    }
  };
}

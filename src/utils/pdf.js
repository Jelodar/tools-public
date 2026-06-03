export function appendPdfFiles(queue, files) {
  return [...queue, ...Array.from(files || []).map((file) => createPdfQueueItem(file))];
}

export function removePdfFile(queue, index) {
  return queue.filter((_, itemIndex) => itemIndex !== index);
}

export function movePdfFile(queue, fromIndex, toIndex) {
  if (fromIndex === toIndex) return [...queue];
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= queue.length || toIndex >= queue.length) return [...queue];
  const next = [...queue];
  const [file] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, file);
  return next;
}

export function getPdfMergeState(queue) {
  const count = queue.length;
  return {
    count,
    canMerge: count >= 1,
    message: count === 0
      ? 'Drop PDF files to start a merge set.'
      : count === 1
        ? '1 PDF ready for page edits or export.'
        : `${count} PDFs ready to merge in listed order.`
  };
}

export function createPdfQueueItem(file, overrides = {}) {
  if (file?.file || file?.pageSelection !== undefined || file?.pageCount !== undefined || file?.rotation !== undefined) {
    return {
      ...file,
      ...overrides,
      pageSelection: String(overrides.pageSelection ?? file.pageSelection ?? 'all'),
      pageCount: overrides.pageCount ?? file.pageCount ?? null,
      pageStatus: overrides.pageStatus ?? file.pageStatus ?? '',
      rotation: normalizePdfRotation(overrides.rotation ?? file.rotation ?? 0)
    };
  }
  return {
    file,
    name: file?.name || 'Untitled.pdf',
    size: Number(file?.size) || 0,
    pageSelection: overrides.pageSelection || 'all',
    pageCount: overrides.pageCount ?? null,
    pageStatus: overrides.pageStatus || '',
    rotation: normalizePdfRotation(overrides.rotation ?? 0)
  };
}

export function getPdfQueueFile(item) {
  return item?.file || item;
}

export function updatePdfPageSelection(queue, index, pageSelection) {
  return queue.map((item, itemIndex) => (
    itemIndex === index
      ? { ...createPdfQueueItem(item), pageSelection: String(pageSelection || '').trim() || 'all' }
      : item
  ));
}

export function normalizePdfRotation(value) {
  const rotation = ((Number(value) % 360) + 360) % 360;
  return [0, 90, 180, 270].includes(rotation) ? rotation : 0;
}

export function updatePdfPageRotation(queue, index, rotation) {
  return queue.map((item, itemIndex) => (
    itemIndex === index
      ? { ...createPdfQueueItem(item), rotation: normalizePdfRotation(rotation) }
      : item
  ));
}

export function applyPdfPageAction(queue, index, action) {
  const item = createPdfQueueItem(queue[index]);
  if (!item) return [...queue];
  const count = Number(item.pageCount) || 0;
  const current = String(item.pageSelection || 'all').trim() || 'all';
  let next = current;

  if (action === 'all') {
    next = 'all';
  } else if (action === 'reverse' && count > 0) {
    next = `${count}-1`;
  } else if (action === 'odd' && count > 0) {
    next = Array.from({ length: Math.ceil(count / 2) }, (_, page) => page * 2 + 1).join(',');
  } else if (action === 'even' && count > 1) {
    next = Array.from({ length: Math.floor(count / 2) }, (_, page) => page * 2 + 2).join(',');
  } else if (action === 'duplicate') {
    const duplicateSource = current.toLowerCase() === 'all' && count > 0 ? `1-${count}` : current;
    next = `${duplicateSource},${duplicateSource}`;
  }

  return updatePdfPageSelection(queue, index, next);
}

function getPdfSelectedPageNumbers(item) {
  const normalized = createPdfQueueItem(item);
  const count = Number(normalized.pageCount) || 0;
  const pageState = parsePdfPageSelection(normalized.pageSelection, count);
  return pageState.error ? [] : pageState.indices.map((pageIndex) => pageIndex + 1);
}

function serializePdfPageNumbers(pages, pageCount) {
  const count = Number(pageCount) || 0;
  const normalized = pages
    .map((page) => Number(page))
    .filter((page) => Number.isInteger(page) && page >= 1 && page <= count);
  const natural = count > 0 && normalized.length === count && normalized.every((page, index) => page === index + 1);
  return natural ? 'all' : normalized.join(',') || 'all';
}

export function getPdfPagePreviewItems(item) {
  const normalized = createPdfQueueItem(item);
  const count = Number(normalized.pageCount) || 0;
  if (count <= 0) return [];
  const selectedPages = getPdfSelectedPageNumbers(normalized);
  const selectedCounts = selectedPages.reduce((counts, page) => {
    counts.set(page, (counts.get(page) || 0) + 1);
    return counts;
  }, new Map());
  const selected = selectedPages.map((page, sequenceIndex) => ({
    key: `selected-${sequenceIndex}-${page}`,
    page,
    selected: true,
    sequenceIndex,
    duplicate: (selectedCounts.get(page) || 0) > 1
  }));
  const omitted = Array.from({ length: count }, (_, index) => index + 1)
    .filter((page) => !selectedCounts.has(page))
    .map((page) => ({
      key: `omitted-${page}`,
      page,
      selected: false,
      sequenceIndex: -1,
      duplicate: false
    }));
  return [...selected, ...omitted];
}

export function togglePdfPreviewPage(queue, index, page, sequenceIndex = -1) {
  const item = createPdfQueueItem(queue[index]);
  if (!item) return [...queue];
  const count = Number(item.pageCount) || 0;
  if (count <= 0) return [...queue];
  const selectedPages = getPdfSelectedPageNumbers(item);
  const targetPage = Number(page);
  const selectedIndex = Number(sequenceIndex);
  let nextPages = selectedPages;
  if (Number.isInteger(selectedIndex) && selectedIndex >= 0 && selectedIndex < selectedPages.length) {
    nextPages = selectedPages.filter((_, pageIndex) => pageIndex !== selectedIndex);
  } else if (selectedPages.includes(targetPage)) {
    const removeIndex = selectedPages.indexOf(targetPage);
    nextPages = selectedPages.filter((_, pageIndex) => pageIndex !== removeIndex);
  } else if (Number.isInteger(targetPage) && targetPage >= 1 && targetPage <= count) {
    const isNaturalSubset = selectedPages.every((selectedPage, pageIndex) => (
      pageIndex === 0 || selectedPage > selectedPages[pageIndex - 1]
    ));
    nextPages = isNaturalSubset
      ? [...selectedPages, targetPage].sort((a, b) => a - b)
      : [...selectedPages, targetPage];
  }
  return updatePdfPageSelection(queue, index, serializePdfPageNumbers(nextPages, count));
}

export function movePdfPreviewPage(queue, index, fromSequenceIndex, toSequenceIndex) {
  const item = createPdfQueueItem(queue[index]);
  if (!item) return [...queue];
  const count = Number(item.pageCount) || 0;
  const selectedPages = getPdfSelectedPageNumbers(item);
  const from = Number(fromSequenceIndex);
  const to = Number(toSequenceIndex);
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= selectedPages.length || to >= selectedPages.length || from === to) {
    return [...queue];
  }
  const nextPages = [...selectedPages];
  const [moved] = nextPages.splice(from, 1);
  nextPages.splice(to, 0, moved);
  return updatePdfPageSelection(queue, index, serializePdfPageNumbers(nextPages, count));
}

export function updatePdfPageCount(queue, index, pageCount, pageStatus = '') {
  return queue.map((item, itemIndex) => (
    itemIndex === index
      ? { ...createPdfQueueItem(item), pageCount: Number(pageCount) || null, pageStatus }
      : item
  ));
}

export function updatePdfPageStatus(queue, index, pageStatus) {
  return queue.map((item, itemIndex) => (
    itemIndex === index
      ? { ...createPdfQueueItem(item), pageStatus }
      : item
  ));
}

export function parsePdfPageSelection(selection, pageCount) {
  const count = Number(pageCount) || 0;
  if (count <= 0) return { indices: [], error: 'Page count is not available.' };
  const value = String(selection || 'all').trim().toLowerCase();
  if (!value || value === 'all' || value === '*') {
    return { indices: Array.from({ length: count }, (_, index) => index), error: '' };
  }

  const indices = [];
  const tokens = value.split(',').map((token) => token.trim()).filter(Boolean);
  for (const token of tokens) {
    const rangeMatch = token.match(/^(\d+)\s*-\s*(\d+)$/);
    const pageMatch = token.match(/^\d+$/);
    if (!rangeMatch && !pageMatch) {
      return { indices: [], error: `Invalid page token "${token}".` };
    }

    const start = Number(rangeMatch?.[1] || token);
    const end = Number(rangeMatch?.[2] || token);
    if (start < 1 || start > count) return { indices: [], error: `Page ${start} is outside 1-${count}.` };
    if (end < 1 || end > count) return { indices: [], error: `Page ${end} is outside 1-${count}.` };

    const step = start <= end ? 1 : -1;
    for (let page = start; step > 0 ? page <= end : page >= end; page += step) {
      indices.push(page - 1);
    }
  }

  return indices.length
    ? { indices, error: '' }
    : { indices: [], error: 'No pages selected.' };
}

const MIN_SIZE = 128;
const MAX_SIZE = 8192;
const MAX_COLUMNS = 12;
const MAX_ROWS = 12;
export const DEFAULT_IMAGE_GRID_PRESET_ID = 'mobile-story';

export const IMAGE_GRID_RATIO_PRESETS = [
  { id: 'mobile-story', label: '9:16 Story', ratioWidth: 9, ratioHeight: 16 },
  { id: 'instagram-portrait', label: '4:5 Portrait', ratioWidth: 4, ratioHeight: 5 },
  { id: 'square', label: '1:1 Square', ratioWidth: 1, ratioHeight: 1 },
  { id: 'video-wide', label: '16:9 Landscape', ratioWidth: 16, ratioHeight: 9 },
  { id: 'instagram-landscape', label: '1.91:1 Landscape', ratioWidth: 191, ratioHeight: 100 },
  { id: 'mobile-wallpaper', label: '9:19.5 Wallpaper', ratioWidth: 9, ratioHeight: 19.5 },
  { id: 'poster', label: '4:5 Poster', ratioWidth: 4, ratioHeight: 5 },
  { id: 'banner', label: '8:3 Banner', ratioWidth: 8, ratioHeight: 3 }
];

const ALLOWED_FITS = new Set(['cover', 'contain', 'stretch']);
const ALLOWED_LAYOUTS = new Set(['auto', 'columns', 'rows', 'stack', 'side-by-side', 'masonry']);
const ALLOWED_FORMATS = new Set(['image/png', 'image/jpeg', 'image/webp']);
const CANVAS_DROP_SIDES = new Set(['top', 'right', 'bottom', 'left']);
const ANNOTATION_TYPES = new Set(['pen', 'rectangle', 'circle', 'arrow', 'text']);

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function clampInteger(value, fallback, min, max) {
  return Math.round(clampNumber(value, fallback, min, max));
}

function normalizeHex(value, fallback = '#000000') {
  const text = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(text) ? text : fallback;
}

function normalizeAngle(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return ((number % 360) + 360) % 360;
}

export function resolveImageGridPreset(id) {
  const preset = IMAGE_GRID_RATIO_PRESETS.find((entry) => entry.id === id) || IMAGE_GRID_RATIO_PRESETS[0];
  const ratioWidth = clampNumber(preset.ratioWidth, 9, 1, 999);
  const ratioHeight = clampNumber(preset.ratioHeight, 16, 1, 999);
  const size = getImageGridExportSizeForRatio(ratioWidth, ratioHeight);
  return {
    id: preset.id,
    label: preset.label,
    ratioWidth,
    ratioHeight,
    aspectRatio: ratioWidth / ratioHeight,
    width: size.width,
    height: size.height
  };
}

function evenInteger(value) {
  return Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(value / 2) * 2));
}

export function getImageGridExportSizeForRatio(ratioWidth = 9, ratioHeight = 16, maxSide = MAX_SIZE) {
  const widthPart = clampNumber(ratioWidth, 9, 1, 999);
  const heightPart = clampNumber(ratioHeight, 16, 1, 999);
  const side = clampInteger(maxSide, MAX_SIZE, MIN_SIZE, MAX_SIZE);
  const ratio = widthPart / heightPart;
  if (ratio >= 1) {
    return {
      width: evenInteger(side),
      height: evenInteger(side / ratio)
    };
  }
  return {
    width: evenInteger(side * ratio),
    height: evenInteger(side)
  };
}

export function normalizeImageGridSettings(input = {}) {
  const preset = input.preset && input.preset !== 'custom' ? resolveImageGridPreset(input.preset) : null;
  const defaultPreset = resolveImageGridPreset(DEFAULT_IMAGE_GRID_PRESET_ID);
  const hasLegacySize = input.width !== undefined || input.height !== undefined;
  const ratioWidth = preset?.ratioWidth ?? input.ratioWidth ?? (hasLegacySize ? null : defaultPreset.ratioWidth);
  const ratioHeight = preset?.ratioHeight ?? input.ratioHeight ?? (hasLegacySize ? null : defaultPreset.ratioHeight);
  const ratioSize = ratioWidth && ratioHeight ? getImageGridExportSizeForRatio(ratioWidth, ratioHeight) : null;
  const width = preset?.width ?? ratioSize?.width ?? input.width ?? defaultPreset.width;
  const height = preset?.height ?? ratioSize?.height ?? input.height ?? defaultPreset.height;
  const outputFormat = ALLOWED_FORMATS.has(input.outputFormat) ? input.outputFormat : 'image/png';
  return {
    width: clampInteger(width, 1600, MIN_SIZE, MAX_SIZE),
    height: clampInteger(height, 1600, MIN_SIZE, MAX_SIZE),
    columns: clampInteger(input.columns, 2, 1, MAX_COLUMNS),
    rows: clampInteger(input.rows, 1, 1, MAX_ROWS),
    gap: clampInteger(input.gap, 0, 0, 240),
    padding: clampInteger(input.padding, 0, 0, 480),
    background: normalizeHex(input.background),
    gapColor: normalizeHex(input.gapColor, '#000000'),
    fit: ALLOWED_FITS.has(input.fit) ? input.fit : 'contain',
    radius: clampInteger(input.radius, 0, 0, 160),
    layoutMode: ALLOWED_LAYOUTS.has(input.layoutMode) ? input.layoutMode : 'auto',
    globalZoom: clampNumber(input.globalZoom, 1, 0.25, 6),
    outputFormat,
    quality: outputFormat === 'image/png' ? 1 : clampNumber(input.quality, 0.92, 0.1, 1)
  };
}

function imageAspect(image = {}) {
  return Math.max(0.0001, (Number(image.width) || 1) / Math.max(1, Number(image.height) || 1));
}

function combineTreeAspect(direction, firstAspect, secondAspect) {
  const first = Math.max(0.0001, Number(firstAspect) || 1);
  const second = Math.max(0.0001, Number(secondAspect) || 1);
  if (direction === 'row') return first + second;
  return 1 / ((1 / first) + (1 / second));
}

function getTreeSplitRatio(direction, firstAspect, secondAspect) {
  const first = Math.max(0.0001, Number(firstAspect) || 1);
  const second = Math.max(0.0001, Number(secondAspect) || 1);
  if (direction === 'row') return clampNumber(first / (first + second), 0.5, 0.05, 0.95);
  const firstInverse = 1 / first;
  const secondInverse = 1 / second;
  return clampNumber(firstInverse / (firstInverse + secondInverse), 0.5, 0.05, 0.95);
}

function createTreeLeaf(image = {}) {
  return {
    type: 'leaf',
    imageId: image.id,
    aspect: imageAspect(image)
  };
}

function createTreeSplit(direction, first, second, id = '') {
  const firstAspect = getImageGridTreeAspect(first);
  const secondAspect = getImageGridTreeAspect(second);
  return {
    id,
    type: 'split',
    direction,
    ratio: getTreeSplitRatio(direction, firstAspect, secondAspect),
    aspect: combineTreeAspect(direction, firstAspect, secondAspect),
    children: [first, second]
  };
}

function cloneImageGridTree(node) {
  if (!node) return null;
  if (node.type === 'leaf') {
    return {
      type: 'leaf',
      imageId: node.imageId,
      aspect: imageAspect({ width: node.aspect, height: 1 })
    };
  }
  return {
    id: node.id,
    type: 'split',
    direction: node.direction === 'row' ? 'row' : 'column',
    ratio: clampNumber(node.ratio, 0.5, 0.05, 0.95),
    aspect: imageAspect({ width: node.aspect, height: 1 }),
    children: [
      cloneImageGridTree(node.children?.[0]),
      cloneImageGridTree(node.children?.[1])
    ].filter(Boolean)
  };
}

export function getImageGridTreeAspect(node) {
  if (!node) return 1;
  if (node.type === 'leaf') return imageAspect({ width: node.aspect, height: 1 });
  const first = getImageGridTreeAspect(node.children?.[0]);
  const second = getImageGridTreeAspect(node.children?.[1]);
  return combineTreeAspect(node.direction === 'row' ? 'row' : 'column', first, second);
}

function normalizeTreeRatios(node, options = {}) {
  if (!node) return null;
  if (node.type === 'leaf') {
    node.aspect = imageAspect({ width: node.aspect, height: 1 });
    return node;
  }
  const first = normalizeTreeRatios(node.children?.[0], options);
  const second = normalizeTreeRatios(node.children?.[1], options);
  if (!first) return second;
  if (!second) return first;
  node.children = [first, second];
  node.direction = node.direction === 'row' ? 'row' : 'column';
  node.ratio = options.preserveRatios
    ? clampNumber(node.ratio, getTreeSplitRatio(node.direction, getImageGridTreeAspect(first), getImageGridTreeAspect(second)), 0.05, 0.95)
    : getTreeSplitRatio(node.direction, getImageGridTreeAspect(first), getImageGridTreeAspect(second));
  node.aspect = combineTreeAspect(node.direction, getImageGridTreeAspect(first), getImageGridTreeAspect(second));
  return node;
}

function buildLinearTree(items, direction, nextId) {
  if (!items.length) return null;
  if (items.length === 1) return createTreeLeaf(items[0]);
  const midpoint = Math.floor(items.length / 2);
  return createTreeSplit(
    direction,
    buildLinearTree(items.slice(0, midpoint), direction, nextId),
    buildLinearTree(items.slice(midpoint), direction, nextId),
    `split-${nextId.value += 1}`
  );
}

function aggregateTreeAspect(items, direction) {
  const aspects = items.map(imageAspect);
  if (direction === 'row') return aspects.reduce((sum, aspect) => sum + aspect, 0);
  return 1 / aspects.reduce((sum, aspect) => sum + (1 / aspect), 0);
}

function treeAspectScore(aspect, targetAspect) {
  const aspectNumber = Math.max(0.0001, Number(aspect) || 1);
  const targetNumber = Math.max(0.0001, Number(targetAspect) || 1);
  return Math.abs(Math.log(aspectNumber / targetNumber));
}

function chooseSmartTreeSplit(items, targetAspect) {
  let best = null;
  for (let index = 1; index < items.length; index += 1) {
    const firstItems = items.slice(0, index);
    const secondItems = items.slice(index);
    ['row', 'column'].forEach((direction) => {
      const firstAspect = aggregateTreeAspect(firstItems, direction);
      const secondAspect = aggregateTreeAspect(secondItems, direction);
      const combinedAspect = combineTreeAspect(direction, firstAspect, secondAspect);
      const balance = Math.abs(firstItems.length - secondItems.length) * 0.025;
      const score = treeAspectScore(combinedAspect, targetAspect) + balance;
      if (!best || score < best.score) {
        best = {
          direction,
          firstItems,
          secondItems,
          firstAspect,
          secondAspect,
          score
        };
      }
    });
  }
  return best;
}

function buildSmartTree(items, targetAspect, nextId) {
  if (!items.length) return null;
  if (items.length === 1) return createTreeLeaf(items[0]);
  const split = chooseSmartTreeSplit(items, targetAspect);
  const first = buildSmartTree(split.firstItems, split.firstAspect, nextId);
  const second = buildSmartTree(split.secondItems, split.secondAspect, nextId);
  return createTreeSplit(split.direction, first, second, `split-${nextId.value += 1}`);
}

function joinTreeNodes(nodes, direction, nextId) {
  const filtered = nodes.filter(Boolean);
  if (!filtered.length) return null;
  if (filtered.length === 1) return filtered[0];
  const midpoint = Math.floor(filtered.length / 2);
  return createTreeSplit(
    direction,
    joinTreeNodes(filtered.slice(0, midpoint), direction, nextId),
    joinTreeNodes(filtered.slice(midpoint), direction, nextId),
    `split-${nextId.value += 1}`
  );
}

function buildMasonryTree(items, targetAspect, nextId) {
  if (!items.length) return null;
  if (items.length === 1) return createTreeLeaf(items[0]);
  const maxColumns = Math.min(items.length, MAX_COLUMNS);
  let best = null;
  const addCandidate = (builder, penalty = 0) => {
    const localId = { value: nextId.value };
    const tree = normalizeTreeRatios(builder(localId));
    if (!tree) return;
    const aspect = getImageGridTreeAspect(tree);
    const score = treeAspectScore(aspect, targetAspect) + penalty;
    if (!best || score < best.score) {
      best = { tree, score, nextValue: localId.value };
    }
  };
  for (let columnCount = 2; columnCount <= maxColumns; columnCount += 1) {
    addCandidate((localId) => buildMasonryColumnTree(items, columnCount, localId), columnCount * 0.015);
  }
  addCandidate((localId) => buildSmartTree([...items].sort((a, b) => imageAspect(b) - imageAspect(a)), targetAspect, localId), 0.008);
  addCandidate((localId) => buildSmartTree(items, targetAspect, localId), 0.012);
  if (best) {
    nextId.value = best.nextValue;
    return best.tree;
  }
  return buildSmartTree([...items].sort((a, b) => imageAspect(b) - imageAspect(a)), targetAspect, nextId);
}

function buildMasonryColumnTree(items, columnCount, nextId) {
  const columns = Array.from({ length: columnCount }, () => ({
    height: 0,
    items: []
  }));
  [...items].sort((a, b) => imageAspect(b) - imageAspect(a)).forEach((item) => {
    const target = columns.reduce((best, column) => (column.height < best.height ? column : best), columns[0]);
    target.items.push(item);
    target.height += 1 / imageAspect(item);
  });
  const columnTrees = columns
    .filter((column) => column.items.length)
    .map((column) => buildLinearTree(column.items, 'column', nextId));
  return joinTreeNodes(columnTrees, 'row', nextId);
}

export function buildImageGridLayoutTree(images = [], options = {}) {
  const items = Array.isArray(images)
    ? images.filter((image) => image?.id)
    : [];
  if (!items.length) return null;
  const mode = options.mode === 'stack' || options.mode === 'side-by-side' || options.mode === 'masonry'
    ? options.mode
    : 'masonry';
  const nextId = { value: 0 };
  if (mode === 'stack') return normalizeTreeRatios(buildLinearTree(items, 'column', nextId));
  if (mode === 'side-by-side') return normalizeTreeRatios(buildLinearTree(items, 'row', nextId));
  const targetRatio = Math.max(0.0001, Number(options.targetRatio) || 1);
  return normalizeTreeRatios(buildMasonryTree(items, targetRatio, nextId) || buildSmartTree(items, targetRatio, nextId));
}

function findTreeLeaf(node, imageId) {
  if (!node) return null;
  if (node.type === 'leaf') return node.imageId === imageId ? node : null;
  return findTreeLeaf(node.children?.[0], imageId) || findTreeLeaf(node.children?.[1], imageId);
}

function insertTreeLeaf(node, targetId, leaf, side) {
  if (!node) return leaf;
  if (node.type === 'leaf') {
    if (node.imageId !== targetId) return cloneImageGridTree(node);
    const direction = side === 'top' || side === 'bottom' ? 'column' : 'row';
    const before = side === 'top' || side === 'left';
    return createTreeSplit(
      direction,
      before ? leaf : cloneImageGridTree(node),
      before ? cloneImageGridTree(node) : leaf,
      `split-${targetId}-${leaf.imageId}`
    );
  }
  return {
    id: node.id,
    type: 'split',
    direction: node.direction === 'row' ? 'row' : 'column',
    ratio: node.ratio,
    aspect: node.aspect,
    children: [
      insertTreeLeaf(node.children?.[0], targetId, leaf, side),
      insertTreeLeaf(node.children?.[1], targetId, leaf, side)
    ].filter(Boolean)
  };
}

export function removeImageGridTreeIds(tree, ids = new Set()) {
  const idSet = ids instanceof Set ? ids : new Set(Array.isArray(ids) ? ids : [ids]);
  function removeNode(node) {
    if (!node) return null;
    if (node.type === 'leaf') return idSet.has(node.imageId) ? null : cloneImageGridTree(node);
    const first = removeNode(node.children?.[0]);
    const second = removeNode(node.children?.[1]);
    if (first && second) {
      return {
        id: node.id,
        type: 'split',
        direction: node.direction === 'row' ? 'row' : 'column',
        ratio: clampNumber(node.ratio, 0.5, 0.05, 0.95),
        aspect: combineTreeAspect(node.direction === 'row' ? 'row' : 'column', getImageGridTreeAspect(first), getImageGridTreeAspect(second)),
        children: [first, second]
      };
    }
    return first || second;
  }
  return normalizeTreeRatios(removeNode(tree), { preserveRatios: true });
}

export function insertImageGridTreeRelative(tree, options = {}) {
  const sourceId = options.sourceId;
  const targetId = options.targetId;
  const side = CANVAS_DROP_SIDES.has(options.side) ? options.side : 'right';
  if (!sourceId) return cloneImageGridTree(tree);
  if (sourceId === targetId) return cloneImageGridTree(tree);
  const existingSource = findTreeLeaf(tree, sourceId);
  const sourceLeaf = existingSource
    ? cloneImageGridTree(existingSource)
    : createTreeLeaf({ id: sourceId, width: Number(options.sourceAspect) || 1, height: 1 });
  const baseTree = existingSource ? removeImageGridTreeIds(tree, new Set([sourceId])) : cloneImageGridTree(tree);
  if (!baseTree) return sourceLeaf;
  const insertionTarget = findTreeLeaf(baseTree, targetId) ? targetId : getImageGridTreeLeafIds(baseTree).at(-1);
  return normalizeTreeRatios(insertTreeLeaf(baseTree, insertionTarget, sourceLeaf, side), { preserveRatios: true });
}

export function resizeImageGridTreeSplit(tree, splitId, ratio) {
  const nextRatio = clampNumber(ratio, 0.5, 0.05, 0.95);
  function resizeNode(node) {
    if (!node) return null;
    if (node.type === 'leaf') return cloneImageGridTree(node);
    return {
      id: node.id,
      type: 'split',
      direction: node.direction === 'row' ? 'row' : 'column',
      ratio: node.id === splitId ? nextRatio : clampNumber(node.ratio, 0.5, 0.05, 0.95),
      aspect: imageAspect({ width: node.aspect, height: 1 }),
      children: [
        resizeNode(node.children?.[0]),
        resizeNode(node.children?.[1])
      ].filter(Boolean)
    };
  }
  return normalizeTreeRatios(resizeNode(tree), { preserveRatios: true });
}

export function toggleImageGridTreeSplitAtLeaf(tree, imageId) {
  function toggleNode(node) {
    if (!node) return { node: null, contains: false, toggled: false };
    if (node.type === 'leaf') {
      return {
        node: cloneImageGridTree(node),
        contains: node.imageId === imageId,
        toggled: false
      };
    }
    const first = toggleNode(node.children?.[0]);
    const second = toggleNode(node.children?.[1]);
    const children = [first.node, second.node].filter(Boolean);
    if (children.length < 2) {
      return {
        node: children[0] || null,
        contains: first.contains || second.contains,
        toggled: first.toggled || second.toggled
      };
    }
    const contains = first.contains || second.contains;
    const toggledChild = first.toggled || second.toggled;
    const shouldToggle = contains && !toggledChild;
    const direction = shouldToggle
      ? (node.direction === 'row' ? 'column' : 'row')
      : (node.direction === 'row' ? 'row' : 'column');
    const firstAspect = getImageGridTreeAspect(children[0]);
    const secondAspect = getImageGridTreeAspect(children[1]);
    return {
      node: {
        id: node.id,
        type: 'split',
        direction,
        ratio: shouldToggle
          ? getTreeSplitRatio(direction, firstAspect, secondAspect)
          : clampNumber(node.ratio, getTreeSplitRatio(direction, firstAspect, secondAspect), 0.05, 0.95),
        aspect: combineTreeAspect(direction, firstAspect, secondAspect),
        children
      },
      contains,
      toggled: toggledChild || shouldToggle
    };
  }
  return normalizeTreeRatios(toggleNode(tree).node, { preserveRatios: true });
}

export function getImageGridTreeLeafIds(tree) {
  if (!tree) return [];
  if (tree.type === 'leaf') return tree.imageId ? [tree.imageId] : [];
  return [
    ...getImageGridTreeLeafIds(tree.children?.[0]),
    ...getImageGridTreeLeafIds(tree.children?.[1])
  ];
}

function refreshImageGridTreeAspects(tree, imageById) {
  if (!tree) return null;
  if (tree.type === 'leaf') {
    const image = imageById.get(tree.imageId);
    return {
      type: 'leaf',
      imageId: tree.imageId,
      aspect: image ? imageAspect(image) : imageAspect({ width: tree.aspect, height: 1 })
    };
  }
  return normalizeTreeRatios({
    id: tree.id,
    type: 'split',
    direction: tree.direction === 'row' ? 'row' : 'column',
    ratio: tree.ratio,
    aspect: tree.aspect,
    children: [
      refreshImageGridTreeAspects(tree.children?.[0], imageById),
      refreshImageGridTreeAspects(tree.children?.[1], imageById)
    ].filter(Boolean)
  }, { preserveRatios: true });
}

export function syncImageGridLayoutTree(tree, images = [], options = {}) {
  const validIds = new Set(images.map((image) => image.id));
  const imageById = new Map(images.map((image) => [image.id, image]));
  let nextTree = removeImageGridTreeIds(tree, new Set(getImageGridTreeLeafIds(tree).filter((id) => !validIds.has(id))));
  nextTree = refreshImageGridTreeAspects(nextTree, imageById);
  const treeIds = new Set(getImageGridTreeLeafIds(nextTree));
  const missing = images.filter((image) => image?.id && !treeIds.has(image.id));
  if (!nextTree) {
    return buildImageGridLayoutTree(images, options);
  }
  missing.forEach((image) => {
    nextTree = insertImageGridTreeRelative(nextTree, {
      sourceId: image.id,
      sourceAspect: imageAspect(image),
      targetId: getImageGridTreeLeafIds(nextTree).at(-1),
      side: 'right'
    });
  });
  return normalizeTreeRatios(nextTree, { preserveRatios: true });
}

function resolveGridShape(count, settings) {
  if (!count) return { columns: 0, rows: 0 };
  if (settings.layoutMode === 'rows') {
    const rows = Math.min(count, settings.rows);
    return {
      columns: Math.ceil(count / rows),
      rows
    };
  }
  if (settings.layoutMode === 'columns') {
    const columns = Math.min(count, settings.columns);
    return {
      columns,
      rows: Math.ceil(count / columns)
    };
  }
  const ratio = settings.width / Math.max(1, settings.height);
  const columns = Math.max(1, Math.min(count, MAX_COLUMNS, Math.round(Math.sqrt(count * ratio))));
  return {
    columns,
    rows: Math.ceil(count / columns)
  };
}

function getTreeContentRect(settings, layoutTree) {
  const contentWidth = Math.max(1, settings.width - (settings.padding * 2));
  const contentHeight = Math.max(1, settings.height - (settings.padding * 2));
  if (settings.fit === 'cover') {
    return {
      x: settings.padding,
      y: settings.padding,
      width: contentWidth,
      height: contentHeight
    };
  }
  const contentAspect = contentWidth / contentHeight;
  const treeAspect = getImageGridTreeAspect(layoutTree);
  let width = contentWidth;
  let height = contentHeight;
  if (treeAspect > contentAspect) {
    height = contentWidth / treeAspect;
  } else {
    width = contentHeight * treeAspect;
  }
  return {
    x: settings.padding + ((contentWidth - width) / 2),
    y: settings.padding,
    width,
    height
  };
}

export function calculateImageGridLayout(options = {}) {
  const images = Array.isArray(options.images) ? options.images : [];
  const settings = normalizeImageGridSettings(options.settings || {});
  const imageById = new Map(images.map((image) => [image.id, image]));
  const layoutTree = options.layoutTree ? syncImageGridLayoutTree(options.layoutTree, images, {
    mode: settings.layoutMode === 'stack' || settings.layoutMode === 'side-by-side' ? settings.layoutMode : 'masonry',
    targetRatio: settings.width / Math.max(1, settings.height)
  }) : null;
  if (layoutTree && images.length) {
    const cells = [];
    const splits = [];
    function walk(node, rect) {
      if (!node) return;
      if (node.type === 'leaf') {
        const image = imageById.get(node.imageId);
        if (!image) return;
        cells.push({
          id: image.id,
          index: cells.length,
          column: 0,
          row: 0,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          imageHeight: rect.height,
          image
        });
        return;
      }
      const direction = node.direction === 'row' ? 'row' : 'column';
      const ratio = clampNumber(node.ratio, 0.5, 0.05, 0.95);
      if (direction === 'row') {
        const availableWidth = Math.max(1, rect.width - settings.gap);
        const firstWidth = availableWidth * ratio;
        const secondWidth = availableWidth - firstWidth;
        splits.push({
          id: node.id,
          direction,
          ratio,
          x: roundMetric(rect.x + firstWidth),
          y: roundMetric(rect.y),
          width: roundMetric(settings.gap),
          height: roundMetric(rect.height),
          parentX: roundMetric(rect.x),
          parentY: roundMetric(rect.y),
          parentWidth: roundMetric(rect.width),
          parentHeight: roundMetric(rect.height)
        });
        walk(node.children?.[0], {
          x: rect.x,
          y: rect.y,
          width: firstWidth,
          height: rect.height
        });
        walk(node.children?.[1], {
          x: rect.x + firstWidth + settings.gap,
          y: rect.y,
          width: secondWidth,
          height: rect.height
        });
      } else {
        const availableHeight = Math.max(1, rect.height - settings.gap);
        const firstHeight = availableHeight * ratio;
        const secondHeight = availableHeight - firstHeight;
        splits.push({
          id: node.id,
          direction,
          ratio,
          x: roundMetric(rect.x),
          y: roundMetric(rect.y + firstHeight),
          width: roundMetric(rect.width),
          height: roundMetric(settings.gap),
          parentX: roundMetric(rect.x),
          parentY: roundMetric(rect.y),
          parentWidth: roundMetric(rect.width),
          parentHeight: roundMetric(rect.height)
        });
        walk(node.children?.[0], {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: firstHeight
        });
        walk(node.children?.[1], {
          x: rect.x,
          y: rect.y + firstHeight + settings.gap,
          width: rect.width,
          height: secondHeight
        });
      }
    }
    walk(layoutTree, getTreeContentRect(settings, layoutTree));
    const roundedColumns = [...new Set(cells.map((cell) => roundMetric(cell.x)))].sort((a, b) => a - b);
    const roundedRows = [...new Set(cells.map((cell) => roundMetric(cell.y)))].sort((a, b) => a - b);
    cells.forEach((cell, index) => {
      cell.index = index;
      cell.column = roundedColumns.indexOf(roundMetric(cell.x));
      cell.row = roundedRows.indexOf(roundMetric(cell.y));
      cell.x = roundMetric(cell.x);
      cell.y = roundMetric(cell.y);
      cell.width = roundMetric(cell.width);
      cell.height = roundMetric(cell.height);
      cell.imageHeight = roundMetric(cell.imageHeight);
    });
    return {
      width: settings.width,
      height: settings.height,
      columns: roundedColumns.length,
      rows: roundedRows.length,
      layoutType: 'tree',
      layoutTree,
      splits,
      cells
    };
  }
  const { columns, rows } = resolveGridShape(images.length, settings);
  if (!images.length || !columns || !rows) {
    return {
      width: settings.width,
      height: settings.height,
      columns: 0,
      rows: 0,
      layoutType: 'grid',
      splits: [],
      cells: []
    };
  }
  const usableWidth = Math.max(1, settings.width - (settings.padding * 2) - (settings.gap * Math.max(0, columns - 1)));
  const usableHeight = Math.max(1, settings.height - (settings.padding * 2) - (settings.gap * Math.max(0, rows - 1)));
  const cellWidth = usableWidth / columns;
  const cellHeight = usableHeight / rows;
  const cells = images.map((image, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = settings.padding + (column * (cellWidth + settings.gap));
    const y = settings.padding + (row * (cellHeight + settings.gap));
    return {
      id: image.id,
      index,
      column,
      row,
      x,
      y,
      width: cellWidth,
      height: cellHeight,
      imageHeight: cellHeight,
      image
    };
  });
  return {
    width: settings.width,
    height: settings.height,
    columns,
    rows,
    layoutType: 'grid',
    splits: [],
    cells
  };
}

function roundMetric(value) {
  return Number(Number(value || 0).toFixed(3));
}

function getLayoutBounds(cells = [], fallbackWidth = 1, fallbackHeight = 1) {
  if (!cells.length) {
    return {
      x: 0,
      y: 0,
      width: Math.max(1, Number(fallbackWidth) || 1),
      height: Math.max(1, Number(fallbackHeight) || 1)
    };
  }
  const left = Math.min(...cells.map((cell) => cell.x));
  const top = Math.min(...cells.map((cell) => cell.y));
  const right = Math.max(...cells.map((cell) => cell.x + cell.width));
  const bottom = Math.max(...cells.map((cell) => cell.y + cell.height));
  return {
    x: roundMetric(left),
    y: roundMetric(top),
    width: roundMetric(right - left),
    height: roundMetric(bottom - top)
  };
}

export function getImageGridLayoutCellBounds(layout = {}) {
  return getLayoutBounds(
    Array.isArray(layout.cells) ? layout.cells : [],
    layout.width || 1,
    layout.height || 1
  );
}

export function getImageGridCanvasResizeHandles(layout = {}, inputSettings = {}) {
  const settings = normalizeImageGridSettings(inputSettings);
  const cells = Array.isArray(layout.cells) ? layout.cells : [];
  if (!cells.length) return [];
  const bounds = getImageGridLayoutCellBounds(layout);
  const edge = Math.max(48, Math.min(160, Math.min(settings.width, settings.height) * 0.035));
  const contentRight = bounds.x + bounds.width;
  const contentBottom = bounds.y + bounds.height;
  const bottomSlack = Math.max(0, settings.height - contentBottom - settings.padding);
  const rightSlack = Math.max(0, settings.width - contentRight - settings.padding);
  const rightWidth = rightSlack > 1 ? Math.max(edge, rightSlack) : edge;
  const bottomHeight = bottomSlack > 1 ? Math.max(edge, bottomSlack) : edge;
  return [
    {
      kind: 'right',
      x: roundMetric(rightSlack > 1 ? contentRight : Math.max(0, settings.width - rightWidth)),
      y: roundMetric(bounds.y),
      width: roundMetric(rightWidth),
      height: roundMetric(Math.max(edge, bounds.height))
    },
    {
      kind: 'bottom',
      x: roundMetric(bounds.x),
      y: roundMetric(bottomSlack > 1 ? contentBottom : Math.max(0, settings.height - bottomHeight)),
      width: roundMetric(Math.max(edge, bounds.width)),
      height: roundMetric(bottomHeight)
    },
    {
      kind: 'corner',
      x: roundMetric(Math.max(0, settings.width - edge)),
      y: roundMetric(Math.max(0, settings.height - edge)),
      width: roundMetric(edge),
      height: roundMetric(edge)
    }
  ];
}

function distanceToCell(cell, x, y) {
  const closestX = Math.max(cell.x, Math.min(cell.x + cell.width, x));
  const closestY = Math.max(cell.y, Math.min(cell.y + cell.height, y));
  return Math.hypot(x - closestX, y - closestY);
}

function findCanvasDropCell(cells, x, y) {
  const containing = cells.find((cell) => (
    x >= cell.x
    && x <= cell.x + cell.width
    && y >= cell.y
    && y <= cell.y + cell.height
  ));
  if (containing) return containing;

  return cells.reduce((best, cell) => {
    const distance = distanceToCell(cell, x, y);
    if (!best || distance < best.distance) {
      return { cell, distance };
    }
    if (distance === best.distance && (cell.x >= x || cell.y >= y)) {
      return { cell, distance };
    }
    return best;
  }, null)?.cell || cells[0];
}

function getCanvasDropSide(cell, x, y) {
  if (y < cell.y) return 'top';
  if (y > cell.y + cell.height) return 'bottom';
  if (x < cell.x) return 'left';
  if (x > cell.x + cell.width) return 'right';
  const localX = (x - cell.x) / Math.max(1, cell.width);
  const localY = (y - cell.y) / Math.max(1, cell.height);
  if (localY < 0.25) return 'top';
  if (localY > 0.75) return 'bottom';
  return localX < 0.5 ? 'left' : 'right';
}

function getCanvasDropInsertionIndex(cell, side, columns, itemCount) {
  if (side === 'top') return Math.max(0, cell.row * columns);
  if (side === 'bottom') return Math.min(itemCount, (cell.row + 1) * columns);
  if (side === 'right') return Math.min(itemCount, cell.index + 1);
  return Math.max(0, cell.index);
}

function getCanvasDropSettingsPatch(side, layout, settings) {
  if (layout.layoutType === 'tree') {
    return {};
  }
  if (side === 'left' || side === 'right') {
    return {
      layoutMode: 'columns',
      columns: Math.min(MAX_COLUMNS, Math.max(settings.columns, layout.columns + 1))
    };
  }
  if (side === 'top' || side === 'bottom') {
    return {
      layoutMode: 'rows',
      rows: Math.min(MAX_ROWS, Math.max(settings.rows, layout.rows + 1))
    };
  }
  return {};
}

function getCanvasDropRect(side, cell, bounds) {
  if (!CANVAS_DROP_SIDES.has(side)) {
    return bounds;
  }
  if (side === 'left' || side === 'right') {
    const width = Math.max(4, cell.width * 0.25);
    return {
      x: roundMetric(side === 'left' ? cell.x : cell.x + cell.width - width),
      y: roundMetric(bounds.y),
      width: roundMetric(width),
      height: roundMetric(bounds.height)
    };
  }
  const height = Math.max(4, cell.height * 0.25);
  return {
    x: roundMetric(bounds.x),
    y: roundMetric(side === 'top' ? cell.y : cell.y + cell.height - height),
    width: roundMetric(bounds.width),
    height: roundMetric(height)
  };
}

function getCanvasDropLabel(side) {
  if (side === 'top') return 'Insert row above';
  if (side === 'bottom') return 'Insert row below';
  if (side === 'left') return 'Insert column left';
  if (side === 'right') return 'Insert column right';
  return 'Drop to add images';
}

export function getImageGridCanvasDropTarget(options = {}) {
  const layout = options.layout || {};
  const settings = normalizeImageGridSettings(options.settings || {});
  const cells = Array.isArray(layout.cells) ? layout.cells : [];
  const itemCount = Math.max(0, Number(options.itemCount ?? cells.length) || 0);
  const bounds = getLayoutBounds(cells, layout.width || settings.width, layout.height || settings.height);
  if (!cells.length) {
    return {
      action: 'append',
      targetId: null,
      targetIndex: -1,
      insertionIndex: 0,
      side: 'fill',
      label: getCanvasDropLabel('fill'),
      settingsPatch: {},
      rect: bounds
    };
  }

  const x = clampNumber(options.x, bounds.x + (bounds.width / 2), 0, settings.width);
  const y = clampNumber(options.y, bounds.y + (bounds.height / 2), 0, settings.height);
  const cell = findCanvasDropCell(cells, x, y);
  const side = getCanvasDropSide(cell, x, y);
  return {
    action: 'insert',
    targetId: cell.id,
    targetIndex: cell.index,
    insertionIndex: getCanvasDropInsertionIndex(cell, side, Math.max(1, layout.columns || 1), itemCount),
    side,
    label: getCanvasDropLabel(side),
    settingsPatch: getCanvasDropSettingsPatch(side, layout, settings),
    rect: getCanvasDropRect(side, cell, bounds)
  };
}

export function getImageDrawRect(image = {}, cell = {}, fit = 'contain', options = {}) {
  const x = Number(cell.x) || 0;
  const y = Number(cell.y) || 0;
  const width = Math.max(1, Number(cell.width) || 1);
  const height = Math.max(1, Number(cell.imageHeight ?? cell.height) || 1);
  if (fit === 'stretch') return applyImageGridViewTransform({ x, y, width, height }, image, cell, options);
  const imageRatio = Math.max(0.0001, (Number(image.width) || 1) / Math.max(1, Number(image.height) || 1));
  const cellRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;
  if (fit === 'contain' ? imageRatio > cellRatio : imageRatio < cellRatio) {
    drawHeight = drawWidth / imageRatio;
  } else {
    drawWidth = drawHeight * imageRatio;
  }
  return applyImageGridViewTransform({
    x: Number((x + ((width - drawWidth) / 2)).toFixed(3)),
    y: Number((y + ((height - drawHeight) / 2)).toFixed(3)),
    width: Number(drawWidth.toFixed(3)),
    height: Number(drawHeight.toFixed(3))
  }, image, cell, options);
}

function applyImageGridViewTransform(rect, image = {}, cell = {}, options = {}) {
  const zoom = clampNumber(image.zoom, 1, 0.25, 6) * clampNumber(options.globalZoom, 1, 0.25, 6);
  const offsetX = clampNumber(image.offsetX, 0, -1, 1);
  const offsetY = clampNumber(image.offsetY, 0, -1, 1);
  if (zoom === 1 && offsetX === 0 && offsetY === 0) return rect;
  const cellX = Number(cell.x) || 0;
  const cellY = Number(cell.y) || 0;
  const cellWidth = Math.max(1, Number(cell.width) || 1);
  const cellHeight = Math.max(1, Number(cell.imageHeight ?? cell.height) || 1);
  const width = rect.width * zoom;
  const height = rect.height * zoom;
  const centerX = cellX + (cellWidth / 2) + (offsetX * cellWidth);
  const centerY = cellY + (cellHeight / 2) + (offsetY * cellHeight);
  return {
    x: Number((centerX - (width / 2)).toFixed(3)),
    y: Number((centerY - (height / 2)).toFixed(3)),
    width: Number(width.toFixed(3)),
    height: Number(height.toFixed(3))
  };
}

function normalizeAnnotationPoint(point = {}) {
  return {
    x: roundMetric(point.x),
    y: roundMetric(point.y)
  };
}

export function normalizeImageGridAnnotation(input = {}) {
  const type = ANNOTATION_TYPES.has(input.type) ? input.type : 'pen';
  const points = Array.isArray(input.points)
    ? input.points.map(normalizeAnnotationPoint).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    : [];
  const x = roundMetric(input.x ?? points[0]?.x ?? 0);
  const y = roundMetric(input.y ?? points[0]?.y ?? 0);
  const width = Math.max(1, roundMetric(Math.abs(Number(input.width ?? ((input.x2 ?? x) - x)) || 1)));
  const height = Math.max(1, roundMetric(Math.abs(Number(input.height ?? ((input.y2 ?? y) - y)) || 1)));
  return {
    id: String(input.id || `annotation-${Date.now()}`),
    type,
    x,
    y,
    width,
    height,
    x2: roundMetric(input.x2 ?? (x + width)),
    y2: roundMetric(input.y2 ?? (y + height)),
    points,
    text: String(input.text || ''),
    color: normalizeHex(input.color, '#ffffff'),
    lineWidth: clampInteger(input.lineWidth, 4, 1, 80),
    rotation: normalizeAngle(input.rotation)
  };
}

function rotatedBounds(bounds, rotation) {
  const angle = normalizeAngle(rotation);
  if (!angle) return bounds;
  const radians = angle * (Math.PI / 180);
  const centerX = bounds.x + (bounds.width / 2);
  const centerY = bounds.y + (bounds.height / 2);
  const corners = [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { x: bounds.x, y: bounds.y + bounds.height }
  ].map((point) => {
    const dx = point.x - centerX;
    const dy = point.y - centerY;
    return {
      x: centerX + (dx * Math.cos(radians)) - (dy * Math.sin(radians)),
      y: centerY + (dx * Math.sin(radians)) + (dy * Math.cos(radians))
    };
  });
  const left = Math.min(...corners.map((point) => point.x));
  const top = Math.min(...corners.map((point) => point.y));
  const right = Math.max(...corners.map((point) => point.x));
  const bottom = Math.max(...corners.map((point) => point.y));
  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top
  };
}

export function getImageGridAnnotationBounds(annotation = {}) {
  const item = normalizeImageGridAnnotation(annotation);
  const inset = item.lineWidth / 2;
  let bounds;
  if (item.type === 'pen' && item.points.length) {
    const left = Math.min(...item.points.map((point) => point.x));
    const top = Math.min(...item.points.map((point) => point.y));
    const right = Math.max(...item.points.map((point) => point.x));
    const bottom = Math.max(...item.points.map((point) => point.y));
    bounds = {
      x: left,
      y: top,
      width: Math.max(1, right - left),
      height: Math.max(1, bottom - top)
    };
  } else if (item.type === 'arrow') {
    const left = Math.min(item.x, item.x2);
    const top = Math.min(item.y, item.y2);
    const right = Math.max(item.x, item.x2);
    const bottom = Math.max(item.y, item.y2);
    bounds = {
      x: left,
      y: top,
      width: Math.max(1, right - left),
      height: Math.max(1, bottom - top)
    };
  } else if (item.type === 'text') {
    const fontSize = Math.max(12, item.lineWidth * 6);
    bounds = {
      x: item.x,
      y: item.y - fontSize,
      width: Math.max(item.width, String(item.text || 'Text').length * fontSize * 0.58),
      height: fontSize * 1.35
    };
  } else {
    bounds = {
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height
    };
  }
  const rotated = rotatedBounds(bounds, item.rotation);
  return {
    x: roundMetric(rotated.x - inset),
    y: roundMetric(rotated.y - inset),
    width: roundMetric(rotated.width + item.lineWidth),
    height: roundMetric(rotated.height + item.lineWidth)
  };
}

export function reorderImageGridItems(items = [], sourceId, targetId, placement = 'before') {
  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const targetIndex = items.findIndex((item) => item.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return [...items];
  const next = [...items];
  const [source] = next.splice(sourceIndex, 1);
  const nextTargetIndex = next.findIndex((item) => item.id === targetId);
  const insertionIndex = placement === 'after' ? nextTargetIndex + 1 : nextTargetIndex;
  next.splice(Math.max(0, insertionIndex), 0, source);
  return next;
}

export function moveImageGridItemToIndex(items = [], sourceId, insertionIndex = 0) {
  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  if (sourceIndex < 0) return [...items];
  const next = [...items];
  const [source] = next.splice(sourceIndex, 1);
  const clampedIndex = Math.max(0, Math.min(items.length, Math.round(Number(insertionIndex) || 0)));
  const adjustedIndex = sourceIndex < clampedIndex ? clampedIndex - 1 : clampedIndex;
  next.splice(Math.max(0, Math.min(next.length, adjustedIndex)), 0, source);
  return next;
}

export function getImageGridExportExtension(format) {
  if (format === 'image/jpeg') return 'jpg';
  if (format === 'image/webp') return 'webp';
  return 'png';
}

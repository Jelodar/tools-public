import { setupDragAndDrop } from '../ui/drag-drop.js';
import { downloadFile, showToast } from '../ui/ui-utils.js';
import {
  IMAGE_GRID_RATIO_PRESETS,
  DEFAULT_IMAGE_GRID_PRESET_ID,
  buildImageGridLayoutTree,
  calculateImageGridLayout,
  getImageGridAnnotationBounds,
  getImageGridExportSizeForRatio,
  getImageDrawRect,
  getImageGridCanvasDropTarget,
  getImageGridCanvasResizeHandles,
  getImageGridExportExtension,
  getImageGridLayoutCellBounds,
  getImageGridTreeLeafIds,
  insertImageGridTreeRelative,
  normalizeImageGridAnnotation,
  normalizeImageGridSettings,
  moveImageGridItemToIndex,
  removeImageGridTreeIds,
  reorderImageGridItems,
  resolveImageGridPreset,
  resizeImageGridTreeSplit,
  syncImageGridLayoutTree,
  toggleImageGridTreeSplitAtLeaf
} from '../utils/image-grid.js';

let container = null;
let cleanup = [];
let images = [];
let nextImageId = 1;
let draggingImageId = null;
let layoutTree = null;
let selectedImageId = null;
let replacingImageId = null;
let globalZoom = 1;
let drawings = [];
let nextDrawingId = 1;
let selectedDrawingId = null;
let drawingMode = 'select';
let drawingDrag = null;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function normalizeCanvasPoint(point = {}) {
  return {
    x: Number((Number(point.x) || 0).toFixed(3)),
    y: Number((Number(point.y) || 0).toFixed(3))
  };
}

function getRatioSettings() {
  const presetId = container.querySelector('#image-grid-preset')?.value;
  if (presetId && presetId !== 'custom') {
    const preset = resolveImageGridPreset(presetId);
    return {
      ratioWidth: preset.ratioWidth,
      ratioHeight: preset.ratioHeight
    };
  }
  return {
    ratioWidth: container.querySelector('#image-grid-ratio-width')?.value,
    ratioHeight: container.querySelector('#image-grid-ratio-height')?.value
  };
}

function setCustomRatio(ratioWidth, ratioHeight) {
  const preset = container.querySelector('#image-grid-preset');
  const widthInput = container.querySelector('#image-grid-ratio-width');
  const heightInput = container.querySelector('#image-grid-ratio-height');
  if (preset) preset.value = 'custom';
  if (widthInput) widthInput.value = String(Number(Math.max(1, Math.min(999, ratioWidth)).toFixed(3)));
  if (heightInput) heightInput.value = String(Number(Math.max(1, Math.min(999, ratioHeight)).toFixed(3)));
}

function getSettings() {
  const ratio = getRatioSettings();
  const exportSize = getImageGridExportSizeForRatio(ratio.ratioWidth, ratio.ratioHeight);
  return normalizeImageGridSettings({
    ratioWidth: ratio.ratioWidth,
    ratioHeight: ratio.ratioHeight,
    width: exportSize.width,
    height: exportSize.height,
    gap: container.querySelector('#image-grid-gap')?.value,
    padding: container.querySelector('#image-grid-padding')?.value,
    background: container.querySelector('#image-grid-background')?.value,
    gapColor: container.querySelector('#image-grid-gap-color')?.value,
    fit: container.querySelector('#image-grid-fit')?.value,
    radius: container.querySelector('#image-grid-radius')?.value,
    layoutMode: container.querySelector('#image-grid-layout-mode')?.value,
    globalZoom,
    outputFormat: container.querySelector('#image-grid-output-format')?.value,
    quality: container.querySelector('#image-grid-quality')?.value
  });
}

function getCanvas() {
  return container.querySelector('#image-grid-canvas');
}

function getCanvasShell() {
  return container.querySelector('.image-grid-canvas-shell');
}

function getStageLayer() {
  return container.querySelector('#image-grid-stage-layer');
}

function getStatus() {
  return container.querySelector('#image-grid-status');
}

function setStatus(message, tone = 'neutral') {
  const status = getStatus();
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function getTreeMode(settings = getSettings()) {
  if (settings.layoutMode === 'stack' || settings.layoutMode === 'side-by-side' || settings.layoutMode === 'masonry') {
    return settings.layoutMode;
  }
  return null;
}

function imageAspect(image) {
  return Math.max(0.0001, (Number(image?.width) || 1) / Math.max(1, Number(image?.height) || 1));
}

function syncLayoutTree(settings = getSettings()) {
  const mode = getTreeMode(settings);
  if (!images.length) {
    layoutTree = null;
    return null;
  }
  if (!mode) return null;
  layoutTree = syncImageGridLayoutTree(layoutTree, images, {
    mode,
    targetRatio: settings.width / Math.max(1, settings.height)
  });
  return layoutTree;
}

function rebuildLayoutTree(mode = getTreeMode()) {
  if (!images.length || !mode) {
    layoutTree = null;
    return;
  }
  const settings = getSettings();
  layoutTree = buildImageGridLayoutTree(images, {
    mode,
    targetRatio: settings.width / Math.max(1, settings.height)
  });
}

function applyTreeOrderToImages() {
  const ids = getImageGridTreeLeafIds(layoutTree);
  if (!ids.length) return;
  const byId = new Map(images.map((image) => [image.id, image]));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
  const remaining = images.filter((image) => !ids.includes(image.id));
  images = [...ordered, ...remaining];
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function getDrawingControls() {
  return {
    tool: container?.querySelector('#image-grid-drawing-tool'),
    color: container?.querySelector('#image-grid-drawing-color'),
    width: container?.querySelector('#image-grid-drawing-width'),
    rotation: container?.querySelector('#image-grid-drawing-rotation'),
    text: container?.querySelector('#image-grid-drawing-text'),
    delete: container?.querySelector('#image-grid-drawing-delete')
  };
}

function getDrawingSettings() {
  const controls = getDrawingControls();
  return {
    color: controls.color?.value || '#ffffff',
    lineWidth: clampNumber(controls.width?.value, 4, 1, 80),
    rotation: clampNumber(controls.rotation?.value, 0, 0, 359),
    text: controls.text?.value || 'Text'
  };
}

function getSelectedDrawing() {
  return drawings.find((drawing) => drawing.id === selectedDrawingId) || null;
}

function updateDrawingById(id, updater) {
  drawings = drawings.map((drawing) => {
    if (drawing.id !== id) return drawing;
    return normalizeImageGridAnnotation(updater({
      ...drawing,
      points: drawing.points.map((point) => ({ ...point }))
    }));
  });
}

function syncDrawingControls() {
  const controls = getDrawingControls();
  const drawing = getSelectedDrawing();
  if (controls.delete) controls.delete.disabled = !drawing;
  if (!drawing) return;
  if (controls.color) controls.color.value = drawing.color;
  if (controls.width) controls.width.value = drawing.lineWidth;
  if (controls.rotation) controls.rotation.value = Math.round(drawing.rotation);
  if (controls.text && drawing.type === 'text') controls.text.value = drawing.text || '';
}

function syncDrawingModeClass() {
  container?.classList.toggle('is-image-grid-drawing', drawingMode !== 'select');
  container?.classList.toggle('has-selected-drawing', Boolean(selectedDrawingId));
  syncDrawingControls();
}

function selectDrawing(id) {
  selectedDrawingId = drawings.some((drawing) => drawing.id === id) ? id : null;
  if (selectedDrawingId) selectedImageId = null;
  syncDrawingModeClass();
  renderCanvas();
}

function clearDrawingSelection() {
  if (!selectedDrawingId) return;
  selectedDrawingId = null;
  syncDrawingModeClass();
  renderCanvas();
}

function createDrawingId() {
  const id = `grid-drawing-${nextDrawingId}`;
  nextDrawingId += 1;
  return id;
}

function normalizeDraftBox(start, end) {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  return {
    x,
    y,
    width: Math.max(1, Math.abs(end.x - start.x)),
    height: Math.max(1, Math.abs(end.y - start.y))
  };
}

function getAnnotationCenter(annotation) {
  if (annotation.type === 'arrow') {
    return {
      x: (annotation.x + annotation.x2) / 2,
      y: (annotation.y + annotation.y2) / 2
    };
  }
  const bounds = getImageGridAnnotationBounds(annotation);
  return {
    x: bounds.x + (bounds.width / 2),
    y: bounds.y + (bounds.height / 2)
  };
}

function applyCanvasAnnotationRotation(ctx, annotation, draw) {
  const rotation = Number(annotation.rotation) || 0;
  if (!rotation) {
    draw();
    return;
  }
  const center = getAnnotationCenter(annotation);
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(rotation * (Math.PI / 180));
  ctx.translate(-center.x, -center.y);
  draw();
  ctx.restore();
}

function drawCanvasArrow(ctx, annotation) {
  const headSize = Math.max(10, annotation.lineWidth * 3.6);
  const angle = Math.atan2(annotation.y2 - annotation.y, annotation.x2 - annotation.x);
  ctx.beginPath();
  ctx.moveTo(annotation.x, annotation.y);
  ctx.lineTo(annotation.x2, annotation.y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(annotation.x2, annotation.y2);
  ctx.lineTo(
    annotation.x2 - (Math.cos(angle - Math.PI / 7) * headSize),
    annotation.y2 - (Math.sin(angle - Math.PI / 7) * headSize)
  );
  ctx.lineTo(
    annotation.x2 - (Math.cos(angle + Math.PI / 7) * headSize),
    annotation.y2 - (Math.sin(angle + Math.PI / 7) * headSize)
  );
  ctx.closePath();
  ctx.fill();
}

function drawCanvasAnnotation(ctx, annotation) {
  const item = normalizeImageGridAnnotation(annotation);
  ctx.save();
  ctx.strokeStyle = item.color;
  ctx.fillStyle = item.color;
  ctx.lineWidth = item.lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  applyCanvasAnnotationRotation(ctx, item, () => {
    if (item.type === 'pen') {
      if (item.points.length < 2) return;
      ctx.beginPath();
      item.points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    } else if (item.type === 'rectangle') {
      ctx.strokeRect(item.x, item.y, item.width, item.height);
    } else if (item.type === 'circle') {
      ctx.beginPath();
      ctx.ellipse(item.x + (item.width / 2), item.y + (item.height / 2), item.width / 2, item.height / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (item.type === 'arrow') {
      drawCanvasArrow(ctx, item);
    } else if (item.type === 'text') {
      const fontSize = Math.max(12, item.lineWidth * 6);
      ctx.font = `${fontSize}px ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(item.text || 'Text', item.x, item.y);
    }
  });
  ctx.restore();
}

function drawAnnotationsToCanvas(ctx) {
  drawings.forEach((drawing) => drawCanvasAnnotation(ctx, drawing));
}

function annotationBoundsUnion() {
  if (!drawings.length) return null;
  const bounds = drawings.map(getImageGridAnnotationBounds);
  const left = Math.min(...bounds.map((entry) => entry.x));
  const top = Math.min(...bounds.map((entry) => entry.y));
  const right = Math.max(...bounds.map((entry) => entry.x + entry.width));
  const bottom = Math.max(...bounds.map((entry) => entry.y + entry.height));
  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top
  };
}

function syncCanvasViewport(settings) {
  const canvas = getCanvas();
  const shell = getCanvasShell();
  if (!canvas || !shell) return;
  canvas.dataset.width = String(settings.width);
  canvas.dataset.height = String(settings.height);
  const shellWidth = shell.clientWidth || shell.getBoundingClientRect().width || 320;
  const shellHeight = shell.clientHeight || shell.getBoundingClientRect().height || 420;
  const inset = shellWidth < 520 || shellHeight < 520 ? 20 : 32;
  const maxWidth = Math.max(120, shellWidth - inset);
  const maxHeight = Math.max(120, shellHeight - inset);
  const ratio = settings.width / Math.max(1, settings.height);
  let displayWidth = maxWidth;
  let displayHeight = maxWidth / ratio;
  if (displayHeight > maxHeight) {
    displayHeight = maxHeight;
    displayWidth = maxHeight * ratio;
  }
  const left = Math.max(0, (shellWidth - displayWidth) / 2);
  const top = Math.max(0, (shellHeight - displayHeight) / 2);
  canvas.style.width = `${Math.round(displayWidth)}px`;
  canvas.style.height = `${Math.round(displayHeight)}px`;
  canvas.style.left = `${Math.round(left)}px`;
  canvas.style.top = `${Math.round(top)}px`;
}

function getCurrentLayout(settings = getSettings()) {
  const activeTree = syncLayoutTree(settings);
  return calculateImageGridLayout({ images, settings, layoutTree: activeTree });
}

function getCanvasDrawBounds(layout, settings, trimToCells) {
  if (!trimToCells || !layout?.cells?.length) {
    return {
      x: 0,
      y: 0,
      width: settings.width,
      height: settings.height
    };
  }
  const cellBounds = getImageGridLayoutCellBounds(layout);
  const drawingBounds = annotationBoundsUnion();
  const bounds = drawingBounds ? {
    x: Math.min(cellBounds.x, drawingBounds.x),
    y: Math.min(cellBounds.y, drawingBounds.y),
    width: Math.max(cellBounds.x + cellBounds.width, drawingBounds.x + drawingBounds.width) - Math.min(cellBounds.x, drawingBounds.x),
    height: Math.max(cellBounds.y + cellBounds.height, drawingBounds.y + drawingBounds.height) - Math.min(cellBounds.y, drawingBounds.y)
  } : cellBounds;
  const x = Math.max(0, Math.floor(bounds.x));
  const y = Math.max(0, Math.floor(bounds.y));
  const right = Math.min(settings.width, Math.ceil(bounds.x + bounds.width));
  const bottom = Math.min(settings.height, Math.ceil(bounds.y + bounds.height));
  return {
    x,
    y,
    width: Math.max(1, right - x),
    height: Math.max(1, bottom - y)
  };
}

function drawLayoutToCanvas(canvas, layout, settings, options = {}) {
  const ctx = canvas.getContext('2d');
  const bounds = getCanvasDrawBounds(layout, settings, options.trimToCells === true);
  canvas.width = bounds.width;
  canvas.height = bounds.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, bounds.width, bounds.height);
  ctx.fillStyle = settings.gapColor;
  ctx.fillRect(0, 0, bounds.width, bounds.height);
  ctx.translate(-bounds.x, -bounds.y);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  layout.cells.forEach((cell) => {
    const image = cell.image;
    ctx.save();
    if (settings.radius > 0) {
      drawRoundedRect(ctx, cell.x, cell.y, cell.width, cell.height, settings.radius);
      ctx.clip();
    }
    ctx.fillStyle = settings.background;
    ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
    const rect = getImageDrawRect(image, cell, settings.fit, { globalZoom: settings.globalZoom });
    ctx.drawImage(image.bitmap, rect.x, rect.y, rect.width, rect.height);
    ctx.restore();
  });
  drawAnnotationsToCanvas(ctx);
}

function renderExportCanvas() {
  const canvas = getCanvas();
  if (!canvas) return null;
  const settings = getSettings();
  const layout = getCurrentLayout(settings);
  drawLayoutToCanvas(canvas, layout, settings, { trimToCells: true });
  syncCanvasViewport(settings);
  return canvas;
}

function renderCanvas() {
  const canvas = getCanvas();
  if (!canvas) return;
  const settings = getSettings();
  syncCanvasViewport(settings);
  if (!images.length) {
    renderInteractiveStage({ cells: [] }, settings);
    setStatus('Import images to build a grid.');
    return;
  }

  const layout = getCurrentLayout(settings);
  renderInteractiveStage(layout, settings);
  const layoutLabel = layout.layoutType === 'tree' ? `${layout.columns} columns / ${layout.rows} rows` : `${layout.columns}x${layout.rows}`;
  setStatus(`${images.length} image${images.length === 1 ? '' : 's'} tiled, ${layoutLabel}.`, 'success');
}

function revokeImage(image, collection = images) {
  if (!image) return;
  const stillUsed = collection.some((entry) => entry.id !== image.id && entry.url === image.url);
  if (!stillUsed && image.url) URL.revokeObjectURL(image.url);
  if (!stillUsed) image.bitmap?.close?.();
}

function revokeAllImages() {
  const urls = new Set();
  const bitmaps = new Set();
  images.forEach((image) => {
    if (image.url && !urls.has(image.url)) {
      URL.revokeObjectURL(image.url);
      urls.add(image.url);
    }
    if (image.bitmap && !bitmaps.has(image.bitmap)) {
      image.bitmap.close?.();
      bitmaps.add(image.bitmap);
    }
  });
}

function hasImageFileDrag(dataTransfer) {
  if (!dataTransfer) return false;
  return Array.from(dataTransfer.types || []).includes('Files');
}

function getCanvasDropPoint(event) {
  const canvas = getCanvas();
  const rect = canvas?.getBoundingClientRect();
  if (!canvas || !rect || rect.width <= 0 || rect.height <= 0) return null;
  const canvasWidth = Number(canvas.dataset.width) || getSettings().width;
  const canvasHeight = Number(canvas.dataset.height) || getSettings().height;
  return {
    x: (event.clientX - rect.left) * (canvasWidth / rect.width),
    y: (event.clientY - rect.top) * (canvasHeight / rect.height),
    canvasRect: rect,
    canvasWidth,
    canvasHeight
  };
}

function getCurrentCanvasDropTarget(event) {
  const point = getCanvasDropPoint(event);
  if (!point) return null;
  const settings = getSettings();
  const layout = calculateImageGridLayout({ images, settings, layoutTree: syncLayoutTree(settings) });
  return {
    ...getImageGridCanvasDropTarget({
      layout,
      x: point.x,
      y: point.y,
      settings,
      itemCount: images.length
    }),
    point
  };
}

function applyCanvasDropSettingsPatch(patch = {}) {
  const layoutMode = container.querySelector('#image-grid-layout-mode');
  if (patch.layoutMode && layoutMode) layoutMode.value = patch.layoutMode;
}

function renderCanvasDropIndicator(target) {
  const shell = getCanvasShell();
  const canvas = getCanvas();
  const indicator = container.querySelector('#image-grid-drop-indicator');
  if (!shell || !canvas || !indicator || !target?.point) return;
  const shellRect = shell.getBoundingClientRect();
  const canvasRect = target.point.canvasRect;
  const scaleX = canvasRect.width / Math.max(1, target.point.canvasWidth);
  const scaleY = canvasRect.height / Math.max(1, target.point.canvasHeight);
  indicator.hidden = false;
  indicator.textContent = target.label;
  indicator.style.left = `${canvasRect.left - shellRect.left + (target.rect.x * scaleX)}px`;
  indicator.style.top = `${canvasRect.top - shellRect.top + (target.rect.y * scaleY)}px`;
  indicator.style.width = `${Math.max(8, target.rect.width * scaleX)}px`;
  indicator.style.height = `${Math.max(8, target.rect.height * scaleY)}px`;
  indicator.dataset.side = target.side;
  shell.classList.add('is-canvas-drop');
}

function clearCanvasDropIndicator() {
  const shell = getCanvasShell();
  const indicator = container?.querySelector('#image-grid-drop-indicator');
  shell?.classList.remove('is-canvas-drop');
  if (!indicator) return;
  indicator.hidden = true;
  indicator.textContent = '';
  indicator.removeAttribute('data-side');
}

function clampImageZoom(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  return Math.max(0.25, Math.min(6, number));
}

function applyStageImageGeometry(imageElement, cell, settings, scaleX, scaleY) {
  const rect = getImageDrawRect(cell.image, cell, settings.fit, { globalZoom: settings.globalZoom });
  imageElement.style.left = `${(rect.x - cell.x) * scaleX}px`;
  imageElement.style.top = `${(rect.y - cell.y) * scaleY}px`;
  imageElement.style.width = `${rect.width * scaleX}px`;
  imageElement.style.height = `${rect.height * scaleY}px`;
  imageElement.style.transform = 'none';
  imageElement.style.objectFit = 'fill';
}

function getSvgRotation(annotation) {
  const rotation = Number(annotation.rotation) || 0;
  if (!rotation) return '';
  const center = getAnnotationCenter(annotation);
  return ` transform="rotate(${rotation} ${center.x} ${center.y})"`;
}

function arrowHeadPoints(annotation) {
  const headSize = Math.max(10, annotation.lineWidth * 3.6);
  const angle = Math.atan2(annotation.y2 - annotation.y, annotation.x2 - annotation.x);
  return [
    [annotation.x2, annotation.y2],
    [
      annotation.x2 - (Math.cos(angle - Math.PI / 7) * headSize),
      annotation.y2 - (Math.sin(angle - Math.PI / 7) * headSize)
    ],
    [
      annotation.x2 - (Math.cos(angle + Math.PI / 7) * headSize),
      annotation.y2 - (Math.sin(angle + Math.PI / 7) * headSize)
    ]
  ].map((point) => `${Number(point[0].toFixed(3))},${Number(point[1].toFixed(3))}`).join(' ');
}

function renderAnnotationShape(annotation) {
  const item = normalizeImageGridAnnotation(annotation);
  const selectedClass = item.id === selectedDrawingId ? ' is-selected' : '';
  const common = `class="image-grid-annotation-item${selectedClass}" data-image-grid-drawing="${escapeHtml(item.id)}" stroke="${escapeHtml(item.color)}" stroke-width="${item.lineWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"${getSvgRotation(item)}`;
  if (item.type === 'pen') {
    const points = item.points.map((point) => `${point.x},${point.y}`).join(' ');
    return `<polyline ${common} points="${escapeHtml(points)}"></polyline>`;
  }
  if (item.type === 'rectangle') {
    return `<rect ${common} x="${item.x}" y="${item.y}" width="${item.width}" height="${item.height}"></rect>`;
  }
  if (item.type === 'circle') {
    return `<ellipse ${common} cx="${item.x + (item.width / 2)}" cy="${item.y + (item.height / 2)}" rx="${item.width / 2}" ry="${item.height / 2}"></ellipse>`;
  }
  if (item.type === 'arrow') {
    return `
      <g class="image-grid-annotation-item${selectedClass}" data-image-grid-drawing="${escapeHtml(item.id)}"${getSvgRotation(item)}>
        <line x1="${item.x}" y1="${item.y}" x2="${item.x2}" y2="${item.y2}" stroke="${escapeHtml(item.color)}" stroke-width="${item.lineWidth}" stroke-linecap="round"></line>
        <polygon points="${arrowHeadPoints(item)}" fill="${escapeHtml(item.color)}"></polygon>
      </g>
    `;
  }
  const fontSize = Math.max(12, item.lineWidth * 6);
  return `<text class="image-grid-annotation-item${selectedClass}" data-image-grid-drawing="${escapeHtml(item.id)}" x="${item.x}" y="${item.y}" fill="${escapeHtml(item.color)}" font-size="${fontSize}" font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"${getSvgRotation(item)}>${escapeHtml(item.text || 'Text')}</text>`;
}

function renderAnnotationHandles(annotation) {
  const item = normalizeImageGridAnnotation(annotation);
  if (item.id !== selectedDrawingId) return '';
  const bounds = getImageGridAnnotationBounds(item);
  const size = Math.max(18, Math.min(42, Math.max(bounds.width, bounds.height) * 0.035));
  const half = size / 2;
  const handles = [
    ['nw', bounds.x, bounds.y],
    ['ne', bounds.x + bounds.width, bounds.y],
    ['se', bounds.x + bounds.width, bounds.y + bounds.height],
    ['sw', bounds.x, bounds.y + bounds.height]
  ];
  return `
    <rect class="image-grid-annotation-selection" data-image-grid-drawing="${escapeHtml(item.id)}" x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}"></rect>
    ${handles.map(([handle, x, y]) => `<rect class="image-grid-annotation-handle" data-image-grid-drawing-handle="${handle}" data-image-grid-drawing="${escapeHtml(item.id)}" x="${x - half}" y="${y - half}" width="${size}" height="${size}"></rect>`).join('')}
  `;
}

function renderAnnotationLayer(settings) {
  const annotationMarkup = drawings.map((drawing) => `${renderAnnotationShape(drawing)}${renderAnnotationHandles(drawing)}`).join('');
  return `
    <svg id="image-grid-annotation-layer" class="image-grid-annotation-layer" viewBox="0 0 ${settings.width} ${settings.height}" preserveAspectRatio="none">
      ${annotationMarkup}
    </svg>
  `;
}

function renderFreeSpaceResizers(layout, settings) {
  return getImageGridCanvasResizeHandles(layout, settings).map((handle) => `
    <button class="image-grid-free-space-resizer" type="button" data-image-grid-canvas-resize="${escapeHtml(handle.kind)}"></button>
  `).join('');
}

function renderInteractiveStage(layout = null, settings = null) {
  const stage = getStageLayer();
  const canvas = getCanvas();
  const shell = getCanvasShell();
  if (!stage || !canvas || !shell) return;
  const activeSettings = settings || getSettings();
  const activeLayout = layout || calculateImageGridLayout({ images, settings: activeSettings });
  const canvasRect = canvas.getBoundingClientRect();
  const shellRect = shell.getBoundingClientRect();
  stage.style.left = `${canvasRect.left - shellRect.left}px`;
  stage.style.top = `${canvasRect.top - shellRect.top}px`;
  stage.style.width = `${canvasRect.width}px`;
  stage.style.height = `${canvasRect.height}px`;
  stage.style.backgroundColor = activeSettings.gapColor;
  if (!activeLayout.cells.length || canvasRect.width <= 0 || canvasRect.height <= 0) {
    stage.innerHTML = '';
    return;
  }
  const scaleX = canvasRect.width / Math.max(1, activeSettings.width);
  const scaleY = canvasRect.height / Math.max(1, activeSettings.height);
  const cellMarkup = activeLayout.cells.map((cell) => `
    <div class="image-grid-cell${selectedImageId === cell.id ? ' is-selected' : ''}" data-image-grid-cell="${escapeHtml(cell.id)}">
      <div class="image-grid-cell-clip">
        <img src="${escapeHtml(cell.image.url)}" alt="">
      </div>
      <div class="image-grid-cell-toolbar">
        <button class="mini-btn" type="button" draggable="true" data-image-grid-cell-move="${escapeHtml(cell.id)}">Move</button>
        <button class="mini-btn" type="button" data-image-grid-cell-action="split-row" data-image-grid-id="${escapeHtml(cell.id)}">Row</button>
        <button class="mini-btn" type="button" data-image-grid-cell-action="split-column" data-image-grid-id="${escapeHtml(cell.id)}">Column</button>
        <button class="mini-btn" type="button" data-image-grid-cell-action="flip" data-image-grid-id="${escapeHtml(cell.id)}">Flip</button>
        <button class="mini-btn" type="button" data-image-grid-cell-action="replace" data-image-grid-id="${escapeHtml(cell.id)}">Replace</button>
        <button class="mini-btn" type="button" data-image-grid-cell-action="paste" data-image-grid-id="${escapeHtml(cell.id)}">Paste</button>
        <button class="mini-btn" type="button" data-image-grid-cell-action="reset" data-image-grid-id="${escapeHtml(cell.id)}">Reset</button>
        <button class="mini-btn danger" type="button" data-image-grid-cell-action="delete" data-image-grid-id="${escapeHtml(cell.id)}">Delete</button>
      </div>
    </div>
  `).join('');
  const splitMarkup = (activeLayout.splits || []).map((split) => `
    <div class="image-grid-split-resizer" data-image-grid-split="${escapeHtml(split.id)}" data-direction="${escapeHtml(split.direction)}"></div>
  `).join('');
  const freeSpaceMarkup = renderFreeSpaceResizers(activeLayout, activeSettings);
  stage.innerHTML = `${cellMarkup}${splitMarkup}${freeSpaceMarkup}${renderAnnotationLayer(activeSettings)}`;
  activeLayout.cells.forEach((cell) => {
    const node = stage.querySelector(`[data-image-grid-cell="${cell.id}"]`);
    if (!node) return;
    node.style.left = `${cell.x * scaleX}px`;
    node.style.top = `${cell.y * scaleY}px`;
    node.style.width = `${cell.width * scaleX}px`;
    node.style.height = `${cell.imageHeight * scaleY}px`;
    node.style.backgroundColor = activeSettings.background;
    node.style.borderColor = selectedImageId === cell.id ? 'var(--accent-color)' : activeSettings.gapColor;
    node.classList.toggle('is-compact-cell', (cell.width * scaleX) < 220 || (cell.imageHeight * scaleY) < 96);
    node.classList.toggle('is-toolbar-right', cell.x + (cell.width / 2) > activeSettings.width * 0.55);
    node.classList.toggle('is-toolbar-bottom', cell.y < activeSettings.height * 0.16);
    const image = node.querySelector('img');
    applyStageImageGeometry(image, cell, activeSettings, scaleX, scaleY);
  });
  (activeLayout.splits || []).forEach((split) => {
    const node = stage.querySelector(`[data-image-grid-split="${split.id}"]`);
    if (!node) return;
    const isRow = split.direction === 'row';
    const visualWidth = isRow ? Math.max(8, split.width * scaleX) : split.width * scaleX;
    const visualHeight = isRow ? split.height * scaleY : Math.max(8, split.height * scaleY);
    const left = isRow ? (split.x * scaleX) - (visualWidth / 2) : split.x * scaleX;
    const top = isRow ? split.y * scaleY : (split.y * scaleY) - (visualHeight / 2);
    node.style.left = `${left}px`;
    node.style.top = `${top}px`;
    node.style.width = `${Math.max(8, visualWidth)}px`;
    node.style.height = `${Math.max(8, visualHeight)}px`;
  });
  getImageGridCanvasResizeHandles(activeLayout, activeSettings).forEach((handle) => {
    const node = stage.querySelector(`[data-image-grid-canvas-resize="${handle.kind}"]`);
    if (!node) return;
    node.style.left = `${handle.x * scaleX}px`;
    node.style.top = `${handle.y * scaleY}px`;
    node.style.width = `${Math.max(12, handle.width * scaleX)}px`;
    node.style.height = `${Math.max(12, handle.height * scaleY)}px`;
  });
  bindInteractiveStageCells(stage, activeLayout);
  bindInteractiveStageSplits(stage, activeLayout);
  bindFreeSpaceResizers(stage);
  bindAnnotationLayer(stage);
}

function updateImageById(id, updater) {
  images = images.map((image) => (image.id === id ? updater({ ...image }) : image));
}

function selectImage(id) {
  selectedImageId = images.some((image) => image.id === id) ? id : null;
  if (selectedImageId) selectedDrawingId = null;
  syncDrawingModeClass();
  syncZoomControl();
  getStageLayer()?.querySelectorAll('[data-image-grid-cell]').forEach((node) => {
    node.classList.toggle('is-selected', node.dataset.imageGridCell === selectedImageId);
  });
}

function deselectImage() {
  if (!selectedImageId) return;
  selectedImageId = null;
  syncZoomControl();
  getStageLayer()?.querySelectorAll('[data-image-grid-cell]').forEach((node) => {
    node.classList.remove('is-selected');
  });
}

function syncZoomControl() {
  const slider = container?.querySelector('#image-grid-zoom');
  const label = container?.querySelector('#image-grid-zoom-label');
  const readout = container?.querySelector('#image-grid-zoom-readout');
  if (!slider || !label || !readout) return;
  const image = images.find((entry) => entry.id === selectedImageId);
  const value = image ? clampImageZoom(image.zoom) : clampImageZoom(globalZoom);
  slider.value = value;
  label.textContent = image ? 'Image Zoom' : 'Canvas Zoom';
  readout.textContent = `${value.toFixed(2)}x`;
}

function updateSelectedZoom(value) {
  const zoom = clampImageZoom(value);
  const image = images.find((entry) => entry.id === selectedImageId);
  if (image) {
    image.zoom = zoom;
  } else {
    globalZoom = zoom;
  }
  syncZoomControl();
  renderCanvas();
}

function startCellImagePan(event, cell) {
  const image = images.find((entry) => entry.id === cell.id);
  if (!image || event.button !== 0) return;
  event.preventDefault();
  const node = event.currentTarget;
  const img = node.querySelector('img');
  const canvas = getCanvas();
  const canvasRect = canvas?.getBoundingClientRect();
  if (!canvasRect || canvasRect.width <= 0 || canvasRect.height <= 0) return;
  const scaleX = canvasRect.width / Math.max(1, getSettings().width);
  const scaleY = canvasRect.height / Math.max(1, getSettings().height);
  const startX = event.clientX;
  const startY = event.clientY;
  const startOffsetX = Number(image.offsetX) || 0;
  const startOffsetY = Number(image.offsetY) || 0;
  const width = Math.max(1, cell.width * scaleX);
  const height = Math.max(1, cell.imageHeight * scaleY);
  node.setPointerCapture?.(event.pointerId);
  const move = (moveEvent) => {
    image.offsetX = Math.max(-1, Math.min(1, startOffsetX + ((moveEvent.clientX - startX) / width)));
    image.offsetY = Math.max(-1, Math.min(1, startOffsetY + ((moveEvent.clientY - startY) / height)));
    if (img) {
      applyStageImageGeometry(img, cell, getSettings(), scaleX, scaleY);
    }
  };
  const end = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', end);
    window.removeEventListener('pointercancel', end);
    renderCanvas();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
}

function canvasPointFromPointer(event, settings = getSettings()) {
  const canvas = getCanvas();
  const rect = canvas?.getBoundingClientRect();
  if (!canvas || !rect || rect.width <= 0 || rect.height <= 0) return null;
  return {
    x: (event.clientX - rect.left) * (settings.width / rect.width),
    y: (event.clientY - rect.top) * (settings.height / rect.height)
  };
}

function resizeImageGridCanvasRatio(kind, point, start) {
  const nextWidth = kind === 'right' || kind === 'corner'
    ? start.ratioWidth + (((point.x - start.point.x) / Math.max(1, start.settings.width)) * start.ratioWidth)
    : start.ratioWidth;
  const nextHeight = kind === 'bottom' || kind === 'corner'
    ? start.ratioHeight + (((point.y - start.point.y) / Math.max(1, start.settings.height)) * start.ratioHeight)
    : start.ratioHeight;
  setCustomRatio(nextWidth, nextHeight);
  renderCanvas();
}

function bindFreeSpaceResizers(stage) {
  stage.querySelectorAll('[data-image-grid-canvas-resize]').forEach((handle) => {
    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      const point = canvasPointFromPointer(event);
      if (!point) return;
      event.preventDefault();
      event.stopPropagation();
      handle.setPointerCapture?.(event.pointerId);
      const ratio = getRatioSettings();
      const start = {
        point,
        settings: getSettings(),
        ratioWidth: clampNumber(ratio.ratioWidth, 9, 1, 999),
        ratioHeight: clampNumber(ratio.ratioHeight, 16, 1, 999)
      };
      const kind = handle.dataset.imageGridCanvasResize;
      const move = (moveEvent) => {
        const nextPoint = canvasPointFromPointer(moveEvent, start.settings);
        if (!nextPoint) return;
        resizeImageGridCanvasRatio(kind, nextPoint, start);
      };
      const end = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
        setStatus('Canvas ratio updated.', 'success');
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
    });
  });
}

function translateDrawing(drawing, dx, dy) {
  if (drawing.type === 'pen') {
    return {
      ...drawing,
      points: drawing.points.map((point) => ({
        x: point.x + dx,
        y: point.y + dy
      }))
    };
  }
  if (drawing.type === 'arrow') {
    return {
      ...drawing,
      x: drawing.x + dx,
      y: drawing.y + dy,
      x2: drawing.x2 + dx,
      y2: drawing.y2 + dy
    };
  }
  return {
    ...drawing,
    x: drawing.x + dx,
    y: drawing.y + dy
  };
}

function resizeBoundsFromHandle(startBounds, handle, point) {
  const left = handle.includes('w') ? point.x : startBounds.x;
  const right = handle.includes('e') ? point.x : startBounds.x + startBounds.width;
  const top = handle.includes('n') ? point.y : startBounds.y;
  const bottom = handle.includes('s') ? point.y : startBounds.y + startBounds.height;
  return {
    x: Math.min(left, right),
    y: Math.min(top, bottom),
    width: Math.max(1, Math.abs(right - left)),
    height: Math.max(1, Math.abs(bottom - top))
  };
}

function resizeDrawingToBounds(drawing, startBounds, nextBounds) {
  if (drawing.type === 'pen') {
    const scaleX = nextBounds.width / Math.max(1, startBounds.width);
    const scaleY = nextBounds.height / Math.max(1, startBounds.height);
    return {
      ...drawing,
      points: drawing.points.map((point) => ({
        x: nextBounds.x + ((point.x - startBounds.x) * scaleX),
        y: nextBounds.y + ((point.y - startBounds.y) * scaleY)
      }))
    };
  }
  if (drawing.type === 'arrow') {
    const scaleX = nextBounds.width / Math.max(1, startBounds.width);
    const scaleY = nextBounds.height / Math.max(1, startBounds.height);
    return {
      ...drawing,
      x: nextBounds.x + ((drawing.x - startBounds.x) * scaleX),
      y: nextBounds.y + ((drawing.y - startBounds.y) * scaleY),
      x2: nextBounds.x + ((drawing.x2 - startBounds.x) * scaleX),
      y2: nextBounds.y + ((drawing.y2 - startBounds.y) * scaleY)
    };
  }
  return {
    ...drawing,
    ...nextBounds,
    x2: nextBounds.x + nextBounds.width,
    y2: nextBounds.y + nextBounds.height
  };
}

function startDrawingMove(event, drawing) {
  const start = canvasPointFromPointer(event);
  if (!start) return;
  const original = {
    ...drawing,
    points: drawing.points.map((point) => ({ ...point }))
  };
  drawingDrag = { type: 'move', id: drawing.id };
  event.currentTarget.setPointerCapture?.(event.pointerId);
  const move = (moveEvent) => {
    const point = canvasPointFromPointer(moveEvent);
    if (!point) return;
    updateDrawingById(drawing.id, () => translateDrawing(original, point.x - start.x, point.y - start.y));
    renderCanvas();
  };
  const end = () => {
    drawingDrag = null;
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', end);
    window.removeEventListener('pointercancel', end);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
}

function startDrawingResize(event, drawing, handle) {
  const startBounds = getImageGridAnnotationBounds(drawing);
  const original = {
    ...drawing,
    points: drawing.points.map((point) => ({ ...point }))
  };
  drawingDrag = { type: 'resize', id: drawing.id, handle };
  event.currentTarget.setPointerCapture?.(event.pointerId);
  const move = (moveEvent) => {
    const point = canvasPointFromPointer(moveEvent);
    if (!point) return;
    updateDrawingById(drawing.id, () => resizeDrawingToBounds(original, startBounds, resizeBoundsFromHandle(startBounds, handle, point)));
    renderCanvas();
  };
  const end = () => {
    drawingDrag = null;
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', end);
    window.removeEventListener('pointercancel', end);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
}

function startNewDrawing(event, layer) {
  if (drawingMode === 'select') return;
  const start = canvasPointFromPointer(event);
  if (!start) return;
  event.preventDefault();
  event.stopPropagation();
  const settings = getDrawingSettings();
  const id = createDrawingId();
  if (drawingMode === 'text') {
    drawings.push(normalizeImageGridAnnotation({
      id,
      type: 'text',
      x: start.x,
      y: start.y,
      width: Math.max(1, settings.text.length * settings.lineWidth * 3.5),
      height: Math.max(16, settings.lineWidth * 8),
      color: settings.color,
      lineWidth: settings.lineWidth,
      rotation: settings.rotation,
      text: settings.text
    }));
    selectDrawing(id);
    setStatus('Text added.', 'success');
    return;
  }
  const draft = normalizeImageGridAnnotation({
    id,
    type: drawingMode,
    x: start.x,
    y: start.y,
    x2: start.x,
    y2: start.y,
    width: 1,
    height: 1,
    points: [start],
    color: settings.color,
    lineWidth: settings.lineWidth,
    rotation: settings.rotation
  });
  drawings.push(draft);
  selectedDrawingId = id;
  drawingDrag = { type: 'create', id };
  layer.setPointerCapture?.(event.pointerId);
  const move = (moveEvent) => {
    const point = canvasPointFromPointer(moveEvent);
    if (!point) return;
    updateDrawingById(id, (drawing) => {
      if (drawingMode === 'pen') {
        const last = drawing.points.at(-1);
        if (last && Math.hypot(point.x - last.x, point.y - last.y) < 2) return drawing;
        return {
          ...drawing,
          points: [...drawing.points, normalizeCanvasPoint(point)]
        };
      }
      if (drawingMode === 'arrow') {
        return {
          ...drawing,
          x: start.x,
          y: start.y,
          x2: point.x,
          y2: point.y,
          width: Math.abs(point.x - start.x),
          height: Math.abs(point.y - start.y)
        };
      }
      return {
        ...drawing,
        ...normalizeDraftBox(start, point)
      };
    });
    renderCanvas();
  };
  const end = () => {
    drawingDrag = null;
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', end);
    window.removeEventListener('pointercancel', end);
    selectDrawing(id);
    setStatus('Drawing added.', 'success');
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
}

function bindAnnotationLayer(stage) {
  const layer = stage.querySelector('#image-grid-annotation-layer');
  if (!layer) return;
  layer.addEventListener('pointerdown', (event) => {
    const handleNode = event.target.closest?.('[data-image-grid-drawing-handle]');
    const drawingNode = event.target.closest?.('[data-image-grid-drawing]');
    if (handleNode) {
      const drawing = drawings.find((entry) => entry.id === handleNode.dataset.imageGridDrawing);
      if (!drawing) return;
      event.preventDefault();
      event.stopPropagation();
      selectedDrawingId = drawing.id;
      syncDrawingModeClass();
      startDrawingResize(event, drawing, handleNode.dataset.imageGridDrawingHandle);
      return;
    }
    if (drawingNode && drawingNode !== layer) {
      const drawing = drawings.find((entry) => entry.id === drawingNode.dataset.imageGridDrawing);
      if (!drawing) return;
      event.preventDefault();
      event.stopPropagation();
      selectedDrawingId = drawing.id;
      selectedImageId = null;
      syncDrawingModeClass();
      renderCanvas();
      startDrawingMove(event, drawing);
      return;
    }
    startNewDrawing(event, layer);
  });
}

function bindInteractiveStageSplits(stage, activeLayout) {
  const splitById = new Map((activeLayout?.splits || []).map((split) => [split.id, split]));
  stage.querySelectorAll('[data-image-grid-split]').forEach((handle) => {
    handle.addEventListener('pointerdown', (event) => {
      const split = splitById.get(handle.dataset.imageGridSplit);
      if (!split || !layoutTree) return;
      event.preventDefault();
      event.stopPropagation();
      handle.setPointerCapture?.(event.pointerId);
      const settings = getSettings();
      const updateRatio = (moveEvent) => {
        const point = canvasPointFromPointer(moveEvent, settings);
        if (!point) return;
        const available = split.direction === 'row'
          ? Math.max(1, split.parentWidth - settings.gap)
          : Math.max(1, split.parentHeight - settings.gap);
        const rawRatio = split.direction === 'row'
          ? (point.x - split.parentX) / available
          : (point.y - split.parentY) / available;
        layoutTree = resizeImageGridTreeSplit(layoutTree, split.id, rawRatio);
        renderCanvas();
      };
      const end = () => {
        window.removeEventListener('pointermove', updateRatio);
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
      };
      window.addEventListener('pointermove', updateRatio);
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
    });
  });
}

function splitGridAtCell(id, axis) {
  const settings = getSettings();
  const layout = calculateImageGridLayout({ images, settings, layoutTree: syncLayoutTree(settings) });
  const cell = layout.cells.find((entry) => entry.id === id);
  if (!cell) return;
  const treeMode = getTreeMode(settings);
  if (treeMode) {
    const source = images.find((image) => image.id === id);
    if (!source) return;
    const clone = {
      ...source,
      id: `grid-image-${nextImageId}`,
      name: `${source.name} copy`
    };
    nextImageId += 1;
    images.push(clone);
    layoutTree = insertImageGridTreeRelative(syncLayoutTree(settings), {
      sourceId: clone.id,
      sourceAspect: imageAspect(clone),
      targetId: id,
      side: axis === 'row' ? 'bottom' : 'right'
    });
    applyTreeOrderToImages();
    selectImage(clone.id);
    renderImageList();
    renderCanvas();
    setStatus(axis === 'row' ? 'Frame stacked.' : 'Frame added beside.', 'success');
    return;
  }
  if (axis === 'row') {
    applyCanvasDropSettingsPatch({
      layoutMode: 'rows',
      rows: Math.min(12, Math.max(settings.rows, layout.rows + 1))
    });
    setStatus('Row added from selected image.', 'success');
  } else {
    applyCanvasDropSettingsPatch({
      layoutMode: 'columns',
      columns: Math.min(12, Math.max(settings.columns, layout.columns + 1))
    });
    setStatus('Column added from selected image.', 'success');
  }
  renderCanvas();
}

function bindInteractiveStageCells(stage, activeLayout) {
  const cellById = new Map((activeLayout?.cells || []).map((cell) => [cell.id, cell]));
  stage.querySelectorAll('[data-image-grid-cell]').forEach((cellNode) => {
    cellNode.addEventListener('dragstart', (event) => {
      draggingImageId = cellNode.dataset.imageGridCell;
      event.dataTransfer?.setData('text/plain', draggingImageId);
      event.dataTransfer?.setData('application/x-image-grid-id', draggingImageId);
      cellNode.classList.add('is-cell-dragging');
    });
    cellNode.addEventListener('dragend', () => {
      draggingImageId = null;
      cellNode.classList.remove('is-cell-dragging');
      clearCanvasDropIndicator();
    });
    cellNode.addEventListener('pointerdown', (event) => {
      if (event.target.closest('button')) return;
      const id = cellNode.dataset.imageGridCell;
      selectImage(id);
      const cell = cellById.get(id);
      if (cell) startCellImagePan(event, cell);
    });
    cellNode.addEventListener('dragover', (event) => {
      if (!draggingImageId) return;
      event.preventDefault();
      const target = getCurrentCanvasDropTarget(event);
      if (target) renderCanvasDropIndicator(target);
    });
    cellNode.addEventListener('drop', (event) => {
      if (!draggingImageId) return;
      event.preventDefault();
      const target = getCurrentCanvasDropTarget(event);
      clearCanvasDropIndicator();
      if (!target) return;
      if (getTreeMode()) {
        const source = images.find((image) => image.id === draggingImageId);
        layoutTree = insertImageGridTreeRelative(syncLayoutTree(), {
          sourceId: draggingImageId,
          sourceAspect: imageAspect(source),
          targetId: target.targetId,
          side: target.side
        });
        applyTreeOrderToImages();
      } else {
        applyCanvasDropSettingsPatch(target.settingsPatch);
        images = moveImageGridItemToIndex(images, draggingImageId, target.insertionIndex);
      }
      renderImageList();
      renderCanvas();
      setStatus(`${target.label}.`, 'success');
    });
    cellNode.addEventListener('wheel', (event) => {
      event.preventDefault();
      const id = cellNode.dataset.imageGridCell;
      updateImageById(id, (image) => ({
        ...image,
        zoom: clampImageZoom((image.zoom || 1) * (event.deltaY < 0 ? 1.12 : 0.88))
      }));
      renderCanvas();
      syncZoomControl();
      setStatus('Image zoom updated.', 'success');
    });
  });
  stage.querySelectorAll('[data-image-grid-cell-move]').forEach((button) => {
    button.addEventListener('dragstart', (event) => {
      draggingImageId = button.dataset.imageGridCellMove;
      event.dataTransfer?.setData('text/plain', draggingImageId);
      event.dataTransfer?.setData('application/x-image-grid-id', draggingImageId);
    });
  });
  stage.querySelectorAll('[data-image-grid-cell-action]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const id = button.dataset.imageGridId;
      const action = button.dataset.imageGridCellAction;
      if (action === 'delete') {
        const image = images.find((entry) => entry.id === id);
        const nextImages = images.filter((entry) => entry.id !== id);
        revokeImage(image, nextImages);
        images = nextImages;
        layoutTree = removeImageGridTreeIds(layoutTree, new Set([id]));
        if (selectedImageId === id) selectedImageId = null;
        renderImageList();
        renderCanvas();
        syncZoomControl();
        setStatus('Image deleted.', 'success');
      } else if (action === 'reset') {
        updateImageById(id, (image) => ({ ...image, zoom: 1, offsetX: 0, offsetY: 0 }));
        renderCanvas();
        setStatus('Image view reset.', 'success');
      } else if (action === 'replace') {
        replacingImageId = id;
        container.querySelector('#image-grid-replace-input')?.click();
      } else if (action === 'paste') {
        replaceFromClipboard(id);
      } else if (action === 'flip') {
        layoutTree = toggleImageGridTreeSplitAtLeaf(syncLayoutTree(), id);
        applyTreeOrderToImages();
        renderImageList();
        renderCanvas();
        setStatus('Split flipped.', 'success');
      } else if (action === 'split-row') {
        splitGridAtCell(id, 'row');
      } else if (action === 'split-column') {
        splitGridAtCell(id, 'column');
      }
    });
  });
}

function renderImageList() {
  const list = container.querySelector('#image-grid-list');
  if (!list) return;
  list.innerHTML = images.length
    ? images.map((image, index) => `
      <div class="image-grid-item" draggable="true" data-image-grid-item="${escapeHtml(image.id)}">
        <img src="${escapeHtml(image.url)}" alt="">
        <div class="image-grid-item-copy">
          <strong>${escapeHtml(image.name)}</strong>
          <span>${image.width}x${image.height} · ${index + 1}</span>
        </div>
        <div class="image-grid-item-actions">
          <button class="mini-btn" type="button" data-image-grid-move="up" data-image-grid-id="${escapeHtml(image.id)}" ${index === 0 ? 'disabled' : ''}>Up</button>
          <button class="mini-btn" type="button" data-image-grid-move="down" data-image-grid-id="${escapeHtml(image.id)}" ${index === images.length - 1 ? 'disabled' : ''}>Down</button>
          <button class="mini-btn danger" type="button" data-image-grid-remove="${escapeHtml(image.id)}">Delete</button>
        </div>
      </div>
    `).join('')
    : '<div class="image-grid-empty">No images imported.</div>';
  list.querySelectorAll('[data-image-grid-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.imageGridRemove;
      const image = images.find((entry) => entry.id === id);
      const nextImages = images.filter((entry) => entry.id !== id);
      revokeImage(image, nextImages);
      images = nextImages;
      layoutTree = removeImageGridTreeIds(layoutTree, new Set([id]));
      if (selectedImageId === id) selectedImageId = null;
      renderImageList();
      renderCanvas();
      syncZoomControl();
    });
  });
  list.querySelectorAll('[data-image-grid-move]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.imageGridId;
      const index = images.findIndex((entry) => entry.id === id);
      const direction = button.dataset.imageGridMove === 'up' ? -1 : 1;
      const target = images[index + direction];
      if (!target) return;
      images = reorderImageGridItems(images, id, target.id, direction > 0 ? 'after' : 'before');
      if (getTreeMode()) rebuildLayoutTree(getTreeMode());
      renderImageList();
      renderCanvas();
      setStatus('Order updated.', 'success');
    });
  });
  list.querySelectorAll('[data-image-grid-item]').forEach((item) => {
    item.addEventListener('dragstart', (event) => {
      draggingImageId = item.dataset.imageGridItem;
      event.dataTransfer?.setData('text/plain', item.dataset.imageGridItem);
      event.dataTransfer?.setData('application/x-image-grid-id', item.dataset.imageGridItem);
      item.classList.add('is-dragging');
    });
    item.addEventListener('dragend', () => {
      draggingImageId = null;
      item.classList.remove('is-dragging');
      list.querySelectorAll('.is-drop-before, .is-drop-after').forEach((node) => node.classList.remove('is-drop-before', 'is-drop-after'));
      clearCanvasDropIndicator();
    });
    item.addEventListener('dragover', (event) => {
      const sourceId = draggingImageId;
      if (!sourceId || sourceId === item.dataset.imageGridItem) return;
      event.preventDefault();
      const rect = item.getBoundingClientRect();
      const after = event.clientY > rect.top + (rect.height / 2);
      item.classList.toggle('is-drop-before', !after);
      item.classList.toggle('is-drop-after', after);
    });
    item.addEventListener('dragleave', () => {
      item.classList.remove('is-drop-before', 'is-drop-after');
    });
    item.addEventListener('drop', (event) => {
      const sourceId = event.dataTransfer?.getData('application/x-image-grid-id') || event.dataTransfer?.getData('text/plain');
      const targetId = item.dataset.imageGridItem;
      if (!sourceId || !targetId || sourceId === targetId) return;
      event.preventDefault();
      const rect = item.getBoundingClientRect();
      const placement = event.clientY > rect.top + (rect.height / 2) ? 'after' : 'before';
      images = reorderImageGridItems(images, sourceId, targetId, placement);
      if (getTreeMode()) rebuildLayoutTree(getTreeMode());
      renderImageList();
      renderCanvas();
      setStatus('Order updated.', 'success');
    });
  });
}

async function bitmapFromFile(file) {
  if (typeof createImageBitmap === 'function') return createImageBitmap(file);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function replaceImageFile(id, file) {
  if (!id || !file || !String(file.type || '').startsWith('image/')) {
    setStatus('Choose an image file.', 'danger');
    return;
  }
  try {
    const bitmap = await bitmapFromFile(file);
    const url = URL.createObjectURL(file);
    const oldImage = images.find((entry) => entry.id === id);
    images = images.map((image) => (image.id === id ? {
      ...image,
      name: file.name || image.name,
      url,
      bitmap,
      width: bitmap.width || bitmap.naturalWidth || 1,
      height: bitmap.height || bitmap.naturalHeight || 1,
      zoom: 1,
      offsetX: 0,
      offsetY: 0
    } : image));
    revokeImage(oldImage, images);
    layoutTree = syncImageGridLayoutTree(layoutTree, images, {
      mode: getTreeMode() || 'masonry',
      targetRatio: getSettings().width / Math.max(1, getSettings().height)
    });
    selectedImageId = id;
    renderImageList();
    renderCanvas();
    syncZoomControl();
    setStatus('Image replaced.', 'success');
  } catch (error) {
    setStatus(`Could not read ${file.name || 'image'}.`, 'danger');
  }
}

async function replaceFromClipboard(id) {
  try {
    if (!navigator.clipboard?.read) {
      setStatus('Clipboard image read is unavailable.', 'danger');
      return;
    }
    const items = await navigator.clipboard.read();
    for (const item of items) {
      const imageType = item.types.find((type) => type.startsWith('image/'));
      if (!imageType) continue;
      const blob = await item.getType(imageType);
      await replaceImageFile(id, new File([blob], `clipboard-${Date.now()}.${imageType.split('/').pop() || 'png'}`, { type: imageType }));
      return;
    }
    setStatus('No image found in clipboard.', 'danger');
  } catch (error) {
    showToast(`Clipboard import failed: ${error.message}`, 'danger');
    setStatus('Clipboard import failed.', 'danger');
  }
}

async function addFiles(files, options = {}) {
  const imageFiles = Array.from(files || []).filter((file) => String(file.type || '').startsWith('image/'));
  if (!imageFiles.length) {
    setStatus('Drop image files only.', 'danger');
    return;
  }
  setStatus('Reading images...');
  const loaded = [];
  for (const file of imageFiles) {
    try {
      const bitmap = await bitmapFromFile(file);
      const url = URL.createObjectURL(file);
      loaded.push({
        id: `grid-image-${nextImageId}`,
        name: file.name || `Image ${nextImageId}`,
        url,
        bitmap,
        width: bitmap.width || bitmap.naturalWidth || 1,
        height: bitmap.height || bitmap.naturalHeight || 1,
        zoom: 1,
        offsetX: 0,
        offsetY: 0
      });
      nextImageId += 1;
    } catch (error) {
      setStatus(`Could not read ${file.name || 'image'}.`, 'danger');
    }
  }
  if (!loaded.length) return;
  const settings = getSettings();
  const treeMode = getTreeMode(settings);
  if (treeMode) {
    layoutTree = syncLayoutTree(settings) || buildImageGridLayoutTree(images, {
      mode: treeMode,
      targetRatio: settings.width / Math.max(1, settings.height)
    });
    loaded.forEach((image, index) => {
      images.push(image);
      layoutTree = insertImageGridTreeRelative(layoutTree, {
        sourceId: image.id,
        sourceAspect: imageAspect(image),
        targetId: index === 0 ? options.targetId : loaded[index - 1].id,
        side: index === 0 ? options.side || 'right' : 'right'
      });
    });
    if (!layoutTree) {
      layoutTree = buildImageGridLayoutTree(images, {
        mode: treeMode,
        targetRatio: settings.width / Math.max(1, settings.height)
      });
    }
    applyTreeOrderToImages();
  } else if (Number.isFinite(options.insertIndex)) {
    if (options.layoutPatch) applyCanvasDropSettingsPatch(options.layoutPatch);
    const insertIndex = Math.max(0, Math.min(images.length, Math.round(options.insertIndex)));
    images.splice(insertIndex, 0, ...loaded);
  } else {
    if (options.layoutPatch) applyCanvasDropSettingsPatch(options.layoutPatch);
    images.push(...loaded);
  }
  renderImageList();
  renderCanvas();
  clearCanvasDropIndicator();
}

function canvasToBlob(type = 'image/png', quality = 1) {
  const canvas = renderExportCanvas();
  return new Promise((resolve, reject) => {
    if (!canvas) {
      reject(new Error('Canvas export failed.'));
      return;
    }
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas export failed.'));
    }, type, quality);
  });
}

async function exportPng() {
  if (!images.length) {
    setStatus('Import images before export.', 'danger');
    return;
  }
  const settings = getSettings();
  const blob = await canvasToBlob(settings.outputFormat, settings.quality);
  const extension = getImageGridExportExtension(settings.outputFormat);
  downloadFile(blob, `image_grid_${Date.now()}.${extension}`, settings.outputFormat);
  setStatus(`${extension.toUpperCase()} exported.`, 'success');
}

async function copyPng() {
  if (!images.length) {
    setStatus('Import images before copying.', 'danger');
    return;
  }
  try {
    const blob = await canvasToBlob('image/png', 1);
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    setStatus('Copied PNG to clipboard.', 'success');
  } catch (error) {
    showToast(`Copy failed: ${error.message}`, 'danger');
    setStatus('Clipboard copy failed.', 'danger');
  }
}

async function importClipboardImages() {
  try {
    if (!navigator.clipboard?.read) {
      setStatus('Clipboard image read is unavailable.', 'danger');
      return;
    }
    const items = await navigator.clipboard.read();
    const files = [];
    for (const item of items) {
      const imageType = item.types.find((type) => type.startsWith('image/'));
      if (!imageType) continue;
      const blob = await item.getType(imageType);
      files.push(new File([blob], `clipboard-${files.length + 1}.${imageType.split('/').pop() || 'png'}`, { type: imageType }));
    }
    if (!files.length) {
      setStatus('No image found in clipboard.', 'danger');
      return;
    }
    if (selectedImageId && files.length === 1) {
      await replaceImageFile(selectedImageId, files[0]);
    } else {
      await addFiles(files);
    }
  } catch (error) {
    showToast(`Clipboard import failed: ${error.message}`, 'danger');
    setStatus('Clipboard import failed.', 'danger');
  }
}

function resetGrid() {
  revokeAllImages();
  images = [];
  layoutTree = null;
  selectedImageId = null;
  drawings = [];
  selectedDrawingId = null;
  drawingMode = 'select';
  nextDrawingId = 1;
  const tool = container?.querySelector('#image-grid-drawing-tool');
  if (tool) tool.value = 'select';
  syncDrawingModeClass();
  renderImageList();
  renderCanvas();
  syncZoomControl();
}

function applyPreset(presetId) {
  if (!presetId || presetId === 'custom') return;
  const preset = resolveImageGridPreset(presetId);
  const ratioWidth = container.querySelector('#image-grid-ratio-width');
  const ratioHeight = container.querySelector('#image-grid-ratio-height');
  if (ratioWidth) ratioWidth.value = preset.ratioWidth;
  if (ratioHeight) ratioHeight.value = preset.ratioHeight;
  renderCanvas();
}

function sortImages(mode) {
  if (!images.length) return;
  if (mode === 'name') {
    images = [...images].sort((a, b) => a.name.localeCompare(b.name));
  } else if (mode === 'aspect') {
    images = [...images].sort((a, b) => (b.width / Math.max(1, b.height)) - (a.width / Math.max(1, a.height)));
  } else if (mode === 'reverse') {
    images = [...images].reverse();
  }
  if (getTreeMode()) rebuildLayoutTree(getTreeMode());
  renderImageList();
  renderCanvas();
  setStatus('Order updated.', 'success');
}

function fitImagesToFrames() {
  if (!images.length) {
    setStatus('Import images before fitting.', 'danger');
    return;
  }
  const targetIds = selectedImageId ? new Set([selectedImageId]) : new Set(images.map((image) => image.id));
  images = images.map((image) => (targetIds.has(image.id) ? {
    ...image,
    zoom: 1,
    offsetX: 0,
    offsetY: 0
  } : image));
  renderCanvas();
  syncZoomControl();
  setStatus(selectedImageId ? 'Image fitted.' : 'Images fitted.', 'success');
}

function applyLayoutPreset(mode) {
  const layoutMode = container.querySelector('#image-grid-layout-mode');
  if (layoutMode) layoutMode.value = mode;
  rebuildLayoutTree(mode);
  renderImageList();
  renderCanvas();
  setStatus(mode === 'stack' ? 'Stack layout applied.' : mode === 'side-by-side' ? 'Side-by-side layout applied.' : 'Masonry layout applied.', 'success');
}

function deleteSelectedDrawing() {
  if (!selectedDrawingId) return;
  drawings = drawings.filter((drawing) => drawing.id !== selectedDrawingId);
  selectedDrawingId = null;
  syncDrawingModeClass();
  renderCanvas();
  setStatus('Drawing deleted.', 'success');
}

function clearDrawings() {
  if (!drawings.length) return;
  drawings = [];
  selectedDrawingId = null;
  syncDrawingModeClass();
  renderCanvas();
  setStatus('Drawings cleared.', 'success');
}

function applySelectedDrawingControls() {
  const drawing = getSelectedDrawing();
  if (!drawing) return;
  const settings = getDrawingSettings();
  updateDrawingById(drawing.id, (entry) => ({
    ...entry,
    color: settings.color,
    lineWidth: settings.lineWidth,
    rotation: settings.rotation,
    text: entry.type === 'text' ? settings.text : entry.text
  }));
  renderCanvas();
}

function bindCanvasDrop() {
  const shell = getCanvasShell();
  if (!shell) return;

  shell.addEventListener('dragenter', (event) => {
    if (!hasImageFileDrag(event.dataTransfer) && !draggingImageId) return;
    event.preventDefault();
    const target = getCurrentCanvasDropTarget(event);
    if (target) renderCanvasDropIndicator(target);
  });

  shell.addEventListener('dragover', (event) => {
    if (!hasImageFileDrag(event.dataTransfer) && !draggingImageId) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = draggingImageId ? 'move' : 'copy';
    const target = getCurrentCanvasDropTarget(event);
    if (target) renderCanvasDropIndicator(target);
  });

  shell.addEventListener('dragleave', (event) => {
    if (shell.contains(event.relatedTarget)) return;
    clearCanvasDropIndicator();
  });

  shell.addEventListener('drop', async (event) => {
    if (!hasImageFileDrag(event.dataTransfer) && !draggingImageId) return;
    event.preventDefault();
    const target = getCurrentCanvasDropTarget(event);
    clearCanvasDropIndicator();
    if (!target) return;
    const files = event.dataTransfer?.files;
    if (files?.length) {
      await addFiles(files, {
        targetId: target.targetId,
        side: target.side,
        insertIndex: target.insertionIndex,
        layoutPatch: target.settingsPatch
      });
      setStatus(`${target.label}.`, 'success');
      return;
    }
    const sourceId = event.dataTransfer?.getData('application/x-image-grid-id') || event.dataTransfer?.getData('text/plain') || draggingImageId;
    if (!sourceId) return;
    if (getTreeMode()) {
      const source = images.find((image) => image.id === sourceId);
      layoutTree = insertImageGridTreeRelative(syncLayoutTree(), {
        sourceId,
        sourceAspect: imageAspect(source),
        targetId: target.targetId,
        side: target.side
      });
      applyTreeOrderToImages();
    } else {
      applyCanvasDropSettingsPatch(target.settingsPatch);
      images = moveImageGridItemToIndex(images, sourceId, target.insertionIndex);
    }
    renderImageList();
    renderCanvas();
    setStatus(`${target.label}.`, 'success');
  });
}

function bindControls() {
  const input = container.querySelector('#image-grid-input');
  const replaceInput = container.querySelector('#image-grid-replace-input');
  container.querySelector('#image-grid-import')?.addEventListener('click', () => input?.click());
  container.querySelector('#image-grid-drop')?.addEventListener('click', () => input?.click());
  input?.addEventListener('change', (event) => {
    addFiles(event.target.files);
    event.target.value = '';
  });
  replaceInput?.addEventListener('change', async (event) => {
    const targetId = replacingImageId || selectedImageId;
    replacingImageId = null;
    await replaceImageFile(targetId, event.target.files?.[0]);
    event.target.value = '';
  });

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
      if (selectedImageId && files.length === 1) {
        replaceImageFile(selectedImageId, files[0]);
      } else {
        addFiles(files);
      }
    }
  };
  window.addEventListener('paste', onPaste);
  cleanup.push(() => window.removeEventListener('paste', onPaste));

  const onKeydown = (event) => {
    if (event.key === 'Escape') {
      deselectImage();
      clearDrawingSelection();
    } else if ((event.key === 'Delete' || event.key === 'Backspace') && selectedDrawingId && !event.target.closest?.('input, textarea, select')) {
      event.preventDefault();
      deleteSelectedDrawing();
    }
  };
  window.addEventListener('keydown', onKeydown);
  cleanup.push(() => window.removeEventListener('keydown', onKeydown));
  const onResize = () => renderCanvas();
  window.addEventListener('resize', onResize);
  cleanup.push(() => window.removeEventListener('resize', onResize));

  container.querySelector('#image-grid-export')?.addEventListener('click', exportPng);
  container.querySelector('#image-grid-copy')?.addEventListener('click', copyPng);
  container.querySelector('#image-grid-read-clipboard')?.addEventListener('click', importClipboardImages);
  container.querySelector('#image-grid-reset')?.addEventListener('click', resetGrid);
  container.querySelector('#image-grid-preset')?.addEventListener('change', (event) => applyPreset(event.target.value));
  container.querySelector('#image-grid-sort-name')?.addEventListener('click', () => sortImages('name'));
  container.querySelector('#image-grid-sort-aspect')?.addEventListener('click', () => sortImages('aspect'));
  container.querySelector('#image-grid-sort-reverse')?.addEventListener('click', () => sortImages('reverse'));
  container.querySelector('#image-grid-layout-stack')?.addEventListener('click', () => applyLayoutPreset('stack'));
  container.querySelector('#image-grid-layout-side-by-side')?.addEventListener('click', () => applyLayoutPreset('side-by-side'));
  container.querySelector('#image-grid-layout-masonry')?.addEventListener('click', () => applyLayoutPreset('masonry'));
  container.querySelector('#image-grid-fit-images')?.addEventListener('click', fitImagesToFrames);
  container.querySelector('#image-grid-layout-mode')?.addEventListener('change', (event) => {
    const mode = event.target.value;
    if (mode === 'stack' || mode === 'side-by-side' || mode === 'masonry') {
      rebuildLayoutTree(mode);
    } else {
      layoutTree = null;
    }
    renderImageList();
    renderCanvas();
  });
  container.querySelector('#image-grid-zoom')?.addEventListener('input', (event) => updateSelectedZoom(event.target.value));
  container.querySelector('#image-grid-zoom-reset')?.addEventListener('click', () => updateSelectedZoom(1));
  container.querySelector('#image-grid-drawing-tool')?.addEventListener('change', (event) => {
    drawingMode = event.target.value || 'select';
    syncDrawingModeClass();
    setStatus(drawingMode === 'select' ? 'Drawing select active.' : 'Draw on the canvas.', 'success');
  });
  container.querySelectorAll('#image-grid-drawing-color, #image-grid-drawing-width, #image-grid-drawing-rotation, #image-grid-drawing-text').forEach((control) => {
    control.addEventListener('input', applySelectedDrawingControls);
    control.addEventListener('change', applySelectedDrawingControls);
  });
  container.querySelector('#image-grid-drawing-delete')?.addEventListener('click', deleteSelectedDrawing);
  container.querySelector('#image-grid-drawing-clear')?.addEventListener('click', clearDrawings);
  container.querySelectorAll('#image-grid-ratio-width, #image-grid-ratio-height').forEach((control) => {
    control.addEventListener('input', () => {
      const preset = container.querySelector('#image-grid-preset');
      if (preset) preset.value = 'custom';
    });
  });
  container.querySelectorAll('[data-image-grid-control]').forEach((control) => {
    control.addEventListener('input', renderCanvas);
    control.addEventListener('change', renderCanvas);
  });
  getCanvasShell()?.addEventListener('pointerdown', (event) => {
    if (event.target === getCanvasShell() || event.target === getCanvas() || event.target === getStageLayer()) deselectImage();
  });
  cleanup.push(setupDragAndDrop(container.querySelector('#image-grid-drop'), addFiles));
  bindCanvasDrop();
}

export async function mount(parent) {
  cleanup = [];
  images = [];
  nextImageId = 1;
  draggingImageId = null;
  drawings = [];
  nextDrawingId = 1;
  selectedDrawingId = null;
  drawingMode = 'select';
  drawingDrag = null;
  container = document.createElement('div');
  container.className = 'tool-image-grid';
  const defaultPreset = resolveImageGridPreset(DEFAULT_IMAGE_GRID_PRESET_ID);
  const presetOptions = IMAGE_GRID_RATIO_PRESETS.map((preset) => (
    `<option value="${escapeHtml(preset.id)}" ${preset.id === DEFAULT_IMAGE_GRID_PRESET_ID ? 'selected' : ''}>${escapeHtml(preset.label)}</option>`
  )).join('');
  container.innerHTML = `
    <div class="rj-layout image-grid-workbench">
      <section class="image-grid-panel image-grid-controls">
        <div class="tool-section-header">
          <div>
            <h2>Image Grid</h2>
            <p>Tile local images into one canvas.</p>
          </div>
          <button id="image-grid-import" class="btn-primary" type="button">Add Images</button>
        </div>
        <div id="image-grid-drop" class="image-grid-dropzone">
          <span>Drop images here</span>
          <input id="image-grid-input" class="hidden" type="file" accept="image/*" multiple>
          <input id="image-grid-replace-input" class="hidden" type="file" accept="image/*">
        </div>
        <div class="image-grid-actions">
          <button id="image-grid-read-clipboard" class="btn-secondary" type="button">Read Clipboard</button>
          <button id="image-grid-sort-name" class="btn-secondary" type="button">Sort Name</button>
          <button id="image-grid-sort-aspect" class="btn-secondary" type="button">Sort Aspect</button>
          <button id="image-grid-sort-reverse" class="btn-secondary" type="button">Reverse</button>
        </div>
        <div class="image-grid-actions">
          <button id="image-grid-layout-stack" class="btn-secondary" type="button">Stack</button>
          <button id="image-grid-layout-side-by-side" class="btn-secondary" type="button">Side by Side</button>
          <button id="image-grid-layout-masonry" class="btn-secondary" type="button">Masonry</button>
          <button id="image-grid-fit-images" class="btn-secondary" type="button">Fit Images</button>
        </div>
        <div class="settings-grid image-grid-settings">
          <div class="form-group">
            <label>Preset</label>
            <select id="image-grid-preset">
              <option value="custom">Custom</option>
              ${presetOptions}
            </select>
          </div>
          <div class="form-group">
            <label>Layout</label>
            <select id="image-grid-layout-mode" data-image-grid-control>
              <option value="masonry" selected>Masonry</option>
              <option value="stack">Stack</option>
              <option value="side-by-side">Side by Side</option>
            </select>
          </div>
          <div class="form-group"><label>Ratio X</label><input id="image-grid-ratio-width" data-image-grid-control type="number" min="1" max="999" step="0.01" value="${defaultPreset.ratioWidth}"></div>
          <div class="form-group"><label>Ratio Y</label><input id="image-grid-ratio-height" data-image-grid-control type="number" min="1" max="999" step="0.01" value="${defaultPreset.ratioHeight}"></div>
          <div class="form-group"><label>Gap</label><input id="image-grid-gap" data-image-grid-control type="number" min="0" max="240" step="1" value="0"></div>
          <div class="form-group"><label>Padding</label><input id="image-grid-padding" data-image-grid-control type="number" min="0" max="480" step="1" value="0"></div>
          <div class="form-group"><label>Background</label><input id="image-grid-background" data-image-grid-control type="color" value="#000000"></div>
          <div class="form-group"><label>Gap Color</label><input id="image-grid-gap-color" data-image-grid-control type="color" value="#000000"></div>
          <div class="form-group">
            <label>Fit</label>
            <select id="image-grid-fit" data-image-grid-control>
              <option value="contain" selected>Contain</option>
              <option value="cover">Cover</option>
              <option value="stretch">Stretch</option>
            </select>
          </div>
          <div class="form-group"><label>Corner</label><input id="image-grid-radius" data-image-grid-control type="number" min="0" max="160" step="1" value="0"></div>
          <div class="form-group image-grid-zoom-row">
            <label id="image-grid-zoom-label">Canvas Zoom</label>
            <input id="image-grid-zoom" type="range" min="0.25" max="6" step="0.01" value="1">
            <span id="image-grid-zoom-readout">1.00x</span>
            <button id="image-grid-zoom-reset" class="mini-btn" type="button">Reset</button>
          </div>
          <div class="form-group image-grid-drawing-row">
            <label>Draw</label>
            <select id="image-grid-drawing-tool">
              <option value="select" selected>Select</option>
              <option value="pen">Pen</option>
              <option value="rectangle">Rectangle</option>
              <option value="circle">Circle</option>
              <option value="arrow">Arrow</option>
              <option value="text">Text</option>
            </select>
          </div>
          <div class="form-group"><label>Line</label><input id="image-grid-drawing-color" type="color" value="#ffffff"></div>
          <div class="form-group"><label>Width</label><input id="image-grid-drawing-width" type="range" min="1" max="80" step="1" value="4"></div>
          <div class="form-group"><label>Angle</label><input id="image-grid-drawing-rotation" type="range" min="0" max="359" step="1" value="0"></div>
          <div class="form-group image-grid-drawing-text-row"><label>Text</label><input id="image-grid-drawing-text" type="text" value="Text"></div>
          <div class="form-group image-grid-drawing-actions">
            <button id="image-grid-drawing-delete" class="mini-btn danger" type="button" disabled>Delete Drawing</button>
            <button id="image-grid-drawing-clear" class="mini-btn" type="button">Clear Drawings</button>
          </div>
          <div class="form-group">
            <label>Format</label>
            <select id="image-grid-output-format" data-image-grid-control>
              <option value="image/png" selected>PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
          <div class="form-group"><label>Quality</label><input id="image-grid-quality" data-image-grid-control type="range" min="0.1" max="1" step="0.01" value="0.92"></div>
        </div>
        <div class="image-grid-actions">
          <button id="image-grid-export" class="btn-primary" type="button">Export Image</button>
          <button id="image-grid-copy" class="btn-secondary" type="button">Copy PNG</button>
          <button id="image-grid-reset" class="btn-secondary danger" type="button">Reset</button>
        </div>
        <div id="image-grid-status" class="image-grid-status">Import images to build a grid.</div>
        <div id="image-grid-list" class="image-grid-list"></div>
      </section>
      <section class="image-grid-panel image-grid-preview-panel">
        <div class="image-grid-canvas-shell">
          <canvas id="image-grid-canvas"></canvas>
          <div id="image-grid-stage-layer" class="image-grid-stage-layer"></div>
          <div id="image-grid-drop-indicator" class="image-grid-drop-indicator" hidden></div>
        </div>
      </section>
    </div>
  `;
  parent.appendChild(container);
  bindControls();
  syncDrawingModeClass();
  renderImageList();
  renderCanvas();
}

export function unmount() {
  cleanup.forEach((dispose) => dispose());
  cleanup = [];
  images.forEach(revokeImage);
  images = [];
  drawings = [];
  selectedDrawingId = null;
  drawingDrag = null;
  container?.remove();
  container = null;
}

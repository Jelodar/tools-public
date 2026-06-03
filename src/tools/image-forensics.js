import { setupDragAndDrop } from '../ui/drag-drop.js';
import { downloadFile, showToast } from '../ui/ui-utils.js';
import {
  FORENSIC_METADATA_EXTENSIONS,
  FORENSIC_MODES,
  analyzeJpegMarkers,
  buildCloneDetectionSettings,
  buildErrorLevelSettings,
  buildLevelSweepSettings,
  buildMagnifierSettings,
  buildMetadataRemovalPlan,
  buildPcaSettings,
  equalizeHistogramValue,
  extractReadableStrings,
  findEmbeddedJpegThumbnails,
  findGeoTagStrings,
  getAutoContrastValue,
  getForensicModeGroups,
  getForensicMode,
  getLuminance,
  getLuminanceGradient,
  getNoiseDelta,
  getPcaProjectionValue,
  getPreviewConversionPlan,
  summarizeForensicFile
} from '../utils/image-forensics.js';

let container = null;
let cleanup = [];
let sourceImage = null;
let sourceFile = null;
let sourceBytes = new Uint8Array();

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function drawToCanvas(canvas, image) {
  const limit = 1400;
  const scale = Math.min(1, limit / Math.max(image.width, image.height));
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return ctx;
}

function putImage(canvas, imageData) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.putImageData(imageData, 0, 0);
}

function copySourceToAnalysis(sourceCanvas, analysisCanvas) {
  analysisCanvas.width = sourceCanvas.width;
  analysisCanvas.height = sourceCanvas.height;
  const ctx = analysisCanvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, analysisCanvas.width, analysisCanvas.height);
  ctx.drawImage(sourceCanvas, 0, 0);
  return ctx;
}

function syncAnalysisBaseCanvas(sourceCanvas, baseCanvas) {
  return copySourceToAnalysis(sourceCanvas, baseCanvas);
}

function updateForensicModeMessage(mode) {
  const target = container?.querySelector('#forensic-mode-message');
  if (!target) return;
  target.textContent = `${mode.label}: ${mode.detail}`;
}

function switchForensicWorkspacePanel(panelId) {
  const target = panelId || 'visual';
  container?.querySelectorAll('[data-forensic-workspace-tab]').forEach((tab) => {
    tab.classList.toggle('active-mode', tab.dataset.forensicWorkspaceTab === target);
  });
  container?.querySelectorAll('[data-forensic-workspace-panel]').forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.forensicWorkspacePanel === target);
  });
  container?.querySelector(`[data-forensic-workspace-panel="${target}"]`)?.scrollIntoView?.({ block: 'center', inline: 'nearest' });
}

function getForensicWorkspaceForMode(modeId) {
  if (['metadata', 'strings', 'jpeg-analysis', 'geo-tags', 'thumbnail'].includes(modeId)) return 'evidence';
  if (modeId === 'clean-copy') return 'export';
  return 'visual';
}

function syncForensicModeTabs(modeId) {
  container?.querySelectorAll('[data-forensic-mode-tab]').forEach((button) => {
    button.classList.toggle('active-mode', button.dataset.forensicModeTab === modeId);
  });
}

function syncForensicModePanels(modeId) {
  container?.querySelectorAll('[data-forensic-mode-panel]').forEach((panel) => {
    const modeIds = String(panel.dataset.forensicModePanel || '').split(',');
    panel.classList.toggle('is-active', modeIds.includes(modeId));
  });
}

function getModeSection(modeId) {
  const map = {
    metadata: '#forensic-metadata-section',
    strings: '#forensic-strings-section',
    'jpeg-analysis': '#forensic-jpeg-section',
    'geo-tags': '#forensic-geo-section',
    thumbnail: '#forensic-thumbnail-section',
    'clean-copy': '#forensic-clean-section'
  };
  return container?.querySelector(map[modeId] || '#forensic-analysis-section');
}

function centerForensicSection(modeId) {
  getModeSection(modeId)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

async function loadBrowserVisibleImage(file, refs) {
  if (!file?.type?.startsWith('image/') && !/\.(avif|gif|heic|heif|jpe?g|png|tiff?|webp)$/i.test(file?.name || '')) return null;
  try {
    const converted = await convertUnsupportedImageForPreview(file);
    if (converted) {
      refs.status.textContent = `Converted ${file.name || 'source'} for browser preview.`;
      return loadBrowserVisibleImage(converted, refs);
    }
  } catch (error) {
    refs.status.textContent = `Preview conversion failed: ${error.message}`;
  }
  try {
    return await createImageBitmap(file);
  } catch {}
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = url;
    });
    refs.status.textContent = 'Image decoded through browser fallback.';
    return image;
  } catch {
    refs.status.textContent = 'This image format is not renderable by this browser. Metadata panels are still available.';
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function convertUnsupportedImageForPreview(file) {
  const plan = getPreviewConversionPlan(file);
  if (!plan) return null;
  if (plan.kind === 'heic') {
    const mod = await import('https://esm.sh/heic2any@0.0.4?bundle');
    const heic2any = mod.default || mod.heic2any || mod;
    if (typeof heic2any !== 'function') throw new Error('HEIC decoder is unavailable.');
    const result = await heic2any({
      blob: file,
      toType: 'image/png',
      quality: 0.92
    });
    const blob = Array.isArray(result) ? result[0] : result;
    const convertedName = String(file.name || 'image.heic').replace(/\.(heic|heif)$/i, '.png');
    return new File([blob], convertedName, { type: 'image/png' });
  }
  const mod = await import('https://esm.sh/utif@3.1.0?bundle');
  const utif = mod.default || mod;
  const buffer = await file.arrayBuffer();
  const ifds = utif.decode(buffer);
  const page = ifds?.[0];
  if (!page) throw new Error('TIFF decoder found no image pages.');
  utif.decodeImage(buffer, page);
  const rgba = utif.toRGBA8(page);
  const canvas = document.createElement('canvas');
  canvas.width = page.width;
  canvas.height = page.height;
  const ctx = canvas.getContext('2d');
  ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), page.width, page.height), 0, 0);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, plan.outputType));
  if (!blob) throw new Error('TIFF preview conversion failed.');
  const convertedName = String(file.name || 'image.tiff').replace(/\.(tif|tiff)$/i, '.png');
  return new File([blob], convertedName, { type: plan.outputType });
}

function updateForensicMagnifier(event, refs) {
  if (!refs.analysisCanvas.width || !refs.magnifier.width) return;
  const rect = refs.analysisCanvas.getBoundingClientRect();
  const x = Math.max(0, Math.min(refs.analysisCanvas.width - 1, ((event.clientX - rect.left) / Math.max(1, rect.width)) * refs.analysisCanvas.width));
  const y = Math.max(0, Math.min(refs.analysisCanvas.height - 1, ((event.clientY - rect.top) / Math.max(1, rect.height)) * refs.analysisCanvas.height));
  const ctx = refs.magnifier.getContext('2d', { willReadFrequently: true });
  const analysisCtx = refs.analysisCanvas.getContext('2d', { willReadFrequently: true });
  const pixelX = Math.round(x);
  const pixelY = Math.round(y);
  const rgba = analysisCtx.getImageData(pixelX, pixelY, 1, 1).data;
  const size = Math.max(18, Math.min(refs.analysisCanvas.width, refs.analysisCanvas.height) * 0.08);
  ctx.clearRect(0, 0, refs.magnifier.width, refs.magnifier.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    refs.analysisCanvas,
    Math.max(0, x - size / 2),
    Math.max(0, y - size / 2),
    Math.min(size, refs.analysisCanvas.width),
    Math.min(size, refs.analysisCanvas.height),
    0,
    0,
    refs.magnifier.width,
    refs.magnifier.height
  );
  refs.magnifier.style.setProperty('--forensic-magnifier-x', `${event.clientX - rect.left}px`);
  refs.magnifier.style.setProperty('--forensic-magnifier-y', `${event.clientY - rect.top}px`);
  refs.magnifier.classList.remove('hidden');
  updateForensicPixelReadout(pixelX, pixelY, rgba, refs);
}

function updateForensicPixelReadout(x, y, rgba, refs) {
  if (!refs.pixelReadout) return;
  refs.pixelReadout.textContent = `x ${x} / y ${y} / rgba ${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]}`;
}

function syncForensicUnderlay(refs) {
  if (!refs.analysisBaseCanvas || !refs.underlayOriginal) return;
  refs.analysisBaseCanvas.classList.toggle('is-hidden-underlay', !refs.underlayOriginal.checked);
}

function syncForensicStageAspect(refs) {
  const width = refs.analysisCanvas?.width || refs.sourceCanvas?.width || 16;
  const height = refs.analysisCanvas?.height || refs.sourceCanvas?.height || 10;
  refs.analysisStack?.style.setProperty('--forensic-stage-aspect', `${Math.max(1, width)} / ${Math.max(1, height)}`);
}

function setForensicViewMode(refs, mode) {
  const nextMode = mode === 'source' ? 'source' : 'analysis';
  refs.analysisStack?.classList.toggle('is-source-view', nextMode === 'source');
  refs.analysisStack?.classList.toggle('is-analysis-view', nextMode === 'analysis');
  container?.querySelectorAll('[data-forensic-view-mode]').forEach((button) => {
    button.classList.toggle('active-mode', button.dataset.forensicViewMode === nextMode);
  });
  if (refs.pixelReadout && nextMode === 'source') {
    refs.pixelReadout.textContent = 'Source view shown. Switch to analysis for pixel values.';
  } else if (refs.pixelReadout) {
    refs.pixelReadout.textContent = 'Move over the analysis image for pixel values.';
  }
}

function applyMagnifier(sourceCanvas, analysisCanvas, controls) {
  const settings = buildMagnifierSettings({
    enhancement: controls.magnifierEnhancement.value,
    autoContrast: controls.autoContrast.checked,
    autoContrastByChannel: controls.autoContrastChannel.checked,
    histogramEqualization: controls.histogramEqualization.checked,
    opacity: controls.opacity.value
  });
  const ctx = copySourceToAnalysis(sourceCanvas, analysisCanvas);
  const image = ctx.getImageData(0, 0, analysisCanvas.width, analysisCanvas.height);
  const ranges = {
    rMin: 255,
    rMax: 0,
    gMin: 255,
    gMax: 0,
    bMin: 255,
    bMax: 0,
    lMin: 255,
    lMax: 0
  };
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < image.data.length; i += 4) {
    const r = image.data[i];
    const g = image.data[i + 1];
    const b = image.data[i + 2];
    const lum = clampByte(getLuminance([r, g, b, 255]));
    ranges.rMin = Math.min(ranges.rMin, r);
    ranges.rMax = Math.max(ranges.rMax, r);
    ranges.gMin = Math.min(ranges.gMin, g);
    ranges.gMax = Math.max(ranges.gMax, g);
    ranges.bMin = Math.min(ranges.bMin, b);
    ranges.bMax = Math.max(ranges.bMax, b);
    ranges.lMin = Math.min(ranges.lMin, lum);
    ranges.lMax = Math.max(ranges.lMax, lum);
    histogram[lum] += 1;
  }
  const total = Math.max(1, image.data.length / 4);
  for (let i = 0; i < image.data.length; i += 4) {
    let r = image.data[i];
    let g = image.data[i + 1];
    let b = image.data[i + 2];
    if (settings.autoContrast) {
      if (settings.autoContrastByChannel) {
        r = getAutoContrastValue(r, ranges.rMin, ranges.rMax);
        g = getAutoContrastValue(g, ranges.gMin, ranges.gMax);
        b = getAutoContrastValue(b, ranges.bMin, ranges.bMax);
      } else {
        const lum = getLuminance([r, g, b, 255]);
        const target = getAutoContrastValue(lum, ranges.lMin, ranges.lMax);
        const scale = lum > 0 ? target / lum : 1;
        r = clampByte(r * scale);
        g = clampByte(g * scale);
        b = clampByte(b * scale);
      }
    }
    if (settings.histogramEqualization) {
      const lum = getLuminance([r, g, b, 255]);
      const target = equalizeHistogramValue(lum, histogram, total);
      const scale = lum > 0 ? target / lum : 1;
      r = clampByte(r * scale);
      g = clampByte(g * scale);
      b = clampByte(b * scale);
    }
    const avg = (r + g + b) / 3;
    image.data[i] = clampByte(avg + (r - avg) * settings.enhancement);
    image.data[i + 1] = clampByte(avg + (g - avg) * settings.enhancement);
    image.data[i + 2] = clampByte(avg + (b - avg) * settings.enhancement);
    image.data[i + 3] = clampByte(255 * settings.opacity);
  }
  putImage(analysisCanvas, image);
}

function applyNoise(sourceCanvas, analysisCanvas) {
  const ctx = copySourceToAnalysis(sourceCanvas, analysisCanvas);
  const image = ctx.getImageData(0, 0, analysisCanvas.width, analysisCanvas.height);
  const out = ctx.createImageData(image.width, image.height);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const idx = (y * image.width + x) * 4;
      const nIdx = (y * image.width + Math.min(image.width - 1, x + 1)) * 4;
      const delta = getNoiseDelta(image.data.slice(idx, idx + 4), image.data.slice(nIdx, nIdx + 4));
      out.data[idx] = clampByte(delta * 6);
      out.data[idx + 1] = clampByte(delta * 6);
      out.data[idx + 2] = clampByte(delta * 6);
      out.data[idx + 3] = 255;
    }
  }
  putImage(analysisCanvas, out);
}

function applyLevelSweep(sourceCanvas, analysisCanvas, controls) {
  const settings = buildLevelSweepSettings({ sweep: controls.sweep.value, width: controls.width.value, opacity: controls.opacity.value });
  const ctx = copySourceToAnalysis(sourceCanvas, analysisCanvas);
  const image = ctx.getImageData(0, 0, analysisCanvas.width, analysisCanvas.height);
  const half = settings.width / 2;
  for (let i = 0; i < image.data.length; i += 4) {
    const lum = getLuminance([image.data[i], image.data[i + 1], image.data[i + 2], image.data[i + 3]]);
    const hit = Math.abs(lum - settings.threshold) <= half;
    image.data[i] = hit ? 255 : clampByte(image.data[i] * (1 - settings.opacity));
    image.data[i + 1] = hit ? 180 : clampByte(image.data[i + 1] * (1 - settings.opacity));
    image.data[i + 2] = hit ? 40 : clampByte(image.data[i + 2] * (1 - settings.opacity));
  }
  putImage(analysisCanvas, image);
}

function applyLuminanceGradient(sourceCanvas, analysisCanvas) {
  const ctx = copySourceToAnalysis(sourceCanvas, analysisCanvas);
  const image = ctx.getImageData(0, 0, analysisCanvas.width, analysisCanvas.height);
  const out = ctx.createImageData(image.width, image.height);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const idx = (y * image.width + x) * 4;
      const nx = Math.min(image.width - 1, x + 1);
      const ny = Math.min(image.height - 1, y + 1);
      const hIdx = (y * image.width + nx) * 4;
      const vIdx = (ny * image.width + x) * 4;
      const grad = Math.max(
        getLuminanceGradient(image.data.slice(idx, idx + 4), image.data.slice(hIdx, hIdx + 4)),
        getLuminanceGradient(image.data.slice(idx, idx + 4), image.data.slice(vIdx, vIdx + 4))
      );
      out.data[idx] = clampByte(grad * 4);
      out.data[idx + 1] = clampByte(grad * 4);
      out.data[idx + 2] = clampByte(grad * 4);
      out.data[idx + 3] = 255;
    }
  }
  putImage(analysisCanvas, out);
}

function applyPrincipalComponent(sourceCanvas, analysisCanvas, controls) {
  const settings = buildPcaSettings({
    input: controls.pcaInput.value,
    mode: controls.pcaMode.value,
    componentCount: controls.pcaCount.value,
    component: controls.pcaComponent.value,
    linearize: controls.pcaLinearize.checked,
    invert: controls.pcaInvert.checked,
    enhancement: controls.pcaEnhancement.value,
    opacity: controls.opacity.value
  });
  const ctx = copySourceToAnalysis(sourceCanvas, analysisCanvas);
  const image = ctx.getImageData(0, 0, analysisCanvas.width, analysisCanvas.height);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const idx = (y * image.width + x) * 4;
      let value = getPcaProjectionValue(image.data.slice(idx, idx + 4), settings);
      if (settings.input === 'luminance-gradient') {
        const nx = Math.min(image.width - 1, x + 1);
        const nIdx = (y * image.width + nx) * 4;
        value = getLuminanceGradient(image.data.slice(idx, idx + 4), image.data.slice(nIdx, nIdx + 4));
        value = Math.min(255, Math.round(value * settings.enhancement));
      } else if (settings.input === 'noise') {
        const nx = Math.min(image.width - 1, x + 1);
        const nIdx = (y * image.width + nx) * 4;
        value = Math.min(255, getNoiseDelta(image.data.slice(idx, idx + 4), image.data.slice(nIdx, nIdx + 4)) * settings.enhancement);
      }
      image.data[idx] = value;
      image.data[idx + 1] = value;
      image.data[idx + 2] = value;
      image.data[idx + 3] = clampByte(255 * settings.opacity);
    }
  }
  putImage(analysisCanvas, image);
}

async function applyErrorLevel(sourceCanvas, analysisCanvas, controls) {
  const settings = buildErrorLevelSettings({
    jpegQuality: controls.jpegQuality.value,
    errorScale: controls.errorScale.value,
    opacity: controls.opacity.value
  });
  const jpegUrl = sourceCanvas.toDataURL('image/jpeg', settings.jpegQuality / 100);
  const image = new Image();
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = jpegUrl;
  });
  const ctx = copySourceToAnalysis(sourceCanvas, analysisCanvas);
  const original = ctx.getImageData(0, 0, analysisCanvas.width, analysisCanvas.height);
  ctx.clearRect(0, 0, analysisCanvas.width, analysisCanvas.height);
  ctx.drawImage(image, 0, 0, analysisCanvas.width, analysisCanvas.height);
  const compressed = ctx.getImageData(0, 0, analysisCanvas.width, analysisCanvas.height);
  for (let i = 0; i < original.data.length; i += 4) {
    original.data[i] = clampByte(Math.abs(original.data[i] - compressed.data[i]) * settings.errorScale);
    original.data[i + 1] = clampByte(Math.abs(original.data[i + 1] - compressed.data[i + 1]) * settings.errorScale);
    original.data[i + 2] = clampByte(Math.abs(original.data[i + 2] - compressed.data[i + 2]) * settings.errorScale);
    original.data[i + 3] = clampByte(255 * settings.opacity);
  }
  putImage(analysisCanvas, original);
}

function applyCloneDetection(sourceCanvas, analysisCanvas, controls) {
  const settings = buildCloneDetectionSettings({
    minimalSimilarity: controls.similarity.value,
    minimalDetail: controls.detail.value,
    minimalClusterSize: controls.cluster.value,
    blockSize: controls.blockSize.value,
    showQuantized: controls.quantized.checked
  });
  const ctx = copySourceToAnalysis(sourceCanvas, analysisCanvas);
  const image = ctx.getImageData(0, 0, analysisCanvas.width, analysisCanvas.height);
  const blocks = new Map();
  for (let y = 0; y < image.height - settings.blockSize; y += settings.blockSize) {
    for (let x = 0; x < image.width - settings.blockSize; x += settings.blockSize) {
      let r = 0;
      let g = 0;
      let b = 0;
      let samples = 0;
      for (let yy = 0; yy < settings.blockSize; yy += 4) {
        for (let xx = 0; xx < settings.blockSize; xx += 4) {
          const idx = ((y + yy) * image.width + x + xx) * 4;
          r += image.data[idx];
          g += image.data[idx + 1];
          b += image.data[idx + 2];
          samples += 1;
        }
      }
      const avg = [r / samples, g / samples, b / samples];
      const detail = Math.max(avg[0], avg[1], avg[2]) - Math.min(avg[0], avg[1], avg[2]);
      if (detail < settings.minimalDetail) continue;
      const q = Math.max(4, Math.round((1 - settings.minimalSimilarity) * 64));
      const key = avg.map((part) => Math.round(part / q)).join(':');
      const entries = blocks.get(key) || [];
      entries.push([x, y]);
      blocks.set(key, entries);
    }
  }
  ctx.lineWidth = 2;
  for (const entries of blocks.values()) {
    if (entries.length < settings.minimalClusterSize) continue;
    ctx.strokeStyle = '#ff9f0a';
    ctx.fillStyle = settings.showQuantized ? 'rgba(255,159,10,0.18)' : 'rgba(255,255,255,0)';
    entries.forEach(([x, y]) => {
      ctx.fillRect(x, y, settings.blockSize, settings.blockSize);
      ctx.strokeRect(x, y, settings.blockSize, settings.blockSize);
    });
  }
}

function renderMetadata(panel, file, bytes) {
  const summary = summarizeForensicFile(file, bytes.byteLength);
  const rows = [
    ['Name', summary.name],
    ['Type', summary.type],
    ['Extension', summary.extension],
    ['Size', `${(summary.size / 1024).toFixed(1)} KB`],
    ['Metadata Parser', summary.metadataSupported ? 'Supported for manual review' : 'Basic file fields only'],
    ['Supported Extensions', FORENSIC_METADATA_EXTENSIONS.join(', ')]
  ];
  panel.innerHTML = rows.map(([key, value]) => `
    <div class="forensic-meta-row">
      <span>${escapeHtml(key)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join('');
}

function renderStrings(panel, bytes) {
  const strings = extractReadableStrings(bytes, { minLength: 5, limit: 80 });
  panel.innerHTML = strings.length
    ? strings.map((value) => `<code>${escapeHtml(value)}</code>`).join('')
    : '<span class="forensic-empty">No readable strings found.</span>';
}

function renderRows(panel, rows, emptyCopy = 'No data found.') {
  panel.innerHTML = rows.length
    ? rows.map(([key, value]) => `
      <div class="forensic-meta-row">
        <span>${escapeHtml(key)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    `).join('')
    : `<span class="forensic-empty">${escapeHtml(emptyCopy)}</span>`;
}

function renderJpegPanel(panel, bytes) {
  const summary = analyzeJpegMarkers(bytes);
  renderRows(panel, [
    ['JPEG', summary.isJpeg ? 'Yes' : 'No'],
    ['Dimensions', summary.width && summary.height ? `${summary.width} x ${summary.height}` : 'Unknown'],
    ['Components', summary.components || 'Unknown'],
    ['EXIF', summary.hasExif ? 'Present' : 'Not found'],
    ['ICC Profile', summary.hasIcc ? 'Present' : 'Not found'],
    ['XMP', summary.hasXmp ? 'Present' : 'Not found'],
    ['Quantization Tables', summary.quantizationTables],
    ['Huffman Tables', summary.huffmanTables],
    ['Scans', summary.scanCount],
    ['Comments', summary.commentCount],
    ['Markers', summary.markers.map((marker) => marker.name).join(', ') || 'None']
  ]);
}

function renderGeoPanel(panel, bytes) {
  const values = findGeoTagStrings(bytes);
  panel.innerHTML = values.length
    ? values.map((value) => `<code>${escapeHtml(value)}</code>`).join('')
    : '<span class="forensic-empty">No local geo strings found.</span>';
}

function renderThumbnailPanel(panel, bytes) {
  const summary = findEmbeddedJpegThumbnails(bytes);
  const rows = [['Embedded JPEGs', summary.count]];
  summary.ranges.slice(0, 12).forEach((range, index) => {
    rows.push([`Thumbnail ${index + 1}`, `Offset ${range.offset}, ${range.length || 'unknown'} bytes, ${range.complete ? 'complete' : 'open-ended'}`]);
  });
  renderRows(panel, rows);
}

function renderCleanPanel(panel, file) {
  const plan = buildMetadataRemovalPlan(file);
  renderRows(panel, [
    ['Extension', plan.extension],
    ['Strategy', plan.strategy],
    ['Supported', plan.supported ? 'Yes' : 'No'],
    ['Local Steps', plan.actions.join(' ')]
  ]);
}

export async function mount(parent) {
  cleanup = [];
  container = document.createElement('div');
  container.className = 'tool-image-forensics';
  container.innerHTML = `
    <div class="card forensic-workbench">
      <div id="forensic-drop-zone" class="tool-dropzone forensic-drop-zone">
        <div class="tool-dropzone-glyph">IMG</div>
        <div class="tool-dropzone-copy">Drop image or metadata-bearing file</div>
        <input type="file" id="forensic-input" class="hidden" accept="image/*,.heic,.heif,.avif,.tif,.tiff,.pdf,.docx,.xlsx,.pptx,.mp3,.wav,.mp4,.mov,.zip">
      </div>

      <div id="forensic-supported-formats" class="forensic-supported-formats">
        Supported review targets: ${FORENSIC_METADATA_EXTENSIONS.join(', ')}
      </div>

      <div id="forensic-workspace-tabs" class="forensic-workspace-tabs">
        <button type="button" class="btn-secondary active-mode" data-forensic-workspace-tab="visual">Visual</button>
        <button type="button" class="btn-secondary" data-forensic-workspace-tab="evidence">Evidence</button>
        <button type="button" class="btn-secondary" data-forensic-workspace-tab="export">Export</button>
      </div>

      <div class="forensic-workspace-panel is-active" data-forensic-workspace-panel="visual">
      <div class="forensic-visual-layout">
        <section id="forensic-analysis-section" class="forensic-viewer-panel">
          <div class="forensic-stage-head">
            <div class="forensic-panel-head">Image</div>
            <div id="forensic-view-toggle" class="forensic-view-toggle">
              <button type="button" class="btn-secondary" data-forensic-view-mode="source">Source</button>
              <button type="button" class="btn-secondary active-mode" data-forensic-view-mode="analysis">Analysis</button>
            </div>
          </div>
          <div id="forensic-pixel-readout" class="forensic-pixel-readout">Move over the analysis image for pixel values.</div>
          <div class="forensic-analysis-stack is-analysis-view">
            <canvas id="forensic-source-canvas"></canvas>
            <canvas id="forensic-analysis-base-canvas"></canvas>
            <canvas id="forensic-analysis-canvas"></canvas>
            <canvas id="forensic-magnifier-canvas" class="forensic-magnifier-canvas hidden" width="180" height="180"></canvas>
          </div>
        </section>

        <aside class="forensic-control-rail">
          <div id="forensic-mode-tabs" class="forensic-mode-tabs">
            ${getForensicModeGroups().map((group) => `
              <div class="forensic-mode-tab-group">
                <div class="forensic-mode-tab-group-title">${group.label}</div>
                <div class="forensic-mode-tab-group-buttons">
                  ${group.modes.map((mode, index) => `<button type="button" data-forensic-mode-tab="${mode.id}" class="btn-secondary ${mode.id === FORENSIC_MODES[0].id && index === 0 ? 'active-mode' : ''}">${mode.label}</button>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>

          <div id="forensic-mode-message" class="forensic-mode-message">
            ${FORENSIC_MODES[0].label}: ${FORENSIC_MODES[0].detail}
          </div>

          <div class="forensic-toolbar">
            <div class="forensic-mode-panel is-active" data-forensic-mode-panel="error-level,magnifier,clone-detect,noise,level-sweep,luminance-gradient,principal-component">
              <label>
                <span>Mode</span>
                <select id="forensic-mode">
                  ${FORENSIC_MODES.map((mode) => `<option value="${mode.id}">${mode.label}</option>`).join('')}
                </select>
              </label>
              <label><span>JPEG Quality</span><input id="forensic-jpeg-quality" type="range" min="35" max="98" value="82"></label>
              <label><span>Error Scale</span><input id="forensic-error-scale" type="range" min="1" max="24" value="8"></label>
              <label><span>Opacity</span><input id="forensic-opacity" type="range" min="0.05" max="1" step="0.05" value="0.85"></label>
              <label><span>Analysis Opacity</span><input id="forensic-analysis-opacity" type="range" min="0.05" max="1" step="0.05" value="0.85"></label>
              <label><span>Magnifier</span><input id="forensic-magnifier-enhancement" type="range" min="0.5" max="4" step="0.05" value="1.75"></label>
              <label><span>Sweep</span><input id="forensic-sweep" type="range" min="0" max="100" value="50"></label>
              <label><span>Width</span><input id="forensic-width" type="range" min="1" max="100" value="12"></label>
              <label><span>Similarity</span><input id="forensic-similarity" type="range" min="0.1" max="1" step="0.01" value="0.82"></label>
              <label><span>Detail</span><input id="forensic-detail" type="range" min="0" max="255" value="18"></label>
              <label><span>Cluster</span><input id="forensic-cluster" type="range" min="1" max="64" value="6"></label>
              <label><span>Block</span><input id="forensic-block" type="range" min="4" max="64" value="16"></label>
              <label class="forensic-check"><input id="forensic-quantized" type="checkbox"><span>Show Quantized Image</span></label>
              <label class="forensic-check"><input id="forensic-auto-contrast" type="checkbox"><span>Auto Contrast</span></label>
              <label class="forensic-check"><input id="forensic-auto-contrast-channel" type="checkbox"><span>By Channel</span></label>
              <label class="forensic-check"><input id="forensic-histogram-equalization" type="checkbox"><span>Equalize Histogram</span></label>
              <label class="forensic-check"><input id="forensic-underlay-original" type="checkbox" checked><span>Original Under Analysis</span></label>
            </div>
            <div class="forensic-mode-panel" data-forensic-mode-panel="principal-component">
              <label>
                <span>PCA Input</span>
                <select id="forensic-pca-input">
                  <option value="color">Color</option>
                  <option value="luminance-gradient">Luminance Gradient</option>
                  <option value="noise">Noise</option>
                </select>
              </label>
              <label>
                <span>PCA Mode</span>
                <select id="forensic-pca-mode">
                  <option value="projection">Projection</option>
                  <option value="difference">Difference</option>
                  <option value="distance">Distance</option>
                  <option value="component">Component</option>
                </select>
              </label>
              <label><span>Components</span><input id="forensic-pca-count" type="range" min="1" max="4" value="3"></label>
              <label><span>Component</span><input id="forensic-pca-component" type="range" min="1" max="4" value="1"></label>
              <label><span>Enhancement</span><input id="forensic-pca-enhancement" type="range" min="0.25" max="16" step="0.25" value="4"></label>
              <label class="forensic-check"><input id="forensic-pca-linearize" type="checkbox"><span>Linearize</span></label>
              <label class="forensic-check"><input id="forensic-pca-invert" type="checkbox"><span>Invert</span></label>
            </div>
          </div>

          <div class="forensic-action-row">
            <button id="forensic-run">Run Analysis</button>
            <button id="forensic-export" class="btn-secondary">Export PNG</button>
            <button id="forensic-clean-export" class="btn-secondary">Export Clean Image</button>
          </div>
        </aside>
      </div>
      </div>

      <div class="forensic-workspace-panel" data-forensic-workspace-panel="evidence">
      <div class="forensic-info-grid">
        <section id="forensic-metadata-section">
          <div class="forensic-panel-head">Metadata</div>
          <div id="forensic-metadata" class="forensic-meta-panel"></div>
        </section>
        <section id="forensic-strings-section">
          <div class="forensic-panel-head">Strings</div>
          <div id="forensic-strings" class="forensic-strings-panel"></div>
        </section>
      </div>

      <div class="forensic-detail-grid">
        <section id="forensic-jpeg-section">
          <div class="forensic-panel-head">JPEG Analysis</div>
          <div id="forensic-jpeg-panel" class="forensic-meta-panel"></div>
        </section>
        <section id="forensic-geo-section">
          <div class="forensic-panel-head">Geo Tags</div>
          <div id="forensic-geo-panel" class="forensic-strings-panel"></div>
        </section>
        <section id="forensic-thumbnail-section">
          <div class="forensic-panel-head">Thumbnail Analysis</div>
          <div id="forensic-thumbnail-panel" class="forensic-meta-panel"></div>
        </section>
        <section id="forensic-clean-section">
          <div class="forensic-panel-head">Clean Copy</div>
          <div id="forensic-clean-panel" class="forensic-meta-panel"></div>
        </section>
      </div>
      </div>

      <div class="forensic-workspace-panel" data-forensic-workspace-panel="export">
        <div class="forensic-action-row">
          <button id="forensic-export-panel-png" type="button">Export PNG</button>
          <button id="forensic-export-panel-clean" type="button" class="btn-secondary">Export Clean Image</button>
        </div>
      </div>

      <div id="forensic-status" class="tool-status-copy">Load a file to begin.</div>
    </div>
  `;
  parent.appendChild(container);

  const refs = {
    drop: container.querySelector('#forensic-drop-zone'),
    input: container.querySelector('#forensic-input'),
    mode: container.querySelector('#forensic-mode'),
    sourceCanvas: container.querySelector('#forensic-source-canvas'),
    analysisBaseCanvas: container.querySelector('#forensic-analysis-base-canvas'),
    analysisCanvas: container.querySelector('#forensic-analysis-canvas'),
    analysisStack: container.querySelector('.forensic-analysis-stack'),
    magnifier: container.querySelector('#forensic-magnifier-canvas'),
    pixelReadout: container.querySelector('#forensic-pixel-readout'),
    metadata: container.querySelector('#forensic-metadata'),
    strings: container.querySelector('#forensic-strings'),
    jpegPanel: container.querySelector('#forensic-jpeg-panel'),
    geoPanel: container.querySelector('#forensic-geo-panel'),
    thumbnailPanel: container.querySelector('#forensic-thumbnail-panel'),
    cleanPanel: container.querySelector('#forensic-clean-panel'),
    status: container.querySelector('#forensic-status'),
    jpegQuality: container.querySelector('#forensic-jpeg-quality'),
    errorScale: container.querySelector('#forensic-error-scale'),
    opacity: container.querySelector('#forensic-opacity'),
    analysisOpacity: container.querySelector('#forensic-analysis-opacity'),
    magnifierEnhancement: container.querySelector('#forensic-magnifier-enhancement'),
    sweep: container.querySelector('#forensic-sweep'),
    width: container.querySelector('#forensic-width'),
    similarity: container.querySelector('#forensic-similarity'),
    detail: container.querySelector('#forensic-detail'),
    cluster: container.querySelector('#forensic-cluster'),
    blockSize: container.querySelector('#forensic-block'),
    quantized: container.querySelector('#forensic-quantized'),
    autoContrast: container.querySelector('#forensic-auto-contrast'),
    autoContrastChannel: container.querySelector('#forensic-auto-contrast-channel'),
    histogramEqualization: container.querySelector('#forensic-histogram-equalization'),
    underlayOriginal: container.querySelector('#forensic-underlay-original'),
    pcaInput: container.querySelector('#forensic-pca-input'),
    pcaMode: container.querySelector('#forensic-pca-mode'),
    pcaCount: container.querySelector('#forensic-pca-count'),
    pcaComponent: container.querySelector('#forensic-pca-component'),
    pcaEnhancement: container.querySelector('#forensic-pca-enhancement'),
    pcaLinearize: container.querySelector('#forensic-pca-linearize'),
    pcaInvert: container.querySelector('#forensic-pca-invert')
  };

  const runAnalysis = async () => {
    if (!sourceFile) return;
    const mode = getForensicMode(refs.mode.value);
    syncForensicModeTabs(mode.id);
    syncForensicModePanels(mode.id);
    updateForensicModeMessage(mode);
    if (sourceImage) {
      drawToCanvas(refs.sourceCanvas, sourceImage);
      syncAnalysisBaseCanvas(refs.sourceCanvas, refs.analysisBaseCanvas);
      syncForensicUnderlay(refs);
      if (mode.id === 'error-level') await applyErrorLevel(refs.sourceCanvas, refs.analysisCanvas, refs);
      else if (mode.id === 'magnifier') applyMagnifier(refs.sourceCanvas, refs.analysisCanvas, refs);
      else if (mode.id === 'clone-detect') applyCloneDetection(refs.sourceCanvas, refs.analysisCanvas, refs);
      else if (mode.id === 'noise') applyNoise(refs.sourceCanvas, refs.analysisCanvas);
      else if (mode.id === 'level-sweep') applyLevelSweep(refs.sourceCanvas, refs.analysisCanvas, refs);
      else if (mode.id === 'luminance-gradient') applyLuminanceGradient(refs.sourceCanvas, refs.analysisCanvas);
      else if (mode.id === 'principal-component') applyPrincipalComponent(refs.sourceCanvas, refs.analysisCanvas, refs);
      else copySourceToAnalysis(refs.sourceCanvas, refs.analysisCanvas);
      syncForensicStageAspect(refs);
    }
    renderMetadata(refs.metadata, sourceFile, sourceBytes);
    renderStrings(refs.strings, sourceBytes);
    renderJpegPanel(refs.jpegPanel, sourceBytes);
    renderGeoPanel(refs.geoPanel, sourceBytes);
    renderThumbnailPanel(refs.thumbnailPanel, sourceBytes);
    renderCleanPanel(refs.cleanPanel, sourceFile);
    refs.analysisCanvas.style.opacity = refs.analysisOpacity.value;
    syncForensicUnderlay(refs);
    refs.status.textContent = `${mode.label} complete. Source, analysis, and byte panels are current for ${sourceFile?.name || 'the loaded file'}.`;
  };

  const loadFile = async (files) => {
    const file = files?.[0];
    if (!file) return;
    sourceFile = file;
    sourceBytes = new Uint8Array(await file.arrayBuffer());
    sourceImage = null;
    sourceImage = await loadBrowserVisibleImage(file, refs);
    renderMetadata(refs.metadata, sourceFile, sourceBytes);
    renderStrings(refs.strings, sourceBytes);
    refs.status.textContent = sourceImage ? 'Image loaded. Run an analysis mode.' : 'File loaded for metadata and strings.';
    await runAnalysis();
  };

  refs.drop.addEventListener('click', () => refs.input.click());
  refs.input.addEventListener('change', (event) => loadFile(event.target.files));
  setForensicViewMode(refs, 'analysis');

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
      loadFile(files);
    }
  };
  window.addEventListener('paste', onPaste);
  cleanup.push(() => window.removeEventListener('paste', onPaste));

  const dragDrop = setupDragAndDrop(refs.drop, loadFile);
  cleanup.push(() => dragDrop?.());

  container.querySelector('#forensic-run').addEventListener('click', () => runAnalysis());
  refs.mode.addEventListener('change', () => {
    syncForensicModePanels(refs.mode.value);
    switchForensicWorkspacePanel(getForensicWorkspaceForMode(refs.mode.value));
    centerForensicSection(refs.mode.value);
    runAnalysis();
  });
  container.querySelectorAll('[data-forensic-mode-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      refs.mode.value = button.dataset.forensicModeTab;
      syncForensicModeTabs(refs.mode.value);
      syncForensicModePanels(refs.mode.value);
      updateForensicModeMessage(getForensicMode(refs.mode.value));
      switchForensicWorkspacePanel(getForensicWorkspaceForMode(refs.mode.value));
      centerForensicSection(refs.mode.value);
      runAnalysis();
    });
  });
  container.querySelectorAll('[data-forensic-workspace-tab]').forEach((button) => {
    button.addEventListener('click', () => switchForensicWorkspacePanel(button.dataset.forensicWorkspaceTab));
  });
  container.querySelectorAll('[data-forensic-view-mode]').forEach((button) => {
    button.addEventListener('click', () => setForensicViewMode(refs, button.dataset.forensicViewMode));
  });
  refs.analysisCanvas.addEventListener('pointermove', (event) => updateForensicMagnifier(event, refs));
  refs.analysisCanvas.addEventListener('pointerleave', () => {
    refs.magnifier.classList.add('hidden');
    refs.pixelReadout.textContent = 'Move over the analysis image for pixel values.';
  });
  container.querySelectorAll('.forensic-toolbar input, .forensic-toolbar select').forEach((control) => {
    if (control === refs.mode) return;
    control.addEventListener('input', () => runAnalysis());
    control.addEventListener('change', () => runAnalysis());
  });
  const exportAnalysisPng = () => {
    if (!refs.analysisCanvas.width) {
      showToast('Run an image analysis first.', 'warning');
      return;
    }
    refs.analysisCanvas.toBlob((blob) => {
      if (blob) downloadFile(blob, 'forensic-analysis.png', 'image/png');
    }, 'image/png');
  };
  const exportCleanImage = () => {
    if (!sourceImage || !refs.sourceCanvas.width) {
      showToast('Clean image export needs a decoded image.', 'warning');
      return;
    }
    refs.sourceCanvas.toBlob((blob) => {
      if (blob) downloadFile(blob, `${sourceFile?.name || 'image'}-clean.png`, 'image/png');
    }, 'image/png');
  };
  container.querySelector('#forensic-export').addEventListener('click', exportAnalysisPng);
  container.querySelector('#forensic-export-panel-png').addEventListener('click', exportAnalysisPng);
  container.querySelector('#forensic-clean-export').addEventListener('click', exportCleanImage);
  container.querySelector('#forensic-export-panel-clean').addEventListener('click', exportCleanImage);
}

export function unmount() {
  cleanup.forEach((dispose) => dispose());
  cleanup = [];
  sourceImage = null;
  sourceFile = null;
  sourceBytes = new Uint8Array();
  if (container) container.remove();
  container = null;
}

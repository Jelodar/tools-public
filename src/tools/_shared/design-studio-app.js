import { TOOLS } from '../../core/config.js';
import { getStudioByToolId } from '../../core/studios.js';
import { copyToClipboard, downloadFile } from '../../ui/ui-utils.js';
import {
  DEFAULT_VECTOR_VARIABLES,
  DEFAULT_VECTOR_BACKGROUND,
  DESIGN_PRESETS,
  VECTOR_SHAPE_TYPES,
  buildDesignPreviewMarkup,
  buildDesignSystemCss,
  buildDesignTokenJson,
  buildDesignTokenSvg,
  buildDesignVectorSvg,
  buildPalette,
  createDesignVectorShape,
  contrastBetween,
  contrastRatio,
  getDensityConfig,
  getVectorShapeCenter,
  hexToRgb,
  hexToRgba,
  resolveColorInput,
  rgbToHsl
} from '../../utils/design-studio.js';
import { createStudioShell } from './studio-shell.js';

const MODE_META = {
  'visual-generators': {
    title: 'SVG Studio',
    description: 'Canvas-first SVG creation suite with drawing tools, layers, gradients, and direct shape editing.'
  },
  'svg-editor': {
    title: 'SVG Studio',
    description: 'Canvas-first SVG creation suite with drawing tools, layers, gradients, and direct shape editing.'
  },
  'color-tools': {
    title: 'SVG Studio',
    description: 'Canvas-first SVG creation suite with drawing tools, layers, gradients, and direct shape editing.'
  },
  'css-generators': {
    title: 'SVG Studio',
    description: 'Canvas-first SVG creation suite with drawing tools, layers, gradients, and direct shape editing.'
  }
};

let state = null;

function getTool(toolId) {
  return TOOLS.find((tool) => tool.id === toolId);
}

function renderVisualLayout() {
  return `
    <div class="studio-stack">
      <section class="card studio-card svg-ide-card">
        ${renderVectorWorkspace()}
      </section>
    </div>
  `;
}

function renderVectorWorkspace() {
  const variableInputs = `
    <label class="studio-field">
      <span>fill</span>
      <input type="color" data-vector-var="--vector-fill" value="${DEFAULT_VECTOR_VARIABLES['--vector-fill']}">
    </label>
    <label class="studio-field">
      <span>accent</span>
      <input type="color" data-vector-var="--vector-accent" value="${DEFAULT_VECTOR_VARIABLES['--vector-accent']}">
    </label>
    <label class="studio-field">
      <span>stroke</span>
      <input type="color" data-vector-var="--vector-stroke" value="${DEFAULT_VECTOR_VARIABLES['--vector-stroke']}">
    </label>
    <label class="studio-field">
      <span>muted</span>
      <input type="color" data-vector-var="--vector-muted" value="${DEFAULT_VECTOR_VARIABLES['--vector-muted']}">
    </label>
  `;
  const paintOptions = Object.keys(DEFAULT_VECTOR_VARIABLES).map((name) => `<option value="var(${name})">${name}</option>`).join('');
  return `
    <section class="studio-panel design-vector-workspace svg-ide-workspace">
      <div class="studio-panel-head">
        <h3>Canvas</h3>
      </div>
      <div class="design-vector-editor-shell svg-ide-shell">
      <div class="design-vector-grid svg-ide-grid">
        <div class="design-vector-toolbar svg-ide-toolbar" data-svg-ide-toolbar>
          <button id="design-vector-tool-select" class="btn-secondary is-active" type="button" data-vector-tool="select">Select</button>
          <button id="design-vector-tool-draw" class="btn-secondary" type="button" data-vector-tool="draw">Draw</button>
          <button id="design-vector-tool-rect" class="btn-secondary" type="button" data-vector-tool="rect">Rect</button>
          <button id="design-vector-tool-rounded-rect" class="btn-secondary" type="button" data-vector-tool="rounded-rect">Round Rect</button>
          <button id="design-vector-tool-circle" class="btn-secondary" type="button" data-vector-tool="circle">Circle</button>
          <button id="design-vector-tool-ellipse" class="btn-secondary" type="button" data-vector-tool="ellipse">Ellipse</button>
          <button id="design-vector-tool-line" class="btn-secondary" type="button" data-vector-tool="line">Line</button>
          <button id="design-vector-tool-polygon" class="btn-secondary" type="button" data-vector-tool="polygon">Polygon</button>
          <button id="design-vector-tool-star" class="btn-secondary" type="button" data-vector-tool="star">Star</button>
          <button id="design-vector-tool-path" class="btn-secondary" type="button" data-vector-tool="path">Path</button>
          <button id="design-vector-tool-text" class="btn-secondary" type="button" data-vector-tool="text">Text</button>
          <button id="design-vector-tool-rotate" class="btn-secondary" type="button" data-vector-tool="rotate">Rotate</button>
        </div>
        <div class="design-vector-stage-shell svg-ide-stage-shell">
          <div class="design-vector-stage">
            <div class="svg-ide-command-bar">
              <div class="svg-ide-feedback">
                <span id="design-vector-tool-status">Select tool ready.</span>
                <span id="design-vector-selection-status">1 shape selected.</span>
              </div>
              <label class="studio-toggle">
                <input id="design-vector-grid" type="checkbox" checked>
                <span>Grid</span>
              </label>
              <label class="studio-toggle">
                <input id="design-vector-snap" type="checkbox" checked>
                <span>Snap</span>
              </label>
              <label class="studio-field">
                <span>Zoom</span>
                <input id="design-vector-zoom" type="range" min="40" max="180" value="100">
              </label>
            </div>
            <div id="design-vector-canvas" class="design-vector-canvas svg-ide-canvas"></div>
            <pre id="design-vector-svg-code" class="design-code-block design-code-block-vector svg-ide-code"></pre>
          </div>
        </div>
        <div class="design-vector-controls svg-ide-inspector" data-svg-ide-inspector>
          <div class="design-vector-vars">${variableInputs}</div>
          <div class="design-vector-background">
            <label class="studio-field">
              <span>Background</span>
              <select id="design-vector-bg-type">
                <option value="transparent">Transparent</option>
                <option value="solid" selected>Solid</option>
                <option value="linear">Linear</option>
                <option value="radial">Radial</option>
              </select>
            </label>
            <label class="studio-field">
              <span>Start</span>
              <input type="color" id="design-vector-bg-start" value="${DEFAULT_VECTOR_BACKGROUND.start}">
            </label>
            <label class="studio-field">
              <span>End</span>
              <input type="color" id="design-vector-bg-end" value="${DEFAULT_VECTOR_BACKGROUND.end}">
            </label>
            <label class="studio-field">
              <span>Angle</span>
              <input id="design-vector-bg-angle" type="range" min="0" max="360" value="${DEFAULT_VECTOR_BACKGROUND.angle}">
            </label>
          </div>
          <div class="design-vector-form">
            <label class="studio-field" data-vector-prop-types="all">
              <span>Shape</span>
              <select id="design-vector-shape-type">
                ${VECTOR_SHAPE_TYPES.map((type) => `<option value="${type}">${type}</option>`).join('')}
              </select>
            </label>
            <label class="studio-field" data-vector-prop-types="all">
              <span>Fill</span>
              <select id="design-vector-fill">${paintOptions}</select>
            </label>
            <label class="studio-field" data-vector-prop-types="all">
              <span>Fill Mode</span>
              <select id="design-vector-fill-mode">
                <option value="solid" selected>Solid</option>
                <option value="linear">Linear</option>
              </select>
            </label>
            <label class="studio-field" data-vector-prop-types="all">
              <span>Fill Start</span>
              <input id="design-vector-fill-start" type="color" value="#ffffff">
            </label>
            <label class="studio-field" data-vector-prop-types="all">
              <span>Fill End</span>
              <input id="design-vector-fill-end" type="color" value="#0a84ff">
            </label>
            <label class="studio-field" data-vector-prop-types="all">
              <span>Fill Angle</span>
              <input id="design-vector-fill-angle" type="range" min="0" max="360" value="0">
            </label>
            <label class="studio-field" data-vector-prop-types="all">
              <span>Stroke</span>
              <select id="design-vector-stroke">${paintOptions}</select>
            </label>
            <label class="studio-field" data-vector-prop-types="all line polygon path text">
              <span>Stroke Width</span>
              <input id="design-vector-stroke-width" type="number" min="0" value="2">
            </label>
            <label class="studio-field" data-vector-prop-types="rect rounded-rect text">
              <span>X</span>
              <input id="design-vector-x" type="number" value="80">
            </label>
            <label class="studio-field" data-vector-prop-types="rect rounded-rect text">
              <span>Y</span>
              <input id="design-vector-y" type="number" value="70">
            </label>
            <label class="studio-field" data-vector-prop-types="rect rounded-rect">
              <span>W</span>
              <input id="design-vector-width" type="number" min="1" value="180">
            </label>
            <label class="studio-field" data-vector-prop-types="rect rounded-rect">
              <span>H</span>
              <input id="design-vector-height" type="number" min="1" value="110">
            </label>
            <label class="studio-field" data-vector-prop-types="circle ellipse star">
              <span>CX</span>
              <input id="design-vector-cx" type="number" value="170">
            </label>
            <label class="studio-field" data-vector-prop-types="circle ellipse star">
              <span>CY</span>
              <input id="design-vector-cy" type="number" value="125">
            </label>
            <label class="studio-field" data-vector-prop-types="ellipse">
              <span>RX</span>
              <input id="design-vector-rx" type="number" min="0" value="92">
            </label>
            <label class="studio-field" data-vector-prop-types="ellipse">
              <span>RY</span>
              <input id="design-vector-ry" type="number" min="0" value="54">
            </label>
            <label class="studio-field" data-vector-prop-types="circle">
              <span>R</span>
              <input id="design-vector-r" type="number" min="0" value="64">
            </label>
            <label class="studio-field" data-vector-prop-types="star">
              <span>Outer</span>
              <input id="design-vector-outer-radius" type="number" min="1" value="76">
            </label>
            <label class="studio-field" data-vector-prop-types="star">
              <span>Inner</span>
              <input id="design-vector-inner-radius" type="number" min="1" value="34">
            </label>
            <label class="studio-field" data-vector-prop-types="star polygon">
              <span>Points</span>
              <input id="design-vector-point-count" type="number" min="3" max="12" value="5">
            </label>
            <label class="studio-field" data-vector-prop-types="all">
              <span>Rotate</span>
              <input id="design-vector-rotate" type="number" value="0">
            </label>
            <label class="studio-field" data-vector-prop-types="all">
              <span>Opacity</span>
              <input id="design-vector-opacity" type="number" min="0" max="1" step="0.05" value="1">
            </label>
            <label class="studio-field" data-vector-prop-types="text">
              <span>Text</span>
              <input id="design-vector-text" type="text" value="Vector">
            </label>
            <label class="studio-field studio-field-wide" data-vector-prop-types="polygon">
              <span>Points</span>
              <input id="design-vector-points" type="text" value="170,46 280,186 60,186">
            </label>
            <label class="studio-field studio-field-wide" data-vector-prop-types="path">
              <span>Path</span>
              <textarea id="design-vector-path" rows="3">M 80 180 C 130 40 230 40 280 180 Z</textarea>
            </label>
          </div>
          <div class="studio-toolbar-actions design-vector-actions">
            <button id="design-vector-add" class="btn-secondary" type="button">Add Shape</button>
            <button id="design-vector-update" class="btn-secondary" type="button">Update</button>
            <button id="design-vector-duplicate" class="btn-secondary" type="button">Duplicate</button>
            <button id="design-vector-remove" class="btn-secondary" type="button">Remove</button>
            <button id="design-vector-undo" class="btn-secondary" type="button">Undo</button>
            <button id="design-vector-redo" class="btn-secondary" type="button">Redo</button>
            <button id="design-vector-back" class="btn-secondary" type="button">Back</button>
            <button id="design-vector-front" class="btn-secondary" type="button">Front</button>
            <button id="design-vector-copy-svg" class="btn-secondary" type="button">Copy SVG</button>
            <button id="design-vector-download-svg" class="btn-secondary" type="button">Download SVG</button>
          </div>
        </div>
          <div class="svg-ide-layers-panel">
            <div id="design-vector-layer-list" class="design-vector-layer-list"></div>
          </div>
        </div>
      </div>
      </div>
    </section>
  `;
}

function renderColorLayout() {
  return `
    <div class="studio-stack">
      <section class="card studio-card">
        <div class="studio-toolbar">
          <div class="studio-toolbar-group">
            <label class="studio-field">
              <span>Color</span>
              <input type="color" id="color-picker" value="#0a84ff">
            </label>
            <label class="studio-field studio-field-wide">
              <span>HEX</span>
              <input type="text" id="color-hex" value="#0A84FF">
            </label>
            <label class="studio-field studio-field-wide">
              <span>RGB</span>
              <input type="text" id="color-rgb" value="rgb(10, 132, 255)">
            </label>
            <label class="studio-field studio-field-wide">
              <span>HSL</span>
              <input type="text" id="color-hsl" value="hsl(210, 100%, 52%)">
            </label>
          </div>
          <div class="studio-toolbar-group studio-toolbar-actions">
            <button id="color-copy-hex" class="btn-secondary">Copy HEX</button>
          </div>
        </div>
        <div class="studio-result-grid">
          <div class="studio-output-card color-preview-card" id="color-preview">
            <span>Preview</span>
            <strong id="color-contrast">4.5:1</strong>
          </div>
          <div class="studio-output-card">
            <span>Contrast</span>
            <strong id="color-grade">AA</strong>
          </div>
          <div class="studio-output-card">
            <span>Suggested Text</span>
            <strong id="color-text-tone">#000000</strong>
          </div>
        </div>
        <div id="color-palette" class="studio-result-grid"></div>
      </section>
    </div>
  `;
}

function renderShadowLayout() {
  return `
    <div class="studio-stack">
      <section class="card studio-card">
        <div class="studio-toolbar">
          <div class="studio-toolbar-group">
            <label class="studio-field">
              <span>X Offset</span>
              <input type="range" id="shadow-x" min="-50" max="50" value="0">
            </label>
            <label class="studio-field">
              <span>Y Offset</span>
              <input type="range" id="shadow-y" min="-50" max="50" value="10">
            </label>
            <label class="studio-field">
              <span>Blur</span>
              <input type="range" id="shadow-blur" min="0" max="100" value="20">
            </label>
            <label class="studio-field">
              <span>Spread</span>
              <input type="range" id="shadow-spread" min="-50" max="50" value="-5">
            </label>
            <label class="studio-field">
              <span>Layers</span>
              <input type="range" id="shadow-layers" min="1" max="4" value="2">
            </label>
            <label class="studio-field">
              <span>Color</span>
              <input type="color" id="shadow-color" value="#000000">
            </label>
            <label class="studio-field">
              <span>Opacity</span>
              <input type="range" id="shadow-opacity" min="0" max="1" step="0.01" value="0.5">
            </label>
            <label class="studio-field">
              <span>Inset</span>
              <select id="shadow-inset">
                <option value="0">Outer</option>
                <option value="1">Inset</option>
              </select>
            </label>
          </div>
          <div class="studio-toolbar-group studio-toolbar-actions">
            <button id="shadow-copy" class="btn-secondary">Copy CSS</button>
          </div>
        </div>
        <div class="studio-panel-grid">
          <section class="studio-panel">
            <div class="studio-panel-head">
              <h3>Preview</h3>
            </div>
            <div class="shadow-preview-stage">
              <div id="shadow-preview" class="shadow-preview-sample"></div>
            </div>
          </section>
          <section class="studio-panel">
            <div class="studio-panel-head">
              <h3>CSS</h3>
            </div>
            <pre id="shadow-code" class="design-code-block design-code-block-shadow"></pre>
          </section>
        </div>
      </section>
    </div>
  `;
}

function applyDesignPreset(root, presetId) {
  const preset = DESIGN_PRESETS[presetId] || DESIGN_PRESETS.workbench;
  const fields = {
    surface: '#design-surface',
    panel: '#design-panel',
    ink: '#design-ink',
    accent: '#design-accent',
    border: '#design-border',
    density: '#design-density',
    radius: '#design-radius',
    elevation: '#design-elevation',
    fontSize: '#design-font-size'
  };
  Object.entries(fields).forEach(([key, selector]) => {
    const node = root.querySelector(selector);
    if (node) node.value = preset[key];
  });
}

function buildDesignValues(root) {
  return {
    surface: root.querySelector('#design-surface').value.toUpperCase(),
    panel: root.querySelector('#design-panel').value.toUpperCase(),
    ink: root.querySelector('#design-ink').value.toUpperCase(),
    accent: root.querySelector('#design-accent').value.toUpperCase(),
    border: root.querySelector('#design-border').value.toUpperCase(),
    density: root.querySelector('#design-density').value,
    fontSize: Number(root.querySelector('#design-font-size').value),
    radius: Number(root.querySelector('#design-radius').value),
    elevation: Number(root.querySelector('#design-elevation').value)
  };
}

function setStyleToken(node, key, value) {
  if (typeof node.style.setProperty === 'function') {
    node.style.setProperty(key, value);
    return;
  }
  node.style[key] = value;
}

function applyDesignPreviewTokens(preview, values) {
  const density = getDensityConfig(values.density);
  setStyleToken(preview, '--app-bg', values.surface);
  setStyleToken(preview, '--app-surface', values.panel);
  setStyleToken(preview, '--app-ink', values.ink);
  setStyleToken(preview, '--app-accent', values.accent);
  setStyleToken(preview, '--app-border', values.border);
  setStyleToken(preview, '--app-radius', `${values.radius}px`);
  setStyleToken(preview, '--app-font-size', `${values.fontSize}px`);
  setStyleToken(preview, '--app-space', `${density.space}px`);
  setStyleToken(preview, '--app-row', `${density.row}px`);
  setStyleToken(preview, '--app-shadow', `0 ${values.elevation * 8}px ${values.elevation * 18}px rgba(0, 0, 0, ${Math.min(0.42, 0.1 + values.elevation * 0.06).toFixed(2)})`);
}

function renderDesignTokens(root, values) {
  const tokenGrid = root.querySelector('#design-token-grid');
  const tokens = [
    ['Surface', values.surface],
    ['Panel', values.panel],
    ['Ink', values.ink],
    ['Accent', values.accent],
    ['Border', values.border],
    ['Text', `${values.fontSize}px`],
    ['Contrast', `${contrastBetween(values.panel, values.ink).toFixed(1)}:1`]
  ];
  tokenGrid.innerHTML = tokens.map(([label, value]) => `
    <div class="studio-output-card design-token-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join('');
}

function renderDesignContrastStatus(root, values) {
  const panelContrast = contrastBetween(values.panel, values.ink);
  const accentContrast = contrastBetween(values.accent, values.surface);
  const status = root.querySelector('#design-contrast-status');
  status.textContent = `Panel text ${panelContrast.toFixed(1)}:1. Accent on surface ${accentContrast.toFixed(1)}:1.`;
  status.classList.toggle('is-warning', panelContrast < 4.5 || accentContrast < 3);
}

function readVectorVariables(root) {
  return Object.fromEntries(
    Array.from(root.querySelectorAll('[data-vector-var]')).map((input) => [input.dataset.vectorVar, input.value])
  );
}

function readVectorBackground(root) {
  return {
    type: root.querySelector('#design-vector-bg-type').value,
    start: root.querySelector('#design-vector-bg-start').value,
    end: root.querySelector('#design-vector-bg-end').value,
    angle: Number(root.querySelector('#design-vector-bg-angle').value)
  };
}

function readVectorDraft(root, id) {
  const type = root.querySelector('#design-vector-shape-type').value;
  return createDesignVectorShape(type, {
    id,
    fill: root.querySelector('#design-vector-fill').value,
    fillMode: root.querySelector('#design-vector-fill-mode').value,
    fillStart: root.querySelector('#design-vector-fill-start').value,
    fillEnd: root.querySelector('#design-vector-fill-end').value,
    fillAngle: Number(root.querySelector('#design-vector-fill-angle').value),
    stroke: root.querySelector('#design-vector-stroke').value,
    strokeWidth: Number(root.querySelector('#design-vector-stroke-width').value),
    x: Number(root.querySelector('#design-vector-x').value),
    y: Number(root.querySelector('#design-vector-y').value),
    width: Number(root.querySelector('#design-vector-width').value),
    height: Number(root.querySelector('#design-vector-height').value),
    cx: Number(root.querySelector('#design-vector-cx').value),
    cy: Number(root.querySelector('#design-vector-cy').value),
    rx: Number(root.querySelector('#design-vector-rx').value),
    ry: Number(root.querySelector('#design-vector-ry').value),
    r: Number(root.querySelector('#design-vector-r').value),
    outerRadius: Number(root.querySelector('#design-vector-outer-radius').value),
    innerRadius: Number(root.querySelector('#design-vector-inner-radius').value),
    pointCount: Number(root.querySelector('#design-vector-point-count').value),
    rotate: Number(root.querySelector('#design-vector-rotate').value),
    opacity: Number(root.querySelector('#design-vector-opacity').value),
    text: root.querySelector('#design-vector-text').value,
    points: root.querySelector('#design-vector-points').value,
    d: root.querySelector('#design-vector-path').value
  });
}

function setVectorDraft(root, shape) {
  if (!shape) return;
  const setValue = (selector, value) => {
    const node = root.querySelector(selector);
    if (node && value !== undefined) node.value = value;
  };
  setValue('#design-vector-shape-type', shape.type);
  setValue('#design-vector-fill', shape.fill);
  setValue('#design-vector-fill-mode', shape.fillMode);
  setValue('#design-vector-fill-start', shape.fillStart);
  setValue('#design-vector-fill-end', shape.fillEnd);
  setValue('#design-vector-fill-angle', shape.fillAngle);
  setValue('#design-vector-stroke', shape.stroke);
  setValue('#design-vector-stroke-width', shape.strokeWidth);
  setValue('#design-vector-x', shape.x);
  setValue('#design-vector-y', shape.y);
  setValue('#design-vector-width', shape.width);
  setValue('#design-vector-height', shape.height);
  setValue('#design-vector-cx', shape.cx);
  setValue('#design-vector-cy', shape.cy);
  setValue('#design-vector-rx', shape.rx);
  setValue('#design-vector-ry', shape.ry);
  setValue('#design-vector-r', shape.r);
  setValue('#design-vector-outer-radius', shape.outerRadius);
  setValue('#design-vector-inner-radius', shape.innerRadius);
  setValue('#design-vector-point-count', shape.pointCount);
  setValue('#design-vector-rotate', shape.rotate);
  setValue('#design-vector-opacity', shape.opacity);
  setValue('#design-vector-text', shape.text);
  setValue('#design-vector-points', shape.points);
  setValue('#design-vector-path', shape.d);
}

function cloneVectorShapes(shapes) {
  return shapes.map((shape) => ({ ...shape }));
}

function ensureVectorSelection(vectorState) {
  if (!Array.isArray(vectorState.selectedIds)) {
    vectorState.selectedIds = vectorState.selectedId ? [vectorState.selectedId] : [];
  }
  vectorState.selectedIds = vectorState.selectedIds.filter((id) => vectorState.shapes.some((shape) => shape.id === id));
  if (!vectorState.selectedIds.length && vectorState.selectedId) vectorState.selectedIds = [vectorState.selectedId];
  vectorState.selectedId = vectorState.selectedIds.at(-1) || null;
}

function pushVectorHistory(vectorState) {
  vectorState.history = Array.isArray(vectorState.history) ? vectorState.history : [];
  vectorState.future = [];
  vectorState.history.push({
    shapes: cloneVectorShapes(vectorState.shapes),
    selectedId: vectorState.selectedId,
    selectedIds: [...(vectorState.selectedIds || [])]
  });
  if (vectorState.history.length > 80) vectorState.history.shift();
}

function restoreVectorSnapshot(vectorState, snapshot) {
  if (!snapshot) return;
  vectorState.shapes = cloneVectorShapes(snapshot.shapes);
  vectorState.selectedId = snapshot.selectedId;
  vectorState.selectedIds = [...(snapshot.selectedIds || [])];
  ensureVectorSelection(vectorState);
}

function undoVectorHistory(vectorState) {
  const snapshot = vectorState.history?.pop();
  if (!snapshot) return false;
  vectorState.future = Array.isArray(vectorState.future) ? vectorState.future : [];
  vectorState.future.push({
    shapes: cloneVectorShapes(vectorState.shapes),
    selectedId: vectorState.selectedId,
    selectedIds: [...(vectorState.selectedIds || [])]
  });
  restoreVectorSnapshot(vectorState, snapshot);
  return true;
}

function redoVectorHistory(vectorState) {
  const snapshot = vectorState.future?.pop();
  if (!snapshot) return false;
  vectorState.history = Array.isArray(vectorState.history) ? vectorState.history : [];
  vectorState.history.push({
    shapes: cloneVectorShapes(vectorState.shapes),
    selectedId: vectorState.selectedId,
    selectedIds: [...(vectorState.selectedIds || [])]
  });
  restoreVectorSnapshot(vectorState, snapshot);
  return true;
}

function setVectorSelection(vectorState, ids) {
  vectorState.selectedIds = [...new Set((Array.isArray(ids) ? ids : [ids]).filter(Boolean))];
  vectorState.selectedId = vectorState.selectedIds.at(-1) || null;
  ensureVectorSelection(vectorState);
}

function toggleVectorSelection(vectorState, id) {
  ensureVectorSelection(vectorState);
  const selected = new Set(vectorState.selectedIds);
  if (selected.has(id)) selected.delete(id);
  else selected.add(id);
  const ids = [...selected];
  setVectorSelection(vectorState, ids.length ? ids : [id]);
}

function updateVectorWorkspace(root, vectorState) {
  ensureVectorSelection(vectorState);
  vectorState.variables = readVectorVariables(root);
  vectorState.background = readVectorBackground(root);
  vectorState.showGrid = Boolean(root.querySelector('#design-vector-grid')?.checked);
  vectorState.snap = Boolean(root.querySelector('#design-vector-snap')?.checked);
  vectorState.zoom = Number(root.querySelector('#design-vector-zoom')?.value || 100);
  const svg = buildDesignVectorSvg({
    width: 640,
    height: 420,
    variables: vectorState.variables,
    background: vectorState.background,
    shapes: vectorState.shapes
  });
  const canvas = root.querySelector('#design-vector-canvas');
  canvas.classList.toggle('show-grid', vectorState.showGrid);
  setStyleToken(canvas, '--vector-zoom', `${vectorState.zoom / 100}`);
  canvas.innerHTML = `${svg}${renderVectorKeypoints(vectorState)}${renderVectorMarquee(vectorState)}`;
  root.querySelector('#design-vector-svg-code').textContent = svg;
  root.querySelector('#design-vector-layer-list').innerHTML = vectorState.shapes.map((shape, index) => `
    <button type="button" class="design-vector-layer${vectorState.selectedIds.includes(shape.id) ? ' is-selected' : ''}" data-vector-select="${shape.id}">
      <span>${index + 1}</span>
      <strong>${shape.type}</strong>
      <small>${shape.id}</small>
    </button>
  `).join('');
  syncVectorInspectorContext(root, vectorState);
}

function getVectorShapeBounds(shape = {}) {
  const type = VECTOR_SHAPE_TYPES.includes(shape.type) ? shape.type : 'rect';
  if (type === 'rect' || type === 'rounded-rect') {
    return {
      x: Number(shape.x) || 0,
      y: Number(shape.y) || 0,
      width: Math.max(1, Number(shape.width) || 1),
      height: Math.max(1, Number(shape.height) || 1)
    };
  }
  if (type === 'circle') {
    const r = Math.max(1, Number(shape.r) || 1);
    return { x: (Number(shape.cx) || 0) - r, y: (Number(shape.cy) || 0) - r, width: r * 2, height: r * 2 };
  }
  if (type === 'ellipse') {
    const rx = Math.max(1, Number(shape.rx) || 1);
    const ry = Math.max(1, Number(shape.ry) || 1);
    return { x: (Number(shape.cx) || 0) - rx, y: (Number(shape.cy) || 0) - ry, width: rx * 2, height: ry * 2 };
  }
  if (type === 'line') {
    const x1 = Number(shape.x1) || 0;
    const y1 = Number(shape.y1) || 0;
    const x2 = Number(shape.x2) || 0;
    const y2 = Number(shape.y2) || 0;
    return { x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.max(1, Math.abs(x2 - x1)), height: Math.max(1, Math.abs(y2 - y1)) };
  }
  if (type === 'polygon') {
    const points = String(shape.points || '').trim().split(/\s+/)
      .map((point) => point.split(',').map(Number))
      .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
    if (points.length) {
      const xs = points.map(([x]) => x);
      const ys = points.map(([, y]) => y);
      return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(1, Math.max(...xs) - Math.min(...xs)), height: Math.max(1, Math.max(...ys) - Math.min(...ys)) };
    }
  }
  if (type === 'star') {
    const r = Math.max(1, Number(shape.outerRadius) || 1);
    return { x: (Number(shape.cx) || 0) - r, y: (Number(shape.cy) || 0) - r, width: r * 2, height: r * 2 };
  }
  return { x: Number(shape.x ?? shape.cx ?? shape.x1) || 0, y: Number(shape.y ?? shape.cy ?? shape.y1) || 0, width: 120, height: 48 };
}

function getSelectedVectorShapes(vectorState) {
  ensureVectorSelection(vectorState);
  return vectorState.shapes.filter((shape) => vectorState.selectedIds.includes(shape.id));
}

function getVectorSelectionBounds(shapes) {
  const bounds = shapes.map(getVectorShapeBounds);
  if (!bounds.length) return null;
  const left = Math.min(...bounds.map((box) => box.x));
  const top = Math.min(...bounds.map((box) => box.y));
  const right = Math.max(...bounds.map((box) => box.x + box.width));
  const bottom = Math.max(...bounds.map((box) => box.y + box.height));
  return { x: left, y: top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
}

function renderVectorSelectionBox(shapeOrBounds, withHandles = true) {
  if (!shapeOrBounds) return '';
  const bounds = 'type' in shapeOrBounds ? getVectorShapeBounds(shapeOrBounds) : shapeOrBounds;
  const x = Number(bounds.x.toFixed(2));
  const y = Number(bounds.y.toFixed(2));
  const width = Number(bounds.width.toFixed(2));
  const height = Number(bounds.height.toFixed(2));
  const cx = Number((x + width / 2).toFixed(2));
  const cy = Number((y + height / 2).toFixed(2));
  const handles = withHandles ? `
        <rect class="design-vector-resize-handle" data-vector-keypoint="resize-nw" x="${x - 4}" y="${y - 4}" width="8" height="8"></rect>
        <rect class="design-vector-resize-handle" data-vector-keypoint="resize-n" x="${cx - 4}" y="${y - 4}" width="8" height="8"></rect>
        <rect class="design-vector-resize-handle" data-vector-keypoint="resize-ne" x="${x + width - 4}" y="${y - 4}" width="8" height="8"></rect>
        <rect class="design-vector-resize-handle" data-vector-keypoint="resize-e" x="${x + width - 4}" y="${cy - 4}" width="8" height="8"></rect>
        <rect class="design-vector-resize-handle" data-vector-keypoint="resize-se" x="${x + width - 4}" y="${y + height - 4}" width="8" height="8"></rect>
        <rect class="design-vector-resize-handle" data-vector-keypoint="resize-s" x="${cx - 4}" y="${y + height - 4}" width="8" height="8"></rect>
        <rect class="design-vector-resize-handle" data-vector-keypoint="resize-sw" x="${x - 4}" y="${y + height - 4}" width="8" height="8"></rect>
        <rect class="design-vector-resize-handle" data-vector-keypoint="resize-w" x="${x - 4}" y="${cy - 4}" width="8" height="8"></rect>
  ` : '';
  return `
    <g class="design-vector-selection-box">
      <rect x="${x}" y="${y}" width="${width}" height="${height}"></rect>
      <line x1="${cx}" y1="${y}" x2="${cx}" y2="${y + height}"></line>
      <line x1="${x}" y1="${cy}" x2="${x + width}" y2="${cy}"></line>
      ${handles}
    </g>
  `;
}

function syncVectorInspectorContext(root, vectorState) {
  const shape = vectorState.shapes.find((entry) => entry.id === vectorState.selectedId);
  const activeType = shape?.type || root.querySelector('#design-vector-shape-type')?.value || 'rect';
  root.querySelectorAll('[data-vector-prop-types]').forEach((field) => {
    const types = String(field.dataset.vectorPropTypes || '').split(/\s+/).filter(Boolean);
    field.classList.toggle('design-vector-field-hidden', !types.includes('all') && !types.includes(activeType));
  });
  const toolLabel = vectorState.tool === 'draw' ? 'Draw with current draft' : `${vectorState.tool || 'select'} tool`;
  const toolStatus = root.querySelector('#design-vector-tool-status');
  if (toolStatus) toolStatus.textContent = `${toolLabel}. Shift constrains, Alt mirrors, Command duplicates.`;
  const selectionStatus = root.querySelector('#design-vector-selection-status');
  if (selectionStatus) {
    const count = vectorState.selectedIds?.length || 0;
    selectionStatus.textContent = count > 1
      ? `${count} shapes selected. Drag objects or marquee another set.`
      : shape
        ? `${shape.type} selected. Drag object, handles, or rotate pin.`
        : 'No shape selected.';
  }
}

function renderVectorKeypoints(vectorState) {
  const selectedShapes = getSelectedVectorShapes(vectorState);
  if (selectedShapes.length > 1) {
    const bounds = getVectorSelectionBounds(selectedShapes);
    return `<svg class="design-vector-keypoint-layer" viewBox="0 0 640 420">${renderVectorSelectionBox(bounds, false)}</svg>`;
  }
  const shape = selectedShapes[0] || vectorState.shapes.find((entry) => entry.id === vectorState.selectedId);
  if (!shape) return '';
  const points = [];
  const center = getVectorShapeCenter(shape);
  if (shape.type === 'rect' || shape.type === 'rounded-rect') {
    points.push(['origin', Number(shape.x) || 0, Number(shape.y) || 0]);
    points.push(['size', (Number(shape.x) || 0) + (Number(shape.width) || 0), (Number(shape.y) || 0) + (Number(shape.height) || 0)]);
  } else if (shape.type === 'circle') {
    points.push(['center', Number(shape.cx) || 0, Number(shape.cy) || 0]);
    points.push(['radius', (Number(shape.cx) || 0) + (Number(shape.r) || 0), Number(shape.cy) || 0]);
  } else if (shape.type === 'ellipse') {
    points.push(['center', Number(shape.cx) || 0, Number(shape.cy) || 0]);
    points.push(['radius-x', (Number(shape.cx) || 0) + (Number(shape.rx) || 0), Number(shape.cy) || 0]);
    points.push(['radius-y', Number(shape.cx) || 0, (Number(shape.cy) || 0) + (Number(shape.ry) || 0)]);
  } else if (shape.type === 'line') {
    points.push(['start', Number(shape.x1) || 0, Number(shape.y1) || 0]);
    points.push(['end', Number(shape.x2) || 0, Number(shape.y2) || 0]);
  } else if (shape.type === 'polygon') {
    String(shape.points || '').trim().split(/\s+/).forEach((point, index) => {
      const [x, y] = point.split(',').map(Number);
      if (Number.isFinite(x) && Number.isFinite(y)) points.push([`point-${index}`, x, y]);
    });
  } else if (shape.type === 'star') {
    points.push(['center', Number(shape.cx) || 0, Number(shape.cy) || 0]);
    points.push(['outer-radius', Number(shape.cx || 0) + Number(shape.outerRadius || 0), Number(shape.cy) || 0]);
    points.push(['inner-radius', Number(shape.cx || 0) + Number(shape.innerRadius || 0), Number(shape.cy) || 0]);
  } else if (shape.type === 'path') {
    getVectorPathCoordinatePairs(shape.d).forEach((point, index) => {
      points.push([`path-point-${index}`, point.x, point.y]);
    });
  }
  const handles = points.map(([id, x, y]) => `<circle class="design-vector-keypoint" data-vector-keypoint="${id}" cx="${x}" cy="${y}" r="6"></circle>`).join('');
  return `<svg class="design-vector-keypoint-layer" viewBox="0 0 640 420">${renderVectorSelectionBox(shape)}${handles}<circle class="design-vector-keypoint design-vector-keypoint-rotate" data-vector-keypoint="rotate" cx="${center.x}" cy="${Math.max(12, center.y - 72)}" r="7"></circle></svg>`;
}

function renderVectorMarquee(vectorState) {
  const box = vectorState.marquee;
  if (!box) return '';
  const x = Math.min(box.x1, box.x2);
  const y = Math.min(box.y1, box.y2);
  const width = Math.abs(box.x2 - box.x1);
  const height = Math.abs(box.y2 - box.y1);
  return `<svg class="design-vector-marquee-layer" viewBox="0 0 640 420"><rect class="design-vector-marquee" x="${x}" y="${y}" width="${width}" height="${height}"></rect></svg>`;
}

function getVectorPathNumberTokens(d = '') {
  const tokens = [];
  const matcher = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;
  let match = matcher.exec(String(d || ''));
  while (match) {
    tokens.push({ value: Number(match[0]), start: match.index, end: match.index + match[0].length });
    match = matcher.exec(String(d || ''));
  }
  return tokens;
}

function getVectorPathCoordinatePairs(d = '') {
  const tokens = getVectorPathNumberTokens(d);
  const pairs = [];
  for (let index = 0; index < tokens.length - 1; index += 2) {
    pairs.push({ x: tokens[index].value, y: tokens[index + 1].value, xToken: tokens[index], yToken: tokens[index + 1] });
  }
  return pairs;
}

function replaceVectorPathCoordinatePair(d, index, x, y) {
  const pairs = getVectorPathCoordinatePairs(d);
  const pair = pairs[index];
  if (!pair) return d;
  const roundedX = String(Number(x.toFixed(2)));
  const roundedY = String(Number(y.toFixed(2)));
  return `${d.slice(0, pair.xToken.start)}${roundedX}${d.slice(pair.xToken.end, pair.yToken.start)}${roundedY}${d.slice(pair.yToken.end)}`;
}

function moveVectorShape(vectorState, direction) {
  const index = vectorState.shapes.findIndex((shape) => shape.id === vectorState.selectedId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= vectorState.shapes.length) return;
  const [shape] = vectorState.shapes.splice(index, 1);
  vectorState.shapes.splice(target, 0, shape);
}

function duplicateSelectedVectorShape(vectorState, offset = 18) {
  const source = vectorState.shapes.find((shape) => shape.id === vectorState.selectedId);
  if (!source) return null;
  const id = `vector-${vectorState.nextIndex}`;
  vectorState.nextIndex += 1;
  const clone = {
    ...source,
    id,
    x: source.x === undefined ? source.x : Number(source.x || 0) + offset,
    y: source.y === undefined ? source.y : Number(source.y || 0) + offset,
    cx: source.cx === undefined ? source.cx : Number(source.cx || 0) + offset,
    cy: source.cy === undefined ? source.cy : Number(source.cy || 0) + offset,
    x1: source.x1 === undefined ? source.x1 : Number(source.x1 || 0) + offset,
    y1: source.y1 === undefined ? source.y1 : Number(source.y1 || 0) + offset,
    x2: source.x2 === undefined ? source.x2 : Number(source.x2 || 0) + offset,
    y2: source.y2 === undefined ? source.y2 : Number(source.y2 || 0) + offset
  };
  vectorState.shapes.push(clone);
  setVectorSelection(vectorState, [id]);
  return clone;
}

function removeSelectedVectorShape(vectorState) {
  if (vectorState.shapes.length <= 1) return null;
  const ids = vectorState.selectedIds?.length ? vectorState.selectedIds : [vectorState.selectedId];
  vectorState.shapes = vectorState.shapes.filter((shape) => !ids.includes(shape.id));
  setVectorSelection(vectorState, [vectorState.shapes.at(-1)?.id || vectorState.shapes[0]?.id || null]);
  return vectorState.shapes.find((shape) => shape.id === vectorState.selectedId) || null;
}

function moveSelectedVectorShape(vectorState, dx, dy, startShape = null) {
  const ids = vectorState.selectedIds?.length ? vectorState.selectedIds : [vectorState.selectedId];
  ids.forEach((id) => {
    const shape = vectorState.shapes.find((entry) => entry.id === id);
    if (!shape) return;
    const base = startShape?.id === id ? startShape : (startShape?.[id] || shape);
    moveVectorShapeFromBase(shape, base, dx, dy);
  });
}

function moveVectorShapeFromBase(shape, base, dx, dy) {
  if ('x' in shape) shape.x = Number(base.x || 0) + dx;
  if ('y' in shape) shape.y = Number(base.y || 0) + dy;
  if ('cx' in shape) shape.cx = Number(base.cx || 0) + dx;
  if ('cy' in shape) shape.cy = Number(base.cy || 0) + dy;
  if ('x1' in shape) shape.x1 = Number(base.x1 || 0) + dx;
  if ('y1' in shape) shape.y1 = Number(base.y1 || 0) + dy;
  if ('x2' in shape) shape.x2 = Number(base.x2 || 0) + dx;
  if ('y2' in shape) shape.y2 = Number(base.y2 || 0) + dy;
  if (shape.type === 'polygon') {
    shape.points = String(base.points || '').trim().split(/\s+/).map((point) => {
      const [x, y] = point.split(',').map(Number);
      return Number.isFinite(x) && Number.isFinite(y) ? `${Math.round(x + dx)},${Math.round(y + dy)}` : point;
    }).join(' ');
  }
  if (shape.type === 'path') {
    let nextPath = String(base.d || '');
    getVectorPathCoordinatePairs(base.d).forEach((point, index) => {
      nextPath = replaceVectorPathCoordinatePair(nextPath, index, point.x + dx, point.y + dy);
    });
    shape.d = nextPath;
  }
}

function resizeSelectedVectorShape(vectorState, dx, dy, startShape = null) {
  const shape = vectorState.shapes.find((entry) => entry.id === vectorState.selectedId);
  if (!shape) return;
  const base = startShape || shape;
  if ('width' in shape) shape.width = Math.max(1, Number(base.width || 1) + dx);
  if ('height' in shape) shape.height = Math.max(1, Number(base.height || 1) + dy);
  if ('r' in shape) shape.r = Math.max(1, Number(base.r || 1) + (dx + dy) / 2);
  if ('rx' in shape) shape.rx = Math.max(1, Number(base.rx || 1) + dx / 2);
  if ('ry' in shape) shape.ry = Math.max(1, Number(base.ry || 1) + dy / 2);
  if ('outerRadius' in shape) shape.outerRadius = Math.max(1, Number(base.outerRadius || 1) + (dx + dy) / 2);
  if ('innerRadius' in shape) shape.innerRadius = Math.max(1, Number(base.innerRadius || 1) + (dx + dy) / 4);
}

function resizeSelectedVectorShapeFromCenter(vectorState, dx, dy, startShape = null) {
  const shape = vectorState.shapes.find((entry) => entry.id === vectorState.selectedId);
  if (!shape) return;
  const base = startShape || shape;
  resizeSelectedVectorShape(vectorState, dx * 2, dy * 2, base);
  if ('x' in shape) shape.x = Number(base.x || 0) - dx;
  if ('y' in shape) shape.y = Number(base.y || 0) - dy;
}

function applyVectorBoundsToShape(shape, bounds, baseShape) {
  const baseBounds = getVectorShapeBounds(baseShape || shape);
  const next = {
    x: bounds.x,
    y: bounds.y,
    width: Math.max(1, bounds.width),
    height: Math.max(1, bounds.height)
  };
  if (shape.type === 'rect' || shape.type === 'rounded-rect') {
    shape.x = Math.round(next.x);
    shape.y = Math.round(next.y);
    shape.width = Math.round(next.width);
    shape.height = Math.round(next.height);
  } else if (shape.type === 'circle') {
    const size = Math.max(1, Math.min(next.width, next.height));
    shape.cx = Math.round(next.x + next.width / 2);
    shape.cy = Math.round(next.y + next.height / 2);
    shape.r = Math.round(size / 2);
  } else if (shape.type === 'ellipse') {
    shape.cx = Math.round(next.x + next.width / 2);
    shape.cy = Math.round(next.y + next.height / 2);
    shape.rx = Math.round(next.width / 2);
    shape.ry = Math.round(next.height / 2);
  } else if (shape.type === 'star') {
    const scale = Math.max(next.width / Math.max(1, baseBounds.width), next.height / Math.max(1, baseBounds.height));
    shape.cx = Math.round(next.x + next.width / 2);
    shape.cy = Math.round(next.y + next.height / 2);
    shape.outerRadius = Math.max(1, Math.round(Number(baseShape?.outerRadius || shape.outerRadius || 1) * scale));
    shape.innerRadius = Math.max(1, Math.round(Number(baseShape?.innerRadius || shape.innerRadius || 1) * scale));
  } else if (shape.type === 'line') {
    shape.x1 = Math.round(next.x);
    shape.y1 = Math.round(next.y);
    shape.x2 = Math.round(next.x + next.width);
    shape.y2 = Math.round(next.y + next.height);
  } else if (shape.type === 'polygon') {
    const sx = next.width / Math.max(1, baseBounds.width);
    const sy = next.height / Math.max(1, baseBounds.height);
    shape.points = String(baseShape?.points || shape.points || '').trim().split(/\s+/).map((point) => {
      const [x, y] = point.split(',').map(Number);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return point;
      return `${Math.round(next.x + (x - baseBounds.x) * sx)},${Math.round(next.y + (y - baseBounds.y) * sy)}`;
    }).join(' ');
  } else if (shape.type === 'path') {
    const sx = next.width / Math.max(1, baseBounds.width);
    const sy = next.height / Math.max(1, baseBounds.height);
    let nextPath = String(baseShape?.d || shape.d || '');
    getVectorPathCoordinatePairs(baseShape?.d || shape.d).forEach((point, index) => {
      nextPath = replaceVectorPathCoordinatePair(nextPath, index, next.x + (point.x - baseBounds.x) * sx, next.y + (point.y - baseBounds.y) * sy);
    });
    shape.d = nextPath;
  }
}

function moveSelectedVectorHandle(vectorState, handle, dx, dy, startShape = null, options = {}) {
  const shape = vectorState.shapes.find((entry) => entry.id === vectorState.selectedId);
  if (!shape) return;
  const base = startShape || shape;
  const bounds = getVectorShapeBounds(base);
  let left = bounds.x;
  let right = bounds.x + bounds.width;
  let top = bounds.y;
  let bottom = bounds.y + bounds.height;
  if (handle.includes('w')) left += dx;
  if (handle.includes('e')) right += dx;
  if (handle.includes('n')) top += dy;
  if (handle.includes('s')) bottom += dy;
  if (options.altKey) {
    const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    const halfWidth = Math.max(Math.abs(right - center.x), Math.abs(left - center.x));
    const halfHeight = Math.max(Math.abs(bottom - center.y), Math.abs(top - center.y));
    left = center.x - halfWidth;
    right = center.x + halfWidth;
    top = center.y - halfHeight;
    bottom = center.y + halfHeight;
  }
  if (options.shiftKey) {
    const ratio = bounds.width / Math.max(1, bounds.height);
    const width = Math.max(1, Math.abs(right - left));
    const height = width / Math.max(0.01, ratio);
    if (handle.includes('n')) top = bottom - height;
    else bottom = top + height;
  }
  applyVectorBoundsToShape(shape, {
    x: Math.min(left, right),
    y: Math.min(top, bottom),
    width: Math.abs(right - left),
    height: Math.abs(bottom - top)
  }, base);
}

function rotateSelectedVectorShape(vectorState, point, startShape = null, rotationCenter = null, startPointerAngle = 0) {
  const shape = vectorState.shapes.find((entry) => entry.id === vectorState.selectedId);
  if (!shape) return;
  const center = rotationCenter || getVectorShapeCenter(shape);
  const angle = Math.atan2(point.y - center.y, point.x - center.x);
  const delta = ((angle - startPointerAngle) * 180) / Math.PI;
  shape.rotate = Number(((Number(startShape?.rotate ?? shape.rotate) || 0) + delta).toFixed(2));
}

function moveSelectedVectorKeypoint(vectorState, keypoint, dx, dy, startShape = null) {
  const shape = vectorState.shapes.find((entry) => entry.id === vectorState.selectedId);
  if (!shape) return;
  const base = startShape || shape;
  if (shape.type === 'rect' || shape.type === 'rounded-rect') {
    if (keypoint === 'origin') {
      shape.x = Number(base.x || 0) + dx;
      shape.y = Number(base.y || 0) + dy;
      shape.width = Math.max(1, Number(base.width || 1) - dx);
      shape.height = Math.max(1, Number(base.height || 1) - dy);
    } else if (keypoint === 'size') {
      shape.width = Math.max(1, Number(base.width || 1) + dx);
      shape.height = Math.max(1, Number(base.height || 1) + dy);
    }
  } else if (shape.type === 'circle') {
    if (keypoint === 'center') {
      shape.cx = Number(base.cx || 0) + dx;
      shape.cy = Number(base.cy || 0) + dy;
    } else if (keypoint === 'radius') {
      shape.r = Math.max(1, Number(base.r || 1) + dx);
    }
  } else if (shape.type === 'ellipse') {
    if (keypoint === 'center') {
      shape.cx = Number(base.cx || 0) + dx;
      shape.cy = Number(base.cy || 0) + dy;
    } else if (keypoint === 'radius-x') {
      shape.rx = Math.max(1, Number(base.rx || 1) + dx);
    } else if (keypoint === 'radius-y') {
      shape.ry = Math.max(1, Number(base.ry || 1) + dy);
    }
  } else if (shape.type === 'line') {
    if (keypoint === 'start') {
      shape.x1 = Number(base.x1 || 0) + dx;
      shape.y1 = Number(base.y1 || 0) + dy;
    } else if (keypoint === 'end') {
      shape.x2 = Number(base.x2 || 0) + dx;
      shape.y2 = Number(base.y2 || 0) + dy;
    }
  } else if (shape.type === 'polygon' && keypoint.startsWith('point-')) {
    const pointIndex = Number(keypoint.replace('point-', ''));
    const points = String(base.points || '').trim().split(/\s+/);
    const [x, y] = String(points[pointIndex] || '').split(',').map(Number);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      points[pointIndex] = `${Math.round(x + dx)},${Math.round(y + dy)}`;
      shape.points = points.join(' ');
    }
  } else if (shape.type === 'star') {
    if (keypoint === 'center') {
      shape.cx = Number(base.cx || 0) + dx;
      shape.cy = Number(base.cy || 0) + dy;
    } else if (keypoint === 'outer-radius') {
      shape.outerRadius = Math.max(1, Number(base.outerRadius || 1) + dx);
    } else if (keypoint === 'inner-radius') {
      shape.innerRadius = Math.max(1, Number(base.innerRadius || 1) + dx);
    }
  } else if (shape.type === 'path' && keypoint.startsWith('path-point-')) {
    moveSelectedVectorPathPoint(vectorState, keypoint, dx, dy, base);
  }
}

function moveSelectedVectorPathPoint(vectorState, keypoint, dx, dy, startShape = null) {
  const shape = vectorState.shapes.find((entry) => entry.id === vectorState.selectedId);
  if (!shape) return;
  const base = startShape || shape;
  const pointIndex = Number(keypoint.replace('path-point-', ''));
  const point = getVectorPathCoordinatePairs(base.d).at(pointIndex);
  if (!point) return;
  shape.d = replaceVectorPathCoordinatePair(base.d, pointIndex, point.x + dx, point.y + dy);
}

function getVectorPointerPoint(event, stage) {
  const svg = stage?.querySelector('svg:not(.design-vector-keypoint-layer)');
  const rect = svg?.getBoundingClientRect();
  if (!rect?.width || !rect?.height) {
    return { x: event.clientX, y: event.clientY };
  }
  return {
    x: ((event.clientX - rect.left) / rect.width) * 640,
    y: ((event.clientY - rect.top) / rect.height) * 420
  };
}

function getClickedVectorShapeId(event, vectorState) {
  const clickedId = event.target?.id || event.target?.closest?.('[id]')?.id || '';
  return vectorState.shapes.some((shape) => shape.id === clickedId) ? clickedId : '';
}

function shapesIntersectBounds(shapeBounds, bounds) {
  return shapeBounds.x <= bounds.x + bounds.width
    && shapeBounds.x + shapeBounds.width >= bounds.x
    && shapeBounds.y <= bounds.y + bounds.height
    && shapeBounds.y + shapeBounds.height >= bounds.y;
}

function selectVectorShapesInMarquee(vectorState, marquee, additive = false) {
  const bounds = {
    x: Math.min(marquee.x1, marquee.x2),
    y: Math.min(marquee.y1, marquee.y2),
    width: Math.abs(marquee.x2 - marquee.x1),
    height: Math.abs(marquee.y2 - marquee.y1)
  };
  const ids = vectorState.shapes
    .filter((shape) => shapesIntersectBounds(getVectorShapeBounds(shape), bounds))
    .map((shape) => shape.id);
  if (additive) setVectorSelection(vectorState, [...(vectorState.selectedIds || []), ...ids]);
  else setVectorSelection(vectorState, ids);
}

function placeVectorShapeAtPoint(shape, point) {
  const next = { ...shape };
  if ('x' in next) next.x = Math.round(point.x - (Number(next.width || 1) / 2));
  if ('y' in next) next.y = Math.round(point.y - (Number(next.height || 1) / 2));
  if ('cx' in next) next.cx = Math.round(point.x);
  if ('cy' in next) next.cy = Math.round(point.y);
  if ('x1' in next && 'x2' in next) {
    const width = Number(next.x2 || 0) - Number(next.x1 || 0);
    const height = Number(next.y2 || 0) - Number(next.y1 || 0);
    next.x1 = Math.round(point.x - width / 2);
    next.y1 = Math.round(point.y - height / 2);
    next.x2 = Math.round(point.x + width / 2);
    next.y2 = Math.round(point.y + height / 2);
  }
  return next;
}

function openVectorContextMenu(event, root, vectorState, syncVector) {
  root.querySelector('.design-vector-context-menu')?.remove();
  const shapeId = getClickedVectorShapeId(event, vectorState);
  if (shapeId) {
    setVectorSelection(vectorState, [shapeId]);
    setVectorDraft(root, vectorState.shapes.find((entry) => entry.id === vectorState.selectedId));
    syncVector();
  }
  const menu = document.createElement('div');
  menu.className = 'design-vector-context-menu';
  menu.innerHTML = `
    <button type="button" data-vector-context-action="duplicate">Duplicate</button>
    <button type="button" data-vector-context-action="front">Bring Forward</button>
    <button type="button" data-vector-context-action="back">Send Backward</button>
    <button type="button" data-vector-context-action="remove">Remove</button>
  `;
  menu.style.left = `${event.clientX || 0}px`;
  menu.style.top = `${event.clientY || 0}px`;
  menu.addEventListener('pointerdown', (menuEvent) => {
    menuEvent.stopPropagation();
  });
  menu.addEventListener('click', (menuEvent) => {
    const action = menuEvent.target.closest('[data-vector-context-action]')?.dataset.vectorContextAction;
    if (!action) return;
    pushVectorHistory(vectorState);
    if (action === 'duplicate') {
      const clone = duplicateSelectedVectorShape(vectorState);
      if (clone) setVectorDraft(root, clone);
    } else if (action === 'front') {
      moveVectorShape(vectorState, 1);
    } else if (action === 'back') {
      moveVectorShape(vectorState, -1);
    } else if (action === 'remove') {
      setVectorDraft(root, removeSelectedVectorShape(vectorState));
    }
    menu.remove();
    syncVector();
  });
  root.appendChild(menu);
  setTimeout(() => {
    window.addEventListener('pointerdown', () => menu.remove(), { once: true });
  }, 0);
}

function handleVectorPointerDown(event, root, vectorState, syncVector) {
  const stage = root.querySelector('#design-vector-canvas');
  if (!stage) return;
  const tool = vectorState.tool || 'select';
  const keypoint = event.target.closest?.('[data-vector-keypoint]')?.dataset.vectorKeypoint || '';
  const clickedId = keypoint ? '' : getClickedVectorShapeId(event, vectorState);
  const startPoint = getVectorPointerPoint(event, stage);
  if (vectorState.snap) {
    startPoint.x = Math.round(startPoint.x / 10) * 10;
    startPoint.y = Math.round(startPoint.y / 10) * 10;
  }
  if (clickedId) {
    if ((event.ctrlKey || event.metaKey) && event.altKey) {
      pushVectorHistory(vectorState);
      setVectorSelection(vectorState, [clickedId]);
      const clone = duplicateSelectedVectorShape(vectorState, event.altKey ? 0 : 18);
      if (clone) setVectorDraft(root, clone);
    } else if (event.ctrlKey || event.metaKey) {
      toggleVectorSelection(vectorState, clickedId);
    } else if (!vectorState.selectedIds?.includes(clickedId)) {
      setVectorSelection(vectorState, [clickedId]);
    }
    setVectorDraft(root, vectorState.shapes.find((entry) => entry.id === vectorState.selectedId));
    syncVector();
  } else if ((tool === 'draw' || VECTOR_SHAPE_TYPES.includes(tool)) && !keypoint) {
    pushVectorHistory(vectorState);
    const id = `vector-${vectorState.nextIndex}`;
    vectorState.nextIndex += 1;
    const draft = tool === 'draw' ? readVectorDraft(root, id) : createDesignVectorShape(tool, { id }, vectorState.nextIndex);
    const shape = placeVectorShapeAtPoint(draft, startPoint);
    vectorState.shapes.push(shape);
    setVectorSelection(vectorState, [id]);
    setVectorDraft(root, shape);
    syncVector();
  } else if (tool === 'select' && !keypoint) {
    const onMarqueeMove = (moveEvent) => {
      const point = getVectorPointerPoint(moveEvent, stage);
      vectorState.marquee = { x1: startPoint.x, y1: startPoint.y, x2: point.x, y2: point.y };
      syncVector();
    };
    const endMarquee = (upEvent) => {
      const point = getVectorPointerPoint(upEvent, stage);
      const marquee = { x1: startPoint.x, y1: startPoint.y, x2: point.x, y2: point.y };
      vectorState.marquee = null;
      if (Math.abs(marquee.x2 - marquee.x1) > 4 || Math.abs(marquee.y2 - marquee.y1) > 4) {
        selectVectorShapesInMarquee(vectorState, marquee, upEvent.ctrlKey || upEvent.metaKey);
      } else {
        setVectorSelection(vectorState, []);
      }
      setVectorDraft(root, vectorState.shapes.find((entry) => entry.id === vectorState.selectedId));
      syncVector();
      window.removeEventListener('pointermove', onMarqueeMove);
      window.removeEventListener('pointerup', endMarquee);
    };
    window.addEventListener('pointermove', onMarqueeMove);
    window.addEventListener('pointerup', endMarquee, { once: true });
    return;
  }
  const shape = vectorState.shapes.find((entry) => entry.id === vectorState.selectedId);
  if (!shape) return;
  const startShape = { ...shape };
  const startShapes = Object.fromEntries(getSelectedVectorShapes(vectorState).map((entry) => [entry.id, { ...entry }]));
  const initialShiftKey = event.shiftKey;
  const initialAltKey = event.altKey;
  const rotationCenter = getVectorShapeCenter(startShape);
  const startPointerAngle = Math.atan2(startPoint.y - rotationCenter.y, startPoint.x - rotationCenter.x);
  let historyPushed = false;
  const onMove = (moveEvent) => {
    const point = getVectorPointerPoint(moveEvent, stage);
    let dx = point.x - startPoint.x;
    let dy = point.y - startPoint.y;
    if (vectorState.snap) {
      dx = Math.round(dx / 10) * 10;
      dy = Math.round(dy / 10) * 10;
    }
    if (moveEvent.shiftKey || initialShiftKey) {
      if (keypoint || tool === 'draw') {
        const size = Math.max(Math.abs(dx), Math.abs(dy));
        dx = dx < 0 ? -size : size;
        dy = dy < 0 ? -size : size;
      } else if (Math.abs(dx) > Math.abs(dy)) {
        dy = 0;
      } else {
        dx = 0;
      }
    }
    if (!historyPushed && (Math.abs(dx) > 0 || Math.abs(dy) > 0 || keypoint === 'rotate' || tool === 'rotate')) {
      pushVectorHistory(vectorState);
      historyPushed = true;
    }
    if (keypoint === 'rotate' || tool === 'rotate') rotateSelectedVectorShape(vectorState, point, startShape, rotationCenter, startPointerAngle);
    else if (keypoint.startsWith('resize-')) moveSelectedVectorHandle(vectorState, keypoint, dx, dy, startShape, { shiftKey: moveEvent.shiftKey || initialShiftKey, altKey: moveEvent.altKey || initialAltKey });
    else if (keypoint.startsWith('path-point-')) moveSelectedVectorPathPoint(vectorState, keypoint, dx, dy, startShape);
    else if (keypoint) moveSelectedVectorKeypoint(vectorState, keypoint, dx, dy, startShape);
    else if (tool === 'draw' && (moveEvent.altKey || initialAltKey)) resizeSelectedVectorShapeFromCenter(vectorState, dx, dy, startShape);
    else if (tool === 'draw') resizeSelectedVectorShape(vectorState, dx, dy, startShape);
    else moveSelectedVectorShape(vectorState, dx, dy, startShapes);
    setVectorDraft(root, vectorState.shapes.find((shape) => shape.id === vectorState.selectedId));
    syncVector();
  };
  const cleanupPointer = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', cleanupPointer);
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', cleanupPointer, { once: true });
}

export async function mountDesignStudio(parent, toolId) {
  const tool = getTool(toolId);
  const studio = getStudioByToolId(toolId);
  const shell = createStudioShell(parent, {
    className: 'design-studio-shell',
    eyebrow: studio.title,
    title: tool.title,
    description: MODE_META[toolId].description,
    toolIds: studio.toolIds,
    activeToolId: toolId,
    showHero: toolId !== 'svg-editor',
    showRouteTabs: toolId !== 'svg-editor',
    metrics: [
      { key: 'views', label: 'Views', value: `${studio.toolIds.length}` },
      { key: 'focus', label: 'Focus', value: MODE_META[toolId].title }
    ]
  });

  shell.content.innerHTML = toolId === 'color-tools'
    ? renderColorLayout()
    : toolId === 'css-generators'
      ? renderShadowLayout()
      : renderVisualLayout();

  const cleanup = [];

  if (toolId === 'visual-generators' || toolId === 'svg-editor') {
    const vectorState = {
      variables: { ...DEFAULT_VECTOR_VARIABLES },
      background: { ...DEFAULT_VECTOR_BACKGROUND },
      shapes: [
        createDesignVectorShape('rect', { id: 'vector-panel-1', x: 70, y: 70, width: 220, height: 130, rx: 16, fill: 'var(--vector-fill)' }, 0),
        createDesignVectorShape('circle', { id: 'vector-orbit-2', cx: 390, cy: 132, r: 72, fill: 'var(--vector-accent)', opacity: 0.82 }, 1),
        createDesignVectorShape('path', { id: 'vector-mark-3', d: 'M 170 318 C 240 222 382 240 470 318', fill: 'none', stroke: 'var(--vector-stroke)', strokeWidth: 10 }, 2)
      ],
      selectedId: 'vector-panel-1',
      selectedIds: ['vector-panel-1'],
      nextIndex: 4,
      tool: 'select',
      history: [],
      future: [],
      marquee: null
    };
    const syncVector = () => {
      updateVectorWorkspace(shell.content, vectorState);
      shell.setStatus('Vector workspace updated.', 'success');
    };
    setVectorDraft(shell.content, vectorState.shapes[0]);
    updateVectorWorkspace(shell.content, vectorState);
    cleanup.push(...Array.from(shell.content.querySelectorAll('[data-vector-var], #design-vector-bg-type, #design-vector-bg-start, #design-vector-bg-end, #design-vector-bg-angle, #design-vector-grid, #design-vector-snap, #design-vector-zoom')).map((node) => bind(node, 'input', syncVector)));
    cleanup.push(...Array.from(shell.content.querySelectorAll('#design-vector-shape-type, #design-vector-fill, #design-vector-fill-mode, #design-vector-fill-start, #design-vector-fill-end, #design-vector-fill-angle, #design-vector-stroke, #design-vector-stroke-width, #design-vector-x, #design-vector-y, #design-vector-width, #design-vector-height, #design-vector-cx, #design-vector-cy, #design-vector-rx, #design-vector-ry, #design-vector-r, #design-vector-outer-radius, #design-vector-inner-radius, #design-vector-point-count, #design-vector-rotate, #design-vector-opacity, #design-vector-text, #design-vector-points, #design-vector-path')).map((node) => bind(node, 'input', () => {
      const index = vectorState.shapes.findIndex((shape) => shape.id === vectorState.selectedId);
      if (index >= 0) {
        pushVectorHistory(vectorState);
        vectorState.shapes[index] = readVectorDraft(shell.content, vectorState.selectedId);
        syncVector();
      }
    })));
    cleanup.push(bind(shell.content.querySelector('#design-vector-shape-type'), 'change', (event) => {
      setVectorDraft(shell.content, createDesignVectorShape(event.target.value, {}, vectorState.nextIndex));
    }));
    cleanup.push(...Array.from(shell.content.querySelectorAll('[data-vector-tool]')).map((node) => bind(node, 'click', (event) => {
      vectorState.tool = event.currentTarget.dataset.vectorTool;
      if (VECTOR_SHAPE_TYPES.includes(vectorState.tool)) {
        setVectorDraft(shell.content, createDesignVectorShape(vectorState.tool, {}, vectorState.nextIndex));
      }
      shell.content.querySelectorAll('[data-vector-tool]').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.vectorTool === vectorState.tool);
      });
      syncVectorInspectorContext(shell.content, vectorState);
    })));
    cleanup.push(bind(shell.content.querySelector('#design-vector-canvas'), 'pointerdown', (event) => {
      handleVectorPointerDown(event, shell.content, vectorState, syncVector);
    }));
    cleanup.push(bind(shell.content.querySelector('#design-vector-canvas'), 'contextmenu', (event) => {
      event.preventDefault();
      openVectorContextMenu(event, shell.content, vectorState, syncVector);
    }));
    cleanup.push(bind(shell.content.querySelector('#design-vector-add'), 'click', () => {
      pushVectorHistory(vectorState);
      const id = `vector-${vectorState.nextIndex}`;
      vectorState.nextIndex += 1;
      const shape = readVectorDraft(shell.content, id);
      vectorState.shapes.push(shape);
      setVectorSelection(vectorState, [id]);
      syncVector();
    }));
    cleanup.push(bind(shell.content.querySelector('#design-vector-update'), 'click', () => {
      const index = vectorState.shapes.findIndex((shape) => shape.id === vectorState.selectedId);
      if (index < 0) return;
      pushVectorHistory(vectorState);
      vectorState.shapes[index] = readVectorDraft(shell.content, vectorState.selectedId);
      syncVector();
    }));
    cleanup.push(bind(shell.content.querySelector('#design-vector-duplicate'), 'click', () => {
      pushVectorHistory(vectorState);
      const clone = duplicateSelectedVectorShape(vectorState);
      if (!clone) return;
      setVectorDraft(shell.content, clone);
      syncVector();
    }));
    cleanup.push(bind(shell.content.querySelector('#design-vector-remove'), 'click', () => {
      pushVectorHistory(vectorState);
      setVectorDraft(shell.content, removeSelectedVectorShape(vectorState));
      syncVector();
    }));
    cleanup.push(bind(shell.content.querySelector('#design-vector-undo'), 'click', () => {
      if (!undoVectorHistory(vectorState)) return;
      setVectorDraft(shell.content, vectorState.shapes.find((shape) => shape.id === vectorState.selectedId));
      syncVector();
    }));
    cleanup.push(bind(shell.content.querySelector('#design-vector-redo'), 'click', () => {
      if (!redoVectorHistory(vectorState)) return;
      setVectorDraft(shell.content, vectorState.shapes.find((shape) => shape.id === vectorState.selectedId));
      syncVector();
    }));
    cleanup.push(bind(shell.content.querySelector('#design-vector-back'), 'click', () => {
      pushVectorHistory(vectorState);
      moveVectorShape(vectorState, -1);
      syncVector();
    }));
    cleanup.push(bind(shell.content.querySelector('#design-vector-front'), 'click', () => {
      pushVectorHistory(vectorState);
      moveVectorShape(vectorState, 1);
      syncVector();
    }));
    cleanup.push(bind(shell.content.querySelector('#design-vector-copy-svg'), 'click', () => copyToClipboard(shell.content.querySelector('#design-vector-svg-code').textContent)));
    cleanup.push(bind(shell.content.querySelector('#design-vector-download-svg'), 'click', () => downloadFile(shell.content.querySelector('#design-vector-svg-code').textContent, 'vector-workspace.svg', 'image/svg+xml')));
    cleanup.push(bind(shell.content.querySelector('#design-vector-layer-list'), 'click', (event) => {
      const button = event.target.closest('[data-vector-select]');
      if (!button) return;
      if (event.ctrlKey || event.metaKey) toggleVectorSelection(vectorState, button.dataset.vectorSelect);
      else setVectorSelection(vectorState, [button.dataset.vectorSelect]);
      setVectorDraft(shell.content, vectorState.shapes.find((shape) => shape.id === vectorState.selectedId));
      syncVector();
    }));
    syncVector();
    state = { root: shell.root, cleanup };
    return;
  }

  if (toolId === 'color-tools') {
    const update = (value) => {
      const hex = resolveColorInput(value) || '#0A84FF';
      const { r, g, b } = hexToRgb(hex);
      const hsl = rgbToHsl(r, g, b);
      const ratio = contrastRatio(hex);
      const preview = shell.content.querySelector('#color-preview');
      const textTone = ratio >= 7 ? '#000000' : '#FFFFFF';
      shell.content.querySelector('#color-picker').value = hex;
      shell.content.querySelector('#color-hex').value = hex;
      shell.content.querySelector('#color-rgb').value = `rgb(${r}, ${g}, ${b})`;
      shell.content.querySelector('#color-hsl').value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
      preview.style.background = hex;
      preview.style.color = textTone;
      shell.content.querySelector('#color-contrast').textContent = `${ratio.toFixed(1)}:1`;
      shell.content.querySelector('#color-grade').textContent = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Fail';
      shell.content.querySelector('#color-text-tone').textContent = textTone;
      const palette = shell.content.querySelector('#color-palette');
      palette.innerHTML = '';
      buildPalette(hex).forEach((stepHex, index) => {
        const swatch = document.createElement('div');
        swatch.className = 'studio-output-card color-palette-swatch';
        swatch.style.background = stepHex;
        swatch.style.color = contrastRatio(stepHex) >= 7 ? '#000' : '#fff';
        swatch.innerHTML = `<span>Step ${index + 1}</span><strong>${stepHex}</strong>`;
        swatch.addEventListener('click', () => update(stepHex));
        palette.appendChild(swatch);
      });
      shell.setStatus('Color values synchronized.', 'success');
    };
    cleanup.push(bind(shell.content.querySelector('#color-picker'), 'input', (event) => update(event.target.value)));
    cleanup.push(bind(shell.content.querySelector('#color-hex'), 'input', (event) => {
      const nextHex = resolveColorInput(event.target.value);
      if (nextHex) update(nextHex);
    }));
    cleanup.push(bind(shell.content.querySelector('#color-rgb'), 'input', (event) => {
      const nextHex = resolveColorInput(event.target.value);
      if (nextHex) update(nextHex);
    }));
    cleanup.push(bind(shell.content.querySelector('#color-hsl'), 'input', (event) => {
      const nextHex = resolveColorInput(event.target.value);
      if (nextHex) update(nextHex);
    }));
    cleanup.push(bind(shell.content.querySelector('#color-copy-hex'), 'click', () => copyToClipboard(shell.content.querySelector('#color-hex').value)));
    update('#0A84FF');
    state = { root: shell.root, cleanup };
    return;
  }

  const updateShadow = () => {
    const x = shell.content.querySelector('#shadow-x').value;
    const y = shell.content.querySelector('#shadow-y').value;
    const blur = shell.content.querySelector('#shadow-blur').value;
    const spread = shell.content.querySelector('#shadow-spread').value;
    const layers = Number(shell.content.querySelector('#shadow-layers').value);
    const inset = shell.content.querySelector('#shadow-inset').value === '1' ? 'inset ' : '';
    const shadow = Array.from({ length: layers }, (_, index) => {
      const factor = index + 1;
      return `${inset}${Number(x) * factor}px ${Number(y) * factor}px ${Number(blur) * factor}px ${Number(spread)}px ${hexToRgba(shell.content.querySelector('#shadow-color').value, Number(shell.content.querySelector('#shadow-opacity').value) / factor)}`;
    }).join(', ');
    shell.content.querySelector('#shadow-preview').style.boxShadow = shadow;
    shell.content.querySelector('#shadow-code').textContent = `box-shadow: ${shadow};`;
    shell.setStatus('Shadow updated.', 'success');
  };
  cleanup.push(...Array.from(shell.content.querySelectorAll('#shadow-x, #shadow-y, #shadow-blur, #shadow-spread, #shadow-layers, #shadow-color, #shadow-opacity, #shadow-inset')).map((node) => bind(node, 'input', updateShadow)));
  cleanup.push(bind(shell.content.querySelector('#shadow-copy'), 'click', () => copyToClipboard(shell.content.querySelector('#shadow-code').textContent)));
  updateShadow();
  state = { root: shell.root, cleanup };
}

export function unmountDesignStudio() {
  if (!state) return;
  for (const dispose of state.cleanup) dispose();
  state.root?.remove();
  state = null;
}

function bind(node, eventName, handler) {
  if (!node) return () => {};
  node.addEventListener(eventName, handler);
  return () => node.removeEventListener(eventName, handler);
}

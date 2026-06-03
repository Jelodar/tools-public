import { closeAudioContext, createBrowserAudioContext, isAudioContextUsable, resumeAudioContext, stopAndDisconnectAudioNodes } from '../utils/audio-context.js';
import { runFFmpegJob } from '../core/ffmpeg-service.js';
import { bindMediaControls, setMediaPlaybackState } from '../utils/media-session.js';
import {
  AMBIENT_MODES,
  AMBIENT_VISUALIZER_RANGES,
  NOTE_FREQUENCIES,
  NOISE_MODES,
  NOISE_VISUALIZER_RANGES,
  VISUALIZER_PALETTE,
  computeSpatialDistanceGain,
  computeSpatialPan,
  createFinalCountdownCycle,
  createLoveThemeCycle,
  createNoirOrbitCycle,
  createOrganHorizonCycle,
  createRhapsodySuiteCycle,
  createStarwarsMarchCycle,
  createStayPadCycle,
  frequencyToVisualizerBin as resolveVisualizerBin,
  getSmoothedVisualizerBinRange as resolveSmoothedVisualizerBinRange,
  getTargetVisualizerBinRange as resolveTargetVisualizerBinRange
} from '../utils/ambient-engine.js';

let container = null;
let audioCtx = null;
let masterGain = null;
let limiter = null;
let analyzer = null;
let animationId = null;

let ambientGain = null; 
let noiseGain = null;   
let ambientPanner = null;
let noisePanner = null;
let ambientRearFilter = null;
let noiseRearFilter = null;
let ambientDistanceGain = null;
let noiseDistanceGain = null;

let activeAmbientNodes = [];
let activeNoiseNodes = [];

let currentAmbientMode = null;
let currentNoiseMode = null;
let spatialMode = 'fixed';
let spatialTarget = 'both';
let spatialDistanceDepth = 0;
let spatialEdgeHold = 0;
let spatialManualY = 0;
let spatialManualDistance = 1;
let visualizerMode = 'standard';
let visualizerTrimEmpty = true;
let visualizerFocusStartBin = 0;
let visualizerFocusEndBin = 255;
let visualizerWarmupUntil = 0;
let visualizerObservedStartBin = 0;
let visualizerObservedEndBin = 255;
let isMuted = false;
let isExporting = false;
let ambientEngineEnabled = true;
let noiseMatrixEnabled = true;
let ambientMediaControlsCleanup = null;
const visualizerPeakFalloff = new Float32Array(256);
const AMBIENT_LOOP_MIN_SECONDS = 90;
const VISUALIZER_BAND_LABELS = [
  { label: 'Low', start: 0, end: 0.18, color: VISUALIZER_PALETTE.low },
  { label: 'Mid', start: 0.18, end: 0.62, color: VISUALIZER_PALETTE.mid },
  { label: 'High', start: 0.62, end: 1, color: VISUALIZER_PALETTE.high }
];
const EQUALIZER_BANDS = [
  { label: '32', freq: 32 },
  { label: '64', freq: 64 },
  { label: '125', freq: 125 },
  { label: '250', freq: 250 },
  { label: '500', freq: 500 },
  { label: '1k', freq: 1000 },
  { label: '2k', freq: 2000 },
  { label: '4k', freq: 4000 },
  { label: '8k', freq: 8000 },
  { label: '16k', freq: 16000 }
];
const EQUALIZER_PRESETS = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  focus: [-5, -4, -2, -1, 1, 3, 2, 0, -2, -5],
  warm: [4, 3, 2, 1, 0, -1, -1, -2, -3, -4],
  clear: [-4, -3, -2, -1, 0, 2, 4, 3, 1, -2],
  night: [-7, -5, -3, -2, -1, -1, -2, -3, -6, -9],
  cinema: [5, 4, 2, 0, -1, 0, 2, 4, 3, 0],
  presence: [-3, -2, -1, 0, 1, 3, 5, 4, 1, -2],
  lowcut: [-18, -14, -9, -4, -1, 0, 0, 0, -1, -3],
  manual: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};
let equalizerNodes = [];
let equalizerGains = [...EQUALIZER_PRESETS.flat];

export async function mount(parent) {
  container = document.createElement('div');
  container.className = 'tool-audio-lab';
  container.innerHTML = `
    <div class="card rj-layout">
      <div class="visualizer-container audio-lab-visualizer">
        <canvas id="audio-visualizer" class="audio-lab-visualizer-canvas"></canvas>
        <div class="audio-lab-viz-controls">
          <button id="btn-viz-standard" class="btn-secondary active-mode audio-lab-viz-button">Standard</button>
          <button id="btn-viz-circular" class="btn-secondary audio-lab-viz-button">Circular</button>
          <label class="audio-lab-viz-toggle">
            <input type="checkbox" id="viz-trim-empty-toggle" checked>
            <span>Focus Bands</span>
          </label>
        </div>
        <div class="audio-lab-eq-panel audio-lab-visualizer-eq">
          <div class="audio-lab-eq-head">
            <label class="audio-lab-output-label">Equalizer</label>
            <select id="ambient-eq-preset" class="audio-lab-eq-select">
              <option value="flat">Flat</option>
              <option value="focus">Focus</option>
              <option value="warm">Warm</option>
              <option value="clear">Clear</option>
              <option value="night">Night</option>
              <option value="cinema">Cinema</option>
              <option value="presence">Presence</option>
              <option value="lowcut">Low Cut</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <canvas id="ambient-eq-canvas" class="audio-lab-eq-canvas"></canvas>
        </div>
      </div>

      <div class="audio-lab-main-grid">
        
        <div class="rj-layout audio-lab-engine-panel">
          <div class="audio-lab-engine-header">
            <label class="nav-group-title">Ambient Engine</label>
            <div class="audio-lab-gain-control">
              <label class="rj-switch">
                <input type="checkbox" id="ambient-engine-toggle" checked>
                <span class="slider-switch"></span>
              </label>
              <span class="audio-lab-gain-label">Gain</span>
              <input type="range" id="ambient-volume" min="0" max="4" step="0.01" value="2.78">
            </div>
          </div>

          <div class="audio-lab-filter-row">
            <input id="ambient-filter-input" class="audio-lab-filter-input" type="search" placeholder="Search engines">
            <button id="ambient-filter-clear" class="btn-secondary audio-lab-filter-clear" type="button">Clear</button>
          </div>
          <div id="ambient-filter-status" class="audio-lab-filter-status">All engines visible</div>
          
          <div class="audio-lab-category-stack">
            ${Object.entries(AMBIENT_MODES).map(([cat, sounds]) => `
              <div class="sound-category">
                <label class="audio-lab-category-label">${cat}</label>
                <div class="settings-grid audio-lab-category-grid">
                  ${sounds.map(s => `<button class="btn-ambient btn-secondary audio-lab-ambient-button" data-type="${s.id}">${s.label}</button>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="rj-layout audio-lab-side-panel">
          <div>
            <div class="audio-lab-section-header">
              <label class="nav-group-title">Noise Matrix</label>
              <div class="audio-lab-noise-control">
                <label class="rj-switch">
                  <input type="checkbox" id="noise-matrix-toggle" checked>
                  <span class="slider-switch"></span>
                </label>
                <input type="range" id="noise-volume" class="audio-lab-noise-volume" min="0" max="0.25" step="0.01" value="0.1">
              </div>
            </div>
            <div class="settings-grid audio-lab-noise-grid">
              ${Object.entries(NOISE_MODES).map(([id, meta]) => `
                <button class="btn-noise btn-secondary audio-lab-noise-button" data-type="${id}">${meta.label}</button>
              `).join('')}
            </div>
          </div>

          <div class="audio-lab-spatial-section">
            <label class="nav-group-title audio-lab-spatial-title">Spatial Dynamics</label>
            
            <div class="form-group audio-lab-spatial-field">
              <label class="audio-lab-field-label">Spatial Target</label>
              <select id="spatial-target-select" class="audio-lab-spatial-select">
                <option value="both">Both Engines</option>
                <option value="ambient">Ambient Engine Only</option>
                <option value="noise">Noise Matrix Only</option>
              </select>
            </div>

            <div class="settings-grid audio-lab-spatial-grid">
              <button data-mode="fixed" class="btn-spatial btn-secondary active-mode">Fixed Center</button>
              <button data-mode="orbit" class="btn-spatial btn-secondary">Orbital Loop (360)</button>
              <button data-mode="pingpong" class="btn-spatial btn-secondary">Ping-Pong Balance</button>
              <button data-mode="manual" class="btn-spatial btn-secondary">Manual Balance</button>
            </div>

            <div class="audio-lab-spatial-scope">
              <canvas id="spatial-scope-canvas" class="audio-lab-spatial-scope-canvas"></canvas>
            </div>
            
            <div id="manual-balance-container" class="hidden audio-lab-dynamics-panel">
              <div class="audio-lab-dynamics-row">
                <span>Left</span>
                <span id="panning-pct">Balanced</span>
                <span>Right</span>
              </div>
              <input type="range" id="spatial-manual-slider" class="audio-lab-full-slider" min="-1" max="1" step="0.01" value="0">
              <div class="audio-lab-dynamics-row audio-lab-manual-axis-row">
                <span>Back</span>
                <span id="spatial-manual-y-val">Center</span>
                <span>Front</span>
              </div>
              <input type="range" id="spatial-manual-y-slider" class="audio-lab-full-slider" min="-1" max="1" step="0.01" value="0">
              <div class="audio-lab-dynamics-row audio-lab-manual-axis-row">
                <span>Far</span>
                <span id="spatial-manual-distance-val">100% near</span>
                <span>Near</span>
              </div>
              <input type="range" id="spatial-manual-distance-slider" class="audio-lab-full-slider" min="0.35" max="1" step="0.01" value="1">
            </div>

            <div id="orbit-duration-container" class="hidden audio-lab-dynamics-panel">
              <div class="audio-lab-dynamics-row">
                <span>Orbit Speed</span>
                <span id="orbit-speed-val">10s</span>
              </div>
              <input type="range" id="orbit-duration-slider" class="audio-lab-full-slider" min="0" max="30" step="1" value="10">
            </div>

            <div class="audio-lab-dynamics-panel">
              <div class="audio-lab-dynamics-row">
                <span>Distance Wave</span>
                <span id="spatial-distance-val">0%</span>
              </div>
              <input type="range" id="spatial-distance-slider" class="audio-lab-full-slider" min="0" max="0.65" step="0.01" value="0">
            </div>

            <div id="spatial-edge-container" class="hidden audio-lab-dynamics-panel">
              <div class="audio-lab-dynamics-row">
                <span>Edge Hold</span>
                <span id="spatial-edge-hold-val">0s</span>
              </div>
              <input type="range" id="spatial-edge-hold-slider" class="audio-lab-full-slider" min="0" max="4" step="0.5" value="0">
            </div>
          </div>
        </div>

      </div>

      <div class="studio-controls audio-lab-output-controls">
        <div class="form-group audio-lab-output-group">
          <label class="audio-lab-output-label">Studio Output</label>
          <input type="range" id="master-volume" min="0" max="1" step="0.01" value="0.5">
        </div>
        <div class="audio-lab-export-panel">
          <label class="audio-lab-output-label">Export</label>
          <div class="audio-lab-export-grid">
            <label class="audio-lab-export-field">
              <span>Duration</span>
              <input id="ambient-export-duration" type="number" min="10" max="7200" step="5" value="60">
            </label>
            <label class="audio-lab-export-field">
              <span>Format</span>
              <select id="ambient-export-format">
                <option value="wav">WAV</option>
                <option value="mp3">MP3</option>
                <option value="m4a">M4A</option>
              </select>
            </label>
            <button id="ambient-export-button" type="button" class="btn-secondary">Export Audio</button>
          </div>
          <div id="ambient-export-status" class="audio-lab-export-status">Ready</div>
        </div>
        <button id="btn-toggle-mute" class="audio-lab-mute-button">Mute All</button>
      </div>
    </div>
  `;
  
  parent.appendChild(container);
  setupListeners();
  setupAmbientMediaControls();
}

function syncEngineGains() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const ambientValue = ambientEngineEnabled ? parseFloat(container.querySelector('#ambient-volume').value) : 0;
  const noiseValue = noiseMatrixEnabled ? parseFloat(container.querySelector('#noise-volume').value) : 0;
  ambientGain?.gain.setTargetAtTime(ambientValue, now, 0.04);
  noiseGain?.gain.setTargetAtTime(noiseValue, now, 0.04);
}

function setupListeners() {
  const canvas = container.querySelector('#audio-visualizer');
  const btnMute = container.querySelector('#btn-toggle-mute');
  const manualContainer = container.querySelector('#manual-balance-container');
  const orbitContainer = container.querySelector('#orbit-duration-container');
  const edgeContainer = container.querySelector('#spatial-edge-container');
  const edgeHoldContainer = edgeContainer;
  const targetSelect = container.querySelector('#spatial-target-select');
  const ambientToggle = container.querySelector('#ambient-engine-toggle');
  const noiseToggle = container.querySelector('#noise-matrix-toggle');
  const trimEmptyToggle = container.querySelector('#viz-trim-empty-toggle');
  const ambientFilterInput = container.querySelector('#ambient-filter-input');
  const ambientFilterClear = container.querySelector('#ambient-filter-clear');
  const eqPreset = container.querySelector('#ambient-eq-preset');
  const eqCanvas = container.querySelector('#ambient-eq-canvas');
  const orbitSlider = container.querySelector('#orbit-duration-slider');
  const orbitValue = container.querySelector('#orbit-speed-val');
  const distanceSlider = container.querySelector('#spatial-distance-slider');
  const distanceValue = container.querySelector('#spatial-distance-val');
  const edgeHoldSlider = container.querySelector('#spatial-edge-hold-slider');
  const edgeHoldValue = container.querySelector('#spatial-edge-hold-val');
  const manualXSlider = container.querySelector('#spatial-manual-slider');
  const manualYSlider = container.querySelector('#spatial-manual-y-slider');
  const manualYValue = container.querySelector('#spatial-manual-y-val');
  const manualDistanceSlider = container.querySelector('#spatial-manual-distance-slider');
  const manualDistanceValue = container.querySelector('#spatial-manual-distance-val');
  const exportButton = container.querySelector('#ambient-export-button');
  
  const ensureAudio = () => {
    if (!isAudioContextUsable(audioCtx)) initAudio();
    resumeAudioContext(audioCtx);
  };

  function syncSpatialControlVisibility() {
    const moving = spatialMode === 'orbit' || spatialMode === 'pingpong';
    const edgeControlsAvailable = moving && spatialMode !== 'fixed';
    manualContainer.classList.toggle('hidden', spatialMode !== 'manual');
    orbitContainer.classList.toggle('hidden', !moving);
    edgeContainer.classList.toggle('hidden', !edgeControlsAvailable);
    edgeHoldSlider.disabled = spatialMode === 'fixed';
    if (!edgeControlsAvailable) edgeHoldSlider.disabled = true;
    edgeHoldContainer.classList.toggle('hidden', spatialMode === 'fixed' || !moving);
  }

  container.querySelectorAll('.btn-ambient').forEach(btn => {
    btn.onclick = () => {
      ensureAudio();
      if (currentAmbientMode === btn.dataset.type) {
        deactivateAmbientEngine();
        btn.classList.remove('active-mode');
        return;
      }
      container.querySelectorAll('.btn-ambient').forEach(b => b.classList.remove('active-mode'));
      btn.classList.add('active-mode');
      currentAmbientMode = btn.dataset.type;
      startAmbient(btn.dataset.type);
    };
  });

  container.querySelectorAll('.btn-noise').forEach(btn => {
    btn.onclick = () => {
      ensureAudio();
      if (currentNoiseMode === btn.dataset.type) {
        deactivateNoiseEngine();
        btn.classList.remove('active-mode');
        return;
      }
      container.querySelectorAll('.btn-noise').forEach(b => b.classList.remove('active-mode'));
      btn.classList.add('active-mode');
      currentNoiseMode = btn.dataset.type;
      startNoise(btn.dataset.type);
    };
  });

  container.querySelectorAll('.btn-spatial').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('.btn-spatial').forEach(b => b.classList.remove('active-mode'));
      btn.classList.add('active-mode');
      spatialMode = btn.dataset.mode;
      syncSpatialControlVisibility();
    };
  });

  targetSelect.onchange = (e) => {
    spatialTarget = e.target.value;
  };

  orbitSlider.oninput = (e) => {
    orbitValue.textContent = Number(e.target.value) <= 0 ? 'Still' : `${e.target.value}s`;
  };

  manualXSlider.oninput = (e) => {
    const panValue = parseFloat(e.target.value);
    const label = container.querySelector('#panning-pct');
    label.textContent = Math.abs(panValue) < 0.02
      ? 'Balanced'
      : `${Math.round(Math.abs(panValue) * 100)}% ${panValue < 0 ? 'left' : 'right'}`;
  };

  manualYSlider.oninput = (e) => {
    spatialManualY = parseFloat(e.target.value);
    manualYValue.textContent = Math.abs(spatialManualY) < 0.02
      ? 'Center'
      : `${Math.round(Math.abs(spatialManualY) * 100)}% ${spatialManualY < 0 ? 'back' : 'front'}`;
  };

  manualDistanceSlider.oninput = (e) => {
    spatialManualDistance = parseFloat(e.target.value);
    manualDistanceValue.textContent = `${Math.round(spatialManualDistance * 100)}% near`;
  };

  distanceSlider.oninput = (e) => {
    spatialDistanceDepth = parseFloat(e.target.value);
    distanceValue.textContent = `${Math.round(spatialDistanceDepth * 100)}%`;
  };

  edgeHoldSlider.oninput = (e) => {
    spatialEdgeHold = parseFloat(e.target.value);
    edgeHoldValue.textContent = `${spatialEdgeHold.toFixed(spatialEdgeHold % 1 ? 1 : 0)}s`;
  };

  btnMute.onclick = () => {
    isMuted = !isMuted;
    if (masterGain) {
      masterGain.gain.setTargetAtTime(isMuted ? 0 : parseFloat(container.querySelector('#master-volume').value), audioCtx.currentTime, 0.1);
    }
    btnMute.textContent = isMuted ? 'Unmute All' : 'Mute All';
    btnMute.classList.toggle('is-muted', isMuted);
  };

  container.querySelector('#master-volume').oninput = (e) => {
    if (!isMuted && masterGain) masterGain.gain.setTargetAtTime(parseFloat(e.target.value), audioCtx.currentTime, 0.05);
  };
  container.querySelector('#ambient-volume').oninput = (e) => {
    if (ambientGain) syncEngineGains();
  };
  container.querySelector('#noise-volume').oninput = (e) => {
    if (noiseGain) syncEngineGains();
  };
  ambientToggle.onchange = (e) => {
    ambientEngineEnabled = e.target.checked;
    syncEngineGains();
  };
  noiseToggle.onchange = (e) => {
    noiseMatrixEnabled = e.target.checked;
    syncEngineGains();
  };

  container.querySelector('#btn-viz-standard').onclick = () => {
    visualizerMode = 'standard';
    container.querySelector('#btn-viz-standard').classList.add('active-mode');
    container.querySelector('#btn-viz-circular').classList.remove('active-mode');
  };
  container.querySelector('#btn-viz-circular').onclick = () => {
    visualizerMode = 'circular';
    container.querySelector('#btn-viz-circular').classList.add('active-mode');
    container.querySelector('#btn-viz-standard').classList.remove('active-mode');
  };
  trimEmptyToggle.onchange = (event) => {
    visualizerTrimEmpty = event.target.checked;
  };

  ambientFilterInput.oninput = (event) => {
    filterAmbientCatalog(event.target.value);
  };
  ambientFilterClear.onclick = () => {
    ambientFilterInput.value = '';
    filterAmbientCatalog('');
    ambientFilterInput.focus();
  };
  eqPreset.onchange = (event) => {
    applyEqualizerPreset(event.target.value);
  };
  eqCanvas.addEventListener('pointerdown', (event) => {
    eqCanvas.setPointerCapture?.(event.pointerId);
    updateEqualizerBandFromPointer(event);
  });
  eqCanvas.addEventListener('pointermove', (event) => {
    if (event.buttons !== 1) return;
    updateEqualizerBandFromPointer(event);
  });
  exportButton.onclick = () => {
    exportAmbientAudio();
  };

  syncSpatialControlVisibility();
  drawEqualizerCurve();
  initVisualizer(canvas);
}

function deactivateAmbientEngine() {
  stopAndDisconnectAudioNodes(activeAmbientNodes, { context: audioCtx, fadeSeconds: 1.2 });
  activeAmbientNodes = [];
  currentAmbientMode = null;
}

function deactivateNoiseEngine() {
  stopAndDisconnectAudioNodes(activeNoiseNodes, { context: audioCtx, fadeSeconds: 0.8 });
  activeNoiseNodes = [];
  currentNoiseMode = null;
}

function filterAmbientCatalog(query) {
  const needle = String(query || '').trim().toLowerCase();
  const status = container.querySelector('#ambient-filter-status');
  let visible = 0;
  let total = 0;
  container.querySelectorAll('.sound-category').forEach((category) => {
    let categoryVisible = 0;
    category.querySelectorAll('.btn-ambient').forEach((button) => {
      total += 1;
      const copy = `${button.textContent || ''} ${button.dataset.type || ''}`.toLowerCase();
      const match = !needle || copy.includes(needle);
      button.classList.toggle('is-filter-hidden', !match);
      if (match) {
        visible += 1;
        categoryVisible += 1;
      }
    });
    category.classList.toggle('is-filter-hidden', categoryVisible === 0);
  });
  status.textContent = needle ? `${visible} of ${total} engines visible` : 'All engines visible';
}

function handleAmbientMediaCommand(command) {
  if (command === 'play') {
    if (!isAudioContextUsable(audioCtx)) initAudio();
    resumeAudioContext(audioCtx);
    setMediaPlaybackState('playing');
    return;
  }
  if (command === 'pause') {
    audioCtx?.suspend?.();
    setMediaPlaybackState('paused');
    return;
  }
  if (command === 'toggle') {
    if (audioCtx?.state === 'running') handleAmbientMediaCommand('pause');
    else handleAmbientMediaCommand('play');
    return;
  }
  if (command === 'stop') {
    deactivateAmbientEngine();
    deactivateNoiseEngine();
    audioCtx?.suspend?.();
    container?.querySelectorAll('.btn-ambient, .btn-noise').forEach((button) => button.classList.remove('active-mode'));
    setMediaPlaybackState('paused');
    return;
  }
  if (command === 'next' || command === 'previous') {
    const buttons = Array.from(container?.querySelectorAll('.btn-ambient:not(.is-filter-hidden)') || []);
    if (!buttons.length) return;
    const currentIndex = buttons.findIndex((button) => button.dataset.type === currentAmbientMode);
    const delta = command === 'next' ? 1 : -1;
    const nextIndex = currentIndex < 0
      ? 0
      : (currentIndex + delta + buttons.length) % buttons.length;
    buttons[nextIndex]?.click?.();
  }
}

function createEqualizerChain() {
  equalizerNodes = EQUALIZER_BANDS.map((band, index) => {
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = band.freq;
    filter.Q.value = index < 2 ? 0.82 : 1.05;
    filter.gain.value = equalizerGains[index] || 0;
    return filter;
  });
  equalizerNodes.forEach((filter, index) => {
    if (equalizerNodes[index + 1]) filter.connect(equalizerNodes[index + 1]);
  });
}

function applyEqualizerPreset(presetId) {
  const gains = EQUALIZER_PRESETS[presetId] || EQUALIZER_PRESETS.flat;
  equalizerGains = [...gains];
  EQUALIZER_PRESETS.manual = [...equalizerGains];
  const now = audioCtx?.currentTime || 0;
  equalizerNodes.forEach((filter, index) => {
    filter.gain.setTargetAtTime(equalizerGains[index] || 0, now, 0.04);
  });
  drawEqualizerCurve();
}

function updateEqualizerBandFromPointer(event) {
  const canvas = container?.querySelector('#ambient-eq-canvas');
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const bandIndex = getEqualizerBandIndexFromPointer(event);
  const height = Math.max(1, rect.height || canvas.offsetHeight || 88);
  const gain = Math.max(-18, Math.min(18, 18 - ((event.clientY - rect.top) / height) * 36));
  equalizerGains[bandIndex] = Math.round(gain * 10) / 10;
  EQUALIZER_PRESETS.manual = [...equalizerGains];
  const select = container.querySelector('#ambient-eq-preset');
  if (select) select.value = 'manual';
  applyEqualizerPreset('manual');
}

function frequencyToEqualizerX(freq, width) {
  const minFreq = EQUALIZER_BANDS[0].freq;
  const maxFreq = EQUALIZER_BANDS.at(-1).freq;
  const ratio = (Math.log(Math.max(minFreq, Number(freq) || minFreq)) - Math.log(minFreq)) / (Math.log(maxFreq) - Math.log(minFreq));
  return Math.max(0, Math.min(width, ratio * width));
}

function getEqualizerBandIndexFromPointer(event) {
  const canvas = container?.querySelector('#ambient-eq-canvas');
  const rect = canvas?.getBoundingClientRect?.() || { left: 0, width: 280 };
  const width = Math.max(1, rect.width || canvas?.offsetWidth || 280);
  const x = Math.max(0, Math.min(width, (Number(event?.clientX) || 0) - rect.left));
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  EQUALIZER_BANDS.forEach((band, index) => {
    const distance = Math.abs(frequencyToEqualizerX(band.freq, width) - x);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });
  return nearestIndex;
}

function drawEqualizerCurve() {
  const canvas = container?.querySelector('#ambient-eq-canvas');
  const ctx = canvas?.getContext?.('2d');
  if (!canvas || !ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width = Math.max(1, canvas.offsetWidth || 320) * dpr;
  const h = canvas.height = Math.max(1, canvas.offsetHeight || 96) * dpr;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(232,227,216,0.14)';
  ctx.lineWidth = 1 * dpr;
  [-18, -12, -6, 0, 6, 12, 18].forEach((db) => {
    const y = ((18 - db) / 36) * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  });
  ctx.beginPath();
  equalizerGains.forEach((gain, index) => {
    const x = frequencyToEqualizerX(EQUALIZER_BANDS[index].freq, w);
    const y = ((18 - gain) / 36) * h;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = VISUALIZER_PALETTE.mid;
  ctx.lineWidth = 2 * dpr;
  ctx.stroke();
  equalizerGains.forEach((gain, index) => {
    const x = frequencyToEqualizerX(EQUALIZER_BANDS[index].freq, w);
    const y = ((18 - gain) / 36) * h;
    ctx.fillStyle = VISUALIZER_PALETTE.low;
    ctx.beginPath();
    ctx.arc(x, y, 5 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = VISUALIZER_PALETTE.text;
    ctx.font = `${10 * dpr}px system-ui`;
    ctx.fillText(EQUALIZER_BANDS[index].label, Math.max(2 * dpr, x - 11 * dpr), h - 6 * dpr);
  });
}

function initAudio() {
  audioCtx = createBrowserAudioContext(window);
  masterGain = audioCtx.createGain();
  limiter = audioCtx.createDynamicsCompressor();
  analyzer = audioCtx.createAnalyser();
  ambientGain = audioCtx.createGain();
  noiseGain = audioCtx.createGain();
  
  ambientPanner = audioCtx.createStereoPanner();
  noisePanner = audioCtx.createStereoPanner();
  ambientRearFilter = audioCtx.createBiquadFilter();
  noiseRearFilter = audioCtx.createBiquadFilter();
  ambientDistanceGain = audioCtx.createGain();
  noiseDistanceGain = audioCtx.createGain();

  ambientGain.connect(ambientPanner);
  noiseGain.connect(noisePanner);

  ambientRearFilter.type = 'highshelf';
  noiseRearFilter.type = 'highshelf';
  ambientRearFilter.frequency.value = 1800;
  noiseRearFilter.frequency.value = 1800;
  ambientRearFilter.gain.value = 0;
  noiseRearFilter.gain.value = 0;

  ambientPanner.connect(ambientRearFilter);
  noisePanner.connect(noiseRearFilter);
  ambientRearFilter.connect(ambientDistanceGain);
  noiseRearFilter.connect(noiseDistanceGain);
  ambientDistanceGain.connect(masterGain);
  noiseDistanceGain.connect(masterGain);
  
  createEqualizerChain();
  masterGain.connect(equalizerNodes[0]);
  equalizerNodes[equalizerNodes.length - 1].connect(limiter);
  limiter.connect(analyzer);
  analyzer.connect(audioCtx.destination);

  limiter.threshold.setValueAtTime(-1, audioCtx.currentTime); 
  limiter.knee.setValueAtTime(5, audioCtx.currentTime);
  limiter.ratio.setValueAtTime(20, audioCtx.currentTime); 
  limiter.attack.setValueAtTime(0.001, audioCtx.currentTime);
  limiter.release.setValueAtTime(0.1, audioCtx.currentTime);

  analyzer.fftSize = 1024;
  masterGain.gain.value = parseFloat(container.querySelector('#master-volume').value);
  ambientGain.gain.value = ambientEngineEnabled ? parseFloat(container.querySelector('#ambient-volume').value) : 0;
  noiseGain.gain.value = noiseMatrixEnabled ? parseFloat(container.querySelector('#noise-volume').value) : 0;
  ambientDistanceGain.gain.value = 1;
  noiseDistanceGain.gain.value = 1;

  const updateSpatial = () => {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    let panVal = 0;
    const dur = parseFloat(container.querySelector('#orbit-duration-slider').value);
    let frontBack = 1;
    let distanceGain = computeSpatialDistanceGain(t, dur, spatialDistanceDepth);

    if (spatialMode === 'orbit') {
      if (dur <= 0) {
        panVal = 0;
        frontBack = 1;
        distanceGain = 1;
      } else {
        panVal = computeSpatialPan(t, dur, spatialEdgeHold);
        frontBack = Math.cos(t * Math.PI * 2 / Math.max(0.5, dur));
      }
    } else if (spatialMode === 'pingpong') {
      if (dur <= 0) {
        panVal = 0;
        frontBack = 1;
        distanceGain = 1;
      } else {
        panVal = computeSpatialPan(t * 0.5, dur, spatialEdgeHold) * 0.86;
        frontBack = Math.cos(t * Math.PI / Math.max(0.5, dur));
        distanceGain = computeSpatialDistanceGain(t * 0.5, dur, spatialDistanceDepth * 0.75);
      }
    } else if (spatialMode === 'manual') {
      panVal = parseFloat(container.querySelector('#spatial-manual-slider').value);
      frontBack = spatialManualY;
      distanceGain = spatialManualDistance;
    }

    const applyAmbient = spatialTarget === 'both' || spatialTarget === 'ambient';
    const applyNoise = spatialTarget === 'both' || spatialTarget === 'noise';

    ambientPanner.pan.setTargetAtTime(applyAmbient ? panVal : 0, t, 0.1);
    noisePanner.pan.setTargetAtTime(applyNoise ? panVal : 0, t, 0.1);
    applySpatialRearFilter(ambientRearFilter, applyAmbient ? frontBack : 1, t);
    applySpatialRearFilter(noiseRearFilter, applyNoise ? frontBack : 1, t);
    ambientDistanceGain.gain.setTargetAtTime(applyAmbient ? distanceGain : 1, t, 0.18);
    noiseDistanceGain.gain.setTargetAtTime(applyNoise ? distanceGain : 1, t, 0.18);
    drawSpatialScope(t, panVal, distanceGain, frontBack);

    requestAnimationFrame(updateSpatial);
  };
  updateSpatial();
}

function applySpatialRearFilter(filter, frontBack, time) {
  if (!filter) return;
  const backAmount = Math.max(0, Math.min(1, (1 - frontBack) / 2));
  filter.gain.setTargetAtTime(-11 * backAmount, time, 0.12);
}

function drawSpatialScope(time, pan, distanceGain, frontBack = 1) {
  const canvas = container?.querySelector('#spatial-scope-canvas');
  const ctx = canvas?.getContext?.('2d');
  if (!canvas || !ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width = Math.max(1, canvas.offsetWidth || 280) * dpr;
  const h = canvas.height = Math.max(1, canvas.offsetHeight || 150) * dpr;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.34;
  const angle = spatialMode === 'orbit'
    ? time * Math.PI * 2 / Math.max(0.5, parseFloat(container.querySelector('#orbit-duration-slider').value))
    : Math.PI / 2;
  const distance = 0.22 + (1 - distanceGain) * 0.78;
  const x = cx + pan * radius;
  const y = spatialMode === 'manual'
    ? cy - frontBack * radius * 0.34 * distance
    : cy + Math.cos(angle) * radius * 0.34 * distance;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#07080a';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(232,227,216,0.16)';
  ctx.lineWidth = 1 * dpr;
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius, radius * 0.44, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius * 0.54);
  ctx.lineTo(cx, cy + radius * 0.54);
  ctx.moveTo(cx - radius, cy);
  ctx.lineTo(cx + radius, cy);
  ctx.stroke();
  ctx.fillStyle = 'rgba(216,210,196,0.82)';
  ctx.beginPath();
  ctx.arc(cx, cy, 5 * dpr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = y < cy ? '#a8d8bd' : '#c98232';
  ctx.beginPath();
  ctx.arc(x, y, Math.max(5, 11 * distanceGain) * dpr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = VISUALIZER_PALETTE.text;
  ctx.font = `${11 * dpr}px system-ui`;
  ctx.fillText(y < cy ? 'Front' : 'Back', 10 * dpr, 18 * dpr);
  ctx.fillText(`${Math.round(distanceGain * 100)}% near`, 10 * dpr, h - 12 * dpr);
}

function setupAmbientMediaControls() {
  ambientMediaControlsCleanup?.();
  ambientMediaControlsCleanup = bindMediaControls({
    target: window,
    metadata: { title: 'Ambient Engine', artist: 'Jelodar Tools' },
    playbackState: 'paused',
    handlers: {
      play: () => handleAmbientMediaCommand('play'),
      pause: () => handleAmbientMediaCommand('pause'),
      stop: () => handleAmbientMediaCommand('stop'),
      toggle: () => handleAmbientMediaCommand('toggle'),
      nexttrack: () => handleAmbientMediaCommand('next'),
      previoustrack: () => handleAmbientMediaCommand('previous')
    }
  });
}

function setExportStatus(message, tone = '') {
  const status = container?.querySelector('#ambient-export-status');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('is-error', tone === 'error');
  status.classList.toggle('is-success', tone === 'success');
}

function getExportCommand(format, inputName, outputName) {
  if (format === 'mp3') {
    return ['-i', inputName, '-vn', '-ac', '2', '-ar', '48000', '-b:a', '192k', '-f', 'mp3', outputName];
  }
  if (format === 'm4a') {
    return ['-i', inputName, '-vn', '-ac', '2', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-f', 'ipod', outputName];
  }
  return ['-i', inputName, '-vn', '-ac', '2', '-ar', '48000', '-f', 'wav', outputName];
}

function getExportMime(format) {
  if (format === 'mp3') return 'audio/mpeg';
  if (format === 'm4a') return 'audio/mp4';
  return 'audio/wav';
}

function downloadAmbientExport(buffer, fileName, mimeType) {
  const blob = buffer instanceof Blob ? buffer : new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function audioBufferToWavBuffer(buffer) {
  const channelCount = Math.max(1, buffer.numberOfChannels || 1);
  const frameCount = buffer.length;
  const bytesPerSample = 2;
  const byteLength = 44 + frameCount * channelCount * bytesPerSample;
  const output = new ArrayBuffer(byteLength);
  const view = new DataView(output);
  const writeString = (offset, value) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, byteLength - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channelCount * bytesPerSample, true);
  view.setUint16(32, channelCount * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, byteLength - 44, true);

  let position = 44;
  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[frame] || 0));
      view.setInt16(position, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      position += bytesPerSample;
    }
  }
  return output;
}

async function renderAmbientExportWav(duration) {
  const sampleRate = 48000;
  const frameCount = Math.max(1, Math.ceil(duration * sampleRate));
  const offline = new OfflineAudioContext(2, frameCount, sampleRate);
  const previous = {
    audioCtx,
    masterGain,
    limiter,
    analyzer,
    ambientGain,
    noiseGain,
    ambientPanner,
    noisePanner,
    ambientRearFilter,
    noiseRearFilter,
    ambientDistanceGain,
    noiseDistanceGain,
    activeAmbientNodes,
    activeNoiseNodes,
    equalizerNodes
  };
  const ambientMode = currentAmbientMode;
  const noiseMode = currentNoiseMode;

  audioCtx = offline;
  masterGain = audioCtx.createGain();
  limiter = audioCtx.createDynamicsCompressor();
  analyzer = null;
  ambientGain = audioCtx.createGain();
  noiseGain = audioCtx.createGain();
  ambientPanner = audioCtx.createStereoPanner();
  noisePanner = audioCtx.createStereoPanner();
  ambientRearFilter = audioCtx.createBiquadFilter();
  noiseRearFilter = audioCtx.createBiquadFilter();
  ambientDistanceGain = audioCtx.createGain();
  noiseDistanceGain = audioCtx.createGain();
  activeAmbientNodes = [];
  activeNoiseNodes = [];

  ambientRearFilter.type = 'highshelf';
  noiseRearFilter.type = 'highshelf';
  ambientRearFilter.frequency.value = 1800;
  noiseRearFilter.frequency.value = 1800;
  ambientGain.connect(ambientPanner);
  noiseGain.connect(noisePanner);
  ambientPanner.connect(ambientRearFilter);
  noisePanner.connect(noiseRearFilter);
  ambientRearFilter.connect(ambientDistanceGain);
  noiseRearFilter.connect(noiseDistanceGain);
  ambientDistanceGain.connect(masterGain);
  noiseDistanceGain.connect(masterGain);
  createEqualizerChain();
  masterGain.connect(equalizerNodes[0]);
  equalizerNodes[equalizerNodes.length - 1].connect(limiter);

  const exportGain = audioCtx.createGain();
  limiter.connect(exportGain);
  exportGain.connect(audioCtx.destination);
  exportGain.gain.setValueAtTime(1, 0);
  exportGain.gain.setValueAtTime(1, Math.max(0, duration - Math.min(6, Math.max(2, duration * 0.12))));
  exportGain.gain.linearRampToValueAtTime(0.001, duration);

  limiter.threshold.setValueAtTime(-1, 0);
  limiter.knee.setValueAtTime(5, 0);
  limiter.ratio.setValueAtTime(20, 0);
  limiter.attack.setValueAtTime(0.001, 0);
  limiter.release.setValueAtTime(0.1, 0);
  masterGain.gain.value = isMuted ? 0 : parseFloat(container.querySelector('#master-volume').value);
  ambientGain.gain.value = ambientEngineEnabled ? parseFloat(container.querySelector('#ambient-volume').value) : 0;
  noiseGain.gain.value = noiseMatrixEnabled ? parseFloat(container.querySelector('#noise-volume').value) : 0;
  ambientDistanceGain.gain.value = 1;
  noiseDistanceGain.gain.value = 1;

  if (ambientMode) startAmbient(ambientMode);
  if (noiseMode) startNoise(noiseMode);

  try {
    const rendered = await offline.startRendering();
    return audioBufferToWavBuffer(rendered);
  } finally {
    stopAndDisconnectAudioNodes(activeAmbientNodes, { context: audioCtx, fadeSeconds: 0 });
    stopAndDisconnectAudioNodes(activeNoiseNodes, { context: audioCtx, fadeSeconds: 0 });
    audioCtx = previous.audioCtx;
    masterGain = previous.masterGain;
    limiter = previous.limiter;
    analyzer = previous.analyzer;
    ambientGain = previous.ambientGain;
    noiseGain = previous.noiseGain;
    ambientPanner = previous.ambientPanner;
    noisePanner = previous.noisePanner;
    ambientRearFilter = previous.ambientRearFilter;
    noiseRearFilter = previous.noiseRearFilter;
    ambientDistanceGain = previous.ambientDistanceGain;
    noiseDistanceGain = previous.noiseDistanceGain;
    activeAmbientNodes = previous.activeAmbientNodes;
    activeNoiseNodes = previous.activeNoiseNodes;
    equalizerNodes = previous.equalizerNodes;
  }
}

async function exportAmbientAudio() {
  if (isExporting) return;
  if (!currentAmbientMode && !currentNoiseMode) {
    setExportStatus('Select an engine or noise before export.', 'error');
    return;
  }
  if (typeof OfflineAudioContext === 'undefined') {
    setExportStatus('Audio export needs OfflineAudioContext support in this browser.', 'error');
    return;
  }

  const duration = Math.max(10, Math.min(7200, Number(container.querySelector('#ambient-export-duration').value) || 60));
  const format = container.querySelector('#ambient-export-format').value;

  isExporting = true;
  container.querySelector('#ambient-export-button').disabled = true;
  setExportStatus('Rendering active mix...');

  try {
    const inputName = 'ambient-input.wav';
    const outputName = `ambient-engine-${Date.now()}.${format}`;
    const buffer = await renderAmbientExportWav(duration);
    setExportStatus(`Encoding ${format.toUpperCase()}...`);
    const result = await runFFmpegJob({
      files: [{ name: inputName, buffer }],
      command: getExportCommand(format, inputName, outputName),
      outputFileName: outputName
    });
    downloadAmbientExport(result.buffer, outputName, getExportMime(format));
    setExportStatus(`Exported ${outputName}`, 'success');
  } catch (error) {
    setExportStatus(error.message || 'Export failed', 'error');
  } finally {
    isExporting = false;
    const button = container?.querySelector('#ambient-export-button');
    if (button) button.disabled = false;
  }
}

function startNoise(type) {
  stopAndDisconnectAudioNodes(activeNoiseNodes, { context: audioCtx, fadeSeconds: 1 });
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.001, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(1, audioCtx.currentTime + 1);
  g.connect(noiseGain);
  const noise = audioCtx.createBufferSource();
  noise.buffer = createNoiseBuffer(type);
  noise.loop = true;
  noise.connect(g); noise.start();
  activeNoiseNodes = [noise, g];
}

function createNoiseBuffer(type) {
  const size = 2 * audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, size, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < size; i++) {
    const white = Math.random() * 2 - 1;
    switch (type) {
      case 'white': data[i] = white * 0.05; break; 
      case 'pink': data[i] = (white + lastOut * 0.99) / 2; lastOut = data[i]; data[i] *= 0.116; break;
      case 'brown': data[i] = (white + lastOut * 0.995) / 1.005; lastOut = data[i]; data[i] *= 0.045; break;
      case 'blue': data[i] = (white - lastOut) * 0.033; lastOut = white; break;
      case 'violet': const v = white - lastOut; lastOut = white; data[i] = (v - lastOut) * 0.05; break;
      case 'gray': data[i] = white * 0.066; break;
      case 'green': const f = 0.95; data[i] = (white * (1 - f) + lastOut * f) * 0.2; lastOut = data[i]; break;
      case 'velvet': data[i] = Math.random() > 0.995 ? (Math.random() > 0.5 ? 0.2 : -0.2) : 0; break;
      default: data[i] = white * 0.05;
    }
  }
  return buffer;
}

function scheduleAmbientOverlap(durationSeconds, crossfadeSeconds = 8) {
  const loopSeconds = Math.max(AMBIENT_LOOP_MIN_SECONDS, Number(durationSeconds) || AMBIENT_LOOP_MIN_SECONDS);
  const nextStart = Math.max(0, loopSeconds - Math.max(2, crossfadeSeconds));
  return { loopSeconds, crossfadeSeconds, nextStart };
}

function startAmbient(type) {
  stopAndDisconnectAudioNodes(activeAmbientNodes, { context: audioCtx, fadeSeconds: 2 });
  visualizerWarmupUntil = Date.now() + 2200;
  visualizerObservedStartBin = 0;
  visualizerObservedEndBin = 255;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.001, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(1, audioCtx.currentTime + 2);
  g.connect(ambientGain);
  const nodes = [g]; activeAmbientNodes = nodes;

  switch (type) {
    case 'wind-breeze': createNaturalBreeze(nodes, g); break;
    case 'wind-storm': createSynthedWind(nodes, g, { type: 'brown', freq: 600, q: 2, modF: 0.05, gain: 0.08, whistle: true }); break;
    case 'rain-balanced': createRain(nodes, g, 0.1); break;
    case 'rain-tent': createRainOnTent(nodes, g, 0.12); break;
    case 'thunder-storm': createRain(nodes, g, 0.06); createThunder(nodes, g); break;
    case 'ocean-waves': createWaves(nodes, g, 0.04); break;
    case 'fireside': createFire(nodes, g); break;
    case 'summer-night': createCrickets(nodes, g); createCicadaHeat(nodes, g, 0.035); break;
    case 'frozen-tundra': createSynthedWind(nodes, g, { type: 'white', freq: 2000, q: 10, modF: 0.05, gain: 0.08, whistle: true }); break;
    case 'forest-creek': createCreek(nodes, g, 0.12); createLeafCanopy(nodes, g, 0.035); break;
    case 'forest-cuckoo': createForestCuckoo(nodes, g, 0.1); break;
    case 'dawn-chorus': createBirdChorus(nodes, g, 0.08); createNaturalBreeze(nodes, g); break;
    case 'waterfall-mist': createWaterfall(nodes, g, 0.16); break;
    case 'mosquito-swarm': createMosquitoSwarm(nodes, g, 0.038); break;
    case 'cicada-heat': createCicadaHeat(nodes, g, 0.11); break;
    case 'leaf-canopy': createLeafCanopy(nodes, g, 0.075); break;
    case 'desert-wind': createSynthedWind(nodes, g, { type: 'brown', freq: 900, q: 5, modF: 0.025, gain: 0.075, whistle: true }); break;
    case 'bamboo-grove': createBambooGrove(nodes, g, 0.08); break;
    case 'hail-roof': createHailOnRoof(nodes, g, 0.12); break;
    case 'traffic-hum': createTrafficHum(nodes, g, 0.2); break;
    case 'distant-train': createDistantTrain(nodes, g, 0.16); break;
    case 'monsoon-canopy': createRain(nodes, g, 0.13); createLeafCanopy(nodes, g, 0.08); break;
    case 'distant-avalanche': createAvalanche(nodes, g, 0.13); break;
    case 'singing-bowls': createResonant(nodes, g, [220, 330, 440], 15, 0.4); break;
    case 'glass-harmonics': createResonant(nodes, g, [1046, 1318, 1567], 10, 0.3); break;
    case 'metallic-chimes': createResonant(nodes, g, [1200, 1500, 1800], 6, 0.25, true); break;
    case 'deep-gong': createResonant(nodes, g, [55, 82], 20, 0.6); break;
    case 'temple-bell': createResonant(nodes, g, [146, 220], 18, 0.5, true); break;
    case 'crystal-vibration': createResonant(nodes, g, [880, 1108, 1320], 8, 0.3); break;
    case 'wind-chimes': createWindChimes(nodes, g, 0.3); break;
    case 'wind-harp': createWindHarp(nodes, g, 0.43); break;
    case 'handpan': createHandpan(nodes, g, 0.24); break;
    case 'shop-chimes': createShopChimes(nodes, g, 0.11); break;
    case 'church-bell': createChurchBell(nodes, g, 0.48); break;
    case 'bowed-glass': createResonant(nodes, g, [392, 523.25, 659.25, 783.99], 14, 0.32, true); break;
    case 'aeolian-wires': createWindHarp(nodes, g, 0.28); createResonant(nodes, g, [196, 293.66, 440], 18, 0.18, true); break;
    case 'cedar-resonator': createResonant(nodes, g, [110, 165, 247, 330], 12, 0.38, true); break;
    case 'copper-pipes': createResonant(nodes, g, [261.63, 349.23, 523.25, 698.46], 9, 0.32, true); break;
    case 'zen-flute': createZenFlute(nodes, g, 0.3); break;
    case 'binaural-focus': createBinaural(nodes, g, 200, 4, 0.3); break;
    case 'monastic-chant': createMonastic(nodes, g, 0.2); break;
    case 'tibetan-drone': createTibetan(nodes, g, 0.25); break;
    case 'library-focus': createLibraryFocus(nodes, g, 0.08); break;
    case 'alpha-focus': createBinaural(nodes, g, 180, 10, 0.144); createDrone(nodes, g, 90, 0.048); break;
    case 'deep-work-pulse': createFocusPulse(nodes, g, 0.12); break;
    case 'metronome-breath': createBreathMeter(nodes, g, 0.1); break;
    case 'steady-attention': createDrone(nodes, g, 120, 0.096); createBinaural(nodes, g, 220, 6, 0.072); break;
    case 'space-drone': createDrone(nodes, g, 60, 0.3); break;
    case 'interstellar-stay': createInterstellarStayTone(nodes, g, 0.24); break;
    case 'final-countdown': createFinalCountdownTheme(nodes, g, 0.16); break;
    case 'starwars-march': createStarwarsMarchTheme(nodes, g, 0.16); break;
    case 'noir-orbit': createNoirOrbitTheme(nodes, g, 0.18); break;
    case 'organ-horizon': createOrganHorizonTheme(nodes, g, 0.17); break;
    case 'love-theme': createLoveTheme(nodes, g, 0.15); break;
    case 'rhapsody-suite': createRhapsodySuite(nodes, g, 0.14); break;
    case 'dream-sequence': createDream(nodes, g, 0.3); break;
    case 'submerged': createSubmerged(nodes, g); break;
    case 'magnetic-field': createMagnetic(nodes, g, 0.25); break;
    case 'harmonic-bloom': createBloom(nodes, g, 0.35); break;
    case 'ether-flow': createEther(nodes, g, 0.2); break;
    case 'granular-cloud': createGranularCloud(nodes, g, 0.04); break;
    case 'solar-wind': createSolarWind(nodes, g, 0.2); break;
    case 'pulse-cave': createPulseCave(nodes, g, 0.14); break;
    case 'pressure-waves': createPressureWaves(nodes, g, 0.16); break;
  }
}

function createNaturalBreeze(nodes, dest) {
  const noise = audioCtx.createBufferSource(); noise.buffer = createNoiseBuffer('pink'); noise.loop = true;
  const filter = audioCtx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1800; filter.Q.value = 1.2;
  const g = audioCtx.createGain(); g.gain.value = 0; 
  noise.connect(filter); filter.connect(g); g.connect(dest); noise.start();
  const triggerGust = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    const duration = 8 + Math.random() * 8;
    const intensity = 0.04 + Math.random() * 0.08;
    const wait = 6000 + Math.random() * 10000;
    g.gain.cancelScheduledValues(now);
    g.gain.setTargetAtTime(intensity, now, duration * 0.15);
    g.gain.setTargetAtTime(0, now + duration * 0.3, duration * 0.3);
    setTimeout(triggerGust, wait);
  };
  triggerGust();
  nodes.push(noise, filter, g);
}

function createSynthedWind(nodes, dest, opts) {
  const noise = audioCtx.createBufferSource(); noise.buffer = createNoiseBuffer(opts.type); noise.loop = true;
  const filter = audioCtx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = opts.freq; filter.Q.value = opts.q;
  const lfo = audioCtx.createOscillator(); lfo.frequency.value = opts.modF;
  const lg = audioCtx.createGain(); lg.gain.value = opts.freq * 0.5; lfo.connect(lg); lg.connect(filter.frequency);
  const g = audioCtx.createGain(); g.gain.value = opts.gain;
  noise.connect(filter); filter.connect(g); g.connect(dest); noise.start(); lfo.start(); nodes.push(noise, lfo, g);
  if (opts.whistle) {
    const w = audioCtx.createOscillator(); w.frequency.value = 400;
    const wg = audioCtx.createGain(); wg.gain.value = 0.005;
    lfo.connect(w.frequency); w.connect(wg); wg.connect(dest);
    w.start(); nodes.push(w, wg);
  }
}

function createFire(nodes, dest) {
  const roar = audioCtx.createBufferSource(); roar.buffer = createNoiseBuffer('brown'); roar.loop = true;
  const rf = audioCtx.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 400;
  const rg = audioCtx.createGain(); rg.gain.value = 0.04; 
  const lfo = audioCtx.createOscillator(); lfo.frequency.value = 0.2;
  const lg = audioCtx.createGain(); lg.gain.value = 0.01;
  lfo.connect(lg); lg.connect(rg.gain);
  roar.connect(rf); rf.connect(rg); rg.connect(dest);
  roar.start(); lfo.start();
  nodes.push(roar, rf, rg, lfo);
  const triggerCrackle = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    const isSnap = Math.random() > 0.7;
    const n = audioCtx.createBufferSource(); n.buffer = createNoiseBuffer('white');
    const hp = audioCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = isSnap ? 1200 : 3000;
    const g = audioCtx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(isSnap ? 0.1 : 0.03, now + 0.002); g.gain.exponentialRampToValueAtTime(0.001, now + (isSnap ? 0.04 : 0.02));
    n.connect(hp); hp.connect(g); g.connect(dest); n.start(now); n.stop(now + 0.1);
    setTimeout(triggerCrackle, 100 + Math.random() * 1500);
  };
  triggerCrackle();
}

function createCrickets(nodes, dest) {
  const species = [
    { base: 4150, spread: 360, q: 18, pulses: [0, 0.064, 0.128], amp: 0.026 },
    { base: 4850, spread: 520, q: 14, pulses: [0, 0.048, 0.096, 0.144], amp: 0.021 },
    { base: 3650, spread: 260, q: 22, pulses: [0, 0.078], amp: 0.018, nearDouble: true },
    { base: 5320, spread: 340, q: 20, pulses: [0, 0.055, 0.23, 0.285], amp: 0.02, nearDouble: true }
  ];
  const triggerCricket = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    const voice = species[Math.floor(Math.random() * species.length)];
    const baseFreq = voice.base + (Math.random() - 0.5) * voice.spread;
    const pan = audioCtx.createStereoPanner();
    pan.pan.value = voice.nearDouble ? -0.98 + Math.random() * 1.96 : -0.85 + Math.random() * 1.7;
    pan.connect(dest);
    voice.pulses.forEach((offset, index) => {
      const o = audioCtx.createOscillator();
      const f = audioCtx.createBiquadFilter();
      const g = audioCtx.createGain();
      const t = now + offset + Math.random() * 0.012;
      o.type = index % 2 ? 'sine' : 'triangle';
      o.frequency.setValueAtTime(baseFreq + Math.random() * 90, t);
      o.frequency.exponentialRampToValueAtTime(baseFreq * (1.015 + Math.random() * 0.025), t + 0.032);
      f.type = 'bandpass';
      f.frequency.value = baseFreq;
      f.Q.value = voice.q;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(voice.amp * (0.86 + Math.random() * 0.52), t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.05 + Math.random() * 0.025);
      o.connect(f);
      f.connect(g);
      g.connect(pan);
      o.start(t);
      o.stop(t + 0.1);
      nodes.push(o, f, g);
    });
    nodes.push(pan);
    setTimeout(triggerCricket, 2200 + Math.random() * 5200);
  };
  triggerCricket();
}

function createCreek(nodes, dest, gain) {
  const water = audioCtx.createBufferSource(); water.buffer = createNoiseBuffer('pink'); water.loop = true;
  const body = audioCtx.createBiquadFilter(); body.type = 'bandpass'; body.frequency.value = 900; body.Q.value = 0.9;
  const sparkle = audioCtx.createBiquadFilter(); sparkle.type = 'highpass'; sparkle.frequency.value = 2600;
  const g = audioCtx.createGain(); g.gain.value = gain;
  water.connect(body); body.connect(sparkle); sparkle.connect(g); g.connect(dest); water.start();
  nodes.push(water, body, sparkle, g);
}

function playBirdSyllable(dest, syllable, startTime, gain, panValue) {
  const o = audioCtx.createOscillator();
  const tremolo = audioCtx.createOscillator();
  const tremoloGain = audioCtx.createGain();
  const f = audioCtx.createBiquadFilter();
  const g = audioCtx.createGain();
  const pan = audioCtx.createStereoPanner();

  o.type = syllable.wave || 'sine';
  o.frequency.setValueAtTime(syllable.from, startTime);
  if (syllable.mid) {
    o.frequency.exponentialRampToValueAtTime(syllable.mid, startTime + syllable.dur * 0.45);
  }
  o.frequency.exponentialRampToValueAtTime(syllable.to, startTime + syllable.dur);
  tremolo.frequency.value = syllable.trill || 0;
  tremoloGain.gain.value = syllable.trill ? gain * 0.24 : 0;
  f.type = 'bandpass';
  f.frequency.value = Math.max(syllable.from, syllable.to, syllable.mid || 0) * 1.02;
  f.Q.value = syllable.q || 7;
  g.gain.setValueAtTime(0.001, startTime);
  g.gain.linearRampToValueAtTime(gain, startTime + 0.018);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + syllable.dur + 0.08);
  pan.pan.value = panValue;
  tremolo.connect(tremoloGain);
  tremoloGain.connect(g.gain);
  o.connect(f);
  f.connect(g);
  g.connect(pan);
  pan.connect(dest);
  o.start(startTime);
  tremolo.start(startTime);
  o.stop(startTime + syllable.dur + 0.12);
  tremolo.stop(startTime + syllable.dur + 0.12);
}

function createBirdChorus(nodes, dest, gain) {
  const birdSpecies = [
    [
      { from: 1850, mid: 2600, to: 2150, dur: 0.11, trill: 18, q: 9 },
      { from: 2350, mid: 3300, to: 2850, dur: 0.09, trill: 21, q: 10 },
      { from: 2100, to: 1550, dur: 0.13, q: 8 }
    ],
    [
      { from: 3300, to: 4550, dur: 0.06, trill: 32, q: 12 },
      { from: 4200, to: 3600, dur: 0.075, trill: 28, q: 11 },
      { from: 2850, mid: 4050, to: 3400, dur: 0.08, q: 10 },
      { from: 2500, to: 2100, dur: 0.12, q: 8 }
    ],
    [
      { from: 1260, mid: 1760, to: 1510, dur: 0.18, wave: 'triangle', q: 6 },
      { from: 1520, mid: 2280, to: 1950, dur: 0.16, wave: 'triangle', q: 7 },
      { from: 1180, to: 1680, dur: 0.2, wave: 'triangle', q: 5 }
    ],
    [
      { from: 5200, to: 6100, dur: 0.045, trill: 42, q: 14 },
      { from: 5900, to: 4900, dur: 0.05, trill: 36, q: 14 },
      { from: 5400, to: 6750, dur: 0.04, trill: 48, q: 16 },
      { from: 6100, to: 5300, dur: 0.055, trill: 34, q: 13 }
    ]
  ];
  const trigger = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    const phrase = birdSpecies[Math.floor(Math.random() * birdSpecies.length)];
    const offset = Math.random() * 0.35;
    const panValue = -0.7 + Math.random() * 1.4;
    phrase.forEach((syllable, index) => {
      const t = now + offset + index * (0.09 + Math.random() * 0.08);
      const shifted = {
        ...syllable,
        from: syllable.from * (0.96 + Math.random() * 0.08),
        mid: syllable.mid ? syllable.mid * (0.96 + Math.random() * 0.08) : null,
        to: syllable.to * (0.96 + Math.random() * 0.08)
      };
      playBirdSyllable(dest, shifted, t, gain * (0.22 + Math.random() * 0.24), panValue + Math.random() * 0.16 - 0.08);
    });
    setTimeout(trigger, 2200 + Math.random() * 6200);
  };
  trigger();
}

function createForestCuckoo(nodes, dest, gain) {
  createLeafCanopy(nodes, dest, gain * 0.26);
  createBirdChorus(nodes, dest, gain * 0.18);
  const call = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    const pan = -0.55 + Math.random() * 1.1;
    const base = 510 + Math.random() * 60;
    [
      { from: base * 1.58, mid: base * 1.52, to: base * 1.42, dur: 0.24, wave: 'triangle', q: 8, trill: 5 },
      { from: base * 0.96, mid: base * 0.93, to: base * 0.86, dur: 0.36, wave: 'triangle', q: 7, trill: 3 },
      { from: base * 1.5, to: base * 1.36, dur: 0.2, wave: 'sine', q: 9 }
    ].forEach((syllable, index) => {
      playBirdSyllable(dest, syllable, now + index * 0.38, gain * (0.5 - index * 0.1), pan);
    });
    setTimeout(call, 4200 + Math.random() * 13500);
  };
  call();
}

function createWaterfall(nodes, dest, gain) {
  const low = audioCtx.createBufferSource(); low.buffer = createNoiseBuffer('brown'); low.loop = true;
  const high = audioCtx.createBufferSource(); high.buffer = createNoiseBuffer('white'); high.loop = true;
  const lowFilter = audioCtx.createBiquadFilter(); lowFilter.type = 'lowpass'; lowFilter.frequency.value = 260;
  const highFilter = audioCtx.createBiquadFilter(); highFilter.type = 'bandpass'; highFilter.frequency.value = 2800; highFilter.Q.value = 0.8;
  const g = audioCtx.createGain(); g.gain.value = gain;
  low.connect(lowFilter); lowFilter.connect(g);
  high.connect(highFilter); highFilter.connect(g);
  g.connect(dest); low.start(); high.start();
  nodes.push(low, high, lowFilter, highFilter, g);
}

function createMosquitoSwarm(nodes, dest, gain) {
  for (let i = 0; i < 2; i += 1) {
    const wingBase = 430 + Math.random() * 520;
    const o = audioCtx.createOscillator();
    const harmonic = audioCtx.createOscillator();
    const noise = audioCtx.createBufferSource();
    const filter = audioCtx.createBiquadFilter();
    const vibrato = audioCtx.createOscillator();
    const vibratoGain = audioCtx.createGain();
    const wander = audioCtx.createOscillator();
    const wanderGain = audioCtx.createGain();
    const ampDrift = audioCtx.createOscillator();
    const ampGain = audioCtx.createGain();
    const g = audioCtx.createGain();
    const p = audioCtx.createStereoPanner();

    o.type = 'sawtooth';
    o.frequency.value = wingBase;
    harmonic.type = 'triangle';
    harmonic.frequency.value = wingBase * (1.94 + Math.random() * 0.12);
    noise.buffer = createNoiseBuffer('pink');
    noise.loop = true;
    filter.type = 'bandpass';
    filter.frequency.value = wingBase * (2.6 + Math.random() * 0.65);
    filter.Q.value = 16 + Math.random() * 14;
    vibrato.frequency.value = 18 + Math.random() * 34;
    vibratoGain.gain.value = 18 + Math.random() * 56;
    wander.frequency.value = 0.16 + Math.random() * 0.36;
    wanderGain.gain.value = 45 + Math.random() * 110;
    ampDrift.frequency.value = 0.42 + Math.random() * 1.2;
    ampGain.gain.value = gain / 72;
    g.gain.value = gain / 34;
    p.pan.value = -0.92 + Math.random() * 1.84;

    vibrato.connect(vibratoGain);
    vibratoGain.connect(o.frequency);
    vibratoGain.connect(harmonic.frequency);
    wander.connect(wanderGain);
    wanderGain.connect(o.frequency);
    wanderGain.connect(harmonic.frequency);
    ampDrift.connect(ampGain);
    ampGain.connect(g.gain);
    noise.connect(filter);
    filter.connect(g);
    o.connect(g);
    harmonic.connect(g);
    g.connect(p);
    p.connect(dest);
    noise.start();
    o.start();
    harmonic.start();
    vibrato.start();
    wander.start();
    ampDrift.start();
    nodes.push(o, harmonic, noise, filter, vibrato, vibratoGain, wander, wanderGain, ampDrift, ampGain, g, p);
  }
}

function createCicadaHeat(nodes, dest, gain) {
  for (let i = 0; i < 13; i += 1) {
    const carrier = audioCtx.createOscillator();
    const rasp = audioCtx.createBufferSource();
    const trill = audioCtx.createOscillator();
    const trillGain = audioCtx.createGain();
    const slowSwell = audioCtx.createOscillator();
    const swellGain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    const raspFilter = audioCtx.createBiquadFilter();
    const g = audioCtx.createGain();
    const p = audioCtx.createStereoPanner();
    const far = i > 5;
    const near = i < 3;
    const centerFreq = far ? 3400 + Math.random() * 1800 : 4800 + Math.random() * 2600;

    carrier.type = far ? 'triangle' : 'sawtooth';
    carrier.frequency.value = centerFreq;
    rasp.buffer = createNoiseBuffer('pink');
    rasp.loop = true;
    trill.frequency.value = 18 + Math.random() * 36;
    trillGain.gain.value = far ? gain / 44 : gain / 24;
    slowSwell.frequency.value = 0.018 + Math.random() * 0.045;
    swellGain.gain.value = far ? gain / 20 : gain / 13;
    filter.type = 'bandpass';
    filter.frequency.value = centerFreq;
    filter.Q.value = far ? 5 + Math.random() * 6 : 9 + Math.random() * 10;
    raspFilter.type = 'bandpass';
    raspFilter.frequency.value = centerFreq * (0.86 + Math.random() * 0.2);
    raspFilter.Q.value = 3 + Math.random() * 4;
    g.gain.value = far ? gain / 24 : near ? gain / 9 : gain / 14;
    p.pan.value = -0.98 + Math.random() * 1.96;

    trill.connect(trillGain);
    trillGain.connect(g.gain);
    slowSwell.connect(swellGain);
    swellGain.connect(g.gain);
    carrier.connect(filter);
    filter.connect(g);
    rasp.connect(raspFilter);
    raspFilter.connect(g);
    g.connect(p);
    p.connect(dest);
    carrier.start();
    rasp.start();
    trill.start();
    slowSwell.start();
    nodes.push(carrier, rasp, trill, trillGain, slowSwell, swellGain, filter, raspFilter, g, p);
  }
}

function createLeafCanopy(nodes, dest, gain) {
  const noise = audioCtx.createBufferSource(); noise.buffer = createNoiseBuffer('pink'); noise.loop = true;
  const filter = audioCtx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1800; filter.Q.value = 0.7;
  const lfo = audioCtx.createOscillator(); lfo.frequency.value = 0.18;
  const lg = audioCtx.createGain(); lg.gain.value = gain * 0.7;
  const g = audioCtx.createGain(); g.gain.value = gain * 0.45;
  lfo.connect(lg); lg.connect(g.gain); noise.connect(filter); filter.connect(g); g.connect(dest);
  noise.start(); lfo.start(); nodes.push(noise, filter, lfo, lg, g);
}

function createBambooGrove(nodes, dest, gain) {
  createNaturalBreeze(nodes, dest);
  const bambooTones = [146.83, 196, 246.94, 293.66, 392];
  const knock = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    const strikes = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < strikes; i += 1) {
      const t = now + i * (0.09 + Math.random() * 0.08);
      const tone = bambooTones[Math.floor(Math.random() * bambooTones.length)] * (0.96 + Math.random() * 0.08);
      const o = audioCtx.createOscillator();
      const body = audioCtx.createBiquadFilter();
      const hollow = audioCtx.createBiquadFilter();
      const g = audioCtx.createGain();
      const p = audioCtx.createStereoPanner();
      o.type = 'triangle';
      o.frequency.setValueAtTime(tone, t);
      o.frequency.exponentialRampToValueAtTime(tone * 0.78, t + 0.18);
      body.type = 'bandpass';
      body.frequency.value = tone * 1.8;
      body.Q.value = 6 + Math.random() * 5;
      hollow.type = 'peaking';
      hollow.frequency.value = tone * 0.5;
      hollow.Q.value = 2.2;
      hollow.gain.value = 8;
      p.pan.value = -0.7 + Math.random() * 1.4;
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(gain * (0.34 + Math.random() * 0.34), t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.42 + Math.random() * 0.28);
      o.connect(body);
      body.connect(hollow);
      hollow.connect(g);
      g.connect(p);
      p.connect(dest);
      o.start(t);
      o.stop(t + 0.9);
      nodes.push(o, body, hollow, g, p);
    }
    setTimeout(knock, 1700 + Math.random() * 6200);
  };
  knock();
}

function createHailOnRoof(nodes, dest, gain) {
  const trigger = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    const hits = 3 + Math.floor(Math.random() * 8);
    for (let i = 0; i < hits; i += 1) {
      const t = now + Math.random() * 0.25;
      const n = audioCtx.createBufferSource(); n.buffer = createNoiseBuffer('white');
      const f = audioCtx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2200 + Math.random() * 2200;
      const g = audioCtx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain * Math.random(), t + 0.002); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      n.connect(f); f.connect(g); g.connect(dest); n.start(t); n.stop(t + 0.06);
    }
    setTimeout(trigger, 140 + Math.random() * 360);
  };
  trigger();
}

function createTrafficBedBuffer() {
  const size = 3 * audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, size, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let engine = 0;
  let tire = 0;
  for (let i = 0; i < size; i += 1) {
    const white = Math.random() * 2 - 1;
    engine = engine * 0.92 + white * 0.08;
    tire = tire * 0.58 + white * 0.42;
    data[i] = engine * 0.075 + tire * 0.022;
  }
  return buffer;
}

function createTrafficHum(nodes, dest, gain) {
  const road = audioCtx.createBufferSource();
  const tires = audioCtx.createBufferSource();
  road.buffer = createTrafficBedBuffer();
  tires.buffer = createTrafficBedBuffer();
  road.loop = true;
  tires.loop = true;

  const roadFilter = audioCtx.createBiquadFilter();
  const tireFilter = audioCtx.createBiquadFilter();
  const roadGain = audioCtx.createGain();
  const tireGain = audioCtx.createGain();
  const drift = audioCtx.createOscillator();
  const driftGain = audioCtx.createGain();

  roadFilter.type = 'bandpass';
  roadFilter.frequency.value = 155;
  roadFilter.Q.value = 0.55;
  tireFilter.type = 'bandpass';
  tireFilter.frequency.value = 760;
  tireFilter.Q.value = 0.9;
  roadGain.gain.value = gain * 0.54;
  tireGain.gain.value = gain * 0.22;
  drift.frequency.value = 0.035;
  driftGain.gain.value = 140;

  drift.connect(driftGain);
  driftGain.connect(tireFilter.frequency);
  road.connect(roadFilter);
  tires.connect(tireFilter);
  roadFilter.connect(roadGain);
  tireFilter.connect(tireGain);
  roadGain.connect(dest);
  tireGain.connect(dest);
  road.start();
  tires.start();
  drift.start();
  nodes.push(road, tires, roadFilter, tireFilter, roadGain, tireGain, drift, driftGain);

  const pass = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    const source = audioCtx.createBufferSource();
    const filter = audioCtx.createBiquadFilter();
    const amp = audioCtx.createGain();
    const pan = audioCtx.createStereoPanner();
    const duration = 2.8 + Math.random() * 3.4;
    const leftToRight = Math.random() > 0.5;

    source.buffer = createTrafficBedBuffer();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420 + Math.random() * 260, now);
    filter.frequency.exponentialRampToValueAtTime(180 + Math.random() * 120, now + duration);
    filter.Q.value = 0.72;
    amp.gain.setValueAtTime(0.001, now);
    amp.gain.linearRampToValueAtTime(gain * (0.35 + Math.random() * 0.28), now + duration * 0.34);
    amp.gain.exponentialRampToValueAtTime(0.001, now + duration);
    pan.pan.setValueAtTime(leftToRight ? -0.9 : 0.9, now);
    pan.pan.linearRampToValueAtTime(leftToRight ? 0.9 : -0.9, now + duration);
    source.connect(filter);
    filter.connect(amp);
    amp.connect(pan);
    pan.connect(dest);
    source.start(now);
    source.stop(now + duration + 0.1);
    setTimeout(pass, 9000 + Math.random() * 17000);
  };
  pass();
}

function createDistantTrain(nodes, dest, gain) {
  const rail = audioCtx.createBufferSource();
  rail.buffer = createTrafficBedBuffer();
  rail.loop = true;
  const railFilter = audioCtx.createBiquadFilter();
  const railGain = audioCtx.createGain();
  const wheel = audioCtx.createOscillator();
  const wheelGain = audioCtx.createGain();
  const hornFilter = audioCtx.createBiquadFilter();
  railFilter.type = 'bandpass';
  railFilter.frequency.value = 82;
  railFilter.Q.value = 0.48;
  railGain.gain.value = gain * 0.28;
  wheel.type = 'triangle';
  wheel.frequency.value = 2.1;
  wheelGain.gain.value = gain * 0.18;
  hornFilter.type = 'lowpass';
  hornFilter.frequency.value = 1800;
  rail.connect(railFilter);
  railFilter.connect(railGain);
  wheel.connect(wheelGain);
  railGain.connect(dest);
  wheelGain.connect(dest);
  rail.start();
  wheel.start();
  nodes.push(rail, railFilter, railGain, wheel, wheelGain, hornFilter);
  createTrainRhythmLayer(nodes, dest, gain);

  const horn = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    [196, 247, 294].forEach((freq, index) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      const p = audioCtx.createStereoPanner();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(freq * (0.98 + Math.random() * 0.04), now);
      p.pan.value = -0.25 + index * 0.18;
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(gain * (0.12 - index * 0.018), now + 1.2);
      g.gain.setTargetAtTime(0.001, now + 3.5, 1.6);
      o.connect(hornFilter);
      hornFilter.connect(g);
      g.connect(p);
      p.connect(dest);
      o.start(now);
      o.stop(now + 8);
      nodes.push(o, g, p);
    });
    setTimeout(horn, 38000 + Math.random() * 64000);
  };
  horn();
}

function createTrainRhythmLayer(nodes, dest, gain) {
  const rhythm = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    const tempo = 0.34 + Math.random() * 0.1;
    for (let step = 0; step < 18; step += 1) {
      const t = now + step * tempo * 0.5;
      const noise = audioCtx.createBufferSource();
      const filter = audioCtx.createBiquadFilter();
      const body = audioCtx.createOscillator();
      const amp = audioCtx.createGain();
      const pan = audioCtx.createStereoPanner();
      noise.buffer = createNoiseBuffer(step % 2 ? 'pink' : 'brown');
      filter.type = 'bandpass';
      filter.frequency.value = step % 2 ? 960 : 520;
      filter.Q.value = 2.2;
      body.type = 'triangle';
      body.frequency.setValueAtTime(step % 2 ? 88 : 72, t);
      body.frequency.exponentialRampToValueAtTime(step % 2 ? 62 : 54, t + 0.16);
      pan.pan.value = -0.18 + Math.random() * 0.36;
      amp.gain.setValueAtTime(0.001, t);
      amp.gain.linearRampToValueAtTime(gain * (0.08 + Math.random() * 0.05), t + 0.014);
      amp.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      noise.connect(filter);
      filter.connect(amp);
      body.connect(amp);
      amp.connect(pan);
      pan.connect(dest);
      noise.start(t);
      body.start(t);
      noise.stop(t + 0.24);
      body.stop(t + 0.26);
      nodes.push(noise, filter, body, amp, pan);
    }
    setTimeout(rhythm, 6400 + Math.random() * 5200);
  };
  rhythm();
}

function createAvalanche(nodes, dest, gain) {
  createAvalancheBed(nodes, dest, gain);
  const trigger = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    const low = audioCtx.createBufferSource(); const mid = audioCtx.createBufferSource();
    const lowFilter = audioCtx.createBiquadFilter(); const midFilter = audioCtx.createBiquadFilter(); const resonance = audioCtx.createOscillator(); const resonanceGain = audioCtx.createGain(); const g = audioCtx.createGain();
    low.buffer = createNoiseBuffer('brown');
    mid.buffer = createNoiseBuffer('pink');
    lowFilter.type = 'lowpass';
    lowFilter.frequency.value = 118;
    lowFilter.Q.value = 0.9;
    midFilter.type = 'bandpass';
    midFilter.frequency.value = 360;
    midFilter.Q.value = 0.7;
    resonance.type = 'sine';
    resonance.frequency.setValueAtTime(45, now);
    resonance.frequency.exponentialRampToValueAtTime(24, now + 34);
    resonanceGain.gain.setValueAtTime(0.001, now);
    resonanceGain.gain.linearRampToValueAtTime(gain * 0.42, now + 5.5);
    resonanceGain.gain.setTargetAtTime(0.001, now + 24, 9);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain * 0.92, now + 4.8);
    g.gain.setTargetAtTime(gain * 0.34, now + 15, 7.5);
    g.gain.exponentialRampToValueAtTime(0.001, now + 43);
    low.connect(lowFilter); lowFilter.connect(g);
    mid.connect(midFilter); midFilter.connect(g);
    resonance.connect(resonanceGain);
    resonanceGain.connect(dest);
    g.connect(dest); low.start(now); mid.start(now); resonance.start(now);
    low.stop(now + 46); mid.stop(now + 44); resonance.stop(now + 48);
    nodes.push(low, mid, lowFilter, midFilter, resonance, resonanceGain, g);
    setTimeout(trigger, 52000 + Math.random() * 76000);
  };
  trigger();
}

function createAvalancheBed(nodes, dest, gain) {
  const low = audioCtx.createBufferSource();
  const ice = audioCtx.createBufferSource();
  const lowFilter = audioCtx.createBiquadFilter();
  const iceFilter = audioCtx.createBiquadFilter();
  const swell = audioCtx.createOscillator();
  const swellGain = audioCtx.createGain();
  const amp = audioCtx.createGain();
  low.buffer = createNoiseBuffer('brown');
  ice.buffer = createNoiseBuffer('pink');
  low.loop = true;
  ice.loop = true;
  lowFilter.type = 'lowpass';
  lowFilter.frequency.value = 74;
  lowFilter.Q.value = 0.82;
  iceFilter.type = 'bandpass';
  iceFilter.frequency.value = 240;
  iceFilter.Q.value = 0.5;
  swell.frequency.value = 0.018;
  swellGain.gain.value = gain * 0.09;
  amp.gain.value = gain * 0.24;
  swell.connect(swellGain);
  swellGain.connect(amp.gain);
  low.connect(lowFilter);
  ice.connect(iceFilter);
  lowFilter.connect(amp);
  iceFilter.connect(amp);
  amp.connect(dest);
  low.start();
  ice.start();
  swell.start();
  nodes.push(low, ice, lowFilter, iceFilter, swell, swellGain, amp);
}

function createRainOnTent(nodes, dest, gain) {
  const noise = audioCtx.createBufferSource(); noise.buffer = createNoiseBuffer('pink'); noise.loop = true;
  const lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 800;
  const g = audioCtx.createGain(); g.gain.value = gain * 0.5;
  noise.connect(lp); lp.connect(g); g.connect(dest); noise.start();
  const triggerDrip = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator(); const dg = audioCtx.createGain();
    o.frequency.setValueAtTime(150, now); o.frequency.exponentialRampToValueAtTime(40, now + 0.05);
    dg.gain.setValueAtTime(0.05, now); dg.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    o.connect(dg); dg.connect(dest); o.start(now); o.stop(now + 0.05);
    setTimeout(triggerDrip, 200 + Math.random() * 1500);
  };
  triggerDrip();
  nodes.push(noise, lp, g);
}

function createZenFlute(nodes, dest, gain) {
  const trigger = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(440 + Math.random() * 200, now);
    const lfo = audioCtx.createOscillator(); lfo.frequency.value = 5;
    const lg = audioCtx.createGain(); lg.gain.value = 5; lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(gain, now + 1.5); g.gain.exponentialRampToValueAtTime(0.001, now + 5);
    o.connect(g); g.connect(dest); o.start(now); lfo.start(now); o.stop(now + 5);
    setTimeout(trigger, 6000 + Math.random() * 6000);
  };
  trigger();
}

function createBinaural(nodes, dest, base, delta, gain) {
  const oL = audioCtx.createOscillator(); const oR = audioCtx.createOscillator();
  const pL = audioCtx.createStereoPanner(); const pR = audioCtx.createStereoPanner();
  oL.frequency.value = base; oR.frequency.value = base + delta;
  pL.pan.value = -1; pR.pan.value = 1;
  const g = audioCtx.createGain(); g.gain.value = gain;
  oL.connect(pL); pL.connect(g); oR.connect(pR); pR.connect(g); g.connect(dest);
  oL.start(); oR.start(); nodes.push(oL, oR, pL, pR, g);
}

function createMonastic(nodes, dest, gain) {
  [100, 150, 200].forEach(f => {
    const o = audioCtx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    const lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300;
    const g = audioCtx.createGain(); g.gain.value = gain / 4;
    const lfo = audioCtx.createOscillator(); lfo.frequency.value = 0.1;
    const lg = audioCtx.createGain(); lg.gain.value = 0.05; lfo.connect(lg); lg.connect(g.gain);
    o.connect(lp); lp.connect(g); g.connect(dest); o.start(); lfo.start(); nodes.push(o, lp, g, lfo);
  });
}

function createTibetan(nodes, dest, gain) {
  const base = 80;
  [1, 1.5, 2, 2.5].forEach(m => {
    const o = audioCtx.createOscillator(); o.frequency.value = base * m;
    const g = audioCtx.createGain(); g.gain.value = gain / 5;
    o.connect(g); g.connect(dest); o.start(); nodes.push(o, g);
  });
}

function createWindChimes(nodes, dest, gain) {
  const freqs = [1046.50, 1174.66, 1318.51, 1567.98, 1760.00, 2093.00];
  const triggerCluster = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    const hits = 2 + Math.floor(Math.random() * 4);
    for(let i=0; i < hits; i++) {
      const delay = i * (0.05 + Math.random() * 0.15);
      const f = freqs[Math.floor(Math.random() * freqs.length)];
      const osc = audioCtx.createOscillator(); const g = audioCtx.createGain();
      osc.frequency.setValueAtTime(f, now + delay);
      g.gain.setValueAtTime(0, now + delay);
      g.gain.linearRampToValueAtTime(gain * (0.5 + Math.random() * 0.5), now + delay + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, now + delay + 2 + Math.random() * 3);
      osc.connect(g); g.connect(dest);
      osc.start(now + delay); osc.stop(now + delay + 5);
    }
    setTimeout(triggerCluster, 1000 + Math.random() * 4000);
  };
  triggerCluster();
}

function createHandpan(nodes, dest, gain) {
  const scale = [146.83, 174.61, 196, 220, 261.63, 293.66, 329.63, 392];
  const strike = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    const pattern = [0, 0.38, 0.78, 1.22, 1.88, 2.34].slice(0, 3 + Math.floor(Math.random() * 4));
    pattern.forEach((delay, index) => {
      const t = now + delay;
      const freq = scale[(index + Math.floor(Math.random() * scale.length)) % scale.length];
      [1, 2.01, 2.98, 4.08].forEach((partial, partialIndex) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        const p = audioCtx.createStereoPanner();
        o.type = partialIndex === 0 ? 'sine' : 'triangle';
        o.frequency.setValueAtTime(freq * partial * (0.998 + Math.random() * 0.004), t);
        p.pan.value = -0.55 + ((index + partialIndex) % 5) * 0.27;
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(gain / (partialIndex + 1.2), t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.001, t + 2.8 + partialIndex * 0.65);
        o.connect(g);
        g.connect(p);
        p.connect(dest);
        o.start(t);
        o.stop(t + 6);
        nodes.push(o, g, p);
      });
    });
    setTimeout(strike, 3600 + Math.random() * 7200);
  };
  strike();
}

function createWindHarpGustLayer(nodes, dest, gain) {
  const wind = audioCtx.createBufferSource();
  const low = audioCtx.createBiquadFilter();
  const high = audioCtx.createBiquadFilter();
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  const g = audioCtx.createGain();

  wind.buffer = createNoiseBuffer('pink');
  wind.loop = true;
  low.type = 'bandpass';
  low.frequency.value = 180;
  low.Q.value = 0.6;
  high.type = 'highpass';
  high.frequency.value = 900;
  lfo.frequency.value = 0.028;
  lfoGain.gain.value = gain * 0.12;
  g.gain.value = gain * 0.04;
  lfo.connect(lfoGain);
  lfoGain.connect(g.gain);
  wind.connect(low);
  low.connect(high);
  high.connect(g);
  g.connect(dest);
  wind.start();
  lfo.start();
  nodes.push(wind, low, high, lfo, lfoGain, g);
}

function createWindHarp(nodes, dest, gain) {
  const freqs = [73.42, 98, 146.83, 196, 220, 293.66, 329.63, 392, 440, 587.33, 659.25, 783.99];
  createWindHarpGustLayer(nodes, dest, gain);
  freqs.forEach(f => {
    const noise = audioCtx.createBufferSource();
    const body = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const shimmer = audioCtx.createBiquadFilter();
    const width = audioCtx.createStereoPanner();
    const g = audioCtx.createGain();
    const lfo = audioCtx.createOscillator();
    const lg = audioCtx.createGain();
    noise.buffer = createNoiseBuffer('pink');
    noise.loop = true;
    body.type = 'sine';
    body.frequency.value = f;
    filter.type = 'bandpass';
    filter.frequency.value = f;
    filter.Q.value = 115;
    shimmer.type = 'peaking';
    shimmer.frequency.value = f * 2;
    shimmer.Q.value = 10;
    shimmer.gain.value = 7;
    width.pan.value = -0.92 + Math.random() * 1.84;
    lfo.frequency.value = 0.018 + Math.random() * 0.052;
    lg.gain.value = gain / (freqs.length * 1.15);
    g.gain.value = gain / (freqs.length * 0.52);
    lfo.connect(lg); lg.connect(g.gain);
    noise.connect(filter);
    body.connect(g);
    filter.connect(shimmer);
    shimmer.connect(g);
    g.connect(width);
    width.connect(dest);
    noise.start();
    body.start();
    lfo.start();
    nodes.push(noise, body, filter, shimmer, width, lfo, lg, g);
  });
}

function createSoftChimeStrike(nodes, dest, startTime, freq, peak, decay) {
  [1, 2.01, 2.98].forEach((multiplier, index) => {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = index === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq * multiplier * (0.996 + Math.random() * 0.008), startTime);
    g.gain.setValueAtTime(0.001, startTime);
    g.gain.linearRampToValueAtTime(peak / (index + 1.7), startTime + 0.012 + index * 0.006);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + decay * (1 - index * 0.16));
    osc.connect(g);
    g.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + decay + 0.2);
    nodes.push(osc, g);
  });
}

function createShopChimes(nodes, dest, gain) {
  const freqs = [1567.98, 1760, 2093, 2349.32, 2637.02, 3135.96];
  const doorPatterns = [
    [0, 0.055, 0.14, 0.24],
    [0, 0.045, 0.12, 0.2, 0.31],
    [0, 0.07, 0.16, 0.27, 0.41]
  ];
  const triggerEntry = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    const pattern = doorPatterns[Math.floor(Math.random() * doorPatterns.length)];
    const repeats = 1 + Math.floor(Math.random() * 2);
    for(let i=0; i < pattern.length * repeats; i++) {
      const delay = pattern[i % pattern.length] + Math.floor(i / pattern.length) * 0.42;
      const f = freqs[(i + Math.floor(Math.random() * 2)) % freqs.length] + (Math.random() * 42);
      createSoftChimeStrike(nodes, dest, now + delay, f, gain * (0.16 + Math.random() * 0.1), 4.8 + Math.random() * 1.8);
    }
    setTimeout(triggerEntry, 7000 + Math.random() * 15000);
  };
  triggerEntry();
}

function createBellStrikeNoise(nodes, dest, startTime, gain) {
  const noise = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const g = audioCtx.createGain();
  noise.buffer = createNoiseBuffer('brown');
  filter.type = 'bandpass';
  filter.frequency.value = 820;
  filter.Q.value = 0.7;
  g.gain.setValueAtTime(0.001, startTime);
  g.gain.linearRampToValueAtTime(gain, startTime + 0.018);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.34);
  noise.connect(filter);
  filter.connect(g);
  g.connect(dest);
  noise.start(startTime);
  noise.stop(startTime + 0.38);
  nodes.push(noise, filter, g);
}

function createChurchBell(nodes, dest, gain) {
  createChurchBellAmbience(nodes, dest, gain);
  const partials = [
    [92.5, 0.7, 42],
    [138.6, 1, 40],
    [184.8, 0.48, 36],
    [277.2, 0.52, 30],
    [369.9, 0.34, 24],
    [554.4, 0.2, 18],
    [739.9, 0.13, 14],
    [1108.7, 0.08, 10]
  ];
  const strike = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    const bellSequence = [0, 2.9, 5.8, 9.2, 12.4, 15.9, 21.6, 25.2];
    bellSequence.forEach((delay, strikeIndex) => {
      const t = now + delay;
      createBellStrikeNoise(nodes, dest, t, gain * (0.24 - strikeIndex * 0.025));
      partials.forEach(([freq, weight, decay], index) => {
        const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); const p = audioCtx.createStereoPanner();
        o.type = index < 3 ? 'sine' : 'triangle';
        o.frequency.setValueAtTime(freq * (0.994 + Math.random() * 0.012), t);
        p.pan.value = -0.32 + index * 0.09;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(gain * weight * (1 - strikeIndex * 0.08), t + 0.035 + index * 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + decay);
        o.connect(g); g.connect(p); p.connect(dest); o.start(t); o.stop(t + decay + 0.2);
        nodes.push(o, g, p);
      });
    });
    setTimeout(strike, 52000 + Math.random() * 76000);
  };
  strike();
}

function createChurchBellAmbience(nodes, dest, gain) {
  const air = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const amp = audioCtx.createGain();
  air.buffer = createNoiseBuffer('pink');
  air.loop = true;
  filter.type = 'lowpass';
  filter.frequency.value = 520;
  amp.gain.value = gain * 0.035;
  air.connect(filter);
  filter.connect(amp);
  amp.connect(dest);
  air.start();
  nodes.push(air, filter, amp);
}

function createInterstellarStayTone(nodes, dest, gain) {
  const bus = createCinematicBus(nodes, dest, gain, 7.2);
  const droneNotes = [55, 82.41, 110, 146.83, 220];
  droneNotes.forEach((freq, index) => {
    const o = audioCtx.createOscillator(); const lfo = audioCtx.createOscillator(); const lg = audioCtx.createGain(); const g = audioCtx.createGain(); const p = audioCtx.createStereoPanner();
    o.type = index < 2 ? 'sine' : 'triangle';
    o.frequency.value = freq;
    lfo.frequency.value = 0.025 + index * 0.008;
    lg.gain.value = gain / 18;
    g.gain.value = gain / (index < 2 ? 3.5 : 7);
    p.pan.value = -0.45 + index * 0.22;
    lfo.connect(lg); lg.connect(g.gain);
    o.connect(g); g.connect(p); p.connect(bus);
    o.start(); lfo.start(); nodes.push(o, lfo, lg, g, p);
  });

  createCinematicScoreEngine(nodes, bus, {
    guard: dest,
    bpm: 90,
    cycleBeats: 132,
    generateCycle: createStayPadCycle
  });
}

function createCinematicBus(nodes, dest, gain, seconds = 5.5) {
  const input = audioCtx.createGain();
  const dry = audioCtx.createGain();
  const wet = audioCtx.createGain();
  const convolver = audioCtx.createConvolver();
  const filter = audioCtx.createBiquadFilter();
  const length = Math.floor(audioCtx.sampleRate * seconds);
  const impulse = audioCtx.createBuffer(2, length, audioCtx.sampleRate);

  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      last = (Math.random() * 2 - 1) * 0.035 + last * 0.965;
      data[i] = last * ((1 - i / length) ** 3.2);
    }
  }

  input.gain.value = gain;
  dry.gain.value = 0.58;
  wet.gain.value = 0.72;
  filter.type = 'lowpass';
  filter.frequency.value = 3600;
  convolver.buffer = impulse;
  input.connect(dry);
  input.connect(convolver);
  dry.connect(dest);
  convolver.connect(filter);
  filter.connect(wet);
  wet.connect(dest);
  nodes.push(input, dry, wet, convolver, filter);
  return input;
}

function playCinematicPerc(dest, time, vel) {
  const noise = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const g = audioCtx.createGain();
  const boom = audioCtx.createOscillator();
  const boomGain = audioCtx.createGain();

  noise.buffer = createNoiseBuffer('brown');
  filter.type = 'bandpass';
  filter.frequency.value = 1400;
  filter.Q.value = 0.45;
  g.gain.setValueAtTime(0.001, time);
  g.gain.linearRampToValueAtTime(0.12 * vel, time + 0.012);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.34);
  boom.type = 'sine';
  boom.frequency.setValueAtTime(96, time);
  boom.frequency.exponentialRampToValueAtTime(34, time + 0.24);
  boomGain.gain.setValueAtTime(0.001, time);
  boomGain.gain.linearRampToValueAtTime(0.26 * vel, time + 0.01);
  boomGain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);
  noise.connect(filter);
  filter.connect(g);
  g.connect(dest);
  boom.connect(boomGain);
  boomGain.connect(dest);
  noise.start(time);
  boom.start(time);
  noise.stop(time + 0.42);
  boom.stop(time + 0.46);
}

function playCinematicNote(dest, event, time, beatLen) {
  if (event.type === 'perc') {
    playCinematicPerc(dest, time, event.vel);
    return;
  }
  const freq = NOTE_FREQUENCIES[event.note];
  if (!freq || event.type === 'pause') return;

  const duration = event.dur * beatLen;
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  const pan = audioCtx.createStereoPanner();
  const voices = [];
  let attack = 0.12;
  let decay = 0;
  let sustain = 1;
  let release = 1.2;
  let peak = 0.16 * event.vel;

  if (event.type === 'bg') {
    voices.push(['triangle', 1, 0], ['sine', 0.5, -2], ['sine', 2, 3]);
    filter.type = 'lowpass';
    filter.frequency.value = 620 + event.vel * 420;
    attack = 2.2;
    release = 4.5;
    peak = 0.18 * event.vel;
  } else if (event.type === 'ost') {
    voices.push(['sine', 1, 0], ['triangle', 1, -4], ['square', 1, 5]);
    filter.type = 'lowpass';
    filter.frequency.value = 1500 + event.vel * 1800;
    attack = 0.05;
    release = 0.95;
    peak = 0.21 * event.vel;
  } else if (event.type === 'brass') {
    voices.push(['sawtooth', 1, 0], ['sawtooth', 0.5, -7], ['triangle', 0.5, 4]);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(360, time);
    filter.frequency.linearRampToValueAtTime(2400 + event.vel * 1200, time + 0.1);
    filter.frequency.setTargetAtTime(980, time + 0.16, 0.24);
    attack = 0.055;
    release = 0.32;
    peak = 0.2 * event.vel;
  } else if (event.type === 'lead') {
    voices.push(['sawtooth', 1, 0], ['triangle', 1, -5], ['square', 0.5, 7]);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, time);
    filter.frequency.linearRampToValueAtTime(3800 + event.vel * 900, time + 0.08);
    filter.frequency.setTargetAtTime(1800, time + 0.18, 0.22);
    attack = 0.025;
    release = 0.42;
    peak = 0.18 * event.vel;
  } else if (event.type === 'piano') {
    voices.push(['square', 1, 0], ['triangle', 1, 1], ['sine', 2, -2]);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4000, time);
    filter.frequency.linearRampToValueAtTime(1200, time + 0.1);
    attack = 0.005;
    decay = 0.1;
    sustain = 0.2;
    release = 0.6;
    peak = 0.28 * event.vel;
  } else if (event.type === 'pad') {
    voices.push(['triangle', 1, 0], ['sine', 0.5, -4], ['sine', 2, 3]);
    filter.type = 'lowpass';
    filter.frequency.value = 760 + event.vel * 360;
    attack = 1.8;
    release = 3.6;
    peak = 0.09 * event.vel;
  } else if (event.type === 'guitar') {
    voices.push(['triangle', 1, 0], ['sawtooth', 2, -7]);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600 + event.vel * 900, time);
    filter.Q.value = 1.15;
    attack = 0.018;
    release = 0.5;
    peak = 0.16 * event.vel;
  } else if (event.type === 'bass') {
    voices.push(['triangle', 1, 0], ['sawtooth', 1, -8], ['sine', 0.5, 0]);
    filter.type = 'lowpass';
    filter.frequency.value = 520 + event.vel * 540;
    attack = 0.08;
    release = 0.55;
    peak = 0.18 * event.vel;
  } else {
    voices.push(['sine', 1, 0], ['triangle', 2, 6]);
    filter.type = 'lowpass';
    filter.frequency.value = 1200;
    peak = 0.14 * event.vel;
  }

  pan.pan.value = event.pan ?? 0;
  filter.connect(gain);
  gain.connect(pan);
  pan.connect(dest);
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(peak, time + attack);
  if (decay > 0) {
    gain.gain.linearRampToValueAtTime(Math.max(0.001, peak * sustain), time + attack + decay);
    gain.gain.setValueAtTime(Math.max(0.001, peak * sustain), time + Math.max(attack + decay, duration * 0.65));
  } else {
    gain.gain.setValueAtTime(peak, time + Math.max(attack, duration * 0.65));
  }
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration + release);

  voices.forEach(([wave, multiple, detune]) => {
    const osc = audioCtx.createOscillator();
    osc.type = wave;
    osc.frequency.value = freq * multiple;
    osc.detune.value = detune;
    osc.connect(filter);
    osc.start(time);
    osc.stop(time + duration + release + 0.2);
  });
}

function createCinematicScoreEngine(nodes, dest, options) {
  const beatLen = 60 / options.bpm;
  const score = [];
  const guard = options.guard || dest;
  let eventIndex = 0;
  let lastCycle = -1;
  const startTime = audioCtx.currentTime + 0.35;
  const offlineRenderUntil = typeof OfflineAudioContext !== 'undefined' && audioCtx instanceof OfflineAudioContext
    ? audioCtx.length / audioCtx.sampleRate
    : 0;
  const appendCycle = () => {
    lastCycle += 1;
    const cycleStart = lastCycle * options.cycleBeats;
    const next = options.generateCycle(cycleStart);
    next.sort((a, b) => a.beat - b.beat);
    score.push(...next);
  };

  appendCycle();
  appendCycle();

  if (offlineRenderUntil) {
    while (lastCycle * options.cycleBeats * beatLen < offlineRenderUntil) appendCycle();
    score.forEach((event) => {
      const eventTime = startTime + event.beat * beatLen;
      if (eventTime < offlineRenderUntil) playCinematicNote(dest, event, eventTime, beatLen);
    });
    return;
  }

  const process = () => {
    if (!activeAmbientNodes.includes(guard)) return;
    const now = audioCtx.currentTime;
    while (eventIndex < score.length) {
      const event = score[eventIndex];
      const eventTime = startTime + event.beat * beatLen;
      if (eventTime >= now + 1.35) break;
      playCinematicNote(dest, event, eventTime, beatLen);
      eventIndex += 1;
    }
    if (score[eventIndex]?.beat > lastCycle * options.cycleBeats - options.cycleBeats * 0.4) {
      appendCycle();
    }
    setTimeout(process, 45);
  };
  process();
}

function createStarwarsMarchTheme(nodes, dest, gain) {
  const bus = createCinematicBus(nodes, dest, gain, 4.2);
  createCinematicScoreEngine(nodes, bus, {
    guard: dest,
    bpm: 96,
    cycleBeats: 64,
    generateCycle: createStarwarsMarchCycle
  });
}

function createFinalCountdownTheme(nodes, dest, gain) {
  const bus = createCinematicBus(nodes, dest, gain, 4.8);
  createCinematicScoreEngine(nodes, bus, {
    guard: dest,
    bpm: 118,
    cycleBeats: 65,
    generateCycle: createFinalCountdownCycle
  });
}

function createNoirOrbitTheme(nodes, dest, gain) {
  const bus = createCinematicBus(nodes, dest, gain, 5.2);
  createCinematicScoreEngine(nodes, bus, {
    guard: dest,
    bpm: 72,
    cycleBeats: 48,
    generateCycle: createNoirOrbitCycle
  });
}

function createOrganHorizonTheme(nodes, dest, gain) {
  const bus = createCinematicBus(nodes, dest, gain, 7.8);
  createCinematicScoreEngine(nodes, bus, {
    guard: dest,
    bpm: 76,
    cycleBeats: 96,
    generateCycle: createOrganHorizonCycle
  });
}

function createLoveTheme(nodes, dest, gain) {
  const bus = createCinematicBus(nodes, dest, gain, 6.6);
  createCinematicScoreEngine(nodes, bus, {
    guard: dest,
    bpm: 72,
    cycleBeats: 88,
    generateCycle: createLoveThemeCycle
  });
}

function createRhapsodySuite(nodes, dest, gain) {
  const bus = createCinematicBus(nodes, dest, gain, 5.8);
  createCinematicScoreEngine(nodes, bus, {
    guard: dest,
    bpm: 72,
    cycleBeats: 392,
    generateCycle: createRhapsodySuiteCycle
  });
}

function createLibraryFocus(nodes, dest, gain) {
  const room = audioCtx.createBufferSource(); room.buffer = createNoiseBuffer('brown'); room.loop = true;
  const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 360;
  const g = audioCtx.createGain(); g.gain.value = gain * 0.5;
  room.connect(filter); filter.connect(g); g.connect(dest); room.start();
  nodes.push(room, filter, g);
  const rustle = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    const n = audioCtx.createBufferSource(); n.buffer = createNoiseBuffer('pink');
    const f = audioCtx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1800;
    const rg = audioCtx.createGain(); rg.gain.setValueAtTime(0, now); rg.gain.linearRampToValueAtTime(gain, now + 0.02); rg.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    n.connect(f); f.connect(rg); rg.connect(dest); n.start(now); n.stop(now + 0.24);
    setTimeout(rustle, 4500 + Math.random() * 12000);
  };
  rustle();
}

function createFocusPulse(nodes, dest, gain) {
  const o = audioCtx.createOscillator(); o.type = 'sine'; o.frequency.value = 96;
  const lfo = audioCtx.createOscillator(); lfo.frequency.value = 0.5;
  const lg = audioCtx.createGain(); lg.gain.value = gain * 0.8;
  const g = audioCtx.createGain(); g.gain.value = gain * 0.35;
  lfo.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(dest);
  o.start(); lfo.start(); nodes.push(o, lfo, lg, g);
}

function createBreathMeter(nodes, dest, gain) {
  const noise = audioCtx.createBufferSource(); noise.buffer = createNoiseBuffer('pink'); noise.loop = true;
  const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1200;
  const lfo = audioCtx.createOscillator(); lfo.frequency.value = 0.12;
  const lg = audioCtx.createGain(); lg.gain.value = gain;
  const g = audioCtx.createGain(); g.gain.value = gain * 0.4;
  lfo.connect(lg); lg.connect(g.gain); noise.connect(filter); filter.connect(g); g.connect(dest);
  noise.start(); lfo.start(); nodes.push(noise, filter, lfo, lg, g);
}

function createGranularCloud(nodes, dest, gain) {
  const bed = audioCtx.createBufferSource();
  const bedFilter = audioCtx.createBiquadFilter();
  const bedGain = audioCtx.createGain();
  bed.buffer = createNoiseBuffer('pink');
  bed.loop = true;
  bedFilter.type = 'bandpass';
  bedFilter.frequency.value = 620;
  bedFilter.Q.value = 0.4;
  bedGain.gain.value = gain * 0.18;
  bed.connect(bedFilter);
  bedFilter.connect(bedGain);
  bedGain.connect(dest);
  bed.start();
  nodes.push(bed, bedFilter, bedGain);

  const trigger = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    for (let i = 0; i < 3; i += 1) {
      const t = now + Math.random() * 1.8;
      const o = audioCtx.createOscillator();
      const f = audioCtx.createBiquadFilter();
      const g = audioCtx.createGain();
      const p = audioCtx.createStereoPanner();
      o.type = 'sine';
      o.frequency.setValueAtTime(180 + Math.random() * 620, t);
      f.type = 'lowpass';
      f.frequency.value = 1200 + Math.random() * 1100;
      p.pan.value = -0.7 + Math.random() * 1.4;
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(gain * (0.05 + Math.random() * 0.04), t + 0.18);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.8 + Math.random() * 1.4);
      o.connect(f);
      f.connect(g);
      g.connect(p);
      p.connect(dest);
      o.start(t);
      o.stop(t + 3.4);
      nodes.push(o, f, g, p);
    }
    setTimeout(trigger, 2600 + Math.random() * 4200);
  };
  trigger();
}

function createSolarWind(nodes, dest, gain) {
  const noise = audioCtx.createBufferSource(); noise.buffer = createNoiseBuffer('pink'); noise.loop = true;
  const filter = audioCtx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1200; filter.Q.value = 0.35;
  const lfo = audioCtx.createOscillator(); lfo.frequency.value = 0.035;
  const sweep = audioCtx.createGain(); sweep.gain.value = 900;
  const g = audioCtx.createGain(); g.gain.value = gain;
  lfo.connect(sweep); sweep.connect(filter.frequency); noise.connect(filter); filter.connect(g); g.connect(dest);
  noise.start(); lfo.start(); nodes.push(noise, filter, lfo, sweep, g);
}

function createPulseCave(nodes, dest, gain) {
  createDrone(nodes, dest, 48, gain * 0.35);
  const trigger = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(72, now);
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(gain, now + 0.12); g.gain.exponentialRampToValueAtTime(0.001, now + 2.6);
    o.connect(g); g.connect(dest); o.start(now); o.stop(now + 2.8);
    setTimeout(trigger, 2800 + Math.random() * 4800);
  };
  trigger();
}

function createPressureWaves(nodes, dest, gain) {
  [36, 42, 54].forEach((freq, index) => {
    const o = audioCtx.createOscillator(); const lfo = audioCtx.createOscillator(); const lg = audioCtx.createGain(); const g = audioCtx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    lfo.frequency.value = 0.04 + index * 0.025;
    lg.gain.value = gain * 0.55;
    g.gain.value = gain / 4;
    lfo.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(dest);
    o.start(); lfo.start(); nodes.push(o, lfo, lg, g);
  });
}

function createWaves(nodes, dest, gain) {
  const deep = audioCtx.createBufferSource(); deep.buffer = createNoiseBuffer('brown'); deep.loop = true;
  const df = audioCtx.createBiquadFilter(); df.type = 'lowpass'; df.frequency.value = 50;
  const surge = audioCtx.createBufferSource(); surge.buffer = createNoiseBuffer('pink'); surge.loop = true;
  const sf = audioCtx.createBiquadFilter(); sf.type = 'bandpass'; sf.frequency.value = 400;
  const swell = audioCtx.createOscillator(); swell.frequency.value = 0.06;
  const sg = audioCtx.createGain(); sg.gain.value = 0.4; swell.connect(sg);
  const g = audioCtx.createGain(); g.gain.value = gain * 0.6; sg.connect(g.gain);
  deep.connect(df); df.connect(g); surge.connect(sf); sf.connect(g); g.connect(dest);
  deep.start(); surge.start(); swell.start(); nodes.push(deep, surge, swell, g);
}

function createRain(nodes, dest, gain) {
  const n = audioCtx.createBufferSource(); n.buffer = createNoiseBuffer('white'); n.loop = true;
  const f = audioCtx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1500;
  const g = audioCtx.createGain(); g.gain.value = gain * 0.8;
  n.connect(f); f.connect(g); g.connect(dest); n.start(); nodes.push(n, g);
}

function createThunder(nodes, dest) {
  const trigger = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    const n = audioCtx.createBufferSource(); n.buffer = createNoiseBuffer('brown');
    const f = audioCtx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 80;
    const g = audioCtx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.15, now + 0.5); g.gain.exponentialRampToValueAtTime(0.001, now + 10);
    n.connect(f); f.connect(g); g.connect(dest); n.start(now); n.stop(now + 10);
    setTimeout(trigger, 15000 + Math.random() * 20000);
  };
  trigger();
}

function createResonant(nodes, dest, freqs, decay, gain, detune = false) {
  const strike = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    freqs.forEach(f => {
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.frequency.value = f * (detune ? (0.98 + Math.random() * 0.04) : 1);
      g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(gain / freqs.length, now + 0.1); g.gain.exponentialRampToValueAtTime(0.001, now + decay);
      o.connect(g); g.connect(dest); o.start(now); o.stop(now + decay);
    });
    setTimeout(strike, (decay * 0.7) * 1000 + (Math.random() * 5000));
  };
  strike();
}

function createDrone(nodes, dest, base, gain) {
  [1, 1.5, 2].forEach(m => {
    const o = audioCtx.createOscillator(); o.frequency.value = base * m;
    const g = audioCtx.createGain(); const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.1; const lg = audioCtx.createGain(); lg.gain.value = 0.1;
    lfo.connect(lg); lg.connect(g.gain); g.gain.value = gain / 4;
    o.connect(g); g.connect(dest); o.start(); lfo.start(); nodes.push(o, lfo, g);
  });
}

function createDream(nodes, dest, gain) {
  const freqs = [261.63, 329.63, 392.00, 493.88];
  freqs.forEach(f => {
    const osc = audioCtx.createOscillator(); osc.type = 'sine'; osc.frequency.value = f;
    const g = audioCtx.createGain(); const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.1; const lg = audioCtx.createGain(); lg.gain.value = 0.05;
    lfo.connect(lg); lg.connect(g.gain); g.gain.value = gain/5;
    osc.connect(g); g.connect(dest); osc.start(); lfo.start(); nodes.push(osc, lfo, g);
  });
}

function createSubmerged(nodes, dest) {
  const roar = audioCtx.createBufferSource(); roar.buffer = createNoiseBuffer('brown'); roar.loop = true;
  const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 100;
  const gain = audioCtx.createGain(); gain.gain.value = 0.4;
  const lfo = audioCtx.createOscillator(); lfo.frequency.value = 0.05;
  const lg = audioCtx.createGain(); lg.gain.value = 0.2;
  lfo.connect(lg); lg.connect(gain.gain);
  roar.connect(filter); filter.connect(gain); gain.connect(dest);
  roar.start(); lfo.start();
  nodes.push(roar, filter, gain, lfo);
}

function createMagnetic(nodes, dest, gain) {
  const osc = audioCtx.createOscillator(); osc.frequency.value = 120;
  const mod = audioCtx.createOscillator(); mod.frequency.value = 0.2;
  const mg = audioCtx.createGain(); mg.gain.value = 20;
  mod.connect(mg); mg.connect(osc.frequency);
  const g = audioCtx.createGain(); g.gain.value = gain * 0.8;
  osc.connect(g); g.connect(dest); osc.start(); mod.start(); nodes.push(osc, mod, g);
}

function createBloom(nodes, dest, gain) {
  const trigger = () => {
    if (!activeAmbientNodes.includes(dest)) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator(); const g = audioCtx.createGain();
    osc.frequency.value = 200 + Math.random() * 800;
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(gain/5, now + 2); g.gain.linearRampToValueAtTime(0, now + 6);
    osc.connect(g); g.connect(dest); osc.start(now); osc.stop(now + 6);
    setTimeout(trigger, 2000 + Math.random() * 4000);
  };
  trigger();
}

function createEther(nodes, dest, gain) {
  const noise = audioCtx.createBufferSource(); noise.buffer = createNoiseBuffer('pink'); noise.loop = true;
  const filter = audioCtx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 3000; filter.Q.value = 0.2;
  const g = audioCtx.createGain(); g.gain.value = gain * 0.7;
  noise.connect(filter); filter.connect(g); g.connect(dest); noise.start(); nodes.push(noise, g);
}

function initVisualizer(canvas) {
  const ctx = canvas.getContext('2d');
  const bufferLength = 256;
  const dataArray = new Uint8Array(bufferLength);
  const draw = () => {
    animationId = requestAnimationFrame(draw);
    if (!analyzer) return;
    analyzer.getByteFrequencyData(dataArray);
    const w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    const h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.clearRect(0, 0, w, h);
    if (visualizerMode === 'circular') {
      drawCircularVisualizer(ctx, dataArray, w, h);
    } else {
      drawStandardVisualizer(ctx, dataArray, w, h);
    }
  };
  draw();
}

function drawCircularVisualizer(ctx, dataArray, w, h) {
  const [startBin, endBin] = getActiveVisualizerBinRange(dataArray);
  ctx.fillStyle = VISUALIZER_PALETTE.background;
  ctx.fillRect(0, 0, w, h);
  const cX = w / 2;
  const cY = h / 2;
  const radius = Math.min(w, h) / 4;
  const visibleBins = Math.max(1, endBin - startBin + 1);
  ctx.beginPath();
  ctx.arc(cX, cY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = VISUALIZER_PALETTE.grid;
  ctx.lineWidth = 1;
  ctx.stroke();
  for (let bin = startBin; bin <= endBin; bin += 1) {
    const value = dataArray[bin] / 255;
    const boosted = Math.min(1, Math.pow(value, 0.72) * (1.05 + (bin / dataArray.length) * 0.7));
    const barHeight = boosted * radius * 1.55;
    const angle = ((bin - startBin) / visibleBins) * Math.PI * 2 - Math.PI / 2;
    const x1 = cX + Math.cos(angle) * radius;
    const y1 = cY + Math.sin(angle) * radius;
    const x2 = cX + Math.cos(angle) * (radius + Math.max(barHeight, 1));
    const y2 = cY + Math.sin(angle) * (radius + Math.max(barHeight, 1));
    const hueZone = bin / dataArray.length;
    ctx.strokeStyle = value > 0.7
      ? VISUALIZER_PALETTE.peak
      : hueZone < 0.18
        ? VISUALIZER_PALETTE.low
        : hueZone < 0.62
          ? VISUALIZER_PALETTE.mid
          : VISUALIZER_PALETTE.high;
    ctx.lineWidth = Math.max(1.5, (w / 380) * 1.2);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

function frequencyToVisualizerBin(freq, dataArray) {
  return resolveVisualizerBin(freq, dataArray.length, audioCtx?.sampleRate || 44100);
}

function getTargetVisualizerBinRange(dataArray) {
  return resolveTargetVisualizerBinRange({
    trimEmpty: visualizerTrimEmpty,
    ambientEnabled: ambientEngineEnabled,
    noiseEnabled: noiseMatrixEnabled,
    currentAmbientMode,
    currentNoiseMode,
    binCount: dataArray.length,
    sampleRate: audioCtx?.sampleRate || 44100
  });
}

function getActiveVisualizerBinRange(dataArray) {
  const targetRange = getTargetVisualizerBinRange(dataArray);
  const sampledRange = sampleActiveVisualizerRange(dataArray);
  const [first, last, nextStart, nextEnd] = resolveSmoothedVisualizerBinRange({
    trimEmpty: visualizerTrimEmpty,
    targetRange: sampledRange || targetRange,
    currentStart: visualizerFocusStartBin,
    currentEnd: visualizerFocusEndBin,
    binCount: dataArray.length
  });
  visualizerFocusStartBin = nextStart;
  visualizerFocusEndBin = nextEnd;
  return [first, last];
}

function sampleActiveVisualizerRange(dataArray) {
  if (!visualizerTrimEmpty || Date.now() < visualizerWarmupUntil) return null;
  const threshold = 12;
  let first = dataArray.length;
  let last = 0;
  for (let index = 0; index < dataArray.length; index += 1) {
    if (dataArray[index] < threshold) continue;
    first = Math.min(first, index);
    last = Math.max(last, index);
  }
  if (first > last) return null;
  visualizerObservedStartBin = Math.min(visualizerObservedStartBin, first);
  visualizerObservedEndBin = Math.max(visualizerObservedEndBin, last);
  return [visualizerObservedStartBin, visualizerObservedEndBin];
}

function drawVisualizerGrid(ctx, w, h, startBin, endBin) {
  const minorGridLines = 12;
  ctx.save?.();
  ctx.strokeStyle = VISUALIZER_PALETTE.grid;
  for (let index = 1; index < minorGridLines; index += 1) {
    const x = (w / minorGridLines) * index;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  VISUALIZER_BAND_LABELS.forEach((band) => {
    const x = Math.max(6, Math.min(w - 64, ((band.start + band.end) / 2) * w));
    ctx.fillStyle = band.color;
    ctx.font = `${Math.max(22, Math.round(w / 64))}px system-ui`;
    ctx.fillText(band.label, x, Math.max(22, Math.round(w / 64)));
  });
  ctx.restore?.();
}

function drawVisualizerRulers(ctx, w, h, startBin, endBin) {
  const nyquist = (audioCtx?.sampleRate || 44100) / 2;
  ctx.save?.();
  drawVisualizerGrid(ctx, w, h, startBin, endBin);
  ctx.strokeStyle = VISUALIZER_PALETTE.grid;
  ctx.fillStyle = VISUALIZER_PALETTE.text;
  ctx.lineWidth = 1;
  const dbTicks = [-60, -48, -36, -24, -12, 0];
  dbTicks.forEach((db) => {
    const y = h - ((db + 60) / 60) * (h - 24) - 12;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    if (typeof ctx.fillText === 'function') ctx.fillText(`${db} dB`, 6, Math.max(12, y - 4));
  });
  const labels = [60, 120, 250, 500, 1000, 2000, 4000, 8000, 16000];
  labels.forEach((freq) => {
    const bin = (freq / nyquist) * 255;
    if (bin < startBin || bin > endBin) return;
    const x = ((bin - startBin) / Math.max(1, endBin - startBin)) * w;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    if (typeof ctx.fillText === 'function') ctx.fillText(freq >= 1000 ? `${freq / 1000}k` : `${freq}`, x + 4, h - 8);
  });
  ctx.restore?.();
}

function drawStandardVisualizer(ctx, dataArray, w, h) {
  const [startBin, endBin] = getActiveVisualizerBinRange(dataArray);
  ctx.fillStyle = VISUALIZER_PALETTE.background;
  ctx.fillRect(0, 0, w, h);
  drawVisualizerRulers(ctx, w, h, startBin, endBin);
  const visibleBins = Math.max(1, endBin - startBin + 1);
  const barWidth = w / visibleBins;
  for (let bin = startBin; bin <= endBin; bin += 1) {
    const value = dataArray[bin] / 255;
    const x = (bin - startBin) * barWidth;
    const boosted = Math.min(1, Math.pow(value, 0.72) * (1.05 + (bin / dataArray.length) * 0.7));
    const barHeight = Math.max(1, boosted * (h - 26));
    const peak = Math.max(barHeight, visualizerPeakFalloff[bin] - Math.max(1.6, h * 0.012));
    visualizerPeakFalloff[bin] = peak;
    const hueZone = bin / dataArray.length;
    const lowColor = value > 0.42 ? VISUALIZER_PALETTE.low : VISUALIZER_PALETTE.lowDim;
    const midColor = value > 0.42 ? VISUALIZER_PALETTE.mid : VISUALIZER_PALETTE.midDim;
    const highColor = value > 0.42 ? VISUALIZER_PALETTE.high : VISUALIZER_PALETTE.highDim;
    ctx.fillStyle = hueZone < 0.18 ? lowColor : hueZone < 0.62 ? midColor : highColor;
    ctx.fillRect(x + 1, h - barHeight, Math.max(1, barWidth - 2), barHeight);
    ctx.fillStyle = value > 0.72 ? VISUALIZER_PALETTE.peak : VISUALIZER_PALETTE.peakWarm;
    ctx.fillRect(x + 1, h - peak - 2, Math.max(1, barWidth - 2), 2);
  }
}

export function unmount() {
  ambientMediaControlsCleanup?.();
  ambientMediaControlsCleanup = null;
  cancelAnimationFrame(animationId);
  if (audioCtx) {
    stopAndDisconnectAudioNodes(activeAmbientNodes, { context: audioCtx, fadeSeconds: 0.1 });
    stopAndDisconnectAudioNodes(activeNoiseNodes, { context: audioCtx, fadeSeconds: 0.1 });
    closeAudioContext(audioCtx);
  }
  container?.remove();
  container = null;
}

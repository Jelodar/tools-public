import { createWebMediaService } from '../core/webmedia-service.js';
import { buildWebMediaOutputName, canContainerCarryTrack, planWebMediaOperation, WEBMEDIA_CONTAINERS } from '../utils/webmedia-plan.js';
import { analyzeWaveform } from '../core/media-visualization-service.js';
import { createJobProgress } from '../ui/job-progress.js';
import { renderToggleSwitch } from '../ui/form-controls.js';
import { createMediaTrimmer } from '../ui/media-trimmer.js';
import { downloadFile, showToast } from '../ui/ui-utils.js';
import { captureVideoFrameStrip } from '../utils/media-visualization.js';

let container = null;
let service = null;
let progressController = null;
let files = [];
let activeFile = null;
let activeInspection = null;
let activeOperation = 'inspect';
let activePlan = null;
let activeRun = null;
let activePreviewUrl = '';
let activeOutputUrl = '';
let activeOutputBlob = null;
let activeOutputName = '';
let activeOutputMime = '';
let trimmer = null;
let trimmerVisualToken = 0;
let planUpdateTimer = 0;
let lastUrgentDiagnosticKey = '';

const WEBMEDIA_SPEED_PRESETS = {
  draft: {
    rateControl: 'bitrate',
    quality: 32,
    videoBitrateKbps: 1200,
    maxVideoBitrateKbps: 0,
    bufferSizeKbps: 0,
    audioBitrateKbps: 96,
    frameRate: 24,
    keyFrameInterval: 4,
    hardwareAcceleration: 'prefer-hardware',
    latencyMode: 'realtime'
  },
  preview: {
    rateControl: 'bitrate',
    quality: 28,
    videoBitrateKbps: 2200,
    maxVideoBitrateKbps: 0,
    bufferSizeKbps: 0,
    audioBitrateKbps: 128,
    frameRate: 30,
    keyFrameInterval: 3,
    hardwareAcceleration: 'prefer-hardware',
    latencyMode: 'realtime'
  },
  fast: {
    rateControl: 'bitrate',
    quality: 25,
    videoBitrateKbps: 3500,
    maxVideoBitrateKbps: 0,
    bufferSizeKbps: 0,
    audioBitrateKbps: 160,
    frameRate: 30,
    keyFrameInterval: 2,
    hardwareAcceleration: 'prefer-hardware',
    latencyMode: 'auto'
  },
  medium: {
    rateControl: 'bitrate',
    quality: 23,
    videoBitrateKbps: 4500,
    maxVideoBitrateKbps: 0,
    bufferSizeKbps: 0,
    audioBitrateKbps: 160,
    frameRate: 30,
    keyFrameInterval: 2,
    hardwareAcceleration: 'no-preference',
    latencyMode: 'auto'
  },
  quality: {
    rateControl: 'quality',
    quality: 21,
    videoBitrateKbps: 6500,
    maxVideoBitrateKbps: 9000,
    bufferSizeKbps: 18000,
    audioBitrateKbps: 192,
    frameRate: 30,
    keyFrameInterval: 2,
    hardwareAcceleration: 'no-preference',
    latencyMode: 'quality'
  },
  slow: {
    rateControl: 'quality',
    quality: 20,
    videoBitrateKbps: 8000,
    maxVideoBitrateKbps: 12000,
    bufferSizeKbps: 24000,
    audioBitrateKbps: 192,
    frameRate: 30,
    keyFrameInterval: 2,
    hardwareAcceleration: 'prefer-software',
    latencyMode: 'quality'
  },
  veryslow: {
    rateControl: 'quality',
    quality: 18,
    videoBitrateKbps: 12000,
    maxVideoBitrateKbps: 18000,
    bufferSizeKbps: 36000,
    audioBitrateKbps: 256,
    frameRate: 30,
    keyFrameInterval: 2,
    hardwareAcceleration: 'prefer-software',
    latencyMode: 'quality'
  }
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatBytes(value = 0) {
  const bytes = Number(value || 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDuration(seconds = 0) {
  const totalSeconds = Math.max(0, Math.round(Number(seconds || 0)));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remaining = totalSeconds % 60;
  if (hours) return `${hours}:${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  return `${minutes}:${String(remaining).padStart(2, '0')}`;
}

function formatSigned(value, suffix = '') {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number === 0) return `0${suffix}`;
  return `${number > 0 ? '+' : ''}${number}${suffix}`;
}

function getTrackDetail(track = {}) {
  return [
    track.codec,
    track.width ? `${track.width}x${track.height}` : '',
    track.frameRate ? `${Number(track.frameRate).toFixed(2)} fps` : '',
    track.rotation ? `${track.rotation} deg` : '',
    track.sampleRate ? `${track.sampleRate} Hz` : '',
    track.channels ? `${track.channels} ch` : '',
    track.language
  ].filter(Boolean).join(' - ');
}

function readNumber(node) {
  const number = Number(node?.value || 0);
  return Number.isFinite(number) ? number : 0;
}

function safeObjectUrl(file) {
  if (!file || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return '';
  try {
    return URL.createObjectURL(file);
  } catch {
    return '';
  }
}

function revokePreviewUrl() {
  if (!activePreviewUrl || typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') {
    activePreviewUrl = '';
    return;
  }
  URL.revokeObjectURL(activePreviewUrl);
  activePreviewUrl = '';
}

function revokeOutputUrl() {
  if (!activeOutputUrl || typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') {
    activeOutputUrl = '';
    return;
  }
  URL.revokeObjectURL(activeOutputUrl);
  activeOutputUrl = '';
}

function setElementValue(root, id, next) {
  const node = root.querySelector(`#${id}`);
  if (node) node.value = String(next);
}

function setElementChecked(root, id, next) {
  const node = root.querySelector(`#${id}`);
  if (node) node.checked = Boolean(next);
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function renderWebMediaToggle(id, label, checked = false) {
  return renderToggleSwitch({ id, label, checked, className: 'webmedia-toggle' });
}

function formatDiagnosticLabel(value = '') {
  return String(value || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function isEmptyDiagnosticValue(value) {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

function flattenDiagnosticValue(value, prefix = '') {
  if (isEmptyDiagnosticValue(value)) return [];
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => flattenDiagnosticValue(entry, `${prefix}${prefix ? ' ' : ''}${index + 1}`));
  }
  if (typeof value === 'object') {
    return Object.entries(value).flatMap(([key, entry]) => (
      flattenDiagnosticValue(entry, `${prefix}${prefix ? ' ' : ''}${formatDiagnosticLabel(key)}`)
    ));
  }
  return [[prefix || 'Value', value]];
}

export async function mount(parent) {
  service = createWebMediaService();
  container = document.createElement('div');
  container.className = 'tool-webmedia-studio';
  container.innerHTML = `
    <div class="webmedia-shell is-empty">
      <section id="webmedia-dropzone" class="webmedia-source-bar webmedia-dropzone">
        <div class="webmedia-source-actions">
          <strong>Source</strong>
          <button id="webmedia-import">Import</button>
          <input id="webmedia-file-input" class="hidden" type="file" accept="video/*,audio/*,.mkv,.mov,.m4a,.mka,.wav,.mp3,.ogg,.flac,.aac,.m3u8,.ts" multiple>
          <input id="webmedia-subtitle-file-input" class="hidden" type="file" accept=".srt,.vtt,text/vtt,text/plain">
        </div>
        <div class="webmedia-source-dropcopy">
          <strong>Drop media anywhere</strong>
          <span>Inspect, trim, plan, and run verified browser-native export paths.</span>
        </div>
        <div id="webmedia-file-queue" class="webmedia-file-queue"></div>
        <div id="webmedia-source-metrics" class="webmedia-meter-grid"></div>
        <details id="webmedia-capabilities-panel" class="webmedia-capabilities-panel">
          <summary>Runtime</summary>
          <div id="webmedia-capabilities" class="webmedia-capability-list"></div>
        </details>
      </section>

      <main class="webmedia-stage">
        <div class="webmedia-preview">
          <video id="webmedia-preview-media" class="webmedia-preview-media" controls playsinline></video>
          <div id="webmedia-preview-copy" class="webmedia-preview-copy">
            <strong>No file selected</strong>
            <span>Import a media file to inspect its local track plan.</span>
          </div>
        </div>
        <div class="webmedia-scrubber">
          <span id="webmedia-current-time">0:00</span>
          <input id="webmedia-scrub" type="range" min="0" max="100" value="0">
          <span id="webmedia-duration">0:00</span>
        </div>
        <div id="webmedia-trimmer-host" class="webmedia-trimmer-host media-trimmer"></div>
        <div class="webmedia-inspect-grid">
          <div id="webmedia-track-stack" class="webmedia-track-stack"></div>
          <div id="webmedia-inspect-report" class="webmedia-inspect-report"></div>
        </div>
      </main>

      <aside class="webmedia-control-rail">
        <div class="webmedia-section-head">
          <strong>Plan</strong>
          <span id="webmedia-mode">Inspect</span>
        </div>
        <div class="webmedia-operation-tabs">
          <button data-webmedia-operation="inspect" class="active">Inspect</button>
          <button data-webmedia-operation="remux">Remux</button>
          <button data-webmedia-operation="transcode">Transcode</button>
          <button data-webmedia-operation="trim">Trim</button>
          <button data-webmedia-operation="transform">Transform</button>
          <button data-webmedia-operation="audio">Audio</button>
          <button data-webmedia-operation="subtitles">Subtitles</button>
          <button data-webmedia-operation="hls">HLS</button>
        </div>
        <div class="webmedia-adjustment-section webmedia-common-controls">
          <label class="studio-field">
            <span>Container</span>
            <select id="webmedia-target-container" class="studio-select">
              ${Object.entries(WEBMEDIA_CONTAINERS).map(([id, meta]) => `<option value="${id}">${meta.label}</option>`).join('')}
            </select>
          </label>
          <label class="studio-field">
            <span>Tracks</span>
            <select id="webmedia-track-scope" class="studio-select">
              <option value="all">All tracks</option>
              <option value="primary">Primary audio and video</option>
            </select>
          </label>
          ${renderWebMediaToggle('webmedia-remux-only', 'Remux only', true)}
        </div>
        <div class="webmedia-settings">
          <section class="webmedia-mode-panel active" data-webmedia-settings="inspect">
            <div class="webmedia-panel-title">Inspect</div>
            <div class="webmedia-adjustment-section">
              <input id="webmedia-inspect-depth" type="hidden" value="summary">
              <div class="webmedia-inspect-filter">
                <button type="button" data-webmedia-inspect-depth="summary" class="active">Summary</button>
                <button type="button" data-webmedia-inspect-depth="metadata">Metadata</button>
                <button type="button" data-webmedia-inspect-depth="packets">Packets</button>
                <button type="button" data-webmedia-inspect-depth="compatibility">Compatibility</button>
              </div>
              <label class="studio-field">
                <span>Packet Limit</span>
                <input id="webmedia-inspect-packet-limit" type="number" min="0" max="2000" step="25" value="250">
              </label>
              ${renderWebMediaToggle('webmedia-inspect-tags', 'Include tags', true)}
              ${renderWebMediaToggle('webmedia-inspect-packets', 'Packet stats')}
              ${renderWebMediaToggle('webmedia-inspect-compatibility', 'Compatibility', true)}
            </div>
          </section>

          <section class="webmedia-mode-panel" data-webmedia-settings="remux">
            <div class="webmedia-panel-title">Remux</div>
            <div class="webmedia-adjustment-section">
              <label class="studio-field">
                <span>Track Policy</span>
                <select id="webmedia-remux-track-policy" class="studio-select">
                  <option value="keep-all">Keep compatible tracks</option>
                  <option value="drop-incompatible">Drop incompatible</option>
                </select>
              </label>
              <label class="studio-field">
                <span>Timestamps</span>
                <select id="webmedia-remux-timestamp-policy" class="studio-select">
                  <option value="preserve">Preserve</option>
                  <option value="rebase">Rebase start</option>
                  <option value="zero">Zero start</option>
                </select>
              </label>
              <label class="studio-field">
                <span>Rotation</span>
                <select id="webmedia-remux-rotation-policy" class="studio-select">
                  <option value="preserve">Preserve</option>
                  <option value="matrix">Write matrix</option>
                  <option value="bake">Bake if possible</option>
                </select>
              </label>
              <label class="studio-field">
                <span>Interleave ms</span>
                <input id="webmedia-remux-interleave" type="number" min="0" max="10000" step="50" value="0">
              </label>
              <label class="studio-field">
                <span>Chapters</span>
                <select id="webmedia-remux-chapters" class="studio-select">
                  <option value="keep">Keep</option>
                  <option value="drop">Drop</option>
                </select>
              </label>
              <label class="studio-field">
                <span>Attachments</span>
                <select id="webmedia-remux-attachments" class="studio-select">
                  <option value="drop">Drop</option>
                  <option value="keep-compatible">Keep compatible</option>
                </select>
              </label>
              <label class="studio-field">
                <span>Metadata</span>
                <select id="webmedia-remux-metadata-policy" class="studio-select">
                  <option value="keep">Keep</option>
                  <option value="replace">Replace</option>
                  <option value="strip">Strip</option>
                </select>
              </label>
              ${renderWebMediaToggle('webmedia-remux-faststart', 'Fast start MP4', true)}
            </div>
          </section>

          <section class="webmedia-mode-panel" data-webmedia-settings="transcode">
            <div class="webmedia-panel-title">Transcode</div>
            <div class="webmedia-adjustment-section">
              <label class="studio-field">
                <span>Preset</span>
                <select id="webmedia-transcode-preset" class="studio-select">
                  <option value="web-mp4">Web MP4</option>
                  <option value="webm">WebM VP9</option>
                  <option value="social">Square 1080</option>
                  <option value="audio-video">Balanced</option>
                  <option value="audio-only">Audio only</option>
                  <option value="lossless-audio">Lossless audio</option>
                  <option value="hls-package">HLS package</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              <label class="studio-field">
                <span>Speed</span>
                <select id="webmedia-transcode-speed-preset" class="studio-select">
                  <option value="draft">Draft</option>
                  <option value="preview">Preview</option>
                  <option value="fast">Fast</option>
                  <option value="medium" selected>Medium</option>
                  <option value="quality">Quality</option>
                  <option value="slow">Slow</option>
                  <option value="veryslow">Very slow</option>
                </select>
              </label>
              <label class="studio-field">
                <span>Rate Control</span>
                <select id="webmedia-transcode-rate-control" class="studio-select">
                  <option value="bitrate">Bitrate</option>
                  <option value="quality">Quality</option>
                  <option value="lossless">Lossless</option>
                </select>
              </label>
              <label class="studio-field">
                <span>Quality</span>
                <input id="webmedia-transcode-quality" type="number" min="0" max="100" step="1" value="23">
              </label>
              <label class="studio-field">
                <span>Tune</span>
                <select id="webmedia-transcode-tune" class="studio-select">
                  <option value="none">None</option>
                  <option value="film">Film</option>
                  <option value="animation">Animation</option>
                  <option value="screen">Screen</option>
                  <option value="grain">Grain</option>
                </select>
              </label>
            </div>
            <div class="webmedia-adjustment-section">
              <div class="webmedia-subhead">Video</div>
              <div class="webmedia-field-grid">
                <label class="studio-field">
                  <span>Video Codec</span>
                  <select id="webmedia-video-codec" class="studio-select">
                    <option value="avc">H.264 AVC</option>
                    <option value="hevc">HEVC</option>
                    <option value="vp9">VP9</option>
                    <option value="av1">AV1</option>
                    <option value="vp8">VP8</option>
                    <option value="copy">Copy</option>
                  </select>
                </label>
                <label class="studio-field"><span>Video kbps</span><input id="webmedia-transcode-video-bitrate" type="number" min="0" step="100" value="4500"></label>
                <label class="studio-field"><span>Max kbps</span><input id="webmedia-transcode-max-video-bitrate" type="number" min="0" step="100" value="0"></label>
                <label class="studio-field"><span>Buffer kbps</span><input id="webmedia-transcode-buffer-size" type="number" min="0" step="100" value="0"></label>
                <label class="studio-field"><span>Width</span><input id="webmedia-transcode-width" type="number" min="0" step="2" value="1920"></label>
                <label class="studio-field"><span>Height</span><input id="webmedia-transcode-height" type="number" min="0" step="2" value="1080"></label>
                <label class="studio-field">
                  <span>Fit</span>
                  <select id="webmedia-transcode-fit" class="studio-select">
                    <option value="contain">Contain</option>
                    <option value="cover">Cover</option>
                    <option value="fill">Fill</option>
                  </select>
                </label>
                <label class="studio-field"><span>Frame Rate</span><input id="webmedia-transcode-frame-rate" type="number" min="0" step="1" value="30"></label>
                <label class="studio-field"><span>Keyframe Sec</span><input id="webmedia-transcode-keyframe" type="number" min="0" step="0.5" value="2"></label>
                <label class="studio-field">
                  <span>Hardware</span>
                  <select id="webmedia-transcode-hardware" class="studio-select">
                    <option value="no-preference">Auto</option>
                    <option value="prefer-hardware">Hardware</option>
                    <option value="prefer-software">Software</option>
                  </select>
                </label>
                <label class="studio-field">
                  <span>Alpha</span>
                  <select id="webmedia-transcode-alpha" class="studio-select">
                    <option value="discard">Discard</option>
                    <option value="keep">Keep</option>
                  </select>
                </label>
                <label class="studio-field">
                  <span>Latency</span>
                  <select id="webmedia-transcode-latency" class="studio-select">
                    <option value="auto">Auto</option>
                    <option value="quality">Quality</option>
                    <option value="realtime">Realtime</option>
                  </select>
                </label>
                <label class="studio-field"><span>Bit Depth</span><input id="webmedia-transcode-bit-depth" type="number" min="0" max="16" step="2" value="0"></label>
                <label class="studio-field"><span>Color Space</span><input id="webmedia-transcode-color-space" type="text" value="auto"></label>
              </div>
              <div class="webmedia-inline-row">
                ${renderWebMediaToggle('webmedia-transcode-prevent-upscale', 'No upscale')}
                ${renderWebMediaToggle('webmedia-transcode-drop-video', 'Drop video')}
              </div>
            </div>
            <div class="webmedia-adjustment-section">
              <div class="webmedia-subhead">Audio</div>
              <div class="webmedia-field-grid">
                <label class="studio-field">
                  <span>Audio Codec</span>
                  <select id="webmedia-audio-codec" class="studio-select">
                    <option value="aac">AAC</option>
                    <option value="opus">Opus</option>
                    <option value="mp3">MP3</option>
                    <option value="vorbis">Vorbis</option>
                    <option value="flac">FLAC</option>
                    <option value="copy">Copy</option>
                  </select>
                </label>
                <label class="studio-field"><span>Audio kbps</span><input id="webmedia-transcode-audio-bitrate" type="number" min="0" step="16" value="160"></label>
                <label class="studio-field"><span>Sample Rate</span><input id="webmedia-transcode-sample-rate" type="number" min="0" step="1000" value="48000"></label>
                <label class="studio-field"><span>Channels</span><input id="webmedia-transcode-channels" type="number" min="0" max="8" step="1" value="2"></label>
                <label class="studio-field">
                  <span>Sample Format</span>
                  <select id="webmedia-transcode-sample-format" class="studio-select">
                    <option value="">Auto</option>
                    <option value="u8">u8</option>
                    <option value="s16">s16</option>
                    <option value="s32">s32</option>
                    <option value="f32">f32</option>
                  </select>
                </label>
              </div>
              ${renderWebMediaToggle('webmedia-transcode-drop-audio', 'Drop audio')}
            </div>
          </section>

          <section class="webmedia-mode-panel" data-webmedia-settings="trim">
            <div class="webmedia-panel-title">Trim</div>
            <div class="webmedia-adjustment-section">
              <div class="webmedia-field-grid">
                <label class="studio-field"><span>Start sec</span><input id="webmedia-trim-start" type="number" min="0" step="0.01" value="0"></label>
                <label class="studio-field"><span>End sec</span><input id="webmedia-trim-end" type="number" min="0" step="0.01" value="0"></label>
                <label class="studio-field"><span>Duration</span><input id="webmedia-trim-duration" type="number" min="0" step="0.01" value="0"></label>
                <label class="studio-field">
                  <span>Mode</span>
                  <select id="webmedia-trim-mode" class="studio-select">
                    <option value="packet">Packet trim</option>
                    <option value="accurate">Accurate reencode</option>
                  </select>
                </label>
                <label class="studio-field">
                  <span>Snap</span>
                  <select id="webmedia-trim-snap-policy" class="studio-select">
                    <option value="keyframe">Keyframe</option>
                    <option value="frame">Frame</option>
                    <option value="sample">Sample</option>
                    <option value="none">None</option>
                  </select>
                </label>
                <label class="studio-field"><span>Preroll</span><input id="webmedia-trim-preroll" type="number" min="0" step="0.01" value="0"></label>
                <label class="studio-field"><span>Postroll</span><input id="webmedia-trim-postroll" type="number" min="0" step="0.01" value="0"></label>
                <label class="studio-field"><span>Fade In</span><input id="webmedia-trim-fade-in" type="number" min="0" step="0.01" value="0"></label>
                <label class="studio-field"><span>Fade Out</span><input id="webmedia-trim-fade-out" type="number" min="0" step="0.01" value="0"></label>
              </div>
              ${renderWebMediaToggle('webmedia-trim-preserve-timestamps', 'Preserve timestamps')}
            </div>
          </section>

          <section class="webmedia-mode-panel" data-webmedia-settings="transform">
            <div class="webmedia-panel-title">Transform</div>
            <div class="webmedia-adjustment-section">
              <div class="webmedia-subhead">Geometry</div>
              <div class="webmedia-field-grid">
                <label class="studio-field"><span>Width</span><input id="webmedia-transform-width" type="number" min="0" step="2" value="0"></label>
                <label class="studio-field"><span>Height</span><input id="webmedia-transform-height" type="number" min="0" step="2" value="0"></label>
                <label class="studio-field">
                  <span>Fit</span>
                  <select id="webmedia-transform-fit" class="studio-select">
                    <option value="contain">Contain</option>
                    <option value="cover">Cover</option>
                    <option value="fill">Fill</option>
                  </select>
                </label>
                <label class="studio-field">
                  <span>Rotate</span>
                  <select id="webmedia-transform-rotate" class="studio-select">
                    <option value="0">0</option>
                    <option value="90">90</option>
                    <option value="180">180</option>
                    <option value="270">270</option>
                  </select>
                </label>
                <label class="studio-field"><span>Frame Rate</span><input id="webmedia-transform-frame-rate" type="number" min="0" step="1" value="0"></label>
                <label class="studio-field"><span>Scale</span><input id="webmedia-transform-scale" type="number" min="0" step="0.01" value="1"></label>
                <label class="studio-field"><span>X</span><input id="webmedia-transform-x" type="number" step="1" value="0"></label>
                <label class="studio-field"><span>Y</span><input id="webmedia-transform-y" type="number" step="1" value="0"></label>
                <label class="studio-field"><span>Background</span><input id="webmedia-transform-background" type="text" value="#000000"></label>
                <label class="studio-field"><span>Anchor</span><input id="webmedia-transform-anchor" type="text" value="center"></label>
              </div>
              <div class="webmedia-inline-row">
                ${renderWebMediaToggle('webmedia-transform-rotation-metadata', 'Rotation metadata', true)}
                ${renderWebMediaToggle('webmedia-transform-flip-horizontal', 'Flip horizontal')}
                ${renderWebMediaToggle('webmedia-transform-flip-vertical', 'Flip vertical')}
              </div>
            </div>
            <div class="webmedia-adjustment-section">
              <div class="webmedia-subhead">Crop</div>
              <div class="webmedia-field-grid">
                <label class="studio-field"><span>Crop X</span><input id="webmedia-transform-crop-x" type="number" min="0" step="1" value="0"></label>
                <label class="studio-field"><span>Crop Y</span><input id="webmedia-transform-crop-y" type="number" min="0" step="1" value="0"></label>
                <label class="studio-field"><span>Crop W</span><input id="webmedia-transform-crop-width" type="number" min="0" step="1" value="0"></label>
                <label class="studio-field"><span>Crop H</span><input id="webmedia-transform-crop-height" type="number" min="0" step="1" value="0"></label>
              </div>
            </div>
            <div class="webmedia-adjustment-section">
              <div class="webmedia-subhead">Color and Effects</div>
              <div class="webmedia-field-grid">
                <label class="studio-field"><span>Exposure</span><input id="webmedia-transform-exposure" type="number" step="0.05" value="0"></label>
                <label class="studio-field"><span>Contrast</span><input id="webmedia-transform-contrast" type="number" step="1" value="0"></label>
                <label class="studio-field"><span>Saturation</span><input id="webmedia-transform-saturation" type="number" step="1" value="0"></label>
                <label class="studio-field"><span>Temperature</span><input id="webmedia-transform-temperature" type="number" step="1" value="0"></label>
                <label class="studio-field"><span>Tint</span><input id="webmedia-transform-tint" type="number" step="1" value="0"></label>
                <label class="studio-field"><span>Gamma</span><input id="webmedia-transform-gamma" type="number" step="0.05" value="0"></label>
                <label class="studio-field"><span>Sharpen</span><input id="webmedia-transform-sharpen" type="number" min="0" step="1" value="0"></label>
                <label class="studio-field"><span>Denoise</span><input id="webmedia-transform-denoise" type="number" min="0" step="1" value="0"></label>
                <label class="studio-field"><span>Grain</span><input id="webmedia-transform-grain" type="number" min="0" step="1" value="0"></label>
                <label class="studio-field"><span>Blur</span><input id="webmedia-transform-blur" type="number" min="0" step="1" value="0"></label>
              </div>
            </div>
          </section>

          <section class="webmedia-mode-panel" data-webmedia-settings="audio">
            <div class="webmedia-panel-title">Audio</div>
            <div class="webmedia-adjustment-section">
              <div class="webmedia-field-grid">
                <label class="studio-field">
                  <span>Mode</span>
                  <select id="webmedia-audio-mode" class="studio-select">
                    <option value="convert">Convert audio</option>
                    <option value="copy">Copy audio</option>
                    <option value="drop">Drop audio</option>
                  </select>
                </label>
                <label class="studio-field">
                  <span>Codec</span>
                  <select id="webmedia-audio-output-codec" class="studio-select">
                    <option value="mp3">MP3</option>
                    <option value="aac">AAC</option>
                    <option value="opus">Opus</option>
                    <option value="vorbis">Vorbis</option>
                    <option value="flac">FLAC</option>
                    <option value="copy">Copy</option>
                  </select>
                </label>
                <label class="studio-field"><span>Bitrate kbps</span><input id="webmedia-audio-bitrate" type="number" min="0" step="16" value="192"></label>
                <label class="studio-field"><span>Sample Rate</span><input id="webmedia-audio-sample-rate" type="number" min="0" step="1000" value="44100"></label>
                <label class="studio-field"><span>Channels</span><input id="webmedia-audio-channels" type="number" min="0" max="8" step="1" value="2"></label>
                <label class="studio-field">
                  <span>Sample Format</span>
                  <select id="webmedia-audio-sample-format" class="studio-select">
                    <option value="">Auto</option>
                    <option value="u8">u8</option>
                    <option value="s16">s16</option>
                    <option value="s32">s32</option>
                    <option value="f32">f32</option>
                  </select>
                </label>
              </div>
              ${renderWebMediaToggle('webmedia-audio-discard-video', 'Export audio only', true)}
            </div>
            <div class="webmedia-adjustment-section">
              <div class="webmedia-subhead">Processing</div>
              <div class="webmedia-field-grid">
                <label class="studio-field"><span>Gain dB</span><input id="webmedia-audio-gain" type="number" step="0.1" value="0"></label>
                <label class="studio-field"><span>Target LUFS</span><input id="webmedia-audio-normalize-target" type="number" step="0.5" value="-14"></label>
                <label class="studio-field"><span>Fade In</span><input id="webmedia-audio-fade-in" type="number" min="0" step="0.01" value="0"></label>
                <label class="studio-field"><span>Fade Out</span><input id="webmedia-audio-fade-out" type="number" min="0" step="0.01" value="0"></label>
                <label class="studio-field"><span>Pan</span><input id="webmedia-audio-pan" type="number" min="-1" max="1" step="0.05" value="0"></label>
                <label class="studio-field"><span>Highpass Hz</span><input id="webmedia-audio-highpass" type="number" min="0" step="10" value="0"></label>
                <label class="studio-field"><span>Lowpass Hz</span><input id="webmedia-audio-lowpass" type="number" min="0" step="10" value="0"></label>
                <label class="studio-field"><span>Comp Threshold</span><input id="webmedia-audio-compressor-threshold" type="number" step="1" value="0"></label>
                <label class="studio-field"><span>Comp Ratio</span><input id="webmedia-audio-compressor-ratio" type="number" min="0" step="0.1" value="0"></label>
              </div>
              <div class="webmedia-inline-row">
                ${renderWebMediaToggle('webmedia-audio-normalize', 'Normalize')}
                ${renderWebMediaToggle('webmedia-audio-limiter', 'Limiter')}
              </div>
            </div>
          </section>

          <section class="webmedia-mode-panel" data-webmedia-settings="subtitles">
            <div class="webmedia-panel-title">Subtitles</div>
            <div class="webmedia-adjustment-section">
              <div class="webmedia-field-grid">
                <label class="studio-field">
                  <span>Embedded</span>
                  <select id="webmedia-subtitle-mode" class="studio-select">
                    <option value="copy">Copy compatible</option>
                    <option value="drop">Drop subtitles</option>
                  </select>
                </label>
                <label class="studio-field">
                  <span>Text Format</span>
                  <select id="webmedia-subtitle-source-format" class="studio-select">
                    <option value="auto">Auto</option>
                    <option value="vtt">WebVTT</option>
                    <option value="srt">SRT</option>
                  </select>
                </label>
                <label class="studio-field"><span>Language</span><input id="webmedia-subtitle-language" type="text" placeholder="eng"></label>
                <label class="studio-field"><span>Offset sec</span><input id="webmedia-subtitle-offset" type="number" step="0.01" value="0"></label>
                <label class="studio-field"><span>Font Size</span><input id="webmedia-subtitle-font-size" type="number" min="0" max="160" step="1" value="0"></label>
                <label class="studio-field">
                  <span>Position</span>
                  <select id="webmedia-subtitle-position" class="studio-select">
                    <option value="bottom">Bottom</option>
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                  </select>
                </label>
                <label class="studio-field"><span>Outline</span><input id="webmedia-subtitle-outline" type="number" min="0" step="0.5" value="0"></label>
              </div>
              <div class="webmedia-inline-row">
                ${renderWebMediaToggle('webmedia-subtitle-import', 'Import text')}
                ${renderWebMediaToggle('webmedia-subtitle-burn', 'Burn in')}
                ${renderWebMediaToggle('webmedia-subtitle-background', 'Text background')}
              </div>
            </div>
          </section>

          <section class="webmedia-mode-panel" data-webmedia-settings="hls">
            <div class="webmedia-panel-title">HLS</div>
            <div class="webmedia-adjustment-section">
              <div class="webmedia-field-grid">
                <label class="studio-field"><span>Segment sec</span><input id="webmedia-hls-segment-duration" type="number" min="1" max="30" step="1" value="6"></label>
                <label class="studio-field">
                  <span>Playlist</span>
                  <select id="webmedia-hls-playlist-type" class="studio-select">
                    <option value="vod">VOD</option>
                    <option value="event">Event</option>
                    <option value="live">Live</option>
                  </select>
                </label>
                <label class="studio-field"><span>Variant Ladder</span><input id="webmedia-hls-variant-ladder" type="text" value="1080p,720p,360p"></label>
              </div>
              <div class="webmedia-inline-row">
                ${renderWebMediaToggle('webmedia-hls-independent', 'Independent segments', true)}
                ${renderWebMediaToggle('webmedia-hls-iframe', 'I-frame playlist')}
                ${renderWebMediaToggle('webmedia-hls-audio-renditions', 'Audio renditions')}
                ${renderWebMediaToggle('webmedia-hls-caption-rendition', 'Caption rendition')}
              </div>
            </div>
          </section>

          <section class="webmedia-mode-panel webmedia-common-panel">
            <div class="webmedia-panel-title">Metadata</div>
            <div class="webmedia-field-grid">
              <label class="studio-field"><span>Title</span><input id="webmedia-meta-title" type="text"></label>
              <label class="studio-field"><span>Artist</span><input id="webmedia-meta-artist" type="text"></label>
              <label class="studio-field"><span>Album</span><input id="webmedia-meta-album" type="text"></label>
              <label class="studio-field"><span>Genre</span><input id="webmedia-meta-genre" type="text"></label>
              <label class="studio-field"><span>Date</span><input id="webmedia-meta-date" type="text"></label>
              <label class="studio-field"><span>Copyright</span><input id="webmedia-meta-copyright" type="text"></label>
              <label class="studio-field"><span>Comment</span><input id="webmedia-meta-comment" type="text"></label>
              <label class="studio-field"><span>Description</span><input id="webmedia-meta-description" type="text"></label>
            </div>
          </section>
        </div>
        <div id="webmedia-plan-summary" class="webmedia-plan-summary"></div>
        <div id="webmedia-progress-host" class="webmedia-progress-host"></div>
        <div id="webmedia-output-preview" class="webmedia-output-preview hidden">
          <div class="webmedia-section-head">
            <strong>Output</strong>
            <button type="button" id="webmedia-output-download" class="mini-btn">Download</button>
          </div>
          <video id="webmedia-output-video" class="webmedia-output-media hidden" controls playsinline></video>
          <audio id="webmedia-output-audio" class="webmedia-output-media hidden" controls></audio>
          <div id="webmedia-output-meta" class="webmedia-output-meta"></div>
        </div>
        <div class="webmedia-export-actions">
          <button id="webmedia-export" class="btn-primary">Export Inspect JSON</button>
        </div>
      </aside>

      <section class="webmedia-bottom-drawer">
        <div class="webmedia-section-head">
          <strong>Diagnostics</strong>
          <span id="webmedia-status">Ready.</span>
        </div>
        <div id="webmedia-diagnostics" class="webmedia-diagnostics"></div>
      </section>
      <div id="webmedia-diagnostic-modal" class="webmedia-diagnostic-modal hidden">
        <div class="webmedia-diagnostic-modal-card">
          <div class="webmedia-section-head">
            <strong id="webmedia-diagnostic-modal-title">Diagnostic</strong>
            <button type="button" id="webmedia-diagnostic-modal-close" class="mini-btn danger">Close</button>
          </div>
          <div id="webmedia-diagnostic-modal-body" class="webmedia-diagnostic-modal-body"></div>
        </div>
      </div>
    </div>
  `;
  parent.appendChild(container);

  const refs = {
    shell: container.querySelector('.webmedia-shell'),
    fileInput: container.querySelector('#webmedia-file-input'),
    importButton: container.querySelector('#webmedia-import'),
    dropzone: container.querySelector('#webmedia-dropzone'),
    fileQueue: container.querySelector('#webmedia-file-queue'),
    capabilities: container.querySelector('#webmedia-capabilities'),
    previewCopy: container.querySelector('#webmedia-preview-copy'),
    previewMedia: container.querySelector('#webmedia-preview-media'),
    trackStack: container.querySelector('#webmedia-track-stack'),
    inspectReport: container.querySelector('#webmedia-inspect-report'),
    metrics: container.querySelector('#webmedia-source-metrics'),
    targetContainer: container.querySelector('#webmedia-target-container'),
    trackScope: container.querySelector('#webmedia-track-scope'),
    videoCodec: container.querySelector('#webmedia-video-codec'),
    audioCodec: container.querySelector('#webmedia-audio-codec'),
    remuxOnly: container.querySelector('#webmedia-remux-only'),
    planSummary: container.querySelector('#webmedia-plan-summary'),
    mode: container.querySelector('#webmedia-mode'),
    status: container.querySelector('#webmedia-status'),
    diagnostics: container.querySelector('#webmedia-diagnostics'),
    exportButton: container.querySelector('#webmedia-export'),
    scrub: container.querySelector('#webmedia-scrub'),
    currentTime: container.querySelector('#webmedia-current-time'),
    duration: container.querySelector('#webmedia-duration'),
    trimmerHost: container.querySelector('#webmedia-trimmer-host'),
    diagnosticModal: container.querySelector('#webmedia-diagnostic-modal'),
    diagnosticModalTitle: container.querySelector('#webmedia-diagnostic-modal-title'),
    diagnosticModalBody: container.querySelector('#webmedia-diagnostic-modal-body'),
    diagnosticModalClose: container.querySelector('#webmedia-diagnostic-modal-close'),
    outputPreview: container.querySelector('#webmedia-output-preview'),
    outputDownload: container.querySelector('#webmedia-output-download'),
    outputVideo: container.querySelector('#webmedia-output-video'),
    outputAudio: container.querySelector('#webmedia-output-audio'),
    outputMeta: container.querySelector('#webmedia-output-meta')
  };

  const setStatus = (message, tone = 'neutral') => {
    refs.status.textContent = message;
    refs.status.dataset.tone = tone;
  };

  progressController = createJobProgress(container.querySelector('#webmedia-progress-host'), {
    stopLabel: 'Cancel',
    onStop() {
      if (!activeRun) {
        showToast('No active export.', 'info');
        return;
      }
      if (!activeRun.controller) {
        setStatus('Cancel unavailable in this browser.', 'danger');
        return;
      }
      activeRun.controller.abort();
      progressController?.update({ title: 'Canceling export', detail: activeRun.mode, busy: true, cancellable: false });
      setStatus('Cancel requested.', 'info');
      showToast('Cancel requested.', 'info');
    }
  });

  let diagnosticEntries = [];
  let lastLoopState = false;

  const syncWorkspaceState = () => {
    refs.shell.classList.toggle('is-empty', !activeFile);
  };

  const renderDiagnosticValue = (value) => {
    const rows = flattenDiagnosticValue(value);
    if (!rows.length) return '';
    return `<dl class="webmedia-diagnostic-kv">${rows.map(([label, entry]) => `
      <div><dt>${escapeHtml(formatDiagnosticLabel(label))}</dt><dd>${escapeHtml(entry)}</dd></div>
    `).join('')}</dl>`;
  };

  const renderDiagnosticDetail = (entry = {}) => {
    const valueMarkup = renderDiagnosticValue(entry.value ?? entry.detailValue);
    const message = entry.message || entry.detail || '';
    const route = entry.suggestedRoute
      ? `<a class="webmedia-diagnostic-route" href="${escapeHtml(entry.suggestedRoute)}">Open Video Studio</a>`
      : '';
    return `
      ${message ? `<p>${escapeHtml(message)}</p>` : ''}
      ${valueMarkup}
      ${route}
    `;
  };

  const openDiagnosticDetail = (index) => {
    const entry = diagnosticEntries[Number(index)];
    if (!entry) return;
    refs.diagnosticModalTitle.textContent = entry.code || entry.phase || 'Diagnostic';
    refs.diagnosticModalBody.innerHTML = renderDiagnosticDetail(entry);
    refs.diagnosticModal.classList.remove('hidden');
  };

  const closeDiagnosticDetail = () => {
    refs.diagnosticModal.classList.add('hidden');
  };

  const getDiagnosticMessage = (entry = {}) => entry.message || entry.detail || '';

  const getDiagnosticKey = (entry = {}) => [
    entry.tone || 'neutral',
    entry.code || entry.phase || 'info',
    getDiagnosticMessage(entry),
    entry.suggestedRoute || ''
  ].join('|');

  const renderDiagnostics = (entries = []) => {
    const visibleEntries = (Array.isArray(entries) ? entries : []).filter((entry) => {
      if (!entry) return false;
      const valueMarkup = renderDiagnosticValue(entry.value ?? entry.detailValue);
      return Boolean(valueMarkup || getDiagnosticMessage(entry) || entry.suggestedRoute);
    });
    diagnosticEntries = visibleEntries;
    const urgentIndex = diagnosticEntries.findIndex((entry) => ['danger'].includes(entry.tone));
    refs.shell.classList.toggle('has-urgent-diagnostics', urgentIndex >= 0);
    if (!diagnosticEntries.length) {
      refs.diagnostics.innerHTML = '';
      lastUrgentDiagnosticKey = '';
      return;
    }
    refs.diagnostics.innerHTML = diagnosticEntries.map((entry, index) => {
      const valueMarkup = renderDiagnosticValue(entry.value ?? entry.detailValue);
      const message = getDiagnosticMessage(entry);
      const hasDetail = valueMarkup || message || entry.suggestedRoute;
      return `
        <div class="webmedia-diagnostic" data-tone="${entry.tone || 'neutral'}">
          <div>
            <b>${escapeHtml(entry.code || entry.phase || 'info')}</b>
            ${message ? `<span>${escapeHtml(message)}</span>` : ''}
            ${valueMarkup}
          </div>
          ${hasDetail ? `<button type="button" class="mini-btn webmedia-diagnostic-detail" data-webmedia-diagnostic-index="${index}">Details</button>` : ''}
        </div>
      `;
    }).join('');
    if (urgentIndex < 0) {
      lastUrgentDiagnosticKey = '';
      return;
    }
    const urgentEntry = diagnosticEntries[urgentIndex];
    const urgentKey = getDiagnosticKey(urgentEntry);
    if (urgentKey === lastUrgentDiagnosticKey) return;
    lastUrgentDiagnosticKey = urgentKey;
    openDiagnosticDetail(urgentIndex);
  };

  const renderCapabilities = () => {
    const capabilitySummary = service.getCapabilities();
    const rows = [
      {
        id: 'main-decode',
        label: 'Main decode',
        state: capabilitySummary.main.VideoDecoder && capabilitySummary.main.AudioDecoder ? 'ready' : 'unavailable'
      },
      {
        id: 'main-encode',
        label: 'Main encode',
        state: capabilitySummary.main.VideoEncoder && capabilitySummary.main.AudioEncoder ? 'ready' : 'unavailable'
      },
      {
        id: 'worker',
        label: 'Worker WebCodecs',
        state: !capabilitySummary.workerKnown
          ? 'checking'
          : capabilitySummary.missingWorker.length === 0
            ? 'ready'
            : 'unavailable'
      }
    ];
    refs.capabilities.innerHTML = rows.map((row) => `
      <div class="webmedia-capability-row" data-webmedia-capability="${row.id}" data-state="${row.state}" data-ready="${row.state === 'ready' ? 'true' : 'false'}">
        <span>${row.label}</span>
        <b>${row.state === 'ready' ? 'Ready' : row.state === 'checking' ? 'Checking' : 'Unavailable'}</b>
      </div>
    `).join('');
  };

  const renderQueue = () => {
    refs.fileQueue.innerHTML = files.length
      ? files.map((file, index) => `
        <button class="webmedia-file-card ${file === activeFile ? 'active' : ''}" data-file-index="${index}">
          <strong>${escapeHtml(file.name || 'media')}</strong>
          <span>${escapeHtml(file.type || 'unknown')} - ${formatBytes(file.size)}</span>
        </button>
      `).join('')
      : '<div class="webmedia-empty">No media loaded.</div>';
  };

  const clearOutputPreview = () => {
    revokeOutputUrl();
    activeOutputBlob = null;
    activeOutputName = '';
    activeOutputMime = '';
    refs.outputPreview.classList.add('hidden');
    refs.outputVideo.classList.add('hidden');
    refs.outputAudio.classList.add('hidden');
    refs.outputVideo.removeAttribute('src');
    refs.outputAudio.removeAttribute('src');
    refs.outputMeta.innerHTML = '';
    refs.outputDownload.disabled = true;
  };

  const renderOutputPreview = (result = {}) => {
    clearOutputPreview();
    if (!result.blob) return;
    activeOutputBlob = result.blob;
    activeOutputName = result.filename || 'webmedia-output';
    activeOutputMime = result.mime || result.blob.type || '';
    activeOutputUrl = safeObjectUrl(result.blob);
    const isAudio = activeOutputMime.startsWith('audio/');
    const isVideo = activeOutputMime.startsWith('video/');
    if (activeOutputUrl && isAudio) {
      refs.outputAudio.setAttribute('src', activeOutputUrl);
      refs.outputAudio.classList.remove('hidden');
    }
    if (activeOutputUrl && isVideo) {
      refs.outputVideo.setAttribute('src', activeOutputUrl);
      refs.outputVideo.classList.remove('hidden');
    }
    refs.outputMeta.innerHTML = `
      <div><span>Name</span><strong>${escapeHtml(activeOutputName)}</strong></div>
      <div><span>Type</span><strong>${escapeHtml(activeOutputMime || 'application/octet-stream')}</strong></div>
      <div><span>Size</span><strong>${formatBytes(result.summary?.bytes ?? result.blob.size)}</strong></div>
    `;
    refs.outputDownload.disabled = false;
    refs.outputPreview.classList.remove('hidden');
  };

  const renderMetrics = () => {
    if (!activeInspection) {
      refs.metrics.innerHTML = '';
      return;
    }
    const videoTracks = activeInspection.tracks.filter((track) => track.kind === 'video').length;
    const audioTracks = activeInspection.tracks.filter((track) => track.kind === 'audio').length;
    const subtitleTracks = activeInspection.tracks.filter((track) => track.kind === 'subtitle').length;
    refs.metrics.innerHTML = [
      ['Container', activeInspection.container || 'unknown'],
      ['Duration', formatDuration(activeInspection.duration)],
      ['Size', formatBytes(activeInspection.size)],
      ['Tracks', `${videoTracks} V / ${audioTracks} A / ${subtitleTracks} S`]
    ].map(([label, value]) => `<div><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`).join('');
  };

  const renderReportRows = (rows) => `
    <div class="webmedia-inspect-report-rows">
      ${rows
        .filter(([, entry]) => !isEmptyDiagnosticValue(entry))
        .map(([label, entry]) => `
          <div class="webmedia-inspect-report-row">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(entry)}</strong>
          </div>
        `).join('')}
    </div>
  `;

  const renderReportCard = (title, rows, body = '') => `
    <section class="webmedia-inspect-report-card">
      <div class="webmedia-inspect-report-title">${escapeHtml(title)}</div>
      ${rows?.length ? renderReportRows(rows) : ''}
      ${body}
    </section>
  `;

  const getTrackSummary = (tracks = []) => {
    const counts = tracks.reduce((output, track) => {
      output[track.kind] = (output[track.kind] || 0) + 1;
      return output;
    }, {});
    const parts = [
      counts.video ? `${counts.video} video` : '',
      counts.audio ? `${counts.audio} audio` : '',
      counts.subtitle ? `${counts.subtitle} subtitle` : ''
    ].filter(Boolean);
    return parts.length ? `${tracks.length} tracks (${parts.join(', ')})` : '0 tracks';
  };

  const renderMetadataReport = () => {
    const metadata = activeInspection.metadata || {};
    const tagRows = Object.entries(metadata.tags || {});
    const tags = tagRows.length
      ? `<div class="webmedia-inspect-tag-list">${tagRows.map(([key, entry]) => `
          <div><span>${escapeHtml(formatDiagnosticLabel(key))}</span><strong>${escapeHtml(entry)}</strong></div>
        `).join('')}</div>`
      : '<div class="webmedia-empty">No metadata tags were reported.</div>';
    return renderReportCard('Metadata', [
      ['Provider', metadata.provider || 'summary'],
      ['Depth', metadata.depth || 'summary'],
      ['Modified', activeInspection.modifiedAt ? new Date(activeInspection.modifiedAt).toLocaleString() : 'Unknown']
    ], tags);
  };

  const renderPacketReport = () => {
    const videoRates = activeInspection.tracks
      .filter((track) => track.kind === 'video' && track.frameRate)
      .map((track) => `${track.id}: ${Number(track.frameRate).toFixed(2)} fps`);
    return renderReportCard('Packets', [
      ['Depth', value('webmedia-inspect-depth')],
      ['Packet stats', checked('webmedia-inspect-packets') ? 'On' : 'Off'],
      ['Sample limit', `${number('webmedia-inspect-packet-limit')} samples`],
      ['Video packet rate', videoRates.join(', ') || 'Unknown'],
      ['Compatibility check', checked('webmedia-inspect-compatibility') ? 'On' : 'Off']
    ]);
  };

  const renderCompatibilityReport = () => {
    const targetId = refs.targetContainer.value;
    const target = WEBMEDIA_CONTAINERS[targetId] || WEBMEDIA_CONTAINERS.mp4;
    const rows = activeInspection.tracks.length
      ? activeInspection.tracks.map((track) => {
        const compatible = canContainerCarryTrack(targetId, track);
        return `
          <div class="webmedia-compat-row" data-state="${compatible ? 'ready' : 'blocked'}">
            <span>${escapeHtml(track.kind)}:${escapeHtml(track.codec || 'unknown')}</span>
            <strong>${compatible ? 'Compatible' : 'Blocked'}</strong>
            <b>${escapeHtml(getTrackDetail(track) || track.id)}</b>
          </div>
        `;
      }).join('')
      : '<div class="webmedia-empty">Track compatibility appears after media inspection.</div>';
    return renderReportCard('Compatibility', [
      ['Target', target.label],
      ['Container', targetId],
      ['Track policy', value('webmedia-track-scope')]
    ], `<div class="webmedia-compat-list">${rows}</div>`);
  };

  const renderSummaryReport = () => renderReportCard('Summary', [
    ['File', activeInspection.fileName],
    ['Container', activeInspection.container || 'unknown'],
    ['Mime', activeInspection.mime || 'unknown'],
    ['Duration', formatDuration(activeInspection.duration)],
    ['Size', formatBytes(activeInspection.size)],
    ['Tracks', getTrackSummary(activeInspection.tracks)]
  ]);

  const renderInspectReport = () => {
    if (!refs.inspectReport) return;
    if (!activeInspection) {
      refs.inspectReport.innerHTML = renderReportCard('Inspect', [
        ['Status', 'Import media to populate the report']
      ]);
      return;
    }
    const depth = value('webmedia-inspect-depth') || 'metadata';
    if (depth === 'summary') refs.inspectReport.innerHTML = renderSummaryReport();
    else if (depth === 'packets') refs.inspectReport.innerHTML = renderPacketReport();
    else if (depth === 'compatibility') refs.inspectReport.innerHTML = renderCompatibilityReport();
    else refs.inspectReport.innerHTML = renderMetadataReport();
  };

  const value = (id) => container.querySelector(`#${id}`)?.value || '';
  const checked = (id) => container.querySelector(`#${id}`)?.checked === true;
  const number = (id) => readNumber(container.querySelector(`#${id}`));

  const collectMetadata = () => Object.fromEntries(
    Object.entries({
      title: value('webmedia-meta-title'),
      artist: value('webmedia-meta-artist'),
      album: value('webmedia-meta-album'),
      genre: value('webmedia-meta-genre'),
      date: value('webmedia-meta-date'),
      copyright: value('webmedia-meta-copyright'),
      comment: value('webmedia-meta-comment'),
      description: value('webmedia-meta-description')
    }).filter(([, entry]) => entry)
  );

  const collectSettings = () => ({
    inspect: {
      depth: value('webmedia-inspect-depth'),
      packetSampleLimit: number('webmedia-inspect-packet-limit'),
      includeTags: checked('webmedia-inspect-tags'),
      includePackets: checked('webmedia-inspect-packets'),
      includeCompatibility: checked('webmedia-inspect-compatibility')
    },
    tracks: refs.trackScope.value,
    remux: {
      remuxOnly: refs.remuxOnly.checked,
      trackPolicy: value('webmedia-remux-track-policy'),
      timestampPolicy: value('webmedia-remux-timestamp-policy'),
      rotationPolicy: value('webmedia-remux-rotation-policy'),
      fastStart: checked('webmedia-remux-faststart'),
      interleaveMs: number('webmedia-remux-interleave'),
      chapterPolicy: value('webmedia-remux-chapters'),
      attachmentPolicy: value('webmedia-remux-attachments'),
      metadataPolicy: value('webmedia-remux-metadata-policy')
    },
    transcode: {
      preset: value('webmedia-transcode-preset'),
      speedPreset: value('webmedia-transcode-speed-preset'),
      videoCodec: refs.videoCodec.value,
      audioCodec: refs.audioCodec.value,
      rateControl: value('webmedia-transcode-rate-control'),
      quality: number('webmedia-transcode-quality'),
      videoBitrateKbps: number('webmedia-transcode-video-bitrate'),
      maxVideoBitrateKbps: number('webmedia-transcode-max-video-bitrate'),
      bufferSizeKbps: number('webmedia-transcode-buffer-size'),
      audioBitrateKbps: number('webmedia-transcode-audio-bitrate'),
      width: number('webmedia-transcode-width'),
      height: number('webmedia-transcode-height'),
      fit: value('webmedia-transcode-fit'),
      preventUpscale: checked('webmedia-transcode-prevent-upscale'),
      frameRate: number('webmedia-transcode-frame-rate'),
      keyFrameInterval: number('webmedia-transcode-keyframe'),
      hardwareAcceleration: value('webmedia-transcode-hardware'),
      alpha: value('webmedia-transcode-alpha'),
      latencyMode: value('webmedia-transcode-latency'),
      tune: value('webmedia-transcode-tune'),
      bitDepth: number('webmedia-transcode-bit-depth'),
      colorSpace: value('webmedia-transcode-color-space'),
      sampleRate: number('webmedia-transcode-sample-rate'),
      channels: number('webmedia-transcode-channels'),
      sampleFormat: value('webmedia-transcode-sample-format'),
      discardVideo: checked('webmedia-transcode-drop-video'),
      discardAudio: checked('webmedia-transcode-drop-audio')
    },
    trim: {
      start: number('webmedia-trim-start'),
      end: number('webmedia-trim-end'),
      duration: number('webmedia-trim-duration'),
      mode: value('webmedia-trim-mode'),
      snapPolicy: value('webmedia-trim-snap-policy'),
      preroll: number('webmedia-trim-preroll'),
      postroll: number('webmedia-trim-postroll'),
      preserveTimestamps: checked('webmedia-trim-preserve-timestamps'),
      fadeIn: number('webmedia-trim-fade-in'),
      fadeOut: number('webmedia-trim-fade-out')
    },
    transform: {
      width: number('webmedia-transform-width'),
      height: number('webmedia-transform-height'),
      fit: value('webmedia-transform-fit'),
      rotate: number('webmedia-transform-rotate'),
      allowRotationMetadata: checked('webmedia-transform-rotation-metadata'),
      crop: {
        x: number('webmedia-transform-crop-x'),
        y: number('webmedia-transform-crop-y'),
        width: number('webmedia-transform-crop-width'),
        height: number('webmedia-transform-crop-height')
      },
      frameRate: number('webmedia-transform-frame-rate'),
      anchor: value('webmedia-transform-anchor'),
      scale: number('webmedia-transform-scale'),
      x: number('webmedia-transform-x'),
      y: number('webmedia-transform-y'),
      flipHorizontal: checked('webmedia-transform-flip-horizontal'),
      flipVertical: checked('webmedia-transform-flip-vertical'),
      background: value('webmedia-transform-background'),
      color: {
        exposure: number('webmedia-transform-exposure'),
        contrast: number('webmedia-transform-contrast'),
        saturation: number('webmedia-transform-saturation'),
        temperature: number('webmedia-transform-temperature'),
        tint: number('webmedia-transform-tint'),
        gamma: number('webmedia-transform-gamma')
      },
      effects: {
        sharpen: number('webmedia-transform-sharpen'),
        denoise: number('webmedia-transform-denoise'),
        grain: number('webmedia-transform-grain'),
        blur: number('webmedia-transform-blur')
      }
    },
    audio: {
      mode: value('webmedia-audio-mode'),
      audioCodec: value('webmedia-audio-output-codec'),
      audioBitrateKbps: number('webmedia-audio-bitrate'),
      sampleRate: number('webmedia-audio-sample-rate'),
      channels: number('webmedia-audio-channels'),
      sampleFormat: value('webmedia-audio-sample-format'),
      discardVideo: checked('webmedia-audio-discard-video'),
      gainDb: number('webmedia-audio-gain'),
      normalize: checked('webmedia-audio-normalize'),
      normalizeTargetDb: number('webmedia-audio-normalize-target'),
      limiter: checked('webmedia-audio-limiter'),
      fadeIn: number('webmedia-audio-fade-in'),
      fadeOut: number('webmedia-audio-fade-out'),
      pan: number('webmedia-audio-pan'),
      highpassHz: number('webmedia-audio-highpass'),
      lowpassHz: number('webmedia-audio-lowpass'),
      compressorThreshold: number('webmedia-audio-compressor-threshold'),
      compressorRatio: number('webmedia-audio-compressor-ratio')
    },
    subtitles: {
      mode: value('webmedia-subtitle-mode'),
      importText: checked('webmedia-subtitle-import'),
      burnIn: checked('webmedia-subtitle-burn'),
      language: value('webmedia-subtitle-language'),
      sourceFormat: value('webmedia-subtitle-source-format'),
      offset: number('webmedia-subtitle-offset'),
      fontSize: number('webmedia-subtitle-font-size'),
      position: value('webmedia-subtitle-position'),
      outline: number('webmedia-subtitle-outline'),
      background: checked('webmedia-subtitle-background')
    },
    hls: {
      segmentDuration: number('webmedia-hls-segment-duration'),
      playlistType: value('webmedia-hls-playlist-type'),
      variantLadder: value('webmedia-hls-variant-ladder'),
      independentSegments: checked('webmedia-hls-independent'),
      iframePlaylist: checked('webmedia-hls-iframe'),
      audioRenditions: checked('webmedia-hls-audio-renditions'),
      captionRendition: checked('webmedia-hls-caption-rendition')
    },
    metadata: collectMetadata()
  });

  const getActiveDuration = () => Math.max(
    0,
    Number(activeInspection?.duration || refs.previewMedia.duration || 0)
  );

  const setTrimInputs = (start, end) => {
    const duration = getActiveDuration();
    const max = duration || Math.max(Number(start) || 0, Number(end) || 0, 0);
    const safeStart = clampNumber(start, 0, max);
    const fallbackEnd = Number(end) || duration || safeStart;
    const safeEnd = clampNumber(fallbackEnd, safeStart, max || safeStart);
    setElementValue(container, 'webmedia-trim-start', safeStart.toFixed(2));
    setElementValue(container, 'webmedia-trim-end', safeEnd.toFixed(2));
    setElementValue(container, 'webmedia-trim-duration', Math.max(0, safeEnd - safeStart).toFixed(2));
    return { start: safeStart, end: safeEnd };
  };

  const syncScrubFromTime = (time) => {
    const duration = getActiveDuration();
    const safeTime = clampNumber(time, 0, duration || Math.max(0, Number(time) || 0));
    refs.currentTime.textContent = formatDuration(safeTime);
    refs.duration.textContent = formatDuration(duration);
    refs.scrub.value = duration ? String(clampNumber((safeTime / duration) * 100, 0, 100)) : '0';
  };

  const playPreview = () => {
    const playResult = refs.previewMedia.play?.();
    if (playResult && typeof playResult.catch === 'function') playResult.catch(() => {});
  };

  const pausePreview = () => {
    refs.previewMedia.pause?.();
  };

  const seekPreview = (time, options = {}) => {
    const duration = getActiveDuration();
    const safeTime = clampNumber(time, 0, duration || Math.max(0, Number(time) || 0));
    try {
      refs.previewMedia.currentTime = safeTime;
    } catch {}
    syncScrubFromTime(safeTime);
    if (options.syncTrimmer !== false) trimmer?.setPlayhead(safeTime, options.reason || 'external');
    if (options.play) playPreview();
  };

  const syncTrimmerFromTrimInputs = (options = {}) => {
    if (!trimmer) return;
    const duration = Math.max(0.1, getActiveDuration() || 0.1);
    const start = number('webmedia-trim-start');
    const rawEnd = number('webmedia-trim-end');
    const rawDuration = number('webmedia-trim-duration');
    const end = options.fromDuration ? start + rawDuration : rawEnd || duration;
    const range = setTrimInputs(start, end);
    trimmer.setDuration(duration);
    trimmer.setRange(range.start, range.end || duration, false);
    trimmer.setFades(number('webmedia-trim-fade-in'), number('webmedia-trim-fade-out'), false);
  };

  const resetTrimmer = () => {
    trimmerVisualToken += 1;
    setTrimInputs(0, 0);
    syncScrubFromTime(0);
    trimmer?.setLoading({ visible: false });
    trimmer?.setWaveform(null);
    trimmer?.setSamples(null, 0);
    trimmer?.setFrameStrip([]);
    trimmer?.setDuration(0.1);
    trimmer?.setZoom(1, false);
    trimmer?.setRange(0, 0.1, false);
    trimmer?.clearPlayhead();
    trimmer?.setPlaying(false);
  };

  const syncTrimmerToInspection = () => {
    if (!trimmer) return;
    const duration = Math.max(0.1, getActiveDuration() || 0.1);
    const rawStart = number('webmedia-trim-start');
    const rawEnd = number('webmedia-trim-end') || duration;
    const range = setTrimInputs(rawStart, rawEnd);
    trimmer.setDuration(duration);
    trimmer.setZoom(1, false);
    trimmer.setRange(range.start, range.end || duration, false);
    trimmer.setFades(number('webmedia-trim-fade-in'), number('webmedia-trim-fade-out'), false);
    trimmer.setPlayhead(Number(refs.previewMedia.currentTime) || range.start, 'external');
    trimmer.setPlaying(refs.previewMedia.paused === false);
    syncScrubFromTime(Number(refs.previewMedia.currentTime) || 0);
  };

  const canHydrateTrimmerVisuals = () => (
    typeof HTMLMediaElement === 'function' &&
    typeof Worker === 'function' &&
    typeof Blob === 'function'
  );

  const hydrateTrimmerVisuals = async () => {
    if (!trimmer || !activeFile || !canHydrateTrimmerVisuals()) return;
    const token = ++trimmerVisualToken;
    trimmer.setWaveform(null);
    trimmer.setSamples(null, 0);
    trimmer.setFrameStrip([]);
    trimmer.setLoading({ visible: true, title: 'Preparing waveform', detail: 'Analyzing local media...', progress: 8 });
    try {
      const waveform = await analyzeWaveform({
        file: activeFile,
        fileName: activeFile.name || 'media',
        cacheKey: `${activeFile.name || 'media'}:${activeFile.size}:${activeFile.lastModified || 0}`,
        maxBins: 32768,
        includeSamples: true,
        maxSampleFrames: 2000000,
        onEvent(event) {
          if (!trimmer || token !== trimmerVisualToken) return;
          if (event.type === 'waveform-status') {
            trimmer.setLoading({
              visible: event.payload.phase !== 'complete',
              title: 'Preparing waveform',
              detail: event.payload.message,
              progress: event.payload.phase === 'complete' ? 100 : 72
            });
          }
        }
      });
      if (token !== trimmerVisualToken || !trimmer) return;
      if (waveform?.levels?.length) {
        trimmer.setWaveform(waveform);
        trimmer.setSamples(waveform.samples, waveform.samplesSampleRate || waveform.sampleRate);
        trimmer.setLoading({ visible: false });
        return;
      }
    } catch {}
    const frames = await captureVideoFrameStrip({ file: activeFile, count: 12, width: 104, height: 58 });
    if (token !== trimmerVisualToken || !trimmer) return;
    trimmer.setFrameStrip(frames);
    trimmer.setLoading({ visible: false });
  };

  const applyPreset = () => {
    const preset = value('webmedia-transcode-preset');
    if (preset === 'web-mp4') {
      refs.targetContainer.value = 'mp4';
      refs.videoCodec.value = 'avc';
      refs.audioCodec.value = 'aac';
      setElementValue(container, 'webmedia-transcode-rate-control', 'bitrate');
      setElementValue(container, 'webmedia-transcode-video-bitrate', 4500);
      setElementValue(container, 'webmedia-transcode-audio-bitrate', 160);
      setElementValue(container, 'webmedia-transcode-width', 1920);
      setElementValue(container, 'webmedia-transcode-height', 1080);
      setElementValue(container, 'webmedia-transcode-fit', 'contain');
      setElementChecked(container, 'webmedia-transcode-drop-video', false);
      setElementChecked(container, 'webmedia-transcode-drop-audio', false);
    }
    if (preset === 'webm') {
      refs.targetContainer.value = 'webm';
      refs.videoCodec.value = 'vp9';
      refs.audioCodec.value = 'opus';
      setElementValue(container, 'webmedia-transcode-video-bitrate', 3200);
      setElementValue(container, 'webmedia-transcode-audio-bitrate', 128);
    }
    if (preset === 'social') {
      refs.targetContainer.value = 'mp4';
      refs.videoCodec.value = 'avc';
      refs.audioCodec.value = 'aac';
      setElementValue(container, 'webmedia-transcode-video-bitrate', 6000);
      setElementValue(container, 'webmedia-transcode-audio-bitrate', 192);
      setElementValue(container, 'webmedia-transcode-width', 1080);
      setElementValue(container, 'webmedia-transcode-height', 1080);
      setElementValue(container, 'webmedia-transcode-fit', 'cover');
    }
    if (preset === 'audio-only') {
      refs.targetContainer.value = 'mp3';
      setElementChecked(container, 'webmedia-transcode-drop-video', true);
      setElementChecked(container, 'webmedia-transcode-drop-audio', false);
      refs.audioCodec.value = 'mp3';
    }
    if (preset === 'lossless-audio') {
      refs.targetContainer.value = 'flac';
      setElementChecked(container, 'webmedia-transcode-drop-video', true);
      refs.audioCodec.value = 'flac';
      setElementValue(container, 'webmedia-transcode-rate-control', 'lossless');
    }
    if (preset === 'hls-package') {
      refs.targetContainer.value = 'hls';
      refs.videoCodec.value = 'avc';
      refs.audioCodec.value = 'aac';
    }
  };

  const applySpeedPreset = () => {
    const preset = WEBMEDIA_SPEED_PRESETS[value('webmedia-transcode-speed-preset')] || WEBMEDIA_SPEED_PRESETS.medium;
    setElementValue(container, 'webmedia-transcode-rate-control', preset.rateControl);
    setElementValue(container, 'webmedia-transcode-quality', preset.quality);
    setElementValue(container, 'webmedia-transcode-video-bitrate', preset.videoBitrateKbps);
    setElementValue(container, 'webmedia-transcode-max-video-bitrate', preset.maxVideoBitrateKbps);
    setElementValue(container, 'webmedia-transcode-buffer-size', preset.bufferSizeKbps);
    setElementValue(container, 'webmedia-transcode-audio-bitrate', preset.audioBitrateKbps);
    setElementValue(container, 'webmedia-transcode-frame-rate', preset.frameRate);
    setElementValue(container, 'webmedia-transcode-keyframe', preset.keyFrameInterval);
    setElementValue(container, 'webmedia-transcode-hardware', preset.hardwareAcceleration);
    setElementValue(container, 'webmedia-transcode-latency', preset.latencyMode);
    setElementChecked(container, 'webmedia-transcode-prevent-upscale', true);
  };

  const renderModePanels = () => {
    container.querySelectorAll('[data-webmedia-settings]').forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.webmediaSettings === activeOperation);
    });
  };

  const buildDiagnosticEntries = (plan) => {
    if (!plan) return [];
    const capabilitySummary = service.getCapabilities();
    const adjustmentKeys = Object.entries(plan.conversion?.adjustments || {})
      .flatMap(([group, entries]) => Object.keys(entries || {}).map((key) => `${group}.${key}`));
    const entries = [
      {
        code: 'Source',
        message: `${plan.source.container} / ${formatDuration(plan.source.duration)} / ${plan.source.tracks.length} tracks`
      },
      {
        code: 'Output',
        message: `${buildWebMediaOutputName(plan.source.fileName, plan)} / ${plan.output.mime}`
      },
      {
        code: 'Execution',
        message: `${plan.execution} / ${plan.requiresReencode ? 'reencode' : 'packet copy'} / tracks ${plan.conversion?.tracks || 'all'}`
      },
      {
        code: 'Worker',
        message: capabilitySummary.workerKnown ? capabilitySummary.missingWorker.length ? `Missing ${capabilitySummary.missingWorker.join(', ')}` : 'WebCodecs ready' : 'Checking WebCodecs'
      },
      {
        code: 'Video',
        value: plan.conversion?.video || {}
      },
      {
        code: 'Audio',
        value: plan.conversion?.audio || {}
      },
      {
        code: 'Trim',
        value: plan.conversion?.trim || {}
      },
      {
        code: 'Mux',
        value: plan.conversion?.mux || {}
      },
      {
        code: 'Profile',
        value: plan.conversion?.profile || {}
      },
      {
        code: 'Adjustments',
        message: adjustmentKeys.length ? adjustmentKeys.join(', ') : 'None'
      }
    ];
    return [
      ...plan.errors.map((entry) => ({ ...entry, tone: 'danger' })),
      ...plan.warnings.map((entry) => ({ ...entry, tone: 'warning' })),
      ...entries
    ];
  };

  const renderInspection = () => {
    syncWorkspaceState();
    if (!activeInspection) {
      revokePreviewUrl();
      refs.previewCopy.innerHTML = activeFile
        ? `<strong>${escapeHtml(activeFile.name || 'media')}</strong><span>Inspecting local tracks.</span>`
        : '<strong>No file selected</strong><span>Import a media file to inspect its local track plan.</span>';
      refs.previewCopy.classList.remove('hidden');
      refs.previewMedia.removeAttribute('src');
      refs.previewMedia.classList.remove('is-visible');
      refs.trackStack.innerHTML = '';
      refs.metrics.innerHTML = '';
      resetTrimmer();
      renderInspectReport();
      renderDiagnostics([]);
      return;
    }
    revokePreviewUrl();
    activePreviewUrl = safeObjectUrl(activeFile);
    if (activePreviewUrl) {
      refs.previewMedia.setAttribute('src', activePreviewUrl);
      refs.previewMedia.classList.add('is-visible');
      refs.previewCopy.classList.add('hidden');
    } else {
      refs.previewMedia.removeAttribute('src');
      refs.previewMedia.classList.remove('is-visible');
      refs.previewCopy.classList.remove('hidden');
    }
    refs.previewCopy.innerHTML = `
      <strong>${escapeHtml(activeInspection.fileName)}</strong>
      <span>${escapeHtml(activeInspection.container)} - ${formatBytes(activeInspection.size)} - ${formatDuration(activeInspection.duration)}</span>
    `;
    refs.duration.textContent = formatDuration(activeInspection.duration);
    setTrimInputs(0, activeInspection.duration);
    syncTrimmerToInspection();
    hydrateTrimmerVisuals();
    refs.trackStack.innerHTML = activeInspection.tracks.length
      ? activeInspection.tracks.map((track) => `
        <div class="webmedia-track" data-kind="${escapeHtml(track.kind)}">
          <div>
            <strong>${escapeHtml(track.kind)}</strong>
            <span>${escapeHtml(getTrackDetail(track))}</span>
          </div>
          <b>${track.decodable ? 'Decodable' : 'Unknown'}</b>
        </div>
      `).join('')
      : '<div class="webmedia-empty">Track-level metadata appears after deeper browser inspection.</div>';
    renderMetrics();
    renderInspectReport();
    renderDiagnostics(activeInspection.warnings || []);
  };

  const updatePlan = async () => {
    if (!activeInspection && !activeFile) {
      setStatus('Import a file first.', 'danger');
      return null;
    }
    const source = activeInspection || {
      fileName: activeFile.name,
      mime: activeFile.type,
      size: activeFile.size,
      tracks: []
    };
    const settings = collectSettings();
    const payload = {
      operation: activeOperation,
      source,
      targetContainer: refs.targetContainer.value,
      remuxOnly: settings.remux.remuxOnly,
      settings
    };
    const result = await service.plan(payload);
    activePlan = result.plan || planWebMediaOperation(payload);
    refs.mode.textContent = activePlan.mode;
    refs.exportButton.textContent = activePlan.operation === 'inspect'
      ? 'Export Inspect JSON'
      : `Export ${activePlan.mode} .${activePlan.output.extension}`;
    refs.planSummary.innerHTML = `
      <div class="webmedia-plan-mode" data-mode="${escapeHtml(activePlan.mode)}">${escapeHtml(activePlan.mode)}</div>
      <div>Output: ${escapeHtml(buildWebMediaOutputName(activePlan.source.fileName, activePlan))}</div>
      <div>Container: ${escapeHtml(activePlan.output.label)}</div>
      <div>Reencode: ${activePlan.requiresReencode ? 'Required' : 'No'}</div>
      <div>Execution: ${escapeHtml(activePlan.execution)}</div>
      <div>Adjustments: ${escapeHtml(Object.keys(activePlan.conversion?.adjustments || {}).filter((key) => Object.keys(activePlan.conversion.adjustments[key] || {}).length).join(', ') || 'None')}</div>
    `;
    renderDiagnostics(buildDiagnosticEntries(activePlan));
    renderInspectReport();
    setStatus(activePlan.errors.length ? 'Plan blocked.' : 'Plan ready.', activePlan.errors.length ? 'danger' : 'success');
    return activePlan;
  };

  const schedulePlanUpdate = (delay = 0) => {
    if (!activeInspection && !activeFile) return;
    if (planUpdateTimer) clearTimeout(planUpdateTimer);
    planUpdateTimer = setTimeout(() => {
      planUpdateTimer = 0;
      updatePlan().catch((error) => {
        renderDiagnostics([{ code: error.code || 'PLAN_FAILED', message: error.message, tone: 'danger' }]);
        setStatus(error.message, 'danger');
      });
    }, delay);
  };

  trimmer?.destroy();
  trimmer = createMediaTrimmer({
    mount: refs.trimmerHost,
    idPrefix: 'webmedia',
    duration: 0.1,
    start: 0,
    end: 0.1,
    playhead: 0,
    minSpan: 0.01,
    showSeekAutoplayToggle: true,
    isLooping: lastLoopState,
    onChange(range) {
      setTrimInputs(range.start, range.end);
      setElementValue(container, 'webmedia-trim-fade-in', range.fadeIn || 0);
      setElementValue(container, 'webmedia-trim-fade-out', range.fadeOut || 0);
      schedulePlanUpdate();
    },
    onRulerSeek({ time, isSeekAutoplayEnabled }) {
      seekPreview(time, { syncTrimmer: false, play: isSeekAutoplayEnabled });
    },
    onPlayheadChange({ time, reason, isSeekAutoplayEnabled }) {
      if (!['seek', 'ruler-click'].includes(reason)) return;
      seekPreview(time, { syncTrimmer: false, play: isSeekAutoplayEnabled });
    },
    onTogglePlayback({ isPlaying, time }) {
      if (Number.isFinite(time)) seekPreview(time, { syncTrimmer: false });
      if (isPlaying) playPreview();
      else pausePreview();
    },
    onLoopChange({ isLooping }) {
      lastLoopState = isLooping;
    }
  });

  const inspectActiveFile = async () => {
    if (!activeFile) return;
    setStatus('Inspecting...', 'info');
    progressController.update({ title: 'Inspecting media', detail: activeFile.name, busy: true });
    const result = await service.inspectFile(activeFile, {
      onEvent(event) {
        if (event.type === 'progress') {
          progressController.update({
            title: 'Inspecting media',
            detail: event.payload.phase,
            progress: event.payload.percent,
            busy: event.payload.percent < 100
          });
        }
      }
    });
    activeInspection = result.inspection;
    renderInspection();
    await updatePlan();
    progressController.update({ title: 'Inspection ready', tone: 'success', autoResetMs: 1200 });
  };

  const setFiles = async (nextFiles) => {
    files = Array.from(nextFiles || []);
    activeFile = files[0] || null;
    activeInspection = null;
    activePlan = null;
    clearOutputPreview();
    renderQueue();
    renderInspection();
    if (activeFile) await inspectActiveFile();
  };

  refs.importButton.addEventListener('click', () => refs.fileInput.click());
  refs.fileInput.addEventListener('change', (event) => setFiles(event.target.files));
  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    refs.dropzone.classList.add('is-dragging');
  };
  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    refs.dropzone.classList.remove('is-dragging');
  };
  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    refs.dropzone.classList.remove('is-dragging');
    setFiles(event.dataTransfer?.files || []);
  };

  refs.dropzone.addEventListener('dragover', handleDragOver);
  refs.dropzone.addEventListener('dragleave', handleDragLeave);
  refs.dropzone.addEventListener('drop', handleDrop);
  container.addEventListener('dragover', handleDragOver);
  container.addEventListener('dragleave', handleDragLeave);
  container.addEventListener('drop', handleDrop);
  refs.fileQueue.addEventListener('click', async (event) => {
    const card = event.target.closest('[data-file-index]');
    if (!card) return;
    activeFile = files[Number(card.dataset.fileIndex)] || null;
    activeInspection = null;
    renderQueue();
    renderInspection();
    await inspectActiveFile();
  });
  container.querySelectorAll('[data-webmedia-operation]').forEach((button) => {
    button.addEventListener('click', async () => {
      activeOperation = button.dataset.webmediaOperation;
      container.querySelectorAll('[data-webmedia-operation]').forEach((entry) => entry.classList.toggle('active', entry === button));
      renderModePanels();
      if (activeOperation === 'audio') refs.targetContainer.value = 'mp3';
      if (activeOperation === 'hls') refs.targetContainer.value = 'hls';
      if (activeOperation === 'subtitles') refs.targetContainer.value = 'mp4';
      if (activeOperation === 'transcode') applyPreset();
      refs.remuxOnly.checked = activeOperation === 'remux';
      await updatePlan();
    });
  });
  container.querySelectorAll('[data-webmedia-inspect-depth]').forEach((button) => {
    button.addEventListener('click', () => {
      setElementValue(container, 'webmedia-inspect-depth', button.dataset.webmediaInspectDepth);
      container.querySelectorAll('[data-webmedia-inspect-depth]').forEach((entry) => {
        entry.classList.toggle('active', entry === button);
      });
      renderInspectReport();
      schedulePlanUpdate();
    });
  });
  refs.diagnostics.addEventListener('click', (event) => {
    const button = event.target.closest('[data-webmedia-diagnostic-index]');
    if (!button) return;
    openDiagnosticDetail(button.dataset.webmediaDiagnosticIndex);
  });
  refs.diagnosticModalClose.addEventListener('click', closeDiagnosticDetail);
  refs.diagnosticModal.addEventListener('click', (event) => {
    if (event.target === refs.diagnosticModal) closeDiagnosticDetail();
  });
  refs.outputDownload.addEventListener('click', () => {
    if (!activeOutputBlob) return;
    downloadFile(activeOutputBlob, activeOutputName, activeOutputMime);
  });
  refs.previewMedia.addEventListener('loadedmetadata', () => {
    syncTrimmerToInspection();
    hydrateTrimmerVisuals();
  });
  refs.previewMedia.addEventListener('timeupdate', () => {
    const time = Number(refs.previewMedia.currentTime) || 0;
    const range = trimmer?.getRange?.();
    if (range && time > range.end) {
      if (lastLoopState) {
        seekPreview(range.start, { reason: 'loop' });
        playPreview();
      } else {
        pausePreview();
        seekPreview(range.start, { reason: 'ended' });
        trimmer?.emitEnded?.();
      }
      return;
    }
    syncScrubFromTime(time);
    trimmer?.setPlayhead(time, 'preview');
  });
  refs.previewMedia.addEventListener('play', () => trimmer?.setPlaying(true));
  refs.previewMedia.addEventListener('pause', () => trimmer?.setPlaying(false));
  refs.scrub.addEventListener('input', () => {
    const duration = getActiveDuration();
    seekPreview(duration * Number(refs.scrub.value || 0) / 100, { reason: 'scrub' });
  });
  [refs.targetContainer, refs.videoCodec, refs.audioCodec, refs.trackScope, refs.remuxOnly].forEach((node) => {
    node.addEventListener('change', () => {
      renderInspectReport();
      schedulePlanUpdate();
    });
  });
  const trimInputIds = new Set([
    'webmedia-trim-start',
    'webmedia-trim-end',
    'webmedia-trim-duration',
    'webmedia-trim-fade-in',
    'webmedia-trim-fade-out'
  ]);
  trimInputIds.forEach((id) => {
    const node = container.querySelector(`#${id}`);
    node?.addEventListener('input', () => {
      syncTrimmerFromTrimInputs({ fromDuration: id === 'webmedia-trim-duration' });
      schedulePlanUpdate(120);
    });
    node?.addEventListener('change', () => {
      syncTrimmerFromTrimInputs({ fromDuration: id === 'webmedia-trim-duration' });
      schedulePlanUpdate();
    });
  });
  container.querySelector('#webmedia-transcode-preset').addEventListener('change', async () => {
    applyPreset();
    await updatePlan();
  });
  container.querySelector('#webmedia-transcode-speed-preset').addEventListener('change', async () => {
    applySpeedPreset();
    await updatePlan();
  });
  container.querySelectorAll('.webmedia-settings input, .webmedia-settings select').forEach((node) => {
    if (node.id === 'webmedia-transcode-preset') return;
    if (node.id === 'webmedia-transcode-speed-preset') return;
    if (trimInputIds.has(node.id)) return;
    node.addEventListener('input', () => {
      renderInspectReport();
      schedulePlanUpdate(120);
    });
    node.addEventListener('change', () => {
      renderInspectReport();
      schedulePlanUpdate();
    });
  });
  container.querySelectorAll('.webmedia-common-controls input, .webmedia-common-controls select').forEach((node) => {
    node.addEventListener('change', () => {
      renderInspectReport();
      schedulePlanUpdate();
    });
  });
  refs.exportButton.addEventListener('click', async () => {
    const plan = activePlan || await updatePlan();
    if (!plan || plan.errors.length) return;
    if (activeRun) {
      setStatus('Export already running.', 'info');
      return;
    }
    const jobId = `webmedia-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    activeRun = { jobId, controller, mode: plan.mode };
    try {
      progressController.update({ title: 'Running web media job', detail: plan.mode, busy: true, cancellable: true });
      const result = await service.run(plan, {
        jobId,
        mediaFile: activeFile,
        signal: controller?.signal,
        onEvent(event) {
          if (event.type === 'progress') {
            progressController.update({
              title: 'Running web media job',
              detail: event.payload.phase,
              progress: event.payload.percent,
              busy: event.payload.percent < 100,
              cancellable: true
            });
          }
        }
      });
      if (result.blob) {
        renderOutputPreview(result);
        downloadFile(result.blob, result.filename, result.mime);
      }
      progressController.update({ title: 'Export ready', tone: 'success', progress: 100, autoResetMs: 1400 });
      setStatus('Export ready.', 'success');
    } catch (error) {
      const canceled = error.code === 'JOB_CANCELED';
      progressController.update({ title: canceled ? 'Export canceled' : 'Export blocked', detail: error.message, tone: canceled ? 'warning' : 'danger' });
      renderDiagnostics([{ code: error.code || 'EXPORT_BLOCKED', message: error.message, tone: canceled ? 'warning' : 'danger' }]);
      setStatus(canceled ? 'Export canceled.' : error.suggestedRoute ? 'Use Video Studio for this job.' : error.message, canceled ? 'warning' : 'danger');
    } finally {
      if (activeRun?.jobId === jobId) activeRun = null;
    }
  });

  renderCapabilities();
  service.probeCapabilities?.().then(() => {
    if (container) renderCapabilities();
  });
  renderModePanels();
  renderQueue();
  renderInspection();
  renderDiagnostics();
}

export function unmount() {
  if (planUpdateTimer) clearTimeout(planUpdateTimer);
  progressController?.destroy();
  trimmer?.destroy();
  service?.dispose();
  revokePreviewUrl();
  revokeOutputUrl();
  container?.remove();
  planUpdateTimer = 0;
  progressController = null;
  trimmer = null;
  trimmerVisualToken += 1;
  service = null;
  container = null;
  files = [];
  activeFile = null;
  activeInspection = null;
  activeOperation = 'inspect';
  activePlan = null;
  activeRun = null;
  activeOutputBlob = null;
  activeOutputName = '';
  activeOutputMime = '';
  lastUrgentDiagnosticKey = '';
}

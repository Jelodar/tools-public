import { DEFAULT_MODELS, MODEL_REGISTRY } from '../core/ai.js';
import { copyToClipboard, showToast } from '../ui/ui-utils.js';
import { createAiUse } from '../ui/ai-use.js';
import { createModalController } from '../ui/modal.js';
import { globalStore } from '../core/store.js';
import { createPersistedToolState } from '../utils/tool-state.js';
import {
  DEFAULT_REGEX_SAMPLE,
  REGEX_BLOCK_CATALOG,
  analyzeRegex,
  buildRegexAiRequestPayload,
  buildRegexBlockToken,
  buildRegexFlagMatrix,
  buildRegexHeuristicSuggestion,
  buildRegexPreset,
  buildReplacementPreview,
  createRegexSnippet,
  debugRegexTrace,
  explainRegexPattern,
  getRegexCaptureGroups,
  insertRegexBlockToken,
  mergeRegexSnippets,
  parseRegexAiResponse,
  sanitizeRegexFlags
} from '../utils/regex.js';

let container = null;
let toolState = null;
let aiUse = null;
let aiState = null;
let modalControllers = [];
let debugState = {
  trace: null,
  currentStep: 0
};
let currentMatchIndex = 0;

const PRESET_OPTIONS = [
  ['email', 'Email'],
  ['url', 'URL'],
  ['uuid', 'UUID'],
  ['date', 'Date'],
  ['hashtag', 'Hashtag']
];

const DEFAULT_STATE = {
  pattern: '\\b\\d{4}-\\d{2}-\\d{2}\\b',
  flags: 'g',
  input: DEFAULT_REGEX_SAMPLE,
  replacement: '[$MATCH]',
  replacementFields: {},
  snippets: [],
  activeTab: 'test',
  blockQuery: '',
  selectedBlockId: '',
  aiModel: DEFAULT_MODELS['code-fast'] || DEFAULT_MODELS.code || DEFAULT_MODELS.text,
  aiTemp: '0.1',
  aiMaxTokens: '48',
  aiDescription: 'Match invoice IDs like INV-1042.',
  aiSample: 'Open INV-1042 and INV-2201 before noon.',
  traceFilters: ['branch', 'release', 'match', 'complete', 'skip']
};

export async function mount(parent) {
  container = document.createElement('div');
  container.className = 'tool-regex';
  container.innerHTML = `
    <div class="card rj-layout regex-studio-shell">
      <div class="regex-studio-top">
        <div class="tabs-header regex-tab-strip">
          <button class="tab-btn active" data-regex-tab="test">Test</button>
          <button class="tab-btn" data-regex-tab="debug">Debug</button>
          <button class="tab-btn" data-regex-tab="create">Create</button>
          <button class="tab-btn" data-regex-tab="replace">Replace</button>
        </div>
        <div class="regex-studio-actions">
          <button id="btn-regex-open-preset-library" class="btn-secondary">Preset Library</button>
          <button id="btn-save-snippet">Save Snippet</button>
          <button id="btn-copy-js" class="btn-secondary">Copy JS</button>
          <button id="btn-copy-regex" class="btn-secondary">Copy Regex</button>
        </div>
      </div>

      <div class="form-group regex-pattern-group">
        <div class="regex-section-head">
          <label>Pattern</label>
          <div class="regex-section-tools">
            <button id="btn-regex-open-breakdown" class="btn-secondary regex-inline-button">Breakdown</button>
            <div id="regex-status" class="regex-status-text regex-status-inline" data-tone="muted">Ready.</div>
          </div>
        </div>
        <div class="regex-pattern-shell">
          <span class="regex-pattern-edge">/</span>
          <input type="text" id="regex-pattern" placeholder="[a-z]+" class="regex-pattern-input">
          <span class="regex-pattern-edge">/</span>
          <button type="button" id="regex-flags" class="regex-flag-button" data-value="">No flags</button>
        </div>
      </div>

      <div class="settings-grid regex-hero-grid">
        <div class="form-group regex-grow-pane">
          <label>Test String</label>
          <textarea id="regex-input" class="regex-textarea-large"></textarea>
        </div>
      </div>

      <div id="regex-tab-test" class="regex-tab-panel">
        <div class="regex-toolbar">
          <label class="regex-toolbar-label">Highlighted Matches</label>
          <div class="regex-toolbar-actions regex-toolbar-actions-tight">
            <button id="btn-prev-match" class="btn-secondary">Prev</button>
            <div id="regex-match-meta" class="regex-toolbar-meta">0 / 0</div>
            <button id="btn-next-match" class="btn-secondary">Next</button>
          </div>
        </div>
        <div id="regex-highlighted" class="regex-surface regex-highlight-surface regex-surface-code regex-surface-short"></div>
        <div class="form-group">
          <label>Matches</label>
          <div id="regex-results" class="regex-surface regex-results-surface regex-surface-code regex-surface-tall"></div>
        </div>
      </div>

      <div id="regex-tab-debug" class="regex-tab-panel hidden">
        <div class="regex-debug-main">
          <div class="regex-debug-sticky-bar">
            <div class="regex-step-toolbar">
              <div class="regex-step-controls">
                <button id="btn-regex-step-prev" class="btn-secondary">Back</button>
                <div id="regex-debug-step-meta" class="regex-step-meta">0 / 0</div>
                <button id="btn-regex-step-next" class="btn-secondary">Next</button>
              </div>
              <div id="regex-debug-status" class="regex-toolbar-status">Ready.</div>
            </div>
            <div class="regex-debug-filter-bar">
              <div class="regex-filter-group" id="regex-trace-filter-group">
                <label class="regex-filter-pill"><input type="checkbox" value="scan"> <span>Scan</span></label>
                <label class="regex-filter-pill"><input type="checkbox" value="branch"> <span>Branch</span></label>
                <label class="regex-filter-pill"><input type="checkbox" value="release"> <span>Release</span></label>
                <label class="regex-filter-pill"><input type="checkbox" value="assert"> <span>Assert</span></label>
                <label class="regex-filter-pill"><input type="checkbox" value="match"> <span>Match</span></label>
                <label class="regex-filter-pill"><input type="checkbox" value="complete"> <span>Complete</span></label>
                <label class="regex-filter-pill"><input type="checkbox" value="skip"> <span>Skip</span></label>
              </div>
            </div>
            <div class="regex-slider-container">
              <input type="range" id="regex-debug-slider" min="0" max="0" step="1" value="0" class="regex-step-slider">
            </div>
          </div>

          <div class="regex-debug-content">
            <div class="form-group">
              <label>Live Pattern</label>
              <div id="regex-debug-pattern" class="regex-surface regex-debug-pattern-view"></div>
            </div>

            <div class="form-group">
              <label>Sample Walkthrough</label>
              <div id="regex-debug-preview" class="regex-debug-preview"></div>
            </div>

            <div class="form-group regex-debug-trace-group">
              <label>Step By Step Trace</label>
              <div id="regex-debug-trace" class="regex-trace-list"></div>
            </div>
          </div>
        </div>
      </div>


      <div id="regex-tab-create" class="regex-tab-panel hidden">
        <div class="settings-grid">
          <div class="form-group">
            <label>AI Builder Goal</label>
            <textarea id="regex-ai-description" class="regex-textarea-medium"></textarea>
          </div>
          <div class="form-group">
            <label>Sample Text</label>
            <textarea id="regex-ai-sample" class="regex-textarea-medium"></textarea>
          </div>
        </div>
        <div class="regex-ai-toolbar">
          <div class="regex-ai-toolbar-actions">
            <button id="btn-regex-ai-setup" class="btn-secondary">AI Engine</button>
            <button id="btn-regex-ai-run">Build Pattern</button>
            <button id="btn-regex-ai-heuristic" class="btn-secondary">Quick Draft</button>
            <button id="btn-regex-ai-apply" class="btn-secondary">Apply Pattern</button>
          </div>
          <div id="regex-ai-engine-tag" class="ai-widget-chip regex-ai-engine-tag">ENGINE: OFFLINE</div>
        </div>
        <div id="regex-ai-config-panel" class="hidden ai-widget-panel ai-widget-config-panel">
          <div class="settings-grid">
            <div class="form-group">
              <label>Model</label>
              <select id="regex-ai-model">
                ${Object.entries(MODEL_REGISTRY)
                  .filter(([_, model]) => model.tasks.includes('code-fast') || model.tasks.includes('code') || model.tasks.includes('text'))
                  .map(([key, model]) => `<option value="${key}" ${key === (DEFAULT_MODELS['code-fast'] || DEFAULT_MODELS.code || DEFAULT_MODELS.text) ? 'selected' : ''}>${model.id} (${model.size})</option>`)
                  .join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Model Info</label>
              <div id="regex-ai-model-info" class="regex-pane"></div>
            </div>
          </div>
          <div class="regex-ai-config-divider">
            <div class="settings-grid">
              <div class="form-group">
                <label>Temperature</label>
                <input type="number" id="regex-ai-temp" value="${DEFAULT_STATE.aiTemp}" step="0.05" min="0" max="1">
              </div>
              <div class="form-group">
                <label>Max Tokens</label>
                <input type="number" id="regex-ai-max-tokens" value="${DEFAULT_STATE.aiMaxTokens}" min="16" max="256" step="8">
              </div>
            </div>
          </div>
          <div class="regex-ai-config-actions">
            <button id="btn-regex-ai-cancel" class="btn-secondary">Close</button>
            <button id="btn-regex-ai-activate">Activate Engine</button>
          </div>
        </div>
        <div id="regex-ai-progress-host" class="ai-widget-progress-host regex-ai-progress-host"></div>
        <div id="regex-ai-thinking-zone" class="hidden ai-widget-panel ai-widget-thinking-panel">
          <div class="ai-widget-panel-kicker">Thinking Stream</div>
          <div id="regex-ai-thinking-content" class="ai-widget-thinking-content"></div>
        </div>
        <div class="regex-ai-subnav">
          <div class="tabs-header regex-ai-view-tabs">
            <button class="tab-btn active" data-regex-ai-view="draft">Draft</button>
            <button class="tab-btn" data-regex-ai-view="console">Console</button>
          </div>
          <div id="regex-ai-status" class="regex-status-text" data-tone="muted">Local builder idle.</div>
        </div>
        <div id="regex-ai-view-draft" class="regex-ai-view">
          <div class="form-group">
            <label>Pattern Draft</label>
            <div id="regex-ai-output" class="regex-pane ai-widget-panel ai-widget-output-panel"></div>
          </div>
        </div>
        <div id="regex-ai-view-console" class="regex-ai-view hidden">
          <div id="regex-ai-console" class="regex-pane ai-widget-console regex-console-pane"></div>
          <button id="btn-regex-ai-clear-console" class="btn-secondary regex-console-clear">Clear Console</button>
        </div>
        <div class="form-group">
          <label>Block Library</label>
          <div class="regex-toolbar regex-block-toolbar">
            <select id="regex-block-category" class="regex-block-filter">
              <option value="">All Categories</option>
              ${[...new Set(REGEX_BLOCK_CATALOG.map((b) => b.category))].sort().map((cat) => `<option value="${cat}">${cat.replace(/^[a-z]/, (c) => c.toUpperCase())}</option>`).join('')}
            </select>
            <input type="text" id="regex-block-search" class="regex-block-search" placeholder="Filter blocks by label, token, or engine">
            <div id="regex-block-meta" class="regex-toolbar-status">Drag into the pattern field or click to append.</div>
          </div>
          <div id="regex-block-grid" class="regex-block-grid"></div>
        </div>
      </div>

      <div id="regex-tab-replace" class="regex-tab-panel hidden">
        <div class="settings-grid regex-replace-layout">
          <div class="form-group regex-grow-pane">
            <div class="regex-section-head">
              <label>Replacement Inputs</label>
              <div id="regex-replace-template" class="regex-toolbar-status">Template: $MATCH</div>
            </div>
            <div id="regex-replacement-builder" class="regex-replace-grid"></div>
          </div>
          <div class="form-group regex-side-card">
            <label>Replacement Summary</label>
            <div id="regex-replace-meta" class="regex-status-text regex-replace-meta" data-tone="muted">No replacement yet.</div>
          </div>
        </div>
        <div class="form-group">
          <label>Replacement Preview</label>
          <textarea id="regex-replacement-output" class="regex-replace-output regex-textarea-large" readonly></textarea>
        </div>
      </div>

      <div id="regex-preset-library" class="regex-preset-library hidden">
        <div class="regex-preset-dialog">
          <div class="regex-preset-dialog-head">
            <div class="regex-preset-dialog-copy">
              <strong>Preset Library</strong>
              <div class="regex-preset-dialog-note">Common starters and saved snippets in one place.</div>
            </div>
            <button id="btn-regex-close-preset-library" class="btn-secondary">Close</button>
          </div>
          <div class="regex-modal-stack">
            <div class="regex-modal-section">
              <div class="regex-modal-section-head">
                <strong>Starter Patterns</strong>
              </div>
              <div id="regex-create-grid" class="regex-card-grid regex-preset-grid"></div>
            </div>
            <div class="regex-modal-section">
              <div class="regex-modal-section-head">
                <strong>Saved Snippets</strong>
              </div>
              <div id="regex-saved-snippets" class="regex-card-grid"></div>
            </div>
          </div>
        </div>
      </div>

      <div id="regex-breakdown-modal" class="regex-modal hidden">
        <div class="regex-modal-card">
          <div class="regex-modal-head">
            <div>
              <strong>Pattern Breakdown</strong>
            </div>
            <button id="btn-regex-close-breakdown" class="btn-secondary">Close</button>
          </div>
          <div id="regex-explain" class="regex-auto-grid regex-explain-compact"></div>
        </div>
      </div>

      <div id="regex-flags-modal" class="regex-modal hidden">
        <div class="regex-modal-card">
          <div class="regex-modal-head">
            <div>
              <strong>Flags</strong>
            </div>
            <button id="btn-regex-close-flags" class="btn-secondary">Close</button>
          </div>
          <div id="regex-flag-matrix" class="regex-flag-grid"></div>
        </div>
      </div>

      <div id="regex-block-builder-modal" class="regex-modal hidden">
        <div class="regex-modal-card regex-block-builder-card">
          <div class="regex-modal-head">
            <div>
              <strong>Block Builder</strong>
            </div>
            <button id="btn-regex-close-block-builder" class="btn-secondary">Close</button>
          </div>
          <div id="regex-block-builder" class="regex-pane regex-builder-pane"></div>
        </div>
      </div>
    </div>
  `;

  parent.appendChild(container);
  toolState = createPersistedToolState(globalStore, 'regex-suite', DEFAULT_STATE, { debounceMs: 120 });
  const initialState = toolState.getSnapshot();

  const refs = {
    pattern: container.querySelector('#regex-pattern'),
    flags: container.querySelector('#regex-flags'),
    input: container.querySelector('#regex-input'),
    results: container.querySelector('#regex-results'),
    highlighted: container.querySelector('#regex-highlighted'),
    matchMeta: container.querySelector('#regex-match-meta'),
    status: container.querySelector('#regex-status'),
    explanation: container.querySelector('#regex-explain'),
    debugPreview: container.querySelector('#regex-debug-preview'),
    debugTrace: container.querySelector('#regex-debug-trace'),
    debugPattern: container.querySelector('#regex-debug-pattern'),
    debugSlider: container.querySelector('#regex-debug-slider'),
    flagMatrix: container.querySelector('#regex-flag-matrix'),
    createGrid: container.querySelector('#regex-create-grid'),
    savedSnippets: container.querySelector('#regex-saved-snippets'),
    replacementBuilder: container.querySelector('#regex-replacement-builder'),
    replacementOutput: container.querySelector('#regex-replacement-output'),
    replacementMeta: container.querySelector('#regex-replace-meta'),
    replacementTemplate: container.querySelector('#regex-replace-template'),
    presetLibrary: container.querySelector('#regex-preset-library'),
    breakdownModal: container.querySelector('#regex-breakdown-modal'),
    flagsModal: container.querySelector('#regex-flags-modal'),
    blockSearch: container.querySelector('#regex-block-search'),
    blockCategory: container.querySelector('#regex-block-category'),
    blockMeta: container.querySelector('#regex-block-meta'),
    blockGrid: container.querySelector('#regex-block-grid'),
    blockBuilder: container.querySelector('#regex-block-builder'),
    blockBuilderModal: container.querySelector('#regex-block-builder-modal'),
    aiModel: container.querySelector('#regex-ai-model'),
    aiModelInfo: container.querySelector('#regex-ai-model-info'),
    aiTemp: container.querySelector('#regex-ai-temp'),
    aiMaxTokens: container.querySelector('#regex-ai-max-tokens'),
    aiDescription: container.querySelector('#regex-ai-description'),
    aiSample: container.querySelector('#regex-ai-sample'),
    aiStatus: container.querySelector('#regex-ai-status'),
    aiOutput: container.querySelector('#regex-ai-output'),
    aiConsole: container.querySelector('#regex-ai-console'),
    aiEngineTag: container.querySelector('#regex-ai-engine-tag'),
    aiConfigPanel: container.querySelector('#regex-ai-config-panel'),
    aiProgressHost: container.querySelector('#regex-ai-progress-host'),
    aiThinkingZone: container.querySelector('#regex-ai-thinking-zone'),
    aiThinkingContent: container.querySelector('#regex-ai-thinking-content'),
    stepPrev: container.querySelector('#btn-regex-step-prev'),
    stepNext: container.querySelector('#btn-regex-step-next'),
    stepMeta: container.querySelector('#regex-debug-step-meta'),
    debugStatus: container.querySelector('#regex-debug-status'),
    traceFilterGroup: container.querySelector('#regex-trace-filter-group')
  };

  const updateAiStatus = (message, tone = 'muted') => {
    refs.aiStatus.textContent = message;
    setTone(refs.aiStatus, tone);
  };

  refs.pattern.value = initialState.pattern;
  refs.input.value = initialState.input;
  refs.blockSearch.value = initialState.blockQuery || '';
  refs.aiModel.value = initialState.aiModel || DEFAULT_STATE.aiModel;
  refs.aiTemp.value = initialState.aiTemp || DEFAULT_STATE.aiTemp;
  refs.aiMaxTokens.value = initialState.aiMaxTokens || DEFAULT_STATE.aiMaxTokens;
  refs.aiDescription.value = initialState.aiDescription || DEFAULT_STATE.aiDescription;
  refs.aiSample.value = initialState.aiSample || DEFAULT_STATE.aiSample;

  const currentFilters = new Set(initialState.traceFilters || DEFAULT_STATE.traceFilters);
  refs.traceFilterGroup.querySelectorAll('input').forEach((input) => {
    input.checked = currentFilters.has(input.value);
  });

  aiState = {
    streamed: '',
    suggestion: buildRegexHeuristicSuggestion(refs.aiDescription.value, refs.aiSample.value),
    activeModelKey: null,
    isGenerating: false,
    activeView: 'draft'
  };

  let selectedBlockId = initialState.selectedBlockId || '';
  let replacementFields = normalizeReplacementFields(initialState.replacementFields, initialState.replacement);
  let presetLibraryModal = null;
  let breakdownModal = null;
  let flagsModal = null;
  let blockBuilderModal = null;

  const persist = (patch) => {
    toolState.save(patch).catch(() => {});
  };

  const setTone = (node, tone = 'muted') => {
    if (node) node.dataset.tone = tone;
  };

  const renderEmptyState = (message, tone = 'muted') => `
    <div class="regex-empty-state" data-tone="${escapeAttr(tone)}">${escapeHtml(message)}</div>
  `;

  function normalizeReplacementFields(savedFields, legacyReplacement) {
    const next = savedFields && typeof savedFields === 'object' ? { ...savedFields } : {};
    if (!Object.keys(next).length && legacyReplacement) next.match = String(legacyReplacement);
    return next;
  }

  const getFlagsValue = () => sanitizeRegexFlags(refs.flags.dataset.value || '');

  const getActiveTraceFilters = () => {
    return new Set(
      Array.from(refs.traceFilterGroup.querySelectorAll('input'))
        .filter((input) => input.checked)
        .map((input) => input.value)
    );
  };

  const getFilteredTraceSteps = (trace = debugState.trace) => {
    const filters = getActiveTraceFilters();
    return (trace?.steps || []).filter((step) => filters.has(step.kind));
  };

  const setFlagsValue = (value) => {
    const normalized = sanitizeRegexFlags(value);
    refs.flags.dataset.value = normalized;
    refs.flags.textContent = normalized || 'No flags';
    refs.flags.classList.toggle('is-empty', !normalized);
    return normalized;
  };

  const getReplacementFieldEntries = (pattern) => {
    const captures = getRegexCaptureGroups(pattern);
    if (!captures.length) {
      return [{
        key: 'match',
        label: '$MATCH',
        hint: 'Full match',
        value: Object.prototype.hasOwnProperty.call(replacementFields, 'match')
          ? String(replacementFields.match ?? '')
          : '$MATCH'
      }];
    }
    return captures.map((group) => ({
      key: String(group.index),
      label: group.token,
      hint: group.name ? `<${group.name}>` : `Group ${group.index}`,
      value: Object.prototype.hasOwnProperty.call(replacementFields, group.index)
        ? String(replacementFields[group.index] ?? '')
        : Object.prototype.hasOwnProperty.call(replacementFields, String(group.index))
          ? String(replacementFields[String(group.index)] ?? '')
          : group.token
    }));
  };

  const readReplacementDraft = (pattern) => {
    const entries = getReplacementFieldEntries(pattern);
    if (!entries.length) return { mode: 'groups', groups: { match: '$MATCH' } };
    return {
      mode: 'groups',
      groups: entries.reduce((result, entry) => {
        result[entry.key] = entry.value;
        return result;
      }, {})
    };
  };

  const renderReplacementBuilder = (pattern) => {
    const entries = getReplacementFieldEntries(pattern);
    refs.replacementBuilder.dataset.signature = entries.map((entry) => entry.key).join('|');
    refs.replacementBuilder.innerHTML = entries.map((entry) => `
      <label class="regex-replace-field">
        <span class="regex-replace-token">${escapeHtml(entry.label)}</span>
        <span class="regex-replace-hint">${escapeHtml(entry.hint)}</span>
        <input
          type="text"
          data-regex-replacement-group="${escapeAttr(entry.key)}"
          value="${escapeAttr(entry.value)}"
          placeholder="${escapeAttr(entry.label)}"
        >
      </label>
    `).join('');
    refs.replacementBuilder.querySelectorAll('[data-regex-replacement-group]').forEach((inputNode) => {
      inputNode.addEventListener('input', () => {
        replacementFields[inputNode.dataset.regexReplacementGroup] = inputNode.value;
        update();
      });
    });
  };

  const renderFlagMatrix = (flags) => {
    const flagMatrix = buildRegexFlagMatrix(flags);
    refs.flagMatrix.innerHTML = flagMatrix.map((entry) => `
      <button
        type="button"
        class="regex-flag-card${entry.active ? ' active' : ''}"
        data-regex-flag-toggle="${escapeAttr(entry.flag)}"
      >
        <strong>${escapeHtml(entry.flag)}</strong>
        <span>${escapeHtml(entry.label)}</span>
        <small>${escapeHtml(entry.detail)}</small>
      </button>
    `).join('');
    refs.flagMatrix.querySelectorAll('[data-regex-flag-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const current = new Set(getFlagsValue().split('').filter(Boolean));
        const flag = button.dataset.regexFlagToggle;
        if (current.has(flag)) current.delete(flag);
        else current.add(flag);
        setFlagsValue(Array.from(current).join(''));
        update();
      });
    });
  };

  const closePresetLibrary = () => {
    presetLibraryModal?.close('tool');
  };

  const openPresetLibrary = () => {
    presetLibraryModal?.open('tool');
  };

  const closeBlockBuilder = () => {
    blockBuilderModal?.close('tool');
  };

  setFlagsValue(initialState.flags || DEFAULT_STATE.flags);

  const applyTab = (tabId) => {
    container.querySelectorAll('[data-regex-tab]').forEach((node) => {
      node.classList.toggle('active', node.dataset.regexTab === tabId);
    });
    container.querySelectorAll('.regex-tab-panel').forEach((panel) => panel.classList.add('hidden'));
    container.querySelector(`#regex-tab-${tabId}`).classList.remove('hidden');
    if (tabId !== 'create') closePresetLibrary();
    persist({ activeTab: tabId });
  };

  const applyPreset = (presetKey) => {
    const preset = buildRegexPreset(presetKey);
    if (!preset) return;
    refs.pattern.value = preset.pattern;
    setFlagsValue(preset.flags);
    refs.input.value = preset.sample;
    persist({ pattern: preset.pattern, flags: preset.flags, input: preset.sample });
    closePresetLibrary();
    update();
  };

  const renderCreateGrid = () => {
    refs.createGrid.innerHTML = PRESET_OPTIONS.map(([value, label]) => {
      const preset = buildRegexPreset(value);
      return `
        <button type="button" class="btn-secondary regex-choice-card" data-create-preset="${value}">
          <div class="regex-choice-card-title">${label}</div>
          <div class="regex-choice-card-code">${preset.pattern}</div>
        </button>
      `;
    }).join('');
    refs.createGrid.querySelectorAll('[data-create-preset]').forEach((button) => {
      button.addEventListener('click', () => {
        applyPreset(button.dataset.createPreset);
      });
    });
  };

  const renderSavedSnippets = () => {
    const snippets = mergeRegexSnippets(toolState.getSnapshot().snippets);
    refs.savedSnippets.innerHTML = snippets.map((snippet) => `
      <button type="button" class="btn-secondary regex-choice-card regex-snippet-card" data-snippet-id="${snippet.id}">
        <div class="regex-snippet-head">
          <strong>${escapeHtml(snippet.name)}</strong>
          <span class="regex-snippet-kind">${snippet.builtIn ? 'Built-in' : 'Saved'}</span>
        </div>
        <div class="regex-choice-card-code">${escapeHtml(`/${snippet.pattern}/${snippet.flags}`)}</div>
      </button>
    `).join('');
    refs.savedSnippets.querySelectorAll('[data-snippet-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const snippet = snippets.find((entry) => entry.id === button.dataset.snippetId);
        if (!snippet) return;
        refs.pattern.value = snippet.pattern;
        setFlagsValue(snippet.flags);
        refs.input.value = snippet.sample || refs.input.value;
        persist({ pattern: snippet.pattern, flags: snippet.flags, input: refs.input.value });
        closePresetLibrary();
        update();
      });
    });
  };

  const renderBlockGrid = () => {
    const query = String(refs.blockSearch.value || '').trim().toLowerCase();
    const categoryFilter = refs.blockCategory.value;
    const blocks = REGEX_BLOCK_CATALOG.filter((entry) => {
      if (categoryFilter && entry.category !== categoryFilter) return false;
      if (!query) return true;
      const searchable = `${entry.label} ${entry.token} ${entry.detail} ${entry.category}`.toLowerCase();
      return searchable.includes(query);
    });
    if (selectedBlockId && !blocks.some((entry) => entry.id === selectedBlockId)) {
      selectedBlockId = '';
      blockBuilderModal?.close('filter');
    }
    refs.blockMeta.textContent = `${blocks.length} blocks.`;
    refs.blockGrid.innerHTML = blocks.map((entry) => `
      <div
        class="block-card regex-block-card"
        draggable="true"
        data-active="${entry.id === selectedBlockId ? 'true' : 'false'}"
        data-regex-block-id="${escapeAttr(entry.id)}"
        data-regex-block-token="${escapeAttr(entry.token)}"
        title="${escapeAttr(`${entry.detail} · ${entry.engine}`)}"
      >
        <div class="regex-block-label">${escapeHtml(entry.label)}</div>
        <div class="regex-block-token">${escapeHtml(entry.token)}</div>
        <div class="regex-block-meta">${escapeHtml(entry.category)}</div>
      </div>
    `).join('');

    refs.blockGrid.querySelectorAll('.regex-block-card').forEach((card) => {
      const token = card.dataset.regexBlockToken;
      const blockId = card.dataset.regexBlockId;
      card.addEventListener('click', () => {
        const block = REGEX_BLOCK_CATALOG.find((entry) => entry.id === blockId);
        if (!block) return;
        if (block.configurable) {
          selectedBlockId = block.id;
          persist({ selectedBlockId });
          renderBlockGrid();
          renderBlockBuilder();
          blockBuilderModal?.open('tool');
          return;
        }
        applyBlockToken(token);
      });
      card.addEventListener('dragstart', (event) => {
        event.dataTransfer?.setData?.('text/plain', token);
      });
    });

    if (selectedBlockId) renderBlockBuilder();
  };

  const applyBlockToken = (token) => {
    refs.pattern.value = insertRegexBlockToken(refs.pattern.value, token, refs.pattern.selectionStart, refs.pattern.selectionEnd);
    refs.pattern.focus();
    const cursor = (refs.pattern.selectionStart || refs.pattern.value.length) + String(token || '').length;
    if (typeof refs.pattern.setSelectionRange === 'function') refs.pattern.setSelectionRange(cursor, cursor);
    persist({ pattern: refs.pattern.value });
    update();
  };

  const renderBlockBuilder = () => {
    const block = REGEX_BLOCK_CATALOG.find((entry) => entry.id === selectedBlockId);
    if (!block?.configurable) {
      refs.blockBuilder.innerHTML = '';
      blockBuilderModal?.close('empty');
      return;
    }

    refs.blockBuilder.innerHTML = `
      <div class="regex-block-builder-head">
        <div class="regex-block-builder-copy">
          <div class="regex-block-builder-kicker">Selected Block</div>
          <strong class="regex-block-builder-title">${escapeHtml(block.label)}</strong>
          <div class="regex-block-builder-note">${escapeHtml(block.detail)}</div>
        </div>
        <div class="regex-block-builder-token">${escapeHtml(block.token)}</div>
      </div>
      <div class="settings-grid">
        ${block.fields.map((field) => `
          <div class="form-group">
            <label>${escapeHtml(field.label)}</label>
            <input
              type="text"
              data-regex-block-field="${escapeAttr(field.id)}"
              inputmode="${escapeAttr(field.inputMode || 'text')}"
              placeholder="${escapeAttr(field.placeholder || '')}"
              value="${escapeAttr(field.defaultValue || '')}"
            >
          </div>
        `).join('')}
      </div>
      <div class="regex-block-preview-row">
        <div id="regex-block-preview" class="regex-block-preview"></div>
        <div class="regex-block-preview-actions">
          <button type="button" id="btn-regex-block-clear" class="btn-secondary">Close</button>
          <button type="button" id="btn-regex-block-insert">Insert Block</button>
        </div>
      </div>
    `;

    const getFieldValues = () => {
      return block.fields.reduce((values, field) => {
        values[field.id] = refs.blockBuilder.querySelector(`[data-regex-block-field="${field.id}"]`)?.value || field.defaultValue || '';
        return values;
      }, {});
    };

    const updatePreview = () => {
      const preview = buildRegexBlockToken(block.id, getFieldValues());
      refs.blockBuilder.querySelector('#regex-block-preview').textContent = preview;
    };

    refs.blockBuilder.querySelectorAll('[data-regex-block-field]').forEach((fieldNode) => {
      fieldNode.addEventListener('input', updatePreview);
    });

    refs.blockBuilder.querySelector('#btn-regex-block-clear').addEventListener('click', () => {
      closeBlockBuilder();
    });

    refs.blockBuilder.querySelector('#btn-regex-block-insert').addEventListener('click', () => {
      applyBlockToken(buildRegexBlockToken(block.id, getFieldValues()));
      closeBlockBuilder();
    });

    updatePreview();
  };

  presetLibraryModal = createModalController(refs.presetLibrary, {
    closeSelectors: ['#btn-regex-close-preset-library']
  });
  breakdownModal = createModalController(refs.breakdownModal, {
    closeSelectors: ['#btn-regex-close-breakdown']
  });
  flagsModal = createModalController(refs.flagsModal, {
    closeSelectors: ['#btn-regex-close-flags']
  });
  blockBuilderModal = createModalController(refs.blockBuilderModal, {
    closeSelectors: ['#btn-regex-close-block-builder'],
    onClose() {
      if (!selectedBlockId) return;
      selectedBlockId = '';
      persist({ selectedBlockId: '' });
      renderBlockGrid();
    }
  });
  modalControllers = [presetLibraryModal, breakdownModal, flagsModal, blockBuilderModal];

  const renderAiSuggestion = (streamedPattern = '') => {
    const pattern = streamedPattern || aiState.suggestion?.pattern || '';
    const flags = aiState.suggestion?.flags || 'g';
    refs.aiOutput.innerHTML = pattern
      ? `
          <div class="regex-output-stack">
            <div class="regex-output-pattern">/${escapeHtml(pattern)}/${escapeHtml(flags)}</div>
            <div class="regex-output-note">${streamedPattern ? 'Streaming local pattern draft...' : 'Ready to apply to pattern and flags.'}</div>
          </div>
        `
      : renderEmptyState('Build a local draft or use a quick draft.');
  };

  const applyAiView = (viewId) => {
    aiState.activeView = viewId;
    container.querySelectorAll('[data-regex-ai-view]').forEach((node) => {
      node.classList.toggle('active', node.dataset.regexAiView === viewId);
    });
    container.querySelectorAll('.regex-ai-view').forEach((panel) => panel.classList.add('hidden'));
    container.querySelector(`#regex-ai-view-${viewId}`)?.classList.remove('hidden');
  };

  const updateEngineTag = () => {
    refs.aiEngineTag.textContent = aiState.activeModelKey
      ? `ENGINE: ${MODEL_REGISTRY[aiState.activeModelKey]?.id || aiState.activeModelKey}`
      : 'ENGINE: OFFLINE';
  };

  aiUse = createAiUse({
    modelRegistry: MODEL_REGISTRY,
    progressHost: refs.aiProgressHost,
    configPanel: refs.aiConfigPanel,
    modelSelect: refs.aiModel,
    modelInfoNode: refs.aiModelInfo,
    consoleNode: refs.aiConsole,
    consoleEmptyMessage: '[INFO] Regex builder console ready.',
    thinkingPanel: refs.aiThinkingZone,
    thinkingContent: refs.aiThinkingContent,
    initialModelKey: refs.aiModel.value,
    stopLabel: 'Stop Build',
    readyDetail(modelKey) {
      return MODEL_REGISTRY[modelKey]?.id || 'Local model active.';
    },
    onProgress() {
      updateAiStatus('Loading local model...', 'info');
    },
    onReady(_payload, controller) {
      aiState.activeModelKey = controller.state.activeModelKey;
      updateEngineTag();
      updateAiStatus(`Local model ready: ${MODEL_REGISTRY[aiState.activeModelKey]?.id || 'builder'}.`, 'success');
    },
    onAborted() {
      aiState.isGenerating = false;
      updateAiStatus('Local regex build stopped.', 'warning');
    },
    onThinking(payload, controller) {
      updateAiStatus(payload.state === 'start'
        ? 'Model is reasoning through the draft…'
        : controller.state.visibleText
          ? 'Streaming pattern draft…'
          : 'Finalizing pattern draft...', 'info');
    },
    onThinkingToken(_payload, controller) {
      updateAiStatus(controller.state.visibleText
        ? 'Streaming pattern draft…'
        : 'Model is reasoning through the draft...', 'info');
    },
    onStream(payload) {
      aiState.streamed = payload.text || '';
      updateAiStatus('Streaming pattern draft...', 'info');
      renderAiSuggestion(aiState.streamed);
    },
    resolveCompleteProgress(payload) {
      const fallback = buildRegexHeuristicSuggestion(refs.aiDescription.value, refs.aiSample.value);
      const parsed = parseRegexAiResponse(payload.result, fallback) || fallback;
      return {
        title: parsed?.pattern ? 'Pattern ready' : 'Draft fallback kept',
        detail: parsed?.pattern ? `/${parsed.pattern}/${parsed.flags || 'g'}` : 'Quick draft remained active.',
        tone: parsed?.pattern ? 'success' : 'neutral',
        autoResetMs: 1800
      };
    },
    onComplete(payload, controller) {
      aiState.isGenerating = false;
      aiState.activeModelKey = controller.state.activeModelKey;
      updateEngineTag();
      const fallback = buildRegexHeuristicSuggestion(refs.aiDescription.value, refs.aiSample.value);
      const parsed = parseRegexAiResponse(payload.result, fallback) || fallback;
      aiState.streamed = '';
      aiState.suggestion = parsed;
      updateAiStatus(parsed?.pattern
        ? 'Local pattern draft ready.'
        : 'No pattern parsed. Quick draft kept.', parsed?.pattern ? 'success' : 'warning');
      renderAiSuggestion();
    },
    onError(payload) {
      aiState.isGenerating = false;
      updateAiStatus(payload.message, 'danger');
    },
    renderModelInfo(model, modelKey) {
      return `<strong>ID:</strong> ${escapeHtml(model.id)}<br><strong>Size:</strong> ${escapeHtml(model.size)}<br><strong>Mode:</strong> ${escapeHtml(model.tasks.includes('code-fast') ? 'Fast pattern completion' : model.desc)}<br><strong>Key:</strong> ${escapeHtml(modelKey)}`;
    }
  });

  const ensureAiModel = async () => {
    const modelKey = refs.aiModel.value || DEFAULT_STATE.aiModel;
    updateAiStatus(`Loading local model: ${MODEL_REGISTRY[modelKey]?.id || modelKey}.`, 'info');
    try {
      await aiUse.ensureModel(modelKey);
      aiState.activeModelKey = modelKey;
      updateEngineTag();
      return true;
    } catch (error) {
      updateAiStatus(error.message, 'danger');
      return false;
    }
  };

  const moveMatchFocus = (direction, count) => {
    if (!count) {
      currentMatchIndex = 0;
      return;
    }
    currentMatchIndex = (currentMatchIndex + direction + count) % count;
  };

  const renderDebugPattern = (stepIndex, stepsOverride = null) => {
    const steps = stepsOverride || debugState.trace?.steps || [];
    const pattern = refs.pattern.value || '';
    if (!steps.length || !pattern) {
      refs.debugPattern.innerHTML = renderEmptyState('Inspect the pattern structure in sync with trace steps.');
      return;
    }

    const step = steps[stepIndex];
    if (!step) return;
    const range = step.patternRange;
    if (!range) {
      refs.debugPattern.textContent = pattern;
      return;
    }

    const before = pattern.slice(0, range.start);
    const middle = pattern.slice(range.start, range.end);
    const after = pattern.slice(range.end);
    
    refs.debugPattern.innerHTML = `
      <span class="regex-debug-pattern-edge">/</span>
      <span class="regex-debug-pattern-base">${escapeHtml(before)}</span>
      <span class="regex-debug-pattern-segment">${escapeHtml(middle)}</span>
      <span class="regex-debug-pattern-base">${escapeHtml(after)}</span>
      <span class="regex-debug-pattern-edge">/</span>
    `;
  };

  const renderDebugPreview = (stepIndex, stepsOverride = null) => {
    const steps = stepsOverride || debugState.trace?.steps || [];
    const text = refs.input.value || '';
    if (!steps.length || !text) {
      refs.debugPreview.innerHTML = renderEmptyState('Step through the trace to inspect the sample text.');
      return;
    }

    const step = steps[stepIndex];
    if (!step) return;
    const cursor = Math.max(0, Math.min(text.length, Number.isFinite(step.cursor) ? step.cursor : 0));
    const boundaries = new Set([0, text.length, cursor]);
    (step.ranges || []).forEach((range) => {
      boundaries.add(Math.max(0, Math.min(text.length, range.start)));
      boundaries.add(Math.max(0, Math.min(text.length, range.end)));
    });
    
    const points = Array.from(boundaries).sort((a, b) => a - b);
    let html = '<div class="regex-debug-line">';
    for (let index = 0; index < points.length - 1; index += 1) {
      const start = points[index];
      const end = points[index + 1];
      if (cursor === start) html += '<span class="regex-debug-caret" aria-hidden="true"></span>';
      if (end <= start) continue;
      
      const segment = text.slice(start, end);
      const state = resolveDebugSegmentState(step.ranges || [], start, end);
      html += `<span class="regex-debug-segment regex-debug-segment-${escapeAttr(state)}">${escapeHtml(segment).replace(/\n/g, '<br>')}</span>`;
    }
    if (cursor === text.length) html += '<span class="regex-debug-caret" aria-hidden="true"></span>';
    html += '</div>';
    refs.debugPreview.innerHTML = html;
  };

  const centerActiveTraceStep = (stepIndex) => {
    const activeNode = refs.debugTrace.querySelector(`[data-filtered-index="${stepIndex}"]`);
    if (activeNode) {
      activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };


  const updateStepper = () => {
    const { trace, currentStep } = debugState;
    const filteredSteps = getFilteredTraceSteps(trace);

    if (!trace || !trace.steps.length) {
      refs.debugStatus.textContent = trace?.error || 'Add a pattern and sample to start tracing.';
      refs.stepMeta.textContent = '0 / 0';
      refs.debugTrace.innerHTML = renderEmptyState('Trace steps appear here once the pattern can be expanded.');
      refs.debugPreview.innerHTML = renderEmptyState('Step through the trace to inspect the sample text.');
      refs.debugPattern.innerHTML = renderEmptyState('Inspect the pattern structure in sync with trace steps.');
      refs.debugSlider.max = 0;
      refs.debugSlider.value = 0;
      refs.debugSlider.disabled = true;
      return;
    }

    if (!filteredSteps.length) {
      refs.debugStatus.textContent = 'No steps match the active filters.';
      refs.stepMeta.textContent = '0 / 0';
      refs.debugTrace.innerHTML = renderEmptyState('Adjust filters to see trace steps.');
      refs.debugPreview.innerHTML = renderEmptyState('No visible steps.');
      refs.debugPattern.innerHTML = renderEmptyState('No visible steps.');
      refs.debugSlider.max = 0;
      refs.debugSlider.value = 0;
      refs.debugSlider.disabled = true;
      return;
    }

    const safeStep = Math.max(0, Math.min(filteredSteps.length - 1, currentStep));
    debugState.currentStep = safeStep;
    const step = filteredSteps[safeStep];
    refs.debugStatus.textContent = step.message;
    refs.stepMeta.textContent = `${safeStep + 1} / ${filteredSteps.length}`;
    refs.debugSlider.disabled = false;
    refs.debugSlider.max = filteredSteps.length - 1;
    refs.debugSlider.value = safeStep;

    refs.debugTrace.innerHTML = filteredSteps.map((s, index) => `
      <button type="button" class="regex-trace-step regex-trace-${escapeAttr(s.kind || 'step')}${index === safeStep ? ' active' : ''}${index > safeStep ? ' future' : ''}" data-filtered-index="${index}">
        <span class="regex-trace-index">${index + 1}</span>
        <div class="regex-trace-copy">
          <strong>${escapeHtml((s.kind || 'step').toUpperCase())}</strong>
          <span>${escapeHtml(s.message)}</span>
        </div>
      </button>
    `).join('');

    const activateTraceStep = (node) => {
      debugState.currentStep = parseInt(node.dataset.filteredIndex, 10);
      updateStepper();
    };

    refs.debugTrace.querySelectorAll('.regex-trace-step').forEach((node) => {
      node.addEventListener('click', () => {
        activateTraceStep(node);
      });
      node.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        activateTraceStep(node);
      });
    });

    renderDebugPreview(safeStep, filteredSteps);
    renderDebugPattern(safeStep, filteredSteps);
    centerActiveTraceStep(safeStep);
    refs.stepPrev.disabled = safeStep <= 0;
    refs.stepNext.disabled = safeStep >= filteredSteps.length - 1;
  };

  const update = () => {
    const pattern = refs.pattern.value;
    const flags = setFlagsValue(getFlagsValue());
    const text = refs.input.value;

    const analysis = analyzeRegex(pattern, flags, text);
    const matchCount = analysis.matches?.length || 0;
    if (!matchCount) currentMatchIndex = 0;
    if (currentMatchIndex >= matchCount) currentMatchIndex = Math.max(0, matchCount - 1);

    if (analysis.error) {
      refs.highlighted.innerHTML = renderEmptyState(analysis.error, 'danger');
      refs.results.innerHTML = renderEmptyState(analysis.error, 'danger');
      refs.status.textContent = 'Regex error';
      setTone(refs.status, 'danger');
      refs.matchMeta.textContent = '0 / 0';
    } else if (analysis.empty || (!pattern && !text)) {
      refs.highlighted.innerHTML = renderEmptyState('Define a pattern to inspect matches.');
      refs.results.innerHTML = renderEmptyState('Define a pattern to inspect matches.');
      refs.status.textContent = 'Ready.';
      setTone(refs.status, 'muted');
      refs.matchMeta.textContent = '0 / 0';
    } else {
      refs.highlighted.innerHTML = analysis.count ? analysis.highlightedText : renderEmptyState('No matches found.');
      refs.results.innerHTML = analysis.count
        ? analysis.matches.map((match, index) => `
            <div class="regex-match-card${index === currentMatchIndex ? ' active' : ''}" data-match-card="${index}">
              <div class="regex-match-card-head">
                <strong class="regex-match-chip">Match ${match.id}</strong>
                <span class="regex-match-range">${match.index}..${match.end}</span>
              </div>
              <div class="regex-match-value">${escapeHtml(match.value)}</div>
              ${match.groups.length || Object.keys(match.namedGroups).length ? `
                <div class="regex-match-groups">
                  ${match.groups.map((group, groupIndex) => `<span class="regex-group-chip">Group ${groupIndex + 1}: ${escapeHtml(group ?? 'null')}</span>`).join('')}
                  ${Object.entries(match.namedGroups).map(([name, value]) => `<span class="regex-group-chip regex-group-chip-named">${escapeHtml(name)}: ${escapeHtml(value ?? 'null')}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')
        : renderEmptyState('No matches found.');
      refs.status.textContent = analysis.count ? `${analysis.count} matches found.` : 'Valid pattern, no matches.';
      setTone(refs.status, analysis.count ? 'success' : 'muted');
      refs.matchMeta.textContent = analysis.count ? `${currentMatchIndex + 1} / ${analysis.count}` : '0 / 0';
    }

    const explanation = explainRegexPattern(pattern);
    refs.explanation.innerHTML = explanation.length
      ? explanation.map((entry) => `
          <div class="studio-output-card regex-summary-card">
            <span>${entry.label}</span>
            <strong>${entry.detail}</strong>
          </div>
        `).join('')
      : renderEmptyState('Pattern breakdown appears here.');

    const trace = debugRegexTrace(pattern, flags, text, { matchIndex: currentMatchIndex });
    debugState.trace = trace;
    if (debugState.currentStep >= trace.steps.length) {
      debugState.currentStep = Math.max(0, trace.steps.length - 1);
    }
    updateStepper();

    renderFlagMatrix(flags);

    const replacementSignature = getReplacementFieldEntries(pattern).map((entry) => entry.key).join('|');
    if (refs.replacementBuilder.dataset.signature !== replacementSignature) {
      renderReplacementBuilder(pattern);
    }
    const replacementDraft = readReplacementDraft(pattern);
    const replacementPreview = buildReplacementPreview(pattern, flags, text, replacementDraft);
    refs.replacementTemplate.textContent = `Template: ${replacementPreview.template || '$MATCH'}`;
    refs.replacementOutput.value = replacementPreview.output;
    refs.replacementMeta.textContent = replacementPreview.error
      ? replacementPreview.error
      : replacementPreview.count
        ? `${replacementPreview.count} replacements previewed.`
        : 'No replacements applied.';
    setTone(refs.replacementMeta, replacementPreview.error ? 'danger' : replacementPreview.count ? 'success' : 'muted');

    aiState.suggestion = aiState.suggestion || buildRegexHeuristicSuggestion(refs.aiDescription.value, refs.aiSample.value);
    renderAiSuggestion();

    // Re-bind results listeners
    refs.results.querySelectorAll('[data-match-card]').forEach((card) => {
      card.addEventListener('click', () => {
        currentMatchIndex = parseInt(card.dataset.matchCard, 10);
        update();
      });
    });

    persist({
      pattern,
      flags,
      input: text,
      replacement: replacementPreview.template,
      replacementFields,
      blockQuery: refs.blockSearch.value,
      selectedBlockId,
      aiModel: refs.aiModel.value,
      aiTemp: refs.aiTemp.value,
      aiMaxTokens: refs.aiMaxTokens.value,
      aiDescription: refs.aiDescription.value,
      aiSample: refs.aiSample.value,
      traceFilters: Array.from(getActiveTraceFilters())
    });
    renderSavedSnippets();
  };

  refs.traceFilterGroup.querySelectorAll('input').forEach((input) => {
    input.addEventListener('change', () => {
      updateStepper();
      update();
    });
  });

  refs.pattern.addEventListener('input', update);
  refs.input.addEventListener('input', update);
  refs.blockSearch.addEventListener('input', () => {
    persist({ blockQuery: refs.blockSearch.value });
    renderBlockGrid();
  });
  refs.blockCategory.addEventListener('change', () => {
    renderBlockGrid();
  });
  refs.aiDescription.addEventListener('input', () => {
    aiState.suggestion = buildRegexHeuristicSuggestion(refs.aiDescription.value, refs.aiSample.value);
    update();
  });
  refs.aiSample.addEventListener('input', () => {
    aiState.suggestion = buildRegexHeuristicSuggestion(refs.aiDescription.value, refs.aiSample.value);
    update();
  });
  refs.aiModel.addEventListener('change', () => {
    aiUse?.syncModelInfo();
    persist({ aiModel: refs.aiModel.value });
  });
  refs.aiTemp.addEventListener('input', () => {
    persist({ aiTemp: refs.aiTemp.value });
  });
  refs.aiMaxTokens.addEventListener('input', () => {
    persist({ aiMaxTokens: refs.aiMaxTokens.value });
  });

  refs.pattern.addEventListener('dragover', (event) => {
    event.preventDefault();
  });
  refs.pattern.addEventListener('drop', (event) => {
    event.preventDefault();
    const token = event.dataTransfer?.getData?.('text/plain');
    if (token) applyBlockToken(token);
  });

  refs.flags.addEventListener('click', () => {
    flagsModal?.open('tool');
  });

  container.querySelector('#btn-regex-open-preset-library').addEventListener('click', openPresetLibrary);
  container.querySelector('#btn-regex-open-breakdown').addEventListener('click', () => breakdownModal?.open('tool'));

  container.querySelector('#btn-copy-regex').addEventListener('click', () => {
    copyToClipboard(`/${refs.pattern.value}/${getFlagsValue()}`);
  });

  container.querySelector('#btn-copy-js').addEventListener('click', () => {
    copyToClipboard(`const regex = /${refs.pattern.value}/${getFlagsValue()};\nconst input = \`${refs.input.value.replace(/`/g, '\\`')}\`;\nconst matches = [...input.matchAll(regex)];`);
  });

  container.querySelector('#btn-save-snippet').addEventListener('click', async () => {
    try {
      const snippetName = `Snippet ${mergeRegexSnippets(toolState.getSnapshot().snippets).length + 1}`;
      const snippet = createRegexSnippet(snippetName, refs.pattern.value, getFlagsValue(), refs.input.value);
      const snippets = toolState.getSnapshot().snippets || [];
      await toolState.save({ snippets: [...snippets, snippet] }, { immediate: true });
      renderSavedSnippets();
      showToast('Regex snippet saved.', 'success');
    } catch (error) {
      showToast(error.message, 'danger');
    }
  });

  container.querySelector('#btn-prev-match').addEventListener('click', () => {
    const analysis = analyzeRegex(refs.pattern.value, getFlagsValue(), refs.input.value);
    moveMatchFocus(-1, analysis.count || 0);
    update();
  });

  container.querySelector('#btn-next-match').addEventListener('click', () => {
    const analysis = analyzeRegex(refs.pattern.value, getFlagsValue(), refs.input.value);
    moveMatchFocus(1, analysis.count || 0);
    update();
  });

  refs.stepPrev.addEventListener('click', () => {
    if (debugState.currentStep > 0) {
      debugState.currentStep -= 1;
      updateStepper();
    }
  });

  refs.stepNext.addEventListener('click', () => {
    const filteredSteps = getFilteredTraceSteps();
    if (debugState.currentStep < filteredSteps.length - 1) {
      debugState.currentStep += 1;
      updateStepper();
    }
  });

  refs.debugSlider.addEventListener('input', () => {
    debugState.currentStep = parseInt(refs.debugSlider.value, 10);
    updateStepper();
  });

  container.querySelector('#btn-regex-ai-heuristic').addEventListener('click', () => {
    aiState.suggestion = buildRegexHeuristicSuggestion(refs.aiDescription.value, refs.aiSample.value);
    aiState.streamed = '';
    updateAiStatus('Quick draft updated.', 'success');
    renderAiSuggestion();
  });

  container.querySelector('#btn-regex-ai-apply').addEventListener('click', () => {
    const suggestion = aiState.suggestion;
    if (!suggestion?.pattern) return;
    refs.pattern.value = suggestion.pattern;
    setFlagsValue(sanitizeRegexFlags(suggestion.flags || 'g'));
    if (!refs.input.value.trim() && suggestion.sample) refs.input.value = suggestion.sample;
    updateAiStatus('Draft applied to pattern and flags.', 'success');
    update();
  });

  container.querySelector('#btn-regex-ai-run').addEventListener('click', async () => {
    if (aiState.isGenerating) {
      aiUse?.stop();
      return;
    }
    if (!await ensureAiModel()) return;
    aiState.isGenerating = true;
    aiState.streamed = '';
    updateAiStatus('Starting local pattern draft...', 'info');
    renderAiSuggestion('');
    const modelKey = refs.aiModel.value || DEFAULT_STATE.aiModel;
    const temp = parseFloat(refs.aiTemp.value) || 0.1;
    const maxTokens = parseInt(refs.aiMaxTokens.value, 10) || 48;
    const payload = buildRegexAiRequestPayload({
      model: MODEL_REGISTRY[modelKey],
      description: refs.aiDescription.value,
      sample: refs.aiSample.value,
      temp,
      maxTokens
    });
    aiUse.run(payload, {
      title: 'Building pattern...',
      detail: payload.isRaw ? 'Streaming short code-style completion.' : 'Streaming short JSON draft.'
    });
  });

  container.querySelector('#btn-regex-ai-setup').addEventListener('click', () => {
    aiUse?.toggleConfig();
  });

  container.querySelector('#btn-regex-ai-cancel').addEventListener('click', () => {
    aiUse?.closeConfig();
  });

  container.querySelector('#btn-regex-ai-activate').addEventListener('click', async () => {
    if (!await ensureAiModel()) return;
    updateAiStatus('Engine activated for regex drafts.', 'success');
    aiUse?.closeConfig();
  });

  container.querySelector('#btn-regex-ai-clear-console').addEventListener('click', () => {
    aiUse?.clearConsole();
  });

  container.querySelectorAll('[data-regex-ai-view]').forEach((tab) => {
    tab.addEventListener('click', () => {
      applyAiView(tab.dataset.regexAiView);
    });
  });

  container.querySelectorAll('[data-regex-tab]').forEach((tab) => {
    tab.addEventListener('click', () => applyTab(tab.dataset.regexTab));
  });

  renderCreateGrid();
  renderSavedSnippets();
  renderBlockGrid();
  renderAiSuggestion();
  applyAiView(aiState.activeView);
  updateEngineTag();
  applyTab(initialState.activeTab || 'test');
  update();
}

export function unmount() {
  modalControllers.forEach((controller) => controller.destroy());
  modalControllers = [];
  toolState?.dispose();
  toolState = null;
  aiUse?.destroy();
  aiUse = null;
  aiState = null;
  if (container) container.remove();
  container = null;
  currentMatchIndex = 0;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

function resolveDebugSegmentState(ranges, start, end) {
  let state = 'idle';
  for (const range of ranges || []) {
    if (start >= range.start && end <= range.end) {
      if (range.state === 'full') return 'full';
      if (range.state === 'fail') state = 'fail';
      else if (range.state === 'attempt' && state !== 'fail') state = 'attempt';
    }
  }
  return state;
}

import { copyToClipboard, downloadFile } from '../ui/ui-utils.js';
import { createEditor, createDiffEditor } from '../ui/ui-monaco.js';
import { MODEL_METADATA } from '../core/ai.js';
import { createAiSession } from '../core/ai-session.js';
import { registerShortcuts } from '../core/shortcuts.js';
import { createJobProgress } from '../ui/job-progress.js';
import { createModalController } from '../ui/modal.js';
import { globalStore } from '../core/store.js';
import { createPersistedToolState } from '../utils/tool-state.js';
import { formatWebCode, formatSql, minifyJs, obfuscateJs } from '../utils/code-studio.js';

let container = null;
let editor = null;
let monacoInst = null;
let aiSession = null;
let isGenerating = false;
let isEngineLoading = false;
let currentActiveModel = null;
let removeShortcuts = null;
let progressController = null;
let diffEditor = null;
let settingsModalController = null;
let formatModalController = null;
let optimizeModalController = null;
let toolState = null;
let activeMode = 'editor';
let activeTab = 'chat';
let inlineCompletionDisposables = [];

const INLINE_COMPLETION_LANGUAGES = ['javascript', 'typescript', 'python', 'rust', 'go', 'sql', 'html', 'css'];

const DEFAULT_STATE = {
  code: 'function hello() {\n  return "ready";\n}',
  language: 'javascript',
  aiModel: 'code-fast',
  aiTemp: 0.2,
  aiMaxTokens: 1024,
  systemPrompt: "You are a Senior Staff Engineer. Output only code or technical logic without conversational filler. Use <think> tags if reasoning."
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function compactWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function encodeCodePayload(value) {
  return btoa(unescape(encodeURIComponent(String(value ?? ''))));
}

function decodeCodePayload(value) {
  return decodeURIComponent(escape(atob(String(value ?? ''))));
}

function buildInlineCompletion({ language, linePrefix, lineSuffix }) {
  const prefix = String(linePrefix ?? '');
  if (String(lineSuffix ?? '').trim()) return '';
  const trimmed = prefix.trimEnd();
  const lower = String(language || '').toLowerCase();
  if (!trimmed) return '';
  if ((lower === 'javascript' || lower === 'typescript') && /(?:^|\s)console\.$/.test(trimmed)) return 'log()';
  if ((lower === 'javascript' || lower === 'typescript') && /\bawait\s+$/.test(prefix)) return 'Promise.all([])';
  if ((lower === 'javascript' || lower === 'typescript') && /\b(if|while)\s*\([^)]*$/.test(trimmed)) return ') {\n  \n}';
  if ((lower === 'javascript' || lower === 'typescript') && /\bfor\s*\([^)]*$/.test(trimmed)) return 'const item of items) {\n  \n}';
  if (lower === 'python' && /^\s*def\s+\w+\([^)]*$/.test(trimmed)) return '):\n    pass';
  if (lower === 'python' && /^\s*(if|elif|for|while|with|class)\b.*[^:]$/.test(trimmed)) return ':\n    pass';
  if (lower === 'rust' && /\bfn\s+\w+\([^)]*$/.test(trimmed)) return ') {\n    \n}';
  if (lower === 'go' && /\bfunc\s+\w+\([^)]*$/.test(trimmed)) return ') {\n\t\n}';
  if (lower === 'sql' && /^select$/i.test(trimmed)) return ' *\nfrom ';
  if (lower === 'html' && /<$/.test(trimmed)) return 'div></div>';
  if (lower === 'css' && /display:\s*$/i.test(trimmed)) return 'flex;';
  return '';
}

function appendConsoleEntry(refs, payload = {}) {
  if (!refs?.consoleLog) return;
  const entry = document.createElement('div');
  const promptChars = Number(payload.promptChars || 0);
  const tokenCount = Number(payload.tokenCount || 0);
  const modelId = payload.modelId || currentActiveModel || 'not loaded';
  const rows = [
    ['request', payload.requestId],
    ['model', modelId],
    ['prompt chars', promptChars || ''],
    ['tokens', tokenCount || ''],
    ['detail', payload.detail],
    ['params', payload.params ? compactWhitespace(JSON.stringify(payload.params)) : '']
  ].filter(([, value]) => value !== undefined && value !== null && value !== '');
  entry.className = 'console-entry';
  entry.innerHTML = `
    <div class="console-entry-head">
      <span class="time">[${new Date().toLocaleTimeString()}]</span>
      <span class="type">${escapeHtml(payload.type || 'event')}</span>
    </div>
    ${rows.map(([label, value]) => `<div class="console-entry-row"><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>`).join('')}
  `;
  refs.consoleLog.appendChild(entry);
  refs.consoleLog.scrollTop = refs.consoleLog.scrollHeight;
}

export async function mount(parent, options = {}) {
  toolState = createPersistedToolState(globalStore, 'code-editor', DEFAULT_STATE, { debounceMs: 120 });
  const initialState = { ...DEFAULT_STATE, ...toolState.getSnapshot() };

  activeMode = ['format', 'optimize'].includes(options.mode) ? options.mode : 'editor';
  
  container = document.createElement('div');

  container.className = 'tool-code-studio';
  container.innerHTML = `
    <div class="studio-layout">
      <div class="studio-main">
        <div class="studio-toolbar">
          <div class="studio-toolbar-group">
            <select id="studio-lang" class="studio-select">
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="rust">Rust</option>
              <option value="go">Go</option>
              <option value="sql">SQL</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
            </select>
            <div class="studio-divider"></div>
            <button class="btn-secondary studio-modal-tool" data-open-studio-modal="format">Format</button>
            <button class="btn-secondary studio-modal-tool" data-open-studio-modal="optimize">Optimize</button>
            <button class="btn-secondary studio-modal-tool" id="btn-studio-settings" data-open-studio-modal="engine">Engine</button>
          </div>
          <div class="studio-toolbar-group">
            <span id="ai-activity-pill" class="ai-activity-pill" data-busy="false" data-tone="neutral">
              <span class="ai-activity-dot"></span>
              <span id="ai-activity-text">Engine idle</span>
            </span>
            <button id="btn-studio-complete" class="btn-secondary">Complete</button>
            <button id="btn-studio-accept" class="btn-primary hidden">Accept Changes</button>
            <button id="btn-studio-discard" class="btn-secondary hidden">Discard</button>
            <button id="btn-studio-copy" class="btn-secondary">Copy</button>
            <button id="btn-studio-export" class="btn-secondary">Export</button>
          </div>
        </div>

        <div class="studio-workspace">
          <div id="ai-progress-host" class="studio-progress"></div>
          <div id="ai-thinking-zone" class="studio-thinking hidden"></div>
          
          <div id="editor-container" class="studio-editor-host"></div>
          <div id="diff-container" class="studio-editor-host hidden"></div>
        </div>

        <div class="studio-footer">
          <div class="studio-footer-left">
            <span id="studio-status">Ready.</span>
          </div>
          <div class="studio-footer-right">
            <span id="ai-engine-status" class="engine-tag">ENGINE: OFFLINE</span>
          </div>
        </div>
      </div>

      <div class="studio-inspector">
        <div class="inspector-tabs">
          <button class="inspector-tab active" data-tab="chat">AI Assistant</button>
          <button class="inspector-tab" data-tab="console">Console</button>
        </div>
        
        <div id="inspector-chat" class="inspector-content">
          <div id="chat-history" class="chat-history">
            <div class="chat-placeholder">
              <strong>Context-Aware Synthesis</strong>
              <p>Ask for refactors, logic fixes, or structural improvements.</p>
            </div>
          </div>
          <div class="chat-input-shell">
            <textarea id="chat-input" placeholder="How can I help with this code?"></textarea>
            <button id="btn-chat-send">Generate</button>
          </div>
        </div>

        <div id="inspector-console" class="inspector-content hidden">
          <div id="ai-console-log" class="console-log"></div>
          <button id="btn-clear-console" class="btn-secondary console-clear">Clear Log</button>
        </div>
      </div>

      <div id="studio-format-overlay" class="studio-overlay hidden">
        <div class="overlay-card code-tool-modal-card">
          <div class="overlay-head">
            <h3>Format</h3>
            <button class="btn-close-overlay">×</button>
          </div>
          <div class="settings-grid">
            <div class="form-group">
              <label>Parser</label>
              <select id="fmt-parser" class="studio-select">
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="babel">JS/Babel</option>
                <option value="sql">SQL</option>
              </select>
            </div>
            <div class="form-group">
              <label>Indent</label>
              <select id="fmt-indent" class="studio-select">
                <option value="2">2 Spaces</option>
                <option value="4">4 Spaces</option>
              </select>
            </div>
          </div>
          <div class="overlay-actions">
            <button id="btn-format-apply">Format Code</button>
          </div>
        </div>
      </div>

      <div id="studio-optimize-overlay" class="studio-overlay hidden">
        <div class="overlay-card code-tool-modal-card">
          <div class="overlay-head">
            <h3>Optimize</h3>
            <button class="btn-close-overlay">×</button>
          </div>
          <div class="settings-grid">
            <label class="studio-toggle"><input type="checkbox" id="opt-mangle" checked> Mangle</label>
            <label class="studio-toggle"><input type="checkbox" id="opt-compress" checked> Compress</label>
            <label class="studio-toggle"><input type="checkbox" id="opt-obfuscate"> Obfuscate</label>
          </div>
          <div class="overlay-actions">
            <button id="btn-optimize-apply">Apply</button>
          </div>
        </div>
      </div>

      <div id="studio-settings-overlay" class="studio-overlay hidden">
        <div class="overlay-card">
          <div class="overlay-head">
            <h3>Engine Configuration</h3>
            <button class="btn-close-overlay">×</button>
          </div>
          <div class="settings-grid">
            <div class="form-group">
              <label>Model Tier</label>
              <select id="ai-group-select">
                <option value="code-fast">Fast Autocomplete (FIM)</option>
                <option value="code-heavy">Logic Synthesis (DeepSeek-R1)</option>
                <option value="gemma-compact">Gemma 3 1B</option>
                <option value="gemma-edge">Gemma 4 E2B Q2</option>
              </select>
            </div>
            <div class="form-group">
              <label>Temperature (${initialState.aiTemp})</label>
              <input type="range" id="ai-temp" min="0" max="1" step="0.1" value="${initialState.aiTemp}">
            </div>
            <div class="form-group">
              <label>Max Tokens</label>
              <input type="number" id="ai-max-tokens" value="${initialState.aiMaxTokens}">
            </div>
            <div class="form-group">
              <label>System Role</label>
              <textarea id="ai-system-prompt" class="code-ai-system-prompt">${initialState.systemPrompt}</textarea>
            </div>
          </div>
          <div class="overlay-actions">
             <button id="btn-ai-activate">Save & Activate</button>
          </div>
        </div>
      </div>
    </div>
  `;

  parent.appendChild(container);

  const { editor: inst, monaco } = await createEditor(container.querySelector('#editor-container'), {
    value: initialState.code,
    language: initialState.language
  });
  editor = inst;
  monacoInst = monaco;

  const diffSetup = await createDiffEditor(container.querySelector('#diff-container'));
  diffEditor = diffSetup.diffEditor;

  const refs = {
    lang: container.querySelector('#studio-lang'),
    status: container.querySelector('#studio-status'),
    engineStatus: container.querySelector('#ai-engine-status'),
    activityPill: container.querySelector('#ai-activity-pill'),
    activityText: container.querySelector('#ai-activity-text'),
    progressHost: container.querySelector('#ai-progress-host'),
    thinkingZone: container.querySelector('#ai-thinking-zone'),
    chatHistory: container.querySelector('#chat-history'),
    chatInput: container.querySelector('#chat-input'),
    consoleLog: container.querySelector('#ai-console-log'),
    settingsOverlay: container.querySelector('#studio-settings-overlay'),
    formatOverlay: container.querySelector('#studio-format-overlay'),
    optimizeOverlay: container.querySelector('#studio-optimize-overlay'),
    aiGroupSelect: container.querySelector('#ai-group-select'),
    aiTemp: container.querySelector('#ai-temp'),
    aiMaxTokens: container.querySelector('#ai-max-tokens'),
    aiSystemPrompt: container.querySelector('#ai-system-prompt'),
    editorContainer: container.querySelector('#editor-container'),
    diffContainer: container.querySelector('#diff-container'),
    fmtParser: container.querySelector('#fmt-parser'),
    fmtIndent: container.querySelector('#fmt-indent'),
    optMangle: container.querySelector('#opt-mangle'),
    optCompress: container.querySelector('#opt-compress'),
    optObfuscate: container.querySelector('#opt-obfuscate'),
    btnAccept: container.querySelector('#btn-studio-accept'),
    btnDiscard: container.querySelector('#btn-studio-discard'),
    btnFormatApply: container.querySelector('#btn-format-apply'),
    btnOptimizeApply: container.querySelector('#btn-optimize-apply'),
    btnComplete: container.querySelector('#btn-studio-complete'),
    btnChatSend: container.querySelector('#btn-chat-send'),
    btnStudioCopy: container.querySelector('#btn-studio-copy'),
    btnStudioExport: container.querySelector('#btn-studio-export'),
    btnAiActivate: container.querySelector('#btn-ai-activate')
  };

  settingsModalController = createModalController(refs.settingsOverlay, {
    closeSelectors: ['.btn-close-overlay']
  });
  formatModalController = createModalController(refs.formatOverlay, {
    closeSelectors: ['.btn-close-overlay']
  });
  optimizeModalController = createModalController(refs.optimizeOverlay, {
    closeSelectors: ['.btn-close-overlay']
  });

  refs.lang.value = initialState.language;
  refs.aiGroupSelect.value = initialState.aiModel;
  refs.aiTemp.value = String(initialState.aiTemp);
  refs.aiMaxTokens.value = String(initialState.aiMaxTokens);
  refs.aiSystemPrompt.value = initialState.systemPrompt;
  if (options.formatParser) refs.fmtParser.value = options.formatParser;
  if (options.optimizeObfuscate) refs.optObfuscate.checked = true;

  progressController = createJobProgress(refs.progressHost, {
    stopLabel: 'Abort',
    onStop() { aiSession?.stop(); }
  });

  const persist = (patch) => {
    toolState.save(patch).catch(() => {});
  };

  editor.onDidChangeModelContent?.(() => {
    persist({ code: editor.getValue() });
  });

  const setStatus = (msg, tone = 'neutral') => {
    refs.status.textContent = msg;
    refs.status.dataset.tone = tone;
  };

  const setAiActivity = (message, { busy = false, tone = 'neutral' } = {}) => {
    refs.activityText.textContent = message;
    refs.activityPill.dataset.busy = busy ? 'true' : 'false';
    refs.activityPill.dataset.tone = tone;
    refs.btnComplete.classList.toggle('is-busy', busy && isGenerating);
    refs.btnChatSend.classList.toggle('is-busy', busy && isGenerating);
    refs.btnAiActivate.classList.toggle('is-busy', busy && isEngineLoading);
    refs.btnComplete.disabled = Boolean(isGenerating || isEngineLoading);
    refs.btnChatSend.disabled = Boolean(isGenerating || isEngineLoading);
    refs.btnAiActivate.disabled = Boolean(isEngineLoading);
  };

  const logAI = (payload) => {
    appendConsoleEntry(refs, {
      type: payload.isRaw ? 'raw request' : 'request',
      requestId: payload.requestId,
      modelId: currentActiveModel || refs.aiGroupSelect.value,
      promptChars: payload.prompt?.length || 0,
      params: payload.params
    });
  };

  const initAiSession = () => {
    if (aiSession) return;
    aiSession = createAiSession();
    aiSession.subscribe(({ type, payload }) => {
      if (type === 'progress') {
        progressController.update({ title: 'Loading Engine...', progress: payload.progress, busy: true });
        setStatus(`Loading model ${Math.round(Number(payload.progress || 0))}%`, 'info');
        setAiActivity(`Loading ${currentActiveModel || refs.aiGroupSelect.value}: ${Math.round(Number(payload.progress || 0))}%`, { busy: true, tone: 'info' });
        appendConsoleEntry(refs, {
          type: 'load progress',
          requestId: 'engine',
          modelId: currentActiveModel || refs.aiGroupSelect.value,
          detail: `${Math.round(Number(payload.progress || 0))}%`
        });
      } else if (type === 'status' && payload.status === 'ready') {
        refs.engineStatus.textContent = `ENGINE: READY`;
        isEngineLoading = false;
        setStatus('Engine ready.', 'success');
        setAiActivity(`${currentActiveModel || refs.aiGroupSelect.value} ready`, { tone: 'success' });
        progressController.update({ title: 'Engine ready', tone: 'success', autoResetMs: 1800 });
        appendConsoleEntry(refs, {
          type: 'engine ready',
          requestId: 'engine',
          modelId: currentActiveModel || refs.aiGroupSelect.value
        });
      } else if (type === 'status' && payload.status === 'aborted') {
        isGenerating = false;
        isEngineLoading = false;
        setStatus('Stopped.', 'neutral');
        setAiActivity('Stopped', { tone: 'neutral' });
        progressController.update({ title: 'Stopped', autoResetMs: 900 });
        appendConsoleEntry(refs, {
          type: 'stopped',
          requestId: 'engine',
          modelId: currentActiveModel || refs.aiGroupSelect.value
        });
      } else if (type === 'thinking') {
        if (payload.state === 'start') {
          refs.thinkingZone.classList.remove('hidden');
          refs.thinkingZone.textContent = '';
          appendConsoleEntry(refs, {
            type: 'thinking',
            requestId: 'reasoning',
            modelId: currentActiveModel || refs.aiGroupSelect.value,
            detail: 'started'
          });
        }
      } else if (type === 'thinking-token') {
        refs.thinkingZone.textContent += payload.text;
        refs.thinkingZone.scrollTop = refs.thinkingZone.scrollHeight;
      } else if (type === 'stream') {
        handleStream(payload);
      } else if (type === 'complete') {
        handleComplete(payload.result, payload.requestId);
      } else if (type === 'error') {
        isGenerating = false;
        isEngineLoading = false;
        setStatus(payload.message || 'Engine error.', 'danger');
        setAiActivity('Engine error', { tone: 'danger' });
        progressController.update({ title: 'Engine error', detail: payload.message, tone: 'danger' });
        appendConsoleEntry(refs, {
          type: 'error',
          requestId: payload.requestId || 'engine',
          modelId: currentActiveModel || refs.aiGroupSelect.value,
          detail: payload.message
        });
      }
    });
  };

  let activeChatTarget = null;
  let currentGenCodeDelta = "";

  const handleStream = ({ text, requestId }) => {
    if (requestId === 'chat' && activeChatTarget) {
      activeChatTarget.innerHTML = renderMarkdown(text);
      refs.chatHistory.scrollTop = refs.chatHistory.scrollHeight;
      setStatus(`Assistant streaming ${String(text || '').length} chars`, 'info');
      setAiActivity(`Chat ${String(text || '').length} chars`, { busy: true, tone: 'info' });
      progressController.update({
        title: 'Generating reply',
        detail: `${String(text || '').length} chars received`,
        busy: true,
        cancellable: true
      });
      return;
    }
    if (requestId === 'autocomplete') {
      const delta = text.slice(currentGenCodeDelta.length);
      if (delta) {
        const pos = editor.getPosition();
        editor.executeEdits("ai", [{
          range: new monacoInst.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
          text: delta,
          forceMoveMarkers: true
        }]);
        currentGenCodeDelta += delta;
        setStatus(`Autocomplete streaming ${currentGenCodeDelta.length} chars`, 'info');
        setAiActivity(`Autocomplete ${currentGenCodeDelta.length} chars`, { busy: true, tone: 'info' });
        progressController.update({
          title: 'Autocomplete running',
          detail: `${currentGenCodeDelta.length} chars inserted`,
          busy: true,
          cancellable: true
        });
      }
    }
    if (text) {
      appendConsoleEntry(refs, {
        type: 'stream',
        requestId,
        modelId: currentActiveModel || refs.aiGroupSelect.value,
        tokenCount: String(text).split(/\s+/).filter(Boolean).length
      });
    }
  };

  const handleComplete = (result, requestId) => {
    isGenerating = false;
    refs.thinkingZone.classList.add('hidden');
    progressController.update({ title: 'Complete', tone: 'success', autoResetMs: 1600 });
    setAiActivity(`${currentActiveModel || refs.aiGroupSelect.value} complete`, { tone: 'success' });
    if (requestId === 'chat' && activeChatTarget) {
      activeChatTarget.innerHTML = renderMarkdown(result);
      setStatus('Reply complete.', 'success');
    }
    if (requestId === 'autocomplete') {
      setStatus('Completion inserted.', 'success');
      setTimeout(() => {
        const action = editor.getAction?.('editor.action.formatDocument');
        action?.run?.();
      }, 100);
    }
    appendConsoleEntry(refs, {
      type: 'complete',
      requestId,
      modelId: currentActiveModel || refs.aiGroupSelect.value,
      tokenCount: String(result || '').split(/\s+/).filter(Boolean).length,
      detail: `${String(result || '').length} chars`
    });
  };

  const renderMarkdown = (text) => {
    const escaped = escapeHtml(text);
    return escaped.replace(/```([a-z]*)\n([\s\S]*?)```/gi, (match, lang, code) => `
      <div class="chat-code-block">
        <div class="chat-code-head"><span>${lang || 'code'}</span> <button data-code="${encodeCodePayload(code)}">Copy</button></div>
        <pre><code>${code}</code></pre>
      </div>
    `).replace(/\n/g, '<br>');
  };

  const ensureEngine = async (type) => {
    if (currentActiveModel === type && !isEngineLoading) return true;
    isEngineLoading = true;
    const modelProfile = MODEL_METADATA[type] || MODEL_METADATA[DEFAULT_STATE.aiModel];
    const model = modelProfile.primary;
    setStatus(`Loading ${type}...`, 'info');
    setAiActivity(`Loading ${type}`, { busy: true, tone: 'info' });
    progressController.update({ title: 'Initializing Engine...', detail: model.id, busy: true });
    appendConsoleEntry(refs, {
      type: 'load request',
      requestId: 'engine',
      modelId: model.id,
      detail: model.url
    });
    try {
      await aiSession.loadModel(model.url);
      currentActiveModel = type;
      return true;
    } catch (err) {
      isEngineLoading = false;
      setStatus(err?.message || 'Model load failed.', 'danger');
      setAiActivity('Load failed', { tone: 'danger' });
      appendConsoleEntry(refs, {
        type: 'load failed',
        requestId: 'engine',
        modelId: model.id,
        detail: err?.message || 'Model load failed'
      });
      return false;
    }
  };

  const runChat = async () => {
    const text = refs.chatInput.value.trim();
    if (!text || isGenerating) return;
    setStatus('Preparing assistant...', 'info');
    if (!await ensureEngine(refs.aiGroupSelect.value || 'code-heavy')) return;
    
    refs.chatInput.value = '';
    isGenerating = true;
    setStatus('Generating reply...', 'info');
    setAiActivity(`Chat running on ${refs.aiGroupSelect.value}`, { busy: true, tone: 'info' });
    progressController.update({ title: 'Generating reply', detail: refs.aiGroupSelect.value, busy: true, cancellable: true });
    const code = editor.getValue();
    const finalPrompt = `CONTEXT CODE:\n\`\`\`\n${code}\n\`\`\`\n\nUSER REQUEST: ${text}`;

    const msg = document.createElement('div');
    msg.className = 'chat-msg user';
    msg.innerHTML = `<strong>You</strong><p>${escapeHtml(text)}</p>`;
    refs.chatHistory.appendChild(msg);

    const aiMsg = document.createElement('div');
    aiMsg.className = 'chat-msg ai';
    aiMsg.innerHTML = `<strong>Assistant</strong><div class="ai-content">...</div>`;
    refs.chatHistory.appendChild(aiMsg);
    activeChatTarget = aiMsg.querySelector('.ai-content');
    refs.chatHistory.scrollTop = refs.chatHistory.scrollHeight;

    const payload = {
      requestId: 'chat',
      prompt: finalPrompt,
      params: { 
        temp: parseFloat(refs.aiTemp.value),
        n_predict: parseInt(refs.aiMaxTokens.value),
        systemPrompt: refs.aiSystemPrompt.value
      }
    };
    logAI(payload);
    aiSession.generate(payload);
  };

  const runAutocomplete = async () => {
    if (isGenerating) return;
    setStatus('Preparing autocomplete...', 'info');
    if (!await ensureEngine('code-fast')) return;
    isGenerating = true;
    currentGenCodeDelta = "";
    setStatus('Autocomplete running...', 'info');
    setAiActivity('Autocomplete running on code-fast', { busy: true, tone: 'info' });
    const model = editor.getModel();
    const pos = editor.getPosition();
    const prefix = model.getValueInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: pos.lineNumber, endColumn: pos.column });
    const suffix = model.getValueInRange({ startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: model.getLineCount(), endColumn: 1000 });
    
    const payload = {
      requestId: 'autocomplete',
      isRaw: true,
      prompt: `<|fim_prefix|>${prefix}<|fim_suffix|>${suffix}<|fim_middle|>`,
      params: { n_predict: 64, temp: 0.1 }
    };
    logAI(payload);
    progressController.update({
      title: 'Autocomplete running',
      detail: `${prefix.length} prefix chars, ${suffix.length} suffix chars`,
      busy: true,
      cancellable: true
    });
    aiSession.generate(payload);
  };

  const setupInlineCompletions = () => {
    inlineCompletionDisposables.forEach((entry) => entry?.dispose?.());
    inlineCompletionDisposables = [];
    if (!monacoInst?.languages?.registerInlineCompletionsProvider) return;
    inlineCompletionDisposables = INLINE_COMPLETION_LANGUAGES.map((language) => (
      monacoInst.languages.registerInlineCompletionsProvider(language, {
        provideInlineCompletions(model, position) {
          const lineNumber = position.lineNumber;
          const maxColumn = typeof model.getLineMaxColumn === 'function' ? model.getLineMaxColumn(lineNumber) : 1000;
          const linePrefix = model.getValueInRange({
            startLineNumber: lineNumber,
            startColumn: 1,
            endLineNumber: lineNumber,
            endColumn: position.column
          });
          const lineSuffix = model.getValueInRange({
            startLineNumber: lineNumber,
            startColumn: position.column,
            endLineNumber: lineNumber,
            endColumn: maxColumn
          });
          const insertText = buildInlineCompletion({ language, linePrefix, lineSuffix });
          if (!insertText) return { items: [] };
          return {
            items: [{
              insertText,
              range: new monacoInst.Range(lineNumber, position.column, lineNumber, position.column)
            }]
          };
        },
        freeInlineCompletions() {}
      })
    ));
  };

  const runFormatTransform = async () => {
    const source = editor.getValue();
    if (!source.trim()) return;
    
    try {
      activeMode = 'format';
      formatModalController.close('apply');
      setStatus('Formatting...', 'info');
      const parser = refs.fmtParser.value;
      const result = parser === 'sql'
        ? await formatSql(source, { indent: refs.fmtIndent.value })
        : await formatWebCode(source, { 
          parser: parser === 'javascript' ? 'babel' : parser,
          tabWidth: refs.fmtIndent.value 
        });
      if (result) showDiff(source, result);
    } catch (err) {
      setStatus(err.message, 'danger');
    }
  };

  const runOptimizeTransform = async () => {
    const source = editor.getValue();
    if (!source.trim()) return;

    try {
      activeMode = 'optimize';
      optimizeModalController.close('apply');
      setStatus('Optimizing...', 'info');
      const result = refs.optObfuscate.checked
        ? await obfuscateJs(source, { compact: true })
        : await minifyJs(source, {
          mangle: refs.optMangle.checked,
          compress: refs.optCompress.checked
        });
      if (result) showDiff(source, result);
    } catch (err) {
      setStatus(err.message, 'danger');
    }
  };

  const showDiff = (original, modified) => {
    const originalModel = monacoInst.editor.createModel(original, refs.lang.value);
    const modifiedModel = monacoInst.editor.createModel(modified, refs.lang.value);
    diffEditor.setModel({ original: originalModel, modified: modifiedModel });
    
    refs.editorContainer.classList.add('hidden');
    refs.diffContainer.classList.remove('hidden');
    
    refs.btnAccept.classList.remove('hidden');
    refs.btnDiscard.classList.remove('hidden');
    refs.btnAccept.onclick = () => {
      editor.setValue(modified);
      hideDiff();
    };
    refs.btnDiscard.onclick = hideDiff;
  };

  const hideDiff = () => {
    refs.editorContainer.classList.remove('hidden');
    refs.diffContainer.classList.add('hidden');
    refs.btnAccept.classList.add('hidden');
    refs.btnDiscard.classList.add('hidden');
    refs.btnAccept.onclick = null;
    refs.btnDiscard.onclick = null;
    setStatus('Ready.', 'success');
  };

  container.querySelectorAll('.inspector-tab').forEach(tab => {
    tab.onclick = () => {
      activeTab = tab.dataset.tab;
      container.querySelectorAll('.inspector-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      container.querySelectorAll('.inspector-content').forEach(c => c.classList.add('hidden'));
      container.querySelector(`#inspector-${activeTab}`).classList.remove('hidden');
    };
  });

  container.querySelector('[data-open-studio-modal="format"]').onclick = () => formatModalController.open('toolbar');
  container.querySelector('[data-open-studio-modal="optimize"]').onclick = () => optimizeModalController.open('toolbar');
  container.querySelector('[data-open-studio-modal="engine"]').onclick = () => settingsModalController.open('toolbar');
  refs.btnFormatApply.onclick = runFormatTransform;
  refs.btnOptimizeApply.onclick = runOptimizeTransform;
  refs.btnComplete.onclick = runAutocomplete;
  refs.btnChatSend.onclick = runChat;
  refs.chatInput.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runChat(); } };
  container.querySelector('#btn-clear-console').onclick = () => { refs.consoleLog.textContent = ''; };
  refs.chatHistory.addEventListener('click', (event) => {
    const button = event.target?.closest?.('[data-code]');
    if (!button) return;
    copyToClipboard(decodeCodePayload(button.dataset.code), 'Code copied.');
  });
  
  refs.btnAiActivate.onclick = async () => {
    const selected = refs.aiGroupSelect.value;
    persist({ aiModel: selected, aiTemp: parseFloat(refs.aiTemp.value), aiMaxTokens: parseInt(refs.aiMaxTokens.value), systemPrompt: refs.aiSystemPrompt.value });
    settingsModalController.close('activate');
    await ensureEngine(selected);
  };

  refs.lang.onchange = () => {
    monacoInst.editor.setModelLanguage(editor.getModel(), refs.lang.value);
    persist({ language: refs.lang.value });
  };

  refs.btnStudioCopy.onclick = () => copyToClipboard(editor.getValue());
  refs.btnStudioExport.onclick = () => downloadFile(editor.getValue(), `source.${refs.lang.value}`);

  editor.onKeyDown((e) => {
    if (e.keyCode === monacoInst.KeyCode.Tab && currentActiveModel === 'code-fast') {
      const line = editor.getModel().getLineContent(editor.getPosition().lineNumber).trim();
      if (line.startsWith('//') || line.startsWith('#')) { e.preventDefault(); runAutocomplete(); }
    }
  });

  removeShortcuts = registerShortcuts([
    { key: '/', altKey: true, allowInEditable: true, handler: runAutocomplete },
    { key: 'Escape', allowInEditable: true, handler: () => aiSession?.stop() }
  ]);

  initAiSession();
  setupInlineCompletions();
  setAiActivity('Engine idle');
  if (activeMode === 'format') formatModalController.open('route');
  if (activeMode === 'optimize') optimizeModalController.open('route');
}

export function unmount() {
  removeShortcuts?.();
  inlineCompletionDisposables.forEach((entry) => entry?.dispose?.());
  inlineCompletionDisposables = [];
  if (aiSession) aiSession.dispose();
  if (editor) editor.dispose();
  if (diffEditor) diffEditor.dispose();
  if (container) container.remove();
  settingsModalController?.destroy();
  formatModalController?.destroy();
  optimizeModalController?.destroy();
  progressController?.destroy();
  toolState?.dispose();
  container = null;
  editor = null;
  monacoInst = null;
  aiSession = null;
  isGenerating = false;
  isEngineLoading = false;
  currentActiveModel = null;
  removeShortcuts = null;
  progressController = null;
  diffEditor = null;
  settingsModalController = null;
  formatModalController = null;
  optimizeModalController = null;
  toolState = null;
  activeMode = 'editor';
  activeTab = 'chat';
}

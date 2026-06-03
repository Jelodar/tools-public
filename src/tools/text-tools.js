import { copyToClipboard } from '../ui/ui-utils.js';
import { createDiffEditor } from '../ui/ui-monaco.js';
import { MODEL_REGISTRY, DEFAULT_MODELS } from '../core/ai.js';
import { createAiSession } from '../core/ai-session.js';
import { createJobProgress } from '../ui/job-progress.js';
import { buildCompactAiSystemPrompt } from '../core/ai-generation.js';

let container = null;
let diffEditor = null;
let aiSession = null;
let currentActiveModelKey = null;
let isGenerating = false;
let isEngineLoading = false;
let progressController = null;

const INFERENCE_SETTINGS = {
  temp: 0.1,
  top_p: 0.9,
  n_predict: 512,
  systemPrompt: "RULES:\n1. Fix ONLY grammar, spelling, and punctuation.\n2. Change ZERO other words.\n3. Keep the exact original formatting.\n4. Output ONLY the fixed text."
};
const TEXT_AI_STOP_STRINGS = ['<|im_end|>', '<|endoftext|>'];

export async function mount(parent) {
  container = document.createElement('div');
  container.className = 'tool-text-ai';
  const textModels = Object.entries(MODEL_REGISTRY).filter(([_, m]) => m.tasks.includes('text') || m.tasks.includes('text-social'));
  const defaultTextModel = DEFAULT_MODELS.text;

  container.innerHTML = `
    <div class="card rj-layout">
      <div class="text-ai-shell">
        <div class="text-ai-toolbar">
          <div class="tabs-header text-ai-tabs">
            <button class="tab-btn active" data-tab="refiner">Text Refiner</button>
            <button class="tab-btn" data-tab="chat">Chat</button>
            <button class="tab-btn" data-tab="console">Console</button>
          </div>
          <button id="btn-ai-setup" class="btn-secondary text-ai-setup-button">
            AI Engine
          </button>
        </div>

        <div id="ai-config-panel" class="hidden text-ai-config-panel">
          <div class="settings-grid">
            <div class="form-group">
              <label>Model</label>
              <select id="ai-model-select">
                ${textModels.map(([key, m]) => `<option value="${key}" ${key === defaultTextModel ? 'selected' : ''}>${m.id} (${m.size})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Model Info</label>
              <div id="ai-model-info" class="text-ai-model-info"></div>
            </div>
          </div>

          <div class="text-ai-settings-divider">
            <div class="text-ai-settings-title">Inference Settings</div>
            <div class="settings-grid">
              <div class="form-group">
                <label>Temperature (${INFERENCE_SETTINGS.temp})</label>
                <input type="range" id="ai-temp" min="0" max="1" step="0.1" value="${INFERENCE_SETTINGS.temp}">
              </div>
              <div class="form-group">
                <label>Top-P (${INFERENCE_SETTINGS.top_p})</label>
                <input type="range" id="ai-top-p" min="0" max="1" step="0.05" value="${INFERENCE_SETTINGS.top_p}">
              </div>
              <div class="form-group">
                <label>Max Tokens</label>
                <input type="number" id="ai-max-tokens" value="${INFERENCE_SETTINGS.n_predict}">
              </div>
            </div>
            <div class="form-group text-ai-system-field">
              <label>System Role (Instruction)</label>
              <textarea id="ai-system-prompt" class="text-ai-system-prompt">${INFERENCE_SETTINGS.systemPrompt}</textarea>
            </div>
          </div>

          <div class="text-ai-config-actions">
            <button id="btn-ai-cancel" class="btn-secondary">Close</button>
            <button id="btn-ai-activate" class="text-ai-activate-button">Activate Engine</button>
          </div>
        </div>
      </div>

      <div id="ai-progress-host" class="text-ai-progress-host"></div>

      <div id="ai-thinking-zone" class="hidden text-ai-thinking-zone">
        <div class="text-ai-thinking-title">Thinking</div>
        <div id="ai-thinking-content" class="text-ai-thinking-content"></div>
      </div>

      <div id="refiner-view" class="tab-content rj-layout">
        <div class="settings-grid">
          <div class="form-group text-ai-input-group">
            <label>Input Text</label>
            <textarea id="ai-input" class="text-ai-input" placeholder="Paste text here..."></textarea>
          </div>
          <div class="form-group text-ai-mode-group">
            <label>Refinement Mode</label>
            <select id="ai-tone">
              <optgroup label="Editorial">
                <option value="proofread">Proofread</option>
                <option value="natural">Natural English</option>
                <option value="polish">Polish</option>
              </optgroup>
              <optgroup label="Style Rewrites">
                <option value="casual">Casual & Friendly</option>
                <option value="concise">Concise</option>
                <option value="social">Social Reply</option>
              </optgroup>
            </select>
            <button id="btn-run-refine" class="text-ai-run-button">Run</button>
          </div>
        </div>

        <div id="refine-output-container" class="hidden rj-layout">
          <div class="form-group">
            <label>Changes</label>
            <div id="monaco-refine-diff" class="text-ai-diff"></div>
          </div>
          <div class="text-ai-result-actions">
            <button id="btn-copy-refined" class="btn-secondary">Copy Result</button>
            <button id="btn-apply-refined">Use as Input</button>
          </div>
        </div>
      </div>

      <div id="chat-view" class="tab-content hidden rj-layout">
        <div id="chat-history" class="text-ai-chat-history"></div>
        <div class="text-ai-chat-composer">
          <textarea id="chat-input" class="text-ai-chat-input" placeholder="Message local engine..."></textarea>
          <button id="btn-chat-send" class="text-ai-chat-send">Send</button>
        </div>
      </div>

      <div id="console-view" class="tab-content hidden rj-layout">
        <div id="ai-console-log" class="text-ai-console-log">
          <div class="text-ai-console-empty">Console ready.</div>
        </div>
        <button id="btn-clear-console" class="btn-secondary text-ai-clear-console">Clear Console</button>
      </div>
    </div>
  `;
  
  parent.appendChild(container);

  const configPanel = container.querySelector('#ai-config-panel');
  const modelSelect = container.querySelector('#ai-model-select');
  const modelInfo = container.querySelector('#ai-model-info');
  const thinkingZone = container.querySelector('#ai-thinking-zone');
  const thinkingContent = container.querySelector('#ai-thinking-content');
  const consoleLog = container.querySelector('#ai-console-log');
  progressController = createJobProgress(container.querySelector('#ai-progress-host'), {
    stopLabel: 'Stop AI',
    onStop() {
      aiSession?.stop();
    }
  });

  const tempInput = container.querySelector('#ai-temp');
  const topPInput = container.querySelector('#ai-top-p');
  const maxTokensInput = container.querySelector('#ai-max-tokens');
  const systemPromptInput = container.querySelector('#ai-system-prompt');

  tempInput.oninput = (e) => { INFERENCE_SETTINGS.temp = parseFloat(e.target.value); e.target.previousElementSibling.textContent = `Temperature (${INFERENCE_SETTINGS.temp})`; };
  topPInput.oninput = (e) => { INFERENCE_SETTINGS.top_p = parseFloat(e.target.value); e.target.previousElementSibling.textContent = `Top-P (${INFERENCE_SETTINGS.top_p})`; };
  maxTokensInput.onchange = (e) => INFERENCE_SETTINGS.n_predict = parseInt(e.target.value);
  systemPromptInput.onchange = (e) => INFERENCE_SETTINGS.systemPrompt = e.target.value;

  function logAiInvocation(payload) {
    const entry = document.createElement('div');
    entry.className = 'text-ai-console-entry';
    const timestamp = new Date().toLocaleTimeString();
    entry.innerHTML = `
      <div class="text-ai-console-title">[${escapeHtml(timestamp)}] Request: ${escapeHtml(payload.requestId)}</div>
      <div class="text-ai-console-line"><span>System:</span> ${escapeHtml(payload.params.systemPrompt)}</div>
      <div class="text-ai-console-line"><span>Prompt:</span> ${escapeHtml(payload.prompt)}</div>
      <div class="text-ai-console-params">Params: ${escapeHtml(JSON.stringify(payload.params))}</div>
    `;
    consoleLog.appendChild(entry);
    consoleLog.scrollTop = consoleLog.scrollHeight;
  }

  function initAiSession() {
    if (aiSession) return;
    aiSession = createAiSession();
    aiSession.subscribe(({ type, payload }) => {
      if (type === 'progress') {
        progressController.update({
          title: 'Loading weights...',
          detail: 'Streaming GGUF via Hub.',
          busy: true,
          progress: payload.progress,
          cancellable: false
        });
      } else if (type === 'status' && payload.status === 'ready') {
        isEngineLoading = false;
        progressController.update({
          title: 'Engine ready',
          detail: 'Hardware acceleration active.',
          tone: 'success',
          autoResetMs: isGenerating ? 0 : 1800
        });
      } else if (type === 'status' && payload.status === 'aborted') {
        isGenerating = false;
        progressController.update({
          title: 'Stopped',
          detail: 'Generation aborted.',
          tone: 'neutral',
          autoResetMs: 900
        });
      } else if (type === 'thinking') {
        if (payload.state === 'start') {
          thinkingZone.classList.remove('hidden');
          thinkingContent.textContent = '';
        }
      } else if (type === 'thinking-token') {
        thinkingContent.textContent += payload.text;
        thinkingContent.scrollTop = thinkingContent.scrollHeight;
      } else if (type === 'stream') {
        if (activeStreamTarget) activeStreamTarget.innerHTML = renderText(payload.text);
        const hist = container.querySelector('#chat-history');
        if (hist) hist.scrollTop = hist.scrollHeight;
      } else if (type === 'complete') {
        handleComplete(payload.result, payload.requestId);
      } else if (type === 'error') {
        isGenerating = false;
        isEngineLoading = false;
        progressController.update({
          title: 'Engine error',
          detail: payload.message,
          tone: 'danger'
        });
      }
    });
  }

  function renderText(text) {
    return escapeHtml(text).replace(/\n/g, '<br>');
  }

  function modelUsesThinking(modelKey) {
    const meta = MODEL_REGISTRY[modelKey] || {};
    return /deepseek|reasoning|<think>/i.test(`${modelKey} ${meta.id || ''} ${meta.desc || ''}`);
  }

  function buildTextGenerationParams(modelKey, overrides = {}) {
    const basePrompt = overrides.systemPrompt ?? INFERENCE_SETTINGS.systemPrompt;
    const maxTokens = Math.max(64, Math.min(1024, Number.parseInt(INFERENCE_SETTINGS.n_predict, 10) || 512));
    return {
      ...INFERENCE_SETTINGS,
      ...overrides,
      n_predict: maxTokens,
      stop: TEXT_AI_STOP_STRINGS,
      systemPrompt: buildCompactAiSystemPrompt(basePrompt, {
        thinking: modelUsesThinking(modelKey),
        maxChars: 900
      })
    };
  }

  const updateModelInfo = () => {
    const meta = MODEL_REGISTRY[modelSelect.value];
    modelInfo.innerHTML = `<strong>ID:</strong> ${escapeHtml(meta.id)}<br><strong>Size:</strong> ${escapeHtml(meta.size)}<br><strong>Use:</strong> ${escapeHtml(meta.desc)}`;
  };
  modelSelect.addEventListener('change', updateModelInfo);
  updateModelInfo();

  async function handleComplete(result, requestId) {
    isGenerating = false;
    progressController.update({
      title: 'Complete',
      detail: requestId === 'refine' ? 'Refined text ready.' : 'Reply ready.',
      tone: 'success',
      autoResetMs: 1600
    });
    thinkingZone.classList.add('hidden');
    if (requestId === 'refine') {
      const text = container.querySelector('#ai-input').value;
      let monaco;
      if (!diffEditor) {
        const { diffEditor: inst, monaco: m } = await createDiffEditor(container.querySelector('#monaco-refine-diff'));
        diffEditor = inst;
        monaco = m;
      } else {
        const { monaco: m } = await createDiffEditor(container.querySelector('#monaco-refine-diff'));
        monaco = m;
      }
      diffEditor.setModel({
        original: monaco.editor.createModel(text, 'plaintext'),
        modified: monaco.editor.createModel(result, 'plaintext')
      });
      container.querySelector('#refine-output-container').classList.remove('hidden');
      if (container.querySelector('#stream-preview')) container.querySelector('#stream-preview').remove();
      setTimeout(() => diffEditor.layout(), 100);
    }
  }

  let activeStreamTarget = null;

  async function ensureEngineActive() {
    if (currentActiveModelKey && !isEngineLoading) return true;
    if (isEngineLoading) return false;

    const defaultModel = DEFAULT_MODELS.text;
    isEngineLoading = true;
    progressController.update({
      title: 'Auto-initializing engine...',
      detail: `Using default: ${MODEL_REGISTRY[defaultModel].id}`,
      busy: true
    });

    try {
      await aiSession.loadModel(MODEL_REGISTRY[defaultModel].url);
      currentActiveModelKey = defaultModel;
      return true;
    } catch {
      return false;
    }
  }

  container.querySelector('#btn-run-refine').addEventListener('click', async () => {
    if (isGenerating) {
      aiSession.stop();
      await new Promise(r => setTimeout(r, 100));
    }
    const text = container.querySelector('#ai-input').value.trim();
    if (!text) return;

    if (!await ensureEngineActive()) return;
    
    isGenerating = true;
    progressController.update({
      title: 'Synthesizing...',
      detail: 'Streaming refiner output.',
      busy: true,
      cancellable: true
    });
    
    const streamPreview = document.createElement('div');
    streamPreview.id = 'stream-preview';
    streamPreview.className = 'text-ai-stream-preview';
    container.querySelector('#refiner-view').insertBefore(streamPreview, container.querySelector('#refine-output-container'));
    activeStreamTarget = streamPreview;

    const payload = {
      requestId: 'refine',
      prompt: getSurgicalPrompt(container.querySelector('#ai-tone').value, text),
      params: buildTextGenerationParams(currentActiveModelKey || modelSelect.value || DEFAULT_MODELS.text)
    };
    logAiInvocation(payload);
    aiSession.generate(payload);
  });

  const runChat = async () => {
    const input = container.querySelector('#chat-input');
    const text = input.value.trim();
    if (!text) return;

    if (isGenerating) {
      aiSession.stop();
      await new Promise(r => setTimeout(r, 100));
    }

    if (!await ensureEngineActive()) return;

    input.value = '';
    isGenerating = true;

    const hist = container.querySelector('#chat-history');
    const userMsg = document.createElement('div');
    userMsg.className = 'text-ai-chat-message text-ai-chat-message-user';
    userMsg.textContent = text;
    hist.appendChild(userMsg);

    const aiMsg = document.createElement('div');
    aiMsg.className = 'text-ai-chat-message text-ai-chat-message-assistant';
    aiMsg.innerHTML = '...';
    hist.appendChild(aiMsg);
    activeStreamTarget = aiMsg;

    progressController.update({
      title: 'Thinking...',
      detail: 'Streaming chat reply.',
      busy: true,
      cancellable: true
    });

    const payload = {
      requestId: 'chat',
      prompt: text,
      params: buildTextGenerationParams(currentActiveModelKey || modelSelect.value || DEFAULT_MODELS.text, {
        systemPrompt: 'You are a helpful local text assistant. Keep replies concise.'
      })
    };
    logAiInvocation(payload);
    aiSession.generate(payload);
    hist.scrollTop = hist.scrollHeight;
  };

  container.querySelector('#btn-chat-send').addEventListener('click', runChat);
  container.querySelector('#chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      runChat();
    }
  });

  container.querySelector('#btn-ai-setup').onclick = () => configPanel.classList.toggle('hidden');
  container.querySelector('#btn-ai-cancel').onclick = () => configPanel.classList.add('hidden');
  container.querySelector('#btn-ai-activate').onclick = async () => {
    const selected = modelSelect.value;
    const btn = container.querySelector('#btn-ai-activate');
    btn.disabled = true;
    isEngineLoading = true;
    progressController.update({
      title: 'Activating engine...',
      detail: MODEL_REGISTRY[selected].id,
      busy: true
    });
    try {
      await aiSession.loadModel(MODEL_REGISTRY[selected].url);
      currentActiveModelKey = selected;
    } catch {}
    configPanel.classList.add('hidden');
    btn.disabled = false;
  };

  container.querySelector('#btn-clear-console').onclick = () => {
    consoleLog.innerHTML = '<div class="text-ai-console-empty">Console cleared.</div>';
  };

  container.querySelectorAll('.tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      container.querySelectorAll('.tab-content').forEach(v => v.classList.add('hidden'));
      container.querySelector(`#${tab.dataset.tab}-view`).classList.remove('hidden');
    });
  });
  initAiSession();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getSurgicalPrompt(tone, text) {
  switch (tone) {
    case 'proofread': return `Surgical Proofread (Fix grammar/spelling only): ${text}`;
    case 'natural': return `Naturalize (Native flow only): ${text}`;
    default:
      const prompts = {
        'polish': `Executive Polish: ${text}`,
        'casual': `Casual Rewrite: ${text}`,
        'concise': `Distill / Shorten: ${text}`,
        'social': `Social Reply: ${text}`
      };
      return prompts[tone] || text;
  }
}

export function unmount() {
  if (aiSession) aiSession.dispose();
  aiSession = null;
  progressController?.destroy();
  progressController = null;
  if (diffEditor) diffEditor.dispose();
  diffEditor = null;
  if (container) container.remove();
  container = null;
  currentActiveModelKey = null;
  isGenerating = false;
  isEngineLoading = false;
}

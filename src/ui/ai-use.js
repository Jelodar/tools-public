import { createAiSession } from '../core/ai-session.js';
import { createJobProgress } from './job-progress.js';
import { taskManager } from '../core/task-manager.js';

export function normalizeAiLoadProgress(progress) {
  const numeric = Number(progress);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  const scaled = numeric <= 1 ? numeric * 100 : numeric;
  return Math.max(0, Math.min(100, Math.round(scaled)));
}

export function createAiUse(options = {}) {
  const modelRegistry = options.modelRegistry || {};
  const session = options.session || createAiSession();
  const progress = createJobProgress(options.progressHost, {
    stopLabel: options.stopLabel || 'Stop AI',
    idleMessage: options.idleMessage || 'Local engine idle.',
    onStop() {
      api.stop();
      options.onStop?.(api);
    }
  });

  const taskId = `ai-${Math.random().toString(36).slice(2, 9)}`;

  const state = {
    activeModelKey: null,
    loadingModelKey: null,
    isLoading: false,
    isGenerating: false,
    thinkingActive: false,
    thinkingText: '',
    visibleText: ''
  };

  const thinkingPanel = options.thinkingPanel || null;
  const thinkingContent = options.thinkingContent || thinkingPanel || null;
  const consoleNode = options.consoleNode || null;
  const consoleEmpty = options.consoleEmptyMessage || '[INFO] Local AI console ready.';

  const appendConsoleEntry = (kind, payload) => {
    if (!consoleNode) return;
    if (consoleNode.dataset.empty === 'true') consoleNode.innerHTML = '';
    consoleNode.dataset.empty = 'false';
    const entry = document.createElement('div');
    entry.className = 'ai-console-entry';
    entry.innerHTML = options.renderConsoleEntry
      ? options.renderConsoleEntry(kind, payload)
      : renderDefaultConsoleEntry(kind, payload);
    consoleNode.appendChild(entry);
    consoleNode.scrollTop = consoleNode.scrollHeight;
  };

  const syncModelInfo = () => {
    if (!options.modelInfoNode || !options.modelSelect) return;
    const model = modelRegistry[options.modelSelect.value];
    options.modelInfoNode.innerHTML = model
      ? (options.renderModelInfo?.(model, options.modelSelect.value) || renderDefaultModelInfo(model))
      : '';
  };

  const setThinkingVisible = (visible, clear = false) => {
    if (!thinkingPanel) return;
    thinkingPanel.classList.toggle('hidden', !visible);
    if (clear && thinkingContent) thinkingContent.textContent = '';
  };

  const resetTransientState = () => {
    state.thinkingActive = false;
    state.thinkingText = '';
    state.visibleText = '';
    if (thinkingContent) thinkingContent.textContent = '';
  };

  const api = {
    state,
    progress,
    session,
    syncModelInfo,
    toggleConfig(force) {
      if (!options.configPanel) return;
      const next = typeof force === 'boolean' ? force : options.configPanel.classList.contains('hidden');
      options.configPanel.classList.toggle('hidden', !next);
    },
    openConfig() {
      api.toggleConfig(true);
    },
    closeConfig() {
      api.toggleConfig(false);
    },
    clearConsole() {
      if (!consoleNode) return;
      consoleNode.dataset.empty = 'true';
      consoleNode.innerHTML = `<div class="ai-console-empty">${escapeHtml(consoleEmpty)}</div>`;
    },
    logInvocation(payload, meta = {}) {
      appendConsoleEntry('invoke', {
        ...meta,
        payload,
        timestamp: new Date().toLocaleTimeString()
      });
    },
    async ensureModel(modelKey = options.modelSelect?.value || state.activeModelKey) {
      const resolvedKey = modelKey || options.initialModelKey;
      const model = modelRegistry[resolvedKey];
      if (!resolvedKey || !model) throw new Error('A valid local AI model is required.');
      if (state.activeModelKey === resolvedKey && !state.isLoading) return model;
      state.isLoading = true;
      state.loadingModelKey = resolvedKey;
      progress.update({
        title: options.loadingTitle || 'Loading weights...',
        detail: options.loadingDetail?.(model, resolvedKey) || model.id,
        busy: true
      });
      try {
        await session.loadModel(model.url);
        state.activeModelKey = resolvedKey;
        state.isLoading = false;
        state.loadingModelKey = null;
        return model;
      } catch (error) {
        state.isLoading = false;
        state.loadingModelKey = null;
        throw error;
      }
    },
    run(payload, meta = {}) {
      state.isGenerating = true;
      state.isLoading = false;
      resetTransientState();
      setThinkingVisible(false);
      options.onBeforeGenerate?.(payload, meta, api);
      if (meta.log !== false) api.logInvocation(payload, meta);
      const progOpts = {
        title: meta.title || options.generateTitle || 'Generating...',
        detail: meta.detail || options.generateDetail || 'Streaming local output.',
        busy: true,
        cancellable: meta.cancellable ?? true
      };
      progress.update(progOpts);
      taskManager.register(taskId, { ...progOpts, onStop: () => api.stop() });
      session.generate(payload);
    },
    stop() {
      session.stop();
      if (state.isGenerating || state.isLoading) {
        state.isGenerating = false;
        state.isLoading = false;
        const abortOpts = {
          title: options.abortedTitle || 'Stopped',
          detail: options.abortedDetail || 'Generation aborted.',
          autoResetMs: 900
        };
        progress.update(abortOpts);
        taskManager.update(taskId, abortOpts);
        setTimeout(() => taskManager.unregister(taskId), 1000);
      }
    },
    destroy() {
      progress.destroy();
      session.dispose();
      setThinkingVisible(false, true);
    }
  };

  api.clearConsole();
  if (options.modelSelect) options.modelSelect.addEventListener('change', syncModelInfo);
  syncModelInfo();

  session.subscribe(({ type, payload }) => {
    if (type === 'progress') {
      state.isLoading = true;
      const opts = {
        title: options.loadingTitle || 'Loading weights...',
        detail: options.loadingProgressDetail || 'Streaming local model files.',
        busy: true,
        progress: normalizeAiLoadProgress(payload.progress),
        cancellable: false
      };
      progress.update(opts);
      taskManager.register(taskId, { ...opts, onStop: () => api.stop() });
      options.onProgress?.(payload, api);
      return;
    }

    if (type === 'status' && payload.status === 'ready') {
      state.isLoading = false;
      state.activeModelKey = state.loadingModelKey || state.activeModelKey;
      state.loadingModelKey = null;
      const opts = {
        title: options.readyTitle || 'Engine ready',
        detail: options.readyDetail?.(state.activeModelKey) || 'Local model active.',
        tone: 'success',
        autoResetMs: state.isGenerating ? 0 : 1800
      };
      progress.update(opts);
      taskManager.update(taskId, opts);
      if (!state.isGenerating) setTimeout(() => taskManager.unregister(taskId), 2000);
      options.onReady?.(payload, api);
      return;
    }

    if (type === 'status' && payload.status === 'aborted') {
      state.isGenerating = false;
      resetTransientState();
      setThinkingVisible(false, true);
      const opts = {
        title: options.abortedTitle || 'Stopped',
        detail: options.abortedDetail || 'Generation aborted.',
        autoResetMs: 900
      };
      progress.update(opts);
      taskManager.update(taskId, opts);
      setTimeout(() => taskManager.unregister(taskId), 1000);
      options.onAborted?.(payload, api);
      return;
    }

    if (type === 'thinking') {
      if (payload.state === 'start') {
        state.thinkingActive = true;
        setThinkingVisible(true);
        if (state.isGenerating) {
          const opts = {
            title: options.generateTitle || 'Generating...',
            detail: options.thinkingDetail || 'Model is reasoning...',
            busy: true,
            cancellable: true
          };
          progress.update(opts);
          taskManager.update(taskId, opts);
        }
      } else if (payload.state === 'end') {
        state.thinkingActive = false;
      }
      options.onThinking?.(payload, api);
      return;
    }

    if (type === 'thinking-token') {
      state.thinkingText += payload.text || '';
      if (thinkingContent) {
        thinkingContent.textContent = state.thinkingText;
        thinkingContent.scrollTop = thinkingContent.scrollHeight;
      }
      appendConsoleEntry('thinking', {
        text: payload.text || '',
        fullText: state.thinkingText,
        timestamp: new Date().toLocaleTimeString()
      });
      options.onThinkingToken?.({ ...payload, fullText: state.thinkingText }, api);
      options.onThinkingStream?.({ ...payload, fullText: state.thinkingText }, api);
      return;
    }

    if (type === 'stream') {
      state.visibleText = payload.text || '';
      appendConsoleEntry('stream', {
        text: payload.text || '',
        fullText: state.visibleText,
        timestamp: new Date().toLocaleTimeString()
      });
      options.onStream?.({ ...payload, fullText: state.visibleText }, api);
      return;
    }

    if (type === 'complete') {
      state.isGenerating = false;
      const cp = options.resolveCompleteProgress?.(payload, api);
      if (cp) {
        progress.update(cp);
        taskManager.update(taskId, cp);
      }
      setTimeout(() => taskManager.unregister(taskId), 2000);
      const keepThinking = options.keepThinkingVisible === true;
      setThinkingVisible(keepThinking, !keepThinking);
      if (keepThinking) {
        state.thinkingActive = false;
        state.visibleText = '';
      } else {
        resetTransientState();
      }
      appendConsoleEntry('complete', {
        result: payload.result || state.visibleText,
        timestamp: new Date().toLocaleTimeString()
      });
      options.onComplete?.(payload, api);
      return;
    }

    if (type === 'error') {
      state.isLoading = false;
      state.isGenerating = false;
      state.loadingModelKey = null;
      resetTransientState();
      setThinkingVisible(false, true);
      const opts = {
        title: options.errorTitle || 'Engine error',
        detail: payload.message,
        tone: 'danger'
      };
      progress.update(opts);
      taskManager.update(taskId, opts);
      setTimeout(() => taskManager.unregister(taskId), 5000);
      appendConsoleEntry('error', {
        message: payload.message,
        timestamp: new Date().toLocaleTimeString()
      });
      options.onError?.(payload, api);
    }
  });

  return api;
}

function renderDefaultModelInfo(model) {
  return `<strong>ID:</strong> ${model.id}<br><strong>Size:</strong> ${model.size}<br><strong>Mode:</strong> ${model.desc}`;
}

function renderDefaultConsoleEntry(kind, payload) {
  if (kind === 'stream' || kind === 'thinking' || kind === 'complete') {
    const body = kind === 'complete'
      ? payload.result || ''
      : payload.text || payload.fullText || '';
    return `
      <div class="ai-console-entry-head">
        <span class="ai-console-entry-tag">${escapeHtml(kind)}</span>
        <span class="ai-console-entry-time">${escapeHtml(payload.timestamp)}</span>
      </div>
      <div class="ai-console-entry-body">${escapeHtml(body)}</div>
    `;
  }

  if (kind === 'error') {
    return `
      <div class="ai-console-entry-head">
        <span class="ai-console-entry-tag ai-console-entry-tag-error">Error</span>
        <span class="ai-console-entry-time">${escapeHtml(payload.timestamp)}</span>
      </div>
      <div class="ai-console-entry-body">${escapeHtml(payload.message || 'Unknown local AI error.')}</div>
    `;
  }

  const request = payload.payload || {};
  const requestId = request.requestId || payload.label || 'request';
  const promptParts = [];
  if (request.prompt) promptParts.push(String(request.prompt));
  if (Array.isArray(request.messages) && request.messages.length) {
    promptParts.push(request.messages
      .map((entry) => `[${entry.role || 'message'}] ${String(entry.content || '')}`)
      .join('\n\n'));
  }
  if (request.suffix) {
    promptParts.push(`[suffix] ${String(request.suffix)}`);
  }
  const prompt = promptParts.filter(Boolean).join('\n\n');
  const sourceParams = request.params || {};
  const meta = {};
  Object.entries(sourceParams).forEach(([key, value]) => {
    if (key === 'grammar' || key === 'responseFormat' || key === 'systemPrompt') return;
    meta[key] = value;
  });
  if (request.responseFormat || sourceParams.responseFormat) {
    meta.response = request.responseFormat || sourceParams.responseFormat;
  }
  if (request.grammar || sourceParams.grammar) {
    meta.grammar = 'custom';
  }
  if (Array.isArray(request.messages) && request.messages.length) {
    meta.messages = request.messages.length;
  }
  const params = JSON.stringify(meta);
  return `
    <div class="ai-console-entry-head">
      <span class="ai-console-entry-tag">${escapeHtml(requestId)}</span>
      <span class="ai-console-entry-time">${escapeHtml(payload.timestamp)}</span>
    </div>
    <div class="ai-console-entry-body">${escapeHtml(prompt || '[empty request body]')}</div>
    <div class="ai-console-entry-meta">${escapeHtml(params)}</div>
  `;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

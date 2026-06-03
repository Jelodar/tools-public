import {
  createWllamaLogger,
  normalizeAiCompletionOptions,
  normalizeAiMessages,
  splitAiResponseText,
  trimTextAtStopStrings
} from '../core/ai-generation.js';

if (typeof self !== 'undefined' && typeof document === 'undefined') {
  self.document = { baseURI: self.location.href };
}

let wllama = null;
let currentModelUrl = null;
let activeAbortController = null;
let activeStopMode = null;
const decoder = new TextDecoder();

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  try {
    if (type === 'load') {
      await initWllama(payload.url, payload.config);
      self.postMessage({ type: 'status', payload: { status: 'ready' } });
      return;
    }

    if (type === 'generate') {
      await generate(payload);
      return;
    }

    if (type === 'stop' && activeAbortController) {
      activeStopMode = 'external';
      activeAbortController.abort();
    }
  } catch (error) {
    self.postMessage({ type: 'error', payload: { message: error.message } });
  }
};

async function initWllama(url, config) {
  if (wllama && currentModelUrl === url) return;

  const { Wllama } = await import('https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/esm/index.min.js');
  wllama = new Wllama({
    'single-thread/wllama.wasm': 'https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/esm/single-thread/wllama.wasm',
    'multi-thread/wllama.wasm': 'https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/esm/multi-thread/wllama.wasm',
    'multi-thread/wllama.worker.mjs': 'https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/esm/multi-thread/wllama.worker.mjs'
  }, {
    logger: createWllamaLogger()
  });

  await wllama.loadModelFromUrl(url, {
    parallel: 1,
    n_ctx: config?.n_ctx || 4096,
    n_threads: config?.n_threads,
    progressCallback(progress) {
      self.postMessage({
        type: 'progress',
        payload: { progress: progress.total ? (progress.loaded / progress.total) * 100 : 0 }
      });
    }
  });

  currentModelUrl = url;
}

async function generate(payload = {}) {
  if (!wllama) throw new Error('Neural engine not initialized.');

  activeAbortController = new AbortController();
  activeStopMode = null;

  const params = normalizeAiCompletionOptions(payload.params);
  const requestId = payload.requestId;
  const isRaw = payload.isRaw === true;
  const messages = isRaw
    ? []
    : normalizeAiMessages(payload.messages, payload.prompt, params.systemPrompt || 'Mode: distilled. Return only the requested data.');
  const streamState = {
    thinking: '',
    visible: '',
    thinkingVisible: false,
    finalText: ''
  };

  try {
    if (typeof wllama.kvClear === 'function') {
      await wllama.kvClear();
    }

    const completionOptions = {
      ...params.options,
      abortSignal: activeAbortController.signal,
      onNewToken(token, piece, currentText, optionals = {}) {
        const nextRawText = typeof currentText === 'string'
          ? currentText
          : streamState.finalText + decoder.decode(piece || new Uint8Array());
        handleStreamText({
          nextRawText,
          isRaw,
          responseFormat: params.responseFormat,
          stopStrings: params.stopStrings,
          requestId,
          streamState,
          optionals
        });
      }
    };

    const result = isRaw
      ? await wllama.createCompletion(String(payload.prompt || ''), completionOptions)
      : await wllama.createChatCompletion(messages, completionOptions);

    if (activeStopMode === 'external') {
      self.postMessage({ type: 'status', payload: { status: 'aborted', requestId } });
      return;
    }

    const finalText = finalizeResult(result, {
      isRaw,
      responseFormat: params.responseFormat,
      stopStrings: params.stopStrings
    }, streamState);

    self.postMessage({ type: 'complete', payload: { result: finalText, requestId } });
  } catch (error) {
    if (activeStopMode === 'external') {
      self.postMessage({ type: 'status', payload: { status: 'aborted', requestId } });
      return;
    }

    if (activeStopMode === 'internal') {
      self.postMessage({ type: 'complete', payload: { result: streamState.finalText, requestId } });
      return;
    }

    throw error;
  } finally {
    activeAbortController = null;
    activeStopMode = null;
  }
}

function handleStreamText(context) {
  const {
    nextRawText,
    isRaw,
    responseFormat,
    stopStrings,
    requestId,
    streamState,
    optionals
  } = context;

  const nextState = isRaw
    ? {
        thinking: '',
        visible: trimTextAtStopStrings(nextRawText, stopStrings).text,
        thinkingActive: false
      }
    : splitAiResponseText(nextRawText, { expectJson: responseFormat === 'json' });

  emitThinkingDelta(streamState, nextState, requestId);
  emitVisibleDelta(streamState, nextState, requestId);

  const trimmedVisible = trimTextAtStopStrings(nextState.visible, stopStrings);
  if (trimmedVisible.matched) {
    streamState.visible = trimmedVisible.text;
    streamState.finalText = trimmedVisible.text;
    self.postMessage({ type: 'stream', payload: { text: streamState.visible, requestId } });
    stopGeneration(optionals, 'internal');
    return;
  }

  if (!isRaw && responseFormat === 'json' && nextState.visible) {
    streamState.finalText = nextState.visible;
    stopGeneration(optionals, 'internal');
    return;
  }

  streamState.finalText = nextState.visible || nextRawText.trim();
}

function emitThinkingDelta(streamState, nextState, requestId) {
  const nextThinking = nextState.thinking || '';
  const previousThinking = streamState.thinking || '';
  const shouldShowThinking = !!nextThinking && nextState.thinkingActive !== false;

  if (shouldShowThinking && !streamState.thinkingVisible) {
    streamState.thinkingVisible = true;
    self.postMessage({ type: 'thinking', payload: { state: 'start', requestId } });
  }

  if (nextThinking.startsWith(previousThinking)) {
    const delta = nextThinking.slice(previousThinking.length);
    if (delta) {
      self.postMessage({ type: 'thinking-token', payload: { text: delta, requestId } });
    }
  } else if (nextThinking && nextThinking !== previousThinking) {
    if (streamState.thinkingVisible) {
      self.postMessage({ type: 'thinking', payload: { state: 'end', requestId } });
      streamState.thinkingVisible = false;
    }
    self.postMessage({ type: 'thinking', payload: { state: 'start', requestId } });
    self.postMessage({ type: 'thinking-token', payload: { text: nextThinking, requestId } });
    streamState.thinkingVisible = true;
  }

  if (streamState.thinkingVisible && nextState.thinkingActive === false) {
    self.postMessage({ type: 'thinking', payload: { state: 'end', requestId } });
    streamState.thinkingVisible = false;
  }

  streamState.thinking = nextThinking;
}

function emitVisibleDelta(streamState, nextState, requestId) {
  const nextVisible = nextState.visible || '';
  if (nextVisible === streamState.visible) return;
  streamState.visible = nextVisible;
  self.postMessage({ type: 'stream', payload: { text: nextVisible, requestId } });
}

function finalizeResult(result, params, streamState) {
  const text = String(result || '');
  if (params.isRaw) {
    const trimmed = trimTextAtStopStrings(text, params.stopStrings);
    return trimmed.text || streamState.finalText || '';
  }

  const finalState = splitAiResponseText(text, { expectJson: params.responseFormat === 'json' });
  const trimmed = trimTextAtStopStrings(finalState.visible, params.stopStrings);
  return trimmed.text || finalState.visible || streamState.finalText || text.trim();
}

function stopGeneration(optionals, mode) {
  if (activeStopMode) return;
  activeStopMode = mode;
  optionals.abortSignal?.();
  activeAbortController?.abort();
}

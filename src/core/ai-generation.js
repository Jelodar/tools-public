const STOP_SEQUENCE_LIMIT = 8;
const SUPPRESSED_WLLAMA_WARNINGS = [
  'special_eos_id is not in special_eog_ids - the tokenizer config may be incorrect',
  'special_eot_id is not in special_eog_ids - the tokenizer config may be incorrect',
  'special_eom_id is not in special_eog_ids - the tokenizer config may be incorrect',
  'warning: munmap failed: Invalid argument',
  'munmap failed: Invalid argument',
  'llama_context: n_ctx_seq',
  'n_ctx_train'
];
const THINKING_GUARD = 'If you use <think>, be technical and concise; keep it under 25 words, then answer immediately.';

export function normalizeAiCompletionOptions(params = {}) {
  const source = params && typeof params === 'object' ? params : {};
  const options = {
    useCache: source.useCache === true
  };
  const nPredict = toPositiveInt(source.nPredict ?? source.n_predict);
  if (nPredict) options.nPredict = nPredict;

  const sampling = {};
  copyNumericOption(source, sampling, ['temp', 'temperature']);
  copyNumericOption(source, sampling, ['top_p', 'topP']);
  copyNumericOption(source, sampling, ['top_k', 'topK']);
  copyNumericOption(source, sampling, ['min_p', 'minP']);
  copyNumericOption(source, sampling, ['typical_p', 'typicalP']);
  copyNumericOption(source, sampling, ['penalty_repeat', 'penaltyRepeat']);
  copyNumericOption(source, sampling, ['penalty_present', 'penaltyPresent']);
  copyNumericOption(source, sampling, ['penalty_freq', 'penaltyFreq']);
  copyNumericOption(source, sampling, ['mirostat']);
  copyNumericOption(source, sampling, ['mirostat_eta', 'mirostatEta']);
  copyNumericOption(source, sampling, ['mirostat_tau', 'mirostatTau']);

  if (typeof source.grammar === 'string' && source.grammar.trim()) {
    sampling.grammar = source.grammar;
  }

  if (Object.keys(sampling).length) {
    options.sampling = sampling;
  }

  const stopTokens = Array.isArray(source.stopTokens)
    ? source.stopTokens.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value >= 0)
    : [];
  if (stopTokens.length) {
    options.stopTokens = stopTokens;
  }

  return {
    options,
    stopStrings: normalizeStopStrings(source.stopStrings ?? source.stop),
    systemPrompt: typeof source.systemPrompt === 'string' ? source.systemPrompt : '',
    responseFormat: normalizeResponseFormat(source.responseFormat ?? source.outputFormat ?? source.format)
  };
}

export function normalizeAiMessages(messages, prompt = '', systemPrompt = '') {
  if (Array.isArray(messages) && messages.length) {
    const normalized = messages
      .map((entry) => ({
        role: String(entry?.role || '').trim(),
        content: String(entry?.content || '')
      }))
      .filter((entry) => entry.role && entry.content);
    if (normalized.length) return normalized;
  }

  const normalizedPrompt = String(prompt || '').trim();
  if (!normalizedPrompt) return [];

  const normalizedSystemPrompt = String(systemPrompt || '').trim();
  return [
    ...(normalizedSystemPrompt ? [{ role: 'system', content: normalizedSystemPrompt }] : []),
    { role: 'user', content: normalizedPrompt }
  ];
}

export function shouldSuppressWllamaWarning(...args) {
  const message = args.map((value) => String(value || '')).join(' ');
  return SUPPRESSED_WLLAMA_WARNINGS.some((entry) => message.includes(entry));
}

export function createWllamaLogger(baseLogger = console) {
  const forward = (level, args) => {
    if (shouldSuppressWllamaWarning(...args)) return;
    baseLogger[level]?.(...args);
  };
  return {
    debug: (...args) => forward('debug', args),
    log: (...args) => forward('log', args),
    warn: (...args) => forward('warn', args),
    error: (...args) => forward('error', args)
  };
}

export function buildCompactAiSystemPrompt(systemPrompt = '', options = {}) {
  const maxChars = Math.max(120, Math.min(2400, Number(options.maxChars) || 1200));
  const compact = String(systemPrompt || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
    .slice(0, maxChars)
    .trim();
  return [
    options.thinking ? THINKING_GUARD : '',
    compact
  ].filter(Boolean).join('\n');
}

export function extractFirstBalancedJsonObject(text = '') {
  const source = String(text || '');
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (start === -1) {
      if (char === '{') {
        start = index;
        depth = 1;
      }
      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return {
          jsonText: source.slice(start, index + 1),
          prefix: source.slice(0, start),
          suffix: source.slice(index + 1),
          start,
          end: index + 1
        };
      }
    }
  }

  return null;
}

export function splitAiResponseText(text = '', options = {}) {
  const source = String(text || '');
  const expectJson = options.expectJson === true;
  const thinkStart = source.indexOf('<think>');
  const thinkEnd = thinkStart >= 0 ? source.indexOf('</think>', thinkStart + 7) : -1;
  const thinkingParts = [];
  let thinkingActive = false;
  let visibleSource = source;

  if (thinkStart >= 0) {
    const prefix = source.slice(0, thinkStart);
    const thought = thinkEnd >= 0
      ? source.slice(thinkStart + 7, thinkEnd)
      : source.slice(thinkStart + 7);
    if (prefix.trim()) thinkingParts.push(prefix);
    if (thought) thinkingParts.push(thought);
    visibleSource = thinkEnd >= 0 ? source.slice(thinkEnd + 8) : '';
    thinkingActive = thinkEnd < 0;
  }

  if (expectJson) {
    const jsonMatch = extractFirstBalancedJsonObject(visibleSource);
    if (jsonMatch) {
      if (jsonMatch.prefix.trim()) thinkingParts.push(jsonMatch.prefix);
      return {
        thinking: thinkingParts.join(''),
        visible: jsonMatch.jsonText,
        thinkingActive
      };
    }

    if (visibleSource.trim()) {
      thinkingParts.push(visibleSource);
      thinkingActive = true;
    }

    return {
      thinking: thinkingParts.join(''),
      visible: '',
      thinkingActive
    };
  }

  return {
    thinking: thinkingParts.join(''),
    visible: visibleSource,
    thinkingActive
  };
}

export function trimTextAtStopStrings(text = '', stopStrings = []) {
  const source = String(text || '');
  let matchIndex = -1;
  let matched = '';

  for (const stop of normalizeStopStrings(stopStrings)) {
    const index = source.indexOf(stop);
    if (index === -1) continue;
    if (matchIndex === -1 || index < matchIndex || (index === matchIndex && stop.length > matched.length)) {
      matchIndex = index;
      matched = stop;
    }
  }

  if (matchIndex === -1) {
    return { text: source, matched: '' };
  }

  return {
    text: source.slice(0, matchIndex),
    matched
  };
}

function copyNumericOption(source, target, keys) {
  const [primary, ...aliases] = keys;
  const value = [primary, ...aliases]
    .map((key) => source[key])
    .find((candidate) => Number.isFinite(Number(candidate)));
  if (value === undefined) return;
  target[primary] = Number(value);
}

function normalizeStopStrings(value) {
  const items = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  return items
    .map((entry) => String(entry || ''))
    .filter(Boolean)
    .slice(0, STOP_SEQUENCE_LIMIT);
}

function normalizeResponseFormat(value) {
  if (typeof value !== 'string') return 'text';
  const normalized = value.trim().toLowerCase();
  return normalized === 'json' ? 'json' : 'text';
}

function toPositiveInt(value) {
  const numeric = Number.parseInt(value, 10);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : 0;
}

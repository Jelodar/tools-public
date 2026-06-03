import { extractFirstBalancedJsonObject } from '../core/ai-generation.js';

const PRESET_MAP = {
  email: {
    pattern: '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}',
    flags: 'g',
    sample: 'Contact team@example.com or ops@example.org for support.'
  },
  url: {
    pattern: 'https?:\\/\\/[^\\s/$.?#].[^\\s]*',
    flags: 'g',
    sample: 'Primary docs: https://example.com/docs and https://status.example.com'
  },
  uuid: {
    pattern: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}',
    flags: 'g',
    sample: 'IDs: 550e8400-e29b-41d4-a716-446655440000 and 018ec353-7be1-7cc6-b4f0-9f6d1e4ad7aa'
  },
  date: {
    pattern: '\\b\\d{4}-\\d{2}-\\d{2}\\b',
    flags: 'g',
    sample: 'Release windows: 2026-04-21, 2026-05-05, 2026-06-30.'
  },
  hashtag: {
    pattern: '#[A-Za-z0-9_]+',
    flags: 'g',
    sample: 'Track #frontend, #release_notes, and #qa for updates.'
  }
};

export const DEFAULT_REGEX_SAMPLE = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Release date: 2026-04-21.
Contact: hello@example.com.
Profile slug: world-class-suite.
Reference ID: 550e8400-e29b-41d4-a716-446655440000.`;

export const REGEX_FLAG_METADATA = [
  { flag: 'd', label: 'Indices', detail: 'Exposes match indices in modern engines.', compatibility: 'Modern Chromium / Firefox / Safari only.' },
  { flag: 'g', label: 'Global', detail: 'Finds every match instead of stopping at the first.', compatibility: 'Widely supported.' },
  { flag: 'i', label: 'Ignore Case', detail: 'Matches case-insensitively.', compatibility: 'Widely supported.' },
  { flag: 'm', label: 'Multiline', detail: 'Makes ^ and $ operate per line.', compatibility: 'Widely supported.' },
  { flag: 's', label: 'Dot All', detail: 'Allows . to match newlines.', compatibility: 'Modern browsers and Node.' },
  { flag: 'u', label: 'Unicode', detail: 'Enables Unicode-aware parsing and escapes.', compatibility: 'Widely supported in modern engines.' },
  { flag: 'v', label: 'Unicode Sets', detail: 'Adds advanced Unicode set notation.', compatibility: 'Only the newest engines currently support this.' },
  { flag: 'y', label: 'Sticky', detail: 'Matches from the current index only.', compatibility: 'Widely supported in modern engines.' }
];

export const REGEX_BLOCK_CATALOG = [
  createRegexBlock('newline', 'control', 'Newline', '\\n', 'Line break character.', 'js'),
  createRegexBlock('tab', 'control', 'Tab', '\\t', 'Horizontal tab character.', 'js'),
  createRegexBlock('digit', 'tokens', 'Digit', '\\d', 'Digit character.', 'js'),
  createRegexBlock('word', 'tokens', 'Word character', '\\w', 'Letter, digit, or underscore.', 'js'),
  createRegexBlock('space', 'tokens', 'Whitespace', '\\s', 'Whitespace character.', 'js'),
  createRegexBlock('any-char', 'tokens', 'Any character', '.', 'Any code unit except a newline unless dotAll is enabled.', 'js'),
  createRegexBlock('literal', 'tokens', 'Escaped literal', 'literal', 'Escape plain text for a literal match.', 'js', [
    { id: 'value', label: 'Text', defaultValue: '.', placeholder: 'Enter text to escape' }
  ], (values) => escapeRegexLiteral(values.value || '.')),
  createRegexBlock('alternation', 'tokens', 'Alternation', 'a|b', 'Match one of two branches.', 'js', [
    { id: 'left', label: 'Left branch', defaultValue: 'cat' },
    { id: 'right', label: 'Right branch', defaultValue: 'dog' }
  ], (values) => `${values.left || 'cat'}|${values.right || 'dog'}`),
  createRegexBlock('char-class', 'classes', 'Character class', '[abc]', 'Match one character from a custom set.', 'js', [
    { id: 'set', label: 'Character set', defaultValue: 'abc', placeholder: 'abc' }
  ], (values) => `[${escapeRegexClass(values.set || 'abc')}]`),
  createRegexBlock('negated-class', 'classes', 'Negated class', '[^abc]', 'Reject characters from a custom set.', 'js', [
    { id: 'set', label: 'Excluded set', defaultValue: 'abc', placeholder: 'abc' }
  ], (values) => `[^${escapeRegexClass(values.set || 'abc')}]`),
  createRegexBlock('range-class', 'classes', 'Character range', '[a-z]', 'Match a custom range or mixed range source.', 'js', [
    { id: 'range', label: 'Range', defaultValue: 'a-z', placeholder: 'a-zA-Z0-9' }
  ], (values) => `[${String(values.range || 'a-z').trim() || 'a-z'}]`),
  createRegexBlock('unicode-property', 'classes', 'Unicode property', '\\p{L}', 'Unicode property escape.', 'js-modern', [
    { id: 'property', label: 'Property', defaultValue: 'L', placeholder: 'L or Script=Latin' }
  ], (values) => `\\p{${String(values.property || 'L').trim() || 'L'}}`),
  createRegexBlock('unicode-property-negated', 'classes', 'Negated Unicode property', '\\P{L}', 'Negated Unicode property escape.', 'js-modern', [
    { id: 'property', label: 'Property', defaultValue: 'L', placeholder: 'L or Script=Latin' }
  ], (values) => `\\P{${String(values.property || 'L').trim() || 'L'}}`),
  createRegexBlock('capture-group', 'groups', 'Capturing group', '(...)', 'Group a subpattern and capture it.', 'js', [
    { id: 'pattern', label: 'Pattern', defaultValue: '\\d+', placeholder: '\\d+' }
  ], (values) => `(${values.pattern || '\\d+'})`),
  createRegexBlock('non-capture-group', 'groups', 'Non-capturing group', '(?:...)', 'Group without capturing.', 'js', [
    { id: 'pattern', label: 'Pattern', defaultValue: 'cat|dog', placeholder: 'cat|dog' }
  ], (values) => `(?:${values.pattern || 'cat|dog'})`),
  createRegexBlock('named-group', 'groups', 'Named group', '(?<name>...)', 'Named capturing group.', 'js-modern', [
    { id: 'name', label: 'Group name', defaultValue: 'value', placeholder: 'value' },
    { id: 'pattern', label: 'Pattern', defaultValue: '\\d+', placeholder: '\\d+' }
  ], (values) => `(?<${toRegexIdentifier(values.name || 'value')}>${values.pattern || '\\d+'})`),
  createRegexBlock('named-backref', 'backrefs', 'Named backreference', '\\k<name>', 'Reference a named group.', 'js-modern', [
    { id: 'name', label: 'Group name', defaultValue: 'value', placeholder: 'value' }
  ], (values) => `\\k<${toRegexIdentifier(values.name || 'value')}>`),
  createRegexBlock('lookahead', 'lookaround', 'Positive lookahead', '(?=...)', 'Require following text without consuming it.', 'js', [
    { id: 'pattern', label: 'Assertion', defaultValue: 'USD', placeholder: 'USD' }
  ], (values) => `(?=${values.pattern || 'USD'})`),
  createRegexBlock('negative-lookahead', 'lookaround', 'Negative lookahead', '(?!...)', 'Reject following text without consuming it.', 'js', [
    { id: 'pattern', label: 'Assertion', defaultValue: 'draft', placeholder: 'draft' }
  ], (values) => `(?!${values.pattern || 'draft'})`),
  createRegexBlock('lookbehind', 'lookaround', 'Positive lookbehind', '(?<=...)', 'Require preceding text without consuming it.', 'js-modern', [
    { id: 'pattern', label: 'Assertion', defaultValue: '\\$', placeholder: '\\$' }
  ], (values) => `(?<=${values.pattern || '\\$'})`),
  createRegexBlock('negative-lookbehind', 'lookaround', 'Negative lookbehind', '(?<!...)', 'Reject preceding text without consuming it.', 'js-modern', [
    { id: 'pattern', label: 'Assertion', defaultValue: 'draft-', placeholder: 'draft-' }
  ], (values) => `(?<!${values.pattern || 'draft-'})`),
  createRegexBlock('optional-quantifier', 'quantifiers', 'Optional', '?', 'Zero or one repetition.', 'js', [
    { id: 'target', label: 'Target', defaultValue: '\\d', placeholder: '\\d' }
  ], (values) => `${values.target || '\\d'}?`),
  createRegexBlock('zero-or-more', 'quantifiers', 'Zero or more', '*', 'Greedy repetition.', 'js', [
    { id: 'target', label: 'Target', defaultValue: '\\d', placeholder: '\\d' }
  ], (values) => `${values.target || '\\d'}*`),
  createRegexBlock('one-or-more', 'quantifiers', 'One or more', '+', 'Greedy repetition.', 'js', [
    { id: 'target', label: 'Target', defaultValue: '\\d', placeholder: '\\d' }
  ], (values) => `${values.target || '\\d'}+`),
  createRegexBlock('exact-quantifier', 'quantifiers', 'Exact count', 'a{3}', 'Match an exact number of repetitions.', 'js', [
    { id: 'target', label: 'Target', defaultValue: '\\d', placeholder: '\\d' },
    { id: 'count', label: 'Count', defaultValue: '4', inputMode: 'numeric' }
  ], (values) => `${values.target || '\\d'}{${clampRegexCount(values.count, 4)}}`),
  createRegexBlock('range-quantifier', 'quantifiers', 'Range count', 'a{2,5}', 'Match within a repetition range.', 'js', [
    { id: 'target', label: 'Target', defaultValue: '\\d', placeholder: '\\d' },
    { id: 'min', label: 'Min', defaultValue: '2', inputMode: 'numeric' },
    { id: 'max', label: 'Max', defaultValue: '5', inputMode: 'numeric' }
  ], (values) => {
    const min = clampRegexCount(values.min, 2);
    const max = Math.max(min, clampRegexCount(values.max, 5));
    return `${values.target || '\\d'}{${min},${max}}`;
  }),
  createRegexBlock('open-quantifier', 'quantifiers', 'At least count', 'a{2,}', 'Match a minimum number of repetitions.', 'js', [
    { id: 'target', label: 'Target', defaultValue: '\\d', placeholder: '\\d' },
    { id: 'min', label: 'Min', defaultValue: '2', inputMode: 'numeric' }
  ], (values) => `${values.target || '\\d'}{${clampRegexCount(values.min, 2)},}`),
  createRegexBlock('start-anchor', 'anchors', 'Start anchor', '^', 'Match only at the start.', 'js'),
  createRegexBlock('end-anchor', 'anchors', 'End anchor', '$', 'Match only at the end.', 'js'),
  createRegexBlock('word-boundary', 'anchors', 'Word boundary', '\\b', 'Boundary between word and non-word characters.', 'js'),
  createRegexBlock('non-word-boundary', 'anchors', 'Non-word boundary', '\\B', 'Position that is not a word boundary.', 'js'),
  createRegexBlock('hex-char', 'tokens', 'Hex character', '\\x00', 'Hexadecimal escape.', 'js', [
    { id: 'code', label: 'Hex Code', defaultValue: '20', placeholder: '20' }
  ], (values) => `\\x${String(values.code || '20').trim().padStart(2, '0').slice(0, 2)}`),
  createRegexBlock('unicode-char', 'tokens', 'Unicode character', '\\u0000', 'Unicode escape.', 'js', [
    { id: 'code', label: 'Unicode Hex', defaultValue: '0020', placeholder: '0020' }
  ], (values) => `\\u${String(values.code || '0020').trim().padStart(4, '0').slice(0, 4)}`),
  createRegexBlock('unicode-char-ext', 'tokens', 'Unicode (Extended)', '\\u{0}', 'Extended Unicode escape.', 'js-modern', [
    { id: 'code', label: 'Unicode Hex', defaultValue: '1F600', placeholder: '1F600' }
  ], (values) => `\\u{${String(values.code || '1F600').trim()}}`)
];

export function buildRegexBlockToken(blockId, values = {}) {
  const block = REGEX_BLOCK_CATALOG.find((entry) => entry.id === blockId);
  if (!block) return '';
  if (typeof block.build === 'function') {
    return String(block.build(values || {}) || '');
  }
  return String(block.token || '');
}

const TRACE_UNSUPPORTED_TOKENS = [
  { regex: /\\(?:[1-9]\d*|k<[^>]+>)/, note: 'Backreferences use summary tracing only.' },
  { regex: /(?:\*|\+|\?|\{[^}]+\})\+/, note: 'Possessive quantifiers use summary tracing only.' },
  { regex: /\[(?:[^\]\\]|\\.)*&&(?:[^\]\\]|\\.)*\]/, note: 'Set intersections use summary tracing only.' }
];

export function sanitizeRegexFlags(value) {
  const allowed = new Set(['d', 'g', 'i', 'm', 's', 'u', 'v', 'y']);
  const result = [];
  for (const char of String(value || '')) {
    if (allowed.has(char) && !result.includes(char)) result.push(char);
  }
  return result.join('');
}

export function buildRegexFlagMatrix(activeFlags = '') {
  const selected = new Set(sanitizeRegexFlags(activeFlags));
  return REGEX_FLAG_METADATA.map((entry) => ({
    ...entry,
    active: selected.has(entry.flag)
  }));
}

export function getRegexCaptureGroups(pattern) {
  const source = String(pattern || '');
  if (!source) return [];
  const groups = [];
  let groupIndex = 0;
  let inClass = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '\\') {
      index += 1;
      continue;
    }
    if (char === '[' && !inClass) {
      inClass = true;
      continue;
    }
    if (char === ']' && inClass) {
      inClass = false;
      continue;
    }
    if (inClass || char !== '(') continue;

    if (source[index + 1] === '?') {
      if (source[index + 2] === '<' && source[index + 3] !== '=' && source[index + 3] !== '!') {
        const end = source.indexOf('>', index + 3);
        groupIndex += 1;
        groups.push({
          index: groupIndex,
          name: end === -1 ? '' : source.slice(index + 3, end),
          token: `$${groupIndex}`
        });
      }
      continue;
    }

    groupIndex += 1;
    groups.push({
      index: groupIndex,
      name: '',
      token: `$${groupIndex}`
    });
  }

  return groups;
}

export function createRegex(pattern, flags = '') {
  return new RegExp(pattern, sanitizeRegexFlags(flags));
}

export function analyzeRegex(pattern, flags, text) {
  if (!pattern) return { empty: true, matches: [], count: 0, highlightedText: escapeHtml(text || '') };
  try {
    const normalizedFlags = sanitizeRegexFlags(flags);
    const regex = createRegex(pattern, normalizedFlags.includes('g') ? normalizedFlags : `${normalizedFlags}g`);
    const sourceText = String(text || '');
    const matches = Array.from(sourceText.matchAll(regex)).map((match, index) => ({
      id: index + 1,
      value: match[0],
      index: match.index,
      end: match.index + match[0].length,
      groups: match.slice(1),
      namedGroups: match.groups || {}
    }));
    return {
      empty: false,
      error: null,
      regex,
      count: matches.length,
      matches,
      highlightedText: highlightMatches(sourceText, matches)
    };
  } catch (error) {
    return {
      empty: false,
      error: error.message,
      matches: [],
      count: 0,
      highlightedText: escapeHtml(text || '')
    };
  }
}

export function explainRegexPattern(pattern) {
  const source = String(pattern || '');
  if (!source) return [];
  const explanations = [];
  const tokenMap = [
    { regex: /\\d/g, label: '\\d', detail: 'digit' },
    { regex: /\\w/g, label: '\\w', detail: 'word character' },
    { regex: /\\s/g, label: '\\s', detail: 'whitespace' },
    { regex: /\[[^\]]+\]/g, label: '[]', detail: 'character class' },
    { regex: /\(\?:/g, label: '(?:', detail: 'non-capturing group' },
    { regex: /\((?!\?:|\?<)/g, label: '()', detail: 'capturing group' },
    { regex: /\(\?<[^>]+>/g, label: '(?<name>', detail: 'named capturing group' },
    { regex: /\*/g, label: '*', detail: 'zero or more' },
    { regex: /\+/g, label: '+', detail: 'one or more' },
    { regex: /\?/g, label: '?', detail: 'optional or lazy modifier' },
    { regex: /\{[^}]+\}/g, label: '{}', detail: 'explicit repetition range' },
    { regex: /\^/g, label: '^', detail: 'start anchor' },
    { regex: /\$/g, label: '$', detail: 'end anchor' },
    { regex: /\|/g, label: '|', detail: 'alternation' },
    { regex: /\./g, label: '.', detail: 'any character except newline unless dotall' }
  ];
  tokenMap.forEach((entry) => {
    if (entry.regex.test(source)) explanations.push(entry);
  });
  return explanations;
}

export function buildRegexPreset(kind) {
  return PRESET_MAP[kind] || null;
}

export function getDefaultRegexSnippets() {
  return PRESET_OPTIONS().map(([id, preset]) => ({
    id,
    name: id.replace(/^[a-z]/, (char) => char.toUpperCase()),
    pattern: preset.pattern,
    flags: preset.flags,
    sample: preset.sample,
    builtIn: true
  }));
}

export function createRegexSnippet(name, pattern, flags, sample = '') {
  const normalizedName = String(name || '').trim();
  if (!normalizedName) throw new Error('Snippet name is required.');
  createRegex(pattern, sanitizeRegexFlags(flags));
  return {
    id: `${normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${sanitizeRegexFlags(flags) || 'plain'}`,
    name: normalizedName,
    pattern,
    flags: sanitizeRegexFlags(flags),
    sample: String(sample || ''),
    builtIn: false
  };
}

export function mergeRegexSnippets(savedSnippets = []) {
  const merged = [...getDefaultRegexSnippets()];
  const seen = new Set(merged.map((snippet) => snippet.id));
  for (const snippet of savedSnippets || []) {
    if (!snippet?.id || seen.has(snippet.id)) continue;
    merged.push({
      id: snippet.id,
      name: String(snippet.name || 'Snippet'),
      pattern: String(snippet.pattern || ''),
      flags: sanitizeRegexFlags(snippet.flags || ''),
      sample: String(snippet.sample || ''),
      builtIn: false
    });
    seen.add(snippet.id);
  }
  return merged;
}

export function getRegexCompatibilityNotes(flags = '') {
  return buildRegexFlagMatrix(flags)
    .filter((entry) => entry.active)
    .map((entry) => `${entry.flag}: ${entry.compatibility}`);
}

export function buildReplacementPreview(pattern, flags, text, replacement) {
  const sourceText = String(text || '');
  const groups = getRegexCaptureGroups(pattern);
  const template = buildReplacementTemplate(replacement, groups);
  if (!pattern) return { output: sourceText, count: 0, error: null, template };
  try {
    const normalizedFlags = sanitizeRegexFlags(flags);
    const runFlags = normalizedFlags.includes('g') ? normalizedFlags : `${normalizedFlags}g`;
    const counter = createRegex(pattern, runFlags);
    const regex = createRegex(pattern, runFlags);
    const count = Array.from(sourceText.matchAll(counter)).length;
    const output = sourceText.replace(regex, template);
    return { output, count, error: null, template };
  } catch (error) {
    return { output: sourceText, count: 0, error: error.message, template };
  }
}

function buildReplacementTemplate(replacement, groups = []) {
  if (replacement && typeof replacement === 'object' && replacement.mode === 'groups') {
    const drafts = replacement.groups && typeof replacement.groups === 'object' ? replacement.groups : {};
    const parts = groups.length
      ? groups.map((group) => {
          if (Object.prototype.hasOwnProperty.call(drafts, group.index)) return String(drafts[group.index] ?? '');
          if (Object.prototype.hasOwnProperty.call(drafts, String(group.index))) return String(drafts[String(group.index)] ?? '');
          return group.token;
        })
      : [Object.prototype.hasOwnProperty.call(drafts, 'match') ? String(drafts.match ?? '') : String(replacement.match ?? '$MATCH')];
    return normalizeReplacementTemplate(parts.join(''));
  }
  return normalizeReplacementTemplate(String(replacement || ''));
}

function normalizeReplacementTemplate(template) {
  return String(template || '').replace(/\$MATCH/g, '$$&');
}

export function insertRegexBlockToken(pattern, token, selectionStart = null, selectionEnd = null) {
  const source = String(pattern || '');
  const safeToken = String(token || '');
  const start = Number.isInteger(selectionStart) ? Math.max(0, selectionStart) : source.length;
  const end = Number.isInteger(selectionEnd) ? Math.max(start, selectionEnd) : start;
  return `${source.slice(0, start)}${safeToken}${source.slice(end)}`;
}

export function buildRegexAiPrompt(description, sample = '') {
  const normalizedDescription = String(description || '').trim();
  const normalizedSample = String(sample || '').trim();
  return [
    'Task: Draft a high-performance JavaScript RegExp for modern browser engines (V8/SpiderMonkey).',
    `Goal:\n${normalizedDescription || 'Create a regex that matches the requested text.'}`,
    normalizedSample ? `Sample text:\n${normalizedSample}` : '',
    'Requirements:',
    '1. Return exactly one compact JSON object. No prose, markdown, or commentary.',
    '2. Schema: {"pattern":"...","flags":"g"}',
    '3. Escape backslashes (\\) correctly for JSON string values.',
    '4. Use only "pattern" and "flags" keys.',
    '5. Prefer non-capturing groups (?:...) unless capture is strictly necessary.',
    '6. Use \\b or anchors when the target should stand alone instead of matching inside larger words.',
    '7. Avoid broad .* sections when a bounded token, explicit class, or lazy segment is enough.',
    '8. Avoid catastrophic backtracking; use explicit structure and tight quantifiers.',
    '9. Choose appropriate flags (d, g, i, m, s, u, v, y), keep them unique, and omit unused flags.'
  ].join('\n\n');
}

export function buildRegexAiMessages(description, sample = '') {
  return [
    {
      role: 'system',
      content: [
        'You are an expert Regex Engineer specializing in modern JavaScript (ES2024+).',
        'Your goal is to provide safe, efficient, and correct RegExp patterns.',
        'Return JSON only with "pattern" and "flags".',
        'You MUST return ONLY a JSON object. No explanations, no backticks, no markdown.',
        'You prefer named capture groups (?<name>...) for clarity when capture is requested.',
        'You follow JSON string escaping rules strictly (e.g. \\d becomes \\\\d).'
      ].join('\n')
    },
    {
      role: 'user',
      content: buildRegexAiPrompt(description, sample)
    }
  ];
}

export function resolveDebugSegmentState(ranges, start, end) {
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

export function buildRegexAiJsonGrammar() {
  const orderedFlags = ['d', 'g', 'i', 'm', 's', 'u', 'v', 'y'];
  const flagRules = [
    `flags-body ::= "" | ${orderedFlags.map((flag) => `"${flag}" flags-after-${flag}`).join(' | ')}`
  ];
  orderedFlags.forEach((flag, index) => {
    const tailOptions = orderedFlags
      .slice(index + 1)
      .map((nextFlag) => `"${nextFlag}" flags-after-${nextFlag}`);
    flagRules.push(`flags-after-${flag} ::= ""${tailOptions.length ? ` | ${tailOptions.join(' | ')}` : ''}`);
  });
  return [
    String.raw`root ::= "{" ws "\"pattern\"" ws ":" ws string ws "," ws "\"flags\"" ws ":" ws flags ws "}" ws`,
    `flags ::= "\\"" flags-body "\\""`.replace(/\\"/g, '"'),
    ...flagRules,
    String.raw`string ::= "\"" string-char* "\""`,
    String.raw`string-char ::= [^"\\\x00-\x1F] | "\\" escape`,
    String.raw`escape ::= ["\\/bfnrt] | "u" hex hex hex hex`,
    String.raw`hex ::= [0-9a-fA-F]`,
    String.raw`ws ::= [ \t\n\r]*`
  ].join('\n');
}

export function buildRegexAiCompletionPrompt(description, sample = '') {
  const normalizedDescription = String(description || '').trim() || 'Match the requested text.';
  const normalizedSample = String(sample || '').trim() || 'none';
  return [
    'Complete the missing JavaScript regex pattern.',
    'Return only the missing pattern source.',
    'No slashes. No prose. Short correct answer. DO NOT PROVIDE ANY EXPLANATIONS.',
    'Do not emit the closing quote.',
    'Goal: match invoice IDs like INV-1042',
    'Sample: Open INV-1042 and INV-2201 before noon.',
    'Result: \\bINV-\\d{4}\\b',
    `Goal: ${normalizedDescription}`,
    `Sample: ${normalizedSample}`,
    '<|fim_prefix|>{"pattern":"<|fim_suffix|>","flags":"g"}<|fim_middle|>'
  ].join('\n');
}

export function shouldUseRegexAiCompletionMode(model) {
  return Array.isArray(model?.tasks) && model.tasks.includes('code-fast');
}

export function buildRegexAiRequestPayload({
  model,
  description,
  sample = '',
  temp = 0.1,
  maxTokens = 48,
  requestId = 'regex-builder'
} = {}) {
  if (shouldUseRegexAiCompletionMode(model)) {
    return {
      requestId,
      isRaw: true,
      prompt: buildRegexAiCompletionPrompt(description, sample),
      params: {
        temp,
        n_predict: maxTokens,
        stop: ['"', '\n']
      }
    };
  }

  const messages = buildRegexAiMessages(description, sample);
  const grammar = buildRegexAiJsonGrammar();
  return {
    requestId,
    prompt: buildRegexAiPrompt(description, sample),
    messages,
    responseFormat: 'json',
    grammar,
    params: {
      systemPrompt: messages[0]?.content || 'Write JavaScript regex. Return JSON only with pattern and flags.',
      responseFormat: 'json',
      grammar,
      temp,
      top_p: 0.2,
      n_predict: maxTokens
    }
  };
}

export function parseRegexAiResponse(raw, fallback = null) {
  const source = String(raw || '').trim();
  if (!source) return null;
  const fallbackSuggestion = normalizeAiSuggestion(fallback);
  try {
    return mergeAiSuggestion(normalizeAiSuggestion(JSON.parse(source)), fallbackSuggestion);
  } catch {}
  const fenced = source.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return mergeAiSuggestion(normalizeAiSuggestion(JSON.parse(fenced[1])), fallbackSuggestion);
    } catch {}
  }
  const objectLike = extractFirstBalancedJsonObject(source);
  if (objectLike?.jsonText) {
    try {
      return mergeAiSuggestion(normalizeAiSuggestion(JSON.parse(objectLike.jsonText)), fallbackSuggestion);
    } catch {}
  }

  // Try parsing as a literal /pattern/flags first
  const literal = parseRegexLiteral(source);
  if (literal) {
    return mergeAiSuggestion({
      pattern: literal.pattern,
      flags: literal.flags || fallbackSuggestion?.flags || 'g',
      explanation: '',
      sample: '',
      rationale: [],
      confidence: fallbackSuggestion?.confidence || 'medium'
    }, fallbackSuggestion);
  }

  // Fallback to raw pattern source extraction
  const rawPattern = normalizeRawPatternSource(source);
  if (rawPattern) {
    return mergeAiSuggestion({
      pattern: rawPattern,
      flags: fallbackSuggestion?.flags || 'g',
      explanation: '',
      sample: '',
      rationale: [],
      confidence: fallbackSuggestion?.confidence || 'medium'
    }, fallbackSuggestion);
  }
  return null;
}

export function buildRegexHeuristicSuggestion(description, sample = '') {
  const text = `${String(description || '')}\n${String(sample || '')}`.trim();
  const lower = text.toLowerCase();
  const sampled = String(sample || '');
  if (!text) {
    return {
      pattern: '',
      flags: 'g',
      explanation: 'Add a natural-language goal or sample text to draft a regex.',
      sample: sampled,
      rationale: ['No description provided yet.'],
      confidence: 'low'
    };
  }

  const inference = inferPatternFromText(text, lower);
  return distillAiSuggestion({
    pattern: inference.pattern,
    flags: inference.flags || 'g',
    explanation: inference.explanation,
    sample: sampled,
    rationale: inference.rationale,
    confidence: inference.confidence
  });
}

export function debugRegexTrace(pattern, flags, text, options = {}) {
  const sourcePattern = String(pattern || '');
  const sourceText = String(text || '');
  const normalizedFlags = sanitizeRegexFlags(flags).replace(/[dgy]/g, '');
  if (!sourcePattern) {
    return {
      error: null,
      supported: true,
      note: 'Add a pattern to generate a trace.',
      steps: [],
      frames: [],
      match: null,
      summary: 'No pattern to trace.'
    };
  }

  try {
    createRegex(sourcePattern, normalizedFlags);
  } catch (error) {
    return {
      error: error.message,
      supported: false,
      note: 'The pattern must compile before it can be traced.',
      steps: [],
      frames: [],
      match: null,
      summary: 'Regex compilation failed.'
    };
  }

  const parsed = parseTracePattern(sourcePattern);
  if (parsed.error) {
    return {
      error: null,
      supported: false,
      note: parsed.error,
      steps: [],
      frames: [],
      match: null,
      summary: 'Trace parser could not expand the pattern.'
    };
  }
  if (parsed.unsupportedNote) {
    return {
      error: null,
      supported: false,
      note: parsed.unsupportedNote,
      steps: [],
      frames: [],
      match: null,
      summary: 'Trace falls back to summary mode for this pattern.'
    };
  }

  const analysis = analyzeRegex(sourcePattern, normalizedFlags, sourceText);
  const matches = analysis.matches || [];
  const maxSteps = Math.max(80, Math.min(480, options.maxSteps || 260));
  const matchIndex = matches.length
    ? Math.max(0, Math.min(matches.length - 1, options.matchIndex || 0))
    : 0;
  const targetMatch = matches[matchIndex] || null;
  const trace = createTraceRecorder(maxSteps, sourceText.length);
  let searchIndex = resolveTraceSearchStart(matches, matchIndex, trace);
  const scanLimit = targetMatch ? targetMatch.index : Math.min(sourceText.length, options.maxScanIndexes || sourceText.length);

  while (searchIndex <= scanLimit && !trace.exhausted) {
    const attempt = traceAttemptAt(parsed.node, sourceText, searchIndex, normalizedFlags, trace);
    if (attempt.success) {
      const matchedValue = sourceText.slice(searchIndex, attempt.cursor);
      const isTargetMatch = !targetMatch || (searchIndex === targetMatch.index && matchedValue === targetMatch.value);
      if (isTargetMatch) {
        const matchRecord = targetMatch || {
          id: matchIndex + 1,
          value: matchedValue,
          index: searchIndex,
          end: attempt.cursor,
          groups: [],
          namedGroups: {}
        };
        trace.push(
          'complete',
          `Full match "${matchRecord.value}" completed at ${matchRecord.index}..${matchRecord.end}.`,
          matchRecord.end,
          buildTraceSnapshot(matchRecord.index, matchRecord.end, 'full'),
          { start: 0, end: sourcePattern.length }
        );
        return {
          error: null,
          supported: true,
          note: `${trace.exhausted ? 'Trace reached the current step limit.' : 'Engine-style trace for the current match.'}${matchIndex ? ` Focused on match ${matchIndex + 1}.` : ''}`,
          steps: trace.steps,
          frames: trace.steps.map(({ cursor, ranges, kind, message, patternRange }) => ({ cursor, ranges, kind, message, patternRange })),
          match: matchRecord,
          summary: `Found match ${matchIndex + 1} at ${matchRecord.index}..${matchRecord.end}.`
        };
      }
      searchIndex = nextTraceSearchIndex({ index: searchIndex, end: attempt.cursor });
      continue;
    }
    searchIndex += 1;
  }

  trace.push('complete', 'Reached the end of the scanned text without a full match.', sourceText.length, [], { start: 0, end: sourcePattern.length });
  return {
    error: null,
    supported: true,
    note: trace.exhausted
      ? 'Trace reached the current step limit before the pattern could finish searching.'
      : 'Engine-style trace scanned the available text without finding a full match.',
    steps: trace.steps,
    frames: trace.steps.map(({ cursor, ranges, kind, message, patternRange }) => ({ cursor, ranges, kind, message, patternRange })),
    match: targetMatch,
    summary: targetMatch
      ? `Trace did not reach match ${matchIndex + 1} before the step budget ended.`
      : 'No full match found in the scanned text.'
  };
}

function parseTracePattern(pattern) {
  const source = String(pattern || '');
  const unsupported = TRACE_UNSUPPORTED_TOKENS.find((entry) => entry.regex.test(source));
  if (unsupported) return { node: null, error: null, unsupportedNote: unsupported.note };
  const state = {
    source,
    index: 0,
    error: null,
    unsupportedNote: null
  };
  const node = parseTraceExpression(state);
  if (state.error) return { node: null, error: state.error, unsupportedNote: null };
  if (state.unsupportedNote) return { node: null, error: null, unsupportedNote: state.unsupportedNote };
  if (state.index !== state.source.length) {
    return { node: null, error: 'Trace parser stopped before the full pattern was consumed.', unsupportedNote: null };
  }
  return { node, error: null, unsupportedNote: null };
}

function parseTraceExpression(state, stopChar = '') {
  const start = state.index;
  const options = [parseTraceSequence(state, stopChar)];
  while (!state.error && state.source[state.index] === '|') {
    state.index += 1;
    options.push(parseTraceSequence(state, stopChar));
  }
  const end = state.index;
  if (options.length === 1) return options[0];
  return {
    type: 'alternation',
    raw: state.source.slice(start, end),
    start,
    end,
    options
  };
}

function parseTraceSequence(state, stopChar = '') {
  const start = state.index;
  const items = [];
  while (!state.error && state.index < state.source.length) {
    const char = state.source[state.index];
    if (char === '|' || (stopChar && char === stopChar)) break;
    const term = parseTraceTerm(state);
    if (!term) break;
    items.push(term);
  }
  const end = state.index;
  return {
    type: 'sequence',
    raw: state.source.slice(start, end),
    start,
    end,
    items
  };
}

function parseTraceTerm(state) {
  const start = state.index;
  const atom = parseTraceAtom(state);
  if (!atom || state.error) return null;
  const quantifier = parseQuantifier(state.source, state.index);
  if (quantifier.endIndex !== state.index) {
    state.index = quantifier.endIndex;
    const end = state.index;
    return {
      type: 'quantifier',
      raw: state.source.slice(start, end),
      start,
      end,
      atom,
      min: quantifier.value.min,
      max: quantifier.value.max,
      mode: quantifier.value.mode
    };
  }
  return atom;
}

function parseTraceAtom(state) {
  const start = state.index;
  const char = state.source[state.index];
  if (!char) return null;
  if (char === '(') return parseTraceGroup(state);
  if (char === '[') {
    const token = parseCharacterClassToken(state.source, state.index);
    if (token.error) {
      state.error = token.error;
      return null;
    }
    state.index = token.endIndex;
    const end = state.index;
    return { type: 'token', raw: token.raw, start, end };
  }
  if (char === '\\') {
    const raw = readEscapeToken(state.source, state.index);
    state.index += raw.length;
    const end = state.index;
    if (/^\\(?:[1-9]\d*|k<[^>]+>)$/.test(raw)) {
      state.unsupportedNote = 'Backreferences use summary tracing only.';
      return null;
    }
    if (raw === '\\b') return { type: 'assertion', raw, start, end, kind: 'word-boundary' };
    if (raw === '\\B') return { type: 'assertion', raw, start, end, kind: 'non-word-boundary' };
    return { type: 'token', raw, start, end };
  }
  if (char === '^') {
    state.index += 1;
    const end = state.index;
    return { type: 'assertion', raw: '^', start, end, kind: 'start' };
  }
  if (char === '$') {
    state.index += 1;
    const end = state.index;
    return { type: 'assertion', raw: '$', start, end, kind: 'end' };
  }
  state.index += 1;
  const end = state.index;
  return { type: 'token', raw: char, start, end };
}

function parseTraceGroup(state) {
  const start = state.index;
  state.index += 1;
  let label = 'group';

  if (state.source[state.index] === '?') {
    const marker = state.source[state.index + 1];
    if (marker === ':') {
      label = 'group';
      state.index += 2;
    } else if (marker === '=' || marker === '!') {
      const raw = readGroupToken(state.source, start);
      state.index = start + raw.length;
      const end = state.index;
      return {
        type: 'assertion',
        raw,
        start,
        end,
        kind: marker === '=' ? 'lookahead' : 'negative-lookahead'
      };
    } else if (marker === '<') {
      const lookaroundMarker = state.source[state.index + 2];
      if (lookaroundMarker === '=' || lookaroundMarker === '!') {
        const raw = readGroupToken(state.source, start);
        state.index = start + raw.length;
        const end = state.index;
        return {
          type: 'assertion',
          raw,
          start,
          end,
          kind: lookaroundMarker === '=' ? 'lookbehind' : 'negative-lookbehind'
        };
      }
      const close = state.source.indexOf('>', state.index + 2);
      if (close === -1) {
        state.error = 'Unterminated named group.';
        return null;
      }
      label = `group ${state.source.slice(state.index + 2, close).trim() || 'value'}`;
      state.index = close + 1;
    } else {
      state.unsupportedNote = 'Extended group modifiers use summary tracing only.';
      return null;
    }
  }

  const child = parseTraceExpression(state, ')');
  if (state.source[state.index] !== ')') {
    state.error = 'Unterminated group.';
    return null;
  }
  state.index += 1;
  const end = state.index;
  return {
    type: 'group',
    raw: state.source.slice(start, end),
    start,
    end,
    label,
    child
  };
}

function createTraceRecorder(maxSteps, textLength) {
  const recorder = {
    steps: [],
    exhausted: false,
    push(kind, message, cursor, ranges = [], patternRange = null) {
      if (recorder.steps.length >= maxSteps) {
        recorder.exhausted = true;
        return false;
      }
      recorder.steps.push({
        kind,
        message,
        cursor: Math.max(0, Math.min(textLength, cursor)),
        ranges: normalizeTraceRanges(ranges, textLength),
        patternRange: patternRange ? { start: patternRange.start, end: patternRange.end } : null
      });
      return true;
    }
  };
  return recorder;
}

function traceAttemptAt(node, text, start, flags, trace) {
  const visible = text[start] ?? '∅';
  const scanRanges = start < text.length ? [{ start, end: start + 1, state: 'attempt' }] : [];
  trace.push(
    'scan',
    `Scanning from index ${start}. Current character: ${describeTraceChar(visible)}.`,
    start,
    scanRanges,
    node ? { start: node.start, end: node.end } : null
  );
  const scanStepIndex = trace.steps.length - 1;
  const stepCountBefore = trace.steps.length;
  const result = matchTraceNode(node, start, { text, flags, start, trace });
  if (result.success || trace.exhausted) return result;
  if (result.cursor === start && trace.steps.length === stepCountBefore) {
    trace.steps[scanStepIndex].message = `${trace.steps[scanStepIndex].message} ${result.message}`;
    return result;
  }
  trace.push(
    'release',
    result.message,
    result.cursor,
    buildTraceSnapshot(start, result.failureEnd ?? Math.max(start + 1, result.cursor), 'fail'),
    node ? { start: node.start, end: node.end } : null
  );
  return result;
}

function matchTraceNode(node, cursor, env) {
  if (!node) return buildTraceFailure(cursor, 'Trace node is missing.', cursor);
  if (env.trace.exhausted) return buildTraceFailure(cursor, 'Trace reached the current step limit.', cursor);
  if (node.type === 'sequence') return matchTraceSequence(node.items, 0, cursor, env);
  if (node.type === 'alternation') return matchTraceAlternation(node.options, cursor, env);
  if (node.type === 'group') return matchTraceNode(node.child, cursor, env);
  if (node.type === 'quantifier') return matchTraceQuantifier(node, [{ type: 'sequence-placeholder' }], 0, cursor, env, 0);
  if (node.type === 'assertion') return matchTraceAssertion(node, cursor, env);
  if (node.type === 'token') return matchTraceToken(node, cursor, env);
  return buildTraceFailure(cursor, 'Unknown trace node type.', cursor);
}

function matchTraceSequence(items, index, cursor, env) {
  if (index >= items.length) return { success: true, cursor };
  const node = items[index];
  if (node.type === 'quantifier') {
    return matchTraceQuantifier(node, items, index, cursor, env, 0);
  }
  const result = matchTraceNode(node, cursor, env);
  if (!result.success) return result;
  return matchTraceSequence(items, index + 1, result.cursor, env);
}

function matchTraceAlternation(options, cursor, env) {
  let lastFailure = buildTraceFailure(cursor, `No branch matched at index ${cursor}.`, Math.min(env.text.length, cursor + 1));
  for (let index = 0; index < options.length; index += 1) {
    const option = options[index];
    env.trace.push(
      'branch',
      `Trying branch ${index + 1} of ${options.length}: ${option.raw || '(empty)'}.`,
      cursor,
      buildTraceSnapshot(env.start, cursor, 'attempt'),
      { start: option.start, end: option.end }
    );
    const result = matchTraceNode(option, cursor, env);
    if (result.success) return result;
    lastFailure = result;
    if (index < options.length - 1 && !env.trace.exhausted) {
      env.trace.push(
        'release',
        `Branch ${index + 1} failed. ${result.message}`,
        result.cursor,
        buildTraceSnapshot(env.start, result.failureEnd ?? Math.max(env.start + 1, result.cursor), 'fail'),
        { start: option.start, end: option.end }
      );
    }
  }
  return lastFailure;
}

function matchTraceQuantifier(node, items, index, cursor, env, count = 0) {
  const max = Math.max(node.min, Number.isFinite(node.max) ? node.max : Math.max(0, env.text.length - cursor));

  if (node.mode === 'lazy') {
    let restFailure = null;
    if (count >= node.min) {
      const rest = items[index + 1]
        ? matchTraceSequence(items, index + 1, cursor, env)
        : { success: true, cursor };
      if (rest.success) return rest;
      restFailure = rest;
    }
    if (count >= max) return restFailure || buildTraceFailure(cursor, buildTraceFailureMessage(node.atom.raw, cursor, env.text), Math.min(env.text.length, cursor + 1));
    const atom = matchTraceNode(node.atom, cursor, env);
    if (!atom.success) return restFailure || atom;
    if (atom.cursor === cursor) {
      return buildTraceFailure(cursor, `${node.raw} cannot repeat a zero-width token in step tracing.`, cursor);
    }
    if (count >= node.min) {
      env.trace.push(
        'branch',
        `Expanded ${node.raw} to ${count + 1} repetition${count + 1 === 1 ? '' : 's'}.`,
        atom.cursor,
        buildTraceSnapshot(env.start, atom.cursor, 'attempt'),
        { start: node.start, end: node.end }
      );
    }
    return matchTraceQuantifier(node, items, index, atom.cursor, env, count + 1);
  }

  if (count < max) {
    const atom = matchTraceNode(node.atom, cursor, env);
    if (atom.success) {
      if (atom.cursor === cursor) {
        return buildTraceFailure(cursor, `${node.raw} cannot repeat a zero-width token in step tracing.`, cursor);
      }
      const deeper = matchTraceQuantifier(node, items, index, atom.cursor, env, count + 1);
      if (deeper.success) return deeper;
      if (count + 1 >= node.min && !env.trace.exhausted) {
        env.trace.push(
          'branch',
          `Backtracked ${node.raw} to ${count} repetition${count === 1 ? '' : 's'}.`,
          cursor,
          buildTraceSnapshot(env.start, cursor, 'attempt'),
          { start: node.start, end: node.end }
        );
      }
      if (count < node.min) return deeper;
    } else if (count < node.min) {
      return atom;
    }
  }

  if (count >= node.min) {
    return items[index + 1]
      ? matchTraceSequence(items, index + 1, cursor, env)
      : { success: true, cursor };
  }

  return buildTraceFailure(cursor, buildTraceFailureMessage(node.atom.raw, cursor, env.text), Math.min(env.text.length, cursor + 1));
}

function matchTraceAssertion(node, cursor, env) {
  if (!testTraceAssertion(node, cursor, env.text, env.flags)) {
    return buildTraceFailure(cursor, `${node.raw} failed at index ${cursor}.`, Math.min(env.text.length, cursor + 1));
  }
  env.trace.push(
    'assert',
    describeTraceAssertion(node, cursor, env.text, env.flags),
    cursor,
    buildTraceSnapshot(env.start, cursor, 'attempt'),
    { start: node.start, end: node.end }
  );
  return { success: true, cursor };
}

function matchTraceToken(node, cursor, env) {
  const value = matchTraceRaw(node.raw, env.text, cursor, env.flags);
  if (!value) {
    return buildTraceFailure(
      cursor,
      buildTraceFailureMessage(node.raw, cursor, env.text),
      Math.min(env.text.length, cursor + 1)
    );
  }
  const end = cursor + value.length;
  env.trace.push(
    'match',
    `${describeTraceNode(node)} matched ${describeTraceChar(value)} at index ${cursor}.`,
    end,
    buildTraceSnapshot(env.start, end, 'attempt'),
    { start: node.start, end: node.end }
  );
  return { success: true, cursor: end };
}

function matchTraceRaw(raw, text, cursor, flags) {
  try {
    const regex = new RegExp(`^(?:${raw})`, flags);
    const match = regex.exec(text.slice(cursor));
    return match?.[0] || '';
  } catch {
    return '';
  }
}

function resolveTraceSearchStart(matches, matchIndex, trace) {
  if (matchIndex <= 0) return 0;
  const next = nextTraceSearchIndex(matches[matchIndex - 1]);
  trace.push(
    'skip',
    `Skipped ${matchIndex} earlier match${matchIndex === 1 ? '' : 'es'} to focus on match ${matchIndex + 1}.`,
    next,
    []
  );
  return next;
}

function nextTraceSearchIndex(match) {
  if (!match) return 0;
  return match.end > match.index ? match.end : match.index + 1;
}

function buildTraceFailure(cursor, message, failureEnd = cursor) {
  return {
    success: false,
    cursor,
    message,
    failureEnd: Math.max(cursor, failureEnd)
  };
}

function buildTraceFailureMessage(raw, cursor, text) {
  return `Expected ${describeTraceNode({ raw })} at index ${cursor} but found ${describeTraceChar(text[cursor] ?? '∅')}.`;
}

function buildTraceSnapshot(start, end, state = 'attempt') {
  if (!Number.isFinite(start) || !Number.isFinite(end)) return [];
  const safeStart = Math.max(0, Math.min(start, end));
  const safeEnd = Math.max(0, Math.max(start, end));
  return safeEnd > safeStart ? [{ start: safeStart, end: safeEnd, state }] : [];
}

function normalizeTraceRanges(ranges, textLength) {
  return (ranges || [])
    .map((range) => ({
      start: Math.max(0, Math.min(textLength, range.start)),
      end: Math.max(0, Math.min(textLength, range.end)),
      state: range.state || 'attempt'
    }))
    .filter((range) => range.end > range.start);
}

function describeTraceNode(node) {
  const raw = String(node?.raw || '');
  if (!raw) return 'token';
  if (raw === '.') return '.';
  if (raw.startsWith('[') || raw.startsWith('\\') || raw.startsWith('(?')) return raw;
  return JSON.stringify(raw);
}

function describeTraceChar(char) {
  return JSON.stringify(char);
}

function describeTraceAssertion(node, cursor, text, flags) {
  if (node.kind === 'word-boundary') return `${node.raw} matched a word boundary at index ${cursor}.`;
  if (node.kind === 'non-word-boundary') return `${node.raw} matched a non-word boundary at index ${cursor}.`;
  if (node.kind === 'start') return `^ matched the start condition at index ${cursor}${flags.includes('m') ? ' under multiline rules' : ''}.`;
  if (node.kind === 'end') return `$ matched the end condition at index ${cursor}${flags.includes('m') ? ' under multiline rules' : ''}.`;
  if (node.kind === 'lookahead') return `${node.raw} passed at index ${cursor}.`;
  if (node.kind === 'negative-lookahead') return `${node.raw} passed at index ${cursor}.`;
  if (node.kind === 'lookbehind') return `${node.raw} passed at index ${cursor}.`;
  if (node.kind === 'negative-lookbehind') return `${node.raw} passed at index ${cursor}.`;
  return `${node.raw} passed at index ${cursor}.`;
}

function testTraceAssertion(node, cursor, text, flags) {
  if (node.kind === 'word-boundary' || node.kind === 'non-word-boundary') {
    const leftWord = isTraceWordChar(text[cursor - 1] || '', flags);
    const rightWord = isTraceWordChar(text[cursor] || '', flags);
    const atBoundary = leftWord !== rightWord;
    return node.kind === 'word-boundary' ? atBoundary : !atBoundary;
  }
  if (node.kind === 'start') {
    return cursor === 0 || (flags.includes('m') && isLineBoundaryChar(text[cursor - 1] || ''));
  }
  if (node.kind === 'end') {
    return cursor === text.length || (flags.includes('m') && isLineBoundaryChar(text[cursor] || ''));
  }
  if (node.kind === 'lookahead' || node.kind === 'negative-lookahead') {
    return evaluateLookaroundAssertion(node.raw, cursor, text, flags, 'prefix');
  }
  if (node.kind === 'lookbehind' || node.kind === 'negative-lookbehind') {
    return evaluateLookaroundAssertion(node.raw, cursor, text, flags, 'suffix');
  }
  return false;
}

function evaluateLookaroundAssertion(raw, cursor, text, flags, mode) {
  try {
    const subject = mode === 'prefix' ? text.slice(cursor) : text.slice(0, cursor);
    const source = mode === 'prefix' ? `^(?:${raw})` : `(?:${raw})$`;
    return new RegExp(source, flags).test(subject);
  } catch {
    return false;
  }
}

function isTraceWordChar(char, flags) {
  if (!char) return false;
  try {
    return new RegExp('^\\w$', flags).test(char);
  } catch {
    return /[A-Za-z0-9_]/.test(char);
  }
}

function isLineBoundaryChar(char) {
  return char === '\n' || char === '\r' || char === '\u2028' || char === '\u2029';
}

function readGroupToken(source, start) {
  let depth = 0;
  let inClass = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (inClass) {
      if (char === ']') inClass = false;
      continue;
    }
    if (char === '[') {
      inClass = true;
      continue;
    }
    if (char === '(') depth += 1;
    if (char === ')') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  return source.slice(start);
}

function readEscapeToken(source, start) {
  const next = source[start + 1];
  if (!next) return '\\';
  if ((next === 'p' || next === 'P' || next === 'u') && source[start + 2] === '{') {
    const end = source.indexOf('}', start + 3);
    return end === -1 ? source.slice(start, start + 2) : source.slice(start, end + 1);
  }
  if (next === 'k' && (source[start + 2] === '<' || source[start + 2] === '\'')) {
    const closing = source[start + 2] === '<' ? '>' : '\'';
    const end = source.indexOf(closing, start + 3);
    return end === -1 ? source.slice(start, start + 2) : source.slice(start, end + 1);
  }
  if (next === 'c') return source.slice(start, Math.min(source.length, start + 3));
  return source.slice(start, Math.min(source.length, start + 2));
}

function parseCharacterClassToken(source, index) {
  let cursor = index + 1;
  let escaped = false;
  while (cursor < source.length) {
    const char = source[cursor];
    if (escaped) {
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === ']') {
      return {
        raw: source.slice(index, cursor + 1),
        endIndex: cursor + 1
      };
    }
    cursor += 1;
  }
  return { error: 'Unterminated character class.' };
}

function parseQuantifier(source, index) {
  const char = source[index];
  if (!char) return { value: { min: 1, max: 1, mode: 'greedy' }, endIndex: index };
  if (char === '?') return parseQuantifierMode(source, index + 1, { min: 0, max: 1, mode: 'greedy' });
  if (char === '*') return parseQuantifierMode(source, index + 1, { min: 0, max: Number.MAX_SAFE_INTEGER, mode: 'greedy' });
  if (char === '+') return parseQuantifierMode(source, index + 1, { min: 1, max: Number.MAX_SAFE_INTEGER, mode: 'greedy' });
  if (char === '{') {
    const close = source.indexOf('}', index);
    if (close === -1) return { value: { min: 1, max: 1, mode: 'greedy' }, endIndex: index };
    const payload = source.slice(index + 1, close);
    const [rawMin, rawMax] = payload.split(',');
    const min = Number.parseInt(rawMin, 10);
    const max = rawMax === undefined || rawMax === '' ? (payload.includes(',') ? Number.MAX_SAFE_INTEGER : min) : Number.parseInt(rawMax, 10);
    if (Number.isNaN(min) || Number.isNaN(max)) return { value: { min: 1, max: 1, mode: 'greedy' }, endIndex: index };
    return parseQuantifierMode(source, close + 1, { min, max, mode: 'greedy' });
  }
  return { value: { min: 1, max: 1, mode: 'greedy' }, endIndex: index };
}

function parseQuantifierMode(source, index, quantifier) {
  const modeChar = source[index];
  if (modeChar === '?') return { value: { ...quantifier, mode: 'lazy' }, endIndex: index + 1 };
  if (modeChar === '+') return { value: { ...quantifier, mode: 'possessive' }, endIndex: index + 1 };
  return { value: quantifier, endIndex: index };
}

function inferPatternFromText(text, lower) {
  const explicitCodeExample = text.match(/\b([A-Z]{2,})-(\d{2,})\b/);
  if (explicitCodeExample) {
    const prefix = explicitCodeExample[1];
    const digits = explicitCodeExample[2].length;
    return {
      pattern: `\\b${prefix}-\\d{${digits}}\\b`,
      flags: 'g',
      explanation: `Matches identifiers that begin with ${prefix}- followed by ${digits} digits.`,
      rationale: ['Detected a concrete uppercase identifier example in the provided text.', 'Specialized the draft around the observed prefix and digit width.'],
      confidence: 'high'
    };
  }

  const exactExamples = [
    { regex: /\b[A-Z]{2,}-\d{2,}\b/, pattern: '\\b[A-Z]{2,}-\\d{2,}\\b', explanation: 'Matches uppercase prefixes followed by a hyphen and digits.' },
    { regex: /\b\d{4}-\d{2}-\d{2}\b/, pattern: '\\b\\d{4}-\\d{2}-\\d{2}\\b', explanation: 'Matches ISO-style dates.' },
    { regex: /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\b/, pattern: '\\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\\b', explanation: 'Matches UUID values.' },
    { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b', explanation: 'Matches email addresses.' },
    { regex: /https?:\/\/\S+/i, pattern: 'https?:\\/\\/\\S+', explanation: 'Matches URLs that begin with http or https.' }
  ];

  for (const entry of exactExamples) {
    if (entry.regex.test(text)) {
      return {
        pattern: entry.pattern,
        flags: 'g',
        explanation: entry.explanation,
        rationale: ['Detected concrete examples in the provided text.', 'Drafted a pattern around the repeated structure.'],
        confidence: 'medium'
      };
    }
  }

  if (lower.includes('email')) {
    return {
      pattern: PRESET_MAP.email.pattern,
      flags: PRESET_MAP.email.flags,
      explanation: 'Matches standard email-like identifiers.',
      rationale: ['The request explicitly mentions email addresses.'],
      confidence: 'medium'
    };
  }
  if (lower.includes('url') || lower.includes('link')) {
    return {
      pattern: PRESET_MAP.url.pattern,
      flags: PRESET_MAP.url.flags,
      explanation: 'Matches web links that start with http or https.',
      rationale: ['The request explicitly mentions URLs or links.'],
      confidence: 'medium'
    };
  }
  if (lower.includes('uuid')) {
    return {
      pattern: PRESET_MAP.uuid.pattern,
      flags: PRESET_MAP.uuid.flags,
      explanation: 'Matches UUID values across common versions.',
      rationale: ['The request explicitly mentions UUIDs.'],
      confidence: 'medium'
    };
  }
  if (lower.includes('date')) {
    return {
      pattern: PRESET_MAP.date.pattern,
      flags: PRESET_MAP.date.flags,
      explanation: 'Matches ISO-style dates.',
      rationale: ['The request explicitly mentions dates.'],
      confidence: 'medium'
    };
  }
  if (lower.includes('hashtag')) {
    return {
      pattern: PRESET_MAP.hashtag.pattern,
      flags: PRESET_MAP.hashtag.flags,
      explanation: 'Matches hashtag-like identifiers.',
      rationale: ['The request explicitly mentions hashtags.'],
      confidence: 'medium'
    };
  }
  if (lower.includes('invoice') || lower.includes('ticket') || lower.includes('id')) {
    return {
      pattern: '\\b[A-Z]{2,}-\\d{2,}\\b',
      flags: 'g',
      explanation: 'Matches uppercase codes followed by a hyphen and digits.',
      rationale: ['The request suggests structured identifiers.'],
      confidence: 'low'
    };
  }
  if (lower.includes('number') || lower.includes('digit')) {
    return {
      pattern: '\\d+',
      flags: 'g',
      explanation: 'Matches one or more digits.',
      rationale: ['The request mentions numbers or digits.'],
      confidence: 'low'
    };
  }

  return {
    pattern: '.+',
    flags: 'g',
    explanation: 'Fallback draft that matches non-empty spans. Refine it with block controls or a sample.',
    rationale: ['No strong structural cues were found in the request.'],
    confidence: 'low'
  };
}

function normalizeAiSuggestion(value) {
  if (!value || typeof value !== 'object') return null;
  return distillAiSuggestion({
    pattern: String(value.pattern || ''),
    flags: sanitizeRegexFlags(value.flags || 'g') || 'g',
    explanation: String(value.explanation || ''),
    sample: String(value.sample || ''),
    rationale: Array.isArray(value.rationale) ? value.rationale.map((entry) => String(entry)) : [],
    confidence: String(value.confidence || 'medium')
  });
}

function distillAiSuggestion(value) {
  if (!value) return null;
  return {
    pattern: normalizeRegexPatternSource(value.pattern || ''),
    flags: sanitizeRegexFlags(value.flags || 'g') || 'g',
    explanation: trimWords(value.explanation || '', 8),
    sample: String(value.sample || ''),
    rationale: (Array.isArray(value.rationale) ? value.rationale : [])
      .map((entry) => trimWords(entry, 8))
      .filter(Boolean)
      .slice(0, 2),
    confidence: String(value.confidence || 'medium')
  };
}

function mergeAiSuggestion(primary, fallback) {
  if (!primary?.pattern && !fallback?.pattern) return null;
  return distillAiSuggestion({
    pattern: primary?.pattern || fallback?.pattern || '',
    flags: primary?.flags || fallback?.flags || 'g',
    explanation: primary?.explanation || fallback?.explanation || '',
    sample: primary?.sample || fallback?.sample || '',
    rationale: primary?.rationale?.length ? primary.rationale : (fallback?.rationale || []),
    confidence: primary?.confidence || fallback?.confidence || 'medium'
  });
}

function parseRegexLiteral(source) {
  const trimmed = String(source || '').trim();
  // Handle /pattern/flags and \/pattern\/flags
  const match = trimmed.match(/^(\\?\/)(.+)(\\?\/)([dgimsuvy]*)$/s);
  if (!match) return null;
  const [, , pattern, , flags] = match;
  try {
    const normalized = normalizeRegexPatternSource(pattern);
    createRegex(normalized, flags);
    return {
      pattern: normalized,
      flags: sanitizeRegexFlags(flags) || 'g'
    };
  } catch {
    return null;
  }
}

function normalizeRawPatternSource(source) {
  const candidates = [
    String(source || '').trim(),
    String(source || '').trim().replace(/^pattern\s*[:=]\s*/i, '').trim(),
    String(source || '').trim().replace(/^["'`]|["'`]$/g, '').trim(),
    String(source || '').trim().split('\n').map((entry) => entry.trim()).find(Boolean) || ''
  ];
  for (const candidate of candidates) {
    if (!candidate || candidate.startsWith('{') || candidate.includes('"flags"') || candidate.includes('"pattern"')) continue;
    try {
      const normalized = normalizeRegexPatternSource(candidate);
      createRegex(normalized, 'g');
      return normalized;
    } catch {}
  }
  return null;
}

function normalizeRegexPatternSource(value) {
  let pattern = String(value || '').trim();
  // Strip surrounding slashes (escaped or not) if they wrap the whole thing
  // e.g. /abc/ -> abc, \/abc\/ -> abc
  if ((pattern.startsWith('/') && pattern.endsWith('/')) || (pattern.startsWith('\\/') && pattern.endsWith('\\/'))) {
    const start = pattern.startsWith('\\/') ? 2 : 1;
    const end = pattern.endsWith('\\/') ? -2 : -1;
    const stripped = pattern.slice(start, end);
    try {
      createRegex(stripped, 'g');
      pattern = stripped;
    } catch {}
  }
  return normalizeRegexPatternEscapes(pattern);
}

function trimWords(value, limit) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).slice(0, limit).join(' ');
}

function createRegexBlock(id, category, label, token, detail, engine, fields = [], build = null) {
  return {
    id,
    category,
    label,
    token,
    detail,
    engine,
    fields,
    configurable: fields.length > 0,
    build
  };
}

function escapeRegexLiteral(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeRegexClass(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\]/g, '\\]')
    .replace(/\^/g, '\\^');
}

function toRegexIdentifier(value) {
  const normalized = String(value || 'value').trim().replace(/[^\p{L}\p{N}_$]+/gu, '_').replace(/^[^A-Za-z_$]+/, '');
  return normalized || 'value';
}

function clampRegexCount(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function normalizeRegexPatternEscapes(value) {
  const source = String(value || '');
  if (!source.includes('\\\\')) return source;
  try {
    return JSON.parse(`"${source.replace(/"/g, '\\"')}"`);
  } catch {
    return source;
  }
}

function PRESET_OPTIONS() {
  return Object.entries(PRESET_MAP);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightMatches(text, matches) {
  if (!matches.length) return escapeHtml(text);
  let cursor = 0;
  let output = '';
  matches.forEach((match) => {
    output += escapeHtml(text.slice(cursor, match.index));
    output += `<mark>${escapeHtml(match.value)}</mark>`;
    cursor = match.end;
  });
  output += escapeHtml(text.slice(cursor));
  return output.replace(/\n/g, '<br>');
}

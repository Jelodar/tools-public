import { installMonacoEnvironment } from '../core/monaco-environment.js';

let monacoPromise = null;
const importMonacoModule = () => import('https://esm.sh/monaco-editor@0.41.0/esm/vs/editor/editor.api');
const importMonacoBasicLanguagesContribution = () => import('https://esm.sh/monaco-editor@0.41.0/esm/vs/basic-languages/monaco.contribution');
const importMonacoJsonContribution = () => import('https://esm.sh/monaco-editor@0.41.0/esm/vs/language/json/monaco.contribution');
const importMonacoCssContribution = () => import('https://esm.sh/monaco-editor@0.41.0/esm/vs/language/css/monaco.contribution');
const importMonacoHtmlContribution = () => import('https://esm.sh/monaco-editor@0.41.0/esm/vs/language/html/monaco.contribution');
const importMonacoTypescriptContribution = () => import('https://esm.sh/monaco-editor@0.41.0/esm/vs/language/typescript/monaco.contribution');
const COMMON_LANGUAGE_IDS = [
  'json',
  'javascript',
  'typescript',
  'html',
  'css',
  'scss',
  'less',
  'markdown',
  'sql',
  'mysql',
  'postgresql',
  'sqlite',
  'mariadb',
  'python',
  'rust',
  'go',
  'xml',
  'yaml',
  'plaintext'
];

function getExistingMonaco() {
  if (globalThis.window?.monaco?.editor) return globalThis.window.monaco;
  if (globalThis.monaco?.editor) return globalThis.monaco;
  return null;
}

function ensureMonacoLanguages(monaco) {
  if (!monaco?.languages?.register) return monaco;
  const existing = new Set(
    typeof monaco.languages.getLanguages === 'function'
      ? monaco.languages.getLanguages().map((language) => language.id).filter(Boolean)
      : []
  );
  COMMON_LANGUAGE_IDS.forEach((id) => {
    if (existing.has(id)) return;
    monaco.languages.register({ id });
    existing.add(id);
  });
  return monaco;
}

function exposeMonaco(monaco) {
  ensureMonacoLanguages(monaco);
  if (globalThis.window && !globalThis.window.monaco) {
    globalThis.window.monaco = monaco;
  }
  if (!globalThis.monaco) {
    globalThis.monaco = monaco;
  }
  return monaco;
}

async function loadMonacoLanguageContributions(monaco) {
  ensureMonacoLanguages(monaco);
  await Promise.all([
    importMonacoBasicLanguagesContribution(),
    importMonacoJsonContribution(),
    importMonacoCssContribution(),
    importMonacoHtmlContribution(),
    importMonacoTypescriptContribution()
  ]);
  return monaco;
}

export async function loadMonaco() {
  const existingMonaco = getExistingMonaco();
  if (existingMonaco) {
    monacoPromise = Promise.resolve(exposeMonaco(existingMonaco));
    return monacoPromise;
  }
  if (monacoPromise) return monacoPromise;

  installMonacoEnvironment();
  monacoPromise = importMonacoModule()
    .then(async (module) => {
      const monaco = module.default?.editor ? module.default : module;
      exposeMonaco(monaco);
      await loadMonacoLanguageContributions(monaco);
      return exposeMonaco(monaco);
    })
    .catch((error) => {
      monacoPromise = null;
      throw error;
    });

  return monacoPromise;
}

export async function createEditor(container, options = {}) {
  const monaco = await loadMonaco();

  const defaultOptions = {
    theme: 'vs-dark',
    automaticLayout: true,
    fontSize: 14,
    lineHeight: 24,
    fontFamily: 'var(--font-mono)',
    minimap: { enabled: false },
    scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
    renderLineHighlight: 'all',
    scrollBeyondLastLine: false,
    roundedSelection: true,
    cursorSmoothCaretAnimation: 'on',
    padding: { top: 16, bottom: 16 },
    formatOnPaste: true,
    formatOnType: true
  };

  const editor = monaco.editor.create(container, { ...defaultOptions, ...options });

  setTimeout(() => editor.layout(), 100);
  return { editor, monaco };
}

export async function createDiffEditor(container, options = {}) {
  const monaco = await loadMonaco();
  const responsiveOptions = getResponsiveDiffOptions(options);

  const defaultOptions = {
    theme: 'vs-dark',
    automaticLayout: true,
    fontSize: 14,
    lineHeight: 24,
    fontFamily: 'var(--font-mono)',
    renderSideBySide: true,
    readOnly: false,
    scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 }
  };

  const diffEditor = monaco.editor.createDiffEditor(container, { ...defaultOptions, ...responsiveOptions, ...options });
  setTimeout(() => diffEditor.layout(), 100);
  return { diffEditor, monaco };
}

export function getResponsiveDiffOptions(options = {}, viewport = globalThis.window) {
  if (Object.prototype.hasOwnProperty.call(options || {}, 'renderSideBySide')) {
    return { renderSideBySide: options.renderSideBySide };
  }
  const mediaMatches = typeof viewport?.matchMedia === 'function'
    ? viewport.matchMedia('(max-width: 720px)').matches
    : false;
  const width = Number(viewport?.innerWidth);
  const isPhoneWidth = mediaMatches || (Number.isFinite(width) && width <= 720);
  return { renderSideBySide: !isPhoneWidth };
}

export const MONACO_VERSION = '0.41.0';
const MONACO_WORKER_URLS = {
  json: `https://esm.sh/monaco-editor@${MONACO_VERSION}/esm/vs/language/json/json.worker.js`,
  css: `https://esm.sh/monaco-editor@${MONACO_VERSION}/esm/vs/language/css/css.worker.js`,
  html: `https://esm.sh/monaco-editor@${MONACO_VERSION}/esm/vs/language/html/html.worker.js`,
  typescript: `https://esm.sh/monaco-editor@${MONACO_VERSION}/esm/vs/language/typescript/ts.worker.js`,
  default: `https://esm.sh/monaco-editor@${MONACO_VERSION}/esm/vs/editor/editor.worker.js`
};
const workerBlobUrls = new Map();

export function resolveMonacoWorkerUrl(label = '') {
  if (label === 'json') return MONACO_WORKER_URLS.json;
  if (label === 'css' || label === 'scss' || label === 'less') return MONACO_WORKER_URLS.css;
  if (label === 'html' || label === 'handlebars' || label === 'razor') return MONACO_WORKER_URLS.html;
  if (label === 'typescript' || label === 'javascript') return MONACO_WORKER_URLS.typescript;
  return MONACO_WORKER_URLS.default;
}

export function createMonacoWorkerScript(workerUrl) {
  return `import "${workerUrl}";`;
}

export function createMonacoWorkerUrl(label = '') {
  const workerUrl = resolveMonacoWorkerUrl(label);
  if (!globalThis.Blob || !globalThis.URL?.createObjectURL) return workerUrl;
  if (workerBlobUrls.has(workerUrl)) return workerBlobUrls.get(workerUrl);
  const blob = new Blob([createMonacoWorkerScript(workerUrl)], { type: 'text/javascript' });
  const blobUrl = globalThis.URL.createObjectURL(blob);
  workerBlobUrls.set(workerUrl, blobUrl);
  return blobUrl;
}

export function revokeMonacoWorkerUrls() {
  if (!globalThis.URL?.revokeObjectURL) {
    workerBlobUrls.clear();
    return;
  }
  for (const url of workerBlobUrls.values()) {
    globalThis.URL.revokeObjectURL(url);
  }
  workerBlobUrls.clear();
}

export function createMonacoWorkerFactory() {
  return function getWorker(_, label) {
    const workerLabel = String(label || 'editor').replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
    return new Worker(createMonacoWorkerUrl(label), {
      type: 'module',
      name: `monaco-${workerLabel}-worker`
    });
  };
}

export function installMonacoEnvironment(target = globalThis.window) {
  if (!target) return null;
  const getWorker = createMonacoWorkerFactory();
  target.MonacoEnvironment = { getWorker };
  return target.MonacoEnvironment;
}

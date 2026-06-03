import { mount as mountJsonStudioAlias, unmount as unmountJsonStudioAlias } from './json-suite.js';

export async function mount(container) {
  return mountJsonStudioAlias(container);
}

export function unmount() {
  return unmountJsonStudioAlias();
}

import { mount as mountTextToolsAlias, unmount as unmountTextToolsAlias } from './text-tools.js';

export async function mount(container) {
  return mountTextToolsAlias(container);
}

export function unmount() {
  return unmountTextToolsAlias();
}

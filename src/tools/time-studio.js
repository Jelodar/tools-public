import { mount as mountTimeToolsAlias, unmount as unmountTimeToolsAlias } from './time-tools.js';

export async function mount(container) {
  return mountTimeToolsAlias(container);
}

export function unmount() {
  return unmountTimeToolsAlias();
}

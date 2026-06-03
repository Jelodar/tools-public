import { mount as mountClientInspectAlias, unmount as unmountClientInspectAlias } from './client-inspect.js';

export async function mount(container) {
  return mountClientInspectAlias(container);
}

export function unmount() {
  return unmountClientInspectAlias();
}

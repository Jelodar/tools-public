import { mount as mountCertToolsAlias, unmount as unmountCertToolsAlias } from './cert-tools.js';

export async function mount(container) {
  return mountCertToolsAlias(container);
}

export function unmount() {
  return unmountCertToolsAlias();
}

import { mount as mountDevopsToolsAlias, unmount as unmountDevopsToolsAlias } from './devops-tools.js';

export async function mount(container) {
  return mountDevopsToolsAlias(container);
}

export function unmount() {
  return unmountDevopsToolsAlias();
}

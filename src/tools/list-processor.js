import { mount as mountListOpsAlias, unmount as unmountListOpsAlias } from './list-ops.js';

export async function mount(container) {
  return mountListOpsAlias(container);
}

export function unmount() {
  return unmountListOpsAlias();
}

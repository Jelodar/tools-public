import { mount as mountKeyGeneratorAlias, unmount as unmountKeyGeneratorAlias } from './key-generator.js';

export async function mount(container) {
  return mountKeyGeneratorAlias(container);
}

export function unmount() {
  return unmountKeyGeneratorAlias();
}

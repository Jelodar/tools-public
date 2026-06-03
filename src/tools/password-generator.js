import { mount as mountPasswordGenAlias, unmount as unmountPasswordGenAlias } from './password-gen.js';

export async function mount(container) {
  return mountPasswordGenAlias(container);
}

export function unmount() {
  return unmountPasswordGenAlias();
}

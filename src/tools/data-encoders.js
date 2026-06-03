import { mount as mountEncodersAlias, unmount as unmountEncodersAlias } from './encoders.js';

export async function mount(container) {
  return mountEncodersAlias(container);
}

export function unmount() {
  return unmountEncodersAlias();
}

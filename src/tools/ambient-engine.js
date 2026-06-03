import { mount as mountAudioLabAlias, unmount as unmountAudioLabAlias } from './audio-lab.js';

export async function mount(container) {
  return mountAudioLabAlias(container);
}

export function unmount() {
  return unmountAudioLabAlias();
}

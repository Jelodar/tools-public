import { mount as mountImageCompressorAlias, unmount as unmountImageCompressorAlias } from './image-compressor.js';

export async function mount(container) {
  return mountImageCompressorAlias(container);
}

export function unmount() {
  return unmountImageCompressorAlias();
}

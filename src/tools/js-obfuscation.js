import { mount as mountCodeStudio, unmount as unmountCodeStudio } from './code-editor.js';

export async function mount(parent) {
  await mountCodeStudio(parent, { mode: 'optimize', optimizeObfuscate: true });
}

export function unmount() {
  unmountCodeStudio();
}

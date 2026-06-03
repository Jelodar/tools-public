import { mount as mountSvgEditorAlias, unmount as unmountSvgEditorAlias } from './svg-editor.js';

export async function mount(container) {
  return mountSvgEditorAlias(container);
}

export function unmount() {
  return unmountSvgEditorAlias();
}

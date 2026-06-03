import { mount as mountCodeEditorAlias, unmount as unmountCodeEditorAlias } from './code-editor.js';

export async function mount(container) {
  return mountCodeEditorAlias(container);
}

export function unmount() {
  return unmountCodeEditorAlias();
}

import { mountTextWorkbench, unmountTextWorkbench } from './_shared/text-workbench-app.js';

export async function mount(parent) {
  await mountTextWorkbench(parent, 'url-parser');
}

export function unmount() {
  unmountTextWorkbench();
}

import { mountTextWorkbench, unmountTextWorkbench } from './_shared/text-workbench-app.js';

export async function mount(parent) {
  await mountTextWorkbench(parent, 'case-converter');
}

export function unmount() {
  unmountTextWorkbench();
}

import { mountDevWorkbench, unmountDevWorkbench } from './_shared/dev-workbench-app.js';

export async function mount(parent) {
  await mountDevWorkbench(parent, 'radix-converter');
}

export function unmount() {
  unmountDevWorkbench();
}

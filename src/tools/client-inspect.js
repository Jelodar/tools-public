import { mountDeviceLab, unmountDeviceLab } from './_shared/device-lab-app.js';

export async function mount(parent) {
  await mountDeviceLab(parent, 'client-inspect');
}

export function unmount() {
  unmountDeviceLab();
}

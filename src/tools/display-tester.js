import { mountDeviceLab, unmountDeviceLab } from './_shared/device-lab-app.js';

export async function mount(parent) {
  await mountDeviceLab(parent, 'display-tester');
}

export function unmount() {
  unmountDeviceLab();
}

import { mountTimeStudio, unmountTimeStudio } from './_shared/time-studio-app.js';

export async function mount(parent) {
  await mountTimeStudio(parent, 'time-converter');
}

export function unmount() {
  unmountTimeStudio();
}

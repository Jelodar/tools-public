import { mountTimeStudio, unmountTimeStudio } from './_shared/time-studio-app.js';

export async function mount(parent) {
  await mountTimeStudio(parent, 'time-tools');
}

export function unmount() {
  unmountTimeStudio();
}

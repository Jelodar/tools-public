import { mountTimeStudio, unmountTimeStudio } from './_shared/time-studio-app.js';

export async function mount(parent) {
  await mountTimeStudio(parent, 'calendar-converter');
}

export function unmount() {
  unmountTimeStudio();
}

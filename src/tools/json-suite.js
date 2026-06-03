import { mountJsonStudio, unmountJsonStudio } from './_shared/json-suite-app.js';

export async function mount(parent) {
  await mountJsonStudio(parent, 'json-suite');
}

export function unmount() {
  unmountJsonStudio();
}

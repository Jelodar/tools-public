import { mountDesignStudio, unmountDesignStudio } from './_shared/design-studio-app.js';

export async function mount(parent) {
  await mountDesignStudio(parent, 'svg-editor');
}

export function unmount() {
  unmountDesignStudio();
}

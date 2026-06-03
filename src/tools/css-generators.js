import { mountDesignStudio, unmountDesignStudio } from './_shared/design-studio-app.js';

export async function mount(container) {
  await mountDesignStudio(container, 'svg-editor');
}

export function unmount() {
  unmountDesignStudio();
}

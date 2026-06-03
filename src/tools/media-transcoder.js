import { mount as mountVideoStudio, unmount as unmountVideoStudio } from './video-studio.js';

export async function mount(container) {
  return mountVideoStudio(container);
}

export function unmount() {
  return unmountVideoStudio();
}

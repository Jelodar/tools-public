import { Router } from './core/router.js';
import { installMonacoEnvironment } from './core/monaco-environment.js';
import { setupShellUi } from './core/shell-ui.js';
import { globalStore } from './core/store.js';
import { initToastSystem } from './ui/toast.js';

async function bootstrap() {
  initToastSystem();

  try {
    await globalStore.load();
  } catch (err) {
    console.warn('Failed to load persisted state:', err);
  }
  
  const root = document.getElementById('tool-root');
  if (!root) return;

  installMonacoEnvironment();

  const router = new Router(root);
  router.loader = document.getElementById('loading-overlay');
  setupShellUi({ store: globalStore });
  
  await router.handleNavigation(window.location.pathname, false);
}

bootstrap();

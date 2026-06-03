function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createContextMenu(options = {}) {
  const ownerDocument = options.documentTarget || globalThis.document;
  const mount = options.mount || ownerDocument?.body;

  if (!ownerDocument || !mount) {
    return {
      open() {},
      close() {},
      isOpen() {
        return false;
      },
      destroy() {}
    };
  }

  const root = ownerDocument.createElement('div');
  root.className = 'context-menu hidden';
  const panel = ownerDocument.createElement('div');
  panel.className = 'context-menu-panel';
  root.appendChild(panel);
  mount.appendChild(root);

  let items = [];

  const isOpen = () => !root.classList.contains('hidden');

  const close = () => {
    if (!isOpen()) return;
    root.classList.add('hidden');
    // Defer cleanup so that onSelect handlers can still reference menu state if needed
    // and to ensure no race conditions with focus management
    setTimeout(() => {
      if (!isOpen()) {
        panel.innerHTML = '';
        items = [];
      }
    }, 10);
  };

  const render = () => {
    panel.innerHTML = '';
    items.forEach((item) => {
      if (item?.separator) {
        const separator = ownerDocument.createElement('div');
        separator.className = 'context-menu-divider';
        panel.appendChild(separator);
        return;
      }
      const button = ownerDocument.createElement('button');
      button.type = 'button';
      button.className = `context-menu-item${item?.danger ? ' danger' : ''}`;
      button.textContent = item?.label || 'Action';
      if (item?.id) button.setAttribute('data-context-action', item.id);
      if (item?.disabled) button.disabled = true;
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        if (item?.disabled) return;
        const handler = item?.onSelect;
        close();
        if (handler) handler();
      });
      panel.appendChild(button);
    });
  };

  const position = ({ x = 0, y = 0 } = {}) => {
    const viewportWidth = ownerDocument.documentElement?.clientWidth || mount.clientWidth || 1280;
    const viewportHeight = ownerDocument.documentElement?.clientHeight || mount.clientHeight || 720;
    const menuWidth = 220;
    const menuHeight = Math.max(44, items.length * 34);
    root.style.left = `${clamp(Number(x) || 0, 8, Math.max(8, viewportWidth - menuWidth - 8))}px`;
    root.style.top = `${clamp(Number(y) || 0, 8, Math.max(8, viewportHeight - menuHeight - 8))}px`;
  };

  const containsTarget = (target) => {
    if (typeof root.contains === 'function') return root.contains(target);
    return target === root || target?.closest?.('.context-menu') === root;
  };

  const handleGlobalPointerDown = (event) => {
    if (!isOpen()) return;
    if (containsTarget(event.target)) return;
    close();
  };

  const handleGlobalContextMenu = (event) => {
    if (!isOpen()) return;
    if (containsTarget(event.target)) {
      event.preventDefault();
      return;
    }
    close();
  };

  const handleGlobalKeydown = (event) => {
    if (!isOpen()) return;
    if (event.key === 'Escape') close();
  };

  // Attach to document to ensure we catch clicks that might be stopped at window level
  // or are otherwise outside the normal bubble path.
  ownerDocument.addEventListener('pointerdown', handleGlobalPointerDown, { capture: true });
  ownerDocument.addEventListener('contextmenu', handleGlobalContextMenu, { capture: true });
  ownerDocument.addEventListener('keydown', handleGlobalKeydown, { capture: true });

  return {
    open(payload = {}) {
      items = Array.isArray(payload.items) ? payload.items.filter(Boolean) : [];
      if (!items.length) {
        close();
        return;
      }
      render();
      root.classList.remove('hidden');
      position(payload);
    },
    close,
    isOpen,
    destroy() {
      ownerDocument.removeEventListener('pointerdown', handleGlobalPointerDown, { capture: true });
      ownerDocument.removeEventListener('contextmenu', handleGlobalContextMenu, { capture: true });
      ownerDocument.removeEventListener('keydown', handleGlobalKeydown, { capture: true });
      root.remove();
    }
  };
}

export function createModalController(node, options = {}) {
  if (!node) {
    return {
      open() {},
      close() {},
      isOpen() {
        return false;
      },
      destroy() {}
    };
  }

  const closeSelectors = Array.isArray(options.closeSelectors) ? options.closeSelectors : [];
  const ownerDocument = options.documentTarget || node.ownerDocument || globalThis.document;
  const closeNodes = closeSelectors.flatMap((selector) => Array.from(node.querySelectorAll(selector)));

  const isOpen = () => !node.classList.contains('hidden');

  const setOpen = (nextOpen, reason = 'api') => {
    const currentlyOpen = isOpen();
    if (currentlyOpen === nextOpen) return currentlyOpen;
    node.classList.toggle('hidden', !nextOpen);
    if (nextOpen) options.onOpen?.({ reason, node });
    else options.onClose?.({ reason, node });
    return nextOpen;
  };

  const handleClick = (event) => {
    const target = event.target;
    if (closeSelectors.some((selector) => target?.closest?.(selector))) {
      setOpen(false, 'control');
      return;
    }
    if ((options.closeOnBackdrop ?? true) && target === node) {
      setOpen(false, 'backdrop');
    }
  };

  const handleKeydown = (event) => {
    if ((options.closeOnEscape ?? true) && event.key === 'Escape' && isOpen()) {
      setOpen(false, 'escape');
    }
  };

  const handleControlClick = () => {
    setOpen(false, 'control');
  };

  node.addEventListener('click', handleClick);
  ownerDocument?.addEventListener?.('keydown', handleKeydown);
  closeNodes.forEach((closeNode) => closeNode.addEventListener('click', handleControlClick));

  return {
    open(reason = 'api') {
      setOpen(true, reason);
    },
    close(reason = 'api') {
      setOpen(false, reason);
    },
    isOpen,
    destroy() {
      node.removeEventListener('click', handleClick);
      ownerDocument?.removeEventListener?.('keydown', handleKeydown);
      closeNodes.forEach((closeNode) => closeNode.removeEventListener('click', handleControlClick));
    }
  };
}

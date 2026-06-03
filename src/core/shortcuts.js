function normalizeKey(value) {
  return String(value || '').toLowerCase();
}

function targetIsEditable(target) {
  if (!target || typeof target.closest !== 'function') return false;
  if (target.isContentEditable) return true;
  const field = target.closest('input, textarea, select, [contenteditable="true"]');
  if (!field) return false;
  if (field.tagName === 'INPUT') {
    const type = (field.getAttribute('type') || 'text').toLowerCase();
    return !['range', 'checkbox', 'radio', 'button', 'submit', 'reset'].includes(type);
  }
  return true;
}

function matchesShortcut(event, shortcut) {
  if (shortcut.code && event.code !== shortcut.code) return false;
  if (shortcut.key && normalizeKey(event.key) !== normalizeKey(shortcut.key)) return false;
  if (Boolean(shortcut.altKey) !== event.altKey) return false;
  if (Boolean(shortcut.ctrlKey) !== event.ctrlKey) return false;
  if (Boolean(shortcut.metaKey) !== event.metaKey) return false;
  if (Boolean(shortcut.shiftKey) !== event.shiftKey) return false;
  return true;
}

export function registerShortcuts(shortcuts, options = {}) {
  const target = options.target || window;
  const isEnabled = options.isEnabled || (() => true);
  const shouldIgnore = options.shouldIgnore || ((event) => targetIsEditable(event.target));

  const onKeyDown = (event) => {
    if (!isEnabled(event)) return;
    for (const shortcut of shortcuts) {
      if (shortcut.when && !shortcut.when(event)) continue;
      if (!shortcut.allowInEditable && shouldIgnore(event)) continue;
      if (!matchesShortcut(event, shortcut)) continue;
      if (shortcut.preventDefault !== false) event.preventDefault();
      shortcut.handler(event);
      if (shortcut.stopPropagation) event.stopPropagation();
      return;
    }
  };

  target.addEventListener('keydown', onKeyDown);
  return () => target.removeEventListener('keydown', onKeyDown);
}

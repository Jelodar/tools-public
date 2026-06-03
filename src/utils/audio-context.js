export function createBrowserAudioContext(scope = globalThis.window || globalThis) {
  const AudioContextCtor = scope?.AudioContext || scope?.webkitAudioContext;
  if (!AudioContextCtor) throw new Error('Web Audio is not supported in this browser.');
  return new AudioContextCtor();
}

export function resumeAudioContext(context) {
  if (context?.state === 'suspended' && typeof context.resume === 'function') {
    return context.resume().then(() => context);
  }
  return context;
}

export function isAudioContextUsable(context) {
  return Boolean(context && context.state !== 'closed');
}

export function closeAudioContext(context) {
  if (!context || context.state === 'closed' || typeof context.close !== 'function') return;
  return context.close();
}

export function stopAndDisconnectAudioNodes(nodes, options = {}) {
  const list = Array.from(nodes || []).filter(Boolean);
  const context = options.context || null;
  const fadeSeconds = Math.max(0, Number(options.fadeSeconds || 0));
  const now = context?.currentTime || 0;

  if (fadeSeconds > 0) {
    list.forEach((node) => {
      const gain = node?.gain;
      if (!gain) return;
      gain.cancelScheduledValues?.(now);
      gain.setValueAtTime?.(Math.max(0.001, gain.value || 0.001), now);
      if (typeof gain.exponentialRampToValueAtTime === 'function') {
        gain.exponentialRampToValueAtTime(0.001, now + fadeSeconds);
      } else {
        gain.setTargetAtTime?.(0.001, now, fadeSeconds / 3);
      }
    });
  }

  const cleanup = () => {
    list.forEach((node) => {
      try {
        node.stop?.();
      } catch {}
      try {
        node.disconnect?.();
      } catch {}
    });
  };

  if (fadeSeconds > 0) return setTimeout(cleanup, fadeSeconds * 1000 + 100);
  cleanup();
  return null;
}

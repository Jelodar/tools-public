const MEDIA_KEY_ACTIONS = {
  MediaPlay: 'play',
  MediaPause: 'pause',
  MediaPlayPause: 'toggle',
  MediaStop: 'stop',
  MediaTrackNext: 'nexttrack',
  MediaTrackPrevious: 'previoustrack'
};

const MEDIA_SESSION_ACTIONS = {
  play: ['play'],
  pause: ['pause'],
  stop: ['stop'],
  nexttrack: ['nexttrack', 'next'],
  previoustrack: ['previoustrack', 'previous']
};

let activeSidebarMedia = null;

function resolveHandler(handlers, action) {
  if (!handlers) return null;
  if (action === 'toggle') return handlers.toggle || null;
  const aliases = MEDIA_SESSION_ACTIONS[action] || [action];
  return aliases.map((alias) => handlers[alias]).find((handler) => typeof handler === 'function') || null;
}

function getSidebarHandlers(handlers = {}) {
  return {
    play: resolveHandler(handlers, 'play'),
    pause: resolveHandler(handlers, 'pause'),
    stop: resolveHandler(handlers, 'stop'),
    toggle: resolveHandler(handlers, 'toggle'),
    nexttrack: resolveHandler(handlers, 'nexttrack'),
    previoustrack: resolveHandler(handlers, 'previoustrack')
  };
}

function shouldShowSidebarMedia(playbackState) {
  return playbackState === 'playing';
}

function publishSidebarMedia(detail) {
  const event = typeof globalThis.CustomEvent === 'function'
    ? new globalThis.CustomEvent('app:media-controls', { detail })
    : { type: 'app:media-controls', detail };
  globalThis.window?.dispatchEvent?.(event);
}

function applyMediaMetadata(mediaSession, metadata) {
  if (!mediaSession || !metadata) return;
  try {
    if (typeof MediaMetadata === 'function') mediaSession.metadata = new MediaMetadata(metadata);
    else mediaSession.metadata = metadata;
  } catch {}
}

export function bindMediaControls({ target, handlers, metadata, playbackState = 'none' } = {}) {
  const keyTarget = target || globalThis.window;
  const mediaSession = globalThis.navigator?.mediaSession;
  const registeredActions = [];
  const token = {};
  applyMediaMetadata(mediaSession, metadata);

  if (mediaSession?.setActionHandler) {
    Object.keys(MEDIA_SESSION_ACTIONS).forEach((action) => {
      const handler = resolveHandler(handlers, action);
      if (!handler) return;
      try {
        mediaSession.setActionHandler(action, handler);
        registeredActions.push(action);
      } catch {}
    });
    try {
      mediaSession.playbackState = playbackState;
    } catch {}
  }

  const onKeyDown = (event) => {
    const action = MEDIA_KEY_ACTIONS[event?.key];
    const handler = resolveHandler(handlers, action);
    if (!handler) return;
    event.preventDefault?.();
    handler(event);
  };

  keyTarget?.addEventListener?.('keydown', onKeyDown);
  activeSidebarMedia = {
    token,
    metadata,
    handlers: getSidebarHandlers(handlers),
    playbackState
  };
  publishSidebarMedia({
    active: shouldShowSidebarMedia(playbackState),
    metadata,
    handlers: activeSidebarMedia.handlers,
    playbackState
  });

  return () => {
    keyTarget?.removeEventListener?.('keydown', onKeyDown);
    if (activeSidebarMedia?.token === token) {
      activeSidebarMedia = null;
      publishSidebarMedia({ active: false, playbackState: 'none' });
    }
    if (mediaSession?.setActionHandler) {
      registeredActions.forEach((action) => {
        try {
          mediaSession.setActionHandler(action, null);
        } catch {}
      });
      try {
        mediaSession.playbackState = 'none';
      } catch {}
    }
  };
}

export function setMediaPlaybackState(state) {
  const mediaSession = globalThis.navigator?.mediaSession;
  if (mediaSession) {
    try {
      mediaSession.playbackState = state;
    } catch {}
  }
  if (!activeSidebarMedia) return;
  activeSidebarMedia = {
    ...activeSidebarMedia,
    playbackState: state
  };
  publishSidebarMedia({
    active: shouldShowSidebarMedia(state),
    metadata: activeSidebarMedia.metadata,
    handlers: activeSidebarMedia.handlers,
    playbackState: state
  });
}

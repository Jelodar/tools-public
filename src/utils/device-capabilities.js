export const DEVICE_CAPABILITY_GROUPS = [
  { id: 'media', label: 'Media' },
  { id: 'graphics', label: 'Graphics' },
  { id: 'realtime', label: 'Realtime' },
  { id: 'storage', label: 'Storage' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'input', label: 'Input' }
];

export function getCapabilityGroup(groupId) {
  return DEVICE_CAPABILITY_GROUPS.find((group) => group.id === groupId) || DEVICE_CAPABILITY_GROUPS[0];
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${Math.round(value)} B`;
}

export function formatStorageEstimate(estimate = {}) {
  if (!estimate || (!estimate.quota && !estimate.usage)) return 'Unknown';
  return `${formatBytes(estimate.usage)} of ${formatBytes(estimate.quota)}`;
}

function hasFunction(value) {
  return typeof value === 'function';
}

function hasValue(value) {
  return value !== undefined && value !== null;
}

function item(key, label, supported, detail = '') {
  return {
    key,
    label,
    value: supported ? (detail || 'Available') : 'Not detected',
    supported: Boolean(supported)
  };
}

function safeStorageAccess(root, key) {
  try {
    return hasValue(root?.[key]);
  } catch {
    return false;
  }
}

function canCreateContext(documentRef, name) {
  try {
    const canvas = documentRef?.createElement?.('canvas');
    return Boolean(canvas?.getContext?.(name));
  } catch {
    return false;
  }
}

async function readStorageEstimate(navigatorRef) {
  try {
    return await navigatorRef?.storage?.estimate?.();
  } catch {
    return null;
  }
}

async function readPersistedStorage(navigatorRef) {
  try {
    const persisted = await navigatorRef?.storage?.persisted?.();
    if (persisted === true) return 'Persisted';
    if (persisted === false) return 'Best effort';
    return '';
  } catch {
    return '';
  }
}

async function readWebGpuAdapter(navigatorRef) {
  try {
    return await navigatorRef?.gpu?.requestAdapter?.();
  } catch {
    return null;
  }
}

async function readPermissionState(navigatorRef, name) {
  try {
    const status = await navigatorRef?.permissions?.query?.({ name });
    return status?.state || '';
  } catch {
    return '';
  }
}

function readGamepads(navigatorRef) {
  try {
    return Array.from(navigatorRef?.getGamepads?.() || []).filter(Boolean);
  } catch {
    return [];
  }
}

export async function collectDeviceCapabilityGroups(env = {}) {
  const navigatorRef = env.navigator || globalThis.navigator || {};
  const windowRef = env.window || globalThis;
  const documentRef = env.document || globalThis.document;
  const storageEstimate = await readStorageEstimate(navigatorRef);
  const persistedStorage = await readPersistedStorage(navigatorRef);
  const webGpuAdapter = await readWebGpuAdapter(navigatorRef);
  const permissionStates = Object.fromEntries(await Promise.all(
    ['camera', 'microphone', 'geolocation', 'notifications', 'clipboard-read', 'clipboard-write']
      .map(async (name) => [name, await readPermissionState(navigatorRef, name)])
  ));
  const gamepads = readGamepads(navigatorRef);
  const coarsePointer = windowRef.matchMedia?.('(pointer: coarse)')?.matches === true;

  return [
    {
      ...getCapabilityGroup('media'),
      items: [
        item('microphone', 'Microphone Capture', hasFunction(navigatorRef.mediaDevices?.getUserMedia)),
        item('display-capture', 'Display Capture', hasFunction(navigatorRef.mediaDevices?.getDisplayMedia)),
        item('device-list', 'Device Enumeration', hasFunction(navigatorRef.mediaDevices?.enumerateDevices)),
        item('media-recorder', 'Media Recorder', hasFunction(windowRef.MediaRecorder)),
        item('audio-context', 'Audio Context', hasFunction(windowRef.AudioContext) || hasFunction(windowRef.webkitAudioContext)),
        item('audio-worklet', 'Audio Worklet', hasFunction(windowRef.AudioWorkletNode)),
        item('media-source', 'Media Source', hasFunction(windowRef.MediaSource)),
        item('webcodecs', 'WebCodecs', hasFunction(windowRef.VideoEncoder) || hasFunction(windowRef.AudioEncoder))
      ]
    },
    {
      ...getCapabilityGroup('graphics'),
      items: [
        item('webgpu', 'WebGPU', hasValue(navigatorRef.gpu)),
        item('webgpu-adapter', 'WebGPU Adapter', Boolean(webGpuAdapter), webGpuAdapter ? 'Adapter available' : ''),
        item('webgl2', 'WebGL 2', canCreateContext(documentRef, 'webgl2')),
        item('webgl', 'WebGL', canCreateContext(documentRef, 'webgl') || canCreateContext(documentRef, 'experimental-webgl')),
        item('offscreen-canvas', 'Offscreen Canvas', hasFunction(windowRef.OffscreenCanvas))
      ]
    },
    {
      ...getCapabilityGroup('realtime'),
      items: [
        item('webrtc', 'WebRTC', hasFunction(windowRef.RTCPeerConnection)),
        item('webrtc-peer', 'WebRTC Peer', hasFunction(windowRef.RTCPeerConnection)),
        item('webrtc-data', 'RTC Data Channel', hasFunction(windowRef.RTCDataChannel)),
        item('webrtc-stats', 'WebRTC Stats', hasFunction(windowRef.RTCPeerConnection?.prototype?.getStats)),
        item('websocket', 'WebSocket', hasFunction(windowRef.WebSocket)),
        item('webtransport', 'WebTransport', hasFunction(windowRef.WebTransport)),
        item('broadcast-channel', 'Broadcast Channel', hasFunction(windowRef.BroadcastChannel))
      ]
    },
    {
      ...getCapabilityGroup('storage'),
      items: [
        item('indexeddb', 'IndexedDB', safeStorageAccess(windowRef, 'indexedDB') || safeStorageAccess(globalThis, 'indexedDB')),
        item('cache-storage', 'Cache Storage', safeStorageAccess(windowRef, 'caches') || safeStorageAccess(globalThis, 'caches')),
        item('opfs', 'Origin Private File System', hasFunction(navigatorRef.storage?.getDirectory)),
        item('service-worker', 'Service Worker', hasValue(navigatorRef.serviceWorker)),
        item('local-storage', 'Local Storage', safeStorageAccess(windowRef, 'localStorage')),
        item('session-storage', 'Session Storage', safeStorageAccess(windowRef, 'sessionStorage')),
        item('quota', 'Quota Estimate', Boolean(storageEstimate), storageEstimate ? formatStorageEstimate(storageEstimate) : ''),
        item('persistence', 'Persistence', Boolean(persistedStorage), persistedStorage)
      ]
    },
    {
      ...getCapabilityGroup('permissions'),
      items: [
        item('permissions-api', 'Permissions API', hasFunction(navigatorRef.permissions?.query)),
        item('permission-camera', 'Camera Permission', Boolean(permissionStates.camera), permissionStates.camera),
        item('permission-microphone', 'Microphone Permission', Boolean(permissionStates.microphone), permissionStates.microphone),
        item('permission-clipboard-read', 'Clipboard Read Permission', Boolean(permissionStates['clipboard-read']), permissionStates['clipboard-read']),
        item('notifications', 'Notifications', hasValue(windowRef.Notification)),
        item('clipboard', 'Clipboard', hasValue(navigatorRef.clipboard)),
        item('geolocation', 'Geolocation', hasValue(navigatorRef.geolocation))
      ]
    },
    {
      ...getCapabilityGroup('input'),
      items: [
        item('touch', 'Touch', Number(navigatorRef.maxTouchPoints) > 0, Number(navigatorRef.maxTouchPoints) > 0 ? `${navigatorRef.maxTouchPoints} points` : ''),
        item('coarse-pointer', 'Coarse Pointer', coarsePointer),
        item('pointer', 'Pointer Events', hasFunction(windowRef.PointerEvent)),
        item('gamepad', 'Gamepad', hasFunction(navigatorRef.getGamepads)),
        item('gamepad-connected', 'Connected Gamepads', gamepads.length > 0, gamepads.length ? `${gamepads.length} connected` : ''),
        item('gamepad-haptics', 'Gamepad Haptics', gamepads.some((pad) => hasValue(pad.vibrationActuator))),
        item('vibration', 'Vibration', hasFunction(navigatorRef.vibrate))
      ]
    }
  ];
}

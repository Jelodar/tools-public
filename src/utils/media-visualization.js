function waitForEvent(target, type) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      target.removeEventListener(type, handleResolve);
      target.removeEventListener('error', handleReject);
    };
    const handleResolve = () => {
      cleanup();
      resolve();
    };
    const handleReject = () => {
      cleanup();
      reject(new Error(`Media event failed: ${type}`));
    };
    target.addEventListener(type, handleResolve, { once: true });
    target.addEventListener('error', handleReject, { once: true });
  });
}

async function ensureVideoReady(video) {
  if (video.readyState >= 1 && Number.isFinite(video.duration)) return;
  await waitForEvent(video, 'loadedmetadata');
}

async function seekVideo(video, time) {
  const duration = Number(video.duration) || 0;
  const safeTime = Math.max(0, Math.min(Math.max(0, duration - 0.05), time));
  if (Math.abs((video.currentTime || 0) - safeTime) < 0.04) return;
  video.currentTime = safeTime;
  await waitForEvent(video, 'seeked');
}

export async function captureVideoFrameStrip(options = {}) {
  if (typeof document === 'undefined') return [];
  const count = Math.max(2, Math.floor(Number(options.count) || 10));
  const width = Math.max(32, Math.floor(Number(options.width) || 96));
  const height = Math.max(18, Math.floor(Number(options.height) || 54));
  const source = options.file || options.blob;
  const sourceUrl = options.url || (source ? URL.createObjectURL(source) : '');
  if (!sourceUrl) return [];
  const shouldRevoke = !options.url;
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = sourceUrl;
  try {
    await ensureVideoReady(video);
    const duration = Number(video.duration) || 0;
    if (!duration) return [];
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return [];
    const frames = [];
    for (let index = 0; index < count; index += 1) {
      const ratio = count === 1 ? 0.5 : index / (count - 1);
      await seekVideo(video, ratio * duration);
      context.drawImage(video, 0, 0, width, height);
      frames.push(canvas.toDataURL('image/jpeg', 0.72));
    }
    return frames;
  } catch {
    return [];
  } finally {
    video.removeAttribute('src');
    video.load?.();
    if (shouldRevoke) URL.revokeObjectURL(sourceUrl);
  }
}

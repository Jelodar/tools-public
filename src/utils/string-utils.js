export function hasRtlScript(value) {
  return /[\u0590-\u05ff\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/.test(String(value || ''));
}

export function wrapRtl(value) {
  const text = String(value ?? '');
  if (!hasRtlScript(text)) return text;
  if ((text.startsWith('\u202B') && text.endsWith('\u202C')) || (text.startsWith('\u2067') && text.endsWith('\u2069'))) return text;
  return `\u202B${text}\u202C`;
}

export function stripControlMarks(value) {
  return String(value ?? '').replace(/[\u202A-\u202E\u2066-\u2069]/g, '');
}

export function padNumber(value, size = 2) {
  return String(Math.max(0, Math.floor(Number(value) || 0))).padStart(size, '0');
}

export function formatDuration(value, { milliseconds = true } = {}) {
  const totalMs = Math.max(0, Math.round((Number(value) || 0) * 1000));
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  const base = `${padNumber(minutes)}:${padNumber(seconds)}`;
  return milliseconds ? `${base}.${String(ms).padStart(3, '0')}` : base;
}

export function formatTimecode(value, fps = 30) {
  const rate = Math.max(1, Math.round(Number(fps) || 30));
  const totalFrames = Math.max(0, Math.round((Number(value) || 0) * rate));
  const frames = totalFrames % rate;
  const totalSeconds = Math.floor(totalFrames / rate);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  return `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}:${padNumber(frames)}`;
}

export function toKebabCase(value) {
  return String(value ?? '')
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^\w]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

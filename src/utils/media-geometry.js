export function normalizeRightAngleRotation(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const wrapped = ((number % 360) + 360) % 360;
  const rounded = Math.round(wrapped / 90) * 90;
  const normalized = rounded === 360 ? 0 : rounded;
  return Math.abs(wrapped - normalized) < 0.001 || Math.abs(wrapped - 360) < 0.001 ? normalized : null;
}

export function getOrientedMediaDimensions(width, height, rotation = 0) {
  const safeWidth = Math.max(1, Number(width) || 1);
  const safeHeight = Math.max(1, Number(height) || 1);
  const angle = normalizeRightAngleRotation(rotation);
  const swapped = angle === 90 || angle === 270;
  return {
    width: swapped ? safeHeight : safeWidth,
    height: swapped ? safeWidth : safeHeight,
    rotation: angle,
    swapped
  };
}

export function fitRectToAspect(containerWidth, containerHeight, aspectRatio) {
  const safeWidth = Math.max(1, Number(containerWidth) || 1);
  const safeHeight = Math.max(1, Number(containerHeight) || 1);
  const ratio = Math.max(0.0001, Number(aspectRatio) || 1);
  const containerRatio = safeWidth / safeHeight;
  let width = safeWidth;
  let height = safeHeight;
  if (ratio > containerRatio) height = width / ratio;
  else width = height * ratio;
  const left = (safeWidth - width) / 2;
  const top = (safeHeight - height) / 2;
  return { left, top, right: left + width, bottom: top + height, width, height };
}

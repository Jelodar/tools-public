export function clamp(value, min, max = Number.POSITIVE_INFINITY) {
  const number = Number(value);
  const fallback = Number.isFinite(number) ? number : 0;
  return Math.min(Number(max), Math.max(Number(min), fallback));
}

export function lerp(start, end, amount) {
  return Number(start) + ((Number(end) - Number(start)) * Number(amount));
}

export function inverseLerp(start, end, value) {
  const span = Number(end) - Number(start);
  if (!span) return 0;
  return (Number(value) - Number(start)) / span;
}

export function mapRange(value, inputMin, inputMax, outputMin, outputMax) {
  return lerp(outputMin, outputMax, inverseLerp(inputMin, inputMax, value));
}

export function snapToStep(value, step = 1, origin = 0) {
  const size = Math.abs(Number(step) || 1);
  const base = Number(origin) || 0;
  return base + (Math.round((Number(value) - base) / size) * size);
}

export function roundTo(value, places = 9) {
  const factor = 10 ** Math.max(0, Math.round(Number(places) || 0));
  const rounded = Math.round((Number(value) || 0) * factor) / factor;
  const nearestInteger = Math.round(rounded);
  if (Math.abs(rounded - nearestInteger) < 1e-7) return nearestInteger;
  return Math.abs(rounded) < Number.EPSILON ? 0 : rounded;
}

export function degToRad(value) {
  return ((Number(value) || 0) * Math.PI) / 180;
}

export function radToDeg(value) {
  return ((Number(value) || 0) * 180) / Math.PI;
}

export function normalizeAngle(value) {
  const angle = Number(value) || 0;
  return ((angle % 360) + 360) % 360;
}

export function identityMatrix() {
  return [1, 0, 0, 1, 0, 0];
}

export function multiplyMatrix(a = identityMatrix(), b = identityMatrix()) {
  const [a0, a1, a2, a3, a4, a5] = a;
  const [b0, b1, b2, b3, b4, b5] = b;
  return [
    roundTo((a0 * b0) + (a2 * b1)),
    roundTo((a1 * b0) + (a3 * b1)),
    roundTo((a0 * b2) + (a2 * b3)),
    roundTo((a1 * b2) + (a3 * b3)),
    roundTo((a0 * b4) + (a2 * b5) + a4),
    roundTo((a1 * b4) + (a3 * b5) + a5)
  ];
}

export function translateMatrix(x = 0, y = 0) {
  return [1, 0, 0, 1, Number(x) || 0, Number(y) || 0];
}

export function scaleMatrix(scaleX = 1, scaleY = scaleX) {
  return [Number(scaleX) || 0, 0, 0, Number(scaleY) || 0, 0, 0];
}

export function rotateMatrix(degrees = 0) {
  const radians = degToRad(degrees);
  const cos = roundTo(Math.cos(radians));
  const sin = roundTo(Math.sin(radians));
  return [cos, sin, -sin, cos, 0, 0];
}

export function skewMatrix(skewX = 0, skewY = 0) {
  return [1, Math.tan(degToRad(skewY)), Math.tan(degToRad(skewX)), 1, 0, 0];
}

export function composeMatrix({
  x = 0,
  y = 0,
  scaleX = 1,
  scaleY = 1,
  rotation = 0,
  skewX = 0,
  skewY = 0
} = {}) {
  return [
    translateMatrix(x, y),
    rotateMatrix(rotation),
    skewMatrix(skewX, skewY),
    scaleMatrix(scaleX, scaleY)
  ].reduce((matrix, next) => multiplyMatrix(matrix, next), identityMatrix());
}

export function applyMatrixToPoint(matrix = identityMatrix(), point = {}) {
  const [a, b, c, d, e, f] = matrix;
  const x = Number(point.x) || 0;
  const y = Number(point.y) || 0;
  return {
    x: roundTo((a * x) + (c * y) + e),
    y: roundTo((b * x) + (d * y) + f)
  };
}

export function invertMatrix(matrix = identityMatrix()) {
  const [a, b, c, d, e, f] = matrix;
  const determinant = (a * d) - (b * c);
  if (!determinant) return identityMatrix();
  return [
    roundTo(d / determinant),
    roundTo(-b / determinant),
    roundTo(-c / determinant),
    roundTo(a / determinant),
    roundTo(((c * f) - (d * e)) / determinant),
    roundTo(((b * e) - (a * f)) / determinant)
  ];
}

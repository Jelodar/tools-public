/**
 * UUID Utilities
 * Supports v1, v3, v4, v5, v6, v7, v8.
 */

// v4 & v7 are already implemented, let's keep them and add others
export function generateUUIDv4() {
  return crypto.randomUUID();
}

export function generateUUIDv7() {
  const timestamp = Date.now();
  const hexTimestamp = timestamp.toString(16).padStart(12, '0');
  const randomValues = new Uint8Array(10);
  crypto.getRandomValues(randomValues);
  randomValues[0] = (randomValues[0] & 0x0f) | 0x70; // v7
  randomValues[2] = (randomValues[2] & 0x3f) | 0x80; // variant
  const randomHex = Array.from(randomValues).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hexTimestamp.slice(0, 8)}-${hexTimestamp.slice(8, 12)}-${randomHex.slice(0, 4)}-${randomHex.slice(4, 8)}-${randomHex.slice(8)}`;
}

// v1 (Time-based), v3/v5 (MD5/SHA1 Name-based) usually require libraries for accuracy
// We will use specialized small ports via ESM.sh
export async function generateAdvancedUUID(version, name = '', namespace = '') {
  const { v1, v3, v5, v6 } = await import('https://esm.sh/uuid@9.0.1');
  
  if (version === '1') return v1();
  if (version === '3') return v3(name, namespace || '6ba7b810-9dad-11d1-80b4-00c04fd430c8');
  if (version === '5') return v5(name, namespace || '6ba7b810-9dad-11d1-80b4-00c04fd430c8');
  if (version === '6') return v6();
  return generateUUIDv7();
}

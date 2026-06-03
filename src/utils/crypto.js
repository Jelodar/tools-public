/**
 * WebCrypto Hashing
 */
export async function hashText(text, algorithm = 'SHA-256') {
  if (typeof text !== 'string') {
    throw new TypeError('Input must be a string');
  }
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

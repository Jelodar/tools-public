const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

export function transformEncoding(rawValue, operation) {
  const value = String(rawValue ?? '');

  switch (operation) {
    case 'b64-enc':
      return bytesToBase64(new TextEncoder().encode(value));
    case 'b64-dec':
      return new TextDecoder().decode(base64ToBytes(value.trim()));
    case 'url-enc':
      return encodeURIComponent(value);
    case 'url-dec':
      return decodeURIComponent(value.trim());
    case 'html-enc':
      return value.replace(/[\u00A0-\u9999<>&"'`]/g, (char) => `&#${char.charCodeAt(0)};`);
    case 'html-dec':
      return decodeHtmlEntities(value);
    case 'hex-enc':
      return Array.from(new TextEncoder().encode(value)).map((byte) => byte.toString(16).padStart(2, '0')).join(' ');
    case 'bin-enc':
      return Array.from(new TextEncoder().encode(value)).map((byte) => byte.toString(2).padStart(8, '0')).join(' ');
    default:
      throw new Error('Unsupported encoding operation');
  }
}

export function convertCase(rawValue, mode) {
  const value = String(rawValue ?? '');
  const words = tokenizeWords(value);

  switch (mode) {
    case 'lower':
      return value.toLowerCase();
    case 'upper':
      return value.toUpperCase();
    case 'camel':
      return words.map((word, index) => index === 0 ? word : capitalize(word)).join('');
    case 'pascal':
      return words.map((word) => capitalize(word)).join('');
    case 'snake':
      return words.join('_');
    case 'kebab':
      return words.join('-');
    case 'title':
      return words.map((word) => capitalize(word)).join(' ');
    default:
      throw new Error('Unsupported case mode');
  }
}

export function parseUrlDetails(rawValue) {
  const input = String(rawValue ?? '').trim();
  if (!input) throw new Error('Enter a URL');

  const url = new URL(input);

  return {
    href: url.href,
    protocol: url.protocol,
    origin: url.origin,
    hostname: url.hostname,
    host: url.host,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    params: Array.from(url.searchParams.entries()).map(([key, value]) => ({ key, value }))
  };
}

function tokenizeWords(value) {
  return String(value ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .match(/[A-Z]{2,}(?=[A-Z][a-z]|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]+|[0-9]+/g)?.map((word) => word.toLowerCase()) || [];
}

function capitalize(value) {
  return value ? value[0].toUpperCase() + value.slice(1) : '';
}

function decodeHtmlEntities(value) {
  return String(value ?? '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function bytesToBase64(bytes) {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');

  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value) {
  const normalized = String(value ?? '').replace(/\s+/g, '');

  if (!normalized || normalized.length % 4 === 1 || /[^A-Za-z0-9+/=]/.test(normalized)) {
    throw new Error('Invalid Base64 sequence');
  }

  if (typeof Buffer !== 'undefined') return Uint8Array.from(Buffer.from(normalized, 'base64'));

  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export { BASE64_ALPHABET };

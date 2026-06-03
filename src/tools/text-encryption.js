import { mount as mountCryptoEncryptionAlias, unmount as unmountCryptoEncryptionAlias } from './crypto-encryption.js';

export async function mount(container) {
  return mountCryptoEncryptionAlias(container);
}

export function unmount() {
  return unmountCryptoEncryptionAlias();
}

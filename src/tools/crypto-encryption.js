import { copyToClipboard, downloadFile } from '../ui/ui-utils.js';

if (typeof window.process === 'undefined') {
  window.process = { env: { NODE_ENV: 'production' } };
}

let container = null;

export async function mount(parent) {
  container = document.createElement('div');
  container.className = 'tool-crypto';
  container.innerHTML = `
    <div class="card rj-layout">
      <div class="settings-grid">
        <div class="form-group" id="group-pass">
          <label>Passphrase / Secret Key</label>
          <input type="password" id="crypto-pass" placeholder="Use a strong local passphrase">
          <div class="info-hint">A strong passphrase with 12+ characters protects local encryption.</div>
        </div>
        <div class="form-group hidden" id="group-keys">
          <label>Asymmetric Keys (PEM/Armored)</label>
          <textarea id="crypto-keys" class="crypto-key-textarea" placeholder="Paste RSA/PGP Public or Private key..."></textarea>
          <div class="info-hint">RSA-OAEP or PGP keys in standard PEM/Armored format.</div>
        </div>
        <div class="form-group">
          <label>Algorithm Subset</label>
          <select id="crypto-mode">
            <optgroup label="Standard (WebCrypto)">
              <option value="AES-GCM" data-tooltip="Standard for modern security; includes data authentication.">AES-256-GCM (Authenticated)</option>
              <option value="AES-CBC" data-tooltip="Legacy mode; fast but lacks built-in integrity checking.">AES-256-CBC (Legacy)</option>
              <option value="AES-CTR" data-tooltip="Streaming mode; ideal for processing large files.">AES-256-CTR (Streaming)</option>
              <option value="RSA-OAEP" data-tooltip="Public-key encryption for secure message exchange.">RSA-OAEP (Public Key)</option>
            </optgroup>
            <optgroup label="Modern (Noble/Ciphers)">
              <option value="CHACHA20" data-tooltip="Optimized for CPUs without AES hardware acceleration.">ChaCha20-Poly1305</option>
              <option value="SALSA20" data-tooltip="High-speed stream cipher predecessor to ChaCha20.">Salsa20</option>
            </optgroup>
            <optgroup label="OpenPGP (RFC 4880)">
              <option value="PGP-S" data-tooltip="Standard PGP symmetric encryption using a passphrase.">PGP Symmetric</option>
              <option value="PGP-K" data-tooltip="Key-based PGP encryption using a public key.">PGP Key-Based</option>
            </optgroup>
          </select>
          <div class="info-hint">Choose AES-GCM for most use cases, or OpenPGP for email security.</div>
        </div>
      </div>

      <div class="studio-section expanded">
        <div class="studio-section-header">
          <span class="studio-section-title">Security & Output Options</span>
          <span class="section-toggle-icon">▼</span>
        </div>
        <div class="studio-section-content">
          <div class="settings-grid">
            <div class="form-group">
              <label>Output Encoding</label>
              <select id="opt-encoding">
                <option value="base64" data-tooltip="Standard URL-safe character set.">Base64 (Standard)</option>
                <option value="hex" data-tooltip="Raw hexadecimal string representation.">Hex (Raw Hexadecimal)</option>
                <option value="armored" id="opt-encoding-armored" data-tooltip="Text-based PGP format with headers.">ASCII Armored (PGP Style)</option>
              </select>
              <div class="info-hint">Determines how the binary cipher data is represented as text.</div>
            </div>
            <div class="form-group" id="group-iterations">
              <label>PBKDF2 Iterations</label>
              <select id="opt-iterations">
                <option value="100000" data-tooltip="Balanced performance.">100,000 (Fast)</option>
                <option value="250000" selected data-tooltip="Recommended default.">250,000 (Secure)</option>
                <option value="600000" data-tooltip="Higher work factor for slower brute-force attempts.">600,000 (High)</option>
                <option value="1000000" data-tooltip="Slowest local setting.">1,000,000 (Maximum)</option>
              </select>
              <div class="info-hint">Higher iterations make it harder for attackers to guess your password.</div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-group crypto-plain-group">
        <label>Plaintext Context</label>
        <textarea id="crypto-plain" class="crypto-textarea" placeholder="Enter text to encrypt..."></textarea>
        <button id="btn-encrypt" class="crypto-run-button">Encrypt</button>
      </div>

      <div class="form-group">
        <label>Ciphertext Result</label>
        <textarea id="crypto-cipher" class="crypto-textarea crypto-cipher-textarea" placeholder="Enter payload to decrypt..."></textarea>
        <button id="btn-decrypt" class="btn-secondary crypto-run-button">Decrypt</button>
      </div>

      <div class="crypto-actions">
        <button id="btn-copy-cipher" class="crypto-action">Copy Payload</button>
        <button id="btn-dl-cipher" class="btn-secondary crypto-action">Download Binary</button>
      </div>

      <div id="crypto-status" class="crypto-status">Status: Awaiting Input</div>
    </div>
  `;
  
  parent.appendChild(container);
  setupListeners();
}

function setupListeners() {
  const modeSel = container.querySelector('#crypto-mode');
  const groupPass = container.querySelector('#group-pass');
  const groupKeys = container.querySelector('#group-keys');
  const groupIter = container.querySelector('#group-iterations');
  const optEncArmored = container.querySelector('#opt-encoding-armored');
  const optEnc = container.querySelector('#opt-encoding');
  const status = container.querySelector('#crypto-status');

  container.querySelector('.studio-section-header').onclick = (e) => {
    e.currentTarget.parentElement.classList.toggle('expanded');
  };

  const updateUI = () => {
    const val = modeSel.value;
    const isAsymmetric = val === 'PGP-K' || val === 'RSA-OAEP';
    const isPGP = val.startsWith('PGP');
    
    groupPass.classList.toggle('hidden', isAsymmetric);
    groupKeys.classList.toggle('hidden', !isAsymmetric);
    groupIter.classList.toggle('hidden', isAsymmetric);
    
    optEncArmored.classList.toggle('hidden', !isPGP);
    if (isPGP) optEnc.value = 'armored';
    else if (optEnc.value === 'armored') optEnc.value = 'base64';
  };

  modeSel.onchange = updateUI;
  updateUI();

  const getEncoding = (buf) => {
    const enc = optEnc.value;
    if (enc === 'hex') return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
    return btoa(String.fromCharCode(...buf));
  };

  const decodeInput = (str) => {
    const enc = optEnc.value;
    if (enc === 'hex') return new Uint8Array(str.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const clean = str.replace(/[^A-Za-z0-9+/=]/g, ""); 
    return new Uint8Array(atob(clean).split('').map(c => c.charCodeAt(0)));
  };

  const deriveKey = async (pass, salt, algo) => {
    const encoder = new TextEncoder();
    const iterations = parseInt(container.querySelector('#opt-iterations').value);
    const keyMaterial = await window.crypto.subtle.importKey('raw', encoder.encode(pass), 'PBKDF2', false, ['deriveKey']);
    return window.crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      keyMaterial,
      { name: algo.includes('CBC') ? 'AES-CBC' : (algo.includes('CTR') ? 'AES-CTR' : 'AES-GCM'), length: 256 },
      false, ['encrypt', 'decrypt']
    );
  };

  container.querySelector('#btn-encrypt').onclick = async () => {
    try {
      const mode = modeSel.value;
      const text = container.querySelector('#crypto-plain').value;
      const pass = container.querySelector('#crypto-pass').value;
      const keys = container.querySelector('#crypto-keys').value;
      if (!text) return;

      status.textContent = 'STATUS: COMPUTING...';

      if (mode.startsWith('PGP')) {
        const openpgp = await import('https://cdn.jsdelivr.net/npm/openpgp@5.11.0/dist/openpgp.min.mjs');
        const message = await openpgp.createMessage({ text });
        const format = optEnc.value === 'armored' ? 'armored' : 'binary';
        
        let result;
        if (mode === 'PGP-S') {
          if (!pass) throw new Error('Passphrase is required for PGP Symmetric mode');
          result = await openpgp.encrypt({ message, passwords: [pass], format });
        } else {
          if (!keys || !keys.includes('BEGIN PGP PUBLIC KEY')) throw new Error('Valid PGP Public Key is required');
          result = await openpgp.encrypt({ message, encryptionKeys: await openpgp.readKey({ armoredKey: keys }), format });
        }
        container.querySelector('#crypto-cipher').value = (typeof result === 'string') ? result : getEncoding(result);
      }
      else if (mode === 'CHACHA20' || mode === 'SALSA20') {
        const { chacha20poly1305 } = await import('https://esm.sh/@noble/ciphers@0.5.3/chacha');
        const { salsa20 } = await import('https://esm.sh/@noble/ciphers@0.5.3/salsa');
        const { sha256 } = await import('https://esm.sh/@noble/hashes@1.3.1/sha256');
        
        const key = sha256(new TextEncoder().encode(pass));
        const nonce = window.crypto.getRandomValues(new Uint8Array(mode === 'CHACHA20' ? 12 : 8));
        const data = new TextEncoder().encode(text);
        
        let encrypted;
        if (mode === 'CHACHA20') {
          encrypted = chacha20poly1305(key, nonce).encrypt(data);
        } else {
          encrypted = salsa20(key, nonce, data);
        }
        
        const combined = new Uint8Array(nonce.length + encrypted.length);
        combined.set(nonce);
        combined.set(encrypted, nonce.length);
        container.querySelector('#crypto-cipher').value = getEncoding(combined);
      }
      else if (mode === 'RSA-OAEP') {
        if (!keys) throw new Error('RSA Public Key is required');
        const rawPem = keys.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n|\r/g, '').trim();
        const key = await window.crypto.subtle.importKey('spki', decodeInput(rawPem), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
        const enc = await window.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, new TextEncoder().encode(text));
        container.querySelector('#crypto-cipher').value = getEncoding(new Uint8Array(enc));
      }
      else {
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const ivLen = (mode === 'AES-GCM') ? 12 : 16;
        const iv = window.crypto.getRandomValues(new Uint8Array(ivLen));
        const key = await deriveKey(pass, salt, mode);
        
        const params = { name: mode, iv };
        if (mode === 'AES-CTR') {
          params.counter = iv;
          params.length = 64;
        }
        
        const enc = await window.crypto.subtle.encrypt(params, key, new TextEncoder().encode(text));
        const combined = new Uint8Array(salt.length + iv.length + enc.byteLength);
        combined.set(salt, 0);
        combined.set(iv, 16);
        combined.set(new Uint8Array(enc), 16 + iv.length);
        container.querySelector('#crypto-cipher').value = getEncoding(combined);
      }
      status.textContent = 'STATUS: ENCRYPTION COMPLETE';
    } catch (error) {
      status.textContent = `ERROR: ${error.message}`;
    }
  };

  container.querySelector('#btn-decrypt').onclick = async () => {
    try {
      const mode = modeSel.value;
      const cipher = container.querySelector('#crypto-cipher').value;
      const pass = container.querySelector('#crypto-pass').value;
      const keys = container.querySelector('#crypto-keys').value;
      if (!cipher) return;

      status.textContent = 'STATUS: DECRYPTING...';

      if (mode.startsWith('PGP')) {
        const openpgp = await import('https://cdn.jsdelivr.net/npm/openpgp@5.11.0/dist/openpgp.min.mjs');
        const isArmored = cipher.includes('-----BEGIN PGP');
        const message = await (isArmored ? openpgp.readMessage({ armoredMessage: cipher }) : openpgp.readMessage({ binaryMessage: decodeInput(cipher) }));
        const config = { message };
        if (mode === 'PGP-S') {
          if (!pass) throw new Error('Passphrase is required for decryption');
          config.passwords = [pass];
        } else {
          if (!keys || !keys.includes('BEGIN PGP PRIVATE KEY')) throw new Error('Valid PGP Private Key is required');
          config.decryptionKeys = await openpgp.readPrivateKey({ armoredKey: keys });
        }
        const { data } = await openpgp.decrypt(config);
        container.querySelector('#crypto-plain').value = data;
      }
      else if (mode === 'CHACHA20' || mode === 'SALSA20') {
        const { chacha20poly1305 } = await import('https://esm.sh/@noble/ciphers@0.5.3/chacha');
        const { salsa20 } = await import('https://esm.sh/@noble/ciphers@0.5.3/salsa');
        const { sha256 } = await import('https://esm.sh/@noble/hashes@1.3.1/sha256');
        
        const raw = decodeInput(cipher);
        const nonceLen = mode === 'CHACHA20' ? 12 : 8;
        const nonce = raw.slice(0, nonceLen);
        const data = raw.slice(nonceLen);
        const key = sha256(new TextEncoder().encode(pass));
        
        let dec;
        if (mode === 'CHACHA20') {
          dec = chacha20poly1305(key, nonce).decrypt(data);
        } else {
          dec = salsa20(key, nonce, data);
        }
        container.querySelector('#crypto-plain').value = new TextDecoder().decode(dec);
      }
      else if (mode === 'RSA-OAEP') {
        if (!keys) throw new Error('RSA Private Key is required');
        const rawPem = keys.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n|\r/g, '').trim();
        const key = await window.crypto.subtle.importKey('pkcs8', decodeInput(rawPem), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
        const dec = await window.crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, decodeInput(cipher));
        container.querySelector('#crypto-plain').value = new TextDecoder().decode(dec);
      }
      else {
        const raw = decodeInput(cipher);
        const salt = raw.slice(0, 16);
        const ivLen = (mode === 'AES-GCM') ? 12 : 16;
        const iv = raw.slice(16, 16 + ivLen);
        const data = raw.slice(16 + ivLen);
        const key = await deriveKey(pass, salt, mode);
        
        const params = { name: mode, iv };
        if (mode === 'AES-CTR') {
          params.counter = iv;
          params.length = 64;
        }
        
        const dec = await window.crypto.subtle.decrypt(params, key, data);
        container.querySelector('#crypto-plain').value = new TextDecoder().decode(dec);
      }
      status.textContent = 'STATUS: DECRYPTING SUCCESSFUL';
    } catch (error) {
      status.textContent = `ERROR: ${error.message}`;
    }
  };

  container.querySelector('#btn-copy-cipher').onclick = () => copyToClipboard(container.querySelector('#crypto-cipher').value);
  container.querySelector('#btn-dl-cipher').onclick = () => downloadFile(container.querySelector('#crypto-cipher').value, 'encrypted.dat');
}

export function unmount() {
  if (container) container.remove();
}

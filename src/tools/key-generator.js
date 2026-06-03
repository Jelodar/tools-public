import { downloadFile, copyToClipboard, showToast } from '../ui/ui-utils.js';

let container = null;
const loadEd25519CurveModule = () => import('https://esm.sh/@noble/curves@1.4.0/ed25519');
const loadEd448CurveModule = () => import('https://esm.sh/@noble/curves@1.4.0/ed448');
const loadSecp256k1CurveModule = () => import('https://esm.sh/@noble/curves@1.4.0/secp256k1');
const NOBLE_CURVE_LOADERS = {
  ED25519: loadEd25519CurveModule,
  ED448: loadEd448CurveModule,
  X25519: loadEd25519CurveModule,
  X448: loadEd448CurveModule,
  SECP256K1: loadSecp256k1CurveModule
};
const NOBLE_CURVE_EXPORTS = {
  ED25519: 'ed25519',
  ED448: 'ed448',
  X25519: 'x25519',
  X448: 'x448',
  SECP256K1: 'secp256k1'
};

export async function mount(parent) {
  container = document.createElement('div');
  container.className = 'tool-key-gen';
  container.innerHTML = `
    <div class="card rj-layout">
      <div class="settings-grid">
        <div class="form-group">
          <label>Algorithm Family</label>
          <select id="key-algo">
            <optgroup label="Asymmetric Signatures">
              <option value="ED25519">Ed25519</option>
              <option value="ED448">Ed448 (Goldilocks)</option>
              <option value="ECDSA">ECDSA (NIST Curves)</option>
              <option value="SECP256K1">secp256k1 (Koblitz)</option>
              <option value="RSASSA-PKCS1-v1_5">RSASSA-PKCS1</option>
            </optgroup>
            <optgroup label="Key Exchange / Encryption">
              <option value="X25519">X25519 (Montgomery)</option>
              <option value="X448">X448 (Montgomery)</option>
              <option value="RSA-OAEP">RSA-OAEP</option>
            </optgroup>
            <optgroup label="Web Push & Cloud">
              <option value="VAPID">VAPID (Web Push Keys)</option>
            </optgroup>
            <optgroup label="OpenPGP (Standard)">
              <option value="PGP-RSA">OpenPGP RSA</option>
              <option value="PGP-ECC">OpenPGP ECC</option>
            </optgroup>
          </select>
        </div>

        <div class="form-group hidden" id="rsa-options">
          <label>Modulus Strength</label>
          <select id="key-bits">
            <option value="2048">2048 bit</option>
            <option value="3072">3072 bit</option>
            <option value="4096">4096 bit</option>
            <option value="8192">8192 bit</option>
          </select>
        </div>

        <div class="form-group hidden" id="ecdsa-options">
          <label>Curve Selection</label>
          <select id="key-curve">
            <option value="P-256">P-256 (NIST)</option>
            <option value="P-384">P-384 (NIST)</option>
            <option value="P-521">P-521 (NIST)</option>
          </select>
        </div>
      </div>

      <div class="studio-section expanded">
        <div class="studio-section-header">
          <span class="studio-section-title">Generation Options</span>
          <span class="section-toggle-icon">▼</span>
        </div>
        <div class="studio-section-content keygen-options-stack">
          
          <div id="pgp-identity" class="hidden keygen-pgp-identity">
            <label class="keygen-subtle-label">PGP User Identity</label>
            <div class="keygen-identity-grid">
              <input type="text" id="pgp-name" placeholder="Full Name" value="Anonymous">
              <input type="text" id="pgp-email" placeholder="Email Address" value="tools@jelodar.com">
            </div>
          </div>

          <div class="settings-grid">
            <div class="form-group" id="group-format">
              <label>Export Format</label>
              <select id="opt-format">
                <option value="pem">PEM (OpenSSL Standard)</option>
                <option value="ssh" id="opt-format-ssh">OpenSSH (id_rsa style)</option>
                <option value="armored" id="opt-format-armored">ASCII Armored (PGP)</option>
                <option value="raw" id="opt-format-raw">Raw / Base64URL (VAPID Style)</option>
              </select>
            </div>
            <div class="form-group" id="group-passphrase">
              <label>Passphrase Protection</label>
              <input type="password" id="key-passphrase" placeholder="Encrypt private key...">
            </div>
          </div>
        </div>
      </div>
      
      <button id="btn-generate-keys" class="keygen-generate-button">Generate Keys</button>
      
      <div id="keys-result" class="hidden keygen-result">
        <div id="key-metadata" class="keygen-metadata">
          <div class="keygen-metadata-title">Key Details</div>
          <div id="meta-content" class="keygen-metadata-content"></div>
        </div>

        <div class="form-group">
          <label>Public Component</label>
          <textarea id="pub-key" class="keygen-output keygen-output-public" readonly></textarea>
          <div class="keygen-output-actions">
            <button id="btn-copy-pub" class="btn-secondary">Copy Public</button>
            <button id="btn-dl-pub" class="btn-secondary">Download .pub</button>
          </div>
        </div>

        <div class="form-group">
          <label>Private Component</label>
          <textarea id="priv-key" class="keygen-output keygen-output-private" readonly></textarea>
          <div class="keygen-output-actions">
            <button id="btn-copy-priv" class="btn-secondary">Copy Private</button>
            <button id="btn-dl-priv" class="btn-secondary">Download .key</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  parent.appendChild(container);
  setupListeners();
}

function setupListeners() {
  const algoSelect = container.querySelector('#key-algo');
  const rsaOpts = container.querySelector('#rsa-options');
  const ecdsaOpts = container.querySelector('#ecdsa-options');
  const pgpIdent = container.querySelector('#pgp-identity');
  const btnGen = container.querySelector('#btn-generate-keys');
  const resultArea = container.querySelector('#keys-result');
  const metaArea = container.querySelector('#meta-content');
  const pubArea = container.querySelector('#pub-key');
  const privArea = container.querySelector('#priv-key');
  const formatSelect = container.querySelector('#opt-format');
  const groupPass = container.querySelector('#group-passphrase');

  container.querySelector('.studio-section-header').onclick = (e) => {
    e.currentTarget.parentElement.classList.toggle('expanded');
  };

  const updateUI = () => {
    const val = algoSelect.value;
    const isRSA = val.includes('RSA');
    const isPGP = val.startsWith('PGP');
    const isECDSA = val === 'ECDSA';
    const isNoble = ['ED25519', 'ED448', 'X25519', 'X448', 'SECP256K1'].includes(val);
    const isVapid = val === 'VAPID';

    rsaOpts.classList.toggle('hidden', !isRSA);
    ecdsaOpts.classList.toggle('hidden', !isECDSA);
    pgpIdent.classList.toggle('hidden', !isPGP);

    container.querySelector('#opt-format-ssh').classList.toggle('hidden', isPGP || isVapid);
    container.querySelector('#opt-format-armored').classList.toggle('hidden', !isPGP);
    
    if (isPGP) formatSelect.value = 'armored';
    else if (isVapid || isNoble) formatSelect.value = 'raw';
    else formatSelect.value = 'pem';

    groupPass.classList.toggle('hidden', isVapid || isNoble);
  };

  algoSelect.onchange = updateUI;
  updateUI();

  const toBase64URL = (buf) => {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const formatPem = (buffer, label) => {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const lines = base64.match(/.{1,64}/g).join('\n');
    return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
  };

  btnGen.onclick = async () => {
    btnGen.disabled = true;
    btnGen.textContent = 'Generating...';
    
    try {
      const algo = algoSelect.value;
      const passphrase = container.querySelector('#key-passphrase').value;
      let pub = '', priv = '', meta = '';

      if (algo.startsWith('PGP')) {
        const openpgp = await import('https://cdn.jsdelivr.net/npm/openpgp@5.11.0/dist/openpgp.min.mjs');
        const { privateKey, publicKey } = await openpgp.generateKey({
          type: algo === 'PGP-RSA' ? 'rsa' : 'ecc',
          rsaBits: algo === 'PGP-RSA' ? parseInt(container.querySelector('#key-bits').value) : undefined,
          curve: algo === 'PGP-ECC' ? 'ed25519' : undefined,
          userIDs: [{ name: container.querySelector('#pgp-name').value, email: container.querySelector('#pgp-email').value }],
          passphrase
        });
        pub = publicKey; priv = privateKey;
        const keyObj = await openpgp.readKey({ armoredKey: publicKey });
        meta = `Standard: OpenPGP\nFingerprint: ${keyObj.getFingerprint()}\nAlgorithm: ${algo === 'PGP-RSA' ? 'RSA' : 'Ed25519'}`;
      } 
      else if (algo === 'VAPID') {
        const keyPair = await window.crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
        const pubRaw = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
        const privJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
        pub = toBase64URL(pubRaw);
        priv = privJwk.d;
        meta = `Standard: RFC 8292 (VAPID)\nCurve: NIST P-256\nFormat: URL-Safe Base64`;
      }
      else if (['ED25519', 'ED448', 'X25519', 'X448', 'SECP256K1'].includes(algo)) {
        const curveModule = await NOBLE_CURVE_LOADERS[algo]();
        const curve = curveModule[NOBLE_CURVE_EXPORTS[algo]] || curveModule[algo];

        let entropyLen = 32;
        if (algo === 'ED448') entropyLen = 57;
        else if (algo === 'X448') entropyLen = 56;

        const privKey = window.crypto.getRandomValues(new Uint8Array(entropyLen));
        const pubKey = curve.getPublicKey(privKey);
        
        const toHex = (b) => Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
        pub = toHex(pubKey);
        priv = toHex(privKey);
        meta = `Standard: Noble Curve\nAlgorithm: ${algo}\nStrength: ${entropyLen * 8}-bit entropy`;
      }
      else {
        let params;
        if (algo.startsWith('RSA')) {
          params = { name: algo, modulusLength: parseInt(container.querySelector('#key-bits').value), publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' };
        } else {
          params = { name: 'ECDSA', namedCurve: container.querySelector('#key-curve').value };
        }
        const keyPair = await window.crypto.subtle.generateKey(params, true, algo.includes('SSA') || algo === 'ECDSA' ? ['sign', 'verify'] : ['encrypt', 'decrypt']);
        const pubDer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
        const privDer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
        
        if (formatSelect.value === 'raw') {
          pub = toBase64URL(pubDer); priv = toBase64URL(privDer);
        } else {
          pub = formatPem(pubDer, 'PUBLIC KEY');
          priv = formatPem(privDer, 'PRIVATE KEY');
        }
        meta = `Standard: WebCrypto PKCS#8\nAlgorithm: ${algo}\nStrength: ${algo.includes('RSA') ? params.modulusLength + ' bit' : params.namedCurve}`;
      }

      pubArea.value = pub; privArea.value = priv; metaArea.innerText = meta;
      resultArea.classList.remove('hidden');
      showToast('Key material generated.', 'success');
    } catch (e) {
      showToast('Error: ' + e.message, 'danger');
    }
    finally { btnGen.disabled = false; btnGen.textContent = 'Generate Keys'; }
  };

  container.querySelector('#btn-copy-pub').onclick = () => copyToClipboard(pubArea.value);
  container.querySelector('#btn-copy-priv').onclick = () => copyToClipboard(privArea.value);
  
  container.querySelector('#btn-dl-pub').onclick = () => downloadFile(pubArea.value, 'public_key.key');
  container.querySelector('#btn-dl-priv').onclick = () => downloadFile(privArea.value, 'private_key.key');
}

export function unmount() {
  if (container) container.remove();
}

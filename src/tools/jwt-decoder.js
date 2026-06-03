import { copyToClipboard, downloadFile, showToast } from '../ui/ui-utils.js';
import { createEditor } from '../ui/ui-monaco.js';

let container = null;
let headerEditor = null;
let payloadEditor = null;

const DEFAULT_HEADER = { alg: 'HS256', typ: 'JWT' };
const DEFAULT_PAYLOAD = { sub: '1234567890', name: 'John Doe', iat: Math.floor(Date.now() / 1000) };
const JSON_EDITOR_OPTIONS = {
  language: 'json',
  wordWrap: 'on',
  tabSize: 2,
  insertSpaces: true,
  folding: true,
  renderWhitespace: 'selection',
  matchBrackets: 'always',
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: true, indentation: true },
  quickSuggestions: { other: true, comments: false, strings: true },
  suggestOnTriggerCharacters: true,
  selectionHighlight: true,
  occurrencesHighlight: 'singleFile',
  colorDecorators: true,
  stickyScroll: { enabled: false }
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function decodeBase64Url(segment, label) {
  if (!segment) throw new Error(`Missing ${label} segment`);
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    throw new Error(`${label} segment is not valid base64url`);
  }
}

function encodeBase64Url(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function createJsonEditorOptions(value) {
  return {
    ...JSON_EDITOR_OPTIONS,
    value
  };
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getValueType(value) {
  if (Array.isArray(value)) return 'Array';
  if (value === null) return 'Null';
  if (Number.isInteger(value)) return 'Integer';
  const type = typeof value;
  if (type === 'number') return 'Number';
  if (type === 'boolean') return 'Boolean';
  if (type === 'object') return 'Object';
  return 'String';
}

function truncateMiddle(value, maxLength = 72) {
  const text = String(value ?? '');
  if (text.length <= maxLength) return text;
  const edge = Math.max(8, Math.floor((maxLength - 3) / 2));
  return `${text.slice(0, edge)}...${text.slice(-edge)}`;
}

function formatRelativeSeconds(seconds) {
  const abs = Math.abs(seconds);
  const units = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1]
  ];
  const [unit, size] = units.find(([, unitSize]) => abs >= unitSize) || units.at(-1);
  const amount = Math.max(1, Math.round(abs / size));
  return `${amount} ${unit}${amount === 1 ? '' : 's'}`;
}

function getTemporalState(key, value, now) {
  if (!['exp', 'iat', 'nbf'].includes(key) || !Number.isFinite(Number(value))) return null;
  const seconds = Number(value);
  const date = new Date(seconds * 1000);
  const dateText = date.toLocaleString();
  if (key === 'exp') {
    const expired = seconds < now;
    return {
      copy: expired ? 'Expired' : 'Valid',
      tone: expired ? 'danger' : 'success',
      detail: expired ? `${formatRelativeSeconds(now - seconds)} ago` : `Expires in ${formatRelativeSeconds(seconds - now)}`,
      dateText
    };
  }
  if (key === 'nbf') {
    const pending = seconds > now;
    return {
      copy: pending ? 'Pending' : 'Active',
      tone: pending ? 'warning' : 'success',
      detail: pending ? `Starts in ${formatRelativeSeconds(seconds - now)}` : `Active for ${formatRelativeSeconds(now - seconds)}`,
      dateText
    };
  }
  return {
    copy: 'Issued',
    tone: 'neutral',
    detail: seconds > now ? `In ${formatRelativeSeconds(seconds - now)}` : `${formatRelativeSeconds(now - seconds)} ago`,
    dateText
  };
}

function highlightJson(value) {
  const json = JSON.stringify(value, null, 2);
  const tokenPattern = /"(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  return json.replace(tokenPattern, (token, offset) => {
    let className = 'jwt-json-number';
    if (token.startsWith('"') && token.endsWith('"')) {
      className = json.slice(offset + token.length).trimStart().startsWith(':')
        ? 'jwt-json-key'
        : 'jwt-json-string';
    } else if (token === 'true' || token === 'false') {
      className = 'jwt-json-boolean';
    } else if (token === 'null') {
      className = 'jwt-json-null';
    }
    return `<span class="${className}">${escapeHtml(token)}</span>`;
  });
}

function renderClaimValue(value, temporalState) {
  if (temporalState) {
    return `
      <span class="jwt-claim-scalar jwt-claim-date">${escapeHtml(temporalState.dateText)}</span>
      <span class="jwt-claim-raw">${escapeHtml(String(value))}</span>
      <span class="jwt-claim-detail">${escapeHtml(temporalState.detail)}</span>
    `;
  }
  if (typeof value === 'object' && value !== null) {
    return `<pre class="jwt-json-preview">${highlightJson(value)}</pre>`;
  }
  const className = value === null ? 'null' : typeof value;
  return `<span class="jwt-claim-scalar jwt-claim-${escapeHtml(className)}">${escapeHtml(value === null ? 'null' : String(value))}</span>`;
}

function summarizeHeader(header) {
  const keys = Object.keys(header || {});
  const parts = [
    `JSON ${pluralize(keys.length, 'key')}`,
    `alg ${header?.alg || 'none'}`,
    `typ ${header?.typ || 'none'}`
  ];
  if (header?.kid) parts.push(`kid ${header.kid}`);
  return parts;
}

function summarizePayload(payload) {
  const keys = Object.keys(payload || {});
  const timeClaims = keys.filter((key) => ['exp', 'iat', 'nbf'].includes(key)).length;
  const parts = [`JSON ${pluralize(keys.length, 'claim')}`];
  if (timeClaims) parts.push(pluralize(timeClaims, 'time claim'));
  if (payload?.iss) parts.push(`iss ${payload.iss}`);
  if (payload?.aud) parts.push(`aud ${Array.isArray(payload.aud) ? payload.aud.join(', ') : payload.aud}`);
  return parts;
}

function renderMetaChips(items) {
  return items
    .filter((item) => item !== undefined && item !== null && String(item).trim())
    .map((item) => `<span>${escapeHtml(item)}</span>`)
    .join('');
}

function renderSegmentMap(parts, header, payload, options = {}) {
  const signature = parts[2] || '';
  const signatureState = options.unsignedPreview
    ? 'Unsigned preview'
    : signature
      ? `${signature.length} chars`
      : 'Missing';
  const segments = [
    {
      className: 'jwt-segment-header',
      number: '1',
      title: 'Header',
      kind: 'JSON',
      summary: summarizeHeader(header).join(' · '),
      code: parts[0] || ''
    },
    {
      className: 'jwt-segment-payload',
      number: '2',
      title: 'Payload',
      kind: 'Claims',
      summary: summarizePayload(payload).join(' · '),
      code: parts[1] || ''
    },
    {
      className: 'jwt-segment-signature',
      number: '3',
      title: 'Signature',
      kind: options.unsignedPreview ? 'Preview' : 'JWS',
      summary: signatureState,
      code: signature || 'Not present'
    }
  ];
  return segments.map((segment) => `
    <div class="jwt-segment-pill ${segment.className}">
      <div class="jwt-segment-top">
        <span class="jwt-segment-index">${segment.number}</span>
        <span class="jwt-segment-title">${escapeHtml(segment.title)}</span>
        <span class="jwt-segment-kind">${escapeHtml(segment.kind)}</span>
      </div>
      <div class="jwt-segment-summary">${escapeHtml(segment.summary)}</div>
      <code>${escapeHtml(truncateMiddle(segment.code))}</code>
    </div>
  `).join('');
}

export async function mount(parent) {
  container = document.createElement('div');
  container.className = 'tool-jwt';
  container.innerHTML = `
    <div class="card rj-layout">
      <div class="jwt-grid">
        <div class="jwt-column">
          <div class="form-group jwt-encoded-group">
            <label>Encoded Token (Paste to Decode / Updates when editing right)</label>
            <textarea id="jwt-input" class="jwt-token-input" placeholder="xxxxx.yyyyy.zzzzz"></textarea>
          </div>

          <div id="jwt-segment-map" class="jwt-segment-map hidden"></div>

          <div class="studio-section expanded">
            <div class="studio-section-header">
              <span class="studio-section-title">Signature & Verification</span>
            </div>
            <div class="studio-section-content jwt-section-content">
              <div class="form-group">
                <label>Secret or Key (HMAC Secret / RSA/EC PEM / JWK)</label>
                <textarea id="jwt-key" class="jwt-key-input" placeholder="Enter secret or paste private/public key..."></textarea>
              </div>
              <div id="sig-status" class="jwt-status jwt-status-neutral">
                NO KEY PROVIDED
              </div>
              <div class="jwt-action-row">
                <button id="btn-verify" class="btn-secondary jwt-action-btn">Verify Signature</button>
                <button id="btn-sign" class="jwt-action-btn">Sign / Update</button>
              </div>
            </div>
          </div>
        </div>

        <div class="jwt-column">
          <div class="tabs-header jwt-tabs">
            <button class="tab-btn active" data-tab="decoded">Decoded View</button>
            <button class="tab-btn" data-tab="analysis">Claim Analysis</button>
            <button class="tab-btn" data-tab="keys">Key Toolkit</button>
          </div>

          <div id="tab-decoded" class="tab-content jwt-decoded-tab">
            <div class="form-group jwt-editor-card-short">
              <div class="jwt-editor-heading">
                <label class="jwt-header-label">Header: Algorithm & Token Type</label>
                <div id="jwt-header-meta" class="jwt-editor-meta"></div>
              </div>
              <div id="monaco-jwt-header" class="jwt-monaco-fill"></div>
            </div>
            <div class="form-group jwt-editor-card-fill">
              <div class="jwt-editor-heading">
                <label class="jwt-payload-label">Payload: Data & Claims</label>
                <div id="jwt-payload-meta" class="jwt-editor-meta"></div>
              </div>
              <div id="monaco-jwt-payload" class="jwt-monaco-fill"></div>
            </div>
          </div>

          <div id="tab-analysis" class="tab-content hidden jwt-surface">
            <div id="analysis-list" class="jwt-analysis-list">
              <div class="jwt-empty">Input a token to analyze claims...</div>
            </div>
          </div>

          <div id="tab-keys" class="tab-content hidden jwt-surface">
             <div class="form-group">
                <label>Convert Key Format</label>
                <div class="jwt-key-stack">
                  <button id="btn-jwk-to-pem" class="btn-secondary">JWK to PEM</button>
                  <button id="btn-pem-to-jwk" class="btn-secondary">PEM to JWK</button>
                  <div class="jwt-key-hint">Result will be shown in the Key field on the left.</div>
                </div>
             </div>
          </div>

          <div class="jwt-footer-row">
            <button id="btn-copy-decoded" class="btn-secondary jwt-grow-btn">Copy Decoded</button>
            <button id="btn-dl-decoded" class="btn-secondary jwt-grow-btn">Export JSON</button>
          </div>
        </div>

      </div>
    </div>
  `;
  
  parent.appendChild(container);
  
  const input = container.querySelector('#jwt-input');
  const keyInput = container.querySelector('#jwt-key');
  const sigStatus = container.querySelector('#sig-status');
  const analysisList = container.querySelector('#analysis-list');
  const segmentMap = container.querySelector('#jwt-segment-map');
  const headerMeta = container.querySelector('#jwt-header-meta');
  const payloadMeta = container.querySelector('#jwt-payload-meta');

  const setSigStatus = (copy, tone = 'neutral') => {
    sigStatus.textContent = copy;
    sigStatus.className = `jwt-status jwt-status-${tone}`;
  };

  const updateDecodedMeta = (header = DEFAULT_HEADER, payload = DEFAULT_PAYLOAD) => {
    headerMeta.innerHTML = renderMetaChips(summarizeHeader(header));
    payloadMeta.innerHTML = renderMetaChips(summarizePayload(payload));
  };

  const updateSegmentMap = (parts, header, payload, options = {}) => {
    segmentMap.innerHTML = renderSegmentMap(parts, header, payload, options);
    segmentMap.classList.remove('hidden');
  };

  const clearSegmentMap = () => {
    segmentMap.innerHTML = '';
    segmentMap.classList.add('hidden');
  };

  const setDecodeError = (error) => {
    setSigStatus(`DECODE ERROR: ${error.message.toUpperCase()}`, 'invalid');
    clearSegmentMap();
    analysisList.innerHTML = '<div class="jwt-empty">Token could not be decoded.</div>';
  };

  updateDecodedMeta();

  const hRes = await createEditor(
    container.querySelector('#monaco-jwt-header'),
    createJsonEditorOptions(JSON.stringify(DEFAULT_HEADER, null, 2))
  );
  headerEditor = hRes.editor;
  const pRes = await createEditor(
    container.querySelector('#monaco-jwt-payload'),
    createJsonEditorOptions(JSON.stringify(DEFAULT_PAYLOAD, null, 2))
  );
  payloadEditor = pRes.editor;

  input.addEventListener('input', () => decode(input.value));
  headerEditor.onDidChangeModelContent(() => { if (!isDecoding) updateEncoded(); });
  payloadEditor.onDidChangeModelContent(() => { if (!isDecoding) updateEncoded(); });

  let isDecoding = false;
  const decode = (token) => {
    if (!token.trim()) {
      clearSegmentMap();
      updateDecodedMeta();
      analysisList.innerHTML = '<div class="jwt-empty">Input a token to analyze claims...</div>';
      setSigStatus('NO TOKEN PROVIDED', 'neutral');
      return;
    }
    isDecoding = true;
    try {
      const parts = token.trim().split('.');
      if (parts.length < 2) throw new Error('Incomplete JWT structure');

      const hStr = decodeBase64Url(parts[0], 'Header');
      const pStr = decodeBase64Url(parts[1], 'Payload');
      const header = JSON.parse(hStr);
      const payload = JSON.parse(pStr);

      headerEditor.setValue(JSON.stringify(header, null, 2));
      payloadEditor.setValue(JSON.stringify(payload, null, 2));
      
      updateDecodedMeta(header, payload);
      updateSegmentMap(parts, header, payload);
      analyzeClaims(payload);
      setSigStatus(parts[2] ? 'SIGNATURE PRESENT - AWAITING VERIFICATION' : 'NO SIGNATURE SEGMENT - DECODED HEADER/PAYLOAD', 'neutral');
    } catch (e) {
      setDecodeError(e);
    } finally {
      isDecoding = false;
    }
  };

  const updateEncoded = () => {
    try {
      const header = JSON.parse(headerEditor.getValue());
      const payload = JSON.parse(payloadEditor.getValue());
      const h = encodeBase64Url(headerEditor.getValue());
      const p = encodeBase64Url(payloadEditor.getValue());
      input.value = `${h}.${p}.[Signature]`;
      updateDecodedMeta(header, payload);
      updateSegmentMap([h, p, '[Signature]'], header, payload, { unsignedPreview: true });
      analyzeClaims(payload);
      setSigStatus('UNSIGNED TOKEN PREVIEW', 'neutral');
    } catch (e) {
      setSigStatus(`EDIT ERROR: ${e.message.toUpperCase()}`, 'invalid');
    }
  };

  const analyzeClaims = (payload) => {
    let html = '';
    const now = Math.floor(Date.now() / 1000);
    const claimDefs = {
      iss: 'Issuer', sub: 'Subject', aud: 'Audience',
      exp: 'Expiration Time', nbf: 'Not Before', iat: 'Issued At',
      jti: 'JWT ID'
    };

    Object.entries(payload).forEach(([key, val]) => {
      const label = claimDefs[key] || key;
      const temporalState = getTemporalState(key, val, now);
      const state = temporalState
        ? `<span class="jwt-claim-state jwt-claim-state-${temporalState.tone}">${escapeHtml(temporalState.copy)}</span>`
        : '';

      html += `
        <div class="jwt-claim-row" data-claim="${escapeHtml(key)}">
          <div class="jwt-claim-top">
            <div class="jwt-claim-label">${escapeHtml(label)} <span>(${escapeHtml(key)})</span></div>
            <div class="jwt-claim-badges">
              <span class="jwt-claim-type">${escapeHtml(getValueType(val))}</span>
              ${state}
            </div>
          </div>
          <div class="jwt-claim-value">${renderClaimValue(val, temporalState)}</div>
        </div>
      `;
    });

    analysisList.innerHTML = html || '<div class="jwt-empty">No standard claims found.</div>';
  };

  container.querySelector('#btn-verify').onclick = async () => {
    try {
      const jose = await import('https://esm.sh/jose@5.2.3');
      const keyStr = keyInput.value.trim();
      const token = input.value.trim();
      if (!keyStr) throw new Error('Key required for verification');

      let key;
      const alg = JSON.parse(headerEditor.getValue()).alg;

      if (alg.startsWith('HS')) {
        key = new TextEncoder().encode(keyStr);
      } else {
        try {
          if (keyStr.startsWith('{')) key = await jose.importJWK(JSON.parse(keyStr), alg);
          else key = await jose.importSPKI(keyStr, alg);
        } catch (e) {
          key = await jose.importX509(keyStr, alg);
        }
      }

      await jose.jwtVerify(token, key);
      setSigStatus('SIGNATURE VERIFIED', 'valid');
    } catch (e) {
      setSigStatus('INVALID SIGNATURE: ' + e.message.toUpperCase(), 'invalid');
    }
  };

  container.querySelector('#btn-sign').onclick = async () => {
    try {
      const jose = await import('https://esm.sh/jose@5.2.3');
      const keyStr = keyInput.value.trim();
      if (!keyStr) throw new Error('Secret/Private Key required to sign');

      const header = JSON.parse(headerEditor.getValue());
      const payload = JSON.parse(payloadEditor.getValue());
      const alg = header.alg;

      let key;
      if (alg.startsWith('HS')) {
        key = new TextEncoder().encode(keyStr);
      } else {
        if (keyStr.startsWith('{')) key = await jose.importJWK(JSON.parse(keyStr), alg);
        else key = await jose.importPKCS8(keyStr, alg);
      }

      const jwt = await new jose.SignJWT(payload)
        .setProtectedHeader(header)
        .sign(key);

      input.value = jwt;
      setSigStatus('TOKEN SIGNED & UPDATED', 'signed');
    } catch (e) {
      showToast('Signing error: ' + e.message, 'danger');
    }
  };

  container.querySelector('#btn-jwk-to-pem').onclick = async () => {
    const jose = await import('https://esm.sh/jose@5.2.3');
    try {
      const jwk = JSON.parse(keyInput.value);
      const key = await jose.importJWK(jwk, jwk.alg || 'RS256');
      const pem = await jose.exportSPKI(key);
      keyInput.value = pem;
    } catch (e) {
      showToast('Conversion error: ' + e.message, 'danger');
    }
  };

  container.querySelector('#btn-pem-to-jwk').onclick = async () => {
    const jose = await import('https://esm.sh/jose@5.2.3');
    try {
      const pem = keyInput.value;
      const key = await jose.importSPKI(pem, 'RS256');
      const jwk = await jose.exportJWK(key);
      keyInput.value = JSON.stringify(jwk, null, 2);
    } catch (e) {
      showToast('Conversion error: ' + e.message, 'danger');
    }
  };

  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      btn.classList.add('active');
      container.querySelector(`#tab-${btn.dataset.tab}`).classList.remove('hidden');
      if (btn.dataset.tab === 'decoded') {
        headerEditor.layout();
        payloadEditor.layout();
      }
    };
  });

  container.querySelector('#btn-copy-decoded').onclick = () => {
    try {
      const out = { header: JSON.parse(headerEditor.getValue()), payload: JSON.parse(payloadEditor.getValue()) };
      copyToClipboard(JSON.stringify(out, null, 2));
    } catch (e) {
      setSigStatus(`EXPORT ERROR: ${e.message.toUpperCase()}`, 'invalid');
    }
  };

  container.querySelector('#btn-dl-decoded').onclick = () => {
    try {
      const out = { header: JSON.parse(headerEditor.getValue()), payload: JSON.parse(payloadEditor.getValue()) };
      downloadFile(JSON.stringify(out, null, 2), 'jwt_decoded.json', 'application/json');
    } catch (e) {
      setSigStatus(`EXPORT ERROR: ${e.message.toUpperCase()}`, 'invalid');
    }
  };
}

export function unmount() {
  if (headerEditor) headerEditor.dispose();
  if (payloadEditor) payloadEditor.dispose();
  if (container) container.remove();
}

import { downloadFile, showToast } from '../ui/ui-utils.js';

let container = null;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function mount(parent) {
  container = document.createElement('div');
  container.className = 'tool-certs';
  container.innerHTML = `
    <div class="card">
      <div class="tabs cert-tabs">
        <button class="tab-btn active" data-tab="inspect">Inspector</button>
        <button class="tab-btn" data-tab="build">CSR Builder</button>
      </div>

      <div id="inspect-tab" class="tab-content">
        <div class="form-group">
          <label>Certificate / CSR (PEM)</label>
          <textarea id="cert-input" class="cert-pem-input" placeholder="-----BEGIN CERTIFICATE-----..."></textarea>
        </div>
        <button id="btn-cert-inspect" class="cert-full-button cert-inspect-button">Inspect Metadata</button>
        
        <div id="cert-results" class="hidden cert-results">
          <table class="cert-results-table">
            <tbody id="cert-details-body"></tbody>
          </table>
        </div>
      </div>

      <div id="build-tab" class="tab-content hidden">
        <div class="settings-grid">
          <div class="form-group"><label>Common Name (CN)</label><input type="text" id="csr-cn" placeholder="example.com"></div>
          <div class="form-group"><label>Organization (O)</label><input type="text" id="csr-o" placeholder="Acme Corp"></div>
          <div class="form-group"><label>Country (C)</label><input type="text" id="csr-c" placeholder="US" maxlength="2"></div>
          <div class="form-group"><label>State (ST)</label><input type="text" id="csr-st" placeholder="California"></div>
        </div>
        <button id="btn-csr-generate" class="cert-full-button cert-build-button">Generate CSR & Private Key</button>
        
        <div id="csr-results" class="hidden csr-results">
          <div class="form-group">
            <label>Generated CSR (PEM)</label>
            <textarea id="csr-out" class="csr-output" readonly></textarea>
            <button id="btn-dl-csr" class="btn-secondary cert-download-button">Download .csr</button>
          </div>
          <div class="form-group">
            <label>Associated Private Key</label>
            <textarea id="csr-key-out" class="csr-output" readonly></textarea>
            <button id="btn-dl-csr-key" class="btn-secondary cert-download-button">Download .key</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  parent.appendChild(container);
  
  const initTabs = () => {
    container.querySelectorAll('.tab-btn').forEach((button) => button.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach((entry) => entry.classList.remove('active'));
      container.querySelectorAll('.tab-content').forEach((entry) => entry.classList.add('hidden'));
      button.classList.add('active');
      container.querySelector(`#${button.dataset.tab}-tab`).classList.remove('hidden');
    }));
  };

  const inspectCert = async () => {
    const pem = container.querySelector('#cert-input').value.trim();
    if (!pem) return;
    try {
      const { default: forge } = await import('https://esm.sh/node-forge@1.3.1');
      const details = [];
      const add = (label, value) => {
        details.push(`
          <tr class="cert-detail-row">
            <td class="cert-detail-label">${escapeHtml(label)}</td>
            <td class="cert-detail-value">${escapeHtml(value)}</td>
          </tr>
        `);
      };

      if (pem.includes('CERTIFICATE REQUEST')) {
        const csr = forge.pki.certificationRequestFromPem(pem);
        add('Type', 'CSR (Signing Request)');
        add('Subject', csr.subject.attributes.map((attribute) => `${attribute.shortName}=${attribute.value}`).join(', '));
      } else {
        const cert = forge.pki.certificateFromPem(pem);
        add('Type', 'X.509 Certificate');
        add('Subject', cert.subject.attributes.map((attribute) => `${attribute.shortName}=${attribute.value}`).join(', '));
        add('Issuer', cert.issuer.attributes.map((attribute) => `${attribute.shortName}=${attribute.value}`).join(', '));
        add('Valid From', cert.validity.notBefore);
        add('Valid To', cert.validity.notAfter);
        add('Serial', cert.serialNumber);
      }
      container.querySelector('#cert-details-body').innerHTML = details.join('');
      container.querySelector('#cert-results').classList.remove('hidden');
    } catch (e) {
      showToast('Parse error: ' + e.message, 'danger');
    }
  };

  const generateCSR = async () => {
    const btn = container.querySelector('#btn-csr-generate');
    btn.disabled = true;
    btn.textContent = 'Generating RSA-2048...';
    try {
      const { default: forge } = await import('https://esm.sh/node-forge@1.3.1');
      const keys = forge.pki.rsa.generateKeyPair(2048);
      const csr = forge.pki.createCertificationRequest();
      csr.publicKey = keys.publicKey;
      csr.setSubject([
        { shortName: 'CN', value: container.querySelector('#csr-cn').value || 'localhost' },
        { shortName: 'C', value: container.querySelector('#csr-c').value || 'US' },
        { shortName: 'ST', value: container.querySelector('#csr-st').value || 'State' },
        { shortName: 'O', value: container.querySelector('#csr-o').value || 'Organization' }
      ]);
      csr.sign(keys.privateKey);
      
      container.querySelector('#csr-out').value = forge.pki.certificationRequestToPem(csr);
      container.querySelector('#csr-key-out').value = forge.pki.privateKeyToPem(keys.privateKey);
      container.querySelector('#csr-results').classList.remove('hidden');
      showToast('CSR and private key generated.', 'success');
    } catch (e) {
      showToast(e.message, 'danger');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Generate CSR & Private Key';
    }
  };

  initTabs();
  container.querySelector('#btn-cert-inspect').addEventListener('click', inspectCert);
  container.querySelector('#btn-csr-generate').addEventListener('click', generateCSR);
  container.querySelector('#btn-dl-csr').addEventListener('click', () => downloadFile(container.querySelector('#csr-out').value, 'request.csr'));
  container.querySelector('#btn-dl-csr-key').addEventListener('click', () => downloadFile(container.querySelector('#csr-key-out').value, 'private.key'));
}

export function unmount() {
  if (container) container.remove();
}

import { showToast } from '../ui/ui-utils.js';

const PUBLIC_IP_SERVICE_URL = 'https://ipapi.co/json/';

let container = null;

export async function mount(parent) {
  container = document.createElement('div');
  container.className = 'tool-ip-subnet';
  container.innerHTML = `
    <div class="card rj-layout">
      <div class="settings-grid ip-subnet-status-grid">
        <div class="form-group ip-subnet-status-card ip-subnet-status-card-public">
          <label>Your Public IP</label>
          <div id="public-ip" class="ip-subnet-primary">Not checked</div>
          <div id="geo-info" class="ip-subnet-note">Detect uses ipapi.co only after you click.</div>
          <button id="btn-detect-public-ip" class="btn-secondary ip-subnet-action">Detect Public IP</button>
        </div>
        <div class="form-group ip-subnet-status-card">
          <label>Local Network (WebRTC)</label>
          <div id="local-ip" class="ip-subnet-primary muted">Scanning...</div>
          <div class="ip-subnet-note">Browser-level introspection.</div>
        </div>
      </div>

      <div class="form-group">
        <label>Subnet Calculator (CIDR)</label>
        <div class="ip-subnet-cidr-row">
          <input type="text" id="cidr-input" class="ip-subnet-cidr-input" placeholder="e.g. 192.168.1.0/24">
          <button id="btn-calc-subnet" class="ip-subnet-cidr-button">Calculate</button>
        </div>
      </div>

      <div id="subnet-results" class="hidden">
        <div class="settings-grid ip-subnet-results-grid" id="subnet-grid"></div>
      </div>
    </div>
  `;
  
  parent.appendChild(container);

  detectLocalIP();

  container.querySelector('#btn-detect-public-ip').addEventListener('click', detectPublicIP);
  container.querySelector('#btn-calc-subnet').addEventListener('click', calculateSubnet);
}

async function detectPublicIP() {
  const ipDisp = container.querySelector('#public-ip');
  const geoDisp = container.querySelector('#geo-info');
  ipDisp.textContent = 'Detecting...';
  geoDisp.textContent = 'Contacting ipapi.co.';
  try {
    const res = await fetch(PUBLIC_IP_SERVICE_URL);
    if (res && res.ok === false) throw new Error('Public lookup failed');
    const data = await res.json();
    const place = [data.city, data.region, data.country_name].filter(Boolean).join(', ');
    ipDisp.textContent = data.ip || 'Unavailable';
    geoDisp.textContent = data.ip
      ? `${place || 'Location unavailable'}${data.org ? ` (${data.org})` : ''}`
      : 'No public IP returned.';
  } catch (e) {
    ipDisp.textContent = 'Public lookup failed';
    geoDisp.textContent = 'Check your connection or blocker.';
  }
}

function detectLocalIP() {
  const localDisp = container.querySelector('#local-ip');
  const browserWindow = typeof window !== 'undefined' ? window : null;
  const PeerConnection = globalThis.RTCPeerConnection || browserWindow?.RTCPeerConnection || browserWindow?.webkitRTCPeerConnection;
  if (!PeerConnection) {
    localDisp.textContent = 'Unavailable';
    localDisp.classList.add('muted');
    return;
  }
  const pc = new PeerConnection({ iceServers: [] });
  let settled = false;
  const settle = (text, success = false) => {
    if (settled) return;
    settled = true;
    localDisp.textContent = text;
    localDisp.classList.toggle('success', success);
    localDisp.classList.toggle('muted', !success);
    pc.close?.();
  };
  pc.createDataChannel('');
  pc.createOffer().then(offer => pc.setLocalDescription(offer)).catch(() => {
    settle('Blocked by Browser');
  });
  pc.onicecandidate = (ice) => {
    if (!ice || !ice.candidate || !ice.candidate.candidate) return;
    const match = ice.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
    if (match) {
      settle(match[1], true);
      pc.onicecandidate = null;
    }
  };
  setTimeout(() => {
    settle('Blocked by Browser');
  }, 3000);
}

function calculateSubnet() {
  const input = container.querySelector('#cidr-input').value.trim();
  const results = container.querySelector('#subnet-results');
  const grid = container.querySelector('#subnet-grid');
  
  try {
    const [ip, mask] = input.split('/');
    if (!ip || !mask) throw new Error('Invalid CIDR format');
    
    const bits = parseInt(mask);
    const hostBits = 32 - bits;
    const totalHosts = Math.pow(2, hostBits);
    const usableHosts = bits >= 31 ? totalHosts : totalHosts - 2;
    
    const maskStr = bitsToMask(bits);
    
    grid.innerHTML = `
      <div class="form-group"><label>Netmask</label><div>${maskStr}</div></div>
      <div class="form-group"><label>Wildcard</label><div>${bitsToMask(bits, true)}</div></div>
      <div class="form-group"><label>Total Hosts</label><div>${totalHosts.toLocaleString()}</div></div>
      <div class="form-group"><label>Usable Range</label><div>${usableHosts.toLocaleString()}</div></div>
    `;
    results.classList.remove('hidden');
  } catch (e) {
    showToast(e.message, 'danger');
  }
}

function bitsToMask(bits, wildcard = false) {
  let mask = [];
  for (let i = 0; i < 4; i++) {
    let n = 0;
    for (let j = 0; j < 8; j++) {
      if (bits > 0) { n += Math.pow(2, 7 - j); bits--; }
    }
    mask.push(wildcard ? 255 - n : n);
  }
  return mask.join('.');
}

export function unmount() {
  if (container) container.remove();
}

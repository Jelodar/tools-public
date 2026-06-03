import { copyToClipboard, downloadFile } from '../ui/ui-utils.js';

let container = null;

const chmodRoles = ['Owner', 'Group', 'Public'];
const chmodModes = [
  { value: 4, label: 'Read (4)' },
  { value: 2, label: 'Write (2)' },
  { value: 1, label: 'Execute (1)' },
];

function renderChmodRole(role) {
  const key = role.toLowerCase();

  return `
    <div class="form-group">
      <label>${role}</label>
      <div class="devops-toggle-stack">
        ${chmodModes.map((mode) => `
          <div class="devops-toggle-row">
            <label class="rj-switch">
              <input type="checkbox" class="chmod-cb" data-role="${key}" data-val="${mode.value}" id="chmod-${key}-${mode.value}">
              <span class="slider-switch"></span>
            </label>
            <label for="chmod-${key}-${mode.value}" class="devops-toggle-label">${mode.label}</label>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export async function mount(parent) {
  container = document.createElement('div');
  container.className = 'tool-devops-kit';
  container.innerHTML = `
    <div class="card">
      <div class="tabs devops-tabs">
        <button class="tab-btn active" data-tab="chmod">CHMOD</button>
        <button class="tab-btn" data-tab="cron">Crontab</button>
        <button class="tab-btn" data-tab="docker">Dockerfile</button>
        <button class="tab-btn" data-tab="nginx">Nginx Config</button>
      </div>

      <div id="chmod-tab" class="tab-content">
        <div class="devops-permission-grid">
          ${chmodRoles.map(renderChmodRole).join('')}
        </div>
        <div class="devops-chmod-output">
          <div id="chmod-octal" class="devops-chmod-octal">000</div>
          <div id="chmod-human" class="devops-chmod-human">---------</div>
        </div>
      </div>

      <div id="cron-tab" class="tab-content hidden">
        <div class="settings-grid">
          <div class="form-group">
            <label>Common Presets</label>
            <select id="cron-preset">
              <option value="* * * * *">Every Minute</option>
              <option value="0 * * * *">Every Hour</option>
              <option value="0 0 * * *">Daily at Midnight</option>
              <option value="0 0 * * 0">Weekly (Sunday)</option>
              <option value="0 0 1 * *">Monthly (1st)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Command to Run</label>
            <input type="text" id="cron-cmd" value="/usr/bin/php /var/www/artisan schedule:run">
          </div>
        </div>
        <div class="form-group devops-form-section">
          <label>Generated Cron Line</label>
          <div id="cron-out" class="devops-output-line"></div>
          <button id="btn-copy-cron" class="devops-action-button">Copy Cron Line</button>
        </div>
      </div>

      <div id="docker-tab" class="tab-content hidden">
        <div class="settings-grid">
          <div class="form-group">
            <label>Base Image</label>
            <select id="docker-base">
              <option value="node:20-alpine">Node.js 20 (Alpine)</option>
              <option value="python:3.11-slim">Python 3.11 (Slim)</option>
              <option value="nginx:alpine">Nginx (Alpine)</option>
              <option value="golang:1.21-alpine">Go 1.21 (Alpine)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Workdir</label>
            <input type="text" id="docker-workdir" value="/app">
          </div>
        </div>
        <div class="form-group devops-form-section">
          <label>Dockerfile Preview</label>
          <textarea id="docker-out" readonly class="devops-code-textarea"></textarea>
          <button id="btn-dl-docker" class="devops-action-button">Download Dockerfile</button>
        </div>
      </div>

      <div id="nginx-tab" class="tab-content hidden">
        <div class="settings-grid">
          <div class="form-group">
            <label>Domain Name</label>
            <input type="text" id="nginx-domain" value="example.com">
          </div>
          <div class="form-group">
            <label>Proxy Port (Internal)</label>
            <input type="number" id="nginx-port" value="3000">
          </div>
        </div>
        <div class="form-group devops-form-section">
          <label>Site Config</label>
          <textarea id="nginx-out" readonly class="devops-code-textarea"></textarea>
          <button id="btn-copy-nginx" class="devops-action-button">Copy Configuration</button>
        </div>
      </div>
    </div>
  `;
  
  parent.appendChild(container);
  initTabs();
  initChmod();
  initCron();
  initDocker();
  initNginx();
}

function initTabs() {
  const btns = container.querySelectorAll('.tab-btn');
  const contents = container.querySelectorAll('.tab-content');

  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      btns.forEach((item) => item.classList.remove('active'));
      contents.forEach((content) => content.classList.add('hidden'));
      btn.classList.add('active');
      container.querySelector(`#${btn.dataset.tab}-tab`).classList.remove('hidden');
    });
  });
}

function initChmod() {
  const cbs = container.querySelectorAll('.chmod-cb');
  const octalOut = container.querySelector('#chmod-octal');
  const humanOut = container.querySelector('#chmod-human');

  const update = () => {
    const roles = { owner: 0, group: 0, public: 0 };
    let human = '';

    ['owner', 'group', 'public'].forEach((role) => {
      let sum = 0;
      let r = '-';
      let w = '-';
      let x = '-';

      container.querySelectorAll(`.chmod-cb[data-role="${role}"]`).forEach((cb) => {
        if (cb.checked) {
          const val = Number.parseInt(cb.dataset.val, 10);
          sum += val;

          if (val === 4) {
            r = 'r';
          }

          if (val === 2) {
            w = 'w';
          }

          if (val === 1) {
            x = 'x';
          }
        }
      });

      roles[role] = sum;
      human += r + w + x;
    });

    octalOut.textContent = `${roles.owner}${roles.group}${roles.public}`;
    humanOut.textContent = human;
  };

  cbs.forEach((cb) => cb.addEventListener('change', update));
}

function initCron() {
  const preset = container.querySelector('#cron-preset');
  const cmd = container.querySelector('#cron-cmd');
  const out = container.querySelector('#cron-out');
  const update = () => {
    out.textContent = `${preset.value} ${cmd.value}`;
  };

  [preset, cmd].forEach((el) => el.addEventListener('input', update));
  update();
  container.querySelector('#btn-copy-cron').addEventListener('click', () => {
    copyToClipboard(out.textContent);
  });
}

function initDocker() {
  const base = container.querySelector('#docker-base');
  const workdir = container.querySelector('#docker-workdir');
  const out = container.querySelector('#docker-out');
  const update = () => {
    out.value = `FROM ${base.value}\n\nWORKDIR ${workdir.value}\n\nCOPY package*.json ./\nRUN npm install\n\nCOPY . .\n\nEXPOSE 3000\nCMD ["npm", "start"]`;
  };

  [base, workdir].forEach((el) => el.addEventListener('input', update));
  update();
  container.querySelector('#btn-dl-docker').addEventListener('click', () => {
    downloadFile(out.value, 'Dockerfile');
  });
}

function initNginx() {
  const domain = container.querySelector('#nginx-domain');
  const port = container.querySelector('#nginx-port');
  const out = container.querySelector('#nginx-out');
  const update = () => {
    out.value = `server {\n  listen 80;\n  server_name ${domain.value};\n\n  location / {\n    proxy_pass http://localhost:${port.value};\n    proxy_http_version 1.1;\n    proxy_set_header Upgrade $http_upgrade;\n    proxy_set_header Connection 'upgrade';\n    proxy_set_header Host $host;\n    proxy_cache_bypass $http_upgrade;\n  }\n}`;
  };

  [domain, port].forEach((el) => el.addEventListener('input', update));
  update();
  container.querySelector('#btn-copy-nginx').addEventListener('click', () => {
    copyToClipboard(out.value);
  });
}

export function unmount() {
  if (container) {
    container.remove();
  }

  container = null;
}

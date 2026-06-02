import{c as b,d as m}from"./ui-utils-CG6aKAAj.js";let e=null;const h=["Owner","Group","Public"],g=[{value:4,label:"Read (4)"},{value:2,label:"Write (2)"},{value:1,label:"Execute (1)"}];function y(o){const n=o.toLowerCase();return`
    <div class="form-group">
      <label>${o}</label>
      <div class="devops-toggle-stack">
        ${g.map(t=>`
          <div class="devops-toggle-row">
            <label class="rj-switch">
              <input type="checkbox" class="chmod-cb" data-role="${n}" data-val="${t.value}" id="chmod-${n}-${t.value}">
              <span class="slider-switch"></span>
            </label>
            <label for="chmod-${n}-${t.value}" class="devops-toggle-label">${t.label}</label>
          </div>
        `).join("")}
      </div>
    </div>
  `}async function S(o){e=document.createElement("div"),e.className="tool-devops-kit",e.innerHTML=`
    <div class="card">
      <div class="tabs devops-tabs">
        <button class="tab-btn active" data-tab="chmod">CHMOD</button>
        <button class="tab-btn" data-tab="cron">Crontab</button>
        <button class="tab-btn" data-tab="docker">Dockerfile</button>
        <button class="tab-btn" data-tab="nginx">Nginx Config</button>
      </div>

      <div id="chmod-tab" class="tab-content">
        <div class="devops-permission-grid">
          ${h.map(y).join("")}
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
  `,o.appendChild(e),f(),x(),k(),C(),$()}function f(){const o=e.querySelectorAll(".tab-btn"),n=e.querySelectorAll(".tab-content");o.forEach(t=>{t.addEventListener("click",()=>{o.forEach(a=>a.classList.remove("active")),n.forEach(a=>a.classList.add("hidden")),t.classList.add("active"),e.querySelector(`#${t.dataset.tab}-tab`).classList.remove("hidden")})})}function x(){const o=e.querySelectorAll(".chmod-cb"),n=e.querySelector("#chmod-octal"),t=e.querySelector("#chmod-human"),a=()=>{const i={owner:0,group:0,public:0};let c="";["owner","group","public"].forEach(s=>{let d=0,r="-",u="-",p="-";e.querySelectorAll(`.chmod-cb[data-role="${s}"]`).forEach(v=>{if(v.checked){const l=Number.parseInt(v.dataset.val,10);d+=l,l===4&&(r="r"),l===2&&(u="w"),l===1&&(p="x")}}),i[s]=d,c+=r+u+p}),n.textContent=`${i.owner}${i.group}${i.public}`,t.textContent=c};o.forEach(i=>i.addEventListener("change",a))}function k(){const o=e.querySelector("#cron-preset"),n=e.querySelector("#cron-cmd"),t=e.querySelector("#cron-out"),a=()=>{t.textContent=`${o.value} ${n.value}`};[o,n].forEach(i=>i.addEventListener("input",a)),a(),e.querySelector("#btn-copy-cron").addEventListener("click",()=>{b(t.textContent)})}function C(){const o=e.querySelector("#docker-base"),n=e.querySelector("#docker-workdir"),t=e.querySelector("#docker-out"),a=()=>{t.value=`FROM ${o.value}

WORKDIR ${n.value}

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "start"]`};[o,n].forEach(i=>i.addEventListener("input",a)),a(),e.querySelector("#btn-dl-docker").addEventListener("click",()=>{m(t.value,"Dockerfile")})}function $(){const o=e.querySelector("#nginx-domain"),n=e.querySelector("#nginx-port"),t=e.querySelector("#nginx-out"),a=()=>{t.value=`server {
  listen 80;
  server_name ${o.value};

  location / {
    proxy_pass http://localhost:${n.value};
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}`};[o,n].forEach(i=>i.addEventListener("input",a)),a(),e.querySelector("#btn-copy-nginx").addEventListener("click",()=>{b(t.value)})}function q(){e&&e.remove(),e=null}export{S as mount,q as unmount};

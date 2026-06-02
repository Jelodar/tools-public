import{s as p}from"./ui-utils-CG6aKAAj.js";const b="https://ipapi.co/json/";let n=null;async function C(e){n=document.createElement("div"),n.className="tool-ip-subnet",n.innerHTML=`
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
  `,e.appendChild(n),f(),n.querySelector("#btn-detect-public-ip").addEventListener("click",v),n.querySelector("#btn-calc-subnet").addEventListener("click",g)}async function v(){const e=n.querySelector("#public-ip"),i=n.querySelector("#geo-info");e.textContent="Detecting...",i.textContent="Contacting ipapi.co.";try{const o=await fetch(b);if(o&&o.ok===!1)throw new Error("Public lookup failed");const t=await o.json(),c=[t.city,t.region,t.country_name].filter(Boolean).join(", ");e.textContent=t.ip||"Unavailable",i.textContent=t.ip?`${c||"Location unavailable"}${t.org?` (${t.org})`:""}`:"No public IP returned."}catch{e.textContent="Public lookup failed",i.textContent="Check your connection or blocker."}}function f(){const e=n.querySelector("#local-ip"),i=typeof window<"u"?window:null,o=globalThis.RTCPeerConnection||(i==null?void 0:i.RTCPeerConnection)||(i==null?void 0:i.webkitRTCPeerConnection);if(!o){e.textContent="Unavailable",e.classList.add("muted");return}const t=new o({iceServers:[]});let c=!1;const s=(a,l=!1)=>{var r;c||(c=!0,e.textContent=a,e.classList.toggle("success",l),e.classList.toggle("muted",!l),(r=t.close)==null||r.call(t))};t.createDataChannel(""),t.createOffer().then(a=>t.setLocalDescription(a)).catch(()=>{s("Blocked by Browser")}),t.onicecandidate=a=>{if(!a||!a.candidate||!a.candidate.candidate)return;const l=a.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);l&&(s(l[1],!0),t.onicecandidate=null)},setTimeout(()=>{s("Blocked by Browser")},3e3)}function g(){const e=n.querySelector("#cidr-input").value.trim(),i=n.querySelector("#subnet-results"),o=n.querySelector("#subnet-grid");try{const[t,c]=e.split("/");if(!t||!c)throw new Error("Invalid CIDR format");const s=parseInt(c),a=32-s,l=Math.pow(2,a),r=s>=31?l:l-2,u=d(s);o.innerHTML=`
      <div class="form-group"><label>Netmask</label><div>${u}</div></div>
      <div class="form-group"><label>Wildcard</label><div>${d(s,!0)}</div></div>
      <div class="form-group"><label>Total Hosts</label><div>${l.toLocaleString()}</div></div>
      <div class="form-group"><label>Usable Range</label><div>${r.toLocaleString()}</div></div>
    `,i.classList.remove("hidden")}catch(t){p(t.message,"danger")}}function d(e,i=!1){let o=[];for(let t=0;t<4;t++){let c=0;for(let s=0;s<8;s++)e>0&&(c+=Math.pow(2,7-s),e--);o.push(i?255-c:c)}return o.join(".")}function y(){n&&n.remove()}export{C as mount,y as unmount};

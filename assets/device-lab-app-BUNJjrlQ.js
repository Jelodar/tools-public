import{c as K,T as V}from"./index-CoRJqXFF.js";import{d as Y,s as z}from"./ui-utils-CG6aKAAj.js";import{c as X}from"./studio-shell-DviRgtfh.js";const N=[{id:"media",label:"Media"},{id:"graphics",label:"Graphics"},{id:"realtime",label:"Realtime"},{id:"storage",label:"Storage"},{id:"permissions",label:"Permissions"},{id:"input",label:"Input"}];function y(t){return N.find(e=>e.id===t)||N[0]}function G(t){const e=Number(t)||0;return e>=1024*1024*1024?`${(e/(1024*1024*1024)).toFixed(1)} GB`:e>=1024*1024?`${(e/(1024*1024)).toFixed(1)} MB`:e>=1024?`${(e/1024).toFixed(1)} KB`:`${Math.round(e)} B`}function _(t={}){return!t||!t.quota&&!t.usage?"Unknown":`${G(t.usage)} of ${G(t.quota)}`}function s(t){return typeof t=="function"}function m(t){return t!=null}function a(t,e,i,r=""){return{key:t,label:e,value:i?r||"Available":"Not detected",supported:!!i}}function g(t,e){try{return m(t==null?void 0:t[e])}catch{return!1}}function q(t,e){var i,r;try{const d=(i=t==null?void 0:t.createElement)==null?void 0:i.call(t,"canvas");return!!((r=d==null?void 0:d.getContext)!=null&&r.call(d,e))}catch{return!1}}async function J(t){var e,i;try{return await((i=(e=t==null?void 0:t.storage)==null?void 0:e.estimate)==null?void 0:i.call(e))}catch{return null}}async function Z(t){var e,i;try{const r=await((i=(e=t==null?void 0:t.storage)==null?void 0:e.persisted)==null?void 0:i.call(e));return r===!0?"Persisted":r===!1?"Best effort":""}catch{return""}}async function Q(t){var e,i;try{return await((i=(e=t==null?void 0:t.gpu)==null?void 0:e.requestAdapter)==null?void 0:i.call(e))}catch{return null}}async function R(t,e){var i,r;try{const d=await((r=(i=t==null?void 0:t.permissions)==null?void 0:i.query)==null?void 0:r.call(i,{name:e}));return(d==null?void 0:d.state)||""}catch{return""}}function ee(t){var e;try{return Array.from(((e=t==null?void 0:t.getGamepads)==null?void 0:e.call(t))||[]).filter(Boolean)}catch{return[]}}async function F(t={}){var f,S,D,P,v,C,T,A,E;const e=t.navigator||globalThis.navigator||{},i=t.window||globalThis,r=t.document||globalThis.document,d=await J(e),x=await Z(e),o=await Q(e),c=Object.fromEntries(await Promise.all(["camera","microphone","geolocation","notifications","clipboard-read","clipboard-write"].map(async b=>[b,await R(e,b)]))),u=ee(e),w=((S=(f=i.matchMedia)==null?void 0:f.call(i,"(pointer: coarse)"))==null?void 0:S.matches)===!0;return[{...y("media"),items:[a("microphone","Microphone Capture",s((D=e.mediaDevices)==null?void 0:D.getUserMedia)),a("display-capture","Display Capture",s((P=e.mediaDevices)==null?void 0:P.getDisplayMedia)),a("device-list","Device Enumeration",s((v=e.mediaDevices)==null?void 0:v.enumerateDevices)),a("media-recorder","Media Recorder",s(i.MediaRecorder)),a("audio-context","Audio Context",s(i.AudioContext)||s(i.webkitAudioContext)),a("audio-worklet","Audio Worklet",s(i.AudioWorkletNode)),a("media-source","Media Source",s(i.MediaSource)),a("webcodecs","WebCodecs",s(i.VideoEncoder)||s(i.AudioEncoder))]},{...y("graphics"),items:[a("webgpu","WebGPU",m(e.gpu)),a("webgpu-adapter","WebGPU Adapter",!!o,o?"Adapter available":""),a("webgl2","WebGL 2",q(r,"webgl2")),a("webgl","WebGL",q(r,"webgl")||q(r,"experimental-webgl")),a("offscreen-canvas","Offscreen Canvas",s(i.OffscreenCanvas))]},{...y("realtime"),items:[a("webrtc","WebRTC",s(i.RTCPeerConnection)),a("webrtc-peer","WebRTC Peer",s(i.RTCPeerConnection)),a("webrtc-data","RTC Data Channel",s(i.RTCDataChannel)),a("webrtc-stats","WebRTC Stats",s((T=(C=i.RTCPeerConnection)==null?void 0:C.prototype)==null?void 0:T.getStats)),a("websocket","WebSocket",s(i.WebSocket)),a("webtransport","WebTransport",s(i.WebTransport)),a("broadcast-channel","Broadcast Channel",s(i.BroadcastChannel))]},{...y("storage"),items:[a("indexeddb","IndexedDB",g(i,"indexedDB")||g(globalThis,"indexedDB")),a("cache-storage","Cache Storage",g(i,"caches")||g(globalThis,"caches")),a("opfs","Origin Private File System",s((A=e.storage)==null?void 0:A.getDirectory)),a("service-worker","Service Worker",m(e.serviceWorker)),a("local-storage","Local Storage",g(i,"localStorage")),a("session-storage","Session Storage",g(i,"sessionStorage")),a("quota","Quota Estimate",!!d,d?_(d):""),a("persistence","Persistence",!!x,x)]},{...y("permissions"),items:[a("permissions-api","Permissions API",s((E=e.permissions)==null?void 0:E.query)),a("permission-camera","Camera Permission",!!c.camera,c.camera),a("permission-microphone","Microphone Permission",!!c.microphone,c.microphone),a("permission-clipboard-read","Clipboard Read Permission",!!c["clipboard-read"],c["clipboard-read"]),a("notifications","Notifications",m(i.Notification)),a("clipboard","Clipboard",m(e.clipboard)),a("geolocation","Geolocation",m(e.geolocation))]},{...y("input"),items:[a("touch","Touch",Number(e.maxTouchPoints)>0,Number(e.maxTouchPoints)>0?`${e.maxTouchPoints} points`:""),a("coarse-pointer","Coarse Pointer",w),a("pointer","Pointer Events",s(i.PointerEvent)),a("gamepad","Gamepad",s(e.getGamepads)),a("gamepad-connected","Connected Gamepads",u.length>0,u.length?`${u.length} connected`:""),a("gamepad-haptics","Gamepad Haptics",u.some(b=>m(b.vibrationActuator))),a("vibration","Vibration",s(e.vibrate))]}]}let $=null;const te=[{color:"#ff3b30",className:"device-swatch-red"},{color:"#ffd60a",className:"device-swatch-yellow"},{color:"#34c759",className:"device-swatch-green"},{color:"#0a84ff",className:"device-swatch-blue"},{color:"#ffffff",className:"device-swatch-white"},{color:"#000000",className:"device-swatch-black"}];function ie(t){return V.find(e=>e.id===t)}function k(t){return String(t).replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function O(){return navigator.getBattery?navigator.getBattery().then(t=>`${Math.round(t.level*100)}% (${t.charging?"Charging":"Discharging"})`).catch(()=>"Not supported"):Promise.resolve("Not supported")}function U(t){return{system:[{label:"Platform",value:navigator.platform||"Unknown"},{label:"Cores",value:navigator.hardwareConcurrency||"Unknown"},{label:"Memory",value:navigator.deviceMemory?`~${navigator.deviceMemory} GB`:"Unknown"},{label:"Battery",value:t}],browser:[{label:"Language",value:navigator.language||"Unknown"},{label:"Online",value:navigator.onLine?"Yes":"No"},{label:"Cookies",value:navigator.cookieEnabled?"Enabled":"Disabled"},{label:"Timezone",value:Intl.DateTimeFormat().resolvedOptions().timeZone||"Unknown"}],display:[{label:"Resolution",value:`${window.screen.width}x${window.screen.height}`},{label:"Viewport",value:`${window.innerWidth}x${window.innerHeight}`},{label:"Pixel Ratio",value:`${window.devicePixelRatio}`},{label:"Color Depth",value:`${window.screen.colorDepth}-bit`}]}}function ae(t){return t.map(e=>`
    <div class="device-capability-group">
      <h4>${k(e.label)}</h4>
      <div class="device-capability-list">
        ${e.items.map(i=>`
          <div class="device-capability-item${i.supported?" is-available":""}">
            <span>${k(i.label)}</span>
            <code>${k(i.value)}</code>
          </div>
        `).join("")}
      </div>
    </div>
  `).join("")}function oe(t){return Object.entries(t).map(([e,i])=>`
    <div class="studio-panel">
      <div class="studio-panel-head">
        <h3>${e[0].toUpperCase()}${e.slice(1)}</h3>
      </div>
      <div class="studio-list">
        ${i.map(r=>`
          <div class="studio-list-item">
            <span>${k(r.label)}</span>
            <code>${k(r.value)}</code>
          </div>
        `).join("")}
      </div>
    </div>
  `).join("")}function ne(t){return`
    <div class="studio-stack">
      <section class="card studio-card">
        <div class="tabs-header">
          ${[["environment","Environment"],["input","Input"],["display","Display"]].map(([e,i])=>`
            <button class="tab-btn${e===t?" active":""}" data-device-tab="${e}">${i}</button>
          `).join("")}
        </div>

        <section class="device-view${t==="environment"?"":" hidden"}" data-view="environment">
          <div class="studio-toolbar">
            <div class="studio-toolbar-group">
              <div class="studio-field">
                <span>Snapshot</span>
                <strong id="device-captured-at">${new Date().toLocaleTimeString()}</strong>
              </div>
            </div>
            <div class="studio-toolbar-group studio-toolbar-actions">
              <button id="device-refresh">Refresh</button>
              <button id="device-export" class="btn-secondary">Export JSON</button>
            </div>
          </div>
          <div id="device-environment-grid" class="studio-panel-grid studio-panel-grid-dual"></div>
          <div class="studio-panel">
            <div class="studio-panel-head">
              <h3>Capability Surfaces</h3>
            </div>
            <div id="device-capability-grid" class="device-capability-grid"></div>
          </div>
          <div class="studio-panel">
            <div class="studio-panel-head">
              <h3>User Agent</h3>
            </div>
            <div class="studio-output-card">
              <code id="device-user-agent"></code>
            </div>
          </div>
        </section>

        <section class="device-view${t==="input"?"":" hidden"}" data-view="input">
          <div class="studio-panel-grid studio-panel-grid-dual">
            <div class="studio-panel">
              <div class="studio-panel-head">
                <h3>Keyboard</h3>
              </div>
              <div class="studio-output-card">
                <span>Last Key</span>
                <strong id="device-key-display">Press a key</strong>
                <code id="device-key-details">Focus this page and press any key.</code>
              </div>
            </div>
            <div class="studio-panel">
              <div class="studio-panel-head">
                <h3>Pointer</h3>
              </div>
              <div id="device-pointer-zone" class="studio-empty device-pointer-zone">
                Move or click here
                <div id="device-pointer-dot" class="device-pointer-dot"></div>
              </div>
              <div class="studio-output-card">
                <span>Pointer State</span>
                <code id="device-pointer-details">Waiting for pointer input.</code>
              </div>
              <div class="studio-output-card">
                <span>Wheel</span>
                <code id="device-wheel-details">Scroll over the pointer zone.</code>
              </div>
            </div>
          </div>
        </section>

        <section class="device-view${t==="display"?"":" hidden"}" data-view="display">
          <div class="studio-panel">
            <div class="studio-panel-head">
              <h3>Color Patterns</h3>
            </div>
            <div class="studio-result-grid">
              ${te.map(({color:e,className:i})=>`
                <button class="device-color-swatch ${i}" data-color="${e}"></button>
              `).join("")}
            </div>
          </div>
          <div class="studio-panel-grid studio-panel-grid-dual">
            <div class="studio-output-card">
              <span>Fullscreen</span>
              <code>Click any swatch to enter fullscreen. Click again or press escape to exit.</code>
            </div>
            <div class="studio-output-card">
              <span>Current Panel</span>
              <code id="device-display-details">No active test pattern.</code>
            </div>
          </div>
          <div id="device-fullscreen-test" class="hidden device-fullscreen-test"></div>
        </section>
      </section>
    </div>
  `}async function de(t,e){const i=ie(e),r=K(e),d={"input-tester":"input","display-tester":"display"}[e]||"environment",x=await O(),o=X(t,{className:"device-lab-shell",eyebrow:r.title,title:i.title,description:{"input-tester":"Keyboard, pointer, and wheel diagnostics now live beside environment and display checks.","display-tester":"Display test patterns now live inside Device Lab with compatibility routing preserved."}[e]||"Inspect environment signals, test input handling, and run fullscreen display checks from one workspace.",toolIds:r.toolIds,activeToolId:e,metrics:[{key:"platform",label:"Platform",value:navigator.platform||"Unknown"},{key:"viewport",label:"Viewport",value:`${window.innerWidth}x${window.innerHeight}`}]});o.content.innerHTML=ne(d);const c=[];let u=U(x),w=await F();const f=()=>{o.content.querySelector("#device-captured-at").textContent=new Date().toLocaleTimeString(),o.content.querySelector("#device-environment-grid").innerHTML=oe(u),o.content.querySelector("#device-capability-grid").innerHTML=ae(w),o.content.querySelector("#device-user-agent").textContent=navigator.userAgent},S=n=>{o.content.querySelectorAll("[data-device-tab]").forEach(p=>{p.classList.toggle("active",p.dataset.deviceTab===n)}),o.content.querySelectorAll(".device-view").forEach(p=>{p.classList.toggle("hidden",p.dataset.view!==n)})},D=async()=>{u=U(await O()),w=await F(),o.setMetric("viewport",`${window.innerWidth}x${window.innerHeight}`),f(),o.setStatus("Environment snapshot refreshed.","success")},P=()=>{Y(JSON.stringify({capturedAt:new Date().toISOString(),environment:u,capabilities:w,userAgent:navigator.userAgent},null,2),"device-lab-report.json","application/json"),z("Device report exported.","success"),o.setStatus("Device report exported.","success")},v=o.content.querySelector("#device-pointer-zone"),C=o.content.querySelector("#device-pointer-dot"),T=o.content.querySelector("#device-pointer-details"),A=o.content.querySelector("#device-wheel-details"),E=o.content.querySelector("#device-key-display"),b=o.content.querySelector("#device-key-details"),h=o.content.querySelector("#device-fullscreen-test"),B=o.content.querySelector("#device-display-details"),j=n=>{E.textContent=n.key===" "?"Space":n.key,b.textContent=`Code ${n.code} | Ctrl ${n.ctrlKey} | Shift ${n.shiftKey} | Alt ${n.altKey} | Meta ${n.metaKey}`},M=n=>{const p=v.getBoundingClientRect(),L=Math.round(n.clientX-p.left),W=Math.round(n.clientY-p.top);C.style.left=`${L}px`,C.style.top=`${W}px`,T.textContent=`X ${L} | Y ${W} | Buttons ${n.buttons} | Pointer ${n.pointerType||"mouse"}`},I=n=>{A.textContent=`deltaX ${Math.round(n.deltaX)} | deltaY ${Math.round(n.deltaY)} | mode ${n.deltaMode}`},H=()=>{document.fullscreenElement||(h.classList.add("hidden"),B.textContent="No active test pattern.")};c.push(...Array.from(o.content.querySelectorAll("[data-device-tab]")).map(n=>l(n,"click",()=>S(n.dataset.deviceTab)))),c.push(l(o.content.querySelector("#device-refresh"),"click",D)),c.push(l(o.content.querySelector("#device-export"),"click",P)),c.push(l(window,"keydown",j)),c.push(l(v,"pointermove",M)),c.push(l(v,"pointerdown",M)),c.push(l(v,"wheel",I)),c.push(l(document,"fullscreenchange",H)),c.push(...Array.from(o.content.querySelectorAll(".device-color-swatch")).map(n=>l(n,"click",async()=>{if(h.style.background=n.dataset.color,h.classList.remove("hidden"),B.textContent=`Active pattern ${n.dataset.color}`,h.requestFullscreen)try{await h.requestFullscreen()}catch{o.setStatus("Fullscreen request was blocked.","danger")}}))),c.push(l(h,"click",async()=>{if(h.classList.add("hidden"),B.textContent="No active test pattern.",document.fullscreenElement)try{await document.exitFullscreen()}catch{}})),f(),S(d),$={root:o.root,cleanup:c}}function le(){var t;if($){for(const e of $.cleanup)e();(t=$.root)==null||t.remove(),$=null}}function l(t,e,i){return t?(t.addEventListener(e,i),()=>t.removeEventListener(e,i)):()=>{}}export{de as m,le as u};

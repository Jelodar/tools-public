import{c as k,T as q}from"./index-CsqYO7gG.js";import{c as f,d as E}from"./ui-utils-CG6aKAAj.js";import{c as T}from"./studio-shell-DFrEv7MT.js";function A(n,o){const t=String(n??"");switch(o){case"b64-enc":return B(new TextEncoder().encode(t));case"b64-dec":return new TextDecoder().decode(H(t.trim()));case"url-enc":return encodeURIComponent(t);case"url-dec":return decodeURIComponent(t.trim());case"html-enc":return t.replace(/[\u00A0-\u9999<>&"'`]/g,r=>`&#${r.charCodeAt(0)};`);case"html-dec":return $(t);case"hex-enc":return Array.from(new TextEncoder().encode(t)).map(r=>r.toString(16).padStart(2,"0")).join(" ");case"bin-enc":return Array.from(new TextEncoder().encode(t)).map(r=>r.toString(2).padStart(8,"0")).join(" ");default:throw new Error("Unsupported encoding operation")}}function L(n,o){const t=String(n??""),r=R(t);switch(o){case"lower":return t.toLowerCase();case"upper":return t.toUpperCase();case"camel":return r.map((c,e)=>e===0?c:x(c)).join("");case"pascal":return r.map(c=>x(c)).join("");case"snake":return r.join("_");case"kebab":return r.join("-");case"title":return r.map(c=>x(c)).join(" ");default:throw new Error("Unsupported case mode")}}function U(n){const o=String(n??"").trim();if(!o)throw new Error("Enter a URL");const t=new URL(o);return{href:t.href,protocol:t.protocol,origin:t.origin,hostname:t.hostname,host:t.host,pathname:t.pathname,search:t.search,hash:t.hash,params:Array.from(t.searchParams.entries()).map(([r,c])=>({key:r,value:c}))}}function R(n){var o;return((o=String(n??"").replace(/([a-z0-9])([A-Z])/g,"$1 $2").match(/[A-Z]{2,}(?=[A-Z][a-z]|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]+|[0-9]+/g))==null?void 0:o.map(t=>t.toLowerCase()))||[]}function x(n){return n?n[0].toUpperCase()+n.slice(1):""}function $(n){return String(n??"").replace(/&#(\d+);/g,(o,t)=>String.fromCharCode(Number(t))).replace(/&#x([0-9a-f]+);/gi,(o,t)=>String.fromCharCode(parseInt(t,16))).replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g," ")}function B(n){if(typeof Buffer<"u")return Buffer.from(n).toString("base64");let o="";for(const t of n)o+=String.fromCharCode(t);return btoa(o)}function H(n){const o=String(n??"").replace(/\s+/g,"");if(!o||o.length%4===1||/[^A-Za-z0-9+/=]/.test(o))throw new Error("Invalid Base64 sequence");if(typeof Buffer<"u")return Uint8Array.from(Buffer.from(o,"base64"));const t=atob(o),r=new Uint8Array(t.length);for(let c=0;c<t.length;c+=1)r[c]=t.charCodeAt(c);return r}let l=null;function P(n){return q.find(o=>o.id===n)}function S(n){return String(n).replace(/[&<>"']/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[o])}function j(n){return`
    <div class="studio-stack">
      <section class="card studio-card">
        <div class="tabs-header">
          ${[["encode","Encoders"],["case","Case"],["url","URL"]].map(([o,t])=>`
            <button class="tab-btn${o===n?" active":""}" data-text-tab="${o}">${t}</button>
          `).join("")}
        </div>

        <section class="text-view${n==="encode"?"":" hidden"}" data-view="encode">
          <div class="studio-panel-grid studio-panel-grid-dual">
            <div class="studio-panel">
              <div class="studio-panel-head"><h3>Source</h3></div>
              <textarea id="text-encode-input" class="text-workbench-textarea" placeholder="Enter text to encode or decode."></textarea>
              <div class="studio-actions">
                <button data-encode-op="b64-enc">Base64 Encode</button>
                <button data-encode-op="b64-dec" class="btn-secondary">Base64 Decode</button>
                <button data-encode-op="url-enc">URL Encode</button>
                <button data-encode-op="url-dec" class="btn-secondary">URL Decode</button>
                <button data-encode-op="html-enc">HTML Escape</button>
                <button data-encode-op="html-dec" class="btn-secondary">HTML Unescape</button>
                <button data-encode-op="hex-enc">To Hex</button>
                <button data-encode-op="bin-enc" class="btn-secondary">To Binary</button>
              </div>
            </div>
            <div class="studio-panel">
              <div class="studio-panel-head"><h3>Result</h3></div>
              <textarea id="text-encode-output" readonly class="text-workbench-textarea text-workbench-output text-workbench-code-output"></textarea>
              <div class="studio-actions">
                <button id="text-encode-copy">Copy</button>
                <button id="text-encode-download" class="btn-secondary">Download</button>
                <button id="text-encode-clear" class="btn-secondary">Clear</button>
              </div>
            </div>
          </div>
        </section>

        <section class="text-view${n==="case"?"":" hidden"}" data-view="case">
          <div class="studio-panel-grid studio-panel-grid-dual">
            <div class="studio-panel">
              <div class="studio-panel-head"><h3>Input</h3></div>
              <textarea id="text-case-input" class="text-workbench-textarea" placeholder="Enter text to rename or normalize."></textarea>
              <div class="studio-actions">
                <button data-case-op="lower">lowercase</button>
                <button data-case-op="upper">UPPERCASE</button>
                <button data-case-op="camel">camelCase</button>
                <button data-case-op="pascal">PascalCase</button>
                <button data-case-op="snake">snake_case</button>
                <button data-case-op="kebab">kebab-case</button>
                <button data-case-op="title">Title Case</button>
              </div>
            </div>
            <div class="studio-panel">
              <div class="studio-panel-head"><h3>Result</h3></div>
              <textarea id="text-case-output" readonly class="text-workbench-textarea text-workbench-output"></textarea>
              <div class="studio-actions">
                <button id="text-case-copy">Copy</button>
                <button id="text-case-clear" class="btn-secondary">Clear</button>
              </div>
            </div>
          </div>
        </section>

        <section class="text-view${n==="url"?"":" hidden"}" data-view="url">
          <div class="studio-toolbar">
            <div class="studio-toolbar-group">
              <label class="studio-field studio-field-wide">
                <span>URL</span>
                <input id="text-url-input" type="text" value="https://example.com/path?a=1&b=two#frag">
              </label>
            </div>
            <div class="studio-toolbar-group studio-toolbar-actions">
              <button id="text-url-parse">Parse</button>
              <button id="text-url-clear" class="btn-secondary">Clear</button>
            </div>
          </div>
          <div class="studio-result-grid">
            <div class="studio-output-card"><span>Protocol</span><code id="text-url-protocol">--</code></div>
            <div class="studio-output-card"><span>Origin</span><code id="text-url-origin">--</code></div>
            <div class="studio-output-card"><span>Host</span><code id="text-url-host">--</code></div>
            <div class="studio-output-card"><span>Path</span><code id="text-url-path">--</code></div>
            <div class="studio-output-card"><span>Search</span><code id="text-url-search">--</code></div>
            <div class="studio-output-card"><span>Hash</span><code id="text-url-hash">--</code></div>
          </div>
          <div class="studio-panel">
            <div class="studio-panel-head"><h3>Query Parameters</h3></div>
            <div id="text-url-params" class="studio-list"></div>
          </div>
        </section>
      </section>
    </div>
  `}async function M(n,o){const t=P(o),r=k(o),c={"case-converter":"case","url-parser":"url"}[o]||"encode",e=T(n,{className:"text-workbench-shell",eyebrow:r.title,title:t.title,description:{"case-converter":"Case conversion now lives inside one deterministic text workspace with encoding and URL inspection nearby.","url-parser":"URL parsing now lives inside Text Workbench so deterministic string and URL transforms stay together."}[o]||"Encode, decode, normalize text casing, and inspect URLs from one deterministic workspace.",toolIds:r.toolIds,activeToolId:o,metrics:[{key:"transforms",label:"Modes",value:"3"},{key:"local",label:"Execution",value:"Browser local"}]});e.content.innerHTML=j(c);const i=[],b=a=>{e.content.querySelectorAll("[data-text-tab]").forEach(s=>{s.classList.toggle("active",s.dataset.textTab===a)}),e.content.querySelectorAll(".text-view").forEach(s=>{s.classList.toggle("hidden",s.dataset.view!==a)})},v=e.content.querySelector("#text-encode-input"),u=e.content.querySelector("#text-encode-output"),w=a=>{try{u.value=A(v.value,a),e.setStatus("Transform complete.","success")}catch(s){u.value=`Error: ${s.message}`,e.setStatus(s.message,"danger")}},m=e.content.querySelector("#text-case-input"),p=e.content.querySelector("#text-case-output"),C=a=>{try{p.value=L(m.value,a),e.setStatus("Case conversion complete.","success")}catch(s){p.value=`Error: ${s.message}`,e.setStatus(s.message,"danger")}},y=a=>{const s=e.content.querySelector("#text-url-params");if(!a.length){s.innerHTML='<div class="studio-empty">No query parameters.</div>';return}s.innerHTML=a.map(g=>`
      <div class="studio-list-item">
        <div>
          <strong>${S(g.key)}</strong>
          <span>${S(g.value)}</span>
        </div>
      </div>
    `).join("")},h=()=>{try{const a=U(e.content.querySelector("#text-url-input").value);e.content.querySelector("#text-url-protocol").textContent=a.protocol,e.content.querySelector("#text-url-origin").textContent=a.origin,e.content.querySelector("#text-url-host").textContent=a.host,e.content.querySelector("#text-url-path").textContent=a.pathname,e.content.querySelector("#text-url-search").textContent=a.search||"(none)",e.content.querySelector("#text-url-hash").textContent=a.hash||"(none)",y(a.params),e.setStatus("URL parsed.","success")}catch(a){e.content.querySelector("#text-url-protocol").textContent="Invalid",e.content.querySelector("#text-url-origin").textContent=a.message,e.content.querySelector("#text-url-host").textContent="--",e.content.querySelector("#text-url-path").textContent="--",e.content.querySelector("#text-url-search").textContent="--",e.content.querySelector("#text-url-hash").textContent="--",y([]),e.setStatus(a.message,"danger")}};i.push(...Array.from(e.content.querySelectorAll("[data-text-tab]")).map(a=>d(a,"click",()=>b(a.dataset.textTab)))),i.push(...Array.from(e.content.querySelectorAll("[data-encode-op]")).map(a=>d(a,"click",()=>w(a.dataset.encodeOp)))),i.push(d(e.content.querySelector("#text-encode-copy"),"click",()=>f(u.value,"Text copied."))),i.push(d(e.content.querySelector("#text-encode-download"),"click",()=>E(u.value,"text-workbench-output.txt"))),i.push(d(e.content.querySelector("#text-encode-clear"),"click",()=>{v.value="",u.value="",e.setStatus("Encoder fields cleared.","neutral")})),i.push(...Array.from(e.content.querySelectorAll("[data-case-op]")).map(a=>d(a,"click",()=>C(a.dataset.caseOp)))),i.push(d(e.content.querySelector("#text-case-copy"),"click",()=>f(p.value,"Text copied."))),i.push(d(e.content.querySelector("#text-case-clear"),"click",()=>{m.value="",p.value="",e.setStatus("Case fields cleared.","neutral")})),i.push(d(e.content.querySelector("#text-url-parse"),"click",h)),i.push(d(e.content.querySelector("#text-url-clear"),"click",()=>{e.content.querySelector("#text-url-input").value="",h()})),b(c),c==="url"&&h(),l={root:e.root,cleanup:i}}function Z(){var n;if(l){for(const o of l.cleanup)o();(n=l.root)==null||n.remove(),l=null}}function d(n,o,t){return n?(n.addEventListener(o,t),()=>n.removeEventListener(o,t)):()=>{}}export{M as m,Z as u};

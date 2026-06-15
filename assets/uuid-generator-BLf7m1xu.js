import{_ as f}from"./index-7hsJjH-u.js";import{c as g,d as b}from"./ui-utils-CG6aKAAj.js";function U(){return crypto.randomUUID()}function y(){const a=Date.now().toString(16).padStart(12,"0"),t=new Uint8Array(10);crypto.getRandomValues(t),t[0]=t[0]&15|112,t[2]=t[2]&63|128;const n=Array.from(t).map(d=>d.toString(16).padStart(2,"0")).join("");return`${a.slice(0,8)}-${a.slice(8,12)}-${n.slice(0,4)}-${n.slice(4,8)}-${n.slice(8)}`}async function h(o,a="",t=""){const{v1:n,v3:d,v5:i,v6:l}=await f(async()=>{const{v1:c,v3:r,v5:u,v6:p}=await import("https://esm.sh/uuid@9.0.1");return{v1:c,v3:r,v5:u,v6:p}},[]);return o==="1"?n():o==="3"?d(a,t||"6ba7b810-9dad-11d1-80b4-00c04fd430c8"):o==="5"?i(a,t||"6ba7b810-9dad-11d1-80b4-00c04fd430c8"):o==="6"?l():y()}let e=null;async function x(o){e=document.createElement("div"),e.className="tool-uuid-generator",e.innerHTML=`
    <div class="card">
      <div class="settings-grid">
        <div class="form-group">
          <label>UUID Version</label>
          <select id="uuid-version">
            <option value="7" data-tooltip="Timestamp-ordered; recommended choice for database primary keys.">v7 (Timestamp-ordered)</option>
            <option value="4" selected data-tooltip="Fully random; the industry standard for general use.">v4 (Fully Random)</option>
            <option value="1" data-tooltip="Time-based; includes host MAC address (potential privacy risk).">v1 (Time-based)</option>
            <option value="6" data-tooltip="Reordered v1; similar to v7 but using older standards.">v6 (Reordered v1)</option>
            <option value="3" data-tooltip="Deterministic UUID based on MD5 hashing of a name.">v3 (MD5 Name-based)</option>
            <option value="5" data-tooltip="Deterministic UUID based on SHA-1 hashing of a name.">v5 (SHA-1 Name-based)</option>
          </select>
          <div class="info-hint">Use v7 for databases or v4 for everything else.</div>
        </div>
        <div class="form-group">
          <label>Quantity</label>
          <input type="number" id="uuid-count" value="1" min="1" max="500">
          <div class="info-hint">Generate up to 500 UUIDs in one batch.</div>
        </div>
        <div class="form-group">
          <label>Format</label>
          <select id="uuid-case">
            <option value="lower">lowercase</option>
            <option value="upper">UPPERCASE</option>
          </select>
        </div>
      </div>

      <div id="name-based-options" class="hidden settings-grid uuid-name-options">
        <div class="form-group">
          <label>Name</label>
          <input type="text" id="uuid-name" placeholder="e.g. example.com">
        </div>
        <div class="form-group">
          <label>Namespace (UUID)</label>
          <input type="text" id="uuid-namespace" placeholder="DNS, URL, OID, or Custom UUID">
        </div>
      </div>
      
      <button id="btn-generate" class="uuid-generate-button">Generate Batch</button>
      
      <div class="form-group uuid-results-group">
        <label>Generated UUIDs</label>
        <textarea id="uuid-results" class="uuid-results" readonly></textarea>
      </div>

      <div class="uuid-actions">
        <button id="btn-copy-all" class="uuid-action">Copy All</button>
        <button id="btn-dl-txt" class="btn-secondary uuid-action">Download .txt</button>
        <button id="btn-dl-json" class="btn-secondary uuid-action">Download .json</button>
      </div>
    </div>
  `,o.appendChild(e);const a=e.querySelector("#uuid-version"),t=e.querySelector("#uuid-count"),n=e.querySelector("#uuid-case"),d=e.querySelector("#name-based-options"),i=e.querySelector("#uuid-results"),l=e.querySelector("#btn-generate");a.addEventListener("change",()=>{d.classList.toggle("hidden",!["3","5"].includes(a.value))});const c=async()=>{l.disabled=!0;const r=Math.min(parseInt(t.value)||1,500),u=a.value,p=n.value==="upper";let v=[];for(let m=0;m<r;m++){let s;["1","3","5","6"].includes(u)?s=await h(u,e.querySelector("#uuid-name").value,e.querySelector("#uuid-namespace").value):u==="7"?s=y():s=U(),p&&(s=s.toUpperCase()),v.push(s)}i.value=v.join(`
`),l.disabled=!1};l.addEventListener("click",c),e.querySelector("#btn-copy-all").addEventListener("click",()=>g(i.value)),e.querySelector("#btn-dl-txt").addEventListener("click",()=>b(i.value,"uuids.txt")),e.querySelector("#btn-dl-json").addEventListener("click",()=>{const r=JSON.stringify(i.value.split(`
`),null,2);b(r,"uuids.json","application/json")}),c()}function I(){e&&e.remove()}export{x as mount,I as unmount};

import{_ as D}from"./index-CGiSGYdp.js";import{s as M}from"./drag-drop-ekerx5Fy.js";import{s as d,d as y,c as B}from"./ui-utils-CG6aKAAj.js";const k=["jpg","jpeg","jpe","jfif","tif","tiff","webp","png","heic","heif","avif","dng","cr2","cr3","nef","arw","orf","rw2","raf","srw","pef","xmp"],N=[{label:"JPEG",mimeType:"image/jpeg",extension:"jpg"},{label:"PNG",mimeType:"image/png",extension:"png"},{label:"WebP",mimeType:"image/webp",extension:"webp"}],R="https://esm.sh/piexifjs@1.0.6?bundle",X=new Set(["jpg","jpeg","jpe","jfif","webp","png"]),U=new Set(["image/jpeg","image/tiff","image/webp","image/png","image/heic","image/heif","image/avif","application/rdf+xml","application/xml","text/xml"]);function A(e){const n=String((e==null?void 0:e.name)||"").toLowerCase();return n.includes(".")?n.split(".").pop():""}function z(){return{read:[...k],cleanExport:N.map(e=>e.extension),sidecarEdit:["json"]}}function G(e){const n=A(e),i=String((e==null?void 0:e.type)||"").toLowerCase();return k.includes(n)||U.has(i)}function H(e={}){return Object.entries(e).map(([n,i])=>({key:n,value:i,valueType:Array.isArray(i)?"array":i instanceof Date?"date":typeof i,isLocation:/^gps|latitude|longitude|altitude/i.test(n)})).sort((n,i)=>n.isLocation!==i.isLocation?n.isLocation?-1:1:n.key.localeCompare(i.key))}function q(e={},n,i){const c=String(n||"").trim();if(!c)throw new Error("Metadata key is required.");let f=i;if(typeof i=="string"){const l=i.trim();if(l==="")f="";else try{f=JSON.parse(l)}catch{f=i}}return{...e,[c]:f}}function $(e,n="image/jpeg"){const i=A(e),c=N.find(m=>m.mimeType===n)||N[0],f=String((e==null?void 0:e.name)||"image").replace(/\.[^.]+$/,"").replace(/[^\w.-]+/g,"_")||"image",l=X.has(i)||String((e==null?void 0:e.type)||"").startsWith("image/");return{supported:l,mimeType:c.mimeType,extension:c.extension,fileName:`${f}_clean.${c.extension}`,reason:l?"":"Clean image export needs a browser-decodable raster image."}}function K(e){let n="";for(let i=0;i<e.length;i+=1)n+=String.fromCharCode(e[i]);return n}function W(e){const n=new Uint8Array(String(e).length);for(let i=0;i<n.length;i+=1)n[i]=String(e).charCodeAt(i)&255;return n}async function Y(e,n={},i=null){var u,v;const c=new Uint8Array(await e.arrayBuffer());if(c[0]!==255||c[1]!==216)throw new Error("Edited EXIF injection supports JPEG files.");const f=i||await import(R),l=f.default||f,m=(u=l.ImageIFD)==null?void 0:u.Artist,h=((v=l.ExifIFD)==null?void 0:v.UserComment)||37510,x={};m&&n.Artist&&(x[m]=String(n.Artist));const p={[h]:JSON.stringify(n)},b=l.dump({"0th":x,Exif:p,GPS:{},"1st":{},thumbnail:null}),S=l.insert(b,K(c));return new Blob([W(S)],{type:"image/jpeg"})}let r=null,L=[];function E(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function C(e){return e instanceof Date?e.toISOString():Array.isArray(e)?e.join(", "):e&&typeof e=="object"?JSON.stringify(e):String(e)}async function F(e,n){var l;if(typeof createImageBitmap!="function")throw new Error("Clean image export is not available in this browser.");const i=await createImageBitmap(e),c=document.createElement("canvas");c.width=i.width,c.height=i.height;const f=c.getContext("2d");if(!f)throw new Error("Could not create an image export surface.");return f.drawImage(i,0,0),(l=i.close)==null||l.call(i),typeof c.convertToBlob=="function"?c.convertToBlob({type:n,quality:.92}):new Promise((m,h)=>{c.toBlob(x=>{x?m(x):h(new Error("Clean image export failed."))},n,.92)})}async function te(e){L=[];const n=z();r=document.createElement("div"),r.className="tool-exif",r.innerHTML=`
    <div class="card">
      <div id="exif-drop-zone" class="exif-drop-zone">
        <div class="exif-drop-title">EXIF</div>
        <div class="exif-drop-copy">Drop image metadata files to inspect, clean, or export a sidecar</div>
        <div id="exif-support-list" class="exif-support-list"></div>
        <input type="file" id="exif-input" class="hidden" accept="${k.map(t=>`.${t}`).join(",")},image/jpeg,image/webp,image/tiff,image/png,image/heic,image/heif,image/avif">
      </div>

      <div id="exif-ui" class="hidden exif-results-shell">
        <div class="exif-summary-row">
          <div>
            <div id="exif-file-name" class="exif-file-name">No file loaded</div>
            <div id="exif-file-note" class="exif-file-note"></div>
          </div>
          <div class="exif-clean-export">
            <select id="exif-clean-format">
              ${N.map(t=>`<option value="${t.mimeType}">${t.label}</option>`).join("")}
            </select>
            <button id="btn-clean-exif-copy" class="btn-secondary exif-action" type="button">Export Clean Image</button>
            <button id="btn-save-edited-exif-image" class="btn-secondary exif-action" type="button">Save Edited Image</button>
          </div>
        </div>

        <div class="exif-table-frame">
          <table class="exif-table">
            <thead class="exif-table-head">
              <tr>
                <th class="exif-table-heading exif-table-heading-key">PROPERTY</th>
                <th class="exif-table-heading">TYPE</th>
                <th class="exif-table-heading">VALUE</th>
              </tr>
            </thead>
            <tbody id="exif-table-body"></tbody>
          </table>
        </div>

        <div class="exif-edit-panel">
          <label>
            Sidecar Key
            <select id="exif-edit-key"></select>
          </label>
          <label>
            Sidecar Value
            <textarea id="exif-edit-value" rows="3"></textarea>
          </label>
          <button id="btn-apply-exif-edit" class="btn-secondary exif-action" type="button">Apply Sidecar Edit</button>
          <button id="btn-remove-exif-field" class="btn-secondary exif-action" type="button">Remove Field</button>
          <button id="btn-remove-all-exif" class="btn-secondary exif-action" type="button">Remove All</button>
        </div>

        <div class="exif-actions">
          <button id="btn-copy-exif" class="exif-action" type="button">Copy JSON</button>
          <button id="btn-dl-exif" class="btn-secondary exif-action" type="button">Download Original JSON</button>
          <button id="btn-dl-edited-exif" class="btn-secondary exif-action" type="button">Download Edited JSON</button>
        </div>
      </div>
    </div>
  `,e.appendChild(r);const i=r.querySelector("#exif-drop-zone"),c=r.querySelector("#exif-input"),f=r.querySelector("#exif-ui"),l=r.querySelector("#exif-table-body"),m=r.querySelector("#exif-support-list"),h=r.querySelector("#exif-file-name"),x=r.querySelector("#exif-file-note"),p=r.querySelector("#exif-edit-key"),b=r.querySelector("#exif-edit-value"),S=r.querySelector("#exif-clean-format");let u=null,v=null,o=null;m.textContent=`Reads ${n.read.join(", ")}. Clean image export: ${n.cleanExport.join(", ")}. Editable output: JSON sidecar.`;const w=()=>{var a;const t=H(o||{});l.innerHTML=t.map(s=>`
      <tr class="exif-table-row${s.isLocation?" exif-location-row":""}">
        <td class="exif-table-key">${E(s.key)}</td>
        <td class="exif-table-type">${E(s.valueType)}</td>
        <td class="exif-table-value exif-editable-value" contenteditable="true" data-exif-edit-key="${E(s.key)}">${E(C(s.value))}</td>
      </tr>
    `).join(""),p.innerHTML=t.map(s=>`<option value="${E(s.key)}">${E(s.key)}</option>`).join(""),p.value=p.value||((a=t[0])==null?void 0:a.key)||"",b.value=p.value?C(o[p.value]):""},I=async t=>{const a=t[0];if(a){if(!G(a)){d("This file extension is not in the supported metadata list.","danger");return}try{const{default:s}=await D(async()=>{const{default:T}=await import("https://esm.sh/exifr@7.1.3/lite?bundle");return{default:T}},[]),g=await s.parse(a,{tiff:!0,ifd0:!0,ifd1:!0,exif:!0,gps:!0,interop:!0,xmp:!0,icc:!0,iptc:!0,jfif:!0,ihdr:!0});if(!g||!Object.keys(g).length)throw new Error("No metadata detected in this file.");u=a,v=g,o={...g};const j=$(a,S.value);h.textContent=a.name,x.textContent=`${Object.keys(g).length} metadata fields. ${j.supported?"Clean image export available.":j.reason}`,w(),f.classList.remove("hidden"),d(`Loaded metadata for ${a.name}.`,"success")}catch(s){d(s.message,"danger")}}};function P(t,a){!o||!t||(o=q(o,t,a),p.value=t,b.value=C(o[t]),w())}async function J(){if(!u||!o)return;if(/\.jpe?g$/i.test(u.name)||u.type==="image/jpeg"){const s=await Y(u,o);y(s,V(u.name,"jpg"),"image/jpeg"),d("Edited metadata embedded in JPEG EXIF.","success");return}const t=$(u,S.value);if(!t.supported){y(JSON.stringify(o,null,2),"metadata.edited.json","application/json"),d(t.reason,"danger");return}const a=await F(u,t.mimeType);y(a,t.fileName,t.mimeType),y(JSON.stringify(o,null,2),t.fileName.replace(/\.[^.]+$/,".metadata.json"),"application/json"),d("Edited image and metadata sidecar exported.","success")}i.addEventListener("click",()=>c.click()),c.addEventListener("change",t=>I(t.target.files));const _=t=>{var g;const a=(g=t.clipboardData)==null?void 0:g.items;if(!a)return;const s=[];for(const j of a)if(j.type.startsWith("image/")){const T=j.getAsFile();T&&s.push(T)}s.length>0&&I(s)};window.addEventListener("paste",_),L.push(()=>window.removeEventListener("paste",_));const O=M(i,I);L.push(()=>O==null?void 0:O()),p.addEventListener("change",()=>{b.value=p.value&&o?C(o[p.value]):""}),r.querySelector("#btn-apply-exif-edit").addEventListener("click",()=>{if(o)try{o=q(o,p.value,b.value),w(),d("Sidecar metadata updated.","success")}catch(t){d(t.message,"danger")}}),l.addEventListener("blur",t=>{const a=t.target.closest("[data-exif-edit-key]");if(a)try{P(a.dataset.exifEditKey,a.textContent),d("Metadata value updated.","success")}catch(s){d(s.message,"danger")}},!0),l.addEventListener("keydown",t=>{t.key==="Enter"&&(t.preventDefault(),t.target.blur())}),r.querySelector("#btn-remove-exif-field").addEventListener("click",()=>{!o||!p.value||(delete o[p.value],w(),d("Metadata field removed.","success"))}),r.querySelector("#btn-remove-all-exif").addEventListener("click",()=>{o&&(o={},w(),d("Metadata sidecar cleared.","success"))}),r.querySelector("#btn-copy-exif").addEventListener("click",()=>{o&&B(JSON.stringify(o,null,2))}),r.querySelector("#btn-dl-exif").addEventListener("click",()=>{v&&y(JSON.stringify(v,null,2),"metadata.original.json","application/json")}),r.querySelector("#btn-dl-edited-exif").addEventListener("click",()=>{o&&y(JSON.stringify(o,null,2),"metadata.edited.json","application/json")}),r.querySelector("#btn-clean-exif-copy").addEventListener("click",async()=>{if(!u)return;const t=r.querySelector("#btn-clean-exif-copy"),a=$(u,S.value);if(!a.supported){d(a.reason,"danger");return}t.disabled=!0,t.textContent="Exporting...";try{const s=await F(u,a.mimeType);y(s,a.fileName,a.mimeType),d("Clean image exported.","success")}catch(s){d(s.message,"danger")}finally{t.disabled=!1,t.textContent="Export Clean Image"}}),r.querySelector("#btn-save-edited-exif-image").addEventListener("click",()=>{J().catch(t=>d(t.message,"danger"))})}function ie(){L.forEach(e=>e()),L=[],r&&r.remove(),r=null}function V(e="image.jpg",n="jpg"){return`${String(e||"image").replace(/\.[^.]+$/,"").replace(/[^\w.-]+/g,"_")||"image"}_edited.${n}`}export{te as mount,ie as unmount};

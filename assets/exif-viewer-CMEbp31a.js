import{_ as D,e as E}from"./index-ATPg-6Fd.js";import{s as M}from"./drag-drop-ekerx5Fy.js";import{s as l,d as y,c as B}from"./ui-utils-BycjcbQ0.js";const k=["jpg","jpeg","jpe","jfif","tif","tiff","webp","png","heic","heif","avif","dng","cr2","cr3","nef","arw","orf","rw2","raf","srw","pef","xmp"],N=[{label:"JPEG",mimeType:"image/jpeg",extension:"jpg"},{label:"PNG",mimeType:"image/png",extension:"png"},{label:"WebP",mimeType:"image/webp",extension:"webp"}],R="https://esm.sh/piexifjs@1.0.6?bundle",X=new Set(["jpg","jpeg","jpe","jfif","webp","png"]),U=new Set(["image/jpeg","image/tiff","image/webp","image/png","image/heic","image/heif","image/avif","application/rdf+xml","application/xml","text/xml"]);function A(e){const n=String((e==null?void 0:e.name)||"").toLowerCase();return n.includes(".")?n.split(".").pop():""}function z(){return{read:[...k],cleanExport:N.map(e=>e.extension),sidecarEdit:["json"]}}function G(e){const n=A(e),i=String((e==null?void 0:e.type)||"").toLowerCase();return k.includes(n)||U.has(i)}function H(e={}){return Object.entries(e).map(([n,i])=>({key:n,value:i,valueType:Array.isArray(i)?"array":i instanceof Date?"date":typeof i,isLocation:/^gps|latitude|longitude|altitude/i.test(n)})).sort((n,i)=>n.isLocation!==i.isLocation?n.isLocation?-1:1:n.key.localeCompare(i.key))}function q(e={},n,i){const c=String(n||"").trim();if(!c)throw new Error("Metadata key is required.");let f=i;if(typeof i=="string"){const d=i.trim();if(d==="")f="";else try{f=JSON.parse(d)}catch{f=i}}return{...e,[c]:f}}function $(e,n="image/jpeg"){const i=A(e),c=N.find(m=>m.mimeType===n)||N[0],f=String((e==null?void 0:e.name)||"image").replace(/\.[^.]+$/,"").replace(/[^\w.-]+/g,"_")||"image",d=X.has(i)||String((e==null?void 0:e.type)||"").startsWith("image/");return{supported:d,mimeType:c.mimeType,extension:c.extension,fileName:`${f}_clean.${c.extension}`,reason:d?"":"Clean image export needs a browser-decodable raster image."}}function K(e){let n="";for(let i=0;i<e.length;i+=1)n+=String.fromCharCode(e[i]);return n}function W(e){const n=new Uint8Array(String(e).length);for(let i=0;i<n.length;i+=1)n[i]=String(e).charCodeAt(i)&255;return n}async function Y(e,n={},i=null){var p,v;const c=new Uint8Array(await e.arrayBuffer());if(c[0]!==255||c[1]!==216)throw new Error("Edited EXIF injection supports JPEG files.");const f=i||await import(R),d=f.default||f,m=(p=d.ImageIFD)==null?void 0:p.Artist,h=((v=d.ExifIFD)==null?void 0:v.UserComment)||37510,x={};m&&n.Artist&&(x[m]=String(n.Artist));const u={[h]:JSON.stringify(n)},b=d.dump({"0th":x,Exif:u,GPS:{},"1st":{},thumbnail:null}),S=d.insert(b,K(c));return new Blob([W(S)],{type:"image/jpeg"})}let o=null,L=[];function C(e){return e instanceof Date?e.toISOString():Array.isArray(e)?e.join(", "):e&&typeof e=="object"?JSON.stringify(e):String(e)}async function F(e,n){var d;if(typeof createImageBitmap!="function")throw new Error("Clean image export is not available in this browser.");const i=await createImageBitmap(e),c=document.createElement("canvas");c.width=i.width,c.height=i.height;const f=c.getContext("2d");if(!f)throw new Error("Could not create an image export surface.");return f.drawImage(i,0,0),(d=i.close)==null||d.call(i),typeof c.convertToBlob=="function"?c.convertToBlob({type:n,quality:.92}):new Promise((m,h)=>{c.toBlob(x=>{x?m(x):h(new Error("Clean image export failed."))},n,.92)})}async function te(e){L=[];const n=z();o=document.createElement("div"),o.className="tool-exif",o.innerHTML=`
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
  `,e.appendChild(o);const i=o.querySelector("#exif-drop-zone"),c=o.querySelector("#exif-input"),f=o.querySelector("#exif-ui"),d=o.querySelector("#exif-table-body"),m=o.querySelector("#exif-support-list"),h=o.querySelector("#exif-file-name"),x=o.querySelector("#exif-file-note"),u=o.querySelector("#exif-edit-key"),b=o.querySelector("#exif-edit-value"),S=o.querySelector("#exif-clean-format");let p=null,v=null,r=null;m.textContent=`Reads ${n.read.join(", ")}. Clean image export: ${n.cleanExport.join(", ")}. Editable output: JSON sidecar.`;const w=()=>{var a;const t=H(r||{});d.innerHTML=t.map(s=>`
      <tr class="exif-table-row${s.isLocation?" exif-location-row":""}">
        <td class="exif-table-key">${E(s.key)}</td>
        <td class="exif-table-type">${E(s.valueType)}</td>
        <td class="exif-table-value exif-editable-value" contenteditable="true" data-exif-edit-key="${E(s.key)}">${E(C(s.value))}</td>
      </tr>
    `).join(""),u.innerHTML=t.map(s=>`<option value="${E(s.key)}">${E(s.key)}</option>`).join(""),u.value=u.value||((a=t[0])==null?void 0:a.key)||"",b.value=u.value?C(r[u.value]):""},I=async t=>{const a=t[0];if(a){if(!G(a)){l("This file extension is not in the supported metadata list.","danger");return}try{const{default:s}=await D(async()=>{const{default:T}=await import("https://esm.sh/exifr@7.1.3/lite?bundle");return{default:T}},[]),g=await s.parse(a,{tiff:!0,ifd0:!0,ifd1:!0,exif:!0,gps:!0,interop:!0,xmp:!0,icc:!0,iptc:!0,jfif:!0,ihdr:!0});if(!g||!Object.keys(g).length)throw new Error("No metadata detected in this file.");p=a,v=g,r={...g};const j=$(a,S.value);h.textContent=a.name,x.textContent=`${Object.keys(g).length} metadata fields. ${j.supported?"Clean image export available.":j.reason}`,w(),f.classList.remove("hidden"),l(`Loaded metadata for ${a.name}.`,"success")}catch(s){l(s.message,"danger")}}};function P(t,a){!r||!t||(r=q(r,t,a),u.value=t,b.value=C(r[t]),w())}async function J(){if(!p||!r)return;if(/\.jpe?g$/i.test(p.name)||p.type==="image/jpeg"){const s=await Y(p,r);y(s,V(p.name,"jpg"),"image/jpeg"),l("Edited metadata embedded in JPEG EXIF.","success");return}const t=$(p,S.value);if(!t.supported){y(JSON.stringify(r,null,2),"metadata.edited.json","application/json"),l(t.reason,"danger");return}const a=await F(p,t.mimeType);y(a,t.fileName,t.mimeType),y(JSON.stringify(r,null,2),t.fileName.replace(/\.[^.]+$/,".metadata.json"),"application/json"),l("Edited image and metadata sidecar exported.","success")}i.addEventListener("click",()=>c.click()),c.addEventListener("change",t=>I(t.target.files));const _=t=>{var g;const a=(g=t.clipboardData)==null?void 0:g.items;if(!a)return;const s=[];for(const j of a)if(j.type.startsWith("image/")){const T=j.getAsFile();T&&s.push(T)}s.length>0&&I(s)};window.addEventListener("paste",_),L.push(()=>window.removeEventListener("paste",_));const O=M(i,I);L.push(()=>O==null?void 0:O()),u.addEventListener("change",()=>{b.value=u.value&&r?C(r[u.value]):""}),o.querySelector("#btn-apply-exif-edit").addEventListener("click",()=>{if(r)try{r=q(r,u.value,b.value),w(),l("Sidecar metadata updated.","success")}catch(t){l(t.message,"danger")}}),d.addEventListener("blur",t=>{const a=t.target.closest("[data-exif-edit-key]");if(a)try{P(a.dataset.exifEditKey,a.textContent),l("Metadata value updated.","success")}catch(s){l(s.message,"danger")}},!0),d.addEventListener("keydown",t=>{t.key==="Enter"&&(t.preventDefault(),t.target.blur())}),o.querySelector("#btn-remove-exif-field").addEventListener("click",()=>{!r||!u.value||(delete r[u.value],w(),l("Metadata field removed.","success"))}),o.querySelector("#btn-remove-all-exif").addEventListener("click",()=>{r&&(r={},w(),l("Metadata sidecar cleared.","success"))}),o.querySelector("#btn-copy-exif").addEventListener("click",()=>{r&&B(JSON.stringify(r,null,2))}),o.querySelector("#btn-dl-exif").addEventListener("click",()=>{v&&y(JSON.stringify(v,null,2),"metadata.original.json","application/json")}),o.querySelector("#btn-dl-edited-exif").addEventListener("click",()=>{r&&y(JSON.stringify(r,null,2),"metadata.edited.json","application/json")}),o.querySelector("#btn-clean-exif-copy").addEventListener("click",async()=>{if(!p)return;const t=o.querySelector("#btn-clean-exif-copy"),a=$(p,S.value);if(!a.supported){l(a.reason,"danger");return}t.disabled=!0,t.textContent="Exporting...";try{const s=await F(p,a.mimeType);y(s,a.fileName,a.mimeType),l("Clean image exported.","success")}catch(s){l(s.message,"danger")}finally{t.disabled=!1,t.textContent="Export Clean Image"}}),o.querySelector("#btn-save-edited-exif-image").addEventListener("click",()=>{J().catch(t=>l(t.message,"danger"))})}function ie(){L.forEach(e=>e()),L=[],o&&o.remove(),o=null}function V(e="image.jpg",n="jpg"){return`${String(e||"image").replace(/\.[^.]+$/,"").replace(/[^\w.-]+/g,"_")||"image"}_edited.${n}`}export{te as mount,ie as unmount};

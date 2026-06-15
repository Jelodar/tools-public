import{_ as U}from"./index-CoRJqXFF.js";import{s as J}from"./drag-drop-ekerx5Fy.js";import{d as K,s as q}from"./ui-utils-CG6aKAAj.js";function V(e,t){return[...e,...Array.from(t||[]).map(o=>S(o))]}function W(e,t){return e.filter((o,n)=>n!==t)}function R(e,t,o){if(t===o)return[...e];if(t<0||o<0||t>=e.length||o>=e.length)return[...e];const n=[...e],[c]=n.splice(t,1);return n.splice(o,0,c),n}function L(e){const t=e.length;return{count:t,canMerge:t>=1,message:t===0?"Drop PDF files to start a merge set.":t===1?"1 PDF ready for page edits or export.":`${t} PDFs ready to merge in listed order.`}}function S(e,t={}){return e!=null&&e.file||(e==null?void 0:e.pageSelection)!==void 0||(e==null?void 0:e.pageCount)!==void 0||(e==null?void 0:e.rotation)!==void 0?{...e,...t,pageSelection:String(t.pageSelection??e.pageSelection??"all"),pageCount:t.pageCount??e.pageCount??null,pageStatus:t.pageStatus??e.pageStatus??"",rotation:h(t.rotation??e.rotation??0)}:{file:e,name:(e==null?void 0:e.name)||"Untitled.pdf",size:Number(e==null?void 0:e.size)||0,pageSelection:t.pageSelection||"all",pageCount:t.pageCount??null,pageStatus:t.pageStatus||"",rotation:h(t.rotation??0)}}function N(e){return(e==null?void 0:e.file)||e}function D(e,t,o){return e.map((n,c)=>c===t?{...S(n),pageSelection:String(o||"").trim()||"all"}:n)}function h(e){const t=(Number(e)%360+360)%360;return[0,90,180,270].includes(t)?t:0}function Z(e,t,o){return e.map((n,c)=>c===t?{...S(n),rotation:h(o)}:n)}function G(e,t,o){const n=S(e[t]);if(!n)return[...e];const c=Number(n.pageCount)||0,g=String(n.pageSelection||"all").trim()||"all";let s=g;if(o==="all")s="all";else if(o==="reverse"&&c>0)s=`${c}-1`;else if(o==="odd"&&c>0)s=Array.from({length:Math.ceil(c/2)},(a,p)=>p*2+1).join(",");else if(o==="even"&&c>1)s=Array.from({length:Math.floor(c/2)},(a,p)=>p*2+2).join(",");else if(o==="duplicate"){const a=g.toLowerCase()==="all"&&c>0?`1-${c}`:g;s=`${a},${a}`}return D(e,t,s)}function k(e){const t=S(e),o=Number(t.pageCount)||0,n=M(t.pageSelection,o);return n.error?[]:n.indices.map(c=>c+1)}function O(e,t){const o=Number(t)||0,n=e.map(g=>Number(g)).filter(g=>Number.isInteger(g)&&g>=1&&g<=o);return o>0&&n.length===o&&n.every((g,s)=>g===s+1)?"all":n.join(",")||"all"}function X(e){const t=S(e),o=Number(t.pageCount)||0;if(o<=0)return[];const n=k(t),c=n.reduce((a,p)=>(a.set(p,(a.get(p)||0)+1),a),new Map),g=n.map((a,p)=>({key:`selected-${p}-${a}`,page:a,selected:!0,sequenceIndex:p,duplicate:(c.get(a)||0)>1})),s=Array.from({length:o},(a,p)=>p+1).filter(a=>!c.has(a)).map(a=>({key:`omitted-${a}`,page:a,selected:!1,sequenceIndex:-1,duplicate:!1}));return[...g,...s]}function Y(e,t,o,n=-1){const c=S(e[t]);if(!c)return[...e];const g=Number(c.pageCount)||0;if(g<=0)return[...e];const s=k(c),a=Number(o),p=Number(n);let m=s;if(Number.isInteger(p)&&p>=0&&p<s.length)m=s.filter((P,f)=>f!==p);else if(s.includes(a)){const P=s.indexOf(a);m=s.filter((f,$)=>$!==P)}else Number.isInteger(a)&&a>=1&&a<=g&&(m=s.every((f,$)=>$===0||f>s[$-1])?[...s,a].sort((f,$)=>f-$):[...s,a]);return D(e,t,O(m,g))}function ee(e,t,o,n){const c=S(e[t]);if(!c)return[...e];const g=Number(c.pageCount)||0,s=k(c),a=Number(o),p=Number(n);if(!Number.isInteger(a)||!Number.isInteger(p)||a<0||p<0||a>=s.length||p>=s.length||a===p)return[...e];const m=[...s],[P]=m.splice(a,1);return m.splice(p,0,P),D(e,t,O(m,g))}function te(e,t,o,n=""){return e.map((c,g)=>g===t?{...S(c),pageCount:Number(o)||null,pageStatus:n}:c)}function T(e,t,o){return e.map((n,c)=>c===t?{...S(n),pageStatus:o}:n)}function M(e,t){const o=Number(t)||0;if(o<=0)return{indices:[],error:"Page count is not available."};const n=String(e||"all").trim().toLowerCase();if(!n||n==="all"||n==="*")return{indices:Array.from({length:o},(s,a)=>a),error:""};const c=[],g=n.split(",").map(s=>s.trim()).filter(Boolean);for(const s of g){const a=s.match(/^(\d+)\s*-\s*(\d+)$/),p=s.match(/^\d+$/);if(!a&&!p)return{indices:[],error:`Invalid page token "${s}".`};const m=Number((a==null?void 0:a[1])||s),P=Number((a==null?void 0:a[2])||s);if(m<1||m>o)return{indices:[],error:`Page ${m} is outside 1-${o}.`};if(P<1||P>o)return{indices:[],error:`Page ${P} is outside 1-${o}.`};const f=m<=P?1:-1;for(let $=m;f>0?$<=P:$>=P;$+=f)c.push($-1)}return c.length?{indices:c,error:""}:{indices:[],error:"No pages selected."}}let b=null,d=[],w=null,E=null,_=0;async function B(){return E||(E=U(()=>import("https://esm.sh/pdf-lib@1.17.1?bundle"),[])),E}function F(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function ne(e,t){const o=X(e);return o.length?`
    <div class="pdf-page-preview" data-page-preview="${t}">
      ${o.map(n=>`
        <button
          type="button"
          class="pdf-page-chip${n.selected?" is-selected":" is-omitted"}${n.duplicate?" is-duplicate":""}"
          data-page-toggle="${t}"
          data-page-number="${n.page}"
          data-page-sequence="${n.sequenceIndex}"
          ${n.selected?`data-page-drag="${t}" data-page-drop="${t}" draggable="true"`:""}
        >
          <span class="pdf-page-chip-number">${n.page}</span>
          <span class="pdf-page-chip-state">${n.selected?n.duplicate?"Copy":"Page":"Off"}</span>
        </button>
      `).join("")}
    </div>
  `:""}async function ce(e){b=document.createElement("div"),b.className="tool-pdf",b.innerHTML=`
    <div class="card tool-shell-stack">
      <div id="pdf-drop-zone" class="tool-dropzone tool-dropzone-large">
        <div class="tool-dropzone-glyph">PDF</div>
        <div class="tool-dropzone-copy">Drop PDFs here to merge or click to upload</div>
        <input type="file" id="pdf-input" class="hidden" accept=".pdf" multiple>
      </div>

      <div id="pdf-list-section" class="hidden tool-list-panel">
        <div class="tool-list-head">
          <h4 class="tool-list-title">Merge Queue</h4>
          <div id="pdf-queue-meta" class="tool-list-meta"></div>
        </div>
        <ul id="pdf-queue" class="tool-file-list"></ul>
        <div class="pdf-page-help">Use page ranges like all, 1-3,7,5. Omitted pages are removed; order controls the export order. Use the page tools for common edits.</div>
        <div id="pdf-status" class="tool-status-copy"></div>
        <div class="tool-action-row tool-action-row-compact">
          <button id="btn-clear-pdfs" class="btn-secondary tool-grow-1">Clear</button>
          <button id="btn-merge-pdfs" class="tool-grow-2">Merge / Export</button>
        </div>
      </div>
    </div>
  `,e.appendChild(b);const t=b.querySelector("#pdf-drop-zone"),o=b.querySelector("#pdf-input"),n=b.querySelector("#pdf-list-section"),c=b.querySelector("#pdf-queue"),g=b.querySelector("#pdf-queue-meta"),s=b.querySelector("#pdf-status"),a=b.querySelector("#btn-merge-pdfs"),p=b.querySelector("#btn-clear-pdfs");let m=null;const P=i=>{d=V(d,i).filter(r=>{var l;return(l=r==null?void 0:r.name)==null?void 0:l.toLowerCase().endsWith(".pdf")}),f(),j()},f=()=>{const i=L(d),r=d.map(l=>{if(!l.pageCount)return"";const u=M(l.pageSelection,l.pageCount);return u.error?`${l.name}: ${u.error}`:""}).filter(Boolean);if(n.classList.toggle("hidden",i.count===0),g.textContent=i.count===0?"":`${i.count} file${i.count===1?"":"s"}`,s.textContent=r[0]||i.message,a.disabled=!i.canMerge||r.length>0,p.disabled=i.count===0,i.count===0){c.innerHTML="";return}c.innerHTML=d.map((l,u)=>`
      <li class="tool-file-row">
        <div class="tool-file-row-index">${u+1}</div>
        <div class="pdf-file-main">
          <div class="tool-file-row-name">${F(l.name)}</div>
          <div class="tool-file-row-size">${(l.size/1024).toFixed(1)} KB · ${F(l.pageStatus||(l.pageCount?`${l.pageCount} pages`:"Page count pending"))}</div>
          <label class="pdf-page-field">
            <span>Pages</span>
            <input data-pages="${u}" value="${F(l.pageSelection||"all")}" placeholder="all or 1-3,7,5">
          </label>
          <div class="pdf-page-actions">
            <button type="button" data-page-action="all" data-idx="${u}" class="btn-secondary tool-btn-compact">All</button>
            <button type="button" data-page-action="reverse" data-idx="${u}" class="btn-secondary tool-btn-compact">Reverse</button>
            <button type="button" data-page-action="odd" data-idx="${u}" class="btn-secondary tool-btn-compact">Odd</button>
            <button type="button" data-page-action="even" data-idx="${u}" class="btn-secondary tool-btn-compact">Even</button>
            <button type="button" data-page-action="duplicate" data-idx="${u}" class="btn-secondary tool-btn-compact">Duplicate</button>
          </div>
          ${ne(l,u)}
          <label class="pdf-page-field pdf-rotation-field">
            <span>Rotate Exported Pages</span>
            <select data-rotation="${u}">
              <option value="0" ${h(l.rotation)===0?"selected":""}>None</option>
              <option value="90" ${h(l.rotation)===90?"selected":""}>90 deg</option>
              <option value="180" ${h(l.rotation)===180?"selected":""}>180 deg</option>
              <option value="270" ${h(l.rotation)===270?"selected":""}>270 deg</option>
            </select>
          </label>
        </div>
        <div class="tool-file-row-actions">
          <button type="button" data-move="up" data-idx="${u}" class="btn-secondary tool-btn-compact">Up</button>
          <button type="button" data-move="down" data-idx="${u}" class="btn-secondary tool-btn-compact">Down</button>
          <button type="button" data-remove="${u}" class="tool-btn-danger tool-btn-compact">Remove</button>
        </div>
      </li>
    `).join("")},$=i=>{const r=N(i);return d.findIndex(l=>N(l)===r)};t.addEventListener("click",()=>o.click()),o.addEventListener("change",i=>P(i.target.files)),w=J(t,P);const j=async()=>{const i=++_,r=d.map((u,v)=>({item:u,index:v})).filter(({item:u})=>{var v;return!u.pageCount&&typeof((v=N(u))==null?void 0:v.arrayBuffer)=="function"});if(!r.length)return;let l=null;try{({PDFDocument:l}=await B())}catch{d=d.map(v=>v.pageCount?v:{...v,pageStatus:"Page count unavailable"}),f();return}for(const{item:u}of r){if(i!==_)return;let v=$(u);if(v!==-1){d=T(d,v,"Reading pages..."),f();try{const y=await l.load(await N(u).arrayBuffer());if(v=$(u),v===-1)continue;const C=y.getPageCount();d=te(d,v,C,`${C} page${C===1?"":"s"}`)}catch(y){if(v=$(u),v===-1)continue;d=T(d,v,`Page count failed: ${y.message}`)}f()}}};b.addEventListener("click",i=>{const r=i.target.dataset||{},l=Number(r.idx);if(r.remove!==void 0){d=W(d,Number(r.remove)),f();return}if(r.move==="up"){d=R(d,l,l-1),f();return}if(r.move==="down"){d=R(d,l,l+1),f();return}if(r.pageAction){d=G(d,l,r.pageAction),f();return}r.pageToggle!==void 0&&(d=Y(d,Number(r.pageToggle),Number(r.pageNumber),Number(r.pageSequence)),f())}),b.addEventListener("dragstart",i=>{var l;const r=i.target.dataset||{};r.pageDrag!==void 0&&(m={index:Number(r.pageDrag),sequenceIndex:Number(r.pageSequence)},(l=i.dataTransfer)==null||l.setData("text/plain",JSON.stringify(m)))}),b.addEventListener("dragover",i=>{var r;((r=i.target.dataset)==null?void 0:r.pageDrop)!==void 0&&i.preventDefault()}),b.addEventListener("drop",i=>{const r=i.target.dataset||{};if(r.pageDrop===void 0||!m)return;i.preventDefault();const l=Number(r.pageDrop);l===m.index&&(d=ee(d,l,m.sequenceIndex,Number(r.pageSequence)),f()),m=null}),b.addEventListener("input",i=>{var r;((r=i.target.dataset)==null?void 0:r.pages)!==void 0&&(d=D(d,Number(i.target.dataset.pages),i.target.value),f())}),b.addEventListener("change",i=>{var r;((r=i.target.dataset)==null?void 0:r.rotation)!==void 0&&(d=Z(d,Number(i.target.dataset.rotation),i.target.value),f())}),p.addEventListener("click",()=>{d=[],f()}),a.addEventListener("click",async()=>{const i=L(d);if(!i.canMerge){s.textContent=i.message;return}a.disabled=!0,a.textContent="Merging...",s.textContent="Loading PDF engine...";try{const{PDFDocument:r,degrees:l}=await B(),u=await r.create();for(const y of d){const C=N(y);s.textContent=`Reading ${y.name}...`;const H=await C.arrayBuffer(),z=await r.load(H),Q=y.pageCount||z.getPageCount(),x=M(y.pageSelection,Q);if(x.error)throw new Error(`${y.name}: ${x.error}`);const A=h(y.rotation);(await u.copyPages(z,x.indices)).forEach(I=>{A&&I.setRotation(l(A)),u.addPage(I)})}s.textContent="Saving PDF...";const v=await u.save();K(v,d.length===1?`${d[0].name.replace(/\.pdf$/i,"")}_pages.pdf`:"merged.pdf","application/pdf"),s.textContent=d.length===1?"PDF exported.":`Merged ${d.length} PDFs.`,q("PDF downloaded.","success")}catch(r){s.textContent=r.message,q("Merge failed: "+r.message,"danger")}finally{a.textContent="Merge / Export",a.disabled=!L(d).canMerge}}),f()}function de(){w==null||w(),w=null,d=[],_+=1,b&&(b.remove(),b=null)}export{ce as mount,de as unmount};

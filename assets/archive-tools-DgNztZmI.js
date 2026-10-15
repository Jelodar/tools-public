import{s as U}from"./drag-drop-ekerx5Fy.js";import{d as k,s as $}from"./ui-utils-BycjcbQ0.js";import{b as Z,g as V,i as K,a as G,c as J,l as W,e as X,r as Y}from"./archive-GUnlegRL.js";import{e as l}from"./index-ATPg-6Fd.js";let a=null,d=[],r=null,m="build",p="",g=null;async function re(h){const n=V();a=document.createElement("div"),a.className="tool-archive",a.innerHTML=`
    <div class="card archive-workspace">
      <div id="zip-drop-zone" class="archive-drop-zone">
        <div class="archive-drop-icon">ARC</div>
        <div class="archive-drop-copy">Drop files to bundle or an archive to inspect</div>
        <input type="file" id="zip-input" class="hidden" multiple accept="${n.open.map(e=>`.${e}`).join(",")}">
      </div>
      <div class="archive-ingest-row">
        <div class="archive-ingest-controls">
          <button id="btn-add-archive-files" type="button" class="btn-secondary">Add Files</button>
          <label class="archive-password-control">
            <span>Password</span>
            <input id="archive-password" type="password" autocomplete="off" placeholder="If encrypted">
          </label>
        </div>
        <details class="archive-support-details">
          <summary>Supported formats</summary>
          <div id="archive-support-note" class="archive-support-note">
            Opens ${n.open.join(", ")}. Exports ${n.export.join(", ")}.
          </div>
        </details>
      </div>
      <div id="archive-status" class="archive-status">Ready.</div>

      <div id="archive-ui" class="hidden archive-ui" data-mode="build">
        <div class="form-group">
          <div class="archive-list-header">
            <label id="archive-list-label">File Queue</label>
            <div id="archive-mode-note" class="archive-mode-note"></div>
          </div>
          <div id="archive-breadcrumbs" class="archive-breadcrumbs"></div>
          <div class="archive-table-shell">
            <table class="archive-table">
              <thead>
                <tr>
                  <th class="archive-name-heading">FILENAME</th>
                  <th class="archive-size-heading">SIZE</th>
                  <th id="archive-action-header" class="archive-action-heading">ACTION</th>
                </tr>
              </thead>
              <tbody id="archive-list-body"></tbody>
            </table>
          </div>
        </div>

        <div class="archive-actions">
          <label class="archive-format-control">
            <span>Output</span>
            <select id="archive-output-format">
              ${n.export.map(e=>`<option value="${e}">${e.toUpperCase()}</option>`).join("")}
            </select>
          </label>
          <button id="btn-build-zip" class="archive-build-button" type="button">Build & Download</button>
          <button id="btn-archive-export-all" class="archive-build-button hidden" type="button">Export All</button>
          <button id="btn-clear-archive" class="btn-secondary archive-clear-button">Clear All</button>
        </div>
      </div>
    </div>
  `,h.appendChild(a);const T=a.querySelector("#zip-drop-zone"),L=a.querySelector("#zip-input"),f=a.querySelector("#archive-ui"),H=a.querySelector("#btn-add-archive-files"),O=a.querySelector("#archive-support-note"),z=a.querySelector("#archive-list-label"),A=a.querySelector("#archive-mode-note"),S=a.querySelector("#archive-breadcrumbs"),F=a.querySelector("#archive-list-body"),q=a.querySelector("#archive-action-header"),c=a.querySelector("#btn-build-zip"),y=a.querySelector("#btn-archive-export-all"),w=a.querySelector("#btn-clear-archive"),B=a.querySelector("#archive-output-format"),C=a.querySelector("#archive-password"),E=a.querySelector("#archive-status");O.textContent=`Opens ${n.open.join(", ")}. Exports ${n.export.join(", ")}.`,B.innerHTML=n.export.map(e=>`<option value="${e}">${e.toUpperCase()}</option>`).join("");const v=(e,t="",i="")=>{E.textContent=e,E.dataset.tone=t,i?E.dataset.code=i:delete E.dataset.code},x=e=>{const t=J(e,{password:C.value});v(t.message,"danger",t.code),$(t.message,"danger")},o=()=>{const e=m==="inspect"&&r,t=d.length>0;if(!e&&!t){f.classList.add("hidden"),f.dataset.mode="build",z.textContent="File Queue",A.textContent="",S.innerHTML="",F.innerHTML="",q.textContent="ACTION",c.classList.remove("hidden"),y.classList.add("hidden"),w.textContent="Clear All";return}if(f.classList.remove("hidden"),e){f.dataset.mode="inspect",z.textContent="Archive Contents";const i=r.entries.filter(s=>!s.isDirectory).length,u=r.entries.filter(s=>s.isDirectory).length,b=G(r.entries,p);A.textContent=`${r.name} - ${i} files, ${u} folders`,q.textContent="ACTION",c.classList.add("hidden"),y.classList.remove("hidden"),w.textContent=t?"Back to Queue":"Close View",S.innerHTML=b.breadcrumbs.map((s,R)=>`
        <button type="button" class="archive-breadcrumb" data-archive-path="${l(s.path)}">${l(s.label)}</button>
        ${R<b.breadcrumbs.length-1?"<span>/</span>":""}
      `).join(""),F.innerHTML=[...b.folders,...b.files].map(s=>`
        <tr data-archive-entry="true" class="archive-row">
          <td class="archive-name-cell">
            <span class="archive-kind-badge ${s.isDirectory?"is-folder":"is-file"}">${s.isDirectory?"Folder":"File"}</span>
            ${s.isDirectory?`<button type="button" class="archive-entry-open" data-open-folder="${l(s.name)}">${l(s.name)}</button>`:`<span class="archive-entry-path">${l(s.name)}</span>`}
          </td>
          <td class="archive-size-cell">${I(s.size)}</td>
          <td class="archive-action-cell">
            ${s.isDirectory?`<button type="button" class="archive-export-button" data-extract-prefix="${l(s.name)}">Export Folder</button>`:`<button type="button" class="archive-export-button" data-extract-entry="${l(s.name)}">Extract</button>`}
          </td>
        </tr>
      `).join("");return}f.dataset.mode="build",z.textContent="File Queue",A.textContent=`${d.length} files ready to bundle.`,S.innerHTML="",q.textContent="ACTION",c.classList.remove("hidden"),y.classList.add("hidden"),w.textContent="Clear All",F.innerHTML=d.map((i,u)=>`
      <tr data-archive-queue-row="true" class="archive-row">
        <td class="archive-name-cell">
          <span class="archive-kind-badge is-file">File</span>
          <span class="archive-entry-path">${l(i.webkitRelativePath||i.name)}</span>
        </td>
        <td class="archive-size-cell">${I(i.size)}</td>
        <td class="archive-action-cell">
          <button data-idx="${u}" class="archive-remove-button">Remove</button>
        </td>
      </tr>
    `).join("")},P=async e=>{try{v(`Opening ${e.name}...`,"working");const t=await W(e,{password:C.value});r={name:e.name,file:e,entries:t},m="inspect",p="",o(),v(`Opened ${e.name}.`,"success"),$("Archive inspected.","success")}catch(t){x(t)}},M=async e=>{const t=Array.from(e||[]).filter(Boolean);if(t.length){if(t.length===1&&K(t[0])){await P(t[0]);return}d.push(...t),m="build",r=null,p="",o()}},N=async(e,t,i)=>{const u=(e==null?void 0:e.textContent)||"";e&&(e.disabled=!0,e.textContent=t);try{await i()}finally{e&&(e.disabled=!1,e.textContent=u)}},Q=(e="zip",t="")=>`${String((r==null?void 0:r.name)||"archive").replace(/\.(tar\.gz|tar\.bz2|tar\.xz|[^.]+)$/i,"").replace(/[^\w.-]+/g,"_")||"archive"}${t}.${e}`,_=async(e,t)=>{r!=null&&r.file&&await N(t,"Extracting...",async()=>{const i=await X(r.file,e,{password:C.value});k(i.blob,i.fileName,i.mimeType),v(`Extracted ${i.fileName}.`,"success"),$("File extracted.","success")})},D=async(e,t)=>{r!=null&&r.file&&await N(t,"Exporting...",async()=>{const i=B.value||"zip",u=await Y(r.file,{prefix:e,format:i},{password:C.value}),b=e?`_${e.replace(/[^\w.-]+/g,"_").replace(/_$/,"")}`:"";k(u,Q(i,b),j(i)),v(`Exported ${i.toUpperCase()}.`,"success"),$("Archive export ready.","success")})};T.addEventListener("click",()=>L.click()),H.addEventListener("click",()=>L.click()),L.addEventListener("change",async e=>{await M(e.target.files),e.target.value=""}),g=U(T,M),a.addEventListener("click",e=>{const t=e.target.closest("button");if(t){if(t.dataset.openFolder!==void 0){p=t.dataset.openFolder,o();return}if(t.dataset.archivePath!==void 0){p=t.dataset.archivePath,o();return}if(t.dataset.extractEntry){_(t.dataset.extractEntry,t).catch(x);return}if(t.dataset.extractPrefix){D(t.dataset.extractPrefix,t).catch(x);return}t.dataset.idx!==void 0&&(d.splice(parseInt(t.dataset.idx,10),1),o())}}),w.addEventListener("click",()=>{if(m==="inspect"){r=null,m="build",p="",o();return}d=[],o()}),c.addEventListener("click",async()=>{c.disabled=!0,c.textContent="Compressing...";try{const e=B.value||"zip",t=await Z(d,{format:e});k(t,`archive_${Date.now()}.${e}`,j(e)),v(`Built ${e.toUpperCase()}.`,"success"),$("Archive ready.","success")}catch(e){x(e)}finally{c.disabled=!1,c.textContent="Build & Download"}}),y.addEventListener("click",()=>{D("",y).catch(x)}),o()}function se(){g==null||g(),g=null,d=[],r=null,m="build",p="",a&&a.remove(),a=null}function I(h=0){const n=Number(h)||0;return n>=1024*1024?`${(n/(1024*1024)).toFixed(1)} MB`:n>=1024?`${(n/1024).toFixed(1)} KB`:`${n} B`}function j(h="zip"){return h==="tar"?"application/x-tar":h==="tar.gz"?"application/gzip":"application/zip"}export{re as mount,se as unmount};

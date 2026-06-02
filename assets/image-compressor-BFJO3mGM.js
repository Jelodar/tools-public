import{s as B}from"./drag-drop-ekerx5Fy.js";import{d as D}from"./ui-utils-CG6aKAAj.js";let i=null,t=null,v=null,u=[],h=null,c=null,m=null;function l(p){p&&URL.revokeObjectURL(p)}async function A(p){u=[],i=document.createElement("div"),i.className="tool-image-optimizer",i.innerHTML=`
    <div class="card">
      <div id="img-drop-zone" class="img-optimizer-dropzone">
        <div class="img-optimizer-dropzone-icon">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="9" cy="10" r="1.5"></circle><path d="m21 16-4.5-4.5a2 2 0 0 0-2.8 0L7 18"></path></svg>
        </div>
        <div class="img-optimizer-dropzone-copy">Drop image or click to optimize</div>
        <div id="img-info" class="img-optimizer-file-info"></div>
        <input type="file" id="img-input" class="hidden" accept="image/*">
      </div>

      <div id="img-ui" class="hidden img-optimizer-ui">
        <div class="img-optimizer-previews">
           <div class="preview-panel">
             <label class="nav-group-title img-optimizer-preview-label">Original Preview</label>
             <div id="original-preview" class="img-optimizer-preview-box">
               <img id="img-orig" class="img-optimizer-img">
             </div>
           </div>
           <div class="preview-panel">
             <label class="nav-group-title img-optimizer-preview-label">Optimized Preview</label>
             <div id="optimized-preview" class="img-optimizer-preview-box">
               <img id="img-opt" class="img-optimizer-img">
               <div id="optimize-loader" class="hidden img-optimizer-loader">
                 <div class="spinner"></div>
               </div>
             </div>
           </div>
        </div>

        <div class="settings-grid">
          <div class="form-group">
            <label>Output Format</label>
            <select id="img-format">
              <option value="webp" data-tooltip="Next-gen format with superior compression and quality.">WebP (High Efficiency)</option>
              <option value="jpeg" data-tooltip="Standard format for maximum compatibility across all platforms.">MozJPEG (Compatible)</option>
              <option value="png" data-tooltip="Preserves every pixel exactly; best for graphics and logos.">PNG (Lossless)</option>
            </select>
            <div class="info-hint">WebP is recommended for most web use cases.</div>
          </div>
          <div class="form-group">
            <label>Quality (<span id="quality-val">80</span>%)</label>
            <input type="range" id="img-quality" min="1" max="100" value="80">
            <div class="info-hint">Lower quality reduces file size but may add artifacts.</div>
          </div>
        </div>

        <div class="settings-grid">
          <div class="form-group">
            <label>Width Override (px)</label>
            <input type="number" id="img-width" placeholder="Keep Original">
            <div class="info-hint">Scale image width. Height adjusts automatically.</div>
          </div>
          <div class="form-group">
            <label>Height Override (px)</label>
            <input type="number" id="img-height" placeholder="Keep Original">
            <div class="info-hint">Scale image height. Width adjusts automatically.</div>
          </div>
        </div>

        <div class="img-optimizer-stats-bar">
          <div id="optimize-stats" class="img-optimizer-stats-info">Waiting for optimization...</div>
          <button id="btn-export-img" disabled class="btn-primary img-optimizer-export-button">Download Optimized File</button>
        </div>
      </div>
    </div>
  `,p.appendChild(i);const b=i.querySelector("#img-drop-zone"),U=i.querySelector("#img-input"),F=i.querySelector("#img-ui"),f=i.querySelector("#img-quality"),k=i.querySelector("#quality-val"),w=i.querySelector("#optimize-stats"),x=i.querySelector("#btn-export-img"),L=i.querySelector("#img-format"),I=i.querySelector("#img-width"),P=i.querySelector("#img-height"),R=i.querySelector("#img-orig"),j=i.querySelector("#img-opt"),y=i.querySelector("#optimize-loader"),q=e=>{t=e[0],t&&(l(h),l(m),h=URL.createObjectURL(t),m=null,v=null,R.src=h,j.removeAttribute("src"),F.classList.remove("hidden"),b.classList.add("is-compact"),i.querySelector("#img-info").textContent=`${t.name} (${(t.size/1024).toFixed(1)} KB)`,S())},S=async()=>{if(t){y.classList.remove("hidden"),x.disabled=!0;try{const e=L.value,z=parseInt(f.value)/100,o=parseInt(I.value),r=parseInt(P.value),a=new Image;l(c),c=URL.createObjectURL(t),a.src=c;try{await a.decode()}finally{l(c),c=null}const s=document.createElement("canvas");let n=a.width,d=a.height;o&&n>o&&(d=o/n*d,n=o),r&&d>r&&(n=r/d*n,d=r),s.width=n,s.height=d;const O=s.getContext("2d");O.imageSmoothingEnabled=!0,O.imageSmoothingQuality="high",O.drawImage(a,0,0,n,d);const W=`image/${e==="jpeg"?"jpeg":e}`;s.toBlob(g=>{if(!g){w.textContent="Error: Image export failed.",y.classList.add("hidden");return}l(m),v=g,m=URL.createObjectURL(g),j.src=m;const $=((1-g.size/t.size)*100).toFixed(1);w.textContent=`${(g.size/1024).toFixed(1)}KB | Saved: ${$}%`,x.disabled=!1,y.classList.add("hidden")},W,z)}catch(e){w.textContent="Error: "+e.message,y.classList.add("hidden")}}};b.addEventListener("click",()=>U.click()),U.addEventListener("change",e=>q(e.target.files));const C=e=>{var r;const z=(r=e.clipboardData)==null?void 0:r.items;if(!z)return;const o=[];for(const a of z)if(a.type.startsWith("image/")){const s=a.getAsFile();s&&o.push(s)}o.length>0&&q(o)};window.addEventListener("paste",C),u.push(()=>window.removeEventListener("paste",C));const E=B(b,q);u.push(()=>E==null?void 0:E()),[f,L].forEach(e=>e.addEventListener("change",S)),[I,P].forEach(e=>e.addEventListener("blur",S)),f.addEventListener("input",()=>{k.textContent=f.value}),x.addEventListener("click",()=>{if(v){const e=L.value;D(v,`optimized_${Date.now()}.${e}`)}})}function N(){u.forEach(p=>p()),u=[],l(h),l(c),l(m),i&&i.remove(),i=null,t=null,v=null,h=null,c=null,m=null}export{A as mount,N as unmount};

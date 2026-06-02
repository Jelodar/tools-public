import{s as be}from"./drag-drop-ekerx5Fy.js";import{c as ve,d as ne}from"./ui-utils-CG6aKAAj.js";function b(t,n,o){return Math.min(Math.max(t,n),o)}function H(t){if(!Number.isFinite(t)||t<=0)return"0 B";const n=["B","KB","MB","GB","TB"],o=Math.min(n.length-1,Math.floor(Math.log(t)/Math.log(1024))),i=t/1024**o;return`${i.toFixed(i>=100||o===0?0:i>=10?1:2)} ${n[o]}`}function v(t,n=8){return b(t,0,Number.MAX_SAFE_INTEGER).toString(16).toUpperCase().padStart(n,"0")}function oe(t){const n=Math.max(1,t),o=Math.ceil(Math.log(n)/Math.log(16)),i=o%2===0?o:o+1;return Math.max(8,i)}function S(t){return b(t,0,255).toString(16).toUpperCase().padStart(2,"0")}function se(t){return t>=32&&t<=126?String.fromCharCode(t):"."}function me(t){const n=String(t??"").trim();return n?/^0x[0-9a-f]+$/i.test(n)?parseInt(n,16):/^[0-9a-f]+h$/i.test(n)?parseInt(n.slice(0,-1),16):/^[0-9]+$/i.test(n)?parseInt(n,10):Number.NaN:Number.NaN}function _(t){return String(t??"").replace(/[^0-9a-f]/gi,"").slice(0,2).toUpperCase()}function Se(t,n,o,i){return!Number.isInteger(n)||n<0?{valid:!1,changed:!1}:!Number.isInteger(i)||i<0||i>255?{valid:!1,changed:!1}:i===o?(t.delete(n),{valid:!0,changed:!1,removed:!0,value:i}):(t.set(n,{original:o,value:i}),{valid:!0,changed:!0,removed:!1,value:i})}function Q(t){return Array.from(t.entries()).sort((n,o)=>n[0]-o[0]).map(([n,o])=>({offset:n,original:o.original,value:o.value}))}function ke({scrollTop:t,viewportHeight:n,rowHeight:o,totalRows:i,overscan:r=8}){const l=Math.max(n,o),h=Math.max(0,Math.floor(t/o)-r),c=Math.ceil(l/o)+r*2;return{startRow:h,endRow:Math.min(i,h+c)}}function D(t,n){if(!Number.isInteger(t)||!Number.isInteger(n))return null;const o=Math.min(t,n),i=Math.max(t,n);return{start:o,end:i,length:i-o+1}}function Re(t){const n=String(t??"").replace(/0x/gi," ").replace(/[^0-9a-f]/gi,"");if(!n||n.length%2!==0)return null;const o=new Uint8Array(n.length/2);for(let i=0;i<n.length;i+=2)o[i/2]=parseInt(n.slice(i,i+2),16);return o}function Ce(t){return t>=65&&t<=90?t+32:t}function Me({mode:t="text",query:n="",caseSensitive:o=!0}){if(t==="hex")return Re(n);const i=String(n??"");return i?new TextEncoder().encode(o?i:i.toLowerCase()):null}function qe(t,n="text",o=!0){if(n!=="text"||o)return t;const i=new Uint8Array(t.length);for(let r=0;r<t.length;r+=1)i[r]=Ce(t[r]);return i}function $e(t,n,o=0){if(!(n!=null&&n.length)||t.length<n.length)return-1;const i=t.length-n.length;for(let r=o;r<=i;r+=1){let l=!0;for(let h=0;h<n.length;h+=1)if(t[r+h]!==n[h]){l=!1;break}if(l)return r}return-1}function Le({fileSize:t,startOffset:n=0,chunkSize:o=1024*1024,needleLength:i=1}){if(!Number.isFinite(t)||t<=0)return[];const r=b(n,0,Math.max(0,t-1)),l=Math.max(0,i-1),h=Math.max(1,o-l),c=[],p=(g,u)=>{for(let w=g;w<u;w+=h)c.push({start:w,end:Math.min(u,w+o)})};return p(r,t),r>0&&p(0,r),c}const x=28,Pe=16,ie=1e5,Ae=10,ae=256*1024,Ne=48,re=1024*1024,ze=new TextDecoder;let a=null,z=[],s={},e=null,K=0,j=0,B=0,U=!1;class Ee{constructor(n,o=ae,i=Ne){this.file=n,this.pageSize=o,this.pageLimit=i,this.pages=new Map,this.pending=new Map,this.clock=0}async getPage(n){const o=this.pages.get(n);if(o)return o.tick=++this.clock,o.bytes;const i=this.pending.get(n);if(i)return i;const r=this.file.slice(n*this.pageSize,Math.min(this.file.size,(n+1)*this.pageSize)).arrayBuffer().then(l=>{const h=new Uint8Array(l);return this.pending.delete(n),this.pages.set(n,{bytes:h,tick:++this.clock}),this.trim(),h}).catch(l=>{throw this.pending.delete(n),l});return this.pending.set(n,r),r}trim(){if(this.pages.size<=this.pageLimit)return;let n=null,o=Number.POSITIVE_INFINITY;for(const[i,r]of this.pages.entries())r.tick<o&&(o=r.tick,n=i);n!==null&&this.pages.delete(n)}async readRange(n,o){const i=b(n,0,this.file.size),r=b(o,0,this.file.size);if(r<=i)return new Uint8Array(0);const l=new Uint8Array(r-i),h=Math.floor(i/this.pageSize),c=Math.floor((r-1)/this.pageSize);let p=0;for(let g=h;g<=c;g+=1){const u=await this.getPage(g),w=g*this.pageSize,L=Math.max(i,w),C=Math.min(r,w+u.length),T=L-w,P=C-w;l.set(u.subarray(T,P),p),p+=P-T}return l}getCachedPageCount(){return this.pages.size}dispose(){this.pages.clear(),this.pending.clear()}}function Fe(){return{file:null,reader:null,bytesPerRow:Pe,totalRows:0,offsetWidth:8,patches:new Map,bookmarks:[],selectionAnchor:null,selectionFocus:null,windowStartRow:0,windowRowCount:0,editor:null,search:{open:!1,active:!1,mode:"text",query:"",caseSensitive:!1,cursor:0,lastMatch:null,progressText:"Ready."}}}function ce(){m(!1),E("Search cancelled."),e!=null&&e.reader&&e.reader.dispose(),K+=1,j+=1,e=Fe()}async function nt(t){ce(),z=[],a=document.createElement("div"),a.className="tool-hex-editor",a.innerHTML=`
    <div class="card hex-suite-card">
      <div id="hex-drop-zone" class="hex-suite-drop">
        <div class="hex-suite-drop-icon">
          <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="3.5" width="16" height="17" rx="2"></rect><path d="M8 7.5h8"></path><path d="M8 11.5h3"></path><path d="M13 11.5h3"></path><path d="M8 15.5h3"></path><path d="M13 15.5h3"></path></svg>
        </div>
        <div class="hex-suite-drop-title">Open a file</div>
        <div class="hex-suite-drop-copy">Bytes stay paged and windowed so large files remain workable.</div>
        <div class="hex-suite-drop-actions">
          <button type="button" id="hex-open-file">Open File</button>
        </div>
        <input type="file" id="hex-input" class="hidden">
      </div>

      <div id="hex-shell" class="hex-suite-shell hidden">
        <div class="hex-suite-toolbar">
          <div class="hex-suite-summary">
            <div class="hex-suite-chip"><span>File</span><strong id="hex-filename">-</strong></div>
            <div class="hex-suite-chip"><span>Size</span><strong id="hex-filesize">-</strong></div>
            <div class="hex-suite-chip"><span>Changes</span><strong id="hex-dirty-count">0</strong></div>
            <div class="hex-suite-chip"><span>Window</span><strong id="hex-window-label">-</strong></div>
          </div>
          <div class="hex-suite-actions">
            <label class="hex-field">
              <span>Bytes / Row</span>
              <select id="hex-bytes-per-row">
                <option value="8">8</option>
                <option value="16" selected>16</option>
                <option value="24">24</option>
                <option value="32">32</option>
              </select>
            </label>
            <label class="hex-field">
              <span>Jump to</span>
              <input type="text" id="hex-goto" placeholder="0x400">
            </label>
            <button type="button" class="btn-secondary" id="hex-find-btn">Find</button>
            <button type="button" class="btn-secondary" id="hex-replace-btn">Replace File</button>
            <button type="button" class="btn-secondary" id="hex-bookmark-btn">Bookmark</button>
            <button type="button" class="btn-secondary" id="hex-export-patches-btn">Patch Set</button>
            <button type="button" id="hex-export-btn">Export File</button>
          </div>
        </div>

        <div class="hex-suite-main">
          <section class="hex-browser-panel">
            <div class="hex-grid-header">
              <div>Offset</div>
              <div>Hex</div>
              <div>ASCII</div>
            </div>
            <div class="hex-viewport-wrap">
              <div id="hex-viewport" class="hex-viewport" tabindex="0">
                <div id="hex-spacer" class="hex-spacer"></div>
                <div id="hex-content" class="hex-content"></div>
              </div>
              <div id="hex-editor-layer" class="hex-editor-layer"></div>
              <div id="hex-search-overlay" class="hex-search-overlay hidden">
                <div class="hex-search-header">
                  <strong>Search</strong>
                  <button type="button" class="hex-ghost-btn" id="hex-close-search-btn">Close</button>
                </div>
                <div class="hex-search-grid">
                  <label class="hex-field">
                    <span>Mode</span>
                    <select id="hex-search-mode">
                      <option value="text">Text</option>
                      <option value="hex">Hex Bytes</option>
                    </select>
                  </label>
                  <label class="hex-field hex-search-query-field">
                    <span>Query</span>
                    <input type="text" id="hex-search-query" placeholder="needle">
                  </label>
                  <label class="hex-check">
                    <input type="checkbox" id="hex-search-case">
                    <span>Match case</span>
                  </label>
                </div>
                <div class="hex-search-actions">
                  <button type="button" id="hex-search-next-btn">Find Next</button>
                  <button type="button" class="btn-secondary" id="hex-search-cancel-btn">Cancel</button>
                </div>
                <div id="hex-search-status" class="hex-search-status">Ready.</div>
              </div>
            </div>
          </section>

          <aside class="hex-sidebar">
            <div class="studio-section expanded" data-hex-section>
              <div class="studio-section-header" data-section-toggle>
                <span class="studio-section-title">Overview</span>
                <span class="section-toggle-icon">▾</span>
              </div>
              <div class="studio-section-content">
                <div class="hex-info-grid">
                  <div><span>Rows</span><strong id="hex-total-rows">-</strong></div>
                  <div><span>Page Cache</span><strong id="hex-cache-pages">0</strong></div>
                  <div><span>Page Size</span><strong id="hex-page-size">${H(ae)}</strong></div>
                  <div><span>Search Chunk</span><strong id="hex-search-chunk">${H(re)}</strong></div>
                </div>
              </div>
            </div>

            <div class="studio-section expanded" data-hex-section>
              <div class="studio-section-header" data-section-toggle>
                <span class="studio-section-title">Selection</span>
                <span class="section-toggle-icon">▾</span>
              </div>
              <div class="studio-section-content">
                <div class="hex-info-grid">
                  <div><span>Offset</span><strong id="hex-selection-offset">-</strong></div>
                  <div><span>Length</span><strong id="hex-selection-length">0</strong></div>
                  <div><span>Hex</span><strong id="hex-selection-hex">-</strong></div>
                  <div><span>ASCII</span><strong id="hex-selection-ascii">-</strong></div>
                  <div><span>Unsigned</span><strong id="hex-selection-dec">-</strong></div>
                  <div><span>Binary</span><strong id="hex-selection-bin">-</strong></div>
                  <div><span>UInt16 LE</span><strong id="hex-selection-u16le">-</strong></div>
                  <div><span>UInt16 BE</span><strong id="hex-selection-u16be">-</strong></div>
                </div>
                <div class="hex-panel-actions">
                  <button type="button" class="btn-secondary" id="hex-copy-hex-btn">Copy Hex</button>
                  <button type="button" class="btn-secondary" id="hex-copy-text-btn">Copy Text</button>
                  <button type="button" class="btn-secondary" id="hex-revert-selection-btn">Revert Selection</button>
                </div>
              </div>
            </div>

            <div class="studio-section expanded" data-hex-section>
              <div class="studio-section-header" data-section-toggle>
                <span class="studio-section-title">Bookmarks</span>
                <span class="section-toggle-icon">▾</span>
              </div>
              <div class="studio-section-content">
                <div id="hex-bookmarks" class="hex-list"></div>
                <div class="hex-panel-actions">
                  <button type="button" class="btn-secondary" id="hex-clear-bookmarks-btn">Clear Bookmarks</button>
                </div>
              </div>
            </div>

            <div class="studio-section expanded" data-hex-section>
              <div class="studio-section-header" data-section-toggle>
                <span class="studio-section-title">Changes</span>
                <span class="section-toggle-icon">▾</span>
              </div>
              <div class="studio-section-content">
                <div id="hex-patches" class="hex-list"></div>
                <div class="hex-panel-actions">
                  <button type="button" class="btn-secondary" id="hex-revert-all-btn">Revert All</button>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div id="hex-status" class="hex-suite-status">Open a byte with Enter or by clicking the same cell twice. Shift extends the selection.</div>
      </div>
    </div>
  `,t.appendChild(a),s={dropZone:a.querySelector("#hex-drop-zone"),fileInput:a.querySelector("#hex-input"),shell:a.querySelector("#hex-shell"),viewport:a.querySelector("#hex-viewport"),spacer:a.querySelector("#hex-spacer"),content:a.querySelector("#hex-content"),editorLayer:a.querySelector("#hex-editor-layer"),searchOverlay:a.querySelector("#hex-search-overlay"),filename:a.querySelector("#hex-filename"),filesize:a.querySelector("#hex-filesize"),dirtyCount:a.querySelector("#hex-dirty-count"),windowLabel:a.querySelector("#hex-window-label"),totalRows:a.querySelector("#hex-total-rows"),cachePages:a.querySelector("#hex-cache-pages"),status:a.querySelector("#hex-status"),goto:a.querySelector("#hex-goto"),bytesPerRow:a.querySelector("#hex-bytes-per-row"),searchMode:a.querySelector("#hex-search-mode"),searchQuery:a.querySelector("#hex-search-query"),searchCase:a.querySelector("#hex-search-case"),searchStatus:a.querySelector("#hex-search-status"),selectionOffset:a.querySelector("#hex-selection-offset"),selectionLength:a.querySelector("#hex-selection-length"),selectionHex:a.querySelector("#hex-selection-hex"),selectionAscii:a.querySelector("#hex-selection-ascii"),selectionDec:a.querySelector("#hex-selection-dec"),selectionBin:a.querySelector("#hex-selection-bin"),selectionU16le:a.querySelector("#hex-selection-u16le"),selectionU16be:a.querySelector("#hex-selection-u16be"),bookmarks:a.querySelector("#hex-bookmarks"),patches:a.querySelector("#hex-patches")};const n=o=>{const i=Array.from(o||[])[0];i&&Te(i)};d(s.dropZone,"click",o=>{(o.target===s.dropZone||o.target.closest("#hex-open-file"))&&s.fileInput.click()}),d(s.fileInput,"change",o=>n(o.target.files)),z.push(be(s.dropZone,n)),d(s.viewport,"scroll",Oe),d(s.content,"click",De),d(s.content,"dblclick",We),d(s.viewport,"keydown",Ue),d(s.bytesPerRow,"change",_e),d(s.goto,"keydown",Ke),d(a.querySelector("#hex-find-btn"),"click",()=>le(!0)),d(a.querySelector("#hex-replace-btn"),"click",()=>s.fileInput.click()),d(a.querySelector("#hex-bookmark-btn"),"click",je),d(a.querySelector("#hex-export-btn"),"click",Xe),d(a.querySelector("#hex-export-patches-btn"),"click",Ye),d(a.querySelector("#hex-copy-hex-btn"),"click",()=>ee("hex")),d(a.querySelector("#hex-copy-text-btn"),"click",()=>ee("text")),d(a.querySelector("#hex-revert-selection-btn"),"click",Je),d(a.querySelector("#hex-clear-bookmarks-btn"),"click",Qe),d(a.querySelector("#hex-revert-all-btn"),"click",Ve),d(a.querySelector("#hex-close-search-btn"),"click",X),d(a.querySelector("#hex-search-cancel-btn"),"click",()=>E("Search cancelled.")),d(a.querySelector("#hex-search-next-btn"),"click",te),d(s.searchQuery,"keydown",o=>{o.key==="Enter"&&(o.preventDefault(),te()),o.key==="Escape"&&(o.preventDefault(),X())}),d(s.searchMode,"change",N),d(s.searchQuery,"input",N),d(s.searchCase,"change",N),d(s.bookmarks,"click",Ze),d(s.patches,"click",Ge),a.querySelectorAll("[data-section-toggle]").forEach(o=>{d(o,"click",()=>{var i;return(i=o.closest("[data-hex-section]"))==null?void 0:i.classList.toggle("expanded")})}),W(),F()}function d(t,n,o){t&&(t.addEventListener(n,o),z.push(()=>t.removeEventListener(n,o)))}async function Te(t){ce(),e.file=t,e.reader=new Ee(t),e.totalRows=Math.max(1,Math.ceil(t.size/e.bytesPerRow)),e.offsetWidth=oe(t.size),e.windowRowCount=Math.min(e.totalRows,ie),s.filename.textContent=t.name,s.filesize.textContent=H(t.size),s.totalRows.textContent=e.totalRows.toLocaleString(),s.dropZone.classList.add("hidden"),s.shell.classList.remove("hidden"),s.searchOverlay.classList.add("hidden"),s.searchMode.value=e.search.mode,s.searchQuery.value="",s.searchCase.checked=!1,s.searchStatus.textContent="Ready.",s.viewport.scrollTop=0,e.windowStartRow=0,s.spacer.style.height=`${Math.max(1,e.windowRowCount)*x}px`,W(),F(),R(),M(),f("File ready. The viewport stays in a bounded window even on very large binaries."),await he(),s.viewport.focus()}function M(){var o;if(!e.file)return;s.dirtyCount.textContent=e.patches.size.toLocaleString();const t=e.windowStartRow+1,n=Math.min(e.totalRows,e.windowStartRow+e.windowRowCount);s.windowLabel.textContent=`${t.toLocaleString()}-${n.toLocaleString()}`,s.cachePages.textContent=((o=e.reader)==null?void 0:o.getCachedPageCount().toLocaleString())??"0"}function f(t,n="neutral"){s.status.textContent=t,s.status.dataset.tone=n}function N(){e.search.mode=s.searchMode.value,e.search.query=s.searchQuery.value,e.search.caseSensitive=s.searchCase.checked}function le(t=!1){e.search.open=!0,s.searchOverlay.classList.remove("hidden"),N(),t&&requestAnimationFrame(()=>{s.searchQuery.focus(),s.searchQuery.select()})}function X(){E("Search closed."),e.search.open=!1,s.searchOverlay.classList.add("hidden")}function E(t="Search cancelled."){B+=1,e!=null&&e.search&&(e.search.active=!1,e.search.progressText=t,s.searchStatus&&(s.searchStatus.textContent=t))}function k(){U||(U=!0,requestAnimationFrame(async()=>{U=!1,await he()}))}function Ie(){return e.search.lastMatch?{start:e.search.lastMatch.start,end:e.search.lastMatch.start+e.search.lastMatch.length-1}:null}function Be(t){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}async function Z(t,n){const o=await e.reader.readRange(t,n);for(const[i,r]of e.patches.entries())i>=t&&i<n&&(o[i-t]=r.value);return o}async function he(){if(!e.file||!e.reader)return;const t=++K,{startRow:n,endRow:o}=ke({scrollTop:s.viewport.scrollTop,viewportHeight:s.viewport.clientHeight,rowHeight:x,totalRows:e.windowRowCount,overscan:Ae}),i=e.windowStartRow+n,r=e.windowStartRow+o,l=i*e.bytesPerRow,h=Math.min(e.file.size,r*e.bytesPerRow),c=await Z(l,h);if(t!==K||!e.file)return;const p=D(e.selectionAnchor,e.selectionFocus),g=Ie(),u=132+e.bytesPerRow*34+Math.max(220,e.bytesPerRow*14),w=[];for(let L=i;L<r;L+=1){const C=L*e.bytesPerRow,T=C-l,P=[],J=[];for(let y=C;y<Math.min(C+e.bytesPerRow,e.file.size);y+=1){const ue=T+(y-C),A=c[ue],I=e.patches.get(y),V=(I==null?void 0:I.original)??A,fe=p&&y>=p.start&&y<=p.end,pe=e.selectionFocus===y,xe=e.bookmarks.includes(y),ge=g&&y>=g.start&&y<=g.end,q=["hex-byte-cell"];fe&&q.push("is-selected"),pe&&q.push("is-focused"),I&&q.push("is-patched"),xe&&q.push("is-bookmarked"),ge&&q.push("is-match");const Y=q.join(" "),we=S(A),ye=Be(se(A));P.push(`<span class="${Y}" data-byte-index="${y}" data-cell-role="hex" data-current="${A}" data-original="${V}">${we}</span>`),J.push(`<span class="${Y}" data-byte-index="${y}" data-cell-role="ascii" data-current="${A}" data-original="${V}">${ye}</span>`)}w.push(`
      <div class="hex-row">
        <div class="hex-row-offset">${v(C,e.offsetWidth)}</div>
        <div class="hex-row-hex">${P.join("")}</div>
        <div class="hex-row-ascii">${J.join("")}</div>
      </div>
    `)}s.content.style.transform=`translateY(${n*x}px)`,s.content.style.minWidth=`${u}px`,s.content.innerHTML=w.join(""),s.cachePages.textContent=e.reader.getCachedPageCount().toLocaleString(),M()}function He(){if(!e.file||e.totalRows<=e.windowRowCount)return!1;const t=Math.floor(s.viewport.scrollTop/x),n=Math.max(256,Math.floor(e.windowRowCount*.18));if(t>=n&&t<=e.windowRowCount-n)return!1;const o=e.windowStartRow+t,i=b(o-Math.floor(e.windowRowCount/2),0,e.totalRows-e.windowRowCount);if(i===e.windowStartRow)return!1;const r=s.viewport.scrollTop%x;return e.windowStartRow=i,s.viewport.scrollTop=(o-i)*x+r,s.spacer.style.height=`${Math.max(1,e.windowRowCount)*x}px`,M(),!0}function Oe(){m(!0),He(),k()}function De(t){const n=t.target.closest("[data-byte-index]");if(!n)return;const o=Number(n.dataset.byteIndex);t.shiftKey&&Number.isInteger(e.selectionAnchor)?e.selectionFocus=o:e.selectionFocus===o&&n.dataset.cellRole==="hex"?O(n):(e.selectionAnchor=o,e.selectionFocus=o),R(),k(),s.viewport.focus()}function We(t){const n=t.target.closest('[data-byte-index][data-cell-role="hex"]');n&&O(n)}function O(t,n=""){m(!0);const o=Number(t.dataset.byteIndex),i=Number(t.dataset.current),r=Number(t.dataset.original),l=s.viewport.getBoundingClientRect(),h=t.getBoundingClientRect(),c=document.createElement("input");c.type="text",c.autocomplete="off",c.spellcheck=!1,c.maxLength=2,c.value=n?_(n):S(i),c.className="hex-byte-editor",c.style.left=`${h.left-l.left+s.viewport.scrollLeft}px`,c.style.top=`${h.top-l.top+s.viewport.scrollTop}px`,c.style.width=`${h.width}px`,c.style.height=`${h.height}px`,s.editorLayer.innerHTML="",s.editorLayer.appendChild(c),e.editor={input:c,byteIndex:o,originalValue:r},requestAnimationFrame(()=>{c.focus(),n?c.setSelectionRange(c.value.length,c.value.length):c.select()}),c.addEventListener("input",()=>{c.value=_(c.value)}),c.addEventListener("blur",()=>m(!0),{once:!0}),c.addEventListener("keydown",p=>{p.key==="Enter"&&(p.preventDefault(),m(!0),de(1,!1)),p.key==="Escape"&&(p.preventDefault(),m(!1),s.viewport.focus())})}function m(t){if(!(e!=null&&e.editor))return;const{input:n,byteIndex:o,originalValue:i}=e.editor;if(t){const r=_(n.value);r.length===2&&(Se(e.patches,o,i,parseInt(r,16)),F(),M(),R())}s.editorLayer.innerHTML="",e.editor=null,k()}function Ue(t){if(!e.file)return;if((t.metaKey||t.ctrlKey)&&t.key.toLowerCase()==="f"){t.preventDefault(),le(!0);return}if(t.key==="Escape"){m(!1),E("Search cancelled.");return}if(!Number.isInteger(e.selectionFocus))return;if(/^[0-9a-f]$/i.test(t.key)&&!t.metaKey&&!t.ctrlKey&&!t.altKey){t.preventDefault();const o=s.content.querySelector(`[data-byte-index="${e.selectionFocus}"][data-cell-role="hex"]`);o&&O(o,t.key);return}let n=null;if(t.key==="ArrowLeft"&&(n=-1),t.key==="ArrowRight"&&(n=1),t.key==="ArrowUp"&&(n=-e.bytesPerRow),t.key==="ArrowDown"&&(n=e.bytesPerRow),t.key==="PageUp"&&(n=-e.bytesPerRow*Math.max(1,Math.floor(s.viewport.clientHeight/x))),t.key==="PageDown"&&(n=e.bytesPerRow*Math.max(1,Math.floor(s.viewport.clientHeight/x))),n!==null){t.preventDefault(),de(n,t.shiftKey);return}if(t.key==="Home"){t.preventDefault(),$(0,t.shiftKey);return}if(t.key==="End"){t.preventDefault(),$(e.file.size-1,t.shiftKey);return}if(t.key==="Enter"){t.preventDefault();const o=s.content.querySelector(`[data-byte-index="${e.selectionFocus}"][data-cell-role="hex"]`);o&&O(o)}}function de(t,n){const o=b((e.selectionFocus??0)+t,0,Math.max(0,e.file.size-1));$(o,n)}function $(t,n=!1){(!n||!Number.isInteger(e.selectionAnchor))&&(e.selectionAnchor=t),e.selectionFocus=t,G(t),R(),k()}function G(t){if(!e.file)return;const n=Math.floor(t/e.bytesPerRow);if(n<e.windowStartRow||n>=e.windowStartRow+e.windowRowCount){e.windowStartRow=b(n-Math.floor(e.windowRowCount/2),0,Math.max(0,e.totalRows-e.windowRowCount)),s.viewport.scrollTop=(n-e.windowStartRow)*x,s.spacer.style.height=`${Math.max(1,e.windowRowCount)*x}px`,M();return}const o=(n-e.windowStartRow)*x,i=o+x;o<s.viewport.scrollTop?s.viewport.scrollTop=o:i>s.viewport.scrollTop+s.viewport.clientHeight&&(s.viewport.scrollTop=i-s.viewport.clientHeight)}function _e(t){const n=Number(t.target.value);if(!Number.isFinite(n)||n<=0||!e.file)return;const o=e.selectionFocus??0;e.bytesPerRow=n,e.totalRows=Math.max(1,Math.ceil(e.file.size/e.bytesPerRow)),e.windowRowCount=Math.min(e.totalRows,ie),e.windowStartRow=b(Math.floor(o/e.bytesPerRow)-Math.floor(e.windowRowCount/2),0,Math.max(0,e.totalRows-e.windowRowCount)),e.offsetWidth=oe(e.file.size),s.totalRows.textContent=e.totalRows.toLocaleString(),s.spacer.style.height=`${Math.max(1,e.windowRowCount)*x}px`,G(o),R(),k()}function Ke(t){if(t.key!=="Enter")return;t.preventDefault();const n=me(t.target.value);if(!Number.isFinite(n)||n<0||n>=e.file.size){f("Jump target is outside the loaded file.","danger");return}$(n,!1),f(`Jumped to 0x${v(n,e.offsetWidth)}.`)}async function R(){const t=D(e.selectionAnchor,e.selectionFocus);if(!t||!e.file){s.selectionOffset.textContent="-",s.selectionLength.textContent="0",s.selectionHex.textContent="-",s.selectionAscii.textContent="-",s.selectionDec.textContent="-",s.selectionBin.textContent="-",s.selectionU16le.textContent="-",s.selectionU16be.textContent="-";return}const n=++j,o=Math.min(Math.max(t.length,2),64),i=await Z(t.start,Math.min(e.file.size,t.start+o));if(n!==j)return;const r=i[0],l=i.length>=2?i[0]|i[1]<<8:null,h=i.length>=2?i[0]<<8|i[1]:null;s.selectionOffset.textContent=`0x${v(t.start,e.offsetWidth)}`,s.selectionLength.textContent=t.length.toLocaleString(),s.selectionHex.textContent=Array.from(i.slice(0,Math.min(i.length,16))).map(S).join(" ")||"-",s.selectionAscii.textContent=Array.from(i.slice(0,Math.min(i.length,24))).map(se).join("")||"-",s.selectionDec.textContent=Number.isInteger(r)?String(r):"-",s.selectionBin.textContent=Number.isInteger(r)?r.toString(2).padStart(8,"0"):"-",s.selectionU16le.textContent=Number.isInteger(l)?String(l):"-",s.selectionU16be.textContent=Number.isInteger(h)?String(h):"-"}function je(){if(!Number.isInteger(e.selectionFocus)){f("Select a byte before adding a bookmark.","danger");return}e.bookmarks.includes(e.selectionFocus)||(e.bookmarks=[...e.bookmarks,e.selectionFocus].sort((t,n)=>t-n),W()),f(`Bookmarked 0x${v(e.selectionFocus,e.offsetWidth)}.`)}function Qe(){e.bookmarks=[],W(),f("Bookmarks cleared.")}function Ze(t){const n=t.target.closest("[data-bookmark-offset]");n&&$(Number(n.dataset.bookmarkOffset),!1)}function Ge(t){const n=t.target.closest("[data-patch-offset]");n&&$(Number(n.dataset.patchOffset),!1)}function W(){if(s.bookmarks){if(!e.bookmarks.length){s.bookmarks.innerHTML='<div class="hex-empty-list">No bookmarks yet.</div>';return}s.bookmarks.innerHTML=e.bookmarks.map(t=>`
      <button type="button" class="hex-list-row" data-bookmark-offset="${t}">
        <span>0x${v(t,e.offsetWidth)}</span>
        <strong>${t.toLocaleString()}</strong>
      </button>
    `).join("")}}function F(){if(!s.patches)return;const t=Q(e.patches);if(!t.length){s.patches.innerHTML='<div class="hex-empty-list">No changes yet.</div>';return}s.patches.innerHTML=t.slice(0,64).map(n=>`
      <button type="button" class="hex-list-row" data-patch-offset="${n.offset}">
        <span>0x${v(n.offset,e.offsetWidth)}</span>
        <strong>${S(n.original)} → ${S(n.value)}</strong>
      </button>
    `).join("")}async function ee(t){const n=D(e.selectionAnchor,e.selectionFocus);if(!n){f("Select a byte range first.","danger");return}const o=await Z(n.start,n.end+1),i=t==="hex"?Array.from(o).map(S).join(" "):ze.decode(o);await ve(i,t==="hex"?"Selection copied as hex.":"Selection copied as text.")}function Je(){const t=D(e.selectionAnchor,e.selectionFocus);if(!t){f("Select a range to revert.","danger");return}let n=0;for(let o=t.start;o<=t.end;o+=1)e.patches.delete(o)&&(n+=1);F(),M(),R(),k(),f(n?`Reverted ${n} byte${n===1?"":"s"} in the selection.`:"The selection had no pending changes.")}function Ve(){const t=e.patches.size;e.patches.clear(),F(),M(),R(),k(),f(t?`Reverted ${t} byte${t===1?"":"s"}.`:"No changes to revert.")}async function Ye(){if(!e.patches.size||!e.file){f("There are no changes to export.","danger");return}const t=Q(e.patches).map(n=>({offset:n.offset,offsetHex:`0x${v(n.offset,e.offsetWidth)}`,original:S(n.original),value:S(n.value)}));ne(JSON.stringify({fileName:e.file.name,fileSize:e.file.size,bytesPerRow:e.bytesPerRow,changes:t},null,2),`${e.file.name}.patches.json`,"application/json"),f("Patch set exported.")}async function Xe(){if(!e.file)return;if(!e.patches.size){f("Nothing changed. Export skipped.","danger");return}const t=[],n=Q(e.patches);let o=0;for(const i of n)i.offset>o&&t.push(e.file.slice(o,i.offset)),t.push(new Uint8Array([i.value])),o=i.offset+1;o<e.file.size&&t.push(e.file.slice(o)),ne(new Blob(t,{type:e.file.type||"application/octet-stream"}),`patched_${e.file.name}`,e.file.type||"application/octet-stream"),f("Patched file exported.")}async function te(){if(!e.file||!e.reader)return;N();const t=Me({mode:e.search.mode,query:e.search.query,caseSensitive:e.search.caseSensitive});if(!(t!=null&&t.length)){s.searchStatus.textContent=e.search.mode==="hex"?"Hex search needs complete byte pairs.":"Enter a search term first.";return}const n=++B;e.search.active=!0;const o=b(Number.isInteger(e.search.cursor)?e.search.cursor:Number.isInteger(e.selectionFocus)?e.selectionFocus:0,0,Math.max(0,e.file.size-1)),i=Le({fileSize:e.file.size,startOffset:o,chunkSize:re,needleLength:t.length});let r=0;s.searchStatus.textContent="Searching...",f("Search is scanning the file in streaming chunks.");for(let l=0;l<i.length;l+=1){if(n!==B||!e.search.active)return;const h=i[l],c=await e.reader.readRange(h.start,h.end);if(n!==B||!e.search.active)return;const p=qe(c,e.search.mode,e.search.caseSensitive),g=$e(p,t);if(r+=h.end-h.start,s.searchStatus.textContent=`Page ${l+1} / ${i.length} · ${H(r)} scanned`,g!==-1){const u=h.start+g;e.search.active=!1,e.search.lastMatch={start:u,length:t.length},e.search.cursor=(u+1)%Math.max(1,e.file.size),e.selectionAnchor=u,e.selectionFocus=Math.min(e.file.size-1,u+t.length-1),G(u),s.searchStatus.textContent=`Found at 0x${v(u,e.offsetWidth)} after ${l+1} page${l===0?"":"s"}.`,f(`Match found at 0x${v(u,e.offsetWidth)}.`),R(),k();return}(l+1)%4===0&&await new Promise(u=>requestAnimationFrame(u))}e.search.active=!1,s.searchStatus.textContent="No further matches.",f("Search reached the end of the wrapped scan with no match.","danger")}function ot(){m(!1),E("Search cancelled."),e!=null&&e.reader&&e.reader.dispose();for(const t of z)t();z=[],s={},a&&a.remove(),a=null}export{nt as mount,ot as unmount};

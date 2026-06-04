import{g as E}from"./pool-B2l5l6Kc.js";import{c as B,s as q}from"./ui-utils-CG6aKAAj.js";import{s as K}from"./drag-drop-ekerx5Fy.js";let e=null,a=null;async function P(s){e=document.createElement("div"),e.className="tool-hash",e.innerHTML=`
    <div class="card rj-layout">
      <div id="hash-drop-zone" class="hash-drop-zone">
        <div id="drop-zone-content">
          <div class="hash-drop-title">Drop large file to hash</div>
          <div class="hash-drop-subtitle">Chunked processing supported</div>
        </div>
        <div id="file-info" class="hidden hash-file-info">
          <div id="active-file-name" class="hash-file-name"></div>
          <div id="active-file-size" class="hash-file-size"></div>
          <button id="btn-clear-file" class="btn-secondary hash-clear-file">Clear File</button>
        </div>
        <input type="file" id="file-input" class="hidden">
      </div>

      <div class="form-group" id="text-input-group">
        <label>Text Content</label>
        <textarea id="hash-input" class="hash-input" placeholder="Type or paste content for instant hashing..."></textarea>
      </div>

      <div class="settings-grid">
        <div class="form-group">
          <label>Algorithm Family</label>
          <select id="hash-algo">
            <optgroup label="SHA-2">
              <option value="SHA-256" selected>SHA-256</option>
              <option value="SHA-512">SHA-512</option>
              <option value="SHA-384">SHA-384</option>
              <option value="SHA-224">SHA-224</option>
            </optgroup>
            <optgroup label="SHA-3 / Keccak">
              <option value="SHA3-256">SHA3-256</option>
              <option value="SHA3-512">SHA3-512</option>
              <option value="KECCAK-256">Keccak-256 (Ethereum)</option>
              <option value="KECCAK-512">Keccak-512</option>
            </optgroup>
            <optgroup label="BLAKE">
              <option value="BLAKE3">BLAKE3 (Fastest)</option>
              <option value="BLAKE2B">BLAKE2b</option>
              <option value="BLAKE2S">BLAKE2s</option>
            </optgroup>
            <optgroup label="Legacy / Specialized">
              <option value="MD5">MD5</option>
              <option value="SHA-1">SHA-1</option>
              <option value="RIPEMD160">RIPEMD-160</option>
            </optgroup>
          </select>
        </div>
        <div class="form-group">
          <label>Output Encoding</label>
          <select id="hash-encoding">
            <option value="hex">Hexadecimal (Lowercase)</option>
            <option value="HEX">Hexadecimal (Uppercase)</option>
            <option value="base64">Base64</option>
          </select>
        </div>
      </div>

      <div class="studio-section">
        <div class="studio-section-header">
          <span class="studio-section-title">HMAC & Authentication</span>
          <span class="section-toggle-icon">▼</span>
        </div>
        <div class="studio-section-content">
          <div class="form-group">
            <label>HMAC Secret Key</label>
            <input type="password" id="hmac-key" placeholder="Enter key to enable HMAC mode...">
            <div class="hash-hint">If a key is provided, the tool switches to Hash-based Message Authentication Code mode.</div>
          </div>
        </div>
      </div>

      <button id="btn-hash-run" class="hash-run-button">Compute Hash</button>

      <div class="form-group hash-result-group">
        <label>Message Digest</label>
        <div id="hash-result" class="hash-result">--</div>
      </div>

      <div id="hash-progress-container" class="hidden hash-progress">
        <div class="hash-progress-row">
          <span>Processing data...</span>
          <span id="hash-progress-text">0%</span>
        </div>
        <div class="hash-progress-track">
          <div id="hash-progress-bar" class="hash-progress-bar"></div>
        </div>
      </div>

      <div class="hash-action-row">
        <button id="btn-copy-hash" class="btn-secondary hash-action">Copy Digest</button>
        <button id="btn-compare-hash" class="btn-secondary hash-action">Verify/Compare</button>
      </div>

      <div class="form-group">
        <label>Comparison Digest</label>
        <input type="text" id="hash-compare-input" placeholder="Paste a digest to compare against the current result...">
        <div id="hash-compare-status" class="hash-compare-status" data-tone="neutral"></div>
      </div>
    </div>
  `,s.appendChild(e),D()}function D(){const s=e.querySelector("#hash-input"),n=e.querySelector("#file-input"),l=e.querySelector("#hash-drop-zone"),v=e.querySelector("#hash-algo"),g=e.querySelector("#hmac-key"),i=e.querySelector("#hash-encoding"),o=e.querySelector("#hash-result"),f=e.querySelector("#btn-hash-run"),S=e.querySelector("#file-info"),C=e.querySelector("#drop-zone-content"),k=e.querySelector("#active-file-name"),w=e.querySelector("#active-file-size"),u=e.querySelector("#hash-progress-container"),x=e.querySelector("#hash-progress-bar"),A=e.querySelector("#hash-progress-text"),M=e.querySelector("#hash-compare-input"),r=e.querySelector("#hash-compare-status");e.querySelector(".studio-section-header").onclick=t=>{t.currentTarget.parentElement.classList.toggle("expanded")};const L=t=>{t.length&&(a=t[0],k.textContent=a.name,w.textContent=z(a.size),S.classList.remove("hidden"),C.classList.add("hidden"),e.querySelector("#text-input-group").classList.add("hidden"),o.textContent="--",u.classList.add("hidden"))};l.onclick=()=>n.click(),n.onchange=t=>L(t.target.files),K(l,L),e.querySelector("#btn-clear-file").onclick=t=>{t.stopPropagation(),a=null,S.classList.add("hidden"),C.classList.remove("hidden"),e.querySelector("#text-input-group").classList.remove("hidden"),n.value="",o.textContent="--",u.classList.add("hidden")};const H=async()=>{f.disabled=!0,o.textContent="INITIALIZING...",o.classList.add("is-pending"),o.classList.remove("is-error");try{const t=v.value,m=g.value,y=i.value.toLowerCase();let h={algorithm:t,key:m||null,encoding:y};if(a){u.classList.remove("hidden"),x.style.width="0%",A.textContent="0%",h.file=a;const{result:c,error:d}=await E.run("hash",h,[],{onEvent(b){b.type==="progress"&&(x.style.width=`${b.payload.percent}%`,A.textContent=`${Math.round(b.payload.percent)}%`)}});if(d)throw new Error(d);let p=c;i.value==="HEX"&&(p=c.toUpperCase()),o.textContent=p}else{h.buffer=new TextEncoder().encode(s.value).buffer;const{result:c,error:d}=await E.run("hash",h);if(d)throw new Error(d);let p=c;i.value==="HEX"&&(p=c.toUpperCase()),o.textContent=p}o.classList.remove("is-pending")}catch(t){o.textContent="CRYPTO_ERROR: "+t.message,o.classList.remove("is-pending"),o.classList.add("is-error")}finally{f.disabled=!1,setTimeout(()=>u.classList.add("hidden"),1e3)}};f.onclick=H,e.querySelector("#btn-copy-hash").onclick=()=>{o.textContent!=="--"&&B(o.textContent)},e.querySelector("#btn-compare-hash").onclick=()=>{const t=M.value.trim();if(!t){r.textContent="Paste a digest before running comparison.",r.dataset.tone="neutral";return}const m=o.textContent.trim().toLowerCase(),y=t.trim().toLowerCase();m===y?(r.textContent="Match: the digests are identical.",r.dataset.tone="success",q("Digest match confirmed.","success")):(r.textContent="Mismatch: the digests differ.",r.dataset.tone="danger",q("Digest mismatch detected.","danger"))},s.oninput=()=>{!a&&s.value.length<5e3&&H()}}function z(s,n=2){if(s===0)return"0 Bytes";const l=1024,v=n<0?0:n,g=["Bytes","KB","MB","GB","TB"],i=Math.floor(Math.log(s)/Math.log(l));return parseFloat((s/Math.pow(l,i)).toFixed(v))+" "+g[i]}function F(){e&&e.remove()}export{P as mount,F as unmount};

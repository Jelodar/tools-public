let s=null;async function y(p){s=document.createElement("div"),s.className="tool-password-gen",s.innerHTML=`
    <div class="card password-card">
      <div class="settings-grid password-settings">
        <div class="form-group">
          <label>Password Length</label>
          <input type="number" id="pass-length" value="16" min="4" max="128">
        </div>
        <div class="form-group password-options">
          <div class="password-option-row">
            <label class="rj-switch">
              <input type="checkbox" id="pass-upper" checked>
              <span class="slider-switch"></span>
            </label>
            <label for="pass-upper" class="password-option-label">Uppercase (A-Z)</label>
          </div>
          <div class="password-option-row">
            <label class="rj-switch">
              <input type="checkbox" id="pass-lower" checked>
              <span class="slider-switch"></span>
            </label>
            <label for="pass-lower" class="password-option-label">Lowercase (a-z)</label>
          </div>
          <div class="password-option-row">
            <label class="rj-switch">
              <input type="checkbox" id="pass-numbers" checked>
              <span class="slider-switch"></span>
            </label>
            <label for="pass-numbers" class="password-option-label">Numbers (0-9)</label>
          </div>
          <div class="password-option-row">
            <label class="rj-switch">
              <input type="checkbox" id="pass-symbols" checked>
              <span class="slider-switch"></span>
            </label>
            <label for="pass-symbols" class="password-option-label">Symbols (!@#$%^&*)</label>
          </div>
        </div>
      </div>

      <button id="btn-gen-pass" class="password-generate-button">Generate Password</button>

      <div class="result-section">
        <div id="pass-output" class="password-output">--</div>
        <button id="btn-copy-pass" class="password-copy-button">Copy to Clipboard</button>
      </div>
    </div>
  `,p.appendChild(s);const i=s.querySelector("#pass-length"),d=s.querySelector("#pass-upper"),b=s.querySelector("#pass-lower"),u=s.querySelector("#pass-numbers"),w=s.querySelector("#pass-symbols"),a=s.querySelector("#pass-output"),h=s.querySelector("#btn-gen-pass"),l=()=>{const n=parseInt(i.value),t={upper:"ABCDEFGHIJKLMNOPQRSTUVWXYZ",lower:"abcdefghijklmnopqrstuvwxyz",numbers:"0123456789",symbols:"!@#$%^&*()_+-=[]{}|;:,.<>?"};let e="";if(d.checked&&(e+=t.upper),b.checked&&(e+=t.lower),u.checked&&(e+=t.numbers),w.checked&&(e+=t.symbols),!e){a.textContent="Select at least one option";return}let r="";const c=new Uint32Array(n);window.crypto.getRandomValues(c);for(let o=0;o<n;o++)r+=e.charAt(c[o]%e.length);a.textContent=r};h.addEventListener("click",l),s.querySelector("#btn-copy-pass").addEventListener("click",()=>{navigator.clipboard.writeText(a.textContent)}),l()}function v(){s&&(s.remove(),s=null)}export{y as mount,v as unmount};

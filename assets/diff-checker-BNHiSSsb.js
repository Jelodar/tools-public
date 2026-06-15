import{g as f,c as v}from"./ui-monaco-DnB_Gdp7.js";import"./index-notwamio.js";let e=null,t=null,g=null;function m(o){return String(o??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}async function S(o){e=document.createElement("div"),e.className="tool-diff-checker",e.innerHTML=`
    <div class="card">
      <div class="settings-grid">
        <div class="form-group">
          <label>Compare Mode</label>
          <select id="diff-mode">
            <option value="side-by-side">Side by Side</option>
            <option value="inline">Inline</option>
          </select>
        </div>
        <div class="form-group">
          <label>Language</label>
          <select id="diff-lang">
            <option value="plaintext">Plain Text</option>
            <option value="javascript">JavaScript</option>
            <option value="json">JSON</option>
            <option value="css">CSS</option>
            <option value="html">HTML</option>
          </select>
        </div>
        <div class="form-group tool-inline-control-group">
          <div class="tool-inline-control">
            <label class="rj-switch">
              <input type="checkbox" id="diff-whitespace" checked>
              <span class="slider-switch"></span>
            </label>
            <label for="diff-whitespace" class="tool-inline-label">Trim Whitespace</label>
          </div>
        </div>
      </div>

      <div class="form-group tool-section-gap">
        <label>Comparison View</label>
        <div id="monaco-diff-editor" class="tool-editor-host-large"></div>
      </div>

      <div class="tool-action-row">
        <button id="btn-clear-left" class="btn-secondary tool-grow-1">Clear Original</button>
        <button id="btn-clear-right" class="btn-secondary tool-grow-1">Clear Modified</button>
      </div>
    </div>
  `,o.appendChild(e);const s=e.querySelector("#monaco-diff-editor"),l=e.querySelector("#diff-lang"),n=e.querySelector("#diff-mode"),c=e.querySelector("#diff-whitespace"),p=f();n.value=p.renderSideBySide?"side-by-side":"inline";try{const{diffEditor:a,monaco:i}=await v(s,{...p,originalEditable:!0,readOnly:!1,ignoreTrimWhitespace:!0});t=a,g=i;const d=i.editor.createModel("","plaintext"),r=i.editor.createModel("","plaintext");t.setModel({original:d,modified:r});const u=()=>{t.updateOptions({renderSideBySide:n.value==="side-by-side",ignoreTrimWhitespace:c.checked})};l.addEventListener("change",()=>{i.editor.setModelLanguage(d,l.value),i.editor.setModelLanguage(r,l.value)}),n.addEventListener("change",u),c.addEventListener("change",u),e.querySelector("#btn-clear-left").addEventListener("click",()=>d.setValue("")),e.querySelector("#btn-clear-right").addEventListener("click",()=>r.setValue(""))}catch(a){s.innerHTML=`<div class="error-state">Failed to load: ${m(a.message)}</div>`}}function y(){t&&t.dispose(),e&&e.remove()}export{S as mount,y as unmount};
